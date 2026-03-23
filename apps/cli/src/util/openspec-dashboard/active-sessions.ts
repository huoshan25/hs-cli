// @ts-nocheck
import crypto from 'crypto';
import fs from 'fs';
import os from 'os';
import path from 'path';

const HEARTBEAT_INTERVAL_MS = 8000;
const ACTIVE_TTL_MS = 20 * 1000;

function now() {
  return Date.now();
}

function getActiveFile() {
  return process.env.HS_CLI_ACTIVE_SESSIONS_PATH || path.join(os.homedir(), '.hs-cli', 'openspec', 'active-sessions.json');
}

function ensureDir(filePath) {
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
}

function normalizeSession(item) {
  if (!item || typeof item !== 'object') return null;
  const id = String(item.id || '').trim();
  if (!id) return null;
  const projects = Array.isArray(item.projects)
    ? item.projects
      .map(project => {
        const projectPath = String(project?.path || '').trim();
        if (!projectPath) return null;
        return {
          path: projectPath,
          name: String(project?.name || path.basename(projectPath) || projectPath),
          gitBranch: String(project?.gitBranch || '')
        };
      })
      .filter(Boolean)
    : [];
  return {
    id,
    pid: Number(item.pid || 0),
    heartbeatAt: Number(item.heartbeatAt || 0),
    projects
  };
}

function readSessions() {
  try {
    const file = getActiveFile();
    if (!fs.existsSync(file)) return [];
    const parsed = JSON.parse(fs.readFileSync(file, 'utf8'));
    if (!Array.isArray(parsed)) return [];
    return parsed.map(normalizeSession).filter(Boolean);
  } catch {
    return [];
  }
}

function writeSessions(items) {
  try {
    const file = getActiveFile();
    ensureDir(file);
    const tmp = `${file}.tmp-${process.pid}-${Date.now()}`;
    fs.writeFileSync(tmp, `${JSON.stringify(items, null, 2)}\n`, 'utf8');
    fs.renameSync(tmp, file);
  } catch {
    // best-effort persistence
  }
}

function prune(items, currentTs) {
  return (items || []).filter(item => currentTs - (item.heartbeatAt || 0) <= ACTIVE_TTL_MS);
}

function normalizeProjects(projects) {
  return (Array.isArray(projects) ? projects : [])
    .map(project => {
      const projectPath = String(project?.root || project?.path || '').trim();
      if (!projectPath) return null;
      return {
        path: projectPath,
        name: String(project?.name || path.basename(projectPath) || projectPath),
        gitBranch: String(project?.gitBranch || '')
      };
    })
    .filter(Boolean);
}

export function listActiveProjects() {
  const alive = prune(readSessions(), now());
  const byPath = new Map();
  alive.forEach(session => {
    session.projects.forEach(project => {
      const previous = byPath.get(project.path);
      if (!previous || previous.lastSeenAt < session.heartbeatAt) {
        byPath.set(project.path, {
          path: project.path,
          name: project.name,
          gitBranch: project.gitBranch || '',
          exists: fs.existsSync(project.path),
          source: 'active',
          lastSeenAt: session.heartbeatAt || 0
        });
      }
    });
  });
  return [...byPath.values()].sort((a, b) => b.lastSeenAt - a.lastSeenAt);
}

export function createActiveSession(projects) {
  const sessionId = `${process.pid}-${now()}-${crypto.randomBytes(4).toString('hex')}`;
  let timer = null;
  let currentProjects = normalizeProjects(projects);

  const writeHeartbeat = () => {
    const next = {
      id: sessionId,
      pid: process.pid,
      heartbeatAt: now(),
      projects: currentProjects
    };
    const current = prune(readSessions(), now()).filter(item => item.id !== sessionId);
    writeSessions([...current, next]);
  };

  writeHeartbeat();
  timer = setInterval(writeHeartbeat, HEARTBEAT_INTERVAL_MS);
  if (typeof timer.unref === 'function') timer.unref();

  return {
    id: sessionId,
    heartbeat(nextProjects) {
      currentProjects = normalizeProjects(nextProjects);
      writeHeartbeat();
    },
    stop() {
      if (timer) {
        clearInterval(timer);
        timer = null;
      }
      const current = prune(readSessions(), now()).filter(item => item.id !== sessionId);
      writeSessions(current);
    }
  };
}
