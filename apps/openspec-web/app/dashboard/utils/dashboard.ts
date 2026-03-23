import type { ArchiveItem, ChangeItem, DashboardData, SpecItem, TabMode } from '../types';

const EMPTY_DATA: DashboardData = { version: 0, projects: [], recentProjects: [], activeProjects: [] };

function toArray<T>(value: unknown): T[] {
  return Array.isArray(value) ? (value as T[]) : [];
}

export function includesQuery(value: unknown, query: string): boolean {
  if (!query) return true;
  return JSON.stringify(value).toLowerCase().includes(query);
}

export function normalizeDashboardData(input: unknown): DashboardData {
  const base = input as Partial<DashboardData> | null;
  if (!base || typeof base !== 'object') return EMPTY_DATA;
  const projects = toArray<unknown>(base.projects).map((project): DashboardData['projects'][number] => {
    const item = (project || {}) as Record<string, unknown>;
    return {
      name: String(item.name || ''),
      root: String(item.root || ''),
      gitBranch: String(item.gitBranch || ''),
      updatedAt: Number(item.updatedAt || 0),
      projectRaw: String(item.projectRaw || ''),
      projectContextLabel: String(item.projectContextLabel || ''),
      metrics: (item.metrics || {}) as DashboardData['projects'][number]['metrics'],
      specs: toArray<SpecItem>(item.specs),
      changes: toArray<ChangeItem>(item.changes),
      archives: toArray<ArchiveItem>(item.archives)
    };
  }).filter(item => item.root);

  return {
    version: Number(base.version || 0),
    projects,
    recentProjects: toArray(base.recentProjects),
    activeProjects: toArray(base.activeProjects)
  };
}

export function getItemLabel(tab: TabMode, item: SpecItem | ChangeItem | ArchiveItem): string {
  if (tab === 'specs' && 'id' in item) return item.id;
  if (tab === 'changes' && 'id' in item) return item.id;
  if (tab === 'archive' && 'id' in item) return item.id;
  return '';
}

export function getItemMeta(tab: TabMode, item: SpecItem | ChangeItem | ArchiveItem): string {
  if (tab === 'specs' && 'requirementCount' in item && 'scenarioCount' in item) {
    const sourceText = item.source === 'change-delta' ? 'delta' : item.source;
    return `${sourceText} · ${item.requirementCount}R/${item.scenarioCount}S`;
  }
  if (tab === 'changes' && 'taskDone' in item && 'taskTotal' in item) {
    return `${item.taskDone}/${item.taskTotal} · ${item.isTaskComplete ? 'done' : 'todo'}`;
  }
  if (tab === 'archive' && 'markdownFiles' in item) {
    if (item.updatedAt) return formatDate(item.updatedAt);
    return `${item.markdownFiles.length} files`;
  }
  return '';
}

function formatDate(input?: number): string {
  if (!input) return '-';
  const d = new Date(input);
  if (Number.isNaN(d.getTime())) return '-';
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

export function getProjectAvatarText(name: string): string {
  const value = String(name || '').trim();
  if (!value) return 'OS';
  const tokens = value.split(/[-_\s/]+/).filter(Boolean);
  if (tokens.length >= 2) {
    return `${tokens[0][0]}${tokens[1][0]}`.toUpperCase();
  }
  return value.slice(0, 2).toUpperCase();
}

export function getProjectAvatarColor(seed: string): string {
  const palette = ['#ef7d57', '#5b8ff9', '#41b883', '#f59e0b', '#9b8afb', '#22a6b3', '#ef4444', '#0ea5e9'];
  const text = String(seed || '');
  let hash = 0;
  for (let i = 0; i < text.length; i += 1) {
    hash = (hash * 31 + text.charCodeAt(i)) >>> 0;
  }
  return palette[hash % palette.length];
}

export function getNextPaletteIndex(current: number, direction: 'up' | 'down', total: number): number {
  if (total <= 0) return 0;
  if (direction === 'down') return (current + 1) % total;
  return (current - 1 + total) % total;
}
