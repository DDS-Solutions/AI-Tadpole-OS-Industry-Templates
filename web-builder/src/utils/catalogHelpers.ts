import type { Agent, CatalogAgent, RecommendedSpecialist } from '../types';
import { DANGEROUS_SKILL_SET } from '../constants/capabilities';

export const safeFileId = (value: string): string => {
  const normalized = value.toLowerCase().replace(/[^a-z0-9_-]+/g, '-').replace(/^-+|-+$/g, '');
  if (!normalized) throw new Error(`Cannot create a safe file name from "${value}".`);
  return normalized;
};

const DANGEROUS_SKILLS = DANGEROUS_SKILL_SET;

export function catalogAgentToRuntimeAgent(
  catalogAgent: CatalogAgent,
  customOverrides: Partial<Agent> = {},
): Agent {
  const baseId = safeFileId(catalogAgent.id || catalogAgent.name);
  const runtimePrompt = (customOverrides.prompt || catalogAgent.runtimePrompt || catalogAgent.prompt || '').trim();

  if (!runtimePrompt) {
    throw new Error(`Catalog agent "${catalogAgent.name || catalogAgent.id}" has an empty runtime prompt.`);
  }
  if (runtimePrompt.length > 800) {
    throw new Error(`Catalog agent "${catalogAgent.name || catalogAgent.id}" prompt exceeds 800 characters (${runtimePrompt.length}). Shorten the prompt before adding to swarm.`);
  }

  const defaultRole = catalogAgent.role || catalogAgent.vibe || 'Specialist';
  const defaultDepartment = catalogAgent.departmentLabel || catalogAgent.department || 'Operations';
  const defaultDescription = catalogAgent.description || `${catalogAgent.name} - ${defaultRole}`;

  const skills = customOverrides.skills || (catalogAgent.skills && catalogAgent.skills.length > 0 ? [...catalogAgent.skills] : ['read_file', 'grep_search']);
  const hasDangerousSkill = skills.some(s => DANGEROUS_SKILLS.has(s));

  return {
    id: customOverrides.id || baseId,
    name: customOverrides.name || catalogAgent.name,
    role: customOverrides.role || defaultRole,
    department: customOverrides.department || defaultDepartment,
    description: customOverrides.description || defaultDescription,
    status: 'idle',
    provider: customOverrides.provider || catalogAgent.provider || 'google',
    model: customOverrides.model || catalogAgent.model || 'gemma4:31b',
    prompt: runtimePrompt,
    skills,
    workflows: customOverrides.workflows || [],
    mcpTools: customOverrides.mcpTools || [],
    requiresOversight: Boolean(
      hasDangerousSkill
        || (customOverrides.requiresOversight !== undefined
          ? customOverrides.requiresOversight
          : catalogAgent.requiresOversight !== undefined
            ? catalogAgent.requiresOversight
            : catalogAgent.requires_oversight !== undefined
              ? catalogAgent.requires_oversight
              : false)
    ),
    emoji: customOverrides.emoji || catalogAgent.emoji || '🤖',
    color: customOverrides.color || catalogAgent.color || '#3B82F6',
    vibe: customOverrides.vibe || catalogAgent.vibe || '',
    isCustom: Boolean(customOverrides.isCustom),
    recommendationReason: customOverrides.recommendationReason,
  };
}

import {
  type BusinessGoalDef,
  ALL_BUSINESS_GOALS,
  DEFAULT_BUSINESS_GOALS,
  LEGACY_BUSINESS_GOALS,
  getGoalsForIndustry,
  getDefaultGoalsForIndustry,
} from '../constants/industryGoals';

export type { BusinessGoalDef };
export { ALL_BUSINESS_GOALS, DEFAULT_BUSINESS_GOALS, LEGACY_BUSINESS_GOALS, getGoalsForIndustry, getDefaultGoalsForIndustry };
export const BUSINESS_GOALS: BusinessGoalDef[] = ALL_BUSINESS_GOALS;

export function generateGoalWorkflows(selectedGoalIds: string[]): import('../types').WorkflowItem[] {
  const chosenGoals = selectedGoalIds.length > 0 ? selectedGoalIds : ['scheduling', 'quoting', 'customer-follow-up'];
  const goalDefs = chosenGoals
    .map(goalId => BUSINESS_GOALS.find(g => g.id === goalId))
    .filter((g): g is BusinessGoalDef => g !== undefined);

  return goalDefs.map(goal => {
    const safeId = safeFileId(`sop-${goal.id}`);
    const markdownBody = [
      `## Step 1: Scope and Objectives`,
      `Establish the operational scope for ${goal.label.toLowerCase()} in alignment with swarm mission boundaries.`,
      ``,
      `## Step 2: Standard Operating Procedure`,
      `1. Review incoming requests against verified criteria and constraints.`,
      `2. Prepare candidate drafts, summaries, and calculations (${goal.canPrepare.join(', ')}).`,
      `3. Verify compliance with human approval policies before proposing execution.`,
      ``,
      `## Step 3: Safeguards and Oversight`,
      `Ensure that final approval actions (${goal.cannotApprove.join(', ')}) remain restricted to authorized human operators.`,
    ].join('\n');

    return {
      id: safeId,
      name: `${goal.label} Procedure`,
      description: markdownBody,
      isOkfPlaybook: false,
      source: 'generated',
      generatedFromGoalId: goal.id,
      topic: goal.category.toLowerCase().replace(/[^a-z0-9]+/g, '-'),
      conceptType: 'playbook',
      tags: `workflow,${goal.id}`,
    };
  });
}

export function generateDefaultMission(companyName: string, industry: string, goals: string[]): string {
  const name = companyName.trim() || 'Organization';
  const ind = industry.trim() || 'enterprise';
  const goalLabels = goals
    .map(gId => BUSINESS_GOALS.find(g => g.id === gId)?.label)
    .filter(Boolean);
  const goalStr = goalLabels.length > 0 ? goalLabels.join(', ') : 'operational efficiency and compliance';
  return `To drive autonomous, safe, and transparent ${ind} operations for ${name}, coordinating specialized AI agents to deliver excellence in ${goalStr}.`;
}

export function recommendTeam(
  selectedGoalIds: string[],
  industry: string,
  companySize: string,
  catalog: CatalogAgent[],
): RecommendedSpecialist[] {
  const chosenGoals = selectedGoalIds.length > 0
    ? selectedGoalIds
    : ['scheduling', 'quoting', 'customer-follow-up'];

  const sizeNum = Number.parseInt(companySize, 10);
  const maxSpecialists = Number.isFinite(sizeNum) && sizeNum >= 100 ? 5 : Number.isFinite(sizeNum) && sizeNum >= 25 ? 4 : 3;

  const matchedAgentMap = new Map<string, RecommendedSpecialist>();
  const goalDefs = chosenGoals
    .map(goalId => BUSINESS_GOALS.find(g => g.id === goalId))
    .filter((g): g is BusinessGoalDef => g !== undefined);

  // Round-robin selection across all chosen goals
  let candidateIndex = 0;
  let hasMoreCandidates = true;

  while (matchedAgentMap.size < maxSpecialists && hasMoreCandidates) {
    hasMoreCandidates = false;
    for (const goalDef of goalDefs) {
      if (matchedAgentMap.size >= maxSpecialists) break;

      if (candidateIndex < goalDef.recommendedAgentIds.length) {
        hasMoreCandidates = true;
        const agentId = goalDef.recommendedAgentIds[candidateIndex];
        if (!matchedAgentMap.has(agentId)) {
          const catalogEntry = catalog.find(a => a.id === agentId);
          if (catalogEntry) {
            const runtimeAgent = catalogAgentToRuntimeAgent(catalogEntry, {
              recommendationReason: goalDef.whyReason,
            });
            matchedAgentMap.set(agentId, {
              agent: runtimeAgent,
              whyRecommended: goalDef.whyReason,
              canRead: goalDef.canRead,
              canPrepare: goalDef.canPrepare,
              cannotApprove: goalDef.cannotApprove,
              requiresApproval: goalDef.requiresApproval,
              matchedGoalIds: [goalDef.id],
            });
          }
        } else {
          const existing = matchedAgentMap.get(agentId)!;
          if (existing.matchedGoalIds && !existing.matchedGoalIds.includes(goalDef.id)) {
            existing.matchedGoalIds.push(goalDef.id);
          }
        }
      }
    }
    candidateIndex++;
  }

  // Fallback if catalog entries weren't found by explicit ID: search by industry keywords
  if (matchedAgentMap.size < maxSpecialists && catalog.length > 0) {
    const normalizedIndustry = (industry || '').toLowerCase();
    const industryMatches = catalog.filter(a =>
      ((a.department && a.department.toLowerCase().includes(normalizedIndustry)) ||
       (a.description && a.description.toLowerCase().includes(normalizedIndustry)) ||
       (a.vibe && a.vibe.toLowerCase().includes(normalizedIndustry)))
    );

    for (const entry of industryMatches) {
      if (matchedAgentMap.size >= maxSpecialists) break;
      const runtimeAgent = catalogAgentToRuntimeAgent(entry, {
        recommendationReason: `Recommended as an industry specialist for ${industry || 'your business'}.`,
      });
      matchedAgentMap.set(entry.id, {
        agent: runtimeAgent,
        whyRecommended: `Recommended as an industry specialist for ${industry || 'your business'}.`,
        canRead: ['Approved company records and templates'],
        canPrepare: ['Draft operational recommendations and documents'],
        cannotApprove: ['Direct external actions or unreviewed commitments'],
        requiresApproval: true,
        matchedGoalIds: chosenGoals,
      });
    }
  }

  return Array.from(matchedAgentMap.values());
}

