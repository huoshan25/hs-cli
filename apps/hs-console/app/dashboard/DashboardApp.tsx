import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { ActionCenterModal } from './components/ActionCenterModal';
import { ConfirmDialog } from './components/ConfirmDialog';
import { DashboardPanels } from './components/DashboardPanels';
import { GlobalSearchPalette } from './components/GlobalSearchPalette';
import { ProjectHubModal } from './components/ProjectHubModal';
import { useDashboardKeyboardShortcuts } from './hooks/useDashboardKeyboardShortcuts';
import { useDashboardPolling } from './hooks/useDashboardPolling';
import type { ActionResult, ArchiveItem, ChangeFilter, ChangeItem, DashboardData, DetailModel, SearchHit, SpecItem, SpecsFilter, TabMode, ThemeMode, VersionPayload } from './types';
import { includesQuery, normalizeDashboardData } from './utils/dashboard';
import { buildArchiveDetail, buildChangeDetail, buildOverviewDetail, buildSpecDetail } from './utils/renderers';
import { reportBootError, reportBootReady, reportBootStage } from '../boot';
import { applyTheme, resolveThemeFromStorage, THEME_EVENT } from '../theme';

const EMPTY_DATA: DashboardData = { version: 0, projects: [], recentProjects: [], activeProjects: [] };

async function request<T>(url: string, init?: RequestInit): Promise<T> {
  const res = await fetch(url, { headers: { 'Content-Type': 'application/json' }, ...init });
  const data = (await res.json()) as T & { message?: string };
  if (!res.ok) throw new Error(data?.message || `Request failed: ${res.status}`);
  return data;
}

function formatTime(ts?: number): string {
  if (!ts) return '-';
  const d = new Date(ts);
  if (Number.isNaN(d.getTime())) return '-';
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')} ${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
}

export default function DashboardApp() {
  const [data, setData] = useState<DashboardData>(EMPTY_DATA);
  const [tab, setTab] = useState<TabMode>('overview');
  const [search, setSearch] = useState('');
  const [projectIndex, setProjectIndex] = useState(0);
  const [itemIndex, setItemIndex] = useState(0);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState('就绪');
  const [version, setVersion] = useState(0);
  const [theme, setTheme] = useState<ThemeMode>(() => resolveThemeFromStorage());
  const [specsFilter, setSpecsFilter] = useState<SpecsFilter>('all');
  const [changeFilter, setChangeFilter] = useState<ChangeFilter>('all');
  const [paletteOpen, setPaletteOpen] = useState(false);
  const [paletteQuery, setPaletteQuery] = useState('');
  const [paletteIndex, setPaletteIndex] = useState(0);
  const [projectHubOpen, setProjectHubOpen] = useState(false);
  const [projectHubQuery, setProjectHubQuery] = useState('');
  const [actionOpen, setActionOpen] = useState(false);
  const [actionLog, setActionLog] = useState('');
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [confirmTitle, setConfirmTitle] = useState('');
  const [confirmMessage, setConfirmMessage] = useState('');
  const [confirmCancelText, setConfirmCancelText] = useState('取消');
  const [confirmConfirmText, setConfirmConfirmText] = useState('确定');
  const [confirmResolve, setConfirmResolve] = useState<((value: boolean) => void) | null>(null);

  const searchInputRef = useRef<HTMLInputElement | null>(null);
  const paletteInputRef = useRef<HTMLInputElement | null>(null);
  const projectHubInputRef = useRef<HTMLInputElement | null>(null);
  const bootReadyRef = useRef(false);

  const project = data.projects[projectIndex];
  const specs = project?.specs || [];
  const changes = project?.changes || [];
  const archives = project?.archives || [];

  const specsItems = useMemo(() => {
    const q = search.trim().toLowerCase();
    return specs.filter(item => (specsFilter === 'all' ? true : item.source === specsFilter)).filter(item => includesQuery(item, q));
  }, [specs, search, specsFilter]);

  const changeItems = useMemo(() => {
    const q = search.trim().toLowerCase();
    return changes
      .filter(item => (changeFilter === 'all' ? true : changeFilter === 'todo' ? !item.isTaskComplete : item.isTaskComplete))
      .filter(item => includesQuery(item, q));
  }, [changes, search, changeFilter]);

  const archiveItems = useMemo(() => {
    const q = search.trim().toLowerCase();
    return archives.filter(item => includesQuery(item, q));
  }, [archives, search]);

  type DashboardItem = SpecItem | ChangeItem | ArchiveItem;
  const currentItems = useMemo(() => {
    const list: DashboardItem[] = [];
    if (tab === 'specs') return specsItems;
    if (tab === 'changes') return changeItems;
    if (tab === 'archive') return archiveItems;
    return list;
  }, [tab, specsItems, changeItems, archiveItems]);

  const selectedItem = currentItems[itemIndex];
  const selectedSpec = tab === 'specs' ? specsItems[itemIndex] : undefined;
  const selectedChange = tab === 'changes' ? changeItems[itemIndex] : undefined;
  const selectedArchive = tab === 'archive' ? archiveItems[itemIndex] : undefined;

  const paletteHits = useMemo<SearchHit[]>(() => {
    if (!project) return [];
    const q = paletteQuery.trim().toLowerCase();
    const terms = q.split(/\s+/).filter(Boolean);
    type ScoredHit = SearchHit & { score: number };
    const hits: ScoredHit[] = [];
    const scoreHit = (label: string, snippet: string): number => {
      if (!terms.length) return 0;
      const title = label.toLowerCase();
      const body = snippet.toLowerCase();
      let score = 0;
      for (const term of terms) {
        if (title.startsWith(term)) {
          score += 30;
          continue;
        }
        if (title.includes(term)) {
          score += 20;
          continue;
        }
        if (body.includes(term)) {
          score += 8;
          continue;
        }
        return -1;
      }
      return score;
    };
    const pushHit = (hit: SearchHit): void => {
      const score = scoreHit(hit.label, hit.snippet);
      if (score < 0) return;
      hits.push({ ...hit, score });
    };
    specs.forEach((item, index) => {
      if (includesQuery(item, q)) {
        pushHit({ tab: 'specs', index, label: item.id, snippet: item.requirements.join(' | ').slice(0, 140) });
      }
    });
    changes.forEach((item, index) => {
      if (includesQuery(item, q)) {
        pushHit({ tab: 'changes', index, label: item.id, snippet: (item.summary.title || item.summary.what || '').slice(0, 140) });
      }
    });
    archives.forEach((item, index) => {
      if (includesQuery(item, q)) {
        pushHit({ tab: 'archive', index, label: item.id, snippet: item.markdownFiles[0]?.relativePath || '' });
      }
    });
    if (!terms.length) {
      return hits
        .slice(0, 25)
        .map(({ score: _score, ...hit }) => hit);
    }
    return hits
      .sort((a, b) => b.score - a.score || a.label.localeCompare(b.label))
      .slice(0, 120)
      .map(({ score: _score, ...hit }) => hit);
  }, [project, specs, changes, archives, paletteQuery]);

  const projectHubRecent = useMemo(() => data.recentProjects.filter(item => includesQuery(item, projectHubQuery.trim().toLowerCase())), [data.recentProjects, projectHubQuery]);
  const projectHubActive = useMemo(() => data.activeProjects.filter(item => includesQuery(item, projectHubQuery.trim().toLowerCase())), [data.activeProjects, projectHubQuery]);
  const projectHubFallbackOpened = useMemo(
    () => data.projects.map(item => ({
      path: item.root,
      name: item.name || item.root,
      gitBranch: item.gitBranch || '',
      exists: true
    })),
    [data.projects]
  );

  const detailModel = useMemo<DetailModel>(() => {
    if (!project) return { title: '无项目', lines: [], sections: [], files: [], emptyText: '没有可展示的 OpenSpec 项目' };
    if (tab === 'overview') return buildOverviewDetail(project, formatTime);
    if (!selectedItem) {
      return { title: '无详情', lines: [], sections: [], files: [], emptyText: '当前筛选无内容' };
    }
    if (tab === 'specs' && selectedSpec) return buildSpecDetail(project, selectedSpec, formatTime);
    if (tab === 'changes' && selectedChange) return buildChangeDetail(project, selectedChange, formatTime);
    if (tab === 'archive' && selectedArchive) return buildArchiveDetail(project, selectedArchive, formatTime);
    return { title: '无详情', lines: [], sections: [], files: [], emptyText: '当前筛选无内容' };
  }, [project, tab, selectedItem, selectedSpec, selectedChange, selectedArchive]);

  const actionStatusMode = useMemo<'' | 'ok' | 'error'>(() => {
    if (busy) return '';
    if (!message) return '';
    if (/成功|已/.test(message)) return 'ok';
    if (/失败|错误|无效|缺少|未找到|不支持/.test(message)) return 'error';
    return '';
  }, [busy, message]);

  const filterLabel = useMemo(() => {
    if (tab === 'specs') {
      const map: Record<SpecsFilter, string> = {
        all: '全部',
        base: '基础',
        'change-delta': '增量'
      };
      return map[specsFilter];
    }
    if (tab === 'changes') {
      const map: Record<ChangeFilter, string> = {
        all: '全部',
        todo: '待办',
        done: '完成'
      };
      return map[changeFilter];
    }
    return 'all';
  }, [tab, specsFilter, changeFilter]);

  const cycleFilter = useCallback(() => {
    if (tab === 'specs') {
      setSpecsFilter(prev => (prev === 'all' ? 'base' : prev === 'base' ? 'change-delta' : 'all'));
      return;
    }
    if (tab === 'changes') {
      setChangeFilter(prev => (prev === 'all' ? 'todo' : prev === 'todo' ? 'done' : 'all'));
    }
  }, [tab]);

  const refreshDashboard = useCallback(async () => {
    const payload = normalizeDashboardData(await request<unknown>('/api/dashboard'));
    setData(payload);
    setVersion(payload.version);
    setProjectIndex(prev => Math.min(prev, Math.max(0, payload.projects.length - 1)));
    setItemIndex(0);
    return payload;
  }, []);

  const fetchVersion = useCallback(async (): Promise<number> => {
    const payload = await request<VersionPayload>('/api/version');
    return payload.version;
  }, []);

  async function runAction(action: 'validate-change' | 'archive-change') {
    if (!project || tab !== 'changes' || !selectedChange) return;
    if (action === 'archive-change') {
      const ok = await askConfirm({
        message: `确认归档变更 "${selectedChange.id}" 吗？该操作会移动到 archive。`
      });
      if (!ok) return;
    }
    setBusy(true);
    try {
      const result = await request<ActionResult>('/api/openspec-action', {
        method: 'POST',
        body: JSON.stringify({ projectPath: project.root, action, changeId: selectedChange.id })
      });
      setActionLog([result.command || action, result.output || ''].filter(Boolean).join('\n\n'));
      setMessage(`${result.command || action} 执行成功`);
      await refreshDashboard();
    } catch (error: unknown) {
      const msg = error instanceof Error ? error.message : '执行失败';
      setActionLog(msg);
      setMessage(msg);
    } finally {
      setBusy(false);
    }
  }

  async function openProject(path: string) {
    setBusy(true);
    try {
      await request('/api/open-project', { method: 'POST', body: JSON.stringify({ path }) });
      const payload = await refreshDashboard();
      const newIndex = payload.projects.findIndex((p: { root: string }) => p.root === path);
      if (newIndex >= 0) setProjectIndex(newIndex);
      setMessage('已打开项目');
      setProjectHubOpen(false);
    } catch (error: unknown) {
      setMessage(error instanceof Error ? error.message : '打开项目失败');
    } finally {
      setBusy(false);
    }
  }

  async function removeRecent(path: string) {
    setBusy(true);
    try {
      await request('/api/recent-project', { method: 'DELETE', body: JSON.stringify({ path }) });
      await refreshDashboard();
      setMessage('已移除最近项目记录');
    } catch (error: unknown) {
      setMessage(error instanceof Error ? error.message : '移除失败');
    } finally {
      setBusy(false);
    }
  }

  async function handleMissingProject(path: string) {
    const ok = await askConfirm({
      title: '重新打开项目',
      message: `路径 ${path} 不存在。\n如果它位于移动驱动器或网络驱动器上，请确保该驱动器已连接。`,
      cancelText: '取消',
      confirmText: '从列表中移除'
    });
    if (!ok) return;
    await removeRecent(path);
  }

  async function askConfirm(options: { title?: string; message: string; cancelText?: string; confirmText?: string }): Promise<boolean> {
    return await new Promise<boolean>(resolve => {
      setConfirmTitle(options.title || '');
      setConfirmMessage(options.message);
      setConfirmCancelText(options.cancelText || '取消');
      setConfirmConfirmText(options.confirmText || '确定');
      setConfirmResolve(() => resolve);
      setConfirmOpen(true);
    });
  }

  function closeConfirm(result: boolean) {
    const resolver = confirmResolve;
    setConfirmOpen(false);
    setConfirmResolve(null);
    if (resolver) resolver(result);
  }

  useEffect(() => {
    const init = async () => {
      try {
        reportBootError('');
        reportBootStage('加载面板数据');
        await refreshDashboard();
        reportBootStage('渲染面板视图');
      } catch (error: unknown) {
        const message = error instanceof Error ? error.message : '加载失败';
        setMessage(message);
        reportBootError(`初始化失败: ${message}`);
      } finally {
        if (!bootReadyRef.current) {
          bootReadyRef.current = true;
          reportBootReady();
        }
      }
    };
    void init();
  }, [refreshDashboard]);

  useDashboardPolling({
    version,
    getVersion: fetchVersion,
    refresh: refreshDashboard
  });

  useEffect(() => {
    setItemIndex(0);
  }, [tab, projectIndex, search, specsFilter, changeFilter]);

  useEffect(() => {
    applyTheme(theme);
  }, [theme]);

  useEffect(() => {
    const onThemeChange = (event: Event) => {
      const value = (event as CustomEvent<ThemeMode>).detail;
      if (value === 'light' || value === 'dark') {
        setTheme(value);
        return;
      }
      setTheme(resolveThemeFromStorage());
    };
    window.addEventListener(THEME_EVENT, onThemeChange as EventListener);
    return () => window.removeEventListener(THEME_EVENT, onThemeChange as EventListener);
  }, []);

  useEffect(() => {
    if (paletteOpen) paletteInputRef.current?.focus();
  }, [paletteOpen]);

  useEffect(() => {
    setPaletteIndex(0);
  }, [paletteQuery, paletteOpen]);

  useEffect(() => {
    if (projectHubOpen) projectHubInputRef.current?.focus();
  }, [projectHubOpen]);

  useDashboardKeyboardShortcuts({
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
    currentItemsLength: currentItems.length,
    setTheme,
    setSpecsFilter,
    setChangeFilter,
    searchInputRef
  });

  return (
    <div className="page">
      <div className="tabs-wrap">
        {([
          ['overview', '概览'],
          ['specs', '提案'],
          ['changes', '变更'],
          ['archive', '归档']
        ] as [TabMode, string][]).map(([mode, label]) => (
          <button key={mode} className={`tab ${tab === mode ? 'active' : ''}`} onClick={() => setTab(mode)}>
            {label}
          </button>
        ))}
        <button
          className="console-nav__theme"
          onClick={() => {
            const next = theme === 'dark' ? 'light' : 'dark';
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
      </div>

      <DashboardPanels
        tab={tab}
        projectName={project?.name || '-'}
        projectRoot={project?.root || ''}
        projectBranch={project?.gitBranch || '-'}
        projectContextLabel={project?.projectContextLabel || '-'}
        projectUpdatedAt={formatTime(project?.updatedAt)}
        projectSpecCount={project?.metrics?.specCount || 0}
        projectActiveChangeCount={project?.metrics?.activeChangeCount || 0}
        projectArchivedChangeCount={project?.metrics?.archivedChangeCount || 0}
        projectRequirementCount={project?.metrics?.requirementCount || 0}
        projectScenarioCount={project?.metrics?.scenarioCount || 0}
        search={search}
        setSearch={setSearch}
        searchInputRef={searchInputRef}
        onCycleFilter={cycleFilter}
        filterLabel={filterLabel}
        currentItems={currentItems}
        itemIndex={itemIndex}
        setItemIndex={setItemIndex}
        detailModel={detailModel}
        projectSwitchLabel={project?.name || '项目'}
        projectSwitchBranch={project?.gitBranch || '版本控制'}
        onOpenProjectHub={() => setProjectHubOpen(true)}
        onOpenActionCenter={() => setActionOpen(true)}
        showActionButton={tab === 'changes' && !!selectedItem}
        busy={busy}
        actionStatusText={tab === 'changes' && !!selectedItem ? message : ''}
        actionStatusMode={actionStatusMode}
        actionLog={actionLog}
        onValidateAction={() => { void runAction('validate-change'); }}
        onArchiveAction={() => { void runAction('archive-change'); }}
      />

      <footer className="footer">{
        `${message} · v${version} · 快捷键: 1/2/3/4 / j/k / f / p / o / Ctrl(Cmd)+K`
      }</footer>

      <GlobalSearchPalette
        open={paletteOpen}
        query={paletteQuery}
        index={paletteIndex}
        hits={paletteHits}
        inputRef={paletteInputRef}
        onClose={() => setPaletteOpen(false)}
        onQueryChange={setPaletteQuery}
        onIndexChange={setPaletteIndex}
        onNavigate={(hit: SearchHit) => {
          setTab(hit.tab);
          setItemIndex(hit.index);
          setPaletteOpen(false);
        }}
      />

      <ProjectHubModal
        open={projectHubOpen}
        query={projectHubQuery}
        busy={busy}
        recent={projectHubRecent}
        active={projectHubActive}
        fallbackOpened={projectHubFallbackOpened}
        currentPath={project?.root || ''}
        inputRef={projectHubInputRef}
        formatTime={formatTime}
        onClose={() => setProjectHubOpen(false)}
        onQueryChange={setProjectHubQuery}
        onOpenProject={openProject}
        onRemoveRecent={removeRecent}
        onHandleMissingProject={handleMissingProject}
      />

      <ActionCenterModal
        open={actionOpen}
        busy={busy}
        canRun={tab === 'changes' && !!selectedItem}
        log={actionLog}
        onClose={() => setActionOpen(false)}
        onValidate={() => { void runAction('validate-change'); }}
        onArchive={() => { void runAction('archive-change'); }}
      />

      <ConfirmDialog
        open={confirmOpen}
        title={confirmTitle}
        message={confirmMessage}
        cancelText={confirmCancelText}
        confirmText={confirmConfirmText}
        onCancel={() => closeConfirm(false)}
        onConfirm={() => closeConfirm(true)}
      />
    </div>
  );
}
