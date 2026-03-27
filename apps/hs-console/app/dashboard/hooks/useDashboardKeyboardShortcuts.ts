import { useEffect } from 'react';
import type { Dispatch, RefObject, SetStateAction } from 'react';
import type { ChangeFilter, SearchHit, SpecsFilter, TabMode, ThemeMode } from '../types';
import { getNextPaletteIndex } from '../utils/dashboard';

type Params = {
  paletteOpen: boolean;
  paletteHits: SearchHit[];
  paletteIndex: number;
  setPaletteOpen: Dispatch<SetStateAction<boolean>>;
  setPaletteIndex: Dispatch<SetStateAction<number>>;
  projectHubOpen: boolean;
  setProjectHubOpen: Dispatch<SetStateAction<boolean>>;
  actionOpen: boolean;
  setActionOpen: Dispatch<SetStateAction<boolean>>;
  tab: TabMode;
  setTab: Dispatch<SetStateAction<TabMode>>;
  setItemIndex: Dispatch<SetStateAction<number>>;
  currentItemsLength: number;
  setTheme: Dispatch<SetStateAction<ThemeMode>>;
  setSpecsFilter: Dispatch<SetStateAction<SpecsFilter>>;
  setChangeFilter: Dispatch<SetStateAction<ChangeFilter>>;
  searchInputRef: RefObject<HTMLInputElement | null>;
};

export function useDashboardKeyboardShortcuts(params: Params): void {
  const {
    paletteOpen,
    paletteHits,
    paletteIndex,
    setPaletteOpen,
    setPaletteIndex,
    projectHubOpen,
    setProjectHubOpen,
    actionOpen,
    setActionOpen,
    tab,
    setTab,
    setItemIndex,
    currentItemsLength,
    setTheme,
    setSpecsFilter,
    setChangeFilter,
    searchInputRef
  } = params;

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      const target = event.target as HTMLElement | null;
      const tag = target?.tagName || '';
      const typing = tag === 'INPUT' || tag === 'TEXTAREA' || target?.isContentEditable;

      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === 'k') {
        event.preventDefault();
        setPaletteOpen(prev => !prev);
        return;
      }

      if (paletteOpen) {
        if (event.key === 'Escape') {
          event.preventDefault();
          setPaletteOpen(false);
          return;
        }
        if (event.key === 'ArrowDown') {
          event.preventDefault();
          setPaletteIndex(prev => getNextPaletteIndex(prev, 'down', paletteHits.length));
          return;
        }
        if (event.key === 'ArrowUp') {
          event.preventDefault();
          setPaletteIndex(prev => getNextPaletteIndex(prev, 'up', paletteHits.length));
          return;
        }
        if (event.key === 'Enter') {
          event.preventDefault();
          const hit = paletteHits[paletteIndex];
          if (!hit) return;
          setTab(hit.tab);
          setItemIndex(hit.index);
          setPaletteOpen(false);
          return;
        }
      }

      if (projectHubOpen || actionOpen) {
        if (event.key === 'Escape') {
          event.preventDefault();
          setProjectHubOpen(false);
          setActionOpen(false);
        }
        return;
      }

      if (typing) return;
      if (event.key === '/') {
        event.preventDefault();
        searchInputRef.current?.focus();
        return;
      }
      if (event.key === '1') setTab('overview');
      if (event.key === '2') setTab('specs');
      if (event.key === '3') setTab('changes');
      if (event.key === '4') setTab('archive');
      if (event.key.toLowerCase() === 'p') setProjectHubOpen(true);
      if (event.key.toLowerCase() === 'o' && tab === 'changes') setActionOpen(true);
      if (event.key.toLowerCase() === 't') setTheme(prev => (prev === 'dark' ? 'light' : 'dark'));
      if (event.key.toLowerCase() === 'j' || event.key === 'ArrowDown') {
        event.preventDefault();
        setItemIndex(prev => Math.min(prev + 1, Math.max(0, currentItemsLength - 1)));
      }
      if (event.key.toLowerCase() === 'k' || event.key === 'ArrowUp') {
        event.preventDefault();
        setItemIndex(prev => Math.max(prev - 1, 0));
      }
      if (event.key.toLowerCase() === 'f') {
        event.preventDefault();
        if (tab === 'specs') setSpecsFilter(prev => (prev === 'all' ? 'base' : prev === 'base' ? 'change-delta' : 'all'));
        if (tab === 'changes') setChangeFilter(prev => (prev === 'all' ? 'todo' : prev === 'todo' ? 'done' : 'all'));
      }
    };

    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [
    paletteOpen,
    paletteHits,
    paletteIndex,
    projectHubOpen,
    actionOpen,
    tab,
    currentItemsLength,
    setPaletteOpen,
    setPaletteIndex,
    setProjectHubOpen,
    setActionOpen,
    setTab,
    setItemIndex,
    setTheme,
    setSpecsFilter,
    setChangeFilter,
    searchInputRef
  ]);
}
