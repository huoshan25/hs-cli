import os from 'os';
import path from 'path';
import fs from 'fs-extra';
import { type LinkedAgentRecord } from './skills-installed';

export type SkillAgent = 'codex';

export function getSupportedSkillAgents(): SkillAgent[] {
  return ['codex'];
}

export function resolveAgentSkillsDir(agent: SkillAgent): string {
  if (agent === 'codex') {
    const fromEnv = String(process.env.HS_CLI_CODEX_SKILLS_DIR || '').trim();
    if (fromEnv) return path.resolve(fromEnv);

    const codexHome = String(process.env.CODEX_HOME || '').trim();
    if (codexHome) return path.join(path.resolve(codexHome), 'skills');

    return path.join(os.homedir(), '.codex', 'skills');
  }

  return path.join(os.homedir(), '.codex', 'skills');
}

export async function linkInstalledSkillToAgent(
  skillId: string,
  installedRoot: string,
  agent: SkillAgent
): Promise<LinkedAgentRecord> {
  const agentSkillsDir = resolveAgentSkillsDir(agent);
  const targetPath = path.join(agentSkillsDir, skillId);
  await fs.mkdirp(agentSkillsDir);
  await fs.remove(targetPath);

  let mode: LinkedAgentRecord['mode'] = 'symlink';
  try {
    await fs.symlink(installedRoot, targetPath, 'dir');
  } catch {
    mode = 'copy';
    await fs.copy(installedRoot, targetPath);
  }

  return {
    agent,
    targetPath,
    mode,
    linkedAt: Date.now()
  };
}

export async function removeInstalledSkillLink(skillId: string, agent: SkillAgent): Promise<void> {
  const targetPath = path.join(resolveAgentSkillsDir(agent), skillId);
  await fs.remove(targetPath);
}

export async function inspectAgentLink(
  skillId: string,
  agent: SkillAgent
): Promise<{ exists: boolean; valid: boolean; targetPath: string }> {
  const targetPath = path.join(resolveAgentSkillsDir(agent), skillId);
  if (!(await fs.pathExists(targetPath))) {
    return { exists: false, valid: false, targetPath };
  }

  try {
    const stat = await fs.lstat(targetPath);
    if (stat.isSymbolicLink()) {
      const realTarget = await fs.realpath(targetPath);
      return {
        exists: true,
        valid: await fs.pathExists(realTarget),
        targetPath
      };
    }

    return {
      exists: true,
      valid: await fs.pathExists(path.join(targetPath, 'SKILL.md')),
      targetPath
    };
  } catch {
    return { exists: true, valid: false, targetPath };
  }
}
