"""End-to-end simulated lifecycle and contract smoke tests for AI-Tadpole-OS."""

from __future__ import annotations

import json
import shutil
import subprocess
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
        self.assertEqual(["smoke-connector:healthcheck"], operator["mcp_tools"])

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

    def test_smoke_connector_implements_runtime_json_rpc_lifecycle(self) -> None:
        server = self.smoke_root / "skills" / "smoke_server.py"
        process = subprocess.Popen(
            [sys.executable, str(server)],
            stdin=subprocess.PIPE,
            stdout=subprocess.PIPE,
            stderr=subprocess.PIPE,
            text=True,
        )
        self.assertIsNotNone(process.stdin)
        self.assertIsNotNone(process.stdout)
        try:
            requests = [
                {"jsonrpc": "2.0", "id": 1, "method": "initialize", "params": {}},
                {"jsonrpc": "2.0", "id": 2, "method": "tools/list", "params": {}},
                {
                    "jsonrpc": "2.0",
                    "id": 3,
                    "method": "tools/call",
                    "params": {"name": "healthcheck", "arguments": {}},
                },
            ]
            responses = []
            for request in requests:
                process.stdin.write(json.dumps(request) + "\n")
                process.stdin.flush()
                responses.append(json.loads(process.stdout.readline()))

            self.assertEqual("2024-11-05", responses[0]["result"]["protocolVersion"])
            self.assertEqual("healthcheck", responses[1]["result"]["tools"][0]["name"])
            self.assertEqual("smoke-test: OK", responses[2]["result"]["content"][0]["text"])
        finally:
            process.stdin.close()
            process.terminate()
            process.wait(timeout=5)
            process.stdout.close()
            if process.stderr is not None:
                process.stderr.close()


    def test_curated_connectors_tool_manifest_parity_and_declaration(self) -> None:
        registry = load_json(ROOT / "mcp_registry.json")
        self.assertEqual("2.0.0", registry.get("version"))
        connectors = registry.get("connectors", [])
        self.assertEqual(4, len(connectors))
        
        for connector in connectors:
            connector_id = connector["id"]
            tools = connector.get("tools", [])
            self.assertTrue(len(tools) > 0, f"Connector {connector_id} has no tools")
            
            # Verify server script exists and contains declared tool definitions
            server_path = ROOT / connector["path"] / "server.py"
            self.assertTrue(server_path.is_file(), f"Server script missing for {connector_id}")
            server_code = server_path.read_text(encoding="utf-8")
            
            for tool in tools:
                tool_name = tool["name"]
                self.assertIn(f"def {tool_name}", server_code, f"Tool {tool_name} not defined in {server_path}")
                self.assertTrue(tool["id"].endswith(f":{tool_name}"), f"Tool ID {tool['id']} does not match name {tool_name}")
                self.assertIn(tool["risk"], ["read", "write", "execute"])


if __name__ == "__main__":
    unittest.main()
