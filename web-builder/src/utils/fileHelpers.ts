import JSZip from 'jszip';
import type { Agent, WorkflowItem, MCPConnector, MCPConfig, MCPServerConfig, SwarmDetails } from '../types';
import { safeFileId } from './catalogHelpers';
import { inferProvider } from './validation';
import { VALID_RUNTIME_CAPABILITIES, DANGEROUS_SKILL_SET as DANGEROUS_SKILLS } from '../constants/capabilities';

const REGISTRY_RAW_BASE = 'https://raw.githubusercontent.com/DDS-Solutions/AI-TadPole-OS-Industry-Templates/main';
const CONNECTOR_ASSET_BASE = '.';

interface CompanyInfo {
  name: string;
  mission: string;
  size: string;
  industry: string;
}

interface SwarmAgentReference {
  id: string;
  path: string;
  role?: string;
}

interface AgentPayload {
  id?: string;
  name?: string;
  role?: string;
  department?: string;
  description?: string;
  status?: string;
  model?: string;
  model_id?: string;
  system_prompt?: string;
  skills?: string[];
  workflows?: string[];
  mcp_tools?: string[];
  requires_oversight?: boolean;
  model_config?: {
    provider?: string;
    model_id?: string;
    system_prompt?: string;
  };
  emoji?: string;
  color?: string;
  vibe?: string;
}

interface SwarmPayload {
  roster?: SwarmAgentReference[];
  global_workflows?: string[];
}

const safeRepoPath = (value: string): string => {
  const normalized = value.replace(/\\/g, '/').replace(/^\/+|\/+$/g, '');
  const parts = normalized.split('/');
  if (!normalized || parts.some(part => !part || part === '.' || part === '..') || /^[a-z]+:/i.test(normalized)) {
    throw new Error(`Unsafe repository path "${value}".`);
  }
  return parts.join('/');
};

const LEGACY_SKILLS = new Set(['run_command', 'write_to_file']);

const validatedSkills = (skills: string[] | undefined): string[] => {
  const normalized = Array.from(new Set((skills || ['read_file']).map(skill => skill.trim()).filter(Boolean)));
  const legacy = normalized.find(skill => LEGACY_SKILLS.has(skill));
  if (legacy) throw new Error(`Replace legacy capability "${legacy}" with a AI-Tadpole-OS runtime tool ID.`);
  for (const skill of normalized) {
    if (!VALID_RUNTIME_CAPABILITIES.has(skill)) {
      throw new Error(`Unrecognized capability "${skill}". Use recognized tool IDs.`);
    }
  }
  if (normalized.includes('execute_shell') && !normalized.some(skill => skill === 'shell' || skill === 'terminal')) {
    throw new Error('execute_shell requires the shell or terminal capability marker.');
  }
  return normalized;
};

const workflowMarkdown = (workflow: WorkflowItem): string => {
  const body = workflow.description.trim();
  const executableBody = /^#{2,3}\s+\S/m.test(body)
    ? body
    : `## Step 1: Execution\n\n${body || 'Execute this workflow according to the swarm mission.'}`;
  return `# Workflow: ${workflow.name}\n\n${executableBody}\n`;
};

const responseOrThrow = async (url: string, label: string): Promise<Response> => {
  const response = await fetch(url);
  if (!response.ok) throw new Error(`Failed to fetch ${label} (${response.status}).`);
  return response;
};

const loadConnectorAssets = async (
  zip: JSZip,
  connector: MCPConnector,
): Promise<MCPConfig> => {
  const connectorPath = safeRepoPath(connector.path);
  const config = connector.config || await (
    await responseOrThrow(`${CONNECTOR_ASSET_BASE}/${connectorPath}/mcps.json`, `${connector.name} MCP configuration`)
  ).json() as MCPConfig;
  if (!config || typeof config !== 'object' || !config.mcpServers || typeof config.mcpServers !== 'object') {
    throw new Error(`${connector.name} does not provide a valid mcpServers configuration.`);
  }

  const connectorId = safeFileId(connector.id);
  const installedServerPath = `execution/${connectorId}-server.py`;
  const archiveServerPath = `skills/${connectorId}-server.py`;
  const rewritten: Record<string, MCPServerConfig> = {};
  let needsServerSource = false;

  for (const [serverName, server] of Object.entries(config.mcpServers)) {
    if (!server || typeof server !== 'object' || !Array.isArray(server.args)) {
      throw new Error(`MCP server "${serverName}" is missing a valid arguments array.`);
    }
    const args = server.args.map(arg => {
      if (arg === 'server.py' || arg === './server.py') {
        needsServerSource = true;
        return installedServerPath;
      }
      return arg;
    });
    rewritten[serverName] = { ...server, args };
  }

  if (needsServerSource) {
    const source = await (
      await responseOrThrow(`${CONNECTOR_ASSET_BASE}/${connectorPath}/server.py`, `${connector.name} server source`)
    ).text();
    zip.file(archiveServerPath, source);
  }
  return { mcpServers: rewritten };
};

export const buildSwarmZip = async (
  companyInfo: CompanyInfo,
  agents: Agent[],
  workflows: WorkflowItem[],
  selectedConnectors: string[],
  mcpCatalog: MCPConnector[],
): Promise<JSZip> => {
  const zip = new JSZip();
  const agentIds = new Set<string>();
  const workflowIds = new Set<string>();

  for (const agent of agents) {
    const id = safeFileId(agent.id);
    if (agentIds.has(id)) {
      throw new Error(`Agent IDs collide: "${id}".`);
    }
    agentIds.add(id);
  }

  const standardWorkflows = workflows.filter(workflow => !workflow.isOkfPlaybook);
  const okfPlaybooks = workflows.filter(workflow => workflow.isOkfPlaybook);

  for (const workflow of standardWorkflows) {
    const workflowId = safeFileId(workflow.id);
    if (workflowIds.has(workflowId)) {
      throw new Error(`Workflow IDs collide: "${workflowId}".`);
    }
    workflowIds.add(workflowId);
  }

  const parsedSize = Number.parseInt(companyInfo.size, 10);
  const roster = agents.map(agent => ({
    id: safeFileId(agent.id),
    path: `agents/${safeFileId(agent.id)}.json`,
    role: agent.role.trim() || 'Specialist',
  }));

  const swarmJson = {
    name: `${companyInfo.name} Swarm`,
    version: '1.0.0',
    description: companyInfo.mission,
    industry: companyInfo.industry.toLowerCase(),
    company_size: Number.isFinite(parsedSize) ? parsedSize : 25,
    defaults: { model: 'gemini-pro-latest' },
    roster,
    required_mcps: 'mcps.json',
    global_workflows: standardWorkflows.map(workflow => `workflows/${safeFileId(workflow.id)}.md`),
  };
  zip.file('swarm.json', JSON.stringify(swarmJson, null, 2));

  const agentsFolder = zip.folder('agents');
  for (const agent of agents) {
    const id = safeFileId(agent.id);
    const modelId = agent.model || 'gemini-pro-latest';
    const agentWorkflows = (agent.workflows || []).map(safeFileId);
    const missingWorkflow = agentWorkflows.find(workflowId => !workflowIds.has(workflowId));
    if (missingWorkflow) {
      throw new Error(`${agent.name} references missing workflow "${missingWorkflow}".`);
    }
    const skills = validatedSkills(agent.skills);
    const payload = {
      id,
      name: agent.name.trim(),
      role: agent.role.trim(),
      department: (agent.department || 'Operations').trim(),
      description: (agent.description || `${agent.role} agent`).trim(),
      status: 'idle',
      model_config: {
        provider: agent.provider || inferProvider(modelId),
        model_id: modelId,
        system_prompt: agent.prompt.trim(),
      },
      skills,
      workflows: agentWorkflows,
      mcp_tools: Array.from(new Set((agent.mcpTools || []).map(tool => tool.trim()).filter(Boolean))),
      requires_oversight: Boolean(
        agent.requiresOversight
        || skills.some(skill => DANGEROUS_SKILLS.has(skill))
      ),
    };
    if (!payload.name || !payload.role || !payload.department || !payload.description || !payload.model_config.system_prompt) {
      throw new Error(`${agent.name || agent.id} is missing required agent metadata.`);
    }
    if (payload.model_config.system_prompt.length > 800) {
      throw new Error(`${agent.name} has a system prompt longer than 800 characters.`);
    }
    agentsFolder?.file(`${id}.json`, JSON.stringify(payload, null, 2));
  }

  const workflowsFolder = zip.folder('workflows');
  for (const workflow of standardWorkflows) {
    workflowsFolder?.file(`${safeFileId(workflow.id)}.md`, workflowMarkdown(workflow));
  }

  const mergedMcpConfig: MCPConfig = { mcpServers: {} };
  for (const connectorId of selectedConnectors) {
    const connector = mcpCatalog.find(candidate => candidate.id === connectorId);
    if (!connector) throw new Error(`Selected connector "${connectorId}" is not in the catalog.`);
    const connectorConfig = await loadConnectorAssets(zip, connector);
    for (const [serverName, server] of Object.entries(connectorConfig.mcpServers)) {
      if (mergedMcpConfig.mcpServers[serverName]) {
        throw new Error(`MCP server name collision: "${serverName}".`);
      }
      mergedMcpConfig.mcpServers[serverName] = server;
    }
  }
  zip.file('mcps.json', JSON.stringify(mergedMcpConfig, null, 2));

  if (okfPlaybooks.length > 0) {
    const knowledgeJson = okfPlaybooks.map(workflow => ({
      title: workflow.name,
      description: workflow.description.slice(0, 200),
      topic: workflow.topic?.trim() || companyInfo.industry.toLowerCase() || 'general',
      concept_type: workflow.conceptType || 'playbook',
      resource_uri: workflow.resourceUri || undefined,
      tags: workflow.tags || companyInfo.industry.toLowerCase() || 'general',
      text: workflow.description,
    }));
    zip.file('knowledge.json', JSON.stringify(knowledgeJson, null, 2));

    const knowledgeFolder = zip.folder('knowledge');
    const usedNames = new Set<string>();
    for (const workflow of okfPlaybooks) {
      const baseName = safeFileId(workflow.id || workflow.name).replace(/-/g, '_');
      let cleanName = baseName;
      let suffix = 2;
      while (usedNames.has(cleanName)) cleanName = `${baseName}_${suffix++}`;
      usedNames.add(cleanName);
      const frontmatter = [
        '---',
        `title: "${workflow.name.replace(/"/g, '\\"')}"`,
        workflow.resourceUri ? `url: "${workflow.resourceUri.replace(/"/g, '\\"')}"` : null,
        workflow.tags ? `tags: "${workflow.tags.replace(/"/g, '\\"')}"` : null,
        `description: "${workflow.description.slice(0, 150).replace(/\n/g, ' ').replace(/"/g, '\\"')}"`,
        '---',
        '',
        `# ${workflow.name}`,
        '',
        workflow.description,
        '',
      ].filter(value => value !== null).join('\n');
      knowledgeFolder?.file(`${cleanName}.md`, frontmatter);
    }
  }
  return zip;
};

export const exportSwarmZip = async (
  companyInfo: CompanyInfo,
  agents: Agent[],
  workflows: WorkflowItem[],
  selectedConnectors: string[],
  mcpCatalog: MCPConnector[],
): Promise<void> => {
  const zip = await buildSwarmZip(companyInfo, agents, workflows, selectedConnectors, mcpCatalog);
  const content = await zip.generateAsync({ type: 'blob' });
  const url = window.URL.createObjectURL(content);
  const link = document.createElement('a');
  link.href = url;
  link.download = `${safeFileId(companyInfo.name)}-swarm.zip`;
  link.click();
  window.URL.revokeObjectURL(url);
};

const workflowPathForId = (workflowId: string): string => {
  const fileName = workflowId.endsWith('.md') ? workflowId : `${workflowId}.md`;
  return fileName.includes('/') ? fileName : `workflows/${fileName}`;
};

export const fetchSwarmDetailsFromRepo = async (
  templatePath: string,
  signal?: AbortSignal,
): Promise<SwarmDetails> => {
  const rawBase = `${REGISTRY_RAW_BASE}/${safeRepoPath(templatePath)}`;
  const response = await fetch(`${rawBase}/swarm.json`, { signal });
  if (!response.ok) throw new Error('Failed to fetch swarm.json');
  const swarmData = await response.json() as SwarmPayload;

  const workflowReferences = new Set<string>(swarmData.global_workflows || []);
  const roster = await Promise.all((swarmData.roster || []).map(async reference => {
    const agentRes = await fetch(`${rawBase}/${safeRepoPath(reference.path)}`, { signal });
    if (!agentRes.ok) throw new Error(`Failed to fetch agent ${reference.id}`);
    const details = await agentRes.json() as AgentPayload;
    for (const workflowId of details.workflows || []) workflowReferences.add(workflowPathForId(workflowId));
    const modelId = details.model_config?.model_id || details.model_id || details.model || 'gemini-pro-latest';
    return {
      id: details.id || reference.id,
      name: details.name || reference.id,
      role: details.role || reference.role || '',
      department: details.department || 'Operations',
      description: details.description || `${details.role || reference.role || 'Specialist'} agent`,
      status: details.status || 'idle',
      provider: details.model_config?.provider || inferProvider(modelId),
      model: modelId,
      prompt: details.model_config?.system_prompt || details.system_prompt || '',
      skills: details.skills || [],
      workflows: details.workflows || [],
      mcpTools: details.mcp_tools || [],
      requiresOversight: details.requires_oversight || false,
      emoji: details.emoji || '🤖',
      color: details.color || '#3B82F6',
      vibe: details.vibe || '',
    } satisfies Agent;
  }));

  const workflows = await Promise.all(Array.from(workflowReferences).map(async workflowPath => {
    const safeWorkflowPath = safeRepoPath(workflowPath);
    const workflowRes = await fetch(`${rawBase}/${safeWorkflowPath}`, { signal });
    if (!workflowRes.ok) throw new Error(`Failed to fetch workflow ${workflowPath}`);
    const markdown = await workflowRes.text();
    const nameMatch = markdown.match(/^#\s*Workflow:\s*(.*)$/m) || markdown.match(/^#\s*(.*)$/m);
    const fileName = safeWorkflowPath.split('/').pop() || 'workflow.md';
    return {
      id: fileName.replace(/\.md$/i, ''),
      name: nameMatch ? nameMatch[1].trim() : fileName.replace(/\.md$/i, ''),
      description: markdown.replace(/^#.*(?:\r?\n)?/m, '').trim(),
      isOkfPlaybook: false,
    } satisfies WorkflowItem;
  }));
  return { roster, workflows };
};
