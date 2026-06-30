# The Sapphire Shield: Security Policy & Sandbox Guards

Tadpole OS operates on a **Zero-Trust** security architecture known as the **Sapphire Shield**. Since templates are downloaded from a community store, the engine enforces isolation boundaries to protect local server assets.

---

## 🛡️ Sandbox & Permission Boundaries

Swarms cannot execute arbitrary commands, read files outside designated workspaces, or open remote web connections without explicit configuration:

1. **Workspace Isolation**: Agents are locked into their respective directories located under `data/workspaces/default/`. Path traversal sequences (`../`) are detected and rejected.
2. **Bring Your Own Keys**: Templates are strictly forbidden from packaging API keys or system credentials. Any integration with external software (e.g., Salesforce, Jira, or private databases) requires local configuration upon deployment.
3. **No Executables**: Templates may only bundle declarative JSON configurations, Markdown SOPs, and scanned Python/JS execution scripts. Compiled binaries (`.exe`, `.bin`, `.so`) are rejected.

---

## 🛑 Overlord Authorization Gates

If a swarm template requests capabilities that interface with critical system resources, the Tadpole OS engine suspends the swarm and prompts the **Overlord (Entity 0)** for approval:

- **Network Access**: Fetching data from public HTTP sites.
- **Resource Spending**: Budget allocations exceeding default values (e.g., configuring LLM usage costs).
- **FileSystem Access**: Editing files outside the scope of the designated workspace.

---

## 🔍 Static Analysis Gate: `skillspector`

All custom scripts inside the `skills/` folder of an incoming template are evaluated by the backend security utility `skillspector` before they are written to the local `/execution` directory.

- **Audited Extensions**: `.json`, `.py`, `.js`, `.ts`
- **Audit Logic**: Analyzes imports, syscalls, eval commands, and obfuscated code blocks.
- **Rejection Criteria**: If a script scores a **risk score of 50 or higher**, the installation is immediately halted, the cloned assets are deleted, and a `Forbidden` error is returned to the user interface.

```text
Incoming Template ---> Git Clone ---> Run skillspector on scripts
                                             |
                                  +----------+----------+
                                  |                     |
                              Score < 50            Score >= 50
                                  |                     |
                           Copy to execution      Abort Installation
```

---

## 🔍 Visual Builder Telemetry Audit (Swarm Architect)

To ensure zero-trust compliance prior to deployment, the **Swarm Architect Web Builder** runs a static security audit panel (**Sapphire Shield Security Audit**) on Step 4 (The Forge) before zipping the archive.

### Prompt Scan Targets
The auditing engine parses system prompts for capability requests matching these Tadpole OS boundaries:
*   **`shell:execute` (Red Severity)**: Triggered by keywords like `execute`, `shell`, `bash`, `powershell`, `cmd.exe`, `terminal`, `command line`, `system call`.
*   **`budget:spend` (Amber Severity)**: Triggered by keywords like `spend`, `budget`, `purchase`, `cost`, `payment`, `pay`, `charge api`, `financial authorization`.
*   **`system:write` (Amber Severity)**: Triggered by keywords like `delete`, `wipe`, `remove file`, `overwrite`, `format disk`, `destroy`.

### Builder Enforcement
*   **Compliance Indicator**: If no warnings are detected, the builder displays: `🟢 Sovereign Shield Status: Zero Privileges. Runs directly without manual intervention.`
*   **Override Warnings**: If matching keywords are found, the builder warns that: `⚠️ Overlord (Entity 0) Authorization will be required upon Swarm installation` and lists which specific agents requested the capabilities.

