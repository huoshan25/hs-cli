// @ts-nocheck
import { spawnSync } from 'child_process';
import { getTheme } from './themes';

const VIEW_MODES = ['overview', 'specs', 'changes', 'archive'];

export async function renderDashboard({ projects, themeName = 'dark' }) {
  const blessed = await importBlessed();
  const theme = getTheme(themeName);

  const state = {
    projects,
    selectedProject: 0,
    selectedItem: 0,
    activePane: projects.length > 1 ? 'projects' : 'navigator',
    viewMode: 'overview',
    searchQuery: '',
    filterMode: 'all',
    validationMessage: ''
  };
  const singleProjectMode = projects.length === 1;

  const screen = blessed.screen({
    smartCSR: true,
    title: 'OpenSpec Dashboard',
    fullUnicode: true,
    useBCE: true,
    autoPadding: true,
    dockBorders: true
  });

  const projectsPane = blessed.box({
    label: ' Projects ',
    top: 0,
    left: 0,
    width: '25%',
    height: '92%',
    border: { type: 'line', fg: theme.box.border },
    style: { fg: theme.box.fg, bg: theme.box.bg, border: { fg: theme.box.border } },
    tags: true,
    scrollable: true,
    alwaysScroll: true,
    keys: false,
    vi: false
  });

  const navigatorPane = blessed.box({
    label: ' Navigator ',
    top: 0,
    left: singleProjectMode ? 0 : '25%',
    width: singleProjectMode ? '35%' : '30%',
    height: '92%',
    border: { type: 'line', fg: theme.box.border },
    style: { fg: theme.box.fg, bg: theme.box.bg, border: { fg: theme.box.border } },
    tags: true,
    scrollable: true,
    alwaysScroll: true,
    keys: false,
    vi: false
  });

  const detailPane = blessed.box({
    label: ' Details ',
    top: 0,
    left: singleProjectMode ? '35%' : '55%',
    width: singleProjectMode ? '65%' : '45%',
    height: '92%',
    border: { type: 'line', fg: theme.box.border },
    style: { fg: theme.box.fg, bg: theme.box.bg, border: { fg: theme.box.border } },
    tags: true,
    scrollable: true,
    alwaysScroll: true,
    keys: false,
    vi: false
  });

  const footer = blessed.box({
    bottom: 0,
    left: 0,
    width: '100%',
    height: '8%',
    style: { bg: theme.footerBg, fg: theme.footerFg },
    tags: true,
    content: ''
  });

  if (!singleProjectMode) {
    screen.append(projectsPane);
  }
  screen.append(navigatorPane);
  screen.append(detailPane);
  screen.append(footer);

  const isSmallTerminal = process.stdout.columns < 120 || process.stdout.rows < 30;
  if (isSmallTerminal) {
    footer.setContent('{yellow-fg}终端窗口较小，建议放大以获得更好的三栏体验{/yellow-fg}');
  }

  refresh();

  screen.key(['q', 'C-c'], () => process.exit(0));
  screen.key(['1'], () => switchView('overview'));
  screen.key(['2'], () => switchView('specs'));
  screen.key(['3'], () => switchView('changes'));
  screen.key(['4'], () => switchView('archive'));
  screen.key(['tab'], () => {
    if (singleProjectMode) {
      state.activePane = state.activePane === 'navigator' ? 'details' : 'navigator';
      refresh();
      return;
    }
    const order = ['projects', 'navigator', 'details'];
    const next = (order.indexOf(state.activePane) + 1) % order.length;
    state.activePane = order[next];
    state.selectedItem = 0;
    refresh();
  });
  screen.key(['up'], () => moveSelection(-1));
  screen.key(['down'], () => moveSelection(1));
  screen.key(['k'], () => moveSelection(-1));
  screen.key(['j'], () => moveSelection(1));
  screen.key(['pageup'], () => moveSelection(-12));
  screen.key(['pagedown'], () => moveSelection(12));
  screen.key(['enter'], () => {
    if (!singleProjectMode && state.activePane === 'projects') {
      state.activePane = 'navigator';
      state.selectedItem = 0;
      refresh();
    }
  });
  screen.key(['/'], () => inputSearch(blessed, screen, state, refresh));
  screen.key(['f'], () => {
    if (isFilterEnabled(state.viewMode)) {
      state.filterMode = nextFilter(state.viewMode, state.filterMode);
    }
    state.selectedItem = 0;
    refresh();
  });
  screen.key(['v'], () => {
    runValidate(state);
    refresh();
  });

  function moveSelection(offset) {
    if (state.activePane === 'details') {
      detailPane.scroll(offset);
      screen.render();
      return;
    }

    if (state.activePane === 'projects') {
      const next = clamp(state.selectedProject + offset, 0, state.projects.length - 1);
      if (next !== state.selectedProject) {
        state.selectedProject = next;
        state.selectedItem = 0;
      }
      refresh();
      return;
    }

    const items = getCurrentItems(state);
    if (!items.length) {
      state.selectedItem = 0;
      refresh();
      return;
    }

    state.selectedItem = clamp(state.selectedItem + offset, 0, items.length - 1);
    refresh();
  }

  function switchView(mode) {
    state.viewMode = mode;
    state.filterMode = 'all';
    state.selectedItem = 0;
    refresh();
  }

  function refresh() {
    const selectedProject = state.projects[state.selectedProject];
    const currentItems = getCurrentItems(state);

    if (!singleProjectMode) {
      projectsPane.setLabel(` Projects (${state.projects.length}) `);
      projectsPane.setContent(renderProjectList(state, theme));
      projectsPane.style.border.fg = state.activePane === 'projects' ? theme.accent : theme.box.border;
    }
    navigatorPane.setLabel(` Navigator / ${state.viewMode} `);
    navigatorPane.style.border.fg = state.activePane === 'navigator' ? theme.accent : theme.box.border;
    detailPane.style.border.fg = state.activePane === 'details' ? theme.accent : theme.box.border;

    navigatorPane.setContent(renderNavigator(state, currentItems, theme));
    detailPane.setContent(renderDetails(state, selectedProject, currentItems[state.selectedItem], theme));
    detailPane.setScroll(0);
    footer.setContent(renderFooter(state, selectedProject, themeName));

    screen.render();
  }
}

function renderProjectList(state, theme) {
  return state.projects
    .map((project, index) => {
      const selected = index === state.selectedProject && state.activePane === 'projects';
      const updated = formatDate(project.updatedAt);
      const summary = `${project.metrics.activeChangeCount} changes / ${project.metrics.specCount} specs`;
      const line = `${project.name}\n  ${summary}\n  更新: ${updated}`;

      return selected ? colorSelected(line, theme) : `{${theme.title}-fg}${project.name}{/${theme.title}-fg}\n{${theme.muted}-fg}  ${summary}\n  更新: ${updated}{/${theme.muted}-fg}`;
    })
    .join('\n\n');
}

function renderNavigator(state, items, theme) {
  if (!items.length) {
    return `{${theme.warning}-fg}无可显示内容{/${theme.warning}-fg}`;
  }

  return items
    .map((item, index) => {
      const selected = index === state.selectedItem && state.activePane === 'navigator';
      const label = item.label;
      const meta = item.meta ? ` (${item.meta})` : '';
      const line = `${label}${meta}`;
      return selected ? colorSelected(line, theme) : line;
    })
    .join('\n');
}

function renderDetails(state, project, item, theme) {
  if (!project) return `{${theme.error}-fg}未找到项目数据{/${theme.error}-fg}`;

  const header = `{bold}{${theme.title}-fg}${project.name}{/${theme.title}-fg}{/bold}\n`;
  const canFilter = isFilterEnabled(state.viewMode);
  const filterText = canFilter ? state.filterMode : 'disabled';
  const view = `{${theme.accent}-fg}视图: ${mapViewName(state.viewMode)}{/${theme.accent}-fg}  {${theme.muted}-fg}过滤: ${filterText} 搜索: ${state.searchQuery || '-'}{/${theme.muted}-fg}\n\n`;

  if (state.viewMode === 'overview') {
    return header + view + renderOverviewDetails(project, theme);
  }

  if (!item) {
    return header + view + `{${theme.warning}-fg}当前筛选条件下无结果{/${theme.warning}-fg}`;
  }

  if (state.viewMode === 'archive') {
    return header + view + renderArchiveDetails(item, theme);
  }

  if (state.viewMode === 'changes') {
    return header + view + renderChangeDetails(item, theme);
  }

  return header + view + renderSpecDetails(item, theme);
}

function renderOverviewDetails(project, theme) {
  const lines = [];
  lines.push(`项目: ${project.name}`);
  lines.push(`上下文文件: ${project.projectContextLabel || '未找到'}`);
  lines.push(`上下文路径: ${project.projectContextFile || 'openspec/'}`);
  lines.push('');
  lines.push(`提案数: ${project.metrics.specCount}`);
  lines.push(`活跃 changes: ${project.metrics.activeChangeCount}`);
  lines.push(`归档 changes: ${project.metrics.archivedChangeCount}`);
  lines.push(`Requirement 总数: ${project.metrics.requirementCount}`);
  lines.push(`Scenario 总数: ${project.metrics.scenarioCount}`);
  lines.push('');
  lines.push(`最近更新: ${formatDate(project.updatedAt)}`);

  if (project.lastValidation) {
    lines.push(`校验结果: ${project.lastValidation.ok ? '通过' : '失败'}`);
    lines.push(`校验摘要: ${project.lastValidation.summary}`);
  }

  if (project.changes.length) {
    lines.push('');
    lines.push(`{${theme.title}-fg}最近活跃变更{/${theme.title}-fg}`);
    project.changes.slice(0, 5).forEach(change => {
      lines.push(`- ${change.id} (${change.taskDone}/${change.taskTotal})`);
    });
  }
  if (project.specs.length) {
    lines.push('');
    lines.push(`{${theme.title}-fg}提案能力{/${theme.title}-fg}`);
    project.specs.slice(0, 8).forEach(spec => {
      lines.push(`- ${spec.id} (${spec.requirementCount}R/${spec.scenarioCount}S)`);
    });
  }

  lines.push('');
  lines.push(`{${theme.title}-fg}上下文原文{/${theme.title}-fg}`);
  if (project.projectRaw) {
    lines.push(trimRaw(project.projectRaw, 220));
  } else {
    lines.push(`{${theme.warning}-fg}未找到可展示的上下文原文（project.md/config.yaml/AGENTS.md）{/${theme.warning}-fg}`);
  }

  return lines.join('\n');
}

function renderChangeDetails(change, theme) {
  const completion = `${change.taskDone}/${change.taskTotal}`;
  const status = change.isTaskComplete ? `{${theme.success}-fg}已完成{/${theme.success}-fg}` : `{${theme.warning}-fg}进行中{/${theme.warning}-fg}`;
  const summary = change.summary || {};
  const lines = [
    `{bold}${change.id}{/bold}`,
    `任务完成度: ${completion}`,
    `状态: ${status}`,
    `proposal.md: ${change.hasProposal ? 'yes' : 'no'}`,
    `tasks.md: ${change.hasTasks ? 'yes' : 'no'}`,
    `更新时间: ${formatDate(change.updatedAt)}`,
    '',
    `Summary`,
    `- 标题: ${summary.title || '未读取到标题'}`,
    `- Why: ${summary.why || '未读取到 Why'}`,
    `- What: ${summary.what || '未读取到 What Changes'}`,
    ''
  ];

  if (Array.isArray(change.tasks) && change.tasks.length) {
    lines.push('Tasks');
    change.tasks.slice(0, 30).forEach(task => {
      lines.push(`- ${task.done ? '[x]' : '[ ]'} ${task.text}`);
    });
    lines.push('');
  }

  lines.push(`路径: ${change.path}`);
  if (change.proposalRaw) {
    lines.push('');
    lines.push(`{${theme.title}-fg}proposal.md 原文{/${theme.title}-fg}`);
    lines.push(trimRaw(change.proposalRaw, 120));
  }
  if (change.tasksRaw) {
    lines.push('');
    lines.push(`{${theme.title}-fg}tasks.md 原文{/${theme.title}-fg}`);
    lines.push(trimRaw(change.tasksRaw, 120));
  }
  return lines.join('\n');
}

function renderSpecDetails(spec, theme) {
  const quality = spec.scenarioCount > 0 ? `{${theme.success}-fg}可用{/${theme.success}-fg}` : `{${theme.warning}-fg}需补 Scenario{/${theme.warning}-fg}`;
  const lines = [
    `{bold}${spec.id}{/bold}`,
    `Requirement: ${spec.requirementCount}`,
    `Scenario: ${spec.scenarioCount}`,
    `质量: ${quality}`,
    `更新时间: ${formatDate(spec.updatedAt)}`,
    ''
  ];

  if (Array.isArray(spec.requirements) && spec.requirements.length) {
    lines.push('Requirements');
    spec.requirements.slice(0, 12).forEach(req => lines.push(`- ${req}`));
    lines.push('');
  }
  if (Array.isArray(spec.scenarios) && spec.scenarios.length) {
    lines.push('Scenarios');
    spec.scenarios.slice(0, 12).forEach(sc => lines.push(`- ${sc}`));
    lines.push('');
  }
  if (spec.rawContent) {
    lines.push('');
    lines.push(`{${theme.title}-fg}spec.md 原文{/${theme.title}-fg}`);
    lines.push(trimRaw(spec.rawContent, 140));
  }

  lines.push(`路径: ${spec.path}`);
  return lines.join('\n');
}

function renderArchiveDetails(archive) {
  return [
    `{bold}${archive.id}{/bold}`,
    `更新时间: ${formatDate(archive.updatedAt)}`,
    '',
    '说明: 该条目来自 changes/archive，表示已完成并归档的变更记录。',
    `路径: ${archive.path}`
  ].join('\n');
}

function renderFooter(state, project, themeName) {
  const shortcuts = '↑/↓/j/k 选择/滚动 | PgUp/PgDn 翻页 | Tab 切 pane | 1概览/2提案/3变更/4归档 | / 搜索 | f 过滤 | v 校验 | q 退出';
  const projectText = project ? `项目: ${project.name}` : '项目: -';
  const validation = state.validationMessage ? ` | ${state.validationMessage}` : '';
  return `{bold}${projectText}{/bold} | 主题: ${themeName} | ${shortcuts}${validation}`;
}

function getCurrentItems(state) {
  const project = state.projects[state.selectedProject];
  if (!project) return [];

  if (state.viewMode === 'changes') {
    return applyFilterAndSearch(
      project.changes.map(change => ({
        type: 'change',
        label: change.id,
        meta: `${change.taskDone}/${change.taskTotal}`,
        ...change
      })),
      state
    );
  }

  if (state.viewMode === 'specs') {
    return applyFilterAndSearch(
      project.specs.map(spec => ({
        type: 'spec',
        label: spec.id,
        meta: `${spec.requirementCount}R/${spec.scenarioCount}S`,
        ...spec
      })),
      state
    );
  }

  if (state.viewMode === 'archive') {
    return applyFilterAndSearch(
      (project.archives || []).map(archive => ({
        type: 'archive',
        label: archive.id,
        meta: `${formatDate(archive.updatedAt)}`,
        ...archive
      })),
      state
    );
  }

  return applyFilterAndSearch([
    { label: '项目状态', type: 'overview', meta: `${project.metrics.activeChangeCount}c/${project.metrics.specCount}s` }
  ], state);
}

function applyFilterAndSearch(items, state) {
  let filtered = items;

  if (state.viewMode === 'changes') {
    if (state.filterMode === 'todo') {
      filtered = filtered.filter(item => !item.isTaskComplete);
    } else if (state.filterMode === 'done') {
      filtered = filtered.filter(item => item.isTaskComplete);
    }
  }

  if (state.viewMode === 'specs') {
    if (state.filterMode === 'with-scenario') {
      filtered = filtered.filter(item => item.scenarioCount > 0);
    } else if (state.filterMode === 'no-scenario') {
      filtered = filtered.filter(item => item.scenarioCount === 0);
    }
  }

  const query = state.searchQuery.trim().toLowerCase();
  if (!query) {
    return filtered;
  }

  return filtered.filter(item => `${item.label} ${item.meta || ''}`.toLowerCase().includes(query));
}

function nextFilter(viewMode, current) {
  if (viewMode === 'changes') {
    const chain = ['all', 'todo', 'done'];
    return chain[(chain.indexOf(current) + 1) % chain.length];
  }

  if (viewMode === 'specs') {
    const chain = ['all', 'with-scenario', 'no-scenario'];
    return chain[(chain.indexOf(current) + 1) % chain.length];
  }

  return 'all';
}

function isFilterEnabled(viewMode) {
  return viewMode === 'changes' || viewMode === 'specs';
}

function mapViewName(viewMode) {
  const mapping = {
    overview: '概览',
    specs: '提案',
    changes: '变更',
    archive: '归档'
  };
  return mapping[viewMode] || viewMode;
}

function trimRaw(text, maxLines = 120) {
  const lines = String(text || '').split('\n');
  if (lines.length <= maxLines) return lines.join('\n');
  return `${lines.slice(0, maxLines).join('\n')}\n... (已截断，原文共 ${lines.length} 行)`;
}

function inputSearch(blessed, screen, state, refresh) {
  const prompt = blessed.prompt({
    parent: screen,
    border: { type: 'line' },
    height: 7,
    width: '70%',
    top: 'center',
    left: 'center',
    label: ' 搜索 ',
    tags: true
  });

  prompt.input('输入关键字（留空清空）：', state.searchQuery, (_err, value) => {
    state.searchQuery = (value || '').trim();
    state.selectedItem = 0;
    refresh();
  });
}

function runValidate(state) {
  const project = state.projects[state.selectedProject];
  if (!project) return;

  const result = spawnSync('openspec', ['validate', '--strict'], {
    cwd: project.root,
    encoding: 'utf8'
  });

  const output = `${result.stdout || ''}${result.stderr || ''}`.trim();
  const summary = compactOutput(output);

  if (result.status === 0) {
    project.lastValidation = { ok: true, summary: summary || 'validate 通过' };
    state.validationMessage = '校验通过';
  } else {
    project.lastValidation = { ok: false, summary: summary || 'validate 失败' };
    state.validationMessage = '校验失败';
  }
}

function compactOutput(text) {
  if (!text) return '';
  const lines = text.split('\n').map(line => line.trim()).filter(Boolean);
  return lines.slice(0, 3).join(' | ');
}

function colorSelected(line, theme) {
  return `{${theme.selected.bg}-bg}{${theme.selected.fg}-fg}${line}{/${theme.selected.fg}-fg}{/${theme.selected.bg}-bg}`;
}

function clamp(num, min, max) {
  if (num < min) return min;
  if (num > max) return max;
  return num;
}

function formatDate(timestamp) {
  if (!timestamp) return '-';
  const date = new Date(timestamp);
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  const hour = String(date.getHours()).padStart(2, '0');
  const minute = String(date.getMinutes()).padStart(2, '0');
  return `${year}-${month}-${day} ${hour}:${minute}`;
}

async function importBlessed() {
  try {
    const module = await import('blessed');
    return module.default || module;
  } catch {
    throw new Error('缺少 blessed 依赖，请先安装后再使用 openspec panel');
  }
}
