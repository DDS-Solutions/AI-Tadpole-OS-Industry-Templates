export type ExperienceMode = 'guided' | 'advanced';

export interface Agent {
  id: string;
  name: string;
  role: string;
  model: string;
  prompt: string;
  department?: string;
  status?: string;
  provider?: string;
  skills?: string[];
  workflows?: string[];
  mcpTools?: string[];
  requiresOversight?: boolean;
  description?: string;
  color?: string;
  emoji?: string;
  vibe?: string;
  isCustom?: boolean;
  recommendationReason?: string;
}

export interface WorkflowItem {
  id: string;
  name: string;
  description: string;
  isOkfPlaybook?: boolean;
  resourceUri?: string;
  topic?: string;
  conceptType?: string;
  tags?: string;
  source?: 'generated' | 'template' | 'custom' | 'imported';
  generatedFromGoalId?: string;
}

export interface TemplateItem {
  id: string;
  name: string;
  description: string;
  industry: string;
  path: string;
  tags: string[];
  company_size?: number;
  internal?: boolean;
}

export interface CatalogAgent {
  id: string;
  name: string;
  role?: string;
  prompt: string;
  runtimePrompt: string;
  description: string;
  vibe: string;
  department: string;
  departmentLabel: string;
  color: string;
  emoji: string;
}

export interface SwarmDetails {
  roster: Agent[];
  workflows: WorkflowItem[];
  selectedConnectors?: string[];
  connectorIds?: string[];
  mcpConfig?: MCPConfig;
  knowledge?: unknown[];
}

export interface MCPToolDescriptor {
  id: string;
  name: string;
  description: string;
  risk: 'read' | 'write' | 'execute';
  recommendedGoalIds?: string[];
}

export interface MCPDependencyProvenance {
  package: string;
  version: string;
  artifact: string;
  sha256: string;
  source: string;
}

export interface MCPConnector {
  id: string;
  name: string;
  description: string;
  category: string;
  path: string;
  version: string;
  schema_version?: string;
  author?: string;
  maintainer?: string;
  last_reviewed?: string;
  status?: 'verified' | 'reviewed' | 'experimental' | 'quarantined' | 'sample';
  required_env?: Record<string, { description: string; placeholder?: string }>;
  integrity_hash?: string;
  dependency_manifest?: string;
  dependency_provenance?: MCPDependencyProvenance[];
  tools?: MCPToolDescriptor[];
  config?: MCPConfig;
}

export interface MCPServerConfig {
  command: string;
  args: string[];
  env?: Record<string, string>;
}

export interface MCPConfig {
  mcpServers: Record<string, MCPServerConfig>;
}

export interface CompanyInfo {
  name: string;
  size: string;
  description: string;
  mission: string;
  industry: string;
  industryPath: string;
  industryCode: string;
  goals?: string[];
}

export interface ValidationIssue {
  id: string;
  severity: 'error' | 'warning' | 'info';
  section: 'identity' | 'agents' | 'workflows' | 'connectors' | 'general';
  itemId?: string;
  message: string;
  suggestedAction?: string;
}

export interface RecommendedSpecialist {
  agent: Agent;
  whyRecommended: string;
  canRead: string[];
  canPrepare: string[];
  cannotApprove: string[];
  requiresApproval: boolean;
  matchedGoalIds?: string[];
}
