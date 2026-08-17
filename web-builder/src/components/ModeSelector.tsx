import { Sparkles, Terminal, Layers, ArrowRight, Clock, RotateCcw, ShieldCheck } from 'lucide-react';
import type { ExperienceMode } from '../types';
import type { SavedDraft } from '../utils/draftStorage';

interface ModeSelectorProps {
  templateCount?: number;
  onSelectMode: (mode: ExperienceMode) => void;
  onBrowseTemplates: () => void;
  savedDraft: SavedDraft | null;
  onResumeDraft: () => void;
  onDiscardDraft: () => void;
}

export default function ModeSelector({
  templateCount = 69,
  onSelectMode,
  onBrowseTemplates,
  savedDraft,
  onResumeDraft,
  onDiscardDraft,
}: ModeSelectorProps) {
  return (
    <div className="w-full max-w-5xl mx-auto py-12 px-4 space-y-8 animate-fadeIn">
      {savedDraft && (
        <div className="p-4 rounded-xl bg-cyber-green/10 border border-cyber-green/30 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3 text-sm text-zinc-300">
            <Clock className="w-5 h-5 text-cyber-green shrink-0" />
            <div>
              <span className="font-semibold text-white">Saved draft found</span> for{' '}
              <span className="text-cyber-green font-mono">{savedDraft.companyInfo.name || 'Untitled Swarm'}</span>{' '}
              <span className="text-zinc-500 text-xs">
                ({new Date(savedDraft.savedAt).toLocaleDateString()} {new Date(savedDraft.savedAt).toLocaleTimeString()})
              </span>
            </div>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <button
              type="button"
              onClick={onResumeDraft}
              className="px-4 py-1.5 rounded-lg bg-cyber-green text-zinc-950 text-xs font-semibold hover:bg-cyber-green-light transition-all flex items-center gap-1.5 cursor-pointer shadow-sm focus:outline-none focus:ring-2 focus:ring-cyber-green/50"
            >
              Resume Draft <ArrowRight className="w-3.5 h-3.5" />
            </button>
            <button
              type="button"
              onClick={onDiscardDraft}
              className="px-3 py-1.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-400 hover:text-zinc-200 text-xs font-medium transition-all flex items-center gap-1 cursor-pointer focus:outline-none focus:ring-2 focus:ring-zinc-600"
            >
              <RotateCcw className="w-3 h-3" /> Start Fresh
            </button>
          </div>
        </div>
      )}

      <div className="text-center space-y-3">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-zinc-800/80 border border-zinc-700 text-zinc-300 text-xs font-mono">
          <Sparkles className="w-3.5 h-3.5 text-cyber-green" />
          <span>AI-Tadpole-OS Swarm Architect</span>
        </div>
        <h1 className="text-3xl sm:text-4xl font-bold tracking-tight text-white">
          Choose your setup experience
        </h1>
        <p className="text-zinc-400 text-sm sm:text-base max-w-2xl mx-auto">
          Design, review, and export production-ready multi-agent AI swarms compatible with AI-Tadpole-OS runtime.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4">
        {/* Guided Setup Card */}
        <button
          type="button"
          onClick={() => onSelectMode('guided')}
          className="group relative p-8 rounded-2xl bg-zinc-900/80 border-2 border-cyber-green/40 hover:border-cyber-green transition-all duration-200 flex flex-col justify-between cursor-pointer hover:shadow-lg hover:shadow-cyber-green/10 text-left focus:outline-none focus:ring-2 focus:ring-cyber-green/50"
        >
          <div className="absolute top-4 right-4 px-2.5 py-0.5 rounded-full bg-cyber-green text-zinc-950 text-xs font-bold font-mono">
            RECOMMENDED
          </div>
          <div className="space-y-4">
            <div className="w-12 h-12 rounded-xl bg-cyber-green/20 border border-cyber-green/40 flex items-center justify-center text-cyber-green">
              <Sparkles className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-white group-hover:text-cyber-green transition-colors">
                Guided Setup
              </h2>
              <p className="text-xs font-mono text-zinc-400 uppercase mt-0.5">
                Business Owners & Operators
              </p>
            </div>
            <p className="text-sm text-zinc-300 leading-relaxed">
              Build a ready-to-review AI team without configuring technical details. Describe your business goals, review recommended specialists, connect tools, and understand human approval safeguards.
            </p>
            <ul className="space-y-2 pt-2 text-xs text-zinc-400">
              <li className="flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-cyber-green"></span>
                Plain-language 4-step workflow
              </li>
              <li className="flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-cyber-green"></span>
                Recommended teams with oversight reasons
              </li>
              <li className="flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-cyber-green"></span>
                Business tool connections & governance policies
              </li>
            </ul>
          </div>
          <div className="pt-6 mt-4 border-t border-zinc-800 flex items-center justify-between w-full">
            <span className="text-xs font-mono text-cyber-green">Ready in 5 minutes</span>
            <span className="inline-flex items-center gap-1.5 text-xs font-bold text-cyber-green group-hover:translate-x-1 transition-transform">
              Start Guided Setup <ArrowRight className="w-4 h-4" />
            </span>
          </div>
        </button>

        {/* Advanced Setup Card */}
        <button
          type="button"
          onClick={() => onSelectMode('advanced')}
          className="group relative p-8 rounded-2xl bg-zinc-900/80 border border-zinc-800 hover:border-zinc-600 transition-all duration-200 flex flex-col justify-between cursor-pointer hover:shadow-lg hover:shadow-zinc-800/50 text-left focus:outline-none focus:ring-2 focus:ring-zinc-500"
        >
          <div className="space-y-4">
            <div className="w-12 h-12 rounded-xl bg-zinc-800 border border-zinc-700 flex items-center justify-center text-zinc-300">
              <Terminal className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-white group-hover:text-zinc-200 transition-colors">
                Advanced Setup
              </h2>
              <p className="text-xs font-mono text-zinc-500 uppercase mt-0.5">
                Developers & Tadpole Administrators
              </p>
            </div>
            <p className="text-sm text-zinc-400 leading-relaxed">
              Configure agent instructions, runtime permissions, model parameters, structured playbooks, MCP declarations, and package metadata with live contract diagnostics.
            </p>
            <ul className="space-y-2 pt-2 text-xs text-zinc-500">
              <li className="flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-zinc-600"></span>
                Granular system prompts & &le;800 char validation
              </li>
              <li className="flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-zinc-600"></span>
                Runtime capabilities & MCP server definitions
              </li>
              <li className="flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-zinc-600"></span>
                Structured & raw Markdown playbook editors
              </li>
            </ul>
          </div>
          <div className="pt-6 mt-4 border-t border-zinc-800 flex items-center justify-between w-full">
            <span className="text-xs font-mono text-zinc-500">Full technical control</span>
            <span className="inline-flex items-center gap-1.5 text-xs font-bold text-zinc-400 group-hover:text-white group-hover:translate-x-1 transition-all">
              Start Advanced Setup <ArrowRight className="w-4 h-4" />
            </span>
          </div>
        </button>
      </div>

      {/* Pre-built Templates Option */}
      <div className="p-6 rounded-2xl bg-zinc-900/40 border border-zinc-800/80 flex flex-col sm:flex-row items-center justify-between gap-4 text-center sm:text-left">
        <div className="flex items-center gap-4">
          <div className="w-10 h-10 rounded-lg bg-zinc-800 flex items-center justify-center text-zinc-400 shrink-0">
            <Layers className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-white">Prefer to start from a pre-built industry template?</h3>
            <p className="text-xs text-zinc-400">Explore {templateCount} verified industry swarms across healthcare, field services, wholesale, legal, and more.</p>
          </div>
        </div>
        <button
          type="button"
          onClick={onBrowseTemplates}
          className="px-5 py-2.5 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-200 text-xs font-semibold transition-all shrink-0 cursor-pointer border border-zinc-700 focus:outline-none focus:ring-2 focus:ring-zinc-500"
        >
          Browse {templateCount} Templates
        </button>
      </div>

      {/* Privacy & Storage Disclosure */}
      <div className="flex items-center justify-center gap-2 text-zinc-500 text-xs font-mono text-center max-w-xl mx-auto">
        <ShieldCheck className="w-4 h-4 text-cyber-green/70 shrink-0" />
        <span>Connector credential fields are not stored in browser drafts. Avoid placing sensitive API keys or credentials directly in blueprint text.</span>
      </div>
    </div>
  );
}
