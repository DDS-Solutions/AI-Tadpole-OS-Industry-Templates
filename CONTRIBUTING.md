# Contributing to AI-Tadpole-OS Industry Templates

Thank you for your interest in contributing! We welcome community contributions of new industry templates, agent personas, standard operating procedures, and connector blueprints.

## Contribution Guidelines

### 1. Template Requirements & Contract Conformance
All templates submitted to this repository must satisfy the authoritative AI-Tadpole-OS consumer contract:
- **Encoding & Size**: All template assets must be UTF-8 encoded text. Files over 1 MB are prohibited.
- **Roster & Agent Profiles**:
  - Profiles must live in `<industry>/<template>/agents/<agent-id>.json`.
  - Initial `status` must be `"idle"`.
  - System prompts must not exceed 800 characters.
  - Capability IDs in `skills` must use exact Tadpole identifiers (`read_file`, `write_file`, `grep_search`, `execute_shell`, `search_web`, `delete_file`).
  - Shell execution requires both `execute_shell` and `shell`/`terminal` markers.
  - Any mutating capability (`write_file`, `delete_file`, `execute_shell`) or mutating MCP tool grant requires `requires_oversight: true`.
- **Workflows**:
  - Stored in `<industry>/<template>/workflows/<workflow-id>.md`.
  - Must include executable Markdown step headings (`##` or `###`).
- **MCP Connectors**:
  - Stored in `<industry>/<template>/mcps.json` with root `{ "mcpServers": { ... } }`.
  - Only approved commands (`node`, `npx`, `python`, `python3`) without shell control syntax.
  - Secret placeholders must use `CONFIGURE_LOCALLY` or `${VAR}` syntax.

### 2. Local Validation Before Submitting
Before opening a pull request, run the test suites locally:
```bash
# Python validation and contract checks
python scripts/validate_template.py
python -m unittest discover -s tests

# Web Builder tests & build
cd web-builder
npm test
npm run lint
npm run build
```

### 3. Submitting Pull Requests
- Ensure all CI workflows (`validate-templates.yml`, `security-scan.yml`, `deploy-web.yml`) pass.
- Reference any upstream Tadpole-OS issues or requirements.
- Follow the principle of least privilege for agent capabilities.
