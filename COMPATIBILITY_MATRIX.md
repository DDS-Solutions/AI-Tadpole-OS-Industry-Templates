# Tadpole-OS Compatibility Matrix

This matrix records the private upstream contract audited before registry or Swarm Architect changes. The private source is authoritative; the public AI-Tadpole-OS repository is a downstream distribution and must not silently redefine this registry's contract.

- Authoritative source: private `DDS-Solutions/TadPole-OS`
- Read-only checkout reviewed: `D:\TadpoleOS-Dev`
- Reviewed base revision: `7fc749fe11d6e7dd05c24b041e4bcaf0e93c0227`
- Runtime hardening: fully integrated and verified in the authoritative repository checkout
- Reviewed branch: `main`
- Audit date: 2026-09-01
- Public downstream: [DDS-Solutions/AI-TadPole-OS](https://github.com/DDS-Solutions/AI-TadPole-OS)

## Operational contract

| Registry asset | Upstream behavior at the pinned revision | Registry and builder rule |
| --- | --- | --- |
| `index.json` | `get_templates_catalog` fetches a top-level array from this repository and deserializes `id`, `name`, `description`, `repository_url`, `path`, `required_models`, and `required_skills`. | Keep the array shape and exact AI-Tadpole-OS-Industry-Templates clone URL. Keep IDs/paths synchronized with `registry.json`. |
| `registry.json` | Used by this repository's Swarm Architect as an object with a `templates` array. It is not the Rust catalog endpoint payload. | Preserve the object shape and parity with `index.json`. |
| `swarm.json` | Copied into the installed-template folder; its roster/default/MCP references are not used to drive installation. | Treat it as preview and round-trip metadata. Requires `connector_ids` metadata when active MCP configuration is present. References must resolve. |
| `agents/*.json` | Every incoming agent file must be JSON and deserialize as `EngineAgent` during preflight; invalid profiles abort before writes. Valid files are copied with create-only semantics for registry discovery/activation. | Require the six non-defaulted identity/status strings and explicit model configuration before publication. |
| Agent lifecycle | Runtime data, recruitment guidance, and oversight polling use `idle` as the available initial state. `ready` is not a native lifecycle state. | Emit `status: "idle"`. |
| Agent model | `model_config` accepts snake_case aliases. Provider/model mismatch can be corrected at run setup, but explicit values avoid ambiguity. | Emit `model_config.provider`, `model_config.model_id`, and `model_config.system_prompt`. |
| Agent capabilities | Runtime tool IDs include `read_file`, `write_file`, `grep_search`, `execute_shell`, and `search_web`. Shell execution also checks for a `shell` or `terminal` marker. | Reject legacy `run_command` and `write_to_file`. Represent shell intent as `execute_shell` plus `shell`; force oversight for mutation/shell declarations. |
| `mcp_tools` and oversight | `mcp_tools` is deserialized, persisted, included in the tool-cache key, and enforced for external MCP tools both during advertisement and immediately before execution. Empty declarations grant no external MCP tools. | Emit only exact canonical `server:tool` declarations. Server-wide wildcards (`server:*`) are rejected. Mutating (`write` / `execute`) tool grants force `requires_oversight: true`. |
| `workflows/*.md` | Markdown is copied to `directives`; deterministic loading reads `directives` first and retains `data/workflows` as a legacy fallback. Workflow names reject traversal syntax. | Require at least one executable `##`/`###` heading and filename-safe workflow IDs. OKF playbooks cannot be referenced as executable agent workflows. |
| `mcps.json` | The root file is validated and merged as `{ "mcpServers": { ... } }`. Existing server-name collisions fail closed; the merged configuration is committed with backup/restore semantics. | Emit one root configuration. Commands, arguments, environment names, and placeholders must pass the runtime policy. Every active server must have at least one exact agent grant. |
| File-backed MCP | Top-level reviewed skill source is scanned before any install write and copied to `execution`. MCP environment literals are applied; `${NAME}` placeholders resolve from the Tadpole process environment; missing or `CONFIGURE_LOCALLY` values fail transparently before spawn. | Place reviewed bundled server source in `skills/`, reference its post-install `execution/` path, and provision declared environment variables locally. Bundled dependency requirements travel in `connector-lock.json`. Dependency installation remains an operator responsibility. |
| MCP discovery/authorization | The host initializes configured servers and advertises their actual tool names, descriptions, and input schemas using encoded runtime names. Discovery is concurrent and time-bounded. External exposure and execution require the agent's `mcp_tools` declaration in addition to ACL/policy checks. | Exact `server:tool` selection is an active authorization gate. Mutating grants require explicit human oversight. Automatic connector dependency installation and transactional knowledge activation remain upstream operator boundaries. |
| `knowledge.json` | The current hardened install transaction does not claim knowledge-store ingestion; registry validation still requires non-empty `text` and `topic`. | Treat knowledge as publication-validated content until a separately transactional knowledge activation API is defined. |
| `knowledge/*.md` | The current hardened install transaction does not claim knowledge-store ingestion. | Include real playbook content for preview/manual activation, not dangling references. |
| `skills/*` security gate | All supported top-level source and workflows are validated and scanned before the first write. Scan errors and scores at the rejection threshold fail closed. Later copy/configuration errors trigger rollback. | Allow reviewed executable source only under `skills/`; run registry validation, Bandit, and malware scanning before publication. |
| Registry lockfile | `compatibility.lock.json` pins the registry contract version and cryptographic SHA-256 hashes of critical contract files. The private runtime base revision is recorded in this matrix until an owner commit exists. | Keep `compatibility.lock.json` synchronized via `python scripts/verify_compatibility_lock.py --generate`. |
| Smoke testing | `testing/smoke-test` serves as the canonical reference template validating catalog parsing, idle availability, workflow extraction, and MCP execution isolation. | Maintain `testing/smoke-test` and `tests/test_smoke_template.py` as mandatory CI gates. |
| Install result | Installation preflights all filesystem assets, uses create-only ordinary writes plus atomic MCP replacement, and rolls back prior writes on failure. Success includes the cloned revision and exact planned/installed counts for agents, workflows, skills, swarm manifest, and MCP servers. | Treat the structured receipt plus CI validation as evidence for the covered installation assets. |

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
| Runtime did not resolve MCP config placeholders, use `mcp_tools` as a filter, or discover real external tools. | Upstream defect | Fixed in the reviewed working tree with placeholder resolution, dual-point authorization enforcement, real schema discovery, bounded concurrency, and witness tests. |
| Installer workflow destination differed from deterministic loader source. | Upstream defect | Fixed by making `directives` canonical with a filename-safe legacy fallback and witness tests. |
| Installer could partially install and still report generic success. | Upstream reliability/security defect | Fixed with validate-before-write, recoverable create/replace operations, collision rejection, source-revision capture, structured receipts, and rollback witnesses. |
| Connector Python dependencies were implicit and mutable. | Dependency provenance gap | Fixed with exact direct dependency manifests plus package version, artifact, authoritative source, and SHA-256 provenance; validator/tests enforce parity. |

## Re-audit trigger

Repeat the cross-repository audit and update this file before changing accepted fields, paths, archive layout, capability IDs, security policy, or the pinned upstream revision.
