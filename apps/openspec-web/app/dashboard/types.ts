export type ThemeMode = 'dark' | 'light';
export type TabMode = 'overview' | 'specs' | 'changes' | 'archive';
export type SpecsFilter = 'all' | 'base' | 'change-delta';
export type ChangeFilter = 'all' | 'todo' | 'done';

export type TaskItem = { done: boolean; text: string };
export type SpecItem = {
  id: string;
  source: string;
  sourceChangeId?: string;
  requirementCount: number;
  scenarioCount: number;
  requirements: string[];
  scenarios: string[];
  rawContent: string;
  path?: string;
  designRaw: string;
  designPath?: string;
  updatedAt?: number;
};
export type ChangeItem = {
  id: string;
  taskDone: number;
  taskTotal: number;
  isTaskComplete: boolean;
  tasks: TaskItem[];
  summary: { title: string; why: string; what: string };
  proposalRaw: string;
  tasksRaw: string;
  designRaw: string;
  path?: string;
  designPath?: string;
  updatedAt?: number;
  hasProposal?: boolean;
  hasTasks?: boolean;
  hasDesign?: boolean;
};
export type ArchiveFile = { relativePath: string; rawContent: string; path?: string };
export type ArchiveItem = { id: string; markdownFiles: ArchiveFile[]; path?: string; updatedAt?: number };

export type Project = {
  name: string;
  root: string;
  gitBranch?: string;
  updatedAt?: number;
  projectRaw?: string;
  projectContextLabel?: string;
  projectContextFile?: string;
  projectFile?: string;
  metrics?: {
    specCount?: number;
    activeChangeCount?: number;
    archivedChangeCount?: number;
    requirementCount?: number;
    scenarioCount?: number;
  };
  specs?: SpecItem[];
  changes?: ChangeItem[];
  archives?: ArchiveItem[];
};

export type RecentProject = { path: string; name: string; exists?: boolean; gitBranch?: string; lastOpenedAt?: number };
export type ActiveProject = { path: string; name: string; exists?: boolean; gitBranch?: string; lastSeenAt?: number };
export type DashboardData = {
  version: number;
  projects: Project[];
  recentProjects: RecentProject[];
  activeProjects: ActiveProject[];
};
export type ActionResult = { ok: boolean; command?: string; output?: string; message?: string };
export type VersionPayload = { version: number };
export type SearchHit = { tab: Exclude<TabMode, 'overview'>; index: number; label: string; snippet: string };

export type DetailTone = 'ok' | 'warn' | 'muted';
export type DetailLine = {
  label: string;
  value: string;
  accent?: boolean;
  tone?: DetailTone;
};
export type DetailSection = {
  title: string;
  items?: string[];
  tasks?: TaskItem[];
  text?: string;
};
export type DetailFile = {
  key: string;
  label: string;
  path: string;
  source: string;
  raw: string;
  mode?: 'markdown' | 'raw';
};
export type DetailModel = {
  title: string;
  subtitle?: string;
  pathHint?: string;
  lines: DetailLine[];
  sections: DetailSection[];
  files: DetailFile[];
  emptyText?: string;
};
