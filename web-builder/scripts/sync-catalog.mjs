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

mkdirSync(publicRoot, { recursive: true });
cpSync(resolve(repositoryRoot, 'registry.json'), resolve(publicRoot, 'registry.json'));
cpSync(resolve(repositoryRoot, 'mcp_registry.json'), resolve(publicRoot, 'mcp_registry.json'));
cpSync(
  resolve(repositoryRoot, 'mcp-blueprints'),
  resolve(publicRoot, 'mcp-blueprints'),
  { recursive: true, force: true },
);

parseJson(resolve(publicRoot, 'registry.json'), 'Template registry');
parseJson(resolve(publicRoot, 'mcp_registry.json'), 'MCP registry');
validateAgentCatalog(resolve(publicRoot, 'ai-tadpole-catalog.json'));
