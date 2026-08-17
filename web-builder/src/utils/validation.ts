import type { Agent, CompanyInfo, MCPConnector, ValidationIssue, WorkflowItem } from '../types';
import { VALID_RUNTIME_CAPABILITIES, DANGEROUS_SKILL_SET } from '../constants/capabilities';

const LEGACY_SKILLS = new Set(['run_command', 'write_to_file']);

export function inferProvider(modelId: string): string {
  const model = modelId.toLowerCase();
  if (model.includes('gemini')) return 'google';
  if (model.includes('claude')) return 'anthropic';
  if (model.includes('gpt') || model.startsWith('o1') || model.startsWith('o3')) return 'openai';
  throw new Error(`Choose an explicit provider for unrecognized model "${modelId}".`);
}

export function tryNormalizeId(value: string | undefined): string | null {
  if (!value) return null;
  const normalized = value.toLowerCase().replace(/[^a-z0-9_-]+/g, '-').replace(/^-+|-+$/g, '');
  return normalized || null;
}

export function validateSwarm(
  companyInfo: CompanyInfo,
  agents: Agent[],
  workflows: WorkflowItem[],
  selectedConnectors: string[],
  mcpCatalog: MCPConnector[],
): ValidationIssue[] {
  const issues: ValidationIssue[] = [];

  // 1. Identity validation
  if (!companyInfo.name || companyInfo.name.trim() === '') {
    issues.push({
      id: 'identity-missing-name',
      severity: 'error',
      section: 'identity',
      message: 'Company or Swarm name is required.',
      suggestedAction: 'Enter a name for your organization or team.',
    });
  }

  if (!companyInfo.industry || companyInfo.industry.trim() === '') {
    issues.push({
      id: 'identity-missing-industry',
      severity: 'error',
      section: 'identity',
      message: 'Industry sector is required.',
      suggestedAction: 'Select an industry sector for your swarm blueprint.',
    });
  }

  const parsedSize = Number.parseInt(companyInfo.size, 10);
  if (Number.isNaN(parsedSize) || parsedSize <= 0) {
    issues.push({
      id: 'identity-invalid-size',
      severity: 'warning',
      section: 'identity',
      message: 'Company size should be a positive number.',
      suggestedAction: 'Specify estimated employee count (default is 25).',
    });
  }

  // 2. Agents validation
  if (agents.length === 0) {
    issues.push({
      id: 'agents-empty-roster',
      severity: 'error',
      section: 'agents',
      message: 'Swarm must include at least one specialist agent.',
      suggestedAction: 'Add a recommended specialist or select an agent from the catalog.',
    });
  }

  const agentIds = new Set<string>();
  const workflowIds = new Set<string>();
  for (const w of workflows) {
    const norm = tryNormalizeId(w.id);
    if (norm) workflowIds.add(norm);
  }

  for (const agent of agents) {
    const cleanId = tryNormalizeId(agent.id);
    if (!cleanId) {
      issues.push({
        id: `agent-invalid-id-${agent.id || 'unnamed'}`,
        severity: 'error',
        section: 'agents',
        itemId: agent.id,
        message: `Agent "${agent.name || 'Unnamed'}" has an invalid identifier.`,
        suggestedAction: 'Use alphanumeric characters and dashes for agent IDs.',
      });
      continue;
    }

    if (agentIds.has(cleanId)) {
      issues.push({
        id: `agent-duplicate-id-${cleanId}`,
        severity: 'error',
        section: 'agents',
        itemId: agent.id,
        message: `Duplicate agent ID detected: "${cleanId}".`,
        suggestedAction: 'Ensure all agents have unique IDs.',
      });
    }
    agentIds.add(cleanId);

    if (!agent.name || agent.name.trim() === '') {
      issues.push({
        id: `agent-missing-name-${cleanId}`,
        severity: 'error',
        section: 'agents',
        itemId: agent.id,
        message: `Agent "${cleanId}" is missing a name.`,
        suggestedAction: 'Provide a display name for this specialist.',
      });
    }

    if (!agent.role || agent.role.trim() === '') {
      issues.push({
        id: `agent-missing-role-${cleanId}`,
        severity: 'error',
        section: 'agents',
        itemId: agent.id,
        message: `Agent "${agent.name || cleanId}" is missing a role.`,
        suggestedAction: 'Define the functional role for this agent.',
      });
    }

    // Model and provider validation
    const modelId = agent.model || 'gemini-pro-latest';
    if (!agent.provider) {
      try {
        inferProvider(modelId);
      } catch {
        issues.push({
          id: `agent-unknown-model-${cleanId}`,
          severity: 'error',
          section: 'agents',
          itemId: agent.id,
          message: `Agent "${agent.name || cleanId}" uses unrecognized model "${modelId}".`,
          suggestedAction: 'Choose a recognized model (Gemini, Claude, GPT) or specify an explicit provider.',
        });
      }
    }

    const prompt = (agent.prompt || '').trim();
    if (!prompt) {
      issues.push({
        id: `agent-missing-prompt-${cleanId}`,
        severity: 'error',
        section: 'agents',
        itemId: agent.id,
        message: `Agent "${agent.name || cleanId}" has an empty system prompt.`,
        suggestedAction: 'Provide operational instructions for this agent.',
      });
    } else if (prompt.length > 800) {
      issues.push({
        id: `agent-prompt-too-long-${cleanId}`,
        severity: 'error',
        section: 'agents',
        itemId: agent.id,
        message: `Agent "${agent.name || cleanId}" system prompt is ${prompt.length} characters (maximum allowed by AI-Tadpole-OS is 800).`,
        suggestedAction: 'Shorten the prompt to focus strictly on role, mission, and guardrails.',
      });
    }

    // Capability check
    const skills = agent.skills || ['read_file'];
    for (const skill of skills) {
      if (LEGACY_SKILLS.has(skill)) {
        issues.push({
          id: `agent-legacy-skill-${cleanId}-${skill}`,
          severity: 'error',
          section: 'agents',
          itemId: agent.id,
          message: `Agent "${agent.name}" declares unsupported legacy capability "${skill}".`,
          suggestedAction: 'Replace with a native AI-Tadpole-OS tool ID (e.g. read_file, write_file, execute_shell, search_web).',
        });
      } else if (!VALID_RUNTIME_CAPABILITIES.has(skill)) {
        issues.push({
          id: `agent-unrecognized-skill-${cleanId}-${skill}`,
          severity: 'error',
          section: 'agents',
          itemId: agent.id,
          message: `Agent "${agent.name}" declares unrecognized runtime capability "${skill}".`,
          suggestedAction: 'Use recognized tool IDs: read_file, write_file, grep_search, execute_shell, search_web, delete_file.',
        });
      }
    }

    if (skills.includes('execute_shell') && !skills.some(s => s === 'shell' || s === 'terminal')) {
      issues.push({
        id: `agent-missing-shell-marker-${cleanId}`,
        severity: 'error',
        section: 'agents',
        itemId: agent.id,
        message: `Agent "${agent.name}" declares execute_shell without the companion shell or terminal marker.`,
        suggestedAction: 'Add the shell or terminal capability marker.',
      });
    }

    // Workflow references check (safe non-throwing)
    for (const ref of agent.workflows || []) {
      const safeRef = tryNormalizeId(ref);
      if (!safeRef || !workflowIds.has(safeRef)) {
        issues.push({
          id: `agent-missing-workflow-${cleanId}-${ref}`,
          severity: 'error',
          section: 'agents',
          itemId: agent.id,
          message: `Agent "${agent.name}" references workflow "${ref}" which is not defined in Playbooks.`,
          suggestedAction: 'Add the missing playbook or remove the reference.',
        });
      }
    }

    // Dangerous skill oversight check
    const hasDangerous = skills.some(s => DANGEROUS_SKILL_SET.has(s));
    if (hasDangerous && !agent.requiresOversight) {
      issues.push({
        id: `agent-forced-oversight-${cleanId}`,
        severity: 'warning',
        section: 'agents',
        itemId: agent.id,
        message: `Agent "${agent.name}" has mutating capabilities (${skills.filter(s => DANGEROUS_SKILL_SET.has(s)).join(', ')}). Human oversight will be enforced at runtime.`,
        suggestedAction: 'Review human approval policies.',
      });
    }
  }

  // 3. Workflows validation (safe non-throwing)
  const wfIdSet = new Set<string>();
  for (const wf of workflows) {
    const cleanWfId = tryNormalizeId(wf.id);
    if (!cleanWfId) {
      issues.push({
        id: `workflow-invalid-id-${wf.id || 'unnamed'}`,
        severity: 'error',
        section: 'workflows',
        itemId: wf.id,
        message: `Workflow "${wf.name || 'Unnamed'}" has an invalid identifier.`,
        suggestedAction: 'Use alphanumeric characters and dashes for workflow IDs.',
      });
      continue;
    }

    if (wfIdSet.has(cleanWfId)) {
      issues.push({
        id: `workflow-duplicate-id-${cleanWfId}`,
        severity: 'error',
        section: 'workflows',
        itemId: wf.id,
        message: `Duplicate workflow ID detected: "${cleanWfId}".`,
        suggestedAction: 'Ensure all workflows have unique IDs.',
      });
    }
    wfIdSet.add(cleanWfId);

    if (!wf.name || wf.name.trim() === '') {
      issues.push({
        id: `workflow-missing-name-${cleanWfId}`,
        severity: 'error',
        section: 'workflows',
        itemId: wf.id,
        message: `Workflow "${cleanWfId}" is missing a title.`,
        suggestedAction: 'Provide a descriptive name for this workflow.',
      });
    }

    if (!wf.description || wf.description.trim() === '') {
      issues.push({
        id: `workflow-missing-desc-${cleanWfId}`,
        severity: 'warning',
        section: 'workflows',
        itemId: wf.id,
        message: `Workflow "${wf.name || cleanWfId}" has empty content.`,
        suggestedAction: 'Add executable steps or guidance for this playbook.',
      });
    }
  }

  // 4. Connectors validation
  for (const connectorId of selectedConnectors) {
    const conn = mcpCatalog.find(c => c.id === connectorId);
    if (!conn) {
      issues.push({
        id: `connector-not-found-${connectorId}`,
        severity: 'error',
        section: 'connectors',
        itemId: connectorId,
        message: `Selected connector "${connectorId}" is not present in the MCP registry.`,
        suggestedAction: 'Remove or re-select the connector.',
      });
      continue;
    }

    if (conn.status === 'experimental') {
      issues.push({
        id: `connector-experimental-${connectorId}`,
        severity: 'info',
        section: 'connectors',
        itemId: connectorId,
        message: `Connector "${conn.name}" is marked as experimental. Review its security review status.`,
      });
    }

    if (conn.required_env && Object.keys(conn.required_env).length > 0) {
      const varNames = Object.keys(conn.required_env).join(', ');
      issues.push({
        id: `connector-env-required-${connectorId}`,
        severity: 'info',
        section: 'connectors',
        itemId: connectorId,
        message: `Connector "${conn.name}" requires environment variables (${varNames}) configured in AI-Tadpole-OS.`,
      });
    }
  }

  return issues;
}
