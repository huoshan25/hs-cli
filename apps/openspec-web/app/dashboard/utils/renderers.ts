import type { ArchiveItem, ChangeItem, DetailFile, DetailModel, Project, SpecItem } from '../types';

function relativePath(root: string, absPath?: string): string {
  if (!absPath) return '-';
  if (root && absPath.startsWith(root)) {
    const sliced = absPath.slice(root.length);
    return sliced.startsWith('/') ? sliced.slice(1) : sliced;
  }
  return absPath;
}

export function buildOverviewDetail(project: Project, formatTime: (ts?: number) => string): DetailModel {
  const contextPath = project.projectContextFile || project.projectFile || `${project.root}/openspec/${project.projectContextLabel || 'project.md'}`;
  const contextLabel = project.projectContextLabel || (contextPath ? contextPath.split('/').pop() || 'project.md' : 'project.md');
  const file: DetailFile = {
    key: 'context',
    label: contextLabel,
    path: relativePath(project.root, contextPath),
    source: 'project-context',
    raw: project.projectRaw || '# 未找到可展示的项目上下文文件',
    mode: String(contextLabel).toLowerCase().endsWith('.md') ? 'markdown' : 'raw'
  };
  return {
    title: project.name || '-',
    subtitle: 'OpenSpec 项目原文视图',
    lines: [
      { label: 'Context File', value: contextLabel, accent: false },
      { label: 'Specs', value: String(project.metrics?.specCount || 0) },
      { label: 'Active Changes', value: String(project.metrics?.activeChangeCount || 0) },
      { label: 'Archived', value: String(project.metrics?.archivedChangeCount || 0) },
      { label: 'Requirements', value: String(project.metrics?.requirementCount || 0) },
      { label: 'Scenarios', value: String(project.metrics?.scenarioCount || 0) },
      { label: 'Updated', value: formatTime(project.updatedAt), accent: false }
    ],
    sections: [],
    files: [file]
  };
}

export function buildSpecDetail(project: Project, spec: SpecItem, formatTime: (ts?: number) => string): DetailModel {
  const sourceText = spec.source === 'change-delta' ? `change:${spec.sourceChangeId || '-'}` : 'base';
  const files: DetailFile[] = [
    {
      key: 'spec',
      label: 'spec.md',
      path: relativePath(project.root, spec.path),
      source: spec.source === 'change-delta' ? `delta:${spec.sourceChangeId || '-'}` : 'base',
      raw: spec.rawContent || '',
      mode: 'markdown'
    }
  ];
  if (spec.designRaw) {
    files.push({
      key: 'design',
      label: 'design.md',
      path: relativePath(project.root, spec.designPath),
      source: spec.source === 'change-delta' ? `delta:${spec.sourceChangeId || '-'}` : 'base',
      raw: spec.designRaw,
      mode: 'markdown'
    });
  }
  return {
    title: spec.id,
    pathHint: spec.path || '-',
    lines: [
      { label: '来源', value: sourceText, accent: false },
      { label: 'Requirement', value: String(spec.requirementCount) },
      { label: 'Scenario', value: String(spec.scenarioCount) },
      { label: '质量', value: spec.scenarioCount > 0 ? '可用' : '需补 Scenario', tone: spec.scenarioCount > 0 ? 'ok' : 'warn', accent: false },
      { label: 'Updated', value: formatTime(spec.updatedAt), accent: false }
    ],
    sections: [
      { title: 'Requirements', items: spec.requirements.slice(0, 12) },
      { title: 'Scenarios', items: spec.scenarios.slice(0, 12) }
    ],
    files
  };
}

export function buildChangeDetail(project: Project, change: ChangeItem, formatTime: (ts?: number) => string): DetailModel {
  const files: DetailFile[] = [];
  if (change.proposalRaw) {
    files.push({
      key: 'proposal',
      label: 'proposal.md',
      path: relativePath(project.root, `${change.path || ''}/proposal.md`),
      source: 'change',
      raw: change.proposalRaw,
      mode: 'markdown'
    });
  }
  if (change.tasksRaw) {
    files.push({
      key: 'tasks',
      label: 'tasks.md',
      path: relativePath(project.root, `${change.path || ''}/tasks.md`),
      source: 'change',
      raw: change.tasksRaw,
      mode: 'markdown'
    });
  }
  if (change.designRaw) {
    files.push({
      key: 'design',
      label: 'design.md',
      path: relativePath(project.root, change.designPath),
      source: 'change',
      raw: change.designRaw,
      mode: 'markdown'
    });
  }
  return {
    title: change.id,
    pathHint: change.path || '-',
    lines: [
      { label: '任务完成度', value: `${change.taskDone}/${change.taskTotal}` },
      { label: '状态', value: change.isTaskComplete ? '已完成' : '进行中', tone: change.isTaskComplete ? 'ok' : 'warn', accent: false },
      { label: 'proposal.md', value: change.hasProposal ?? !!change.proposalRaw ? 'yes' : 'no' },
      { label: 'tasks.md', value: change.hasTasks ?? !!change.tasksRaw ? 'yes' : 'no' },
      { label: 'design.md', value: change.hasDesign ?? !!change.designRaw ? 'yes' : 'no' },
      { label: 'Updated', value: formatTime(change.updatedAt), accent: false }
    ],
    sections: [
      { title: 'Tasks', tasks: change.tasks.slice(0, 80) }
    ],
    files,
    emptyText: '未找到 proposal/tasks/design 文件内容'
  };
}

export function buildArchiveDetail(project: Project, archive: ArchiveItem, formatTime: (ts?: number) => string): DetailModel {
  const files = (archive.markdownFiles || []).map((file, idx): DetailFile => ({
    key: `archive-${idx}`,
    label: file.relativePath || `file-${idx + 1}.md`,
    path: relativePath(project.root, file.path),
    source: 'archive',
    raw: file.rawContent || '',
    mode: 'markdown'
  }));
  return {
    title: archive.id,
    pathHint: archive.path || '-',
    lines: [{ label: 'Updated', value: formatTime(archive.updatedAt), accent: false }],
    sections: [],
    files,
    emptyText: '未找到归档 markdown 文件'
  };
}
