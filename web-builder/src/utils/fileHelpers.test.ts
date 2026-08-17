import { describe, expect, it, vi } from 'vitest';
import type { Agent, WorkflowItem, MCPConnector } from '../types';
import { buildSwarmZip, fetchSwarmDetailsFromRepo } from './fileHelpers';

describe('Swarm Architect archive contract', () => {
  const company = {
    name: 'Acme Advisory',
    mission: 'Deliver audit-ready compliance analysis.',
    size: '25',
    industry: 'Legal Services',
  };

  const agent: Agent = {
    id: 'review-agent',
    name: 'Review Agent',
    role: 'Reviewer',
    department: 'Legal Operations',
    description: 'Reviews operational and legal compliance evidence.',
    status: 'idle',
    provider: 'google',
    model: 'gemini-pro-latest',
    prompt: 'Review evidence carefully.',
    skills: ['read_file'],
    workflows: ['review'],
    mcpTools: ['crm:get_contact'],
    requiresOversight: false,
  };

  const workflow: WorkflowItem = {
    id: 'review',
    name: 'Review Process',
    description: '## Inspect\nVerify that the input complies with corporate policy.',
  };

  it('emits consumer-compatible agents, workflows, and root MCP config', async () => {
    const zip = await buildSwarmZip(company, [agent], [workflow], [], []);
    const swarm = JSON.parse(await zip.file('swarm.json')!.async('string'));
    const agentJson = JSON.parse(await zip.file('agents/review-agent.json')!.async('string'));
    const mcp = JSON.parse(await zip.file('mcps.json')!.async('string'));

    expect(swarm.roster).toEqual([
      { id: 'review-agent', path: 'agents/review-agent.json', role: 'Reviewer' },
    ]);
    expect(agentJson).toMatchObject({
      id: 'review-agent',
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

  it('generates deterministic read-only, write-capable, and execution archives', async () => {
    const readOnlyAgent: Agent = {
      id: 'analyst',
      name: 'Analyst',
      role: 'Analyst',
      department: 'Research',
      description: 'Performs data lookup',
      status: 'idle',
      model: 'gemini-pro-latest',
      prompt: 'Analyze data',
      skills: ['read_file', 'grep_search'],
      workflows: ['review'],
      requiresOversight: false,
    };

    const writeAgent: Agent = {
      id: 'writer',
      name: 'Writer',
      role: 'Editor',
      department: 'Publishing',
      description: 'Creates workspace files',
      status: 'idle',
      model: 'gemini-pro-latest',
      prompt: 'Write documentation',
      skills: ['read_file', 'write_file'],
      workflows: ['review'],
      requiresOversight: false,
    };

    const shellAgent: Agent = {
      id: 'operator',
      name: 'Operator',
      role: 'DevOps',
      department: 'Infrastructure',
      description: 'Runs maintenance scripts',
      status: 'idle',
      model: 'gemini-pro-latest',
      prompt: 'Execute commands',
      skills: ['read_file', 'execute_shell', 'shell'],
      workflows: ['review'],
      requiresOversight: false,
    };

    const zip = await buildSwarmZip(company, [readOnlyAgent, writeAgent, shellAgent], [workflow], [], []);
    const readJson = JSON.parse(await zip.file('agents/analyst.json')!.async('string'));
    const writeJson = JSON.parse(await zip.file('agents/writer.json')!.async('string'));
    const shellJson = JSON.parse(await zip.file('agents/operator.json')!.async('string'));

    expect(readJson.requires_oversight).toBe(false);
    expect(writeJson.requires_oversight).toBe(true);
    expect(shellJson.requires_oversight).toBe(true);
  });

  it('computes Forge telemetry oversight count that strictly matches requires_oversight', async () => {
    const agentsList: Agent[] = [
      { ...agent, id: 'a1', skills: ['read_file'], requiresOversight: false },
      { ...agent, id: 'a2', skills: ['read_file', 'write_file'], requiresOversight: false },
      { ...agent, id: 'a3', skills: ['read_file', 'execute_shell', 'shell'], requiresOversight: false },
      { ...agent, id: 'a4', skills: ['read_file'], requiresOversight: true },
    ];

    const zip = await buildSwarmZip(company, agentsList, [workflow], [], []);

    const exportedOversightFlags = await Promise.all(
      agentsList.map(async a => {
        const payload = JSON.parse(await zip.file(`agents/${a.id}.json`)!.async('string'));
        return payload.requires_oversight as boolean;
      }),
    );

    const totalOversightRequired = exportedOversightFlags.filter(Boolean).length;
    // a2 (write_file), a3 (execute_shell), a4 (manual oversight flag) -> 3
    expect(totalOversightRequired).toBe(3);
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

  it('exports a valid Guided Setup swarm with recommended specialist agents', async () => {
    const guidedCompany = {
      name: 'Apex Field Services',
      mission: 'Coordinate dispatch, work orders, and customer follow-up.',
      size: '25',
      industry: 'Field Services',
    };

    const dispatchAgent: Agent = {
      id: 'dispatch-coordinator',
      name: 'Field Service Dispatch Coordinator',
      role: 'Dispatch Coordinator',
      department: 'Operations',
      description: 'Coordinates technician schedules.',
      status: 'idle',
      provider: 'google',
      model: 'gemini-pro-latest',
      prompt: 'You coordinate daily field-service dispatch for a small business. Triage requests by urgency and location. Require human approval before assignments.',
      skills: ['read_file'],
      workflows: ['dispatch-procedure'],
      mcpTools: [],
      requiresOversight: false,
    };

    const estimateAgent: Agent = {
      id: 'estimate-coordinator',
      name: 'Estimate & Work Order Coordinator',
      role: 'Estimate Coordinator',
      department: 'Finance',
      description: 'Prepares draft estimates.',
      status: 'idle',
      provider: 'google',
      model: 'gemini-pro-latest',
      prompt: 'You prepare draft estimates and work orders for a small service company. Use supplied price books. Require approval before quotes are issued.',
      skills: ['read_file'],
      workflows: ['dispatch-procedure'],
      mcpTools: [],
      requiresOversight: false,
    };

    const workflowItem: WorkflowItem = {
      id: 'dispatch-procedure',
      name: 'Dispatch & Work Order SOP',
      description: '## Step 1: Dispatch\nTriage and review dispatch records.',
    };

    const zip = await buildSwarmZip(guidedCompany, [dispatchAgent, estimateAgent], [workflowItem], [], []);
    const swarmJson = JSON.parse(await zip.file('swarm.json')!.async('string'));
    expect(swarmJson.name).toBe('Apex Field Services Swarm');
    expect(swarmJson.roster.length).toBe(2);

    const dispatchExport = JSON.parse(await zip.file('agents/dispatch-coordinator.json')!.async('string'));
    expect(dispatchExport.model_config.system_prompt.length).toBeLessThanOrEqual(800);
    expect(dispatchExport.status).toBe('idle');
  });

  it('rejects system prompts exceeding 800 characters at export time', async () => {
    const oversizedAgent: Agent = {
      ...agent,
      prompt: 'A'.repeat(801),
    };
    await expect(buildSwarmZip(company, [oversizedAgent], [workflow], [], [])).rejects.toThrow(
      'has a system prompt longer than 800 characters',
    );
  });

  it('rejects unrecognized capability IDs and accepts valid search_web tool', async () => {
    await expect(
      buildSwarmZip(company, [{ ...agent, skills: ['read_file', 'invalid_capability'] }], [workflow], [], [])
    ).rejects.toThrow('Unrecognized capability');

    const zip = await buildSwarmZip(company, [{ ...agent, skills: ['read_file', 'search_web'] }], [workflow], [], []);
    const exported = JSON.parse(await zip.file('agents/review-agent.json')!.async('string'));
    expect(exported.skills).toEqual(['read_file', 'search_web']);
  });
});
