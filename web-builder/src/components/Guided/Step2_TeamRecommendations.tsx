import { useState } from 'react';
import { Users, Shield, Plus, Trash2, Eye, EyeOff, Info, ArrowLeft, ArrowRight, Sparkles } from 'lucide-react';
import type { Agent, RecommendedSpecialist } from '../../types';

interface Step2TeamRecommendationsProps {
  agents: Agent[];
  catalogCount?: number;
  recommendedSpecialists: RecommendedSpecialist[];
  onRegenerateTeam?: () => void;
  onAddSpecialistFromCatalog: () => void;
  onRemoveAgent: (id: string) => void;
  onBack: () => void;
  onNext: () => void;
}

export default function Step2_TeamRecommendations({
  agents,
  catalogCount = 223,
  recommendedSpecialists,
  onRegenerateTeam,
  onAddSpecialistFromCatalog,
  onRemoveAgent,
  onBack,
  onNext,
}: Step2TeamRecommendationsProps) {
  const [showTechnicalDetails, setShowTechnicalDetails] = useState(false);

  return (
    <div className="w-full sovereign-panel p-8 space-y-8 animate-fadeIn">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-cyber-green text-xs font-mono uppercase tracking-wider mb-1">
            <Users className="w-4 h-4" />
            <span>Step 2 of 4: Recommended Team</span>
          </div>
          <h2 className="text-2xl font-bold text-white">Review your recommended AI team</h2>
          <p className="text-sm text-zinc-400 mt-1">
            We selected specialists based on your business goals. Each agent has explicit boundaries and human oversight points.
          </p>
        </div>

        <div className="flex items-center flex-wrap gap-2">
          {onRegenerateTeam && (
            <button
              onClick={onRegenerateTeam}
              className="px-3.5 py-2 rounded-xl bg-zinc-900 border border-zinc-800 hover:border-zinc-700 text-zinc-400 hover:text-cyber-green text-xs font-medium transition-colors flex items-center gap-1.5 cursor-pointer"
              title="Reset team to recommended goals"
            >
              <Sparkles className="w-3.5 h-3.5" /> Re-sync Goals
            </button>
          )}
          <button
            onClick={() => setShowTechnicalDetails(!showTechnicalDetails)}
            className="px-3.5 py-2 rounded-xl bg-zinc-900 border border-zinc-800 hover:border-zinc-700 text-zinc-400 hover:text-zinc-200 text-xs font-medium transition-colors flex items-center gap-1.5 cursor-pointer"
          >
            {showTechnicalDetails ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
            {showTechnicalDetails ? 'Hide details' : 'View details'}
          </button>
          <button
            onClick={onAddSpecialistFromCatalog}
            className="px-4 py-2 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-white text-xs font-semibold transition-all flex items-center gap-1.5 cursor-pointer border border-zinc-700"
          >
            <Plus className="w-3.5 h-3.5 text-cyber-green" /> Add Specialist
          </button>
        </div>
      </div>

      {agents.length === 0 ? (
        <div className="p-12 text-center border border-dashed border-zinc-800 rounded-2xl bg-zinc-950/50 space-y-4">
          <Users className="w-10 h-10 text-zinc-600 mx-auto" />
          <div className="space-y-1">
            <h3 className="text-base font-semibold text-white">No specialists currently selected</h3>
            <p className="text-xs text-zinc-400 max-w-md mx-auto">
              Add a specialist from the {catalogCount}-agent catalog or return to the business brief to regenerate recommendations.
            </p>
          </div>
          <button
            onClick={onAddSpecialistFromCatalog}
            className="px-4 py-2 rounded-xl bg-cyber-green text-zinc-950 text-xs font-semibold hover:bg-cyber-green-light transition-all inline-flex items-center gap-1.5 cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" /> Browse Catalog
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {agents.map((agent) => {
            const spec = recommendedSpecialists.find(s => s.agent.id === agent.id);
            const canRead = spec?.canRead || ['Approved company records & assigned documents'];
            const canPrepare = spec?.canPrepare || ['Draft work documents and status updates'];
            const cannotApprove = spec?.cannotApprove || ['Final external publication without review'];
            const whyReason = agent.recommendationReason || spec?.whyRecommended || 'Added as a domain specialist for your team.';

            return (
              <div
                key={agent.id}
                className="p-6 rounded-2xl bg-zinc-950 border border-zinc-800/80 hover:border-zinc-700 transition-all flex flex-col justify-between space-y-5 relative group"
              >
                <div className="space-y-4">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-zinc-900 border border-zinc-800 flex items-center justify-center text-xl shrink-0">
                        {agent.emoji || '🤖'}
                      </div>
                      <div>
                        <h3 className="text-base font-bold text-white leading-tight">
                          {agent.name}
                        </h3>
                        <p className="text-xs text-cyber-green font-mono mt-0.5">
                          {agent.role}
                        </p>
                      </div>
                    </div>
                    <button
                      onClick={() => onRemoveAgent(agent.id)}
                      aria-label={`Remove ${agent.name}`}
                      className="p-1.5 text-zinc-500 hover:text-red-400 hover:bg-red-950/30 rounded-lg transition-colors cursor-pointer"
                      title="Remove agent"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>

                  {/* Why recommended */}
                  <div className="p-3 rounded-xl bg-zinc-900/70 border border-zinc-800/80 text-xs text-zinc-300 flex items-start gap-2">
                    <Info className="w-3.5 h-3.5 text-cyber-green shrink-0 mt-0.5" />
                    <span className="leading-snug">{whyReason}</span>
                  </div>

                  {/* Operational Boundaries */}
                  <div className="space-y-2 text-xs">
                    <div>
                      <span className="font-semibold text-zinc-400 uppercase tracking-wider text-[10px] block mb-1">
                        Can Read
                      </span>
                      <div className="flex flex-wrap gap-1.5">
                        {canRead.map((item, idx) => (
                          <span key={idx} className="px-2 py-0.5 rounded-md bg-zinc-900 border border-zinc-800 text-zinc-300 text-[11px]">
                            {item}
                          </span>
                        ))}
                      </div>
                    </div>

                    <div>
                      <span className="font-semibold text-zinc-400 uppercase tracking-wider text-[10px] block mb-1">
                        Can Prepare
                      </span>
                      <div className="flex flex-wrap gap-1.5">
                        {canPrepare.map((item, idx) => (
                          <span key={idx} className="px-2 py-0.5 rounded-md bg-zinc-900 border border-zinc-800 text-zinc-300 text-[11px]">
                            {item}
                          </span>
                        ))}
                      </div>
                    </div>

                    <div>
                      <span className="font-semibold text-amber-400/90 uppercase tracking-wider text-[10px] block mb-1">
                        Cannot Approve Independently
                      </span>
                      <div className="flex flex-wrap gap-1.5">
                        {cannotApprove.map((item, idx) => (
                          <span key={idx} className="px-2 py-0.5 rounded-md bg-amber-950/30 border border-amber-900/40 text-amber-300/90 text-[11px]">
                            {item}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* Technical Details Preview (if toggled) */}
                  {showTechnicalDetails && (
                    <div className="p-3 rounded-xl bg-zinc-900 border border-zinc-800 space-y-2 pt-2 text-xs font-mono">
                      <div className="text-zinc-400 text-[11px]">
                        <span className="text-zinc-500">ID:</span> {agent.id} | <span className="text-zinc-500">Model:</span> {agent.model}
                      </div>
                      <div className="text-zinc-400 text-[11px]">
                        <span className="text-zinc-500">Capabilities:</span> {agent.skills?.join(', ') || 'read_file'}
                      </div>
                      <div className="text-zinc-300 text-[11px] bg-zinc-950 p-2 rounded border border-zinc-800/80 max-h-24 overflow-y-auto leading-relaxed">
                        {agent.prompt}
                      </div>
                    </div>
                  )}
                </div>

                {/* Oversight Badge */}
                <div className="pt-3 border-t border-zinc-900 flex items-center justify-between">
                  <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-cyber-green/10 border border-cyber-green/30 text-cyber-green text-[11px] font-medium">
                    <Shield className="w-3 h-3" />
                    <span>Human Approval Required</span>
                  </div>
                  <span className="text-xs text-zinc-500 font-mono">State: Idle</span>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Navigation Footer */}
      <div className="pt-6 border-t border-zinc-800/80 flex items-center justify-between">
        <button
          onClick={onBack}
          className="px-5 py-2.5 rounded-xl bg-zinc-900 hover:bg-zinc-800 text-zinc-300 text-sm font-medium transition-colors flex items-center gap-2 cursor-pointer border border-zinc-800"
        >
          <ArrowLeft className="w-4 h-4" /> Back to Business Brief
        </button>

        <button
          onClick={onNext}
          disabled={agents.length === 0}
          className={`px-6 py-3 rounded-xl font-semibold text-sm transition-all flex items-center gap-2 cursor-pointer shadow-md ${
            agents.length > 0
              ? 'bg-cyber-green hover:bg-cyber-green-light text-zinc-950 shadow-cyber-green/20'
              : 'bg-zinc-800 text-zinc-500 cursor-not-allowed'
          }`}
        >
          Next: Tools & Approvals <ArrowRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}
