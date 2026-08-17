import { cpSync, mkdirSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';


const builderRoot = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const repositoryRoot = resolve(builderRoot, '..');
const publicRoot = resolve(builderRoot, 'public');

mkdirSync(publicRoot, { recursive: true });
cpSync(resolve(repositoryRoot, 'registry.json'), resolve(publicRoot, 'registry.json'));
cpSync(resolve(repositoryRoot, 'mcp_registry.json'), resolve(publicRoot, 'mcp_registry.json'));
cpSync(
  resolve(repositoryRoot, 'mcp-blueprints'),
  resolve(publicRoot, 'mcp-blueprints'),
  { recursive: true, force: true },
);
