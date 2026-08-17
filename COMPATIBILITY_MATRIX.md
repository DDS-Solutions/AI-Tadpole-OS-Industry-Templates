# Tadpole-OS Compatibility Matrix

This matrix records the private upstream contract audited before registry or Swarm Architect changes. The private source is authoritative; the public AI-Tadpole-OS repository is a downstream distribution and must not silently redefine this registry's contract.

- Authoritative source: private `DDS-Solutions/TadPole-OS`
- Read-only checkout reviewed: `D:\TadpoleOS-Dev`
- Reviewed revision: `d328fcd43eca185f4672be313774b81982253973`
- Reviewed branch: `main`
- Audit date: 2026-08-17
- Public downstream: [DDS-Solutions/AI-TadPole-OS](https://github.com/DDS-Solutions/AI-TadPole-OS)

## Operational contract

| Registry asset | Upstream behavior at the pinned revision | Registry and builder rule |
| --- | --- | --- |
| `index.json` | `get_templates_catalog` fetches a top-level array from this repository and deserializes `id`, `name`, `description`, `repository_url`, `path`, `required_models`, and `required_skills`. | Keep the array shape and exact AI-Tadpole-OS-Industry-Templates clone URL. Keep IDs/paths synchronized with `registry.json`. |
| `registry.json` | Used by this repository's Swarm Architect as an object with a `templates` array. It is not the Rust catalog endpoint payload. | Preserve the object shape and parity with `index.json`. |
| `swarm.json` | Copied into the installed-template folder; its roster/default/MCP references are not used to drive installation. | Treat it as preview and round-trip metadata. References must still resolve for registry quality. |
| `agents/*.json` | Files are copied, then every JSON file in the global agent folder is deserialized as `EngineAgent`; invalid profiles can be skipped while installation still succeeds. | Require the six non-defaulted identity/status strings and explicit model configuration before publication. |
| Agent lifecycle | Runtime data, recruitment guidance, and oversight polling use `idle` as the available initial state. `ready` is not a native lifecycle state. | Emit `status: "idle"`. |
| Agent model | `model_config` accepts snake_case aliases. Provider/model mismatch can be corrected at run setup, but explicit values avoid ambiguity. | Emit `model_config.provider`, `model_config.model_id`, and `model_config.system_prompt`. |
| Agent capabilities | Runtime tool IDs include `read_file`, `write_file`, `grep_search`, `execute_shell`, and `search_web`. Shell execution also checks for a `shell` or `terminal` marker. | Reject legacy `run_command` and `write_to_file`. Represent shell intent as `execute_shell` plus `shell`; force oversight for mutation/shell declarations. |
| `mcp_tools` and oversight | `mcp_tools` is deserialized and persisted. `requires_oversight` is enforced by the runner. The current toolbelt does not use `mcp_tools` to filter MCP exposure. | Export both fields explicitly. Treat `mcp_tools` as forward-compatible metadata, not a current authorization guarantee. |
| `workflows/*.md` | Markdown is copied to `directives`. The parser accepts `##`/`###` headings, but deterministic `load_workflow` reads `data/workflows`. | Require at least one executable heading. Track the install/load directory mismatch upstream. |
| `mcps.json` | Only the root file is merged and it must deserialize as `{ "mcpServers": { ... } }`. | Emit one root configuration. Commands and arguments must pass the registry launcher/shell policy. |
| File-backed MCP | The temporary clone is deleted. Top-level `skills/*.py|js|ts|json` files are scanned and copied to `execution`. MCP `env` values are parsed but not applied by the client; child processes only inherit the Tadpole process environment. | Swarm Architect places reviewed bundled server source in `skills/` and points MCP args at its post-install `execution/` path. Operators must install dependencies and configure the Tadpole process environment. |
| MCP discovery/authorization | The pinned MCP toolbelt advertises server placeholders and routes exposure through existing runtime/ACL behavior; `mcp_tools` is not the active filter. | Do not claim connector selection or `mcp_tools` alone grants, denies, or proves usable tools. |
| `knowledge.json` | With vector memory enabled, entries deserialize as `AddKnowledgeRequest`; `text` and `topic` are required. Individual ingestion failures are warnings. | Require non-empty `text` and `topic`. |
| `knowledge/*.md` | Markdown bodies are ingested with optional frontmatter metadata. | Include real playbook content, not dangling references. |
| `skills/*` security gate | Supported top-level source is scanned with SkillSpector before copy. A reported score of 50+ aborts. Scan-call errors are logged and can continue; earlier writes are not rolled back. | Allow reviewed executable source only under `skills/`; run registry validation, Bandit, and malware scanning before publication. |
| Install result | Agent persistence, MCP parsing/writes, and knowledge ingestion can fail or skip while the endpoint returns success. | A successful HTTP response is not proof of complete installation. CI validation is mandatory. |

## Upstream source anchors

- Catalog and installer: `server-rs/src/routes/templates.rs`
- Agent wire type: `server-rs/src/agent/types/agent.rs`
- Model configuration: `server-rs/src/agent/types/model.rs`
- Runtime tool IDs: `server-rs/src/agent/runner/tools/manifest.rs`
- Capability/toolbelt behavior: `server-rs/src/agent/runner/synthesis/toolbelt.rs`
- Workflow parser/loader: `server-rs/src/agent/workflows.rs`
- MCP configuration/client: `server-rs/src/agent/mcp/mod.rs` and `server-rs/src/agent/mcp/client.rs`
- Knowledge request: `server-rs/src/agent/knowledge_store/types.rs`
- Security scan: `server-rs/src/security/skillspector.rs`

## Finding classification

| Finding | Classification | Resolution |
| --- | --- | --- |
| Registry agents and catalogs used `ready`, `run_command`, and `write_to_file`. | Registry incompatibility | Migrated all profiles/catalogs to `idle`, `execute_shell` + `shell`, and `write_file`; validator and tests enforce it. |
| Agent risk/MCP intent was implicit or absent from builder exports. | Builder gap | Agent editor/export now includes capability IDs, `mcp_tools`, and `requires_oversight`; dangerous declarations force oversight. |
| Builder put bundled MCP servers under a path deleted after install. | Builder incompatibility | Export source under `skills/` and reference its copied `execution/` path. |
| Runtime does not apply MCP config `env`, use `mcp_tools` as a filter, or fully discover external tools. | Upstream defect | Document accurately; do not manufacture a registry-only authorization claim. |
| Installer workflow destination differs from deterministic loader source. | Upstream defect | Preserve parser-compatible workflow content and track upstream. |
| Installer can partially install and still report success. | Upstream reliability/security defect | Keep publication gates blocking and require an upstream stage/validate/commit transaction. |
| MCP npm dependencies are mutable or may be placeholders. | Dependency provenance gap | Verify and pin each connector independently before production use. |

## Re-audit trigger

Repeat the cross-repository audit and update this file before changing accepted fields, paths, archive layout, capability IDs, security policy, or the pinned upstream revision.
