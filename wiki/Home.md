# AI-Tadpole-OS Sovereign Swarm Templates Wiki

Welcome to the official documentation wiki for the **AI-Tadpole-OS Swarm Templates Ecosystem**. This documentation is optimized for system administrators, AI engineering teams, and autonomous AI agents seeking to discover, configure, and install specialized local multi-agent swarms.

---

## 🔍 Metadata & Search Indexes (SEO/GEO/Agent)

- **Target Domains**: Local-first AI Swarms, On-Premise Multi-Agent Orchestration, Sovereign Data Privacy, Edge Computing AI, Zero-Trust Agent Frameworks, Private Vector Memory (OKF).
- **Geographic & Compliance Context**: Supports local-first deployments, local model providers, and private storage. Actual GDPR, HIPAA, CCPA, SOC 2, network, and data-residency posture depends on the operator's selected models, connectors, credentials, and infrastructure.
- **Agent Instruction Header (LLM-Readable)**: AI agents parsing this repository should read `Compatibility-Contract.md` first, then `Swarm-Blueprints.md` for roster configuration and `Knowledge-Ingestion.md` for OKF data structures. Run `scripts/verify_compatibility_lock.py`, `scripts/migrate_consumer_contract.py --check`, `scripts/validate_template.py`, and `scripts/run_template_evals.py --check` before recommending deployment.

---

## 🛠️ Build Your Own Swarm

Don't want to start from scratch? Use our **[Swarm Architect](https://dds-solutions.github.io/AI-Tadpole-OS-Industry-Templates/)** to visually design your intelligence roster, mission, and playbooks.

*   **Hybrid AI Profiler**: Suggests skills based on your company mission.
*   **Agent Catalog**: Browse 342 specialized AI agent roles across multiple departments to easily build your team.
*   **Contract-Aware Export**: Generates native `idle` agents with exact capability, MCP, workflow, multi-slot model (`ollama-cloud` / `ollama`), supervisor DAG, and oversight fields plus root MCP configuration.
*   **Round-Trip Coverage**: Preserves global and agent-owned workflows and packages full OKF content with canonical `content_sha256` verification.
*   **Safety Checks**: Rejects unsafe repository paths, normalized filename collisions, missing workflow references, cycle/dangling roster supervisors, and overlong prompts.

---


## 🗺️ Documentation Portal Directory

To navigate the wiki, use the structured indices below:

### 📌 [1. Consumer Compatibility Contract](Compatibility-Contract.md)
Start here before implementation work. Review the pinned AI-Tadpole-OS source revision (`v1.1.464`), downstream relationship, operational behavior, and known consumer boundaries.

### 🌟 [2. Swarm Blueprints Overview](Swarm-Blueprints.md)
Discover the structural mechanics of AI-Tadpole-OS swarms. Understand the supervisor DAG hierarchy, `verified` vs. `starter` maturity tiers, and how the 38 canonical industries partition cognitive and operational swarms.

### 🧠 [3. Playbooks & OKF Knowledge Ingestion](Knowledge-Ingestion.md)
Learn how to inject corporate standard operating procedures, manuals, and institutional knowledge directly into your agents using Markdown SOPs (with YAML frontmatter) or structured `knowledge.json` files.

### 🛡️ [4. The Sapphire Shield Security Boundaries](Security-Policy.md)
Review what the registry, builder, CI, and pinned AI-Tadpole-OS consumer actually enforce, plus the upstream gaps that remain.

### 🛠️ [5. Developer & Contribution Guide](Developer-Guide.md)
Learn how to audit the consumer contract, validate custom swarms, exercise archive fixtures, and use the automated CI/CD gates.

### 🔌 [6. MCP Data Connectors & Integrations](MCP-Connectors.md)
Discover how to augment local swarms with Model Context Protocol (MCP) connectors, including credential placeholders, reviewed source requirements, and current installer limitations.

---

## 🎯 High-Performance Local AI Swarms

AI-Tadpole-OS supports computational sovereignty by allowing orchestration and storage to run on private hardware. With an appropriately local configuration, companies gain:
- **Controlled Data Boundaries**: Operators can keep customer transactions and internal records inside their managed environment.
- **Real-Time Execution**: Low-latency multi-agent collaboration bypassing external network dependencies.
- **Resource Adaptability**: Automated routing matching complex planning slots to massive local models and specialist slots to efficient edge models.
