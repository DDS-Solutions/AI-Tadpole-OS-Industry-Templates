"""Safely align registry assets with the pinned Tadpole-OS wire contract.

The migration is additive and idempotent. It never deletes templates or agent
files. Run without ``--apply`` to preview changes; CI uses ``--check`` to ensure
the repository has no pending contract migrations.
"""

from __future__ import annotations

import argparse
import json
import re
from pathlib import Path
from typing import Any


DEFAULT_PROVIDER = "google"
DEFAULT_MODEL_ID = "gemini-pro-latest"
LEGACY_SKILL_REPLACEMENTS = {
    "write_to_file": ("write_file",),
    "run_command": ("execute_shell", "shell"),
}
DANGEROUS_SKILLS = frozenset({
    "delete_file",
    "execute_shell",
    "shell",
    "terminal",
    "write_file",
})
EXECUTABLE_HEADING = re.compile(r"^#{2,3}\s+\S", re.MULTILINE)
NUMBERED_INSTRUCTION = re.compile(r"^(\s*)(\d+)[.)]\s+(.+)$")


def migrated_agent(agent: dict[str, Any], default_model: str) -> dict[str, Any]:
    """Return a consumer-compatible copy while preserving existing fields."""
    result = dict(agent)
    if result.get("status") in (None, "", "ready"):
        result["status"] = "idle"

    result["skills"] = migrated_skills(result.get("skills", []))
    result.setdefault("workflows", [])
    result.setdefault("mcp_tools", [])
    result["requires_oversight"] = bool(
        result.get("requires_oversight")
        or DANGEROUS_SKILLS.intersection(result["skills"])
    )

    config = dict(result.get("model_config") or {})
    model_id = (
        config.get("model_id")
        or result.get("model_id")
        or result.get("model")
        or default_model
        or DEFAULT_MODEL_ID
    )
    config.setdefault("provider", DEFAULT_PROVIDER)
    config.setdefault("model_id", model_id)
    result["model_config"] = config
    return result


def migrated_skills(skills: Any) -> list[str]:
    """Replace legacy capability labels with Tadpole-OS runtime identifiers."""
    migrated: list[str] = []
    for skill in skills if isinstance(skills, list) else []:
        replacements = LEGACY_SKILL_REPLACEMENTS.get(skill, (skill,))
        for replacement in replacements:
            if replacement not in migrated:
                migrated.append(replacement)
    return migrated


def migrated_workflow(content: str) -> str:
    """Add parser-visible step headings without discarding existing prose."""
    if EXECUTABLE_HEADING.search(content):
        return content

    lines = content.splitlines()
    converted: list[str] = []
    found_numbered_instruction = False
    for line in lines:
        match = NUMBERED_INSTRUCTION.match(line)
        if not match:
            converted.append(line)
            continue
        found_numbered_instruction = True
        indent, number, instruction = match.groups()
        converted.extend([f"{indent}## Step {number}", "", f"{indent}{instruction}"])

    if found_numbered_instruction:
        return "\n".join(converted).rstrip() + "\n"

    insertion = 1 if lines and lines[0].startswith("# ") else 0
    lines[insertion:insertion] = ["", "## Step 1: Execution", ""]
    return "\n".join(lines).rstrip() + "\n"


def migrated_mcp_config(config: dict[str, Any]) -> dict[str, Any]:
    """Make an empty optional MCP file parse as the consumer's McpConfig."""
    if "mcpServers" not in config:
        return {**config, "mcpServers": {}}
    return config


def json_text(value: Any) -> str:
    return json.dumps(value, indent=2, ensure_ascii=False) + "\n"


def collect_changes(root: Path) -> list[tuple[Path, str]]:
    registry_path = root / "registry.json"
    index_path = root / "index.json"
    registry = json.loads(registry_path.read_text(encoding="utf-8"))
    index = json.loads(index_path.read_text(encoding="utf-8"))
    changes: list[tuple[Path, str]] = []

    migrated_registry = dict(registry)
    migrated_registry["templates"] = [
        {**template, "required_skills": migrated_skills(template.get("required_skills", []))}
        for template in registry["templates"]
    ]
    if migrated_registry != registry:
        changes.append((registry_path, json_text(migrated_registry)))

    migrated_index = [
        {**template, "required_skills": migrated_skills(template.get("required_skills", []))}
        for template in index
    ]
    if migrated_index != index:
        changes.append((index_path, json_text(migrated_index)))

    for template in migrated_registry["templates"]:
        template_root = root / Path(template["path"])
        swarm_path = template_root / "swarm.json"
        swarm = json.loads(swarm_path.read_text(encoding="utf-8"))
        default_model = (swarm.get("defaults") or {}).get("model", DEFAULT_MODEL_ID)

        agents_root = template_root / "agents"
        if agents_root.is_dir():
            for agent_path in sorted(agents_root.glob("*.json")):
                original = json.loads(agent_path.read_text(encoding="utf-8"))
                migrated = migrated_agent(original, default_model)
                if migrated != original:
                    changes.append((agent_path, json_text(migrated)))

        workflows_root = template_root / "workflows"
        if workflows_root.is_dir():
            for workflow_path in sorted(workflows_root.glob("*.md")):
                original_text = workflow_path.read_text(encoding="utf-8")
                migrated_text = migrated_workflow(original_text)
                if migrated_text != original_text:
                    changes.append((workflow_path, migrated_text))

        mcp_path = template_root / "mcps.json"
        if mcp_path.is_file():
            original_mcp = json.loads(mcp_path.read_text(encoding="utf-8"))
            migrated_mcp = migrated_mcp_config(original_mcp)
            if migrated_mcp != original_mcp:
                changes.append((mcp_path, json_text(migrated_mcp)))

    return changes


def main() -> int:
    parser = argparse.ArgumentParser()
    mode = parser.add_mutually_exclusive_group()
    mode.add_argument("--apply", action="store_true", help="write additive migrations")
    mode.add_argument("--check", action="store_true", help="fail if migrations remain")
    args = parser.parse_args()

    root = Path(__file__).resolve().parents[1]
    changes = collect_changes(root)
    if not changes:
        print("Consumer contract migration: no changes required.")
        return 0

    action = "Would update"
    if args.apply:
        action = "Updated"
        for path, content in changes:
            path.write_text(content, encoding="utf-8", newline="\n")

    for path, _ in changes:
        print(f"{action}: {path.relative_to(root).as_posix()}")
    print(f"{len(changes)} file(s) {'updated' if args.apply else 'require migration'}.")

    return 1 if args.check or not args.apply else 0


if __name__ == "__main__":
    raise SystemExit(main())
