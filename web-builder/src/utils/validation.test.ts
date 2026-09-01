import { describe, expect, it } from 'vitest';
import type { Agent, CompanyInfo, MCPConnector, WorkflowItem } from '../types';
import { validateSwarm, inferProvider } from './validation';

describe('validateSwarm', () => {
  const validCompany: CompanyInfo = {
    name: 'Acme Advisory',
    industry: 'Legal Services',
    size: '25',
    description: 'Corporate law advisory',
    mission: 'Deliver audit-ready compliance analysis.',
    industryPath: 'legal',
    industryCode: '541110',
  };

  const validAgent: Agent = {
    id: 'review-agent',
    name: 'Review Agent',
    role: 'Reviewer',
    department: 'Legal Operations',
    description: 'Reviews compliance evidence.',
    status: 'idle',
    provider: 'google',
    model: 'gemini-pro-latest',
    prompt: 'Review evidence carefully according to corporate policy.',
    skills: ['read_file', 'search_web'],
    workflows: ['review'],
    mcpTools: [],
    requiresOversight: false,
  };

  const validWorkflow: WorkflowItem = {
    id: 'review',
    name: 'Review Process',
    description: '## Step 1: Inspection\nVerify that records meet policy standards.',
  };

  it('returns no blocking errors for a fully compliant swarm configuration', () => {
    const issues = validateSwarm(validCompany, [validAgent], [validWorkflow], [], []);
    const errors = issues.filter(i => i.severity === 'error');
    expect(errors.length).toBe(0);
  });

  it('correctly infers providers for standard models and rejects unknown models', () => {
    expect(inferProvider('gemini-1.5-flash')).toBe('google');
    expect(inferProvider('claude-3-5-sonnet')).toBe('anthropic');
    expect(inferProvider('gpt-4o')).toBe('openai');
    expect(inferProvider('o1-preview')).toBe('openai');
    expect(() => inferProvider('custom-unknown-model')).toThrow('Choose an explicit provider');
  });

  it('flags error for unknown model when provider is not explicitly set', () => {
    const unknownModelAgent: Agent = {
      ...validAgent,
      provider: undefined,
      model: 'custom-unrecognized-llm',
    };
    const issues = validateSwarm(validCompany, [unknownModelAgent], [validWorkflow], [], []);
    expect(issues.some(e => e.id.includes('agent-unknown-model'))).toBe(true);
  });

  it('detects missing company name and missing industry', () => {
    const issues = validateSwarm({ ...validCompany, name: '', industry: '' }, [validAgent], [validWorkflow], [], []);
    const errors = issues.filter(i => i.severity === 'error');
    expect(errors.some(e => e.id === 'identity-missing-name')).toBe(true);
    expect(errors.some(e => e.id === 'identity-missing-industry')).toBe(true);
  });

  it('detects empty agent roster', () => {
    const issues = validateSwarm(validCompany, [], [validWorkflow], [], []);
    expect(issues.some(e => e.id === 'agents-empty-roster')).toBe(true);
  });

  it('detects system prompts exceeding 800 characters', () => {
    const oversizedAgent: Agent = {
      ...validAgent,
      prompt: 'X'.repeat(801),
    };
    const issues = validateSwarm(validCompany, [oversizedAgent], [validWorkflow], [], []);
    expect(issues.some(e => e.id === `agent-prompt-too-long-${oversizedAgent.id}`)).toBe(true);
  });

  it('detects unsupported legacy capabilities and unrecognized skills', () => {
    const legacyAgent: Agent = {
      ...validAgent,
      skills: ['read_file', 'run_command'],
    };
    const issues = validateSwarm(validCompany, [legacyAgent], [validWorkflow], [], []);
    expect(issues.some(e => e.id.includes('agent-legacy-skill'))).toBe(true);

    const unrecognizedAgent: Agent = {
      ...validAgent,
      skills: ['read_file', 'non_existent_tool'],
    };
    const issues2 = validateSwarm(validCompany, [unrecognizedAgent], [validWorkflow], [], []);
    expect(issues2.some(e => e.id.includes('agent-unrecognized-skill'))).toBe(true);
  });

  it('detects unreferenced workflows in agents', () => {
    const danglingAgent: Agent = {
      ...validAgent,
      workflows: ['non-existent-workflow'],
    };
    const issues = validateSwarm(validCompany, [danglingAgent], [validWorkflow], [], []);
    expect(issues.some(e => e.id.includes('agent-missing-workflow'))).toBe(true);
  });

  it('warns when mutating capabilities are declared without manual oversight enabled', () => {
    const mutatingAgent: Agent = {
      ...validAgent,
      skills: ['read_file', 'write_file'],
      requiresOversight: false,
    };
    const issues = validateSwarm(validCompany, [mutatingAgent], [validWorkflow], [], []);
    expect(issues.some(e => e.id === `agent-forced-oversight-${mutatingAgent.id}`)).toBe(true);
  });

  it('detects missing mission and non-positive integer company size', () => {
    const issues = validateSwarm(
      { ...validCompany, mission: '', size: '0' },
      [validAgent],
      [validWorkflow],
      [],
      [],
    );
    expect(issues.some(e => e.id === 'identity-missing-mission')).toBe(true);
    expect(issues.some(e => e.id === 'identity-invalid-size')).toBe(true);
  });

  it('rejects MCP wildcard grants and unselected connector tool references', () => {
    const wildcardAgent: Agent = {
      ...validAgent,
      mcpTools: ['generic-crm:*'],
    };
    const mockMcpCatalog: MCPConnector[] = [{
      id: 'generic-crm',
      name: 'Generic CRM',
      category: 'Data',
      description: 'CRM connector',
      version: '2.0.0',
      path: 'connectors/generic-crm',
      tools: [{ id: 'generic-crm:get_crm_contact', name: 'Get Contact', description: 'desc', risk: 'read' as const }],
      config: { mcpServers: { 'generic-crm': { command: 'python', args: ['server.py'] } } },
    }];

    const issues = validateSwarm(validCompany, [wildcardAgent], [validWorkflow], ['generic-crm'], mockMcpCatalog);
    expect(issues.some(e => e.id.includes('agent-mcp-wildcard'))).toBe(true);

    const danglingAgent: Agent = {
      ...validAgent,
      mcpTools: ['smb-accounting:get_invoice'],
    };
    const issues2 = validateSwarm(validCompany, [danglingAgent], [validWorkflow], ['generic-crm'], mockMcpCatalog);
    expect(issues2.some(e => e.id.includes('agent-mcp-dangling'))).toBe(true);
  });

  it('detects active connectors with no authorized agent grants', () => {
    const mockMcpCatalog: MCPConnector[] = [{
      id: 'generic-crm',
      name: 'Generic CRM',
      category: 'Data',
      description: 'CRM connector',
      version: '2.0.0',
      path: 'connectors/generic-crm',
      tools: [{ id: 'generic-crm:get_crm_contact', name: 'Get Contact', description: 'desc', risk: 'read' as const }],
      config: { mcpServers: { 'generic-crm': { command: 'python', args: ['server.py'] } } },
    }];

    // Agent has no mcpTools
    const issues = validateSwarm(validCompany, [validAgent], [validWorkflow], ['generic-crm'], mockMcpCatalog);
    expect(issues.some(e => e.id === 'connector-no-grants-generic-crm')).toBe(true);
  });

  it('rejects agents referencing OKF playbooks as execution workflows', () => {
    const okfWorkflow: WorkflowItem = {
      id: 'iso-playbook',
      name: 'ISO Playbook',
      description: 'Compliance playbook content',
      isOkfPlaybook: true,
    };
    const agentReferencingOkf: Agent = {
      ...validAgent,
      workflows: ['iso-playbook'],
    };
    const issues = validateSwarm(validCompany, [agentReferencingOkf], [okfWorkflow], [], []);
    expect(issues.some(e => e.id.includes('agent-okf-workflow'))).toBe(true);
  });

  it('surfaces an info notice for sample connectors simulating mock responses', () => {
    const mockMcpCatalog: MCPConnector[] = [{
      id: 'mcp-generic-crm',
      name: 'Generic CRM Mock',
      category: 'Data',
      description: 'Mock CRM connector',
      version: '2.0.0',
      path: 'connectors/generic-crm',
      status: 'sample',
      tools: [{ id: 'generic-crm:get_contact', name: 'Get Contact', description: 'desc', risk: 'read' as const }],
      config: { mcpServers: { 'generic-crm': { command: 'python', args: ['server.py'] } } },
    }];

    const agentWithGrant: Agent = {
      ...validAgent,
      mcpTools: ['generic-crm:get_contact'],
    };

    const issues = validateSwarm(validCompany, [agentWithGrant], [validWorkflow], ['mcp-generic-crm'], mockMcpCatalog);
    expect(issues.some(e => e.id === 'connector-sample-mcp-generic-crm' && e.severity === 'info')).toBe(true);
  });
});
