// AUTO-GENERATED from schemas/capabilities-contract.json. Do not edit manually.

export const CONTRACT_VERSION = "1.1.464";
export const CONSUMER_PINNED_REVISION = "2dfc14f1bc52b9da7acbdb27a00985aff0b6dfff";
export const VALID_RUNTIME_CAPABILITIES = new Set(["read_file", "grep_search", "search_web", "write_file", "delete_file", "execute_shell", "shell", "terminal"]);
export const ENGINE_PRIVATE_ENV_VARS = new Set(["NEURAL_TOKEN", "NEURAL_ENGINE_ACCESS_TOKEN", "NEURAL_ADMIN_TOKEN", "ADMIN_TOKEN", "VITE_NEURAL_TOKEN", "CAPABILITY_KEY_CURR", "CAPABILITY_KEY_PREV", "AUDIT_PRIVATE_KEY", "OVERSIGHT_PRIVATE_KEY", "WORKFLOW_ENCRYPTION_KEY"]);
export const RESERVED_MCP_HTTP_HEADERS = new Set(["host", "content-type", "accept", "mcp-protocol-version", "mcp-method", "mcp-name", "origin", "mcp-session-id", "last-event-id"]);
export const ALLOWED_MCP_COMMANDS = new Set(["node", "npx", "python", "python3"]);
export const ALLOWED_MCP_PROTOCOL_VERSIONS = new Set(["2026-07-28", "2024-11-05"]);
export const PLANE2_DEPARTMENT_MARKER = "Plane 2: SMB-Digital-Twin";
export const PLANE2_FORBIDDEN_SKILLS = new Set(["execute_shell", "shell", "terminal", "delete_file"]);
export const CANONICAL_INDUSTRIES = [
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
};
