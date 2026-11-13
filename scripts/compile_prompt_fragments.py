"""Build-time prompt fragment compiler for agent system_prompt synthesis.

Compiles `prompt_includes` (under `templates/fragments/*.md`) into a flat
<= 800-character `model_config.system_prompt` so `AI-TadPole-OS` receives a
self-contained prompt string with zero runtime template resolution.
"""

from __future__ import annotations

import argparse
import json
import sys
from pathlib import Path
from typing import Any

ROOT = Path(__file__).resolve().parents[1]
FRAGMENTS_DIR = ROOT / "templates" / "fragments"
MAX_PROMPT_CHARS = 800


def compile_prompt(
    base_prompt: str,
    includes: list[str],
    fragments_dir: Path = FRAGMENTS_DIR,
) -> str:
    parts = [base_prompt.strip()] if base_prompt.strip() else []
    for rel in includes:
        frag_path = (fragments_dir / rel).resolve()
        frag_path.relative_to(fragments_dir.resolve())
        frag_text = frag_path.read_text(encoding="utf-8").strip()
        if frag_text and frag_text not in " ".join(parts):
            parts.append(frag_text)
    compiled = " ".join(parts)
    if len(compiled) > MAX_PROMPT_CHARS:
        raise ValueError(
            f"Compiled system_prompt exceeds {MAX_PROMPT_CHARS} chars ({len(compiled)}): trim base_prompt or includes {includes}"
        )
    return compiled


def check_or_apply_prompts(root: Path, apply: bool = False) -> list[str]:
    drifted: list[str] = []
    fragments_dir = root / "templates" / "fragments"
    for agent_path in sorted(root.glob("*/*/agents/*.json")):
        if any(p in agent_path.parts for p in ("node_modules", ".tmp", "scratch", "web-builder")):
            continue
        data: dict[str, Any] = json.loads(agent_path.read_text(encoding="utf-8"))
        meta = data.get("metadata") if isinstance(data.get("metadata"), dict) else {}
        includes = meta.get("prompt_includes")
        base_prompt = meta.get("base_system_prompt")
        if not isinstance(includes, list) or not isinstance(base_prompt, str):
            continue
        compiled = compile_prompt(base_prompt, [str(x) for x in includes], fragments_dir=fragments_dir)
        current = data.get("model_config", {}).get("system_prompt")
        if current != compiled:
            rel = agent_path.relative_to(root).as_posix()
            drifted.append(rel)
            if apply:
                data["model_config"]["system_prompt"] = compiled
                agent_path.write_bytes((json.dumps(data, indent=2, ensure_ascii=False) + "\n").encode("utf-8"))
    return drifted


def main(argv: list[str] | None = None) -> int:
    parser = argparse.ArgumentParser(description="Compile or verify agent prompt_includes fragments.")
    mode = parser.add_mutually_exclusive_group()
    mode.add_argument("--apply", action="store_true", help="Write compiled system_prompt values.")
    mode.add_argument("--check", action="store_true", help="Fail if compiled prompts are out of sync.")
    args = parser.parse_args(argv)
    drifted = check_or_apply_prompts(ROOT, apply=bool(args.apply))
    if not drifted:
        print("Prompt fragment check passed: all compiled system prompts are up to date.")
        return 0
    verb = "Compiled" if args.apply else "Out-of-sync"
    for rel in drifted:
        print(f"{verb}: {rel}")
    return 0 if args.apply else 1


if __name__ == "__main__":
    sys.exit(main())

