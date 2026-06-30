import React from 'react';

export const highlightText = (text: string, search: string): React.JSX.Element => {
  if (!search.trim()) return <span>{text}</span>;
  const regex = new RegExp(`(${search.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&')})`, 'gi');
  const parts = text.split(regex);
  return (
    <span>
      {parts.map((part, i) => 
        regex.test(part) ? (
          <span key={i} className="text-cyber-green bg-cyber-green/10 px-0.5 rounded font-semibold">
            {part}
          </span>
        ) : (
          part
        )
      )}
    </span>
  );
};

export interface ShieldWarning {
  capability: string;
  reason: string;
  severity: 'red' | 'amber';
}

export const scanShieldCapabilities = (prompt: string): ShieldWarning[] => {
  const warnings: ShieldWarning[] = [];
  if (!prompt) return warnings;
  
  const pLower = prompt.toLowerCase();
  
  // shell:execute triggers
  const shellKeywords = ['execute', 'shell', 'bash', 'powershell', 'cmd.exe', 'terminal', 'command line', 'run command', 'system call'];
  const matchedShell = shellKeywords.filter(k => pLower.includes(k));
  if (matchedShell.length > 0) {
    warnings.push({
      capability: 'shell:execute',
      reason: `Requesting system command execution capabilities (matches: ${matchedShell.slice(0, 3).join(', ')}).`,
      severity: 'red'
    });
  }

  // budget:spend triggers
  const fiscalKeywords = ['spend', 'budget', 'purchase', 'cost', 'payment', 'credit card', 'pay', 'charge api', 'financial authorization'];
  const matchedFiscal = fiscalKeywords.filter(k => pLower.includes(k));
  if (matchedFiscal.length > 0) {
    warnings.push({
      capability: 'budget:spend',
      reason: `Requesting direct financial transaction/spending capabilities (matches: ${matchedFiscal.slice(0, 3).join(', ')}).`,
      severity: 'amber'
    });
  }

  // system:write triggers
  const writeKeywords = ['delete', 'wipe', 'remove file', 'overwrite', 'format disk', 'destroy'];
  const matchedWrite = writeKeywords.filter(k => pLower.includes(k));
  if (matchedWrite.length > 0) {
    warnings.push({
      capability: 'system:write',
      reason: `Requesting file deletion or destructive writing permissions (matches: ${matchedWrite.slice(0, 3).join(', ')}).`,
      severity: 'amber'
    });
  }

  return warnings;
};
