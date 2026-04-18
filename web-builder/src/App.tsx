import { useState } from 'react';
import { 
  Shield, 
  Cpu, 
  Workflow, 
  Download, 
  Plus, 
  Trash2, 
  Zap,
  Globe,
  Users
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import JSZip from 'jszip';

type Agent = {
  id: string;
  name: string;
  role: string;
  model: string;
  prompt: string;
};

type WorkflowItem = {
  id: string;
  name: string;
  description: string;
};

export default function App() {
  const [step, setStep] = useState(1);
  const [companyInfo, setCompanyInfo] = useState({
    name: '',
    description: '',
    mission: '',
    industry: '',
    size: '25'
  });
  const [agents, setAgents] = useState<Agent[]>([
    { id: '1', name: 'Lead Orchestrator', role: 'General Coordinator', model: 'gemini-pro-latest', prompt: 'Coordinate swarm operations...' }
  ]);
  const [workflows, setWorkflows] = useState<WorkflowItem[]>([
    { id: '1', name: 'Standard Triage', description: 'Analyze incoming data and route to appropriate agent.' }
  ]);

  const addAgent = () => {
    const id = Math.random().toString(36).substr(2, 9);
    setAgents([...agents, { id, name: 'New Agent', role: '', model: 'gemini-pro-latest', prompt: '' }]);
  };

  const removeAgent = (id: string) => {
    setAgents(agents.filter(a => a.id !== id));
  };

  const addWorkflow = () => {
    const id = Math.random().toString(36).substr(2, 9);
    setWorkflows([...workflows, { id, name: 'New Workflow', description: '' }]);
  };

  const removeWorkflow = (id: string) => {
    setWorkflows(workflows.filter(w => w.id !== id));
  };

  const handleAiAssist = () => {
    // Mock AI Suggestion
    setCompanyInfo({
      ...companyInfo,
      mission: `To revolutionize ${companyInfo.description.toLowerCase()} through sovereign intelligence.`,
      industry: 'AI & Technology'
    });
  };

  const handleExport = async () => {
    const zip = new JSZip();
    
    // swarm.json
    const swarmJson = {
      $schema: "https://tadpoleos.dev/schemas/swarm-v1.json",
      name: `${companyInfo.name} Swarm`,
      version: "1.0.0",
      description: companyInfo.mission,
      industry: companyInfo.industry.toLowerCase(),
      company_size: parseInt(companyInfo.size),
      roster: agents.map(a => ({
        id: a.id,
        path: `agents/${a.id}.json`,
        role: a.role
      })),
      global_workflows: workflows.map(w => `workflows/${w.id}.md`)
    };
    
    zip.file("swarm.json", JSON.stringify(swarmJson, null, 2));
    
    // agents/*.json
    const agentsFolder = zip.folder("agents");
    agents.forEach(agent => {
      agentsFolder?.file(`${agent.id}.json`, JSON.stringify({
        id: agent.id,
        name: agent.name,
        role: agent.role,
        model: agent.model,
        system_prompt: agent.prompt
      }, null, 2));
    });
    
    // workflows/*.md
    const workflowsFolder = zip.folder("workflows");
    workflows.forEach(workflow => {
      workflowsFolder?.file(`${workflow.id}.md`, `# Workflow: ${workflow.name}\n\n${workflow.description}`);
    });
    
    const content = await zip.generateAsync({ type: "blob" });
    const url = window.URL.createObjectURL(content);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${companyInfo.name.toLowerCase().replace(/\s+/g, '-')}-swarm.zip`;
    link.click();
  };

  return (
    <div className="min-h-screen p-4 md:p-8 flex flex-col items-center max-w-5xl mx-auto">
      {/* Header */}
      <header className="w-full flex justify-between items-center mb-12">
        <div className="flex items-center gap-3">
          <div className="bg-cyber-green/20 p-2 rounded-xl border border-cyber-green/30">
            <Shield className="text-cyber-green w-6 h-6" />
          </div>
          <div>
            <h1 className="text-xl font-bold tracking-tight">Swarm Architect</h1>
            <p className="text-xs text-zinc-500 font-mono uppercase tracking-widest">Tadpole OS Engine</p>
          </div>
        </div>
        <div className="flex gap-2">
          {[1, 2, 3, 4].map(s => (
            <div 
              key={s} 
              className={`w-8 h-1 rounded-full transition-colors ${s <= step ? 'bg-cyber-green' : 'bg-zinc-800'}`} 
            />
          ))}
        </div>
      </header>

      {/* Main Content */}
      <AnimatePresence mode="wait">
        {step === 1 && (
          <motion.div 
            key="step1"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="w-full sovereign-panel p-8"
          >
            <div className="flex items-center gap-2 mb-6 text-cyber-green">
              <Globe className="w-5 h-5" />
              <h2 className="font-bold text-lg">Phase 1: The Pulse</h2>
            </div>
            
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-xs font-mono uppercase text-zinc-500 mb-2">Company Name</label>
                  <input 
                    className="w-full bg-zinc-950 border border-zinc-800 rounded-lg p-3 focus:border-cyber-green outline-none transition-colors"
                    placeholder="e.g. Acme Intelligence"
                    value={companyInfo.name}
                    onChange={e => setCompanyInfo({...companyInfo, name: e.target.value})}
                  />
                </div>
                <div>
                  <label className="block text-xs font-mono uppercase text-zinc-500 mb-2">Company Size</label>
                  <select 
                    className="w-full bg-zinc-950 border border-zinc-800 rounded-lg p-3 focus:border-cyber-green outline-none"
                    value={companyInfo.size}
                    onChange={e => setCompanyInfo({...companyInfo, size: e.target.value})}
                  >
                    <option value="25">25 Seats (Startup)</option>
                    <option value="50">50 Seats (Growth)</option>
                    <option value="100">100 Seats (Enterprise)</option>
                  </select>
                </div>
              </div>
              
              <div>
                <label className="block text-xs font-mono uppercase text-zinc-500 mb-2">What does your company do?</label>
                <div className="relative">
                  <textarea 
                    className="w-full bg-zinc-950 border border-zinc-800 rounded-lg p-3 min-h-[100px] focus:border-cyber-green outline-none"
                    placeholder="Describe your core business..."
                    value={companyInfo.description}
                    onChange={e => setCompanyInfo({...companyInfo, description: e.target.value})}
                  />
                  <button 
                    onClick={handleAiAssist}
                    className="absolute bottom-4 right-4 bg-cyber-green/10 text-cyber-green hover:bg-cyber-green/20 p-2 rounded-lg border border-cyber-green/30 flex items-center gap-2 text-sm transition-all"
                  >
                    <Zap className="w-4 h-4" /> AI Suggest
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-xs font-mono uppercase text-zinc-500 mb-2">Mission Objective</label>
                <textarea 
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-lg p-3 min-h-[60px] focus:border-cyber-green outline-none"
                  placeholder="The core goal of this swarm..."
                  value={companyInfo.mission}
                  onChange={e => setCompanyInfo({...companyInfo, mission: e.target.value})}
                />
              </div>
            </div>

            <div className="mt-12 flex justify-end">
              <button 
                onClick={() => setStep(2)}
                disabled={!companyInfo.name}
                className="bg-neural-pulse text-zinc-950 font-bold px-8 py-3 rounded-lg hover:bg-white disabled:opacity-50 transition-all cursor-pointer"
              >
                Next Architecture
              </button>
            </div>
          </motion.div>
        )}

        {step === 2 && (
          <motion.div 
            key="step2"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="w-full sovereign-panel p-8"
          >
            <div className="flex justify-between items-center mb-8">
              <div className="flex items-center gap-2 text-cyber-green">
                <Users className="w-5 h-5" />
                <h2 className="font-bold text-lg">Phase 2: The Roster</h2>
              </div>
              <button 
                onClick={addAgent}
                className="bg-cyber-green/10 text-cyber-green hover:bg-cyber-green/20 px-4 py-2 rounded-lg border border-cyber-green/30 flex items-center gap-2 transition-all"
              >
                <Plus className="w-4 h-4" /> Add Agent
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {agents.map(agent => (
                <div key={agent.id} className="bg-zinc-950/50 border border-zinc-800 p-4 rounded-xl relative group">
                  <button 
                    onClick={() => removeAgent(agent.id)}
                    className="absolute top-4 right-4 text-zinc-600 hover:text-red-500 transition-colors opacity-0 group-hover:opacity-100"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                  <div className="space-y-4">
                    <input 
                      className="bg-transparent border-b border-zinc-800 mb-2 w-full font-bold focus:border-cyber-green outline-none pb-1"
                      value={agent.name}
                      onChange={e => {
                        const newAgents = [...agents];
                        newAgents.find(a => a.id === agent.id)!.name = e.target.value;
                        setAgents(newAgents);
                      }}
                    />
                    <div>
                      <label className="block text-[10px] font-mono text-zinc-600 uppercase">Role / Expertise</label>
                      <input 
                        className="bg-transparent text-sm w-full outline-none text-neural-pulse"
                        placeholder="e.g. Legal Compliance"
                        value={agent.role}
                        onChange={e => {
                          const newAgents = [...agents];
                          newAgents.find(a => a.id === agent.id)!.role = e.target.value;
                          setAgents(newAgents);
                        }}
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-12 flex justify-between">
              <button onClick={() => setStep(1)} className="text-zinc-500 hover:text-white transition-colors">Previous</button>
              <button 
                onClick={() => setStep(3)}
                className="bg-neural-pulse text-zinc-950 font-bold px-8 py-3 rounded-lg hover:bg-white transition-all cursor-pointer"
              >
                Next Playbook
              </button>
            </div>
          </motion.div>
        )}

        {step === 3 && (
          <motion.div 
            key="step3"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="w-full sovereign-panel p-8"
          >
            <div className="flex justify-between items-center mb-8">
              <div className="flex items-center gap-2 text-cyber-green">
                <Workflow className="w-5 h-5" />
                <h2 className="font-bold text-lg">Phase 3: The Playbook</h2>
              </div>
              <button 
                onClick={addWorkflow}
                className="bg-cyber-green/10 text-cyber-green hover:bg-cyber-green/20 px-4 py-2 rounded-lg border border-cyber-green/30 flex items-center gap-2 transition-all"
              >
                <Plus className="w-4 h-4" /> Add Workflow
              </button>
            </div>

            <div className="space-y-4">
              {workflows.map(workflow => (
                <div key={workflow.id} className="bg-zinc-950/50 border border-zinc-800 p-6 rounded-xl relative group">
                  <button 
                    onClick={() => removeWorkflow(workflow.id)}
                    className="absolute top-6 right-6 text-zinc-600 hover:text-red-500 transition-colors opacity-0 group-hover:opacity-100"
                  >
                    <Trash2 className="w-5 h-5" />
                  </button>
                  <div className="space-y-4">
                    <input 
                      className="bg-transparent border-b border-zinc-800 mb-2 w-full font-bold focus:border-cyber-green outline-none pb-1"
                      value={workflow.name}
                      onChange={e => {
                        const newWorkflows = [...workflows];
                        newWorkflows.find(w => w.id === workflow.id)!.name = e.target.value;
                        setWorkflows(newWorkflows);
                      }}
                    />
                    <textarea 
                      className="bg-transparent text-sm w-full outline-none text-zinc-400 min-h-[80px]"
                      placeholder="Describe the workflow SOP..."
                      value={workflow.description}
                      onChange={e => {
                        const newWorkflows = [...workflows];
                        newWorkflows.find(w => w.id === workflow.id)!.description = e.target.value;
                        setWorkflows(newWorkflows);
                      }}
                    />
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-12 flex justify-between">
              <button onClick={() => setStep(2)} className="text-zinc-500 hover:text-white transition-colors">Previous</button>
              <button 
                onClick={() => setStep(4)}
                className="bg-neural-pulse text-zinc-950 font-bold px-8 py-3 rounded-lg hover:bg-white transition-all cursor-pointer"
              >
                Next Forge
              </button>
            </div>
          </motion.div>
        )}

        {step === 4 && (
          <motion.div 
            key="step4"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="w-full sovereign-panel p-12 text-center"
          >
            <div className="bg-cyber-green/20 w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-6 border border-cyber-green/30">
              <Cpu className="text-cyber-green w-8 h-8" />
            </div>
            <h2 className="text-2xl font-bold mb-2">Ready for Intelligence Manifestation</h2>
            <p className="text-zinc-500 max-w-md mx-auto mb-12">
              Your swarm configuration for <span className="text-white font-bold">{companyInfo.name}</span> is complete. 
              The package includes {agents.length} agents and {workflows.length} workflows.
            </p>

            <div className="max-w-sm mx-auto p-4 bg-zinc-950 border border-zinc-800 rounded-xl text-left font-mono text-xs text-zinc-500 mb-12">
              <div className="mb-2">Manifest:</div>
              <ul className="space-y-1">
                <li className="flex items-center gap-2"><div className="w-1 h-1 bg-cyber-green rounded-full" /> swarm.json</li>
                <li className="flex items-center gap-2"><div className="w-1 h-1 bg-cyber-green rounded-full" /> agents/ ({agents.length} files)</li>
                <li className="flex items-center gap-2"><div className="w-1 h-1 bg-cyber-green rounded-full" /> workflows/ ({workflows.length} files)</li>
              </ul>
            </div>

            <div className="flex flex-col gap-4 items-center">
              <button 
                onClick={handleExport}
                className="bg-cyber-green text-zinc-950 font-black px-12 py-4 rounded-xl hover:scale-105 transition-all flex items-center gap-3 cursor-pointer shadow-[0_0_20px_rgba(34,197,94,0.3)]"
              >
                <Download className="w-6 h-6" /> Export Swarm Archive
              </button>
              <button 
                onClick={() => setStep(1)}
                className="text-zinc-500 hover:text-white transition-colors text-sm mt-4"
              >
                Re-configure Architecture
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <footer className="mt-12 text-zinc-600 text-[10px] font-mono tracking-widest uppercase">
        Sovereign Reality Systems • 2026 • Verified SEC-ARA
      </footer>
    </div>
  );
}
