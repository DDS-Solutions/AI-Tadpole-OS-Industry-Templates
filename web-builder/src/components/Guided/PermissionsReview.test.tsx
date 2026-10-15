import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it, vi } from 'vitest';
import type { Agent, CompanyInfo, MCPConnector } from '../../types';
import { validateSwarm } from '../../utils/validation';
import Step2_TeamRecommendations from './Step2_TeamRecommendations';
import Step4_GuidedReview from './Step4_GuidedReview';

const companyInfo: CompanyInfo = {
  name: 'Apex Operations', size: '25', description: 'Operations team',
  mission: 'Improve operational planning', industry: 'Field Services',
  industryPath: 'field-services', industryCode: '238210',
};

const readAgent: Agent = {
  id: 'planner', name: 'Operations Planner', role: 'Planner',
  model: 'gemma4:31b', provider: 'google', prompt: 'Prepare operating plans.',
  skills: ['read_file'], requiresOversight: false,
};

function renderTeam(agent: Agent, mcpCatalog: MCPConnector[] = []) {
  return renderToStaticMarkup(<Step2_TeamRecommendations
    agents={[agent]} recommendedSpecialists={[]} mcpCatalog={mcpCatalog}
    onAddSpecialistFromCatalog={vi.fn()} onRemoveAgent={vi.fn()} onBack={vi.fn()} onNext={vi.fn()}
  />);
}

function renderReview(agent: Agent, mcpCatalog: MCPConnector[] = []) {
  const selectedConnectors = mcpCatalog.map(connector => connector.id);
  return renderToStaticMarkup(<Step4_GuidedReview
    companyInfo={companyInfo} agents={[agent]} workflows={[]}
    selectedConnectors={selectedConnectors} mcpCatalog={mcpCatalog}
    validationIssues={validateSwarm(companyInfo, [agent], [], selectedConnectors, mcpCatalog)}
    isExporting={false} onExport={vi.fn()} onSaveDraft={() => false}
    onSwitchToAdvanced={vi.fn()} onStartOver={vi.fn()} onBack={vi.fn()} onJumpToStep={vi.fn()}
  />);
}

describe('guided permission summaries', () => {
  it.each(['write_file', 'delete_file', 'execute_shell'])('shows required oversight for %s even when its flag is false', skill => {
    const agent = { ...readAgent, skills: [skill] };
    const team = renderTeam(agent);
    const review = renderReview(agent);

    expect(team).toContain('Human Approval Required');
    expect(review).toContain('1 of 1 Require Oversight');
    expect(team).not.toMatch(/Read.only Capabilities/i);
    expect(review).not.toMatch(/Read.only Capabilities/i);
    expect(review).not.toContain('All specialists operate in safe read-only draft mode');
  });

  it('labels verified read-only capabilities without promising enforced approval', () => {
    expect(renderTeam(readAgent)).toContain('Read-only Capabilities');
    expect(renderTeam(readAgent)).not.toContain('Human Approval Required');
    expect(renderReview(readAgent)).toContain('declare only read-only capabilities and tool grants');
  });

  it('requires a permission review for an unresolved tool grant', () => {
    const agent = { ...readAgent, mcpTools: ['unknown:tool'] };
    expect(renderTeam(agent)).toContain('Review Tool Permissions');
    expect(renderReview(agent)).toContain('Permissions Need Review');
    expect(renderReview(agent)).not.toMatch(/Read.only Capabilities/i);
  });

  it('shows required oversight for a mutating MCP grant with its oversight flag disabled', () => {
    const catalog: MCPConnector[] = [{
      id: 'crm', name: 'CRM', description: 'Customer records', category: 'CRM',
      version: '1', path: 'mcp-blueprints/crm',
      tools: [{ id: 'crm:update', name: 'update', description: 'Update a record', risk: 'write' }],
    }];
    const agent = { ...readAgent, mcpTools: ['crm:update'] };
    expect(renderTeam(agent, catalog)).toContain('Human Approval Required');
    expect(renderReview(agent, catalog)).toContain('1 of 1 Require Oversight');
    expect(renderReview(agent, catalog)).not.toMatch(/Read.only Capabilities/i);
  });
});
