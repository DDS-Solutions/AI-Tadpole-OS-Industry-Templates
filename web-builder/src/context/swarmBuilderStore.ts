import { createContext, useContext } from 'react';
import type {
  Agent,
  CatalogAgent,
  CompanyInfo,
  ExperienceMode,
  MCPConnector,
  SwarmDetails,
  TemplateItem,
  ValidationIssue,
  WorkflowItem,
} from '../types';
import { INDUSTRY_MAP } from '../constants';
import { loadDraft, type SavedDraft } from '../utils/draftStorage';

export interface DepartmentItem {
  id: string;
  label: string;
  color: string;
  desc: string;
}

export const DEPARTMENTS: DepartmentItem[] = [
  { id: 'all', label: 'All Departments', color: '#71717a', desc: 'Browse the complete index of sovereign agent personas.' },
  { id: 'Plane 2: SMB-Digital-Twin', label: 'Plane 2: SMB Digital Twin', color: '#10B981', desc: 'Company-agnostic SMB practice personas operating under the FR-11 permission firewall.' },
  { id: 'academic', label: 'Academic', color: '#8B5CF6', desc: 'Theoretical research, scientific computation, and deep knowledge analysis.' },
  { id: 'accounting', label: 'Accounting', color: '#10B981', desc: 'Accounts payable/receivable, ledger reconciliation, cash disbursements, and tax reporting.' },
  { id: 'compliance', label: 'Compliance', color: '#DC2626', desc: 'Regulatory auditing, policy adherence, HACCP, and statutory controls.' },
  { id: 'coordination', label: 'Coordination', color: '#3B82F6', desc: 'Cross-agency triage, emergency synchronization, and workflow dispatch.' },
  { id: 'customer-support', label: 'Customer Support', color: '#0284C7', desc: 'Customer onboarding, dispute resolution, tier-1/2 ticketing, and customer satisfaction tracking.' },
  { id: 'design', label: 'Design', color: '#EC4899', desc: 'UI/UX, visual assets, creative generation, and frontend themes.' },
  { id: 'economic-intelligence', label: 'Economic Intelligence', color: '#059669', desc: 'Macroeconomic trends, capital risk analysis, and market disruption modeling.' },
  { id: 'engineering', label: 'Engineering', color: '#2563EB', desc: 'Backend systems, database optimization, CI/CD, and software engineering.' },
  { id: 'facilities', label: 'Facilities & Workplace', color: '#78716C', desc: 'Workplace maintenance, physical facility security, office supply procurement, and lease vendor coordination.' },
  { id: 'finance', label: 'Finance', color: '#22C55E', desc: 'Budget analysis, transactional auditing, resource projection, and ledger validation.' },
  { id: 'game-development', label: 'Game Development', color: '#A855F7', desc: 'Physics engine, gameplay loops, asset pipeline, and logic scripting.' },
  { id: 'gis', label: 'GIS & Mapping', color: '#14B8A6', desc: 'Geospatial queries, mapping coordinates, coordinate transformation, and terrain analysis.' },
  { id: 'human-resources', label: 'Human Resources (HR)', color: '#EC4899', desc: 'Recruiting & hiring pipelines, employee onboarding, benefits administration, and workplace policy compliance.' },
  { id: 'infrastructure', label: 'Infrastructure', color: '#475569', desc: 'System reliability, asset licensing, backups, and server orchestration.' },
  { id: 'intelligence', label: 'Intelligence & OSINT', color: '#06B6D4', desc: 'Open-source intelligence, satellite reconnaissance, and tactical signal correlation.' },
  { id: 'inventory', label: 'Inventory', color: '#F97316', desc: 'Stock tracking, cycle count verification, reorder planning, SKU auditing, and shrinkage mitigation.' },
  { id: 'it-support', label: 'IT Support & Helpdesk', color: '#3B82F6', desc: 'Internal workstation provisioning, SaaS user access, hardware lifecycle, and IT helpdesk triage.' },
  { id: 'legal', label: 'Legal & Contracts', color: '#8B5CF6', desc: 'Commercial contracts, NDA reviews, corporate entity compliance, and lease agreement analysis.' },
  { id: 'logistics', label: 'Logistics', color: '#6366F1', desc: 'Freight route optimization, 3PL carrier coordination, fleet scheduling, and delivery SLA tracking.' },
  { id: 'marketing', label: 'Marketing', color: '#F97316', desc: 'Market positioning, campaign logic, copy creation, and funnel mapping.' },
  { id: 'mission-control', label: 'Mission Control', color: '#E11D48', desc: 'Orbital trajectory tracking, launch countdowns, and spaceflight surveillance.' },
  { id: 'operations', label: 'Operations', color: '#D946EF', desc: 'Workflow scheduling, traveler intake, routing, and facility coordination.' },
  { id: 'operations-economics', label: 'Operations Economics', color: '#D97706', desc: 'Operational cost containment, unit economics modeling, and footprint analytics.' },
  { id: 'paid-media', label: 'Paid Media', color: '#EAB308', desc: 'Ad bidding simulation, conversion tracing, and cost-benefit analysis.' },
  { id: 'product', label: 'Product', color: '#FB923C', desc: 'Product roadmap, user story mapping, and capability spec definitions.' },
  { id: 'project-management', label: 'Project Management', color: '#0EA5E9', desc: 'Sprint scheduling, task matching, and milestone resolution.' },
  { id: 'public-safety', label: 'Public Safety', color: '#F59E0B', desc: 'Disaster triage, evacuation routing, coastal safety, and hazard monitoring.' },
  { id: 'purchasing', label: 'Purchasing & Procurement', color: '#84CC16', desc: 'Vendor price checks, purchase order drafting, and supplier contract reviews.' },
  { id: 'risk-management', label: 'Risk Management', color: '#B91C1C', desc: 'Commercial exposure quantification, threat modeling, and business continuity.' },
  { id: 'sales', label: 'Sales', color: '#10B981', desc: 'Lead scoring, conversion outreach simulation, and pitch refinement.' },
  { id: 'security', label: 'Security & AppSec', color: '#EF4444', desc: 'Threat analysis, vulnerability review, and permission planning.' },
  { id: 'shipping-receiving', label: 'Shipping & Receiving', color: '#14B8A6', desc: 'Inbound dock inspection, Bill of Lading verification, outbound carrier staging, and shipping manifests.' },
  { id: 'space-operations', label: 'Space Operations', color: '#7C3AED', desc: 'Constellation telemetry, satellite ephemeris, and orbital pass prediction.' },
  { id: 'spatial-computing', label: 'Spatial Computing', color: '#0891B2', desc: 'AR/VR tracking systems, 3D math, and sensory coordinate translation.' },
  { id: 'specialized', label: 'Specialized', color: '#6366F1', desc: 'Domain-expert roles tailored for atypical workflows.' },
  { id: 'support', label: 'Support & Care', color: '#65A30D', desc: 'Troubleshooting guides, ticket analysis, and user guide generation.' },
  { id: 'testing', label: 'Testing & QA', color: '#F59E0B', desc: 'Unit tests compilation, boundary validation, and QA logic audits.' },
  { id: 'warehousing', label: 'Warehousing', color: '#EAB308', desc: 'Storage slotting optimization, pick-and-pack routing, facility layout, and material handling safety.' },
];

export type StateUpdater<T> = T | ((prev: T) => T);

export interface SwarmBuilderState {
  experienceMode: ExperienceMode;
  hasSelectedMode: boolean;
  showTemplatesLibrary: boolean;
  savedDraftState: SavedDraft | null;
  step: number;
  guidedStep: number;
  assetRetry: number;
  catalogLoadError: string | null;
  connectorLoadError: string | null;
  searchTerm: string;
  companyInfo: CompanyInfo;
  isCustomIndustry: boolean;
  customIndustryName: string;
  customIndustryPath: string;
  showCustomCodeInput: boolean;
  selectedTemplateId: string | null;
  selectedTemplate: TemplateItem | null;
  isLoadingSwarmDetails: boolean;
  loadedSwarmDetails: SwarmDetails | null;
  swarmLoadError: string | null;
  mcpCatalog: MCPConnector[];
  selectedConnectors: string[];
  isMcpEditorModalOpen: boolean;
  editingMcp: MCPConnector | null;
  catalog: CatalogAgent[];
  isCatalogModalOpen: boolean;
  isEditorModalOpen: boolean;
  editingAgent: Agent | null;
  agents: Agent[];
  workflows: WorkflowItem[];
  dynamicIndustries: typeof INDUSTRY_MAP;
  dynamicRegistry: TemplateItem[];
  isExporting: boolean;
  exportError: string | null;
  draftToast: string | null;
}

export interface SwarmBuilderContextValue extends SwarmBuilderState {
  workspaceRef: React.RefObject<HTMLElement | null>;
  isCatalogLoading: boolean;
  validationIssues: ValidationIssue[];
  filteredTemplates: TemplateItem[];
  setField: <K extends keyof SwarmBuilderState>(key: K, value: SwarmBuilderState[K]) => void;
  setCompanyInfo: (updater: StateUpdater<CompanyInfo>) => void;
  setAgents: (updater: StateUpdater<Agent[]>) => void;
  setWorkflows: (updater: StateUpdater<WorkflowItem[]>) => void;
  setSelectedConnectors: (updater: StateUpdater<string[]>) => void;
  handleResumeDraft: () => void;
  handleDiscardDraft: () => void;
  handleSelectMode: (mode: ExperienceMode) => void;
  removeAgent: (id: string) => void;
  handleCreateCustomAgent: () => void;
  handleAddCatalogAgent: (catalogAgent: CatalogAgent) => void;
  handleSaveAgent: (updatedAgent: Agent) => void;
  handleAddNewMcp: () => void;
  handleSaveMcp: (updatedMcp: MCPConnector) => void;
  handleDeleteMcp: (id: string, e: React.MouseEvent) => void;
  addWorkflow: () => void;
  removeWorkflow: (id: string) => void;
  handleAiAssist: () => Promise<void>;
  handleExport: () => Promise<void>;
  fetchSwarmDetails: (templatePath: string, applyToBuilder?: boolean) => Promise<void>;
  handleTemplateClick: (template: TemplateItem) => void;
  handleUpdateSelectedTemplate: <K extends keyof TemplateItem>(key: K, value: TemplateItem[K]) => void;
  handleLoadSwarmIntoBuilder: () => void;
  handleManualSaveDraft: () => boolean;
  handleStartOver: () => void;
  goHome: () => void;
}

export const INITIAL_COMPANY_INFO: CompanyInfo = {
  name: '',
  size: '25',
  description: '',
  mission: '',
  industry: '',
  industryPath: '',
  industryCode: '',
  goals: ['scheduling', 'quoting', 'customer-follow-up'],
};

export type Action =
  | { type: 'SET_FIELD'; key: keyof SwarmBuilderState; value: unknown }
  | { type: 'UPDATE_COMPANY_INFO'; updater: StateUpdater<CompanyInfo> }
  | { type: 'UPDATE_AGENTS'; updater: StateUpdater<Agent[]> }
  | { type: 'UPDATE_WORKFLOWS'; updater: StateUpdater<WorkflowItem[]> }
  | { type: 'UPDATE_SELECTED_CONNECTORS'; updater: StateUpdater<string[]> }
  | { type: 'UPDATE_MCP_CATALOG'; updater: StateUpdater<MCPConnector[]> }
  | { type: 'RESET_BLUEPRINT' };

function resolveUpdater<T>(updater: StateUpdater<T>, prev: T): T {
  return typeof updater === 'function' ? (updater as (current: T) => T)(prev) : updater;
}

export function createInitialState(): SwarmBuilderState {
  return {
    experienceMode: 'guided',
    hasSelectedMode: false,
    showTemplatesLibrary: false,
    savedDraftState: loadDraft(),
    step: 1,
    guidedStep: 1,
    assetRetry: 0,
    catalogLoadError: null,
    connectorLoadError: null,
    searchTerm: '',
    companyInfo: INITIAL_COMPANY_INFO,
    isCustomIndustry: false,
    customIndustryName: '',
    customIndustryPath: '',
    showCustomCodeInput: false,
    selectedTemplateId: null,
    selectedTemplate: null,
    isLoadingSwarmDetails: false,
    loadedSwarmDetails: null,
    swarmLoadError: null,
    mcpCatalog: [],
    selectedConnectors: [],
    isMcpEditorModalOpen: false,
    editingMcp: null,
    catalog: [],
    isCatalogModalOpen: false,
    isEditorModalOpen: false,
    editingAgent: null,
    agents: [],
    workflows: [],
    dynamicIndustries: INDUSTRY_MAP,
    dynamicRegistry: [],
    isExporting: false,
    exportError: null,
    draftToast: null,
  };
}

export function swarmReducer(state: SwarmBuilderState, action: Action): SwarmBuilderState {
  switch (action.type) {
    case 'SET_FIELD':
      return { ...state, [action.key]: action.value };
    case 'UPDATE_COMPANY_INFO':
      return { ...state, companyInfo: resolveUpdater(action.updater, state.companyInfo) };
    case 'UPDATE_AGENTS':
      return { ...state, agents: resolveUpdater(action.updater, state.agents) };
    case 'UPDATE_WORKFLOWS':
      return { ...state, workflows: resolveUpdater(action.updater, state.workflows) };
    case 'UPDATE_SELECTED_CONNECTORS':
      return { ...state, selectedConnectors: resolveUpdater(action.updater, state.selectedConnectors) };
    case 'UPDATE_MCP_CATALOG':
      return { ...state, mcpCatalog: resolveUpdater(action.updater, state.mcpCatalog) };
    case 'RESET_BLUEPRINT':
      return {
        ...state,
        isLoadingSwarmDetails: false,
        savedDraftState: null,
        selectedTemplate: null,
        selectedTemplateId: null,
        loadedSwarmDetails: null,
        swarmLoadError: null,
        isCustomIndustry: false,
        customIndustryName: '',
        customIndustryPath: '',
        showCustomCodeInput: false,
        showTemplatesLibrary: false,
        guidedStep: 1,
        companyInfo: INITIAL_COMPANY_INFO,
        agents: [],
        workflows: [],
        selectedConnectors: [],
        hasSelectedMode: false,
        step: 1,
      };
    default:
      return state;
  }
}

export const SwarmBuilderContext = createContext<SwarmBuilderContextValue | null>(null);

export function scrollToWorkspace(): void {
  window.scrollTo({
    top: 0,
    behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth',
  });
}

export function useSwarmBuilder(): SwarmBuilderContextValue {
  const ctx = useContext(SwarmBuilderContext);
  if (!ctx) throw new Error('useSwarmBuilder must be used within a SwarmBuilderProvider');
  return ctx;
}

