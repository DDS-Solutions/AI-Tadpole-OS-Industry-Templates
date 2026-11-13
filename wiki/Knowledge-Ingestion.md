# Institutional Knowledge & Playbook Ingestion (OKF)

When vector memory and an embedding provider are available, AI-Tadpole-OS swarms organize corporate standard operating procedures (SOPs) and institutional knowledge for preview and Open Knowledge Foundation (OKF) indexing.

---

## 📁 Playbook Formats

Swarm templates can bundle institutional knowledge in two distinct, concurrent formats:

### Format A: Markdown SOPs (Recommended)
Markdown files placed within a template's `/knowledge/` subdirectory hold full SOP documents. YAML frontmatter at the top of each markdown file captures indexing metadata:

```markdown
---
title: "Factory ISO 9000 Receiving Procedure"
url: "https://wiki.internal.company.com/iso9000/receiving"
tags: "manufacturing, QA, receiving, ISO-9000"
description: "SOP for receiving incoming parts and verifying chemical batch sheets."
---
# Raw Materials Receiving SOP

1. Verify batch documentation matches container seal numbers.
2. Log container status in the shipping docket.
3. If container temperature is out of bounds, quarantine the batch.
```

The body must contain the actual playbook; a reference such as `/workflows/example.md` is not resolved into that file's contents. OKF playbooks also cannot be referenced inside an agent's executable `workflows` array.

### Format B: Structured JSON (`knowledge.json`)
For structured catalogs and UI preview (`PlaybookPreview[]`), provide a `knowledge.json` file in the template root directory matching [`schemas/knowledge-v1.json`](../schemas/knowledge-v1.json):

```json
[
  {
    "title": "Ad Spend Verification SOP",
    "description": "Validation checklist for marketing purchases.",
    "topic": "marketing",
    "concept_type": "playbook",
    "resource_uri": "https://wiki.internal.company.com/marketing/ad-spend",
    "tags": ["marketing", "advertising", "compliance"],
    "text": "Detailed standard operating procedure text goes here..."
  }
]
```

Every entry must contain non-empty `text` and `topic` strings, and `tags` (when present) must be an array of strings (`string[]`).

---

## ⚡ Preview & Activation Boundary

```mermaid
graph TD
    Template[Template Knowledge Assets] --> DetectMD[/knowledge/*.md]
    Template --> DetectJSON[knowledge.json]
    DetectMD --> Validate[Registry & Schema Validation]
    DetectJSON --> Validate
    Validate --> Preview[Consumer UI Playbook Preview]
    Preview --> Operator[Optional Downstream OKF Indexing]
```

- **Hardened `v1.1.464` Install Boundary**: Per [`COMPATIBILITY_MATRIX.md`](../COMPATIBILITY_MATRIX.md), the hardened install transaction fetches `knowledge.json` for UI preview (`fetchKnowledgeBase` -> `PlaybookPreview[]`) and does not claim automatic install-time OKF database ingestion. Treat knowledge assets as publication-validated content until an explicit transactional knowledge-activation API is invoked.
- **Swarm Architect Parity**: Swarm Architect writes the full playbook text to both `knowledge.json` (with `tags` exported as `string[]` and normalized `string[]`/`string` handling on repo import) and `knowledge/*.md`, and prevents normalized knowledge filenames from colliding.
