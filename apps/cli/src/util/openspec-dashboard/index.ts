// @ts-nocheck
import { loadProjects } from './loader';
import { renderDashboard } from './ui';
import { renderWebDashboard } from './web';
import { loadRecentProjects, recordOpenedProjects, removeRecentProject } from './recent-projects';
import { createActiveSession, listActiveProjects } from './active-sessions';
import { executeOpenSpecPanelAction } from './panel-actions';
import { loadSkills } from './skills';

export async function runOpenSpecPanel({ cwd, theme = 'dark', docPath, ui = 'tui', watch = true, module = 'openspec' }) {
  let projects = loadProjects({ cwd, docPath });
  if (module === 'openspec' && !projects.length) {
    throw new Error('没有可展示的 OpenSpec 项目');
  }
  if (projects.length) {
    recordOpenedProjects(projects, { ui, theme });
  }
  const activeSession = createActiveSession(projects);
  let skillsPayload = await loadSkills({ cwd });

  try {
    if (ui === 'web') {
      await renderWebDashboard({
        projects,
        projectInstalledSkills: skillsPayload.projectInstalledItems,
        globalInstalledSkills: skillsPayload.globalInstalledItems,
        initialPath: module === 'skills' ? '/skills' : '/',
        recentProjects: loadRecentProjects(),
        activeProjects: listActiveProjects(),
        themeName: theme,
        watch,
        reload: async () => {
          const scanned = loadProjects({ cwd, docPath });
          const next = mergeProjects(scanned, projects, { cwd });
          const nextSkillsPayload = await loadSkills({ cwd });
          projects = next;
          skillsPayload = nextSkillsPayload;
          activeSession.heartbeat(next);
          return {
            projects: next,
            projectInstalledSkills: nextSkillsPayload.projectInstalledItems,
            globalInstalledSkills: nextSkillsPayload.globalInstalledItems,
            recentProjects: loadRecentProjects(),
            activeProjects: listActiveProjects()
          };
        },
        openProject: (projectPath) => {
          const loaded = loadProjects({ cwd, docPath: projectPath });
          if (!loaded.length) {
            throw new Error('未找到可打开的 OpenSpec 项目');
          }
          recordOpenedProjects(loaded, { ui: 'web', theme });
          projects = [loaded[0], ...projects.filter(item => item.root !== loaded[0].root)];
          activeSession.heartbeat(projects);
          return {
            project: loaded[0],
            recentProjects: loadRecentProjects(),
            activeProjects: listActiveProjects()
          };
        },
        removeRecentProject: (projectPath) => removeRecentProject(projectPath),
        runOpenSpecAction: async ({ projectPath, action, changeId, name }) => {
          const targetPath = String(projectPath || '').trim();
          if (!targetPath) {
            throw new Error('缺少项目路径');
          }
          const current = projects.find(item => item.root === targetPath);
          const loaded = current ? [current] : loadProjects({ cwd, docPath: targetPath });
          if (!loaded.length) {
            throw new Error('目标项目未包含 OpenSpec');
          }
          const targetRoot = loaded[0].root;
          if (!projects.find(item => item.root === targetRoot)) {
            projects = [loaded[0], ...projects];
          }

          const commandResult = executeOpenSpecPanelAction({ projectPath: targetRoot, action, changeId, name });

          const scanned = loadProjects({ cwd });
          projects = mergeProjects(scanned, projects, { cwd });
          skillsPayload = await loadSkills({ cwd });
          recordOpenedProjects(projects, { ui: 'web', theme });
          activeSession.heartbeat(projects);

          return {
            ...commandResult,
            projects,
            projectInstalledSkills: skillsPayload.projectInstalledItems,
            globalInstalledSkills: skillsPayload.globalInstalledItems,
            recentProjects: loadRecentProjects(),
            activeProjects: listActiveProjects()
          };
        }
      });
      return;
    }

    if (module === 'skills') {
      throw new Error('skills 模块当前仅支持 Web 模式，请使用: hs-cli console skills --ui web');
    }

    await renderDashboard({ projects, themeName: theme });
  } finally {
    activeSession.stop();
  }
}

function mergeProjects(scannedProjects, existingProjects, { cwd }) {
  const merged = [...(Array.isArray(scannedProjects) ? scannedProjects : [])];
  const seen = new Set(merged.map(item => item.root));

  (Array.isArray(existingProjects) ? existingProjects : []).forEach(project => {
    const root = String(project?.root || '').trim();
    if (!root || seen.has(root)) return;
    try {
      const loaded = loadProjects({ cwd, docPath: root });
      if (loaded && loaded[0]) {
        merged.push(loaded[0]);
        seen.add(loaded[0].root);
      }
    } catch {
      // ignore invalid or deleted paths in watch merge
    }
  });

  return merged;
}


function mergeProjects(scannedProjects, existingProjects, { cwd }) {
  const merged = [...(Array.isArray(scannedProjects) ? scannedProjects : [])];
  const seen = new Set(merged.map(item => item.root));

  (Array.isArray(existingProjects) ? existingProjects : []).forEach(project => {
    const root = String(project?.root || '').trim();
    if (!root || seen.has(root)) return;
    try {
      const loaded = loadProjects({ cwd, docPath: root });
      if (loaded && loaded[0]) {
        merged.push(loaded[0]);
        seen.add(loaded[0].root);
      }
    } catch {
      // ignore invalid or deleted paths in watch merge
    }
  });

  return merged;
}
