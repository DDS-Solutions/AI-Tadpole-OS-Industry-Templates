"""Compatibility lockfile generator and drift verifier for AI-Tadpole-OS contracts."""

from __future__ import annotations

import argparse
import hashlib
import json
import sys
from pathlib import Path
from typing import Any

ROOT = Path(__file__).resolve().parents[1]
LOCKFILE_PATH = ROOT / "compatibility.lock.json"

CRITICAL_CONTRACT_FILES = [
    "scripts/validate_template.py",
    "scripts/migrate_consumer_contract.py",
    "scripts/capabilities.py",
    "registry.json",
    "mcp_registry.json",
    "index.json",
    "TEMPLATE_SPEC.md",
    "COMPATIBILITY_MATRIX.md",
]


def compute_sha256(path: Path) -> str:
    content = path.read_bytes().replace(b"\r\n", b"\n")
    return hashlib.sha256(content).hexdigest()



def generate_lock_data() -> dict[str, Any]:
    file_hashes: dict[str, str] = {}
    for relative_path in sorted(CRITICAL_CONTRACT_FILES):
        full_path = ROOT / relative_path
        if not full_path.is_file():
            raise FileNotFoundError(f"Critical contract file missing: {relative_path}")
        file_hashes[relative_path] = compute_sha256(full_path)

    return {
        "version": "1.0.0",
        "consumer": {
            "repository": "https://github.com/DDS-Solutions/TadPole-OS",
            "branch": "main",
            "pinned_revision": "7fc749fe11d6e7dd05c24b041e4bcaf0e93c0227",
            "review_date": "2026-09-01",
        },
        "upstream": {
            "repository": "https://github.com/DDS-Solutions/AI-Tadpole-OS-Industry-Templates",
            "target_branch": "main",
            "pinned_contract_version": "1.0.0",
        },
        "critical_contract_files": file_hashes,
    }


def write_lockfile() -> None:
    data = generate_lock_data()
    LOCKFILE_PATH.write_text(json.dumps(data, indent=2) + "\n", encoding="utf-8")
    print(f"Generated {LOCKFILE_PATH.relative_to(ROOT)} successfully.")


def verify_lockfile() -> bool:
    if not LOCKFILE_PATH.is_file():
        print(f"ERROR: Lockfile missing at {LOCKFILE_PATH.relative_to(ROOT)}", file=sys.stderr)
        return False

    try:
        lock_data = json.loads(LOCKFILE_PATH.read_text(encoding="utf-8"))
    except Exception as exc:
        print(f"ERROR: Cannot parse {LOCKFILE_PATH.name}: {exc}", file=sys.stderr)
        return False

    recorded_hashes = lock_data.get("critical_contract_files", {})
    mismatches: list[str] = []

    for relative_path in CRITICAL_CONTRACT_FILES:
        full_path = ROOT / relative_path
        if not full_path.is_file():
            mismatches.append(f"Missing file: {relative_path}")
            continue
        current_hash = compute_sha256(full_path)
        expected_hash = recorded_hashes.get(relative_path)
        if expected_hash is None:
            mismatches.append(f"Unrecorded contract file in lock: {relative_path}")
        elif current_hash != expected_hash:
            mismatches.append(
                f"Drift detected in {relative_path} (current: {current_hash[:12]}..., expected: {expected_hash[:12]}...)"
            )

    if mismatches:
        print(f"ERROR: Contract drift detected ({len(mismatches)} mismatch(es)):", file=sys.stderr)
        for mismatch in mismatches:
            print(f"  - {mismatch}", file=sys.stderr)
        print("Run 'python scripts/verify_compatibility_lock.py --generate' if changes were intentional.", file=sys.stderr)
        return False

    print("Compatibility lockfile integrity check passed: 0 drift(s) detected.")
    return True


def main() -> int:
    parser = argparse.ArgumentParser(description="Verify or regenerate compatibility.lock.json")
    parser.add_argument("--generate", action="store_true", help="Regenerate the compatibility lockfile")
    parser.add_argument("--check", action="store_true", default=True, help="Verify lockfile against current files")
    args = parser.parse_args()

    if args.generate:
        write_lockfile()
        return 0

    return 0 if verify_lockfile() else 1


if __name__ == "__main__":
    sys.exit(main())
