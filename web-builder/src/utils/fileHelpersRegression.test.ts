import { afterEach, describe, expect, it, vi } from 'vitest';
import type { Agent, CompanyInfo, WorkflowItem } from '../types';
import { buildSwarmZip, fetchSwarmDetailsFromRepo } from './fileHelpers';

const baseCompany: CompanyInfo = {
  name: 'Northstar Legal',
  size: '25',
  description: 'Corporate counsel team',
  mission: 'Produce accurate compliance analysis with clear human review.',
  industry: 'Legal Services',
  industryPath: 'legal',
  industryCode: '541110',
  goals: ['contract-review'],
};

const baseAgent: Agent = {
  id: 'lead-counsel',
  name: 'Lead Counsel',
  role: 'Coordinator',
  model: 'gemma4:31b',
  provider: 'google',
  prompt: 'Coordinate compliance review for company counsel.',
  skills: ['read_file'],
  workflows: [],
  mcpTools: [],
  requiresOversight: false,
};

afterEach(() => {
  vi.unstubAllGlobals();
});

describe('fileHelpers regression checks', () => {
  it('exports knowledge.json tags as a non-empty string array and imports both array and string tags', async () => {
    const workflows: WorkflowItem[] = [
      {
        id: 'contract-intake',
        name: 'Contract Intake SOP',
        description: 'Review incoming agreements and flag clauses.',
        isOkfPlaybook: true,
        topic: 'contracts',
        conceptType: 'playbook',
        tags: 'legal, compliance, intake',
      },
    ];

    const zip = await buildSwarmZip(baseCompany, [baseAgent], workflows, [], []);
    const knowledgeRaw = await zip.file('knowledge.json')?.async('string');
    expect(knowledgeRaw).toBeDefined();

    const knowledge = JSON.parse(knowledgeRaw!);
    expect(knowledge).toHaveLength(1);
    expect(knowledge[0].tags).toEqual(['legal', 'compliance', 'intake']);

    const mockSwarm = JSON.parse((await zip.file('swarm.json')?.async('string'))!);
    const mockAgent = JSON.parse((await zip.file('agents/lead-counsel.json')?.async('string'))!);
    const fetchMock = vi.fn(async (input: RequestInfo | URL) => {
      const url = String(input);
      if (url.endsWith('/swarm.json')) {
        return new Response(JSON.stringify(mockSwarm), { status: 200 });
      }
      if (url.endsWith('/agents/lead-counsel.json')) {
        return new Response(JSON.stringify(mockAgent), { status: 200 });
      }
      if (url.endsWith('/knowledge.json')) {
        return new Response(JSON.stringify(knowledge), { status: 200 });
      }
      return new Response('', { status: 404 });
    });
    vi.stubGlobal('fetch', fetchMock);

    const hydrated = await fetchSwarmDetailsFromRepo('legal/northstar');
    expect(hydrated.workflows[0].isOkfPlaybook).toBe(true);
    expect(hydrated.workflows[0].tags).toBe('legal, compliance, intake');
  });

  it('avoids creating supervisor cycles when a critical agent already has an explicit supervisor', async () => {
    const workerCritical: Agent = {
      ...baseAgent,
      id: 'worker-critical',
      name: 'Critical Worker',
      supervisor: 'director',
      priority: 'critical',
    };
    const director: Agent = {
      ...baseAgent,
      id: 'director',
      name: 'Director',
      supervisor: undefined,
      priority: 'high',
    };

    const zip = await buildSwarmZip(baseCompany, [workerCritical, director], [], [], []);
    const swarm = JSON.parse((await zip.file('swarm.json')?.async('string'))!);

    expect(swarm.roster).toEqual([
      expect.objectContaining({ id: 'worker-critical', supervisor: 'director' }),
      expect.objectContaining({ id: 'director', supervisor: null }),
    ]);
    expect(swarm.flat_peer_swarm).toBeUndefined();
  });

  it('emits flat_peer_swarm: true when multi-agent swarm explicitly has all null supervisors', async () => {
    const peerA: Agent = { ...baseAgent, id: 'peer-a', name: 'Peer A', supervisor: null };
    const peerB: Agent = { ...baseAgent, id: 'peer-b', name: 'Peer B', supervisor: null };

    const zip = await buildSwarmZip(baseCompany, [peerA, peerB], [], [], []);
    const swarm = JSON.parse((await zip.file('swarm.json')?.async('string'))!);

    expect(swarm.flat_peer_swarm).toBe(true);
  });

  it('rejects malformed mcpTools lacking server:tool or mcp__server__tool delimiters on export', async () => {
    const badAgent: Agent = {
      ...baseAgent,
      mcpTools: ['github'],
    };

    await expect(buildSwarmZip(baseCompany, [badAgent], [], [], [])).rejects.toThrow(
      /invalid MCP grant "github"/i,
    );
  });
});
