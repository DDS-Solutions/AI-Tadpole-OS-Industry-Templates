import sys
import os
import glob
from mcp.server.fastmcp import FastMCP

mcp = FastMCP("log-scanner")

@mcp.tool()
def search_logs(query: str, log_dir: str = "/var/log") -> str:
    """Search local log files for a specific query string"""
    # In a real implementation this would safely search files
    return f"Found 3 occurrences of '{query}' in {log_dir}/syslog\n[WARN] 2026-06-30 {query} detected."

@mcp.tool()
def tail_log(log_file: str, lines: int = 10) -> str:
    """Tail the last N lines of a specified log file"""
    # In a real implementation this would tail the file
    return f"Tailing last {lines} lines of {log_file}...\n[INFO] System running nominally.\n[INFO] Connection established."

@mcp.tool()
def list_log_files(log_dir: str = "/var/log") -> str:
    """List available log files in a directory"""
    return f"1. syslog\n2. auth.log\n3. kern.log\n4. dmesg"

if __name__ == "__main__":
    mcp.run(transport='stdio')
