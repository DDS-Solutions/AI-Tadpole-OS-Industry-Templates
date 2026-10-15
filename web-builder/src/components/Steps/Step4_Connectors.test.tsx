import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it, vi } from 'vitest';
import type { MCPConnector } from '../../types';
import Step4_Connectors from './Step4_Connectors';

const customConnector: MCPConnector = {
  id: 'custom-crm',
  name: 'Custom CRM',
  description: 'A saved connector blueprint.',
  category: 'CRM',
  path: 'mcp-blueprints/custom-crm',
  version: '1.0.0',
};

const configuredConnector: MCPConnector = {
  ...customConnector,
  config: { mcpServers: { crm: { url: 'https://example.com/mcp' } } },
  tools: [{ id: 'crm:get_contact', name: 'Get contact', description: 'Read a contact.', risk: 'read' }],
};

function renderConnector(connector: MCPConnector, selected = false) {
  return renderToStaticMarkup(
    <Step4_Connectors
      mcpCatalog={[connector]}
      selectedConnectors={selected ? [connector.id] : []}
      setSelectedConnectors={vi.fn()}
      onAddNewMcp={vi.fn()}
      onEditMcp={vi.fn()}
      onDeleteMcp={vi.fn()}
      onPrevious={vi.fn()}
      onNext={vi.fn()}
    />,
  );
}

function button(markup: string, label: string) {
  const openingTag = markup.match(new RegExp(`<button[^>]*aria-label="${label}"[^>]*>`))?.[0];
  expect(openingTag).toBeDefined();
  return openingTag!;
}

describe('connector selection readiness', () => {
  it.each([
    customConnector,
    { ...configuredConnector, config: undefined },
    { ...configuredConnector, tools: [] },
    { ...configuredConnector, config: { mcpServers: {} } },
  ])('explains and blocks selection when a runtime definition is incomplete', connector => {
    const markup = renderConnector(connector);

    expect(button(markup, 'Select Custom CRM')).toContain('disabled=""');
    expect(button(markup, 'Edit Custom CRM')).not.toMatch(/\sdisabled(?:=|\s|>)/);
    expect(markup).toContain('Requires runtime configuration');
    expect(markup).toContain('Package checks run again at export.');
  });

  it.each(['verified', 'reviewed', 'sample'] as const)('keeps a configured %s registry connector selectable', status => {
    const markup = renderConnector({ ...configuredConnector, status });

    expect(button(markup, 'Select Custom CRM')).not.toMatch(/\sdisabled(?:=|\s|>)/);
  });

  it('leaves an unsupported saved selection removable and editable', () => {
    const markup = renderConnector(customConnector, true);

    expect(button(markup, 'Deselect Custom CRM')).not.toMatch(/\sdisabled(?:=|\s|>)/);
    expect(button(markup, 'Edit Custom CRM')).not.toMatch(/\sdisabled(?:=|\s|>)/);
    expect(markup).toContain('Deselect it before export.');
  });

  it('blocks a quarantined connector while allowing an existing selection to be removed', () => {
    const connector = { ...configuredConnector, status: 'quarantined' as const };

    expect(button(renderConnector(connector), 'Select Custom CRM')).toContain('disabled=""');
    expect(button(renderConnector(connector, true), 'Deselect Custom CRM')).not.toMatch(/\sdisabled(?:=|\s|>)/);
  });
});
