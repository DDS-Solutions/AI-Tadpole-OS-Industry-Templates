import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it, vi } from 'vitest';
import type { Agent, ValidationIssue } from '../../types';
import Step5_Forge from './Step5_Forge';

const agent: Agent = {
  id: 'reviewer',
  name: 'Reviewer',
  role: 'Quality Reviewer',
  model: 'gemma4:31b',
  prompt: 'Review approved records and prepare a factual report for human review.',
  skills: ['read_file'],
  workflows: [],
  mcpTools: [],
  requiresOversight: false,
};

const renderForge = (validationIssues: ValidationIssue[], isExporting = false) => renderToStaticMarkup(
  <Step5_Forge
    companyInfo={{ name: 'Acme' }}
    agents={[agent]}
    workflows={[]}
    validationIssues={validationIssues}
    isExporting={isExporting}
    onExport={vi.fn()}
    onPrevious={vi.fn()}
    onReset={vi.fn()}
  />,
);

describe('Advanced export validation gate', () => {
  it('disables export and surfaces the first blocking error', () => {
    const html = renderForge([{
      id: 'identity-missing-industry',
      severity: 'error',
      section: 'identity',
      message: 'Industry sector is required.',
    }]);

    expect(html).toContain('1 blocking validation error');
    expect(html).toContain('Industry sector is required.');
    expect(html).toMatch(/<button[^>]*disabled=""[^>]*>[\s\S]*?Export Swarm Archive/);
  });

  it('enables export when no blocking validation issues remain', () => {
    const html = renderForge([]);

    expect(html).toContain('Contract validation passed');
    expect(html).not.toContain('disabled=""');
  });

  it('prevents duplicate exports while packaging is in progress', () => {
    const html = renderForge([], true);

    expect(html).toContain('Packaging Swarm...');
    expect(html).toContain('disabled=""');
  });

  it('separates standard workflows and OKF knowledge playbooks in the manifest', () => {
    const html = renderToStaticMarkup(
      <Step5_Forge
        companyInfo={{ name: 'Acme' }}
        agents={[agent]}
        workflows={[
          { id: 'triage', name: 'Triage', description: 'Standard workflow' },
          { id: 'kb-policy', name: 'Policy KB', description: 'Knowledge item', isOkfPlaybook: true },
        ]}
        validationIssues={[]}
        isExporting={false}
        onExport={vi.fn()}
        onPrevious={vi.fn()}
        onReset={vi.fn()}
      />,
    );

    expect(html).toContain('agents/ (1 file)');
    expect(html).toContain('workflows/ (1 file)');
    expect(html).toContain('knowledge/ (1 playbook + knowledge.json)');
  });
});
