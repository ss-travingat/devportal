// Desktop sidebar collapse state.
//
// The source of truth is the `data-sidebar` attribute on <html>, which Tailwind
// styles through the `sidebar-collapsed:` variant (see globals.css). An inline
// script in <head> (SIDEBAR_INIT_SCRIPT) applies the saved choice before first
// paint, so there is no flash and no animated collapse on page load.
//
// Client-only (uses a React hook). Server code must import from ./sidebar-config.

'use client';

import { useSyncExternalStore } from 'react';
import { SIDEBAR_STORAGE_KEY } from './sidebar-config';

const listeners = new Set<() => void>();

function subscribe(cb: () => void) {
  listeners.add(cb);
  return () => {
    listeners.delete(cb);
  };
}

function getSnapshot() {
  return document.documentElement.dataset.sidebar === 'collapsed';
}

export function setSidebarCollapsed(collapsed: boolean) {
  document.documentElement.dataset.sidebar = collapsed ? 'collapsed' : 'expanded';
  try {
    localStorage.setItem(SIDEBAR_STORAGE_KEY, collapsed ? '1' : '0');
  } catch {
    // storage unavailable: the choice just won't persist
  }
  listeners.forEach((l) => l());
}

/** Current collapsed state (false on the server). Use for aria/title only; layout is CSS-driven. */
export function useSidebarCollapsed(): boolean {
  return useSyncExternalStore(subscribe, getSnapshot, () => false);
}
