import sys
from mcp.server.fastmcp import FastMCP

mcp = FastMCP("smb-accounting")

@mcp.tool()
def get_invoice(invoice_id: str) -> str:
    """Get invoice details by ID"""
    return f"Invoice {invoice_id}: Total $150.00, Status: Pending, Customer: Acme Corp"

@mcp.tool()
def create_invoice(customer_id: str, amount: float) -> str:
    """Create a new invoice for a customer"""
    return f"Created invoice INV-999 for customer {customer_id} with amount ${amount}"

@mcp.tool()
def get_account_balance(account_id: str) -> str:
    """Get the current balance for an account"""
    return f"Account {account_id} balance: $5,240.50"

if __name__ == "__main__":
    mcp.run(transport='stdio')
