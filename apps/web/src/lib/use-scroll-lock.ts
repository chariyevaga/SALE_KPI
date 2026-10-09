import { useEffect } from 'react';

/** How many open overlays hold the lock; the page scrolls again when the last one closes. */
let holders = 0;

/**
 * Stops the page behind an open modal or drawer from scrolling, so only the overlay scrolls
 * and the screen never shows two scrollbars. It marks `<html>`; styles.css hides the
 * overflow of the document and of the shell's scroll area (`data-page-scroll`) while marked.
 */
export function useScrollLock(active: boolean): void {
  useEffect(() => {
    if (!active) {
      return;
    }

    holders += 1;
    document.documentElement.dataset.scrollLocked = '';

    return () => {
      holders -= 1;

      if (holders === 0) {
        delete document.documentElement.dataset.scrollLocked;
      }
    };
  }, [active]);
}
