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
When configuring your swarm using the visual **Swarm Architect** (`/web-builder`), you will be presented with a **Phase 4: Data Connectors** UI. Here you can browse the active MCP catalog and select the connectors required by your agents. The exported `swarm.json` will automatically compile the requested dependencies.

### Manual Configuration
If you're writing a template manually, simply append the `required_mcps` array to your `swarm.json` manifesto pointing to the internal configuration files:

```json
{
  "$schema": "https://tadpoleos.dev/schemas/swarm-v1.json",
  "name": "Acme Sales Automation",
  "version": "1.0.0",
  "roster": [ ... ],
  "global_workflows": [ ... ],
  "required_mcps": [
    "mcp-blueprints/generic-crm/mcps.json"
  ]
}
```

## 🔒 Security Model

In alignment with the Sapphire Shield policy, MCP servers are entirely local.
- Tadpole OS boots the MCP connector as a child process via Stdio.
- Environment variables and credentials must be provided manually by the system administrator during installation.
- Overlord Approval boundaries are strictly enforced for write/mutation endpoints.
