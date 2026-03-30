import { useEffect, useState } from 'react';
import { NavLink } from 'react-router';
import { applyTheme, resolveThemeFromStorage, THEME_EVENT, type ConsoleTheme } from '../theme';

export function ConsoleNav() {
  const [theme, setTheme] = useState<ConsoleTheme>(() => resolveThemeFromStorage());

  useEffect(() => {
    const onThemeChange = (event: Event) => {
      const detail = (event as CustomEvent<ConsoleTheme>).detail;
      if (detail === 'dark' || detail === 'light') {
        setTheme(detail);
      } else {
        setTheme(resolveThemeFromStorage());
      }
    };
    const onStorage = (event: StorageEvent) => {
      if (!event.key || event.key === 'hs-cli-openspec-theme') {
        setTheme(resolveThemeFromStorage());
      }
    };
    window.addEventListener(THEME_EVENT, onThemeChange as EventListener);
    window.addEventListener('storage', onStorage);
    return () => {
      window.removeEventListener(THEME_EVENT, onThemeChange as EventListener);
      window.removeEventListener('storage', onStorage);
    };
  }, []);

  return (
    <nav className="console-nav">
      <div className="console-nav__tabs">
        <NavLink to="/" end className={({ isActive }) => `console-nav__item ${isActive ? 'active' : ''}`}>
          OpenSpec
        </NavLink>
      </div>
      <button
        className="console-nav__theme"
        onClick={() => {
          const next: ConsoleTheme = theme === 'dark' ? 'light' : 'dark';
          setTheme(next);
          applyTheme(next);
        }}
        title={theme === 'dark' ? '切换到浅色' : '切换到深色'}
        aria-label={theme === 'dark' ? '切换到浅色主题' : '切换到深色主题'}
      >
        {theme === 'dark' ? (
          <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
            <path d="M12 4.75V3m0 18v-1.75M19.25 12H21m-18 0h1.75M17.13 6.87l1.24-1.24M5.63 18.37l1.24-1.24m0-10.26L5.63 5.63m12.74 12.74-1.24-1.24M12 16.25A4.25 4.25 0 1 0 12 7.75a4.25 4.25 0 0 0 0 8.5Z" />
          </svg>
        ) : (
          <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
            <path d="M13.8 3.06a8.94 8.94 0 1 0 7.14 12.79 7.2 7.2 0 1 1-7.14-12.79Z" />
          </svg>
        )}
      </button>
    </nav>
  );
}
