"""Validate registry assets against the pinned AI-Tadpole-OS contract."""

from __future__ import annotations

import json
import re
import sys
from dataclasses import dataclass, field
from pathlib import Path
from typing import Any


REQUIRED_AGENT_STRINGS = (
    "id",
    "name",
    "role",
    "department",
    "description",
    "status",
)
EXECUTABLE_HEADING = re.compile(r"^#{2,3}\s+\S", re.MULTILINE)


@dataclass
class ValidationReport:
    errors: list[str] = field(default_factory=list)
    warnings: list[str] = field(default_factory=list)

    def error(self, context: str, message: str) -> None:
        self.errors.append(f"{context}: {message}")

    def warning(self, context: str, message: str) -> None:
        self.warnings.append(f"{context}: {message}")


def load_json(path: Path) -> Any:
    with path.open("r", encoding="utf-8") as handle:
        return json.load(handle)


def safe_relative_path(root: Path, relative: Any) -> Path | None:
    if not isinstance(relative, str) or not relative.strip():
        return None
    normalized = relative.replace("\\", "/")
    if normalized.startswith("/") or re.match(r"^[A-Za-z]:/", normalized):
        return None
    candidate = (root / Path(normalized)).resolve()
    try:
        candidate.relative_to(root.resolve())
    except ValueError:
        return None
    return candidate


def validate_agent_payload(agent: Any) -> list[str]:
    errors: list[str] = []
    if not isinstance(agent, dict):
        return ["must be a JSON object"]

    for key in REQUIRED_AGENT_STRINGS:
        if not isinstance(agent.get(key), str) or not agent[key].strip():
            errors.append(f"{key} must be a non-empty string")

    model_config = agent.get("model_config")
    if not isinstance(model_config, dict):
        errors.append("model_config must be an object")
    else:
        for key in ("provider", "model_id", "system_prompt"):
            value = model_config.get(key)
            if not isinstance(value, str) or not value.strip():
                errors.append(f"model_config.{key} must be a non-empty string")
        prompt = model_config.get("system_prompt")
        if isinstance(prompt, str) and len(prompt) > 800:
            errors.append(f"model_config.system_prompt exceeds 800 characters ({len(prompt)})")

    for key in ("skills", "workflows"):
        value = agent.get(key, [])
        if not isinstance(value, list) or not all(isinstance(item, str) and item for item in value):
            errors.append(f"{key} must be an array of non-empty strings")
    return errors


def validate_workflow_content(content: str) -> list[str]:
    if not content.strip():
        return ["workflow is empty"]
    if not EXECUTABLE_HEADING.search(content):
        return ["workflow needs at least one ## or ### execution heading"]
    return []


def validate_mcp_payload(config: Any) -> list[str]:
    errors: list[str] = []
    if not isinstance(config, dict):
        return ["must be a JSON object"]
    servers = config.get("mcpServers")
    if not isinstance(servers, dict):
        return ["mcpServers must be an object"]
    for server_name, server in servers.items():
        prefix = f"mcpServers.{server_name}"
        if not isinstance(server_name, str) or not server_name:
            errors.append("server names must be non-empty strings")
            continue
        if not isinstance(server, dict):
            errors.append(f"{prefix} must be an object")
            continue
        if not isinstance(server.get("command"), str) or not server["command"].strip():
            errors.append(f"{prefix}.command must be a non-empty string")
        args = server.get("args")
        if not isinstance(args, list) or not all(isinstance(arg, str) for arg in args):
            errors.append(f"{prefix}.args must be an array of strings")
        env = server.get("env", {})
        if not isinstance(env, dict) or not all(
            isinstance(key, str) and isinstance(value, str) for key, value in env.items()
        ):
            errors.append(f"{prefix}.env must be an object of string values")
    return errors


def validate_knowledge_payload(payload: Any) -> list[str]:
    if not isinstance(payload, list):
        return ["must be an array"]
    errors: list[str] = []
    for index, item in enumerate(payload):
        if not isinstance(item, dict):
            errors.append(f"item {index} must be an object")
            continue
        for key in ("text", "topic"):
            if not isinstance(item.get(key), str) or not item[key].strip():
                errors.append(f"item {index}.{key} must be a non-empty string")
    return errors


def validate_catalog_parity(root: Path, report: ValidationReport) -> list[dict[str, Any]]:
    try:
        registry = load_json(root / "registry.json")
        index = load_json(root / "index.json")
    except (OSError, json.JSONDecodeError) as exc:
        report.error("catalog", f"cannot load registry/index: {exc}")
        return []

    templates = registry.get("templates") if isinstance(registry, dict) else None
    if not isinstance(templates, list):
        report.error("registry.json", "templates must be an array")
        return []
    if not isinstance(index, list):
        report.error("index.json", "must be a top-level array")
        return templates

    for label, entries in (("registry.json", templates), ("index.json", index)):
        ids = [entry.get("id") for entry in entries if isinstance(entry, dict)]
        paths = [entry.get("path") for entry in entries if isinstance(entry, dict)]
        if len(ids) != len(set(ids)):
            report.error(label, "contains duplicate template IDs")
        if len(paths) != len(set(paths)):
            report.error(label, "contains duplicate template paths")

    registry_contract = {(item.get("id"), item.get("path")) for item in templates if isinstance(item, dict)}
    index_contract = {(item.get("id"), item.get("path")) for item in index if isinstance(item, dict)}
    if registry_contract != index_contract:
        report.error("catalog", "registry.json and index.json disagree on template IDs or paths")
    return templates


def validate_template(root: Path, template: dict[str, Any], report: ValidationReport) -> None:
    template_id = str(template.get("id") or "<missing-id>")
    context = f"template {template_id}"
    template_root = safe_relative_path(root, template.get("path"))
    if template_root is None:
        report.error(context, "path is missing, absolute, or escapes the repository")
        return
    if not template_root.is_dir():
        report.error(context, f"directory does not exist: {template.get('path')}")
        return

    swarm_path = template_root / "swarm.json"
    try:
        swarm = load_json(swarm_path)
    except (OSError, json.JSONDecodeError) as exc:
        report.error(context, f"cannot load swarm.json: {exc}")
        return
    if not isinstance(swarm, dict):
        report.error(context, "swarm.json must be an object")
        return

    roster = swarm.get("roster", [])
    if not isinstance(roster, list):
        report.error(context, "swarm roster must be an array")
        roster = []
    if not roster:
        report.warning(context, "swarm roster is empty")

    roster_paths: set[Path] = set()
    roster_ids: set[str] = set()
    for index, reference in enumerate(roster):
        ref_context = f"{context} roster[{index}]"
        if not isinstance(reference, dict):
            report.error(ref_context, "must be an object")
            continue
        agent_path = safe_relative_path(template_root, reference.get("path"))
        if agent_path is None:
            report.error(ref_context, "path is missing, absolute, or escapes the template")
            continue
        roster_paths.add(agent_path)
        reference_id = reference.get("id")
        if not isinstance(reference_id, str) or not reference_id:
            report.error(ref_context, "id must be a non-empty string")
        elif reference_id in roster_ids:
            report.error(ref_context, f"duplicate roster id: {reference_id}")
        else:
            roster_ids.add(reference_id)
        if not agent_path.is_file():
            report.error(ref_context, f"agent file does not exist: {reference.get('path')}")

    referenced_workflows: set[Path] = set()
    global_workflows = swarm.get("global_workflows", [])
    if not isinstance(global_workflows, list):
        report.error(context, "global_workflows must be an array")
        global_workflows = []
    for workflow_ref in global_workflows:
        workflow_path = safe_relative_path(template_root, workflow_ref)
        if workflow_path is None:
            report.error(context, f"invalid global workflow path: {workflow_ref!r}")
            continue
        referenced_workflows.add(workflow_path)
        if not workflow_path.is_file():
            report.error(context, f"global workflow does not exist: {workflow_ref}")

    agents_root = template_root / "agents"
    agent_paths = sorted(agents_root.glob("*.json")) if agents_root.is_dir() else []
    if not agent_paths:
        report.error(context, "agents directory has no JSON profiles")
    for agent_path in agent_paths:
        agent_context = f"{context} agent {agent_path.name}"
        try:
            agent = load_json(agent_path)
        except (OSError, json.JSONDecodeError) as exc:
            report.error(agent_context, f"cannot parse JSON: {exc}")
            continue
        for message in validate_agent_payload(agent):
            report.error(agent_context, message)
        if isinstance(agent, dict) and agent_path in roster_paths:
            matching = next(
                (item for item in roster if isinstance(item, dict) and safe_relative_path(template_root, item.get("path")) == agent_path),
                None,
            )
            if matching and matching.get("id") != agent.get("id"):
                report.error(agent_context, "agent id does not match its roster reference")
        if isinstance(agent, dict):
            for workflow_id in agent.get("workflows", []):
                workflow_name = workflow_id if str(workflow_id).endswith(".md") else f"{workflow_id}.md"
                workflow_path = safe_relative_path(template_root / "workflows", workflow_name)
                if workflow_path is None:
                    report.error(agent_context, f"invalid workflow id: {workflow_id!r}")
                    continue
                referenced_workflows.add(workflow_path)
                if not workflow_path.is_file():
                    report.error(agent_context, f"workflow does not exist: workflows/{workflow_name}")

    if set(agent_paths) - roster_paths:
        names = ", ".join(path.name for path in sorted(set(agent_paths) - roster_paths))
        report.warning(context, f"unlisted agents are still installed by the consumer: {names}")

    workflows_root = template_root / "workflows"
    workflow_paths = sorted(workflows_root.glob("*.md")) if workflows_root.is_dir() else []
    for workflow_path in workflow_paths:
        for message in validate_workflow_content(workflow_path.read_text(encoding="utf-8")):
            report.error(f"{context} workflow {workflow_path.name}", message)
    orphan_workflows = set(workflow_paths) - referenced_workflows
    if orphan_workflows:
        names = ", ".join(path.name for path in sorted(orphan_workflows))
        report.warning(context, f"unreferenced workflows: {names}")

    mcp_path = template_root / "mcps.json"
    if mcp_path.is_file():
        try:
            mcp_payload = load_json(mcp_path)
        except (OSError, json.JSONDecodeError) as exc:
            report.error(f"{context} mcps.json", f"cannot parse JSON: {exc}")
        else:
            for message in validate_mcp_payload(mcp_payload):
                report.error(f"{context} mcps.json", message)

    knowledge_path = template_root / "knowledge.json"
    if knowledge_path.is_file():
        try:
            knowledge = load_json(knowledge_path)
        except (OSError, json.JSONDecodeError) as exc:
            report.error(f"{context} knowledge.json", f"cannot parse JSON: {exc}")
        else:
            for message in validate_knowledge_payload(knowledge):
                report.error(f"{context} knowledge.json", message)


def validate_mcp_registry(root: Path, report: ValidationReport) -> None:
    try:
        registry = load_json(root / "mcp_registry.json")
    except (OSError, json.JSONDecodeError) as exc:
        report.error("mcp_registry.json", f"cannot parse: {exc}")
        return
    connectors = registry.get("connectors") if isinstance(registry, dict) else None
    if not isinstance(connectors, list):
        report.error("mcp_registry.json", "connectors must be an array")
        return
    connector_ids: set[str] = set()
    for connector in connectors:
        if not isinstance(connector, dict):
            report.error("mcp_registry.json", "each connector must be an object")
            continue
        connector_id = connector.get("id")
        context = f"connector {connector_id or '<missing-id>'}"
        if not isinstance(connector_id, str) or not connector_id:
            report.error(context, "id must be a non-empty string")
        elif connector_id in connector_ids:
            report.error(context, "duplicate connector id")
        else:
            connector_ids.add(connector_id)
        connector_root = safe_relative_path(root, connector.get("path"))
        if connector_root is None or not connector_root.is_dir():
            report.error(context, "path is invalid or missing")
            continue
        config_path = connector_root / "mcps.json"
        try:
            config = load_json(config_path)
        except (OSError, json.JSONDecodeError) as exc:
            report.error(context, f"cannot parse mcps.json: {exc}")
            continue
        for message in validate_mcp_payload(config):
            report.error(context, message)
        if not (connector_root / "server.py").is_file():
            report.error(context, "server.py is missing")


def validate_repository(root: Path) -> ValidationReport:
    report = ValidationReport()
    templates = validate_catalog_parity(root, report)
    for template in templates:
        if isinstance(template, dict):
            validate_template(root, template, report)
        else:
            report.error("registry.json", "each template must be an object")
    validate_mcp_registry(root, report)
    return report


def main() -> int:
    root = Path(__file__).resolve().parents[1]
    report = validate_repository(root)
    for warning in report.warnings:
        print(f"WARNING: {warning}")
    for error in report.errors:
        print(f"ERROR: {error}")
    print(
        f"Contract validation finished: {len(report.errors)} error(s), "
        f"{len(report.warnings)} warning(s)."
    )
    return 1 if report.errors else 0


if __name__ == "__main__":
    sys.exit(main())
