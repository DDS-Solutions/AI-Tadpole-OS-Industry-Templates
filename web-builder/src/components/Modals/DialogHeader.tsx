import type { ReactNode } from 'react';
import { X } from 'lucide-react';

interface DialogHeaderProps {
  id: string;
  summaryId?: string;
  title: string;
  summary?: string;
  icon?: ReactNode;
  eyebrow?: string;
  onClose: () => void;
  closeAriaLabel?: string;
  borderColor?: string;
}

export function DialogHeader({
  id,
  summaryId,
  title,
  summary,
  icon,
  eyebrow,
  onClose,
  closeAriaLabel = 'Close dialog',
  borderColor,
}: DialogHeaderProps) {
  return (
    <div
      className="flex shrink-0 justify-between items-start gap-3 px-4 sm:px-6 py-4 border-b border-zinc-800"
      style={borderColor ? { borderColor } : undefined}
    >
      <div>
        {eyebrow && <div className="mono-label text-[9px] text-cyber-green mb-1">{eyebrow}</div>}
        <h3 id={id} className="text-lg font-bold text-white flex items-center gap-2">
          {icon} {title}
        </h3>
        {summary && (
          <p id={summaryId} className="text-xs text-zinc-400 mt-1 leading-relaxed">
            {summary}
          </p>
        )}
      </div>
      <button
        type="button"
        onClick={onClose}
        aria-label={closeAriaLabel}
        className="focus-sovereign shrink-0 min-h-11 min-w-11 flex items-center justify-center text-zinc-400 hover:text-white rounded-lg hover:bg-zinc-800 transition-colors cursor-pointer"
      >
        <X className="w-5 h-5" />
      </button>
    </div>
  );
}
