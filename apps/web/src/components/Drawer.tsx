import type { ReactNode } from 'react';

interface DrawerProps {
  open: boolean;
  onClose: () => void;
  children: ReactNode;
  side?: 'left' | 'right';
  /**
   * 'sidebar' (default): becomes a permanent static column on desktop (lg+) — used for the app's
   * main navigation drawer, which is only ever mounted inside a `lg:hidden` wrapper anyway.
   * 'overlay': stays a dismissible overlay at every breakpoint — used for things like filter panels
   * that must open/close on desktop too, not turn into a permanent column.
   */
  variant?: 'sidebar' | 'overlay';
}

export function Drawer({ open, onClose, children, side = 'left', variant = 'sidebar' }: DrawerProps) {
  const isOverlay = variant === 'overlay';

  return (
    <div
      className={`fixed inset-0 z-40 ${isOverlay ? '' : 'lg:static lg:z-auto lg:block lg:w-72 lg:flex-shrink-0'} ${
        open ? '' : 'pointer-events-none' + (isOverlay ? '' : ' lg:pointer-events-auto')
      }`}
      aria-hidden={!open}
    >
      <button
        type="button"
        aria-label="Close menu"
        tabIndex={open ? 0 : -1}
        onClick={onClose}
        className={`absolute inset-0 bg-slate-950/70 backdrop-blur-sm transition-opacity duration-200 ${isOverlay ? '' : 'lg:hidden'} ${
          open ? 'opacity-100' : 'opacity-0'
        }`}
      />
      <nav
        className={`absolute inset-y-0 flex w-[82vw] max-w-xs flex-col bg-white pt-[env(safe-area-inset-top)] shadow-2xl transition-transform duration-200 ease-out dark:bg-slate-950 ${
          isOverlay ? '' : 'lg:sticky lg:top-0 lg:h-screen lg:w-72 lg:max-w-none lg:translate-x-0 lg:pt-0 lg:shadow-none'
        } ${
          side === 'left'
            ? `left-0 border-r border-slate-200 dark:border-slate-800 ${open ? 'translate-x-0' : '-translate-x-full'}`
            : `right-0 border-l border-slate-200 dark:border-slate-800 ${open ? 'translate-x-0' : 'translate-x-full'}`
        }`}
      >
        {children}
      </nav>
    </div>
  );
}
