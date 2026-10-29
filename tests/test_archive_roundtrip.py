"""End-to-end archive round-trip test for web-builder export and consumer ingestion.

Verifies that zip archives produced by web-builder adhere 100% to the consumer
quarantine scan, package tree isolation, and single-template validation contracts.
"""

from __future__ import annotations

import io
import json
import tempfile
import unittest
import zipfile
from pathlib import Path

from scripts.validate_template import (
    TEMPLATE_FILE_SUFFIXES,
    ValidationReport,
    compute_template_digest,
    validate_package_tree,
    validate_template,
)


class ArchiveRoundtripTests(unittest.TestCase):
    def test_valid_builder_archive_passes_quarantine_and_validation(self):
        """A complete web-builder export archive unzips and passes quarantine and single-template validation."""
        swarm_json = {
            "id": "apex-logistics",
            "name": "Apex Logistics Swarm",
            "version": "1.0.0",
            "description": "Autonomous freight routing and dispatch coordination.",
            "industry": "transportation",
            "company_size": 25,
            "defaults": {"model": "gemma4:31b"},
            "roster": [
                {
                    "id": "lead-dispatcher",
                    "path": "agents/lead-dispatcher.json",
                    "role": "Lead Dispatcher",
                }
            ],
            "global_workflows": ["workflows/freight-triage.md"],
            "required_mcps": "mcps.json",
            "connector_ids": ["logistics-hub"],
        }

        agent_json = {
            "id": "lead-dispatcher",
            "name": "Lead Dispatcher",
            "role": "Lead Dispatcher",
            "department": "Operations",
            "description": "Coordinates freight loads and carrier dispatches.",
            "status": "idle",
            "model_config": {
                "provider": "google",
                "model_id": "gemma4:31b",
                "system_prompt": "Manage freight tenders and carrier coordination within regulatory limits.",
            },
            "skills": ["read_file", "search_web"],
            "workflows": ["freight-triage"],
            "mcp_tools": ["logistics-hub:query_routes"],
            "requires_oversight": False,
        }

        workflow_md = "# Workflow: Freight Triage\n\n## Step 1: Intake\nProcess carrier availability."

        mcps_json = {
            "mcpServers": {
                "logistics-hub": {
                    "url": "https://api.logistics.internal/mcp",
                    "headers": {
                        "Authorization": "${LOGISTICS_API_KEY}",
                    },
                    "protocol_version": "2026-07-28",
                }
            }
        }

        connector_lock_json = {
            "version": "1.0.0",
            "generated_at": "2026-10-29T14:00:00Z",
            "connectors": [
                {
                    "id": "logistics-hub",
                    "name": "Logistics Hub",
                    "version": "1.0.0",
                    "integrity_hash": None,
                    "dependency_provenance": [],
                }
            ],
        }

        buf = io.BytesIO()
        with zipfile.ZipFile(buf, "w", compression=zipfile.ZIP_DEFLATED) as zf:
            zf.writestr("swarm.json", json.dumps(swarm_json, indent=2))
            zf.writestr("agents/lead-dispatcher.json", json.dumps(agent_json, indent=2))
            zf.writestr("workflows/freight-triage.md", workflow_md)
            zf.writestr("mcps.json", json.dumps(mcps_json, indent=2))
            zf.writestr("connector-lock.json", json.dumps(connector_lock_json, indent=2))

        zip_bytes = buf.getvalue()

        with tempfile.TemporaryDirectory() as tmpdir:
            tmproot = Path(tmpdir)
            quarantine_dir = tmproot / "quarantine" / "apex-logistics"
            quarantine_dir.mkdir(parents=True)

            with zipfile.ZipFile(io.BytesIO(zip_bytes)) as zf:
                zf.extractall(quarantine_dir)

            # Gate 1: Consumer Quarantine Package Tree Scan
            tree_errors = validate_package_tree(quarantine_dir, TEMPLATE_FILE_SUFFIXES, executable_subdir="skills")
            self.assertEqual([], tree_errors, f"Quarantine tree errors: {tree_errors}")

            # Gate 2: Full Template Validation Pipeline
            content_digest = compute_template_digest(quarantine_dir)
            report = ValidationReport()
            validate_template(
                tmproot / "quarantine",
                {
                    "id": "apex-logistics",
                    "path": "apex-logistics",
                    "content_sha256": content_digest,
                },
                report,
            )
            self.assertEqual([], report.errors, f"Validation errors: {report.errors}")
            self.assertEqual([], report.warnings, f"Validation warnings: {report.warnings}")

    def test_adversarial_archive_contents_are_strictly_rejected(self):
        """Archives containing security violations fail package tree or template validation."""
        with tempfile.TemporaryDirectory() as tmpdir:
            tmproot = Path(tmpdir)
            quarantine_dir = tmproot / "bad-archive"
            quarantine_dir.mkdir(parents=True)

            # 1. Unapproved binary executable
            (quarantine_dir / "agents").mkdir()
            (quarantine_dir / "agents" / "evil.exe").write_bytes(b"\x4d\x5a\x90\x00")
            errs = validate_package_tree(quarantine_dir, TEMPLATE_FILE_SUFFIXES, executable_subdir="skills")
            self.assertTrue(any("prohibited file type (.exe)" in e for e in errs))

            # Clean up binary
            (quarantine_dir / "agents" / "evil.exe").unlink()

            # 2. File size exceeding 1 MB limit
            (quarantine_dir / "oversized.md").write_bytes(b"A" * 1_000_005)
            errs2 = validate_package_tree(quarantine_dir, TEMPLATE_FILE_SUFFIXES, executable_subdir="skills")
            self.assertTrue(any("exceeds the 1000000-byte package limit" in e for e in errs2))


if __name__ == "__main__":
    unittest.main()
