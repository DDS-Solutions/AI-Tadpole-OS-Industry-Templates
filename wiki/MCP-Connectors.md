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

## 🔒 Security Model

In alignment with the Sapphire Shield policy, MCP servers are intended to run locally and require operator review.
- MCP server configuration uses a command and string argument list suitable for stdio startup.
- Sensitive environment values in this registry must be explicit placeholders. The pinned MCP client parses but does not apply config `env`; set real values in the AI-Tadpole-OS process environment.
- The registry validator allows only reviewed runtime commands and rejects shell control syntax and inline interpreter execution.
- AI-Tadpole-OS authorization is not inferred from a connector description or the builder's prompt keyword advisory. Write/mutation access must be constrained by the deployed connector and consumer runtime configuration.

> [!WARNING]
> Swarm Architect now routes bundled source through `skills/` so the installer retains it in `execution/`. This does not install Python/npm dependencies, apply MCP config `env`, make `mcp_tools` an active authorization filter, or repair the pinned runtime's incomplete external-tool discovery. Those remain operator/upstream responsibilities.
