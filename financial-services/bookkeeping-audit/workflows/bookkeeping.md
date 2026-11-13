# Workflow: Monthly Bookkeeping & Bank Reconciliation SOP

## Purpose

Execute evidence-backed general ledger reconciliation, expense categorization, and close variance reporting without inventing chart-of-accounts mappings, plug entries, or tax positions.

## Step 1: Bank & Card Statement Tie-Out

- Read bank statements, credit-card exports, and trial balance extracts via `read_file`.
- Match settled deposits and disbursements deterministically by date, reference ID, and exact penny amount; list clearing timing differences separately.

## Step 2: Expense Categorization & Receipt Verification

- Apply approved chart-of-accounts rules from local policy files; verify vendor W-9 status and receipt documentation on disbursements above threshold.
- Route uncategorized transfers, personal/commingled charges, or missing receipts to the Document Request Coordinator instead of guessing tax deductibility.

## Step 3: Draft Adjusting Entry & Variance Workpaper

- Prepare proposed accruals, prepaid amortizations, and variance explanations linking directly to invoice/receipt source paths.

## Step 4: CPA / Controller Sign-Off Gate

- Hold all adjusting journal entries, tax classifications, and period-close checklists until the CPA or Controller signs off.
