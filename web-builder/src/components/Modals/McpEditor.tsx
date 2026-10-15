import { useId, useState } from 'react';
import { Database, X } from 'lucide-react';
import { motion, useReducedMotion } from 'framer-motion';
import { useDialog } from './useDialog';
import type { MCPConnector } from '../../types';

interface McpEditorProps {
  connector: MCPConnector;
  onClose: () => void;
  onSave: (updatedConnector: MCPConnector) => void;
}

export default function McpEditor({ connector, onClose, onSave }: McpEditorProps) {
  const dialogRef = useDialog<HTMLFormElement>(onClose);
  const fieldId = useId();
  const reducedMotion = useReducedMotion();
  const [name, setName] = useState(connector.name);
  const [category, setCategory] = useState(connector.category);
  const [version, setVersion] = useState(connector.version);
  const [description, setDescription] = useState(connector.description);
  const [path, setPath] = useState(connector.path);

  const canSave = Boolean(name.trim() && category.trim() && path.trim());

  const handleSave = () => {
    if (!canSave) return;
    onSave({
      ...connector,
      name: name.trim(),
      category: category.trim(),
      version: version.trim(),
      description: description.trim(),
      path: path.trim()
    });
  };

  return (
    <motion.form
      ref={dialogRef}
      role="dialog"
      aria-modal="true"
      aria-labelledby={`${fieldId}-title`}
      aria-describedby={`${fieldId}-summary`}
      tabIndex={-1}
      onSubmit={event => { event.preventDefault(); handleSave(); }}
      initial={reducedMotion ? false : { scale: 0.95, y: 15 }}
      animate={{ scale: 1, y: 0 }}
      exit={reducedMotion ? undefined : { scale: 0.95, y: 15 }}
      transition={{ type: "spring", stiffness: 350, damping: 25 }}
      className="sovereign-panel w-full max-w-2xl max-h-[calc(100dvh-2rem)] flex flex-col bg-zinc-900 border-zinc-800 p-0 overflow-hidden"
    >
      {/* Header */}
      <div className="flex shrink-0 justify-between items-start gap-3 px-4 sm:px-6 py-4 border-b border-zinc-850" style={{ borderColor: 'color-mix(in srgb, var(--color-zinc-800) 40%, transparent)' }}>
        <div>
          <h3 id={`${fieldId}-title`} className="text-lg font-bold text-white flex items-center gap-2">
            <Database className="w-5 h-5 shrink-0 text-cyber-green" /> Configure MCP Data Connector
          </h3>
          <p id={`${fieldId}-summary`} className="text-xs text-zinc-400 mt-1 leading-relaxed">Name, category, and blueprint path are required.</p>
        </div>
        <button
          type="button"
          onClick={onClose}
          aria-label="Close connector editor"
          className="focus-sovereign shrink-0 min-h-11 min-w-11 flex items-center justify-center text-zinc-400 hover:text-white rounded-lg hover:bg-zinc-800 transition-colors cursor-pointer"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* Form Body */}
      <div className="min-h-0 overflow-y-auto custom-scrollbar p-4 sm:p-6 space-y-5">

        {/* Name, Category, Version */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label htmlFor={`${fieldId}-name`} className="block text-[10px] font-mono text-zinc-400 uppercase mb-1.5">Connector Name</label>
            <input
              type="text"
              className="focus-sovereign w-full min-w-0 bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-2.5 text-base sm:text-xs text-zinc-200 focus:border-cyber-green outline-none"
              placeholder="e.g., Salesforce Sync"
              id={`${fieldId}-name`}
              data-dialog-initial-focus
              required
              value={name}
              onChange={e => setName(e.target.value)}
            />
          </div>
          <div>
            <label htmlFor={`${fieldId}-category`} className="block text-[10px] font-mono text-zinc-400 uppercase mb-1.5">Category</label>
            <input
              type="text"
              className="focus-sovereign w-full min-w-0 bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-2.5 text-base sm:text-xs text-zinc-200 focus:border-cyber-green outline-none"
              placeholder="e.g., CRM & SaaS"
              id={`${fieldId}-category`}
              required
              value={category}
              onChange={e => setCategory(e.target.value)}
            />
          </div>
          <div>
            <label htmlFor={`${fieldId}-version`} className="block text-[10px] font-mono text-zinc-400 uppercase mb-1.5">Version</label>
            <input
              type="text"
              className="focus-sovereign w-full min-w-0 bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-2.5 text-base sm:text-xs text-zinc-200 focus:border-cyber-green outline-none"
              placeholder="e.g., 1.0.0"
              id={`${fieldId}-version`}
              value={version}
              onChange={e => setVersion(e.target.value)}
            />
          </div>
        </div>

        {/* Blueprint File/Directory Path */}
        <div>
          <label htmlFor={`${fieldId}-path`} className="block text-[10px] font-mono text-zinc-400 uppercase mb-1.5">Blueprint Path / Repository URI</label>
          <input
            type="text"
            className="focus-sovereign w-full min-w-0 bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-2.5 text-base sm:text-xs text-zinc-200 focus:border-cyber-green outline-none"
            placeholder="e.g., mcp-blueprints/salesforce-sync"
            id={`${fieldId}-path`}
            required
            value={path}
            onChange={e => setPath(e.target.value)}
          />
        </div>

        {/* Description */}
        <div>
          <label htmlFor={`${fieldId}-description`} className="block text-[10px] font-mono text-zinc-400 uppercase mb-1.5">Description / Purpose</label>
          <textarea
            className="focus-sovereign w-full min-w-0 bg-zinc-950 border border-zinc-800 rounded-lg p-4 font-sans text-base sm:text-xs text-zinc-300 focus:border-cyber-green outline-none h-24 leading-relaxed resize-none"
            placeholder="Describe what data resources this MCP server exposes to the swarm..."
            id={`${fieldId}-description`}
              value={description}
            onChange={e => setDescription(e.target.value)}
          />
        </div>

      </div>

      {/* Footer */}
      <div className="px-4 sm:px-6 py-4 shrink-0 border-t border-zinc-800 bg-zinc-950/40 flex flex-col-reverse sm:flex-row justify-end gap-3" style={{ borderColor: 'color-mix(in srgb, var(--color-zinc-800) 40%, transparent)' }}>
        <button
          type="button"
          onClick={onClose}
          className="focus-sovereign min-h-11 bg-zinc-900 hover:bg-zinc-800 text-zinc-300 hover:text-white px-5 py-2.5 rounded-lg border border-zinc-800 text-xs font-semibold cursor-pointer transition-colors"
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={!canSave}
          className="focus-sovereign min-h-11 bg-cyber-green text-zinc-950 font-bold text-xs px-6 py-2.5 rounded-lg hover:scale-102 transition-all cursor-pointer disabled:opacity-50 disabled:pointer-events-none shadow-md"
        >
          Save Connector
        </button>
      </div>
    </motion.form>
  );
}
