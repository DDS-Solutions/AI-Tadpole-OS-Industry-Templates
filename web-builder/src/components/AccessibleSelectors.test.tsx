import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it, vi } from 'vitest';
import type { CompanyInfo, MCPConnector } from '../types';
import Step1_BusinessBrief from './Guided/Step1_BusinessBrief';
import Step4_Connectors from './Steps/Step4_Connectors';

const companyInfo: CompanyInfo = {
  name: 'Apex Services',
  size: '25',
  description: 'Field services business.',
  mission: 'Improve scheduling and customer response.',
  industry: 'Field Services',
  industryPath: 'field-services',
  industryCode: 'NAICS 561210',
  goals: ['scheduling'],
};

describe('keyboard-operable card selectors', () => {
  it('renders business goals as buttons with their selected state exposed', () => {
    const html = renderToStaticMarkup(
      <Step1_BusinessBrief
        companyInfo={companyInfo}
        setCompanyInfo={vi.fn()}
        dynamicIndustries={[{
          name: 'Field Services',
          path: 'field-services',
          keywords: ['field', 'service'],
        }]}
        onRecommendTeam={vi.fn()}
      />,
    );

    expect(html).toMatch(/<button[^>]*aria-pressed="true"[^>]*>[\s\S]*?Scheduling/);
  });

  it('renders connector selection as a button separate from edit and delete actions', () => {
    const connector: MCPConnector = {
      id: 'crm',
      name: 'CRM Connector',
      description: 'Reads approved customer records.',
      category: 'CRM',
      path: 'mcp-blueprints/generic-crm',
      version: '1.0.0',
    };
    const html = renderToStaticMarkup(
      <Step4_Connectors
        mcpCatalog={[connector]}
        selectedConnectors={[connector.id]}
        setSelectedConnectors={vi.fn()}
        onAddNewMcp={vi.fn()}
        onEditMcp={vi.fn()}
        onDeleteMcp={vi.fn()}
        onPrevious={vi.fn()}
        onNext={vi.fn()}
      />,
    );

    expect(html).toMatch(/<button[^>]*aria-pressed="true"[^>]*>[\s\S]*?CRM Connector/);
    expect(html).toMatch(/<\/button>[\s\S]*?<button[^>]*>[\s\S]*?Edit/);
  });
});
