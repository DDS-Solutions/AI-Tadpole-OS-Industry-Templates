import { useState } from 'react';
import { Download, Shield, CheckCircle2, AlertTriangle, AlertCircle, ArrowLeft, Terminal, BookmarkCheck, RotateCcw } from 'lucide-react';
import type { Agent, CompanyInfo, MCPConnector, ValidationIssue, WorkflowItem } from '../../types';

interface Step4GuidedReviewProps {
  companyInfo: CompanyInfo;
  agents: Agent[];
  workflows: WorkflowItem[];
  selectedConnectors: string[];
  mcpCatalog: MCPConnector[];
  validationIssues: ValidationIssue[];
  isExporting: boolean;
  onExport: () => void;
  onSaveDraft: () => void;
  onSwitchToAdvanced: () => void;
  onStartOver: () => void;
  onBack: () => void;
  onJumpToStep: (stepNumber: number) => void;
}

export default function Step4_GuidedReview({
  companyInfo,
  agents,
  workflows,
  selectedConnectors,
  mcpCatalog,
  validationIssues,
  isExporting,
  onExport,
  onSaveDraft,
  onSwitchToAdvanced,
  onStartOver,
  onBack,
  onJumpToStep,
}: Step4GuidedReviewProps) {
  const [saveSuccess, setSaveSuccess] = useState(false);

  const errors = validationIssues.filter(i => i.severity === 'error');
  const warnings = validationIssues.filter(i => i.severity === 'warning');

  const isReady = errors.length === 0;

  const handleSaveDraftClick = () => {
    onSaveDraft();
    setSaveSuccess(true);
    setTimeout(() => setSaveSuccess(false), 3000);
  };

  return (
    <div className="w-full sovereign-panel p-8 space-y-8 animate-fadeIn">
      <div>
        <div className="flex items-center gap-2 text-cyber-green text-xs font-mono uppercase tracking-wider mb-1">
          <CheckCircle2 className="w-4 h-4" />
          <span>Step 4 of 4: Review & Download</span>
        </div>
        <h2 className="text-2xl font-bold text-white">Review your AI team blueprint</h2>
        <p className="text-sm text-zinc-400 mt-1">
          Verify configuration, inspect readiness status, and download your production-ready Tadpole OS package.
        </p>
      </div>

      {/* Readiness Banner */}
      <div
        className={`p-5 rounded-2xl border flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 ${
          !isReady
            ? 'bg-red-950/20 border-red-900/50 text-red-200'
            : warnings.length > 0
            ? 'bg-amber-950/20 border-amber-900/50 text-amber-200'
            : 'bg-cyber-green/10 border-cyber-green/30 text-cyber-green'
        }`}
      >
        <div className="flex items-start gap-3">
          {!isReady ? (
            <AlertCircle className="w-6 h-6 text-red-400 shrink-0 mt-0.5" />
          ) : warnings.length > 0 ? (
            <AlertTriangle className="w-6 h-6 text-amber-400 shrink-0 mt-0.5" />
          ) : (
            <CheckCircle2 className="w-6 h-6 text-cyber-green shrink-0 mt-0.5" />
          )}

          <div>
            <h3 className="text-base font-bold text-white">
              {!isReady
                ? 'Configuration Needs Attention'
                : warnings.length > 0
                ? 'Review Recommended'
                : 'Swarm Ready for Export'}
            </h3>
            <p className="text-xs text-zinc-400 mt-0.5">
              {!isReady
                ? `${errors.length} issue${errors.length > 1 ? 's' : ''} must be resolved before downloading.`
                : warnings.length > 0
                ? 'Valid contract structure. Review elevated permissions or non-blocking notices below.'
                : 'Registry checks passed; review the private runtime contract before deployment.'}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 font-mono text-xs shrink-0">
          <span className="px-3 py-1 rounded-full bg-zinc-900 border border-zinc-800 text-zinc-300">
            {agents.length} Specialists
          </span>
          <span className="px-3 py-1 rounded-full bg-zinc-900 border border-zinc-800 text-zinc-300">
            {workflows.length} Playbooks
          </span>
          <span className="px-3 py-1 rounded-full bg-zinc-900 border border-zinc-800 text-zinc-300">
            {selectedConnectors.length} Tools
          </span>
        </div>
      </div>

      {/* Diagnostic Issues (if any) */}
      {validationIssues.length > 0 && (
        <div className="space-y-3 p-4 rounded-xl bg-zinc-950 border border-zinc-800">
          <h4 className="text-xs font-mono uppercase text-zinc-400 font-semibold">
            Validation Diagnostics
          </h4>
          <div className="space-y-2">
            {validationIssues.map(issue => (
              <div
                key={issue.id}
                className="flex items-start justify-between gap-3 text-xs p-2.5 rounded-lg bg-zinc-900/80 border border-zinc-800"
              >
                <div className="flex items-start gap-2">
                  {issue.severity === 'error' ? (
                    <AlertCircle className="w-3.5 h-3.5 text-red-400 shrink-0 mt-0.5" />
                  ) : (
                    <AlertTriangle className="w-3.5 h-3.5 text-amber-400 shrink-0 mt-0.5" />
                  )}
                  <div>
                    <span className="text-white font-medium">{issue.message}</span>
                    {issue.suggestedAction && (
                      <p className="text-zinc-400 text-[11px] mt-0.5">{issue.suggestedAction}</p>
                    )}
                  </div>
                </div>

                <button
                  onClick={() => {
                    if (issue.section === 'identity') onJumpToStep(1);
                    else if (issue.section === 'agents') onJumpToStep(2);
                    else if (issue.section === 'connectors') onJumpToStep(3);
                    else if (issue.section === 'workflows') onSwitchToAdvanced();
                    else onJumpToStep(1);
                  }}
                  className="text-cyber-green hover:underline shrink-0 text-[11px] font-mono cursor-pointer"
                >
                  {issue.section === 'workflows' ? 'Edit in Advanced \u2192' : 'Edit \u2192'}
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Blueprint Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Card 1: Identity & Scope */}
        <div className="p-5 rounded-xl bg-zinc-950 border border-zinc-800/80 space-y-3">
          <div className="flex items-center justify-between text-xs font-mono text-zinc-400 border-b border-zinc-800/60 pb-2">
            <span className="uppercase">Organization</span>
            <button onClick={() => onJumpToStep(1)} className="text-cyber-green hover:underline cursor-pointer">
              Edit
            </button>
          </div>
          <div className="space-y-1">
            <div className="text-base font-bold text-white">{companyInfo.name || 'Untitled Swarm'}</div>
            <div className="text-xs text-zinc-400">{companyInfo.industry} &bull; {companyInfo.size} employees</div>
            {companyInfo.goals && companyInfo.goals.length > 0 && (
              <div className="flex flex-wrap gap-1 pt-1.5">
                {companyInfo.goals.map(g => (
                  <span key={g} className="px-2 py-0.5 rounded bg-zinc-900 text-zinc-300 text-[10px] font-mono border border-zinc-800">
                    {g}
                  </span>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Card 2: AI Team Roster */}
        <div className="p-5 rounded-xl bg-zinc-950 border border-zinc-800/80 space-y-3">
          <div className="flex items-center justify-between text-xs font-mono text-zinc-400 border-b border-zinc-800/60 pb-2">
            <span className="uppercase">Specialists ({agents.length})</span>
            <button onClick={() => onJumpToStep(2)} className="text-cyber-green hover:underline cursor-pointer">
              Edit
            </button>
          </div>
          <div className="space-y-1.5 max-h-36 overflow-y-auto pr-1">
            {agents.map(a => (
              <div key={a.id} className="flex items-center justify-between text-xs text-zinc-300">
                <span className="flex items-center gap-1.5 truncate">
                  <span>{a.emoji || '🤖'}</span>
                  <span className="font-medium text-white truncate">{a.name}</span>
                </span>
                <span className="text-[11px] font-mono text-zinc-500 shrink-0">{a.role}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Card 3: Business Tools */}
        <div className="p-5 rounded-xl bg-zinc-950 border border-zinc-800/80 space-y-3">
          <div className="flex items-center justify-between text-xs font-mono text-zinc-400 border-b border-zinc-800/60 pb-2">
            <span className="uppercase">Connected Tools ({selectedConnectors.length})</span>
            <button onClick={() => onJumpToStep(3)} className="text-cyber-green hover:underline cursor-pointer">
              Edit
            </button>
          </div>
          {selectedConnectors.length === 0 ? (
            <div className="text-xs text-zinc-500 italic">No external tool connectors selected</div>
          ) : (
            <div className="flex flex-wrap gap-1.5">
              {selectedConnectors.map(cId => {
                const conn = mcpCatalog.find(c => c.id === cId);
                return (
                  <span key={cId} className="px-2.5 py-1 rounded-lg bg-zinc-900 border border-zinc-800 text-xs text-zinc-300">
                    {conn?.name || cId}
                  </span>
                );
              })}
            </div>
          )}
        </div>

        {/* Card 4: Governance & Approvals */}
        <div className="p-5 rounded-xl bg-zinc-950 border border-zinc-800/80 space-y-3">
          <div className="flex items-center justify-between text-xs font-mono text-zinc-400 border-b border-zinc-800/60 pb-2">
            <span className="uppercase">Human Oversight</span>
            <span className={agents.some(a => a.requiresOversight) ? 'text-amber-400 font-semibold' : 'text-cyber-green'}>
              {agents.some(a => a.requiresOversight)
                ? `${agents.filter(a => a.requiresOversight).length} of ${agents.length} Agents Enforced`
                : 'Read-Only Mode'}
            </span>
          </div>
          <div className="space-y-1.5 text-xs text-zinc-400">
            {agents.some(a => a.requiresOversight) ? (
              <>
                <div className="flex items-start gap-1.5 text-amber-200/90">
                  <Shield className="w-3.5 h-3.5 text-amber-400 shrink-0 mt-0.5" />
                  <span>
                    Operator approval required for mutating agents: {agents.filter(a => a.requiresOversight).map(a => a.name).join(', ')}.
                  </span>
                </div>
                <div className="flex items-center gap-1.5 text-zinc-400 text-[11px]">
                  <CheckCircle2 className="w-3.5 h-3.5 text-cyber-green shrink-0" />
                  <span>Outbound communications generated as reviewable drafts.</span>
                </div>
              </>
            ) : (
              <>
                <div className="flex items-center gap-1.5 text-zinc-300">
                  <CheckCircle2 className="w-3.5 h-3.5 text-cyber-green shrink-0" />
                  <span>All specialists operate in safe read-only draft mode.</span>
                </div>
                <div className="flex items-center gap-1.5 text-zinc-400 text-[11px]">
                  <Shield className="w-3.5 h-3.5 text-zinc-500 shrink-0" />
                  <span>No autonomous file mutations or external commitments.</span>
                </div>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Primary Action Area */}
      <div className="p-6 rounded-2xl bg-zinc-900/60 border border-zinc-800 flex flex-col sm:flex-row items-center justify-between gap-4">
        <div>
          <h3 className="text-base font-bold text-white">Download Tadpole OS Swarm Archive</h3>
          <p className="text-xs text-zinc-400 mt-0.5">
            Generates a standard <span className="font-mono text-cyber-green">.zip</span> package ready for import into Tadpole OS.
          </p>
        </div>

        <button
          onClick={onExport}
          disabled={!isReady || isExporting}
          className={`px-6 py-3.5 rounded-xl font-bold text-sm transition-all flex items-center gap-2 cursor-pointer shadow-lg ${
            isReady && !isExporting
              ? 'bg-cyber-green hover:bg-cyber-green-light text-zinc-950 shadow-cyber-green/20'
              : 'bg-zinc-800 text-zinc-500 cursor-not-allowed'
          }`}
        >
          <Download className="w-4 h-4" />
          {isExporting ? 'Packaging Swarm...' : 'Download Tadpole OS Swarm'}
        </button>
      </div>

      {/* Secondary Actions & Advanced Transition */}
      <div className="pt-4 border-t border-zinc-800/80 flex flex-wrap items-center justify-between gap-3 text-xs">
        <div className="flex items-center gap-2">
          <button
            onClick={onBack}
            className="px-4 py-2 rounded-lg bg-zinc-900 hover:bg-zinc-800 text-zinc-400 hover:text-zinc-200 transition-colors flex items-center gap-1.5 cursor-pointer border border-zinc-800"
          >
            <ArrowLeft className="w-3.5 h-3.5" /> Return to Tools
          </button>
          <button
            onClick={handleSaveDraftClick}
            className="px-4 py-2 rounded-lg bg-zinc-900 hover:bg-zinc-800 text-zinc-300 transition-colors flex items-center gap-1.5 cursor-pointer border border-zinc-800"
          >
            <BookmarkCheck className="w-3.5 h-3.5 text-cyber-green" />
            {saveSuccess ? 'Draft Saved!' : 'Save Draft'}
          </button>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={onSwitchToAdvanced}
            className="px-4 py-2 rounded-lg bg-zinc-900 hover:bg-zinc-800 text-zinc-400 hover:text-white transition-colors flex items-center gap-1.5 cursor-pointer border border-zinc-800"
          >
            <Terminal className="w-3.5 h-3.5" /> Review in Advanced Setup
          </button>
          <button
            onClick={onStartOver}
            className="px-3 py-2 rounded-lg text-zinc-500 hover:text-red-400 transition-colors flex items-center gap-1 cursor-pointer"
          >
            <RotateCcw className="w-3 h-3" /> Start Over
          </button>
        </div>
      </div>
    </div>
  );
}
