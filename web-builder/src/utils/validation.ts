import type { Agent, CompanyInfo, MCPConnector, ValidationIssue, WorkflowItem } from '../types';
import { VALID_RUNTIME_CAPABILITIES, DANGEROUS_SKILL_SET } from '../constants/capabilities';

const LEGACY_SKILLS = new Set(['run_command', 'write_to_file']);
export const ENGINE_PRIVATE_ENV_VARS = new Set([
  'NEURAL_TOKEN',
  'NEURAL_ENGINE_ACCESS_TOKEN',
  'NEURAL_ADMIN_TOKEN',
  'ADMIN_TOKEN',
  'VITE_NEURAL_TOKEN',
  'CAPABILITY_KEY_CURR',
  'CAPABILITY_KEY_PREV',
  'AUDIT_PRIVATE_KEY',
  'OVERSIGHT_PRIVATE_KEY',
  'WORKFLOW_ENCRYPTION_KEY',
]);
export const RESERVED_MCP_HTTP_HEADERS = new Set([
  'host',
  'content-type',
  'accept',
  'mcp-protocol-version',
  'mcp-method',
  'mcp-name',
  'origin',
  'mcp-session-id',
  'last-event-id',
]);
const PROMPT_INJECTION_PATTERNS = [
  /<<<|>>>/,
  /ignore\s+(?:all\s+)?previous\s+instructions/i,
  /disregard\s+system\s+prompt/i,
  /you\s+are\s+now\s+in\s+developer\s+mode/i,
  /bypass\s+safety\s+filters/i,
];

export function inferProvider(modelId: string): string {
  const model = modelId.toLowerCase();
  if (model.endsWith('-cloud') && model.includes('gemma')) return 'ollama-cloud';
  if (model.startsWith('gemma4:e')) return 'ollama';
  if (model.includes('gemini') || model.includes('gemma')) return 'google';
  if (model.includes('claude')) return 'anthropic';
  if (model.includes('gpt') || model.startsWith('o1') || model.startsWith('o3')) return 'openai';
  if (model.includes('llama')) return 'groq';
  if (model.includes('deepseek')) return 'deepseek';
  if (model.includes('mistral') || model.includes('mixtral')) return 'mistral';
  throw new Error(`Choose an explicit provider for unrecognized model "${modelId}".`);
}

function tryNormalizeId(value: string | undefined): string | null {
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

  if (!companyInfo.mission || companyInfo.mission.trim() === '') {
    issues.push({
      id: 'identity-missing-mission',
      severity: 'error',
      section: 'identity',
      message: 'Swarm mission or purpose is required.',
      suggestedAction: 'Enter a clear mission statement for this swarm.',
    });
  }

  const parsedSize = Number.parseInt(companyInfo.size, 10);
  if (Number.isNaN(parsedSize) || parsedSize <= 0) {
    issues.push({
      id: 'identity-invalid-size',
      severity: 'error',
      section: 'identity',
      message: 'Company size must be a positive integer.',
      suggestedAction: 'Specify estimated employee count (e.g. 25).',
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
  const playbookMap = new Map<string, WorkflowItem>();
  for (const w of workflows) {
    const norm = tryNormalizeId(w.id);
    if (norm) {
      workflowIds.add(norm);
      playbookMap.set(norm, w);
    }
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

    if (cleanId.length > 64) {
      issues.push({
        id: `agent-id-too-long-${cleanId}`,
        severity: 'error',
        section: 'agents',
        itemId: agent.id,
        message: `Agent "${agent.name || cleanId}" identifier exceeds 64 characters (${cleanId.length}).`,
        suggestedAction: 'Shorten the agent ID to 64 characters or fewer.',
      });
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
    const modelId = agent.model || 'gemma4:31b';
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
    } else if (PROMPT_INJECTION_PATTERNS.some(pattern => pattern.test(prompt))) {
      issues.push({
        id: `agent-prompt-injection-${cleanId}`,
        severity: 'error',
        section: 'agents',
        itemId: agent.id,
        message: `Agent "${agent.name || cleanId}" system prompt contains prohibited prompt boundary sentinels or override phrases.`,
        suggestedAction: 'Remove boundary sentinels (<<< / >>>) or system override phrases.',
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
      } else {
        const targetWf = playbookMap.get(safeRef);
        if (targetWf?.isOkfPlaybook) {
          issues.push({
            id: `agent-okf-workflow-${cleanId}-${ref}`,
            severity: 'error',
            section: 'agents',
            itemId: agent.id,
            message: `Agent "${agent.name}" references OKF knowledge playbook "${ref}" as an executable workflow. Knowledge playbooks cannot be assigned to agents.`,
            suggestedAction: 'Create an executable workflow under Playbooks or remove this reference.',
          });
        }
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
    } else if (PROMPT_INJECTION_PATTERNS.some(pattern => pattern.test(wf.description))) {
      issues.push({
        id: `workflow-prompt-injection-${cleanWfId}`,
        severity: 'error',
        section: 'workflows',
        itemId: wf.id,
        message: `Workflow "${wf.name || cleanWfId}" contains prohibited prompt boundary sentinels or override phrases.`,
        suggestedAction: 'Remove boundary sentinels (<<< / >>>) or system override phrases.',
      });
    }
  }

  // 4. Connectors & MCP Tools Cross-Validation
  const activeServers = new Map<string, MCPConnector>();
  const connectorToolsMap = new Map<string, { risk: 'read' | 'write' | 'execute'; connector: MCPConnector; name: string }>();

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

    // Determine server names from config or tools
    const serverNames: string[] = [];
    if (conn.config?.mcpServers) {
      for (const [sName, srv] of Object.entries(conn.config.mcpServers)) {
        serverNames.push(sName);
        if (sName.trim().toLowerCase() === 'gev') {
          issues.push({
            id: `connector-reserved-gev-${connectorId}`,
            severity: 'error',
            section: 'connectors',
            itemId: connectorId,
            message: `Connector "${conn.name}" uses reserved server key "gev" (internal Port 3000 profile).`,
            suggestedAction: 'Rename the MCP server key.',
          });
        }
        for (const [envKey, envVal] of Object.entries(srv.env || {})) {
          const placeholderMatch = envVal.match(/^\$\{([A-Z0-9_]+)\}$/);
          if (ENGINE_PRIVATE_ENV_VARS.has(envKey.toUpperCase()) || (placeholderMatch && ENGINE_PRIVATE_ENV_VARS.has(placeholderMatch[1].toUpperCase()))) {
            issues.push({
              id: `connector-reserved-env-${connectorId}-${envKey}`,
              severity: 'error',
              section: 'connectors',
              itemId: connectorId,
              message: `Connector "${conn.name}" references reserved engine secret in env "${envKey}".`,
              suggestedAction: 'Use a connector-specific environment variable placeholder.',
            });
          }
        }
        for (const [hdrKey, hdrVal] of Object.entries(srv.headers || {})) {
          const lowerHdr = hdrKey.trim().toLowerCase();
          if (RESERVED_MCP_HTTP_HEADERS.has(lowerHdr) || lowerHdr.startsWith('mcp-param-')) {
            issues.push({
              id: `connector-reserved-header-${connectorId}-${hdrKey}`,
              severity: 'error',
              section: 'connectors',
              itemId: connectorId,
              message: `Connector "${conn.name}" overrides transport-owned HTTP header "${hdrKey}".`,
              suggestedAction: 'Use Authorization or a custom application header.',
            });
          }
          const placeholderMatch = hdrVal.match(/\$\{([A-Za-z0-9_]+)\}/);
          if (placeholderMatch && ENGINE_PRIVATE_ENV_VARS.has(placeholderMatch[1].toUpperCase())) {
            issues.push({
              id: `connector-reserved-header-secret-${connectorId}-${hdrKey}`,
              severity: 'error',
              section: 'connectors',
              itemId: connectorId,
              message: `Connector "${conn.name}" header "${hdrKey}" references reserved engine secret "\${${placeholderMatch[1]}}".`,
              suggestedAction: 'Use a connector-specific secret placeholder.',
            });
          }
        }
      }
    }
    if (conn.tools) {
      for (const t of conn.tools) {
        const sName = t.id.split(':')[0];
        if (sName && !serverNames.includes(sName)) {
          serverNames.push(sName);
        }
        connectorToolsMap.set(t.id, { risk: t.risk, connector: conn, name: t.name });
      }
    }
    if (serverNames.length === 0) {
      const fallbackName = conn.id.replace(/^mcp-/, '');
      serverNames.push(fallbackName);
    }
    for (const sName of serverNames) {
      activeServers.set(sName, conn);
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

    if (conn.status === 'sample') {
      issues.push({
        id: `connector-sample-${connectorId}`,
        severity: 'info',
        section: 'connectors',
        itemId: connectorId,
        message: `Connector "${conn.name}" is a sample connector simulating mock API responses. Configure production endpoints before live deployment.`,
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

  // Cross-check agent grants
  const serverGrantsCount = new Map<string, number>();
  for (const sName of activeServers.keys()) {
    serverGrantsCount.set(sName, 0);
  }

  for (const agent of agents) {
    const cleanId = tryNormalizeId(agent.id) || agent.id;
    for (const grant of agent.mcpTools || []) {
      if (grant.endsWith(':*') || grant === '*') {
        issues.push({
          id: `agent-mcp-wildcard-${cleanId}-${grant}`,
          severity: 'error',
          section: 'connectors',
          itemId: agent.id,
          message: `Agent "${agent.name}" uses wildcard grant "${grant}". Wildcards (server:*) are prohibited.`,
          suggestedAction: 'Specify explicit tool grants in server:tool format.',
        });
        continue;
      }

      const serverName = grant.includes(':')
        ? grant.split(':')[0]
        : grant.startsWith('mcp__')
        ? grant.replace('mcp__', '').split('__')[0]
        : grant;

      if (!activeServers.has(serverName)) {
        issues.push({
          id: `agent-mcp-dangling-${cleanId}-${grant}`,
          severity: 'error',
          section: 'connectors',
          itemId: agent.id,
          message: `Agent "${agent.name}" declares MCP grant "${grant}", but connector "${serverName}" is not selected in Connectors.`,
          suggestedAction: `Select the ${serverName} connector or remove this tool grant from ${agent.name}.`,
        });
      } else {
        serverGrantsCount.set(serverName, (serverGrantsCount.get(serverName) || 0) + 1);

        const toolDesc = connectorToolsMap.get(grant);
        if (toolDesc) {
          if ((toolDesc.risk === 'write' || toolDesc.risk === 'execute') && !agent.requiresOversight) {
            issues.push({
              id: `agent-mcp-oversight-required-${cleanId}-${grant}`,
              severity: 'error',
              section: 'connectors',
              itemId: agent.id,
              message: `Agent "${agent.name}" has mutating MCP tool grant "${grant}". Human oversight must be enabled.`,
              suggestedAction: 'Enable requires oversight for this agent in Roster.',
            });
          }
        }
      }
    }
  }

  // For each selected connector, check that at least one agent is granted access
  for (const [sName, conn] of activeServers.entries()) {
    if ((serverGrantsCount.get(sName) || 0) === 0) {
      issues.push({
        id: `connector-no-grants-${conn.id}`,
        severity: 'error',
        section: 'connectors',
        itemId: conn.id,
        message: `Selected connector "${conn.name}" has no agent tool grants assigned.`,
        suggestedAction: `Assign tools for "${conn.name}" to at least one specialist in Roster or deselect this connector.`,
      });
    }
  }

  return issues;
}
