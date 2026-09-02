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
  onOpenCatalogModal: () => void;
  validationIssues: ValidationIssue[];
  isExporting: boolean;
  onExport: () => void;
  onSaveDraft: () => void;
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
  onOpenCatalogModal,
  validationIssues,
  isExporting,
  onExport,
  onSaveDraft,
  onSwitchToAdvanced,
  onStartOver,
}: GuidedWizardProps) {
  const [currentStep, setCurrentStep] = useState(1);

  // Compute recommended specialists whenever companyInfo or catalog changes
  const recommendedSpecialists = useMemo(() => {
    return recommendTeam(companyInfo.goals || [], companyInfo.industry, companyInfo.size, catalog);
  }, [companyInfo.goals, companyInfo.industry, companyInfo.size, catalog]);

  const applyGeneratedWorkflowsAndAgents = () => {
    const generatedWorkflows = generateGoalWorkflows(companyInfo.goals || []);
    if (setWorkflows) {
      setWorkflows(generatedWorkflows);
    }

    if (recommendedSpecialists.length > 0) {
      const mappedAgents = recommendedSpecialists.map(spec => {
        const matchedWfs = generatedWorkflows.filter(gw => spec.matchedGoalIds?.includes(gw.generatedFromGoalId || ''));
        const wfIds = matchedWfs.length > 0 ? matchedWfs.map(w => w.id) : generatedWorkflows.map(w => w.id);
        return {
          ...spec.agent,
          workflows: wfIds,
        };
      });
      setAgents(mappedAgents);
    }
  };

  const handleRecommendTeam = () => {
    // 1. Generate default mission if blank
    let activeMission = companyInfo.mission;
    if (!activeMission || activeMission.trim() === '') {
      activeMission = generateDefaultMission(companyInfo.name, companyInfo.industry, companyInfo.goals || []);
      setCompanyInfo({ ...companyInfo, mission: activeMission });
    }

    // 2. Generate and assign workflows and agents
    applyGeneratedWorkflowsAndAgents();
    setCurrentStep(2);
  };

  const handleRegenerateTeam = () => {
    applyGeneratedWorkflowsAndAgents();
  };

  const handleRemoveAgent = (id: string) => {
    setAgents(agents.filter(a => a.id !== id));
  };

  const steps = [
    { num: 1, label: 'Business Brief', icon: Building2 },
    { num: 2, label: 'Recommended Team', icon: Users },
    { num: 3, label: 'Tools & Approvals', icon: Layers },
    { num: 4, label: 'Review & Download', icon: CheckCircle2 },
  ];

  return (
    <div className="w-full max-w-5xl mx-auto space-y-6">
      {/* Step Progress Header */}
      <div className="p-4 rounded-2xl bg-zinc-900/60 border border-zinc-800/80 flex items-center justify-between overflow-x-auto">
        <div className="flex items-center gap-2 sm:gap-6 min-w-max mx-auto">
          {steps.map((s, idx) => {
            const Icon = s.icon;
            const isCompleted = currentStep > s.num;
            const isCurrent = currentStep === s.num;

            return (
              <div key={s.num} className="flex items-center gap-2 sm:gap-4">
                <button
                  type="button"
                  onClick={() => setCurrentStep(s.num)}
                  aria-current={isCurrent ? 'step' : undefined}
                  className={`flex items-center gap-2 px-3 py-1.5 rounded-xl transition-all cursor-pointer text-xs font-semibold ${
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
                  <span>{s.label}</span>
                </button>

                {idx < steps.length - 1 && (
                  <div className={`w-6 sm:w-12 h-0.5 rounded ${
                    currentStep > s.num ? 'bg-cyber-green/50' : 'bg-zinc-800'
                  }`} />
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Step Content */}
      {currentStep === 1 && (
        <Step1_BusinessBrief
          companyInfo={companyInfo}
          setCompanyInfo={setCompanyInfo}
          dynamicIndustries={dynamicIndustries}
          onRecommendTeam={handleRecommendTeam}
        />
      )}

      {currentStep === 2 && (
        <Step2_TeamRecommendations
          agents={agents}
          catalogCount={catalog.length}
          recommendedSpecialists={recommendedSpecialists}
          onRegenerateTeam={handleRegenerateTeam}
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
