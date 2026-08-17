# AI-Tadpole-OS Consumer Compatibility Contract

This registry exists primarily to support [AI-Tadpole-OS](https://github.com/DDS-Solutions/AI-TadPole-OS). A registry-local cleanup is not considered correct if the consuming installer or runtime cannot load it.

The current audit is pinned to AI-Tadpole-OS commit [`275baff9505321c4f5b60cab26a7d57f9ff05a49`](https://github.com/DDS-Solutions/AI-TadPole-OS/tree/275baff9505321c4f5b60cab26a7d57f9ff05a49), reviewed on 2026-08-17. The detailed field-to-source mapping lives in [`COMPATIBILITY_MATRIX.md`](../COMPATIBILITY_MATRIX.md).

---

## Required Audit Before Implementation

Before changing a schema, validator, generated archive, migration, workflow rule, MCP layout, or knowledge format:

1. Inspect the AI-Tadpole-OS catalog client, installation route, runtime wire types, loaders, and relevant tests.
2. Record the exact consumer commit reviewed.
3. Classify the finding as a consumer incompatibility, registry defect, documentation mismatch, intentional legacy format, or upstream consumer defect.
4. Add a characterization test that fails for the compatibility problem.
5. Update the compatibility matrix if accepted fields, paths, defaults, aliases, or failure behavior changed.
6. Run every registry and builder gate before publication.

The pull request template records this checklist for future work.

## Operational File Behavior

| Asset | Behavior at the pinned consumer revision |
| --- | --- |
| `registry.json` | Used by the web store as an object containing `templates`. |
| `index.json` | Used by the Rust catalog/installer as a top-level template array. |
| `swarm.json` | Copied as template metadata; its roster, workflow, defaults, and MCP fields are not deserialized by the current installer. |
| `agents/*.json` | Every JSON file is copied and then deserialized as an engine agent. Invalid profiles can be silently skipped. |
| `workflows/*.md` | Copied into `directives` and scanned for prompt use. The parser accepts any `##` or `###` heading as a step boundary. |
| `mcps.json` | Only the root template file is read. It must contain an `mcpServers` object. `swarm.json.required_mcps` paths are not followed. |
| `knowledge.json` | Expected to be an array whose entries contain non-empty `text` and `topic` values. |
| `knowledge/*.md` | The Markdown body itself is ingested, so it must contain the real playbook content rather than a dangling file reference. |

## Current Registry Alignment

- All 198 registered agent profiles contain required identity/status fields and explicit Google model configuration.
- Prose-only workflows were migrated to include consumer-visible execution headings.
- Optional empty MCP files use `{ "mcpServers": {} }` rather than an unparseable empty object.
- Swarm Architect exports preserve agent-owned workflows, create a root MCP configuration, bundle relative connector assets, and store full OKF content.
- Migration checks are additive and idempotent; the older roster replacement tool writes only to a caller-selected staging directory.
- CI runs registry validation, characterization fixtures, builder lint/tests/build, and broad security scanning.

## Known Upstream Boundaries

Two issues require changes in AI-Tadpole-OS rather than another registry format change:

1. The installer copies template workflows to `directives`, while deterministic workflow execution loads from `data/workflows`.
2. The installer merges MCP configuration and then deletes the temporary clone, so MCP commands that depend on cloned server files cannot execute later.

The builder keeps exported MCP archives self-contained, but that does not remove the consumer's need to retain or relocate those assets. Do not describe remote file-backed MCP installation or deterministic workflow execution as fully operational until the pinned consumer behavior changes and is re-audited.

## Required Commands

```bash
python scripts/migrate_consumer_contract.py --check
python scripts/validate_template.py
python -m unittest discover -s tests -p "test_*.py"

cd web-builder
npm ci
npm run lint
npm run test
npm run build
```

Validation currently completes with zero errors and six documented warnings for preserved unreferenced legacy workflows.
