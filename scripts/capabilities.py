"""Canonical capability catalog and security classifications for AI-Tadpole-OS agents."""

from __future__ import annotations

from dataclasses import dataclass
from typing import Literal

try:
    from scripts._generated_contract import CAPABILITY_SPECS
except ImportError:  # executed directly as `python scripts/capabilities.py`
    from _generated_contract import CAPABILITY_SPECS

RiskCategory = Literal["read_only", "mutating", "dangerous"]


@dataclass(frozen=True)
class CapabilitySpec:
    id: str
    label: str
    description: str
    risk: RiskCategory
    requires_oversight: bool
    companion_markers: tuple[str, ...] = ()


CAPABILITIES: tuple[CapabilitySpec, ...] = tuple(
    CapabilitySpec(
        id=str(spec["id"]),
        label=str(spec["label"]),
        description=str(spec["description"]),
        risk=spec["risk"],  # type: ignore[arg-type]
        requires_oversight=bool(spec["requires_oversight"]),
        companion_markers=tuple(spec.get("companion_markers", ())),
    )
    for spec in CAPABILITY_SPECS
)

CAPABILITY_MAP: dict[str, CapabilitySpec] = {spec.id: spec for spec in CAPABILITIES}
VALID_CAPABILITY_IDS: frozenset[str] = frozenset(CAPABILITY_MAP)
DANGEROUS_CAPABILITY_IDS: frozenset[str] = frozenset(
    spec.id for spec in CAPABILITIES if spec.requires_oversight
)
