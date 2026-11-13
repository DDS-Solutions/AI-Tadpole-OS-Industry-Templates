# AI-Tadpole-OS Consumer Compatibility Contract

This registry supports the public [AI-Tadpole-OS](https://github.com/DDS-Solutions/AI-TadPole-OS) distribution (`v1.1.464`), with authoritative upstream implementation contracts pinned in [`COMPATIBILITY_MATRIX.md`](../COMPATIBILITY_MATRIX.md) and [`compatibility.lock.json`](../compatibility.lock.json).

The current read-only audit verified [DDS-Solutions/AI-TadPole-OS](https://github.com/DDS-Solutions/AI-TadPole-OS) Release `v1.1.464` at commit `2dfc14f1bc52b9da7acbdb27a00985aff0b6dfff` on 2026-11-13. See [`COMPATIBILITY_MATRIX.md`](../COMPATIBILITY_MATRIX.md) for field-to-source evidence.

## Required audit before implementation

Before changing a schema, validator, archive, migration, workflow, MCP layout, knowledge format, or security claim:

1. Inspect the AI-Tadpole-OS catalog route, installer, runtime types, loaders, security gates, and tests read-only.
2. Record the exact upstream commit.
3. Treat the pinned upstream contract as authoritative; do not silently diverge in registry schemas or builder exports.
4. Classify each issue as registry incompatibility, builder defect, documentation mismatch, intentional legacy format, or upstream defect.
5. Add or update characterization coverage before changing accepted behavior.
6. Run every registry, eval, lockfile, and builder gate before publication.

## Current alignment

- `index.json` matches the Rust catalog's top-level array (`81` public templates) and clone URL; `registry.json` indexes all `82` templates (`12` public `verified` flagships, `69` `starter` templates, and `1` `verified` internal test harness `testing/smoke-test`).
- All `246` template agent profiles provide the required six non-defaulted identity/status fields (`status: "idle"`), explicit `model_config` (`<= 800` char `system_prompt` free of prompt-injection sentinels), `skills`, `workflows`, `mcp_tools`, and `requires_oversight`, aligned to primary/planning slots on `ollama-cloud` (`gemma4:31b-cloud`) and execution slots on `ollama` (`gemma4:e4b`).
- Generated contract constants ([`schemas/capabilities-contract.json`](../schemas/capabilities-contract.json)) stay synchronized across Python (`scripts/_generated_contract.py`) and TypeScript (`web-builder/src/constants/_generatedContract.ts`) via `scripts/codegen_contract.py`.
- The Swarm Architect visual builder indexes a 342-persona global catalog with bounded prompts, domain guardrails, and core SMB operational competencies.
- Dual-Plane Sovereign Hierarchy is strictly enforced: Plane 1 (`Engine-Maintenance`) personas manage self-governance without committing Plane 2 tenant records, and Plane 2 (`Plane 2: SMB-Digital-Twin`) personas operate under the `FR-11` Permission Firewall (`execute_shell`, `shell`, `terminal`, and `delete_file` are blocked, and `requires_oversight: true` is mandatory).
- Consumer Mission Flight Recorder (`/v1/missions/:id/dossier`) and Mock SMB Digital Twin (`/v1/business/*`) operational flows are supported with dedicated dual-plane aware auditor, twin-operations, and A2A gateway personas.
- Legacy `run_command`/`write_to_file` labels were replaced by native AI-Tadpole-OS IDs (`execute_shell`, `write_file`, `delete_file`).
- Shell declarations include the runtime's required `shell` or `terminal` marker, and mutation/shell declarations require oversight.
- Workflows contain parser-visible `##`/`###` steps; OKF playbooks cannot be referenced as executable agent workflows.
- Root MCP configs use the accepted `mcpServers` shape (stdio or streamable HTTP `2026-07-28`), block `ENGINE_PRIVATE_ENV_VARS`, transport-owned HTTP headers, reserved `"gev"` keys, and `__` delimiters, and reject wildcard `server:*` grants.
- Swarm Architect preserves workflows/knowledge (`tags` as `string[]` in `knowledge.json`), emits deterministic `swarm.json` `id`, supervisor DAG / `flat_peer_swarm` flags, `mcp_tools`, and oversight fields, and places bundled MCP source under `skills/` where the installer copies it to `execution/`.

## Known upstream boundaries

- The hardened `v1.1.464` install transaction validates and stages all supported artifacts before writing (with rollback on failure), resolves MCP `env` / `${NAME}` placeholders (`Mcp_Secrets_Wizard_Modal`), enforces `mcp_tools` at tool advertisement and pre-execution, and uses `directives/` with `data/workflows` as legacy fallback.
- `knowledge.json` and `knowledge/*.md` power UI preview (`PlaybookPreview[]`) and are schema-validated; the hardened install transaction does not claim automatic install-time OKF knowledge-store ingestion.
- Automatic installation and verification of external MCP package dependencies (`connector-lock.json` / `npx` packages) remain operator/upstream responsibilities.

Do not describe these boundaries as solved by registry metadata.

## Required checks

```bash
python scripts/codegen_contract.py --check
python scripts/verify_compatibility_lock.py
python scripts/compile_prompt_fragments.py --check
python scripts/migrate_consumer_contract.py --check
python scripts/validate_template.py
python scripts/run_template_evals.py --check
python scripts/generate_llms_docs.py --check
python -m unittest discover -s tests -p "test_*.py"

cd web-builder
npm ci
npm run typecheck
npm run lint
npm run test
npm run build
```

Validation currently completes with zero errors and zero warnings across all templates, lockfiles, eval suites, generated contracts, and `web-builder` suites.
