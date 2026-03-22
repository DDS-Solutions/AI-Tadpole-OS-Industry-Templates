# Daily Reconciliation Workflow
*Optimized for Tadpole OS*

## Objective
To ensure that all bank transactions match internal records and are correctly categorized in the general ledger.

## Steps
1. **Fetch Bank Statement**: The `Bookkeeper Bot` retrieves the latest transactions from the connected bank MCP or uploaded PDF/CSV.
2. **Scan Internal Records**: Review local `data/finance` logs for matching entries.
3. **Categorize**:
   - Assign categories (Rent, Payroll, Utilities, etc.) based on merchant names.
   - Flag unknown merchants for human review.
4. **Tax Scan**: The `Tax Strategist` scans categorized expenses for potential deductions (Section 179, R&D credits, etc.).
5. **Final Review**: The `Audit Overseer` generates a daily summary report for the business owner.

## Troubleshooting
- If a transaction is duplicated, check if it was both a credit card charge and a bank transfer.
- For mixed-use expenses, split the transaction 50/50 and flag for manual approval.
