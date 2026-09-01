import { AlertCircle, AlertTriangle, Cpu, Shield, Download } from 'lucide-react';
import { motion } from 'framer-motion';
import type { Agent, ValidationIssue, WorkflowItem } from '../../types';
import { scanShieldCapabilities } from '../../utils';

interface CompanyInfo {
  name: string;
}

interface Step5Props {
  companyInfo: CompanyInfo;
  agents: Agent[];
  workflows: WorkflowItem[];
  validationIssues: ValidationIssue[];
  isExporting: boolean;
  onExport: () => void;
  onPrevious: () => void;
  onReset: () => void;
}

export default function Step5_Forge({
  companyInfo,
  agents,
  workflows,
  validationIssues,
  isExporting,
  onExport,
  onPrevious,
  onReset
}: Step5Props) {
  const dangerousSkills = new Set(['write_file', 'delete_file', 'execute_shell', 'shell', 'terminal']);
  const oversightAgents = agents.filter(agent => (
    agent.requiresOversight || (agent.skills || []).some(skill => dangerousSkills.has(skill))
  )).length;
  const capabilityCount = new Set(agents.flatMap(agent => agent.skills || [])).size;
  const declaredMcpTools = new Set(agents.flatMap(agent => agent.mcpTools || [])).size;
  const errors = validationIssues.filter(issue => issue.severity === 'error');
  const warnings = validationIssues.filter(issue => issue.severity === 'warning');
  const isReady = errors.length === 0;

  return (
    <motion.div
      key="step5"
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      data-tooltip="Phase 5 Forge Workspace: Inspect the compilation manifest, review prompt capability hints, and generate installation ZIP packages."
      className="w-full sovereign-panel p-12 text-center"
    >
      <div className="bg-cyber-green/20 w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-6 border border-cyber-green/30">
        <Cpu className="text-cyber-green w-8 h-8" />
      </div>

      <div className="max-w-md mx-auto mb-8 grid grid-cols-3 gap-3 text-left">
        <div className="rounded-lg border border-zinc-800 bg-zinc-950/70 p-3">
          <div className="text-[9px] uppercase font-mono text-zinc-600">Capabilities</div>
          <div className="text-lg font-bold text-zinc-200 mt-1">{capabilityCount}</div>
        </div>
        <div className="rounded-lg border border-zinc-800 bg-zinc-950/70 p-3">
          <div className="text-[9px] uppercase font-mono text-zinc-600">MCP Declarations</div>
          <div className="text-lg font-bold text-zinc-200 mt-1">{declaredMcpTools}</div>
        </div>
        <div className="rounded-lg border border-zinc-800 bg-zinc-950/70 p-3">
          <div className="text-[9px] uppercase font-mono text-zinc-600">Oversight Agents</div>
          <div className="text-lg font-bold text-zinc-200 mt-1">{oversightAgents}</div>
        </div>
      </div>
      <h2 className="text-2xl font-bold mb-1" data-tooltip="The swarm configuration is ready to build and compile.">Phase 5: Validate & Export</h2>
      <p className="text-xs font-mono text-zinc-500 mb-6">Forge diagnostics & AI-Tadpole-OS package compilation</p>
      <p className="text-zinc-400 max-w-md mx-auto mb-8 text-sm leading-relaxed">
        Your swarm configuration for <span className="text-white font-bold">{companyInfo.name}</span> is ready for validation.
        The package includes {agents.length} agents and {workflows.length} workflows.
      </p>

      <div
        role={isReady ? 'status' : 'alert'}
        className={`max-w-md mx-auto mb-8 rounded-xl border p-4 text-left ${
          !isReady
            ? 'border-red-900/60 bg-red-950/30 text-red-200'
            : warnings.length > 0
              ? 'border-amber-900/60 bg-amber-950/20 text-amber-200'
              : 'border-cyber-green/30 bg-cyber-green/10 text-cyber-green'
        }`}
      >
        <div className="flex items-start gap-2.5">
          {!isReady ? (
            <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-red-400" />
          ) : warnings.length > 0 ? (
            <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-amber-400" />
          ) : (
            <Shield className="mt-0.5 h-4 w-4 shrink-0 text-cyber-green" />
          )}
          <div>
            <div className="text-xs font-bold text-white">
              {!isReady
                ? `${errors.length} blocking validation ${errors.length === 1 ? 'error' : 'errors'}`
                : warnings.length > 0
                  ? `${warnings.length} non-blocking ${warnings.length === 1 ? 'warning' : 'warnings'}`
                  : 'Contract validation passed'}
            </div>
            <p className="mt-1 text-[11px] leading-relaxed text-zinc-400">
              {!isReady
                ? errors[0].message
                : warnings.length > 0
                  ? warnings[0].message
                  : 'The blueprint is structurally ready for archive generation.'}
            </p>
          </div>
        </div>
      </div>

      <div data-tooltip="Archive Manifest: List of configuration maps, agent prompt profiles, and SOP documents structured in the build." className="max-w-sm mx-auto p-4 bg-zinc-950 border border-zinc-800 rounded-xl text-left font-mono text-xs text-zinc-500 mb-12">
        <div className="mb-2">Manifest:</div>
        <ul className="space-y-1">
          <li className="flex items-center gap-2"><div className="w-1 h-1 bg-cyber-green rounded-full" /> swarm.json</li>
          <li className="flex items-center gap-2"><div className="w-1 h-1 bg-cyber-green rounded-full" /> agents/ ({agents.length} files)</li>
          <li className="flex items-center gap-2"><div className="w-1 h-1 bg-cyber-green rounded-full" /> workflows/ ({workflows.length} files)</li>
        </ul>
      </div>

      {/* Advisory prompt review. Enforcement happens in repository and consumer gates. */}
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

        const isClear = allWarnings.length === 0;

        return (
          <div data-tooltip="Advisory keyword review of prompt text. This does not prove safety or grant runtime authorization." className="max-w-md mx-auto mb-12 bg-zinc-950/80 border rounded-xl overflow-hidden text-left sovereign-transition font-mono text-xs" style={{ borderColor: isClear ? '#10B981' : '#F59E0B' }}>
            <div className={`p-4 flex items-center gap-3 border-b ${isClear ? 'bg-emerald-950/20 border-emerald-900/40' : 'bg-amber-950/20 border-amber-900/40'}`} style={{ borderColor: isClear ? 'color-mix(in srgb, #10B981 30%, transparent)' : 'color-mix(in srgb, #F59E0B 30%, transparent)' }}>
              <Shield className={`w-5 h-5 ${isClear ? 'text-emerald-500' : 'text-amber-500'}`} />
              <div>
                <h4 className="font-bold text-xs text-white uppercase tracking-wider cursor-help" data-tooltip="A keyword-based prompt review; repository and AI-Tadpole-OS checks remain required.">Prompt Capability Advisory</h4>
                <p className="text-[10px] text-zinc-550 font-mono mt-0.5 font-normal">
                  {isClear ? 'No capability keywords detected' : 'Manual security review recommended'}
                </p>
              </div>
            </div>
            <div className="p-4 space-y-3 font-mono text-xs leading-normal">
              {isClear ? (
                <div className="text-zinc-400 leading-relaxed text-[11px]">
                  🟢 No configured capability keywords were found. This is an advisory result, not proof that the archive is safe or permission-free. Repository validation and AI-Tadpole-OS runtime controls still apply.
                </div>
              ) : (
                <>
                  <div className="text-zinc-400 mb-2 leading-relaxed text-[11px]">
                    ⚠️ The following prompts contain capability-related keywords. Review the archive and configure explicit AI-Tadpole-OS permissions before use; this advisory does not itself trigger or guarantee an authorization prompt.
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
          onClick={onExport}
          disabled={!isReady || isExporting}
          className="bg-cyber-green text-zinc-950 font-black px-12 py-4 rounded-xl hover:scale-105 transition-all flex items-center gap-3 cursor-pointer shadow-[0_0_20px_rgba(34,197,94,0.3)] text-sm uppercase font-mono tracking-wider disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:scale-100"
        >
          <Download className="w-6 h-6" /> {isExporting ? 'Packaging Swarm...' : 'Export Swarm Archive'}
        </button>
        <div className="flex gap-8 items-center mt-4">
          <button
            onClick={onPrevious}
            className="text-zinc-550 hover:text-white transition-colors text-xs font-mono tracking-wider uppercase cursor-pointer"
          >
            &larr; Previous Step
          </button>
          <button
            onClick={onReset}
            className="text-zinc-550 hover:text-white transition-colors text-xs font-mono tracking-wider uppercase cursor-pointer"
          >
            Restart Configuration
          </button>
        </div>
      </div>
    </motion.div>
  );
}
