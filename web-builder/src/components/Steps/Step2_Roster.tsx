import { Users, Search, Plus, Sliders, Trash2 } from 'lucide-react';
import { motion, useReducedMotion } from 'framer-motion';
import type { Agent } from '../../types';

interface Step2Props {
  agents: Agent[];
  onRemoveAgent: (id: string) => void;
  onEditAgent: (agent: Agent) => void;
  onOpenCatalog: () => void;
  onCreateCustomAgent: () => void;
  onPrevious: () => void;
  onNext: () => void;
}

export default function Step2_Roster({
  agents,
  onRemoveAgent,
  onEditAgent,
  onOpenCatalog,
  onCreateCustomAgent,
  onPrevious,
  onNext
}: Step2Props) {
  const reducedMotion = useReducedMotion();
  return (
    <motion.div
      key="step2"
      initial={reducedMotion ? false : { opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={reducedMotion ? undefined : { opacity: 0, x: -20 }}
      data-tooltip="Phase 2 Roster Board: Manage the team of AI agents, customize system instructions, and add specialists from the library."
      className="w-full sovereign-panel p-8"
    >
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8 gap-4">
        <div className="flex items-center gap-3 text-cyber-green">
          <Users className="w-5 h-5 shrink-0" />
          <div>
            <h2 className="font-bold text-lg text-white" data-tooltip="Configure custom or catalog-vetted AI agent profiles.">
              Phase 2: Agents
            </h2>
            <p className="text-xs font-mono text-zinc-500">Roster configuration & runtime instructions</p>
          </div>
        </div>
        <div className="flex flex-wrap gap-3 w-full sm:w-auto">
          <button
            onClick={onOpenCatalog}
            className="flex-1 sm:flex-initial bg-cyber-green/10 text-cyber-green hover:bg-cyber-green/20 px-4 py-2 rounded-lg border border-cyber-green/30 flex items-center justify-center gap-2 transition-all cursor-pointer focus-sovereign text-xs font-semibold"
          >
            <Search className="w-4 h-4" /> Browse Agent Catalog
          </button>
          <button
            onClick={onCreateCustomAgent}
            className="flex-1 sm:flex-initial bg-zinc-900 text-neural-pulse hover:bg-zinc-800 px-4 py-2 rounded-lg border border-zinc-800 flex items-center justify-center gap-2 transition-all cursor-pointer focus-sovereign text-xs font-semibold"
          >
            <Plus className="w-4 h-4" /> Add Custom Agent
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {agents.map(agent => (
          <div
            key={agent.id}
            className="bg-zinc-950/50 border rounded-xl p-5 relative group sovereign-transition flex flex-col justify-between min-h-[150px]"
            style={{
              borderColor: agent.color ? `color-mix(in srgb, ${agent.color} 30%, var(--color-zinc-800))` : 'var(--color-zinc-800)'
            }}
          >
            {/* Left accent bar */}
            <div
              className="absolute left-0 top-0 bottom-0 w-1 rounded-l-xl"
              style={{ backgroundColor: agent.color || 'var(--color-zinc-700)' }}
            />

            <div className="space-y-3 pl-2">
              <div className="flex justify-between items-start gap-2">
                <div className="flex items-center gap-2">
                  <span className="text-xl select-none">{agent.emoji || '🤖'}</span>
                  <div>
                    <div className="font-bold text-zinc-100 text-sm text-left flex items-center gap-1.5 flex-wrap">
                      <span>{agent.name}</span>
                      {agent.priority && agent.priority !== 'normal' && (
                        <span className="text-[9px] font-mono uppercase px-1.5 py-0.5 rounded bg-zinc-900 border border-zinc-800 text-zinc-300">
                          {agent.priority}
                        </span>
                      )}
                    </div>
                    {agent.isCustom ? (
                      <span className="text-[9px] font-mono text-zinc-500 uppercase tracking-tighter block text-left">Custom Agent</span>
                    ) : (
                      <span className="text-[9px] font-mono text-cyber-green/80 uppercase tracking-tighter block text-left">Catalog Agent</span>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-1 opacity-100 sm:opacity-0 sm:group-hover:opacity-100 group-focus-within:opacity-100 focus-within:opacity-100 transition-opacity shrink-0">
                  <button
                    type="button"
                    onClick={() => onEditAgent(agent)}
                    data-tooltip="Configure identity, DAG supervisor, model, capabilities, and prompt"
                    className="focus-sovereign tooltip-left min-h-11 min-w-11 sm:min-h-9 sm:min-w-9 flex items-center justify-center p-2 sm:p-1.5 text-zinc-400 hover:text-white rounded hover:bg-zinc-900 transition-colors cursor-pointer"
                    aria-label={`Configure ${agent.name}`}
                  >
                    <Sliders className="w-4 h-4 sm:w-3.5 sm:h-3.5" />
                  </button>
                  <button
                    type="button"
                    onClick={() => onRemoveAgent(agent.id)}
                    data-tooltip={`Remove ${agent.name} from roster`}
                    className="focus-sovereign tooltip-left min-h-11 min-w-11 sm:min-h-9 sm:min-w-9 flex items-center justify-center p-2 sm:p-1.5 text-zinc-400 hover:text-danger rounded hover:bg-zinc-900 transition-colors cursor-pointer"
                    aria-label={`Remove ${agent.name}`}
                  >
                    <Trash2 className="w-4 h-4 sm:w-3.5 sm:h-3.5" />
                  </button>
                </div>
              </div>

              <div className="text-left">
                <span className="mono-label text-[9px] block mb-0.5 cursor-help" data-tooltip="The specific focus area or cognitive slot assigned to this agent in the swarm.">Role / Expertise</span>
                <div className="text-xs text-neural-pulse font-medium line-clamp-1">{agent.role || 'Not specified'}</div>
              </div>

              {agent.description && (
                <div className="text-[10px] text-zinc-550 line-clamp-2 italic leading-relaxed text-left">"{agent.description}"</div>
              )}

              <div className="pt-2 border-t border-zinc-900 flex items-center justify-between text-[10px] font-mono text-zinc-500">
                <span className={agent.prompt.length > 800 ? 'text-red-400 font-bold' : 'text-zinc-400'}>
                  Prompt: {agent.prompt.length}/800
                </span>
                {agent.requiresOversight && (
                  <span className="text-amber-400/90 font-medium">Oversight Enforced</span>
                )}
              </div>
            </div>
          </div>
        ))}
        {agents.length === 0 && (
          <div className="col-span-full py-12 text-center text-zinc-650 font-mono text-xs border border-dashed border-zinc-850 rounded-xl">
            Roster is empty. Browse the catalog or add a custom agent to populate the Swarm team.
          </div>
        )}
      </div>

      <div className="mt-12 flex justify-between">
        <button type="button" onClick={onPrevious} className="focus-sovereign px-2 py-1 rounded text-zinc-500 hover:text-white transition-colors cursor-pointer">Previous</button>
        <button
          type="button"
          onClick={onNext}
          disabled={agents.length === 0}
          className="focus-sovereign bg-neural-pulse text-zinc-950 font-bold px-8 py-3 rounded-lg hover:bg-white disabled:opacity-50 transition-all cursor-pointer"
        >
          Next Playbooks
        </button>
      </div>
    </motion.div>
  );
}
