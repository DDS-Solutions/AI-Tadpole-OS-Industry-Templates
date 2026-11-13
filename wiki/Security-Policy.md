# The Sapphire Shield: Security Boundaries

This policy distinguishes controls enforced by this registry, declarations emitted by Swarm Architect, and runtime boundaries in AI-Tadpole-OS (`v1.1.464`).

The authoritative consumer review verified [DDS-Solutions/AI-TadPole-OS](https://github.com/DDS-Solutions/AI-TadPole-OS) Release `v1.1.464` at commit `2dfc14f1bc52b9da7acbdb27a00985aff0b6dfff`, reviewed read-only on `2026-11-13`. Re-audit upstream before changing a contract or promoting a security claim.

## Enforced by this registry

`scripts/validate_template.py` is a blocking admission gate. A registered package is rejected when any of these checks fail:

- Template assets must be UTF-8 JSON/Markdown. Reviewed JSON/Python/JavaScript/TypeScript source is permitted only directly under a template's `skills/`. Registry MCP blueprints may also contain reviewed text source.
- Symbolic links, unapproved/binary content, and files larger than 1 MB are prohibited.
- High-confidence private-key and provider-token patterns are rejected without printing the matched material.
- Sensitive MCP environment and HTTP header values must use explicit local placeholders such as `CONFIGURE_LOCALLY`, `YOUR_API_KEY_HERE`, or `${API_TOKEN}`.
- `mcps.json` blocks `ENGINE_PRIVATE_ENV_VARS` overrides/references, transport-owned HTTP headers (`host`, `content-type`, `accept`, `mcp-protocol-version`, `mcp-method`, `mcp-name`, `origin`, `mcp-session-id`, `last-event-id`, `mcp-param-*`), invalid RFC 9110 header tokens, reserved `"gev"` profile hijacking, and double underscores (`__`) in server names.
- MCP commands are limited to `node`, `npx`, `python`, and `python3`. Shell control syntax and inline interpreter/module execution are prohibited.
- Agent profiles must use 1–64 ASCII `[A-Za-z0-9_-]` IDs, start `idle`, use native AI-Tadpole-OS capability IDs, declare explicit `server:tool` (or canonicalized `mcp__server__tool`) `mcp_tools` without wildcards (`server:*` is forbidden), declare `requires_oversight`, and enable oversight for write/delete/shell or mutating MCP declarations.
- Shell-capable profiles must include both `execute_shell` and the runtime's `shell` or `terminal` marker.
- Dual-Plane Permission Firewall (`FR-11`): Agents designated under `"Plane 2: SMB-Digital-Twin"` cannot declare `execute_shell`, `shell`, `terminal`, or `delete_file` capabilities and must mandate `requires_oversight: true`.
- Prompt injection defense: Agent prompts (`<= 800` chars) and workflow Markdown are checked against upstream `skillspector.rs` heuristics (blocking instruction override phrases, `<<<`/`>>>` boundary spoofing, and oversight bypass attempts).
- Template paths/references, `swarm.json` `connector_ids` / `flat_peer_swarm` / supervisor DAG rules, eval scenarios, and agent, workflow, MCP, and `knowledge.json` (`tags` as `string[]`) payloads must satisfy the pinned schemas.
- Contract definitions and generated files (`schemas/capabilities-contract.json`, `scripts/_generated_contract.py`, `web-builder/src/constants/_generatedContract.ts`) must match cryptographic SHA-256 hashes recorded in `compatibility.lock.json`.

CI repeats validation, contract codegen, prompt-fragment, eval-suite (`run_template_evals.py --check`), docs (`generate_llms_docs.py --check`), and adversarial tests, runs pinned Bandit 1.9.4 across repository Python, checks cryptographic contract integrity, and scans the repository with ClamAV using pinned GitHub Actions. These controls reduce risk; scanners do not prove source harmless.

## Enforced by Swarm Architect

Archive generation blocks unsafe paths, normalized ID collisions, incomplete agent metadata, legacy capability IDs, incomplete shell declarations, missing or OKF-confused workflow references, prompts over 800 characters, missing connector configurations, malformed or wildcard `mcpTools`, invalid remote `serverKey` names (`gev`, `__`, or empty), and MCP server-name collisions.

Exports provide:

- deterministic `swarm.json` `id`, `connector_ids`, supervisor DAG / `flat_peer_swarm` fields, and `status: "idle"` with explicit model configuration;
- exact `skills`, `workflows`, canonicalized `mcp_tools`, and `requires_oversight` fields;
- forced oversight for declared write/delete/shell capabilities and mutating MCP grants;
- dual-plane permission enforcement: Plane 2 personas are prohibited from declaring shell/destructive tools, and forced to require human oversight;
- a root `mcps.json` without stale `Authorization` headers when credentials are cleared;
- bundled reviewed Python server source under `skills/`, with its launch argument rewritten to the installer's `execution/` destination; and
- full structured `knowledge.json` (`tags` as `string[]`) and `knowledge/*.md` text.

Connector assets are copied into the deployed builder release (`sync-catalog`) and read from that same-origin snapshot.

## Advisory builder check

The Phase 5 prompt capability panel is a keyword heuristic. It does not parse behavior, inspect connector source, grant permissions, or create an authorization transaction.

- No matches does not mean “zero privileges” or “safe.”
- A match requests operator review but does not guarantee an approval prompt.
- Exported `mcp_tools` is an active authorization filter in the pinned `v1.1.464` runtime, both during tool advertisement and immediately before execution.

## Upstream `v1.1.464` enforcement and remaining boundaries

At the pinned `v1.1.464` baseline (`2dfc14f1bc52b9da7acbdb27a00985aff0b6dfff`):

- The installer validates repository URLs and requested paths, skips symlinks, scans supported top-level `skills/` source and workflows with `skillspector` before writing, fails closed on scan errors or score `>= 50`, and rolls back on later write/config errors.
- MCP config `env` values are applied and `${NAME}` placeholders resolve from the host environment or post-install `Mcp_Secrets_Wizard_Modal`.
- Installed workflows write to `directives/` (matching the canonical loader with `data/workflows` legacy fallback).
- Uninstalling supports archival via `installed_manifest.json`.

Remaining operator/upstream boundaries:

- **Knowledge activation**: Hardened installation does not claim automatic install-time OKF knowledge-store ingestion (`knowledge.json` powers UI preview).
- **Dependency provenance**: Several connectors use `connector-lock.json` or unpinned `npx -y` package names; automatic dependency installation and upstream package immutability remain operator responsibilities outside the launcher policy.

## Re-audit rule

Any implementation change to schemas, validators, or security claims must start with a fresh read-only audit of upstream AI-Tadpole-OS and update [`COMPATIBILITY_MATRIX.md`](../COMPATIBILITY_MATRIX.md), [`compatibility.lock.json`](../compatibility.lock.json), and [Compatibility Contract](Compatibility-Contract.md).
