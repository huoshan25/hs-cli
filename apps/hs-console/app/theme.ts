export type ConsoleTheme = 'dark' | 'light';

export const THEME_KEY = 'hs-cli-openspec-theme';
export const THEME_EVENT = 'hs-console-theme-change';

export function resolveThemeFromStorage(): ConsoleTheme {
  if (typeof window === 'undefined') return 'dark';
  try {
    const stored = window.localStorage.getItem(THEME_KEY);
    if (stored === 'light' || stored === 'dark') return stored;
    const preferLight = typeof window.matchMedia === 'function'
      && window.matchMedia('(prefers-color-scheme: light)').matches;
    return preferLight ? 'light' : 'dark';
  } catch {
    return 'dark';
  }
}

export function applyTheme(theme: ConsoleTheme): void {
  if (typeof window === 'undefined') return;
  document.documentElement.dataset.theme = theme;
  try {
    window.localStorage.setItem(THEME_KEY, theme);
  } catch {
    // ignore localStorage write errors
  }
  window.dispatchEvent(new CustomEvent<ConsoleTheme>(THEME_EVENT, { detail: theme }));
}
