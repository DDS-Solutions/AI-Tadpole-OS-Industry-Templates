import { Database, Plus, Sliders, Trash2 } from 'lucide-react';
import { motion } from 'framer-motion';
import type { MCPConnector } from '../../types';

interface Step4Props {
  mcpCatalog: MCPConnector[];
  selectedConnectors: string[];
  setSelectedConnectors: (connectors: string[]) => void;
  onAddNewMcp: () => void;
  onEditMcp: (connector: MCPConnector) => void;
  onDeleteMcp: (id: string, e: React.MouseEvent) => void;
  onPrevious: () => void;
  onNext: () => void;
}

export default function Step4_Connectors({
  mcpCatalog,
  selectedConnectors,
  setSelectedConnectors,
  onAddNewMcp,
  onEditMcp,
  onDeleteMcp,
  onPrevious,
  onNext
}: Step4Props) {
  return (
    <motion.div 
      key="step4"
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      data-tooltip="Phase 4 Data Connectors: Attach MCP-compatible data connectors to provide swarms with real-time external data access."
      className="w-full sovereign-panel p-8"
    >
      <div className="flex justify-between items-center mb-8">
        <div className="flex items-center gap-2 text-cyber-green">
          <Database className="w-5 h-5" />
          <h2 className="font-bold text-lg" data-tooltip="Attach standalone MCP Data Connectors for digital twin syncing or external tool access.">Phase 4: Data Connectors (MCP)</h2>
        </div>
        <button
          onClick={onAddNewMcp}
          className="flex items-center gap-2 bg-zinc-900 border border-zinc-800 text-zinc-300 hover:text-white px-4 py-2 rounded-lg text-xs font-mono tracking-wider uppercase transition-all cursor-pointer hover:bg-zinc-800"
        >
          <Plus className="w-3.5 h-3.5" /> Add Connector
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {mcpCatalog.length === 0 ? (
          <div className="col-span-full py-12 text-center text-zinc-600 font-mono text-sm border border-dashed border-zinc-850 rounded-xl">
            No MCP connectors available in registry.
          </div>
        ) : (
          mcpCatalog.map(connector => {
            const isSelected = selectedConnectors.includes(connector.id);
            return (
              <div 
                key={connector.id} 
                onClick={() => {
                  if (isSelected) {
                    setSelectedConnectors(selectedConnectors.filter(id => id !== connector.id));
                  } else {
                    setSelectedConnectors([...selectedConnectors, connector.id]);
                  }
                }}
                className={`p-5 rounded-xl border sovereign-transition cursor-pointer text-left relative ${
                  isSelected 
                    ? 'bg-zinc-900 border-cyber-green/50 text-white' 
                    : 'bg-zinc-950/40 border-zinc-800 text-zinc-400 hover:border-zinc-700'
                }`}
              >
                <div className="flex justify-between items-start mb-2">
                  <span className="text-[10px] font-mono text-zinc-500 uppercase tracking-wider">{connector.category} v{connector.version}</span>
                  <div className="flex items-center gap-2">
                    {isSelected && <span className="w-2 h-2 bg-cyber-green rounded-full shadow-[0_0_8px_rgba(34,197,94,0.8)] animate-pulse" />}
                  </div>
                </div>
                <h4 className="font-bold text-sm text-zinc-100">{connector.name}</h4>
                <p className="text-xs text-zinc-500 mt-2 leading-relaxed">{connector.description}</p>
                
                <div className="mt-4 pt-3 border-t border-zinc-850/50 flex justify-between items-center text-[10px] font-mono text-zinc-500" style={{ borderColor: 'color-mix(in srgb, var(--color-zinc-800) 25%, transparent)' }}>
                  <span className="truncate max-w-[150px]" title={connector.path}>{connector.path}</span>
                  <div className="flex gap-2.5">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onEditMcp(connector);
                      }}
                      className="text-zinc-500 hover:text-white flex items-center gap-1 transition-colors cursor-pointer"
                    >
                      <Sliders className="w-3 h-3" /> Edit
                    </button>
                    <button
                      onClick={(e) => onDeleteMcp(connector.id, e)}
                      className="text-zinc-500 hover:text-rose-450 flex items-center gap-1 transition-colors cursor-pointer"
                    >
                      <Trash2 className="w-3 h-3" /> Delete
                    </button>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      <div className="mt-12 flex justify-between">
        <button onClick={onPrevious} className="text-zinc-500 hover:text-white transition-colors cursor-pointer">Previous</button>
        <button 
          onClick={onNext}
          className="bg-neural-pulse text-zinc-950 font-bold px-8 py-3 rounded-lg hover:bg-white transition-all cursor-pointer"
        >
          Next Forge
        </button>
      </div>
    </motion.div>
  );
}
