import type { Agent, CompanyInfo, ExperienceMode, WorkflowItem } from '../types';

export const DRAFT_STORAGE_KEY = 'tadpole_builder_draft_v1';

export interface SavedDraft {
  version: 1;
  savedAt: string;
  experienceMode: ExperienceMode;
  companyInfo: CompanyInfo;
  agents: Agent[];
  workflows: WorkflowItem[];
  selectedConnectors: string[];
}

function getStorage(): Storage | null {
  if (typeof globalThis !== 'undefined' && globalThis.localStorage) {
    return globalThis.localStorage;
  }
  return null;
}

function isCompanyInfo(obj: unknown): obj is CompanyInfo {
  if (!obj || typeof obj !== 'object') return false;
  const c = obj as Record<string, unknown>;
  return (
    typeof c.name === 'string' &&
    typeof c.size === 'string' &&
    typeof c.description === 'string' &&
    typeof c.mission === 'string' &&
    typeof c.industry === 'string' &&
    typeof c.industryPath === 'string' &&
    typeof c.industryCode === 'string' &&
    (!c.goals || Array.isArray(c.goals))
  );
}

function isAgent(obj: unknown): obj is Agent {
  if (!obj || typeof obj !== 'object') return false;
  const a = obj as Record<string, unknown>;
  return (
    typeof a.id === 'string' &&
    typeof a.name === 'string' &&
    typeof a.role === 'string' &&
    typeof a.model === 'string' &&
    typeof a.prompt === 'string' &&
    (!a.skills || Array.isArray(a.skills)) &&
    (!a.workflows || Array.isArray(a.workflows)) &&
    (!a.mcpTools || Array.isArray(a.mcpTools))
  );
}

function isWorkflowItem(obj: unknown): obj is WorkflowItem {
  if (!obj || typeof obj !== 'object') return false;
  const w = obj as Record<string, unknown>;
  return (
    typeof w.id === 'string' &&
    typeof w.name === 'string' &&
    typeof w.description === 'string'
  );
}

export function saveDraft(
  experienceMode: ExperienceMode,
  companyInfo: CompanyInfo,
  agents: Agent[],
  workflows: WorkflowItem[],
  selectedConnectors: string[],
): void {
  try {
    const storage = getStorage();
    if (!storage) return;

    const draft: SavedDraft = {
      version: 1,
      savedAt: new Date().toISOString(),
      experienceMode,
      companyInfo,
      agents,
      workflows,
      selectedConnectors,
    };
    storage.setItem(DRAFT_STORAGE_KEY, JSON.stringify(draft));
  } catch {
    // Fail-safe storage write
  }
}

export function loadDraft(): SavedDraft | null {
  try {
    const storage = getStorage();
    if (!storage) return null;

    const data = storage.getItem(DRAFT_STORAGE_KEY);
    if (!data) return null;
    const parsed = JSON.parse(data) as Partial<SavedDraft>;

    if (
      parsed &&
      parsed.version === 1 &&
      typeof parsed.savedAt === 'string' &&
      (parsed.experienceMode === 'guided' || parsed.experienceMode === 'advanced') &&
      isCompanyInfo(parsed.companyInfo) &&
      Array.isArray(parsed.agents) &&
      parsed.agents.every(isAgent) &&
      Array.isArray(parsed.workflows) &&
      parsed.workflows.every(isWorkflowItem) &&
      Array.isArray(parsed.selectedConnectors) &&
      parsed.selectedConnectors.every(c => typeof c === 'string')
    ) {
      return parsed as SavedDraft;
    }
    return null;
  } catch {
    return null;
  }
}

export function clearDraft(): void {
  try {
    const storage = getStorage();
    if (!storage) return;
    storage.removeItem(DRAFT_STORAGE_KEY);
  } catch {
    // Fail-safe storage removal
  }
}
