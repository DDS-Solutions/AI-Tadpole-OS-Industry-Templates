# Tadpole OS Swarm Templates

Official community repository for Tadpole OS. Download, share, and install industry-specific AI Swarm templates to power up your local intelligence engine.

---

## 🌟 What is a Swarm Template?

Tadpole OS operates via "**Swarms**" — interconnected graphs of AI agents, specific skills, and Markdown-based standard operating procedures (workflows). 

Instead of configuring dozens of AI agents up manually, you can download a complete Swarm Template tailored exactly to your industry (e.g., Legal, Healthcare, Development).

## 🚀 How to Install a Template

You can install these directly from your Tadpole OS dashboard!

1. Open your **Tadpole OS Dashboard**.
2. Navigate to **Settings** -> **System Configuration**.
3. Under the **Template Ecosystem** panel, click **Open Template Store**.
4. Browse the available industries and click **Install Swarm** on the template you want.

*(The engine will automatically clone the required JSON and Markdown files into your local `/data/swarm_config/` vault.)*

## 📁 Repository Structure

Templates are organized by industry for easy discovery. Each template folder contains a complete Swarm Profile.

```text
/
├── legal/
│   └── contract-review/       # A swarm designed for auditing NDAs
│       ├── swarm.json
│       ├── agents/
│       └── workflows/
├── healthcare/
│   └── patient-intake/        # A swarm designed to process raw patient data
└── development/
    └── code-reviewer/         # A swarm that acts as a Sr. Architect
```

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
