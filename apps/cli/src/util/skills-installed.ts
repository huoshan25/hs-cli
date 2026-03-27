import os from 'os';
import path from 'path';
import fs from 'fs-extra';

export type SkillInstallSourceType = 'workspace' | 'local' | 'official' | 'git';
export type SkillLinkMode = 'symlink' | 'copy';

export interface LinkedAgentRecord {
  agent: string;
  targetPath: string;
  mode: SkillLinkMode;
  linkedAt: number;
}

export interface InstalledSkillLock {
  id: string;
  version: string;
  sourceType: SkillInstallSourceType;
  sourcePath: string;
  installedAt: number;
  linkedAgents: LinkedAgentRecord[];
}

export interface InstalledSkillEntry {
  root: string;
  lock: InstalledSkillLock;
}

const LOCKFILE_NAME = '.skill-lock.json';

export function resolveInstalledSkillsDir(): string {
  const fromEnv = String(process.env.HS_CLI_INSTALLED_SKILLS_DIR || '').trim();
  return fromEnv ? path.resolve(fromEnv) : path.join(os.homedir(), '.hs-cli', 'skills', 'installed');
}

export function getInstalledSkillRoot(skillId: string): string {
  return path.join(resolveInstalledSkillsDir(), skillId);
}

export function getInstalledSkillLockPath(skillRootOrId: string): string {
  const root = skillRootOrId.includes(path.sep) ? skillRootOrId : getInstalledSkillRoot(skillRootOrId);
  return path.join(root, LOCKFILE_NAME);
}

export async function readInstalledSkillLock(skillRootOrId: string): Promise<InstalledSkillLock | null> {
  try {
    const lockPath = getInstalledSkillLockPath(skillRootOrId);
    if (!(await fs.pathExists(lockPath))) return null;
    return (await fs.readJson(lockPath)) as InstalledSkillLock;
  } catch {
    return null;
  }
}

export async function writeInstalledSkillLock(
  skillRootOrId: string,
  lock: InstalledSkillLock
): Promise<void> {
  const lockPath = getInstalledSkillLockPath(skillRootOrId);
  await fs.mkdirp(path.dirname(lockPath));
  await fs.writeJson(lockPath, lock, { spaces: 2 });
}

export async function installSkillFromSource(options: {
  sourcePath: string;
  skillId: string;
  version: string;
  sourceType: SkillInstallSourceType;
  sourceRef?: string;
}): Promise<{ installDir: string; lock: InstalledSkillLock }> {
  const installDir = getInstalledSkillRoot(options.skillId);
  await fs.remove(installDir);
  await fs.mkdirp(path.dirname(installDir));
  await fs.copy(path.resolve(options.sourcePath), installDir);

  const lock: InstalledSkillLock = {
    id: options.skillId,
    version: options.version,
    sourceType: options.sourceType,
    sourcePath: options.sourceRef ? String(options.sourceRef) : path.resolve(options.sourcePath),
    installedAt: Date.now(),
    linkedAgents: []
  };
  await writeInstalledSkillLock(installDir, lock);
  return { installDir, lock };
}

export async function listInstalledSkillLocks(): Promise<InstalledSkillEntry[]> {
  const root = resolveInstalledSkillsDir();
  if (!(await fs.pathExists(root))) return [];
  const stat = await fs.stat(root);
  if (!stat.isDirectory()) return [];

  const entries = await fs.readdir(root, { withFileTypes: true });
  const result: InstalledSkillEntry[] = [];
  for (const entry of entries) {
    if (!entry.isDirectory()) continue;
    const skillRoot = path.join(root, entry.name);
    const lock = await readInstalledSkillLock(skillRoot);
    if (!lock) continue;
    result.push({ root: skillRoot, lock });
  }
  return result.sort((a, b) => a.lock.id.localeCompare(b.lock.id));
}
