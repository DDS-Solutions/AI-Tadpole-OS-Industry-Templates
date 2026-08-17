"""Deterministic reference MCP server for smoke testing."""

from __future__ import annotations

import json
import sys


def handle_request(request: dict) -> dict:
    method = request.get("method")
    if method == "tools/list":
        return {
            "tools": [
                {
                    "name": "smoke:healthcheck",
                    "description": "Returns status ok for smoke test verification",
                    "inputSchema": {
                        "type": "object",
                        "properties": {},
                    },
                }
            ]
        }
    if method == "tools/call":
        return {
            "content": [
                {"type": "text", "text": "smoke-test: OK"}
            ]
        }
    return {"error": {"code": -32601, "message": f"Method {method} not found"}}


def main() -> None:
    for line in sys.stdin:
        line = line.strip()
        if not line:
            continue
        try:
            req = json.loads(line)
            res = handle_request(req)
            sys.stdout.write(json.dumps(res) + "\n")
            sys.stdout.flush()
        except Exception as exc:
            sys.stderr.write(f"Error handling request: {exc}\n")


if __name__ == "__main__":
    main()
