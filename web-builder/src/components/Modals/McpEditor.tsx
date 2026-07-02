import { useState } from 'react';
import { Database, X } from 'lucide-react';
import { motion } from 'framer-motion';
import type { MCPConnector } from '../../types';

interface McpEditorProps {
  connector: MCPConnector;
  onClose: () => void;
  onSave: (updatedConnector: MCPConnector) => void;
}

export default function McpEditor({ connector, onClose, onSave }: McpEditorProps) {
  const [name, setName] = useState(connector.name);
  const [category, setCategory] = useState(connector.category);
  const [version, setVersion] = useState(connector.version);
  const [description, setDescription] = useState(connector.description);
  const [path, setPath] = useState(connector.path);

  const handleSave = () => {
    onSave({
      ...connector,
      name,
      category,
      version,
      description,
      path
    });
  };

  return (
    <motion.div
      initial={{ scale: 0.95, y: 15 }}
      animate={{ scale: 1, y: 0 }}
      exit={{ scale: 0.95, y: 15 }}
      transition={{ type: "spring", stiffness: 350, damping: 25 }}
      className="sovereign-panel w-full max-w-2xl flex flex-col bg-zinc-900 border-zinc-800 p-0 overflow-hidden"
    >
      {/* Header */}
      <div className="flex justify-between items-center px-6 py-4 border-b border-zinc-850" style={{ borderColor: 'color-mix(in srgb, var(--color-zinc-800) 40%, transparent)' }}>
        <div>
          <h3 className="text-lg font-bold text-white flex items-center gap-2">
            <Database className="w-5 h-5 text-cyber-green" /> Configure MCP Data Connector
          </h3>
          <p className="text-xs text-zinc-500 mt-0.5">Define your custom MCP connection blueprint details.</p>
        </div>
        <button
          onClick={onClose}
          className="p-1.5 text-zinc-500 hover:text-white rounded hover:bg-zinc-800 transition-all cursor-pointer"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* Form Body */}
      <div className="p-6 space-y-5">
        
        {/* Name, Category, Version */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-[10px] font-mono text-zinc-500 uppercase mb-1.5">Connector Name</label>
            <input
              type="text"
              className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-2.5 text-xs text-zinc-200 focus:border-cyber-green outline-none"
              placeholder="e.g., Salesforce Sync"
              value={name}
              onChange={e => setName(e.target.value)}
            />
          </div>
          <div>
            <label className="block text-[10px] font-mono text-zinc-500 uppercase mb-1.5">Category</label>
            <input
              type="text"
              className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-2.5 text-xs text-zinc-200 focus:border-cyber-green outline-none"
              placeholder="e.g., CRM & SaaS"
              value={category}
              onChange={e => setCategory(e.target.value)}
            />
          </div>
          <div>
            <label className="block text-[10px] font-mono text-zinc-500 uppercase mb-1.5">Version</label>
            <input
              type="text"
              className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-2.5 text-xs text-zinc-200 focus:border-cyber-green outline-none"
              placeholder="e.g., 1.0.0"
              value={version}
              onChange={e => setVersion(e.target.value)}
            />
          </div>
        </div>

        {/* Blueprint File/Directory Path */}
        <div>
          <label className="block text-[10px] font-mono text-zinc-500 uppercase mb-1.5">Blueprint Path / Repository URI</label>
          <input
            type="text"
            className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-2.5 text-xs text-zinc-200 focus:border-cyber-green outline-none"
            placeholder="e.g., mcp-blueprints/salesforce-sync"
            value={path}
            onChange={e => setPath(e.target.value)}
          />
        </div>

        {/* Description */}
        <div>
          <label className="block text-[10px] font-mono text-zinc-500 uppercase mb-1.5">Description / Purpose</label>
          <textarea
            className="w-full bg-zinc-950 border border-zinc-800 rounded-lg p-4 font-sans text-xs text-zinc-300 focus:border-cyber-green outline-none h-24 leading-relaxed resize-none"
            placeholder="Describe what data resources this MCP server exposes to the swarm..."
            value={description}
            onChange={e => setDescription(e.target.value)}
          />
        </div>

      </div>

      {/* Footer */}
      <div className="px-6 py-4 border-t border-zinc-800 bg-zinc-950/40 flex justify-end gap-3" style={{ borderColor: 'color-mix(in srgb, var(--color-zinc-800) 40%, transparent)' }}>
        <button
          onClick={onClose}
          className="bg-zinc-900 hover:bg-zinc-800 text-zinc-300 hover:text-white px-5 py-2.5 rounded-lg border border-zinc-800 text-xs font-semibold cursor-pointer transition-colors"
        >
          Cancel
        </button>
        <button
          onClick={handleSave}
          disabled={!name || !category || !path}
          className="bg-cyber-green text-zinc-950 font-bold text-xs px-6 py-2.5 rounded-lg hover:scale-102 transition-all cursor-pointer disabled:opacity-50 disabled:pointer-events-none shadow-md"
        >
          Save Connector
        </button>
      </div>
    </motion.div>
  );
}
