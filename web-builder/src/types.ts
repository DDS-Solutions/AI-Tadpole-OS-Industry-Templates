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
}

export interface TemplateItem {
  id: string;
  name: string;
  description: string;
  industry: string;
  path: string;
  tags: string[];
  company_size?: number;
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
}

export interface MCPConnector {
  id: string;
  name: string;
  description: string;
  category: string;
  path: string;
  version: string;
  config?: MCPConfig;
  tools?: string[];
  status?: 'verified' | 'reviewed' | 'experimental';
  maintainer?: string;
  last_reviewed?: string;
  required_env?: Record<string, { description: string; placeholder?: string }>;
  integrity_hash?: string;
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
}
