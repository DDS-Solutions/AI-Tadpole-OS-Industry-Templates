"""Canonical capability catalog and security classifications for Tadpole OS agents."""

from __future__ import annotations

from dataclasses import dataclass
from typing import Literal

RiskCategory = Literal["read_only", "mutating", "dangerous"]


@dataclass(frozen=True)
class CapabilitySpec:
    id: str
    label: str
    description: str
    risk: RiskCategory
    requires_oversight: bool
    companion_markers: tuple[str, ...] = ()


CAPABILITIES: tuple[CapabilitySpec, ...] = (
    CapabilitySpec(
        id="read_file",
        label="Read File",
        description="Inspect files in the local filesystem workspace.",
        risk="read_only",
        requires_oversight=False,
    ),
    CapabilitySpec(
        id="grep_search",
        label="Grep Search",
        description="Perform pattern searches across repository text files.",
        risk="read_only",
        requires_oversight=False,
    ),
    CapabilitySpec(
        id="list_dir",
        label="List Directory",
        description="List and explore directories and file trees.",
        risk="read_only",
        requires_oversight=False,
    ),
    CapabilitySpec(
        id="web_search",
        label="Web Search",
        description="Search public internet resources and documentation.",
        risk="read_only",
        requires_oversight=False,
    ),
    CapabilitySpec(
        id="write_file",
        label="Write File",
        description="Create or overwrite files in the local filesystem workspace.",
        risk="mutating",
        requires_oversight=True,
    ),
    CapabilitySpec(
        id="delete_file",
        label="Delete File",
        description="Remove files from the workspace.",
        risk="dangerous",
        requires_oversight=True,
    ),
    CapabilitySpec(
        id="execute_shell",
        label="Execute Shell",
        description="Execute system terminal shell commands.",
        risk="dangerous",
        requires_oversight=True,
        companion_markers=("shell", "terminal"),
    ),
    CapabilitySpec(
        id="shell",
        label="Shell Marker",
        description="Runtime permission marker enabling shell execution.",
        risk="dangerous",
        requires_oversight=True,
    ),
    CapabilitySpec(
        id="terminal",
        label="Terminal Marker",
        description="Alternative runtime marker for terminal environment access.",
        risk="dangerous",
        requires_oversight=True,
    ),
)

CAPABILITY_MAP: dict[str, CapabilitySpec] = {spec.id: spec for spec in CAPABILITIES}
DANGEROUS_CAPABILITY_IDS: frozenset[str] = frozenset(
    spec.id for spec in CAPABILITIES if spec.requires_oversight
)
