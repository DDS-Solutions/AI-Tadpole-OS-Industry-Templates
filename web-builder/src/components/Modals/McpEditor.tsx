import { useId, useState } from 'react';
import { Database } from 'lucide-react';
import { motion, useReducedMotion } from 'framer-motion';
import { useDialog, getModalMotionProps } from './useDialog';
import { DialogHeader } from './DialogHeader';
import { DialogFooter } from './DialogFooter';
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
      {...getModalMotionProps(Boolean(reducedMotion))}
      className="sovereign-panel w-full max-w-2xl max-h-[calc(100dvh-2rem)] flex flex-col bg-zinc-900 border-zinc-800 p-0 overflow-hidden"
    >
      <DialogHeader
        id={`${fieldId}-title`}
        summaryId={`${fieldId}-summary`}
        title="Configure MCP Data Connector"
        summary="Name, category, and blueprint path are required."
        icon={<Database className="w-5 h-5 shrink-0 text-cyber-green" />}
        onClose={onClose}
        closeAriaLabel="Close connector editor"
        borderColor="color-mix(in srgb, var(--color-zinc-800) 40%, transparent)"
      />

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

      <DialogFooter onCancel={onClose} canSave={canSave} saveLabel="Save Connector" />
    </motion.form>
  );
}
