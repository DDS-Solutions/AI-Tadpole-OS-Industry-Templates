"""Validate registry assets against the pinned private Tadpole-OS contract."""

from __future__ import annotations

import argparse
import hashlib
import json
import re
import sys
import urllib.parse
from dataclasses import dataclass, field
from pathlib import Path
from typing import Any

import jsonschema

try:
    from scripts.capabilities import DANGEROUS_CAPABILITY_IDS, VALID_CAPABILITY_IDS
    from scripts._generated_contract import (
        ALLOWED_MCP_COMMANDS,
        ALLOWED_MCP_PROTOCOL_VERSIONS,
        CANONICAL_INDUSTRIES,
        ENGINE_PRIVATE_ENV_VARS,
        LEGACY_CAPABILITIES,
        PLANE2_DEPARTMENT_MARKER,
        PLANE2_FORBIDDEN_CAPABILITIES,
        PROMPT_INJECTION_PATTERN_SPECS,
        RESERVED_MCP_HTTP_HEADER_PREFIXES,
        RESERVED_MCP_HTTP_HEADERS,
    )
except ImportError:  # executed directly as `python scripts/validate_template.py`
    from capabilities import DANGEROUS_CAPABILITY_IDS, VALID_CAPABILITY_IDS
    from _generated_contract import (
        ALLOWED_MCP_COMMANDS,
        ALLOWED_MCP_PROTOCOL_VERSIONS,
        CANONICAL_INDUSTRIES,
        ENGINE_PRIVATE_ENV_VARS,
        LEGACY_CAPABILITIES,
        PLANE2_DEPARTMENT_MARKER,
        PLANE2_FORBIDDEN_CAPABILITIES,
        PROMPT_INJECTION_PATTERN_SPECS,
        RESERVED_MCP_HTTP_HEADER_PREFIXES,
        RESERVED_MCP_HTTP_HEADERS,
    )


REQUIRED_AGENT_STRINGS = (
    "id",
    "name",
    "role",
    "department",
    "description",
    "status",
)
EXECUTABLE_HEADING = re.compile(r"^#{2,3}[ \t]+\S", re.MULTILINE)
MAX_PACKAGE_FILE_BYTES = 1_000_000
TEMPLATE_FILE_SUFFIXES = frozenset({".json", ".md"})
TEMPLATE_SKILL_FILE_SUFFIXES = frozenset({".json", ".py", ".js", ".ts"})
CONNECTOR_FILE_SUFFIXES = frozenset({".json", ".py", ".js", ".ts", ".txt"})
ALLOWED_MCP_PROTOCOLS = ALLOWED_MCP_PROTOCOL_VERSIONS
VALID_ENV_OR_HEADER_VAR = re.compile(r"^[A-Za-z_][A-Za-z0-9_]*$")
SAFE_AGENT_IDENTIFIER = re.compile(r"^[a-zA-Z0-9_-]{1,64}$")
VALID_HEADER_TOKEN_PATTERN = re.compile(r"^[!#$%&'*+\-.^_`|~0-9A-Za-z]+$")
STUTTERING_NAME_PATTERN = re.compile(r"\b([A-Za-z]{2,})\s+\1\b", re.IGNORECASE)
PROMPT_INJECTION_PATTERNS = tuple(
    (label, re.compile(pattern, re.IGNORECASE if ignore_case else 0))
    for label, pattern, ignore_case in PROMPT_INJECTION_PATTERN_SPECS
)
LEGACY_SKILLS = LEGACY_CAPABILITIES
# Single source of truth: schemas/capabilities-contract.json -> scripts/capabilities.py
DANGEROUS_SKILLS = DANGEROUS_CAPABILITY_IDS
# Catalog fields shared by registry.json and index.json that must agree
CATALOG_PARITY_FIELDS = ("name", "description", "required_skills", "required_models", "content_sha256")
SENSITIVE_ENV_NAME = re.compile(
    r"(?:KEY|TOKEN|SECRET|PASSWORD|CREDENTIAL|CONNECTION_STRING|CONN_STR|AUTH)",
    re.IGNORECASE,
)
SAFE_PLACEHOLDER = re.compile(
    r"(?:YOUR_[A-Z0-9_]+|CONFIGURE_LOCALLY|REPLACE_ME|CHANGEME|"
    r"DUMMY(?:_[A-Z0-9_]+)?|\$\{[A-Z0-9_]+\}|<[A-Za-z0-9_ -]+>)",
    re.IGNORECASE,
)
PINNED_REQUIREMENT = re.compile(
    r"^(?P<package>[A-Za-z0-9][A-Za-z0-9_.-]*(?:\[[A-Za-z0-9_, -]+\])?)==(?P<version>[A-Za-z0-9][A-Za-z0-9_.+!-]*)$"
)
SHA256_HEX = re.compile(r"^[0-9a-f]{64}$")
MCP_TOOL_DECLARATION = re.compile(
    r"^(?:mcp__[A-Za-z0-9_.-]+__[A-Za-z0-9_.-]+|[A-Za-z0-9_.-]+:[A-Za-z0-9_.-]+)$"
)
SHELL_CONTROL = re.compile(r"(?:\r|\n|&&|\|\||[;|<>`]|(?:\$\()|(?:\$\{))")
FENCED_CODE_BLOCK = re.compile(r"```[\s\S]*?```", re.MULTILINE)
SECRET_PATTERNS = (
    ("private key", re.compile(r"-----BEGIN (?:RSA |EC |OPENSSH |DSA )?PRIVATE KEY-----")),
    ("AWS access key", re.compile(r"\b(?:AKIA|ASIA)[A-Z0-9]{16}\b")),
    ("GitHub token", re.compile(r"\b(?:gh[pousr]_[A-Za-z0-9]{36,}|github_pat_[A-Za-z0-9_]{20,})\b")),
    ("Google API key", re.compile(r"\bAIza[0-9A-Za-z_-]{35}\b")),
    ("Slack token", re.compile(r"\bxox[baprs]-[A-Za-z0-9-]{10,}\b")),
    ("Stripe secret key", re.compile(r"\bsk_(?:live|test)_[0-9A-Za-z]{20,}\b")),
    ("OpenAI API key", re.compile(r"\bsk-(?:proj-|svcacct-)?[A-Za-z0-9_-]{20,}\b")),
    ("Anthropic API key", re.compile(r"\bsk-ant-[A-Za-z0-9_-]{20,}\b")),
    ("npm token", re.compile(r"\bnpm_[A-Za-z0-9]{36}\b")),
    ("PyPI token", re.compile(r"\bpypi-AgEIcHlwaS5vcmc[A-Za-z0-9_-]{50,}\b")),
    ("JWT token", re.compile(r"\beyJ[A-Za-z0-9_-]{10,}\.[A-Za-z0-9_-]{10,}\.[A-Za-z0-9_-]{10,}\b")),
    ("database connection secret", re.compile(r"\b(?:postgres|postgresql|mysql|mongodb(?:\+srv)?|redis)://[^\s:@/]+:[^\s@/]+@")),
)


@dataclass(frozen=True)
class Diagnostic:
    code: str
    severity: str
    path: str
    message: str

    def to_dict(self) -> dict[str, str]:
        return {
            "code": self.code,
            "severity": self.severity,
            "path": self.path,
            "message": self.message,
        }


@dataclass
class ValidationReport:
    errors: list[str] = field(default_factory=list)
    warnings: list[str] = field(default_factory=list)
    diagnostics: list[Diagnostic] = field(default_factory=list)

    def error(self, context: str, message: str, code: str = "contract_error") -> None:
        self.errors.append(f"{context}: {message}")
        self.diagnostics.append(Diagnostic(code=code, severity="error", path=context, message=message))

    def warning(self, context: str, message: str, code: str = "contract_warning") -> None:
        self.warnings.append(f"{context}: {message}")
        self.diagnostics.append(Diagnostic(code=code, severity="warning", path=context, message=message))

    def to_json_dict(self) -> dict[str, Any]:
        return {
            "valid": not self.errors,
            "error_count": len(self.errors),
            "warning_count": len(self.warnings),
            "diagnostics": [d.to_dict() for d in self.diagnostics],
        }


def load_json(path: Path) -> Any:
    with path.open("r", encoding="utf-8") as handle:
        return json.load(handle)


def safe_relative_path(root: Path, relative: Any) -> Path | None:
    if not isinstance(relative, str) or not relative.strip():
        return None
    normalized = relative.replace("\\", "/")
    if normalized.startswith("/") or re.match(r"^[A-Za-z]:/", normalized):
        return None
    candidate = (root / Path(normalized)).resolve()
    try:
        candidate.relative_to(root.resolve())
    except ValueError:
        return None
    return candidate


def _canonical_file_bytes(template_root: Path, path: Path) -> bytes:
    """Return LF-normalized bytes, canonicalizing swarm.json without content_sha256."""
    raw = path.read_bytes().replace(b"\r\r\n", b"\n").replace(b"\r\n", b"\n")
    if path.relative_to(template_root).as_posix() == "swarm.json":
        try:
            obj = json.loads(raw.decode("utf-8"))
            if isinstance(obj, dict):
                canonical_obj = {k: v for k, v in obj.items() if k != "content_sha256"}
                return json.dumps(
                    canonical_obj,
                    sort_keys=True,
                    separators=(",", ":"),
                    ensure_ascii=False,
                ).encode("utf-8")
        except Exception:
            pass
    return raw


def compute_template_digest(template_root: Path) -> str:
    """Compute a deterministic, cross-platform SHA-256 digest over the template tree."""
    files = sorted(
        (
            (p.relative_to(template_root).as_posix(), p)
            for p in template_root.rglob("*")
            if p.is_file() and not p.is_symlink()
        ),
        key=lambda item: item[0],
    )
    lines: list[str] = []
    for rel, path in files:
        content = _canonical_file_bytes(template_root, path)
        digest = hashlib.sha256(content).hexdigest()
        lines.append(f"{rel}\0{digest}")
    payload = "\n".join(lines).encode("utf-8")
    return f"sha256:{hashlib.sha256(payload).hexdigest()}"


def _validate_against_schema(
    root: Path,
    schema_filename: str,
    payload: Any,
    context: str,
    report: ValidationReport,
) -> None:
    """Validate a parsed JSON payload against schemas/<schema_filename> if schemas/ exists."""
    schemas_dir = root / "schemas"
    schema_path = schemas_dir / schema_filename
    if not schema_path.is_file():
        return
    try:
        from referencing import Registry, Resource

        resources: list[tuple[str, Resource[Any]]] = []
        for candidate in sorted(schemas_dir.glob("*.json")):
            doc = load_json(candidate)
            if isinstance(doc, dict):
                res = Resource.from_contents(doc)
                if isinstance(doc.get("$id"), str):
                    resources.append((doc["$id"], res))
                resources.append((candidate.name, res))
        registry = Registry().with_resources(resources)
        schema = load_json(schema_path)
        validator = jsonschema.Draft7Validator(schema, registry=registry)
        for err in sorted(validator.iter_errors(payload), key=lambda e: list(e.path)):
            path_str = "/".join(map(str, err.path)) or "root"
            report.error(context, f"schema validation error at '{path_str}': {err.message}", code="schema_error")
    except Exception as exc:
        report.error(context, f"cannot validate against {schema_filename}: {exc}", code="schema_error")


def detect_embedded_secrets(content: str) -> list[str]:
    """Return high-confidence secret types without echoing secret material."""
    return [label for label, pattern in SECRET_PATTERNS if pattern.search(content)]


def validate_package_file(
    relative: str,
    suffix: str,
    size: int,
    raw: bytes,
    allowed_suffixes: frozenset[str],
) -> list[str]:
    errors: list[str] = []
    if suffix.lower() not in allowed_suffixes:
        return [f"{relative} uses a prohibited file type ({suffix or 'no extension'})"]
    if size > MAX_PACKAGE_FILE_BYTES:
        return [
            f"{relative} exceeds the {MAX_PACKAGE_FILE_BYTES}-byte package limit ({size} bytes)"
        ]
    if b"\x00" in raw:
        return [f"{relative} contains binary data"]
    try:
        content = raw.decode("utf-8")
    except UnicodeDecodeError:
        return [f"{relative} is not valid UTF-8 text"]
    for secret_type in detect_embedded_secrets(content):
        errors.append(f"{relative} contains a likely {secret_type}")
    return errors


def validate_package_tree(
    package_root: Path,
    allowed_suffixes: frozenset[str],
    executable_subdir: str | None = None,
) -> list[str]:
    """Enforce the source-only package boundary before a template is published."""
    errors: list[str] = []
    for path in sorted(package_root.rglob("*")):
        relative = path.relative_to(package_root).as_posix()
        if path.is_symlink():
            errors.append(f"{relative} must not be a symbolic link")
            continue
        if not path.is_file():
            continue
        # Quarantine directory is non-installable isolated storage
        is_quarantine = relative.startswith("quarantine/")
        if is_quarantine and path.suffix.lower() != ".json":
            errors.append(f"{relative} quarantined file must be JSON format")
            continue
        try:
            size = path.stat().st_size
            raw = path.read_bytes()
        except OSError as exc:
            errors.append(f"{relative} cannot be inspected: {exc}")
            continue
        suffixes = frozenset({".json"}) if is_quarantine else allowed_suffixes
        if not is_quarantine and executable_subdir and relative.startswith(f"{executable_subdir}/"):
            suffixes = TEMPLATE_SKILL_FILE_SUFFIXES
        errors.extend(validate_package_file(relative, path.suffix, size, raw, suffixes))
    return errors


def validate_connector_dependencies(connector_root: Path, connector: dict) -> list[str]:
    """Require exact direct-dependency pins with reviewable package provenance."""
    errors: list[str] = []
    manifest_name = connector.get("dependency_manifest")
    if manifest_name != "requirements.txt":
        return ["dependency_manifest must be requirements.txt"]

    manifest_path = connector_root / manifest_name
    if not manifest_path.is_file():
        return ["dependency manifest requirements.txt is missing"]

    try:
        lines = manifest_path.read_text(encoding="utf-8").splitlines()
    except OSError as exc:
        return [f"cannot read dependency manifest: {exc}"]

    requirements: dict[str, str] = {}
    for line_number, raw_line in enumerate(lines, start=1):
        line = raw_line.strip()
        if not line or line.startswith("#"):
            continue
        match = PINNED_REQUIREMENT.fullmatch(line)
        if match is None:
            errors.append(
                f"requirements.txt:{line_number} must use an exact package==version pin"
            )
            continue
        package = match.group("package").lower().replace("_", "-")
        if package in requirements:
            errors.append(f"requirements.txt contains duplicate package {package}")
        requirements[package] = match.group("version")

    provenance = connector.get("dependency_provenance")
    if not isinstance(provenance, list) or not provenance:
        errors.append("dependency_provenance must be a non-empty array")
        return errors

    reviewed: dict[str, str] = {}
    for index, dependency in enumerate(provenance):
        context = f"dependency_provenance[{index}]"
        if not isinstance(dependency, dict):
            errors.append(f"{context} must be an object")
            continue
        package_value = dependency.get("package")
        version = dependency.get("version")
        artifact = dependency.get("artifact")
        digest = dependency.get("sha256")
        source = dependency.get("source")
        if not isinstance(package_value, str) or not package_value:
            errors.append(f"{context}.package must be a non-empty string")
            continue
        package = package_value.lower().replace("_", "-")
        if not isinstance(version, str) or not version:
            errors.append(f"{context}.version must be a non-empty string")
            continue
        if not isinstance(artifact, str) or version not in artifact:
            errors.append(f"{context}.artifact must name the reviewed versioned artifact")
        if not isinstance(digest, str) or SHA256_HEX.fullmatch(digest) is None:
            errors.append(f"{context}.sha256 must be a lowercase SHA-256 digest")
        expected_source = f"https://pypi.org/project/{package_value}/{version}/"
        if source != expected_source:
            errors.append(f"{context}.source must be {expected_source}")
        if package in reviewed:
            errors.append(f"dependency_provenance contains duplicate package {package}")
        reviewed[package] = version

    if requirements != reviewed:
        errors.append(
            "dependency_provenance package/version pairs must exactly match requirements.txt"
        )
    return errors


def validate_connector_integrity(connector_root: Path, connector: dict) -> list[str]:
    """Verify that the registry digest authenticates the executable entrypoint and companion files."""
    server_path = connector_root / "server.py"
    if not server_path.is_file():
        return ["server.py is missing"]
    try:
        actual = hashlib.sha256(server_path.read_bytes()).hexdigest()
    except OSError as exc:
        return [f"cannot read server.py for integrity verification: {exc}"]
    expected = connector.get("integrity_hash")
    if not isinstance(expected, str) or expected != f"sha256:{actual}":
        return ["integrity_hash does not match the SHA-256 digest of server.py"]

    companion_sources = [
        p.name for p in sorted(connector_root.glob("*"))
        if p.is_file() and p.name != "server.py" and p.suffix.lower() in {".py", ".js", ".ts"}
    ]
    if companion_sources:
        manifest_hash = connector.get("manifest_sha256") or connector.get("content_sha256")
        if not manifest_hash:
            return [
                f"connector has companion source files ({', '.join(companion_sources)}) "
                f"requiring full directory content_sha256 verification"
            ]
        actual_manifest_hash = compute_template_digest(connector_root)
        if actual_manifest_hash != manifest_hash:
            return [
                f"connector companion content digest mismatch (expected {manifest_hash}, computed {actual_manifest_hash})"
            ]
    return []


def _validate_model_config_slot(
    cfg: Any,
    slot_name: str,
    *,
    require_prompt: bool,
) -> list[str]:
    """Validate a single ModelConfig slot (model_config, model_config2, model_config3)."""
    errors: list[str] = []
    if not isinstance(cfg, dict):
        return [f"{slot_name} must be an object"]
    required_keys = ("provider", "model_id", "system_prompt") if require_prompt else ("provider", "model_id")
    for key in required_keys:
        value = cfg.get(key)
        if not isinstance(value, str) or not value.strip():
            errors.append(f"{slot_name}.{key} must be a non-empty string")
    prompt = cfg.get("system_prompt")
    if isinstance(prompt, str):
        if len(prompt) > 800:
            errors.append(f"{slot_name}.system_prompt exceeds 800 characters ({len(prompt)})")
        for label, pattern in PROMPT_INJECTION_PATTERNS:
            if pattern.search(prompt):
                errors.append(f"{slot_name}.system_prompt contains prohibited {label}")
    elif prompt is not None:
        errors.append(f"{slot_name}.system_prompt must be a string")

    provider = str(cfg.get("provider", "")).lower()
    model_id = str(cfg.get("model_id", "")).lower()
    if provider == "google":
        non_google = ("llama", "deepseek", "mistral", "claude", "gpt", "qwen", "phi")
        is_invalid = any(k in model_id for k in non_google) or (":" in model_id and model_id != "gemma4:31b")
        if is_invalid:
            errors.append(f"{slot_name}: provider 'google' cannot be paired with '{cfg.get('model_id')}'")
    elif provider == "anthropic" and not model_id.startswith("claude"):
        errors.append(f"{slot_name}: provider 'anthropic' cannot be paired with '{cfg.get('model_id')}'")
    elif provider == "openai" and not (model_id.startswith("gpt") or model_id.startswith("o1") or model_id.startswith("o3")):
        errors.append(f"{slot_name}: provider 'openai' cannot be paired with '{cfg.get('model_id')}'")
    elif provider == "deepseek" and not model_id.startswith("deepseek"):
        errors.append(f"{slot_name}: provider 'deepseek' cannot be paired with '{cfg.get('model_id')}'")
    elif provider == "ollama-cloud" and not model_id.endswith("-cloud"):
        errors.append(f"{slot_name}: provider 'ollama-cloud' requires a '-cloud' model identifier: '{cfg.get('model_id')}'")
    elif provider == "ollama" and model_id.endswith("-cloud"):
        errors.append(f"{slot_name}: provider 'ollama' cannot be paired with cloud identifier '{cfg.get('model_id')}'")

    max_turns = cfg.get("max_turns")
    if max_turns is not None and (type(max_turns) is not int or max_turns < 1):
        errors.append(f"{slot_name}.max_turns must be a positive integer")
    return errors


def validate_agent_payload(agent: Any) -> list[str]:
    errors: list[str] = []
    if not isinstance(agent, dict):
        return ["must be a JSON object"]

    for key in REQUIRED_AGENT_STRINGS:
        if not isinstance(agent.get(key), str) or not agent[key].strip():
            errors.append(f"{key} must be a non-empty string")

    name = agent.get("name")
    if isinstance(name, str) and STUTTERING_NAME_PATTERN.search(name):
        errors.append(f"name contains stuttering duplicate word: {name!r}")

    agent_id = agent.get("id")
    if isinstance(agent_id, str) and agent_id.strip() and not SAFE_AGENT_IDENTIFIER.fullmatch(agent_id):
        errors.append("id must be 1 to 64 ASCII alphanumeric, hyphen, or underscore characters")

    if agent.get("status") != "idle":
        errors.append('status must be "idle" for an installable registry agent')

    errors.extend(_validate_model_config_slot(agent.get("model_config"), "model_config", require_prompt=True))
    for optional_slot in ("model_config2", "model_config3"):
        if agent.get(optional_slot) is not None:
            errors.extend(_validate_model_config_slot(agent.get(optional_slot), optional_slot, require_prompt=False))

    hooks = agent.get("hooks")
    if hooks is not None:
        if not isinstance(hooks, list) or not all(
            isinstance(h, str) and re.fullmatch(r"[a-z][a-z0-9_]*", h) for h in hooks
        ):
            errors.append("hooks must be an array of snake_case hook IDs")

    oversight_policies = agent.get("oversight_policies")
    if oversight_policies is not None:
        if not isinstance(oversight_policies, list):
            errors.append("oversight_policies must be an array")
        else:
            for idx, policy in enumerate(oversight_policies):
                if not isinstance(policy, dict) or not isinstance(policy.get("applies_to"), list) or not policy.get("applies_to") or not isinstance(policy.get("approver_role"), str) or not policy.get("approver_role", "").strip():
                    errors.append(f"oversight_policies[{idx}] requires non-empty applies_to list and approver_role string")

    if "mcp_tools" not in agent:
        errors.append("mcp_tools is required (use [] when no MCP tools are granted)")
    for key in ("skills", "workflows", "mcp_tools"):
        value = agent.get(key, [])
        if not isinstance(value, list) or not all(isinstance(item, str) and item for item in value):
            errors.append(f"{key} must be an array of non-empty strings")

    mcp_tools = agent.get("mcp_tools", [])
    if isinstance(mcp_tools, list):
        for declaration in mcp_tools:
            if isinstance(declaration, str):
                if declaration.endswith(":*") or declaration == "*":
                    errors.append(
                        f"mcp_tools declaration {declaration!r} must use exact canonical server:tool (wildcards server:* are prohibited)"
                    )
                elif MCP_TOOL_DECLARATION.fullmatch(declaration) is None:
                    errors.append(
                        f"mcp_tools declaration {declaration!r} must use exact canonical server:tool or encoded mcp__server__tool"
                    )

    skills = agent.get("skills", [])
    if isinstance(skills, list):
        for legacy_skill in sorted(LEGACY_SKILLS.intersection(skills)):
            errors.append(f"skills contains legacy Tadpole capability: {legacy_skill}")
        unknown = sorted(
            {s for s in skills if isinstance(s, str)} - VALID_CAPABILITY_IDS - LEGACY_SKILLS
        )
        if unknown:
            errors.append(f"skills contains unknown capability IDs: {unknown}")
        if "execute_shell" in skills and not ({"shell", "terminal"} & set(skills)):
            errors.append("execute_shell requires the shell or terminal capability marker")

    if not isinstance(agent.get("requires_oversight"), bool):
        errors.append("requires_oversight must be a boolean")
    elif isinstance(skills, list) and DANGEROUS_SKILLS.intersection(skills):
        if not agent["requires_oversight"]:
            errors.append("dangerous mutation or shell capabilities require oversight")

    department = agent.get("department")
    if isinstance(department, str) and department.strip().lower() == PLANE2_DEPARTMENT_MARKER.lower():
        if isinstance(skills, list):
            forbidden = sorted(PLANE2_FORBIDDEN_CAPABILITIES.intersection(skills))
            if forbidden:
                errors.append(
                    f"Plane 2 agent violates FR-11 Dual-Plane Permission Firewall: forbidden capabilities {forbidden}"
                )
        if not agent.get("requires_oversight", False):
            errors.append("Plane 2 agents require human oversight (requires_oversight must be true)")
    return errors


def validate_workflow_content(content: str) -> list[str]:
    if not content.strip():
        return ["workflow is empty"]
    errors: list[str] = []
    unfenced = FENCED_CODE_BLOCK.sub("", content)
    if not EXECUTABLE_HEADING.search(unfenced):
        errors.append("workflow needs at least one ## or ### execution heading")
    for label, pattern in PROMPT_INJECTION_PATTERNS:
        if pattern.search(content):
            errors.append(f"workflow contains prohibited {label}")
    return errors


def validate_mcp_payload(config: Any) -> list[str]:
    errors: list[str] = []
    if not isinstance(config, dict):
        return ["must be a JSON object"]
    servers = config.get("mcpServers")
    if not isinstance(servers, dict):
        return ["mcpServers must be an object"]
    for server_name, server in servers.items():
        prefix = f"mcpServers.{server_name}"
        if not isinstance(server_name, str) or not server_name.strip():
            errors.append("server names must be non-empty strings")
            continue
        if "__" in server_name:
            errors.append(f"{prefix} cannot contain double underscores '__'")
        if server_name.strip().lower() == "gev":
            errors.append(f"{prefix} is reserved by the Tadpole-OS runtime for the fixed Port 3000 profile")
        if not isinstance(server, dict):
            errors.append(f"{prefix} must be an object")
            continue

        has_command = isinstance(server.get("command"), str) and bool(server["command"].strip())
        has_url = isinstance(server.get("url"), str) and bool(server["url"].strip())

        if not has_command and not has_url:
            errors.append(f"{prefix} must specify either 'command' or 'url'")

        if has_command:
            command = server["command"]
            if command.strip().lower() not in ALLOWED_MCP_COMMANDS:
                errors.append(
                    f"{prefix}.command must use an approved executable: "
                    f"{', '.join(sorted(ALLOWED_MCP_COMMANDS))}"
                )
            args = server.get("args")
            if not isinstance(args, list) or not all(isinstance(arg, str) for arg in args):
                errors.append(f"{prefix}.args must be an array of strings")
            else:
                for index, arg in enumerate(args):
                    if SHELL_CONTROL.search(arg):
                        errors.append(f"{prefix}.args[{index}] contains shell control syntax")
                normalized_command = command.strip().lower() if isinstance(command, str) else ""
                if normalized_command in {"python", "python3"} and any(
                    arg in {"-c", "-m"} for arg in args
                ):
                    errors.append(f"{prefix}.args must reference a reviewed source file, not inline/module execution")
                if normalized_command == "node" and any(
                    arg in {"-e", "--eval", "-p", "--print"} for arg in args
                ):
                    errors.append(f"{prefix}.args must reference a reviewed source file, not inline execution")
                if normalized_command == "npx" and not any(
                    arg in {"--no-install", "--offline"} for arg in args
                ) and not any(arg.endswith((".js", ".mjs", ".cjs", ".ts")) for arg in args):
                    errors.append(f"{prefix}.args must reference a local script file or enforce --no-install / --offline")

        if "url" in server:
            url = server.get("url")
            if not isinstance(url, str) or not url.strip():
                errors.append(f"{prefix}.url must be a non-empty string")
            else:
                parsed = urllib.parse.urlparse(url.strip())
                if parsed.scheme not in ("http", "https") or not parsed.netloc:
                    errors.append(f"{prefix}.url must use http or https scheme with valid host")

        if "env" in server:
            env = server.get("env", {})
            if not isinstance(env, dict) or not all(
                isinstance(key, str) and isinstance(value, str) for key, value in env.items()
            ):
                errors.append(f"{prefix}.env must be an object of string values")
            else:
                for key, value in env.items():
                    if not VALID_ENV_OR_HEADER_VAR.fullmatch(key):
                        errors.append(f"{prefix}.env.{key} has an invalid environment variable name")
                    elif key.strip().upper() in ENGINE_PRIVATE_ENV_VARS:
                        errors.append(f"{prefix}.env.{key} cannot override reserved engine variable '{key}'")
                    if value.startswith("${") and value.endswith("}"):
                        var_name = value[2:-1]
                        if not VALID_ENV_OR_HEADER_VAR.fullmatch(var_name):
                            errors.append(f"{prefix}.env.{key} has an invalid environment placeholder '{value}'")
                        elif var_name.strip().upper() in ENGINE_PRIVATE_ENV_VARS:
                            errors.append(f"{prefix}.env.{key} cannot reference reserved engine secret '{value}'")
                    elif SENSITIVE_ENV_NAME.search(key) and not SAFE_PLACEHOLDER.fullmatch(value.strip()):
                        errors.append(
                            f"{prefix}.env.{key} must be an explicit local-configuration placeholder"
                        )

        if "headers" in server:
            headers = server.get("headers", {})
            if not isinstance(headers, dict) or not all(
                isinstance(key, str) and isinstance(value, str) for key, value in headers.items()
            ):
                errors.append(f"{prefix}.headers must be an object of string values")
            else:
                for key, value in headers.items():
                    if not key.strip():
                        errors.append(f"{prefix}.headers has an empty header name")
                    elif not VALID_HEADER_TOKEN_PATTERN.fullmatch(key):
                        errors.append(f"{prefix}.headers.{key} is not a valid HTTP header token")
                    elif key.lower() in RESERVED_MCP_HTTP_HEADERS or key.lower().startswith(RESERVED_MCP_HTTP_HEADER_PREFIXES):
                        errors.append(f"{prefix}.headers.{key} cannot override transport-owned HTTP header '{key}'")
                    if "\r" in value or "\n" in value:
                        errors.append(f"{prefix}.headers.{key} cannot contain CR/LF characters")
                    if value.startswith("${") and value.endswith("}"):
                        var_name = value[2:-1]
                        if not VALID_ENV_OR_HEADER_VAR.fullmatch(var_name):
                            errors.append(f"{prefix}.headers.{key} has an invalid header placeholder '{value}'")
                        elif var_name.strip().upper() in ENGINE_PRIVATE_ENV_VARS:
                            errors.append(f"{prefix}.headers.{key} cannot reference reserved engine secret '{value}'")
                    elif SENSITIVE_ENV_NAME.search(key) and not SAFE_PLACEHOLDER.fullmatch(value.strip()):
                        errors.append(
                            f"{prefix}.headers.{key} must be an explicit local-configuration placeholder"
                        )

        if "protocol_version" in server:
            protocol_version = server.get("protocol_version")
            if not isinstance(protocol_version, str) or protocol_version not in ALLOWED_MCP_PROTOCOLS:
                errors.append(
                    f"{prefix}.protocol_version must be one of: {', '.join(sorted(ALLOWED_MCP_PROTOCOLS))}"
                )

    return errors


def validate_knowledge_payload(payload: Any) -> list[str]:
    if not isinstance(payload, list):
        return ["must be an array"]
    errors: list[str] = []
    for index, item in enumerate(payload):
        if not isinstance(item, dict):
            errors.append(f"item {index} must be an object")
            continue
        for key in ("text", "topic"):
            if not isinstance(item.get(key), str) or not item[key].strip():
                errors.append(f"item {index}.{key} must be a non-empty string")
    return errors


def validate_catalog_parity(root: Path, report: ValidationReport) -> list[dict[str, Any]]:
    try:
        registry = load_json(root / "registry.json")
        index = load_json(root / "index.json")
    except (OSError, json.JSONDecodeError) as exc:
        report.error("catalog", f"cannot load registry/index: {exc}")
        return []

    templates = registry.get("templates") if isinstance(registry, dict) else None
    if not isinstance(templates, list):
        report.error("registry.json", "templates must be an array")
        return []
    if not isinstance(index, list):
        report.error("index.json", "must be a top-level array")
        return templates

    for label, entries in (("registry.json", templates), ("index.json", index)):
        ids: list[str] = []
        paths: list[str] = []
        for e_idx, entry in enumerate(entries):
            if not isinstance(entry, dict):
                report.error(label, f"entry[{e_idx}] must be an object")
                continue
            e_id = entry.get("id")
            e_path = entry.get("path")
            if not isinstance(e_id, str) or not e_id.strip():
                report.error(label, f"entry[{e_idx}].id must be a non-empty string")
            else:
                ids.append(e_id)
            if not isinstance(e_path, str) or not e_path.strip():
                report.error(label, f"entry[{e_idx}].path must be a non-empty string")
            else:
                paths.append(e_path)
        if len(ids) != len(set(ids)):
            report.error(label, "contains duplicate template IDs")
        if len(paths) != len(set(paths)):
            report.error(label, "contains duplicate template paths")

    public_registry_contract = {
        (item.get("id"), item.get("path"))
        for item in templates
        if isinstance(item, dict)
        and not item.get("internal")
        and isinstance(item.get("id"), str)
        and isinstance(item.get("path"), str)
    }
    index_contract = {
        (item.get("id"), item.get("path"))
        for item in index
        if isinstance(item, dict)
        and isinstance(item.get("id"), str)
        and isinstance(item.get("path"), str)
    }
    if public_registry_contract != index_contract:
        report.error("catalog", "registry.json (public entries) and index.json disagree on template IDs or paths")

    registry_by_id = {
        item["id"]: item for item in templates
        if isinstance(item, dict) and isinstance(item.get("id"), str) and not item.get("internal")
    }
    for index_entry in index:
        if not isinstance(index_entry, dict):
            continue
        registry_entry = registry_by_id.get(index_entry.get("id"))
        if registry_entry is None:
            continue
        for field_name in CATALOG_PARITY_FIELDS:
            if index_entry.get(field_name) != registry_entry.get(field_name):
                report.error(
                    "catalog",
                    f"registry.json and index.json disagree on {field_name!r} for template {index_entry.get('id')!r}",
                )

    _validate_against_schema(root, "template-registry-v1.json", registry, "registry.json", report)

    # Check for orphan templates on disk not registered in registry.json (recursive scan, Finding #18)
    registered_paths = {
        safe_relative_path(root, t.get("path"))
        for t in templates
        if isinstance(t, dict) and isinstance(t.get("path"), str)
    }
    for candidate in sorted(root.glob("*/**/swarm.json")):
        rel_parts = candidate.relative_to(root).parts
        if any(p.startswith(".") or p in ("node_modules", "web-builder", "dist", "build", "tests", ".tmp", "scratch") for p in rel_parts):
            continue
        template_dir = candidate.parent.resolve()
        if template_dir not in registered_paths:
            report.error(
                "catalog",
                f"unregistered template directory on disk: {candidate.parent.relative_to(root).as_posix()}",
            )

    # Verify index.json required_skills matches actual skills declared in each template
    for index_entry in index:
        if not isinstance(index_entry, dict):
            continue
        t_id = index_entry.get("id")
        t_path = index_entry.get("path")
        req_skills = index_entry.get("required_skills")
        if not isinstance(req_skills, list) or not req_skills:
            report.error(f"index.json[{t_id}]", "required_skills must be a non-empty array of strings")
            continue
        unknown_skills = [s for s in req_skills if s not in VALID_CAPABILITY_IDS]
        if unknown_skills:
            report.error(f"index.json[{t_id}]", f"unknown capability IDs in required_skills: {unknown_skills}")
        template_dir = safe_relative_path(root, t_path)
        if template_dir and template_dir.is_dir():
            agents_dir = template_dir / "agents"
            if agents_dir.is_dir():
                actual_skills = set()
                for agent_file in sorted(agents_dir.glob("*.json")):
                    try:
                        agent_data = json.loads(agent_file.read_text(encoding="utf-8"))
                        actual_skills.update(agent_data.get("skills", []))
                    except Exception:
                        pass
                if set(req_skills) != actual_skills:
                    report.error(
                        f"index.json[{t_id}]",
                        f"required_skills {sorted(req_skills)} does not match agents' declared skills {sorted(actual_skills)}",
                    )

    # Verify index.json required_models matches actual models declared in each template
    for index_entry in index:
        if not isinstance(index_entry, dict):
            continue
        t_id = index_entry.get("id")
        t_path = index_entry.get("path")
        req_models = index_entry.get("required_models")
        if not isinstance(req_models, list) or not req_models:
            report.error(f"index.json[{t_id}]", "required_models must be a non-empty array of strings")
            continue
        template_dir = safe_relative_path(root, t_path)
        if template_dir is None or not template_dir.is_dir():
            report.error(f"index.json[{t_id}]", f"template directory does not exist or escapes root: {t_path!r}")
            continue
        agents_dir = template_dir / "agents"
        if agents_dir.is_dir():
            actual_models = set()
            for agent_file in sorted(agents_dir.glob("*.json")):
                try:
                    agent_data = json.loads(agent_file.read_text(encoding="utf-8"))
                    for slot_key in ("model_config", "model_config2", "model_config3"):
                        slot_cfg = agent_data.get(slot_key)
                        if isinstance(slot_cfg, dict) and slot_cfg.get("model_id"):
                            actual_models.add(slot_cfg["model_id"])
                except Exception:
                    pass
            if actual_models and set(req_models) != actual_models:
                report.error(
                    f"index.json[{t_id}]",
                    f"required_models {sorted(req_models)} does not match agents' declared models {sorted(actual_models)}"
                )

    return templates


def load_tool_manifest_map(root: Path) -> dict[str, dict[str, Any]]:
    """Build a lookup map of canonical tool ID -> tool descriptor."""
    manifest_map: dict[str, dict[str, Any]] = {
        "smoke-connector:healthcheck": {
            "id": "smoke-connector:healthcheck",
            "name": "healthcheck",
            "description": "Smoke test health check",
            "risk": "read",
            "server": "smoke-connector",
        }
    }
    registry_path = root / "mcp_registry.json"
    if registry_path.is_file():
        try:
            registry = load_json(registry_path)
        except Exception as exc:
            raise ValueError(f"Failed to load MCP tool manifest from {registry_path}: {exc}") from exc
        for connector in registry.get("connectors", []):
            server_keys = list(connector.get("config", {}).get("mcpServers", {}).keys()) if isinstance(connector.get("config"), dict) else []
            default_server = server_keys[0] if server_keys else ""
            for tool in connector.get("tools", []):
                tool_id = tool.get("id")
                if tool_id:
                    tool_desc = dict(tool)
                    if "server" not in tool_desc:
                        tool_desc["server"] = tool_id.split(":", 1)[0] if ":" in tool_id else default_server
                    manifest_map[tool_id] = tool_desc
    return manifest_map


def validate_roster_graph(roster: list[Any], *, flat_peer_swarm: bool = False) -> list[str]:
    """Validate that roster supervisor links form an acyclic orchestration DAG."""
    errors: list[str] = []
    entries = [ref for ref in roster if isinstance(ref, dict) and isinstance(ref.get("id"), str) and ref.get("id")]
    if not entries:
        return errors

    by_id: dict[str, str | None] = {}
    for idx, ref in enumerate(entries):
        agent_id = ref["id"]
        sup = ref.get("supervisor")
        if sup is not None and (not isinstance(sup, str) or not sup.strip()):
            errors.append(f"roster[{idx}] supervisor must be null or a non-empty agent id")
            continue
        by_id[agent_id] = sup.strip() if isinstance(sup, str) else None

    for agent_id, sup in by_id.items():
        if sup == agent_id:
            errors.append(f"roster agent {agent_id!r} cannot supervise itself")
        elif sup is not None and sup not in by_id:
            errors.append(f"roster agent {agent_id!r} references missing supervisor {sup!r}")

    for start_id in by_id:
        visited: set[str] = {start_id}
        curr = by_id.get(start_id)
        while curr is not None and curr in by_id:
            if curr in visited:
                errors.append(f"roster supervisor cycle detected involving {curr!r}")
                break
            visited.add(curr)
            curr = by_id.get(curr)

    roots = [aid for aid, sup in by_id.items() if sup is None]
    if by_id and not roots:
        errors.append("roster has no root coordinator (at least one agent must have supervisor: null)")
    if len(by_id) > 1 and not flat_peer_swarm and all(sup is None for sup in by_id.values()):
        errors.append("multi-agent roster must assign supervisor hierarchy (or set flat_peer_swarm: true)")
    return errors


def validate_template(
    root: Path,
    template: dict[str, Any],
    report: ValidationReport,
    tool_manifest_map: dict[str, dict[str, Any]] | None = None,
    *,
    schema_root: Path | None = None,
) -> None:
    effective_schema_root = schema_root or root
    template_id = str(template.get("id") or "<missing-id>")
    context = f"template {template_id}"
    template_root = safe_relative_path(root, template.get("path"))
    if template_root is None:
        report.error(context, "path is missing, absolute, or escapes the repository")
        return
    if not template_root.is_dir():
        report.error(context, f"directory does not exist: {template.get('path')}")
        return

    for message in validate_package_tree(
        template_root,
        TEMPLATE_FILE_SUFFIXES,
        executable_subdir="skills",
    ):
        report.error(context, message)

    computed_digest: str | None = None
    expected_digest = template.get("content_sha256")
    if expected_digest is not None:
        if not isinstance(expected_digest, str) or SHA256_HEX.fullmatch(expected_digest.removeprefix("sha256:")) is None:
            report.error(context, "content_sha256 must be in the format sha256:<64-hex>")
        else:
            computed_digest = compute_template_digest(template_root)
            if computed_digest != expected_digest:
                report.error(
                    context,
                    f"template content digest mismatch (expected {expected_digest}, computed {computed_digest})",
                )

    swarm_path = template_root / "swarm.json"
    try:
        swarm = load_json(swarm_path)
    except (OSError, json.JSONDecodeError) as exc:
        report.error(context, f"cannot load swarm.json: {exc}")
        return
    if not isinstance(swarm, dict):
        report.error(context, "swarm.json must be an object")
        return

    _validate_against_schema(effective_schema_root, "swarm-v1.json", swarm, f"{context} swarm.json", report)

    embedded_digest = swarm.get("content_sha256")
    if isinstance(embedded_digest, str):
        if computed_digest is None:
            computed_digest = compute_template_digest(template_root)
        if embedded_digest != computed_digest:
            report.error(
                f"{context} swarm.json",
                f"embedded content_sha256 mismatch (expected {embedded_digest}, computed {computed_digest})",
            )

    # Swarm mission, industry canonicalization, and registry parity
    mission = swarm.get("description") or swarm.get("mission")
    if not isinstance(mission, str) or not mission.strip():
        report.error(context, "swarm.json requires a non-empty description or mission")

    swarm_name = swarm.get("name")
    if not isinstance(swarm_name, str) or not swarm_name.strip():
        report.error(context, "swarm.json requires a non-empty name")

    swarm_industry = swarm.get("industry")
    if (effective_schema_root / "schemas" / "swarm-v1.json").is_file():
        if not isinstance(swarm_industry, str) or swarm_industry not in CANONICAL_INDUSTRIES:
            report.error(
                context,
                f"swarm.json industry {swarm_industry!r} must be one of the {len(CANONICAL_INDUSTRIES)} canonical registry industries",
            )
    for parity_field in ("id", "name", "description", "industry"):
        if parity_field in template and swarm.get(parity_field) != template.get(parity_field):
            report.error(
                context,
                f"swarm.json {parity_field!r} ({swarm.get(parity_field)!r}) disagrees with registry.json ({template.get(parity_field)!r})",
            )

    company_size = swarm.get("company_size")
    if company_size is not None:
        if type(company_size) is not int or isinstance(company_size, bool) or company_size <= 0:
            report.error(context, f"company_size must be a positive integer (found {company_size!r})")

    roster = swarm.get("roster", [])
    if not isinstance(roster, list):
        report.error(context, "swarm roster must be an array")
        roster = []
    if not roster:
        report.warning(context, "swarm roster is empty")
    for graph_err in validate_roster_graph(roster, flat_peer_swarm=bool(swarm.get("flat_peer_swarm"))):
        report.error(context, graph_err)

    roster_paths: set[Path] = set()
    roster_ids: set[str] = set()
    roster_by_path: dict[Path, dict[str, Any]] = {}
    for index, reference in enumerate(roster):
        ref_context = f"{context} roster[{index}]"
        if not isinstance(reference, dict):
            report.error(ref_context, "must be an object")
            continue
        agent_path = safe_relative_path(template_root, reference.get("path"))
        if agent_path is None:
            report.error(ref_context, "path is missing, absolute, or escapes the template")
            continue
        roster_paths.add(agent_path)
        roster_by_path[agent_path] = reference
        reference_id = reference.get("id")
        if not isinstance(reference_id, str) or not reference_id:
            report.error(ref_context, "id must be a non-empty string")
        elif reference_id in roster_ids:
            report.error(ref_context, f"duplicate roster id: {reference_id}")
        else:
            roster_ids.add(reference_id)
        if not agent_path.is_file():
            report.error(ref_context, f"agent file does not exist: {reference.get('path')}")

    manifest_agents = swarm.get("agents")
    if manifest_agents is not None:
        if not isinstance(manifest_agents, list):
            report.error(context, "swarm agents must be an array")
        elif set(manifest_agents) != roster_ids:
            report.error(
                context,
                f"swarm agents array does not match roster IDs: "
                f"agents={sorted(manifest_agents)} vs roster={sorted(roster_ids)}"
            )

    referenced_workflows: set[Path] = set()
    global_workflows = swarm.get("global_workflows", [])
    if not isinstance(global_workflows, list):
        report.error(context, "global_workflows must be an array")
        global_workflows = []
    for workflow_ref in global_workflows:
        workflow_path = safe_relative_path(template_root, workflow_ref)
        if workflow_path is None:
            report.error(context, f"invalid global workflow path: {workflow_ref!r}")
            continue
        referenced_workflows.add(workflow_path)
        if not workflow_path.is_file():
            report.error(context, f"global workflow does not exist: {workflow_ref}")

    # Load active MCP servers
    active_mcp_servers: dict[str, Any] = {}
    mcp_path = template_root / "mcps.json"
    if mcp_path.is_file():
        try:
            mcp_payload = load_json(mcp_path)
        except (OSError, json.JSONDecodeError) as exc:
            report.error(f"{context} mcps.json", f"cannot parse JSON: {exc}")
        else:
            _validate_against_schema(effective_schema_root, "mcps-v1.json", mcp_payload, f"{context} mcps.json", report)
            for message in validate_mcp_payload(mcp_payload):
                report.error(f"{context} mcps.json", message)
            if isinstance(mcp_payload, dict):
                servers = mcp_payload.get("mcpServers", {})
                if isinstance(servers, dict):
                    active_mcp_servers = servers
                else:
                    report.error(f"{context} mcps.json", "mcpServers must be an object keyed by server name")

    connector_ids = swarm.get("connector_ids")
    if active_mcp_servers:
        if not isinstance(connector_ids, list) or not connector_ids:
            report.error(context, "swarm.json must define non-empty connector_ids when active mcps.json is present")
    known_connector_ids: set[str] | None = None
    mcp_registry_path = root / "mcp_registry.json"
    if mcp_registry_path.is_file():
        try:
            registry_data = load_json(mcp_registry_path)
        except Exception as exc:
            report.error(f"{context} mcp_registry.json", f"cannot load connector registry: {exc}")
        else:
            if not isinstance(registry_data, dict) or not isinstance(registry_data.get("connectors"), list):
                report.error(f"{context} mcp_registry.json", "connectors must be an array")
            else:
                known_connector_ids = {
                    c.get("id") for c in registry_data["connectors"]
                    if isinstance(c, dict) and isinstance(c.get("id"), str)
                }

    if connector_ids is not None:
        if not isinstance(connector_ids, list):
            report.error(context, "swarm.json connector_ids must be an array")
        else:
            is_internal_fixture = bool(template.get("internal")) or template_id == "smoke-test"
            for idx, cid in enumerate(connector_ids):
                if not isinstance(cid, str) or not cid.strip():
                    report.error(context, f"swarm.json connector_ids[{idx}] must be a non-empty string")
                elif not is_internal_fixture and known_connector_ids is not None and cid not in known_connector_ids:
                    report.error(context, f"swarm.json connector_ids[{idx}] '{cid}' not found in mcp_registry.json")

    if tool_manifest_map is None:
        try:
            tool_manifest_map = load_tool_manifest_map(root)
        except Exception as exc:
            report.error(f"{context} mcp_registry.json", f"cannot parse tool manifest: {exc}")
            tool_manifest_map = {}
    registered_mcp_servers = {
        d.get("server") for d in tool_manifest_map.values() if isinstance(d, dict) and d.get("server")
    }
    server_agent_grants: dict[str, list[str]] = {s: [] for s in active_mcp_servers}

    # Load and validate knowledge items once to check OKF playbook references
    okf_playbook_names: set[str] = set()
    knowledge_path = template_root / "knowledge.json"
    if knowledge_path.is_file():
        try:
            knowledge = load_json(knowledge_path)
        except (OSError, json.JSONDecodeError) as exc:
            report.error(f"{context} knowledge.json", f"cannot parse JSON: {exc}")
        else:
            _validate_against_schema(effective_schema_root, "knowledge-v1.json", knowledge, f"{context} knowledge.json", report)
            for message in validate_knowledge_payload(knowledge):
                report.error(f"{context} knowledge.json", message)
            if isinstance(knowledge, list):
                for item in knowledge:
                    if isinstance(item, dict) and isinstance(item.get("title"), str):
                        t_lower = item["title"].lower()
                        okf_playbook_names.add(t_lower)
                        okf_playbook_names.add(t_lower.replace(" ", "_"))
                        okf_playbook_names.add(t_lower.replace(" ", "-"))

    knowledge_dir = template_root / "knowledge"
    if knowledge_dir.is_dir():
        for k_file in knowledge_dir.glob("*.md"):
            stem_lower = k_file.stem.lower()
            okf_playbook_names.add(stem_lower)
            okf_playbook_names.add(stem_lower.replace(" ", "_"))
            okf_playbook_names.add(stem_lower.replace(" ", "-"))

    agents_root = template_root / "agents"
    agent_paths = sorted(agents_root.glob("*.json")) if agents_root.is_dir() else []
    if not agent_paths:
        report.error(context, "agents directory has no JSON profiles")
    for agent_path in agent_paths:
        agent_context = f"{context} agent {agent_path.name}"
        try:
            agent = load_json(agent_path)
        except (OSError, json.JSONDecodeError) as exc:
            report.error(agent_context, f"cannot parse JSON: {exc}")
            continue
        _validate_against_schema(effective_schema_root, "agent-v1.json", agent, agent_context, report)
        for message in validate_agent_payload(agent):
            report.error(agent_context, message)
        if isinstance(agent, dict) and agent_path in roster_by_path:
            matching = roster_by_path[agent_path]
            if matching and matching.get("id") != agent.get("id"):
                report.error(agent_context, "agent id does not match its roster reference")
        if isinstance(agent, dict):
            for workflow_id in agent.get("workflows", []):
                workflow_name = workflow_id if str(workflow_id).endswith(".md") else f"{workflow_id}.md"
                workflow_path = safe_relative_path(template_root / "workflows", workflow_name)
                if workflow_path is None:
                    report.error(agent_context, f"invalid workflow id: {workflow_id!r}")
                    continue
                referenced_workflows.add(workflow_path)
                if not workflow_path.is_file():
                    wf_clean = str(workflow_id).lower().removesuffix(".md")
                    if wf_clean in okf_playbook_names:
                        report.error(agent_context, f"agent cannot reference OKF playbook {workflow_id!r} as an executable workflow")
                    else:
                        report.error(agent_context, f"workflow does not exist: workflows/{workflow_name}")

            # Cross-validate agent MCP grants
            for grant in agent.get("mcp_tools", []):
                if not isinstance(grant, str):
                    continue
                if grant.endswith(":*") or grant == "*":
                    continue  # already flagged by validate_agent_payload
                if ":" in grant:
                    server_name, tool_name = grant.split(":", 1)
                    canonical_grant = grant
                elif grant.startswith("mcp__"):
                    parts = grant[5:].split("__", 1)
                    server_name = parts[0]
                    tool_name = parts[1] if len(parts) > 1 else ""
                    canonical_grant = f"{server_name}:{tool_name}"
                else:
                    server_name = grant
                    canonical_grant = grant

                if server_name not in active_mcp_servers:
                    report.error(agent_context, f"dangling MCP grant {grant!r}: server {server_name!r} not in active mcps.json")
                else:
                    server_agent_grants[server_name].append(agent.get("id", agent_path.stem))

                # Check tool descriptor risk level and registered connector declaration
                descriptor = tool_manifest_map.get(canonical_grant) or tool_manifest_map.get(grant)
                if server_name in registered_mcp_servers and not descriptor:
                    report.error(agent_context, f"unknown MCP tool grant {grant!r}: tool is not declared by connector {server_name!r}")
                elif descriptor:
                    risk = descriptor.get("risk", "read")
                    if risk in ("write", "execute") and not agent.get("requires_oversight"):
                        report.error(agent_context, f"mutating MCP tool grant {grant!r} requires oversight (requires_oversight must be true)")

    # Every active server must have at least one authorized agent grant
    for server_name, authorized_agents in server_agent_grants.items():
        if not authorized_agents:
            report.error(context, f"active MCP server {server_name!r} in mcps.json has no authorized agent grants")

    if set(agent_paths) - roster_paths:
        names = ", ".join(path.name for path in sorted(set(agent_paths) - roster_paths))
        report.error(context, f"unlisted agents in agents/ directory are not registered in swarm.json roster: {names}")

    workflows_root = template_root / "workflows"
    workflow_paths = sorted(workflows_root.glob("*.md")) if workflows_root.is_dir() else []
    for workflow_path in workflow_paths:
        for message in validate_workflow_content(workflow_path.read_text(encoding="utf-8")):
            report.error(f"{context} workflow {workflow_path.name}", message)
    orphan_workflows = set(workflow_paths) - referenced_workflows
    if orphan_workflows:
        names = ", ".join(path.name for path in sorted(orphan_workflows))
        report.warning(context, f"unreferenced workflows: {names}")

    evals_file = template_root / "evals" / "scenarios.json"
    if evals_file.is_file():
        try:
            eval_payload = load_json(evals_file)
        except (OSError, json.JSONDecodeError) as exc:
            report.error(f"{context} evals/scenarios.json", f"cannot parse JSON: {exc}")
        else:
            _validate_against_schema(effective_schema_root, "eval-v1.json", eval_payload, f"{context} evals/scenarios.json", report)




def validate_mcp_registry(root: Path, report: ValidationReport) -> None:
    try:
        registry = load_json(root / "mcp_registry.json")
    except (OSError, json.JSONDecodeError) as exc:
        report.error("mcp_registry.json", f"cannot parse: {exc}")
        return
    _validate_against_schema(root, "mcp-registry-v1.json", registry, "mcp_registry.json", report)
    if not isinstance(registry, dict) or registry.get("version") != "2.0.0":
        report.error("mcp_registry.json", "version must be 2.0.0")
        return
    connectors = registry.get("connectors")
    if not isinstance(connectors, list):
        report.error("mcp_registry.json", "connectors must be an array")
        return
    connector_ids: set[str] = set()
    for connector in connectors:
        if not isinstance(connector, dict):
            report.error("mcp_registry.json", "each connector must be an object")
            continue
        connector_id = connector.get("id")
        context = f"connector {connector_id or '<missing-id>'}"
        if not isinstance(connector_id, str) or not connector_id:
            report.error(context, "id must be a non-empty string")
        elif connector_id in connector_ids:
            report.error(context, "duplicate connector id")
        else:
            connector_ids.add(connector_id)

        status = connector.get("status")
        if status not in ("verified", "reviewed", "sample", "experimental", "quarantined"):
            report.error(context, "status must be verified, reviewed, sample, experimental, or quarantined")

        required_env = connector.get("required_env")
        if isinstance(required_env, dict):
            for env_key in required_env:
                if isinstance(env_key, str) and env_key.strip().upper() in ENGINE_PRIVATE_ENV_VARS:
                    report.error(context, f"required_env.{env_key} cannot declare reserved engine variable '{env_key}'")

        tools = connector.get("tools")
        if not isinstance(tools, list) or not tools:
            report.error(context, "tools must be a non-empty array of tool descriptors")
        else:
            tool_ids: set[str] = set()
            for t_idx, tool in enumerate(tools):
                t_ctx = f"{context} tools[{t_idx}]"
                if not isinstance(tool, dict):
                    report.error(t_ctx, "must be an object")
                    continue
                t_id = tool.get("id")
                t_name = tool.get("name")
                t_desc = tool.get("description")
                t_risk = tool.get("risk")
                if not isinstance(t_id, str) or ":" not in t_id:
                    report.error(t_ctx, "id must be in canonical server:tool format")
                elif t_id in tool_ids:
                    report.error(t_ctx, f"duplicate tool id: {t_id}")
                else:
                    tool_ids.add(t_id)
                if not isinstance(t_name, str) or not t_name:
                    report.error(t_ctx, "name must be a non-empty string")
                if not isinstance(t_desc, str) or not t_desc:
                    report.error(t_ctx, "description must be a non-empty string")
                if t_risk not in ("read", "write", "execute"):
                    report.error(t_ctx, "risk must be read, write, or execute")

        connector_root = safe_relative_path(root, connector.get("path"))
        if connector_root is None or not connector_root.is_dir():
            report.error(context, "path is invalid or missing")
            continue
        for message in validate_package_tree(connector_root, CONNECTOR_FILE_SUFFIXES):
            report.error(context, message)
        for message in validate_connector_dependencies(connector_root, connector):
            report.error(context, message)
        for message in validate_connector_integrity(connector_root, connector):
            report.error(context, message)
        config_path = connector_root / "mcps.json"
        try:
            config = load_json(config_path)
        except (OSError, json.JSONDecodeError) as exc:
            report.error(context, f"cannot parse mcps.json: {exc}")
            continue
        for message in validate_mcp_payload(config):
            report.error(context, message)

        embedded_config = connector.get("config")
        if embedded_config is not None:
            for message in validate_mcp_payload(embedded_config):
                report.error(f"{context} config", message)
            if embedded_config != config:
                report.error(
                    f"{context} config",
                    f"embedded config must exactly match {connector.get('path')}/mcps.json",
                )

        connector_servers = config.get("mcpServers") if isinstance(config, dict) else None
        server_keys = set(connector_servers) if isinstance(connector_servers, dict) else set()
        if tools and server_keys:
            for tool in tools:
                if isinstance(tool, dict):
                    t_id = tool.get("id", "")
                    t_server = t_id.split(":", 1)[0] if ":" in t_id else ""
                    if t_server and t_server not in server_keys:
                        report.error(context, f"tool id {t_id!r} prefix {t_server!r} does not match any server in config.mcpServers: {sorted(server_keys)}")


def validate_persona_catalog(root: Path, report: ValidationReport) -> None:
    catalog_path = root / "web-builder" / "public" / "ai-tadpole-catalog.json"
    if not catalog_path.is_file():
        if (root / "web-builder").is_dir():
            report.error("ai-tadpole-catalog.json", "persona catalog file missing from web-builder/public")
        return

    try:
        raw_text = catalog_path.read_text(encoding="utf-8")
        for finding in detect_embedded_secrets(raw_text):
            report.error("ai-tadpole-catalog.json", f"contains likely {finding}")
        catalog = json.loads(raw_text)
    except Exception as exc:
        report.error("ai-tadpole-catalog.json", f"cannot parse JSON: {exc}")
        return

    if not isinstance(catalog, list):
        report.error("ai-tadpole-catalog.json", "must be a JSON array")
        return

    required_fields = (
        "id",
        "name",
        "description",
        "color",
        "emoji",
        "vibe",
        "prompt",
        "runtimePrompt",
        "department",
        "departmentLabel",
    )
    seen_ids: set[str] = set()
    safe_id_regex = SAFE_AGENT_IDENTIFIER

    for idx, persona in enumerate(catalog):
        ctx = f"ai-tadpole-catalog.json[{idx}]"
        if not isinstance(persona, dict):
            report.error(ctx, "must be an object")
            continue
        pid = persona.get("id")
        if not isinstance(pid, str) or not pid.strip():
            report.error(ctx, "missing or empty id")
            pid = f"item_{idx}"
        else:
            ctx = f"ai-tadpole-catalog.json agent '{pid}'"
            if not safe_id_regex.fullmatch(pid):
                report.error(ctx, f"id contains invalid characters or exceeds 64 chars: {pid!r}")
            if pid in seen_ids:
                report.error(ctx, f"duplicate persona id: {pid!r}")
            seen_ids.add(pid)

        for req in required_fields:
            val = persona.get(req)
            if not isinstance(val, str) or not val.strip():
                report.error(ctx, f"missing or empty required field: {req}")

        runtime_prompt = persona.get("runtimePrompt")
        if isinstance(runtime_prompt, str):
            if len(runtime_prompt) > 800:
                report.error(ctx, f"runtimePrompt exceeds 800 characters ({len(runtime_prompt)})")
            for label, pattern in PROMPT_INJECTION_PATTERNS:
                if pattern.search(runtime_prompt):
                    report.error(ctx, f"runtimePrompt contains prohibited {label}")

        skills = persona.get("skills")
        if skills is not None:
            if not isinstance(skills, list):
                report.error(ctx, "skills must be an array")
            else:
                unknown_skills = [s for s in skills if s not in VALID_CAPABILITY_IDS]
                if unknown_skills:
                    report.error(ctx, f"unknown capability IDs in skills: {unknown_skills}")

        workflows = persona.get("workflows")
        if workflows is not None and not isinstance(workflows, list):
            report.error(ctx, "workflows must be an array")

        mcp_tools = persona.get("mcp_tools")
        if mcp_tools is not None and not isinstance(mcp_tools, list):
            report.error(ctx, "mcp_tools must be an array")

        dept = persona.get("department")
        if isinstance(dept, str) and dept.strip().lower() == PLANE2_DEPARTMENT_MARKER.lower():
            if isinstance(skills, list):
                forbidden = sorted(PLANE2_FORBIDDEN_CAPABILITIES.intersection(skills))
                if forbidden:
                    report.error(
                        ctx,
                        f"Plane 2 persona violates FR-11 Dual-Plane Permission Firewall: forbidden capabilities {forbidden}",
                    )
            if not persona.get("requires_oversight", False) and not persona.get("requiresOversight", False):
                report.error(ctx, "Plane 2 persona requires human oversight (requires_oversight must be true)")


def validate_repository(root: Path) -> ValidationReport:
    report = ValidationReport()
    for filename in ("registry.json", "index.json", "mcp_registry.json", "compatibility.lock.json"):
        file_path = root / filename
        if file_path.is_file():
            try:
                raw_text = file_path.read_text(encoding="utf-8")
                for finding in detect_embedded_secrets(raw_text):
                    report.error(filename, f"contains likely {finding}")
            except Exception as exc:
                report.error(filename, f"cannot read file for secret scanning: {exc}")
    templates = validate_catalog_parity(root, report)
    try:
        tool_manifest_map = load_tool_manifest_map(root)
    except Exception as exc:
        report.error("mcp_registry.json", f"cannot parse tool manifest: {exc}")
        tool_manifest_map = {}
    for template in templates:
        if isinstance(template, dict):
            if not template.get("internal") and "content_sha256" not in template:
                report.error("registry.json", f"template {template.get('id')} missing content_sha256")
            validate_template(root, template, report, tool_manifest_map=tool_manifest_map)
        else:
            report.error("registry.json", "each template must be an object")
    validate_mcp_registry(root, report)
    validate_persona_catalog(root, report)
    return report



def main(argv: list[str] | None = None) -> int:
    parser = argparse.ArgumentParser(description="Validate Swarm templates against Tadpole-OS contracts.")
    parser.add_argument("--root", type=Path, default=Path(__file__).resolve().parents[1], help="Repository root containing schemas/")
    parser.add_argument("--template", type=Path, help="Validate a single standalone template directory instead of the full repository")
    parser.add_argument("--format", choices=("text", "json"), default="text", help="Output format")
    args = parser.parse_args(argv)

    root = args.root.resolve()
    if args.template is not None:
        report = ValidationReport()
        tpl_dir = args.template.resolve()
        swarm_file = tpl_dir / "swarm.json"
        template_id = tpl_dir.name
        if swarm_file.is_file():
            try:
                swarm_obj = load_json(swarm_file)
                if isinstance(swarm_obj, dict) and swarm_obj.get("id"):
                    template_id = str(swarm_obj["id"])
            except Exception:
                pass
        try:
            rel_path = tpl_dir.relative_to(root).as_posix()
            validate_root = root
        except ValueError:
            validate_root = tpl_dir.parent
            rel_path = tpl_dir.name
        validate_template(validate_root, {"id": template_id, "path": rel_path}, report, schema_root=root)
    else:
        report = validate_repository(root)

    if args.format == "json":
        print(json.dumps(report.to_json_dict(), indent=2, ensure_ascii=False))
    else:
        for warning in report.warnings:
            print(f"WARNING: {warning}")
        for error in report.errors:
            print(f"ERROR: {error}")
        print(
            f"Contract validation finished: {len(report.errors)} error(s), "
            f"{len(report.warnings)} warning(s)."
        )
    return 1 if report.errors else 0


if __name__ == "__main__":
    sys.exit(main())
