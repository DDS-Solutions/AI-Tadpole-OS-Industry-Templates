# Workflow: Legal Client Intake & Conflict Check SOP

## Purpose

Execute deterministic prospective-matter intake, cross-party conflict screening, and engagement packet preparation while preserving attorney-client confidentiality and enforcing supervising partner sign-off before opening a matter or giving legal advice.

## Step 1: Validate Matter Disclosures & Party Register

- Verify prospective client legal name, parent/subsidiary affiliates, opposing counsel, adverse parties, and billing contact against supplied intake records.
- Flag missing party identifiers, ambiguous corporate entities, or unsigned confidentiality waivers immediately without assuming facts.

## Step 2: Conflict of Interest Screening

- Search firm active, closed, and declined matter registers using `grep_search` across exact names, DBA aliases, and key principals.
- Classify hits as `clear`, `potential_conflict` (requiring ethical wall assessment), or `blocked`; never waive a conflict autonomously.

## Step 3: Draft Engagement Letter & Matter Dossier

- Prepare a draft engagement letter using approved firm fee templates, explicitly marking scope exclusions, retainer terms, and `PROVISIONAL - REQUIRES PARTNER SIGNATURE`.
- Record provenance links to every searched register file and hand off verified documents for substantive review.

## Step 4: Escalation & Partner Sign-Off Gate

- Route every conflict hit, multi-jurisdiction representation question, or non-standard fee arrangement to the Managing Partner.
- Require explicit human approval before sending any external engagement letter or activating billing.
