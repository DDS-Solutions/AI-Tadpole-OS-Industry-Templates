import { useState } from 'react';
import { Sliders, X } from 'lucide-react';
import { motion } from 'framer-motion';
import type { Agent } from '../../types';

interface AgentEditorProps {
  agent: Agent;
  onClose: () => void;
  onSave: (updatedAgent: Agent) => void;
}

export default function AgentEditor({ agent, onClose, onSave }: AgentEditorProps) {
  const [name, setName] = useState(agent.name);
  const [role, setRole] = useState(agent.role);
  const [model, setModel] = useState(agent.model);
  const [prompt, setPrompt] = useState(agent.prompt);
  const [description, setDescription] = useState(agent.description || '');
  const [emoji, setEmoji] = useState(agent.emoji || '🤖');
  const [color, setColor] = useState(agent.color || '#3B82F6');

  const handleSave = () => {
    onSave({
      ...agent,
      name,
      role,
      model,
      prompt,
      description,
      emoji,
      color,
      vibe: agent.vibe
    });
  };

  return (
    <motion.div
      initial={{ scale: 0.95, y: 15 }}
      animate={{ scale: 1, y: 0 }}
      exit={{ scale: 0.95, y: 15 }}
      transition={{ type: "spring", stiffness: 350, damping: 25 }}
      className="sovereign-panel w-full max-w-3xl h-[85vh] flex flex-col bg-zinc-900 border-zinc-800 p-0 overflow-hidden"
    >
      {/* Header */}
      <div className="flex justify-between items-center px-6 py-4 border-b border-zinc-850" style={{ borderColor: 'color-mix(in srgb, var(--color-zinc-800) 40%, transparent)' }}>
        <div>
          <h3 className="text-lg font-bold text-white flex items-center gap-2">
            <Sliders className="w-5 h-5 text-cyber-green" style={{ color: color }} /> Configure Agent Prompt
          </h3>
          <p className="text-xs text-zinc-500 mt-0.5">Define your agent's identity, model configuration, and system prompt constraints.</p>
        </div>
        <button
          onClick={onClose}
          className="p-1.5 text-zinc-500 hover:text-white rounded hover:bg-zinc-805 transition-all cursor-pointer"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* Scrollable Form Body */}
      <div className="flex-1 overflow-y-auto custom-scrollbar p-6 space-y-6">
        
        {/* Name, Emoji, Color Group */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-[10px] font-mono text-zinc-500 uppercase mb-1.5">Agent Name</label>
            <input
              type="text"
              className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-2.5 text-xs text-zinc-200 focus:border-cyber-green outline-none"
              value={name}
              onChange={e => setName(e.target.value)}
            />
          </div>
          <div>
            <label className="block text-[10px] font-mono text-zinc-500 uppercase mb-1.5">Emoji Icon</label>
            <input
              type="text"
              maxLength={2}
              className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-2.5 text-xs text-zinc-200 text-center focus:border-cyber-green outline-none"
              value={emoji}
              onChange={e => setEmoji(e.target.value)}
            />
          </div>
          <div>
            <label className="block text-[10px] font-mono text-zinc-500 uppercase mb-1.5">Accented Hex Color</label>
            <div className="flex gap-2 items-center">
              <input
                type="color"
                className="w-10 h-9 bg-zinc-950 border border-zinc-800 rounded cursor-pointer p-0.5"
                value={color}
                onChange={e => setColor(e.target.value)}
              />
              <input
                type="text"
                className="flex-1 bg-zinc-950 border border-zinc-805 rounded-lg px-3 py-2.5 text-xs text-zinc-200 font-mono focus:border-cyber-green outline-none"
                value={color}
                onChange={e => setColor(e.target.value)}
              />
            </div>
          </div>
        </div>

        {/* Role, Model Group */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-[10px] font-mono text-zinc-500 uppercase mb-1.5">Role / Vibe</label>
            <input
              type="text"
              className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-2.5 text-xs text-zinc-200 focus:border-cyber-green outline-none"
              placeholder="e.g. Frontend UI Engineer"
              value={role}
              onChange={e => setRole(e.target.value)}
            />
          </div>
          <div>
            <label className="block text-[10px] font-mono text-zinc-500 uppercase mb-1.5">LLM Model</label>
            <select
              className="w-full bg-zinc-950 border border-zinc-805 rounded-lg px-3 py-2.5 text-xs text-zinc-200 focus:border-cyber-green outline-none cursor-pointer"
              value={model}
              onChange={e => setModel(e.target.value)}
            >
              <option value="gemini-1.5-flash">gemini-1.5-flash (Fast, Edge Ops)</option>
              <option value="gemini-1.5-pro">gemini-1.5-pro (Reasoning, Knowledge Work)</option>
              <option value="gemini-2.0-flash">gemini-2.0-flash (High speed agentics)</option>
              <option value="gemini-2.5-pro">gemini-2.5-pro (State of the art reasoning)</option>
              <option value="gemini-pro-latest">gemini-pro-latest</option>
            </select>
          </div>
        </div>

        {/* Short Description */}
        <div>
          <label className="block text-[10px] font-mono text-zinc-500 uppercase mb-1.5">Short Description / Purpose</label>
          <input
            type="text"
            className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-2.5 text-xs text-zinc-200 focus:border-cyber-green outline-none"
            placeholder="Describe what this agent handles within the swarm..."
            value={description}
            onChange={e => setDescription(e.target.value)}
          />
        </div>

        {/* System Prompt Codeblock */}
        <div className="flex flex-col flex-1 min-h-[300px]">
          <div className="flex justify-between items-center mb-1.5">
            <label className="block text-[10px] font-mono text-zinc-500 uppercase">System Prompt / Instructions</label>
            <span className="text-[9px] text-zinc-650 font-mono">Accepts Markdown</span>
          </div>
          <textarea
            className="w-full flex-1 bg-zinc-950 border border-zinc-800 rounded-lg p-4 font-mono text-[11px] text-zinc-300 focus:border-cyber-green outline-none min-h-[320px] leading-relaxed resize-y custom-scrollbar"
            placeholder="Write your custom system instructions here..."
            value={prompt}
            onChange={e => setPrompt(e.target.value)}
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
          disabled={!name || !role || !prompt}
          className="bg-cyber-green text-zinc-950 font-bold text-xs px-6 py-2.5 rounded-lg hover:scale-102 transition-all cursor-pointer disabled:opacity-50 disabled:pointer-events-none shadow-md"
          style={{ backgroundColor: color, color: '#09090b' }}
        >
          Save Configuration
        </button>
      </div>
    </motion.div>
  );
}
