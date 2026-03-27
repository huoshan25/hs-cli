import os from 'os';
import path from 'path';
import fs from 'fs-extra';
import { execFile } from 'child_process';
import { promisify } from 'util';

const execFileAsync = promisify(execFile);

export interface GitSkillSource {
  sourcePath: string;
  cleanup: () => Promise<void>;
}

export function isGitSkillSource(input: string): boolean {
  const value = String(input || '').trim();
  return /^(git\+)?https?:\/\/.+(\.git)?$/i.test(value) || /^git@[^:]+:.+(\.git)?$/i.test(value);
}

export function normalizeGitUrl(input: string): string {
  return String(input || '').trim().replace(/^git\+/, '');
}

export async function cloneGitSkillSource(input: string): Promise<GitSkillSource> {
  const gitUrl = normalizeGitUrl(input);
  const tempRoot = await fs.mkdtemp(path.join(os.tmpdir(), 'hs-cli-skill-git-'));
  const repoRoot = path.join(tempRoot, 'repo');

  try {
    await execFileAsync('git', ['clone', '--depth', '1', gitUrl, repoRoot]);
    const sourcePath = await resolveSkillRootFromClone(repoRoot);

    return {
      sourcePath,
      cleanup: async () => {
        await fs.remove(tempRoot);
      }
    };
  } catch (error) {
    await fs.remove(tempRoot);
    throw error;
  }
}

async function resolveSkillRootFromClone(repoRoot: string): Promise<string> {
  if (await isSkillDirectory(repoRoot)) {
    return repoRoot;
  }

  const entries = await fs.readdir(repoRoot, { withFileTypes: true });
  const childSkillDirs: string[] = [];
  for (const entry of entries) {
    if (!entry.isDirectory() || entry.name === '.git') continue;
    const candidate = path.join(repoRoot, entry.name);
    if (await isSkillDirectory(candidate)) {
      childSkillDirs.push(candidate);
    }
  }

  if (childSkillDirs.length === 1) {
    return childSkillDirs[0]!;
  }

  throw new Error('git 仓库中未找到唯一可安装的 skill 目录');
}

async function isSkillDirectory(targetPath: string): Promise<boolean> {
  return (await fs.pathExists(path.join(targetPath, 'SKILL.md')))
    && (await fs.pathExists(path.join(targetPath, 'metadata.yaml')));
}
