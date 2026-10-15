interface DialogFooterProps {
  onCancel: () => void;
  canSave: boolean;
  saveLabel?: string;
  cancelLabel?: string;
}

export function DialogFooter({
  onCancel,
  canSave,
  saveLabel = 'Save Configuration',
  cancelLabel = 'Cancel',
}: DialogFooterProps) {
  return (
    <div
      className="px-4 sm:px-6 py-4 shrink-0 border-t border-zinc-800 bg-zinc-950/40 flex flex-col-reverse sm:flex-row justify-end gap-3"
      style={{ borderColor: 'color-mix(in srgb, var(--color-zinc-800) 40%, transparent)' }}
    >
      <button
        type="button"
        onClick={onCancel}
        className="focus-sovereign min-h-11 bg-zinc-900 hover:bg-zinc-800 text-zinc-300 hover:text-white px-5 py-2.5 rounded-lg border border-zinc-800 text-xs font-semibold cursor-pointer transition-colors"
      >
        {cancelLabel}
      </button>
      <button
        type="submit"
        disabled={!canSave}
        className="focus-sovereign min-h-11 bg-cyber-green text-zinc-950 font-bold text-xs px-6 py-2.5 rounded-lg hover:scale-102 transition-all cursor-pointer disabled:opacity-50 disabled:pointer-events-none shadow-md"
      >
        {saveLabel}
      </button>
    </div>
  );
}
