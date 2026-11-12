// Server-safe (no React imports): shared by layout.tsx (server) and lib/sidebar.ts (client).

export const SIDEBAR_STORAGE_KEY = 'devportal_sidebar_collapsed';

// Inline <head> script: applies the saved collapse choice before first paint,
// so there is no flash and no animated collapse on page load.
export const SIDEBAR_INIT_SCRIPT = `try{if(localStorage.getItem('${SIDEBAR_STORAGE_KEY}')==='1')document.documentElement.dataset.sidebar='collapsed'}catch(e){}`;
