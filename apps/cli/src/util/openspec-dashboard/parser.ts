// @ts-nocheck
import fs from 'fs';
import path from 'path';
import { spawnSync } from 'child_process';

export function parseOpenSpecProject(projectRoot) {
  const openSpecDir = path.join(projectRoot, 'openspec');
  const context = resolveProjectContext(projectRoot, openSpecDir);

  const specs = parseSpecs(path.join(openSpecDir, 'specs'), path.join(openSpecDir, 'changes'));
  const changes = parseChanges(path.join(openSpecDir, 'changes'));
  const archives = parseArchives(path.join(openSpecDir, 'changes', 'archive'));
  const archivedChanges = countArchivedChanges(path.join(openSpecDir, 'changes', 'archive'));

  return {
    name: path.basename(projectRoot),
    root: projectRoot,
    gitBranch: detectGitBranch(projectRoot),
    openspecDir: openSpecDir,
    projectFile: context.filePath,
    projectContextFile: context.filePath,
    projectContextLabel: context.label,
    projectRaw: context.rawContent,
    projectSummary: context.summary,
    specs,
    changes,
    archives,
    archivedChanges,
    updatedAt: findLatestMtime(openSpecDir),
    metrics: {
      specCount: specs.length,
      activeChangeCount: changes.length,
      archivedChangeCount: archivedChanges,
      requirementCount: specs.reduce((sum, spec) => sum + spec.requirementCount, 0),
      scenarioCount: specs.reduce((sum, spec) => sum + spec.scenarioCount, 0)
    }
  };
}

function detectGitBranch(projectRoot) {
  try {
    const result = spawnSync('git', ['-C', projectRoot, 'rev-parse', '--abbrev-ref', 'HEAD'], {
      encoding: 'utf8',
      stdio: ['ignore', 'pipe', 'ignore']
    });
    if (result.status !== 0) return '';
    const branch = String(result.stdout || '').trim();
    if (!branch || branch === 'HEAD') return '';
    return branch;
  } catch {
    return '';
  }
}

function resolveProjectContext(projectRoot, openSpecDir) {
  const candidates = [
    { fileName: 'project.md', label: 'project.md' },
    { fileName: 'config.yaml', label: 'config.yaml' },
    { fileName: 'AGENTS.md', label: 'AGENTS.md' }
  ];

  for (const candidate of candidates) {
    const absolutePath = path.join(openSpecDir, candidate.fileName);
    if (!fs.existsSync(absolutePath)) {
      continue;
    }
    return {
      filePath: absolutePath,
      label: candidate.label,
      rawContent: readTextSafe(absolutePath),
      summary: {
        title: path.basename(projectRoot) || 'OpenSpec Project',
        purpose: `上下文文件: ${candidate.label}`
      }
    };
  }

  return {
    filePath: '',
    label: 'openspec',
    rawContent: '',
    summary: {
      title: path.basename(projectRoot) || 'OpenSpec Project',
      purpose: '未找到 project.md / config.yaml / AGENTS.md'
    }
  };
}

function parseSpecs(specsDir, changesDir) {
  const entries = [];

  if (fs.existsSync(specsDir)) {
    fs.readdirSync(specsDir, { withFileTypes: true })
      .filter(entry => entry.isDirectory())
      .forEach(entry => {
        const capability = entry.name;
        const specFile = path.join(specsDir, capability, 'spec.md');
        const designFile = path.join(specsDir, capability, 'design.md');
        const content = readTextSafe(specFile);
        if (!content.trim()) return;

        const designContent = readTextSafe(designFile);
        entries.push({
          id: capability,
          path: specFile,
          designPath: designFile,
          source: 'base',
          sourceChangeId: '',
          requirementCount: countMatches(content, /^### Requirement:/gm),
          scenarioCount: countMatches(content, /^#### Scenario:/gm),
          requirements: extractHeadingValues(content, /^### Requirement:\s*(.+)$/gm),
          scenarios: extractHeadingValues(content, /^#### Scenario:\s*(.+)$/gm),
          rawContent: content,
          designRaw: designContent,
          updatedAt: fileMtime(specFile)
        });
      });
  }

  if (fs.existsSync(changesDir)) {
    fs.readdirSync(changesDir, { withFileTypes: true })
      .filter(entry => entry.isDirectory() && entry.name !== 'archive')
      .forEach(changeEntry => {
        const changeId = changeEntry.name;
        const deltaSpecsDir = path.join(changesDir, changeId, 'specs');
        if (!fs.existsSync(deltaSpecsDir)) return;

        fs.readdirSync(deltaSpecsDir, { withFileTypes: true })
          .filter(entry => entry.isDirectory())
          .forEach(capEntry => {
            const capability = capEntry.name;
            const specFile = path.join(deltaSpecsDir, capability, 'spec.md');
            const designFile = path.join(deltaSpecsDir, capability, 'design.md');
            const content = readTextSafe(specFile);
            if (!content.trim()) return;

            const designContent = readTextSafe(designFile);
            entries.push({
              id: `${capability} @${changeId}`,
              path: specFile,
              designPath: designFile,
              source: 'change-delta',
              sourceChangeId: changeId,
              requirementCount: countMatches(content, /^### Requirement:/gm),
              scenarioCount: countMatches(content, /^#### Scenario:/gm),
              requirements: extractHeadingValues(content, /^### Requirement:\s*(.+)$/gm),
              scenarios: extractHeadingValues(content, /^#### Scenario:\s*(.+)$/gm),
              rawContent: content,
              designRaw: designContent,
              updatedAt: fileMtime(specFile)
            });
          });
      });
  }

  return entries.sort((a, b) => b.updatedAt - a.updatedAt);
}

function parseChanges(changesDir) {
  if (!fs.existsSync(changesDir)) return [];

  return fs.readdirSync(changesDir, { withFileTypes: true })
    .filter(entry => entry.isDirectory() && entry.name !== 'archive')
    .map(entry => {
      const changeId = entry.name;
      const changeDir = path.join(changesDir, changeId);
      const proposalFile = path.join(changeDir, 'proposal.md');
      const tasksFile = path.join(changeDir, 'tasks.md');
      const designFile = path.join(changeDir, 'design.md');
      const proposalContent = readTextSafe(proposalFile);
      const tasksContent = readTextSafe(tasksFile);
      const designContent = readTextSafe(designFile);
      const stats = parseTaskStats(tasksContent);

      return {
        id: changeId,
        path: changeDir,
        designPath: designFile,
        hasProposal: fs.existsSync(proposalFile),
        hasTasks: fs.existsSync(tasksFile),
        hasDesign: fs.existsSync(designFile),
        taskTotal: stats.total,
        taskDone: stats.done,
        isTaskComplete: stats.total > 0 ? stats.done === stats.total : false,
        tasks: parseTaskItems(tasksContent),
        summary: extractChangeSummary(proposalContent),
        proposalRaw: proposalContent,
        tasksRaw: tasksContent,
        designRaw: designContent,
        updatedAt: findLatestMtime(changeDir)
      };
    })
    .sort((a, b) => b.updatedAt - a.updatedAt);
}

function countArchivedChanges(archiveDir) {
  if (!fs.existsSync(archiveDir)) return 0;
  return fs.readdirSync(archiveDir, { withFileTypes: true }).filter(entry => entry.isDirectory()).length;
}

function parseArchives(archiveDir) {
  if (!fs.existsSync(archiveDir)) return [];

  return fs.readdirSync(archiveDir, { withFileTypes: true })
    .filter(entry => entry.isDirectory())
    .map(entry => {
      const archivePath = path.join(archiveDir, entry.name);
      return {
        id: entry.name,
        path: archivePath,
        markdownFiles: readMarkdownFiles(archivePath, 12),
        updatedAt: findLatestMtime(archivePath)
      };
    })
    .sort((a, b) => b.updatedAt - a.updatedAt);
}

function readMarkdownFiles(rootDir, limit = 12) {
  const files = [];
  walk(rootDir);
  return files;

  function walk(currentDir) {
    if (files.length >= limit) return;

    let entries = [];
    try {
      entries = fs.readdirSync(currentDir, { withFileTypes: true });
    } catch {
      return;
    }

    for (const entry of entries) {
      if (files.length >= limit) break;
      const absolutePath = path.join(currentDir, entry.name);

      if (entry.isDirectory()) {
        walk(absolutePath);
        continue;
      }

      if (!entry.name.endsWith('.md')) continue;
      files.push({
        path: absolutePath,
        relativePath: path.relative(rootDir, absolutePath),
        rawContent: readTextSafe(absolutePath)
      });
    }
  }
}

function parseTaskStats(content) {
  const all = [...content.matchAll(/^\s*[-*]\s+\[( |x|X)\]\s+/gm)];
  const done = [...content.matchAll(/^\s*[-*]\s+\[(x|X)\]\s+/gm)];

  return {
    total: all.length,
    done: done.length
  };
}

function parseTaskItems(content) {
  if (!content) return [];
  return [...content.matchAll(/^\s*[-*]\s+\[( |x|X)\]\s+(.+)$/gm)].map(match => ({
    done: String(match[1]).toLowerCase() === 'x',
    text: (match[2] || '').trim()
  }));
}

function extractChangeSummary(content) {
  const title = extractSingle(content, /^#\s+(.+)$/m) || '';
  const why = extractSectionFirstLine(content, 'Why');
  const what = extractSectionFirstLine(content, 'What Changes');
  return { title, why, what };
}

function extractSectionFirstLine(content, sectionName) {
  if (!content) return '';
  const regex = new RegExp(`^##\\s+${escapeRegex(sectionName)}\\s*\\n([\\s\\S]*?)(\\n##\\s+|$)`, 'm');
  const match = content.match(regex);
  if (!match) return '';
  const first = match[1].split('\n').map(line => line.trim()).find(Boolean);
  return first || '';
}

function extractSingle(text, regex) {
  const match = text.match(regex);
  return match ? match[1].trim() : '';
}

function extractHeadingValues(text, regex) {
  if (!text) return [];
  return [...text.matchAll(regex)].map(match => (match[1] || '').trim()).filter(Boolean);
}

function escapeRegex(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function countMatches(text, regex) {
  if (!text) return 0;
  return [...text.matchAll(regex)].length;
}

function readTextSafe(filePath) {
  try {
    return fs.readFileSync(filePath, 'utf8');
  } catch {
    return '';
  }
}

function fileMtime(filePath) {
  try {
    return fs.statSync(filePath).mtimeMs;
  } catch {
    return 0;
  }
}

function findLatestMtime(rootDir) {
  let latest = 0;

  walk(rootDir);
  return latest;

  function walk(currentDir) {
    let entries = [];
    try {
      entries = fs.readdirSync(currentDir, { withFileTypes: true });
    } catch {
      return;
    }

    for (const entry of entries) {
      const absolutePath = path.join(currentDir, entry.name);
      if (entry.isDirectory()) {
        walk(absolutePath);
        continue;
      }

      try {
        const mtime = fs.statSync(absolutePath).mtimeMs;
        if (mtime > latest) latest = mtime;
      } catch {
        // ignore broken files
      }
    }
  }
}
