import { Database, Info, Plus, Sliders, Trash2 } from 'lucide-react';
import { motion } from 'framer-motion';
import type { MCPConnector } from '../../types';
import { hasRuntimeDefinition } from '../../utils/connectorReadiness';

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
  const toggleConnector = (connector: MCPConnector) => {
    if (selectedConnectors.includes(connector.id)) {
      setSelectedConnectors(selectedConnectors.filter(id => id !== connector.id));
    } else if (hasRuntimeDefinition(connector)) {
      setSelectedConnectors([...selectedConnectors, connector.id]);
    }
  };

  return (
    <motion.div
      key="step4"
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      data-tooltip="Phase 4 Data Connectors: Attach MCP-compatible data connectors to provide swarms with real-time external data access."
      className="w-full sovereign-panel p-5 sm:p-8"
    >
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-5">
        <div className="flex items-center gap-3 text-cyber-green">
          <Database className="w-5 h-5 shrink-0" />
          <div>
            <h2 className="font-bold text-lg text-white" data-tooltip="Attach standalone MCP Data Connectors for digital twin syncing or external tool access.">
              Phase 4: Connections
            </h2>
            <p className="text-xs font-mono text-zinc-500">MCP tool configuration & server parameters</p>
          </div>
        </div>
        <button
          type="button"
          onClick={onAddNewMcp}
          aria-describedby="custom-connector-help"
          className="focus-sovereign min-h-11 shrink-0 flex items-center gap-2 bg-zinc-900 border border-zinc-800 text-zinc-300 hover:text-white px-4 py-2 rounded-lg text-xs font-semibold transition-colors cursor-pointer hover:bg-zinc-800"
        >
          <Plus className="w-3.5 h-3.5" /> Add custom blueprint
        </button>
      </div>

      <p id="custom-connector-help" className="flex items-start gap-2 text-xs text-zinc-400 leading-relaxed mb-6">
        <Info aria-hidden="true" className="w-4 h-4 shrink-0 mt-0.5 text-busy" />
        <span>
          The custom editor saves a connector's name, path, and description. Add its runtime configuration and tool manifest to the registry before selecting it. Package checks run again at export.
        </span>
      </p>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {mcpCatalog.length === 0 ? (
          <div className="col-span-full py-12 text-center text-zinc-600 font-mono text-sm border border-dashed border-zinc-850 rounded-xl">
            No MCP connectors available in registry.
          </div>
        ) : (
          mcpCatalog.map(connector => {
            const isSelected = selectedConnectors.includes(connector.id);
            const hasRuntime = hasRuntimeDefinition(connector);
            const isQuarantined = connector.status === 'quarantined';
            const readinessId = `connector-${connector.id}-readiness`;
            return (
              <div
                key={connector.id}
                className={`p-5 rounded-xl border sovereign-transition text-left relative ${
                  isSelected
                    ? 'bg-zinc-900 border-cyber-green/50 text-white'
                    : 'bg-zinc-950/40 border-zinc-800 text-zinc-400 hover:border-zinc-700'
                }`}
              >
                <button
                  type="button"
                  onClick={() => toggleConnector(connector)}
                  aria-pressed={isSelected}
                  aria-label={`${isSelected ? 'Deselect' : 'Select'} ${connector.name}`}
                  aria-describedby={!hasRuntime ? readinessId : undefined}
                  disabled={!hasRuntime && !isSelected}
                  className="w-full cursor-pointer text-left focus-sovereign rounded-lg disabled:cursor-not-allowed"
                >
                  <span className="flex justify-between items-start mb-2">
                    <span className="text-[10px] font-mono text-zinc-500 uppercase tracking-wider">{connector.category} v{connector.version}</span>
                    <span className="flex items-center gap-2">
                      {isSelected && <span className="text-[10px] font-mono text-cyber-green">Selected</span>}
                    </span>
                  </span>
                  <span className="block font-bold text-sm text-zinc-100">{connector.name}</span>
                  <span className="block text-xs text-zinc-500 mt-2 leading-relaxed">{connector.description}</span>
                </button>

                {!hasRuntime && (
                  <div id={readinessId} className="mt-3 text-xs leading-relaxed">
                    <p className="font-medium text-warning">{isQuarantined ? 'Quarantined connector' : 'Requires runtime configuration'}</p>
                    <p className="text-zinc-400 mt-1">
                      {isQuarantined
                        ? 'This connector is unavailable for new selections.'
                        : 'This blueprint needs a server configuration and tool manifest in the registry. Editing its details does not add these assets.'}
                      {isSelected && ' Deselect it before export.'}
                    </p>
                  </div>
                )}

                <div className="mt-4 pt-3 border-t border-zinc-850/50 flex justify-between items-center text-[10px] font-mono text-zinc-500" style={{ borderColor: 'color-mix(in srgb, var(--color-zinc-800) 25%, transparent)' }}>
                  <span className="truncate max-w-[150px]" title={connector.path}>{connector.path}</span>
                  <div className="flex gap-2.5">
                    <button
                      type="button"
                      onClick={() => onEditMcp(connector)}
                      aria-label={`Edit ${connector.name}`}
                      className="focus-sovereign rounded min-h-9 px-1 text-zinc-400 hover:text-white flex items-center gap-1 transition-colors cursor-pointer"
                    >
                      <Sliders className="w-3 h-3" /> Edit
                    </button>
                    <button
                      type="button"
                      onClick={(e) => onDeleteMcp(connector.id, e)}
                      aria-label={`Delete ${connector.name}`}
                      className="focus-sovereign rounded min-h-9 px-1 text-zinc-400 hover:text-danger flex items-center gap-1 transition-colors cursor-pointer"
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
        <button type="button" onClick={onPrevious} className="text-zinc-500 hover:text-white transition-colors cursor-pointer">Previous</button>
        <button
          type="button"
          onClick={onNext}
          className="bg-neural-pulse text-zinc-950 font-bold px-8 py-3 rounded-lg hover:bg-white transition-all cursor-pointer"
        >
          Next Forge
        </button>
      </div>
    </motion.div>
  );
}
