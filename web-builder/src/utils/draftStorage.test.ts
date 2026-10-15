import { describe, expect, it, beforeEach } from 'vitest';
import type { Agent, CompanyInfo, MCPConnector, WorkflowItem } from '../types';
import { saveDraft, loadDraft, clearDraft, restoreDraftConnectors, DRAFT_STORAGE_KEY } from './draftStorage';

class MockStorage implements Storage {
  private store = new Map<string, string>();

  get length() {
    return this.store.size;
  }

  clear(): void {
    this.store.clear();
  }

  getItem(key: string): string | null {
    return this.store.get(key) ?? null;
  }

  key(index: number): string | null {
    return Array.from(this.store.keys())[index] ?? null;
  }

  removeItem(key: string): void {
    this.store.delete(key);
  }

  setItem(key: string, value: string): void {
    this.store.set(key, String(value));
  }
}

describe('draftStorage', () => {
  beforeEach(() => {
    globalThis.localStorage = new MockStorage();
  });

  const sampleCompany: CompanyInfo = {
    name: 'Field Ops Ltd',
    industry: 'Field Services',
    size: '25',
    description: 'Dispatch operations',
    mission: 'Revolutionize field service dispatch',
    industryPath: 'field-services',
    industryCode: '238210',
    goals: ['scheduling'],
  };

  const sampleAgent: Agent = {
    id: 'dispatch-agent',
    name: 'Dispatch Agent',
    role: 'Coordinator',
    model: 'gemma4:31b',
    prompt: 'Dispatch technicians efficiently.',
    skills: ['read_file'],
    workflows: [],
    mcpTools: [],
    requiresOversight: false,
  };

  const sampleWorkflow: WorkflowItem = {
    id: 'dispatch-flow',
    name: 'Dispatch Flow',
    description: '## Step 1\nTriage tickets.',
  };

  it('saves and loads a valid versioned draft', () => {
    expect(saveDraft('guided', sampleCompany, [sampleAgent], [sampleWorkflow], ['custom-crm'])).toBe(true);
    const loaded = loadDraft();
    expect(loaded).not.toBeNull();
    expect(loaded?.experienceMode).toBe('guided');
    expect(loaded?.companyInfo.name).toBe('Field Ops Ltd');
    expect(loaded?.agents.length).toBe(1);
    expect(loaded?.workflows.length).toBe(1);
    expect(loaded?.selectedConnectors).toEqual(['custom-crm']);
    expect(loaded?.savedAt).toBeDefined();
  });

  it('reports a failed save when browser storage is full', () => {
    localStorage.setItem = () => { throw new Error('Storage quota exceeded'); };
    expect(saveDraft('guided', sampleCompany, [sampleAgent], [], [])).toBe(false);
    expect(loadDraft()).toBeNull();
  });

  it('clears saved drafts on command', () => {
    saveDraft('advanced', sampleCompany, [sampleAgent], [], []);
    expect(loadDraft()).not.toBeNull();
    clearDraft();
    expect(loadDraft()).toBeNull();
  });

  it('recovers custom connectors and edited metadata without persisting runtime secrets', () => {
    const connector: MCPConnector = {
      id: 'custom-crm',
      name: 'Private CRM',
      description: 'A custom CRM connection',
      category: 'CRM',
      path: 'mcp-blueprints/private-crm',
      version: '1.0.0',
      config: {
        mcpServers: {
          crm: {
            command: 'python',
            args: ['server.py', '--token=argument-secret'],
            env: { CRM_TOKEN: 'environment-secret' },
            headers: { Authorization: 'Bearer header-secret' },
            url: 'https://user:password-secret@example.com',
          },
        },
      },
    };

    saveDraft('advanced', sampleCompany, [sampleAgent], [], [connector.id], [connector]);
    const stored = localStorage.getItem(DRAFT_STORAGE_KEY)!;
    expect(stored).not.toContain('secret');
    expect(stored).not.toContain('mcpServers');
    const recovered = restoreDraftConnectors([], loadDraft()?.connectorDefinitions);
    expect(recovered).toEqual([{
      id: connector.id,
      name: connector.name,
      description: connector.description,
      category: connector.category,
      path: connector.path,
      version: connector.version,
    }]);
  });

  it('merges saved metadata with the current release configuration regardless of load order', () => {
    const catalogConnector: MCPConnector = {
      id: 'reviewed-crm', name: 'CRM', description: 'CRM connector',
      category: 'CRM', path: 'mcp-blueprints/crm', version: '1.0.0',
      config: { mcpServers: { crm: { command: 'python', args: ['server.py'] } } },
      tools: [{ id: 'crm:read', name: 'read', description: 'Read CRM data', risk: 'read' }],
      integrity_hash: 'current-release-hash',
    };
    const savedMetadata = { ...catalogConnector, name: 'My CRM', path: 'mcp-blueprints/custom-crm' };
    const resumedBeforeFetch = restoreDraftConnectors([], [savedMetadata]);
    const fetchedAfterResume = restoreDraftConnectors([catalogConnector], resumedBeforeFetch);
    const resumedAfterFetch = restoreDraftConnectors([catalogConnector], [savedMetadata]);

    expect(fetchedAfterResume).toEqual(resumedAfterFetch);
    expect(resumedAfterFetch[0]).toMatchObject({
      name: 'My CRM', path: 'mcp-blueprints/custom-crm',
      config: catalogConnector.config,
      tools: catalogConnector.tools,
      integrity_hash: 'current-release-hash',
    });
  });

  it('accepts existing drafts without connector definitions and rejects malformed definitions', () => {
    saveDraft('guided', sampleCompany, [sampleAgent], [], []);
    const existingDraft = JSON.parse(localStorage.getItem(DRAFT_STORAGE_KEY)!);
    delete existingDraft.connectorDefinitions;
    localStorage.setItem(DRAFT_STORAGE_KEY, JSON.stringify(existingDraft));
    expect(loadDraft()).not.toBeNull();

    existingDraft.connectorDefinitions = [{ id: 123 }];
    localStorage.setItem(DRAFT_STORAGE_KEY, JSON.stringify(existingDraft));
    expect(loadDraft()).toBeNull();
  });

  it('strips unexpected runtime configuration from restored connector metadata', () => {
    saveDraft('guided', sampleCompany, [sampleAgent], [], []);
    const draft = JSON.parse(localStorage.getItem(DRAFT_STORAGE_KEY)!);
    draft.connectorDefinitions = [{
      id: 'crm', name: 'CRM', description: 'CRM', category: 'CRM', path: 'crm', version: '1',
      config: { mcpServers: { crm: { env: { TOKEN: 'do-not-restore' } } } },
    }];
    localStorage.setItem(DRAFT_STORAGE_KEY, JSON.stringify(draft));
    expect(loadDraft()?.connectorDefinitions?.[0]).not.toHaveProperty('config');
  });

  it('safely handles corrupted or legacy localStorage data', () => {
    localStorage.setItem(DRAFT_STORAGE_KEY, 'invalid json string');
    expect(loadDraft()).toBeNull();

    localStorage.setItem(DRAFT_STORAGE_KEY, JSON.stringify({ version: 999 }));
    expect(loadDraft()).toBeNull();
  });

  it.each([
    ['companyInfo', 'goals', [null]],
    ['companyInfo', 'goals', [{ id: 'scheduling' }]],
    ['agent', 'skills', ['read_file', null]],
    ['agent', 'skills', [{ id: 'write_file' }]],
    ['agent', 'workflows', [17]],
    ['agent', 'mcpTools', [{ id: 'crm:read' }]],
    ['agent', 'mcpTools', null],
  ])('rejects malformed %s.%s before a recovered draft reaches the UI', (target, field, value) => {
    saveDraft('guided', sampleCompany, [sampleAgent], [sampleWorkflow], []);
    const draft = JSON.parse(localStorage.getItem(DRAFT_STORAGE_KEY)!);
    const record = target === 'companyInfo' ? draft.companyInfo : draft.agents[0];
    record[field as string] = value;
    localStorage.setItem(DRAFT_STORAGE_KEY, JSON.stringify(draft));
    expect(loadDraft()).toBeNull();
  });

  it('rejects an invalid saved date while accepting older drafts with omitted optional arrays', () => {
    saveDraft('guided', sampleCompany, [sampleAgent], [], []);
    const draft = JSON.parse(localStorage.getItem(DRAFT_STORAGE_KEY)!);
    delete draft.companyInfo.goals;
    delete draft.agents[0].skills;
    delete draft.agents[0].workflows;
    delete draft.agents[0].mcpTools;
    localStorage.setItem(DRAFT_STORAGE_KEY, JSON.stringify(draft));
    expect(loadDraft()).not.toBeNull();

    draft.savedAt = 'not-a-date';
    localStorage.setItem(DRAFT_STORAGE_KEY, JSON.stringify(draft));
    expect(loadDraft()).toBeNull();
  });
});
