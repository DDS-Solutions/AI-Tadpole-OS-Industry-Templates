import { useEffect } from 'react';
import { Building2, Users, Sparkles, Check } from 'lucide-react';
import type { CompanyInfo } from '../../types';
import { getGoalsForIndustry, getDefaultGoalsForIndustry } from '../../utils/catalogHelpers';

interface Industry {
  name: string;
  path: string;
  keywords: string[];
}

interface Step1BusinessBriefProps {
  companyInfo: CompanyInfo;
  setCompanyInfo: (info: CompanyInfo) => void;
  dynamicIndustries: Industry[];
  onRecommendTeam: () => void;
}

export default function Step1_BusinessBrief({
  companyInfo,
  setCompanyInfo,
  dynamicIndustries,
  onRecommendTeam,
}: Step1BusinessBriefProps) {
  const selectedGoals = companyInfo.goals || [];
  const activeIndustryKey = companyInfo.industryPath || companyInfo.industry;
  const availableGoals = getGoalsForIndustry(activeIndustryKey);

  // When industry changes or on initial mount, if current goals don't belong to the active industry, preselect top 3
  useEffect(() => {
    if (companyInfo.industry) {
      const activeIds = new Set(availableGoals.map(g => g.id));
      const hasMatchingGoal = companyInfo.goals && companyInfo.goals.some(gId => activeIds.has(gId));
      if (!hasMatchingGoal) {
        const defaultGoals = getDefaultGoalsForIndustry(activeIndustryKey);
        setCompanyInfo({
          ...companyInfo,
          goals: defaultGoals,
        });
      }
    }
  }, [companyInfo.industry, companyInfo.industryPath, activeIndustryKey, availableGoals, companyInfo, setCompanyInfo]);

  const isGoalSelected = (goalId: string) => {
    if (selectedGoals.includes(goalId)) return true;
    if (goalId === 'fs-dispatch-coordination' && selectedGoals.includes('scheduling')) return true;
    if (goalId === 'fs-estimate-quoting' && selectedGoals.includes('quoting')) return true;
    if (goalId === 'fs-customer-care' && selectedGoals.includes('customer-follow-up')) return true;
    return false;
  };

  const toggleGoal = (goalId: string) => {
    const isSelected = isGoalSelected(goalId);
    let updated: string[];
    if (isSelected) {
      updated = selectedGoals.filter(id => {
        if (id === goalId) return false;
        if (goalId === 'fs-dispatch-coordination' && id === 'scheduling') return false;
        if (goalId === 'fs-estimate-quoting' && id === 'quoting') return false;
        if (goalId === 'fs-customer-care' && id === 'customer-follow-up') return false;
        return true;
      });
    } else {
      updated = [...selectedGoals, goalId];
    }
    setCompanyInfo({
      ...companyInfo,
      goals: updated,
    });
  };

  const handleIndustryChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const selected = e.target.value;
    const match = dynamicIndustries.find(i => i.name === selected);
    const targetPath = match?.path || selected.toLowerCase().replace(/\s+/g, '-');
    const defaultTop3 = getDefaultGoalsForIndustry(targetPath || selected);
    setCompanyInfo({
      ...companyInfo,
      industry: selected,
      industryPath: targetPath,
      goals: defaultTop3,
    });
  };

  const canProceed = companyInfo.name.trim() !== '' && companyInfo.industry.trim() !== '';

  return (
    <div className="w-full sovereign-panel p-8 space-y-8 animate-fadeIn">
      <div>
        <div className="flex items-center gap-2 text-cyber-green text-xs font-mono uppercase tracking-wider mb-1">
          <Building2 className="w-4 h-4" />
          <span>Step 1 of 4: Business Brief</span>
        </div>
        <h2 className="text-2xl font-bold text-white">Tell us about your business</h2>
        <p className="text-sm text-zinc-400 mt-1">
          Provide basic details so we can configure and recommend a tailored AI team for your workflow.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <label className="block text-xs font-semibold uppercase text-zinc-400 mb-2">
            Business or Team Name <span className="text-cyber-green">*</span>
          </label>
          <input
            className="w-full bg-zinc-950 border border-zinc-800 rounded-xl p-3.5 focus:border-cyber-green outline-none transition-colors text-white placeholder-zinc-600 text-sm"
            placeholder="e.g. Apex Plumbing & HVAC"
            value={companyInfo.name}
            onChange={e => setCompanyInfo({ ...companyInfo, name: e.target.value })}
          />
        </div>

        <div>
          <label className="block text-xs font-semibold uppercase text-zinc-400 mb-2">
            Industry Sector <span className="text-cyber-green">*</span>
          </label>
          <select
            className="w-full bg-zinc-950 border border-zinc-800 rounded-xl p-3.5 focus:border-cyber-green outline-none text-white text-sm cursor-pointer"
            value={companyInfo.industry}
            onChange={handleIndustryChange}
          >
            <option value="" disabled>Select your industry</option>
            {dynamicIndustries.map(ind => (
              <option key={ind.name} value={ind.name}>{ind.name}</option>
            ))}
          </select>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div>
          <label className="block text-xs font-semibold uppercase text-zinc-400 mb-2">
            Company Size (Employees)
          </label>
          <div className="relative">
            <Users className="w-4 h-4 text-zinc-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <select
              className="w-full bg-zinc-950 border border-zinc-800 rounded-xl pl-10 pr-4 py-3.5 focus:border-cyber-green outline-none text-white text-sm cursor-pointer"
              value={companyInfo.size || '25'}
              onChange={e => setCompanyInfo({ ...companyInfo, size: e.target.value })}
            >
              <option value="5">1 - 10 employees (Small team)</option>
              <option value="25">11 - 50 employees (Growing business)</option>
              <option value="100">51 - 250 employees (Mid-sized operation)</option>
              <option value="500">250+ employees (Enterprise)</option>
            </select>
          </div>
        </div>

        <div className="md:col-span-2">
          <label className="block text-xs font-semibold uppercase text-zinc-400 mb-2">
            Optional Business Description
          </label>
          <input
            className="w-full bg-zinc-950 border border-zinc-800 rounded-xl p-3.5 focus:border-cyber-green outline-none transition-colors text-white placeholder-zinc-600 text-sm"
            placeholder="e.g. Commercial and residential emergency dispatch and maintenance contracts"
            value={companyInfo.description}
            onChange={e => setCompanyInfo({ ...companyInfo, description: e.target.value })}
          />
        </div>
      </div>

      {/* Goal Selector */}
      <div className="space-y-3 pt-2">
        <div className="flex items-center justify-between">
          <label className="block text-xs font-semibold uppercase text-zinc-400">
            What kind of work would you like help with? <span className="text-zinc-500 text-xs font-normal">(Select all that apply)</span>
          </label>
          <span className="text-xs text-cyber-green/80 font-mono">
            {availableGoals.length} tasks tailored for {companyInfo.industry || 'general operations'}
          </span>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {availableGoals.map(goal => {
            const isSelected = isGoalSelected(goal.id);
            return (
              <button
                type="button"
                key={goal.id}
                onClick={() => toggleGoal(goal.id)}
                aria-pressed={isSelected}
                className={`w-full p-4 rounded-xl border transition-all cursor-pointer select-none flex flex-col justify-between text-left ${
                  isSelected
                    ? 'bg-cyber-green/10 border-cyber-green text-white shadow-sm'
                    : 'bg-zinc-950/70 border-zinc-800/80 hover:border-zinc-700 text-zinc-300'
                }`}
              >
                <span className="flex items-start justify-between gap-2">
                  <span>
                    <span className="text-sm font-semibold flex items-center gap-1.5">
                      {goal.label}
                    </span>
                    <span className="inline-block px-1.5 py-0.5 mt-1 rounded text-[10px] font-mono uppercase tracking-wider bg-zinc-800/80 text-zinc-400 border border-zinc-700/50">
                      {goal.category}
                    </span>
                    <span className="block text-xs text-zinc-400 mt-1.5 leading-snug">
                      {goal.description}
                    </span>
                  </span>
                  <span
                    className={`w-5 h-5 rounded-md flex items-center justify-center shrink-0 border transition-colors ${
                      isSelected
                        ? 'bg-cyber-green border-cyber-green text-zinc-950'
                        : 'border-zinc-700 bg-zinc-900'
                    }`}
                  >
                    {isSelected && <Check className="w-3.5 h-3.5 stroke-[3]" />}
                  </span>
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Action Footer */}
      <div className="pt-6 border-t border-zinc-800/80 flex items-center justify-between">
        <span className="text-xs text-zinc-500 font-mono">
          {!canProceed ? 'Enter business name & industry to continue' : 'Ready to recommend specialist agents'}
        </span>
        <button
          onClick={onRecommendTeam}
          disabled={!canProceed}
          className={`px-6 py-3 rounded-xl font-semibold text-sm transition-all flex items-center gap-2 cursor-pointer shadow-md ${
            canProceed
              ? 'bg-cyber-green hover:bg-cyber-green-light text-zinc-950 shadow-cyber-green/20'
              : 'bg-zinc-800 text-zinc-500 cursor-not-allowed'
          }`}
        >
          <Sparkles className="w-4 h-4" />
          Recommend a Team
        </button>
      </div>
    </div>
  );
}
