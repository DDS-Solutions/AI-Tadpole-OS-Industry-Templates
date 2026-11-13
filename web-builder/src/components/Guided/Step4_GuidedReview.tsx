import { Download, Shield, CheckCircle2, AlertTriangle, AlertCircle, ArrowLeft, Terminal, BookmarkCheck, RotateCcw } from 'lucide-react';
import type { Agent, CompanyInfo, MCPConnector, ValidationIssue, WorkflowItem } from '../../types';
import { DANGEROUS_SKILL_SET, VALID_RUNTIME_CAPABILITIES } from '../../constants/capabilities';
import { buildSwarmDisclosureSummary } from '../../utils/disclosureSummary';
import { normalizeMcpGrant } from '../../utils/mcpGrants';

interface Step4GuidedReviewProps {
  companyInfo: CompanyInfo;
  agents: Agent[];
  workflows: WorkflowItem[];
  selectedConnectors: string[];
  mcpCatalog: MCPConnector[];
  validationIssues: ValidationIssue[];
  isExporting: boolean;
  onExport: () => void;
  onSaveDraft: () => boolean;
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
  const errors = validationIssues.filter(i => i.severity === 'error');
  const warnings = validationIssues.filter(i => i.severity === 'warning');

  const isReady = errors.length === 0;
  const activeTools = new Map(mcpCatalog
    .filter(connector => selectedConnectors.includes(connector.id))
    .flatMap(connector => (connector.tools || []).map(tool => [tool.id, tool.risk] as const)));
  const oversightAgents = agents.filter(agent => Boolean(agent.requiresOversight)
    || (agent.skills || ['read_file']).some(skill => DANGEROUS_SKILL_SET.has(skill))
    || (agent.mcpTools || []).some(grant => ['write', 'execute'].includes(activeTools.get(normalizeMcpGrant(grant)) || '')));
  const hasUnknownPermissions = agents.some(agent =>
    (agent.skills || ['read_file']).some(skill => !VALID_RUNTIME_CAPABILITIES.has(skill))
    || (agent.mcpTools || []).some(grant => !activeTools.has(normalizeMcpGrant(grant))));
  const disclosure = buildSwarmDisclosureSummary(agents, selectedConnectors, mcpCatalog);

  return (
    <div className="w-full sovereign-panel p-8 space-y-8 animate-fadeIn">
      <div>
        <div className="flex items-center gap-2 text-cyber-green text-xs font-mono uppercase tracking-wider mb-1">
          <CheckCircle2 className="w-4 h-4" />
          <span>Step 4 of 4: Review & Download</span>
        </div>
        <h2 className="text-2xl font-bold text-white">Review your AI team blueprint</h2>
        <p className="text-sm text-zinc-400 mt-1">
          Verify configuration, inspect readiness status, and download your production-ready AI-Tadpole-OS package.
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

        <div className="flex flex-wrap items-center gap-2 font-mono text-xs">
          <span className="px-3 py-1 rounded-full bg-zinc-900 border border-zinc-800 text-zinc-300">
            {agents.length} {agents.length === 1 ? 'Specialist' : 'Specialists'}
          </span>
          <span className="px-3 py-1 rounded-full bg-zinc-900 border border-zinc-800 text-zinc-300">
            {workflows.length} {workflows.length === 1 ? 'Playbook' : 'Playbooks'}
          </span>
          <span className="px-3 py-1 rounded-full bg-zinc-900 border border-zinc-800 text-zinc-300">
            {selectedConnectors.length} {selectedConnectors.length === 1 ? 'Tool' : 'Tools'}
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
              <div key={a.id} className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-0.5 sm:gap-2 text-xs text-zinc-300">
                <span className="flex items-center gap-1.5 min-w-0">
                  <span className="shrink-0">{a.emoji || '🤖'}</span>
                  <span className="font-medium text-white truncate">{a.name}</span>
                </span>
                <span className="text-[11px] font-mono text-zinc-500 sm:shrink-0 sm:text-right">{a.role}</span>
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
            <span className={oversightAgents.length > 0 || hasUnknownPermissions ? 'text-amber-400 font-semibold' : 'text-cyber-green'}>
              {oversightAgents.length > 0
                ? `${oversightAgents.length} of ${agents.length} Require Oversight`
                : hasUnknownPermissions
                ? 'Permissions Need Review'
                : agents.length > 0 ? 'Read-only Capabilities' : 'No Specialists Configured'}
            </span>
          </div>
          <div className="space-y-1.5 text-xs text-zinc-400">
            {oversightAgents.length > 0 ? (
              <>
                <div className="flex items-start gap-1.5 text-amber-200/90">
                  <Shield className="w-3.5 h-3.5 text-amber-400 shrink-0 mt-0.5" />
                  <span>
                    Operator oversight is required for: {oversightAgents.map(agent => agent.name).join(', ')}.
                  </span>
                </div>
                <div className="flex items-center gap-1.5 text-zinc-400 text-[11px]">
                  <CheckCircle2 className="w-3.5 h-3.5 text-cyber-green shrink-0" />
                  <span>Review declared capabilities and approval settings before deployment.</span>
                </div>
              </>
            ) : hasUnknownPermissions ? (
              <div className="flex items-start gap-1.5 text-amber-200/90">
                <AlertTriangle className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                <span>Some capabilities or tool grants could not be verified. Resolve the permission diagnostics before deployment.</span>
              </div>
            ) : agents.length > 0 ? (
              <>
                <div className="flex items-center gap-1.5 text-zinc-300">
                  <CheckCircle2 className="w-3.5 h-3.5 text-cyber-green shrink-0" />
                  <span>The configured specialists declare only read-only capabilities and tool grants.</span>
                </div>
                <div className="flex items-center gap-1.5 text-zinc-400 text-[11px]">
                  <Shield className="w-3.5 h-3.5 text-zinc-500 shrink-0" />
                  <span>Recheck permissions whenever you change agents or connectors.</span>
                </div>
              </>
            ) : <p>Add a specialist to review its approval requirements.</p>}
          </div>
        </div>
      </div>

      {/* Pre-Export Capabilities & Egress Disclosure */}
      <div className="p-5 rounded-xl bg-zinc-950 border border-zinc-800/80 space-y-3" data-testid="swarm-disclosure-card">
        <div className="flex items-center justify-between text-xs font-mono text-zinc-400 border-b border-zinc-800/60 pb-2">
          <span className="uppercase">What This Swarm Can Do (Pre-Export Disclosure)</span>
          <span className="text-[11px] text-zinc-500">Static Capability Manifest</span>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
          <div>
            <div className="text-[10px] font-mono uppercase text-zinc-500 mb-1">Declared Runtime Tools</div>
            <div className="text-zinc-300 font-mono">{disclosure.capabilities.join(', ') || 'None'}</div>
          </div>
          <div>
            <div className="text-[10px] font-mono uppercase text-zinc-500 mb-1">MCP Grants &amp; Env Variables</div>
            <div className="text-zinc-300 font-mono">
              {disclosure.mcpGrants.length > 0 ? disclosure.mcpGrants.join(', ') : 'No MCP tool grants'}
              {disclosure.requiredEnvVars.length > 0 ? ` (Env: ${disclosure.requiredEnvVars.join(', ')})` : ''}
            </div>
          </div>
          {disclosure.egressUrls.length > 0 && (
            <div className="md:col-span-2">
              <div className="text-[10px] font-mono uppercase text-zinc-500 mb-1">External HTTP MCP Endpoints</div>
              <div className="text-amber-300 font-mono break-all">{disclosure.egressUrls.join(', ')}</div>
            </div>
          )}
        </div>
        {disclosure.hasBundledPythonSkills && (
          <div className="p-3 rounded-lg bg-amber-950/30 border border-amber-800/50 text-amber-200 text-[11px] leading-relaxed">
            <strong>Bundled Python Connector Note (AI-TadPole-OS v1.1.464):</strong> Template Store install copies bundled <code>skills/*-server.py</code> into <code>execution/</code> automatically. If importing this <code>.zip</code> manually into AI-TadPole-OS, copy files from <code>skills/</code> into your workspace <code>execution/</code> folder.
          </div>
        )}
      </div>

      {/* Primary Action Area */}
      <div className="p-6 rounded-2xl bg-zinc-900/60 border border-zinc-800 flex flex-col sm:flex-row items-center justify-between gap-4">
        <div>
          <h3 className="text-base font-bold text-white">Download AI-Tadpole-OS Swarm Archive</h3>
          <p className="text-xs text-zinc-400 mt-0.5">
            Generates a standard <span className="font-mono text-cyber-green">.zip</span> package ready for import into AI-Tadpole-OS.
          </p>
        </div>

        <button
          type="button"
          onClick={onExport}
          disabled={!isReady || isExporting}
          data-tooltip={
            isReady
              ? 'Generate downloadable .zip package validated for AI-Tadpole-OS import'
              : 'Resolve blocking validation errors above before downloading'
          }
          className={`focus-sovereign w-full sm:w-auto px-5 py-3.5 rounded-xl font-bold text-sm transition-all flex items-center justify-center gap-2 cursor-pointer shadow-lg ${
            isReady && !isExporting
              ? 'bg-cyber-green hover:bg-cyber-green-light text-zinc-950 shadow-cyber-green/20'
              : 'bg-zinc-800 text-zinc-500 cursor-not-allowed'
          }`}
        >
          <Download className="w-4 h-4" />
          {isExporting ? 'Packaging Swarm...' : 'Download AI-Tadpole-OS Swarm'}
        </button>
      </div>

      {/* Secondary Actions & Advanced Transition */}
      <div className="pt-4 border-t border-zinc-800/80 flex flex-wrap items-center justify-between gap-3 text-xs">
        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={onBack}
            className="focus-sovereign px-4 py-2 rounded-lg bg-zinc-900 hover:bg-zinc-800 text-zinc-400 hover:text-zinc-200 transition-colors flex items-center gap-1.5 cursor-pointer border border-zinc-800"
          >
            <ArrowLeft className="w-3.5 h-3.5" /> Return to Tools
          </button>
          <button
            type="button"
            onClick={onSaveDraft}
            data-tooltip="Save your current guided setup locally in browser storage"
            className="focus-sovereign px-4 py-2 rounded-lg bg-zinc-900 hover:bg-zinc-800 text-zinc-300 transition-colors flex items-center gap-1.5 cursor-pointer border border-zinc-800"
          >
            <BookmarkCheck className="w-3.5 h-3.5 text-cyber-green" />
            Save Draft
          </button>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={onSwitchToAdvanced}
            data-tooltip="Inspect and edit raw prompts, workflows, and server schemas in the 5-phase editor"
            className="focus-sovereign px-4 py-2 rounded-lg bg-zinc-900 hover:bg-zinc-800 text-zinc-400 hover:text-white transition-colors flex items-center gap-1.5 cursor-pointer border border-zinc-800"
          >
            <Terminal className="w-3.5 h-3.5" /> Review in Advanced Setup
          </button>
          <button
            type="button"
            onClick={onStartOver}
            data-tooltip="Reset guided wizard and clear unsaved selections"
            className="focus-sovereign tooltip-left px-3 py-2 rounded-lg text-zinc-500 hover:text-red-400 transition-colors flex items-center gap-1 cursor-pointer"
          >
            <RotateCcw className="w-3 h-3" /> Start Over
          </button>
        </div>
      </div>
    </div>
  );
}
