"""Generate machine-readable `llms.txt` and `llms-full.txt` repository indexes.

Keeps LLM/agent discovery docs strictly synchronized with `registry.json`,
`mcp_registry.json`, `schemas/`, and `scripts/_generated_contract.py`.
"""

from __future__ import annotations

import argparse
import json
import sys
from pathlib import Path
from typing import Any

try:
    from scripts._generated_contract import (
        CANONICAL_INDUSTRIES,
        CONSUMER_PINNED_REVISION,
        CONTRACT_VERSION,
        DEFAULT_EXECUTION_MODEL_CONFIG,
        DEFAULT_PRIMARY_MODEL_CONFIG,
    )
except ImportError:
    from _generated_contract import (
        CANONICAL_INDUSTRIES,
        CONSUMER_PINNED_REVISION,
        CONTRACT_VERSION,
        DEFAULT_EXECUTION_MODEL_CONFIG,
        DEFAULT_PRIMARY_MODEL_CONFIG,
    )

ROOT = Path(__file__).resolve().parents[1]


def render_llms_txt(root: Path = ROOT) -> str:
    reg: dict[str, Any] = json.loads((root / "registry.json").read_text(encoding="utf-8"))
    mcp_reg: dict[str, Any] = json.loads((root / "mcp_registry.json").read_text(encoding="utf-8"))
    templates = reg.get("templates", [])
    public_templates = [t for t in templates if not t.get("internal")]
    verified_templates = [t for t in public_templates if t.get("maturity") == "verified"]
    eval_count = len(list(root.glob("*/*/evals/scenarios.json")))
    connectors = mcp_reg.get("connectors", [])

    lines = [
        "# AI-Tadpole-OS Industry Templates",
        "",
        "> Official community template registry and Swarm Architect builder for AI-Tadpole-OS "
        f"(Contract v{CONTRACT_VERSION}, Consumer Pin `{CONSUMER_PINNED_REVISION[:12]}`).",
        "",
        "## Registry Snapshot",
        f"- Public Templates: {len(public_templates)} across {len(CANONICAL_INDUSTRIES)} canonical industries "
        f"({len(verified_templates)} verified flagships + {len(public_templates) - len(verified_templates)} starters, plus 1 internal smoke fixture).",
        f"- Primary / Planning Model Slot: `{DEFAULT_PRIMARY_MODEL_CONFIG['provider']}` / `{DEFAULT_PRIMARY_MODEL_CONFIG['model_id']}`.",
        f"- Edge / Execution Model Slot (`model_config3`): `{DEFAULT_EXECUTION_MODEL_CONFIG['provider']}` / `{DEFAULT_EXECUTION_MODEL_CONFIG['model_id']}`.",
        f"- Declarative Eval Suites (`evals/scenarios.json`): {eval_count} templates.",
        f"- MCP Connector Blueprints: {len(connectors)} (`mcp_registry.json`).",
        "",
        "## Core Contract & Governance Docs",
        "- [Compatibility Matrix](COMPATIBILITY_MATRIX.md): Pinned consumer behavior and cross-repo alignment.",
        "- [Template Spec](TEMPLATE_SPEC.md): Manifest, agent profile, workflow SOP, capability, and OKF specs.",
        "- [Capabilities Contract](schemas/capabilities-contract.json): Single source of truth codegen source for Python & TypeScript.",
        "- [Swarm Schema v1](schemas/swarm-v1.json): Strict JSON Schema for `swarm.json` manifests.",
        "- [Agent Schema v1](schemas/agent-v1.json): JSON Schema for `agents/*.json` profiles.",
        "- [Eval Schema v1](schemas/eval-v1.json): JSON Schema for declarative `evals/scenarios.json` suites.",
        "",
        "## Verified Templates",
    ]
    for tpl in sorted(verified_templates, key=lambda x: x["path"]):
        lines.append(
            f"- [{tpl['name']}]({tpl['path']}/swarm.json) (`{tpl['industry']}`): {tpl['description']}"
        )
    lines.extend(
        [
            "",
            "## Validation & Build Commands",
            "- `python scripts/codegen_contract.py --check`",
            "- `python scripts/validate_template.py`",
            "- `python scripts/compile_prompt_fragments.py --check`",
            "- `python scripts/run_template_evals.py --check`",
            "- `python scripts/verify_compatibility_lock.py --check`",
        ]
    )
    return "\n".join(lines) + "\n"


def render_llms_full_txt(root: Path = ROOT) -> str:
    reg: dict[str, Any] = json.loads((root / "registry.json").read_text(encoding="utf-8"))
    mcp_reg: dict[str, Any] = json.loads((root / "mcp_registry.json").read_text(encoding="utf-8"))
    templates = reg.get("templates", [])
    public_templates = [t for t in templates if not t.get("internal")]

    parts = [
        render_llms_txt(root).rstrip(),
        "",
        "---",
        "",
        "## Canonical Industries (38)",
        "",
    ]
    for ind in CANONICAL_INDUSTRIES:
        count = sum(1 for t in public_templates if t.get("industry") == ind)
        parts.append(f"- {ind} ({count} template{'s' if count != 1 else ''})")

    parts.extend(["", "## All Public Swarm Templates", ""])
    for tpl in sorted(public_templates, key=lambda x: (x.get("industry", ""), x.get("path", ""))):
        models = ", ".join(tpl.get("required_models", []))
        parts.append(
            f"- `{tpl['path']}` | id=`{tpl['id']}` | industry=`{tpl['industry']}` | "
            f"maturity=`{tpl.get('maturity', 'starter')}` | agents={len(tpl.get('agents', []))} | models=[{models}]"
        )

    parts.extend(["", "## MCP Connector Blueprints", ""])
    for conn in mcp_reg.get("connectors", []):
        tool_ids = [t["id"] if isinstance(t, dict) else str(t) for t in conn.get("tools", [])]
        parts.append(
            f"- `{conn['id']}` (`{conn.get('status', 'sample')}`): {conn.get('description', '')} "
            f"[tools: {', '.join(tool_ids)}]"
        )

    return "\n".join(parts) + "\n"


def check_or_apply_llms_docs(root: Path = ROOT, apply: bool = False) -> list[str]:
    expected = {
        "llms.txt": render_llms_txt(root),
        "llms-full.txt": render_llms_full_txt(root),
    }
    drifted: list[str] = []
    for rel, content in expected.items():
        path = root / rel
        existing = path.read_text(encoding="utf-8") if path.is_file() else None
        if existing != content:
            drifted.append(rel)
            if apply:
                path.write_bytes(content.encode("utf-8"))
    return drifted


def main(argv: list[str] | None = None) -> int:
    parser = argparse.ArgumentParser(description="Generate or verify llms.txt and llms-full.txt.")
    mode = parser.add_mutually_exclusive_group()
    mode.add_argument("--apply", action="store_true", help="Write llms.txt and llms-full.txt.")
    mode.add_argument("--check", action="store_true", help="Fail if llms docs are out of sync.")
    args = parser.parse_args(argv)
    drifted = check_or_apply_llms_docs(ROOT, apply=bool(args.apply))
    if not drifted:
        print("llms.txt and llms-full.txt are up to date.")
        return 0
    verb = "Generated" if args.apply else "Out-of-sync"
    for rel in drifted:
        print(f"{verb}: {rel}")
    return 0 if args.apply else 1


if __name__ == "__main__":
    sys.exit(main())
