import { Layers, Shield, Check, CheckCircle2, ArrowLeft, ArrowRight, KeyRound, Info, Wrench } from 'lucide-react';
import type { Agent, MCPConnector } from '../../types';

interface Step3BusinessConnectionsProps {
  agents: Agent[];
  setAgents?: (agents: Agent[]) => void;
  mcpCatalog: MCPConnector[];
  selectedConnectors: string[];
  setSelectedConnectors: (connectors: string[]) => void;
  onBack: () => void;
  onNext: () => void;
}

export default function Step3_BusinessConnections({
  agents,
  setAgents,
  mcpCatalog,
  selectedConnectors,
  setSelectedConnectors,
  onBack,
  onNext,
}: Step3BusinessConnectionsProps) {
  const toggleConnector = (connectorId: string) => {
    const isCurrentlySelected = selectedConnectors.includes(connectorId);
    const targetConnector = mcpCatalog.find(c => c.id === connectorId);

    if (isCurrentlySelected) {
      // Deselect connector and clean up its tool grants from all agents
      const nextSelected = selectedConnectors.filter(c => c !== connectorId);
      setSelectedConnectors(nextSelected);

      if (setAgents && targetConnector) {
        const connectorToolIds = new Set((targetConnector.tools || []).map(t => t.id));
        const updatedAgents = agents.map(agent => {
          const filteredMcpTools = (agent.mcpTools || []).filter(toolId => !connectorToolIds.has(toolId));
          return {
            ...agent,
            mcpTools: filteredMcpTools,
          };
        });
        setAgents(updatedAgents);
      }
    } else {
      // Select connector and assign read-only tools to agents
      const nextSelected = [...selectedConnectors, connectorId];
      setSelectedConnectors(nextSelected);

      if (setAgents && targetConnector) {
        const readTools = (targetConnector.tools || []).filter(t => t.risk === 'read');
        const readToolIds = readTools.map(t => t.id);

        if (readToolIds.length > 0) {
          const updatedAgents = agents.map(agent => {
            const currentTools = new Set(agent.mcpTools || []);
            for (const toolId of readToolIds) {
              currentTools.add(toolId);
            }
            return {
              ...agent,
              mcpTools: Array.from(currentTools),
            };
          });
          setAgents(updatedAgents);
        }
      }
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

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-4">
          {mcpCatalog.map((connector) => {
            const isSelected = selectedConnectors.includes(connector.id);
            const envCount = Object.keys(connector.required_env || {}).length;
            const tools = connector.tools || [];

            return (
              <div
                key={connector.id}
                className={`p-5 rounded-2xl border transition-all flex flex-col justify-between space-y-4 text-left ${
                  isSelected
                    ? 'bg-cyber-green/10 border-cyber-green text-white shadow-sm'
                    : 'bg-zinc-950/70 border-zinc-800/80 hover:border-zinc-700 text-zinc-300'
                }`}
              >
                <div className="space-y-3">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <h4 className="text-sm font-bold text-white">
                        {connector.name}
                      </h4>
                      <span className="text-[10px] font-mono text-zinc-500 uppercase tracking-wider">
                        {connector.category} • v{connector.version}
                      </span>
                    </div>
                    <button
                      type="button"
                      role="checkbox"
                      aria-checked={isSelected}
                      aria-label={`Toggle ${connector.name} connector`}
                      onClick={() => toggleConnector(connector.id)}
                      className={`w-6 h-6 rounded-md flex items-center justify-center shrink-0 border transition-colors cursor-pointer ${
                        isSelected
                          ? 'bg-cyber-green border-cyber-green text-zinc-950'
                          : 'border-zinc-700 bg-zinc-900 hover:border-zinc-500'
                      }`}
                    >
                      {isSelected && <Check className="w-4 h-4 stroke-[3]" />}
                    </button>
                  </div>

                  <p className="text-xs text-zinc-400 leading-snug">
                    {connector.description}
                  </p>

                  {/* Tools List */}
                  {tools.length > 0 && (
                    <div className="space-y-1.5 pt-2 border-t border-zinc-850">
                      <span className="text-[10px] font-mono uppercase text-zinc-500 block">Available Tools:</span>
                      <div className="flex flex-wrap gap-1.5">
                        {tools.map(tool => (
                          <span
                            key={tool.id}
                            className={`text-[10px] font-mono px-2 py-0.5 rounded border flex items-center gap-1 ${
                              tool.risk === 'write' || tool.risk === 'execute'
                                ? 'bg-amber-950/40 border-amber-800/60 text-amber-300'
                                : 'bg-zinc-900 border-zinc-800 text-zinc-300'
                            }`}
                          >
                            <Wrench className="w-2.5 h-2.5" />
                            <span>{tool.name}</span>
                            <span className="text-[9px] opacity-70">({tool.risk})</span>
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
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
              </div>
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
              badge: 'Requires Sign-off',
              badgeColor: 'text-zinc-300 bg-zinc-900 border-zinc-700',
              icon: Shield,
            },
          ].map(policy => (
            <div
              key={policy.id}
              className="p-4 rounded-xl border border-zinc-800/80 bg-zinc-950/60 flex items-start gap-3"
            >
              <div className="p-2 rounded-lg bg-zinc-900 border border-zinc-800 text-cyber-green shrink-0 mt-0.5">
                <policy.icon className="w-4 h-4" />
              </div>
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <h4 className="text-xs font-bold text-zinc-200">{policy.label}</h4>
                  <span className={`text-[10px] font-mono px-1.5 py-0.5 rounded border ${policy.badgeColor}`}>
                    {policy.badge}
                  </span>
                </div>
                <p className="text-[11px] text-zinc-400 leading-relaxed">{policy.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Navigation Footer */}
      <div className="flex justify-between items-center pt-4 border-t border-zinc-850">
        <button
          type="button"
          onClick={onBack}
          className="flex items-center gap-2 px-5 py-2.5 rounded-xl border border-zinc-800 text-xs font-semibold text-zinc-400 hover:text-white hover:bg-zinc-900 transition-colors cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Team</span>
        </button>

        <button
          type="button"
          onClick={onNext}
          className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-cyber-green text-zinc-950 text-xs font-bold hover:bg-white hover:shadow-lg hover:shadow-cyber-green/20 transition-all cursor-pointer"
        >
          <span>Next: Review & Download</span>
          <ArrowRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}
