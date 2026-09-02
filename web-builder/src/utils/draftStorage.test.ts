import { describe, expect, it, beforeEach } from 'vitest';
import type { Agent, CompanyInfo, WorkflowItem } from '../types';
import { saveDraft, loadDraft, clearDraft, DRAFT_STORAGE_KEY } from './draftStorage';

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
    saveDraft('guided', sampleCompany, [sampleAgent], [sampleWorkflow], ['custom-crm']);
    const loaded = loadDraft();
    expect(loaded).not.toBeNull();
    expect(loaded?.experienceMode).toBe('guided');
    expect(loaded?.companyInfo.name).toBe('Field Ops Ltd');
    expect(loaded?.agents.length).toBe(1);
    expect(loaded?.workflows.length).toBe(1);
    expect(loaded?.selectedConnectors).toEqual(['custom-crm']);
    expect(loaded?.savedAt).toBeDefined();
  });

  it('clears saved drafts on command', () => {
    saveDraft('advanced', sampleCompany, [sampleAgent], [], []);
    expect(loadDraft()).not.toBeNull();
    clearDraft();
    expect(loadDraft()).toBeNull();
  });

  it('safely handles corrupted or legacy localStorage data', () => {
    localStorage.setItem(DRAFT_STORAGE_KEY, 'invalid json string');
    expect(loadDraft()).toBeNull();

    localStorage.setItem(DRAFT_STORAGE_KEY, JSON.stringify({ version: 999 }));
    expect(loadDraft()).toBeNull();
  });
});
