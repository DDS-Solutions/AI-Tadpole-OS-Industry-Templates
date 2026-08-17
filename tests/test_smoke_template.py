"""End-to-end simulated lifecycle and contract smoke tests for AI-Tadpole-OS."""

from __future__ import annotations

import json
import shutil
import sys
import tempfile
import unittest
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT / "scripts"))

from validate_template import (
    load_json,
    validate_agent_payload,
    validate_knowledge_payload,
    validate_mcp_payload,
    validate_workflow_content,
    validate_template,
    ValidationReport,
)


class SmokeTemplateLifecycleTests(unittest.TestCase):
    def setUp(self) -> None:
        self.smoke_root = ROOT / "testing" / "smoke-test"

    def test_smoke_template_passes_full_validation(self) -> None:
        self.assertTrue(self.smoke_root.is_dir())
        swarm = load_json(self.smoke_root / "swarm.json")
        report = ValidationReport()
        validate_template(ROOT, {"path": "testing/smoke-test", "id": "smoke-test"}, report)
        self.assertEqual([], report.errors)
        self.assertEqual([], report.warnings)

    def test_smoke_agents_are_idle_and_oversight_controlled(self) -> None:
        reader = load_json(self.smoke_root / "agents" / "reader.json")
        operator = load_json(self.smoke_root / "agents" / "operator.json")

        self.assertEqual("idle", reader["status"])
        self.assertEqual("idle", operator["status"])

        self.assertFalse(reader["requires_oversight"])
        self.assertTrue(operator["requires_oversight"])

        self.assertIn("read_file", reader["skills"])
        self.assertNotIn("execute_shell", reader["skills"])

        self.assertIn("execute_shell", operator["skills"])
        self.assertIn("shell", operator["skills"])
        self.assertEqual(["smoke:healthcheck"], operator["mcp_tools"])

    def test_smoke_workflows_and_knowledge_payloads_are_executable(self) -> None:
        workflow_text = (self.smoke_root / "workflows" / "smoke_sop.md").read_text(encoding="utf-8")
        self.assertEqual([], validate_workflow_content(workflow_text))

        playbook_text = (self.smoke_root / "knowledge" / "smoke_playbook.md").read_text(encoding="utf-8")
        self.assertIn("---", playbook_text)
        self.assertIn("title: ", playbook_text)

        knowledge_json = load_json(self.smoke_root / "knowledge.json")
        self.assertEqual([], validate_knowledge_payload(knowledge_json))

    def test_simulated_installation_and_connector_isolation(self) -> None:
        with tempfile.TemporaryDirectory() as tmpdir:
            install_root = Path(tmpdir) / "installed_swarm"
            install_root.mkdir()

            # 1. Copy template assets
            shutil.copytree(self.smoke_root, install_root, dirs_exist_ok=True)

            # 2. Simulate installer moving skills/ to execution/
            skills_dir = install_root / "skills"
            execution_dir = install_root / "execution"
            self.assertTrue(skills_dir.is_dir())
            shutil.copytree(skills_dir, execution_dir)

            server_script = execution_dir / "smoke_server.py"
            self.assertTrue(server_script.is_file())
            self.assertIn("def handle_request", server_script.read_text(encoding="utf-8"))

            # 3. Verify manifest references
            swarm = load_json(install_root / "swarm.json")
            for ref in swarm["roster"]:
                agent_path = install_root / ref["path"]
                self.assertTrue(agent_path.is_file())
                agent_data = load_json(agent_path)
                self.assertEqual([], validate_agent_payload(agent_data))


if __name__ == "__main__":
    unittest.main()
