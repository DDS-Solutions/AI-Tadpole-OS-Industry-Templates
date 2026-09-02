import { useState, useEffect, useRef, useMemo, lazy, Suspense } from 'react';
import {
  Shield,
  Cpu,
  Search,
  Download,
  Sparkles,
  Terminal,
  Layers,
  BookmarkCheck,
  AlertCircle,
  RotateCcw,
  BookOpen,
  FileText,
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

function GithubIcon({ className = "w-4 h-4" }: { className?: string }) {
  return (
    <svg className={className} fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
      <path fillRule="evenodd" d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.53 1.032 1.53 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z" clipRule="evenodd" />
    </svg>
  );
}

import type { Agent, WorkflowItem, TemplateItem, CatalogAgent, MCPConnector, SwarmDetails, CompanyInfo, ExperienceMode } from './types';
import { INDUSTRY_MAP, REGISTRY, INDUSTRY_CODES_MAP } from './constants';

import ModeSelector from './components/ModeSelector';
import { exportSwarmZip, fetchSwarmDetailsFromRepo } from './utils/fileHelpers';
import { catalogAgentToRuntimeAgent, recommendTeam } from './utils/catalogHelpers';
import { validateSwarm } from './utils/validation';
import { saveDraft, loadDraft, clearDraft, type SavedDraft } from './utils/draftStorage';

// Lazy load dialogs & steps for optimal bundle splitting
const GuidedWizard = lazy(() => import('./components/Guided/GuidedWizard'));
const Step1_CompanyMission = lazy(() => import('./components/Steps/Step1_CompanyMission'));
const Step2_Roster = lazy(() => import('./components/Steps/Step2_Roster'));
const Step3_Playbooks = lazy(() => import('./components/Steps/Step3_Playbooks'));
const Step4_Connectors = lazy(() => import('./components/Steps/Step4_Connectors'));
const Step5_Forge = lazy(() => import('./components/Steps/Step5_Forge'));
const CatalogDrawer = lazy(() => import('./components/Modals/CatalogDrawer'));
const AgentEditor = lazy(() => import('./components/Modals/AgentEditor'));
const McpEditor = lazy(() => import('./components/Modals/McpEditor'));

export default function App() {
  const [experienceMode, setExperienceMode] = useState<ExperienceMode>('guided');
  const [hasSelectedMode, setHasSelectedMode] = useState(false);
  const [showTemplatesLibrary, setShowTemplatesLibrary] = useState(false);
  const [savedDraftState, setSavedDraftState] = useState<SavedDraft | null>(() => loadDraft());

  const [step, setStep] = useState(1);
  const [searchTerm, setSearchTerm] = useState('');

  // Custom State Inputs
  const [companyInfo, setCompanyInfo] = useState<CompanyInfo>({
    name: '',
    size: '25',
    description: '',
    mission: '',
    industry: '',
    industryPath: '',
    industryCode: '',
    goals: ['scheduling', 'quoting', 'customer-follow-up'],
  });

  const [isCustomIndustry, setIsCustomIndustry] = useState(false);
  const [customIndustryName, setCustomIndustryName] = useState('');
  const [customIndustryPath, setCustomIndustryPath] = useState('');
  const [showCustomCodeInput, setShowCustomCodeInput] = useState(false);

  const [selectedTemplateId, setSelectedTemplateId] = useState<string | null>(null);
  const [selectedTemplate, setSelectedTemplate] = useState<TemplateItem | null>(null);
  const [isLoadingSwarmDetails, setIsLoadingSwarmDetails] = useState(false);
  const [loadedSwarmDetails, setLoadedSwarmDetails] = useState<SwarmDetails | null>(null);
  const [swarmLoadError, setSwarmLoadError] = useState<string | null>(null);
  const swarmRequestController = useRef<AbortController | null>(null);
  const swarmRequestSequence = useRef(0);

  // MCP Connectors State
  const [mcpCatalog, setMcpCatalog] = useState<MCPConnector[]>([]);
  const [selectedConnectors, setSelectedConnectors] = useState<string[]>([]);
  const [isMcpEditorModalOpen, setIsMcpEditorModalOpen] = useState(false);
  const [editingMcp, setEditingMcp] = useState<MCPConnector | null>(null);

  // Catalog & Editor State
  const [catalog, setCatalog] = useState<CatalogAgent[]>([]);
  const [isCatalogLoading, setIsCatalogLoading] = useState(true);
  const [isCatalogModalOpen, setIsCatalogModalOpen] = useState(false);

  const [isEditorModalOpen, setIsEditorModalOpen] = useState(false);
  const [editingAgent, setEditingAgent] = useState<Agent | null>(null);

  const [agents, setAgents] = useState<Agent[]>([]);
  const [workflows, setWorkflows] = useState<WorkflowItem[]>([]);
  const [dynamicIndustries, setDynamicIndustries] = useState<typeof INDUSTRY_MAP>(INDUSTRY_MAP);
  const [dynamicRegistry, setDynamicRegistry] = useState<TemplateItem[]>(REGISTRY);

  const [isExporting, setIsExporting] = useState(false);
  const [exportError, setExportError] = useState<string | null>(null);
  const [draftToast, setDraftToast] = useState<string | null>(null);

  const departments = [
    { id: 'all', label: 'All Departments', color: '#71717a', desc: 'Browse the complete index of sovereign agent personas.' },
    { id: 'academic', label: 'Academic', color: '#8B5CF6', desc: 'Theoretical research, scientific computation, and deep knowledge analysis.' },
    { id: 'design', label: 'Design', color: '#EC4899', desc: 'UI/UX, visual assets, creative generation, and frontend themes.' },
    { id: 'engineering', label: 'Engineering', color: '#3B82F6', desc: 'Backend systems, database optimization, CI/CD, and software engineering.' },
    { id: 'finance', label: 'Finance', color: '#22C55E', desc: 'Budget analysis, transactional auditing, resource projection, and ledger validation.' },
    { id: 'game-development', label: 'Game Development', color: '#A855F7', desc: 'Physics engine, gameplay loops, asset pipeline, and logic scripting.' },
    { id: 'gis', label: 'GIS', color: '#14B8A6', desc: 'Geospatial queries, mapping coordinates, coordinate transformation, and terrain analysis.' },
    { id: 'marketing', label: 'Marketing', color: '#F97316', desc: 'Market positioning, campaign logic, copy creation, and funnel mapping.' },
    { id: 'paid-media', label: 'Paid Media', color: '#EAB308', desc: 'Ad bidding simulation, conversion tracing, and cost-benefit analysis.' },
    { id: 'product', label: 'Product', color: '#D946EF', desc: 'Product roadmap, user story mapping, and capability spec definitions.' },
    { id: 'project-management', label: 'Project Management', color: '#0EA5E9', desc: 'Sprint scheduling, task matching, and milestone resolution.' },
    { id: 'sales', label: 'Sales', color: '#10B981', desc: 'Lead scoring, conversion outreach simulation, and pitch refinement.' },
    { id: 'security', label: 'Security', color: '#EF4444', desc: 'Threat analysis, vulnerability review, and permission planning.' },
    { id: 'spatial-computing', label: 'Spatial Computing', color: '#06B6D4', desc: 'AR/VR tracking systems, 3D math, and sensory coordinate translation.' },
    { id: 'specialized', label: 'Specialized', color: '#6366F1', desc: 'Domain-expert roles tailored for atypical workflows.' },
    { id: 'support', label: 'Support', color: '#84CC16', desc: 'Troubleshooting guides, ticket analysis, and user guide generation.' },
    { id: 'testing', label: 'Testing', color: '#F59E0B', desc: 'Unit tests compilation, boundary validation, and QA logic audits.' }
  ];

  // Initial load
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
              keywords: existing?.keywords || name.toLowerCase().split(/\s+/)
            };
          });
          setDynamicIndustries(registryIndustries);
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
              internal: t.internal,
            }));
          setDynamicRegistry(registryTemplates);
        }
      })
      .catch(err => {
        if (err.name !== 'AbortError') console.error("Error loading registry.json:", err);
      });

    fetch('./mcp_registry.json', { signal: controller.signal })
      .then(res => res.json())
      .then(data => {
        if (data && data.connectors) setMcpCatalog(data.connectors);
      })
      .catch(err => {
        if (err.name !== 'AbortError') console.error("Error loading mcp_registry.json:", err);
      });

    fetch('./ai-tadpole-catalog.json', { signal: controller.signal })
      .then(res => res.json())
      .then(data => {
        if (Array.isArray(data)) setCatalog(data);
      })
      .catch(err => {
        if (err.name !== 'AbortError') console.error("Error loading ai-tadpole-catalog.json:", err);
      })
      .finally(() => {
        if (!controller.signal.aborted) setIsCatalogLoading(false);
      });

    return () => {
      controller.abort();
    };
  }, []);

  // Compute live continuous validation
  const validationIssues = useMemo(() => {
    return validateSwarm(companyInfo, agents, workflows, selectedConnectors, mcpCatalog);
  }, [companyInfo, agents, workflows, selectedConnectors, mcpCatalog]);

  // Draft autosave effect
  useEffect(() => {
    if (hasSelectedMode && (companyInfo.name || agents.length > 0)) {
      saveDraft(experienceMode, companyInfo, agents, workflows, selectedConnectors);
    }
  }, [hasSelectedMode, experienceMode, companyInfo, agents, workflows, selectedConnectors]);

  const handleResumeDraft = () => {
    if (!savedDraftState) return;
    setExperienceMode(savedDraftState.experienceMode || 'guided');
    setCompanyInfo(savedDraftState.companyInfo);
    setAgents(savedDraftState.agents);
    setWorkflows(savedDraftState.workflows || []);
    setSelectedConnectors(savedDraftState.selectedConnectors || []);
    setHasSelectedMode(true);
    setSavedDraftState(null);
  };

  const handleDiscardDraft = () => {
    clearDraft();
    setSavedDraftState(null);
  };

  const handleSelectMode = (mode: ExperienceMode) => {
    setExperienceMode(mode);
    setHasSelectedMode(true);
  };

  const removeAgent = (id: string) => {
    setAgents(agents.filter(a => a.id !== id));
  };

  const handleCreateCustomAgent = () => {
    const id = 'custom-' + crypto.randomUUID().slice(0, 8);
    const newAgent: Agent = {
      id,
      name: 'Custom Specialist',
      role: 'Domain Specialist',
      department: 'Operations',
      status: 'idle',
      provider: 'google',
      model: 'gemma4:31b',
      prompt: 'You serve as a custom domain specialist. Work strictly within approved context and factual records. Require human review and approval before final decisions.',
      description: 'Custom AI agent defined from scratch.',
      color: '#71717a',
      emoji: '🤖',
      vibe: 'Custom defined role.',
      skills: ['read_file'],
      workflows: [],
      mcpTools: [],
      requiresOversight: false,
      isCustom: true
    };
    setAgents([...agents, newAgent]);
    setEditingAgent(newAgent);
    setIsEditorModalOpen(true);
  };

  const handleAddCatalogAgent = (catalogAgent: CatalogAgent) => {
    const runtimeAgent = catalogAgentToRuntimeAgent(catalogAgent, {
      id: catalogAgent.id.replace(/[^a-zA-Z0-9-]/g, '-') + '-' + crypto.randomUUID().slice(0, 6),
    });
    setAgents([...agents, runtimeAgent]);
    setIsCatalogModalOpen(false);
  };

  const handleSaveAgent = (updatedAgent: Agent) => {
    setAgents(agents.map(a => a.id === updatedAgent.id ? updatedAgent : a));
    setIsEditorModalOpen(false);
    setEditingAgent(null);
  };

  const handleAddNewMcp = () => {
    const newConnector: MCPConnector = {
      id: crypto.randomUUID(),
      name: '',
      description: '',
      category: 'Database',
      path: '',
      version: '1.0.0'
    };
    setEditingMcp(newConnector);
    setIsMcpEditorModalOpen(true);
  };

  const handleSaveMcp = (updatedMcp: MCPConnector) => {
    const exists = mcpCatalog.some(c => c.id === updatedMcp.id);
    if (exists) {
      setMcpCatalog(mcpCatalog.map(c => c.id === updatedMcp.id ? updatedMcp : c));
    } else {
      setMcpCatalog([...mcpCatalog, updatedMcp]);
    }
    setIsMcpEditorModalOpen(false);
    setEditingMcp(null);
  };

  const handleDeleteMcp = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setMcpCatalog(mcpCatalog.filter(c => c.id !== id));
    setSelectedConnectors(selectedConnectors.filter(cId => cId !== id));
  };

  const addWorkflow = () => {
    const id = crypto.randomUUID().slice(0, 8);
    setWorkflows([...workflows, {
      id,
      name: 'New Workflow SOP',
      description: '## Step 1: Execution\nExecute procedure in accordance with corporate policies.',
      isOkfPlaybook: false,
      resourceUri: '',
      topic: companyInfo.industry.toLowerCase() || 'general',
      conceptType: 'playbook',
      tags: companyInfo.industry.toLowerCase() || 'general'
    }]);
  };

  const removeWorkflow = (id: string) => {
    setWorkflows(workflows.filter(w => w.id !== id));
  };

  const handleAiAssist = () => {
    const recommended = recommendTeam(
      companyInfo.goals || [],
      companyInfo.industry,
      companyInfo.size,
      catalog
    );

    if (recommended.length > 0) {
      setAgents(recommended.map(r => r.agent));
      setCompanyInfo(prev => ({
        ...prev,
        mission: `To revolutionize ${prev.industry || 'operations'} through sovereign multi-agent intelligence and automated workflows.`
      }));
    }
  };

  const handleExport = async () => {
    setExportError(null);
    const blockingIssues = validationIssues.filter(issue => issue.severity === 'error');
    if (blockingIssues.length > 0) {
      const firstIssue = blockingIssues[0];
      setExportError(
        `Resolve ${blockingIssues.length} validation ${blockingIssues.length === 1 ? 'error' : 'errors'} before export. ${firstIssue.message}`,
      );
      return;
    }
    setIsExporting(true);
    try {
      await exportSwarmZip(companyInfo, agents, workflows, selectedConnectors, mcpCatalog);
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      setExportError(message);
    } finally {
      setIsExporting(false);
    }
  };

  const fetchSwarmDetails = async (templatePath: string, applyToBuilder = false) => {
    swarmRequestController.current?.abort();
    const controller = new AbortController();
    swarmRequestController.current = controller;
    const requestSequence = ++swarmRequestSequence.current;
    setIsLoadingSwarmDetails(true);
    setLoadedSwarmDetails(null);
    setSwarmLoadError(null);
    try {
      const details = await fetchSwarmDetailsFromRepo(templatePath, controller.signal, mcpCatalog);
      if (requestSequence !== swarmRequestSequence.current) return;
      setLoadedSwarmDetails(details);
      if (applyToBuilder) {
        setAgents(details.roster);
        setWorkflows(details.workflows);
        setSelectedConnectors(details.selectedConnectors || []);
      }
    } catch (err) {
      if (err instanceof DOMException && err.name === 'AbortError') return;
      console.error("Error fetching swarm details:", err);
      if (requestSequence === swarmRequestSequence.current) {
        setSwarmLoadError(err instanceof Error ? err.message : 'Failed to fetch template blueprint from repository.');
        setLoadedSwarmDetails(null);
      }
    } finally {
      if (requestSequence === swarmRequestSequence.current) {
        setIsLoadingSwarmDetails(false);
      }
    }
  };

  const handleTemplateClick = (template: TemplateItem) => {
    setSelectedTemplateId(template.id);
    setSelectedTemplate(template);
    fetchSwarmDetails(template.path);
  };

  const handleUpdateSelectedTemplate = <K extends keyof TemplateItem>(key: K, value: TemplateItem[K]) => {
    if (!selectedTemplate) return;
    const updated = { ...selectedTemplate, [key]: value };
    setSelectedTemplate(updated);
    setDynamicRegistry(prev => prev.map(t => t.id === selectedTemplate.id ? updated : t));
  };

  const handleLoadSwarmIntoBuilder = () => {
    if (!selectedTemplate || !loadedSwarmDetails?.roster || loadedSwarmDetails.roster.length === 0) {
      return;
    }

    const match = dynamicIndustries.find(i => i.name === selectedTemplate.industry);
    setCompanyInfo({
      name: selectedTemplate.name,
      description: selectedTemplate.description,
      mission: `To revolutionize ${selectedTemplate.description.toLowerCase()} through sovereign intelligence and automated ${selectedTemplate.industry.toLowerCase()} flows.`,
      industry: selectedTemplate.industry,
      industryPath: match?.path || selectedTemplate.path.split('/')[0] || '',
      industryCode: INDUSTRY_CODES_MAP[selectedTemplate.industry]?.[0]?.code || '',
      size: (selectedTemplate.company_size || 25).toString(),
      goals: selectedTemplate.tags || []
    });

    setAgents(loadedSwarmDetails.roster);
    setWorkflows(loadedSwarmDetails.workflows || []);
    setSelectedConnectors(loadedSwarmDetails.selectedConnectors || []);

    setHasSelectedMode(true);
    setShowTemplatesLibrary(false);
    setStep(1);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleManualSaveDraft = () => {
    saveDraft(experienceMode, companyInfo, agents, workflows, selectedConnectors);
    setDraftToast('Draft saved locally!');
    setTimeout(() => setDraftToast(null), 3000);
  };

  const handleStartOver = () => {
    if (window.confirm('Are you sure you want to reset the builder? This will clear your current blueprint draft.')) {
      clearDraft();
      setCompanyInfo({
        name: '',
        size: '25',
        description: '',
        mission: '',
        industry: '',
        industryPath: '',
        industryCode: '',
        goals: ['scheduling', 'quoting', 'customer-follow-up'],
      });
      setAgents([]);
      setWorkflows([]);
      setSelectedConnectors([]);
      setHasSelectedMode(false);
      setStep(1);
    }
  };

  const filteredTemplates = dynamicRegistry.filter(t =>
    t.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    t.industry.toLowerCase().includes(searchTerm.toLowerCase()) ||
    t.tags.some(tag => tag.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  // If user has not chosen mode yet, render ModeSelector
  if (!hasSelectedMode && !showTemplatesLibrary) {
    return (
      <div className="min-h-screen p-4 md:p-8 flex flex-col items-center justify-center max-w-5xl mx-auto">
        <ModeSelector
          templateCount={dynamicRegistry.length}
          onSelectMode={handleSelectMode}
          onBrowseTemplates={() => setShowTemplatesLibrary(true)}
          savedDraft={savedDraftState}
          onResumeDraft={handleResumeDraft}
          onDiscardDraft={handleDiscardDraft}
        />
      </div>
    );
  }

  return (
    <div className="min-h-screen p-4 md:p-8 flex flex-col items-center max-w-5xl mx-auto animate-fadeIn">
      {/* Toast */}
      {draftToast && (
        <div className="fixed top-5 right-5 z-50 px-4 py-2 rounded-xl bg-cyber-green text-zinc-950 text-xs font-bold shadow-lg flex items-center gap-2 animate-bounce">
          <BookmarkCheck className="w-4 h-4" /> {draftToast}
        </div>
      )}

      {/* Export Error Alert Banner */}
      {exportError && (
        <div className="w-full mb-6 p-4 rounded-xl bg-red-950/80 border border-red-800 text-red-200 text-xs flex items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-red-400 shrink-0" />
            <span><strong>Export Blocked:</strong> {exportError}</span>
          </div>
          <button
            onClick={() => setExportError(null)}
            className="text-red-400 hover:text-white font-mono uppercase text-[10px] cursor-pointer"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Persistent Header with Segmented Mode Switcher */}
      <header className="w-full flex flex-col sm:flex-row justify-between items-center gap-4 mb-8 pb-6 border-b border-zinc-850">
        <div className="flex items-center gap-3">
          <div className="bg-cyber-green/20 p-2.5 rounded-xl border border-cyber-green/30">
            <Shield className="text-cyber-green w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-bold tracking-tight text-white">Swarm Architect</h1>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-zinc-800 text-cyber-green font-semibold">v1.0</span>
            </div>
            <p className="text-xs text-zinc-500 font-mono uppercase tracking-widest">AI-Tadpole-OS Engine</p>
          </div>
        </div>

        {/* Persistent Mode Switcher */}
        <div className="flex items-center gap-3">
          <div className="p-1 rounded-xl bg-zinc-900 border border-zinc-800 flex items-center gap-1">
            <button
              type="button"
              onClick={() => setExperienceMode('guided')}
              aria-pressed={experienceMode === 'guided'}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all flex items-center gap-1.5 cursor-pointer ${
                experienceMode === 'guided'
                  ? 'bg-cyber-green text-zinc-950 shadow-sm'
                  : 'text-zinc-400 hover:text-zinc-200'
              }`}
            >
              <Sparkles className="w-3.5 h-3.5" />
              Guided Setup
            </button>
            <button
              type="button"
              onClick={() => setExperienceMode('advanced')}
              aria-pressed={experienceMode === 'advanced'}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all flex items-center gap-1.5 cursor-pointer ${
                experienceMode === 'advanced'
                  ? 'bg-zinc-800 text-white border border-zinc-700 shadow-sm'
                  : 'text-zinc-400 hover:text-zinc-200'
              }`}
            >
              <Terminal className="w-3.5 h-3.5" />
              Advanced Setup
            </button>
          </div>

          <button
            type="button"
            onClick={() => setShowTemplatesLibrary(!showTemplatesLibrary)}
            aria-label={`Browse ${dynamicRegistry.length} pre-built industry templates`}
            className="p-2 rounded-xl bg-zinc-900 border border-zinc-800 hover:border-zinc-700 text-zinc-400 hover:text-white transition-colors cursor-pointer"
            title={`Browse ${dynamicRegistry.length} pre-built industry templates`}
          >
            <Layers className="w-4 h-4" />
          </button>

          <a
            href="https://github.com/DDS-Solutions/AI-Tadpole-OS-Industry-Templates"
            target="_blank"
            rel="noopener noreferrer"
            aria-label="GitHub Repository"
            className="p-2 rounded-xl bg-zinc-900 border border-zinc-800 hover:border-zinc-700 text-zinc-400 hover:text-white transition-colors"
            title="View Source on GitHub"
          >
            <GithubIcon className="w-4 h-4" />
          </a>
        </div>
      </header>

      {/* Main Experience Router */}
      <Suspense fallback={<div className="w-full py-16 text-center text-zinc-500 font-mono text-xs animate-pulse">Loading experience...</div>}>
        {experienceMode === 'guided' && !showTemplatesLibrary ? (
          <GuidedWizard
            companyInfo={companyInfo}
            setCompanyInfo={setCompanyInfo}
            agents={agents}
            setAgents={setAgents}
            workflows={workflows}
            setWorkflows={setWorkflows}
            dynamicIndustries={dynamicIndustries}
            mcpCatalog={mcpCatalog}
            selectedConnectors={selectedConnectors}
            setSelectedConnectors={setSelectedConnectors}
            catalog={catalog}
            onOpenCatalogModal={() => setIsCatalogModalOpen(true)}
            validationIssues={validationIssues}
            isExporting={isExporting}
            onExport={handleExport}
            onSaveDraft={handleManualSaveDraft}
            onSwitchToAdvanced={() => setExperienceMode('advanced')}
            onStartOver={handleStartOver}
          />
        ) : experienceMode === 'advanced' && !showTemplatesLibrary ? (
          <div className="w-full space-y-6">
            {/* Advanced Progress Header */}
            <div className="flex justify-center gap-3 mb-4">
              {[
                { id: 1, label: 'Identity' },
                { id: 2, label: 'Agents' },
                { id: 3, label: 'Workflows' },
                { id: 4, label: 'Connections' },
                { id: 5, label: 'Validate & Export' }
              ].map(s => (
                <button
                  type="button"
                  key={s.id}
                  onClick={() => setStep(s.id)}
                  aria-current={s.id === step ? 'step' : undefined}
                  className="flex flex-col items-center gap-1.5 cursor-pointer group"
                >
                  <span className={`text-[9px] font-mono uppercase tracking-widest transition-colors ${s.id === step ? 'text-cyber-green font-bold' : 'text-zinc-500 group-hover:text-zinc-300'}`}>
                    {s.label}
                  </span>
                  <div
                    className={`w-12 sm:w-16 h-1 rounded-full transition-colors ${s.id <= step ? 'bg-cyber-green shadow-[0_0_8px_rgba(34,197,94,0.5)]' : 'bg-zinc-800'}`}
                  />
                </button>
              ))}
            </div>

            <AnimatePresence mode="wait">
              {step === 1 && (
                <Step1_CompanyMission
                  companyInfo={companyInfo}
                  setCompanyInfo={setCompanyInfo}
                  dynamicIndustries={dynamicIndustries}
                  dynamicRegistry={dynamicRegistry}
                  selectedTemplateId={selectedTemplateId}
                  setSelectedTemplateId={setSelectedTemplateId}
                  isCustomIndustry={isCustomIndustry}
                  setIsCustomIndustry={setIsCustomIndustry}
                  customIndustryName={customIndustryName}
                  setCustomIndustryName={setCustomIndustryName}
                  customIndustryPath={customIndustryPath}
                  setCustomIndustryPath={setCustomIndustryPath}
                  showCustomCodeInput={showCustomCodeInput}
                  setShowCustomCodeInput={setShowCustomCodeInput}
                  onAiAssist={handleAiAssist}
                  onLoadSwarmDetails={(path) => { void fetchSwarmDetails(path, true); }}
                  onNext={() => { setStep(2); window.scrollTo({ top: 0, behavior: 'smooth' }); }}
                />
              )}

              {step === 2 && (
                <Step2_Roster
                  agents={agents}
                  onRemoveAgent={removeAgent}
                  onEditAgent={(agent) => { setEditingAgent(agent); setIsEditorModalOpen(true); }}
                  onOpenCatalog={() => setIsCatalogModalOpen(true)}
                  onCreateCustomAgent={handleCreateCustomAgent}
                  onPrevious={() => { setStep(1); window.scrollTo({ top: 0, behavior: 'smooth' }); }}
                  onNext={() => { setStep(3); window.scrollTo({ top: 0, behavior: 'smooth' }); }}
                />
              )}

              {step === 3 && (
                <Step3_Playbooks
                  workflows={workflows}
                  setWorkflows={setWorkflows}
                  companyInfo={companyInfo}
                  onAddWorkflow={addWorkflow}
                  onRemoveWorkflow={removeWorkflow}
                  onPrevious={() => { setStep(2); window.scrollTo({ top: 0, behavior: 'smooth' }); }}
                  onNext={() => { setStep(4); window.scrollTo({ top: 0, behavior: 'smooth' }); }}
                />
              )}

              {step === 4 && (
                <Step4_Connectors
                  mcpCatalog={mcpCatalog}
                  selectedConnectors={selectedConnectors}
                  setSelectedConnectors={setSelectedConnectors}
                  onAddNewMcp={handleAddNewMcp}
                  onEditMcp={(connector) => { setEditingMcp(connector); setIsMcpEditorModalOpen(true); }}
                  onDeleteMcp={handleDeleteMcp}
                  onPrevious={() => { setStep(3); window.scrollTo({ top: 0, behavior: 'smooth' }); }}
                  onNext={() => { setStep(5); window.scrollTo({ top: 0, behavior: 'smooth' }); }}
                />
              )}

              {step === 5 && (
                <Step5_Forge
                  companyInfo={companyInfo}
                  agents={agents}
                  workflows={workflows}
                  validationIssues={validationIssues}
                  isExporting={isExporting}
                  onExport={handleExport}
                  onPrevious={() => { setStep(4); window.scrollTo({ top: 0, behavior: 'smooth' }); }}
                  onReset={handleStartOver}
                />
              )}
            </AnimatePresence>
          </div>
        ) : null}
      </Suspense>

      {/* Community Templates Library Card / Drawer */}
      {showTemplatesLibrary && (
        <section className="w-full my-6 animate-fadeIn">
          <div data-tooltip="Templates Registry: Public database of pre-packaged industrial multi-agent swarms." className="sovereign-panel p-6 flex flex-col min-h-[600px] border-zinc-800/80 bg-zinc-950">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center pb-6 border-b border-zinc-800 gap-4 mb-6">
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="text-xl font-bold tracking-tight text-white flex items-center gap-2">
                    <Cpu className="w-5 h-5 text-cyber-green" /> Pre-built Industry Templates
                  </h2>
                  <span className="px-2 py-0.5 rounded-full bg-zinc-800 text-zinc-300 text-xs font-mono">
                    {dynamicRegistry.length} templates
                  </span>
                </div>
                <p className="text-zinc-400 text-xs mt-1">Explore, edit, and select pre-configured agent swarms in the ecosystem</p>
              </div>
              <div className="flex items-center gap-3 w-full md:w-auto">
                <div className="relative w-full md:w-72">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
                  <input
                    className="w-full bg-zinc-900 border border-zinc-800 rounded-full py-2 pl-10 pr-4 text-xs focus:border-cyber-green outline-none text-zinc-300"
                    placeholder="Search templates..."
                    value={searchTerm}
                    onChange={e => setSearchTerm(e.target.value)}
                  />
                </div>
                <button
                  onClick={() => setShowTemplatesLibrary(false)}
                  className="px-3 py-1.5 rounded-lg bg-zinc-900 border border-zinc-800 hover:bg-zinc-800 text-zinc-400 hover:text-white text-xs font-mono cursor-pointer"
                >
                  Close
                </button>
              </div>
            </div>

            <div className="flex flex-col lg:flex-row gap-6 flex-1 min-h-[480px]">
              <div className="w-full lg:w-2/5 pr-0 lg:pr-6 max-h-[500px] overflow-y-auto custom-scrollbar flex flex-col gap-2 border-r border-zinc-850">
                {filteredTemplates.length === 0 ? (
                  <div className="text-zinc-500 text-xs font-mono p-4 text-center">No templates match search criteria</div>
                ) : (
                  filteredTemplates.map(template => {
                    const isSelected = selectedTemplateId === template.id;
                    return (
                      <button
                        type="button"
                        key={template.id}
                        onClick={() => handleTemplateClick(template)}
                        aria-pressed={isSelected}
                        className={`w-full p-4 rounded-xl border sovereign-transition cursor-pointer text-left ${
                          isSelected
                            ? 'bg-zinc-900 border-cyber-green/50 text-white'
                            : 'bg-zinc-950/40 border-zinc-800 text-zinc-400 hover:border-zinc-700'
                        }`}
                      >
                        <span className="flex justify-between items-start mb-1.5">
                          <span className="text-[10px] font-mono text-zinc-500 uppercase tracking-wider">{template.industry}</span>
                          {isSelected && <span className="w-1.5 h-1.5 bg-cyber-green rounded-full animate-pulse" />}
                        </span>
                        <span className="block font-bold text-sm text-zinc-100">{template.name}</span>
                        <span className="block text-xs text-zinc-400 line-clamp-1 mt-1">{template.description}</span>
                      </button>
                    );
                  })
                )}
              </div>

              <div className="w-full lg:w-3/5 flex flex-col gap-6 bg-zinc-900/30 p-6 rounded-xl border border-zinc-850 max-h-[500px] overflow-y-auto custom-scrollbar">
                {selectedTemplate ? (
                  <div className="flex flex-col gap-6 h-full justify-between">
                    <div className="space-y-4">
                      <div className="flex justify-between items-start">
                        <div className="flex-1">
                          <span className="mono-label text-[10px] text-zinc-500">Selected Template</span>
                          <input
                            className="bg-transparent text-lg font-bold text-white border-b border-zinc-800 hover:border-zinc-700 focus:border-cyber-green outline-none w-full pb-1 mt-1"
                            value={selectedTemplate.name}
                            onChange={e => handleUpdateSelectedTemplate('name', e.target.value)}
                          />
                        </div>
                        <div className="text-right ml-4">
                          <span className="mono-label text-[10px] text-zinc-500 block">Industry</span>
                          <span className="text-[10px] font-mono text-cyber-green uppercase tracking-tighter bg-cyber-green/5 px-2 py-0.5 rounded border border-cyber-green/10 inline-block mt-1">
                            {selectedTemplate.industry}
                          </span>
                        </div>
                      </div>

                      <div>
                        <span className="mono-label text-[10px] text-zinc-500">Description</span>
                        <textarea
                          className="w-full bg-zinc-950/60 border border-zinc-800 rounded-lg p-3 text-xs text-zinc-300 focus:border-cyber-green outline-none min-h-[60px] resize-y mt-1"
                          value={selectedTemplate.description}
                          onChange={e => handleUpdateSelectedTemplate('description', e.target.value)}
                        />
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <span className="mono-label text-[10px] text-zinc-500">Repository Path</span>
                          <div className="bg-zinc-950/60 border border-zinc-800 rounded-lg p-2.5 text-xs text-zinc-400 font-mono mt-1">
                            {selectedTemplate.path}
                          </div>
                        </div>
                        <div>
                          <span className="mono-label text-[10px] text-zinc-500">Default Company Size</span>
                          <div className="bg-zinc-950/60 border border-zinc-800 rounded-lg p-2.5 text-xs text-zinc-400 font-mono mt-1">
                            {selectedTemplate.company_size || 25} Seats
                          </div>
                        </div>
                      </div>

                      <div>
                        <span className="mono-label text-[10px] text-zinc-500 block mb-2">Agents & Roster configuration</span>
                        {isLoadingSwarmDetails ? (
                          <div className="text-xs text-zinc-400 font-mono py-2 animate-pulse flex items-center gap-2">
                            <div className="w-3.5 h-3.5 border-2 border-zinc-800 border-t-cyber-green rounded-full animate-spin" />
                            Fetching roster details from repository...
                          </div>
                        ) : swarmLoadError ? (
                          <div className="p-3 rounded-lg bg-red-950/40 border border-red-900/60 text-red-300 text-xs space-y-2">
                            <div className="flex items-center gap-1.5 font-semibold">
                              <AlertCircle className="w-4 h-4 text-red-400" />
                              <span>Failed to load blueprint</span>
                            </div>
                            <p className="text-[11px] text-red-300/80">{swarmLoadError}</p>
                            <button
                              onClick={() => fetchSwarmDetails(selectedTemplate.path)}
                              className="px-3 py-1 rounded bg-zinc-900 border border-zinc-800 hover:bg-zinc-800 text-zinc-300 text-[11px] font-mono cursor-pointer"
                            >
                              Retry Fetch
                            </button>
                          </div>
                        ) : (
                          <div className="space-y-2">
                            {loadedSwarmDetails?.roster && loadedSwarmDetails.roster.length > 0 ? (
                              loadedSwarmDetails.roster.map((agent: Agent, idx: number) => (
                                <div key={idx} className="bg-zinc-950 border border-zinc-800 p-3 rounded-lg flex justify-between items-center text-xs">
                                  <div className="text-left">
                                    <div className="font-bold text-zinc-200">{agent.name || agent.id}</div>
                                    <div className="text-zinc-500 font-mono text-[10px] mt-0.5">{agent.role || 'Specialist'}</div>
                                  </div>
                                  <span className="text-[9px] font-mono text-zinc-400 bg-zinc-900 border border-zinc-800 px-1.5 py-0.5 rounded">
                                    {agent.model || 'gemma4:31b'}
                                  </span>
                                </div>
                              ))
                            ) : (
                              <div className="text-zinc-500 text-xs font-mono italic">No loaded roster details</div>
                            )}
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="pt-4 border-t border-zinc-850 flex justify-end gap-3">
                      <button
                        onClick={handleLoadSwarmIntoBuilder}
                        disabled={isLoadingSwarmDetails || !loadedSwarmDetails?.roster || loadedSwarmDetails.roster.length === 0 || !!swarmLoadError}
                        className="bg-cyber-green text-zinc-950 font-bold text-xs px-5 py-2.5 rounded-lg hover:bg-cyber-green-light transition-all cursor-pointer flex items-center gap-1.5 shadow-md shadow-cyber-green/20 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        <Download className="w-3.5 h-3.5" /> Load into Swarm Architect
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="flex-1 flex flex-col items-center justify-center text-center p-8">
                    <Cpu className="w-10 h-10 text-zinc-700 mb-3" />
                    <p className="text-zinc-500 text-sm">Select a template from the list to preview details or load it into Swarm Architect.</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </section>
      )}

      {/* Catalog Modal */}
      <Suspense fallback={null}>
        <AnimatePresence>
          {isCatalogModalOpen && (
            <CatalogDrawer
              isOpen={isCatalogModalOpen}
              onClose={() => setIsCatalogModalOpen(false)}
              catalog={catalog}
              isCatalogLoading={isCatalogLoading}
              onAddCatalogAgent={handleAddCatalogAgent}
              departments={departments}
            />
          )}
        </AnimatePresence>
      </Suspense>

      {/* Agent Editor Modal */}
      <Suspense fallback={null}>
        <AnimatePresence>
          {isEditorModalOpen && editingAgent && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-zinc-950/85 backdrop-blur-sm"
            >
              <AgentEditor
                agent={editingAgent}
                onClose={() => {
                  setIsEditorModalOpen(false);
                  setEditingAgent(null);
                }}
                onSave={handleSaveAgent}
              />
            </motion.div>
          )}
        </AnimatePresence>
      </Suspense>

      {/* MCP Editor Modal */}
      <Suspense fallback={null}>
        <AnimatePresence>
          {isMcpEditorModalOpen && editingMcp && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-zinc-950/85 backdrop-blur-sm"
            >
              <McpEditor
                connector={editingMcp}
                onClose={() => {
                  setIsMcpEditorModalOpen(false);
                  setEditingMcp(null);
                }}
                onSave={handleSaveMcp}
              />
            </motion.div>
          )}
        </AnimatePresence>
      </Suspense>

      <footer className="mt-16 pt-8 border-t border-zinc-900 text-zinc-500 text-xs text-center flex flex-col items-center gap-3">
        <div className="flex flex-wrap justify-center items-center gap-4 text-xs">
          <a
            href="https://github.com/DDS-Solutions/AI-Tadpole-OS-Industry-Templates"
            target="_blank"
            rel="noopener noreferrer"
            className="hover:text-cyber-green transition-colors flex items-center gap-1"
          >
            <GithubIcon className="w-3.5 h-3.5" /> Repository
          </a>
          <span className="text-zinc-700">•</span>
          <a
            href="https://github.com/DDS-Solutions/AI-Tadpole-OS-Industry-Templates/blob/main/LICENSE"
            target="_blank"
            rel="noopener noreferrer"
            className="hover:text-cyber-green transition-colors flex items-center gap-1"
          >
            <FileText className="w-3.5 h-3.5" /> Apache 2.0 License
          </a>
          <span className="text-zinc-700">•</span>
          <a
            href="https://github.com/DDS-Solutions/AI-Tadpole-OS-Industry-Templates/blob/main/TEMPLATE_SPEC.md"
            target="_blank"
            rel="noopener noreferrer"
            className="hover:text-cyber-green transition-colors flex items-center gap-1"
          >
            <BookOpen className="w-3.5 h-3.5" /> Specifications & Contract
          </a>
        </div>
        <div className="text-[10px] font-mono text-zinc-600 tracking-widest uppercase">
          AI-Tadpole-OS Swarm Architect • 68 Contract-Validated Industry Templates • 274 Persona Catalog
        </div>
        <button
          onClick={handleStartOver}
          className="text-zinc-600 hover:text-red-400 transition-colors flex items-center gap-1 cursor-pointer font-sans normal-case text-xs mt-1"
        >
          <RotateCcw className="w-3 h-3" /> Reset Session
        </button>
      </footer>
    </div>
  );
}
