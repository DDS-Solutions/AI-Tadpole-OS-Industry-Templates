# Tadpole OS Template Specification

This document details the directory layout, schema definitions, and format specifications for native templates in Tadpole OS.

---

## Directory Layout
Each template directory (e.g., `legal/contract-review/`) must follow this structure:

```
<template-directory>/
├── swarm.json          # Swarm metadata and roster IDs
├── mcps.json           # MCP connector configurations
├── agents/             # Slim capability-driven agent JSON files
│   └── *.json          # No massive system_prompt; references workflows/ & skills/
├── skills/             # Schema definitions for custom skills (optional)
│   └── *.json
└── workflows/          # Executable markdown SOP files
    └── *.md
```

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
Native Tadpole OS agents are model-agnostic and capability-driven. They must only define identity and reference the capabilities (skills and workflows) they possess.

### Schema Properties
- `id` (string, required): Unique identifier for the agent.
- `name` (string, required): Display name of the agent.
- `role` (string, required): Role title.
- `department` (string, required): Department category.
- `description` (string, required): A brief description of the agent's function.
- `model_config` (object, required):
  - `system_prompt` (string, required): Personality and high-level role definition (Max 800 characters). Must refer to the associated workflow SOP.
- `skills` (array of strings): List of capability/tool IDs (e.g., `["read_file", "grep_search"]`).
- `workflows` (array of strings): List of referenced workflow IDs (e.g., `["legal_document_review"]`).

### Example
```json
{
  "id": "specialized-legal-document-review",
  "name": "Legal Document Review",
  "role": "Legal Document Review Specialist",
  "department": "Legal Operations",
  "description": "Meticulous first-pass contract analysis and compliance validation specialist.",
  "model_config": {
    "system_prompt": "You are a meticulous, legally-informed document analysis specialist. Frame all findings as 'flagged for attorney review'. Confidentiality is absolute. Follow the associated workflow SOP precisely."
  },
  "skills": [
    "read_file",
    "grep_search"
  ],
  "workflows": [
    "legal_document_review"
  ]
}
```

---

## Workflow Specification (`workflows/*.md`)
Workflows represent executable Standard Operating Procedures (SOPs) written in markdown. The Tadpole OS workflow engine parses steps sequentially based on heading hierarchy.

### Rules & Structure
1. **Title**: The workflow must start with `# Workflow: [Name] SOP` (or equivalent title).
2. **Procedural Blocks**: Incorporates global instructions (e.g. Overview, Critical Rules, Technical Deliverables).
3. **Strict Step Headers**: Individual steps must be declared using `## Step [Number]: [Name]` or `## Step [Name]`.
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
