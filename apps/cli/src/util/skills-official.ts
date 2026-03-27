import path from 'path';
import fs from 'fs-extra';
import { type SkillRecord, readSkillsFromRoot } from './skills-sources';

export function resolveOfficialSkillsRoot(): string {
  const fromEnv = String(process.env.HS_CLI_OFFICIAL_SKILLS_DIR || '').trim();
  if (fromEnv) {
    return path.resolve(fromEnv);
  }

  const packageRoot = path.resolve(__dirname, '..', '..');
  const candidates = [
    path.join(packageRoot, 'dist', 'skills-official'),
    path.join(packageRoot, 'skills-official'),
    path.resolve(packageRoot, '..', '..', 'skills')
  ];

  for (const candidate of candidates) {
    if (fs.existsSync(candidate) && fs.statSync(candidate).isDirectory()) {
      return candidate;
    }
  }

  return candidates[0]!;
}

export function collectOfficialSkills(): { root: string; items: SkillRecord[] } {
  const root = resolveOfficialSkillsRoot();
  return {
    root,
    items: readSkillsFromRoot(root, 'official').sort((a, b) => a.id.localeCompare(b.id))
  };
}
