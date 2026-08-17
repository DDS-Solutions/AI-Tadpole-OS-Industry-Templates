import sys
import unittest
from pathlib import Path


ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT / "scripts"))

from migrate_consumer_contract import migrated_agent, migrated_mcp_config, migrated_workflow
from validate_template import (
    validate_agent_payload,
    validate_knowledge_payload,
    validate_mcp_payload,
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
            "status": "ready",
            "model_config": {
                "provider": "google",
                "model_id": "gemini-pro-latest",
                "system_prompt": "Review carefully.",
            },
            "skills": ["read_file"],
            "workflows": ["review"],
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

    def test_knowledge_requires_text_and_topic(self):
        self.assertEqual([], validate_knowledge_payload([{"text": "Body", "topic": "legal"}]))
        self.assertNotEqual([], validate_knowledge_payload([{"topic": "legal"}]))


if __name__ == "__main__":
    unittest.main()
