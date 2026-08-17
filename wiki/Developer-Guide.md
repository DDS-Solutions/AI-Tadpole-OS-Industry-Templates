# Developer & Contribution Guide

This page explains how developers can build, validate, and submit custom swarm templates without drifting from the private Tadpole-OS source contract.

> [!IMPORTANT]
> Any schema, validator, archive, workflow, MCP, knowledge, security, or migration change must begin with a read-only audit of private `DDS-Solutions/TadPole-OS`. Pin the reviewed private commit and update [`COMPATIBILITY_MATRIX.md`](../COMPATIBILITY_MATRIX.md).

---

## 🛠️ Testing Templates Locally

Use the local validation suite to confirm that a template matches the pinned AI-Tadpole-OS contract before attempting installation.

### Prerequisites
- Python 3.8 or higher.
- Clone the templates repository:
  ```bash
  git clone https://github.com/DDS-Solutions/AI-Tadpole-OS-Industry-Templates.git
  ```

### Run Validation
From the root of the repository, execute:
```bash
# Confirm that no additive consumer-contract migrations remain
python scripts/migrate_consumer_contract.py --check

# Validate the complete registry against the pinned consumer contract
python scripts/validate_template.py

# Exercise known-valid and known-invalid contract fixtures
python -m unittest discover -s tests -p "test_*.py"
```

### Validation Scope
The validation suite is read-only and performs the following integrity checks:
1. **Catalog Parity**: Confirms `registry.json` and `index.json` agree on unique template IDs and paths.
2. **Directory Resolution**: Confirms all templates declared in `registry.json` exist physically.
3. **Package Security Boundary**: Rejects symbolic links, unapproved or binary files, non-UTF-8 content, files over 1 MB, and high-confidence embedded credential patterns.
4. **Configuration Auditing**: Parses `swarm.json`, rejects unsafe paths, and checks roster and global-workflow references.
5. **Agent Profile Checks**:
   - Scans every profile under `/agents/`, because the consumer installs all JSON files in that directory—not only roster entries.
   - Requires non-empty `id`, `name`, `role`, `department`, and `description`, plus native `status: "idle"`.
   - Requires `model_config.provider`, `model_config.model_id`, and `model_config.system_prompt`, with a maximum 800-character prompt.
   - Validates `skills`, `workflows`, `mcp_tools`, and `requires_oversight`; rejects legacy tool IDs, incomplete shell markers, and unprotected mutation/shell declarations.
6. **Workflow Checks**:
   - Checks global, agent-owned, and otherwise present workflow files.
   - Requires at least one consumer-visible `##` or `###` heading. `## Step N: Name` is preferred but is not the only syntax the pinned parser accepts.
   - Reports unreferenced files as warnings.
7. **MCP and Knowledge Checks**: Validates the root `{ "mcpServers": {} }` shape, approved runtime commands, shell-safe arguments, local credential placeholders, blueprint files, and required `knowledge.json` text/topic fields.

The legacy `validate.py` entry point delegates to the same contract validator; it no longer maintains a second set of rules.

---

## 💻 Engine Auditing Commands

If you are developing directly on the private **Tadpole-OS** engine (`server-rs` or React dashboard), use its repository instructions and keep registry audits read-only unless upstream changes are separately authorized:

### Backend Checks
Verify backend Rust compilation and run backend test suites:
```bash
# Check compilation
cargo check --manifest-path server-rs/Cargo.toml

# Run Unit/Integration Tests
cargo test --manifest-path server-rs/Cargo.toml
```

### Frontend Checks & Web Builder Development
The visual **Swarm Architect Web Builder** is located inside `/web-builder`. To run the frontend locally, execute:

```bash
# Navigate to the workspace and install packages
cd web-builder
npm ci

# Run Vite dev server locally
npm run dev

# Run prompt, archive-content, MCP, OKF, safety, and round-trip tests
npm run test

# Run static analysis
npm run lint

# Build production assets
npm run build
```

### 📁 Web Builder Directory Structure

The frontend application uses a modular architecture to separate state coordination, step panels, modals, and file IO helper functions:

```text
web-builder/src/
├── App.tsx               # Central React state coordinator
├── main.tsx              # Entry point & React DOM bindings
├── types.ts              # Common interfaces (Agent, Workflow, MCP)
├── utils.tsx             # Text highlighting & capability scanners
├── utils/
│   ├── fileHelpers.ts      # ZIP assembly, connector bundling, and template loaders
│   └── fileHelpers.test.ts # Archive contract and round-trip tests
├── components/
│   ├── Modals/
│   │   ├── AgentEditor.tsx   # Agent configuration editor modal
│   │   ├── McpEditor.tsx     # Custom MCP connector editor modal
│   │   └── CatalogDrawer.tsx # Sliding sidebar for catalog search
│   └── Steps/
│       ├── Step1_CompanyMission.tsx # Pulse (Phase 1 Settings)
│       ├── Step2_Roster.tsx         # Roster (Phase 2 Agent Grid)
│       ├── Step3_Playbooks.tsx      # Playbook (Phase 3 Workflow SOPs)
│       ├── Step4_Connectors.tsx     # Connectors (Phase 4 MCP list)
│       └── Step5_Forge.tsx          # Forge (Phase 5 Build Manifest & Export)
```

### Static Analysis & Graph Queries
Audit codebase dependencies and observability status using the built-in Cargo graph tools:
```bash
# Audit context and observability trace status
npm run graph:audit

# Export current codebase symbol dependency graphs
npm run graph:export
```

---

## 🔄 Automated CI/CD Pipeline

The templates repository uses `.github/workflows/validate-templates.yml` as the publication gate.

- **Triggers**: Executed automatically on every `push` and `pull_request` targeting the `main` branch.
- **Registry job**: Runs the migration check, complete validator, and Python characterization tests.
- **Builder job**: Uses the lockfile with `npm ci`, then runs lint, archive/round-trip tests, and the production build.
- **Deployment**: Repeats builder lint/tests/build before publishing GitHub Pages.
- **Security scan**: Runs on pull requests and pushes to `main`; it repeats the blocking package policy, runs adversarial tests, scans connector and template-skill Python with pinned Bandit 1.9.4, and scans the repository with ClamAV.

Pull requests also include a checklist requiring the reviewed private Tadpole-OS commit and compatibility notes.
