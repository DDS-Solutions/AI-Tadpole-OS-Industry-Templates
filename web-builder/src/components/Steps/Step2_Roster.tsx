import { Users, Search, Plus, Sliders, Trash2 } from 'lucide-react';
import { motion } from 'framer-motion';
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
  return (
    <motion.div 
      key="step2"
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      data-tooltip="Phase 2 Roster Board: Manage the team of AI agents, customize system instructions, and add specialists from the library."
      className="w-full sovereign-panel p-8"
    >
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8 gap-4">
        <div className="flex items-center gap-2 text-cyber-green">
          <Users className="w-5 h-5" />
          <h2 className="font-bold text-lg" data-tooltip="Configure custom or catalog-vetted AI agent profiles.">Phase 2: The Roster</h2>
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
            data-tooltip="Agent Roster Card: Click the sliders icon to customize identity, emoji, color, and system instructions."
            className="bg-zinc-950/50 border rounded-xl p-5 relative group sovereign-transition flex flex-col justify-between min-h-[150px] overflow-hidden"
            style={{ 
              borderColor: agent.color ? `color-mix(in srgb, ${agent.color} 30%, var(--color-zinc-800))` : 'var(--color-zinc-800)'
            }}
          >
            {/* Left accent bar */}
            <div 
              className="absolute left-0 top-0 bottom-0 w-1"
              style={{ backgroundColor: agent.color || 'var(--color-zinc-700)' }}
            />
            
            <div className="space-y-3 pl-2">
              <div className="flex justify-between items-start gap-2">
                <div className="flex items-center gap-2">
                  <span className="text-xl select-none">{agent.emoji || '🤖'}</span>
                  <div>
                    <div className="font-bold text-zinc-100 text-sm text-left">{agent.name}</div>
                    {agent.isCustom ? (
                      <span className="text-[9px] font-mono text-zinc-500 uppercase tracking-tighter block text-left">Custom Agent</span>
                    ) : (
                      <span className="text-[9px] font-mono text-cyber-green/80 uppercase tracking-tighter block text-left">Catalog Agent</span>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button 
                    onClick={() => onEditAgent(agent)}
                    className="p-1.5 text-zinc-400 hover:text-white rounded hover:bg-zinc-900 transition-colors cursor-pointer"
                    title="Configure Agent Details"
                  >
                    <Sliders className="w-3.5 h-3.5" />
                  </button>
                  <button 
                    onClick={() => onRemoveAgent(agent.id)}
                    className="p-1.5 text-zinc-400 hover:text-rose-450 rounded hover:bg-zinc-900 transition-colors cursor-pointer"
                    title="Remove Agent"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
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
        <button onClick={onPrevious} className="text-zinc-500 hover:text-white transition-colors cursor-pointer">Previous</button>
        <button 
          onClick={onNext}
          disabled={agents.length === 0}
          className="bg-neural-pulse text-zinc-950 font-bold px-8 py-3 rounded-lg hover:bg-white disabled:opacity-50 transition-all cursor-pointer"
        >
          Next Playbooks
        </button>
      </div>
    </motion.div>
  );
}
