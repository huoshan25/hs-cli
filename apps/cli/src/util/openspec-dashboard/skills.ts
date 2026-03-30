import path from 'path';
import os from 'os';
import fs from 'fs-extra';
import { collectSkills } from '../skills-sources';

// npx skills 的 canonical 目录（真实文件存放处）
const CANONICAL_PROJECT_DIR = path.join('.agents', 'skills');
const CANONICAL_GLOBAL_DIR = path.join('.agents', 'skills');

// 各 agent 的专属链接目录（相对于项目根目录 或 home 目录）
const PROJECT_AGENT_DIRS: Record<string, string> = {
  'Claude Code': '.claude/skills',
  'Codex': '.codex/skills',
  'Cursor': '.cursor/skills',
  'Windsurf': '.windsurf/skills',
  'Roo Code': '.roo/skills',
  'Continue': '.continue/skills',
};

const GLOBAL_AGENT_DIRS: Record<string, string> = {
  'Claude Code': '.claude/skills',
  'Codex': '.codex/skills',
  'Cursor': '.cursor/skills',
  'Windsurf': path.join('.codeium', 'windsurf', 'skills'),
};

export interface LinkedAgentStatus {
  agent: string;
  targetPath: string;
  valid: boolean;
}

export interface InstalledSkillItem {
  name: string;
  canonicalPath: string;
  scope: 'project' | 'global';
  pluginName?: string;
  source?: string;
  sourceType?: string;
  installedAt?: string;
  updatedAt?: string;
  linkedAgents: LinkedAgentStatus[];
}

export async function loadSkills({ cwd, skillsDir }: { cwd: string; skillsDir?: string }) {
  const workspace = collectSkills({ cwd, workspaceSkillsDir: skillsDir });
  const [projectInstalledItems, globalInstalledItems] = await Promise.all([
    loadProjectInstalledSkills(cwd),
    loadGlobalInstalledSkills(),
  ]);

  return {
    root: workspace.root,
    items: workspace.items,
    projectInstalledItems,
    globalInstalledItems,
  };
}

async function loadProjectInstalledSkills(cwd: string): Promise<InstalledSkillItem[]> {
  const canonicalDir = path.join(cwd, CANONICAL_PROJECT_DIR);
  const lockPath = path.join(cwd, 'skills-lock.json');

  const [skillNames, lockData] = await Promise.all([
    scanSkillsDir(canonicalDir),
    readProjectLock(lockPath),
  ]);

  return Promise.all(
    skillNames.map(async (name) => {
      const canonicalPath = path.join(canonicalDir, name);
      const linkedAgents = await checkAgentLinks(cwd, name, PROJECT_AGENT_DIRS);
      return {
        name,
        canonicalPath,
        scope: 'project' as const,
        pluginName: lockData[name]?.pluginName,
        source: lockData[name]?.source,
        sourceType: lockData[name]?.sourceType,
        installedAt: lockData[name]?.installedAt,
        updatedAt: lockData[name]?.updatedAt,
        linkedAgents,
      };
    })
  );
}

async function loadGlobalInstalledSkills(): Promise<InstalledSkillItem[]> {
  const home = os.homedir();
  const canonicalDir = path.join(home, CANONICAL_GLOBAL_DIR);
  const lockPath = path.join(home, '.agents', '.skill-lock.json');

  const [skillNames, lockData] = await Promise.all([
    scanSkillsDir(canonicalDir),
    readGlobalLock(lockPath),
  ]);

  return Promise.all(
    skillNames.map(async (name) => {
      const canonicalPath = path.join(canonicalDir, name);
      const linkedAgents = await checkAgentLinks(home, name, GLOBAL_AGENT_DIRS);
      return {
        name,
        canonicalPath,
        scope: 'global' as const,
        pluginName: lockData[name]?.pluginName,
        source: lockData[name]?.source,
        sourceType: lockData[name]?.sourceType,
        installedAt: lockData[name]?.installedAt,
        updatedAt: lockData[name]?.updatedAt,
        linkedAgents,
      };
    })
  );
}

async function scanSkillsDir(dir: string): Promise<string[]> {
  if (!(await fs.pathExists(dir))) return [];
  try {
    const entries = await fs.readdir(dir, { withFileTypes: true });
    const names: string[] = [];
    for (const entry of entries) {
      if (!entry.isDirectory() && !entry.isSymbolicLink()) continue;
      if (await fs.pathExists(path.join(dir, entry.name, 'SKILL.md'))) {
        names.push(entry.name);
      }
    }
    return names.sort((a, b) => a.localeCompare(b));
  } catch {
    return [];
  }
}

async function checkAgentLinks(
  base: string,
  skillName: string,
  agentDirs: Record<string, string>
): Promise<LinkedAgentStatus[]> {
  const results = await Promise.all(
    Object.entries(agentDirs).map(async ([agent, relDir]) => {
      const targetPath = path.join(base, relDir, skillName);
      if (!(await fs.pathExists(targetPath))) return null;
      return { agent, targetPath, valid: await checkLinkValid(targetPath) };
    })
  );
  return results.filter((r): r is LinkedAgentStatus => r !== null);
}

async function checkLinkValid(targetPath: string): Promise<boolean> {
  try {
    const stat = await fs.lstat(targetPath);
    if (stat.isSymbolicLink()) {
      const real = await fs.realpath(targetPath);
      return fs.pathExists(real);
    }
    return fs.pathExists(path.join(targetPath, 'SKILL.md'));
  } catch {
    return false;
  }
}

interface ProjectLockEntry {
  pluginName?: string;
  source?: string;
  sourceType?: string;
  installedAt?: string;
  updatedAt?: string;
}

interface GlobalLockEntry extends ProjectLockEntry {
  installedAt?: string;
  updatedAt?: string;
}

async function readProjectLock(lockPath: string): Promise<Record<string, ProjectLockEntry>> {
  return readLockFile<ProjectLockEntry>(lockPath);
}

async function readGlobalLock(lockPath: string): Promise<Record<string, GlobalLockEntry>> {
  return readLockFile<GlobalLockEntry>(lockPath);
}

async function readLockFile<T>(lockPath: string): Promise<Record<string, T>> {
  try {
    if (!(await fs.pathExists(lockPath))) return {};
    const data = await fs.readJson(lockPath);
    return normalizeLockEntries<T>(data);
  } catch {
    return {};
  }
}

function normalizeLockEntries<T>(data: unknown): Record<string, T> {
  const skills = extractSkillsNode(data);
  if (Array.isArray(skills)) {
    return skills.reduce<Record<string, T>>((result, entry) => {
      const name = resolveLockEntryName(entry);
      if (!name) return result;
      result[name] = entry as T;
      return result;
    }, {});
  }
  if (isRecord(skills)) {
    return skills as Record<string, T>;
  }
  return {};
}

function extractSkillsNode(data: unknown): unknown {
  if (!isRecord(data)) return null;
  if ('skills' in data) return data.skills;
  if ('entries' in data) return data.entries;
  return data;
}

function resolveLockEntryName(entry: unknown): string {
  if (!isRecord(entry)) return '';
  const rawName = entry.name ?? entry.id ?? entry.skillName ?? entry.slug;
  return typeof rawName === 'string' ? rawName.trim() : '';
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === 'object' && !Array.isArray(value);
}
