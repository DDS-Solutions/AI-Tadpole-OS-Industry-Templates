import { useState } from 'react';
import { Sparkles, X, Search, BookOpen } from 'lucide-react';
import { motion } from 'framer-motion';
import type { CatalogAgent } from '../../types';
import { highlightText } from '../../utils';

interface DepartmentMeta {
  id: string;
  label: string;
  color: string;
  desc: string;
}

interface CatalogDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  catalog: CatalogAgent[];
  isCatalogLoading: boolean;
  onAddCatalogAgent: (agent: CatalogAgent) => void;
  departments: DepartmentMeta[];
}

export default function CatalogDrawer({
  isOpen,
  onClose,
  catalog,
  isCatalogLoading,
  onAddCatalogAgent,
  departments
}: CatalogDrawerProps) {
  const [catalogSearch, setCatalogSearch] = useState('');
  const [selectedCatalogDept, setSelectedCatalogDept] = useState('all');
  const [selectedCatalogAgentId, setSelectedCatalogAgentId] = useState<string | null>(null);

  if (!isOpen) return null;

  const filtered = catalog.filter(agent => {
    const matchesDept = selectedCatalogDept === 'all' || agent.department === selectedCatalogDept;
    const matchesSearch = !catalogSearch || 
      agent.name.toLowerCase().includes(catalogSearch.toLowerCase()) ||
      agent.description.toLowerCase().includes(catalogSearch.toLowerCase()) ||
      agent.vibe.toLowerCase().includes(catalogSearch.toLowerCase()) ||
      agent.departmentLabel.toLowerCase().includes(catalogSearch.toLowerCase()) ||
      agent.prompt.toLowerCase().includes(catalogSearch.toLowerCase());
    return matchesDept && matchesSearch;
  });

  const selectedAgent = catalog.find(c => c.id === selectedCatalogAgentId) || filtered[0];

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center p-0 bg-zinc-950/95 backdrop-blur-md"
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.98 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.98 }}
        transition={{ type: "tween", duration: 0.2 }}
        className="w-full h-full flex flex-col bg-zinc-950 border-none p-0 overflow-hidden"
      >
        {/* Header */}
        <div className="flex justify-between items-center px-6 py-4 border-b border-zinc-850" style={{ borderColor: 'color-mix(in srgb, var(--color-zinc-800) 40%, transparent)' }}>
          <div>
            <h3 className="text-lg font-bold text-white flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-cyber-green" /> Browse Agent Catalog
            </h3>
            <p className="text-xs text-zinc-500 mt-0.5">Select a pre-configured expert department persona to add to your Swarm Roster.</p>
          </div>
          <button
            onClick={onClose}
            data-tooltip="Exit Catalog Workspace"
            className="p-1.5 text-zinc-500 hover:text-white rounded hover:bg-zinc-800 transition-all cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Search Bar */}
        <div className="px-6 py-3 bg-zinc-950/40 border-b border-zinc-850 flex items-center gap-3" style={{ borderColor: 'color-mix(in srgb, var(--color-zinc-800) 30%, transparent)' }}>
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
            <input
              type="text"
              data-tooltip="Search targets agent name, vibe, description, and system prompt text"
              className="w-full bg-zinc-950 border border-zinc-800 rounded-lg py-2 pl-10 pr-4 text-xs focus:border-cyber-green outline-none text-zinc-300"
              placeholder="Search by role, capability, or department..."
              value={catalogSearch}
              onChange={e => setCatalogSearch(e.target.value)}
            />
            {catalogSearch && (
              <button 
                onClick={() => setCatalogSearch('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-white text-xs cursor-pointer"
              >
                Clear
              </button>
            )}
          </div>
        </div>

        {/* Body */}
        <div className="flex flex-1 overflow-hidden">
          {/* Left Panel: Departments */}
          <div className="w-64 border-r border-zinc-855 overflow-y-auto custom-scrollbar bg-zinc-950/20 p-4 space-y-1" style={{ borderColor: 'color-mix(in srgb, var(--color-zinc-800) 40%, transparent)' }}>
            <div className="mono-label text-[9px] mb-2 px-2 cursor-help" data-tooltip="Primary execution categories sorting our roster agent library.">Departments</div>
            {departments.map(dept => {
              const count = dept.id === 'all' 
                ? catalog.length 
                : catalog.filter(c => c.department === dept.id).length;
              
              const isSelected = selectedCatalogDept === dept.id;
              
              return (
                <button
                  key={dept.id}
                  onClick={() => {
                    setSelectedCatalogDept(dept.id);
                    setSelectedCatalogAgentId(null);
                  }}
                  data-tooltip={dept.desc}
                  className={`tooltip-right w-full text-left px-3 py-2 rounded-lg text-xs flex justify-between items-center transition-all cursor-pointer border ${
                    isSelected
                      ? 'bg-zinc-800 text-white border-zinc-700 font-bold'
                      : 'text-zinc-400 hover:bg-zinc-900/50 hover:text-zinc-200 border-transparent'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <span 
                      className="w-1.5 h-1.5 rounded-full" 
                      style={{ backgroundColor: dept.color }}
                    />
                    <span>{dept.label}</span>
                  </div>
                  <span className="text-[9px] font-mono text-zinc-500 bg-zinc-950 px-1.5 py-0.25 rounded border border-zinc-800">
                    {count}
                  </span>
                </button>
              );
            })}
          </div>

          {/* Middle Panel: Grid of filtered agents */}
          <div className="flex-1 overflow-y-auto custom-scrollbar green-scrollbar p-6 grid grid-cols-1 sm:grid-cols-2 gap-3 bg-zinc-950/10 content-start">
            {isCatalogLoading ? (
              <div className="col-span-full flex flex-col items-center justify-center py-20 text-zinc-500 font-mono text-xs">
                <div className="w-5 h-5 border-2 border-zinc-805 border-t-cyber-green rounded-full animate-spin mb-3" />
                Loading AI-Tadpole catalog...
              </div>
            ) : (
              <>
                {filtered.map(agent => {
                  const isSelected = selectedAgent?.id === agent.id;
                  return (
                    <div
                      key={agent.id}
                      onClick={() => setSelectedCatalogAgentId(agent.id)}
                      data-tooltip="Click to preview agent details and prompt"
                      className={`p-4 rounded-xl border sovereign-transition cursor-pointer flex flex-col justify-between text-left min-h-[110px] ${
                        isSelected
                          ? 'bg-zinc-800/80 border-cyber-green text-white shadow-md'
                          : 'bg-zinc-950/40 border-zinc-800/60 text-zinc-400 hover:border-zinc-700 hover:bg-zinc-900/10'
                      }`}
                      style={{
                        borderColor: isSelected ? agent.color : undefined
                      }}
                    >
                      <div>
                        <div className="flex justify-between items-start mb-1.5 gap-2">
                          <div className="flex items-center gap-1.5 min-w-0">
                            <span className="text-lg select-none">{agent.emoji || '🤖'}</span>
                            <h4 className="font-bold text-xs text-zinc-200 line-clamp-1">
                              {highlightText(agent.name, catalogSearch)}
                            </h4>
                          </div>
                          <span 
                            className="text-[8px] font-mono uppercase tracking-tighter px-1.5 py-0.25 rounded border shrink-0"
                            style={{ 
                              color: agent.color, 
                              borderColor: `color-mix(in srgb, ${agent.color} 30%, transparent)`,
                              backgroundColor: `color-mix(in srgb, ${agent.color} 5%, transparent)`
                            }}
                          >
                            {agent.departmentLabel}
                          </span>
                        </div>
                        <p className="text-[10px] text-zinc-500 line-clamp-2 leading-relaxed">
                          {highlightText(agent.description || agent.vibe, catalogSearch)}
                        </p>
                      </div>
                    </div>
                  );
                })}
                {filtered.length === 0 && (
                  <div className="col-span-full flex flex-col items-center justify-center py-20 text-zinc-600 font-mono text-xs">
                    No agents found matching "{catalogSearch}"
                  </div>
                )}
              </>
            )}
          </div>

          {/* Right Panel: Detailed Agent Preview */}
          <div className="w-96 border-l border-zinc-850 overflow-y-auto custom-scrollbar p-6 bg-zinc-950/30 flex flex-col justify-between" style={{ borderColor: 'color-mix(in srgb, var(--color-zinc-800) 40%, transparent)' }}>
            {selectedAgent ? (
              <div className="flex flex-col h-full justify-between gap-6">
                <div className="space-y-4">
                  <div className="flex items-center gap-3">
                    <span className="text-3xl p-2 bg-zinc-900 border border-zinc-800 rounded-xl select-none">{selectedAgent.emoji || '🤖'}</span>
                    <div>
                      <h4 className="font-bold text-sm text-white">{selectedAgent.name}</h4>
                      <span 
                        className="text-[9px] font-mono px-2 py-0.5 rounded border inline-block mt-1"
                        style={{
                          color: selectedAgent.color,
                          borderColor: `color-mix(in srgb, ${selectedAgent.color} 20%, transparent)`,
                          backgroundColor: `color-mix(in srgb, ${selectedAgent.color} 5%, transparent)`
                        }}
                      >
                        {selectedAgent.departmentLabel}
                      </span>
                    </div>
                  </div>

                  <div>
                    <span className="mono-label text-[9px] block text-zinc-500 mb-1">Vibe / Description</span>
                    <p className="text-xs text-zinc-400 leading-relaxed italic">
                      "{selectedAgent.vibe || selectedAgent.description}"
                    </p>
                  </div>

                  <div className="pt-3 border-t border-zinc-900/60 flex flex-col flex-1 min-h-0">
                    <div className="flex items-center gap-1.5 mb-2 text-zinc-550">
                      <BookOpen className="w-3.5 h-3.5" />
                      <span className="mono-label text-[9px]">Base System Instructions</span>
                    </div>
                    <div className="bg-zinc-950 border border-zinc-850 rounded-lg p-3 text-[10px] font-mono text-zinc-400 overflow-y-auto max-h-[220px] leading-normal whitespace-pre-wrap select-text custom-scrollbar">
                      {selectedAgent.prompt}
                    </div>
                  </div>
                </div>

                <button
                  onClick={() => onAddCatalogAgent(selectedAgent)}
                  data-tooltip={`Import ${selectedAgent.name} into your active swarm roster`}
                  className="w-full bg-cyber-green text-zinc-950 font-bold text-xs py-3 rounded-lg hover:scale-102 transition-all cursor-pointer flex items-center justify-center gap-2 shadow-[0_0_15px_rgba(34,197,94,0.15)]"
                  style={{
                    backgroundColor: selectedAgent.color,
                    color: '#09090b'
                  }}
                >
                  Add {selectedAgent.name} to Roster
                </button>
              </div>
            ) : (
              <div className="flex-1 flex flex-col items-center justify-center text-center text-zinc-600 font-mono text-xs">
                Select an agent to see detailed specifications.
              </div>
            )}
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
}
