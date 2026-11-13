import {
  DANGEROUS_SKILL_LIST,
  GENERATED_CAPABILITY_DEFS,
  VALID_RUNTIME_CAPABILITY_LIST,
} from './_generatedContract';

export type CapabilityRisk = 'read_only' | 'mutating' | 'dangerous';

export interface CapabilityItem {
  id: string;
  label: string;
  description: string;
  risk: CapabilityRisk;
  requiresOversight: boolean;
  companionMarker?: string;
}

export const CANONICAL_CAPABILITIES: CapabilityItem[] = GENERATED_CAPABILITY_DEFS
  .filter(cap => !cap.isMarker)
  .map(cap => ({
    id: cap.id,
    label: cap.label,
    description: cap.builderDescription,
    risk: cap.risk,
    requiresOversight: cap.requiresOversight,
    ...(cap.companionMarkers.length > 0 ? { companionMarker: cap.companionMarkers[0] } : {}),
  }));

export const VALID_RUNTIME_CAPABILITIES = new Set<string>(VALID_RUNTIME_CAPABILITY_LIST);

export const DANGEROUS_SKILL_SET = new Set<string>(DANGEROUS_SKILL_LIST);
