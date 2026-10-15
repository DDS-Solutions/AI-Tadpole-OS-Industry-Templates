import { useEffect, useId, useRef, useState } from 'react';
import { ArrowLeft, Sparkles, X, Search, BookOpen, ArrowUpRight } from 'lucide-react';
import { motion, useReducedMotion } from 'framer-motion';
import type { CatalogAgent } from '../../types';
import { highlightText } from '../../utils';
import { useDialog } from './useDialog';

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
  departments,
}: CatalogDrawerProps) {
  const dialogRef = useDialog(onClose, isOpen);
  const fieldId = useId();
  const reducedMotion = useReducedMotion();
  const previewHeadingRef = useRef<HTMLHeadingElement>(null);
  const [catalogSearch, setCatalogSearch] = useState('');
  const [selectedCatalogDept, setSelectedCatalogDept] = useState('all');
  const [selectedCatalogAgentId, setSelectedCatalogAgentId] = useState<string | null>(null);
  const [isMobilePreviewOpen, setIsMobilePreviewOpen] = useState(false);

  const search = catalogSearch.trim().toLowerCase();
  const filtered = catalog.filter(agent => {
    const matchesDept = selectedCatalogDept === 'all' || agent.department === selectedCatalogDept;
    const matchesSearch = !search || [agent.name, agent.description, agent.vibe, agent.departmentLabel, agent.prompt]
      .some(value => value.toLowerCase().includes(search));
    return matchesDept && matchesSearch;
  });
  // The preview and add action must always belong to the current result set.
  const selectedAgent = filtered.find(agent => agent.id === selectedCatalogAgentId) ?? filtered[0];

  useEffect(() => {
    if (isOpen && isMobilePreviewOpen && window.matchMedia('(max-width: 1023px)').matches) {
      previewHeadingRef.current?.focus({ preventScroll: true });
    }
  }, [isOpen, isMobilePreviewOpen, selectedCatalogAgentId]);

  const returnToResults = () => {
    setIsMobilePreviewOpen(false);
    requestAnimationFrame(() => {
      document.getElementById(`${fieldId}-agent-${selectedAgent?.id}`)?.focus({ preventScroll: true });
    });
  };

  if (!isOpen) return null;

  return (
    <motion.div
      initial={reducedMotion ? false : { opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={reducedMotion ? undefined : { opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center p-0 md:p-5 bg-zinc-950/95 backdrop-blur-md"
    >
      <motion.div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={`${fieldId}-title`}
        aria-describedby={`${fieldId}-description`}
        tabIndex={-1}
        initial={reducedMotion ? false : { opacity: 0, scale: 0.98 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={reducedMotion ? undefined : { opacity: 0, scale: 0.98 }}
        transition={{ type: 'tween', duration: 0.2 }}
        className="sovereign-panel w-full h-full min-h-0 max-w-[1600px] flex flex-col bg-zinc-950 rounded-none md:rounded-2xl p-0 overflow-hidden"
      >
        <div className="flex shrink-0 justify-between items-start gap-3 px-4 sm:px-6 py-4 border-b border-zinc-800">
          <div>
            <div className="mono-label text-[9px] text-cyber-green mb-1">Expert library</div>
            <h3 id={`${fieldId}-title`} className="text-lg font-bold text-zinc-100 flex items-center gap-2">
              <Sparkles className="w-5 h-5 shrink-0 text-cyber-green" /> Browse agent catalog
            </h3>
            <p id={`${fieldId}-description`} className="text-xs text-zinc-400 mt-1 leading-relaxed">
              Find a specialist, review their instructions, and add them to your roster.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close agent catalog"
            className="focus-sovereign shrink-0 min-h-11 min-w-11 flex items-center justify-center text-zinc-400 hover:text-white rounded-lg hover:bg-zinc-800 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="shrink-0 px-4 sm:px-6 py-3 border-b border-zinc-800">
          <label htmlFor={`${fieldId}-search`} className="sr-only">Search the agent catalog</label>
          <div className="relative">
            <Search aria-hidden="true" className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
            <input
              id={`${fieldId}-search`}
              data-dialog-initial-focus
              type="search"
              className="focus-sovereign w-full bg-zinc-900 border border-zinc-800 rounded-lg min-h-11 py-2 pl-10 pr-16 text-base sm:text-xs focus:border-cyber-green outline-none text-zinc-200"
              placeholder="Search roles, capabilities, departments…"
              value={catalogSearch}
              onChange={event => { setCatalogSearch(event.target.value); setIsMobilePreviewOpen(false); }}
            />
            {catalogSearch && (
              <button
                type="button"
                onClick={() => { setCatalogSearch(''); setIsMobilePreviewOpen(false); }}
                className="focus-sovereign absolute right-2 top-1/2 -translate-y-1/2 min-h-9 px-2 text-zinc-400 hover:text-white text-xs rounded cursor-pointer"
              >
                Clear
              </button>
            )}
          </div>
          <p role="status" className="text-[10px] font-mono text-zinc-400 mt-2">
            {isCatalogLoading ? 'Loading specialists…' : `${filtered.length} ${filtered.length === 1 ? 'specialist' : 'specialists'} available`}
          </p>
        </div>

        <div className="flex flex-col lg:flex-row flex-1 min-h-0 overflow-hidden">
          <nav aria-label="Filter agents by department" className="shrink-0 w-full lg:w-48 lg:border-r border-b lg:border-b-0 border-zinc-800 overflow-x-auto lg:overflow-y-auto custom-scrollbar bg-zinc-900/20 p-3 flex lg:block gap-2 lg:space-y-1">
            <div className="hidden lg:block mono-label text-[9px] mb-3 px-2 text-zinc-400">Departments</div>
            {departments.map(dept => {
              const count = dept.id === 'all' ? catalog.length : catalog.filter(agent => agent.department === dept.id).length;
              const isSelected = selectedCatalogDept === dept.id;

              return (
                <button
                  type="button"
                  key={dept.id}
                  onClick={() => { setSelectedCatalogDept(dept.id); setSelectedCatalogAgentId(null); setIsMobilePreviewOpen(false); }}
                  aria-pressed={isSelected}
                  title={dept.desc}
                  className={`focus-sovereign shrink-0 lg:w-full text-left px-3 min-h-11 rounded-lg text-xs flex justify-between items-center gap-3 whitespace-nowrap transition-colors cursor-pointer border ${isSelected ? 'bg-zinc-800 text-zinc-100 border-zinc-700 font-semibold' : 'text-zinc-400 hover:bg-zinc-900 hover:text-zinc-200 border-transparent'}`}
                >
                  <span className="flex items-center gap-2">
                    <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: dept.color }} />
                    {dept.label}
                  </span>
                  <span className="text-[9px] font-mono text-zinc-400">{count}</span>
                </button>
              );
            })}
          </nav>

          <div aria-label="Agent search results" aria-busy={isCatalogLoading} className={`${isMobilePreviewOpen ? 'hidden lg:grid' : 'grid'} flex-1 min-w-0 min-h-0 overflow-y-auto custom-scrollbar green-scrollbar p-4 sm:p-5 grid-cols-1 sm:grid-cols-2 lg:grid-cols-1 xl:grid-cols-2 gap-3 content-start`}>
            {isCatalogLoading ? (
              <div className="col-span-full flex flex-col items-center justify-center py-20 text-zinc-400 font-mono text-xs">
                <div aria-hidden="true" className="w-5 h-5 border-2 border-zinc-800 border-t-cyber-green rounded-full motion-safe:animate-spin mb-3" />
                Loading agent catalog…
              </div>
            ) : filtered.length ? filtered.map(agent => {
              const isSelected = selectedAgent?.id === agent.id;

              return (
                <button
                  type="button"
                  id={`${fieldId}-agent-${agent.id}`}
                  key={agent.id}
                  onClick={() => { setSelectedCatalogAgentId(agent.id); setIsMobilePreviewOpen(true); }}
                  aria-pressed={isSelected}
                  aria-label={`Preview ${agent.name}`}
                  className={`focus-sovereign w-full p-4 rounded-xl border sovereign-transition cursor-pointer flex flex-col text-left min-h-[128px] ${isSelected ? 'bg-zinc-800/60 border-cyber-green text-zinc-100' : 'bg-zinc-900/40 border-zinc-800 text-zinc-400 hover:border-zinc-700 hover:bg-zinc-900'}`}
                >
                  <span className="flex justify-between items-start gap-3 w-full mb-2">
                    <span className="flex items-center gap-2 min-w-0">
                      <span aria-hidden="true" className="text-xl shrink-0">{agent.emoji || '🤖'}</span>
                      <span className="font-semibold text-sm text-zinc-200 line-clamp-2">{highlightText(agent.name, catalogSearch.trim())}</span>
                    </span>
                    <ArrowUpRight aria-hidden="true" className={`w-4 h-4 shrink-0 ${isSelected ? 'text-cyber-green' : 'text-zinc-500'}`} />
                  </span>
                  <span className="text-[9px] font-mono text-zinc-400 mb-2">{agent.departmentLabel}</span>
                  <span className="text-xs text-zinc-400 line-clamp-2 leading-relaxed">{highlightText(agent.description || agent.vibe, catalogSearch.trim())}</span>
                </button>
              );
            }) : (
              <div className="col-span-full flex flex-col items-center justify-center text-center py-16 px-4">
                <Search aria-hidden="true" className="w-6 h-6 text-zinc-500 mb-3" />
                <p className="text-sm font-medium text-zinc-200">No matching specialists</p>
                <p className="text-xs text-zinc-400 leading-relaxed mt-2 max-w-xs">Try a broader role or clear your filters to explore the full catalog.</p>
                <button type="button" onClick={() => { setCatalogSearch(''); setSelectedCatalogDept('all'); }} className="focus-sovereign mt-4 px-4 min-h-11 text-xs font-semibold text-cyber-green border border-zinc-700 rounded-lg cursor-pointer hover:bg-zinc-900">Clear filters</button>
              </div>
            )}
          </div>

          <div className={`${isMobilePreviewOpen ? 'flex' : 'hidden lg:flex'} flex-1 lg:flex-none min-h-0 w-full lg:w-80 xl:w-96 border-zinc-800 lg:border-l overflow-hidden p-4 sm:p-6 bg-zinc-900/30 flex-col`}>
            {selectedAgent && !isCatalogLoading ? (
              <div className="flex flex-col h-full min-h-0 gap-4">
                <button type="button" onClick={returnToResults} className="focus-sovereign lg:hidden shrink-0 flex items-center gap-2 min-h-11 text-xs text-zinc-300 hover:text-white self-start rounded-lg px-2 cursor-pointer">
                  <ArrowLeft aria-hidden="true" className="w-4 h-4" /> Back to specialists
                </button>
                <div className="space-y-5 flex-1 min-h-0 overflow-y-auto custom-scrollbar pr-1">
                  <div className="flex items-start gap-3">
                    <span aria-hidden="true" className="text-3xl select-none">{selectedAgent.emoji || '🤖'}</span>
                    <div className="min-w-0">
                      <h4 ref={previewHeadingRef} tabIndex={-1} className="focus-sovereign font-semibold text-base text-zinc-100 rounded">{selectedAgent.name}</h4>
                      <span className="text-[10px] text-zinc-400 font-mono inline-block mt-1">{selectedAgent.departmentLabel}</span>
                    </div>
                  </div>
                  <div>
                    <span className="mono-label text-[9px] block text-zinc-400 mb-2">Specialist profile</span>
                    <p className="text-sm text-zinc-300 leading-relaxed">{selectedAgent.vibe || selectedAgent.description}</p>
                  </div>
                  <div className="pt-4 border-t border-zinc-800">
                    <div className="flex items-center gap-2 mb-3 text-zinc-400">
                      <BookOpen aria-hidden="true" className="w-3.5 h-3.5" />
                      <span className="mono-label text-[9px]">System instructions</span>
                    </div>
                    <div className="text-xs font-mono text-zinc-400 leading-relaxed whitespace-pre-wrap break-words select-text">{selectedAgent.prompt}</div>
                  </div>
                </div>
                <button type="button" onClick={() => onAddCatalogAgent(selectedAgent)} className="focus-sovereign shrink-0 w-full bg-cyber-green text-zinc-950 font-semibold text-sm min-h-12 px-4 py-3 rounded-lg hover:bg-green-400 transition-colors cursor-pointer">
                  Add {selectedAgent.name} to roster
                </button>
              </div>
            ) : (
              <div className="flex-1 flex items-center justify-center text-center text-zinc-400 text-xs leading-relaxed p-4">Choose a specialist to review their instructions.</div>
            )}
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
}
