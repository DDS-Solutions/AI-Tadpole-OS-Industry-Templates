import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it, vi } from 'vitest';
import type { Agent, CompanyInfo, MCPConnector } from '../types';
import AgentEditor from './Modals/AgentEditor';
import Step4_GuidedReview from './Guided/Step4_GuidedReview';
import Step5_Forge from './Steps/Step5_Forge';

describe('AgentEditor and Swarm Disclosure UI', () => {
  const companyInfo: CompanyInfo = {
    name: 'Northstar Ops',
    size: '25',
    description: 'Operations firm',
    mission: 'Coordinate regional service dispatch.',
    industry: 'Field Services',
    industryPath: 'field-services',
    industryCode: '238210',
  };

  const director: Agent = {
    id: 'ops-director',
    name: 'Ops Director',
    role: 'Director',
    model: 'gemma4:31b-cloud',
    provider: 'ollama-cloud',
    supervisor: null,
    priority: 'critical',
    prompt: 'Coordinate specialist dispatch schedules.',
    skills: ['read_file'],
    mcpTools: [],
    requiresOversight: false,
  };

  const specialist: Agent = {
    id: 'field-tech',
    name: 'Field Coordinator',
    role: 'Coordinator',
    model: 'gemma4:e4b',
    provider: 'ollama',
    supervisor: 'ops-director',
    priority: 'high',
    prompt: 'Prepare work order drafts and route tickets.',
    skills: ['read_file', 'write_file'],
    mcpTools: ['crm:update'],
    requiresOversight: true,
  };

  const catalog: MCPConnector[] = [
    {
      id: 'mcp-crm',
      name: 'CRM Connector',
      category: 'CRM',
      description: 'CRM API',
      version: '1.0.0',
      path: 'mcp-blueprints/crm',
      status: 'verified',
      required_env: { CRM_TOKEN: { description: 'Token' } },
      tools: [{ id: 'crm:update', name: 'Update', description: 'Write record', risk: 'write' }],
      config: { mcpServers: { crm: { command: 'python', args: ['server.py'] } } },
    },
  ];

  it('renders supervisor hierarchy and priority controls inside AgentEditor', () => {
    const html = renderToStaticMarkup(
      <AgentEditor
        agent={specialist}
        rosterAgents={[director, specialist]}
        onSave={vi.fn()}
        onClose={vi.fn()}
      />,
    );

    expect(html).toContain('Supervisor (DAG Coordinator)');
    expect(html).toContain('Ops Director (ops-director)');
    expect(html).toContain('critical');
  });

  it('renders "What This Swarm Can Do" disclosure and stdio skills note in Step4_GuidedReview and Step5_Forge', () => {
    const guidedHtml = renderToStaticMarkup(
      <Step4_GuidedReview
        companyInfo={companyInfo}
        agents={[director, specialist]}
        workflows={[]}
        selectedConnectors={['mcp-crm']}
        mcpCatalog={catalog}
        validationIssues={[]}
        isExporting={false}
        onExport={vi.fn()}
        onSaveDraft={() => true}
        onSwitchToAdvanced={vi.fn()}
        onStartOver={vi.fn()}
        onBack={vi.fn()}
        onJumpToStep={vi.fn()}
      />,
    );
    expect(guidedHtml).toContain('What This Swarm Can Do');
    expect(guidedHtml).toContain('1 of 2 Require Oversight');
    expect(guidedHtml).toContain('crm:update');
    expect(guidedHtml).toContain('CRM_TOKEN');
    expect(guidedHtml).toContain('skills/*-server.py');

    const forgeHtml = renderToStaticMarkup(
      <Step5_Forge
        companyInfo={companyInfo}
        agents={[director, specialist]}
        workflows={[]}
        selectedConnectors={['mcp-crm']}
        mcpCatalog={catalog}
        validationIssues={[]}
        isExporting={false}
        onExport={vi.fn()}
        onPrevious={vi.fn()}
        onReset={vi.fn()}
      />,
    );
    expect(forgeHtml).toContain('What This Swarm Can Do');
    expect(forgeHtml).toContain('skills/*-server.py');
    expect(forgeHtml).toContain('crm:update');
    expect(forgeHtml).toContain('CRM_TOKEN');
  });

  it('enforces DESIGN.md tooltip focus rules, semantic HTML body class, and zero pure-black surfaces', () => {
    const htmlDoc = readFileSync(resolve(process.cwd(), 'index.html'), 'utf-8');
    expect(htmlDoc).toContain('<body class="bg-zinc-950 text-zinc-100 antialiased">');
    expect(htmlDoc).not.toContain('className=');

    const cssDoc = readFileSync(resolve(process.cwd(), 'src/index.css'), 'utf-8');
    expect(cssDoc).toContain('[data-tooltip]:focus-visible::before');
    expect(cssDoc).toContain('.tooltip-bottom[data-tooltip]:focus-visible::before');
    expect(cssDoc).toContain('.tooltip-right[data-tooltip]:focus-visible::before');
    expect(cssDoc).toContain('.tooltip-left[data-tooltip]:focus-visible::before');
    expect(cssDoc).not.toMatch(/#000000\b|#000\b|bg-black/);

    const editorHtml = renderToStaticMarkup(
      <AgentEditor
        agent={specialist}
        rosterAgents={[director, specialist]}
        onSave={vi.fn()}
        onClose={vi.fn()}
      />,
    );
    expect(editorHtml).toContain('data-tooltip=');
    expect(editorHtml).toContain('focus-sovereign');
    expect(editorHtml).not.toContain('bg-black');
  });
});
