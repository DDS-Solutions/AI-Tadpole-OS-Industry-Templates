import { useState, useEffect } from 'react';
import { 
  Shield, 
  Cpu, 
  Search,
  Download
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

import type { Agent, WorkflowItem, TemplateItem, CatalogAgent, MCPConnector } from './types';
import { INDUSTRY_MAP, REGISTRY, INDUSTRY_CODES_MAP } from './constants';

import McpEditor from './components/Modals/McpEditor';
import AgentEditor from './components/Modals/AgentEditor';
import CatalogDrawer from './components/Modals/CatalogDrawer';
import Step1_CompanyMission from './components/Steps/Step1_CompanyMission';
import Step2_Roster from './components/Steps/Step2_Roster';
import Step3_Playbooks from './components/Steps/Step3_Playbooks';
import Step4_Connectors from './components/Steps/Step4_Connectors';
import Step5_Forge from './components/Steps/Step5_Forge';
import { exportSwarmZip, fetchSwarmDetailsFromRepo } from './utils/fileHelpers';

export default function App() {
  const [step, setStep] = useState(1);
  const [searchTerm, setSearchTerm] = useState('');
  
  // Custom State Inputs
  const [companyInfo, setCompanyInfo] = useState({
    name: '',
    size: '25',
    description: '',
    mission: '',
    industry: '',
    industryPath: '',
    industryCode: ''
  });

  const [isCustomIndustry, setIsCustomIndustry] = useState(false);
  const [customIndustryName, setCustomIndustryName] = useState('');
  const [customIndustryPath, setCustomIndustryPath] = useState('');
  const [showCustomCodeInput, setShowCustomCodeInput] = useState(false);

  const [selectedTemplateId, setSelectedTemplateId] = useState<string | null>(null);
  const [selectedTemplate, setSelectedTemplate] = useState<TemplateItem | null>(null);
  const [isLoadingSwarmDetails, setIsLoadingSwarmDetails] = useState(false);
  const [loadedSwarmDetails, setLoadedSwarmDetails] = useState<{ roster: Agent[]; workflows: WorkflowItem[] } | null>(null);

  // MCP Connectors State
  const [mcpCatalog, setMcpCatalog] = useState<MCPConnector[]>([]);
  const [selectedConnectors, setSelectedConnectors] = useState<string[]>([]);
  const [isMcpEditorModalOpen, setIsMcpEditorModalOpen] = useState(false);
  const [editingMcp, setEditingMcp] = useState<MCPConnector | null>(null);

  // Catalog & Editor State
  const [catalog, setCatalog] = useState<CatalogAgent[]>([]);
  const [isCatalogLoading, setIsCatalogLoading] = useState(false);
  const [isCatalogModalOpen, setIsCatalogModalOpen] = useState(false);

  const [isEditorModalOpen, setIsEditorModalOpen] = useState(false);
  const [editingAgent, setEditingAgent] = useState<Agent | null>(null);

  const [agents, setAgents] = useState<Agent[]>([]);
  const [workflows, setWorkflows] = useState<WorkflowItem[]>([]);
  const [dynamicIndustries, setDynamicIndustries] = useState<typeof INDUSTRY_MAP>(INDUSTRY_MAP);
  const [dynamicRegistry, setDynamicRegistry] = useState<TemplateItem[]>(REGISTRY);

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
    { id: 'security', label: 'Security', color: '#EF4444', desc: 'Prompt injection mitigation, vulnerability scanning, and permission gateways.' },
    { id: 'spatial-computing', label: 'Spatial Computing', color: '#06B6D4', desc: 'AR/VR tracking systems, 3D math, and sensory coordinate translation.' },
    { id: 'specialized', label: 'Specialized', color: '#6366F1', desc: 'Domain-expert roles tailored for atypical workflows.' },
    { id: 'support', label: 'Support', color: '#84CC16', desc: 'Troubleshooting guides, ticket analysis, and user guide generation.' },
    { id: 'testing', label: 'Testing', color: '#F59E0B', desc: 'Unit tests compilation, boundary validation, and QA logic audits.' }
  ];

  useEffect(() => {
    const controller = new AbortController();
    setIsCatalogLoading(true);

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
          const registryTemplates = data.templates.map((t: TemplateItem) => ({
            id: t.id,
            name: t.name,
            description: t.description || '',
            industry: t.industry,
            path: t.path,
            tags: t.tags || [],
            company_size: t.company_size
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

  const removeAgent = (id: string) => {
    setAgents(agents.filter(a => a.id !== id));
  };

  const handleCreateCustomAgent = () => {
    const id = 'custom-' + crypto.randomUUID();
    const newAgent: Agent = {
      id,
      name: 'Custom Agent',
      role: 'Custom Specialist',
      model: 'gemini-1.5-flash',
      prompt: '# Custom Agent Personality\n\nYou are a specialized AI assistant...\n\n## 🧠 Your Identity & Memory\n- **Role**: Custom Specialist\n- **Personality**: Professional, analytical, proactive\n\n## 🎯 Your Core Mission\n- Execute tasks efficiently to support the swarm.\n\n## 🚨 Critical Rules You Must Follow\n- Adhere to the core system instructions.',
      description: 'Custom AI agent defined from scratch.',
      color: '#71717a',
      emoji: '🤖',
      vibe: 'Custom defined role.',
      isCustom: true
    };
    setAgents([...agents, newAgent]);
    setEditingAgent(newAgent);
    setIsEditorModalOpen(true);
  };

  const handleAddCatalogAgent = (catalogAgent: CatalogAgent) => {
    const id = catalogAgent.id.replace(/[^a-zA-Z0-9-]/g, '-') + '-' + crypto.randomUUID().slice(0, 8);
    const newAgent: Agent = {
      id,
      name: catalogAgent.name,
      role: catalogAgent.vibe || catalogAgent.description.slice(0, 50) || 'Specialist',
      model: 'gemini-1.5-flash',
      prompt: catalogAgent.prompt,
      description: catalogAgent.description,
      color: catalogAgent.color,
      emoji: catalogAgent.emoji,
      vibe: catalogAgent.vibe,
      isCustom: false
    };
    setAgents([...agents, newAgent]);
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
    const id = crypto.randomUUID();
    setWorkflows([...workflows, { 
      id, 
      name: 'New Workflow/Playbook', 
      description: '',
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
    const desc = companyInfo.description.toLowerCase();
    if (!desc || catalog.length === 0) return;

    const tokens = desc.split(/[^a-zA-Z0-9]+/).filter(t => t.length > 3);
    const scoredAgents = catalog.map(agent => {
      let score = 0;
      const searchSpace = `${agent.name} ${agent.vibe} ${agent.description} ${agent.departmentLabel}`.toLowerCase();
      tokens.forEach(token => {
        if (searchSpace.includes(token)) score += 1;
      });
      return { agent, score };
    });

    const matches = scoredAgents
      .filter(item => item.score > 0)
      .sort((a, b) => b.score - a.score)
      .slice(0, 3)
      .map(item => item.agent);

    if (matches.length > 0) {
      const matchSector = dynamicIndustries.find(i => i.keywords.some(k => desc.includes(k)));
      const industryName = matchSector?.name || companyInfo.industry || 'Software Development';
      const industryPath = matchSector?.path || companyInfo.industryPath || 'development';
      const defaultCode = INDUSTRY_CODES_MAP[industryName]?.[0]?.code || ('NAICS ' + (Math.floor(Math.random() * 90000) + 10000));

      setIsCustomIndustry(false);
      setShowCustomCodeInput(false);
      
      setCompanyInfo({
        ...companyInfo,
        mission: `To revolutionize ${companyInfo.description.toLowerCase()} through sovereign intelligence and automated workflows.`,
        industry: industryName,
        industryPath: industryPath,
        industryCode: defaultCode
      });

      const suggestedSwarmAgents = matches.map((catAgent) => ({
        id: catAgent.id.replace(/[^a-zA-Z0-9-]/g, '-') + '-' + crypto.randomUUID().slice(0, 8),
        name: catAgent.name,
        role: catAgent.vibe || catAgent.description.slice(0, 50) || 'Specialist',
        model: 'gemini-1.5-flash',
        prompt: catAgent.prompt,
        description: catAgent.description,
        color: catAgent.color,
        emoji: catAgent.emoji,
        vibe: catAgent.vibe,
        isCustom: false
      }));

      setAgents([
        { 
          id: '1', 
          name: 'Lead Orchestrator', 
          role: 'General Coordinator', 
          model: 'gemini-pro-latest', 
          prompt: 'Coordinate swarm operations...',
          color: '#71717a',
          emoji: '👑',
          description: 'Orchestrates incoming tasks and matches roles.'
        },
        ...suggestedSwarmAgents
      ]);
    }
  };

  const handleExport = () => {
    exportSwarmZip(companyInfo, agents, workflows, selectedConnectors, mcpCatalog);
  };

  const fetchSwarmDetails = async (templatePath: string) => {
    setIsLoadingSwarmDetails(true);
    setLoadedSwarmDetails(null);
    try {
      const details = await fetchSwarmDetailsFromRepo(templatePath);
      setLoadedSwarmDetails(details);
    } catch (err) {
      console.error("Error fetching swarm details:", err);
      setLoadedSwarmDetails({ roster: [], workflows: [] });
    } finally {
      setIsLoadingSwarmDetails(false);
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
    if (!selectedTemplate) return;

    const match = dynamicIndustries.find(i => i.name === selectedTemplate.industry);
    setCompanyInfo({
      name: selectedTemplate.name,
      description: selectedTemplate.description,
      mission: `To revolutionize ${selectedTemplate.description.toLowerCase()} through sovereign intelligence and automated ${selectedTemplate.industry.toLowerCase()} flows.`,
      industry: selectedTemplate.industry,
      industryPath: match?.path || selectedTemplate.path.split('/')[0] || '',
      industryCode: INDUSTRY_CODES_MAP[selectedTemplate.industry]?.[0]?.code || '',
      size: (selectedTemplate.company_size || 25).toString()
    });

    if (loadedSwarmDetails?.roster && loadedSwarmDetails.roster.length > 0) {
      setAgents(loadedSwarmDetails.roster);
    } else {
      setAgents([
        { id: '1', name: 'Lead Orchestrator', role: 'General Coordinator', model: 'gemini-pro-latest', prompt: 'Coordinate swarm operations...' }
      ]);
    }

    if (loadedSwarmDetails?.workflows && loadedSwarmDetails.workflows.length > 0) {
      setWorkflows(loadedSwarmDetails.workflows);
    } else {
      setWorkflows([
        { id: '1', name: 'Standard Triage', description: 'Analyze incoming data and route to appropriate agent.' }
      ]);
    }

    setStep(1);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const filteredTemplates = dynamicRegistry.filter(t => 
    t.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
    t.industry.toLowerCase().includes(searchTerm.toLowerCase()) ||
    t.tags.some(tag => tag.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  return (
    <div className="min-h-screen p-4 md:p-8 flex flex-col items-center max-w-5xl mx-auto animate-fade-in">
      {/* Header */}
      <header className="w-full flex justify-between items-center mb-12">
        <div className="flex items-center gap-3">
          <div className="bg-cyber-green/20 p-2 rounded-xl border border-cyber-green/30">
            <Shield className="text-cyber-green w-6 h-6" />
          </div>
          <div>
            <h1 className="text-xl font-bold tracking-tight">Swarm Architect</h1>
            <p className="text-xs text-zinc-500 font-mono uppercase tracking-widest">Tadpole OS Engine</p>
          </div>
        </div>
        <div className="flex gap-3">
          {[
            { id: 1, label: 'Pulse' },
            { id: 2, label: 'Roster' },
            { id: 3, label: 'Playbooks' },
            { id: 4, label: 'Connectors' },
            { id: 5, label: 'Forge' }
          ].map(s => (
            <div key={s.id} className="flex flex-col items-center gap-1.5">
              <span className={`text-[9px] font-mono uppercase tracking-widest transition-colors ${s.id <= step ? 'text-cyber-green' : 'text-zinc-650'}`}>
                {s.label}
              </span>
              <div 
                className={`w-12 h-1 rounded-full transition-colors ${s.id <= step ? 'bg-cyber-green shadow-[0_0_8px_rgba(34,197,94,0.5)]' : 'bg-zinc-800'}`} 
              />
            </div>
          ))}
        </div>
      </header>

      {/* Steps Panels */}
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
            onLoadSwarmDetails={fetchSwarmDetails}
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
            onExport={handleExport}
            onPrevious={() => { setStep(4); window.scrollTo({ top: 0, behavior: 'smooth' }); }}
            onReset={() => { setStep(1); window.scrollTo({ top: 0, behavior: 'smooth' }); }}
          />
        )}
      </AnimatePresence>

      {/* Community Templates Library Card */}
      <section className="w-full mt-24 mb-12">
        <div data-tooltip="Templates Registry: Public database of pre-packaged industrial multi-agent swarms." className="sovereign-panel p-6 flex flex-col min-h-[600px] border-zinc-800/50">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center pb-6 border-b border-zinc-800 gap-4 mb-6" style={{ borderColor: 'color-mix(in srgb, var(--color-border) 40%, transparent)' }}>
            <div>
              <h2 className="text-xl font-bold tracking-tight text-white flex items-center gap-2" data-tooltip="Browse community-contributed templates configured for various commercial business sectors.">
                <Cpu className="w-5 h-5 text-cyber-green" /> Community Templates Library
              </h2>
              <p className="text-zinc-500 text-xs mt-1">Explore, edit, and select pre-configured agent swarms in the ecosystem</p>
            </div>
            <div className="relative w-full md:w-80">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
              <input 
                className="w-full bg-zinc-950 border border-zinc-800 rounded-full py-2 pl-10 pr-4 text-sm focus:border-cyber-green outline-none text-zinc-300"
                placeholder="Search library..."
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                data-tooltip="Search filters templates by business name, tags, and sector categories."
              />
            </div>
          </div>

          <div className="flex flex-col lg:flex-row gap-6 flex-1 min-h-[480px]">
            <div className="w-full lg:w-2/5 pr-0 lg:pr-6 max-h-[500px] overflow-y-auto custom-scrollbar flex flex-col gap-2" style={{ borderRight: '1px solid color-mix(in srgb, var(--color-border) 45%, transparent)' }}>
              {filteredTemplates.length === 0 ? (
                <div className="text-zinc-650 text-sm font-mono p-4 text-center">No templates match search criteria</div>
              ) : (
                filteredTemplates.map(template => {
                  const isSelected = selectedTemplateId === template.id;
                  return (
                    <div
                      key={template.id}
                      onClick={() => handleTemplateClick(template)}
                      data-tooltip="Click to inspect this swarm template's roster and playbook SOP steps."
                      className={`p-4 rounded-xl border sovereign-transition cursor-pointer text-left ${
                        isSelected 
                          ? 'bg-zinc-900 border-cyber-green/50 text-white' 
                          : 'bg-zinc-950/40 border-zinc-800 text-zinc-400 hover:border-zinc-700'
                      }`}
                    >
                      <div className="flex justify-between items-start mb-2">
                        <span className="text-[10px] font-mono text-zinc-500 uppercase tracking-wider">{template.industry}</span>
                        {isSelected && <span className="w-1.5 h-1.5 bg-cyber-green rounded-full animate-pulse" />}
                      </div>
                      <h4 className="font-bold text-sm text-zinc-100">{template.name}</h4>
                      <p className="text-xs text-zinc-500 line-clamp-1 mt-1">{template.description}</p>
                    </div>
                  );
                })
              )}
            </div>

            <div className="w-full lg:w-3/5 flex flex-col gap-6 bg-zinc-950/20 p-6 rounded-xl border border-zinc-850/60 max-h-[500px] overflow-y-auto custom-scrollbar" style={{ borderColor: 'color-mix(in srgb, var(--color-border) 30%, transparent)' }}>
              {selectedTemplate ? (
                <div className="flex flex-col gap-6 h-full justify-between">
                  <div className="space-y-4">
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <span className="mono-label text-[10px] text-zinc-500">Selected Swarm Template</span>
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
                        className="w-full bg-zinc-950/60 border border-zinc-855 rounded-lg p-3 text-xs text-zinc-300 focus:border-cyber-green outline-none min-h-[60px] resize-y mt-1"
                        value={selectedTemplate.description}
                        onChange={e => handleUpdateSelectedTemplate('description', e.target.value)}
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <span className="mono-label text-[10px] text-zinc-500">Path</span>
                        <div className="bg-zinc-950/60 border border-zinc-800 rounded-lg p-2.5 text-xs text-zinc-400 font-mono mt-1" style={{ borderColor: 'color-mix(in srgb, var(--color-border) 40%, transparent)' }}>
                          {selectedTemplate.path}
                        </div>
                      </div>
                      <div>
                        <span className="mono-label text-[10px] text-zinc-500">Default Company Size</span>
                        <div className="bg-zinc-950/60 border border-zinc-800 rounded-lg p-2.5 text-xs text-zinc-400 font-mono mt-1" style={{ borderColor: 'color-mix(in srgb, var(--color-border) 40%, transparent)' }}>
                          {selectedTemplate.company_size || 25} Seats
                        </div>
                      </div>
                    </div>

                    <div>
                      <span className="mono-label text-[10px] text-zinc-500 block mb-2">Agents & Roster configuration</span>
                      {isLoadingSwarmDetails ? (
                        <div className="text-xs text-zinc-550 font-mono py-2 animate-pulse flex items-center gap-2">
                          <div className="w-3.5 h-3.5 border-2 border-zinc-800 border-t-cyber-green rounded-full animate-spin" />
                          Fetching roster details...
                        </div>
                      ) : (
                        <div className="space-y-2">
                          {loadedSwarmDetails?.roster && loadedSwarmDetails.roster.length > 0 ? (
                            loadedSwarmDetails.roster.map((agent: any, idx: number) => (
                              <div key={idx} className="bg-zinc-950/80 border border-zinc-850 p-3 rounded-lg flex justify-between items-center text-xs" style={{ borderColor: 'color-mix(in srgb, var(--color-border) 30%, transparent)' }}>
                                <div className="text-left">
                                  <div className="font-bold text-zinc-200">{agent.name || agent.id}</div>
                                  <div className="text-zinc-500 font-mono text-[10px] mt-0.5">{agent.role || 'Agent Role'}</div>
                                </div>
                                <span className="text-[9px] font-mono text-zinc-500 bg-zinc-900 border border-zinc-800 px-1.5 py-0.5 rounded">
                                  {agent.model || 'gemini-pro-latest'}
                                </span>
                              </div>
                            ))
                          ) : (
                            <div className="text-zinc-600 text-xs font-mono italic">No loaded roster details (click template or try checking connection)</div>
                          )}
                        </div>
                      )}
                    </div>

                    <div>
                      <span className="mono-label text-[10px] text-zinc-500 block">Tags (comma-separated)</span>
                      <input 
                        className="w-full bg-zinc-950/60 border border-zinc-805 rounded-lg p-2.5 text-xs text-zinc-300 focus:border-cyber-green outline-none mt-1"
                        style={{ borderColor: 'color-mix(in srgb, var(--color-border) 40%, transparent)' }}
                        placeholder="e.g. law, audit, compliance"
                        value={selectedTemplate.tags.join(', ')}
                        onChange={e => {
                          const tagList = e.target.value.split(',').map(t => t.trim()).filter(Boolean);
                          handleUpdateSelectedTemplate('tags', tagList);
                        }}
                      />
                      <div className="flex flex-wrap gap-2 mt-2">
                        {selectedTemplate.tags.map((tag: string, idx: number) => (
                          <span key={idx} className="text-[10px] text-zinc-400 bg-zinc-950 px-2 py-1 rounded-md border border-zinc-800">
                            #{tag}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>

                  <div className="pt-4 border-t border-zinc-900 flex justify-end gap-3" style={{ borderColor: 'color-mix(in srgb, var(--color-border) 40%, transparent)' }}>
                    <button
                      onClick={handleLoadSwarmIntoBuilder}
                      disabled={isLoadingSwarmDetails || !loadedSwarmDetails}
                      className="bg-cyber-green text-zinc-950 font-bold text-xs px-5 py-2.5 rounded-lg hover:scale-102 transition-all cursor-pointer flex items-center gap-1.5 shadow-[0_0_12px_rgba(34,197,94,0.15)] disabled:opacity-50"
                    >
                      <Download className="w-3.5 h-3.5" /> Load into Swarm Architect
                    </button>
                  </div>
                </div>
              ) : (
                <div className="flex-1 flex flex-col items-center justify-center text-center p-8">
                  <Cpu className="w-10 h-10 text-zinc-700 mb-3" />
                  <p className="text-zinc-500 text-sm">Select a template from the list to preview details, edit configuration, or load it into the workspace.</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* Catalog Modal */}
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

      {/* Agent Editor Modal */}
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

      {/* MCP Editor Modal */}
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

      <footer className="mt-12 text-zinc-650 text-[10px] font-mono tracking-widest uppercase">
        Sovereign Reality Systems • 2026 • Verified SEC-ARA
      </footer>
    </div>
  );
}
