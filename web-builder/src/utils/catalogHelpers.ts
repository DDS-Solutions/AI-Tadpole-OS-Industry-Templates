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

  const skills = customOverrides.skills || ['read_file'];
  const hasDangerousSkill = skills.some(s => DANGEROUS_SKILLS.has(s));

  return {
    id: customOverrides.id || baseId,
    name: customOverrides.name || catalogAgent.name,
    role: customOverrides.role || defaultRole,
    department: customOverrides.department || defaultDepartment,
    description: customOverrides.description || defaultDescription,
    status: 'idle',
    provider: customOverrides.provider || 'google',
    model: customOverrides.model || 'gemma4:31b',
    prompt: runtimePrompt,
    skills,
    workflows: customOverrides.workflows || [],
    mcpTools: customOverrides.mcpTools || [],
    requiresOversight: Boolean(
      customOverrides.requiresOversight !== undefined
        ? customOverrides.requiresOversight
        : hasDangerousSkill
    ),
    emoji: customOverrides.emoji || catalogAgent.emoji || '🤖',
    color: customOverrides.color || catalogAgent.color || '#3B82F6',
    vibe: customOverrides.vibe || catalogAgent.vibe || '',
    isCustom: Boolean(customOverrides.isCustom),
    recommendationReason: customOverrides.recommendationReason,
  };
}

export interface BusinessGoalDef {
  id: string;
  label: string;
  category: string;
  description: string;
  recommendedAgentIds: string[];
  whyReason: string;
  canRead: string[];
  canPrepare: string[];
  cannotApprove: string[];
  requiresApproval: boolean;
}

export const BUSINESS_GOALS: BusinessGoalDef[] = [
  {
    id: 'scheduling',
    label: 'Scheduling & Dispatch',
    category: 'Schedule and deliver work',
    description: 'Coordinate appointments, route technicians, and prevent schedule conflicts.',
    recommendedAgentIds: [
      'project-management-field-service-dispatch-coordinator',
      'project-management-project-manager-senior',
      'project-management-project-management-project-shepherd',
      'support-field-service-customer-care-coordinator',
    ],
    whyReason: 'Recommended because you selected scheduling and service dispatch.',
    canRead: ['Approved service requests', 'Technician availability records', 'Service zones'],
    canPrepare: ['Draft technician schedules', 'Route plans', 'Schedule conflict exception reports'],
    cannotApprove: ['Final technician assignments', 'Emergency schedule overrides', 'Overtime authorization'],
    requiresApproval: true,
  },
  {
    id: 'quoting',
    label: 'Quotes & Work Orders',
    category: 'Prepare quotes and orders',
    description: 'Prepare accurate estimate drafts, work orders, and price breakdown sheets.',
    recommendedAgentIds: [
      'finance-field-service-estimate-work-order-coordinator',
      'sales-wholesale-b2b-account-operations',
      'finance-finance-financial-analyst',
      'specialized-specialized-pricing-analyst',
    ],
    whyReason: 'Recommended because you selected quote and work order preparation.',
    canRead: ['Approved price books', 'Labor rate tables', 'Customer scope notes'],
    canPrepare: ['Draft estimate sheets', 'Work order proposals', 'Material cost summaries'],
    cannotApprove: ['Customer pricing commitments', 'Custom discount overrides', 'Credit term extensions'],
    requiresApproval: true,
  },
  {
    id: 'customer-follow-up',
    label: 'Customer Follow-up & Care',
    category: 'Win and retain customers',
    description: 'Draft post-service updates, maintenance reminders, and satisfaction surveys.',
    recommendedAgentIds: [
      'support-field-service-customer-care-coordinator',
      'support-support-support-responder',
      'specialized-customer-service',
      'specialized-customer-success-manager',
    ],
    whyReason: 'Recommended because you selected customer follow-up and communication.',
    canRead: ['Approved customer tickets', 'Completed job summaries', 'Maintenance schedules'],
    canPrepare: ['Appointment reminders', 'Follow-up draft messages', 'Feedback summaries'],
    cannotApprove: ['Outbound message sending', 'Customer refunds or credits', 'Policy exceptions'],
    requiresApproval: true,
  },
  {
    id: 'inventory',
    label: 'Inventory & Replenishment',
    category: 'Manage inventory and purchasing',
    description: 'Track stock thresholds, detect shortages, and draft reorder recommendations.',
    recommendedAgentIds: [
      'specialized-wholesale-inventory-replenishment-planner',
      'specialized-supply-chain-strategist',
      'support-wholesale-order-fulfillment-coordinator',
    ],
    whyReason: 'Recommended because you selected inventory planning and stock replenishment.',
    canRead: ['On-hand stock levels', 'Allocated order lists', 'Supplier lead-time tables'],
    canPrepare: ['Reorder recommendations', 'Stockout risk warnings', 'Stock transfer plans'],
    cannotApprove: ['Purchase order placement', 'Supplier contract modifications', 'Stock write-offs'],
    requiresApproval: true,
  },
  {
    id: 'order-fulfillment',
    label: 'Order Fulfillment & Logistics',
    category: 'Prepare quotes and orders',
    description: 'Verify order allocations, validate shipping details, and draft packing plans.',
    recommendedAgentIds: [
      'support-wholesale-order-fulfillment-coordinator',
      'sales-wholesale-b2b-account-operations',
      'specialized-wholesale-inventory-replenishment-planner',
    ],
    whyReason: 'Recommended because you selected order fulfillment and delivery logistics.',
    canRead: ['Approved sales orders', 'Warehouse inventory records', 'Shipping instructions'],
    canPrepare: ['Pick/pack draft lists', 'Shipment staging summaries', 'Delivery update drafts'],
    cannotApprove: ['Inventory release', 'Freight carrier booking', 'Product substitutions'],
    requiresApproval: true,
  },
  {
    id: 'compliance-review',
    label: 'Compliance & Safety Review',
    category: 'Improve quality and compliance',
    description: 'Review operational evidence against regulatory rules and internal policies.',
    recommendedAgentIds: [
      'security-security-compliance-auditor',
      'security-security-architect',
      'support-support-legal-compliance-checker',
      'testing-testing-evidence-collector',
    ],
    whyReason: 'Recommended because you selected compliance and policy verification.',
    canRead: ['Standard operating procedures', 'Audit checklists', 'Activity logs'],
    canPrepare: ['Compliance check summaries', 'Gap analysis drafts', 'Policy verification logs'],
    cannotApprove: ['Regulatory sign-offs', 'Audit exemptions', 'Security overrides'],
    requiresApproval: true,
  },
  {
    id: 'bookkeeping',
    label: 'Bookkeeping & Invoicing Prep',
    category: 'Manage finances and documents',
    description: 'Reconcile transaction drafts, categorize receipts, and prepare invoice summaries.',
    recommendedAgentIds: [
      'finance-finance-bookkeeper-controller',
      'specialized-accounts-payable-agent',
      'finance-field-service-estimate-work-order-coordinator',
      'finance-finance-financial-analyst',
    ],
    whyReason: 'Recommended because you selected financial preparation and billing workflows.',
    canRead: ['Approved work order records', 'Vendor invoice drafts', 'Standard rate schedules'],
    canPrepare: ['Draft invoice summaries', 'Expense categorization sheets', 'Ledger pre-checks'],
    cannotApprove: ['Bank transfers', 'Tax submissions', 'Direct invoice issuance'],
    requiresApproval: true,
  },
];

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

