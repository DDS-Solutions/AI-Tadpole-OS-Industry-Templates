"""Deterministic reference MCP server for smoke testing."""

from __future__ import annotations

import json
import sys


def handle_request(request: dict) -> dict | None:
    method = request.get("method")
    request_id = request.get("id")
    if method == "initialize":
        result = {
            "protocolVersion": "2024-11-05",
            "capabilities": {"tools": {}},
            "serverInfo": {"name": "smoke-connector", "version": "1.0.0"},
        }
    elif method == "notifications/initialized":
        return None
    elif method == "tools/list":
        result = {
            "tools": [
                {
                    "name": "healthcheck",
                    "description": "Returns status ok for smoke test verification",
                    "inputSchema": {
                        "type": "object",
                        "properties": {},
                    },
                }
            ]
        }
    elif method == "tools/call":
        result = {
            "content": [
                {"type": "text", "text": "smoke-test: OK"}
            ]
        }
    else:
        return {
            "jsonrpc": "2.0",
            "id": request_id,
            "error": {"code": -32601, "message": f"Method {method} not found"},
        }
    return {"jsonrpc": "2.0", "id": request_id, "result": result}


def main() -> None:
    for line in sys.stdin:
        line = line.strip()
        if not line:
            continue
        try:
            req = json.loads(line)
            res = handle_request(req)
            if res is not None:
                sys.stdout.write(json.dumps(res) + "\n")
                sys.stdout.flush()
        except Exception as exc:
            sys.stderr.write(f"Error handling request: {exc}\n")


if __name__ == "__main__":
    main()
