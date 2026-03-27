import path from 'path';
import fs from 'fs-extra';

export type SkillSourceKind = 'workspace' | 'official';

export interface SkillRecord {
  id: string;
  name: string;
  root: string;
  version: string;
  owner: string;
  status: string;
  description: string;
  hasSkillDoc: boolean;
  examplesCount: number;
  testsCount: number;
  updatedAt: number;
  source: SkillSourceKind;
  sourceRoot: string;
}

export function collectSkills(options: {
  cwd: string;
  workspaceSkillsDir?: string;
}): { root: string; items: SkillRecord[] } {
  const cwd = path.resolve(options.cwd);
  const workspaceRoot = options.workspaceSkillsDir
    ? path.resolve(cwd, options.workspaceSkillsDir)
    : resolveWorkspaceSkillsRoot(cwd);

  return {
    root: workspaceRoot,
    items: readSkillsFromRoot(workspaceRoot, 'workspace').sort((a, b) => a.id.localeCompare(b.id))
  };
}

export function locateWorkspaceSkillsRoot(cwd: string): string {
  return resolveWorkspaceSkillsRoot(path.resolve(cwd));
}

export function readSkillsFromRoot(rootDir: string, source: SkillSourceKind): SkillRecord[] {
  const root = path.resolve(rootDir);
  if (!fs.existsSync(root)) return [];
  if (!fs.statSync(root).isDirectory()) return [];

  const entries = fs
    .readdirSync(root, { withFileTypes: true })
    .filter((entry) => entry.isDirectory())
    .map((entry) => entry.name)
    .filter((name) => name !== 'templates' && name !== 'registry')
    .sort((a, b) => a.localeCompare(b));

  return entries.map((name) => {
    const skillRoot = path.join(root, name);
    const metadataPath = path.join(skillRoot, 'metadata.yaml');
    const metadataRaw = safeReadFile(metadataPath);
    const description = parseYamlScalar(metadataRaw, 'description') || '';
    const version = parseYamlScalar(metadataRaw, 'version') || '0.0.0';
    const owner = parseYamlScalar(metadataRaw, 'owner') || '';
    const status = parseYamlScalar(metadataRaw, 'status') || '';
    const hasSkillDoc = fs.existsSync(path.join(skillRoot, 'SKILL.md'));
    const examplesCount = countDirEntries(path.join(skillRoot, 'examples'));
    const testsCount = countDirEntries(path.join(skillRoot, 'tests'));
    const updatedAt = getLastModifiedTime(skillRoot);

    return {
      id: name,
      name,
      root: skillRoot,
      version,
      owner,
      status,
      description,
      hasSkillDoc,
      examplesCount,
      testsCount,
      updatedAt,
      source,
      sourceRoot: root
    };
  });
}

function resolveWorkspaceSkillsRoot(cwd: string): string {
  let current = path.resolve(cwd);
  while (true) {
    const candidate = path.join(current, 'skills');
    if (fs.existsSync(candidate) && fs.statSync(candidate).isDirectory()) {
      return candidate;
    }
    const parent = path.dirname(current);
    if (parent === current) break;
    current = parent;
  }
  return path.resolve(cwd, 'skills');
}

function safeReadFile(filePath: string): string {
  try {
    if (!fs.existsSync(filePath)) return '';
    return fs.readFileSync(filePath, 'utf-8');
  } catch {
    return '';
  }
}

function parseYamlScalar(content: string, key: string): string {
  const regex = new RegExp(`^${key}:\\s*(.+)$`, 'm');
  const match = String(content || '').match(regex);
  if (!match || !match[1]) return '';
  return String(match[1]).trim().replace(/^['"]|['"]$/g, '');
}

function countDirEntries(dirPath: string): number {
  try {
    if (!fs.existsSync(dirPath)) return 0;
    return fs.readdirSync(dirPath).length;
  } catch {
    return 0;
  }
}

function getLastModifiedTime(targetPath: string): number {
  try {
    const stat = fs.statSync(targetPath);
    return stat.mtimeMs || 0;
  } catch {
    return 0;
  }
}
