import { useCallback, useEffect, useMemo, useReducer, useRef, type ReactNode } from 'react';
import type {
  Agent,
  CatalogAgent,
  CompanyInfo,
  ExperienceMode,
  MCPConnector,
  TemplateItem,
  WorkflowItem,
} from '../types';
import { INDUSTRY_MAP, INDUSTRY_CODES_MAP } from '../constants';
import { DEFAULT_MODEL_SLOTS } from '../constants/_generatedContract';
import { exportSwarmZip, fetchSwarmDetailsFromRepo } from '../utils/fileHelpers';
import { catalogAgentToRuntimeAgent, generateDefaultMission, generateGoalWorkflows, recommendTeam } from '../utils/catalogHelpers';
import { validateSwarm } from '../utils/validation';
import { clearDraft, loadDraft, restoreDraftConnectors, saveDraft } from '../utils/draftStorage';
import {
  createInitialState,
  scrollToWorkspace,
  SwarmBuilderContext,
  swarmReducer,
  type StateUpdater,
  type SwarmBuilderContextValue,
  type SwarmBuilderState,
} from './swarmBuilderStore';

export function SwarmBuilderProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(swarmReducer, undefined, createInitialState);
  const swarmRequestController = useRef<AbortController | null>(null);
  const swarmRequestSequence = useRef(0);
  const workspaceRef = useRef<HTMLElement>(null);

  const setField = useCallback(<K extends keyof SwarmBuilderState>(key: K, value: SwarmBuilderState[K]) => {
    dispatch({ type: 'SET_FIELD', key, value });
  }, []);

  const setCompanyInfo = useCallback((updater: StateUpdater<CompanyInfo>) => {
    dispatch({ type: 'UPDATE_COMPANY_INFO', updater });
  }, []);

  const setAgents = useCallback((updater: StateUpdater<Agent[]>) => {
    dispatch({ type: 'UPDATE_AGENTS', updater });
  }, []);

  const setWorkflows = useCallback((updater: StateUpdater<WorkflowItem[]>) => {
    dispatch({ type: 'UPDATE_WORKFLOWS', updater });
  }, []);

  const setSelectedConnectors = useCallback((updater: StateUpdater<string[]>) => {
    dispatch({ type: 'UPDATE_SELECTED_CONNECTORS', updater });
  }, []);

  useEffect(() => {
    if (state.hasSelectedMode || state.showTemplatesLibrary) {
      workspaceRef.current?.focus({ preventScroll: true });
    }
  }, [state.hasSelectedMode, state.showTemplatesLibrary, state.experienceMode, state.step, state.guidedStep]);

  useEffect(() => {
    const controller = new AbortController();
    fetch('./registry.json', { signal: controller.signal })
      .then(res => res.json())
      .then(data => {
        if (data && data.industries) {
          const registryIndustries = data.industries.map((name: string) => {
            const existing = INDUSTRY_MAP.find(i => i.name === name);
            return {
              name,
              path: existing?.path || name.toLowerCase().replace(/ & /g, '-').replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, ''),
              keywords: existing?.keywords || name.toLowerCase().split(/\s+/),
            };
          });
          setField('dynamicIndustries', registryIndustries);
        }
        if (data && data.templates) {
          const registryTemplates = data.templates
            .filter((t: TemplateItem) => !t.internal)
            .map((t: TemplateItem) => ({
              id: t.id,
              name: t.name,
              description: t.description || '',
              industry: t.industry,
              path: t.path,
              tags: t.tags || [],
              company_size: t.company_size,
              maturity: t.maturity,
              internal: t.internal,
              content_sha256: t.content_sha256,
            }));
          setField('dynamicRegistry', registryTemplates);
        }
      })
      .catch(err => {
        if (err.name !== 'AbortError') console.error('Error loading registry.json:', err);
      });

    fetch('./mcp_registry.json', { signal: controller.signal })
      .then(res => {
        if (!res.ok) throw new Error('Business connections could not be loaded. Please retry.');
        return res.json();
      })
      .then(data => {
        if (!data || !Array.isArray(data.connectors)) {
          throw new Error('The connections catalog is unavailable. Please retry.');
        }
        dispatch({
          type: 'UPDATE_MCP_CATALOG',
          updater: current => restoreDraftConnectors(data.connectors, current),
        });
      })
      .catch(() => {
        if (!controller.signal.aborted) {
          setField('connectorLoadError', 'Business connections could not be loaded. Your blueprint is preserved.');
        }
      });

    return () => {
      controller.abort();
    };
  }, [state.assetRetry, setField]);

  const needsCatalog = state.isCatalogModalOpen || (state.hasSelectedMode && (
    (state.experienceMode === 'guided' && state.guidedStep >= 1) ||
    (state.experienceMode === 'advanced' && state.step === 2)
  ));
  const isCatalogLoading = Boolean(needsCatalog && state.catalog.length === 0 && !state.catalogLoadError);

  useEffect(() => {
    if (!needsCatalog || state.catalog.length > 0 || state.catalogLoadError) return;
    const controller = new AbortController();

    fetch('./ai-tadpole-catalog.json', { signal: controller.signal })
      .then(res => {
        if (!res.ok) throw new Error('The specialist catalog could not be loaded. Please retry.');
        return res.json();
      })
      .then(data => {
        if (!Array.isArray(data) || data.length === 0) {
          throw new Error('The specialist catalog is empty. Please retry.');
        }
        setField('catalog', data);
      })
      .catch(() => {
        if (!controller.signal.aborted) {
          setField('catalogLoadError', 'The specialist catalog could not be loaded. Your blueprint is preserved.');
        }
      });

    return () => {
      controller.abort();
    };
  }, [needsCatalog, state.catalog.length, state.catalogLoadError, state.assetRetry, setField]);

  const validationIssues = useMemo(
    () => validateSwarm(state.companyInfo, state.agents, state.workflows, state.selectedConnectors, state.mcpCatalog),
    [state.companyInfo, state.agents, state.workflows, state.selectedConnectors, state.mcpCatalog],
  );

  useEffect(() => {
    if (state.hasSelectedMode && (state.companyInfo.name || state.agents.length > 0)) {
      saveDraft(
        state.experienceMode,
        state.companyInfo,
        state.agents,
        state.workflows,
        state.selectedConnectors,
        state.mcpCatalog,
      );
    }
  }, [state.hasSelectedMode, state.experienceMode, state.companyInfo, state.agents, state.workflows, state.selectedConnectors, state.mcpCatalog]);

  const resetBlueprint = useCallback(() => {
    swarmRequestController.current?.abort();
    swarmRequestSequence.current += 1;
    clearDraft();
    dispatch({ type: 'RESET_BLUEPRINT' });
  }, []);

  const handleResumeDraft = useCallback(() => {
    const saved = state.savedDraftState;
    if (!saved) return;
    setField('experienceMode', saved.experienceMode || 'guided');
    setCompanyInfo(saved.companyInfo);
    setAgents(saved.agents);
    setWorkflows(saved.workflows || []);
    setSelectedConnectors(saved.selectedConnectors || []);
    dispatch({
      type: 'UPDATE_MCP_CATALOG',
      updater: current => restoreDraftConnectors(current, saved.connectorDefinitions),
    });
    setField('hasSelectedMode', true);
    setField('savedDraftState', null);
  }, [state.savedDraftState, setField, setCompanyInfo, setAgents, setWorkflows, setSelectedConnectors]);

  const handleDiscardDraft = useCallback(() => {
    resetBlueprint();
  }, [resetBlueprint]);

  const handleSelectMode = useCallback((mode: ExperienceMode) => {
    setField('experienceMode', mode);
    setField('hasSelectedMode', true);
    setField('showTemplatesLibrary', false);
  }, [setField]);

  const removeAgent = useCallback((id: string) => {
    setAgents(prev => prev.filter(a => a.id !== id));
  }, [setAgents]);

  const handleCreateCustomAgent = useCallback(() => {
    const id = 'custom-' + crypto.randomUUID().slice(0, 8);
    const newAgent: Agent = {
      id,
      name: 'Custom Specialist',
      role: 'Domain Specialist',
      department: 'Operations',
      status: 'idle',
      provider: DEFAULT_MODEL_SLOTS.primary.provider,
      model: DEFAULT_MODEL_SLOTS.primary.model_id,
      prompt: 'You serve as a custom domain specialist. Work strictly within approved context and factual records. Require human review and approval before final decisions.',
      description: 'Custom AI agent defined from scratch.',
      color: '#71717a',
      emoji: '🤖',
      vibe: 'Custom defined role.',
      skills: ['read_file'],
      workflows: [],
      mcpTools: [],
      requiresOversight: false,
      isCustom: true,
    };
    setAgents(prev => [...prev, newAgent]);
    setField('editingAgent', newAgent);
    setField('isEditorModalOpen', true);
  }, [setAgents, setField]);

  const handleAddCatalogAgent = useCallback((catalogAgent: CatalogAgent) => {
    const runtimeAgent = catalogAgentToRuntimeAgent(catalogAgent, {
      id: catalogAgent.id.replace(/[^a-zA-Z0-9-]/g, '-') + '-' + crypto.randomUUID().slice(0, 6),
      catalogId: catalogAgent.id,
    });
    setAgents(prev => [...prev, runtimeAgent]);
    setField('isCatalogModalOpen', false);
  }, [setAgents, setField]);

  const handleSaveAgent = useCallback((updatedAgent: Agent) => {
    setAgents(prev => prev.map(a => a.id === updatedAgent.id ? updatedAgent : a));
    setField('isEditorModalOpen', false);
    setField('editingAgent', null);
  }, [setAgents, setField]);

  const handleAddNewMcp = useCallback(() => {
    const newConnector: MCPConnector = {
      id: crypto.randomUUID(),
      name: '',
      description: '',
      category: 'Database',
      path: '',
      version: '1.0.0',
      isCustom: true,
    };
    setField('editingMcp', newConnector);
    setField('isMcpEditorModalOpen', true);
  }, [setField]);

  const handleSaveMcp = useCallback((updatedMcp: MCPConnector) => {
    dispatch({
      type: 'UPDATE_MCP_CATALOG',
      updater: prev => (prev.some(c => c.id === updatedMcp.id)
        ? prev.map(c => c.id === updatedMcp.id ? updatedMcp : c)
        : [...prev, updatedMcp]),
    });
    setField('isMcpEditorModalOpen', false);
    setField('editingMcp', null);
  }, [setField]);

  const handleDeleteMcp = useCallback((id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    dispatch({ type: 'UPDATE_MCP_CATALOG', updater: prev => prev.filter(c => c.id !== id) });
    setSelectedConnectors(prev => prev.filter(cId => cId !== id));
  }, [setSelectedConnectors]);

  const addWorkflow = useCallback(() => {
    const id = crypto.randomUUID().slice(0, 8);
    setWorkflows(prev => [...prev, {
      id,
      name: 'New Workflow SOP',
      description: '## Step 1: Execution\nExecute procedure in accordance with corporate policies.',
      isOkfPlaybook: false,
      resourceUri: '',
      topic: state.companyInfo.industry.toLowerCase() || 'general',
      conceptType: 'playbook',
      tags: state.companyInfo.industry.toLowerCase() || 'general',
    }]);
  }, [setWorkflows, state.companyInfo.industry]);

  const removeWorkflow = useCallback((id: string) => {
    setWorkflows(prev => prev.filter(w => w.id !== id));
  }, [setWorkflows]);

  const handleAiAssist = useCallback(async () => {
    if (isCatalogLoading || state.catalogLoadError) return;
    const recommended = recommendTeam(
      state.companyInfo.goals || [],
      state.companyInfo.industry,
      state.companyInfo.size,
      state.catalog,
    );

    if (recommended.length > 0) {
      if (state.agents.length > 0 && !window.confirm('Replace the current team with recommended specialists? Your custom agent settings and tool grants will be replaced. Your mission and playbooks will be kept.')) return;
      const teamWorkflows = state.workflows.length > 0 ? state.workflows : generateGoalWorkflows(state.companyInfo.goals || []);
      const readToolIds = state.mcpCatalog
        .filter(connector => state.selectedConnectors.includes(connector.id))
        .flatMap(connector => (connector.tools || []).filter(tool => tool.risk === 'read').map(tool => tool.id));
      setWorkflows(teamWorkflows);
      setAgents(recommended.map(recommendation => ({
        ...recommendation.agent,
        workflows: teamWorkflows.filter(workflow => !workflow.isOkfPlaybook).map(workflow => workflow.id),
        mcpTools: [...new Set([...(recommendation.agent.mcpTools || []), ...readToolIds])],
      })));
      setCompanyInfo(prev => ({
        ...prev,
        mission: prev.mission.trim() || generateDefaultMission(prev.name, prev.industry, prev.goals || []),
      }));
    }
  }, [isCatalogLoading, state.catalogLoadError, state.companyInfo, state.catalog, state.agents.length, state.workflows, state.mcpCatalog, state.selectedConnectors, setWorkflows, setAgents, setCompanyInfo]);

  const handleExport = useCallback(async () => {
    setField('exportError', null);
    const blockingIssues = validationIssues.filter(issue => issue.severity === 'error');
    if (blockingIssues.length > 0) {
      const firstIssue = blockingIssues[0];
      setField(
        'exportError',
        `Resolve ${blockingIssues.length} validation ${blockingIssues.length === 1 ? 'error' : 'errors'} before export. ${firstIssue.message}`,
      );
      return;
    }
    setField('isExporting', true);
    try {
      await exportSwarmZip(state.companyInfo, state.agents, state.workflows, state.selectedConnectors, state.mcpCatalog);
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      setField('exportError', message);
    } finally {
      setField('isExporting', false);
    }
  }, [setField, validationIssues, state.companyInfo, state.agents, state.workflows, state.selectedConnectors, state.mcpCatalog]);

  const fetchSwarmDetails = useCallback(async (templatePath: string, applyToBuilder = false) => {
    swarmRequestController.current?.abort();
    const controller = new AbortController();
    swarmRequestController.current = controller;
    const requestSequence = ++swarmRequestSequence.current;
    setField('isLoadingSwarmDetails', true);
    setField('loadedSwarmDetails', null);
    setField('swarmLoadError', null);
    try {
      const details = await fetchSwarmDetailsFromRepo(templatePath, controller.signal, state.mcpCatalog);
      if (requestSequence !== swarmRequestSequence.current) return;
      setField('loadedSwarmDetails', details);
      if (applyToBuilder) {
        setAgents(details.roster);
        setWorkflows(details.workflows);
        setSelectedConnectors(details.selectedConnectors || []);
      }
    } catch (err) {
      if (err instanceof DOMException && err.name === 'AbortError') return;
      console.error('Error fetching swarm details:', err);
      if (requestSequence === swarmRequestSequence.current) {
        setField('swarmLoadError', err instanceof Error ? err.message : 'Failed to fetch template blueprint from repository.');
        setField('loadedSwarmDetails', null);
      }
    } finally {
      if (requestSequence === swarmRequestSequence.current) {
        setField('isLoadingSwarmDetails', false);
      }
    }
  }, [setField, state.mcpCatalog, setAgents, setWorkflows, setSelectedConnectors]);

  const handleTemplateClick = useCallback((template: TemplateItem) => {
    setField('selectedTemplateId', template.id);
    setField('selectedTemplate', template);
    void fetchSwarmDetails(template.path);
  }, [setField, fetchSwarmDetails]);

  const handleUpdateSelectedTemplate = useCallback(<K extends keyof TemplateItem>(key: K, value: TemplateItem[K]) => {
    if (!state.selectedTemplate) return;
    const updated = { ...state.selectedTemplate, [key]: value };
    setField('selectedTemplate', updated);
    setField(
      'dynamicRegistry',
      state.dynamicRegistry.map(t => t.id === state.selectedTemplate?.id ? updated : t),
    );
    if (key === 'name' && typeof value === 'string') {
      setCompanyInfo(prev => ({ ...prev, name: value }));
    } else if (key === 'description' && typeof value === 'string') {
      setCompanyInfo(prev => ({ ...prev, description: value }));
    }
  }, [state.selectedTemplate, state.dynamicRegistry, setField, setCompanyInfo]);

  const handleLoadSwarmIntoBuilder = useCallback(() => {
    if (!state.selectedTemplate || !state.loadedSwarmDetails?.roster || state.loadedSwarmDetails.roster.length === 0) {
      return;
    }
    const match = state.dynamicIndustries.find(i => i.name === state.selectedTemplate?.industry);
    setCompanyInfo({
      name: state.selectedTemplate.name,
      description: state.selectedTemplate.description,
      mission: `To revolutionize ${state.selectedTemplate.description.toLowerCase()} through sovereign intelligence and automated ${state.selectedTemplate.industry.toLowerCase()} flows.`,
      industry: state.selectedTemplate.industry,
      industryPath: match?.path || state.selectedTemplate.path.split('/')[0] || '',
      industryCode: INDUSTRY_CODES_MAP[state.selectedTemplate.industry]?.[0]?.code || '',
      size: (state.selectedTemplate.company_size || 25).toString(),
      goals: state.selectedTemplate.tags || [],
    });
    setAgents(state.loadedSwarmDetails.roster);
    setWorkflows(state.loadedSwarmDetails.workflows || []);
    setSelectedConnectors(state.loadedSwarmDetails.selectedConnectors || []);
    setField('hasSelectedMode', true);
    setField('showTemplatesLibrary', false);
    setField('step', 1);
    setField('guidedStep', 1);
    scrollToWorkspace();
  }, [state.selectedTemplate, state.loadedSwarmDetails, state.dynamicIndustries, setCompanyInfo, setAgents, setWorkflows, setSelectedConnectors, setField]);

  const handleManualSaveDraft = useCallback(() => {
    const saved = saveDraft(
      state.experienceMode,
      state.companyInfo,
      state.agents,
      state.workflows,
      state.selectedConnectors,
      state.mcpCatalog,
    );
    setField(
      'draftToast',
      saved ? 'Draft saved locally!' : 'Draft could not be saved. Browser storage may be unavailable or full.',
    );
    setTimeout(() => setField('draftToast', null), 3000);
    return saved;
  }, [state.experienceMode, state.companyInfo, state.agents, state.workflows, state.selectedConnectors, state.mcpCatalog, setField]);

  const handleStartOver = useCallback(() => {
    if (window.confirm('Reset this blueprint and discard its saved draft?')) resetBlueprint();
  }, [resetBlueprint]);

  const goHome = useCallback(() => {
    setField('savedDraftState', loadDraft());
    setField('hasSelectedMode', false);
    setField('showTemplatesLibrary', false);
  }, [setField]);

  const filteredTemplates = useMemo(() => {
    const q = state.searchTerm.toLowerCase();
    return state.dynamicRegistry.filter(t =>
      t.name.toLowerCase().includes(q)
      || t.industry.toLowerCase().includes(q)
      || t.tags.some(tag => tag.toLowerCase().includes(q)),
    );
  }, [state.dynamicRegistry, state.searchTerm]);

  const value: SwarmBuilderContextValue = {
    ...state,
    workspaceRef,
    isCatalogLoading,
    validationIssues,
    filteredTemplates,
    setField,
    setCompanyInfo,
    setAgents,
    setWorkflows,
    setSelectedConnectors,
    handleResumeDraft,
    handleDiscardDraft,
    handleSelectMode,
    removeAgent,
    handleCreateCustomAgent,
    handleAddCatalogAgent,
    handleSaveAgent,
    handleAddNewMcp,
    handleSaveMcp,
    handleDeleteMcp,
    addWorkflow,
    removeWorkflow,
    handleAiAssist,
    handleExport,
    fetchSwarmDetails,
    handleTemplateClick,
    handleUpdateSelectedTemplate,
    handleLoadSwarmIntoBuilder,
    handleManualSaveDraft,
    handleStartOver,
    goHome,
  };

  return <SwarmBuilderContext.Provider value={value}>{children}</SwarmBuilderContext.Provider>;
}
