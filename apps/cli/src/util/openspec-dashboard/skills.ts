import path from 'path';
import os from 'os';
import fs from 'fs-extra';

const CANONICAL_PROJECT_DIR = path.join('.agents', 'skills');
const CANONICAL_GLOBAL_DIR = path.join('.agents', 'skills');

export interface InstalledSkillItem {
  name: string;
  canonicalPath: string;
  scope: 'project' | 'global';
  pluginName?: string;
  source?: string;
  sourceType?: string;
  installedAt?: string;
  updatedAt?: string;
}

export async function loadSkills({ cwd }: { cwd: string; skillsDir?: string }) {
  const [projectInstalledItems, globalInstalledItems] = await Promise.all([
    loadProjectInstalledSkills(cwd),
    loadGlobalInstalledSkills(),
  ]);
  return { projectInstalledItems, globalInstalledItems };
}

async function loadProjectInstalledSkills(cwd: string): Promise<InstalledSkillItem[]> {
  const canonicalDir = path.join(cwd, CANONICAL_PROJECT_DIR);
  const lockPath = path.join(cwd, 'skills-lock.json');
  const [skillNames, lockData] = await Promise.all([
    scanSkillsDir(canonicalDir),
    readLockFile<LockEntry>(lockPath),
  ]);
  return skillNames.map((name) => ({
    name,
    canonicalPath: path.join(canonicalDir, name),
    scope: 'project' as const,
    pluginName: lockData[name]?.pluginName,
    source: lockData[name]?.source,
    sourceType: lockData[name]?.sourceType,
    installedAt: lockData[name]?.installedAt,
    updatedAt: lockData[name]?.updatedAt,
  }));
}

async function loadGlobalInstalledSkills(): Promise<InstalledSkillItem[]> {
  const home = os.homedir();
  const canonicalDir = path.join(home, CANONICAL_GLOBAL_DIR);
  const lockPath = path.join(home, '.agents', '.skill-lock.json');
  const [skillNames, lockData] = await Promise.all([
    scanSkillsDir(canonicalDir),
    readLockFile<LockEntry>(lockPath),
  ]);
  return skillNames.map((name) => ({
    name,
    canonicalPath: path.join(canonicalDir, name),
    scope: 'global' as const,
    pluginName: lockData[name]?.pluginName,
    source: lockData[name]?.source,
    sourceType: lockData[name]?.sourceType,
    installedAt: lockData[name]?.installedAt,
    updatedAt: lockData[name]?.updatedAt,
  }));
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

interface LockEntry {
  pluginName?: string;
  source?: string;
  sourceType?: string;
  installedAt?: string;
  updatedAt?: string;
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
  if (isRecord(skills)) return skills as Record<string, T>;
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
