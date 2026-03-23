// @ts-nocheck
import fs from 'fs';
import path from 'path';
import { parseOpenSpecProject } from './parser';

const IGNORE_DIRS = new Set(['.git', 'node_modules', 'dist', 'build', '.idea']);

export function loadProjects({ cwd, docPath }) {
  if (docPath) {
    const projectRoot = resolveProjectRootFromDocPath(docPath);
    return [parseOpenSpecProject(projectRoot)];
  }

  if (hasOpenSpec(cwd)) {
    return [parseOpenSpecProject(cwd)];
  }

  const projectRoots = discoverProjectRoots(cwd, 3);
  if (!projectRoots.length) {
    throw new Error('未找到包含 openspec 目录的项目');
  }

  return projectRoots.map(root => parseOpenSpecProject(root));
}

function resolveProjectRootFromDocPath(docPath) {
  if (!fs.existsSync(docPath)) {
    throw new Error(`文档路径不存在: ${docPath}`);
  }

  const stat = fs.statSync(docPath);
  const targetDir = stat.isDirectory() ? docPath : path.dirname(docPath);
  const projectRoot = findProjectRoot(targetDir);

  if (!projectRoot) {
    throw new Error('无法从指定路径定位到项目 openspec 根目录');
  }

  return projectRoot;
}

function discoverProjectRoots(baseDir, maxDepth) {
  const result = new Set();

  walk(baseDir, 0);
  return [...result].sort((a, b) => a.localeCompare(b));

  function walk(currentDir, depth) {
    if (depth > maxDepth) return;

    if (hasOpenSpec(currentDir)) {
      result.add(currentDir);
      return;
    }

    let entries = [];
    try {
      entries = fs.readdirSync(currentDir, { withFileTypes: true });
    } catch {
      return;
    }

    for (const entry of entries) {
      if (!entry.isDirectory()) continue;
      if (IGNORE_DIRS.has(entry.name)) continue;
      walk(path.join(currentDir, entry.name), depth + 1);
    }
  }
}

function findProjectRoot(startDir) {
  let current = path.resolve(startDir);

  while (true) {
    if (hasOpenSpec(current)) {
      return current;
    }

    const parent = path.dirname(current);
    if (parent === current) {
      return null;
    }
    current = parent;
  }
}

function hasOpenSpec(projectRoot) {
  const openSpecDir = path.join(projectRoot, 'openspec');
  if (!fs.existsSync(openSpecDir)) {
    return false;
  }

  const projectFile = path.join(openSpecDir, 'project.md');
  const configFile = path.join(openSpecDir, 'config.yaml');
  const agentsFile = path.join(openSpecDir, 'AGENTS.md');
  const specsDir = path.join(openSpecDir, 'specs');
  const changesDir = path.join(openSpecDir, 'changes');

  return fs.existsSync(projectFile) || fs.existsSync(configFile) || fs.existsSync(agentsFile) || fs.existsSync(specsDir) || fs.existsSync(changesDir);
}
