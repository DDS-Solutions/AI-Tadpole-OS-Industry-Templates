# AI-Tadpole-OS Template Specification

This document details the directory layout, schema definitions, and format specifications for native templates in AI-Tadpole-OS.

> [!IMPORTANT]
> This repository supports the public [AI-Tadpole-OS](https://github.com/DDS-Solutions/AI-TadPole-OS) distribution. The private `DDS-Solutions/TadPole-OS` source is the authoritative runtime contract. Any schema, validator, archive, or migration change must begin with a read-only cross-repository audit and record the private upstream revision. The current pin is documented in [COMPATIBILITY_MATRIX.md](COMPATIBILITY_MATRIX.md).

---

## Directory Layout
Each template directory (e.g., `legal/contract-review/`) must follow this structure:

```
<template-directory>/
├── swarm.json          # Swarm metadata and roster IDs
├── mcps.json           # MCP connector configurations
├── agents/             # Slim capability-driven agent JSON files
│   └── *.json          # No massive system_prompt; references workflows/ & skills/
├── skills/             # Reviewed installable skill/MCP source (optional)
│   └── *.{json,py,js,ts}
├── workflows/          # Executable markdown SOP files
│   └── *.md
└── quarantine/         # Audit archive of unpinned/deprecated assets (excluded from runtime install)
    └── mcps.json
```

---

## Package Security Boundary

Registered template directories are source-only data packages:

- UTF-8 `.json` and `.md` are allowed throughout a template. Reviewed `.py`, `.js`, and `.ts` source is allowed only directly under `skills/`, which the upstream installer scans and copies to `execution/`.
- Symbolic links, binary or unapproved file types, embedded binary data, files over 1 MB, and high-confidence credential patterns are rejected.
- Sensitive values in `mcps.json` must be placeholders for local configuration. MCP commands are restricted to reviewed runtimes, and arguments must not use shell control syntax or inline interpreter execution.
- Passing these checks establishes registry admission only. It does not grant runtime permissions or repair the pinned consumer's non-transactional installer.

See [The Sapphire Shield Security Boundaries](wiki/Security-Policy.md) for the layer-by-layer policy.

---

## Swarm Configuration (`swarm.json`)
The `swarm.json` configures the roster of agents and settings for the template.

```json
{
  "$schema": "https://tadpoleos.dev/schemas/swarm-v1.json",
  "name": "Legal Intelligence Swarm",
  "version": "1.0.0",
  "author": "SMB Legal Inc.",
  "description": "A high-performance swarm tailored for contract analysis.",
  "industry": "legal",
  "tags": ["law", "contracts", "auditing"],
  "defaults": {
    "model": "gemini-pro-latest",
    "temperature": 0.2
  },
  "roster": [
    {
      "id": "specialized-legal-document-review",
      "path": "agents/specialized-legal-document-review.json",
      "supervisor": null,
      "priority": "critical"
    }
  ],
  "required_mcps": "mcps.json",
  "global_workflows": []
}
```

---

## Agent Profile Specification (`agents/*.json`)
Native AI-Tadpole-OS agents are model-agnostic and capability-driven. They must only define identity and reference the capabilities (skills and workflows) they possess.

### Schema Properties
- `id` (string, required): Unique identifier for the agent.
- `name` (string, required): Display name of the agent.
- `role` (string, required): Role title.
- `department` (string, required): Department category.
- `description` (string, required): A brief description of the agent's function.
- `status` (string, required): Initial runtime state. Installable registry agents use the upstream-native `"idle"` state.
- `model_config` (object, required):
  - `provider` (string, required): Consumer model provider (for example, `"google"`).
  - `model_id` (string, required by this registry): Explicit provider model ID.
  - `system_prompt` (string, required): Personality and high-level role definition (Max 800 characters). Must refer to the associated workflow SOP.
- `skills` (array of strings): Exact Tadpole capability/tool IDs (e.g., `["read_file", "grep_search"]`). Use `write_file`, not legacy `write_to_file`. Shell-capable agents declare both `execute_shell` and the required `shell` marker.
- `workflows` (array of strings): List of referenced workflow IDs (e.g., `["legal_document_review"]`). OKF playbooks cannot be referenced as executable agent workflows.
- `mcp_tools` (array of strings, required by this registry): Active external MCP authorization declarations in exact canonical `server:tool` or encoded `mcp__server__tool` form. Wildcards (`server:*`) are prohibited in builder exports and production templates. An empty array grants no external MCP tools. Native tools remain governed by skills, ACL, and oversight policy.
- `requires_oversight` (boolean, required by this registry): Whether the runtime must route tool calls through operator oversight. It must be `true` for declared write, delete, shell capabilities, or mutating/executing (`write` / `execute`) MCP tool grants.

### Example
```json
{
  "id": "specialized-legal-document-review",
  "name": "Legal Document Review",
  "role": "Legal Document Review Specialist",
  "department": "Legal Operations",
  "description": "Meticulous first-pass contract analysis and compliance validation specialist.",
  "status": "idle",
  "model_config": {
    "provider": "google",
    "model_id": "gemini-pro-latest",
    "system_prompt": "You are a meticulous, legally-informed document analysis specialist. Frame all findings as 'flagged for attorney review'. Confidentiality is absolute. Follow the associated workflow SOP precisely."
  },
  "skills": [
    "read_file",
    "grep_search"
  ],
  "workflows": [
    "legal_document_review"
  ],
  "mcp_tools": [],
  "requires_oversight": false
}
```

---

## Workflow Specification (`workflows/*.md`)
Workflows represent executable Standard Operating Procedures (SOPs) written in markdown. The AI-Tadpole-OS workflow engine parses steps sequentially based on heading hierarchy.

### Rules & Structure
1. **Title**: The workflow must start with `# Workflow: [Name] SOP` (or equivalent title).
2. **Procedural Blocks**: Incorporates global instructions (e.g. Overview, Critical Rules, Technical Deliverables).
3. **Executable Headings**: The pinned consumer parser treats every `##` or `###` heading as a step boundary, so a workflow must contain at least one such heading. The preferred registry style is `## Step [Number]: [Name]` or `## Step [Name]`.
   - Examples of valid headers:
     - `## Step 1: Document Intake & Classification`
     - `## Step 2: Structural Analysis`
4. **Step Content**: Details instructions, templates, checklists, or logic to be executed in this step.

### Example
```markdown
# Workflow: Legal Document Review Specialist SOP

## Overview
Perform thorough, accurate, and attorney-ready first-pass document review that surfaces risks, summarizes key terms, flags problematic clauses, and checks compliance.

## Critical Rules
1. **Never provide legal advice.** Always frame findings as "flagged for attorney review".
2. **Confidentiality is absolute.**

## Step 1: Document Intake & Classification
1. Identify document type (contract, motion, lease, settlement, etc.).
2. Identify the parties and set the risk tolerance level.

## Step 2: Structural Analysis
1. Map the document structure (sections, exhibits, attachments).
2. Check for missing standard provisions.
```
