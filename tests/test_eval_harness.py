"""Regression and failure-mode tests for prompt fragment compilation, eval harness, codegen, and llms doc indexes."""

from __future__ import annotations

import json
import subprocess
import sys
import tempfile
import unittest
from pathlib import Path

from unittest import mock

ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT))

from scripts import codegen_contract
from scripts.compile_prompt_fragments import MAX_PROMPT_CHARS, check_or_apply_prompts, compile_prompt
from scripts.generate_llms_docs import check_or_apply_llms_docs
from scripts.run_template_evals import verify_template_evals
from scripts.validate_template import ValidationReport


class EvalAndCodegenHarnessTests(unittest.TestCase):
    def _run_script(self, script_rel: str, *args: str) -> subprocess.CompletedProcess[str]:
        return subprocess.run(
            [sys.executable, str(ROOT / script_rel), *args],
            cwd=str(ROOT),
            capture_output=True,
            text=True,
            check=False,
        )

    def test_codegen_contract_is_synchronized(self) -> None:
        proc = self._run_script("scripts/codegen_contract.py", "--check")
        self.assertEqual(0, proc.returncode, f"{proc.stdout}\n{proc.stderr}")

        contract = codegen_contract.load_contract()
        self.assertEqual(codegen_contract.render_python(contract), codegen_contract.PY_OUT.read_text(encoding="utf-8"))
        self.assertEqual(codegen_contract.render_typescript(contract), codegen_contract.TS_OUT.read_text(encoding="utf-8"))
        self.assertEqual(codegen_contract.render_mjs(contract), codegen_contract.MJS_OUT.read_text(encoding="utf-8"))

        with tempfile.TemporaryDirectory() as tmpdir:
            stale_py = Path(tmpdir) / "_generated_contract.py"
            stale_py.write_text("# drifted\n", encoding="utf-8")
            with mock.patch.object(codegen_contract, "ROOT", Path(tmpdir)), \
                    mock.patch.object(codegen_contract, "PY_OUT", stale_py):
                self.assertEqual(1, codegen_contract.run_codegen(check=True))

    def test_prompt_fragments_are_compiled_and_fresh(self) -> None:
        proc = self._run_script("scripts/compile_prompt_fragments.py", "--check")
        self.assertEqual(0, proc.returncode, f"{proc.stdout}\n{proc.stderr}")

    def test_compile_prompt_rejects_missing_fragment_traversal_and_overflow(self) -> None:
        with tempfile.TemporaryDirectory() as tmpdir:
            frag_dir = Path(tmpdir)
            (frag_dir / "long.md").write_text("X" * 795, encoding="utf-8")
            with self.assertRaises(FileNotFoundError):
                compile_prompt("Base prompt.", ["nonexistent.md"], fragments_dir=frag_dir)
            with self.assertRaises(ValueError):
                compile_prompt("Base prompt.", ["../outside.md"], fragments_dir=frag_dir)
            with self.assertRaises(ValueError) as ctx:
                compile_prompt("Too long prefix", ["long.md"], fragments_dir=frag_dir)
            self.assertIn(f"exceeds {MAX_PROMPT_CHARS}", str(ctx.exception))

    def test_check_or_apply_prompts_detects_and_repairs_drift(self) -> None:
        with tempfile.TemporaryDirectory() as tmpdir:
            tmproot = Path(tmpdir)
            (tmproot / "templates" / "fragments").mkdir(parents=True)
            (tmproot / "templates" / "fragments" / "guard.md").write_text("Verify facts before acting.", encoding="utf-8")
            agent_dir = tmproot / "legal" / "demo" / "agents"
            agent_dir.mkdir(parents=True)
            agent_file = agent_dir / "lead.json"
            agent_file.write_text(json.dumps({
                "id": "lead",
                "metadata": {
                    "base_system_prompt": "Review contracts.",
                    "prompt_includes": ["guard.md"],
                },
                "model_config": {
                    "provider": "ollama-cloud",
                    "model_id": "gemma4:31b-cloud",
                    "system_prompt": "Stale prompt.",
                },
            }), encoding="utf-8")

            self.assertEqual(["legal/demo/agents/lead.json"], check_or_apply_prompts(tmproot, apply=False))
            check_or_apply_prompts(tmproot, apply=True)
            self.assertEqual([], check_or_apply_prompts(tmproot, apply=False))
            recompiled = json.loads(agent_file.read_text(encoding="utf-8"))
            self.assertEqual("Review contracts. Verify facts before acting.", recompiled["model_config"]["system_prompt"])

    def test_template_eval_suites_pass(self) -> None:
        proc = self._run_script("scripts/run_template_evals.py", "--check")
        self.assertEqual(0, proc.returncode, f"{proc.stdout}\n{proc.stderr}")
        self.assertIn("0 error(s)", proc.stdout)

    def test_verify_template_evals_rejects_broken_scenarios(self) -> None:
        with tempfile.TemporaryDirectory() as tmpdir:
            tmproot = Path(tmpdir)
            (tmproot / "schemas").mkdir()
            (tmproot / "schemas" / "eval-v1.json").write_text(
                (ROOT / "schemas" / "eval-v1.json").read_text(encoding="utf-8"),
                encoding="utf-8",
            )
            tpl_dir = tmproot / "ops" / "demo"
            (tpl_dir / "agents").mkdir(parents=True)
            (tpl_dir / "workflows").mkdir()
            (tpl_dir / "evals").mkdir()
            (tpl_dir / "swarm.json").write_text(json.dumps({
                "id": "demo-ops",
                "roster": [{"id": "planner", "path": "agents/planner.json", "supervisor": None}],
            }), encoding="utf-8")
            (tpl_dir / "agents" / "planner.json").write_text(json.dumps({
                "id": "planner",
                "skills": ["read_file"],
                "mcp_tools": [],
                "requires_oversight": False,
            }), encoding="utf-8")
            (tpl_dir / "workflows" / "triage.md").write_text("# Triage\n\n## Step 1: Intake\nCheck.", encoding="utf-8")
            eval_path = tpl_dir / "evals" / "scenarios.json"
            eval_path.write_text(json.dumps({
                "version": "1.0.0",
                "template_id": "wrong-id",
                "scenarios": [{
                    "scenario_id": "bad-scenario",
                    "prompt": "Run full shell deployment",
                    "expected_entry_agent": "missing-agent",
                    "expected_workflow_steps": [{"workflow": "triage", "step_heading": "Nonexistent Step"}],
                    "expected_skills_or_mcp_tools": ["execute_shell"],
                    "requires_oversight_triggered": True,
                }],
            }), encoding="utf-8")

            report = ValidationReport()
            verify_template_evals(tmproot, eval_path, report)
            joined = "\n".join(report.errors)
            self.assertIn("template_id 'wrong-id'", joined)
            self.assertIn("not in roster", joined)
            self.assertIn("no heading matching", joined)
            self.assertIn("not declared on any roster agent", joined)
            self.assertIn("requires_oversight: true", joined)

    def test_llms_docs_match_registries_and_detect_drift(self) -> None:
        proc = self._run_script("scripts/generate_llms_docs.py", "--check")
        self.assertEqual(0, proc.returncode, f"{proc.stdout}\n{proc.stderr}")

        with tempfile.TemporaryDirectory() as tmpdir:
            tmproot = Path(tmpdir)
            (tmproot / "registry.json").write_text(json.dumps({
                "industries": ["Field Services"],
                "templates": [{
                    "id": "demo-ops",
                    "name": "Demo Ops",
                    "industry": "Field Services",
                    "description": "Dispatch support.",
                    "path": "field-services/demo",
                    "maturity": "verified",
                    "agents": ["planner"],
                }],
            }), encoding="utf-8")
            (tmproot / "mcp_registry.json").write_text(json.dumps({"connectors": []}), encoding="utf-8")
            (tmproot / "index.json").write_text(json.dumps([]), encoding="utf-8")
            (tmproot / "web-builder" / "public").mkdir(parents=True)
            (tmproot / "web-builder" / "public" / "ai-tadpole-catalog.json").write_text("[]", encoding="utf-8")

            self.assertEqual(["llms.txt", "llms-full.txt"], check_or_apply_llms_docs(tmproot, apply=False))
            check_or_apply_llms_docs(tmproot, apply=True)
            self.assertEqual([], check_or_apply_llms_docs(tmproot, apply=False))
            self.assertIn("demo-ops", (tmproot / "llms-full.txt").read_text(encoding="utf-8"))


if __name__ == "__main__":
    unittest.main()
