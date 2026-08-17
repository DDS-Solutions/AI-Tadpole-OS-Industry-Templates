export type CapabilityRisk = 'read_only' | 'mutating' | 'dangerous';

export interface CapabilityItem {
  id: string;
  label: string;
  description: string;
  risk: CapabilityRisk;
  requiresOversight: boolean;
  companionMarker?: string;
}

export const CANONICAL_CAPABILITIES: CapabilityItem[] = [
  {
    id: 'read_file',
    label: 'Read File',
    description: 'Inspect workspace files safely in read-only mode.',
    risk: 'read_only',
    requiresOversight: false,
  },
  {
    id: 'grep_search',
    label: 'Grep Search',
    description: 'Perform regex pattern searches across text files.',
    risk: 'read_only',
    requiresOversight: false,
  },
  {
    id: 'search_web',
    label: 'Search Web',
    description: 'Fetch external documentation and public web pages.',
    risk: 'read_only',
    requiresOversight: false,
  },
  {
    id: 'write_file',
    label: 'Write File',
    description: 'Create and update workspace files. Requires operator oversight.',
    risk: 'mutating',
    requiresOversight: true,
  },
  {
    id: 'delete_file',
    label: 'Delete File',
    description: 'Remove files from the workspace. Requires operator oversight.',
    risk: 'dangerous',
    requiresOversight: true,
  },
  {
    id: 'execute_shell',
    label: 'Execute Shell',
    description: 'Execute shell commands. Automatically paired with runtime shell marker.',
    risk: 'dangerous',
    requiresOversight: true,
    companionMarker: 'shell',
  },
];

export const VALID_RUNTIME_CAPABILITIES = new Set([
  ...CANONICAL_CAPABILITIES.map(c => c.id),
  'shell',
  'terminal',
]);

export const DANGEROUS_SKILL_SET = new Set([
  ...CANONICAL_CAPABILITIES.filter(cap => cap.requiresOversight).map(cap => cap.id),
  'shell',
  'terminal',
]);
