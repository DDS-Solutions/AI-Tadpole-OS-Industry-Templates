# Workflow: Legal Docket & Notice Compliance SOP

## Purpose

Extract contractual notice dates, statutory limitations, and court filing deadlines into a conservative, double-verified compliance calendar for paralegal and supervising attorney sign-off.

## Step 1: Source Date Extraction

- Inspect executed contracts, court notices, and agency correspondence with `read_file` and `grep_search` to list every explicit deadline, cure period, and auto-renewal opt-out date.
- Distinguish business days vs. calendar days verbatim from the source instrument and record missing effective dates as blocking gaps.

## Step 2: Jurisdiction & Buffer Calculation

- Apply conservative internal reminder buffers (e.g., T-30, T-14, T-7, T-2 business days) ahead of each hard statutory or contractual cutoff.
- Flag potential weekend or court-holiday boundary ambiguities for manual verification rather than guessing local rule extensions.

## Step 3: Compliance Register Draft & Verification

- Write a draft docket register referencing source document line/section citations, responsible attorney, and verification status (`pending_counsel_check`).
- Cross-check overlapping obligations against active matter schedules in the workspace.

## Step 4: Attorney Sign-Off Gate

- Escalate any statutory filing window within 14 days or missing service proof immediately to the Supervising Attorney.
- Require explicit human sign-off before committing dates to the authoritative firm docket system.
