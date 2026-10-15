import { useState, useMemo } from 'react';
import { Building2, Users, Layers, CheckCircle2 } from 'lucide-react';
import type { Agent, CatalogAgent, CompanyInfo, MCPConnector, ValidationIssue, WorkflowItem } from '../../types';
import { recommendTeam, generateGoalWorkflows, generateDefaultMission } from '../../utils/catalogHelpers';

import Step1_BusinessBrief from './Step1_BusinessBrief';
import Step2_TeamRecommendations from './Step2_TeamRecommendations';
import Step3_BusinessConnections from './Step3_BusinessConnections';
import Step4_GuidedReview from './Step4_GuidedReview';

interface Industry {
  name: string;
  path: string;
  keywords: string[];
}

interface GuidedWizardProps {
  companyInfo: CompanyInfo;
  setCompanyInfo: (info: CompanyInfo) => void;
  agents: Agent[];
  setAgents: (agents: Agent[]) => void;
  workflows: WorkflowItem[];
  setWorkflows?: (workflows: WorkflowItem[]) => void;
  dynamicIndustries: Industry[];
  mcpCatalog: MCPConnector[];
  selectedConnectors: string[];
  setSelectedConnectors: (connectors: string[]) => void;
  catalog: CatalogAgent[];
  isCatalogLoading?: boolean;
  catalogLoadError?: string | null;
  currentStep?: number;
  onStepChange?: (step: number) => void;
  onOpenCatalogModal: () => void;
  validationIssues: ValidationIssue[];
  isExporting: boolean;
  onExport: () => void;
  onSaveDraft: () => boolean;
  onSwitchToAdvanced: () => void;
  onStartOver: () => void;
}

export default function GuidedWizard({
  companyInfo,
  setCompanyInfo,
  agents,
  setAgents,
  workflows,
  setWorkflows,
  dynamicIndustries,
  mcpCatalog,
  selectedConnectors,
  setSelectedConnectors,
  catalog,
  isCatalogLoading = false,
  catalogLoadError = null,
  currentStep: controlledStep,
  onStepChange,
  onOpenCatalogModal,
  validationIssues,
  isExporting,
  onExport,
  onSaveDraft,
  onSwitchToAdvanced,
  onStartOver,
}: GuidedWizardProps) {
  const [localStep, setLocalStep] = useState(1);
  const currentStep = controlledStep ?? localStep;
  const setCurrentStep = (nextStep: number) => {
    setLocalStep(nextStep);
    onStepChange?.(nextStep);
  };

  // Compute recommended specialists whenever companyInfo or catalog changes
  const recommendedSpecialists = useMemo(() => {
    return recommendTeam(companyInfo.goals || [], companyInfo.industry, companyInfo.size, catalog);
  }, [companyInfo.goals, companyInfo.industry, companyInfo.size, catalog]);

  const applyGeneratedWorkflowsAndAgents = (replaceExistingWorkflows: boolean) => {
    const generatedWorkflows = !replaceExistingWorkflows && workflows.length > 0
      ? workflows
      : generateGoalWorkflows(companyInfo.goals || []);
    if (setWorkflows) {
      setWorkflows(generatedWorkflows);
    }

    if (recommendedSpecialists.length > 0) {
      const mappedAgents = recommendedSpecialists.map(spec => {
        const executableWorkflows = generatedWorkflows.filter(workflow => !workflow.isOkfPlaybook);
        const matchedWfs = executableWorkflows.filter(gw => spec.matchedGoalIds?.includes(gw.generatedFromGoalId || ''));
        const wfIds = matchedWfs.length > 0 ? matchedWfs.map(w => w.id) : executableWorkflows.map(w => w.id);
        const readToolIds = mcpCatalog
          .filter(connector => selectedConnectors.includes(connector.id))
          .flatMap(connector => (connector.tools || []).filter(tool => tool.risk === 'read').map(tool => tool.id));
        return {
          ...spec.agent,
          workflows: wfIds,
          mcpTools: [...new Set([...(spec.agent.mcpTools || []), ...readToolIds])],
        };
      });
      setAgents(mappedAgents);
    }
  };

  const handleRecommendTeam = () => {
    if (agents.length > 0) {
      setCurrentStep(2);
      return;
    }
    if (isCatalogLoading || catalogLoadError || recommendedSpecialists.length === 0) return;
    // 1. Generate default mission if blank
    let activeMission = companyInfo.mission;
    if (!activeMission || activeMission.trim() === '') {
      activeMission = generateDefaultMission(companyInfo.name, companyInfo.industry, companyInfo.goals || []);
      setCompanyInfo({ ...companyInfo, mission: activeMission });
    }

    // 2. Generate and assign workflows and agents
    applyGeneratedWorkflowsAndAgents(false);
    setCurrentStep(2);
  };

  const handleRegenerateTeam = () => {
    if (isCatalogLoading || catalogLoadError || recommendedSpecialists.length === 0) return;
    if ((agents.length > 0 || workflows.length > 0) && !window.confirm(
      'Replace your current team and playbooks with new recommendations? Custom agent settings, tool grants, and playbook edits will be replaced.',
    )) return;
    applyGeneratedWorkflowsAndAgents(true);
  };

  const handleRemoveAgent = (id: string) => {
    setAgents(agents.filter(a => a.id !== id));
  };

  const steps = [
    { num: 1, label: 'Business Brief', shortLabel: 'Brief', icon: Building2 },
    { num: 2, label: 'Recommended Team', shortLabel: 'Team', icon: Users },
    { num: 3, label: 'Tools & Approvals', shortLabel: 'Tools', icon: Layers },
    { num: 4, label: 'Review & Download', shortLabel: 'Review', icon: CheckCircle2 },
  ];

  return (
    <div className="w-full mx-auto space-y-6">
      {/* Step Progress Header */}
      <nav aria-label="Guided setup progress" className="builder-progress grid grid-cols-4">
          {steps.map(s => {
            const Icon = s.icon;
            const isCompleted = currentStep > s.num;
            const isCurrent = currentStep === s.num;

            return (
                <button
                  key={s.num}
                  type="button"
                  onClick={() => setCurrentStep(s.num)}
                  aria-current={isCurrent ? 'step' : undefined}
                  className={`min-w-0 flex items-center justify-center gap-1.5 sm:gap-2 px-1.5 sm:px-3 py-3 rounded-xl transition-all cursor-pointer text-xs font-semibold ${
                    isCurrent
                      ? 'bg-cyber-green text-zinc-950 shadow-sm shadow-cyber-green/20'
                      : isCompleted
                      ? 'bg-zinc-800/90 text-zinc-200 hover:bg-zinc-700'
                      : 'text-zinc-500 hover:text-zinc-400'
                  }`}
                >
                  <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold font-mono ${
                    isCurrent ? 'bg-zinc-950 text-cyber-green' : isCompleted ? 'bg-cyber-green/20 text-cyber-green' : 'bg-zinc-800 text-zinc-500'
                  }`}>
                    {s.num}
                  </span>
                  <Icon className="w-3.5 h-3.5 hidden sm:inline-block" />
                  <span className="sm:hidden">{s.shortLabel}</span>
                  <span className="hidden sm:inline">{s.label}</span>
                </button>
            );
          })}
      </nav>

      {/* Step Content */}
      {currentStep === 1 && (
        <Step1_BusinessBrief
          companyInfo={companyInfo}
          setCompanyInfo={setCompanyInfo}
          dynamicIndustries={dynamicIndustries}
          onRecommendTeam={handleRecommendTeam}
          hasExistingTeam={agents.length > 0}
          isCatalogLoading={isCatalogLoading}
          catalogLoadError={catalogLoadError}
          hasRecommendations={recommendedSpecialists.length > 0}
        />
      )}

      {currentStep === 2 && (
        <Step2_TeamRecommendations
          agents={agents}
          mcpCatalog={mcpCatalog}
          catalogCount={catalog.length}
          recommendedSpecialists={recommendedSpecialists}
          onRegenerateTeam={!isCatalogLoading && !catalogLoadError && recommendedSpecialists.length > 0 ? handleRegenerateTeam : undefined}
          onAddSpecialistFromCatalog={onOpenCatalogModal}
          onRemoveAgent={handleRemoveAgent}
          onBack={() => setCurrentStep(1)}
          onNext={() => setCurrentStep(3)}
        />
      )}

      {currentStep === 3 && (
        <Step3_BusinessConnections
          agents={agents}
          setAgents={setAgents}
          mcpCatalog={mcpCatalog}
          selectedConnectors={selectedConnectors}
          setSelectedConnectors={setSelectedConnectors}
          onBack={() => setCurrentStep(2)}
          onNext={() => setCurrentStep(4)}
        />
      )}

      {currentStep === 4 && (
        <Step4_GuidedReview
          companyInfo={companyInfo}
          agents={agents}
          workflows={workflows}
          selectedConnectors={selectedConnectors}
          mcpCatalog={mcpCatalog}
          validationIssues={validationIssues}
          isExporting={isExporting}
          onExport={onExport}
          onSaveDraft={onSaveDraft}
          onSwitchToAdvanced={onSwitchToAdvanced}
          onStartOver={onStartOver}
          onBack={() => setCurrentStep(3)}
          onJumpToStep={(stepNum) => setCurrentStep(stepNum)}
        />
      )}
    </div>
  );
}
