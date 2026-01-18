import { useLayoutEffect, useRef, useCallback } from 'react';

export function useDialog(isOpen: boolean, onClose: () => void) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const triggerRef = useRef<HTMLElement | null>(null);
  const previousIsOpen = useRef(false);

  // Capture trigger element BEFORE dialog opens
  useLayoutEffect(() => {
    if (isOpen && !previousIsOpen.current) {
      // Opening: save current focus
      triggerRef.current = document.activeElement as HTMLElement;
    }
    previousIsOpen.current = isOpen;
  }, [isOpen]);

  useLayoutEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;

    if (isOpen && !dialog.open) {
      dialog.showModal();

      // Focus first visible focusable element
      const focusables = dialog.querySelectorAll<HTMLElement>(
        'input:not([disabled]):not([type="hidden"]), select:not([disabled]), textarea:not([disabled]), button:not([disabled]), [tabindex]:not([tabindex="-1"]), label[tabindex], .upload-zone'
      );

      for (const el of focusables) {
        // Check if element is visible
        const style = window.getComputedStyle(el);
        if (style.display !== 'none' && style.visibility !== 'hidden') {
          el.focus();
          break;
        }
      }
    } else if (!isOpen && dialog.open) {
      dialog.close();

      // Restore focus to trigger
      requestAnimationFrame(() => {
        if (triggerRef.current && document.body.contains(triggerRef.current)) {
          triggerRef.current.focus();
        }
        triggerRef.current = null;
      });
    }
  }, [isOpen]);

  // Handle backdrop click
  const handleClick = useCallback((e: React.MouseEvent<HTMLDialogElement>) => {
    const dialog = dialogRef.current;
    if (!dialog) return;

    const rect = dialog.getBoundingClientRect();
    const clickedInDialog = (
      e.clientX >= rect.left &&
      e.clientX <= rect.right &&
      e.clientY >= rect.top &&
      e.clientY <= rect.bottom
    );

    if (!clickedInDialog) {
      onClose();
    }
  }, [onClose]);

  return { dialogRef, handleClick };
}
