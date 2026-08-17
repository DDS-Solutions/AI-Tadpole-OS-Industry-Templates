import sys
import unittest
from pathlib import Path


ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT / "scripts"))

from migrate_consumer_contract import (
    migrated_agent,
    migrated_mcp_config,
    migrated_skills,
    migrated_workflow,
)
from validate_template import (
    TEMPLATE_FILE_SUFFIXES,
    TEMPLATE_SKILL_FILE_SUFFIXES,
    detect_embedded_secrets,
    validate_agent_payload,
    validate_knowledge_payload,
    validate_mcp_payload,
    validate_package_file,
    validate_workflow_content,
)


class ConsumerContractTests(unittest.TestCase):
    def valid_agent(self):
        return {
            "id": "agent-one",
            "name": "Agent One",
            "role": "Reviewer",
            "department": "Quality",
            "description": "Reviews artifacts.",
            "status": "idle",
            "model_config": {
                "provider": "google",
                "model_id": "gemini-pro-latest",
                "system_prompt": "Review carefully.",
            },
            "skills": ["read_file"],
            "workflows": ["review"],
            "mcp_tools": [],
            "requires_oversight": False,
        }

    def test_agent_requires_consumer_wire_fields(self):
        agent = self.valid_agent()
        del agent["status"]
        del agent["model_config"]["provider"]
        errors = validate_agent_payload(agent)
        self.assertIn("status must be a non-empty string", errors)
        self.assertIn("model_config.provider must be a non-empty string", errors)

    def test_agent_migration_is_additive_and_idempotent(self):
        source = self.valid_agent()
        source.pop("status")
        source["model_config"].pop("provider")
        source["model_config"].pop("model_id")
        source["custom_extension"] = {"preserved": True}
        once = migrated_agent(source, "gemini-pro-latest")
        twice = migrated_agent(once, "gemini-pro-latest")
        self.assertEqual(once, twice)
        self.assertTrue(once["custom_extension"]["preserved"])
        self.assertEqual([], validate_agent_payload(once))

    def test_agent_migrates_native_status_skills_and_oversight(self):
        source = self.valid_agent()
        source["status"] = "ready"
        source["skills"] = ["read_file", "run_command", "write_to_file"]
        source.pop("mcp_tools")
        source.pop("requires_oversight")
        migrated = migrated_agent(source, "gemini-pro-latest")
        self.assertEqual("idle", migrated["status"])
        self.assertEqual(
            ["read_file", "execute_shell", "shell", "write_file"],
            migrated["skills"],
        )
        self.assertEqual([], migrated["mcp_tools"])
        self.assertTrue(migrated["requires_oversight"])
        self.assertEqual([], validate_agent_payload(migrated))
        self.assertEqual(migrated["skills"], migrated_skills(migrated["skills"]))

    def test_agent_rejects_legacy_or_unprotected_dangerous_capabilities(self):
        agent = self.valid_agent()
        agent["skills"] = ["run_command", "execute_shell"]
        errors = validate_agent_payload(agent)
        self.assertTrue(any("legacy Tadpole capability" in error for error in errors))
        self.assertTrue(any("capability marker" in error for error in errors))
        self.assertTrue(any("require oversight" in error for error in errors))

    def test_workflow_accepts_consumer_h2_or_h3_boundaries(self):
        self.assertEqual([], validate_workflow_content("# Review\n\n### Inspect\nDo it."))
        self.assertNotEqual([], validate_workflow_content("# Review\n\nDo it."))

    def test_workflow_migration_preserves_numbered_instructions(self):
        source = "# Workflow: Review\n\n1. Inspect the input.\n2. Report findings.\n"
        migrated = migrated_workflow(source)
        self.assertIn("## Step 1\n\nInspect the input.", migrated)
        self.assertIn("## Step 2\n\nReport findings.", migrated)
        self.assertEqual(migrated, migrated_workflow(migrated))

    def test_mcp_contract_requires_root_map(self):
        self.assertNotEqual([], validate_mcp_payload({}))
        migrated = migrated_mcp_config({})
        self.assertEqual({"mcpServers": {}}, migrated)
        self.assertEqual([], validate_mcp_payload(migrated))

    def test_mcp_security_contract_rejects_commands_inline_code_and_credentials(self):
        config = {
            "mcpServers": {
                "unsafe": {
                    "command": "powershell",
                    "args": ["-c", "download; execute"],
                    "env": {"API_TOKEN": "actual-production-token"},
                }
            }
        }
        errors = validate_mcp_payload(config)
        self.assertTrue(any("approved executable" in error for error in errors))
        self.assertTrue(any("shell control syntax" in error for error in errors))
        self.assertTrue(any("local-configuration placeholder" in error for error in errors))

        safe = {
            "mcpServers": {
                "reviewed": {
                    "command": "python",
                    "args": ["server.py"],
                    "env": {"API_TOKEN": "CONFIGURE_LOCALLY"},
                }
            }
        }
        self.assertEqual([], validate_mcp_payload(safe))

    def test_package_security_contract_rejects_binary_types_and_embedded_secrets(self):
        errors = validate_package_file(
            "payload.exe", ".exe", 9, b"MZ\x00payload", TEMPLATE_FILE_SUFFIXES
        )
        errors += validate_package_file(
            "notes.md",
            ".md",
            47,
            ("token: ghp_" + ("a" * 36)).encode(),
            TEMPLATE_FILE_SUFFIXES,
        )
        self.assertTrue(any("prohibited file type" in error for error in errors))
        self.assertTrue(any("likely GitHub token" in error for error in errors))

    def test_template_package_allows_reviewable_source_only_under_skills(self):
        self.assertEqual(
            [],
            validate_package_file(
                "skills/connector.py",
                ".py",
                12,
                b"print('ok')",
                TEMPLATE_SKILL_FILE_SUFFIXES,
            ),
        )
        self.assertNotEqual(
            [],
            validate_package_file(
                "connector.py",
                ".py",
                12,
                b"print('ok')",
                TEMPLATE_FILE_SUFFIXES,
            ),
        )

    def test_secret_detection_does_not_return_secret_material(self):
        findings = detect_embedded_secrets("-----BEGIN PRIVATE KEY-----\nsensitive\n")
        self.assertEqual(["private key"], findings)

    def test_knowledge_requires_text_and_topic(self):
        self.assertEqual([], validate_knowledge_payload([{"text": "Body", "topic": "legal"}]))
        self.assertNotEqual([], validate_knowledge_payload([{"topic": "legal"}]))


if __name__ == "__main__":
    unittest.main()
