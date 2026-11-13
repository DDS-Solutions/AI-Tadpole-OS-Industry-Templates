import { describe, expect, it } from 'vitest';
import type { Agent } from '../types';
import { createInitialState, swarmReducer } from './swarmBuilderStore';

describe('swarmReducer', () => {
  it('updates fields, company info, and agent roster immutably and resets cleanly', () => {
    const initial = createInitialState();
    expect(initial.experienceMode).toBe('guided');
    expect(initial.companyInfo.size).toBe('25');

    const withMode = swarmReducer(initial, { type: 'SET_FIELD', key: 'experienceMode', value: 'advanced' });
    expect(withMode.experienceMode).toBe('advanced');

    const withCompany = swarmReducer(withMode, {
      type: 'UPDATE_COMPANY_INFO',
      updater: prev => ({ ...prev, name: 'Harbor Logistics', industry: 'Transportation & Logistics' }),
    });
    expect(withCompany.companyInfo.name).toBe('Harbor Logistics');

    const agent: Agent = {
      id: 'dispatch-lead',
      name: 'Dispatch Lead',
      role: 'Coordinator',
      model: 'gemma4:31b-cloud',
      provider: 'ollama-cloud',
      supervisor: null,
      priority: 'critical',
      prompt: 'Coordinate daily routes.',
      skills: ['read_file'],
      requiresOversight: false,
    };
    const withAgent = swarmReducer(withCompany, { type: 'UPDATE_AGENTS', updater: prev => [...prev, agent] });
    expect(withAgent.agents).toHaveLength(1);
    expect(withAgent.agents[0].id).toBe('dispatch-lead');

    const reset = swarmReducer(withAgent, { type: 'RESET_BLUEPRINT' });
    expect(reset.agents).toEqual([]);
    expect(reset.workflows).toEqual([]);
    expect(reset.selectedConnectors).toEqual([]);
    expect(reset.companyInfo.name).toBe('');
    expect(reset.hasSelectedMode).toBe(false);
    expect(reset.step).toBe(1);
  });
});

