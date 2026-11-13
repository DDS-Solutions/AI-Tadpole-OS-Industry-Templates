import JSZip from 'jszip';
import { isValidMcpGrant, normalizeMcpGrant } from './mcpGrants';
import type { Agent, CompanyInfo, WorkflowItem, MCPConnector, MCPConfig, MCPServerConfig, SwarmDetails } from '../types';

export type SwarmCompanyInfo = Pick<CompanyInfo, 'name' | 'mission' | 'size' | 'industry'> & Partial<CompanyInfo>;
import { safeFileId } from './catalogHelpers';
import { inferProvider, resolveCanonicalIndustry } from './validation';
import { VALID_RUNTIME_CAPABILITIES, DANGEROUS_SKILL_SET as DANGEROUS_SKILLS } from '../constants/capabilities';
import { DEFAULT_MODEL_SLOTS, LEGACY_SKILL_LIST } from '../constants/_generatedContract';

const REGISTRY_RAW_BASE = import.meta.env.VITE_RAW_BASE || 'https://raw.githubusercontent.com/DDS-Solutions/AI-Tadpole-OS-Industry-Templates/main';
const CONNECTOR_ASSET_BASE = '.';

interface SwarmAgentReference {
  id: string;
  path: string;
  role?: string;
  supervisor?: string | null;
  priority?: 'critical' | 'high' | 'normal' | 'low';
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
  id?: string;
  name?: string;
  description?: string;
  industry?: string;
  company_size?: number;
  maturity?: 'starter' | 'verified';
  content_sha256?: string;
  roster?: SwarmAgentReference[];
  global_workflows?: string[];
  connector_ids?: string[];
  required_mcps?: string;
}

const safeRepoPath = (value: string): string => {
  const normalized = value.replace(/\\/g, '/').replace(/^\/+|\/+$/g, '');
  const parts = normalized.split('/');
  if (!normalized || parts.some(part => !part || part === '.' || part === '..') || /^[a-z]+:/i.test(normalized)) {
    throw new Error(`Unsafe repository path "${value}".`);
  }
  return parts.join('/');
};

const LEGACY_SKILLS = new Set<string>(LEGACY_SKILL_LIST);

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
    if (!server || typeof server !== 'object') {
      throw new Error(`MCP server "${serverName}" is invalid.`);
    }
    if (!server.command && !server.url) {
      throw new Error(`MCP server "${serverName}" must specify either "command" or "url".`);
    }
    if (server.command) {
      if (!Array.isArray(server.args)) {
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
    } else {
      rewritten[serverName] = { ...server };
    }
  }

  if (needsServerSource) {
    const source = await (
      await responseOrThrow(`${CONNECTOR_ASSET_BASE}/${connectorPath}/server.py`, `${connector.name} server source`)
    ).text();
    if (connector.integrity_hash && connector.integrity_hash.trim() !== '') {
      const actualHex = await sha256Hex(new TextEncoder().encode(source));
      const actualDigest = `sha256:${actualHex}`;
      if (actualDigest !== connector.integrity_hash.toLowerCase()) {
        throw new Error(
          `Integrity verification failed for connector "${connector.name}": expected ${connector.integrity_hash}, got ${actualDigest}.`,
        );
      }
    }
    zip.file(archiveServerPath, source);
  }
  return { mcpServers: rewritten };
};

export function normalizeCanonicalBytes(input: Uint8Array | string): Uint8Array {
  if (typeof input === 'string') {
    return new TextEncoder().encode(input.replace(/\r\r\n/g, '\n').replace(/\r\n/g, '\n'));
  }
  const out: number[] = [];
  for (let i = 0; i < input.length; i += 1) {
    if (input[i] === 13 && input[i + 1] === 13 && input[i + 2] === 10) {
      out.push(10);
      i += 2;
    } else if (input[i] === 13 && input[i + 1] === 10) {
      out.push(10);
      i += 1;
    } else {
      out.push(input[i]);
    }
  }
  return new Uint8Array(out);
}

function stableJsonSort(value: unknown): unknown {
  if (Array.isArray(value)) {
    return value.map(stableJsonSort);
  }
  if (value !== null && typeof value === 'object') {
    const record = value as Record<string, unknown>;
    const sorted: Record<string, unknown> = {};
    for (const key of Object.keys(record).sort()) {
      sorted[key] = stableJsonSort(record[key]);
    }
    return sorted;
  }
  return value;
}

export async function sha256Hex(bytes: Uint8Array): Promise<string> {
  const copy = new Uint8Array(bytes.byteLength);
  copy.set(bytes);
  const hashBuffer = await crypto.subtle.digest('SHA-256', copy.buffer);
  return Array.from(new Uint8Array(hashBuffer))
    .map(b => b.toString(16).padStart(2, '0'))
    .join('');
}

async function canonicalFileBytes(relPath: string, rawBytes: Uint8Array): Promise<Uint8Array> {
  const normalized = normalizeCanonicalBytes(rawBytes);
  if (relPath === 'swarm.json') {
    try {
      const parsed = JSON.parse(new TextDecoder().decode(normalized));
      if (parsed && typeof parsed === 'object' && !Array.isArray(parsed)) {
        const canonicalObj = { ...(parsed as Record<string, unknown>) };
        delete canonicalObj.content_sha256;
        return new TextEncoder().encode(JSON.stringify(stableJsonSort(canonicalObj)));
      }
    } catch {
      // Fall through to raw normalized bytes
    }
  }
  return normalized;
}

export async function computeTemplateDigestFromMap(files: Record<string, Uint8Array | string>): Promise<string> {
  const relPaths = Object.keys(files).sort();
  const lines: string[] = [];
  for (const rel of relPaths) {
    const raw = files[rel];
    const rawBytes = typeof raw === 'string' ? new TextEncoder().encode(raw) : raw;
    const canonical = await canonicalFileBytes(rel, rawBytes);
    const hex = await sha256Hex(canonical);
    lines.push(`${rel}\0${hex}`);
  }
  const payload = new TextEncoder().encode(lines.join('\n'));
  return `sha256:${await sha256Hex(payload)}`;
}

export const buildSwarmZip = async (
  companyInfo: SwarmCompanyInfo,
  agents: Agent[],
  workflows: WorkflowItem[],
  selectedConnectors: string[],
  mcpCatalog: MCPConnector[],
): Promise<JSZip> => {
  if (!companyInfo.name || !companyInfo.name.trim()) {
    throw new Error('Archive validation failed: company or swarm name is required.');
  }
  if (!companyInfo.industry || !companyInfo.industry.trim()) {
    throw new Error('Archive validation failed: industry sector is required.');
  }
  if (!companyInfo.mission || !companyInfo.mission.trim()) {
    throw new Error('Archive validation failed: swarm mission is required.');
  }
  if (agents.length === 0) {
    throw new Error('Archive validation failed: at least one specialist agent is required.');
  }

  const zip = new JSZip();
  const agentIds = new Set<string>();
  const workflowIds = new Set<string>();

  for (const agent of agents) {
    const id = safeFileId(agent.id);
    if (id.length > 64) {
      throw new Error(`Agent ID "${id}" exceeds maximum length of 64 characters.`);
    }
    if (agentIds.has(id)) {
      throw new Error(`Agent IDs collide: "${id}".`);
    }
    agentIds.add(id);
  }

  const standardWorkflows = workflows.filter(workflow => !workflow.isOkfPlaybook);
  const okfPlaybooks = workflows.filter(workflow => workflow.isOkfPlaybook);
  const okfIds = new Set(okfPlaybooks.map(wf => safeFileId(wf.id)));

  for (const workflow of standardWorkflows) {
    const workflowId = safeFileId(workflow.id);
    if (workflowIds.has(workflowId)) {
      throw new Error(`Workflow IDs collide: "${workflowId}".`);
    }
    workflowIds.add(workflowId);
  }

  const parsedSize = Number.parseInt(companyInfo.size, 10);
  const companySize = Number.isFinite(parsedSize) && parsedSize > 0 ? parsedSize : 25;
  const canonicalIndustry = resolveCanonicalIndustry(companyInfo.industry) || companyInfo.industry.trim();

  const normalizedAgentIds = agents.map(a => safeFileId(a.id));
  const explicitNullRootIdx = agents.findIndex(a => a.supervisor === null);
  const criticalUnassignedRootIdx = agents.findIndex(a => a.supervisor === undefined && a.priority === 'critical');
  const firstUnassignedIdx = agents.findIndex(a => a.supervisor === undefined);
  const rootIdx = explicitNullRootIdx >= 0
    ? explicitNullRootIdx
    : criticalUnassignedRootIdx >= 0
    ? criticalUnassignedRootIdx
    : firstUnassignedIdx >= 0
    ? firstUnassignedIdx
    : 0;
  const defaultRootId = normalizedAgentIds[rootIdx];
  const roster = agents.map((agent, index) => {
    const id = normalizedAgentIds[index];
    const hasExplicitSupervisor = agent.supervisor !== undefined;
    const supervisor = hasExplicitSupervisor
      ? (typeof agent.supervisor === 'string' && agent.supervisor.trim() ? safeFileId(agent.supervisor) : null)
      : (id === defaultRootId ? null : defaultRootId);
    const priority = agent.priority || (supervisor === null ? 'critical' : 'normal');
    return {
      id,
      path: `agents/${id}.json`,
      supervisor,
      priority,
    };
  });

  const isFlatPeerSwarm = roster.length > 1 && roster.every(r => r.supervisor === null);
  const swarmJson: Record<string, unknown> = {
    $schema: 'https://tadpoleos.dev/schemas/swarm-v1.json',
    id: safeFileId(companyInfo.name),
    name: `${companyInfo.name} Swarm`,
    version: '1.0.0',
    author: companyInfo.name.trim(),
    description: companyInfo.mission.trim(),
    industry: canonicalIndustry,
    maturity: 'starter',
    tags: companyInfo.goals || [],
    company_size: companySize,
    ...(isFlatPeerSwarm ? { flat_peer_swarm: true } : {}),
    defaults: {
      provider: DEFAULT_MODEL_SLOTS.primary.provider,
      model: DEFAULT_MODEL_SLOTS.primary.model_id,
      temperature: DEFAULT_MODEL_SLOTS.primary.temperature,
      model_config: { ...DEFAULT_MODEL_SLOTS.primary },
      model_config2: { ...DEFAULT_MODEL_SLOTS.planning },
      model_config3: { ...DEFAULT_MODEL_SLOTS.execution },
    },
    roster,
    global_workflows: standardWorkflows.map(workflow => `workflows/${safeFileId(workflow.id)}.md`),
    required_mcps: 'mcps.json',
  };

  if (selectedConnectors.length > 0) {
    swarmJson.connector_ids = selectedConnectors.map(safeFileId);
  }

  // Build tool risk catalog lookup
  const toolRiskMap = new Map<string, string>();
  for (const connector of mcpCatalog) {
    for (const tool of connector.tools || []) {
      toolRiskMap.set(tool.id, tool.risk);
    }
  }

  const agentsFolder = zip.folder('agents');
  for (const agent of agents) {
    const id = safeFileId(agent.id);
    const modelId = agent.model || DEFAULT_MODEL_SLOTS.primary.model_id;
    const agentWorkflows = (agent.workflows || []).map(safeFileId);

    // Reject OKF playbooks referenced as agent workflows
    const okfRef = agentWorkflows.find(wfId => okfIds.has(wfId));
    if (okfRef) {
      throw new Error(`Agent "${agent.name}" references OKF playbook "${okfRef}" as an executable workflow.`);
    }

    const missingWorkflow = agentWorkflows.find(workflowId => !workflowIds.has(workflowId));
    if (missingWorkflow) {
      throw new Error(`${agent.name} references missing workflow "${missingWorkflow}".`);
    }
    const skills = validatedSkills(agent.skills);

    // Validate and canonicalize MCP tool grants
    const canonicalGrants: string[] = [];
    for (const rawGrant of agent.mcpTools || []) {
      const grant = rawGrant.trim();
      if (!grant) continue;
      if (grant.endsWith(':*') || grant === '*') {
        throw new Error(`Agent "${agent.name}" contains wildcard MCP grant "${grant}". Wildcards are prohibited.`);
      }
      if (!isValidMcpGrant(grant)) {
        throw new Error(`Agent "${agent.name}" contains invalid MCP grant "${grant}". Expected server:tool or mcp__server__tool format.`);
      }
      canonicalGrants.push(normalizeMcpGrant(grant));
    }

    const hasMutatingToolGrant = canonicalGrants.some(grant => {
      const risk = toolRiskMap.get(grant);
      return risk === 'write' || risk === 'execute';
    });

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
        temperature: DEFAULT_MODEL_SLOTS.primary.temperature,
        max_turns: DEFAULT_MODEL_SLOTS.primary.max_turns,
      },
      model_config2: { ...DEFAULT_MODEL_SLOTS.planning },
      model_config3: { ...DEFAULT_MODEL_SLOTS.execution },
      skills,
      workflows: agentWorkflows,
      mcp_tools: Array.from(new Set(canonicalGrants)),
      requires_oversight: Boolean(
        agent.requiresOversight
        || skills.some(skill => DANGEROUS_SKILLS.has(skill))
        || hasMutatingToolGrant
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
  const lockedConnectors: Array<Record<string, unknown>> = [];

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
    lockedConnectors.push({
      id: connector.id,
      name: connector.name,
      version: connector.version || '1.0.0',
      integrity_hash: connector.integrity_hash || null,
      dependency_provenance: connector.dependency_provenance || [],
    });
  }
  zip.file('mcps.json', JSON.stringify(mergedMcpConfig, null, 2));

  // Emit connector-lock.json with verified provenance
  if (selectedConnectors.length > 0) {
    const connectorLock = {
      version: '1.0.0',
      generated_at: new Date().toISOString(),
      connectors: lockedConnectors,
    };
    zip.file('connector-lock.json', JSON.stringify(connectorLock, null, 2));
  }

  if (okfPlaybooks.length > 0) {
    const knowledgeJson = okfPlaybooks.map(workflow => {
      const parsedTags = workflow.tags
        ? workflow.tags.split(',').map(t => t.trim()).filter(Boolean)
        : [];
      const fallbackTag = companyInfo.industry.trim().toLowerCase() || 'general';
      return {
        title: workflow.name,
        description: workflow.description.slice(0, 200),
        topic: workflow.topic?.trim() || companyInfo.industry.toLowerCase() || 'general',
        concept_type: workflow.conceptType || 'playbook',
        resource_uri: workflow.resourceUri || undefined,
        tags: parsedTags.length > 0 ? parsedTags : [fallbackTag],
        text: workflow.description,
      };
    });
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

  zip.file('swarm.json', JSON.stringify(swarmJson, null, 2));
  const contentSha256 = await computeArchiveDigest(zip);
  swarmJson.content_sha256 = contentSha256;
  zip.file('swarm.json', JSON.stringify(swarmJson, null, 2));

  return zip;
};

export async function computeArchiveDigest(zip: JSZip): Promise<string> {
  const files = Object.keys(zip.files).filter(name => !zip.files[name].dir);
  const fileMap: Record<string, Uint8Array> = {};
  for (const name of files) {
    fileMap[name] = await zip.file(name)!.async('uint8array');
  }
  return computeTemplateDigestFromMap(fileMap);
}

export const exportSwarmZip = async (
  companyInfo: SwarmCompanyInfo,
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
  mcpCatalog: MCPConnector[] = [],
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
    const modelId = details.model_config?.model_id || details.model_id || details.model || DEFAULT_MODEL_SLOTS.primary.model_id;
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
      ...(reference.supervisor !== undefined ? { supervisor: reference.supervisor } : {}),
      ...(reference.priority ? { priority: reference.priority } : {}),
    } satisfies Agent;
  }));

  const workflows: WorkflowItem[] = await Promise.all(Array.from(workflowReferences).map(async workflowPath => {
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

  // Fetch mcps.json if present
  let mcpConfig: MCPConfig | undefined;
  let selectedConnectors: string[] = swarmData.connector_ids || [];
  try {
    const mcpRes = await fetch(`${rawBase}/mcps.json`, { signal });
    if (mcpRes.ok) {
      mcpConfig = await mcpRes.json() as MCPConfig;
      if (mcpConfig?.mcpServers && selectedConnectors.length === 0) {
        selectedConnectors = Object.keys(mcpConfig.mcpServers).map(serverName => {
          const matched = mcpCatalog.find(
            c => (c.config?.mcpServers && serverName in c.config.mcpServers) ||
                 c.id === `mcp-${serverName}` ||
                 c.id === serverName ||
                 c.path?.includes(serverName)
          );
          return matched ? matched.id : `mcp-${serverName}`;
        });
      }
    }
  } catch {
    // Non-fatal if no mcps.json
  }

  // Fetch knowledge.json if present
  let knowledge: unknown[] = [];
  try {
    const knowledgeRes = await fetch(`${rawBase}/knowledge.json`, { signal });
    if (knowledgeRes.ok) {
      const parsed = await knowledgeRes.json() as Array<Record<string, unknown>>;
      if (Array.isArray(parsed)) {
        knowledge = parsed;
        for (const item of parsed) {
          if (typeof item.title === 'string' && item.title) {
            const importedTags = Array.isArray(item.tags)
              ? item.tags.filter((t): t is string => typeof t === 'string' && t.trim().length > 0).map(t => t.trim()).join(', ')
              : typeof item.tags === 'string'
              ? item.tags
              : undefined;
            workflows.push({
              id: safeFileId(item.title),
              name: item.title,
              description: typeof item.text === 'string' ? item.text : (typeof item.description === 'string' ? item.description : ''),
              isOkfPlaybook: true,
              resourceUri: typeof item.resource_uri === 'string' ? item.resource_uri : undefined,
              topic: typeof item.topic === 'string' ? item.topic : undefined,
              conceptType: typeof item.concept_type === 'string' ? item.concept_type : undefined,
              tags: importedTags || undefined,
            });
          }
        }
      }
    }
  } catch {
    // Non-fatal if no knowledge.json
  }

  return {
    roster,
    workflows,
    selectedConnectors,
    connectorIds: selectedConnectors,
    mcpConfig,
    knowledge,
  };
};
