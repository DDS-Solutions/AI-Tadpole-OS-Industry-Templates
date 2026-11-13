"""Safely align registry assets with the pinned Tadpole-OS wire contract.

The migration is additive and idempotent. It never deletes templates or agent
files. Run without ``--apply`` to preview changes; CI uses ``--check`` to ensure
the repository has no pending contract migrations.
"""

from __future__ import annotations

import argparse
import hashlib
import json
import re
from pathlib import Path
from typing import Any

try:
    from scripts.capabilities import DANGEROUS_CAPABILITY_IDS
    from scripts._generated_contract import (
        CANONICAL_INDUSTRIES,
        DEFAULT_EXECUTION_MODEL_CONFIG,
        DEFAULT_PLANNING_MODEL_CONFIG,
        DEFAULT_PRIMARY_MODEL_CONFIG,
        INDUSTRY_ALIASES,
        LEGACY_CAPABILITY_REPLACEMENTS,
    )
    from scripts.validate_template import safe_relative_path
except ImportError:  # executed directly as `python scripts/migrate_consumer_contract.py`
    from capabilities import DANGEROUS_CAPABILITY_IDS
    from _generated_contract import (
        CANONICAL_INDUSTRIES,
        DEFAULT_EXECUTION_MODEL_CONFIG,
        DEFAULT_PLANNING_MODEL_CONFIG,
        DEFAULT_PRIMARY_MODEL_CONFIG,
        INDUSTRY_ALIASES,
        LEGACY_CAPABILITY_REPLACEMENTS,
    )
    from validate_template import safe_relative_path

DEFAULT_PROVIDER = str(DEFAULT_PRIMARY_MODEL_CONFIG["provider"])
DEFAULT_MODEL_ID = str(DEFAULT_PRIMARY_MODEL_CONFIG["model_id"])
LEGACY_SKILL_REPLACEMENTS = LEGACY_CAPABILITY_REPLACEMENTS
DANGEROUS_SKILLS = DANGEROUS_CAPABILITY_IDS
EXECUTABLE_HEADING = re.compile(r"^#{2,3}\s+\S", re.MULTILINE)
NUMBERED_INSTRUCTION = re.compile(r"^(\s*)(\d+)[.)]\s+(.+)$")
STUTTERING_WORD = re.compile(r"\b([A-Za-z]{2,})\s+\1\b", re.IGNORECASE)

VERIFIED_COHORT_PATHS = frozenset({
    "legal/contract-review",
    "healthcare/patient-intake",
    "pharma/clinical-trials",
    "manufacturing/smart-factory-100",
    "digital-marketing/full-funnel-automation",
    "financial-services/bookkeeping-audit",
    "e-commerce/market-analysis",
    "development/code-reviewer",
    "construction/site-safety-subcontractor",
    "hr/recruiting-triage",
    "field-services/operations-25",
    "wholesale-distribution/b2b-operations-25",
    "testing/smoke-test",
})

COORDINATOR_HINT_TERMS = (
    "coordinator",
    "orchestrator",
    "director",
    "manager",
    "lead",
    "architect",
    "supervisor",
    "triage",
    "officer",
    "controller",
    "counsel",
)


def infer_default_provider(model_id: str) -> str:
    mid = model_id.lower().strip()
    if mid.endswith("-cloud"):
        return "ollama-cloud"
    if mid == "gemma4:31b":
        return "google"
    if ":" in mid:
        return "ollama"
    if mid.startswith("claude"):
        return "anthropic"
    if mid.startswith("gpt") or mid.startswith("o1") or mid.startswith("o3"):
        return "openai"
    if mid.startswith("deepseek"):
        return "deepseek"
    if mid.startswith("mistral") or mid.startswith("mixtral") or mid.startswith("codestral"):
        return "mistral"
    return DEFAULT_PROVIDER


def _clean_stuttering_name(name: Any) -> Any:
    if not isinstance(name, str):
        return name
    cleaned = name
    while True:
        updated = STUTTERING_WORD.sub(r"\1", cleaned)
        if updated == cleaned:
            return updated
        cleaned = updated


def migrated_agent(
    agent: dict[str, Any],
    default_model: str = DEFAULT_MODEL_ID,
    *,
    upgrade_model_slots: bool = False,
) -> dict[str, Any]:
    """Return a consumer-compatible copy while preserving existing fields."""
    result = dict(agent)
    if "name" in result:
        result["name"] = _clean_stuttering_name(result["name"])
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
    if upgrade_model_slots:
        if (
            config.get("provider") in (None, "", "google")
            and config.get("model_id") in (None, "", "gemma4:31b", "gemini-pro-latest")
        ):
            config["provider"] = DEFAULT_PRIMARY_MODEL_CONFIG["provider"]
            config["model_id"] = DEFAULT_PRIMARY_MODEL_CONFIG["model_id"]
        config.setdefault("temperature", DEFAULT_PRIMARY_MODEL_CONFIG["temperature"])
        config.setdefault("max_turns", DEFAULT_PRIMARY_MODEL_CONFIG["max_turns"])
        if "model_config2" not in result:
            result["model_config2"] = dict(DEFAULT_PLANNING_MODEL_CONFIG)
        if "model_config3" not in result:
            result["model_config3"] = dict(DEFAULT_EXECUTION_MODEL_CONFIG)
    else:
        model_id = (
            config.get("model_id")
            or result.get("model_id")
            or result.get("model")
            or default_model
            or DEFAULT_MODEL_ID
        )
        config.setdefault("provider", infer_default_provider(model_id))
        config.setdefault("model_id", model_id)

    prompt = (
        config.get("system_prompt")
        or result.get("system_prompt")
        or result.get("prompt")
        or result.get("description")
        or "Execute sovereign tasks per directive."
    )
    config.setdefault("system_prompt", prompt)
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


def canonical_industry_name(raw: Any, fallback: str | None = None) -> str | None:
    if isinstance(raw, str):
        stripped = raw.strip()
        if stripped in CANONICAL_INDUSTRIES:
            return stripped
        alias = INDUSTRY_ALIASES.get(stripped.lower())
        if alias:
            return alias
    return fallback if fallback in CANONICAL_INDUSTRIES else raw


def _pick_coordinator_id(roster: list[dict[str, Any]], agent_profiles: dict[str, dict[str, Any]]) -> str:
    critical = [r["id"] for r in roster if r.get("priority") == "critical" and isinstance(r.get("id"), str)]
    if critical:
        return critical[0]
    best_id = str(roster[0].get("id"))
    best_score = -1
    for ref in roster:
        rid = str(ref.get("id", ""))
        prof = agent_profiles.get(rid, {})
        haystack = f"{rid} {prof.get('role', '')} {prof.get('name', '')}".lower()
        score = sum(1 for term in COORDINATOR_HINT_TERMS if term in haystack)
        if ref.get("priority") == "high":
            score += 2
        if score > best_score:
            best_score = score
            best_id = rid
    return best_id


def migrated_swarm(
    swarm: dict[str, Any],
    template_entry: dict[str, Any],
    agent_profiles: dict[str, dict[str, Any]],
) -> dict[str, Any]:
    """Align swarm metadata, industry parity, maturity, defaults, and coordinator DAG."""
    result = dict(swarm)
    t_path = str(template_entry.get("path", ""))

    for parity_key in ("id", "name", "description"):
        if parity_key in template_entry and template_entry[parity_key]:
            result[parity_key] = template_entry[parity_key]

    resolved_industry = canonical_industry_name(template_entry.get("industry") or result.get("industry"))
    if resolved_industry:
        result["industry"] = resolved_industry

    if result.get("maturity") != "verified":
        result["maturity"] = "verified" if t_path in VERIFIED_COHORT_PATHS else "starter"

    defaults = dict(result.get("defaults") or {})
    if defaults.get("model") in (None, "", "gemma4:31b", "gemini-pro-latest"):
        defaults["model"] = DEFAULT_PRIMARY_MODEL_CONFIG["model_id"]
    if defaults.get("provider") in (None, "", "google"):
        defaults["provider"] = DEFAULT_PRIMARY_MODEL_CONFIG["provider"]
    defaults.setdefault("temperature", DEFAULT_PRIMARY_MODEL_CONFIG["temperature"])
    result["defaults"] = defaults

    roster = [dict(r) for r in result.get("roster", []) if isinstance(r, dict)]
    if len(roster) > 1 and not result.get("flat_peer_swarm"):
        all_null = all(r.get("supervisor") is None for r in roster)
        if all_null:
            coord_id = _pick_coordinator_id(roster, agent_profiles)
            for ref in roster:
                if ref.get("id") == coord_id:
                    ref["supervisor"] = None
                    ref["priority"] = "critical"
                else:
                    ref["supervisor"] = coord_id
                    if ref.get("priority") not in ("high", "normal", "low"):
                        ref["priority"] = "normal"
            result["roster"] = roster

    return result


def json_text(value: Any) -> str:
    return json.dumps(value, indent=2, ensure_ascii=False) + "\n"


def _compute_digest_with_overrides(
    template_root: Path,
    overrides: dict[Path, bytes],
) -> str:
    files = sorted(
        (
            (p.relative_to(template_root).as_posix(), p)
            for p in template_root.rglob("*")
            if p.is_file() and not p.is_symlink()
        ),
        key=lambda item: item[0],
    )
    lines: list[str] = []
    for rel, path in files:
        raw = overrides.get(path.resolve())
        if raw is None:
            raw = path.read_bytes().replace(b"\r\r\n", b"\n").replace(b"\r\n", b"\n")
        else:
            raw = raw.replace(b"\r\r\n", b"\n").replace(b"\r\n", b"\n")
        if rel == "swarm.json":
            try:
                obj = json.loads(raw.decode("utf-8"))
                if isinstance(obj, dict):
                    obj = {k: v for k, v in obj.items() if k != "content_sha256"}
                    raw = json.dumps(obj, sort_keys=True, separators=(",", ":"), ensure_ascii=False).encode("utf-8")
            except Exception:
                pass
        digest = hashlib.sha256(raw).hexdigest()
        lines.append(f"{rel}\0{digest}")
    payload = "\n".join(lines).encode("utf-8")
    return f"sha256:{hashlib.sha256(payload).hexdigest()}"


def collect_changes(root: Path) -> list[tuple[Path, str]]:
    registry_path = root / "registry.json"
    index_path = root / "index.json"
    registry = json.loads(registry_path.read_text(encoding="utf-8"))
    index = json.loads(index_path.read_text(encoding="utf-8"))
    changes: list[tuple[Path, str]] = []
    pending_bytes: dict[Path, bytes] = {}

    def record_change(path: Path, text: str) -> None:
        changes.append((path, text))
        pending_bytes[path.resolve()] = text.encode("utf-8")

    template_digests: dict[str, str] = {}
    template_models: dict[str, list[str]] = {}
    template_skills: dict[str, list[str]] = {}
    template_maturity: dict[str, str] = {}

    for template in registry.get("templates", []):
        if not isinstance(template, dict):
            continue
        template_root = safe_relative_path(root, template.get("path"))
        if template_root is None or not template_root.is_dir():
            continue
        swarm_path = template_root / "swarm.json"
        if not swarm_path.is_file():
            continue
        try:
            swarm = json.loads(swarm_path.read_text(encoding="utf-8"))
        except (OSError, json.JSONDecodeError):
            continue

        default_model = (swarm.get("defaults") or {}).get("model", DEFAULT_MODEL_ID)
        agent_profiles: dict[str, dict[str, Any]] = {}
        skills_union: set[str] = set()
        models_union: set[str] = set()

        agents_root = template_root / "agents"
        if agents_root.is_dir():
            for agent_path in sorted(agents_root.glob("*.json")):
                try:
                    original = json.loads(agent_path.read_text(encoding="utf-8"))
                except (OSError, json.JSONDecodeError):
                    continue
                migrated = migrated_agent(original, default_model, upgrade_model_slots=True)
                if migrated != original:
                    record_change(agent_path, json_text(migrated))
                aid = migrated.get("id")
                if isinstance(aid, str):
                    agent_profiles[aid] = migrated
                skills_union.update(s for s in migrated.get("skills", []) if isinstance(s, str))
                for slot_key in ("model_config", "model_config2", "model_config3"):
                    slot_cfg = migrated.get(slot_key)
                    if isinstance(slot_cfg, dict) and isinstance(slot_cfg.get("model_id"), str) and slot_cfg["model_id"]:
                        models_union.add(slot_cfg["model_id"])

        new_swarm = migrated_swarm(swarm, template, agent_profiles)
        if new_swarm != swarm:
            record_change(swarm_path, json_text(new_swarm))

        workflows_root = template_root / "workflows"
        if workflows_root.is_dir():
            for workflow_path in sorted(workflows_root.glob("*.md")):
                try:
                    original_text = workflow_path.read_text(encoding="utf-8")
                except OSError:
                    continue
                migrated_text = migrated_workflow(original_text)
                if migrated_text != original_text:
                    record_change(workflow_path, migrated_text)

        mcp_path = template_root / "mcps.json"
        if mcp_path.is_file():
            try:
                original_mcp = json.loads(mcp_path.read_text(encoding="utf-8"))
            except (OSError, json.JSONDecodeError):
                pass
            else:
                migrated_mcp = migrated_mcp_config(original_mcp)
                if migrated_mcp != original_mcp:
                    record_change(mcp_path, json_text(migrated_mcp))

        tid = str(template.get("id", ""))
        template_digests[tid] = _compute_digest_with_overrides(template_root, pending_bytes)
        if models_union:
            template_models[tid] = sorted(models_union)
        if skills_union:
            template_skills[tid] = sorted(skills_union)
        if isinstance(new_swarm.get("maturity"), str):
            template_maturity[tid] = new_swarm["maturity"]

    migrated_registry = dict(registry)
    new_reg_templates = []
    for template in registry["templates"]:
        tid = str(template.get("id", ""))
        entry = dict(template)
        entry["required_skills"] = template_skills.get(tid, migrated_skills(template.get("required_skills", [])))
        if tid in template_models:
            entry["required_models"] = template_models[tid]
        if tid in template_maturity:
            entry["maturity"] = template_maturity[tid]
        if tid in template_digests:
            entry["content_sha256"] = template_digests[tid]
        new_reg_templates.append(entry)
    migrated_registry["templates"] = new_reg_templates
    if migrated_registry != registry:
        changes.append((registry_path, json_text(migrated_registry)))

    migrated_index = []
    for template in index:
        tid = str(template.get("id", ""))
        entry = dict(template)
        entry["required_skills"] = template_skills.get(tid, migrated_skills(template.get("required_skills", [])))
        if tid in template_models:
            entry["required_models"] = template_models[tid]
        if tid in template_digests:
            entry["content_sha256"] = template_digests[tid]
        migrated_index.append(entry)
    if migrated_index != index:
        changes.append((index_path, json_text(migrated_index)))

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
            path.write_bytes(content.encode("utf-8"))

    for path, _ in changes:
        print(f"{action}: {path.relative_to(root).as_posix()}")
    print(f"{len(changes)} file(s) {'updated' if args.apply else 'require migration'}.")

    return 1 if args.check or not args.apply else 0


if __name__ == "__main__":
    raise SystemExit(main())
