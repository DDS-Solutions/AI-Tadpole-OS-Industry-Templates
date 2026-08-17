import { Layers, Shield, Check, Lock, CheckCircle2, ArrowLeft, ArrowRight, KeyRound, Info } from 'lucide-react';
import type { Agent, MCPConnector } from '../../types';
import { DANGEROUS_SKILLS } from '../../utils/catalogHelpers';

interface Step3BusinessConnectionsProps {
  agents: Agent[];
  mcpCatalog: MCPConnector[];
  selectedConnectors: string[];
  setSelectedConnectors: (connectors: string[]) => void;
  onBack: () => void;
  onNext: () => void;
}

export default function Step3_BusinessConnections({
  agents,
  mcpCatalog,
  selectedConnectors,
  setSelectedConnectors,
  onBack,
  onNext,
}: Step3BusinessConnectionsProps) {
  // Check if any agent has dangerous / mutating skills
  const hasMutatingSkills = agents.some(a => (a.skills || []).some(s => DANGEROUS_SKILLS.has(s)));
  const hasShellSkills = agents.some(a => (a.skills || []).includes('execute_shell') || (a.skills || []).includes('shell') || (a.skills || []).includes('terminal'));

  const toggleConnector = (id: string) => {
    if (selectedConnectors.includes(id)) {
      setSelectedConnectors(selectedConnectors.filter(c => c !== id));
    } else {
      setSelectedConnectors([...selectedConnectors, id]);
    }
  };

  return (
    <div className="w-full sovereign-panel p-8 space-y-8 animate-fadeIn">
      <div>
        <div className="flex items-center gap-2 text-cyber-green text-xs font-mono uppercase tracking-wider mb-1">
          <Layers className="w-4 h-4" />
          <span>Step 3 of 4: Tools & Approvals</span>
        </div>
        <h2 className="text-2xl font-bold text-white">Connect business tools & review governance</h2>
        <p className="text-sm text-zinc-400 mt-1">
          Connect verified tool connectors and review how AI-Tadpole-OS enforces human-in-the-loop safeguards for your team.
        </p>
      </div>

      {/* Section 1: Business Tools */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-base font-semibold text-white flex items-center gap-2">
            <span>Connect your business tools</span>
            <span className="text-xs font-mono px-2 py-0.5 rounded-full bg-zinc-800 text-zinc-400 font-normal">
              {selectedConnectors.length} connected
            </span>
          </h3>
          <span className="text-xs text-zinc-500 font-mono">AI-Tadpole-OS MCP Connectors</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {mcpCatalog.map((connector) => {
            const isSelected = selectedConnectors.includes(connector.id);
            const envCount = Object.keys(connector.required_env || {}).length;

            return (
              <button
                type="button"
                role="checkbox"
                aria-checked={isSelected}
                aria-label={`Toggle ${connector.name} connector`}
                key={connector.id}
                onClick={() => toggleConnector(connector.id)}
                className={`p-5 rounded-2xl border transition-all cursor-pointer flex flex-col justify-between space-y-4 text-left focus:outline-none focus:ring-2 focus:ring-cyber-green/50 ${
                  isSelected
                    ? 'bg-cyber-green/10 border-cyber-green text-white shadow-sm'
                    : 'bg-zinc-950/70 border-zinc-800/80 hover:border-zinc-700 text-zinc-300'
                }`}
              >
                <div className="space-y-2">
                  <div className="flex items-start justify-between gap-2">
                    <h4 className="text-sm font-bold text-white">
                      {connector.name}
                    </h4>
                    <div
                      className={`w-5 h-5 rounded-md flex items-center justify-center shrink-0 border transition-colors ${
                        isSelected
                          ? 'bg-cyber-green border-cyber-green text-zinc-950'
                          : 'border-zinc-700 bg-zinc-900'
                      }`}
                    >
                      {isSelected && <Check className="w-3.5 h-3.5 stroke-[3]" />}
                    </div>
                  </div>

                  <p className="text-xs text-zinc-400 leading-snug">
                    {connector.description}
                  </p>
                </div>

                <div className="pt-3 border-t border-zinc-800/60 flex items-center justify-between text-[11px] font-mono text-zinc-400">
                  <span className="inline-flex items-center gap-1">
                    <CheckCircle2 className="w-3 h-3 text-cyber-green" />
                    <span>{connector.status || 'reviewed'}</span>
                  </span>

                  {envCount > 0 && (
                    <span className="inline-flex items-center gap-1 text-zinc-400 bg-zinc-900 px-2 py-0.5 rounded border border-zinc-800">
                      <KeyRound className="w-3 h-3 text-zinc-500" />
                      <span>{envCount} env var{envCount > 1 ? 's' : ''}</span>
                    </span>
                  )}
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Section 2: Human Governance & Approval Policy (Read-Only Enforcement Explanation) */}
      <div className="space-y-4 pt-4 border-t border-zinc-800/80">
        <div>
          <h3 className="text-base font-semibold text-white flex items-center gap-2">
            <Shield className="w-4 h-4 text-cyber-green" />
            <span>How AI-Tadpole-OS Enforces Human Approval</span>
          </h3>
          <p className="text-xs text-zinc-400 mt-1 flex items-center gap-1.5">
            <Info className="w-3.5 h-3.5 text-zinc-500 shrink-0" />
            AI-Tadpole-OS enforces human-in-the-loop safety at the agent level (<code className="text-cyber-green font-mono text-[11px]">requires_oversight</code>).
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {[
            {
              id: 'policy-messages',
              label: 'Customer Communication & Updates',
              desc: 'Specialists generate message drafts; human operators review and approve before external sending.',
              badge: 'Draft Mode Only',
              badgeColor: 'text-zinc-300 bg-zinc-900 border-zinc-700',
              icon: Shield,
            },
            {
              id: 'policy-quotes',
              label: 'Quotes, Work Orders & Pricing',
              desc: 'Specialists prepare draft price sheets; human operators authorize final client pricing.',
              badge: 'Draft Mode Only',
              badgeColor: 'text-zinc-300 bg-zinc-900 border-zinc-700',
              icon: Shield,
            },
            {
              id: 'policy-dispatch',
              label: 'Technician Scheduling & Dispatch',
              desc: 'Specialists calculate optimal routes; human operators confirm job assignments.',
              badge: 'Draft Mode Only',
              badgeColor: 'text-zinc-300 bg-zinc-900 border-zinc-700',
              icon: Shield,
            },
            {
              id: 'policy-inventory',
              label: 'Purchase & Replenishment Calculations',
              desc: 'Specialists calculate stock thresholds; human operators approve vendor purchase orders.',
              badge: 'Draft Mode Only',
              badgeColor: 'text-zinc-300 bg-zinc-900 border-zinc-700',
              icon: Shield,
            },
            {
              id: 'policy-files',
              label: 'Workspace File Modifications (write_file)',
              desc: 'Agents with file mutation capabilities are locked to require explicit operator review by runtime policy.',
              badge: hasMutatingSkills ? 'Enforced by Security Policy' : 'No Mutating Agents',
              badgeColor: hasMutatingSkills ? 'text-amber-300 bg-amber-950/50 border-amber-800/50' : 'text-zinc-400 bg-zinc-900 border-zinc-800',
              icon: Lock,
            },
            {
              id: 'policy-commands',
              label: 'Command & Shell Execution (execute_shell)',
              desc: 'System execution tools require explicit human operator confirmation before running.',
              badge: hasShellSkills ? 'Enforced by Security Policy' : 'No Shell Agents',
              badgeColor: hasShellSkills ? 'text-amber-300 bg-amber-950/50 border-amber-800/50' : 'text-zinc-400 bg-zinc-900 border-zinc-800',
              icon: Lock,
            },
          ].map(rule => {
            const Icon = rule.icon;
            return (
              <div
                key={rule.id}
                className="p-4 rounded-xl border border-zinc-800/80 bg-zinc-950/60 space-y-2"
              >
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-1.5 font-semibold text-sm text-white">
                    <Icon className="w-3.5 h-3.5 text-cyber-green shrink-0" />
                    <span>{rule.label}</span>
                  </div>
                  <span className={`text-[10px] font-mono px-2 py-0.5 rounded-full border shrink-0 ${rule.badgeColor}`}>
                    {rule.badge}
                  </span>
                </div>
                <p className="text-xs text-zinc-400 leading-snug">{rule.desc}</p>
              </div>
            );
          })}
        </div>
      </div>

      {/* Navigation Footer */}
      <div className="pt-6 border-t border-zinc-800/80 flex items-center justify-between">
        <button
          type="button"
          onClick={onBack}
          className="px-5 py-2.5 rounded-xl bg-zinc-900 hover:bg-zinc-800 text-zinc-300 text-sm font-medium transition-colors flex items-center gap-2 cursor-pointer border border-zinc-800"
        >
          <ArrowLeft className="w-4 h-4" /> Back to Team
        </button>

        <button
          type="button"
          onClick={onNext}
          className="px-6 py-3 rounded-xl bg-cyber-green hover:bg-cyber-green-light text-zinc-950 font-semibold text-sm transition-all flex items-center gap-2 cursor-pointer shadow-md shadow-cyber-green/20"
        >
          Next: Review & Download <ArrowRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}
