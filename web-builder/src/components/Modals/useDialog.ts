import { useEffect, useRef } from 'react';

const focusableSelector = [
  'a[href]',
  'button:not(:disabled)',
  'input:not(:disabled)',
  'select:not(:disabled)',
  'textarea:not(:disabled)',
  '[tabindex]:not([tabindex="-1"])',
].join(',');

/** Keeps keyboard interaction inside a dialog and returns focus to its opener. */
export function useDialog<T extends HTMLElement = HTMLDivElement>(onClose: () => void, isOpen = true) {
  const dialogRef = useRef<T>(null);
  const closeRef = useRef(onClose);

  useEffect(() => {
    closeRef.current = onClose;
  }, [onClose]);

  useEffect(() => {
    if (!isOpen || !dialogRef.current) return;

    const dialog = dialogRef.current;
    const opener = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    const getFocusable = () => Array.from(dialog.querySelectorAll<HTMLElement>(focusableSelector))
      .filter(element => element.getClientRects().length > 0 && !element.closest('[inert]'));

    const focusFirst = () => {
      const initial = dialog.querySelector<HTMLElement>('[data-dialog-initial-focus]');
      (initial ?? getFocusable()[0] ?? dialog).focus({ preventScroll: true });
    };

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && !event.isComposing) {
        event.preventDefault();
        event.stopPropagation();
        closeRef.current();
      }

      if (event.key !== 'Tab') return;
      const focusable = getFocusable();
      const first = focusable[0];
      const last = focusable[focusable.length - 1];

      if (!first) {
        event.preventDefault();
        dialog.focus();
      } else if (event.shiftKey && (document.activeElement === first || document.activeElement === dialog)) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    };

    const containFocus = (event: FocusEvent) => {
      if (event.target instanceof Node && !dialog.contains(event.target)) focusFirst();
    };

    document.addEventListener('keydown', handleKeyDown, true);
    document.addEventListener('focusin', containFocus);
    focusFirst();

    return () => {
      document.body.style.overflow = previousOverflow;
      document.removeEventListener('keydown', handleKeyDown, true);
      document.removeEventListener('focusin', containFocus);
      if (opener?.isConnected) opener.focus({ preventScroll: true });
    };
  }, [isOpen]);

  return dialogRef;
}

export function getModalMotionProps(reducedMotion: boolean) {
  return {
    initial: reducedMotion ? false : { scale: 0.95, y: 15 },
    animate: { scale: 1, y: 0 },
    exit: reducedMotion ? undefined : { scale: 0.95, y: 15 },
    transition: { type: 'spring' as const, stiffness: 350, damping: 25 },
  };
}

