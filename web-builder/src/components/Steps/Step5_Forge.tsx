import { Cpu, Shield, Download } from 'lucide-react';
import { motion } from 'framer-motion';
import type { Agent, WorkflowItem } from '../../types';
import { scanShieldCapabilities } from '../../utils';

interface CompanyInfo {
  name: string;
}

interface Step5Props {
  companyInfo: CompanyInfo;
  agents: Agent[];
  workflows: WorkflowItem[];
  onExport: () => void;
  onPrevious: () => void;
  onReset: () => void;
}

export default function Step5_Forge({
  companyInfo,
  agents,
  workflows,
  onExport,
  onPrevious,
  onReset
}: Step5Props) {
  return (
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
      <p className="text-zinc-500 max-w-md mx-auto mb-12 text-sm leading-relaxed">
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
          <div data-tooltip="Sovereign Shield Telemetry: Automatically scans prompt definitions to assess capability requests and approval boundaries." className="max-w-md mx-auto mb-12 bg-zinc-950/80 border rounded-xl overflow-hidden text-left sovereign-transition font-mono text-xs" style={{ borderColor: isSecure ? '#10B981' : '#F59E0B' }}>
            <div className={`p-4 flex items-center gap-3 border-b ${isSecure ? 'bg-emerald-950/20 border-emerald-900/40' : 'bg-amber-950/20 border-amber-900/40'}`} style={{ borderColor: isSecure ? 'color-mix(in srgb, #10B981 30%, transparent)' : 'color-mix(in srgb, #F59E0B 30%, transparent)' }}>
              <Shield className={`w-5 h-5 ${isSecure ? 'text-emerald-500' : 'text-amber-500'}`} />
              <div>
                <h4 className="font-bold text-xs text-white uppercase tracking-wider cursor-help" data-tooltip="Zero-Trust static analysis scanner checking for raw execution permissions.">Sapphire Shield Security Audit</h4>
                <p className="text-[10px] text-zinc-550 font-mono mt-0.5 font-normal">
                  {isSecure ? 'Sovereign Telemetry Level: Zero Privileges' : 'Active Warning: Approval Required'}
                </p>
              </div>
            </div>
            <div className="p-4 space-y-3 font-mono text-xs leading-normal">
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
          onClick={onExport}
          className="bg-cyber-green text-zinc-950 font-black px-12 py-4 rounded-xl hover:scale-105 transition-all flex items-center gap-3 cursor-pointer shadow-[0_0_20px_rgba(34,197,94,0.3)] text-sm uppercase font-mono tracking-wider"
        >
          <Download className="w-6 h-6" /> Export Swarm Archive
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
