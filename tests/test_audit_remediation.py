"""Regression tests for the audit-remediation hardening of the contract gates."""

import contextlib
import io
import json
import re
import sys
import tempfile
import unittest
from pathlib import Path
from unittest import mock

ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT))

from scripts import migrate_consumer_contract as migrator  # noqa: E402
from scripts import verify_compatibility_lock as lock  # noqa: E402
from scripts.capabilities import CAPABILITIES, VALID_CAPABILITY_IDS  # noqa: E402
from scripts.validate_template import (  # noqa: E402
    ValidationReport,
    validate_agent_payload,
    validate_catalog_parity,
    validate_mcp_registry,
    validate_template,
)


def valid_agent():
    return {
        "id": "agent-one",
        "name": "Agent One",
        "role": "Reviewer",
        "department": "Quality",
        "description": "Reviews artifacts.",
        "status": "idle",
        "model_config": {
            "provider": "google",
            "model_id": "gemma4:31b",
            "system_prompt": "Review carefully.",
        },
        "skills": ["read_file"],
        "workflows": ["review"],
        "mcp_tools": [],
        "requires_oversight": False,
    }


class CapabilityAllowListTests(unittest.TestCase):
    def test_unknown_capability_ids_are_rejected(self):
        agent = valid_agent()
        agent["skills"] = ["read_file", "readfile", "web_search"]
        errors = validate_agent_payload(agent)
        self.assertTrue(
            any("unknown capability IDs" in e and "readfile" in e and "web_search" in e for e in errors),
            errors,
        )

    def test_every_canonical_capability_is_accepted(self):
        agent = valid_agent()
        agent["skills"] = sorted(VALID_CAPABILITY_IDS)
        agent["requires_oversight"] = True
        errors = validate_agent_payload(agent)
        self.assertFalse(any("unknown capability" in e for e in errors), errors)

    def test_legacy_ids_get_the_legacy_message_not_unknown(self):
        agent = valid_agent()
        agent["skills"] = ["run_command"]
        errors = validate_agent_payload(agent)
        self.assertTrue(any("legacy Tadpole capability" in e for e in errors))
        self.assertFalse(any("unknown capability" in e for e in errors))

    def test_python_catalog_matches_web_builder_catalog(self):
        source = (ROOT / "web-builder" / "src" / "constants" / "capabilities.ts").read_text(encoding="utf-8")
        ts_ids = set(re.findall(r"^\s*id:\s*'([a-z_]+)'", source, re.MULTILINE))
        ts_ids |= {"shell", "terminal"}  # runtime markers declared separately in the TS file
        self.assertEqual(ts_ids, set(VALID_CAPABILITY_IDS))

    def test_catalog_ids_are_unique(self):
        ids = [spec.id for spec in CAPABILITIES]
        self.assertEqual(len(ids), len(set(ids)))

    def test_mcp_tools_is_required(self):
        agent = valid_agent()
        del agent["mcp_tools"]
        self.assertTrue(any("mcp_tools is required" in e for e in validate_agent_payload(agent)))


class LockSelfCoverageTests(unittest.TestCase):
    REQUIRED_BASELINE = {
        "scripts/validate_template.py",
        "scripts/migrate_consumer_contract.py",
        "scripts/capabilities.py",
        "scripts/verify_compatibility_lock.py",
        "registry.json",
        "mcp_registry.json",
        "index.json",
    }

    def test_lock_covers_its_own_enforcement(self):
        missing = self.REQUIRED_BASELINE - set(lock.CRITICAL_CONTRACT_FILES)
        self.assertFalse(missing, f"lock no longer protects: {sorted(missing)}")

    def test_committed_lockfile_records_the_verifier(self):
        recorded = json.loads(lock.LOCKFILE_PATH.read_text(encoding="utf-8"))["critical_contract_files"]
        self.assertIn("scripts/verify_compatibility_lock.py", recorded)

    def test_check_and_generate_are_mutually_exclusive(self):
        with mock.patch.object(sys, "argv", ["verify", "--check", "--generate"]):
            with contextlib.redirect_stderr(io.StringIO()), self.assertRaises(SystemExit) as ctx:
                lock.main()
        self.assertNotEqual(0, ctx.exception.code)

    def test_check_never_writes_the_lockfile(self):
        with mock.patch.object(sys, "argv", ["verify", "--check"]), \
                mock.patch.object(lock, "write_lockfile") as write, \
                contextlib.redirect_stdout(io.StringIO()), contextlib.redirect_stderr(io.StringIO()):
            lock.main()
        write.assert_not_called()


class MigratorModeTests(unittest.TestCase):
    """Locks in that preview/--check never touch the tree; only --apply writes."""

    def run_main(self, argv):
        with tempfile.TemporaryDirectory(dir=ROOT) as tmp:
            target = Path(tmp) / "agent.json"
            target.write_text("ORIGINAL", encoding="utf-8")
            with mock.patch.object(migrator, "collect_changes", return_value=[(target, "MIGRATED")]), \
                    mock.patch.object(sys, "argv", ["migrate", *argv]), \
                    contextlib.redirect_stdout(io.StringIO()):
                code = migrator.main()
            return code, target.read_text(encoding="utf-8")

    def test_check_does_not_write_and_fails(self):
        code, content = self.run_main(["--check"])
        self.assertEqual((1, "ORIGINAL"), (code, content))

    def test_bare_preview_does_not_write_and_fails(self):
        code, content = self.run_main([])
        self.assertEqual((1, "ORIGINAL"), (code, content))

    def test_apply_writes_and_succeeds(self):
        code, content = self.run_main(["--apply"])
        self.assertEqual((0, "MIGRATED"), (code, content))

    def test_collect_changes_finds_nothing_on_committed_tree(self):
        self.assertEqual([], migrator.collect_changes(ROOT))

    def test_migrator_uses_canonical_dangerous_set(self):
        from_caps = {s.id for s in CAPABILITIES if s.requires_oversight}
        self.assertEqual(from_caps, set(migrator.DANGEROUS_SKILLS))


class CatalogAndConnectorParityTests(unittest.TestCase):
    def write_catalog(self, tmp, registry_entry, index_entry):
        (tmp / "registry.json").write_text(json.dumps({"templates": [registry_entry]}), encoding="utf-8")
        (tmp / "index.json").write_text(json.dumps([index_entry]), encoding="utf-8")

    def base_entry(self):
        return {
            "id": "t1", "path": "x/t1", "name": "T1", "description": "d",
            "required_skills": ["read_file"], "required_models": ["gemma4:31b"],
        }

    def test_field_drift_between_registry_and_index_is_reported(self):
        for field, drifted in (
            ("name", "Other"),
            ("description", "other"),
            ("required_skills", ["read_file", "write_file"]),
            ("required_models", ["other-model"]),
        ):
            with self.subTest(field=field), tempfile.TemporaryDirectory() as tmpdir:
                tmp = Path(tmpdir)
                index_entry = {**self.base_entry(), field: drifted}
                self.write_catalog(tmp, self.base_entry(), index_entry)
                report = ValidationReport()
                validate_catalog_parity(tmp, report)
                self.assertTrue(
                    any(f"disagree on '{field}'" in e for e in report.errors), report.errors
                )

    def test_identical_entries_have_no_parity_errors(self):
        with tempfile.TemporaryDirectory() as tmpdir:
            tmp = Path(tmpdir)
            self.write_catalog(tmp, self.base_entry(), self.base_entry())
            report = ValidationReport()
            validate_catalog_parity(tmp, report)
            self.assertFalse(any("disagree on" in e for e in report.errors), report.errors)

    def test_embedded_connector_config_must_match_disk(self):
        with tempfile.TemporaryDirectory() as tmpdir:
            tmp = Path(tmpdir)
            connector_dir = tmp / "mcp-blueprints" / "demo"
            connector_dir.mkdir(parents=True)
            disk = {"mcpServers": {"demo": {"command": "python", "args": ["server.py"]}}}
            embedded = {"mcpServers": {"demo": {"command": "python", "args": ["other.py"]}}}
            (connector_dir / "mcps.json").write_text(json.dumps(disk), encoding="utf-8")
            (tmp / "mcp_registry.json").write_text(json.dumps({
                "version": "2.0.0",
                "connectors": [{
                    "id": "demo", "path": "mcp-blueprints/demo", "status": "sample",
                    "tools": [{"id": "demo:ping", "name": "ping", "description": "p", "risk": "read"}],
                    "config": embedded,
                }],
            }), encoding="utf-8")
            report = ValidationReport()
            validate_mcp_registry(tmp, report)
            self.assertTrue(any("embedded config must exactly match" in e for e in report.errors), report.errors)

    def test_non_object_mcp_servers_reports_instead_of_crashing(self):
        with tempfile.TemporaryDirectory() as tmpdir:
            tmp = Path(tmpdir)
            (tmp / "swarm.json").write_text(json.dumps({
                "id": "s", "name": "S", "description": "d", "roster": [],
            }), encoding="utf-8")
            (tmp / "mcps.json").write_text(json.dumps({"mcpServers": []}), encoding="utf-8")
            report = ValidationReport()
            validate_template(tmp, {"id": "s", "path": "."}, report)  # must not raise TypeError
            self.assertTrue(any("mcpServers" in e for e in report.errors), report.errors)


class DocumentationConsistencyTests(unittest.TestCase):
    def test_persona_count_in_docs_matches_catalog(self):
        catalog = json.loads(
            (ROOT / "web-builder" / "public" / "ai-tadpole-catalog.json").read_text(encoding="utf-8")
        )
        expected = len(catalog)
        for doc in ("README.md", "wiki/Compatibility-Contract.md"):
            text = (ROOT / doc).read_text(encoding="utf-8")
            stated = {int(n) for n in re.findall(r"\b(\d{3})[- ]persona", text, re.IGNORECASE)}
            stated |= {int(n) for n in re.findall(r"All (\d{3}) catalog personas", text)}
            with self.subTest(doc=doc):
                self.assertTrue(stated, f"{doc} no longer states a persona count")
                self.assertEqual({expected}, stated, f"{doc} persona count drifted from the catalog")

    def test_industry_count_in_readme_matches_registry(self):
        registry = json.loads((ROOT / "registry.json").read_text(encoding="utf-8"))
        expected = len({t["industry"] for t in registry["templates"]})
        stated = {int(n) for n in re.findall(r"\*\*(\d+) industries\*\*",
                                             (ROOT / "README.md").read_text(encoding="utf-8"))}
        self.assertEqual({expected}, stated)


if __name__ == "__main__":
    unittest.main()
