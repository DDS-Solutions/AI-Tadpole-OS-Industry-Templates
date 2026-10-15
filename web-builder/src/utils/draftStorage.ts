import type { Agent, CompanyInfo, ExperienceMode, MCPConnector, WorkflowItem } from '../types';

export const DRAFT_STORAGE_KEY = 'tadpole_builder_draft_v1';

// The editor exposes metadata only. Never persist runtime config, environment
// values, or headers from a connector into browser storage.
export type DraftConnectorDefinition = Pick<MCPConnector, 'id' | 'name' | 'description' | 'category' | 'path' | 'version'>;

export interface SavedDraft {
  version: 1;
  savedAt: string;
  experienceMode: ExperienceMode;
  companyInfo: CompanyInfo;
  agents: Agent[];
  workflows: WorkflowItem[];
  selectedConnectors: string[];
  connectorDefinitions?: DraftConnectorDefinition[];
}

function connectorMetadata(connector: DraftConnectorDefinition): DraftConnectorDefinition {
  return {
    id: connector.id,
    name: connector.name,
    description: connector.description,
    category: connector.category,
    path: connector.path,
    version: connector.version,
  };
}

function isConnectorDefinition(obj: unknown): obj is DraftConnectorDefinition {
  if (!obj || typeof obj !== 'object') return false;
  const connector = obj as Record<string, unknown>;
  return ['id', 'name', 'description', 'category', 'path', 'version']
    .every(key => typeof connector[key] === 'string');
}

export function restoreDraftConnectors(
  catalog: MCPConnector[],
  definitions: DraftConnectorDefinition[] = [],
): MCPConnector[] {
  const merged = new Map(catalog.map(connector => [connector.id, connector]));
  for (const definition of definitions) {
    // Reapply metadata over the current release's config and tool manifests.
    // A draft cannot replace executable configuration or verified provenance.
    merged.set(definition.id, { ...merged.get(definition.id), ...connectorMetadata(definition) });
  }
  return [...merged.values()];
}

function getStorage(): Storage | null {
  if (typeof globalThis !== 'undefined' && globalThis.localStorage) {
    return globalThis.localStorage;
  }
  return null;
}

function isOptionalStringArray(value: unknown): boolean {
  return value === undefined || (Array.isArray(value) && value.every(item => typeof item === 'string'));
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
    isOptionalStringArray(c.goals)
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
    isOptionalStringArray(a.skills) &&
    isOptionalStringArray(a.workflows) &&
    isOptionalStringArray(a.mcpTools)
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
  connectors: MCPConnector[] = [],
): boolean {
  try {
    const storage = getStorage();
    if (!storage) return false;

    const draft: SavedDraft = {
      version: 1,
      savedAt: new Date().toISOString(),
      experienceMode,
      companyInfo,
      agents,
      workflows,
      selectedConnectors,
      connectorDefinitions: connectors.map(connectorMetadata),
    };
    storage.setItem(DRAFT_STORAGE_KEY, JSON.stringify(draft));
    return true;
  } catch {
    return false;
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
      Number.isFinite(Date.parse(parsed.savedAt)) &&
      (parsed.experienceMode === 'guided' || parsed.experienceMode === 'advanced') &&
      isCompanyInfo(parsed.companyInfo) &&
      Array.isArray(parsed.agents) &&
      parsed.agents.every(isAgent) &&
      Array.isArray(parsed.workflows) &&
      parsed.workflows.every(isWorkflowItem) &&
      Array.isArray(parsed.selectedConnectors) &&
      parsed.selectedConnectors.every(c => typeof c === 'string') &&
      (parsed.connectorDefinitions === undefined || (
        Array.isArray(parsed.connectorDefinitions)
        && parsed.connectorDefinitions.every(isConnectorDefinition)
      ))
    ) {
      return {
        ...(parsed as SavedDraft),
        connectorDefinitions: parsed.connectorDefinitions?.map(connectorMetadata),
      };
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
