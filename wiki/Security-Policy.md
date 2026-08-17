# The Sapphire Shield: Security Boundaries

This policy distinguishes controls enforced by this registry, declarations emitted by Swarm Architect, and limitations in the private Tadpole-OS installer/runtime.

The authoritative consumer review is the private `DDS-Solutions/TadPole-OS` checkout at `D:\TadpoleOS-Dev`, commit `d328fcd43eca185f4672be313774b81982253973`, reviewed read-only on 2026-08-17. The public [AI-Tadpole-OS](https://github.com/DDS-Solutions/AI-TadPole-OS) repository is downstream. Re-audit private upstream before changing a contract or promoting a security claim.

## Enforced by this registry

`scripts/validate_template.py` is a blocking admission gate. A registered package is rejected when any of these checks fail:

- Template assets must be UTF-8 JSON/Markdown. Reviewed JSON/Python/JavaScript/TypeScript source is permitted only directly under a template's `skills/`. Registry MCP blueprints may also contain reviewed text source.
- Symbolic links, unapproved/binary content, and files larger than 1 MB are prohibited.
- High-confidence private-key and provider-token patterns are rejected without printing the matched material.
- Sensitive MCP environment values must be explicit local placeholders such as `CONFIGURE_LOCALLY`, `YOUR_API_KEY_HERE`, or `${API_TOKEN}`.
- MCP commands are limited to `node`, `npx`, `python`, and `python3`. Shell control syntax and inline interpreter/module execution are prohibited.
- Agent profiles must start `idle`, use native Tadpole capability IDs, declare `mcp_tools` and `requires_oversight`, and enable oversight for write/delete/shell declarations.
- Shell-capable profiles must include both `execute_shell` and the runtime's `shell` or `terminal` marker.
- Template paths/references and agent, workflow, MCP, and knowledge payloads must satisfy the pinned contract.

CI repeats validation and adversarial tests, runs pinned Bandit 1.9.4 over connector and template-skill Python, and scans the repository with ClamAV. These controls reduce risk; scanners do not prove source harmless.

## Enforced by Swarm Architect

Archive generation blocks unsafe paths, normalized ID collisions, incomplete agent metadata, legacy capability IDs, incomplete shell declarations, missing workflow references, prompts over 800 characters, missing connector configurations, and MCP server-name collisions.

Exports provide:

- `status: "idle"` and explicit model configuration;
- exact `skills`, `workflows`, `mcp_tools`, and `requires_oversight` fields;
- forced oversight for declared write/delete/shell capabilities;
- a root `mcps.json`;
- bundled reviewed Python server source under `skills/`, with its launch argument rewritten to the installer's `execution/` destination; and
- full structured/Markdown knowledge text.

Connector assets are copied into the deployed builder release and read from that same-origin snapshot.

## Advisory builder check

The Phase 5 prompt capability panel is a keyword heuristic. It does not parse behavior, inspect connector source, grant permissions, or create an authorization transaction.

- No matches does not mean “zero privileges” or “safe.”
- A match requests operator review but does not guarantee an approval prompt.
- Exported `mcp_tools` is a declaration; the pinned runtime stores it but does not currently use it as its active MCP filter.

## Private upstream enforcement and limitations

The pinned installer validates the public repository URL and requested path, skips symbolic links, refuses overwrites for agents/workflows/skills, scans supported top-level `skills/` source with SkillSpector, and rejects a reported risk score of 50 or more.

These are not whole-installation guarantees:

- Agents and workflows are written before the skill scan; rejection does not roll back earlier writes.
- A scan-call error is logged and installation can continue.
- Agents, workflows, knowledge, MCP configuration, nested files, and unsupported file types do not receive the same SkillSpector gate.
- Agent persistence, MCP parsing/writes, and knowledge ingestion can be skipped while the endpoint returns success.
- The temporary clone is deleted after installation.
- MCP config `env` is parsed but not applied to the spawned process. Child connectors only inherit the Tadpole OS process environment.
- Connector dependencies are not installed.
- The current toolbelt does not use `mcp_tools` as the active authorization filter and does not fully discover external MCP tools.
- Most static tool exposure is governed by runtime ACL/safe-mode logic rather than a strict one-to-one `skills` membership filter; filesystem and shell capability checks are special cases.

Swarm Architect's `skills/` → `execution/` packaging prevents bundled server source from disappearing with clone cleanup, but it does not solve the environment, dependency, discovery, or authorization limitations.

## Dependency boundary

Several accepted templates invoke unpinned `npx -y` package names. The launcher policy blocks alternate executables, inline code, and shell composition; it does not establish package existence, provenance, immutability, or safety. Each connector must be independently verified and pinned before production use.

## Required upstream work

Private Tadpole-OS should complete these items before corresponding claims become “enforced”:

1. Stage and validate all artifacts before writing, then commit atomically or roll back.
2. Scan every executable/behavior-bearing artifact recursively and fail closed on scanner errors or malformed results.
3. Return a structured receipt for installed, skipped, rejected, and rolled-back artifacts.
4. Make declared capability/MCP scopes part of one validated runtime authorization model.
5. Apply MCP environment configuration safely, install or verify dependencies, and perform real external tool discovery.
6. Align installed workflow destinations with deterministic loader paths.

Any implementation must start with a fresh read-only private-upstream audit and update [Compatibility Contract](Compatibility-Contract.md).
