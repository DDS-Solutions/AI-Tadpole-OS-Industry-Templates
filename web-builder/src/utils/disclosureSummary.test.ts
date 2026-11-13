import { describe, expect, it } from 'vitest';
import type { Agent, MCPConnector } from '../types';
import { buildSwarmDisclosureSummary } from './disclosureSummary';

describe('buildSwarmDisclosureSummary', () => {
  it('computes capabilities, mutating skills, mcpGrants, env vars, oversight agents, and stdio Python skills notice', () => {
    const agents: Agent[] = [
      {
        id: 'reader',
        name: 'Reader',
        role: 'Analyst',
        model: 'gemma4:31b-cloud',
        provider: 'ollama-cloud',
        prompt: 'Analyze records.',
        skills: ['read_file', 'grep_search'],
        mcpTools: ['crm:search'],
        requiresOversight: false,
      },
      {
        id: 'writer',
        name: 'Operator',
        role: 'Operator',
        model: 'gemma4:31b-cloud',
        provider: 'ollama-cloud',
        prompt: 'Apply approved edits.',
        skills: ['read_file', 'write_file', 'execute_shell', 'shell'],
        mcpTools: ['crm:update'],
        requiresOversight: false,
      },
    ];
    const catalog: MCPConnector[] = [
      {
        id: 'mcp-crm',
        name: 'CRM',
        category: 'CRM',
        description: 'CRM server',
        version: '1.0.0',
        path: 'mcp-blueprints/crm',
        status: 'verified',
        required_env: { CRM_API_KEY: { description: 'API key' } },
        tools: [
          { id: 'crm:search', name: 'Search', description: 'Read CRM', risk: 'read' },
          { id: 'crm:update', name: 'Update', description: 'Write CRM', risk: 'write' },
        ],
        config: { mcpServers: { crm: { command: 'python', args: ['server.py'] } } },
      },
    ];

    const summary = buildSwarmDisclosureSummary(agents, ['mcp-crm'], catalog);
    expect(summary.capabilities).toEqual(['execute_shell', 'grep_search', 'read_file', 'shell', 'write_file']);
    expect(summary.mutatingCapabilities).toEqual(['execute_shell', 'shell', 'write_file']);
    expect(summary.mcpGrants).toEqual(['crm:search', 'crm:update']);
    expect(summary.requiredEnvVars).toEqual(['CRM_API_KEY']);
    expect(summary.egressUrls).toEqual([]);
    expect(summary.hasBundledPythonSkills).toBe(true);
    expect(summary.oversightAgents).toEqual(['Operator']);
  });

  it('distinguishes remote streamable HTTP endpoints without bundled Python skills', () => {
    const agents: Agent[] = [
      {
        id: 'analyst',
        name: 'Analyst',
        role: 'Analyst',
        model: 'gemma4:e4b',
        provider: 'ollama',
        prompt: 'Read metrics.',
        skills: ['read_file'],
        mcpTools: ['analytics:query'],
        requiresOversight: false,
      },
    ];
    const catalog: MCPConnector[] = [
      {
        id: 'mcp-analytics',
        name: 'Analytics API',
        category: 'Data',
        description: 'Remote analytics',
        version: '1.0.0',
        path: 'mcp-blueprints/analytics',
        status: 'verified',
        tools: [{ id: 'analytics:query', name: 'Query', description: 'Read metrics', risk: 'read' }],
        config: { mcpServers: { analytics: { url: 'https://analytics.internal/mcp' } } },
      },
    ];

    const summary = buildSwarmDisclosureSummary(agents, ['mcp-analytics'], catalog);
    expect(summary.egressUrls).toEqual(['https://analytics.internal/mcp']);
    expect(summary.hasBundledPythonSkills).toBe(false);
    expect(summary.mutatingCapabilities).toEqual([]);
    expect(summary.oversightAgents).toEqual([]);
  });

  it('normalizes legacy mcp__server__tool grants when computing grants and oversight requirements', () => {
    const agents: Agent[] = [
      {
        id: 'crm-editor',
        name: 'CRM Editor',
        role: 'Coordinator',
        model: 'gemma4:31b',
        provider: 'google',
        prompt: 'Update approved leads.',
        skills: ['read_file'],
        mcpTools: ['mcp__crm__update'],
        requiresOversight: false,
      },
    ];
    const catalog: MCPConnector[] = [
      {
        id: 'mcp-crm',
        name: 'CRM',
        category: 'CRM',
        description: 'CRM server',
        version: '1.0.0',
        path: 'mcp-blueprints/crm',
        status: 'verified',
        tools: [{ id: 'crm:update', name: 'Update', description: 'Write CRM', risk: 'write' }],
        config: { mcpServers: { crm: { url: 'https://crm.internal/mcp' } } },
      },
    ];

    const summary = buildSwarmDisclosureSummary(agents, ['mcp-crm'], catalog);
    expect(summary.mcpGrants).toEqual(['crm:update']);
    expect(summary.oversightAgents).toEqual(['CRM Editor']);
  });
});
