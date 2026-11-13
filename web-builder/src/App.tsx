import { lazy, Suspense } from 'react';
import { createPortal } from 'react-dom';
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
import type { Agent } from './types';
import ModeSelector from './components/ModeSelector';
import { SwarmBuilderProvider } from './context/SwarmBuilderContext';
import {
  DEPARTMENTS,
  scrollToWorkspace,
  useSwarmBuilder,
} from './context/swarmBuilderStore';

function GithubIcon({ className = 'w-4 h-4' }: { className?: string }) {
  return (
    <svg className={className} fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
      <path
        fillRule="evenodd"
        d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.53 1.032 1.53 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z"
        clipRule="evenodd"
      />
    </svg>
  );
}

const GuidedWizard = lazy(() => import('./components/Guided/GuidedWizard'));
const Step1_CompanyMission = lazy(() => import('./components/Steps/Step1_CompanyMission'));
const Step2_Roster = lazy(() => import('./components/Steps/Step2_Roster'));
const Step3_Playbooks = lazy(() => import('./components/Steps/Step3_Playbooks'));
const Step4_Connectors = lazy(() => import('./components/Steps/Step4_Connectors'));
const Step5_Forge = lazy(() => import('./components/Steps/Step5_Forge'));
const CatalogDrawer = lazy(() => import('./components/Modals/CatalogDrawer'));
const AgentEditor = lazy(() => import('./components/Modals/AgentEditor'));
const McpEditor = lazy(() => import('./components/Modals/McpEditor'));

function SwarmBuilderShell() {
  const {
    experienceMode,
    hasSelectedMode,
    showTemplatesLibrary,
    savedDraftState,
    step,
    guidedStep,
    catalogLoadError,
    connectorLoadError,
    searchTerm,
    companyInfo,
    isCustomIndustry,
    customIndustryName,
    customIndustryPath,
    showCustomCodeInput,
    selectedTemplateId,
    selectedTemplate,
    isLoadingSwarmDetails,
    loadedSwarmDetails,
    swarmLoadError,
    mcpCatalog,
    selectedConnectors,
    isMcpEditorModalOpen,
    editingMcp,
    catalog,
    isCatalogModalOpen,
    isEditorModalOpen,
    editingAgent,
    agents,
    workflows,
    dynamicIndustries,
    dynamicRegistry,
    isExporting,
    exportError,
    draftToast,
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
  } = useSwarmBuilder();

  if (!hasSelectedMode && !showTemplatesLibrary) {
    return (
      <div className="min-h-screen">
        <ModeSelector
          templateCount={dynamicRegistry.length || 81}
          onSelectMode={handleSelectMode}
          onBrowseTemplates={() => setField('showTemplatesLibrary', true)}
          savedDraft={savedDraftState}
          onResumeDraft={handleResumeDraft}
          onDiscardDraft={handleDiscardDraft}
        />
      </div>
    );
  }

  return (
    <div className="workspace-shell min-h-screen flex flex-col items-center animate-fadeIn">
      <a href="#workspace-content" className="skip-link">Skip to workspace</a>
      {draftToast && (
        <div role="status" className="fixed top-5 right-5 left-5 sm:left-auto sm:max-w-md z-50 px-4 py-3 rounded-xl bg-zinc-900 border border-zinc-700 text-zinc-100 text-sm shadow-lg flex items-center gap-2">
          <BookmarkCheck className="w-4 h-4" /> {draftToast}
        </div>
      )}

      {exportError && (
        <div role="alert" className="w-full mb-6 p-4 rounded-xl bg-red-950/80 border border-red-800 text-red-200 text-xs flex items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-red-400 shrink-0" />
            <span><strong>Export Blocked:</strong> {exportError}</span>
          </div>
          <button
            onClick={() => setField('exportError', null)}
            className="text-red-400 hover:text-white font-mono uppercase text-[10px] cursor-pointer"
          >
            Dismiss
          </button>
        </div>
      )}

      <header className="workspace-header w-full flex flex-col lg:flex-row justify-between lg:items-center">
        <button
          type="button"
          onClick={goHome}
          aria-label="Swarm Architect home"
          data-tooltip="Return to mode selector home view"
          className="focus-sovereign tooltip-bottom flex items-center gap-3 text-left rounded-lg cursor-pointer"
        >
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
        </button>

        <div className="workspace-toolbar">
          <div className="mode-switch p-1 rounded-xl bg-zinc-900 border border-zinc-800 flex items-center gap-1">
            <button
              type="button"
              onClick={() => handleSelectMode('guided')}
              aria-pressed={experienceMode === 'guided'}
              data-tooltip="4-step plain-language wizard tailored to your business goals"
              className={`focus-sovereign tooltip-bottom px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all flex items-center gap-1.5 cursor-pointer ${
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
              onClick={() => handleSelectMode('advanced')}
              aria-pressed={experienceMode === 'advanced'}
              data-tooltip="5-phase direct editor for agent prompts, playbooks, and MCP servers"
              className={`focus-sovereign tooltip-bottom px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all flex items-center gap-1.5 cursor-pointer ${
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
            onClick={() => setField('showTemplatesLibrary', !showTemplatesLibrary)}
            aria-label={showTemplatesLibrary ? 'Return to setup' : 'Browse industry templates'}
            aria-pressed={showTemplatesLibrary}
            data-tooltip={showTemplatesLibrary ? 'Return to active workspace setup' : `Browse ${dynamicRegistry.length} pre-built industry templates`}
            className="focus-sovereign tooltip-bottom-end p-2 rounded-xl bg-zinc-900 border border-zinc-800 hover:border-zinc-700 text-zinc-400 hover:text-white transition-colors cursor-pointer"
          >
            <Layers className="w-4 h-4" />
          </button>

          <a
            href="https://github.com/DDS-Solutions/AI-Tadpole-OS-Industry-Templates"
            target="_blank"
            rel="noopener noreferrer"
            aria-label="GitHub Repository"
            data-tooltip="View open-source templates and contracts on GitHub"
            className="focus-sovereign tooltip-bottom-end p-2 rounded-xl bg-zinc-900 border border-zinc-800 hover:border-zinc-700 text-zinc-400 hover:text-white transition-colors"
          >
            <GithubIcon className="w-4 h-4" />
          </a>
        </div>
      </header>

      {(catalogLoadError || connectorLoadError) && (
        <div role="alert" className="w-full mb-6 p-4 rounded-xl border border-amber-500/25 bg-amber-500/5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-sm">
          <div className="flex items-start gap-2 text-amber-200">
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
            <div>
              {catalogLoadError && <p>{catalogLoadError}</p>}
              {connectorLoadError && <p>{connectorLoadError}</p>}
            </div>
          </div>
          <button
            type="button"
            onClick={() => {
              setField('catalogLoadError', null);
              setField('connectorLoadError', null);
              setField('assetRetry', Date.now());
            }}
            className="button-secondary shrink-0"
          >
            <RotateCcw className="w-4 h-4" /> Retry loading
          </button>
        </div>
      )}

      <main ref={workspaceRef} tabIndex={-1} id="workspace-content" className="workspace-content w-full">
        <Suspense fallback={<div className="w-full py-16 text-center text-zinc-500 font-mono text-xs motion-safe:animate-pulse">Loading experience...</div>}>
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
              isCatalogLoading={isCatalogLoading}
              catalogLoadError={catalogLoadError}
              currentStep={guidedStep}
              onStepChange={nextStep => { setField('guidedStep', nextStep); scrollToWorkspace(); }}
              onOpenCatalogModal={() => setField('isCatalogModalOpen', true)}
              validationIssues={validationIssues}
              isExporting={isExporting}
              onExport={handleExport}
              onSaveDraft={handleManualSaveDraft}
              onSwitchToAdvanced={() => setField('experienceMode', 'advanced')}
              onStartOver={handleStartOver}
            />
          ) : experienceMode === 'advanced' && !showTemplatesLibrary ? (
            <div className="w-full space-y-6">
              <nav aria-label="Advanced setup progress" className="builder-progress advanced-progress mb-4">
                {[
                  { id: 1, label: 'Identity' },
                  { id: 2, label: 'Agents' },
                  { id: 3, label: 'Workflows' },
                  { id: 4, label: 'Connections' },
                  { id: 5, label: 'Validate & Export' },
                ].map(s => (
                  <button
                    type="button"
                    key={s.id}
                    onClick={() => setField('step', s.id)}
                    aria-current={s.id === step ? 'step' : undefined}
                    className="flex flex-col items-center gap-1.5 cursor-pointer group"
                  >
                    <span className={`font-mono transition-colors ${s.id === step ? 'text-cyber-green font-bold' : 'text-zinc-400 group-hover:text-zinc-200'}`}>
                      {s.label}
                    </span>
                    <div
                      className={`w-12 sm:w-16 h-1 rounded-full transition-colors ${s.id <= step ? 'bg-cyber-green shadow-[0_0_8px_rgba(34,197,94,0.5)]' : 'bg-zinc-800'}`}
                    />
                  </button>
                ))}
              </nav>

              {(isLoadingSwarmDetails || swarmLoadError) && (
                <div role={swarmLoadError ? 'alert' : 'status'} className={`p-4 rounded-xl border text-sm flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${swarmLoadError ? 'border-red-500/30 text-red-200 bg-red-500/5' : 'border-zinc-700 text-zinc-300 bg-zinc-900/50'}`}>
                  <span>{isLoadingSwarmDetails ? 'Loading the selected template. Your current team stays in place until it is ready.' : `Template could not be loaded: ${swarmLoadError}`}</span>
                  {swarmLoadError && selectedTemplateId && (
                    <button
                      type="button"
                      onClick={() => {
                        const template = dynamicRegistry.find(item => item.id === selectedTemplateId);
                        if (template) void fetchSwarmDetails(template.path, true);
                      }}
                      className="button-secondary shrink-0"
                    >
                      Retry template
                    </button>
                  )}
                </div>
              )}

              <AnimatePresence mode="wait">
                {step === 1 && (
                  <Step1_CompanyMission
                    companyInfo={companyInfo}
                    setCompanyInfo={setCompanyInfo}
                    dynamicIndustries={dynamicIndustries}
                    dynamicRegistry={dynamicRegistry}
                    selectedTemplateId={selectedTemplateId}
                    setSelectedTemplateId={val => setField('selectedTemplateId', val)}
                    isCustomIndustry={isCustomIndustry}
                    setIsCustomIndustry={val => setField('isCustomIndustry', val)}
                    customIndustryName={customIndustryName}
                    setCustomIndustryName={val => setField('customIndustryName', val)}
                    customIndustryPath={customIndustryPath}
                    setCustomIndustryPath={val => setField('customIndustryPath', val)}
                    showCustomCodeInput={showCustomCodeInput}
                    setShowCustomCodeInput={val => setField('showCustomCodeInput', val)}
                    onAiAssist={() => { void handleAiAssist(); }}
                    onLoadSwarmDetails={(path) => { void fetchSwarmDetails(path, true); }}
                    onNext={() => { setField('step', 2); scrollToWorkspace(); }}
                  />
                )}

                {step === 2 && (
                  <Step2_Roster
                    agents={agents}
                    onRemoveAgent={removeAgent}
                    onEditAgent={(agent) => { setField('editingAgent', agent); setField('isEditorModalOpen', true); }}
                    onOpenCatalog={() => setField('isCatalogModalOpen', true)}
                    onCreateCustomAgent={handleCreateCustomAgent}
                    onPrevious={() => { setField('step', 1); scrollToWorkspace(); }}
                    onNext={() => { setField('step', 3); scrollToWorkspace(); }}
                  />
                )}

                {step === 3 && (
                  <Step3_Playbooks
                    workflows={workflows}
                    setWorkflows={setWorkflows}
                    companyInfo={companyInfo}
                    onAddWorkflow={addWorkflow}
                    onRemoveWorkflow={removeWorkflow}
                    onPrevious={() => { setField('step', 2); scrollToWorkspace(); }}
                    onNext={() => { setField('step', 4); scrollToWorkspace(); }}
                  />
                )}

                {step === 4 && (
                  <Step4_Connectors
                    mcpCatalog={mcpCatalog}
                    selectedConnectors={selectedConnectors}
                    setSelectedConnectors={setSelectedConnectors}
                    onAddNewMcp={handleAddNewMcp}
                    onEditMcp={(connector) => { setField('editingMcp', connector); setField('isMcpEditorModalOpen', true); }}
                    onDeleteMcp={handleDeleteMcp}
                    onPrevious={() => { setField('step', 3); scrollToWorkspace(); }}
                    onNext={() => { setField('step', 5); scrollToWorkspace(); }}
                  />
                )}

                {step === 5 && (
                  <Step5_Forge
                    companyInfo={companyInfo}
                    agents={agents}
                    workflows={workflows}
                    selectedConnectors={selectedConnectors}
                    mcpCatalog={mcpCatalog}
                    validationIssues={validationIssues}
                    isExporting={isExporting}
                    onExport={() => { void handleExport(); }}
                    onPrevious={() => { setField('step', 4); scrollToWorkspace(); }}
                    onReset={handleStartOver}
                  />
                )}
              </AnimatePresence>
            </div>
          ) : null}
        </Suspense>

        {showTemplatesLibrary && (
          <section className="w-full my-6 animate-fadeIn" aria-label="Industry template library">
            <div className="template-library sovereign-panel p-6 flex flex-col min-h-[600px] border-zinc-800/80 bg-zinc-950">
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
                      placeholder="Search industries, teams, or tasks..."
                      aria-label="Search industry templates"
                      type="search"
                      value={searchTerm}
                      onChange={e => setField('searchTerm', e.target.value)}
                    />
                  </div>
                  <button
                    onClick={() => setField('showTemplatesLibrary', false)}
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
                          className={`focus-sovereign w-full p-4 rounded-xl border sovereign-transition cursor-pointer text-left ${
                            isSelected
                              ? 'bg-zinc-900 border-cyber-green/50 text-white'
                              : 'bg-zinc-950/40 border-zinc-800 text-zinc-400 hover:border-zinc-700'
                          }`}
                        >
                          <span className="flex justify-between items-start mb-1.5 gap-2">
                            <span className="text-[10px] font-mono text-zinc-500 uppercase tracking-wider">{template.industry}</span>
                            <span className="flex items-center gap-1.5">
                              {template.maturity && (
                                <span
                                  data-tooltip={
                                    template.maturity === 'verified'
                                      ? 'Verified Cohort: Includes full I/O contract schemas, multi-slot orchestration, oversight policies, and eval suite'
                                      : 'Starter Template: Pre-built industry scaffold ready for customization and validation'
                                  }
                                  className={`tooltip-left text-[9px] font-mono uppercase px-1.5 py-0.5 rounded border cursor-help ${
                                    template.maturity === 'verified'
                                      ? 'text-cyber-green bg-cyber-green/10 border-cyber-green/25'
                                      : 'text-zinc-400 bg-zinc-900 border-zinc-800'
                                  }`}
                                >
                                  {template.maturity}
                                </span>
                              )}
                              {isSelected && <span className="w-1.5 h-1.5 bg-cyber-green rounded-full motion-safe:animate-pulse" />}
                            </span>
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
                              aria-label="Template name"
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
                            aria-label="Template description"
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
                            <div className="text-xs text-zinc-400 font-mono py-2 motion-safe:animate-pulse flex items-center gap-2">
                              <div aria-hidden="true" className="w-3.5 h-3.5 border-2 border-zinc-800 border-t-cyber-green rounded-full motion-safe:animate-spin" />
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
                                      {agent.model || 'gemma4:31b-cloud'}
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
      </main>

      {(typeof document !== 'undefined') && createPortal(
        <>
          <Suspense fallback={null}>
            <AnimatePresence>
              {isCatalogModalOpen && (
                <CatalogDrawer
                  isOpen={isCatalogModalOpen}
                  onClose={() => setField('isCatalogModalOpen', false)}
                  catalog={catalog}
                  isCatalogLoading={isCatalogLoading}
                  onAddCatalogAgent={handleAddCatalogAgent}
                  departments={DEPARTMENTS}
                />
              )}
            </AnimatePresence>
          </Suspense>

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
                    rosterAgents={agents}
                    onClose={() => {
                      setField('isEditorModalOpen', false);
                      setField('editingAgent', null);
                    }}
                    onSave={handleSaveAgent}
                  />
                </motion.div>
              )}
            </AnimatePresence>
          </Suspense>

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
                      setField('isMcpEditorModalOpen', false);
                      setField('editingMcp', null);
                    }}
                    onSave={handleSaveMcp}
                  />
                </motion.div>
              )}
            </AnimatePresence>
          </Suspense>
        </>,
        document.body,
      )}

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
          AI-Tadpole-OS Swarm Architect • {dynamicRegistry.length || 81} Contract-Validated Industry Templates • {catalog.length || 342} Persona Catalog
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

export default function App() {
  return (
    <SwarmBuilderProvider>
      <SwarmBuilderShell />
    </SwarmBuilderProvider>
  );
}
