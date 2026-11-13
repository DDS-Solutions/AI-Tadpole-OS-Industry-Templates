import type { Agent, MCPConnector } from '../types';
import { DANGEROUS_SKILL_SET } from '../constants/capabilities';
import { normalizeMcpGrant } from './mcpGrants';

export interface SwarmDisclosureSummary {
  capabilities: string[];
  mutatingCapabilities: string[];
  mcpGrants: string[];
  requiredEnvVars: string[];
  egressUrls: string[];
  hasBundledPythonSkills: boolean;
  oversightAgents: string[];
}

export function buildSwarmDisclosureSummary(
  agents: Agent[],
  selectedConnectors: string[],
  mcpCatalog: MCPConnector[],
): SwarmDisclosureSummary {
  const capSet = new Set<string>();
  const mutatingSet = new Set<string>();
  const grantSet = new Set<string>();
  const envVarSet = new Set<string>();
  const egressSet = new Set<string>();
  const oversightSet = new Set<string>();

  const selectedConnectorObjs = mcpCatalog.filter(c => selectedConnectors.includes(c.id));
  const toolRiskById = new Map<string, 'read' | 'write' | 'execute'>();

  let hasBundledPythonSkills = false;
  for (const conn of selectedConnectorObjs) {
    if (conn.required_env) {
      for (const envName of Object.keys(conn.required_env)) {
        if (envName.trim()) envVarSet.add(envName.trim());
      }
    }
    for (const tool of conn.tools || []) {
      toolRiskById.set(tool.id, tool.risk);
    }
    const servers = conn.config?.mcpServers || {};
    for (const srv of Object.values(servers)) {
      if (srv.url && srv.url.trim()) {
        egressSet.add(srv.url.trim());
      }
      if (srv.command && Array.isArray(srv.args) && srv.args.some(a => a === 'server.py' || a === './server.py' || a.endsWith('-server.py'))) {
        hasBundledPythonSkills = true;
      }
    }
  }

  for (const agent of agents) {
    const skills = agent.skills || ['read_file'];
    let needsOversight = Boolean(agent.requiresOversight);
    for (const s of skills) {
      capSet.add(s);
      if (DANGEROUS_SKILL_SET.has(s)) {
        mutatingSet.add(s);
        needsOversight = true;
      }
    }
    for (const grant of agent.mcpTools || []) {
      const normalizedGrant = normalizeMcpGrant(grant);
      grantSet.add(normalizedGrant);
      const risk = toolRiskById.get(normalizedGrant);
      if (risk === 'write' || risk === 'execute') {
        needsOversight = true;
      }
    }
    if (needsOversight) {
      oversightSet.add(agent.name || agent.id);
    }
  }

  return {
    capabilities: Array.from(capSet).sort(),
    mutatingCapabilities: Array.from(mutatingSet).sort(),
    mcpGrants: Array.from(grantSet).sort(),
    requiredEnvVars: Array.from(envVarSet).sort(),
    egressUrls: Array.from(egressSet).sort(),
    hasBundledPythonSkills,
    oversightAgents: Array.from(oversightSet),
  };
}

