# MCP Data Connectors & Integrations

The **Model Context Protocol (MCP)** provides a standardized way for AI agents to connect with and ingest external data sources securely.

In AI-Tadpole-OS, you can attach community-vetted or custom MCP servers to any intelligence swarm to give it secure real-time read/write access to CRMs, databases, SaaS applications, and internal APIs.

---

## 🏗️ MCP Blueprints Directory

The `mcp-blueprints/` folder houses standard implementations of FastMCP servers configured for specific business contexts (such as Generic CRMs).

### Registry Indexing (`mcp_registry.json`)

All active MCPs in the repository are cataloged in `mcp_registry.json`:

```json
{
  "connectors": [
    {
      "id": "mcp-generic-crm",
      "name": "Generic CRM Integration",
      "description": "Standard read/write interface for managing customer records.",
      "category": "database",
      "version": "1.0.0",
      "path": "mcp-blueprints/generic-crm"
    }
  ]
}
```

## 🛠️ Attaching Connectors to Swarms

### Via Swarm Architect
When configuring your swarm using the visual **Swarm Architect** (`/web-builder`), Phase 4 lets you select catalog connectors. Export then:

- merges selected server definitions into a root `mcps.json`;
- sets manifest metadata to `"required_mcps": "mcps.json"`;
- places bundled Python source under template `skills/` and rewrites its argument to the post-install `execution/<connector>-server.py` path; and
- rejects missing connector definitions or duplicate MCP server names.

### Manual Configuration
If you are writing a template manually, place the accepted MCP configuration at the template root. The pinned private Tadpole-OS installer reads this exact file and does not follow repository-relative `required_mcps` paths:

```json
{
  "$schema": "https://tadpoleos.dev/schemas/swarm-v1.json",
  "name": "Acme Sales Automation",
  "version": "1.0.0",
  "roster": [ ... ],
  "global_workflows": [ ... ],
  "required_mcps": "mcps.json"
}
```

```json
{
  "mcpServers": {
    "generic-crm": {
      "command": "python",
      "args": ["execution/mcp-generic-crm-server.py"],
      "env": {
        "CRM_API_KEY": "CONFIGURE_LOCALLY"
      }
    }
  }
}
```

`required_mcps` remains useful portable manifest metadata, but it is not an installation mechanism in the pinned consumer.

Place the corresponding reviewed source at `skills/mcp-generic-crm-server.py`. The installer scans it, then copies it to `execution/mcp-generic-crm-server.py` before deleting the clone.

## 🔒 Security Model & Protocol Parity

In alignment with the Sapphire Shield policy and the MCP 2026-07-28 protocol upgrade:
- **Dual Transport Support**: Configuration supports both stdio (`command`, `args`, `env`) and streamable HTTP (`url`, `headers`, `protocol_version`).
- **Probe-First Discovery**: Stdio probes `server/discover` negotiating version `2026-07-28`, falling back to `initialize` (`2024-11-05`) if unsupported. HTTP servers utilize stateless per-request `_meta`.
- **Placeholder Security**: Sensitive environment and header values must use explicit placeholders (`CONFIGURE_LOCALLY`, `YOUR_API_KEY_HERE`, or `${API_TOKEN}`). Placeholders resolve from the host process environment.
- **Runtime Command Whitelist**: Stdio commands are strictly limited to approved runtimes (`node`, `npx`, `python`, `python3`). Shell control syntax, redirection, inline interpreter code, and double underscores (`__`) in server names are rejected.
- **Explicit Tool Authorization**: AI-Tadpole-OS authorization is not inferred from a connector description. External MCP tools require explicit agent `mcp_tools` declarations (`server:tool`), and mutating tool grants enforce `requires_oversight: true`.

> [!WARNING]
> Swarm Architect routes bundled stdio source through `skills/` so the installer retains it in `execution/`. Remote HTTP servers do not require bundled source. Automatic dependency installation remains an operator responsibility.
