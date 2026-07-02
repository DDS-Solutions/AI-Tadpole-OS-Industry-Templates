import { Globe, Zap, Shield } from 'lucide-react';
import { motion } from 'framer-motion';
import { INDUSTRY_CODES_MAP } from '../../constants';
import type { TemplateItem } from '../../types';

interface Industry {
  name: string;
  path: string;
  keywords: string[];
}

interface CompanyInfo {
  name: string;
  size: string;
  description: string;
  mission: string;
  industry: string;
  industryPath: string;
  industryCode: string;
}

interface Step1Props {
  companyInfo: CompanyInfo;
  setCompanyInfo: (info: CompanyInfo) => void;
  dynamicIndustries: Industry[];
  dynamicRegistry: TemplateItem[];
  selectedTemplateId: string | null;
  setSelectedTemplateId: (id: string | null) => void;
  isCustomIndustry: boolean;
  setIsCustomIndustry: (val: boolean) => void;
  customIndustryName: string;
  setCustomIndustryName: (val: string) => void;
  customIndustryPath: string;
  setCustomIndustryPath: (val: string) => void;
  showCustomCodeInput: boolean;
  setShowCustomCodeInput: (val: boolean) => void;
  onAiAssist: () => void;
  onLoadSwarmDetails: (path: string) => void;
  onNext: () => void;
}

export default function Step1_CompanyMission({
  companyInfo,
  setCompanyInfo,
  dynamicIndustries,
  dynamicRegistry,
  selectedTemplateId,
  setSelectedTemplateId,
  isCustomIndustry,
  setIsCustomIndustry,
  customIndustryName,
  setCustomIndustryName,
  customIndustryPath,
  setCustomIndustryPath,
  showCustomCodeInput,
  setShowCustomCodeInput,
  onAiAssist,
  onLoadSwarmDetails,
  onNext
}: Step1Props) {
  return (
    <motion.div 
      key="step1"
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      data-tooltip="Phase 1: Configures your organization's metadata, NAICS/SIC industry code classification, and target directory paths."
      className="w-full sovereign-panel p-8"
    >
      <div className="flex items-center gap-2 mb-6 text-cyber-green">
        <Globe className="w-5 h-5" />
        <h2 className="font-bold text-lg" data-tooltip="The baseline settings of the swarm identity and directory path settings.">Phase 1: The Pulse</h2>
      </div>
      
      <div className="space-y-6">
        <div>
          <label className="block text-xs font-mono uppercase text-zinc-500 mb-2 cursor-help" data-tooltip="Specify the primary organization or business name associated with this multi-agent swarm blueprint.">Company / Swarm Name</label>
          <input 
            className="w-full bg-zinc-950 border border-zinc-800 rounded-lg p-3 focus:border-cyber-green outline-none transition-colors text-zinc-300"
            placeholder="e.g. My Enterprise Swarm"
            value={companyInfo.name}
            onChange={e => setCompanyInfo({...companyInfo, name: e.target.value})}
          />
        </div>

        {isCustomIndustry && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 p-4 bg-zinc-950 border border-zinc-800 rounded-lg">
            <div>
              <label className="block text-xs font-mono uppercase text-zinc-500 mb-2 cursor-help" data-tooltip="Set the custom industry sector label if not matching the pre-defined catalog options.">Custom Industry Name</label>
              <input 
                className="w-full bg-zinc-900 border border-zinc-800 rounded-lg p-3 focus:border-cyber-green outline-none transition-colors text-zinc-300"
                placeholder="e.g. Biotech Research"
                value={customIndustryName}
                onChange={e => {
                  setCustomIndustryName(e.target.value);
                  const autoPath = e.target.value.toLowerCase().replace(/ & /g, '-').replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');
                  setCustomIndustryPath(autoPath);
                  setCompanyInfo({
                    ...companyInfo,
                    industry: e.target.value,
                    industryPath: autoPath
                  });
                }}
              />
            </div>
            <div>
              <label className="block text-xs font-mono uppercase text-zinc-500 mb-2 cursor-help" data-tooltip="The relative directory name that will store agent configuration profiles inside the repository.">Custom Target Directory Path</label>
              <input 
                className="w-full bg-zinc-900 border border-zinc-800 rounded-lg p-3 focus:border-cyber-green outline-none transition-colors text-zinc-300"
                placeholder="e.g. biotech"
                value={customIndustryPath}
                onChange={e => {
                  setCustomIndustryPath(e.target.value);
                  setCompanyInfo({
                    ...companyInfo,
                    industryPath: e.target.value
                  });
                }}
              />
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-xs font-mono uppercase text-zinc-500 mb-2 cursor-help" data-tooltip="Choose from pre-defined industry templates to populate standard playbook steps and agent configurations.">Industry / Sector</label>
            <select 
              className="w-full bg-zinc-950 border border-zinc-800 rounded-lg p-3 focus:border-cyber-green outline-none text-zinc-300 cursor-pointer"
              value={isCustomIndustry ? "CUSTOM" : companyInfo.industry}
              onChange={e => {
                if (e.target.value === "CUSTOM") {
                  setIsCustomIndustry(true);
                  setCompanyInfo({
                    ...companyInfo,
                    industry: customIndustryName,
                    industryPath: customIndustryPath
                  });
                } else {
                  setIsCustomIndustry(false);
                  const match = dynamicIndustries.find(i => i.name === e.target.value);
                  const defaultCode = e.target.value ? (INDUSTRY_CODES_MAP[e.target.value]?.[0]?.code || '') : '';
                  setShowCustomCodeInput(false);
                  setCompanyInfo({
                    ...companyInfo,
                    industry: e.target.value,
                    industryPath: match?.path || '',
                    industryCode: defaultCode
                  });
                }
              }}
            >
              <option value="">Select Industry...</option>
              {dynamicIndustries.map(i => (
                <option key={i.path} value={i.name}>{i.name}</option>
              ))}
              <option value="CUSTOM">+ Add Custom Industry...</option>
            </select>
          </div>
          <div>
            <label className="block text-xs font-mono uppercase text-zinc-500 mb-2 cursor-help" data-tooltip="Standardized industry registry code (North American Industry Classification System) for template matching.">NAICS / SIC Code</label>
            {(() => {
              const codes = INDUSTRY_CODES_MAP[companyInfo.industry] || [];
              const isCodeCustom = companyInfo.industryCode !== '' && !codes.some(c => c.code === companyInfo.industryCode);
              const showInput = codes.length === 0 || showCustomCodeInput || isCodeCustom;

              if (companyInfo.industry && codes.length > 0) {
                return (
                  <div className="flex flex-col md:flex-row gap-3">
                    <select 
                      className="flex-1 bg-zinc-950 border border-zinc-800 rounded-lg p-3 focus:border-cyber-green outline-none text-zinc-300 cursor-pointer"
                      value={(showCustomCodeInput || isCodeCustom) ? "CUSTOM" : companyInfo.industryCode}
                      onChange={e => {
                        if (e.target.value === "CUSTOM") {
                          setShowCustomCodeInput(true);
                          setCompanyInfo({...companyInfo, industryCode: ''});
                        } else {
                          setShowCustomCodeInput(false);
                          setCompanyInfo({...companyInfo, industryCode: e.target.value});
                        }
                      }}
                    >
                      <option value="">Select Code...</option>
                      {codes.map(c => (
                        <option key={c.code} value={c.code}>{c.label}</option>
                      ))}
                      <option value="CUSTOM">Custom Code...</option>
                    </select>
                    
                    {showInput && (
                      <input 
                        className="flex-1 bg-zinc-950 border border-zinc-800 rounded-lg p-3 focus:border-cyber-green outline-none transition-colors text-zinc-300"
                        placeholder="Enter Custom Code..."
                        value={companyInfo.industryCode}
                        onChange={e => setCompanyInfo({...companyInfo, industryCode: e.target.value})}
                      />
                    )}
                  </div>
                );
              } else {
                return (
                  <input 
                    className="w-full bg-zinc-950 border border-zinc-800 rounded-lg p-3 focus:border-cyber-green outline-none transition-colors text-zinc-300"
                    placeholder="e.g. 541511"
                    value={companyInfo.industryCode}
                    onChange={e => setCompanyInfo({...companyInfo, industryCode: e.target.value})}
                  />
                );
              }
            })()}
          </div>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
             <label className="block text-xs font-mono uppercase text-zinc-500 mb-2 cursor-help" data-tooltip="The exact relative folder destination inside the cloned repository context.">Target Repo Path</label>
             <div className="bg-zinc-900 border border-zinc-800 rounded-lg p-3 text-zinc-400 flex items-center gap-2">
               <Shield className="w-3 h-3 text-cyber-green" />
               {companyInfo.industryPath || 'select-industry'}/
             </div>
          </div>
          <div>
            <label className="block text-xs font-mono uppercase text-zinc-500 mb-2 cursor-help" data-tooltip="Determines concurrent agent execution quotas and performance thresholds.">Company Size</label>
            <select 
              className="w-full bg-zinc-950 border border-zinc-800 rounded-lg p-3 focus:border-cyber-green outline-none text-zinc-300 cursor-pointer"
              value={companyInfo.size}
              onChange={e => setCompanyInfo({...companyInfo, size: e.target.value})}
            >
              <option value="25">25 Seats (Startup)</option>
              <option value="50">50 Seats (Growth)</option>
              <option value="100">100 Seats (Enterprise)</option>
            </select>
          </div>
        </div>
        
        <div>
          <label className="block text-xs font-mono uppercase text-zinc-500 mb-2 cursor-help" data-tooltip="Enter a paragraph explaining your core services, tools, or target workflows to calculate recommended agent catalog profiles.">What does your company do?</label>
          <div className="relative">
            <textarea 
              className="w-full bg-zinc-950 border border-zinc-800 rounded-lg p-3 min-h-[100px] focus:border-cyber-green outline-none text-zinc-300"
              placeholder="Describe your core business..."
              value={companyInfo.description}
              onChange={e => setCompanyInfo({...companyInfo, description: e.target.value})}
            />
            <button 
              onClick={onAiAssist}
              className="absolute bottom-4 right-4 bg-cyber-green/10 text-cyber-green hover:bg-cyber-green/20 p-2 rounded-lg border border-cyber-green/30 flex items-center gap-2 text-sm transition-all cursor-pointer"
            >
              <Zap className="w-4 h-4" /> AI Suggest
            </button>
          </div>
        </div>

        <div>
          <label className="block text-xs font-mono uppercase text-zinc-500 mb-2 cursor-help" data-tooltip="The core mandate or strategic goal defining the swarm's overarching purpose.">Mission Objective</label>
          <textarea 
            className="w-full bg-zinc-950 border border-zinc-800 rounded-lg p-3 min-h-[60px] focus:border-cyber-green outline-none text-zinc-300"
            placeholder="The core goal of this swarm..."
            value={companyInfo.mission}
            onChange={e => setCompanyInfo({...companyInfo, mission: e.target.value})}
          />
        </div>
      </div>

      {/* Preset Swarms Registry */}
      {dynamicRegistry.filter(t => t.industry.toLowerCase() === companyInfo.industry.toLowerCase()).length > 0 && (
        <div className="mt-8 pt-8 border-t border-zinc-900/60" style={{ borderColor: 'color-mix(in srgb, var(--color-zinc-800) 25%, transparent)' }}>
          <label className="block text-xs font-mono uppercase text-zinc-500 mb-3 cursor-help" data-tooltip="Pick a pre-assembled role layout to auto-configure this swarm.">Select Swarm Template Base</label>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {dynamicRegistry
              .filter(t => t.industry.toLowerCase() === companyInfo.industry.toLowerCase())
              .map(t => (
                <div 
                  key={t.id} 
                  onClick={() => {
                    setSelectedTemplateId(t.id);
                    onLoadSwarmDetails(t.path);
                  }}
                  className={`p-4 rounded-xl border sovereign-transition cursor-pointer text-left ${
                    selectedTemplateId === t.id 
                      ? 'bg-zinc-900 border-cyber-green/50 text-white' 
                      : 'bg-zinc-950/40 border-zinc-800 text-zinc-400 hover:border-zinc-700'
                  }`}
                >
                  <h4 className="font-bold text-xs text-zinc-200">{t.name}</h4>
                  <p className="text-[10px] text-zinc-550 mt-1.5 leading-relaxed">{t.description}</p>
                </div>
              ))
            }
          </div>
        </div>
      )}

      <div className="mt-12 flex justify-end">
        <button 
          onClick={onNext}
          disabled={!companyInfo.name || !companyInfo.industry}
          className="bg-neural-pulse text-zinc-950 font-bold px-8 py-3 rounded-lg hover:bg-white disabled:opacity-50 transition-all cursor-pointer"
        >
          Next Architecture
        </button>
      </div>
    </motion.div>
  );
}
