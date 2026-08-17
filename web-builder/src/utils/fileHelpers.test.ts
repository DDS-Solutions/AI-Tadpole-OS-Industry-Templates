import { afterEach, describe, expect, it, vi } from 'vitest';
import type { Agent, MCPConnector, WorkflowItem } from '../types';
import { buildSwarmZip, fetchSwarmDetailsFromRepo } from './fileHelpers';


const company = {
  name: 'Contract Lab',
  mission: 'Verify archive compatibility.',
  size: '25',
  industry: 'Legal',
};

const agent: Agent = {
  id: 'review-agent',
  name: 'Review Agent',
  role: 'Reviewer',
  department: 'Quality',
  description: 'Reviews contract fixtures.',
  status: 'idle',
  provider: 'google',
  model: 'gemini-pro-latest',
  prompt: 'Review carefully and report evidence.',
  skills: ['read_file'],
  workflows: ['review'],
  mcpTools: ['crm:get_contact'],
  requiresOversight: false,
};

const workflow: WorkflowItem = {
  id: 'review',
  name: 'Review',
  description: '## Inspect\n\nInspect the input.\n\n## Report\n\nReport findings.',
};

afterEach(() => {
  vi.unstubAllGlobals();
});

describe('Swarm Architect archive contract', () => {
  it('emits consumer-compatible agents, workflows, and root MCP config', async () => {
    const zip = await buildSwarmZip(company, [agent], [workflow], [], []);
    const payload = JSON.parse(await zip.file('agents/review-agent.json')!.async('string'));
    const swarm = JSON.parse(await zip.file('swarm.json')!.async('string'));
    const mcp = JSON.parse(await zip.file('mcps.json')!.async('string'));

    expect(payload).toMatchObject({
      id: 'review-agent',
      department: 'Quality',
      description: 'Reviews contract fixtures.',
      status: 'idle',
      model_config: {
        provider: 'google',
        model_id: 'gemini-pro-latest',
      },
      workflows: ['review'],
      mcp_tools: ['crm:get_contact'],
      requires_oversight: false,
    });
    expect(swarm.required_mcps).toBe('mcps.json');
    expect(swarm.global_workflows).toEqual(['workflows/review.md']);
    expect(mcp).toEqual({ mcpServers: {} });
    expect(await zip.file('workflows/review.md')!.async('string')).toContain('## Inspect');
  });

  it('rejects unsafe repository paths and normalized archive collisions', async () => {
    await expect(fetchSwarmDetailsFromRepo('../private')).rejects.toThrow('Unsafe repository path');
    await expect(buildSwarmZip(
      company,
      [agent, { ...agent, id: 'review agent' }],
      [workflow],
      [],
      [],
    )).rejects.toThrow('Agent IDs collide');
  });

  it('stores actual OKF text in JSON and Markdown assets', async () => {
    const playbook: WorkflowItem = {
      id: 'incident-response',
      name: 'Incident Response',
      description: 'Contain the incident, preserve evidence, and notify the owner.',
      isOkfPlaybook: true,
      topic: 'security',
    };
    const zip = await buildSwarmZip(company, [{ ...agent, workflows: [] }], [playbook], [], []);
    const knowledge = JSON.parse(await zip.file('knowledge.json')!.async('string'));
    const markdown = await zip.file('knowledge/incident_response.md')!.async('string');
    expect(knowledge[0]).toMatchObject({ topic: 'security', text: playbook.description });
    expect(markdown).toContain(playbook.description);
    expect(markdown).not.toContain('/workflows/incident-response.md');
  });

  it('bundles selected connector config and relative server source', async () => {
    const fetchMock = vi.fn(async (url: string) => {
      if (url.endsWith('/server.py')) return new Response('print("ready")', { status: 200 });
      return new Response('', { status: 404 });
    });
    vi.stubGlobal('fetch', fetchMock);
    const connector: MCPConnector = {
      id: 'custom-crm',
      name: 'Custom CRM',
      description: 'CRM bridge',
      category: 'CRM',
      path: 'mcp-blueprints/custom-crm',
      version: '1.0.0',
      config: {
        mcpServers: {
          crm: { command: 'python', args: ['server.py'], env: {} },
        },
      },
    };
    const zip = await buildSwarmZip(company, [agent], [workflow], [connector.id], [connector]);
    const mcp = JSON.parse(await zip.file('mcps.json')!.async('string'));
    expect(mcp.mcpServers.crm.args).toEqual(['execution/custom-crm-server.py']);
    expect(await zip.file('skills/custom-crm-server.py')!.async('string')).toBe('print("ready")');
    expect(fetchMock.mock.calls.every(([url]) => String(url).startsWith('./mcp-blueprints/'))).toBe(true);
  });

  it('rejects legacy capabilities and forces oversight for mutation tools', async () => {
    await expect(buildSwarmZip(
      company,
      [{ ...agent, skills: ['run_command'] }],
      [workflow],
      [],
      [],
    )).rejects.toThrow('legacy capability');

    const zip = await buildSwarmZip(
      company,
      [{ ...agent, skills: ['read_file', 'write_file'], requiresOversight: false }],
      [workflow],
      [],
      [],
    );
    const payload = JSON.parse(await zip.file('agents/review-agent.json')!.async('string'));
    expect(payload.requires_oversight).toBe(true);
  });

  it('preserves agent-owned and global workflows through import and export', async () => {
    const responses: Record<string, BodyInit> = {
      'swarm.json': JSON.stringify({
        roster: [{ id: 'review-agent', path: 'agents/review-agent.json', role: 'Reviewer' }],
        global_workflows: ['workflows/global.md'],
      }),
      'agents/review-agent.json': JSON.stringify({ ...agent, model_config: {
        provider: 'google',
        model_id: agent.model,
        system_prompt: agent.prompt,
      } }),
      'workflows/global.md': '# Workflow: Global\n\n## Coordinate\n\nCoordinate.',
      'workflows/review.md': '# Workflow: Review\n\n## Inspect\n\nInspect.',
    };
    vi.stubGlobal('fetch', vi.fn(async (url: string) => {
      const key = Object.keys(responses).find(candidate => url.endsWith(candidate));
      return key ? new Response(responses[key], { status: 200 }) : new Response('', { status: 404 });
    }));

    const imported = await fetchSwarmDetailsFromRepo('legal/test');
    expect(imported.workflows.map(item => item.id).sort()).toEqual(['global', 'review']);
    expect(imported.roster[0].workflows).toEqual(['review']);

    const zip = await buildSwarmZip(company, imported.roster, imported.workflows, [], []);
    const exportedAgent = JSON.parse(await zip.file('agents/review-agent.json')!.async('string'));
    expect(exportedAgent.workflows).toEqual(['review']);
    expect(zip.file('workflows/global.md')).not.toBeNull();
    expect(zip.file('workflows/review.md')).not.toBeNull();
  });
});
