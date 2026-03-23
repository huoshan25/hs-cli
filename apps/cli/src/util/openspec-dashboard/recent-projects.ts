// @ts-nocheck
import fs from 'fs';
import os from 'os';
import path from 'path';

const MAX_RECENT_ITEMS = 60;

function getRecentFile() {
  return process.env.HS_CLI_RECENT_PROJECTS_PATH || path.join(os.homedir(), '.hs-cli', 'openspec', 'recent-projects.json');
}

function ensureDir(filePath) {
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
}

function normalizeEntry(item) {
  if (!item || typeof item !== 'object') return null;
  const projectPath = String(item.path || '').trim();
  if (!projectPath) return null;
  return {
    path: projectPath,
    name: String(item.name || path.basename(projectPath) || projectPath),
    lastOpenedAt: Number(item.lastOpenedAt || 0),
    openCount: Number(item.openCount || 0),
    gitBranch: item.gitBranch ? String(item.gitBranch) : '',
    lastUi: item.lastUi ? String(item.lastUi) : '',
    lastTheme: item.lastTheme ? String(item.lastTheme) : ''
  };
}

function readRecentRaw() {
  try {
    const file = getRecentFile();
    if (!fs.existsSync(file)) return [];
    const parsed = JSON.parse(fs.readFileSync(file, 'utf8'));
    if (!Array.isArray(parsed)) return [];
    return parsed.map(normalizeEntry).filter(Boolean);
  } catch {
    return [];
  }
}

function writeRecentRaw(items) {
  try {
    const file = getRecentFile();
    ensureDir(file);
    const tmp = `${file}.tmp-${process.pid}-${Date.now()}`;
    fs.writeFileSync(tmp, `${JSON.stringify(items, null, 2)}\n`, 'utf8');
    fs.renameSync(tmp, file);
  } catch {
    // best-effort persistence
  }
}

export function loadRecentProjects() {
  return readRecentRaw()
    .map(item => ({ ...item, exists: fs.existsSync(item.path) }))
    .sort((a, b) => b.lastOpenedAt - a.lastOpenedAt);
}

export function recordOpenedProjects(projects, { ui = '', theme = '' } = {}) {
  const list = Array.isArray(projects) ? projects : [];
  if (!list.length) return;

  const byPath = new Map(readRecentRaw().map(item => [item.path, item]));
  const openedAt = Date.now();
  list.forEach(project => {
    const projectPath = String(project?.root || '').trim();
    if (!projectPath) return;
    const previous = byPath.get(projectPath);
    byPath.set(projectPath, {
      path: projectPath,
      name: String(project?.name || path.basename(projectPath) || projectPath),
      lastOpenedAt: openedAt,
      openCount: Number(previous?.openCount || 0) + 1,
      gitBranch: String(project?.gitBranch || previous?.gitBranch || ''),
      lastUi: ui || previous?.lastUi || '',
      lastTheme: theme || previous?.lastTheme || ''
    });
  });

  const next = [...byPath.values()]
    .sort((a, b) => b.lastOpenedAt - a.lastOpenedAt)
    .slice(0, MAX_RECENT_ITEMS);
  writeRecentRaw(next);
}

export function removeRecentProject(projectPath) {
  const target = String(projectPath || '').trim();
  if (!target) return loadRecentProjects();
  const next = readRecentRaw().filter(item => item.path !== target);
  writeRecentRaw(next);
  return loadRecentProjects();
}
