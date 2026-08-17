import { describe, expect, it } from 'vitest';
import type { CatalogAgent } from '../types';
import { catalogAgentToRuntimeAgent, recommendTeam, BUSINESS_GOALS } from './catalogHelpers';

describe('catalogHelpers', () => {
  const sampleCatalogAgent: CatalogAgent = {
    id: 'project-management-field-service-dispatch-coordinator',
    name: 'Field Service Dispatch Coordinator',
    role: 'Field Service Dispatch Coordinator',
    description: 'Triages service requests and prepares technician schedules.',
    color: 'purple',
    emoji: '🚐',
    vibe: 'Gets the right technician to the right job.',
    prompt: '# Full persona doc\n' + 'A'.repeat(5000),
    runtimePrompt: 'You coordinate daily field-service dispatch for a small business. Triage requests by urgency and location. Require a person to approve assignments.',
    department: 'project-management',
    departmentLabel: 'Project Management',
  };

  const sampleQuoteAgent: CatalogAgent = {
    id: 'finance-field-service-estimate-work-order-coordinator',
    name: 'Estimate & Work Order Coordinator',
    role: 'Estimate and Work Order Coordinator',
    description: 'Prepares draft estimates and work orders.',
    color: 'green',
    emoji: '🧾',
    vibe: 'Turns service details into clear work orders.',
    prompt: 'Full prompt doc',
    runtimePrompt: 'You prepare draft estimates and work orders. Require approval before a quote is issued.',
    department: 'finance',
    departmentLabel: 'Finance',
  };

  const sampleCareAgent: CatalogAgent = {
    id: 'support-field-service-customer-care-coordinator',
    name: 'Customer Care Coordinator',
    role: 'Customer Care Coordinator',
    description: 'Coordinates customer follow-ups and service updates.',
    color: 'blue',
    emoji: '📞',
    vibe: 'Keeps customers informed.',
    prompt: 'Full prompt doc',
    runtimePrompt: 'You coordinate customer follow-ups and care. Require approval before sending external messages.',
    department: 'support',
    departmentLabel: 'Support',
  };

  it('converts catalog agent to runtime agent adhering to Tadpole OS constraints', () => {
    const runtimeAgent = catalogAgentToRuntimeAgent(sampleCatalogAgent);
    expect(runtimeAgent.id).toBe('project-management-field-service-dispatch-coordinator');
    expect(runtimeAgent.name).toBe('Field Service Dispatch Coordinator');
    expect(runtimeAgent.status).toBe('idle');
    expect(runtimeAgent.provider).toBe('google');
    expect(runtimeAgent.model).toBe('gemini-pro-latest');
    expect(runtimeAgent.prompt).toBe(sampleCatalogAgent.runtimePrompt);
    expect(runtimeAgent.prompt.length).toBeLessThanOrEqual(800);
    expect(runtimeAgent.skills).toEqual(['read_file']);
    expect(runtimeAgent.requiresOversight).toBe(false);
  });

  it('rejects oversized prompts rather than silently truncating them', () => {
    const invalidAgent: CatalogAgent = {
      ...sampleCatalogAgent,
      runtimePrompt: 'A'.repeat(850),
    };
    expect(() => catalogAgentToRuntimeAgent(invalidAgent)).toThrow('exceeds 800 characters');
  });

  it('forces requiresOversight when dangerous skills are assigned', () => {
    const runtimeAgent = catalogAgentToRuntimeAgent(sampleCatalogAgent, {
      skills: ['read_file', 'write_file'],
    });
    expect(runtimeAgent.requiresOversight).toBe(true);
  });

  it('uses round-robin distribution across multiple chosen business goals', () => {
    const catalog: CatalogAgent[] = [sampleCatalogAgent, sampleQuoteAgent, sampleCareAgent];

    const recommendations = recommendTeam(['scheduling', 'quoting', 'customer-follow-up'], 'Field Services', '25', catalog);
    expect(recommendations.length).toBe(3);
    const agentIds = recommendations.map(r => r.agent.id);
    expect(agentIds).toContain('project-management-field-service-dispatch-coordinator');
    expect(agentIds).toContain('finance-field-service-estimate-work-order-coordinator');
    expect(agentIds).toContain('support-field-service-customer-care-coordinator');
  });

  it('scales recommendation capacity based on company size', () => {
    const catalog: CatalogAgent[] = [
      sampleCatalogAgent,
      sampleQuoteAgent,
      sampleCareAgent,
      {
        id: 'specialized-wholesale-inventory-replenishment-planner',
        name: 'Inventory Planner',
        role: 'Inventory Planner',
        description: 'Plans inventory.',
        vibe: 'Calculates stock needs.',
        color: 'orange',
        emoji: '📦',
        department: 'specialized',
        departmentLabel: 'Specialized',
        prompt: 'prompt',
        runtimePrompt: 'Plan inventory with approval.',
      },
      {
        id: 'security-security-compliance-auditor',
        name: 'Compliance Auditor',
        role: 'Compliance Auditor',
        description: 'Audits compliance.',
        vibe: 'Verifies rules.',
        color: 'red',
        emoji: '🛡️',
        department: 'security',
        departmentLabel: 'Security',
        prompt: 'prompt',
        runtimePrompt: 'Audit compliance with approval.',
      },
    ];

    const smallTeam = recommendTeam(['scheduling', 'quoting', 'inventory'], 'Field Services', '5', catalog);
    expect(smallTeam.length).toBe(3);

    const midTeam = recommendTeam(['scheduling', 'quoting', 'inventory', 'compliance-review'], 'Field Services', '25', catalog);
    expect(midTeam.length).toBe(4);

    const largeTeam = recommendTeam(['scheduling', 'quoting', 'inventory', 'compliance-review', 'customer-follow-up'], 'Field Services', '100', catalog);
    expect(largeTeam.length).toBe(5);
  });

  it('provides comprehensive business goal definitions with actionable categories', () => {
    expect(BUSINESS_GOALS.length).toBeGreaterThanOrEqual(7);
    for (const goal of BUSINESS_GOALS) {
      expect(goal.id).toBeDefined();
      expect(goal.label).toBeDefined();
      expect(goal.category).toBeDefined();
      expect(goal.recommendedAgentIds.length).toBeGreaterThan(0);
    }
  });
});
