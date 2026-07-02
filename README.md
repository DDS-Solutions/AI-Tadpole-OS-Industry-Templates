# Tadpole OS Swarm Templates

Official community repository for Tadpole OS. Download, share, and install industry-specific AI Swarm templates to power up your local intelligence engine.

---

## 🛠️ Build Your Own Swarm

Don't want to start from scratch? Use our **[Swarm Architect](https://dds-solutions.github.io/AI-Tadpole-OS-Industry-Templates/)** to visually design your intelligence roster, mission, and playbooks.

*   **Hybrid AI Profiler**: Suggests skills based on your company mission.
*   **Agent Catalog**: Browse 200+ specialized AI agent roles across multiple departments to easily build your team.
*   **MCP Integration**: Attach standard Model Context Protocol (MCP) data connectors to your Swarms.
*   **One-Click Export**: Downloads a production-ready Swarm Archive (.zip).
*   **Schema Verified**: Every template generated is guaranteed to pass the Tadpole OS validation.

---

## 🌟 What is a Swarm Template?

AI-Tadpole-OS operates via "**Swarms**" — interconnected graphs of AI agents, specific skills, and Markdown-based standard operating procedures (workflows). 

Tadpole OS Swarms utilize a native **capability-based architecture**:
1. **Slim Agent Profiles**: Agents are model-agnostic, featuring a compact personality prompt (Max 800 characters) and referencing their capabilities (skills and workflows).
2. **Deterministic Workflows**: Multi-step SOP playbooks are written as standalone Markdown documents inside `/workflows/` using strict step headers (`## Step [Name]`).
3. **Decoupled Skills**: Tooling permissions (e.g., `read_file`, `grep_search`) are declared in the agent's `skills` array.

Instead of configuring dozens of AI agents manually, you can download a complete Swarm Template tailored exactly to your industry (e.g., Legal, Healthcare, Development) and get it running immediately.

## 🚀 How to Install a Template

You can install these directly from your Tadpole OS dashboard!

1. Open your **AI-Tadpole-OS Dashboard**.
2. Navigate to **Settings** -> **System Configuration**.
3. Under the **Template Ecosystem** panel, click **Open Template Store**.
4. Browse the available industries and click **Install Swarm** on the template you want.

*(The engine will automatically clone the required JSON and Markdown files into your local `/data/swarm_config/` vault.)*

## 📁 Repository Structure

The repository contains pre-configured templates across **23 industries**, with each industry hosting at least two specialized swarm types:
1. **Knowledge Work Swarms**: Focused on research analysis, policy indexing, case law synthesis, and document auditing.
2. **Edge Operations Swarms**: Focused on inventory management, shipping/receiving audits, purchasing/procurement, and ISO 9000 quality assurance.

Each template is structured as:
```text
<industry>/<template>/
├── swarm.json          # Swarm metadata and roster IDs
├── mcps.json           # MCP connector configurations
├── agents/             # Slim agent JSON files (~1.5KB)
│   └── *.json          # No massive system_prompt; references workflows/ & skills/
├── skills/             # Schema definitions for custom skills (optional)
│   └── *.json
└── workflows/          # Executable markdown SOPs (with strict ## step headers)
    └── *.md
```

## 🧠 Institutional Knowledge Integration (OKF/IKS)

Tadpole OS Swarms can automatically ingest institutional knowledge, playbooks, and corporate SOPs into your local **Open Knowledge Foundation (OKF)** vector database upon deployment. This enables newly spawned agents to instantly access and conform to your company's official guidelines, documentation, and processes.

### Bundling Formats

Swarm template authors can bundle knowledge assets in two formats:

#### Format A: Markdown SOPs (Recommended)
Add `.md` files to the `/knowledge/` subdirectory within the template. You can include custom YAML frontmatter at the top of each file to capture metadata, which is automatically extracted and indexed:

```markdown
---
title: Full-Funnel SEO Optimization & Content Strategy Playbook
url: https://confluence.example.com/display/MKT/Full-Funnel+SEO+Playbook
tags: marketing, seo, content, organic
description: A comprehensive playbook detailing organic search strategies.
---
# Full-Funnel SEO Playbook
Body content...
```

#### Format B: Structured JSON (`knowledge.json`)
Alternatively (or additionally), you can define a `knowledge.json` file in the root of the template folder containing a structured list of knowledge requests:

```json
[
  {
    "title": "Full-Funnel SEO Optimization Playbook",
    "description": "Organic search guidelines.",
    "topic": "marketing",
    "concept_type": "playbook",
    "resource_uri": "https://confluence.example.com/display/MKT/Full-Funnel+SEO+Playbook",
    "tags": "marketing, seo, content",
    "text": "Playbook body..."
  }
]
```

### Resilient Ingestion & Live Previews

* **Automatic Previews**: The Template Store reads your `knowledge.json` metadata index, displaying a dedicated **Playbooks & Institutional Knowledge** panel in the preview modal. Users can review documentation URLs and descriptions prior to deployment.
* **Resilient Degradation**: If vector memory or embedding generation is disabled (e.g., due to `PRIVACY_MODE=true` or missing API keys), the template installation logs a warning but proceeds with the deployment, ensuring zero downtime.

## 🔌 MCP Data Connectors

Tadpole OS Swarms can now seamlessly attach standard Model Context Protocol (MCP) data connectors. This allows your local intelligence swarm to dynamically query real-time external databases, CRM systems, and internal REST APIs without exposing any credentials.

* **Blueprint Library**: Browse our `mcp-blueprints/` directory for pre-built Python and TypeScript FastMCP servers (e.g., `generic-crm`).
* **Swarm Architect Integration**: When building a custom swarm, use **Phase 4: Data Connectors** in the Swarm Architect to attach MCPs to your swarm manifest.
* **Auto-Discovery**: Attached MCPs are automatically booted and registered via stdio when the swarm initializes.

## 🛡️ The Sapphire Shield: Security First

Tadpole OS implements a Zero-Trust Template architecture known as the **Sapphire Shield**.

* **No Executables**: Templates only contain declarative `.json` configurations and `.md` context files.
* **Overlord Approval**: If a template you download requests dangerous capabilities (e.g., `shell:execute` or `budget:spend`), the Tadpole OS engine will freeze the swarm and require manual human approval via the React Dashboard before it is allowed to execute.
* **Bring Your Own Keys**: Templates will *never* contain API keys. If a swarm requires a connection to Jira or Salesforce, you will be prompted to enter your own local credentials upon installation.

## 🤝 Contributing to the Ecosystem

We welcome contributions from industry experts! If you have built an incredibly efficient Swarm for your specific business niche, share it with the community.

1. Fork this repository.
2. Create a new folder under your relevant industry (or create a new industry).
3. Ensure your template passes the [TEMPLATE_SPEC.md](file:///c:/Users/Home%20Office_PC/.gemini/antigravity/playground/tadpole-os-industry-templates/TEMPLATE_SPEC.md) requirements.
4. Run the local validators to audit your template structure:
   ```bash
   # Run the native specification validator
   python scripts/validate_template.py
   
   # Run the global repository validator
   python validate.py
   ```
5. Submit a Pull Request! *(Our CI/CD pipeline runs this validation on every PR to prevent template regression).*

> [!NOTE]
> If you are contributing changes to the **Swarm Architect Web Builder** React application under `/web-builder/`, please consult the modular frontend architecture in the [Developer Guide wiki page](file:///c:/Users/Home%20Office_PC/.gemini/antigravity/playground/tadpole-os-industry-templates/wiki/Developer-Guide.md) and ensure that all unit tests (`npm run test`) pass.

---
*Built for [AI-Tadpole-OS](https://github.com/DDS-Solutions/AI-TadPole-OS).*
