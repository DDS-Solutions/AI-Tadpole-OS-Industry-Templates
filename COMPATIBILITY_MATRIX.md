# AI-Tadpole-OS Compatibility Matrix

This matrix records the consumer contract audited before remediation work began.
It is intentionally tied to one immutable consumer revision so later changes can
be reviewed as contract changes instead of silently redefining this registry.

- Consumer: [DDS-Solutions/AI-TadPole-OS](https://github.com/DDS-Solutions/AI-TadPole-OS)
- Reviewed revision: [`275baff9505321c4f5b60cab26a7d57f9ff05a49`](https://github.com/DDS-Solutions/AI-TadPole-OS/tree/275baff9505321c4f5b60cab26a7d57f9ff05a49)
- Reviewed branch at the time of audit: `main`
- Audit date: 2026-08-17

## Operational contract

| Registry asset | Consumer behavior at the pinned revision | Registry rule |
| --- | --- | --- |
| `registry.json` | The web template store fetches an object with a `templates` array. | Keep `registry.json` object-shaped and keep it synchronized with `index.json`. |
| `index.json` | The Rust installer fetches a top-level array, locates the requested template path, then clones the registry repository. | Keep `index.json` array-shaped and ensure IDs and paths agree with `registry.json`. |
| `swarm.json` | The installer copies it into the installed-template folder but does not deserialize its roster, defaults, workflow, or MCP fields. | Treat the manifest as catalog/round-trip metadata. Do not assume its references cause installation. |
| `agents/*.json` | Every file in the template's `agents` directory is copied into the global agent directory. Each is deserialized as `EngineAgent`; invalid files are silently skipped. | Require all `EngineAgentWire` fields and accepted model configuration before publication. |
| Agent identity | `id`, `name`, `role`, `department`, `description`, and `status` are required strings. | Emit all six fields. Use `status: "ready"` for installable registry agents. |
| Agent model | `model_config.provider` is required when `model_config` is present. `model_id` has a consumer default, but an explicit ID avoids provider/model ambiguity. A top-level unknown model string falls back to the OpenAI provider. | Emit `model_config.provider`, `model_config.model_id`, and `model_config.system_prompt`. Current registry defaults use provider `google`. |
| Agent capabilities | `skills` and `workflows` default to empty arrays. | Preserve both arrays during import/export. Validate every workflow reference. |
| `workflows/*.md` | All Markdown files are copied to `directives` and scanned into the prompt registry. The deterministic workflow loader, however, looks in `data/workflows`, so installed template workflows are not currently available to that execution path. Its parser accepts any `##` or `###` heading as a step boundary. | Require at least one level-2 or level-3 heading for parser compatibility. Prefer `## Step N: Name` as the registry house style. Track the install/load directory mismatch as a consumer defect. |
| `mcps.json` | Only a root file at `<template>/mcps.json` is read. It must deserialize as `{ "mcpServers": { ... } }`; invalid or absent configuration is silently ignored. `swarm.json.required_mcps` is not followed. The temporary clone is deleted after config merge, so commands that depend on files in that clone cannot execute later. | Bundle a valid root `mcps.json` and its relative assets so the archive is self-contained. Do not claim those assets execute through the current remote installer until the consumer retains or relocates them. |
| `knowledge.json` | With vector-memory enabled, it is parsed as an array of requests requiring `text` and `topic`. Parse and ingestion failures are silently ignored. | Require non-empty `text` and `topic` for every item. |
| `knowledge/*.md` | Markdown bodies are ingested as knowledge text; optional frontmatter contributes metadata. | Put actual playbook content in the body. Do not emit a reference to a workflow file that is absent from the archive. |
| Install result | File-copy and JSON failures for individual agents, MCP configuration, and knowledge ingestion can be ignored while the endpoint still returns success. | CI must validate archive contents before installation; a successful HTTP response alone is not proof of compatibility. |

## Consumer source anchors

- Template catalog and installation route: [`server-rs/src/routes/templates.rs`](https://github.com/DDS-Solutions/AI-TadPole-OS/blob/275baff9505321c4f5b60cab26a7d57f9ff05a49/server-rs/src/routes/templates.rs)
- Agent wire format: [`server-rs/src/agent/types/agent.rs`](https://github.com/DDS-Solutions/AI-TadPole-OS/blob/275baff9505321c4f5b60cab26a7d57f9ff05a49/server-rs/src/agent/types/agent.rs)
- Model configuration: [`server-rs/src/agent/types/model.rs`](https://github.com/DDS-Solutions/AI-TadPole-OS/blob/275baff9505321c4f5b60cab26a7d57f9ff05a49/server-rs/src/agent/types/model.rs)
- Agent compatibility tests: [`server-rs/src/agent/types/tests.rs`](https://github.com/DDS-Solutions/AI-TadPole-OS/blob/275baff9505321c4f5b60cab26a7d57f9ff05a49/server-rs/src/agent/types/tests.rs)
- Workflow parser and deterministic loader: [`server-rs/src/agent/workflows.rs`](https://github.com/DDS-Solutions/AI-TadPole-OS/blob/275baff9505321c4f5b60cab26a7d57f9ff05a49/server-rs/src/agent/workflows.rs)
- Directive/workflow scan path: [`server-rs/src/agent/script_skills.rs`](https://github.com/DDS-Solutions/AI-TadPole-OS/blob/275baff9505321c4f5b60cab26a7d57f9ff05a49/server-rs/src/agent/script_skills.rs)
- MCP wire format: [`server-rs/src/agent/mcp/mod.rs`](https://github.com/DDS-Solutions/AI-TadPole-OS/blob/275baff9505321c4f5b60cab26a7d57f9ff05a49/server-rs/src/agent/mcp/mod.rs)
- Knowledge request shape: [`server-rs/src/agent/knowledge_store/types.rs`](https://github.com/DDS-Solutions/AI-TadPole-OS/blob/275baff9505321c4f5b60cab26a7d57f9ff05a49/server-rs/src/agent/knowledge_store/types.rs)
- Web template-store contract: [`src/components/template_store/template_store_api.ts`](https://github.com/DDS-Solutions/AI-TadPole-OS/blob/275baff9505321c4f5b60cab26a7d57f9ff05a49/src/components/template_store/template_store_api.ts)

## Audit finding classification

| Finding | Classification | Resolution direction |
| --- | --- | --- |
| Registry agent files omit `status` and model provider information. | Consumer incompatibility | Migrate profiles and enforce the accepted wire format. |
| Swarm Architect exports agents without `department`, `description`, or `status`. | Consumer incompatibility | Repair archive generation and add unzip-based contract tests. |
| Swarm Architect emits MCP paths in `required_mcps` without a root config. | Consumer incompatibility | Bundle a root `mcps.json`; preserve unresolved connectors as an export error. |
| Imported agent-owned workflows are dropped. | Registry builder defect | Fetch, deduplicate, and preserve agent and global workflow references. |
| OKF Markdown contains only a missing workflow reference. | Consumer incompatibility | Store the playbook text in the knowledge Markdown body. |
| Validator requires `## Step` headings. | Documentation/validator mismatch | Accept the consumer's `##`/`###` minimum while retaining `## Step` as preferred style. |
| Installer copies workflows to `directives`, but deterministic execution loads `data/workflows`. | Consumer defect | Do not disguise this in the registry; raise it upstream and retain characterization coverage. |
| Installer deletes cloned MCP server assets after merging their configuration. | Consumer defect | Keep exported archives self-contained and require an upstream retention/relocation fix for end-to-end MCP execution. |
| Six manifests use legacy fields and string company sizes. | Intentional legacy drift pending migration | Preserve until tests establish a lossless manifest migration. Agent files still must satisfy the runtime wire format. |
| Installer can report success after silently skipping invalid content. | Consumer robustness gap | Make registry validation and archive tests publication gates; recommend upstream transactional/error-reporting work. |

## Re-audit trigger

Repeat Phase 0 and update this file before changing any accepted field, path,
archive layout, or validator rule, or whenever the pinned consumer revision is
advanced.
