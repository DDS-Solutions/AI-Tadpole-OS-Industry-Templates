import { Sparkles, Terminal, Layers, ArrowRight, Clock, RotateCcw, ShieldCheck, ArrowUpRight, Check } from 'lucide-react';
import type { ExperienceMode } from '../types';
import type { SavedDraft } from '../utils/draftStorage';
import SwarmPreview from './SwarmPreview';

interface ModeSelectorProps {
  templateCount?: number;
  onSelectMode: (mode: ExperienceMode) => void;
  onBrowseTemplates: () => void;
  savedDraft: SavedDraft | null;
  onResumeDraft: () => void;
  onDiscardDraft: () => void;
}

const SETUP_MODES = [
  {
    mode: 'guided' as const,
    cardClass: 'setup-card-primary',
    Icon: Sparkles,
    audience: 'FOR BUSINESS TEAMS',
    badge: <span className="recommended-badge">RECOMMENDED</span>,
    title: 'Guided Setup',
    description: 'Start with what you want to achieve. We’ll help you find the right specialists and set clear boundaries.',
    features: [
      'Goals into recommended teams',
      'Tools, permissions, and human review',
      'Four clear steps to your blueprint',
    ],
    footerTag: 'NO CODE REQUIRED',
    ctaText: 'Start guided setup',
  },
  {
    mode: 'advanced' as const,
    cardClass: '',
    Icon: Terminal,
    audience: 'FOR BUILDERS & ADMINISTRATORS',
    badge: <span className="text-zinc-500 font-mono text-xs">02</span>,
    title: 'Advanced Setup',
    description: 'Fine-tune every part of your system, from agent instructions to workflows and runtime permissions.',
    features: [
      'Custom agents and model configuration',
      'Workflows and connector definitions',
      'Live validation before export',
    ],
    footerTag: 'FULL CONFIGURATION',
    ctaText: 'Open advanced setup',
  },
];

export default function ModeSelector({ templateCount = 0, onSelectMode, onBrowseTemplates, savedDraft, onResumeDraft, onDiscardDraft }: ModeSelectorProps) {
  return (
    <div className="landing-page">
      <a href="#setup-options" className="skip-link">Skip to setup options</a>
      <header className="landing-nav">
        <a href="#" className="brand-lockup" aria-label="Swarm Architect home">
          <span className="brand-mark" aria-hidden="true"><Layers className="w-5 h-5" /></span>
          <span><strong>SWARM<span className="text-cyber-green">.</span></strong><span className="brand-subtitle">ARCHITECT / AI-TADPOLE-OS</span></span>
        </a>
        <nav aria-label="Main navigation" className="flex items-center gap-3 sm:gap-6">
          <button type="button" onClick={onBrowseTemplates} className="nav-link">Template library <ArrowUpRight className="w-3.5 h-3.5" /></button>
          <a href="https://github.com/DDS-Solutions/AI-Tadpole-OS-Industry-Templates" target="_blank" rel="noopener noreferrer" className="nav-link hidden sm:inline-flex">Source <ArrowUpRight className="w-3.5 h-3.5" /></a>
        </nav>
      </header>
      <main id="main-content">
        {savedDraft && (
          <div className="draft-recovery" role="status">
            <Clock className="w-5 h-5 text-cyber-green shrink-0" aria-hidden="true" />
            <div className="min-w-0 flex-1">
              <p className="text-sm font-medium text-zinc-200">Pick up where you left off</p>
              <p className="text-xs text-zinc-400 break-words">{savedDraft.companyInfo.name || 'Untitled Swarm'} <span className="text-zinc-500">· Saved {new Date(savedDraft.savedAt).toLocaleDateString()}</span></p>
            </div>
            <div className="flex flex-wrap gap-2">
              <button type="button" onClick={onResumeDraft} className="button-primary text-xs">Resume draft <ArrowRight className="w-4 h-4" /></button>
              <button type="button" onClick={onDiscardDraft} className="button-secondary text-xs"><RotateCcw className="w-3.5 h-3.5" /> Discard draft</button>
            </div>
          </div>
        )}
        <section className="landing-hero" aria-labelledby="hero-title">
          <div className="hero-copy">
            <p className="eyebrow"><span className="status-dot" /> YOUR NEXT CHAPTER, COORDINATED</p>
            <h1 id="hero-title">Your vision.<br /><span>An intelligent team.</span></h1>
            <p className="hero-description">Build a team of AI specialists around the way you work. Define your goals, shape your team, and keep people in control.</p>
            <a href="#setup-options" className="hero-anchor">Find your starting point <ArrowRight className="w-4 h-4" /></a>
            <div className="hero-assurances"><span><ShieldCheck className="w-4 h-4" /> Human oversight</span><span><Check className="w-4 h-4" /> Local blueprint storage</span></div>
          </div>
          <SwarmPreview />
        </section>
        <section id="setup-options" aria-labelledby="setup-heading" className="setup-section">
          <div className="section-heading">
            <div><p className="eyebrow">01 / CREATE YOUR BLUEPRINT</p><h2 id="setup-heading">A smarter way to start.</h2></div>
            <p>Two paths. One connected workspace.<br className="hidden sm:block" /> Switch modes as your ideas evolve.</p>
          </div>
          <div className="setup-grid">
            {SETUP_MODES.map(item => (
              <button
                key={item.mode}
                type="button"
                onClick={() => onSelectMode(item.mode)}
                className={`setup-card ${item.cardClass} group`}
              >
                <div className="setup-card-top">
                  <span className="setup-card-label">
                    <item.Icon className="w-4 h-4" /> {item.audience}
                  </span>
                  {item.badge}
                </div>
                <h3>{item.title} <ArrowUpRight className="w-5 h-5" /></h3>
                <p>{item.description}</p>
                <ul className="setup-features">
                  {item.features.map(feature => (
                    <li key={feature}><Check /> {feature}</li>
                  ))}
                </ul>
                <span className="setup-card-footer">
                  <span>{item.footerTag}</span>
                  <span className="setup-cta">{item.ctaText} <ArrowRight className="w-4 h-4" /></span>
                </span>
              </button>
            ))}
          </div>
        </section>
        <section className="template-invitation" aria-label="Industry template library">
          <div className="flex items-start sm:items-center gap-4"><Layers className="w-6 h-6 text-cyber-green shrink-0 mt-1 sm:mt-0" aria-hidden="true" /><div><p className="eyebrow">A HEAD START, BUILT IN</p><h2>Good ideas don’t have to start from zero.</h2><p>Explore {templateCount} industry templates. Make one your own.</p></div></div>
          <button type="button" onClick={onBrowseTemplates} className="button-secondary shrink-0">Explore templates <ArrowUpRight className="w-4 h-4" /></button>
        </section>
      </main>
      <footer className="landing-footer"><span>AI-TADPOLE-OS <span className="text-zinc-600">/</span> SWARM ARCHITECT</span><span className="flex items-center gap-2"><ShieldCheck className="w-3.5 h-3.5 text-cyber-green" /> Credentials stay out of your blueprint.</span></footer>
    </div>
  );
}
