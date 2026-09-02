# Tadpole-OS Consumer Compatibility Contract

This registry supports the public [AI-Tadpole-OS](https://github.com/DDS-Solutions/AI-TadPole-OS) distribution, but its authoritative implementation contract is the private `DDS-Solutions/TadPole-OS` source.

The current read-only audit used `D:\TadpoleOS-Dev` at commit `7fc749fe11d6e7dd05c24b041e4bcaf0e93c0227` on 2026-09-01. See [`COMPATIBILITY_MATRIX.md`](../COMPATIBILITY_MATRIX.md) for field-to-source evidence.

## Required audit before implementation

Before changing a schema, validator, archive, migration, workflow, MCP layout, knowledge format, or security claim:

1. Inspect the private Tadpole-OS catalog route, installer, runtime types, loaders, security gates, and tests read-only.
2. Record the exact upstream commit.
3. Treat the private source as authoritative and the public AI-Tadpole-OS repository as a downstream comparison.
4. Classify each issue as registry incompatibility, builder defect, documentation mismatch, intentional legacy format, or upstream defect.
5. Add or update characterization coverage before changing accepted behavior.
6. Run every registry and builder gate before publication.

## Current alignment

- `index.json` matches the Rust catalog's top-level array (68 public templates) and clone URL.
- All 208 agent profiles provide the required identity/model fields (`gemma4:31b`), start `idle`, and explicitly declare `mcp_tools` and `requires_oversight`.
- Legacy `run_command`/`write_to_file` labels were replaced by native Tadpole IDs.
- Shell declarations include the runtime's required `shell` marker, and mutation/shell declarations require oversight.
- Workflows contain parser-visible `##`/`###` steps.
- Root MCP configs use the accepted `mcpServers` shape.
- Swarm Architect preserves workflows/knowledge, emits exact capability and oversight fields, and places bundled MCP source where the installer copies it to `execution/`.

## Known upstream boundaries

- Deterministic workflow execution reads `data/workflows`, while installation copies template workflows to `directives`.
- Installation is not transactional and can return success after skipped content.
- MCP config `env` values are not applied to spawned clients; configure required variables in the AI-Tadpole-OS process environment.
- `mcp_tools` is persisted but is not the current toolbelt's active MCP authorization filter.
- External MCP discovery/execution and dependency installation remain upstream/operator responsibilities.

Do not describe these boundaries as solved by registry metadata.

## Required checks

```bash
python scripts/verify_compatibility_lock.py
python scripts/migrate_consumer_contract.py --check
python scripts/validate_template.py
python -m unittest discover -s tests -p "test_*.py"

cd web-builder
npm ci
npm run lint
npm run test
npm run build
```

Validation currently completes with zero errors and zero warnings across all templates, lockfiles, and smoke-test references.
