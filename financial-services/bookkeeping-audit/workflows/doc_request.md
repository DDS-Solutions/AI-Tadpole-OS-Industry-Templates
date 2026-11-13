# Workflow: Audit & Close PBC Document Request SOP

## Purpose

Maintain complete Prepared-By-Client (PBC) close checklists, log missing substantiation documents, and draft consolidated client request packets under engagement lead oversight.

## Step 1: Audit Open PBC Checklist Items

- Scan local workspace receipts, bank PDFs, payroll registers, and loan statements via `grep_search` and `read_file` against the period close checklist.

## Step 2: Consolidate Missing Source Requests

- Group missing items by accounting owner with exact transaction dates, dollar amounts, and vendor names so the client receives one concise request rather than fragmented emails.

## Step 3: Update Evidence Index & Draft Request

- Record received document filenames and flag altered or unreadable scans; draft a client request email excluding sensitive tax IDs in body text.

## Step 4: Engagement Lead Review Gate

- Submit the consolidated PBC chase draft to the Bookkeeper Controller or Engagement Lead before external delivery.
