"""AUTO-GENERATED from schemas/capabilities-contract.json. Do not edit manually."""

from __future__ import annotations

CONTRACT_VERSION = "1.1.464"
CONSUMER_PINNED_REVISION = "2dfc14f1bc52b9da7acbdb27a00985aff0b6dfff"

CAPABILITY_SPECS = [
    {
        "id": "read_file",
        "label": "Read File",
        "description": "Inspect files in the local filesystem workspace.",
        "builder_description": "Inspect workspace files safely in read-only mode.",
        "risk": "read_only",
        "requires_oversight": False,
        "is_marker": False,
        "companion_markers": []
    },
    {
        "id": "grep_search",
        "label": "Grep Search",
        "description": "Perform pattern searches across repository text files.",
        "builder_description": "Perform regex pattern searches across text files.",
        "risk": "read_only",
        "requires_oversight": False,
        "is_marker": False,
        "companion_markers": []
    },
    {
        "id": "search_web",
        "label": "Search Web",
        "description": "Search public internet resources and documentation.",
        "builder_description": "Fetch external documentation and public web pages.",
        "risk": "read_only",
        "requires_oversight": False,
        "is_marker": False,
        "companion_markers": []
    },
    {
        "id": "write_file",
        "label": "Write File",
        "description": "Create or overwrite files in the local filesystem workspace.",
        "builder_description": "Create and update workspace files. Requires operator oversight.",
        "risk": "mutating",
        "requires_oversight": True,
        "is_marker": False,
        "companion_markers": []
    },
    {
        "id": "delete_file",
        "label": "Delete File",
        "description": "Remove files from the workspace.",
        "builder_description": "Remove files from the workspace. Requires operator oversight.",
        "risk": "dangerous",
        "requires_oversight": True,
        "is_marker": False,
        "companion_markers": []
    },
    {
        "id": "execute_shell",
        "label": "Execute Shell",
        "description": "Execute system terminal shell commands.",
        "builder_description": "Execute shell commands. Automatically paired with runtime shell marker.",
        "risk": "dangerous",
        "requires_oversight": True,
        "is_marker": False,
        "companion_markers": [
            "shell",
            "terminal"
        ]
    },
    {
        "id": "shell",
        "label": "Shell Marker",
        "description": "Runtime permission marker enabling shell execution.",
        "builder_description": "Runtime permission marker enabling shell execution.",
        "risk": "dangerous",
        "requires_oversight": True,
        "is_marker": True,
        "companion_markers": []
    },
    {
        "id": "terminal",
        "label": "Terminal Marker",
        "description": "Alternative runtime marker for terminal environment access.",
        "builder_description": "Alternative runtime marker for terminal environment access.",
        "risk": "dangerous",
        "requires_oversight": True,
        "is_marker": True,
        "companion_markers": []
    }
]
VALID_CAPABILITY_IDS: frozenset[str] = frozenset(['read_file', 'grep_search', 'search_web', 'write_file', 'delete_file', 'execute_shell', 'shell', 'terminal'])
DANGEROUS_CAPABILITY_IDS: frozenset[str] = frozenset(['write_file', 'delete_file', 'execute_shell', 'shell', 'terminal'])

LEGACY_CAPABILITIES: frozenset[str] = frozenset(['run_command', 'write_to_file'])
LEGACY_CAPABILITY_REPLACEMENTS: dict[str, tuple[str, ...]] = {
    'write_to_file': ('write_file',),
    'run_command': ('execute_shell', 'shell'),
}

ENGINE_PRIVATE_ENV_VARS: frozenset[str] = frozenset(['NEURAL_TOKEN', 'NEURAL_ENGINE_ACCESS_TOKEN', 'NEURAL_ADMIN_TOKEN', 'ADMIN_TOKEN', 'VITE_NEURAL_TOKEN', 'CAPABILITY_KEY_CURR', 'CAPABILITY_KEY_PREV', 'AUDIT_PRIVATE_KEY', 'OVERSIGHT_PRIVATE_KEY', 'WORKFLOW_ENCRYPTION_KEY'])
RESERVED_MCP_HTTP_HEADERS: frozenset[str] = frozenset(['host', 'content-type', 'accept', 'mcp-protocol-version', 'mcp-method', 'mcp-name', 'origin', 'mcp-session-id', 'last-event-id'])
RESERVED_MCP_HTTP_HEADER_PREFIXES: tuple[str, ...] = ('mcp-param-',)
ALLOWED_MCP_COMMANDS: frozenset[str] = frozenset(['node', 'npx', 'python', 'python3'])
ALLOWED_MCP_PROTOCOL_VERSIONS: frozenset[str] = frozenset(['2026-07-28', '2024-11-05'])

PLANE2_DEPARTMENT_MARKER = 'Plane 2: SMB-Digital-Twin'
PLANE2_FORBIDDEN_CAPABILITIES: frozenset[str] = frozenset(['execute_shell', 'shell', 'terminal', 'delete_file'])

PROMPT_INJECTION_PATTERN_SPECS: tuple[tuple[str, str, bool], ...] = (
    ('prompt boundary spoofing sentinel', '<<<|>>>', False),
    ('system override phrase', 'ignore\\s+(?:all\\s+)?previous\\s+instructions', True),
    ('system override phrase', 'disregard\\s+(?:all\\s+)?(?:previous\\s+instructions|system\\s+prompt)', True),
    ('system override phrase', 'you\\s+are\\s+now\\s+in\\s+developer\\s+mode', True),
    ('system override phrase', 'bypass\\s+(?:safety\\s+filters|oversight)', True),
    ('system override phrase', 'disable\\s+oversight', True),
    ('system override phrase', 'system\\s+prompt\\s+override', True),
)

CANONICAL_INDUSTRIES: tuple[str, ...] = ('Aerospace & Orbital Surveillance', 'Agriculture & AgTech', 'Automotive Dealerships & Repair', 'Chemical Sector', 'Construction & General Contracting', 'Critical Infrastructure', 'Cybersecurity', 'Digital Marketing', 'E-commerce', 'Economic & Commercial Spatial Intelligence', 'EdTech & Training', 'Education', 'Emergency Management & Disaster Response', 'Engineering & Architecture', 'Field Services', 'Financial Services', 'Food & Beverage', 'Geospatial Intelligence & OSINT', 'Governance & Compliance', 'Hospitality & Lodging', 'Human Resources', 'Insurance & Claims Processing', 'Legal Services', 'Logistics & Supply Chain', 'Manufacturing', 'Maritime Operations & Domain Awareness', 'Media & Creative', 'Medical Practices', 'Non-Profit & Foundations', 'Pharmaceuticals', 'Real Estate', 'Renewable Energy & Solar', 'Retail & Point of Sale', 'Software Development', 'Specialized Consultancies', 'Transportation & Logistics', 'Veterinary & Animal Health', 'Wholesale & Distribution')
INDUSTRY_ALIASES: dict[str, str] = {
    "aerospace-orbital": "Aerospace & Orbital Surveillance",
    "agriculture": "Agriculture & AgTech",
    "agriculture-agtech": "Agriculture & AgTech",
    "automotive": "Automotive Dealerships & Repair",
    "chemical": "Chemical Sector",
    "chemical-sector": "Chemical Sector",
    "compliance": "Governance & Compliance",
    "construction": "Construction & General Contracting",
    "creative": "Media & Creative",
    "critical-infrastructure": "Critical Infrastructure",
    "cybersecurity": "Cybersecurity",
    "development": "Software Development",
    "digital-marketing": "Digital Marketing",
    "e-commerce": "E-commerce",
    "economic-intelligence": "Economic & Commercial Spatial Intelligence",
    "edtech-training": "EdTech & Training",
    "education": "Education",
    "emergency-management": "Emergency Management & Disaster Response",
    "engineering-architecture": "Engineering & Architecture",
    "field-services": "Field Services",
    "financial-services": "Financial Services",
    "food": "Food & Beverage",
    "food-beverage": "Food & Beverage",
    "geospatial-intelligence": "Geospatial Intelligence & OSINT",
    "governance-compliance": "Governance & Compliance",
    "healthcare": "Medical Practices",
    "hospitality": "Hospitality & Lodging",
    "hr": "Human Resources",
    "human-resources": "Human Resources",
    "insurance": "Insurance & Claims Processing",
    "legal": "Legal Services",
    "legal-services": "Legal Services",
    "logistics-supply-chain": "Logistics & Supply Chain",
    "manufacturing": "Manufacturing",
    "maritime-operations": "Maritime Operations & Domain Awareness",
    "media-creative": "Media & Creative",
    "medical-practices": "Medical Practices",
    "non-profit": "Non-Profit & Foundations",
    "pharma": "Pharmaceuticals",
    "pharmaceuticals": "Pharmaceuticals",
    "real-estate": "Real Estate",
    "renewable-energy": "Renewable Energy & Solar",
    "retail": "Retail & Point of Sale",
    "security": "Cybersecurity",
    "software-development": "Software Development",
    "specialized-consultancies": "Specialized Consultancies",
    "transportation": "Transportation & Logistics",
    "transportation-logistics": "Transportation & Logistics",
    "utilities": "Critical Infrastructure",
    "veterinary": "Veterinary & Animal Health",
    "wholesale-distribution": "Wholesale & Distribution"
}

DEFAULT_PRIMARY_MODEL_CONFIG: dict[str, object] = {
    "provider": "ollama-cloud",
    "model_id": "gemma4:31b-cloud",
    "temperature": 0.4,
    "max_turns": 24
}
DEFAULT_PLANNING_MODEL_CONFIG: dict[str, object] = {
    "provider": "ollama-cloud",
    "model_id": "gemma4:31b-cloud",
    "temperature": 0.3,
    "max_turns": 16
}
DEFAULT_EXECUTION_MODEL_CONFIG: dict[str, object] = {
    "provider": "ollama",
    "model_id": "gemma4:e4b",
    "temperature": 0.2,
    "max_turns": 24
}
