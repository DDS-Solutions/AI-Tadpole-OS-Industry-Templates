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
        <div className="flex items-center gap-2 text-cyber-green">
          <Workflow className="w-5 h-5" />
          <h2 className="font-bold text-lg" data-tooltip="Set standard operating procedures and connect private Confluence/wiki documents.">Phase 3: The Playbook</h2>
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
              className="absolute top-6 right-6 text-zinc-650 hover:text-rose-500 transition-colors opacity-0 group-hover:opacity-100 cursor-pointer"
            >
              <Trash2 className="w-5 h-5" />
            </button>
            <div className="space-y-4">
              <input 
                className="bg-transparent border-b border-zinc-850 mb-2 w-full font-bold focus:border-cyber-green outline-none pb-1 text-zinc-100 text-sm"
                value={workflow.name}
                onChange={e => {
                  const newWorkflows = [...workflows];
                  newWorkflows.find(w => w.id === workflow.id)!.name = e.target.value;
                  setWorkflows(newWorkflows);
                }}
              />
              <textarea 
                className="bg-transparent text-sm w-full outline-none text-zinc-400 min-h-[80px] leading-relaxed"
                placeholder="Describe the workflow SOP..."
                value={workflow.description}
                onChange={e => {
                  const newWorkflows = [...workflows];
                  newWorkflows.find(w => w.id === workflow.id)!.description = e.target.value;
                  setWorkflows(newWorkflows);
                }}
              />

              {/* OKF/IKS Integration Panel */}
              <div className="pt-4 border-t border-zinc-900 mt-4 space-y-4" style={{ borderColor: 'color-mix(in srgb, var(--color-zinc-800) 40%, transparent)' }}>
                <label className="flex items-center gap-2 text-xs text-zinc-500 cursor-pointer font-mono select-none">
                  <input 
                    type="checkbox"
                    checked={!!workflow.isOkfPlaybook}
                    onChange={e => {
                      const newWorkflows = [...workflows];
                      const curr = newWorkflows.find(w => w.id === workflow.id)!;
                      curr.isOkfPlaybook = e.target.checked;
                      if (e.target.checked) {
                        curr.topic = curr.topic || companyInfo.industry.toLowerCase() || 'general';
                        curr.conceptType = curr.conceptType || 'playbook';
                        curr.tags = curr.tags || companyInfo.industry.toLowerCase() || 'general';
                      }
                      setWorkflows(newWorkflows);
                    }}
                    className="rounded border-zinc-800 bg-zinc-950 text-cyber-green focus:ring-0 focus:ring-offset-0 cursor-pointer w-4 h-4"
                  />
                  <span data-tooltip="Ingest this markdown procedure directly into your agents' vector memory database upon loading.">Index into Institutional Knowledge Store (OKF/IKS)</span>
                </label>

                {workflow.isOkfPlaybook && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pl-6 border-l border-zinc-800">
                    <div>
                      <label className="block text-[10px] font-mono text-zinc-500 uppercase mb-1 cursor-help" data-tooltip="Link to external raw source material, Confluence wiki pages, or Google Docs.">External SOP / Confluence URL</label>
                      <input 
                        className="w-full bg-zinc-950 border border-zinc-800 rounded p-2 text-xs focus:border-cyber-green outline-none text-zinc-300"
                        placeholder="https://confluence.company.com/pages/..."
                        value={workflow.resourceUri || ''}
                        onChange={e => {
                          const newWorkflows = [...workflows];
                          newWorkflows.find(w => w.id === workflow.id)!.resourceUri = e.target.value;
                          setWorkflows(newWorkflows);
                        }}
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-mono text-zinc-500 uppercase mb-1 cursor-help" data-tooltip="Primary focus category (e.g. legal, compliance, operations) for sorting.">Topic</label>
                      <input 
                        className="w-full bg-zinc-950 border border-zinc-800 rounded p-2 text-xs focus:border-cyber-green outline-none text-zinc-300"
                        placeholder="e.g. marketing, compliance"
                        value={workflow.topic || ''}
                        onChange={e => {
                          const newWorkflows = [...workflows];
                          newWorkflows.find(w => w.id === workflow.id)!.topic = e.target.value;
                          setWorkflows(newWorkflows);
                        }}
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-mono text-zinc-500 uppercase mb-1 cursor-help" data-tooltip="Structural classification category (e.g. playbook, guideline, policy).">Concept Type</label>
                      <input 
                        className="w-full bg-zinc-950 border border-zinc-800 rounded p-2 text-xs focus:border-cyber-green outline-none text-zinc-300"
                        placeholder="e.g. playbook, guideline"
                        value={workflow.conceptType || ''}
                        onChange={e => {
                          const newWorkflows = [...workflows];
                          newWorkflows.find(w => w.id === workflow.id)!.conceptType = e.target.value;
                          setWorkflows(newWorkflows);
                        }}
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-mono text-zinc-500 uppercase mb-1 cursor-help" data-tooltip="Keywords matching agent filters to trigger memory retrieval.">Tags (comma-separated)</label>
                      <input 
                        className="w-full bg-zinc-950 border border-zinc-800 rounded p-2 text-xs focus:border-cyber-green outline-none text-zinc-300"
                        placeholder="e.g. seo, advertising"
                        value={workflow.tags || ''}
                        onChange={e => {
                          const newWorkflows = [...workflows];
                          newWorkflows.find(w => w.id === workflow.id)!.tags = e.target.value;
                          setWorkflows(newWorkflows);
                        }}
                      />
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        ))}
        {workflows.length === 0 && (
          <div className="py-12 text-center text-zinc-650 font-mono text-xs border border-dashed border-zinc-850 rounded-xl">
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
