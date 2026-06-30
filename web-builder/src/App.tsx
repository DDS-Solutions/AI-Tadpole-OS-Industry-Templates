import { useState, useEffect } from 'react';
import { 
  Shield, 
  Cpu, 
  Workflow, 
  Download, 
  Plus, 
  Trash2, 
  Search,
  Zap,
  Globe,
  Users,
  X,
  Sliders,
  BookOpen,
  Sparkles,
  Database
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import JSZip from 'jszip';
import { highlightText, scanShieldCapabilities } from './utils';

import type { Agent, WorkflowItem, TemplateItem, CatalogAgent, MCPConnector } from './types';
import { INDUSTRY_MAP, REGISTRY, INDUSTRY_CODES_MAP } from './constants';

import AgentEditor from './components/Modals/AgentEditor';

export default function App() {
  const [step, setStep] = useState(1);
  const [searchTerm, setSearchTerm] = useState('');
  const [companyInfo, setCompanyInfo] = useState({
    name: '',
    description: '',
    mission: '',
    industry: '',
    industryPath: '',
    industryCode: '',
    size: '25'
  });
  const [agents, setAgents] = useState<Agent[]>([
    { id: '1', name: 'Lead Orchestrator', role: 'General Coordinator', model: 'gemini-pro-latest', prompt: 'Coordinate swarm operations...' }
  ]);
  const [workflows, setWorkflows] = useState<WorkflowItem[]>([
    { id: '1', name: 'Standard Triage', description: 'Analyze incoming data and route to appropriate agent.' }
  ]);

  const [dynamicIndustries, setDynamicIndustries] = useState(INDUSTRY_MAP);
  const [dynamicRegistry, setDynamicRegistry] = useState<TemplateItem[]>(REGISTRY);
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

  // Catalog & Editor State
  const [catalog, setCatalog] = useState<CatalogAgent[]>([]);
  const [isCatalogLoading, setIsCatalogLoading] = useState(false);
  const [isCatalogModalOpen, setIsCatalogModalOpen] = useState(false);
  const [catalogSearch, setCatalogSearch] = useState('');
  const [selectedCatalogDept, setSelectedCatalogDept] = useState('all');
  const [selectedCatalogAgentId, setSelectedCatalogAgentId] = useState<string | null>(null);

  const [isEditorModalOpen, setIsEditorModalOpen] = useState(false);
  const [editingAgent, setEditingAgent] = useState<Agent | null>(null);

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
        if (err.name !== 'AbortError') {
          console.error("Error loading registry.json:", err);
        }
      });

    fetch('./mcp_registry.json', { signal: controller.signal })
      .then(res => res.json())
      .then(data => {
        if (data && data.connectors) {
          setMcpCatalog(data.connectors);
        }
      })
      .catch(err => {
        if (err.name !== 'AbortError') {
          console.error("Error loading mcp_registry.json:", err);
        }
      });

    fetch('./ai-tadpole-catalog.json', { signal: controller.signal })
      .then(res => res.json())
      .then(data => {
        if (Array.isArray(data)) {
          setCatalog(data);
        }
      })
      .catch(err => {
        if (err.name !== 'AbortError') {
          console.error("Error loading ai-tadpole-catalog.json:", err);
        }
      })
      .finally(() => {
        if (!controller.signal.aborted) {
          setIsCatalogLoading(false);
        }
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

    // Split user description into tokens and filter out short terms
    const tokens = desc.split(/[^a-zA-Z0-9]+/).filter(t => t.length > 3);
    
    // Score each catalog agent based on word matches
    const scoredAgents = catalog.map(agent => {
      let score = 0;
      const searchSpace = `${agent.name} ${agent.vibe} ${agent.description} ${agent.departmentLabel}`.toLowerCase();
      
      tokens.forEach(token => {
        if (searchSpace.includes(token)) {
          score += 1;
        }
      });
      
      return { agent, score };
    });

    // Sort by score descending and filter those with score > 0
    const matches = scoredAgents
      .filter(item => item.score > 0)
      .sort((a, b) => b.score - a.score)
      .slice(0, 3)
      .map(item => item.agent);

    if (matches.length > 0) {
      // Find matching industry sector
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

      // Map matching catalog agents to swarm agents
      const suggestedSwarmAgents = matches.map((catAgent) => {
        return {
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
        };
      });

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

  const handleExport = async () => {
    const zip = new JSZip();
    
    // Group workflows into standard workflows vs knowledge playbooks
    const standardWorkflows = workflows.filter(w => !w.isOkfPlaybook);
    const okfPlaybooks = workflows.filter(w => w.isOkfPlaybook);

    // swarm.json
    const required_mcps = selectedConnectors.map(id => {
      const c = mcpCatalog.find(mc => mc.id === id);
      return c ? `${c.path}/mcps.json` : '';
    }).filter(Boolean);

    const swarmJson: any = {
      $schema: "https://tadpoleos.dev/schemas/swarm-v1.json",
      name: `${companyInfo.name} Swarm`,
      version: "1.0.0",
      description: companyInfo.mission,
      industry: companyInfo.industry.toLowerCase(),
      company_size: parseInt(companyInfo.size),
      roster: agents.map(a => ({
        id: a.id,
        path: `agents/${a.id}.json`,
        role: a.role
      })),
      global_workflows: standardWorkflows.map(w => `workflows/${w.id}.md`)
    };

    if (required_mcps.length > 0) {
      swarmJson.required_mcps = required_mcps;
    }
    
    zip.file("swarm.json", JSON.stringify(swarmJson, null, 2));
    
    // agents/*.json
    const agentsFolder = zip.folder("agents");
    agents.forEach(agent => {
      agentsFolder?.file(`${agent.id}.json`, JSON.stringify({
        id: agent.id,
        name: agent.name,
        role: agent.role,
        model: agent.model,
        system_prompt: agent.prompt
      }, null, 2));
    });
    
    // workflows/*.md
    if (standardWorkflows.length > 0) {
      const workflowsFolder = zip.folder("workflows");
      standardWorkflows.forEach(workflow => {
        workflowsFolder?.file(`${workflow.id}.md`, `# Workflow: ${workflow.name}\n\n${workflow.description}`);
      });
    }

    // Ingest knowledge playbooks if any are defined
    if (okfPlaybooks.length > 0) {
      // Create knowledge.json
      const knowledgeJson = okfPlaybooks.map(w => ({
        title: w.name,
        description: w.description.slice(0, 200), // excerpt for desc
        topic: w.topic || companyInfo.industry.toLowerCase() || 'general',
        concept_type: w.conceptType || 'playbook',
        resource_uri: w.resourceUri || undefined,
        tags: w.tags || companyInfo.industry.toLowerCase() || 'general',
        text: w.description
      }));
      zip.file("knowledge.json", JSON.stringify(knowledgeJson, null, 2));

      // Create knowledge/*.md with YAML frontmatter
      const knowledgeFolder = zip.folder("knowledge");
      okfPlaybooks.forEach(w => {
        const cleanName = w.name.toLowerCase().replace(/[^a-z0-9]/g, '_');
        const frontmatter = [
          "---",
          `title: "${w.name.replace(/"/g, '\\"')}"`,
          w.resourceUri ? `url: "${w.resourceUri}"` : null,
          w.tags ? `tags: "${w.tags.replace(/"/g, '\\"')}"` : null,
          `description: "${w.description.slice(0, 150).replace(/\n/g, ' ').replace(/"/g, '\\"')}"`,
          "---",
          "",
          `# ${w.name}`,
          "",
          w.description
        ].filter(Boolean).join("\n");
        knowledgeFolder?.file(`${cleanName}.md`, frontmatter);
      });
    }
    
    const content = await zip.generateAsync({ type: "blob" });
    const url = window.URL.createObjectURL(content);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${companyInfo.name.toLowerCase().replace(/\s+/g, '-')}-swarm.zip`;
    link.click();
  };

  const fetchSwarmDetails = async (templatePath: string) => {
    setIsLoadingSwarmDetails(true);
    setLoadedSwarmDetails(null);
    try {
      const rawBase = `https://raw.githubusercontent.com/DDS-Solutions/AI-Tadpole-OS-Industry-Templates/main/${templatePath}`;
      const response = await fetch(`${rawBase}/swarm.json`);
      if (!response.ok) throw new Error("Failed to fetch swarm.json");
      const swarmData = await response.json();

      // Fetch agents details from swarmData.roster
      const rosterWithDetails = await Promise.all(
        (swarmData.roster || []).map(async (agentRef: { id: string; path: string; role: string }) => {
          try {
            const agentRes = await fetch(`${rawBase}/${agentRef.path}`);
            if (agentRes.ok) {
              const agentDetails = await agentRes.json();
              return {
                id: agentRef.id,
                name: agentDetails.name || agentRef.id,
                role: agentDetails.role || agentRef.role || '',
                model: agentDetails.model_id || agentDetails.model || agentDetails.model_config?.model_id || 'gemini-pro-latest',
                prompt: agentDetails.system_prompt || agentDetails.model_config?.system_prompt || ''
              };
            }
          } catch (e) {
            console.error("Error loading agent details", e);
          }
          return {
            id: agentRef.id,
            name: agentRef.id,
            role: agentRef.role || '',
            model: 'gemini-pro-latest',
            prompt: ''
          };
        })
      );

      // Fetch workflows details from swarmData.global_workflows
      const workflowsWithDetails = await Promise.all(
        (swarmData.global_workflows || []).map(async (workflowPath: string) => {
          try {
            const workflowRes = await fetch(`${rawBase}/${workflowPath}`);
            if (workflowRes.ok) {
              const mdContent = await workflowRes.text();
              const nameMatch = mdContent.match(/^#\s*Workflow:\s*(.*)$/m) || mdContent.match(/^#\s*(.*)$/m);
              const name = nameMatch ? nameMatch[1].trim() : workflowPath.split('/').pop()?.replace('.md', '') || 'Workflow';
              const description = mdContent.replace(/^#.*$/m, '').trim();
              return {
                id: crypto.randomUUID(),
                name,
                description,
                isOkfPlaybook: false
              };
            }
          } catch (e) {
            console.error("Error loading workflow details", e);
          }
          return {
            id: crypto.randomUUID(),
            name: workflowPath.split('/').pop()?.replace('.md', '') || 'Workflow',
            description: '',
            isOkfPlaybook: false
          };
        })
      );

      // Fetch knowledge/ playbooks (from knowledge.json if it exists)
      let okfPlaybooks: WorkflowItem[] = [];
      try {
        const knowledgeRes = await fetch(`${rawBase}/knowledge.json`);
        if (knowledgeRes.ok) {
          const knowledgeData = await knowledgeRes.json();
          okfPlaybooks = (knowledgeData || []).map((k: { title?: string; name?: string; text?: string; description?: string; resource_uri?: string; topic?: string; concept_type?: string; tags?: string }) => ({
            id: crypto.randomUUID(),
            name: k.title || k.name || 'Knowledge Playbook',
            description: k.text || k.description || '',
            isOkfPlaybook: true,
            resourceUri: k.resource_uri || '',
            topic: k.topic || '',
            conceptType: k.concept_type || 'playbook',
            tags: k.tags || ''
          }));
        }
      } catch (e) {
        // knowledge.json is optional
      }

      setLoadedSwarmDetails({
        roster: rosterWithDetails,
        workflows: [...workflowsWithDetails, ...okfPlaybooks]
      });
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
    <div className="min-h-screen p-4 md:p-8 flex flex-col items-center max-w-5xl mx-auto">
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
              <span className={`text-[9px] font-mono uppercase tracking-widest transition-colors ${s.id <= step ? 'text-cyber-green' : 'text-zinc-600'}`}>
                {s.label}
              </span>
              <div 
                className={`w-12 h-1 rounded-full transition-colors ${s.id <= step ? 'bg-cyber-green shadow-[0_0_8px_rgba(34,197,94,0.5)]' : 'bg-zinc-800'}`} 
              />
            </div>
          ))}
        </div>
      </header>

      {/* Main Content */}
      <AnimatePresence mode="wait">
        {step === 1 && (
          <motion.div 
            key="step1"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            data-tooltip="Phase 1: Configures your organization's metadata, NAICS/SIC industry code classification, and target directory paths."
            className="w-full sovereign-panel p-8"
          >
            <div className="flex items-center gap-2 mb-6 text-cyber-green">
              <Globe className="w-5 h-5" />
              <h2 className="font-bold text-lg" data-tooltip="The baseline settings of the swarm identity and directory path settings.">Phase 1: The Pulse</h2>
            </div>
            
            <div className="space-y-6">
              <div>
                <label className="block text-xs font-mono uppercase text-zinc-500 mb-2 cursor-help" data-tooltip="Specify the primary organization or business name associated with this multi-agent swarm blueprint.">Company / Swarm Name</label>
                <input 
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-lg p-3 focus:border-cyber-green outline-none transition-colors"
                  placeholder="e.g. My Enterprise Swarm"
                  value={companyInfo.name}
                  onChange={e => setCompanyInfo({...companyInfo, name: e.target.value})}
                />
              </div>
 
              {isCustomIndustry && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 p-4 bg-zinc-950 border border-zinc-800 rounded-lg">
                  <div>
                    <label className="block text-xs font-mono uppercase text-zinc-500 mb-2 cursor-help" data-tooltip="Set the custom industry sector label if not matching the pre-defined catalog options.">Custom Industry Name</label>
                    <input 
                      className="w-full bg-zinc-900 border border-zinc-800 rounded-lg p-3 focus:border-cyber-green outline-none transition-colors"
                      placeholder="e.g. Biotech Research"
                      value={customIndustryName}
                      onChange={e => {
                        setCustomIndustryName(e.target.value);
                        const autoPath = e.target.value.toLowerCase().replace(/ & /g, '-').replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');
                        setCustomIndustryPath(autoPath);
                        setCompanyInfo({
                          ...companyInfo,
                          industry: e.target.value,
                          industryPath: autoPath
                        });
                      }}
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-mono uppercase text-zinc-500 mb-2 cursor-help" data-tooltip="The relative directory name that will store agent configuration profiles inside the repository.">Custom Target Directory Path</label>
                    <input 
                      className="w-full bg-zinc-900 border border-zinc-800 rounded-lg p-3 focus:border-cyber-green outline-none transition-colors"
                      placeholder="e.g. biotech"
                      value={customIndustryPath}
                      onChange={e => {
                        setCustomIndustryPath(e.target.value);
                        setCompanyInfo({
                          ...companyInfo,
                          industryPath: e.target.value
                        });
                      }}
                    />
                  </div>
                </div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-xs font-mono uppercase text-zinc-500 mb-2 cursor-help" data-tooltip="Choose from pre-defined industry templates to populate standard playbook steps and agent configurations.">Industry / Sector</label>
                  <select 
                    className="w-full bg-zinc-950 border border-zinc-800 rounded-lg p-3 focus:border-cyber-green outline-none"
                    value={isCustomIndustry ? "CUSTOM" : companyInfo.industry}
                    onChange={e => {
                      if (e.target.value === "CUSTOM") {
                        setIsCustomIndustry(true);
                        setCompanyInfo({
                          ...companyInfo,
                          industry: customIndustryName,
                          industryPath: customIndustryPath
                        });
                      } else {
                        setIsCustomIndustry(false);
                        const match = dynamicIndustries.find(i => i.name === e.target.value);
                        const defaultCode = e.target.value ? (INDUSTRY_CODES_MAP[e.target.value]?.[0]?.code || '') : '';
                        setShowCustomCodeInput(false);
                        setCompanyInfo({
                          ...companyInfo,
                          industry: e.target.value,
                          industryPath: match?.path || '',
                          industryCode: defaultCode
                        });
                      }
                    }}
                  >
                    <option value="">Select Industry...</option>
                    {dynamicIndustries.map(i => (
                      <option key={i.path} value={i.name}>{i.name}</option>
                    ))}
                    <option value="CUSTOM">+ Add Custom Industry...</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-mono uppercase text-zinc-500 mb-2 cursor-help" data-tooltip="Standardized industry registry code (North American Industry Classification System) for template matching.">NAICS / SIC Code</label>
                  {(() => {
                    const codes = INDUSTRY_CODES_MAP[companyInfo.industry] || [];
                    const isCodeCustom = companyInfo.industryCode !== '' && !codes.some(c => c.code === companyInfo.industryCode);
                    const showInput = codes.length === 0 || showCustomCodeInput || isCodeCustom;

                    if (companyInfo.industry && codes.length > 0) {
                      return (
                        <div className="flex flex-col md:flex-row gap-3">
                          <select 
                            className="flex-1 bg-zinc-950 border border-zinc-800 rounded-lg p-3 focus:border-cyber-green outline-none"
                            value={(showCustomCodeInput || isCodeCustom) ? "CUSTOM" : companyInfo.industryCode}
                            onChange={e => {
                              if (e.target.value === "CUSTOM") {
                                setShowCustomCodeInput(true);
                                setCompanyInfo({...companyInfo, industryCode: ''});
                              } else {
                                setShowCustomCodeInput(false);
                                setCompanyInfo({...companyInfo, industryCode: e.target.value});
                              }
                            }}
                          >
                            <option value="">Select Code...</option>
                            {codes.map(c => (
                              <option key={c.code} value={c.code}>{c.label}</option>
                            ))}
                            <option value="CUSTOM">Custom Code...</option>
                          </select>
                          
                          {showInput && (
                            <input 
                              className="flex-1 bg-zinc-950 border border-zinc-800 rounded-lg p-3 focus:border-cyber-green outline-none transition-colors"
                              placeholder="Enter Custom Code..."
                              value={companyInfo.industryCode}
                              onChange={e => setCompanyInfo({...companyInfo, industryCode: e.target.value})}
                            />
                          )}
                        </div>
                      );
                    } else {
                      return (
                        <input 
                          className="w-full bg-zinc-950 border border-zinc-800 rounded-lg p-3 focus:border-cyber-green outline-none transition-colors"
                          placeholder="e.g. 541511"
                          value={companyInfo.industryCode}
                          onChange={e => setCompanyInfo({...companyInfo, industryCode: e.target.value})}
                        />
                      );
                    }
                  })()}
                </div>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                   <label className="block text-xs font-mono uppercase text-zinc-500 mb-2 cursor-help" data-tooltip="The exact relative folder destination inside the cloned repository context.">Target Repo Path</label>
                   <div className="bg-zinc-900 border border-zinc-800 rounded-lg p-3 text-zinc-400 flex items-center gap-2">
                     <Shield className="w-3 h-3 text-cyber-green" />
                     {companyInfo.industryPath || 'select-industry'}/
                   </div>
                </div>
                <div>
                  <label className="block text-xs font-mono uppercase text-zinc-500 mb-2 cursor-help" data-tooltip="Determines concurrent agent execution quotas and performance thresholds.">Company Size</label>
                  <select 
                    className="w-full bg-zinc-950 border border-zinc-800 rounded-lg p-3 focus:border-cyber-green outline-none"
                    value={companyInfo.size}
                    onChange={e => setCompanyInfo({...companyInfo, size: e.target.value})}
                  >
                    <option value="25">25 Seats (Startup)</option>
                    <option value="50">50 Seats (Growth)</option>
                    <option value="100">100 Seats (Enterprise)</option>
                  </select>
                </div>
              </div>
              
              <div>
                <label className="block text-xs font-mono uppercase text-zinc-500 mb-2 cursor-help" data-tooltip="Enter a paragraph explaining your core services, tools, or target workflows to calculate recommended agent catalog profiles.">What does your company do?</label>
                <div className="relative">
                  <textarea 
                    className="w-full bg-zinc-950 border border-zinc-800 rounded-lg p-3 min-h-[100px] focus:border-cyber-green outline-none"
                    placeholder="Describe your core business..."
                    value={companyInfo.description}
                    onChange={e => setCompanyInfo({...companyInfo, description: e.target.value})}
                  />
                  <button 
                    onClick={handleAiAssist}
                    className="absolute bottom-4 right-4 bg-cyber-green/10 text-cyber-green hover:bg-cyber-green/20 p-2 rounded-lg border border-cyber-green/30 flex items-center gap-2 text-sm transition-all"
                  >
                    <Zap className="w-4 h-4" /> AI Suggest
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-xs font-mono uppercase text-zinc-500 mb-2 cursor-help" data-tooltip="The core mandate or strategic goal defining the swarm's overarching purpose.">Mission Objective</label>
                <textarea 
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-lg p-3 min-h-[60px] focus:border-cyber-green outline-none"
                  placeholder="The core goal of this swarm..."
                  value={companyInfo.mission}
                  onChange={e => setCompanyInfo({...companyInfo, mission: e.target.value})}
                />
              </div>
            </div>

            <div className="mt-12 flex justify-end">
              <button 
                onClick={() => { setStep(2); window.scrollTo({ top: 0, behavior: 'smooth' }); }}
                disabled={!companyInfo.name || !companyInfo.industry}
                className="bg-neural-pulse text-zinc-950 font-bold px-8 py-3 rounded-lg hover:bg-white disabled:opacity-50 transition-all cursor-pointer"
              >
                Next Architecture
              </button>
            </div>
          </motion.div>
        )}

        {step === 2 && (
          <motion.div 
            key="step2"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            data-tooltip="Phase 2 Roster Board: Manage the team of AI agents, customize system instructions, and add specialists from the library."
            className="w-full sovereign-panel p-8"
          >
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8 gap-4">
              <div className="flex items-center gap-2 text-cyber-green">
                <Users className="w-5 h-5" />
                <h2 className="font-bold text-lg" data-tooltip="Configure custom or catalog-vetted AI agent profiles.">Phase 2: The Roster</h2>
              </div>
              <div className="flex flex-wrap gap-3 w-full sm:w-auto">
                <button 
                  onClick={() => setIsCatalogModalOpen(true)}
                  className="flex-1 sm:flex-initial bg-cyber-green/10 text-cyber-green hover:bg-cyber-green/20 px-4 py-2 rounded-lg border border-cyber-green/30 flex items-center justify-center gap-2 transition-all cursor-pointer focus-sovereign"
                >
                  <Search className="w-4 h-4" /> Browse Agent Catalog
                </button>
                <button 
                  onClick={handleCreateCustomAgent}
                  className="flex-1 sm:flex-initial bg-zinc-900 text-neural-pulse hover:bg-zinc-800 px-4 py-2 rounded-lg border border-zinc-800 flex items-center justify-center gap-2 transition-all cursor-pointer focus-sovereign"
                >
                  <Plus className="w-4 h-4" /> Add Custom Agent
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {agents.map(agent => (
                <div 
                  key={agent.id} 
                  data-tooltip="Agent Roster Card: Click the sliders icon to customize identity, emoji, color, and system instructions."
                  className="bg-zinc-950/50 border rounded-xl p-5 relative group sovereign-transition flex flex-col justify-between min-h-[150px] overflow-hidden"
                  style={{ 
                    borderColor: agent.color ? `color-mix(in srgb, ${agent.color} 30%, var(--color-zinc-800))` : 'var(--color-zinc-800)'
                  }}
                >
                  {/* Left accent bar */}
                  <div 
                    className="absolute left-0 top-0 bottom-0 w-1"
                    style={{ backgroundColor: agent.color || 'var(--color-zinc-700)' }}
                  />
                  
                  <div className="space-y-3 pl-2">
                    <div className="flex justify-between items-start gap-2">
                      <div className="flex items-center gap-2">
                        <span className="text-xl select-none">{agent.emoji || '🤖'}</span>
                        <div>
                          <div className="font-bold text-zinc-100 text-sm">{agent.name}</div>
                          {agent.isCustom ? (
                            <span className="text-[9px] font-mono text-zinc-500 uppercase tracking-tighter">Custom Agent</span>
                          ) : (
                            <span className="text-[9px] font-mono text-cyber-green/80 uppercase tracking-tighter">Catalog Agent</span>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button 
                          onClick={() => {
                            setEditingAgent(agent);
                            setIsEditorModalOpen(true);
                          }}
                          className="p-1.5 text-zinc-400 hover:text-white rounded hover:bg-zinc-900 transition-colors cursor-pointer"
                          title="Configure Agent Details"
                        >
                          <Sliders className="w-3.5 h-3.5" />
                        </button>
                        <button 
                          onClick={() => removeAgent(agent.id)}
                          className="p-1.5 text-zinc-400 hover:text-cyber-red rounded hover:bg-zinc-900 transition-colors cursor-pointer"
                          title="Remove Agent"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                    
                    <div>
                      <span className="mono-label text-[9px] block mb-0.5 cursor-help" data-tooltip="The specific focus area or cognitive slot assigned to this agent in the swarm.">Role / Expertise</span>
                      <div className="text-xs text-neural-pulse font-medium line-clamp-1">{agent.role || 'Not specified'}</div>
                    </div>

                    {agent.description && (
                      <div className="text-[10px] text-zinc-550 line-clamp-2 italic leading-relaxed">{agent.description}</div>
                    )}
                  </div>
                  
                  {/* Footer showing Model details */}
                  <div className="mt-4 pt-2.5 border-t border-zinc-900/60 pl-2 flex justify-between items-center text-[9px] text-zinc-500 font-mono">
                    <span className="cursor-help" data-tooltip="The LLM configuration pipeline assigned to run this agent.">Model: {agent.model || 'gemini-1.5-flash'}</span>
                    <span className="text-[9px] text-zinc-400 bg-zinc-900 px-1.5 py-0.5 rounded border border-zinc-800 cursor-help" data-tooltip="Current character count of this agent's system prompt instructions.">
                      Prompt: {agent.prompt ? `${agent.prompt.length} chars` : 'Empty'}
                    </span>
                  </div>
                </div>
              ))}
              {agents.length === 0 && (
                <div className="col-span-full py-12 text-center text-zinc-600 font-mono text-sm border border-dashed border-zinc-850 rounded-xl">
                  Roster is empty. Browse the Catalog or add a Custom Agent to begin.
                </div>
              )}
            </div>

            <div className="mt-12 flex justify-between">
              <button onClick={() => { setStep(1); window.scrollTo({ top: 0, behavior: 'smooth' }); }} className="text-zinc-500 hover:text-white transition-colors cursor-pointer">Previous</button>
              <button 
                onClick={() => { setStep(3); window.scrollTo({ top: 0, behavior: 'smooth' }); }}
                disabled={agents.length === 0}
                className="bg-neural-pulse text-zinc-950 font-bold px-8 py-3 rounded-lg hover:bg-white disabled:opacity-50 transition-all cursor-pointer"
              >
                Next Playbook
              </button>
            </div>
          </motion.div>
        )}

        {step === 3 && (
          <motion.div 
            key="step3"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            data-tooltip="Phase 3 Playbooks Setup: Define task execution procedures and ingest institutional knowledge structures."
            className="w-full sovereign-panel p-8"
          >
            <div className="flex justify-between items-center mb-8">
              <div className="flex items-center gap-2 text-cyber-green">
                <Workflow className="w-5 h-5" />
                <h2 className="font-bold text-lg" data-tooltip="Set standard operating procedures and connect private Confluence/wiki documents.">Phase 3: The Playbook</h2>
              </div>
              <button 
                onClick={addWorkflow}
                className="bg-cyber-green/10 text-cyber-green hover:bg-cyber-green/20 px-4 py-2 rounded-lg border border-cyber-green/30 flex items-center gap-2 transition-all"
              >
                <Plus className="w-4 h-4" /> Add Workflow
              </button>
            </div>

            <div className="space-y-4">
              {workflows.map(workflow => (
                <div key={workflow.id} data-tooltip="Playbook SOP Card: Configures task guidelines or institutional knowledge mappings." className="bg-zinc-950/50 border border-zinc-800 p-6 rounded-xl relative group">
                  <button 
                    onClick={() => removeWorkflow(workflow.id)}
                    className="absolute top-6 right-6 text-zinc-600 hover:text-red-500 transition-colors opacity-0 group-hover:opacity-100"
                  >
                    <Trash2 className="w-5 h-5" />
                  </button>
                  <div className="space-y-4">
                    <input 
                      className="bg-transparent border-b border-zinc-800 mb-2 w-full font-bold focus:border-cyber-green outline-none pb-1"
                      value={workflow.name}
                      onChange={e => {
                        const newWorkflows = [...workflows];
                        newWorkflows.find(w => w.id === workflow.id)!.name = e.target.value;
                        setWorkflows(newWorkflows);
                      }}
                    />
                    <textarea 
                      className="bg-transparent text-sm w-full outline-none text-zinc-400 min-h-[80px]"
                      placeholder="Describe the workflow SOP..."
                      value={workflow.description}
                      onChange={e => {
                        const newWorkflows = [...workflows];
                        newWorkflows.find(w => w.id === workflow.id)!.description = e.target.value;
                        setWorkflows(newWorkflows);
                      }}
                    />

                    {/* OKF/IKS Integration Panel */}
                    <div className="pt-4 border-t border-zinc-900 mt-4 space-y-4">
                      <label className="flex items-center gap-2 text-xs text-zinc-400 cursor-pointer font-mono">
                        <input 
                          type="checkbox"
                          checked={!!workflow.isOkfPlaybook}
                          onChange={e => {
                            const newWorkflows = [...workflows];
                            const curr = newWorkflows.find(w => w.id === workflow.id)!;
                            curr.isOkfPlaybook = e.target.checked;
                            if (e.target.checked) {
                              curr.topic = curr.topic || companyInfo.industry.toLowerCase() || 'general';
                              curr.conceptType = curr.conceptType || 'playbook';
                              curr.tags = curr.tags || companyInfo.industry.toLowerCase() || 'general';
                            }
                            setWorkflows(newWorkflows);
                          }}
                          className="rounded border-zinc-850 bg-zinc-950 text-cyber-green focus:ring-0 focus:ring-offset-0"
                        />
                        <span data-tooltip="Ingest this markdown procedure directly into your agents' vector memory database upon loading.">Index into Institutional Knowledge Store (OKF/IKS)</span>
                      </label>

                      {workflow.isOkfPlaybook && (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pl-6 border-l border-zinc-800">
                          <div>
                            <label className="block text-[10px] font-mono text-zinc-500 uppercase mb-1 cursor-help" data-tooltip="Link to external raw source material, Confluence wiki pages, or Google Docs.">External SOP / Confluence URL</label>
                            <input 
                              className="w-full bg-zinc-950 border border-zinc-800 rounded p-2 text-xs focus:border-cyber-green outline-none text-zinc-300"
                              placeholder="e.g. https://confluence.company.com/pages/..."
                              value={workflow.resourceUri || ''}
                              onChange={e => {
                                const newWorkflows = [...workflows];
                                newWorkflows.find(w => w.id === workflow.id)!.resourceUri = e.target.value;
                                setWorkflows(newWorkflows);
                              }}
                            />
                          </div>
                          <div>
                            <label className="block text-[10px] font-mono text-zinc-500 uppercase mb-1 cursor-help" data-tooltip="Primary focus category (e.g. legal, compliance, operations) for sorting.">Topic</label>
                            <input 
                              className="w-full bg-zinc-950 border border-zinc-800 rounded p-2 text-xs focus:border-cyber-green outline-none text-zinc-300"
                              placeholder="e.g. marketing, compliance"
                              value={workflow.topic || ''}
                              onChange={e => {
                                const newWorkflows = [...workflows];
                                newWorkflows.find(w => w.id === workflow.id)!.topic = e.target.value;
                                setWorkflows(newWorkflows);
                              }}
                            />
                          </div>
                          <div>
                            <label className="block text-[10px] font-mono text-zinc-500 uppercase mb-1 cursor-help" data-tooltip="Structural classification category (e.g. playbook, guideline, policy).">Concept Type</label>
                            <input 
                              className="w-full bg-zinc-950 border border-zinc-800 rounded p-2 text-xs focus:border-cyber-green outline-none text-zinc-300"
                              placeholder="e.g. playbook, guideline"
                              value={workflow.conceptType || ''}
                              onChange={e => {
                                const newWorkflows = [...workflows];
                                newWorkflows.find(w => w.id === workflow.id)!.conceptType = e.target.value;
                                setWorkflows(newWorkflows);
                              }}
                            />
                          </div>
                          <div>
                            <label className="block text-[10px] font-mono text-zinc-500 uppercase mb-1 cursor-help" data-tooltip="Keywords matching agent filters to trigger memory retrieval.">Tags (comma-separated)</label>
                            <input 
                              className="w-full bg-zinc-950 border border-zinc-800 rounded p-2 text-xs focus:border-cyber-green outline-none text-zinc-300"
                              placeholder="e.g. seo, advertising"
                              value={workflow.tags || ''}
                              onChange={e => {
                                const newWorkflows = [...workflows];
                                newWorkflows.find(w => w.id === workflow.id)!.tags = e.target.value;
                                setWorkflows(newWorkflows);
                              }}
                            />
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-12 flex justify-between">
              <button onClick={() => { setStep(2); window.scrollTo({ top: 0, behavior: 'smooth' }); }} className="text-zinc-500 hover:text-white transition-colors">Previous</button>
              <button 
                onClick={() => { setStep(4); window.scrollTo({ top: 0, behavior: 'smooth' }); }}
                className="bg-neural-pulse text-zinc-950 font-bold px-8 py-3 rounded-lg hover:bg-white transition-all cursor-pointer"
              >
                Next Data Connectors
              </button>
            </div>
          </motion.div>
        )}

        {step === 4 && (
          <motion.div 
            key="step4"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            data-tooltip="Phase 4 Data Connectors: Attach MCP-compatible data connectors to provide swarms with real-time external data access."
            className="w-full sovereign-panel p-8"
          >
            <div className="flex justify-between items-center mb-8">
              <div className="flex items-center gap-2 text-cyber-green">
                <Database className="w-5 h-5" />
                <h2 className="font-bold text-lg" data-tooltip="Attach standalone MCP Data Connectors for digital twin syncing or external tool access.">Phase 4: Data Connectors (MCP)</h2>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {mcpCatalog.length === 0 ? (
                <div className="col-span-full py-12 text-center text-zinc-600 font-mono text-sm border border-dashed border-zinc-850 rounded-xl">
                  No MCP connectors available in registry.
                </div>
              ) : (
                mcpCatalog.map(connector => {
                  const isSelected = selectedConnectors.includes(connector.id);
                  return (
                    <div 
                      key={connector.id} 
                      onClick={() => {
                        if (isSelected) {
                          setSelectedConnectors(selectedConnectors.filter(id => id !== connector.id));
                        } else {
                          setSelectedConnectors([...selectedConnectors, connector.id]);
                        }
                      }}
                      className={`p-5 rounded-xl border sovereign-transition cursor-pointer text-left relative ${
                        isSelected 
                          ? 'bg-zinc-900 border-cyber-green/50 text-white' 
                          : 'bg-zinc-950/40 border-zinc-800 text-zinc-400 hover:border-zinc-700'
                      }`}
                    >
                      <div className="flex justify-between items-start mb-2">
                        <span className="text-[10px] font-mono text-zinc-500 uppercase tracking-wider">{connector.category} v{connector.version}</span>
                        {isSelected && <span className="w-2 h-2 bg-cyber-green rounded-full shadow-[0_0_8px_rgba(34,197,94,0.8)] animate-pulse" />}
                      </div>
                      <h4 className="font-bold text-sm text-zinc-100">{connector.name}</h4>
                      <p className="text-xs text-zinc-500 mt-2 leading-relaxed">{connector.description}</p>
                    </div>
                  );
                })
              )}
            </div>

            <div className="mt-12 flex justify-between">
              <button onClick={() => { setStep(3); window.scrollTo({ top: 0, behavior: 'smooth' }); }} className="text-zinc-500 hover:text-white transition-colors cursor-pointer">Previous</button>
              <button 
                onClick={() => { setStep(5); window.scrollTo({ top: 0, behavior: 'smooth' }); }}
                className="bg-neural-pulse text-zinc-950 font-bold px-8 py-3 rounded-lg hover:bg-white transition-all cursor-pointer"
              >
                Next Forge
              </button>
            </div>
          </motion.div>
        )}

        {step === 5 && (
          <motion.div 
            key="step5"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            data-tooltip="Phase 5 Forge Workspace: Inspect the compilation manifest, run security audits, and generate installation ZIP packages."
            className="w-full sovereign-panel p-12 text-center"
          >
            <div className="bg-cyber-green/20 w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-6 border border-cyber-green/30">
              <Cpu className="text-cyber-green w-8 h-8" />
            </div>
            <h2 className="text-2xl font-bold mb-2" data-tooltip="The swarm configuration is ready to build and compile.">Ready for Intelligence Manifestation</h2>
            <p className="text-zinc-500 max-w-md mx-auto mb-12">
              Your swarm configuration for <span className="text-white font-bold">{companyInfo.name}</span> is complete. 
              The package includes {agents.length} agents and {workflows.length} workflows.
            </p>

            <div data-tooltip="Archive Manifest: List of configuration maps, agent prompt profiles, and SOP documents structured in the build." className="max-w-sm mx-auto p-4 bg-zinc-950 border border-zinc-800 rounded-xl text-left font-mono text-xs text-zinc-500 mb-12">
              <div className="mb-2">Manifest:</div>
              <ul className="space-y-1">
                <li className="flex items-center gap-2"><div className="w-1 h-1 bg-cyber-green rounded-full" /> swarm.json</li>
                <li className="flex items-center gap-2"><div className="w-1 h-1 bg-cyber-green rounded-full" /> agents/ ({agents.length} files)</li>
                <li className="flex items-center gap-2"><div className="w-1 h-1 bg-cyber-green rounded-full" /> workflows/ ({workflows.length} files)</li>
              </ul>
            </div>

            {/* Sapphire Shield Security Audit */}
            {(() => {
              const allWarnings: { agentName: string; emoji: string; capability: string; reason: string; severity: 'red' | 'amber' }[] = [];
              agents.forEach(agent => {
                const warnings = scanShieldCapabilities(agent.prompt || '');
                warnings.forEach(w => {
                  allWarnings.push({
                    agentName: agent.name,
                    emoji: agent.emoji || '🤖',
                    ...w
                  });
                });
              });

              const isSecure = allWarnings.length === 0;

              return (
                <div data-tooltip="Sovereign Shield Telemetry: Automatically scans prompt definitions to assess capability requests and approval boundaries." className="max-w-md mx-auto mb-12 bg-zinc-950/80 border rounded-xl overflow-hidden text-left sovereign-transition" style={{ borderColor: isSecure ? '#10B981' : '#F59E0B' }}>
                  <div className={`p-4 flex items-center gap-3 border-b ${isSecure ? 'bg-emerald-950/20 border-emerald-900/40' : 'bg-amber-950/20 border-amber-900/40'}`} style={{ borderColor: isSecure ? 'color-mix(in srgb, #10B981 30%, transparent)' : 'color-mix(in srgb, #F59E0B 30%, transparent)' }}>
                    <Shield className={`w-5 h-5 ${isSecure ? 'text-emerald-500' : 'text-amber-500'}`} />
                    <div>
                      <h4 className="font-bold text-xs text-white uppercase tracking-wider cursor-help" data-tooltip="Zero-Trust static analysis scanner checking for raw execution permissions.">Sapphire Shield Security Audit</h4>
                      <p className="text-[10px] text-zinc-550 font-mono mt-0.5">
                        {isSecure ? 'Sovereign Telemetry Level: Zero Privileges' : 'Active Warning: Approval Required'}
                      </p>
                    </div>
                  </div>
                  <div className="p-4 space-y-3 font-mono text-xs">
                    {isSecure ? (
                      <div className="text-zinc-400 leading-relaxed text-[11px]">
                        🟢 All rostered agent prompts are compliant. This swarm requests no special runtime capabilities and will execute directly without manual Tadpole OS authorization overrides.
                      </div>
                    ) : (
                      <>
                        <div className="text-zinc-400 mb-2 leading-relaxed text-[11px]">
                          ⚠️ The following agent prompts trigger security review boundaries and will request manual Overlord Authorization during Swarm installation:
                        </div>
                        <div className="space-y-2 max-h-[160px] overflow-y-auto custom-scrollbar pr-1">
                          {allWarnings.map((w, idx) => (
                            <div key={idx} className="p-2.5 rounded bg-zinc-900/80 border border-zinc-850/80 flex flex-col gap-1">
                              <div className="flex justify-between items-center">
                                <span className="font-bold text-[10px] text-zinc-200 flex items-center gap-1.5">
                                  <span className="select-none">{w.emoji}</span> {w.agentName}
                                </span>
                                <span className={`text-[8px] px-1.5 py-0.25 rounded border uppercase tracking-tighter ${w.severity === 'red' ? 'text-rose-500 bg-rose-500/5 border-rose-500/20' : 'text-amber-500 bg-amber-500/5 border-amber-500/20'}`}>
                                  {w.capability}
                                </span>
                              </div>
                              <p className="text-[10px] text-zinc-500 leading-normal">{w.reason}</p>
                            </div>
                          ))}
                        </div>
                      </>
                    )}
                  </div>
                </div>
              );
            })()}

            <div className="flex flex-col gap-4 items-center mt-8">
              <button 
                onClick={handleExport}
                className="bg-cyber-green text-zinc-950 font-black px-12 py-4 rounded-xl hover:scale-105 transition-all flex items-center gap-3 cursor-pointer shadow-[0_0_20px_rgba(34,197,94,0.3)]"
              >
                <Download className="w-6 h-6" /> Export Swarm Archive
              </button>
              <div className="flex gap-8 items-center mt-4">
                <button 
                  onClick={() => { setStep(4); window.scrollTo({ top: 0, behavior: 'smooth' }); }}
                  className="text-zinc-500 hover:text-white transition-colors text-sm cursor-pointer"
                >
                  &larr; Previous Step
                </button>
                <button 
                  onClick={() => { setStep(1); window.scrollTo({ top: 0, behavior: 'smooth' }); }}
                  className="text-zinc-500 hover:text-white transition-colors text-sm cursor-pointer"
                >
                  Restart Configuration
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Community Templates Library Card */}
      <section className="w-full mt-24 mb-12">
        <div data-tooltip="Templates Registry: Public database of pre-packaged industrial multi-agent swarms." className="sovereign-panel p-6 flex flex-col min-h-[600px] border-zinc-800/50">
          {/* Card Header */}
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center pb-6 border-b border-zinc-800 gap-4 mb-6" style={{ borderColor: 'color-mix(in srgb, var(--color-border) 40%, transparent)' }}>
            <div>
              <h2 className="text-xl font-bold tracking-tight text-white flex items-center gap-2" data-tooltip="Browse community-contributed templates configured for various commercial business sectors.">
                <Cpu className="w-5 h-5 text-cyber-green" /> Community Templates Library
              </h2>
              <p className="text-zinc-500 text-xs mt-1">Explore, edit, and select pre-configured agent swarms in the ecosystem</p>
            </div>
            {/* Search Input */}
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

          {/* Card Body - Split Layout */}
          <div className="flex flex-col lg:flex-row gap-6 flex-1 min-h-[480px]">
            {/* Left Side: Scrollable List of Templates */}
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

            {/* Right Side: Detail & Edit Panel */}
            <div className="w-full lg:w-3/5 flex flex-col gap-6 bg-zinc-950/20 p-6 rounded-xl border border-zinc-850/60 max-h-[500px] overflow-y-auto custom-scrollbar" style={{ borderColor: 'color-mix(in srgb, var(--color-border) 30%, transparent)' }}>
              {selectedTemplate ? (
                <div className="flex flex-col gap-6 h-full justify-between">
                  {/* Template Metadata Editing */}
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
                        className="w-full bg-zinc-950/60 border border-zinc-850 rounded-lg p-3 text-xs text-zinc-300 focus:border-cyber-green outline-none min-h-[60px] resize-y mt-1"
                        value={selectedTemplate.description}
                        onChange={e => handleUpdateSelectedTemplate('description', e.target.value)}
                      />
                    </div>

                    {/* Path & Size */}
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

                    {/* Swarm Roster Status */}
                    <div>
                      <span className="mono-label text-[10px] text-zinc-500 block mb-2">Agents & Roster configuration</span>
                      {isLoadingSwarmDetails ? (
                        <div className="text-xs text-zinc-500 font-mono py-2 animate-pulse flex items-center gap-2">
                          <div className="w-3.5 h-3.5 border-2 border-zinc-800 border-t-cyber-green rounded-full animate-spin" />
                          Fetching roster details from repository...
                        </div>
                      ) : (
                        <div className="space-y-2">
                          {loadedSwarmDetails?.roster && loadedSwarmDetails.roster.length > 0 ? (
                            loadedSwarmDetails.roster.map((agent: any, idx: number) => (
                              <div key={idx} className="bg-zinc-950/80 border border-zinc-850 p-3 rounded-lg flex justify-between items-center text-xs" style={{ borderColor: 'color-mix(in srgb, var(--color-border) 30%, transparent)' }}>
                                <div>
                                  <div className="font-bold text-zinc-200">{agent.name || agent.id}</div>
                                  <div className="text-zinc-500 font-mono text-[10px] mt-0.5">{agent.role || 'Agent Role'}</div>
                                </div>
                                <span className="text-[9px] font-mono text-zinc-550 bg-zinc-900 border border-zinc-800 px-1.5 py-0.5 rounded" style={{ color: 'var(--color-zinc-500)' }}>
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

                    {/* Tags */}
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

                  {/* Actions */}
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

      {/* Agent Catalog Modal */}
      <AnimatePresence>
        {isCatalogModalOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-0 bg-zinc-950/95 backdrop-blur-md"
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.98 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.98 }}
              transition={{ type: "tween", duration: 0.2 }}
              className="w-full h-full flex flex-col bg-zinc-950 border-none p-0 overflow-hidden"
            >
              {/* Header */}
              <div className="flex justify-between items-center px-6 py-4 border-b border-zinc-850" style={{ borderColor: 'color-mix(in srgb, var(--color-zinc-800) 40%, transparent)' }}>
                <div>
                  <h3 className="text-lg font-bold text-white flex items-center gap-2">
                    <Sparkles className="w-5 h-5 text-cyber-green" /> Browse Agent Catalog
                  </h3>
                  <p className="text-xs text-zinc-500 mt-0.5">Select a pre-configured expert department persona to add to your Swarm Roster.</p>
                </div>
                <button
                  onClick={() => setIsCatalogModalOpen(false)}
                  data-tooltip="Exit Catalog Workspace"
                  className="p-1.5 text-zinc-500 hover:text-white rounded hover:bg-zinc-800 transition-all cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Search Bar */}
              <div className="px-6 py-3 bg-zinc-950/40 border-b border-zinc-850 flex items-center gap-3" style={{ borderColor: 'color-mix(in srgb, var(--color-zinc-800) 30%, transparent)' }}>
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
                  <input
                    type="text"
                    data-tooltip="Search targets agent name, vibe, description, and system prompt text"
                    className="w-full bg-zinc-950 border border-zinc-800 rounded-lg py-2 pl-10 pr-4 text-xs focus:border-cyber-green outline-none text-zinc-300"
                    placeholder="Search by role, capability, or department..."
                    value={catalogSearch}
                    onChange={e => setCatalogSearch(e.target.value)}
                  />
                  {catalogSearch && (
                    <button 
                      onClick={() => setCatalogSearch('')}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-white text-xs cursor-pointer"
                    >
                      Clear
                    </button>
                  )}
                </div>
              </div>

              {/* Body */}
              <div className="flex flex-1 overflow-hidden">
                {/* Left Panel: Departments */}
                <div className="w-64 border-r border-zinc-855 overflow-y-auto custom-scrollbar bg-zinc-950/20 p-4 space-y-1" style={{ borderColor: 'color-mix(in srgb, var(--color-zinc-800) 40%, transparent)' }}>
                  <div className="mono-label text-[9px] mb-2 px-2 cursor-help" data-tooltip="Primary execution categories sorting our roster agent library.">Departments</div>
                  {departments.map(dept => {
                    const count = dept.id === 'all' 
                      ? catalog.length 
                      : catalog.filter(c => c.department === dept.id).length;
                    
                    const isSelected = selectedCatalogDept === dept.id;
                    
                    return (
                      <button
                        key={dept.id}
                        onClick={() => {
                          setSelectedCatalogDept(dept.id);
                          setSelectedCatalogAgentId(null);
                        }}
                        data-tooltip={dept.desc}
                        className={`tooltip-right w-full text-left px-3 py-2 rounded-lg text-xs flex justify-between items-center transition-all cursor-pointer border ${
                          isSelected
                            ? 'bg-zinc-800 text-white border-zinc-700 font-bold'
                            : 'text-zinc-400 hover:bg-zinc-900/50 hover:text-zinc-200 border-transparent'
                        }`}
                      >
                        <div className="flex items-center gap-2">
                          <span 
                            className="w-1.5 h-1.5 rounded-full" 
                            style={{ backgroundColor: dept.color }}
                          />
                          <span>{dept.label}</span>
                        </div>
                        <span className="text-[9px] font-mono text-zinc-500 bg-zinc-950 px-1.5 py-0.25 rounded border border-zinc-800">
                          {count}
                        </span>
                      </button>
                    );
                  })}
                </div>

                {/* Middle Panel: Grid of filtered agents */}
                {(() => {
                  const filtered = catalog.filter(agent => {
                    const matchesDept = selectedCatalogDept === 'all' || agent.department === selectedCatalogDept;
                    const matchesSearch = !catalogSearch || 
                      agent.name.toLowerCase().includes(catalogSearch.toLowerCase()) ||
                      agent.description.toLowerCase().includes(catalogSearch.toLowerCase()) ||
                      agent.vibe.toLowerCase().includes(catalogSearch.toLowerCase()) ||
                      agent.departmentLabel.toLowerCase().includes(catalogSearch.toLowerCase()) ||
                      agent.prompt.toLowerCase().includes(catalogSearch.toLowerCase());
                    return matchesDept && matchesSearch;
                  });

                  const selectedAgent = catalog.find(c => c.id === selectedCatalogAgentId) || filtered[0];

                  return (
                    <>
                      <div className="flex-1 overflow-y-auto custom-scrollbar green-scrollbar p-6 grid grid-cols-1 sm:grid-cols-2 gap-3 bg-zinc-950/10 content-start">
                        {isCatalogLoading ? (
                          <div className="col-span-full flex flex-col items-center justify-center py-20 text-zinc-500 font-mono text-xs">
                            <div className="w-5 h-5 border-2 border-zinc-805 border-t-cyber-green rounded-full animate-spin mb-3" />
                            Loading AI-Tadpole catalog...
                          </div>
                        ) : (
                          <>
                            {filtered.map(agent => {
                              const isSelected = selectedAgent?.id === agent.id;
                              return (
                                <div
                                  key={agent.id}
                                  onClick={() => setSelectedCatalogAgentId(agent.id)}
                                  data-tooltip="Click to preview agent details and prompt"
                                  className={`p-4 rounded-xl border sovereign-transition cursor-pointer flex flex-col justify-between text-left min-h-[110px] ${
                                    isSelected
                                      ? 'bg-zinc-800/80 border-cyber-green text-white shadow-md'
                                      : 'bg-zinc-950/40 border-zinc-800/60 text-zinc-400 hover:border-zinc-700 hover:bg-zinc-900/10'
                                  }`}
                                  style={{
                                    borderColor: isSelected ? agent.color : undefined
                                  }}
                                >
                                  <div>
                                    <div className="flex justify-between items-start mb-1.5 gap-2">
                                      <div className="flex items-center gap-1.5 min-w-0">
                                        <span className="text-lg select-none">{agent.emoji || '🤖'}</span>
                                        <h4 className="font-bold text-xs text-zinc-200 line-clamp-1">
                                          {highlightText(agent.name, catalogSearch)}
                                        </h4>
                                      </div>
                                      <span 
                                        className="text-[8px] font-mono uppercase tracking-tighter px-1.5 py-0.25 rounded border shrink-0"
                                        style={{ 
                                          color: agent.color, 
                                          borderColor: `color-mix(in srgb, ${agent.color} 30%, transparent)`,
                                          backgroundColor: `color-mix(in srgb, ${agent.color} 5%, transparent)`
                                        }}
                                      >
                                        {agent.departmentLabel}
                                      </span>
                                    </div>
                                    <p className="text-[10px] text-zinc-500 line-clamp-2 leading-relaxed">
                                      {highlightText(agent.description || agent.vibe, catalogSearch)}
                                    </p>
                                  </div>
                                </div>
                              );
                            })}
                            {filtered.length === 0 && (
                              <div className="col-span-full flex flex-col items-center justify-center py-20 text-zinc-600 font-mono text-xs">
                                No agents found matching "{catalogSearch}"
                              </div>
                            )}
                          </>
                        )}
                      </div>
 
                      {/* Right Panel: Detailed Agent Preview */}
                      <div className="w-96 border-l border-zinc-850 overflow-y-auto custom-scrollbar p-6 bg-zinc-950/30 flex flex-col justify-between" style={{ borderColor: 'color-mix(in srgb, var(--color-zinc-800) 40%, transparent)' }}>
                        {selectedAgent ? (
                          <div className="flex flex-col h-full justify-between gap-6">
                            <div className="space-y-4">
                              <div className="flex items-center gap-3">
                                <span className="text-3xl p-2 bg-zinc-900 border border-zinc-800 rounded-xl select-none">{selectedAgent.emoji || '🤖'}</span>
                                <div>
                                  <h4 className="font-bold text-sm text-white">{selectedAgent.name}</h4>
                                  <span 
                                    className="text-[9px] font-mono px-2 py-0.5 rounded border inline-block mt-1"
                                    style={{
                                      color: selectedAgent.color,
                                      borderColor: `color-mix(in srgb, ${selectedAgent.color} 20%, transparent)`,
                                      backgroundColor: `color-mix(in srgb, ${selectedAgent.color} 5%, transparent)`
                                    }}
                                  >
                                    {selectedAgent.departmentLabel}
                                  </span>
                                </div>
                              </div>
 
                              <div>
                                <span className="mono-label text-[9px] block text-zinc-500 mb-1">Vibe / Description</span>
                                <p className="text-xs text-zinc-400 leading-relaxed italic">
                                  "{selectedAgent.vibe || selectedAgent.description}"
                                </p>
                              </div>
 
                              <div className="pt-3 border-t border-zinc-900/60 flex flex-col flex-1 min-h-0">
                                <div className="flex items-center gap-1.5 mb-2 text-zinc-550">
                                  <BookOpen className="w-3.5 h-3.5" />
                                  <span className="mono-label text-[9px]">Base System Instructions</span>
                                </div>
                                <div className="bg-zinc-950 border border-zinc-850 rounded-lg p-3 text-[10px] font-mono text-zinc-400 overflow-y-auto max-h-[220px] leading-normal whitespace-pre-wrap select-text custom-scrollbar">
                                  {selectedAgent.prompt}
                                </div>
                              </div>
                            </div>
 
                            <button
                              onClick={() => handleAddCatalogAgent(selectedAgent)}
                              data-tooltip={`Import ${selectedAgent.name} into your active swarm roster`}
                              className="w-full bg-cyber-green text-zinc-950 font-bold text-xs py-3 rounded-lg hover:scale-102 transition-all cursor-pointer flex items-center justify-center gap-2 shadow-[0_0_15px_rgba(34,197,94,0.15)]"
                              style={{
                                backgroundColor: selectedAgent.color,
                                color: '#09090b'
                              }}
                            >
                              Add {selectedAgent.name} to Roster
                            </button>
                          </div>
                        ) : (
                          <div className="flex-1 flex flex-col items-center justify-center text-center text-zinc-600 font-mono text-xs">
                            Select an agent to see detailed specifications.
                          </div>
                        )}
                      </div>
                    </>
                  );
                })()}
              </div>
            </motion.div>
          </motion.div>
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

      <footer className="mt-12 text-zinc-650 text-[10px] font-mono tracking-widest uppercase">
        Sovereign Reality Systems • 2026 • Verified SEC-ARA
      </footer>
    </div>
  );
}
