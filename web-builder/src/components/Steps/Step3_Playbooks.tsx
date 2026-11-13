import { Workflow, Plus, Trash2 } from 'lucide-react';
import { motion } from 'framer-motion';
import type { WorkflowItem } from '../../types';

interface CompanyInfo {
  industry: string;
}

interface Step3Props {
  workflows: WorkflowItem[];
  setWorkflows: (workflows: WorkflowItem[]) => void;
  companyInfo: CompanyInfo;
  onAddWorkflow: () => void;
  onRemoveWorkflow: (id: string) => void;
  onPrevious: () => void;
  onNext: () => void;
}

export default function Step3_Playbooks({
  workflows,
  setWorkflows,
  companyInfo,
  onAddWorkflow,
  onRemoveWorkflow,
  onPrevious,
  onNext
}: Step3Props) {
  const updateWorkflow = (id: string, updates: Partial<WorkflowItem>) => {
    setWorkflows(workflows.map(w => w.id === id ? { ...w, ...updates } : w));
  };
  return (
    <motion.div
      key="step3"
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      data-tooltip="Phase 3 Playbooks Setup: Define task execution procedures and ingest institutional knowledge structures."
      className="w-full sovereign-panel p-8"
    >
      <div className="flex justify-between items-center mb-8">
        <div className="flex items-center gap-3 text-cyber-green">
          <Workflow className="w-5 h-5 shrink-0" />
          <div>
            <h2 className="font-bold text-lg text-white" data-tooltip="Set standard operating procedures and connect private Confluence/wiki documents.">
              Phase 3: Workflows
            </h2>
            <p className="text-xs font-mono text-zinc-500">Playbook directives & knowledge ingestion</p>
          </div>
        </div>
        <button
          onClick={onAddWorkflow}
          className="bg-cyber-green/10 text-cyber-green hover:bg-cyber-green/20 px-4 py-2 rounded-lg border border-cyber-green/30 flex items-center gap-2 transition-all cursor-pointer text-xs font-semibold"
        >
          <Plus className="w-4 h-4" /> Add Workflow
        </button>
      </div>

      <div className="space-y-4">
        {workflows.map(workflow => (
          <div key={workflow.id} data-tooltip="Playbook SOP Card: Configures task guidelines or institutional knowledge mappings." className="bg-zinc-950/50 border border-zinc-800 p-6 rounded-xl relative group">
            <button
              onClick={() => onRemoveWorkflow(workflow.id)}
              aria-label={`Remove ${workflow.name || 'workflow'}`}
              className="absolute top-6 right-6 text-zinc-500 hover:text-rose-500 transition-all opacity-0 group-hover:opacity-100 focus-visible:opacity-100 group-focus-within:opacity-100 cursor-pointer"
            >
              <Trash2 className="w-5 h-5" />
            </button>
            <div className="space-y-4">
              <div>
                <label htmlFor={`workflow-name-${workflow.id}`} className="sr-only">Workflow title</label>
                <input
                  id={`workflow-name-${workflow.id}`}
                  name={`workflow-name-${workflow.id}`}
                  className="bg-transparent border-b border-zinc-850 mb-2 w-full font-bold focus:border-cyber-green outline-none pb-1 text-zinc-100 text-sm"
                  value={workflow.name}
                  onChange={e => updateWorkflow(workflow.id, { name: e.target.value })}
                />
              </div>
              <div>
                <label htmlFor={`workflow-desc-${workflow.id}`} className="sr-only">Workflow procedure steps</label>
                <textarea
                  id={`workflow-desc-${workflow.id}`}
                  name={`workflow-desc-${workflow.id}`}
                  className="bg-transparent text-sm w-full outline-none text-zinc-400 min-h-[80px] leading-relaxed"
                  placeholder="Describe the workflow SOP..."
                  value={workflow.description}
                  onChange={e => updateWorkflow(workflow.id, { description: e.target.value })}
                />
              </div>

              {/* OKF/IKS Integration Panel */}
              <div className="pt-4 border-t border-zinc-900 mt-4 space-y-4" style={{ borderColor: 'color-mix(in srgb, var(--color-zinc-800) 40%, transparent)' }}>
                <label htmlFor={`workflow-okf-${workflow.id}`} className="flex items-center gap-2 text-xs text-zinc-500 cursor-pointer font-mono select-none">
                  <input
                    id={`workflow-okf-${workflow.id}`}
                    name={`workflow-okf-${workflow.id}`}
                    type="checkbox"
                    checked={!!workflow.isOkfPlaybook}
                    onChange={e => {
                      const isOkf = e.target.checked;
                      updateWorkflow(workflow.id, {
                        isOkfPlaybook: isOkf,
                        ...(isOkf ? {
                          topic: workflow.topic || companyInfo.industry.toLowerCase() || 'general',
                          conceptType: workflow.conceptType || 'playbook',
                          tags: workflow.tags || companyInfo.industry.toLowerCase() || 'general',
                        } : {}),
                      });
                    }}
                    className="rounded border-zinc-800 bg-zinc-950 text-cyber-green focus:ring-0 focus:ring-offset-0 cursor-pointer w-4 h-4"
                  />
                  <span data-tooltip="Ingest this markdown procedure directly into your agents' vector memory database upon loading.">Index into Institutional Knowledge Store (OKF/IKS)</span>
                </label>

                {workflow.isOkfPlaybook && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pl-6 border-l border-zinc-800">
                    <div>
                      <label htmlFor={`workflow-uri-${workflow.id}`} className="block text-[10px] font-mono text-zinc-500 uppercase mb-1 cursor-help" data-tooltip="Link to external raw source material, Confluence wiki pages, or Google Docs.">External SOP / Confluence URL</label>
                      <input
                        id={`workflow-uri-${workflow.id}`}
                        name={`workflow-uri-${workflow.id}`}
                        className="w-full bg-zinc-950 border border-zinc-800 rounded p-2 text-xs focus:border-cyber-green outline-none text-zinc-300"
                        placeholder="https://confluence.company.com/pages/..."
                        value={workflow.resourceUri || ''}
                        onChange={e => updateWorkflow(workflow.id, { resourceUri: e.target.value })}
                      />
                    </div>
                    <div>
                      <label htmlFor={`workflow-topic-${workflow.id}`} className="block text-[10px] font-mono text-zinc-500 uppercase mb-1 cursor-help" data-tooltip="Primary focus category (e.g. legal, compliance, operations) for sorting.">Topic</label>
                      <input
                        id={`workflow-topic-${workflow.id}`}
                        name={`workflow-topic-${workflow.id}`}
                        className="w-full bg-zinc-950 border border-zinc-800 rounded p-2 text-xs focus:border-cyber-green outline-none text-zinc-300"
                        placeholder="e.g. marketing, compliance"
                        value={workflow.topic || ''}
                        onChange={e => updateWorkflow(workflow.id, { topic: e.target.value })}
                      />
                    </div>
                    <div>
                      <label htmlFor={`workflow-concept-${workflow.id}`} className="block text-[10px] font-mono text-zinc-500 uppercase mb-1 cursor-help" data-tooltip="Structural classification category (e.g. playbook, guideline, policy).">Concept Type</label>
                      <input
                        id={`workflow-concept-${workflow.id}`}
                        name={`workflow-concept-${workflow.id}`}
                        className="w-full bg-zinc-950 border border-zinc-800 rounded p-2 text-xs focus:border-cyber-green outline-none text-zinc-300"
                        placeholder="e.g. playbook, guideline"
                        value={workflow.conceptType || ''}
                        onChange={e => updateWorkflow(workflow.id, { conceptType: e.target.value })}
                      />
                    </div>
                    <div>
                      <label htmlFor={`workflow-tags-${workflow.id}`} className="block text-[10px] font-mono text-zinc-500 uppercase mb-1 cursor-help" data-tooltip="Keywords matching agent filters to trigger memory retrieval.">Tags (comma-separated)</label>
                      <input
                        id={`workflow-tags-${workflow.id}`}
                        name={`workflow-tags-${workflow.id}`}
                        className="w-full bg-zinc-950 border border-zinc-800 rounded p-2 text-xs focus:border-cyber-green outline-none text-zinc-300"
                        placeholder="e.g. seo, advertising"
                        value={workflow.tags || ''}
                        onChange={e => updateWorkflow(workflow.id, { tags: e.target.value })}
                      />
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        ))}
        {workflows.length === 0 && (
          <div className="py-12 text-center text-zinc-500 font-mono text-xs border border-dashed border-zinc-850 rounded-xl">
            No workflows defined. Click the button to add a standard operating procedure for this swarm.
          </div>
        )}
      </div>

      <div className="mt-12 flex justify-between">
        <button onClick={onPrevious} className="text-zinc-500 hover:text-white transition-colors cursor-pointer">Previous</button>
        <button
          onClick={onNext}
          className="bg-neural-pulse text-zinc-950 font-bold px-8 py-3 rounded-lg hover:bg-white transition-all cursor-pointer"
        >
          Next Data Connectors
        </button>
      </div>
    </motion.div>
  );
}
