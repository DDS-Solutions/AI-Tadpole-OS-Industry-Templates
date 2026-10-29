# Tadpole-OS Compatibility Matrix

This matrix records the private upstream contract audited before registry or Swarm Architect changes. The private source is authoritative; the public AI-Tadpole-OS repository is a downstream distribution and must not silently redefine this registry's contract.

- Authoritative source: `DDS-Solutions/TadPole-OS` / [DDS-Solutions/AI-TadPole-OS](https://github.com/DDS-Solutions/AI-TadPole-OS)
- Consumer checkout discovery: portable via `--consumer-repo <path>` or `TADPOLE_OS_REPO_PATH` (no fixed local path assumed)
- Reviewed base revision: `16bef2d75951860d15dba32d9750acb69b097bba`
- Runtime hardening: fully integrated and verified in the authoritative repository checkout (Release v1.1.464+, including MCP 2026-07-28 streamable HTTP, decomposed `routes/templates/*` and `agent/types/*` submodules, `CapabilityMap` inverted index, `installed_manifest.json` lifecycle & uninstall/archive vault, namespace collision prefixing, and `ENGINE_PRIVATE_ENV_VARS` / transport header guards)
- Reviewed branch: `main`
- Audit date: 2026-10-29
- Public downstream: [DDS-Solutions/AI-TadPole-OS](https://github.com/DDS-Solutions/AI-TadPole-OS) (Release v1.1.464+, revision `16bef2d75951860d15dba32d9750acb69b097bba`, verified 2026-10-29; prior public baseline `bbcf0d4b001e6e2d0a9ffeebc71fb49f219cd61c`)

## Operational contract

| Registry asset | Upstream behavior at the pinned revision | Registry and builder rule |
| --- | --- | --- |
| `index.json` | `get_templates_catalog` (`routes/templates/catalog.rs`) fetches a top-level array from this repository and deserializes `id`, `name`, `description`, `repository_url`, `path`, `required_models`, and `required_skills`. | Keep the array shape and exact AI-Tadpole-OS-Industry-Templates clone URL. Keep IDs/paths synchronized with `registry.json`. |
| `registry.json` | Used by this repository's Swarm Architect and the host UI's `fetchTemplateRegistry` (`src/components/template_store/template_store_api.ts`) as an object with a `templates` array. | Preserve the object shape and parity with `index.json`. |
| `swarm.json` | Copied into `data/swarm_config/installed/{installed_id}/swarm.json` alongside `installed_manifest.json` (`InstalledSwarmSummary`). Also drives UI preview (`fetchSwarmConfig`) and local `.zip` import (`importDownloadedSwarmFile`). | Treat it as preview, install-manifest, and round-trip metadata. Emit deterministic `id` in builder exports. Requires `connector_ids` metadata when active MCP configuration is present. References must resolve. |
| `agents/*.json` | Every incoming agent file must be JSON and deserialize as `EngineAgent` (`agent/types/agent/wire.rs`) during preflight; invalid profiles abort before writes. Supports `overwrite`, `model_override`, and optional `namespace` prefixing (`{namespace}__{id}`). | Require the six non-defaulted identity/status strings, `id` of 1–64 ASCII `[A-Za-z0-9_-]` characters, and explicit model configuration (`<= 800` char `system_prompt` free of prompt-injection sentinels) before publication. |
| Agent lifecycle | Runtime data, recruitment guidance, and oversight polling use `idle` as the available initial state. `ready` is not a native lifecycle state. | Emit `status: "idle"`. |
| Agent model | `model_config` accepts snake_case aliases and optional `model_override` (`provider`, `model_id`, `base_url`) during install/import, including `google`, `ollama-cloud` (`gemma4:31b-cloud`), `ollama` (`gemma4:e4b`), `openai`, `anthropic`, `groq`, `mistral`, `deepseek`, and `openrouter`. | Emit `model_config.provider`, `model_config.model_id`, and `model_config.system_prompt`. |
| Agent capabilities | Runtime tool IDs include `read_file`, `write_file`, `delete_file`, `grep_search`, `execute_shell`, and `search_web`. Shell execution checks for a `shell` or `terminal` marker; `ZeroTrustGuard::mint_token` rejects any skill containing glob/wildcard characters. | Reject legacy `run_command` and `write_to_file`. Represent shell intent as `execute_shell` plus `shell`; force oversight for mutation/shell declarations. |
| `mcp_tools` and oversight | `mcp_tools` is deserialized, persisted, included in the tool-cache key, and enforced for external MCP tools both during advertisement and immediately before execution. Empty declarations grant no external MCP tools. | Emit only exact canonical `server:tool` declarations. Server-wide wildcards (`server:*`) are rejected. Mutating (`write` / `execute`) tool grants force `requires_oversight: true`. |
| `workflows/*.md` | Markdown is scanned by `skillspector::scan_markdown_content` (rejects risk score `>= 50`, including `<<<`/`>>>` boundary spoofing and system override phrases) and copied to `directives/` (with `data/workflows` as legacy fallback). | Require at least one executable `##`/`###` heading, filename-safe workflow IDs, and zero prompt-injection sentinels. OKF playbooks cannot be referenced as executable agent workflows. |
| `mcps.json` | The root file is validated and merged as `{ "mcpServers": { ... } }`. Blocks `ENGINE_PRIVATE_ENV_VARS` overrides/references, transport-owned HTTP headers (`host`, `content-type`, `accept`, `mcp-protocol-version`, `mcp-method`, `mcp-name`, `origin`, `mcp-session-id`, `last-event-id`, `mcp-param-*`), invalid RFC 9110 header tokens, reserved `"gev"` profile hijacking, and double underscores `__` in server names. | Emit one root configuration. Commands, arguments, URLs, environment names, headers, and placeholders must pass the runtime policy. Every active server must have at least one exact agent grant. |
| File-backed MCP | Top-level reviewed skill source is scanned before any install write and copied to `execution`. MCP environment literals are applied; `${NAME}` placeholders resolve from the Tadpole process environment or post-install `Mcp_Secrets_Wizard_Modal` (`POST /v1/system/environment`). | Place reviewed bundled server source in `skills/`, reference its post-install `execution/` path, and provision declared environment variables locally. Remote HTTP servers require no bundled source. Bundled dependency requirements travel in `connector-lock.json`. |
| MCP discovery/authorization | The host initializes configured servers and advertises their actual tool names, descriptions, and input schemas using encoded runtime names. Stdio probes `server/discover` for 2026-07-28 with fallback to 2024-11-05 `initialize`. Streamable HTTP endpoints use stateless per-request `_meta`. External exposure and execution require the agent's `mcp_tools` declaration in addition to ACL/policy checks. | Exact `server:tool` selection is an active authorization gate. Mutating grants require explicit human oversight. Automatic connector dependency installation and transactional knowledge activation remain upstream operator boundaries. |
| `knowledge.json` | Fetched by the UI preview (`fetchKnowledgeBase` -> `PlaybookPreview[]`); the hardened install transaction does not claim knowledge-store ingestion; registry validation requires non-empty `text` and `topic`. | Treat knowledge as publication-validated content until a separately transactional knowledge activation API is defined. |
| `knowledge/*.md` | The current hardened install transaction does not claim knowledge-store ingestion. | Include real playbook content for preview/manual activation, not dangling references. |
| `skills/*` security gate | All supported top-level source and workflows are validated and scanned before the first write. Scan errors and scores at the rejection threshold fail closed. Later copy/configuration errors trigger rollback. | Allow reviewed executable source only under `skills/`; run registry validation, Bandit, and malware scanning before publication. |
| Registry lockfile | `compatibility.lock.json` pins the registry contract version and cryptographic SHA-256 hashes of critical contract files. The private runtime base revision is recorded in this matrix and lockfile. | Keep `compatibility.lock.json` synchronized via `python scripts/verify_compatibility_lock.py --generate`. |
| Smoke testing | `testing/smoke-test` serves as the canonical reference template validating catalog parsing, idle availability, workflow extraction, and MCP execution isolation across modern (2026-07-28) and legacy (2024-11-05) transports. | Maintain `testing/smoke-test` and `tests/test_smoke_template.py` as mandatory CI gates. |
| Lifecycle & Uninstall | Supports remote install (`POST /v1/engine/templates/install`), local bundle import (`POST /v1/engine/templates/import`), installed listing (`GET /v1/engine/templates/installed`), and transactional uninstall (`POST /v1/engine/templates/uninstall` with optional archival to `data/swarm_config/archive/`). | Maintain full structural parity between git-cloned templates and Swarm Architect `.zip` exports so both install paths produce identical `installed_manifest.json` records. |

## Toolchain and Build Environment Parity

The repository suite maintains an intentional version split between the primary Tadpole-OS host/runtime and the Industry-Templates independent web-builder artifact:

| Component | Node.js | TypeScript | ESLint | Vitest | Vite | React |
| --- | --- | --- | --- | --- | --- | --- |
| **AI-Tadpole-OS (Core / Host)** | `^22.22.2 \|\| ^24.15.0 \|\| >=26.0.0` | `~5.9.3` | `^10.13.0` | `^5.0.3` | `^8.3.3` | `^19.3.1` |
| **Industry-Templates (Web-Builder)** | `^22.0.0` | `~6.0.3` | `^10.13.0` | `^5.0.5` | `^8.3.5` | `^19.3.1` |

- **Design intent**: The `web-builder` is an isolated, client-side static application used for offline catalog browsing and custom bundle compilation. It operates independently of the host runtime environment and does not share dependencies with `AI-Tadpole-OS`.
- **Ecosystem boundaries**: Changes to either package manifest must not introduce coupled version constraints or assume unified workspace hoisting.

## Upstream source anchors

- Catalog, installer, local importer, and uninstaller: `server-rs/src/routes/templates/{mod.rs, catalog.rs, dto.rs, installed.rs, mcp_store.rs, naming.rs, source.rs, validate.rs}`
- Agent wire & entity types: `server-rs/src/agent/types/agent/{mod.rs, authority.rs, entity.rs, wire.rs}` and `server-rs/src/routes/agent/crud.rs`
- Model configuration & providers: `server-rs/src/agent/types/model/{mod.rs, capabilities.rs, config.rs, provider.rs}`
- Runtime tool IDs & ZeroTrustGuard: `server-rs/src/agent/runner/tools/{manifest.rs, policy.rs, capability/guard.rs}`
- Capability/toolbelt behavior & recruitment index: `server-rs/src/agent/runner/synthesis/toolbelt.rs`, `server-rs/src/agent/capability_map.rs`, `server-rs/src/agent/capability_matrix.rs`, `server-rs/src/agent/runner/swarm/recruitment.rs`
- Workflow parser/loader: `server-rs/src/agent/workflows.rs`
- MCP configuration/client: `server-rs/src/agent/mcp/{mod.rs, config.rs, host.rs, authz.rs, native.rs, client/mod.rs, client/stdio.rs, client/http/mod.rs, client/http/headers.rs, client/http/client.rs, client/http/sse.rs}`
- Knowledge request: `server-rs/src/agent/knowledge_store/types.rs`
- Security scan: `server-rs/src/security/skillspector.rs`
- Frontend Template & MCP Store: `src/pages/{Template_Store.tsx, MCP_Store.tsx}`, `src/components/template_store/{types.ts, constants.ts, template_store_api.ts, template_importer.ts, use_template_install.ts, use_template_preview.ts, use_template_registry.ts, mcp_placeholders.ts, Template_Preview_Modal.tsx, Model_Resolver_Select.tsx, Installed_Swarms_List.tsx, Uninstall_Swarm_Modal.tsx, Mcp_Secrets_Wizard_Modal.tsx}`, `src/components/mcp_store/{types.ts, mcp_store_api.ts, MCP_Card.tsx}`, `src/stores/{department_store.ts, workspace_store.ts}`, `src/services/system/engine_api.ts`

## Finding classification

| Finding | Classification | Resolution |
| --- | --- | --- |
| Registry agents and catalogs used `ready`, `run_command`, and `write_to_file`. | Registry incompatibility | Migrated all profiles/catalogs to `idle`, `execute_shell` + `shell`, and `write_file`; validator and tests enforce it. |
| Agent risk/MCP intent was implicit or absent from builder exports. | Builder gap | Agent editor/export now includes capability IDs, `mcp_tools`, and `requires_oversight`; dangerous declarations force oversight. |
| Builder put bundled MCP servers under a path deleted after install. | Builder incompatibility | Export source under `skills/` and reference its copied `execution/` path. |
| Runtime did not resolve MCP config placeholders, use `mcp_tools` as a filter, or discover real external tools. | Upstream defect | Fixed in the reviewed working tree with placeholder resolution, dual-point authorization enforcement, real schema discovery, bounded concurrency, and witness tests. |
| Installer workflow destination differed from deterministic loader source. | Upstream defect | Fixed by making `directives` canonical with a filename-safe legacy fallback and witness tests. |
| Installer could partially install and still report generic success. | Upstream reliability/security defect | Fixed with validate-before-write, recoverable create/replace operations, collision rejection, source-revision capture, structured receipts, and rollback witnesses. |
| Connector Python dependencies were implicit and mutable. | Dependency provenance gap | Fixed with exact direct dependency manifests plus package version, artifact, authoritative source, and SHA-256 provenance; validator/tests enforce parity. |
| Upstream upgraded MCP to 2026-07-28 streamable HTTP transport with decomposed modules. | Upstream enhancement | Updated template validator, web-builder types/helpers, smoke server, and test suite to support both stdio and HTTP transports, dual probe discovery, and header placeholder resolution. |
| Toolchain version split was undocumented across repositories. | Ecosystem clarity | Documented intentional version split between host runtime and template web-builder in `COMPATIBILITY_MATRIX.md`. |
| Upstream decomposed `routes/templates/*`, `agent/types/*`, and `agent/mcp/client/http/*`, and added `ENGINE_PRIVATE_ENV_VARS`, transport header guards, `skillspector` prompt-injection heuristics, local `.zip` import, and swarm uninstall/archive. | Upstream architecture & security hardening | Updated upstream source anchors, added `ENGINE_PRIVATE_ENV_VARS`, transport-owned HTTP header, reserved `gev` profile, 64-char agent ID, and prompt-injection checks to `validate_template.py` and `web-builder`, and emitted deterministic `id` in `buildSwarmZip`. |

## Re-audit trigger

Repeat the cross-repository audit and update this file before changing accepted fields, paths, archive layout, capability IDs, security policy, or the pinned upstream revision.
