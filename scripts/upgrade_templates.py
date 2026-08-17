"""Stage catalog-based roster upgrades without mutating registered templates.

This legacy utility previously deleted every live ``agents`` directory before
writing replacement profiles. It now writes complete template copies beneath a
caller-selected staging directory. Review and validate staged output before any
manual promotion.
"""

from __future__ import annotations

import argparse
import json
import re
import shutil
from pathlib import Path
from typing import Any


def get_words(text: str) -> set[str]:
    words = re.findall(r"\w+", text.lower())
    stop = {"and", "the", "to", "of", "for", "in", "a", "with", "is", "on"}
    return {word for word in words if word not in stop}


def selected_agents(template: dict[str, Any], catalog: list[dict[str, Any]]) -> list[dict[str, Any]]:
    template_text = " ".join(
        [
            template["name"],
            template.get("description", ""),
            *template.get("tags", []),
            template.get("industry", ""),
        ]
    )
    template_words = get_words(template_text)
    return sorted(
        catalog,
        key=lambda agent: len(template_words.intersection(agent["_words"])),
        reverse=True,
    )[:3]


def agent_payload(agent: dict[str, Any]) -> dict[str, Any]:
    return {
        "id": agent["id"],
        "name": agent["name"],
        "role": agent.get("role") or agent["name"],
        "department": agent.get("departmentLabel", "Operations"),
        "description": agent["description"],
        "status": "idle",
        "model_config": {
            "provider": "google",
            "model_id": "gemini-pro-latest",
            "system_prompt": agent["prompt"][:800],
        },
        "skills": ["read_file"],
        "workflows": [],
        "mcp_tools": [],
        "requires_oversight": False,
    }


def ensure_safe_staging_root(repository_root: Path, output: Path) -> Path:
    resolved_repository = repository_root.resolve()
    resolved_output = output.resolve()
    if resolved_output == resolved_repository or resolved_output in resolved_repository.parents:
        raise ValueError("The staging directory cannot be the repository or one of its parents.")
    return resolved_output


def main() -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument("--check", action="store_true", help="preview selected roster IDs without writing")
    parser.add_argument("--output", type=Path, help="directory for complete staged template copies")
    parser.add_argument("--template", action="append", dest="template_ids", help="limit staging to a template ID")
    args = parser.parse_args()
    if not args.check and args.output is None:
        parser.error("--output is required unless --check is used")

    root = Path(__file__).resolve().parents[1]
    registry = json.loads((root / "registry.json").read_text(encoding="utf-8"))
    catalog_path = root / "web-builder" / "public" / "ai-tadpole-catalog.json"
    catalog = json.loads(catalog_path.read_text(encoding="utf-8"))
    for agent in catalog:
        agent["_words"] = get_words(
            " ".join([agent["name"], agent["description"], agent.get("departmentLabel", "")])
        )

    templates = [
        template
        for template in registry["templates"]
        if not args.template_ids or template["id"] in set(args.template_ids)
    ]
    if args.template_ids and len(templates) != len(set(args.template_ids)):
        known = {template["id"] for template in templates}
        missing = sorted(set(args.template_ids) - known)
        raise ValueError(f"Unknown template ID(s): {', '.join(missing)}")

    staging_root = ensure_safe_staging_root(root, args.output) if args.output else None
    for template in templates:
        chosen = selected_agents(template, catalog)
        print(f"{template['id']}: {', '.join(agent['id'] for agent in chosen)}")
        if args.check:
            continue

        source_root = (root / template["path"]).resolve()
        target_root = (staging_root / template["path"]).resolve()
        target_root.relative_to(staging_root)
        if target_root.exists():
            raise FileExistsError(
                f"Staging target already exists: {target_root}. Choose an empty output directory."
            )
        shutil.copytree(source_root, target_root)

        staged_agents = target_root / "agents"
        shutil.rmtree(staged_agents)
        staged_agents.mkdir()
        roster: list[dict[str, Any]] = []
        for index, agent in enumerate(chosen):
            payload = agent_payload(agent)
            (staged_agents / f"{payload['id']}.json").write_text(
                json.dumps(payload, indent=2, ensure_ascii=False) + "\n",
                encoding="utf-8",
            )
            roster.append(
                {
                    "id": payload["id"],
                    "path": f"agents/{payload['id']}.json",
                    "supervisor": None,
                    "priority": "critical" if index == 0 else "normal",
                }
            )
        swarm_path = target_root / "swarm.json"
        swarm = json.loads(swarm_path.read_text(encoding="utf-8"))
        swarm["roster"] = roster
        swarm_path.write_text(json.dumps(swarm, indent=2, ensure_ascii=False) + "\n", encoding="utf-8")

    if staging_root:
        print(f"Staged {len(templates)} template(s) under {staging_root}")
        print("Registered templates were not modified.")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
