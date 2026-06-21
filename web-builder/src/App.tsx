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
  Users
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import JSZip from 'jszip';

type Agent = {
  id: string;
  name: string;
  role: string;
  model: string;
  prompt: string;
};

type WorkflowItem = {
  id: string;
  name: string;
  description: string;
  isOkfPlaybook?: boolean;
  resourceUri?: string;
  topic?: string;
  conceptType?: string;
  tags?: string;
};

const INDUSTRY_MAP = [
  { name: 'Legal Services', path: 'legal', keywords: ['law', 'contract', 'litigation', 'legal'] },
  { name: 'Medical Practices', path: 'healthcare', keywords: ['health', 'patient', 'medical', 'doctor', 'clinic'] },
  { name: 'Financial Services', path: 'financial-services', keywords: ['money', 'bank', 'finance', 'tax', 'audit', 'accounting'] },
  { name: 'Digital Marketing', path: 'digital-marketing', keywords: ['ads', 'marketing', 'social media', 'content', 'seo'] },
  { name: 'E-commerce', path: 'e-commerce', keywords: ['store', 'shop', 'product', 'retail', 'sales'] },
  { name: 'Real Estate', path: 'real-estate', keywords: ['house', 'property', 'realtor', 'escrow', 'mls'] },
  { name: 'Manufacturing', path: 'manufacturing', keywords: ['factory', 'production', 'inventory', 'machine', 'order'] },
  { name: 'Software Development', path: 'development', keywords: ['code', 'software', 'app', 'developer', 'api'] },
  { name: 'Food & Beverage', path: 'food', keywords: ['food', 'restaurant', 'menu', 'kitchen', 'recipe', 'inventory'] },
  { name: 'Chemical Sector', path: 'chemical', keywords: ['chemical', 'safety', 'sds', 'toxic', 'hazardous'] },
  { name: 'Transportation & Logistics', path: 'transportation', keywords: ['transportation', 'fleet', 'delivery', 'route', 'truck', 'driver'] },
  { name: 'Pharmaceuticals', path: 'pharma', keywords: ['pharma', 'clinical', 'trial', 'adverse', 'drug', 'protocol'] },
  { name: 'Agriculture & AgTech', path: 'agriculture', keywords: ['agriculture', 'farm', 'soil', 'crop', 'irrigation', 'weather'] },
  { name: 'Governance & Compliance', path: 'compliance', keywords: ['compliance', 'audit', 'soc2', 'iso', 'security', 'regulatory'] },
  { name: 'Cybersecurity', path: 'security', keywords: ['security', 'cybersecurity', 'secops', 'log', 'firewall', 'threat', 'incident'] },
  { name: 'Human Resources', path: 'hr', keywords: ['hr', 'recruiting', 'resume', 'onboarding', 'candidate', 'hiring', 'talent'] },
  { name: 'Education', path: 'education', keywords: ['education', 'curriculum', 'lesson', 'student', 'grade', 'school', 'learn'] },
  { name: 'Critical Infrastructure', path: 'utilities', keywords: ['utility', 'grid', 'power', 'telemetry', 'scada', 'substation', 'maintenance'] },
  { name: 'Media & Creative', path: 'creative', keywords: ['media', 'creative', 'asset', 'game', 'dialog', 'narrative', 'localization'] },
];

type TemplateItem = {
  id: string;
  name: string;
  description: string;
  industry: string;
  path: string;
  tags: string[];
  company_size?: number;
};

const REGISTRY: TemplateItem[] = [
  { id: "legal-contract-review", name: "Legal Contract Auditor", description: "AI-driven contract analysis, litigation forecasting, and automated discovery.", industry: "Legal Services", path: "legal/contract-review", tags: ["law", "contracts"] },
  { id: "healthcare-patient-intake", name: "Patient Intake Automation", description: "Process clinical data and automate patient intake workflows.", industry: "Medical Practices", path: "healthcare/patient-intake", tags: ["healthcare", "intake"] },
  { id: "development-code-reviewer", name: "Sr. Architect Reviewer", description: "Automated code review and architectural auditing from a senior perspective.", industry: "Software Development", path: "development/code-reviewer", tags: ["development", "devops"] },
  { id: "bookkeeping-audit", name: "SMB Bookkeeping Swarm", description: "Automated daily reconciliation, tax optimization, and digital audit trails.", industry: "Financial Services", path: "financial-services/bookkeeping-audit", tags: ["finance", "accounting"] },
  { id: "full-funnel-automation", name: "Marketing Funnel Pilot", description: "Automated content generation, ad spend optimization, and journey analytics.", industry: "Digital Marketing", path: "digital-marketing/full-funnel-automation", tags: ["marketing", "ads"] },
  { id: "lead-transaction-management", name: "Real Estate Closer", description: "Automated lead nurturing, MLS syndication, and escrow timeline tracking.", industry: "Real Estate", path: "real-estate/lead-transaction", tags: ["real-estate", "leads"] },
  { id: "food-restaurant-ops", name: "Food & Beverage Operations", description: "Automate kitchen inventory, menu performance analytics, and supplier ordering workflows.", industry: "Food & Beverage", path: "food/restaurant-ops", tags: ["food", "restaurant", "inventory"] },
  { id: "chemical-process-safety", name: "Chemical Safety Auditor", description: "Automate chemical inventory, Safety Data Sheet (SDS) compliance auditing, and safety checklists.", industry: "Chemical Sector", path: "chemical/process-safety", tags: ["chemical", "safety", "compliance"] },
  { id: "transportation-fleet-logistics", name: "Fleet Logistics Swarm", description: "Fleet scheduling, route optimization, maintenance tracking, and fuel efficiency analytics.", industry: "Transportation & Logistics", path: "transportation/fleet-logistics", tags: ["transportation", "fleet", "logistics"] },
  { id: "pharma-clinical-trials", name: "Clinical Trial Manager", description: "Automate clinical trial protocol mapping, trial candidate documentation, and adverse event logging.", industry: "Pharmaceuticals", path: "pharma/clinical-trials", tags: ["pharma", "clinical", "compliance"] },
  { id: "agriculture-precision-farming", name: "Precision Agriculture Swarm", description: "Crop yield forecasting, soil health telemetry analysis, and irrigation optimization.", industry: "Agriculture & AgTech", path: "agriculture/precision-farming", tags: ["agriculture", "farming", "analytics"] },
  { id: "compliance-regulatory-audit", name: "Regulatory Compliance Swarm", description: "Continuous security posture assessment, SOC2/ISO readiness checks, and regulatory compliance mapping.", industry: "Governance & Compliance", path: "compliance/regulatory-audit", tags: ["compliance", "audit", "security"] },
  { id: "security-incident-response", name: "Incident Response Swarm", description: "Designed for security log auditing, incident triage, and automated mitigation recommendation.", industry: "Cybersecurity", path: "security/incident-response", tags: ["security", "secops", "incident"] },
  { id: "hr-recruiting-triage", name: "Recruiting Triage Swarm", description: "Designed for parsing candidate resumes, screening against role criteria, and coordinating onboarding files.", industry: "Human Resources", path: "hr/recruiting-triage", tags: ["hr", "recruiting", "hiring"] },
  { id: "education-curriculum-planner", name: "Curriculum Planner Swarm", description: "Designed for curriculum audit mapping, lesson plan alignment, and student analytics reviews.", industry: "Education", path: "education/curriculum-planner", tags: ["education", "curriculum", "school"] },
  { id: "utilities-grid-telemetry", name: "Grid Telemetry Swarm", description: "Designed for grid status logs auditing, alarm triage, and utility crew scheduling.", industry: "Critical Infrastructure", path: "utilities/grid-telemetry", tags: ["utilities", "grid", "telemetry"] },
  { id: "creative-asset-pipeline", name: "Creative Asset Pipeline Swarm", description: "Designed for creative asset verification, size budget checks, and dialog localization tracking.", industry: "Media & Creative", path: "creative/asset-pipeline", tags: ["creative", "media", "assets"] },
];

const INDUSTRY_CODES_MAP: Record<string, { code: string; label: string }[]> = {
  'Legal Services': [
    { code: 'NAICS 541110', label: '541110 - Offices of Lawyers' },
    { code: 'SIC 8111', label: '8111 - Legal Services' }
  ],
  'Medical Practices': [
    { code: 'NAICS 621111', label: '621111 - Offices of Physicians (except Mental Health)' },
    { code: 'NAICS 621112', label: '621112 - Offices of Physicians, Mental Health Specialists' },
    { code: 'SIC 8011', label: '8011 - Offices and Clinics of Doctors of Medicine' }
  ],
  'Financial Services': [
    { code: 'NAICS 523930', label: '523930 - Investment Advice' },
    { code: 'NAICS 541211', label: '541211 - Offices of Certified Public Accountants' },
    { code: 'SIC 6282', label: '6282 - Investment Advice' },
    { code: 'SIC 8721', label: '8721 - Accounting, Auditing, and Bookkeeping' }
  ],
  'Digital Marketing': [
    { code: 'NAICS 541810', label: '541810 - Advertising Agencies' },
    { code: 'NAICS 541812', label: '541812 - Digital Advertising Agencies' },
    { code: 'SIC 7311', label: '7311 - Advertising Agencies' }
  ],
  'E-commerce': [
    { code: 'NAICS 454110', label: '454110 - Electronic Shopping and Mail-Order Houses' },
    { code: 'SIC 5961', label: '5961 - Catalog and Mail-Order Houses' }
  ],
  'Real Estate': [
    { code: 'NAICS 531210', label: '531210 - Offices of Real Estate Agents and Brokers' },
    { code: 'SIC 6531', label: '6531 - Real Estate Agents and Managers' }
  ],
  'Specialized Consultancies': [
    { code: 'NAICS 541611', label: '541611 - Administrative & General Management Consulting' },
    { code: 'NAICS 541690', label: '541690 - Other Scientific & Technical Consulting' },
    { code: 'SIC 8742', label: '8742 - Management Consulting Services' }
  ],
  'Logistics & Supply Chain': [
    { code: 'NAICS 541614', label: '541614 - Process, Physical Distribution, & Logistics Consulting' },
    { code: 'NAICS 488510', label: '488510 - Freight Transportation Arrangement' },
    { code: 'SIC 4731', label: '4731 - Arrangement of Transportation of Freight & Cargo' }
  ],
  'Engineering & Architecture': [
    { code: 'NAICS 541330', label: '541330 - Engineering Services' },
    { code: 'NAICS 541310', label: '541310 - Architectural Services' },
    { code: 'SIC 8711', label: '8711 - Engineering Services' },
    { code: 'SIC 8712', label: '8712 - Architectural Services' }
  ],
  'EdTech & Training': [
    { code: 'NAICS 611710', label: '611710 - Educational Support Services' },
    { code: 'NAICS 611420', label: '611420 - Computer Training' },
    { code: 'SIC 8299', label: '8299 - Schools & Educational Services, NEC' }
  ],
  'Software Development': [
    { code: 'NAICS 541511', label: '541511 - Custom Computer Programming Services' },
    { code: 'NAICS 513210', label: '513210 - Software Publishers' },
    { code: 'SIC 7371', label: '7371 - Computer Programming Services' },
    { code: 'SIC 7372', label: '7372 - Prepackaged Software' }
  ],
  'Manufacturing': [
    { code: 'NAICS 339999', label: '339999 - All Other Miscellaneous Manufacturing' },
    { code: 'SIC 3999', label: '3999 - Manufacturing Industries, NEC' }
  ],
  'Food & Beverage': [
    { code: 'NAICS 722511', label: '722511 - Full-Service Restaurants' },
    { code: 'NAICS 311999', label: '311999 - All Other Miscellaneous Food Manufacturing' },
    { code: 'SIC 5812', label: '5812 - Eating Places' },
    { code: 'SIC 2099', label: '2099 - Food Preparations, NEC' }
  ],
  'Chemical Sector': [
    { code: 'NAICS 325998', label: '325998 - All Other Miscellaneous Chemical Product Manufacturing' },
    { code: 'SIC 2899', label: '2899 - Chemicals and Chemical Preparations, NEC' }
  ],
  'Transportation & Logistics': [
    { code: 'NAICS 484121', label: '484121 - General Freight Trucking, Long-Distance' },
    { code: 'NAICS 488510', label: '488510 - Freight Transportation Arrangement' },
    { code: 'SIC 4213', label: '4213 - Trucking, Except Local' },
    { code: 'SIC 4731', label: '4731 - Arrangement of Transportation of Freight & Cargo' }
  ],
  'Pharmaceuticals': [
    { code: 'NAICS 325412', label: '325412 - Pharmaceutical Preparation Manufacturing' },
    { code: 'SIC 2834', label: '2834 - Pharmaceutical Preparations' }
  ],
  'Agriculture & AgTech': [
    { code: 'NAICS 111998', label: '111998 - All Other Miscellaneous Crop Farming' },
    { code: 'NAICS 541715', label: '541715 - R&D in Physical, Engineering, & Life Sciences' },
    { code: 'SIC 0191', label: '0191 - General Farms, Primarily Crop' }
  ],
  'Governance & Compliance': [
    { code: 'NAICS 541611', label: '541611 - Administrative & General Management Consulting' },
    { code: 'SIC 8742', label: '8742 - Management Consulting Services' }
  ],
  'Cybersecurity': [
    { code: 'NAICS 541512', label: '541512 - Computer Systems Design Services' },
    { code: 'NAICS 541690', label: '541690 - Other Scientific & Technical Consulting' },
    { code: 'SIC 7373', label: '7373 - Computer Integrated Systems Design' },
    { code: 'SIC 7379', label: '7379 - Computer Related Services, NEC' }
  ],
  'Human Resources': [
    { code: 'NAICS 561311', label: '561311 - Employment Placement Agencies' },
    { code: 'NAICS 541612', label: '541612 - Human Resources Consulting Services' },
    { code: 'SIC 7361', label: '7361 - Employment Agencies' }
  ],
  'Education': [
    { code: 'NAICS 611710', label: '611710 - Educational Support Services' },
    { code: 'NAICS 611310', label: '611310 - Colleges, Universities, & Professional Schools' },
    { code: 'SIC 8299', label: '8299 - Schools & Educational Services, NEC' }
  ],
  'Critical Infrastructure': [
    { code: 'NAICS 221122', label: '221122 - Electric Power Distribution' },
    { code: 'SIC 4911', label: '4911 - Electric Services' }
  ],
  'Media & Creative': [
    { code: 'NAICS 512110', label: '512110 - Motion Picture & Video Production' },
    { code: 'NAICS 711510', label: '711510 - Independent Artists, Writers, & Performers' },
    { code: 'SIC 7812', label: '7812 - Motion Picture & Video Tape Production' }
  ]
};

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
  const [loadedSwarmDetails, setLoadedSwarmDetails] = useState<{ roster: any[]; workflows: any[] } | null>(null);

  useEffect(() => {
    fetch('./registry.json')
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
          const registryTemplates = data.templates.map((t: any) => ({
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
      .catch(err => console.error("Error loading registry.json:", err));
  }, []);

  const addAgent = () => {
    const id = Math.random().toString(36).substr(2, 9);
    setAgents([...agents, { id, name: 'New Agent', role: '', model: 'gemini-pro-latest', prompt: '' }]);
  };

  const removeAgent = (id: string) => {
    setAgents(agents.filter(a => a.id !== id));
  };

  const addWorkflow = () => {
    const id = Math.random().toString(36).substr(2, 9);
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
    const match = dynamicIndustries.find(i => i.keywords.some(k => desc.includes(k)));
    
    if (match) {
      setIsCustomIndustry(false);
      setShowCustomCodeInput(false);
      const defaultCode = INDUSTRY_CODES_MAP[match.name]?.[0]?.code || ('NAICS ' + (Math.floor(Math.random() * 90000) + 10000));
      setCompanyInfo({
        ...companyInfo,
        mission: `To revolutionize ${companyInfo.description.toLowerCase()} through sovereign intelligence and automated ${match.name.toLowerCase()} flows.`,
        industry: match.name,
        industryPath: match.path,
        industryCode: defaultCode
      });
      
      // Suggest industry-specific agent
      if (agents.length === 1 && agents[0].name === 'Lead Orchestrator') {
        setAgents([
          { id: '1', name: 'Lead Orchestrator', role: 'General Coordinator', model: 'gemini-pro-latest', prompt: 'Coordinate swarm operations...' },
          { id: '2', name: `${match.name.split(' ')[0]} Expert`, role: `${match.name} Specialist`, model: 'gemini-pro-latest', prompt: `Execute high-fidelity ${match.name.toLowerCase()} tasks.` }
        ]);
      }
    }
  };

  const handleExport = async () => {
    const zip = new JSZip();
    
    // Group workflows into standard workflows vs knowledge playbooks
    const standardWorkflows = workflows.filter(w => !w.isOkfPlaybook);
    const okfPlaybooks = workflows.filter(w => w.isOkfPlaybook);

    // swarm.json
    const swarmJson = {
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
        (swarmData.roster || []).map(async (agentRef: any) => {
          try {
            const agentRes = await fetch(`${rawBase}/${agentRef.path}`);
            if (agentRes.ok) {
              const agentDetails = await agentRes.json();
              return {
                id: agentRef.id,
                name: agentDetails.name || agentRef.id,
                role: agentDetails.role || agentRef.role || '',
                model: agentDetails.model || 'gemini-pro-latest',
                prompt: agentDetails.system_prompt || ''
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
                id: Math.random().toString(36).substr(2, 9),
                name,
                description,
                isOkfPlaybook: false
              };
            }
          } catch (e) {
            console.error("Error loading workflow details", e);
          }
          return {
            id: Math.random().toString(36).substr(2, 9),
            name: workflowPath.split('/').pop()?.replace('.md', '') || 'Workflow',
            description: '',
            isOkfPlaybook: false
          };
        })
      );

      // Fetch knowledge/ playbooks (from knowledge.json if it exists)
      let okfPlaybooks: any[] = [];
      try {
        const knowledgeRes = await fetch(`${rawBase}/knowledge.json`);
        if (knowledgeRes.ok) {
          const knowledgeData = await knowledgeRes.json();
          okfPlaybooks = (knowledgeData || []).map((k: any) => ({
            id: Math.random().toString(36).substr(2, 9),
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

  const handleTemplateClick = (template: any) => {
    setSelectedTemplateId(template.id);
    setSelectedTemplate(template);
    fetchSwarmDetails(template.path);
  };

  const handleUpdateSelectedTemplate = (key: string, value: any) => {
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
        <div className="flex gap-2">
          {[1, 2, 3, 4].map(s => (
            <div 
              key={s} 
              className={`w-8 h-1 rounded-full transition-colors ${s <= step ? 'bg-cyber-green' : 'bg-zinc-800'}`} 
            />
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
            className="w-full sovereign-panel p-8"
          >
            <div className="flex items-center gap-2 mb-6 text-cyber-green">
              <Globe className="w-5 h-5" />
              <h2 className="font-bold text-lg">Phase 1: The Pulse</h2>
            </div>
            
            <div className="space-y-6">
              <div>
                <label className="block text-xs font-mono uppercase text-zinc-500 mb-2">Company / Swarm Name</label>
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
                    <label className="block text-xs font-mono uppercase text-zinc-500 mb-2">Custom Industry Name</label>
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
                    <label className="block text-xs font-mono uppercase text-zinc-500 mb-2">Custom Target Directory Path</label>
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
                  <label className="block text-xs font-mono uppercase text-zinc-500 mb-2">Industry / Sector</label>
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
                  <label className="block text-xs font-mono uppercase text-zinc-500 mb-2">NAICS / SIC Code</label>
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
                   <label className="block text-xs font-mono uppercase text-zinc-500 mb-2">Target Repo Path</label>
                   <div className="bg-zinc-900 border border-zinc-800 rounded-lg p-3 text-zinc-400 flex items-center gap-2">
                     <Shield className="w-3 h-3 text-cyber-green" />
                     {companyInfo.industryPath || 'select-industry'}/
                   </div>
                </div>
                <div>
                  <label className="block text-xs font-mono uppercase text-zinc-500 mb-2">Company Size</label>
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
                <label className="block text-xs font-mono uppercase text-zinc-500 mb-2">What does your company do?</label>
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
                <label className="block text-xs font-mono uppercase text-zinc-500 mb-2">Mission Objective</label>
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
                onClick={() => setStep(2)}
                disabled={!companyInfo.name}
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
            className="w-full sovereign-panel p-8"
          >
            <div className="flex justify-between items-center mb-8">
              <div className="flex items-center gap-2 text-cyber-green">
                <Users className="w-5 h-5" />
                <h2 className="font-bold text-lg">Phase 2: The Roster</h2>
              </div>
              <button 
                onClick={addAgent}
                className="bg-cyber-green/10 text-cyber-green hover:bg-cyber-green/20 px-4 py-2 rounded-lg border border-cyber-green/30 flex items-center gap-2 transition-all"
              >
                <Plus className="w-4 h-4" /> Add Agent
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {agents.map(agent => (
                <div key={agent.id} className="bg-zinc-950/50 border border-zinc-800 p-4 rounded-xl relative group">
                  <button 
                    onClick={() => removeAgent(agent.id)}
                    className="absolute top-4 right-4 text-zinc-600 hover:text-red-500 transition-colors opacity-0 group-hover:opacity-100"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                  <div className="space-y-4">
                    <input 
                      className="bg-transparent border-b border-zinc-800 mb-2 w-full font-bold focus:border-cyber-green outline-none pb-1"
                      value={agent.name}
                      onChange={e => {
                        const newAgents = [...agents];
                        newAgents.find(a => a.id === agent.id)!.name = e.target.value;
                        setAgents(newAgents);
                      }}
                    />
                    <div>
                      <label className="block text-[10px] font-mono text-zinc-600 uppercase">Role / Expertise</label>
                      <input 
                        className="bg-transparent text-sm w-full outline-none text-neural-pulse"
                        placeholder="e.g. Legal Compliance"
                        value={agent.role}
                        onChange={e => {
                          const newAgents = [...agents];
                          newAgents.find(a => a.id === agent.id)!.role = e.target.value;
                          setAgents(newAgents);
                        }}
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-12 flex justify-between">
              <button onClick={() => setStep(1)} className="text-zinc-500 hover:text-white transition-colors">Previous</button>
              <button 
                onClick={() => setStep(3)}
                className="bg-neural-pulse text-zinc-950 font-bold px-8 py-3 rounded-lg hover:bg-white transition-all cursor-pointer"
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
            className="w-full sovereign-panel p-8"
          >
            <div className="flex justify-between items-center mb-8">
              <div className="flex items-center gap-2 text-cyber-green">
                <Workflow className="w-5 h-5" />
                <h2 className="font-bold text-lg">Phase 3: The Playbook</h2>
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
                <div key={workflow.id} className="bg-zinc-950/50 border border-zinc-800 p-6 rounded-xl relative group">
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
                        <span>Index into Institutional Knowledge Store (OKF/IKS)</span>
                      </label>

                      {workflow.isOkfPlaybook && (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pl-6 border-l border-zinc-800">
                          <div>
                            <label className="block text-[10px] font-mono text-zinc-500 uppercase mb-1">External SOP / Confluence URL</label>
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
                            <label className="block text-[10px] font-mono text-zinc-500 uppercase mb-1">Topic</label>
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
                            <label className="block text-[10px] font-mono text-zinc-500 uppercase mb-1">Concept Type</label>
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
                            <label className="block text-[10px] font-mono text-zinc-500 uppercase mb-1">Tags (comma-separated)</label>
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
              <button onClick={() => setStep(2)} className="text-zinc-500 hover:text-white transition-colors">Previous</button>
              <button 
                onClick={() => setStep(4)}
                className="bg-neural-pulse text-zinc-950 font-bold px-8 py-3 rounded-lg hover:bg-white transition-all cursor-pointer"
              >
                Next Forge
              </button>
            </div>
          </motion.div>
        )}

        {step === 4 && (
          <motion.div 
            key="step4"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="w-full sovereign-panel p-12 text-center"
          >
            <div className="bg-cyber-green/20 w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-6 border border-cyber-green/30">
              <Cpu className="text-cyber-green w-8 h-8" />
            </div>
            <h2 className="text-2xl font-bold mb-2">Ready for Intelligence Manifestation</h2>
            <p className="text-zinc-500 max-w-md mx-auto mb-12">
              Your swarm configuration for <span className="text-white font-bold">{companyInfo.name}</span> is complete. 
              The package includes {agents.length} agents and {workflows.length} workflows.
            </p>

            <div className="max-w-sm mx-auto p-4 bg-zinc-950 border border-zinc-800 rounded-xl text-left font-mono text-xs text-zinc-500 mb-12">
              <div className="mb-2">Manifest:</div>
              <ul className="space-y-1">
                <li className="flex items-center gap-2"><div className="w-1 h-1 bg-cyber-green rounded-full" /> swarm.json</li>
                <li className="flex items-center gap-2"><div className="w-1 h-1 bg-cyber-green rounded-full" /> agents/ ({agents.length} files)</li>
                <li className="flex items-center gap-2"><div className="w-1 h-1 bg-cyber-green rounded-full" /> workflows/ ({workflows.length} files)</li>
              </ul>
            </div>

            <div className="flex flex-col gap-4 items-center">
              <button 
                onClick={handleExport}
                className="bg-cyber-green text-zinc-950 font-black px-12 py-4 rounded-xl hover:scale-105 transition-all flex items-center gap-3 cursor-pointer shadow-[0_0_20px_rgba(34,197,94,0.3)]"
              >
                <Download className="w-6 h-6" /> Export Swarm Archive
              </button>
              <button 
                onClick={() => setStep(1)}
                className="text-zinc-500 hover:text-white transition-colors text-sm mt-4"
              >
                Re-configure Architecture
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Community Templates Library Card */}
      <section className="w-full mt-24 mb-12">
        <div className="sovereign-panel p-6 flex flex-col min-h-[600px] border-zinc-800/50">
          {/* Card Header */}
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center pb-6 border-b border-zinc-800 gap-4 mb-6" style={{ borderColor: 'color-mix(in srgb, var(--color-border) 40%, transparent)' }}>
            <div>
              <h2 className="text-xl font-bold tracking-tight text-white flex items-center gap-2">
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
                      <span className="mono-label text-[10px] text-zinc-500 block mb-2">Tags</span>
                      <div className="flex flex-wrap gap-2">
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

      <footer className="mt-12 text-zinc-600 text-[10px] font-mono tracking-widest uppercase">
        Sovereign Reality Systems • 2026 • Verified SEC-ARA
      </footer>
    </div>
  );
}
