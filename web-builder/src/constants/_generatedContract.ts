// AUTO-GENERATED from schemas/capabilities-contract.json. Do not edit manually.

export const CONTRACT_VERSION = "1.1.464";
export const CONSUMER_PINNED_REVISION = "2dfc14f1bc52b9da7acbdb27a00985aff0b6dfff";

export interface GeneratedCapabilityDef {
  readonly id: string;
  readonly label: string;
  readonly description: string;
  readonly builderDescription: string;
  readonly risk: 'read_only' | 'mutating' | 'dangerous';
  readonly requiresOversight: boolean;
  readonly isMarker: boolean;
  readonly companionMarkers: readonly string[];
}

export const GENERATED_CAPABILITY_DEFS: readonly GeneratedCapabilityDef[] = [
  {"id": "read_file", "label": "Read File", "description": "Inspect files in the local filesystem workspace.", "builderDescription": "Inspect workspace files safely in read-only mode.", "risk": "read_only", "requiresOversight": false, "isMarker": false, "companionMarkers": []},
  {"id": "grep_search", "label": "Grep Search", "description": "Perform pattern searches across repository text files.", "builderDescription": "Perform regex pattern searches across text files.", "risk": "read_only", "requiresOversight": false, "isMarker": false, "companionMarkers": []},
  {"id": "search_web", "label": "Search Web", "description": "Search public internet resources and documentation.", "builderDescription": "Fetch external documentation and public web pages.", "risk": "read_only", "requiresOversight": false, "isMarker": false, "companionMarkers": []},
  {"id": "write_file", "label": "Write File", "description": "Create or overwrite files in the local filesystem workspace.", "builderDescription": "Create and update workspace files. Requires operator oversight.", "risk": "mutating", "requiresOversight": true, "isMarker": false, "companionMarkers": []},
  {"id": "delete_file", "label": "Delete File", "description": "Remove files from the workspace.", "builderDescription": "Remove files from the workspace. Requires operator oversight.", "risk": "dangerous", "requiresOversight": true, "isMarker": false, "companionMarkers": []},
  {"id": "execute_shell", "label": "Execute Shell", "description": "Execute system terminal shell commands.", "builderDescription": "Execute shell commands. Automatically paired with runtime shell marker.", "risk": "dangerous", "requiresOversight": true, "isMarker": false, "companionMarkers": ["shell", "terminal"]},
  {"id": "shell", "label": "Shell Marker", "description": "Runtime permission marker enabling shell execution.", "builderDescription": "Runtime permission marker enabling shell execution.", "risk": "dangerous", "requiresOversight": true, "isMarker": true, "companionMarkers": []},
  {"id": "terminal", "label": "Terminal Marker", "description": "Alternative runtime marker for terminal environment access.", "builderDescription": "Alternative runtime marker for terminal environment access.", "risk": "dangerous", "requiresOversight": true, "isMarker": true, "companionMarkers": []},
];

export const VALID_RUNTIME_CAPABILITY_LIST = ["read_file", "grep_search", "search_web", "write_file", "delete_file", "execute_shell", "shell", "terminal"] as const;
export const DANGEROUS_SKILL_LIST = ["write_file", "delete_file", "execute_shell", "shell", "terminal"] as const;
export const LEGACY_SKILL_LIST = ["run_command", "write_to_file"] as const;
export const ENGINE_PRIVATE_ENV_VAR_LIST = ["NEURAL_TOKEN", "NEURAL_ENGINE_ACCESS_TOKEN", "NEURAL_ADMIN_TOKEN", "ADMIN_TOKEN", "VITE_NEURAL_TOKEN", "CAPABILITY_KEY_CURR", "CAPABILITY_KEY_PREV", "AUDIT_PRIVATE_KEY", "OVERSIGHT_PRIVATE_KEY", "WORKFLOW_ENCRYPTION_KEY"] as const;
export const RESERVED_MCP_HTTP_HEADER_LIST = ["host", "content-type", "accept", "mcp-protocol-version", "mcp-method", "mcp-name", "origin", "mcp-session-id", "last-event-id"] as const;
export const RESERVED_MCP_HTTP_HEADER_PREFIX_LIST = ["mcp-param-"] as const;
export const ALLOWED_MCP_COMMAND_LIST = ["node", "npx", "python", "python3"] as const;
export const ALLOWED_MCP_PROTOCOL_LIST = ["2026-07-28", "2024-11-05"] as const;
export const PLANE2_DEPARTMENT_MARKER = "Plane 2: SMB-Digital-Twin";
export const PLANE2_FORBIDDEN_SKILL_LIST = ["execute_shell", "shell", "terminal", "delete_file"] as const;
export const PROMPT_INJECTION_PATTERN_DEFS = [{"label": "prompt boundary spoofing sentinel", "pattern": "<<<|>>>", "ignore_case": false}, {"label": "system override phrase", "pattern": "ignore\\s+(?:all\\s+)?previous\\s+instructions", "ignore_case": true}, {"label": "system override phrase", "pattern": "disregard\\s+(?:all\\s+)?(?:previous\\s+instructions|system\\s+prompt)", "ignore_case": true}, {"label": "system override phrase", "pattern": "you\\s+are\\s+now\\s+in\\s+developer\\s+mode", "ignore_case": true}, {"label": "system override phrase", "pattern": "bypass\\s+(?:safety\\s+filters|oversight)", "ignore_case": true}, {"label": "system override phrase", "pattern": "disable\\s+oversight", "ignore_case": true}, {"label": "system override phrase", "pattern": "system\\s+prompt\\s+override", "ignore_case": true}] as const;
export const CANONICAL_INDUSTRIES: readonly string[] = [
  "Aerospace & Orbital Surveillance",
  "Agriculture & AgTech",
  "Automotive Dealerships & Repair",
  "Chemical Sector",
  "Construction & General Contracting",
  "Critical Infrastructure",
  "Cybersecurity",
  "Digital Marketing",
  "E-commerce",
  "Economic & Commercial Spatial Intelligence",
  "EdTech & Training",
  "Education",
  "Emergency Management & Disaster Response",
  "Engineering & Architecture",
  "Field Services",
  "Financial Services",
  "Food & Beverage",
  "Geospatial Intelligence & OSINT",
  "Governance & Compliance",
  "Hospitality & Lodging",
  "Human Resources",
  "Insurance & Claims Processing",
  "Legal Services",
  "Logistics & Supply Chain",
  "Manufacturing",
  "Maritime Operations & Domain Awareness",
  "Media & Creative",
  "Medical Practices",
  "Non-Profit & Foundations",
  "Pharmaceuticals",
  "Real Estate",
  "Renewable Energy & Solar",
  "Retail & Point of Sale",
  "Software Development",
  "Specialized Consultancies",
  "Transportation & Logistics",
  "Veterinary & Animal Health",
  "Wholesale & Distribution"
];
export const INDUSTRY_ALIASES: Readonly<Record<string, string>> = {
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
};
export const DEFAULT_MODEL_SLOTS = {
  "primary": {
    "provider": "ollama-cloud",
    "model_id": "gemma4:31b-cloud",
    "temperature": 0.4,
    "max_turns": 24
  },
  "planning": {
    "provider": "ollama-cloud",
    "model_id": "gemma4:31b-cloud",
    "temperature": 0.3,
    "max_turns": 16
  },
  "execution": {
    "provider": "ollama",
    "model_id": "gemma4:e4b",
    "temperature": 0.2,
    "max_turns": 24
  }
} as const;
