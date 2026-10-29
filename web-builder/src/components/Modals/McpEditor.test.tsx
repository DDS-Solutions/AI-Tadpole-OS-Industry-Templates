import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it, vi } from 'vitest';
import type { MCPConnector } from '../../types';
import McpEditor from './McpEditor';

const sampleConnector: MCPConnector = {
  id: 'custom-crm',
  name: 'Custom CRM',
  description: 'CRM Blueprint.',
  category: 'CRM',
  path: 'mcp-blueprints/custom-crm',
  version: '1.0.0',
};

describe('McpEditor modal', () => {
  it('renders fields for connector metadata and optional remote endpoint', () => {
    const html = renderToStaticMarkup(
      <McpEditor
        connector={sampleConnector}
        onClose={vi.fn()}
        onSave={vi.fn()}
      />,
    );

    expect(html).toContain('Configure MCP Data Connector');
    expect(html).toContain('Connector Name');
    expect(html).toContain('Remote MCP Server Configuration');
    expect(html).toContain('Remote Streamable MCP URL');
  });

  it('renders secret variable and authorization inputs when a remote URL is present', () => {
    const configuredConnector: MCPConnector = {
      ...sampleConnector,
      config: {
        mcpServers: {
          'custom-crm': {
            url: 'https://api.crm.internal/mcp',
            headers: {
              Authorization: 'Bearer ${CRM_API_TOKEN}',
            },
          },
        },
      },
      required_env: {
        CRM_API_TOKEN: {
          description: 'API key',
          placeholder: 'YOUR_API_KEY_HERE',
        },
      },
    };

    const html = renderToStaticMarkup(
      <McpEditor
        connector={configuredConnector}
        onClose={vi.fn()}
        onSave={vi.fn()}
      />,
    );

    expect(html).toContain('https://api.crm.internal/mcp');
    expect(html).toContain('Credential Var Name');
    expect(html).toContain('CRM_API_TOKEN');
  });
});

