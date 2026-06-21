# Tadpole OS Swarm Templates

Official community repository for Tadpole OS. Download, share, and install industry-specific AI Swarm templates to power up your local intelligence engine.

---

## 🛠️ Build Your Own Swarm

Don't want to start from scratch? Use our **[Swarm Architect](https://dds-solutions.github.io/AI-Tadpole-OS-Industry-Templates/)** to visually design your intelligence roster, mission, and playbooks.

*   **Hybrid AI Profiler**: Suggests skills based on your company mission.
*   **One-Click Export**: Downloads a production-ready Swarm Archive (.zip).
*   **Schema Verified**: Every template generated is guaranteed to pass the Tadpole OS validation.

---

## 🌟 What is a Swarm Template?

AI-Tadpole-OS operates via "**Swarms**" — interconnected graphs of AI agents, specific skills, and Markdown-based standard operating procedures (workflows). 

Instead of configuring dozens of AI agents up manually, you can download a complete Swarm Template tailored exactly to your industry (e.g., Legal, Healthcare, Development).

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

```text
/
├── digital-marketing/
│   ├── full-funnel-automation/    # A swarm designed for full-funnel marketing
│   ├── seo-indexer/               # [Knowledge] Keyword trend & search intent indexing
│   └── vendor-purchasing/         # [Edge Ops] Ad spend verification & procurement QA
├── legal/
│   ├── contract-review/           # A swarm designed for auditing NDAs
│   ├── precedent-synthesis/       # [Knowledge] Case law precedent research & memorandum drafting
│   └── procurement-qa/            # [Edge Ops] Vendor purchasing audits & SLA compliance
├── manufacturing/
│   ├── design-synthesizer/        # [Knowledge] CAD blueprint parsing & compliance reviews
│   └── iso9000-qa/                # [Edge Ops] Floor inventory auditing & batch QA
└── ... (covering 23 distinct sectors including Healthcare, Finance, HR, and Utilities)
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

## 🛡️ The Sapphire Shield: Security First

Tadpole OS implements a Zero-Trust Template architecture known as the **Sapphire Shield**.

* **No Executables**: Templates only contain declarative `.json` configurations and `.md` context files.
* **Overlord Approval**: If a template you download requests dangerous capabilities (e.g., `shell:execute` or `budget:spend`), the Tadpole OS engine will freeze the swarm and require manual human approval via the React Dashboard before it is allowed to execute.
* **Bring Your Own Keys**: Templates will *never* contain API keys. If a swarm requires a connection to Jira or Salesforce, you will be prompted to enter your own local credentials upon installation.

## 🤝 Contributing to the Ecosystem

We welcome contributions from industry experts! If you have built an incredibly efficient Swarm for your specific business niche, share it with the community.

1. Fork this repository.
2. Create a new folder under your relevant industry (or create a new industry).
3. Ensure your template passes the `SWARM_TEMPLATE_SCHEMA.md` requirements.
4. Submit a Pull Request!

---
*Built for [AI-Tadpole-OS](https://github.com/DDS-Solutions/AI-TadPole-OS).*
