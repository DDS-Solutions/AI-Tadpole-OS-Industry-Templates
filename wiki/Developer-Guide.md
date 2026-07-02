# Developer & Contribution Guide

This page explains how developers can build, validate, and submit custom swarm templates to the community repository.

---

## 🛠️ Testing Templates Locally

To ensure your swarm template complies with Tadpole OS specifications and will install cleanly without database or traversal errors, use the local validation script.

### Prerequisites
- Python 3.8 or higher.
- Clone the templates repository:
  ```bash
  git clone https://github.com/DDS-Solutions/AI-Tadpole-OS-Industry-Templates.git
  ```

### Run Validation
From the root of the repository, execute:
```bash
# Run the native specification validator
python scripts/validate_template.py

# Run the global repository validator
python validate.py
```

### Validation Scope
The validation suite performs the following structural integrity checks:
1. **Schema Compliance**: Validates `registry.json` and updates `index.json`.
2. **Directory Resolution**: Confirms all templates declared in `registry.json` exist physically.
3. **Configuration Auditing**: Parses `swarm.json` to verify JSON syntax.
4. **Agent Profile Checks**: 
   - Scans all roster profiles under `/agents/` to ensure agent paths exist and parse as valid JSON.
   - Asserts that agent profile JSONs strictly adhere to native properties (`id`, `name`, `role`, `department`, `description`, `model_config`, `skills`, `workflows`).
   - Asserts that the system prompt inside `model_config` is under 800 characters.
5. **Workflow Checks**: 
   - Checks that all workflows declared in `global_workflows` or inside agent profiles exist physically as `.md` files under the template `/workflows/` subdirectory.
   - Verifies that all workflow files contain valid step headers matching `## Step [Name]`.
6. **MCP Registry Checks**: Scans `mcp_registry.json` and ensures all referenced `mcps.json` configurations are syntactically valid and exist in the filesystem.

---

## 💻 Engine Auditing Commands

If you are developing features directly on the **AI-Tadpole-OS** engine (`server-rs` or React dashboard) and testing template integration, utilize these commands:

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
npm install

# Run Vite dev server locally
npm run dev

# Run Vitest unit tests (validates prompt scanner and search highlighting logic)
npm run test

# Build production assets
npm run build
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

The templates repository features a GitHub Actions workflow configured at `.github/workflows/validate-templates.yml`. 

- **Triggers**: Executed automatically on every `push` and `pull_request` targeting the `main` branch.
- **Workflow**: Sets up a Python environment and runs `validate.py`. Pull requests that contain syntax errors, missing files, or incorrect roster references will trigger a build failure and block merges.
