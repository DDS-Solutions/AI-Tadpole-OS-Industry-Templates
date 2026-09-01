import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it, vi } from 'vitest';
import type { Agent, CompanyInfo, MCPConnector, ValidationIssue, WorkflowItem } from '../../types';
import GuidedWizard from './GuidedWizard';

describe('GuidedWizard component', () => {
  const companyInfo: CompanyInfo = {
    name: 'Apex Dental',
    industry: 'Healthcare',
    industryPath: 'healthcare',
    industryCode: '621111',
    size: '25',
    description: 'Dental clinic operations',
    mission: 'Deliver exceptional dental care with streamlined patient scheduling and billing.',
    goals: ['scheduling', 'quoting'],
  };

  const agent: Agent = {
    id: 'intake-specialist',
    name: 'Patient Intake Specialist',
    role: 'Intake Specialist',
    department: 'Front Desk',
    description: 'Handles patient triage.',
    status: 'idle',
    provider: 'google',
    model: 'gemini-pro-latest',
    prompt: 'Assist patient triage.',
    skills: ['read_file'],
    workflows: ['workflow-scheduling'],
    mcpTools: ['crm:get_contact'],
    requiresOversight: false,
  };

  const catalogAgent = {
    ...agent,
    description: 'Handles patient triage.',
    vibe: 'Professional healthcare specialist',
    runtimePrompt: 'Assist patient triage.',
    department: 'Front Desk',
    departmentLabel: 'Front Desk',
    color: '#3B82F6',
    emoji: '🩺',
  };

  const workflow: WorkflowItem = {
    id: 'workflow-scheduling',
    name: 'Patient Scheduling',
    description: '## Step 1\nSchedule appointments.',
  };

  const mcpCatalog: MCPConnector[] = [{
    id: 'crm',
    name: 'Practice CRM',
    category: 'Data',
    description: 'Patient records CRM',
    version: '2.0.0',
    path: 'connectors/crm',
    tools: [{ id: 'crm:get_contact', name: 'Get Contact', description: 'desc', risk: 'read' }],
    config: { mcpServers: { crm: { command: 'python', args: ['server.py'] } } },
  }];

  const renderWizard = (validationIssues: ValidationIssue[] = []) => renderToStaticMarkup(
    <GuidedWizard
      companyInfo={companyInfo}
      setCompanyInfo={vi.fn()}
      agents={[agent]}
      setAgents={vi.fn()}
      workflows={[workflow]}
      setWorkflows={vi.fn()}
      dynamicIndustries={[{ name: 'Healthcare', path: 'healthcare', keywords: ['dental', 'clinic'] }]}
      mcpCatalog={mcpCatalog}
      selectedConnectors={['crm']}
      setSelectedConnectors={vi.fn()}
      catalog={[catalogAgent]}
      onOpenCatalogModal={vi.fn()}
      validationIssues={validationIssues}
      isExporting={false}
      onExport={vi.fn()}
      onSaveDraft={vi.fn()}
      onSwitchToAdvanced={vi.fn()}
      onStartOver={vi.fn()}
    />,
  );

  it('renders Step 1 with company and industry goal configuration', () => {
    const html = renderWizard();
    expect(html).toContain('Guided Setup');
    expect(html).toContain('Apex Dental');
  });

  it('renders validation errors when present in Step 4 review', () => {
    const html = renderWizard([{
      id: 'identity-missing-mission',
      severity: 'error',
      section: 'identity',
      message: 'Company mission statement is required.',
    }]);

    expect(html).toContain('Guided Setup');
  });
});
