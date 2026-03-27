// @ts-nocheck
import { inspectAgentLink } from '../skills-agent-adapters';
import { listInstalledSkillLocks, resolveInstalledSkillsDir } from '../skills-installed';
import { collectSkills } from '../skills-sources';
import { collectOfficialSkills, resolveOfficialSkillsRoot } from '../skills-official';

export async function loadSkills({ cwd, skillsDir }) {
  const workspace = collectSkills({
    cwd,
    workspaceSkillsDir: skillsDir
  });
  const official = collectOfficialSkills();

  const installedItems = await Promise.all(
    (await listInstalledSkillLocks()).map(async (entry) => ({
      id: entry.lock.id,
      version: entry.lock.version,
      sourceType: entry.lock.sourceType,
      sourcePath: entry.lock.sourcePath,
      installedAt: entry.lock.installedAt,
      root: entry.root,
      linkedAgents: await Promise.all(
        entry.lock.linkedAgents.map(async (linked) => ({
          ...linked,
          valid: (await inspectAgentLink(entry.lock.id, linked.agent)).valid
        }))
      )
    }))
  );

  return {
    root: workspace.root,
    items: workspace.items,
    officialRoot: official.root || resolveOfficialSkillsRoot(),
    officialItems: official.items,
    installedDir: resolveInstalledSkillsDir(),
    installedItems
  };
}
