# MCP Data Connectors & Integrations

The **Model Context Protocol (MCP)** provides a standardized way for AI agents to connect with and ingest external data sources securely.

In Tadpole OS, you can attach community-vetted or custom MCP servers to any intelligence swarm to give it secure real-time read/write access to CRMs, databases, SaaS applications, and internal APIs.

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
- bundles relative Python server sources and available requirements files under `mcp-blueprints/`; and
- rejects missing connector definitions or duplicate MCP server names.

### Manual Configuration
If you are writing a template manually, place the accepted MCP configuration at the template root. The current AI-Tadpole-OS installer reads this exact file and does not follow repository-relative `required_mcps` paths:

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
      "args": ["mcp-blueprints/generic-crm/server.py"],
      "env": {
        "CRM_API_KEY": "CONFIGURE_LOCALLY"
      }
    }
  }
}
```

`required_mcps` remains useful portable manifest metadata, but it is not an installation mechanism in the pinned consumer.

## 🔒 Security Model

In alignment with the Sapphire Shield policy, MCP servers are intended to run locally.
- MCP server configuration uses a command and string argument list suitable for stdio startup.
- Environment variables and credentials must be provided manually by the system administrator during installation.
- Overlord Approval boundaries are strictly enforced for write/mutation endpoints.

> [!WARNING]
> The current remote installer deletes its temporary repository clone after merging MCP configuration. Commands that point to server files inside that clone therefore lose their backing files. Exported archives are self-contained, but end-to-end remote installation of file-backed connectors requires an upstream consumer fix that retains or relocates those assets.
