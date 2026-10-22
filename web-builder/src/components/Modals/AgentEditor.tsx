import { useId, useState } from 'react';
import { Sliders, Shield, Terminal, FileText, AlertTriangle } from 'lucide-react';
import { motion, useReducedMotion } from 'framer-motion';
import { useDialog, getModalMotionProps } from './useDialog';
import { DialogHeader } from './DialogHeader';
import { DialogFooter } from './DialogFooter';
import type { Agent } from '../../types';
import { CANONICAL_CAPABILITIES, type CapabilityItem } from '../../constants/capabilities';

interface AgentEditorProps {
  agent: Agent;
  onClose: () => void;
  onSave: (updatedAgent: Agent) => void;
}

export default function AgentEditor({ agent, onClose, onSave }: AgentEditorProps) {
  const dialogRef = useDialog<HTMLFormElement>(onClose);
  const fieldId = useId();
  const reducedMotion = useReducedMotion();
  const [name, setName] = useState(agent.name);
  const [role, setRole] = useState(agent.role);
  const [model, setModel] = useState(agent.model);
  const [prompt, setPrompt] = useState(agent.prompt);
  const [description, setDescription] = useState(agent.description || '');
  const [department, setDepartment] = useState(agent.department || 'Operations');
  const [emoji, setEmoji] = useState(agent.emoji || '🤖');
  const [color, setColor] = useState(agent.color || '#3B82F6');
  const [selectedSkills, setSelectedSkills] = useState<string[]>(
    agent.skills && agent.skills.length > 0 ? agent.skills : ['read_file'],
  );
  const [mcpTools, setMcpTools] = useState((agent.mcpTools || []).join(', '));
  const [requiresOversight, setRequiresOversight] = useState(agent.requiresOversight || false);

  const dangerousSkillSelected = selectedSkills.some(value =>
    ['write_file', 'delete_file', 'execute_shell', 'shell', 'terminal'].includes(value),
  );

  const toggleCapability = (cap: CapabilityItem) => {
    const isSelected = selectedSkills.includes(cap.id);
    let nextSkills: string[];

    if (isSelected) {
      nextSkills = selectedSkills.filter(id => id !== cap.id);
      if (cap.companionMarker) {
        nextSkills = nextSkills.filter(id => id !== cap.companionMarker);
      }
    } else {
      nextSkills = [...selectedSkills, cap.id];
      if (cap.companionMarker && !nextSkills.includes(cap.companionMarker)) {
        nextSkills.push(cap.companionMarker);
      }
    }
    setSelectedSkills(nextSkills);
  };

  const validColor = /^#[0-9a-f]{6}$/i.test(color);
  const activeCapabilityCount = CANONICAL_CAPABILITIES.filter(cap => selectedSkills.includes(cap.id)).length;
  const canSave = Boolean(name.trim() && role.trim() && department.trim() && description.trim() && prompt.trim() && prompt.length <= 800 && validColor);

  const handleSave = () => {
    if (!canSave) return;
    onSave({
      ...agent,
      name: name.trim(),
      role: role.trim(),
      model,
      prompt,
      description: description.trim(),
      department: department.trim(),
      emoji,
      color,
      skills: selectedSkills,
      mcpTools: mcpTools.split(',').map(value => value.trim()).filter(Boolean),
      requiresOversight: requiresOversight || dangerousSkillSelected,
      vibe: agent.vibe,
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
      className="sovereign-panel w-full max-w-3xl h-[85dvh] max-h-[calc(100dvh-2rem)] flex flex-col bg-zinc-900 border-zinc-800 p-0 overflow-hidden"
    >
      <DialogHeader
        id={`${fieldId}-title`}
        summaryId={`${fieldId}-summary`}
        title="Configure Agent Prompt"
        summary="Name, role, department, description, and instructions are required."
        icon={<Sliders className="w-5 h-5 shrink-0 text-cyber-green" style={{ color: validColor ? color : undefined }} />}
        onClose={onClose}
        closeAriaLabel="Close agent editor"
        borderColor="color-mix(in srgb, var(--color-zinc-800) 40%, transparent)"
      />

      {/* Scrollable Form Body */}
      <div className="flex-1 min-h-0 overflow-y-auto custom-scrollbar p-4 sm:p-6 space-y-6">

        {/* Name, Emoji, Color Group */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label htmlFor={`${fieldId}-name`} className="block text-[10px] font-mono text-zinc-400 uppercase mb-1.5">Agent Name</label>
            <input
              type="text"
              className="focus-sovereign w-full min-w-0 bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-2.5 text-base sm:text-xs text-zinc-200 focus:border-cyber-green outline-none"
              id={`${fieldId}-name`}
              data-dialog-initial-focus
              required
              value={name}
              onChange={e => setName(e.target.value)}
            />
          </div>
          <div>
            <label htmlFor={`${fieldId}-emoji`} className="block text-[10px] font-mono text-zinc-400 uppercase mb-1.5">Emoji Icon</label>
            <input
              type="text"
              maxLength={16}
              className="focus-sovereign w-full min-w-0 bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-2.5 text-base sm:text-xs text-zinc-200 text-center focus:border-cyber-green outline-none"
              id={`${fieldId}-emoji`}
              value={emoji}
              onChange={e => setEmoji(e.target.value)}
            />
          </div>
          <div>
            <label htmlFor={`${fieldId}-color`} className="block text-[10px] font-mono text-zinc-400 uppercase mb-1.5">Accent Hex Color</label>
            <div className="flex gap-2 items-center">
              <input
                type="color"
                aria-label="Choose agent accent color"
                className="focus-sovereign shrink-0 w-11 h-11 bg-zinc-950 border border-zinc-800 rounded cursor-pointer p-0.5"
                value={validColor ? color : "#22c55e"}
                onChange={e => setColor(e.target.value)}
              />
              <input
                type="text"
                id={`${fieldId}-color`}
                aria-invalid={!validColor}
                aria-describedby={!validColor ? `${fieldId}-color-error` : undefined}
                pattern="#[0-9a-fA-F]{6}"
                className="focus-sovereign flex-1 min-w-0 bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-2.5 text-base sm:text-xs text-zinc-200 font-mono focus:border-cyber-green outline-none"
                value={color}
                onChange={e => setColor(e.target.value)}
              />
            </div>
            {!validColor && <p id={`${fieldId}-color-error`} className="mt-1.5 text-xs text-danger">Use a six-digit hex color, such as #22c55e.</p>}
          </div>
        </div>

        {/* Role, Department, Model Group */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label htmlFor={`${fieldId}-role`} className="block text-[10px] font-mono text-zinc-400 uppercase mb-1.5">Role / Vibe</label>
            <input
              type="text"
              className="focus-sovereign w-full min-w-0 bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-2.5 text-base sm:text-xs text-zinc-200 focus:border-cyber-green outline-none"
              placeholder="e.g. Frontend UI Engineer"
              id={`${fieldId}-role`}
              required
              value={role}
              onChange={e => setRole(e.target.value)}
            />
          </div>
          <div>
            <label htmlFor={`${fieldId}-department`} className="block text-[10px] font-mono text-zinc-400 uppercase mb-1.5">Department</label>
            <input
              type="text"
              className="focus-sovereign w-full min-w-0 bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-2.5 text-base sm:text-xs text-zinc-200 focus:border-cyber-green outline-none"
              placeholder="e.g. Engineering"
              id={`${fieldId}-department`}
              required
              value={department}
              onChange={e => setDepartment(e.target.value)}
            />
          </div>
          <div>
            <label htmlFor={`${fieldId}-model`} className="block text-[10px] font-mono text-zinc-400 uppercase mb-1.5">LLM Model</label>
            <select
              className="focus-sovereign w-full min-w-0 bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-2.5 text-base sm:text-xs text-zinc-200 focus:border-cyber-green outline-none cursor-pointer"
              id={`${fieldId}-model`}
              value={model}
              onChange={e => setModel(e.target.value)}
            >
              {!["gemma4:31b", "gemini-1.5-flash", "gemini-1.5-pro", "gemini-2.0-flash", "gemini-2.5-pro", "gemini-pro-latest"].includes(model) && (
                <option value={model}>{model} (Current model)</option>
              )}
              <option value="gemma4:31b">gemma4:31b (Default, Open Sovereign)</option>
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
          <label htmlFor={`${fieldId}-description`} className="block text-[10px] font-mono text-zinc-400 uppercase mb-1.5">Short Description / Purpose</label>
          <input
            type="text"
            className="focus-sovereign w-full min-w-0 bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-2.5 text-base sm:text-xs text-zinc-200 focus:border-cyber-green outline-none"
            placeholder="Describe what this agent handles within the swarm..."
            id={`${fieldId}-description`}
            required
            value={description}
            onChange={e => setDescription(e.target.value)}
          />
        </div>

        {/* Controlled Runtime Capabilities Selector */}
        <div>
          <div className="flex justify-between items-center mb-2">
            <h4 className="block text-[10px] font-mono text-zinc-400 uppercase">
              Runtime capabilities
            </h4>
            <span className="text-[10px] text-zinc-500">
              {activeCapabilityCount} {activeCapabilityCount === 1 ? 'capability' : 'capabilities'} active
            </span>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2">
            {CANONICAL_CAPABILITIES.map(cap => {
              const active = selectedSkills.includes(cap.id);
              const isDangerous = cap.risk === 'dangerous';
              const isMutating = cap.risk === 'mutating';

              let badgeColor = 'border-emerald-900/40 bg-emerald-950/20 text-emerald-300';
              if (isMutating) badgeColor = 'border-amber-900/40 bg-amber-950/20 text-amber-300';
              if (isDangerous) badgeColor = 'border-rose-900/40 bg-rose-950/20 text-rose-300';

              return (
                <button
                  key={cap.id}
                  type="button"
                  onClick={() => toggleCapability(cap)}
                  aria-pressed={active}
                  className={`focus-sovereign p-2.5 rounded-lg border text-left transition-all cursor-pointer flex flex-col justify-between ${
                    active
                      ? `${badgeColor} border-current shadow-sm`
                      : 'border-zinc-800 bg-zinc-950/40 text-zinc-400 hover:border-zinc-700'
                  }`}
                >
                  <span className="flex items-center justify-between gap-1 mb-1">
                    <span className="text-xs font-semibold flex items-center gap-1.5">
                      {isDangerous ? (
                        <Terminal className="w-3.5 h-3.5 text-rose-400" />
                      ) : isMutating ? (
                        <AlertTriangle className="w-3.5 h-3.5 text-amber-400" />
                      ) : (
                        <FileText className="w-3.5 h-3.5 text-emerald-400" />
                      )}
                      {cap.label}
                    </span>
                    <span className={`text-[9px] font-mono uppercase px-1.5 py-0.5 rounded ${
                      active ? 'bg-zinc-900/80 font-bold' : 'text-zinc-600'
                    }`}>
                      {cap.risk}
                    </span>
                  </span>
                  <span className="block text-[10px] text-zinc-500 leading-tight">{cap.description}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* MCP Tools Input */}
        <div>
          <label htmlFor={`${fieldId}-mcpTools`} className="block text-[10px] font-mono text-zinc-400 uppercase mb-1.5">Declared MCP Tool IDs</label>
          <input
            type="text"
            className="focus-sovereign w-full min-w-0 bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-2.5 text-base sm:text-xs text-zinc-200 font-mono focus:border-cyber-green outline-none"
            placeholder="crm:get_contact, accounting:get_invoice"
            id={`${fieldId}-mcpTools`}
              value={mcpTools}
            onChange={e => setMcpTools(e.target.value)}
          />
          <p className="text-[10px] text-zinc-600 mt-1.5">Forward-compatible declarations stored in agent profiles.</p>
        </div>

        <label className="flex items-start gap-3 p-4 rounded-lg border border-zinc-800 bg-zinc-950/50 cursor-pointer">
          <input
            type="checkbox"
            className="focus-sovereign mt-0.5 accent-cyber-green"
            checked={requiresOversight || dangerousSkillSelected}
            disabled={dangerousSkillSelected}
            onChange={e => setRequiresOversight(e.target.checked)}
          />
          <span>
            <span className="block text-xs font-semibold text-zinc-200 flex items-center gap-1.5">
              <Shield className="w-4 h-4 text-cyber-green" /> Require operator oversight
            </span>
            <span className="block text-[10px] text-zinc-500 mt-1">
              Swarm Architect forces this on when mutating, delete, or shell capabilities are active.
            </span>
          </span>
        </label>

        {/* System Prompt Codeblock */}
        <div className="flex flex-col flex-1 min-h-[300px]">
          <div className="flex justify-between items-center mb-1.5">
            <label htmlFor={`${fieldId}-prompt`} className="block text-[10px] font-mono text-zinc-400 uppercase">System Prompt / Instructions</label>
            <span id={`${fieldId}-prompt-count`} className={`text-[9px] font-mono ${prompt.length > 800 ? 'text-rose-500 font-bold' : 'text-zinc-500'}`}>{prompt.length}/800</span>
          </div>
          <textarea
            className="focus-sovereign w-full flex-1 bg-zinc-950 border border-zinc-800 rounded-lg p-4 font-mono text-base sm:text-[11px] text-zinc-300 focus:border-cyber-green outline-none min-h-[320px] leading-relaxed resize-y custom-scrollbar"
            placeholder="Write your custom system instructions here..."
            id={`${fieldId}-prompt`}
            required
            aria-describedby={`${fieldId}-prompt-count`}
            aria-invalid={prompt.length > 800}
            value={prompt}
            onChange={e => setPrompt(e.target.value)}
          />
        </div>

      </div>

      <DialogFooter onCancel={onClose} canSave={canSave} />
    </motion.form>
  );
}
