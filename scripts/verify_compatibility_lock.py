"""Compatibility lockfile generator and drift verifier for AI-Tadpole-OS contracts."""

from __future__ import annotations

import argparse
import hashlib
import json
import os
import re
import sys
from pathlib import Path
from typing import Any

ROOT = Path(__file__).resolve().parents[1]
LOCKFILE_PATH = ROOT / "compatibility.lock.json"

CRITICAL_CONTRACT_FILES = [
    "scripts/validate_template.py",
    "scripts/migrate_consumer_contract.py",
    "scripts/capabilities.py",
    # The verifier pins itself so edits to this list cannot silently drop coverage.
    "scripts/verify_compatibility_lock.py",
    "registry.json",
    "mcp_registry.json",
    "index.json",
    "TEMPLATE_SPEC.md",
    "COMPATIBILITY_MATRIX.md",
]


def compute_sha256(path: Path) -> str:
    content = path.read_bytes().replace(b"\r\n", b"\n")
    return hashlib.sha256(content).hexdigest()



def generate_lock_data(
    pinned_revision: str | None = None,
    review_date: str | None = None,
) -> dict[str, Any]:
    file_hashes: dict[str, str] = {}
    for relative_path in sorted(CRITICAL_CONTRACT_FILES):
        full_path = ROOT / relative_path
        if not full_path.is_file():
            raise FileNotFoundError(f"Critical contract file missing: {relative_path}")
        file_hashes[relative_path] = compute_sha256(full_path)

    existing_consumer: dict[str, Any] = {}
    if LOCKFILE_PATH.is_file():
        try:
            existing_data = json.loads(LOCKFILE_PATH.read_text(encoding="utf-8"))
            if isinstance(existing_data.get("consumer"), dict):
                existing_consumer = existing_data["consumer"]
        except Exception:
            pass

    resolved_revision = (
        pinned_revision
        or existing_consumer.get("pinned_revision")
        or "16bef2d75951860d15dba32d9750acb69b097bba"
    )
    resolved_date = (
        review_date
        or existing_consumer.get("review_date")
        or "2026-10-29"
    )

    return {
        "version": "1.0.0",
        "consumer": {
            "repository": "https://github.com/DDS-Solutions/AI-TadPole-OS",
            "branch": "main",
            "pinned_revision": resolved_revision,
            "review_date": resolved_date,
        },
        "upstream": {
            "repository": "https://github.com/DDS-Solutions/AI-Tadpole-OS-Industry-Templates",
            "target_branch": "main",
            "pinned_contract_version": "1.0.0",
        },
        "critical_contract_files": file_hashes,
    }


def write_lockfile(
    pinned_revision: str | None = None,
    review_date: str | None = None,
) -> None:
    data = generate_lock_data(pinned_revision=pinned_revision, review_date=review_date)
    LOCKFILE_PATH.write_text(json.dumps(data, indent=2) + "\n", encoding="utf-8")
    print(f"Generated {LOCKFILE_PATH.relative_to(ROOT)} successfully.")


def resolve_git_head_revision(repo_root: Path) -> str | None:
    """Resolve git HEAD SHA from a checkout without spawning subprocesses."""
    git_entry = repo_root / ".git"
    git_dir = git_entry
    if git_entry.is_file():
        raw = git_entry.read_text(encoding="utf-8", errors="ignore").strip()
        if raw.startswith("gitdir:"):
            target = raw.split(":", 1)[1].strip()
            git_dir = (repo_root / target).resolve()
    if not git_dir.is_dir():
        return None
    head_file = git_dir / "HEAD"
    if not head_file.is_file():
        return None
    head_val = head_file.read_text(encoding="utf-8", errors="ignore").strip()
    if head_val.startswith("ref:"):
        ref_rel = head_val.split(":", 1)[1].strip()
        ref_file = git_dir / ref_rel
        if ref_file.is_file():
            return ref_file.read_text(encoding="utf-8", errors="ignore").strip()
        packed_refs = git_dir / "packed-refs"
        if packed_refs.is_file():
            for line in packed_refs.read_text(encoding="utf-8", errors="ignore").splitlines():
                line = line.strip()
                if not line or line.startswith("#") or line.startswith("^"):
                    continue
                parts = line.split()
                if len(parts) == 2 and parts[1] == ref_rel:
                    return parts[0]
        return None
    return head_val if re.fullmatch(r"[0-9a-fA-F]{40}", head_val) else None


def verify_consumer_repo(
    consumer_repo: Path,
    expected_revision: str | None = None,
) -> list[str]:
    """Cross-check live constants in an arbitrary local clone of AI-TadPole-OS."""
    mismatches: list[str] = []
    if not consumer_repo.is_dir():
        return [f"Consumer repository path does not exist: {consumer_repo}"]

    head_sha = resolve_git_head_revision(consumer_repo)
    if expected_revision and head_sha and head_sha != expected_revision:
        mismatches.append(
            f"Consumer git HEAD mismatch (checkout: {head_sha[:12]}..., pinned: {expected_revision[:12]}...)"
        )

    validate_rs = consumer_repo / "server-rs" / "src" / "routes" / "templates" / "validate.rs"
    if not validate_rs.is_file():
        validate_rs = consumer_repo / "server-rs" / "src" / "routes" / "templates.rs"
    if validate_rs.is_file():
        text = validate_rs.read_text(encoding="utf-8", errors="ignore")
        match = re.search(r"ALLOWED_SKILL_EXTENSIONS:\s*&\[&str\]\s*=\s*&\[([^\]]+)\]", text)
        if match:
            consumer_exts = {
                f".{item.strip().strip('\"')}"
                for item in match.group(1).split(",")
                if item.strip().strip('"')
            }
            required_skill_exts = {".json", ".py", ".js", ".ts"}
            missing_exts = sorted(required_skill_exts - consumer_exts)
            if missing_exts:
                mismatches.append(
                    f"Consumer ALLOWED_SKILL_EXTENSIONS missing registry skill extensions: {missing_exts}"
                )
    else:
        mismatches.append("Consumer templates validate module not found under server-rs/src/routes/")

    mcp_config_rs = consumer_repo / "server-rs" / "src" / "agent" / "mcp" / "config.rs"
    if mcp_config_rs.is_file():
        text = mcp_config_rs.read_text(encoding="utf-8", errors="ignore")
        match = re.search(r"ENGINE_PRIVATE_ENV_VARS:\s*&\[&str\]\s*=\s*&\[([^\]]+)\]", text)
        if match:
            consumer_vars = {
                item.strip().strip('"').upper()
                for item in match.group(1).split(",")
                if item.strip().strip('"')
            }
            if str(ROOT) not in sys.path:
                sys.path.insert(0, str(ROOT))
            from scripts.validate_template import ENGINE_PRIVATE_ENV_VARS
            if consumer_vars != set(ENGINE_PRIVATE_ENV_VARS):
                mismatches.append(
                    f"ENGINE_PRIVATE_ENV_VARS drift between consumer ({sorted(consumer_vars)}) "
                    f"and validator ({sorted(ENGINE_PRIVATE_ENV_VARS)})"
                )
    else:
        mismatches.append("Consumer MCP config module not found at server-rs/src/agent/mcp/config.rs")

    return mismatches


def verify_lockfile(
    consumer_repo: Path | None = None,
    pinned_revision: str | None = None,
) -> bool:
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

    consumer_meta = lock_data.get("consumer", {})
    if consumer_meta.get("repository") != "https://github.com/DDS-Solutions/AI-TadPole-OS":
        mismatches.append(
            f"Unexpected consumer.repository in lockfile: {consumer_meta.get('repository')!r}"
        )
    if pinned_revision and consumer_meta.get("pinned_revision") != pinned_revision:
        mismatches.append(
            f"Pinned revision mismatch in lockfile (expected {pinned_revision}, got {consumer_meta.get('pinned_revision')})"
        )

    stale_entries = set(recorded_hashes.keys()) - set(CRITICAL_CONTRACT_FILES)
    for stale in sorted(stale_entries):
        mismatches.append(f"Stale contract file in lock: {stale}")

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

    if consumer_repo is not None:
        expected_rev = pinned_revision or consumer_meta.get("pinned_revision")
        mismatches.extend(verify_consumer_repo(consumer_repo, expected_revision=expected_rev))

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
    mode = parser.add_mutually_exclusive_group()
    mode.add_argument("--generate", action="store_true", help="Regenerate the compatibility lockfile")
    mode.add_argument("--check", action="store_true", help="Verify lockfile against current files (default mode)")
    parser.add_argument("--pinned-revision", help="Override or assert pinned consumer git commit revision")
    parser.add_argument("--review-date", help="Override consumer review date (YYYY-MM-DD)")
    parser.add_argument(
        "--consumer-repo",
        default=os.environ.get("TADPOLE_OS_REPO_PATH"),
        help="Optional local path to a cloned https://github.com/DDS-Solutions/AI-TadPole-OS checkout for live constant verification",
    )
    args = parser.parse_args()

    if args.generate:
        write_lockfile(
            pinned_revision=args.pinned_revision,
            review_date=args.review_date,
        )
        return 0

    consumer_path = Path(args.consumer_repo) if args.consumer_repo else None
    # --check and the bare invocation are both verify-only and never write.
    return 0 if verify_lockfile(consumer_repo=consumer_path, pinned_revision=args.pinned_revision) else 1


if __name__ == "__main__":
    sys.exit(main())
