import { getProjectAvatarColor, getProjectAvatarText } from '../utils/dashboard';
import type { ActiveProject, RecentProject } from '../types';
import { useEffect, useMemo, useRef, useState } from 'react';
import type { KeyboardEvent, RefObject } from 'react';

type Props = {
  open: boolean;
  query: string;
  busy: boolean;
  recent: RecentProject[];
  active: ActiveProject[];
  fallbackOpened: Array<{ path: string; name: string; gitBranch?: string; exists?: boolean; lastSeenAt?: number }>;
  currentPath: string;
  inputRef: RefObject<HTMLInputElement | null>;
  formatTime: (ts?: number) => string;
  onClose: () => void;
  onQueryChange: (value: string) => void;
  onOpenProject: (path: string) => Promise<void> | void;
  onRemoveRecent: (path: string) => Promise<void> | void;
  onHandleMissingProject: (path: string) => Promise<void> | void;
};

export function ProjectHubModal(props: Props) {
  const { open, query, busy, recent, active, fallbackOpened, currentPath, inputRef, formatTime, onClose, onQueryChange, onOpenProject, onRemoveRecent, onHandleMissingProject } = props;
  if (!open) return null;

  const queryText = query.trim().toLowerCase();
  const openedSource = active.length ? active : fallbackOpened;
  const openedEntries = useMemo(
    () => openedSource
      .map(item => ({ ...item, source: 'active' as const }))
      .filter(item => !queryText || `${item.name} ${item.path}`.toLowerCase().includes(queryText)),
    [openedSource, queryText]
  );
  const recentEntries = useMemo(
    () => recent
      .map(item => ({ ...item, source: 'recent' as const }))
      .filter(item => !queryText || `${item.name} ${item.path}`.toLowerCase().includes(queryText)),
    [recent, queryText]
  );
  const orderedOpenedEntries = useMemo(
    () => [...openedEntries].sort((a, b) => {
      if (a.path === currentPath && b.path !== currentPath) return -1;
      if (b.path === currentPath && a.path !== currentPath) return 1;
      return (a.name || '').localeCompare(b.name || '', 'zh-Hans-CN');
    }),
    [openedEntries, currentPath]
  );
  const orderedRecentEntries = useMemo(
    () => [...recentEntries].sort((a, b) => {
      const bt = Number(b.lastOpenedAt || 0);
      const at = Number(a.lastOpenedAt || 0);
      if (bt !== at) return bt - at;
      if (a.path === currentPath && b.path !== currentPath) return -1;
      if (b.path === currentPath && a.path !== currentPath) return 1;
      return (a.name || '').localeCompare(b.name || '', 'zh-Hans-CN');
    }),
    [recentEntries, currentPath]
  );
  const mergedEntries = useMemo(() => [...orderedOpenedEntries, ...orderedRecentEntries], [orderedOpenedEntries, orderedRecentEntries]);
  const [keyboardIndex, setKeyboardIndex] = useState(0);
  const preferredIndexRef = useRef<number | null>(null);
  const initializedRef = useRef(false);
  const bodyRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!open) {
      initializedRef.current = false;
      return;
    }
    if (initializedRef.current) return;
    if (!mergedEntries.length) return;
    const currentIdx = mergedEntries.findIndex(item => item.path === currentPath && item.exists !== false);
    if (currentIdx >= 0) {
      setKeyboardIndex(currentIdx);
    } else {
      setKeyboardIndex(0);
    }
    initializedRef.current = true;
  }, [open, mergedEntries, currentPath]);

  useEffect(() => {
    if (!open) return;
    setKeyboardIndex(prev => {
      const max = Math.max(0, mergedEntries.length - 1);
      if (preferredIndexRef.current !== null) {
        const target = Math.min(preferredIndexRef.current, max);
        preferredIndexRef.current = null;
        return target;
      }
      return Math.min(prev, max);
    });
  }, [open, mergedEntries]);

  useEffect(() => {
    if (!open) return;
    const node = bodyRef.current?.querySelector<HTMLDivElement>(`[data-hub-index="${keyboardIndex}"]`);
    node?.scrollIntoView({ block: 'nearest' });
  }, [open, keyboardIndex]);

  useEffect(() => {
    if (!open) return;
    setKeyboardIndex(0);
  }, [open, queryText]);

  function handleInputKeyDown(event: KeyboardEvent<HTMLInputElement>): void {
    if (!mergedEntries.length) return;
    if (event.key === 'ArrowDown') {
      event.preventDefault();
      setKeyboardIndex(prev => (prev + 1) % mergedEntries.length);
      return;
    }
    if (event.key === 'ArrowUp') {
      event.preventDefault();
      setKeyboardIndex(prev => (prev - 1 + mergedEntries.length) % mergedEntries.length);
      return;
    }
    if (event.key === 'Home') {
      event.preventDefault();
      setKeyboardIndex(0);
      return;
    }
    if (event.key === 'End') {
      event.preventDefault();
      setKeyboardIndex(Math.max(0, mergedEntries.length - 1));
      return;
    }
    if (event.key === 'Enter') {
      event.preventDefault();
      const target = mergedEntries[keyboardIndex];
      if (!target) return;
      if (target.exists === false) {
        void onHandleMissingProject(target.path);
        return;
      }
      void onOpenProject(target.path);
      return;
    }
    if (event.key === 'Delete' || event.key === 'Backspace') {
      const target = mergedEntries[keyboardIndex];
      if (!target) return;
      const canRemove = target.source === 'recent' || target.exists === false;
      if (!canRemove) return;
      event.preventDefault();
      preferredIndexRef.current = Math.max(0, keyboardIndex - 1);
      void (async () => {
        await onRemoveRecent(target.path);
        inputRef.current?.focus();
      })();
    }
  }

  function renderEntry(
    item: { path: string; name: string; exists?: boolean; gitBranch?: string; lastSeenAt?: number; lastOpenedAt?: number },
    source: 'active' | 'recent',
    index: number
  ) {
    const avatarText = getProjectAvatarText(item.name);
    const avatarColor = getProjectAvatarColor(item.path || item.name);
    const deleted = item.exists === false;
    const isCurrent = source === 'active' && item.path === currentPath;
    const tagText = source === 'active'
      ? (item.gitBranch ? `branch:${item.gitBranch}` : 'opened')
      : (item.lastOpenedAt ? `opened:${formatTime(item.lastOpenedAt)}` : 'recent');
    const canRemove = source === 'recent' || deleted;
    return (
      <div
        key={`${source}-${item.path}`}
        data-hub-index={index}
        className={`project-entry ${isCurrent ? 'active' : ''} ${index === keyboardIndex ? 'keyboard-active' : ''} ${deleted ? 'deleted' : ''}`.trim()}
        onMouseEnter={() => setKeyboardIndex(index)}
      >
        <button
          className="project-entry-main"
          disabled={busy}
          onClick={() => {
            if (deleted) {
              void onHandleMissingProject(item.path);
              return;
            }
            void onOpenProject(item.path);
          }}
        >
          <span className="project-entry-identity">
            <span className="project-entry-avatar" style={{ background: avatarColor }}>{avatarText}</span>
            <span className="project-entry-name">{item.name || item.path}</span>
          </span>
          <span className="project-entry-path">{item.path}</span>
        </button>
        <div className="project-entry-actions">
          <span className={`project-tag ${deleted ? 'warn' : ''}`}>{deleted ? 'missing' : tagText}</span>
          {canRemove ? (
            <button
              className="project-entry-remove"
              disabled={busy}
              onClick={async () => {
                preferredIndexRef.current = Math.max(0, index - 1);
                await onRemoveRecent(item.path);
                inputRef.current?.focus();
              }}
            >
              删除记录
            </button>
          ) : null}
        </div>
      </div>
    );
  }

  return (
    <div className="palette-mask" onClick={onClose}>
      <div className="project-hub-card" onClick={e => e.stopPropagation()}>
        <div className="project-hub-head">
          <input
            ref={inputRef}
            value={query}
            onChange={e => onQueryChange(e.target.value)}
            onKeyDown={handleInputKeyDown}
            placeholder="搜索项目名或路径..."
            className="project-hub-search"
          />
        </div>
        <div ref={bodyRef} className="project-hub-body">
          <div className="project-hub-title">打开项目</div>
          {orderedOpenedEntries.length ? orderedOpenedEntries.map((item, idx) => renderEntry(item, 'active', idx)) : <div className="project-hub-empty">当前无已打开项目</div>}

          <div className="project-hub-title">最近项目</div>
          {orderedRecentEntries.length ? orderedRecentEntries.map((item, idx) => renderEntry(item, 'recent', orderedOpenedEntries.length + idx)) : <div className="project-hub-empty">暂无最近项目</div>}
        </div>
      </div>
    </div>
  );
}
