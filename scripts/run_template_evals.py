"""Deterministic structural and conformance verifier for template eval scenarios."""

from __future__ import annotations

import argparse
import json
import re
import sys
from pathlib import Path
from typing import Any

try:
    from scripts.validate_template import ValidationReport, _validate_against_schema, load_json
except ImportError:
    from validate_template import ValidationReport, _validate_against_schema, load_json

ROOT = Path(__file__).resolve().parents[1]
HEADING_RE = re.compile(r"^#{2,3}[ \t]+(.+?)\s*$", re.MULTILINE)


def verify_template_evals(root: Path, eval_path: Path, report: ValidationReport) -> None:
    template_root = eval_path.parent.parent
    rel_tpl = template_root.relative_to(root).as_posix()
    ctx = f"eval {rel_tpl}"
    try:
        payload: dict[str, Any] = load_json(eval_path)
    except (OSError, json.JSONDecodeError) as exc:
        report.error(ctx, f"cannot parse evals/scenarios.json: {exc}")
        return

    _validate_against_schema(root, "eval-v1.json", payload, ctx, report)
    swarm_path = template_root / "swarm.json"
    if not swarm_path.is_file():
        report.error(ctx, "missing swarm.json")
        return
    swarm = load_json(swarm_path)
    if payload.get("template_id") != swarm.get("id"):
        report.error(ctx, f"template_id {payload.get('template_id')!r} != swarm.json id {swarm.get('id')!r}")

    roster_ids = {r.get("id") for r in swarm.get("roster", []) if isinstance(r, dict)}
    agents_by_id: dict[str, dict[str, Any]] = {}
    all_caps: set[str] = set()
    any_oversight = False
    for r in swarm.get("roster", []):
        if isinstance(r, dict) and isinstance(r.get("path"), str):
            ap = template_root / r["path"]
            if ap.is_file():
                ag = load_json(ap)
                agents_by_id[ag["id"]] = ag
                all_caps.update(ag.get("skills", []))
                all_caps.update(ag.get("mcp_tools", []))
                if ag.get("requires_oversight"):
                    any_oversight = True

    workflow_headings: dict[str, list[str]] = {}
    wf_dir = template_root / "workflows"
    if wf_dir.is_dir():
        for wp in wf_dir.glob("*.md"):
            headings = HEADING_RE.findall(wp.read_text(encoding="utf-8"))
            workflow_headings[wp.stem] = headings
            workflow_headings[wp.name] = headings

    for idx, sc in enumerate(payload.get("scenarios", [])):
        s_ctx = f"{ctx} scenario[{idx}:{sc.get('scenario_id', '?')}]"
        entry_agent = sc.get("expected_entry_agent")
        if entry_agent not in roster_ids:
            report.error(s_ctx, f"expected_entry_agent {entry_agent!r} not in roster {sorted(roster_ids)}")
        for step in sc.get("expected_workflow_steps", []):
            wf = step.get("workflow", "")
            heading = step.get("step_heading", "")
            if wf not in workflow_headings:
                report.error(s_ctx, f"referenced workflow {wf!r} does not exist under workflows/")
            elif not any(heading.lower() in h.lower() for h in workflow_headings[wf]):
                report.error(s_ctx, f"workflow {wf!r} has no heading matching {heading!r}")
        for cap in sc.get("expected_skills_or_mcp_tools", []):
            if cap not in all_caps:
                report.error(s_ctx, f"expected capability/MCP tool {cap!r} is not declared on any roster agent")
        if sc.get("requires_oversight_triggered") and not any_oversight:
            report.error(s_ctx, "requires_oversight_triggered is true, but no roster agent declares requires_oversight: true")


def run_eval_suite(root: Path = ROOT) -> ValidationReport:
    report = ValidationReport()
    eval_files = sorted(root.glob("*/*/evals/scenarios.json"))
    if not eval_files:
        report.error("evals", "no template evals/scenarios.json fixtures found")
        return report
    for eval_path in eval_files:
        verify_template_evals(root, eval_path, report)
    return report


def main(argv: list[str] | None = None) -> int:
    parser = argparse.ArgumentParser(description="Verify declarative template eval scenarios.")
    parser.add_argument("--check", action="store_true", help="Exit non-zero if any eval contract fails.")
    parser.parse_args(argv)

    report = run_eval_suite(ROOT)
    eval_count = len(list(ROOT.glob("*/*/evals/scenarios.json")))
    for warning in report.warnings:
        print(f"WARNING: {warning}")
    for error in report.errors:
        print(f"ERROR: {error}")
    print(f"Template eval suite ({eval_count} template(s)): {len(report.errors)} error(s), {len(report.warnings)} warning(s).")
    return 1 if report.errors else 0


if __name__ == "__main__":
    sys.exit(main())

