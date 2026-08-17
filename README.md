# Tadpole OS Swarm Templates

Official community repository for Tadpole OS. Download, share, and install industry-specific AI Swarm templates to power up your local intelligence engine.

---

## 🛠️ Build Your Own Swarm

Don't want to start from scratch? Use our **[Swarm Architect](https://dds-solutions.github.io/AI-Tadpole-OS-Industry-Templates/)** to visually design your intelligence roster, mission, and playbooks.

*   **Hybrid AI Profiler**: Suggests skills based on your company mission.
*   **Agent Catalog**: Browse 200+ specialized AI agent roles across multiple departments to easily build your team.
*   **MCP Integration**: Attach root MCP configurations and package reviewed server source into the installer's `skills/` → `execution/` path.
*   **One-Click Export**: Downloads a consumer-contract-validated Swarm Archive (`.zip`).
*   **Round-Trip Safe**: Preserves agent-owned and global workflows when importing and exporting registry templates.
*   **Knowledge Ready**: Packages full OKF/IKS playbook text in both structured JSON and Markdown assets.

---

## 🌟 What is a Swarm Template?

AI-Tadpole-OS operates via "**Swarms**" — interconnected graphs of AI agents, specific skills, and Markdown-based standard operating procedures (workflows). 

Tadpole OS Swarms utilize a native **capability-based architecture**:
1. **Slim Agent Profiles**: Agents declare an explicit provider/model, a compact personality prompt (maximum 800 characters), native `idle` status, exact capability IDs, MCP declarations, workflows, and oversight intent.
2. **Executable Workflows**: Multi-step SOP playbooks are standalone Markdown documents inside `/workflows/`. The current consumer accepts `##` or `###` execution headings; `## Step N: Name` remains the preferred registry style.
3. **Decoupled Skills**: Runtime capability IDs (for example `read_file`, `grep_search`, and `write_file`) are declared in `skills`; legacy `run_command` and `write_to_file` are rejected.

Instead of configuring dozens of AI agents manually, you can download a complete Swarm Template tailored exactly to your industry (e.g., Legal, Healthcare, Development) and get it running immediately.

## 📚 Documentation

- [Consumer Compatibility Contract](wiki/Compatibility-Contract.md): required cross-repository audit, pinned consumer behavior, and upstream boundaries.
- [Swarm Blueprints](wiki/Swarm-Blueprints.md): manifest metadata, runtime agent fields, and workflow rules.
- [Knowledge Ingestion](wiki/Knowledge-Ingestion.md): OKF/IKS JSON and Markdown requirements.
- [MCP Connectors](wiki/MCP-Connectors.md): root configuration, builder packaging, and the current installer limitation.
- [Developer Guide](wiki/Developer-Guide.md): local validation, characterization tests, frontend gates, and CI.

## 🚀 How to Install a Template

You can install these directly from your Tadpole OS dashboard!

1. Open your **AI-Tadpole-OS Dashboard**.
2. Navigate to **Settings** -> **System Configuration**.
3. Under the **Template Ecosystem** panel, click **Open Template Store**.
4. Browse the available industries and click **Install Swarm** on the template you want.

The engine clones the registry, copies agent profiles into its agent configuration vault, copies workflow Markdown into its directives area, merges a root `mcps.json` when present, and optionally ingests knowledge assets. Registry validation is important because the current installer can continue after skipping malformed individual assets.

## 📁 Repository Structure

The repository contains pre-configured templates across **25 industries**. Most industries provide both knowledge-work and edge-operations swarms; the Field Services and Wholesale & Distribution starters provide compact three-agent teams designed specifically for businesses with up to 25 seats:
1. **Knowledge Work Swarms**: Focused on research analysis, policy indexing, case law synthesis, and document auditing.
2. **Edge Operations Swarms**: Focused on inventory management, shipping/receiving audits, purchasing/procurement, and ISO 9000 quality assurance.

Each template is structured as:
```text
<industry>/<template>/
├── swarm.json          # Swarm metadata and roster IDs
├── mcps.json           # Root MCP config: { "mcpServers": { ... } }
├── agents/             # Slim agent JSON files (~1.5KB)
│   └── *.json          # No massive system_prompt; references workflows/ & skills/
├── skills/             # Reviewed installable source (optional)
│   └── *.{json,py,js,ts}
└── workflows/          # Markdown SOPs with at least one ## or ### heading
    └── *.md
```

## 🧠 Institutional Knowledge Integration (OKF/IKS)

When the consumer's vector-memory feature and embedding provider are available, Tadpole OS Swarms can ingest institutional knowledge, playbooks, and corporate SOPs into the local **Open Knowledge Foundation (OKF)** store during installation.

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
* **Resilient Degradation**: If vector memory or embedding generation is disabled, installation can continue without knowledge ingestion. Because individual ingestion failures may not fail the overall install response, validate `knowledge.json` locally and ensure each item contains non-empty `text` and `topic` values.

## 🔌 MCP Data Connectors

Tadpole OS Swarms can package standard Model Context Protocol (MCP) connector configurations for external databases, CRM systems, and internal REST APIs. Credentials remain local and must not be committed to templates.

* **Blueprint Library**: Browse our `mcp-blueprints/` directory for pre-built Python MCP server examples (e.g., `generic-crm`).
* **Swarm Architect Integration**: Phase 4 emits root `mcps.json`. Bundled Python source is placed in `skills/`, while its MCP argument points at the post-install `execution/` path so it survives clone cleanup.
* **Current Consumer Boundary**: The private pinned upstream reads only `<template>/mcps.json`. It does not apply MCP config `env` values to child processes, install connector dependencies, use `mcp_tools` as its active filter, or fully discover external tools. Configure environment/dependencies locally and treat MCP usability/authorization as runtime work.

## 🛡️ The Sapphire Shield: Enforced Boundaries

Security claims are split by layer so an advisory builder message is not mistaken for a Tadpole OS authorization decision.

* **Registry Admission Gate**: Registered packages use UTF-8 JSON/Markdown, with reviewed executable source allowed only under template `skills/` or registry `mcp-blueprints/`. The 1 MB limit, link/type/content, credential, command, shell, inline execution, and placeholder rules are blocking.
* **Reviewed Source**: CI runs contract/adversarial tests, pinned Bandit over connector and template-skill Python, and ClamAV over the repository.
* **Builder Archive Gate**: Export rejects unsafe paths, normalized filename collisions, missing references, invalid profiles, and conflicting MCP server names. Connector assets come from the same deployed builder release rather than the moving `main` branch.
* **Prompt Advisory**: The builder's prompt keyword review is a review aid only. A clear result does not prove safety or zero privileges, and a warning does not itself trigger Tadpole OS approval.
* **Consumer Boundary**: The pinned private Tadpole-OS installer has path/overwrite guards plus a `skills/` scan, but installation is not transactional and scan-call errors can continue without rollback. Treat complete authorization, receipts, and rollback as upstream work.

See [wiki/Security-Policy.md](wiki/Security-Policy.md) for the exact enforced controls and remaining upstream gaps.

## 🤝 Contributing to the Ecosystem

We welcome contributions from industry experts! If you have built an incredibly efficient Swarm for your specific business niche, share it with the community.

> [!IMPORTANT]
> This registry supports [AI-Tadpole-OS](https://github.com/DDS-Solutions/AI-TadPole-OS), but private `DDS-Solutions/TadPole-OS` is the authoritative source contract. Any implementation changing schemas, validators, archives, MCP packaging, workflows, security claims, or migrations must start with a read-only cross-repository contract audit and record the private upstream commit. See the [Cross-Repository Audit Remediation Plan](AUDIT_REMEDIATION_PLAN.md).

The current compatibility review is pinned in [COMPATIBILITY_MATRIX.md](COMPATIBILITY_MATRIX.md). Update that matrix whenever the reviewed consumer revision or accepted contract changes.

1. Fork this repository.
2. Create a new folder under your relevant industry (or create a new industry).
3. Ensure your template passes the [TEMPLATE_SPEC.md](TEMPLATE_SPEC.md) requirements.
4. Run the local validators to audit your template structure:
   ```bash
   # Check for pending contract migrations and validate all registry assets
   python scripts/migrate_consumer_contract.py --check
   python scripts/validate_template.py

   # Run validator characterization tests
   python -m unittest discover -s tests -p "test_*.py"
   ```
5. If you changed the Web Builder, run `npm ci`, `npm run lint`, `npm run test`, and `npm run build` from `/web-builder/`.
6. Submit a Pull Request and complete the cross-repository audit checklist. CI repeats the migration, validation, characterization, lint, archive-test, and production-build gates.

> [!NOTE]
> Six preserved legacy workflow files are currently reported as unreferenced warnings. They are documented compatibility drift, not validation errors; do not delete or register them without first auditing consumer behavior and migration intent.

---
*Built for [AI-Tadpole-OS](https://github.com/DDS-Solutions/AI-TadPole-OS).*
