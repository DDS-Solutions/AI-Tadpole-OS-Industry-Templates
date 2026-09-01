import { cpSync, mkdirSync, readFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';


const builderRoot = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const repositoryRoot = resolve(builderRoot, '..');
const publicRoot = resolve(builderRoot, 'public');

function parseJson(path, label) {
  try {
    return JSON.parse(readFileSync(path, 'utf8'));
  } catch (error) {
    throw new Error(`${label} is not valid JSON: ${error.message}`);
  }
}

function validateAgentCatalog(path) {
  const catalog = parseJson(path, 'Agent catalog');
  if (!Array.isArray(catalog)) {
    throw new Error('Agent catalog must be a JSON array.');
  }

  const requiredFields = [
    'id',
    'name',
    'description',
    'color',
    'emoji',
    'vibe',
    'prompt',
    'runtimePrompt',
    'department',
    'departmentLabel',
  ];
  const ids = new Set();

  for (const [index, agent] of catalog.entries()) {
    if (!agent || typeof agent !== 'object' || Array.isArray(agent)) {
      throw new Error(`Agent catalog entry ${index} must be an object.`);
    }
    for (const field of requiredFields) {
      if (typeof agent[field] !== 'string' || agent[field].trim() === '') {
        throw new Error(`Agent catalog entry ${index} (${agent.id || 'unknown'}) is missing ${field}.`);
      }
    }
    if (agent.runtimePrompt.length > 800) {
      throw new Error(`Agent catalog entry ${index} (${agent.id}) has runtimePrompt exceeding 800 chars (${agent.runtimePrompt.length}).`);
    }
    if (ids.has(agent.id)) {
      throw new Error(`Agent catalog contains duplicate id: ${agent.id}`);
    }
    ids.add(agent.id);
  }
}

function validateMcpRegistry(path) {
  const registry = parseJson(path, 'MCP registry');
  if (!registry || registry.version !== '2.0.0' || !Array.isArray(registry.connectors)) {
    throw new Error('MCP registry must have version "2.0.0" and a connectors array.');
  }
  for (const connector of registry.connectors) {
    if (!connector.id || !connector.name || !connector.path) {
      throw new Error(`Connector missing required fields: ${JSON.stringify(connector)}`);
    }
    if (!Array.isArray(connector.tools) || connector.tools.length === 0) {
      throw new Error(`Connector ${connector.id} must define a non-empty tools manifest.`);
    }
    for (const tool of connector.tools) {
      if (!tool.id || !tool.name || !['read', 'write', 'execute'].includes(tool.risk)) {
        throw new Error(`Tool descriptor invalid in connector ${connector.id}: ${JSON.stringify(tool)}`);
      }
    }
  }
}

mkdirSync(publicRoot, { recursive: true });
cpSync(resolve(repositoryRoot, 'registry.json'), resolve(publicRoot, 'registry.json'));
cpSync(resolve(repositoryRoot, 'mcp_registry.json'), resolve(publicRoot, 'mcp_registry.json'));
cpSync(
  resolve(repositoryRoot, 'mcp-blueprints'),
  resolve(publicRoot, 'mcp-blueprints'),
  { recursive: true, force: true },
);

parseJson(resolve(publicRoot, 'registry.json'), 'Template registry');
validateMcpRegistry(resolve(publicRoot, 'mcp_registry.json'));
validateAgentCatalog(resolve(publicRoot, 'ai-tadpole-catalog.json'));
