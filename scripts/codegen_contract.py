"""Generate Python, TypeScript, and Node contract modules from schemas/capabilities-contract.json."""

from __future__ import annotations

import argparse
import json
import sys
from pathlib import Path
from typing import Any

ROOT = Path(__file__).resolve().parents[1]
CONTRACT_PATH = ROOT / "schemas" / "capabilities-contract.json"

PY_OUT = ROOT / "scripts" / "_generated_contract.py"
TS_OUT = ROOT / "web-builder" / "src" / "constants" / "_generatedContract.ts"
MJS_OUT = ROOT / "web-builder" / "scripts" / "_generatedContract.mjs"


def load_contract(contract_path: Path = CONTRACT_PATH) -> dict[str, Any]:
    return json.loads(contract_path.read_text(encoding="utf-8"))


def render_python(contract: dict[str, Any]) -> str:
    caps = contract["capabilities"]
    cap_ids = tuple(c["id"] for c in caps)
    dangerous_ids = tuple(c["id"] for c in caps if c["requires_oversight"])
    slots = contract["default_model_slots"]
    lines = [
        '"""AUTO-GENERATED from schemas/capabilities-contract.json. Do not edit manually."""',
        "",
        "from __future__ import annotations",
        "",
        f'CONTRACT_VERSION = {json.dumps(contract["contract_version"])}',
        f'CONSUMER_PINNED_REVISION = {json.dumps(contract["consumer_pinned_revision"])}',
        "",
        f"CAPABILITY_SPECS = {json.dumps(caps, indent=4, ensure_ascii=False)}".replace("true", "True").replace("false", "False"),
        f"VALID_CAPABILITY_IDS: frozenset[str] = frozenset({list(cap_ids)!r})",
        f"DANGEROUS_CAPABILITY_IDS: frozenset[str] = frozenset({list(dangerous_ids)!r})",
        "",
        f"LEGACY_CAPABILITIES: frozenset[str] = frozenset({contract['legacy_capabilities']!r})",
        f"LEGACY_CAPABILITY_REPLACEMENTS: dict[str, tuple[str, ...]] = {{",
    ]
    for k, v in contract["legacy_capability_replacements"].items():
        lines.append(f"    {k!r}: {tuple(v)!r},")
    lines.extend([
        "}",
        "",
        f"ENGINE_PRIVATE_ENV_VARS: frozenset[str] = frozenset({contract['engine_private_env_vars']!r})",
        f"RESERVED_MCP_HTTP_HEADERS: frozenset[str] = frozenset({contract['reserved_mcp_http_headers']!r})",
        f"RESERVED_MCP_HTTP_HEADER_PREFIXES: tuple[str, ...] = {tuple(contract['reserved_mcp_http_header_prefixes'])!r}",
        f"ALLOWED_MCP_COMMANDS: frozenset[str] = frozenset({contract['allowed_mcp_commands']!r})",
        f"ALLOWED_MCP_PROTOCOL_VERSIONS: frozenset[str] = frozenset({contract['allowed_mcp_protocol_versions']!r})",
        "",
        f"PLANE2_DEPARTMENT_MARKER = {contract['plane2_department_marker']!r}",
        f"PLANE2_FORBIDDEN_CAPABILITIES: frozenset[str] = frozenset({contract['plane2_forbidden_skills']!r})",
        "",
        "PROMPT_INJECTION_PATTERN_SPECS: tuple[tuple[str, str, bool], ...] = (",
    ])
    for item in contract["prompt_injection_patterns"]:
        lines.append(f"    ({item['label']!r}, {item['pattern']!r}, {bool(item.get('ignore_case'))!r}),")
    lines.extend([
        ")",
        "",
        f"CANONICAL_INDUSTRIES: tuple[str, ...] = {tuple(contract['canonical_industries'])!r}",
        f"INDUSTRY_ALIASES: dict[str, str] = {json.dumps(contract['industry_aliases'], indent=4, ensure_ascii=False)}",
        "",
        f"DEFAULT_PRIMARY_MODEL_CONFIG: dict[str, object] = {json.dumps(slots['primary'], indent=4, ensure_ascii=False)}",
        f"DEFAULT_PLANNING_MODEL_CONFIG: dict[str, object] = {json.dumps(slots['planning'], indent=4, ensure_ascii=False)}",
        f"DEFAULT_EXECUTION_MODEL_CONFIG: dict[str, object] = {json.dumps(slots['execution'], indent=4, ensure_ascii=False)}",
        "",
    ])
    return "\n".join(lines)


def render_typescript(contract: dict[str, Any]) -> str:
    caps = contract["capabilities"]
    valid_ids = [c["id"] for c in caps]
    dangerous_ids = [c["id"] for c in caps if c["requires_oversight"]]
    lines = [
        "// AUTO-GENERATED from schemas/capabilities-contract.json. Do not edit manually.",
        "",
        f"export const CONTRACT_VERSION = {json.dumps(contract['contract_version'])};",
        f"export const CONSUMER_PINNED_REVISION = {json.dumps(contract['consumer_pinned_revision'])};",
        "",
        "export interface GeneratedCapabilityDef {",
        "  readonly id: string;",
        "  readonly label: string;",
        "  readonly description: string;",
        "  readonly builderDescription: string;",
        "  readonly risk: 'read_only' | 'mutating' | 'dangerous';",
        "  readonly requiresOversight: boolean;",
        "  readonly isMarker: boolean;",
        "  readonly companionMarkers: readonly string[];",
        "}",
        "",
        "export const GENERATED_CAPABILITY_DEFS: readonly GeneratedCapabilityDef[] = [",
    ]
    for cap in caps:
        item = {
            "id": cap["id"],
            "label": cap["label"],
            "description": cap["description"],
            "builderDescription": cap["builder_description"],
            "risk": cap["risk"],
            "requiresOversight": cap["requires_oversight"],
            "isMarker": cap["is_marker"],
            "companionMarkers": cap["companion_markers"],
        }
        lines.append(f"  {json.dumps(item, ensure_ascii=False)},")
    lines.extend([
        "];",
        "",
        f"export const VALID_RUNTIME_CAPABILITY_LIST = {json.dumps(valid_ids)} as const;",
        f"export const DANGEROUS_SKILL_LIST = {json.dumps(dangerous_ids)} as const;",
        f"export const LEGACY_SKILL_LIST = {json.dumps(contract['legacy_capabilities'])} as const;",
        f"export const ENGINE_PRIVATE_ENV_VAR_LIST = {json.dumps(contract['engine_private_env_vars'])} as const;",
        f"export const RESERVED_MCP_HTTP_HEADER_LIST = {json.dumps(contract['reserved_mcp_http_headers'])} as const;",
        f"export const RESERVED_MCP_HTTP_HEADER_PREFIX_LIST = {json.dumps(contract['reserved_mcp_http_header_prefixes'])} as const;",
        f"export const ALLOWED_MCP_COMMAND_LIST = {json.dumps(contract['allowed_mcp_commands'])} as const;",
        f"export const ALLOWED_MCP_PROTOCOL_LIST = {json.dumps(contract['allowed_mcp_protocol_versions'])} as const;",
        f"export const PLANE2_DEPARTMENT_MARKER = {json.dumps(contract['plane2_department_marker'])};",
        f"export const PLANE2_FORBIDDEN_SKILL_LIST = {json.dumps(contract['plane2_forbidden_skills'])} as const;",
        f"export const PROMPT_INJECTION_PATTERN_DEFS = {json.dumps(contract['prompt_injection_patterns'], ensure_ascii=False)} as const;",
        f"export const CANONICAL_INDUSTRIES: readonly string[] = {json.dumps(contract['canonical_industries'], indent=2, ensure_ascii=False)};",
        f"export const INDUSTRY_ALIASES: Readonly<Record<string, string>> = {json.dumps(contract['industry_aliases'], indent=2, ensure_ascii=False)};",
        f"export const DEFAULT_MODEL_SLOTS = {json.dumps(contract['default_model_slots'], indent=2, ensure_ascii=False)} as const;",
        "",
    ])
    return "\n".join(lines)


def render_mjs(contract: dict[str, Any]) -> str:
    caps = contract["capabilities"]
    valid_ids = [c["id"] for c in caps]
    lines = [
        "// AUTO-GENERATED from schemas/capabilities-contract.json. Do not edit manually.",
        "",
        f"export const CONTRACT_VERSION = {json.dumps(contract['contract_version'])};",
        f"export const CONSUMER_PINNED_REVISION = {json.dumps(contract['consumer_pinned_revision'])};",
        f"export const VALID_RUNTIME_CAPABILITIES = new Set({json.dumps(valid_ids)});",
        f"export const ENGINE_PRIVATE_ENV_VARS = new Set({json.dumps(contract['engine_private_env_vars'])});",
        f"export const RESERVED_MCP_HTTP_HEADERS = new Set({json.dumps(contract['reserved_mcp_http_headers'])});",
        f"export const ALLOWED_MCP_COMMANDS = new Set({json.dumps(contract['allowed_mcp_commands'])});",
        f"export const ALLOWED_MCP_PROTOCOL_VERSIONS = new Set({json.dumps(contract['allowed_mcp_protocol_versions'])});",
        f"export const PLANE2_DEPARTMENT_MARKER = {json.dumps(contract['plane2_department_marker'])};",
        f"export const PLANE2_FORBIDDEN_SKILLS = new Set({json.dumps(contract['plane2_forbidden_skills'])});",
        f"export const CANONICAL_INDUSTRIES = {json.dumps(contract['canonical_industries'], indent=2, ensure_ascii=False)};",
        f"export const DEFAULT_MODEL_SLOTS = {json.dumps(contract['default_model_slots'], indent=2, ensure_ascii=False)};",
        "",
    ]
    return "\n".join(lines)


def run_codegen(check: bool = False) -> int:
    contract = load_contract()
    targets: list[tuple[Path, str]] = [
        (PY_OUT, render_python(contract)),
        (TS_OUT, render_typescript(contract)),
        (MJS_OUT, render_mjs(contract)),
    ]
    drifted: list[Path] = []
    for path, content in targets:
        existing = path.read_text(encoding="utf-8") if path.is_file() else None
        if existing != content:
            if check:
                drifted.append(path)
            else:
                path.parent.mkdir(parents=True, exist_ok=True)
                path.write_bytes(content.encode("utf-8"))
                print(f"Generated {path.relative_to(ROOT).as_posix()}")

    if check and drifted:
        print("ERROR: Generated contract files are out of sync with schemas/capabilities-contract.json:", file=sys.stderr)
        for path in drifted:
            print(f"  - {path.relative_to(ROOT).as_posix()}", file=sys.stderr)
        print("Run 'python scripts/codegen_contract.py' to regenerate.", file=sys.stderr)
        return 1

    if check:
        print("Contract codegen check passed: all generated modules match schemas/capabilities-contract.json.")
    return 0


def main() -> int:
    parser = argparse.ArgumentParser(description="Generate Python, TS, and MJS contract modules.")
    parser.add_argument("--check", action="store_true", help="Fail if generated files differ from contract JSON.")
    args = parser.parse_args()
    return run_codegen(check=args.check)


if __name__ == "__main__":
    sys.exit(main())

