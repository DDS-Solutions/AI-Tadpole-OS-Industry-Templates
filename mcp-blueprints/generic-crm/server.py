import sys
from mcp.server.fastmcp import FastMCP

mcp = FastMCP("generic-crm")

@mcp.tool()
def get_crm_contact(contact_id: str) -> str:
    """Get a CRM contact by ID"""
    return f"Mock Contact {contact_id}: John Doe, john.doe@example.com"

@mcp.tool()
def update_invoice(invoice_id: str, status: str) -> str:
    """Update invoice status"""
    return f"Invoice {invoice_id} updated to {status}"

@mcp.tool()
def list_recent_changes() -> str:
    """List recent changes in CRM"""
    return "1. Contact John Doe added\n2. Invoice 123 updated to Paid"

if __name__ == "__main__":
    mcp.run(transport='stdio')
