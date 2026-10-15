import { Cpu, ScanSearch, Workflow, ShieldCheck, ArrowUpRight } from 'lucide-react';

// Illustrative topology, rather than a claim that a swarm is running or connected.
export default function SwarmPreview() {
  return (
    <div className="swarm-preview" role="img" aria-label="Example blueprint: research, operations, and human review connected to a shared mission">
      <div className="preview-caption"><span>BLUEPRINT / EXAMPLE TEAM</span><ArrowUpRight className="w-4 h-4" aria-hidden="true" /></div>
      <div className="topology-stage" aria-hidden="true">
        <div className="topology-orbit topology-orbit-outer" /><div className="topology-orbit topology-orbit-inner" />
        <svg className="topology-connections" viewBox="0 0 500 340" fill="none" preserveAspectRatio="none">
          <path d="M250 170V65H350 M250 170H105V105 M250 170V275H365" stroke="currentColor" strokeWidth="1" />
          <path d="M250 170V65H350 M250 170H105V105 M250 170V275H365" stroke="var(--color-cyber-green)" strokeWidth="1" className="topology-signal" />
          <circle cx="250" cy="65" r="3" fill="var(--color-cyber-green)" /><circle cx="105" cy="170" r="3" fill="var(--color-cyber-green)" /><circle cx="250" cy="275" r="3" fill="var(--color-cyber-green)" />
        </svg>
        <div className="topology-core"><Cpu className="w-8 h-8" /><span>YOUR MISSION</span></div>
        <div className="topology-node topology-research"><ScanSearch className="w-4 h-4 text-busy" /><div><strong>Research</strong><span>Discover & understand</span></div><span className="node-port" /></div>
        <div className="topology-node topology-operations"><Workflow className="w-4 h-4 text-cyber-green" /><div><strong>Operations</strong><span>Plan & prepare</span></div><span className="node-port" /></div>
        <div className="topology-node topology-review"><ShieldCheck className="w-4 h-4 text-cyber-green" /><div><strong>Human review</strong><span>You make the call</span></div><span className="node-port" /></div>
        <span className="topology-coordinate">X 0250 / Y 0170</span>
      </div>
      <div className="preview-footer"><span className="status-dot" /><span>Individual expertise. Shared purpose.</span><span className="preview-index">[ 01 — 03 ]</span></div>
    </div>
  );
}
