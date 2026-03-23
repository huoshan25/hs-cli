// @ts-nocheck
import fs from 'fs';
import http from 'http';
import path from 'path';
import { spawn } from 'child_process';

const CONTENT_TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'application/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.ico': 'image/x-icon'
};

export async function renderWebDashboard({
  projects,
  recentProjects = [],
  activeProjects = [],
  watch = true,
  reload,
  openProject,
  removeRecentProject,
  runOpenSpecAction
}) {
  let currentProjects = projects;
  let currentRecentProjects = recentProjects;
  let currentActiveProjects = activeProjects;
  let version = 1;
  let signature = projectSignature(currentProjects, currentRecentProjects, currentActiveProjects);
  let reloading = false;

  const webDistDir = resolveWebDistDir();
  const server = http.createServer(async (req, res) => {
    const reqUrl = req.url || '/';
    const pathname = reqUrl.split('?')[0] || '/';

    if (pathname === '/api/version') {
      sendJson(res, 200, { version });
      return;
    }

    if (pathname === '/api/dashboard') {
      sendJson(res, 200, {
        version,
        projects: currentProjects,
        recentProjects: currentRecentProjects,
        activeProjects: currentActiveProjects
      });
      return;
    }

    if (pathname === '/api/open-project' && req.method === 'POST') {
      if (typeof openProject !== 'function') {
        sendJson(res, 501, { ok: false, message: '当前版本不支持打开历史项目' });
        return;
      }
      const body = await readJsonBody(req);
      const projectPath = String(body?.path || '').trim();
      if (!projectPath) {
        sendJson(res, 400, { ok: false, message: '缺少项目路径' });
        return;
      }
      try {
        const result = openProject(projectPath);
        const project = result?.project || result;
        if (!project || !project.root) {
          throw new Error('项目未包含 openspec');
        }
        if (!currentProjects.find(item => item.root === project.root)) {
          currentProjects = [project, ...currentProjects];
        }
        currentRecentProjects = Array.isArray(result?.recentProjects) ? result.recentProjects : currentRecentProjects;
        currentActiveProjects = Array.isArray(result?.activeProjects) ? result.activeProjects : currentActiveProjects;
        signature = projectSignature(currentProjects, currentRecentProjects, currentActiveProjects);
        version += 1;
        sendJson(res, 200, {
          ok: true,
          project,
          version,
          projects: currentProjects,
          recentProjects: currentRecentProjects,
          activeProjects: currentActiveProjects
        });
      } catch (error) {
        sendJson(res, 400, { ok: false, message: error?.message || '打开项目失败' });
      }
      return;
    }

    if (pathname === '/api/recent-project' && req.method === 'DELETE') {
      if (typeof removeRecentProject !== 'function') {
        sendJson(res, 501, { ok: false, message: '当前版本不支持清理历史项目' });
        return;
      }
      const body = await readJsonBody(req);
      const projectPath = String(body?.path || '').trim();
      if (!projectPath) {
        sendJson(res, 400, { ok: false, message: '缺少项目路径' });
        return;
      }
      try {
        const nextRecent = removeRecentProject(projectPath);
        currentRecentProjects = Array.isArray(nextRecent) ? nextRecent : currentRecentProjects.filter(item => item.path !== projectPath);
        signature = projectSignature(currentProjects, currentRecentProjects, currentActiveProjects);
        version += 1;
        sendJson(res, 200, { ok: true, version, recentProjects: currentRecentProjects });
      } catch (error) {
        sendJson(res, 400, { ok: false, message: error?.message || '移除历史项目失败' });
      }
      return;
    }

    if (pathname === '/api/openspec-action' && req.method === 'POST') {
      if (typeof runOpenSpecAction !== 'function') {
        sendJson(res, 501, { ok: false, message: '当前版本不支持面板命令执行' });
        return;
      }
      const body = await readJsonBody(req);
      try {
        const result = runOpenSpecAction({
          projectPath: String(body?.projectPath || '').trim(),
          action: String(body?.action || '').trim(),
          changeId: String(body?.changeId || '').trim(),
          name: String(body?.name || '').trim()
        }) || {};

        currentProjects = Array.isArray(result.projects) ? result.projects : currentProjects;
        currentRecentProjects = Array.isArray(result.recentProjects) ? result.recentProjects : currentRecentProjects;
        currentActiveProjects = Array.isArray(result.activeProjects) ? result.activeProjects : currentActiveProjects;
        signature = projectSignature(currentProjects, currentRecentProjects, currentActiveProjects);
        version += 1;

        sendJson(res, 200, {
          ok: true,
          version,
          action: result.action || '',
          command: result.command || '',
          output: result.output || '',
          projects: currentProjects,
          recentProjects: currentRecentProjects,
          activeProjects: currentActiveProjects
        });
      } catch (error) {
        sendJson(res, 400, {
          ok: false,
          message: error?.message || '执行失败',
          command: error?.command || '',
          output: error?.output || ''
        });
      }
      return;
    }

    serveStatic(webDistDir, pathname, res);
  });

  await new Promise((resolve, reject) => {
    server.on('error', reject);
    server.listen(0, '127.0.0.1', () => resolve());
  });

  const address = server.address();
  const port = typeof address === 'object' && address ? address.port : 0;
  const url = `http://127.0.0.1:${port}`;

  const opened = tryOpenBrowser(url);
  if (!opened) {
    console.log(`已启动 OpenSpec Web 面板，请手动打开: ${url}`);
  } else {
    console.log(`OpenSpec Web 面板已启动: ${url}`);
  }

  if (watch && typeof reload === 'function') {
    console.log('Web 热更新: 已开启');
    setInterval(async () => {
      if (reloading) return;
      reloading = true;
      try {
        const payload = reload() || {};
        const nextProjects = Array.isArray(payload) ? payload : (payload.projects || []);
        const nextRecentProjects = Array.isArray(payload.recentProjects) ? payload.recentProjects : currentRecentProjects;
        const nextActiveProjects = Array.isArray(payload.activeProjects) ? payload.activeProjects : currentActiveProjects;
        const nextSignature = projectSignature(nextProjects, nextRecentProjects, nextActiveProjects);
        if (nextSignature !== signature) {
          currentProjects = nextProjects;
          currentRecentProjects = nextRecentProjects;
          currentActiveProjects = nextActiveProjects;
          signature = nextSignature;
          version += 1;
          console.log(`OpenSpec 文档已更新，面板版本 ${version}`);
        }
      } catch {
        // ignore reload error in watch loop
      } finally {
        reloading = false;
      }
    }, 1200);
  } else {
    console.log('Web 热更新: 已关闭');
  }

  console.log('按 Ctrl+C 退出 Web 面板');
  await new Promise(() => {});
}

function resolveWebDistDir() {
  const hasIndexFile = (dir: string) => fs.existsSync(path.join(dir, 'index.html'));
  const envDir = String(process.env.HS_CLI_OPENSPEC_WEB_DIST || '').trim();
  if (envDir && fs.existsSync(envDir) && hasIndexFile(envDir)) {
    return envDir;
  }
  const bundledDist = path.resolve(__dirname, '../../openspec-web');
  if (fs.existsSync(bundledDist) && hasIndexFile(bundledDist)) {
    return bundledDist;
  }
  const localBuildClient = path.resolve(__dirname, '../../../../openspec-web/build/client');
  if (fs.existsSync(localBuildClient) && hasIndexFile(localBuildClient)) {
    return localBuildClient;
  }
  const localDist = path.resolve(__dirname, '../../../../openspec-web/dist');
  if (fs.existsSync(localDist) && hasIndexFile(localDist)) {
    return localDist;
  }
  throw new Error('未找到 OpenSpec Web 资源，请先执行: pnpm --filter @huo-shan/openspec-web build');
}

function serveStatic(rootDir, pathname, res) {
  const decoded = decodeURIComponent(pathname || '/');
  const requestPath = decoded === '/' ? '/index.html' : decoded;
  const safePath = path.normalize(requestPath).replace(/^(\.\.[\/\\])+/, '');
  const filePath = path.join(rootDir, safePath);
  if (!filePath.startsWith(rootDir)) {
    res.writeHead(403);
    res.end('Forbidden');
    return;
  }

  if (fs.existsSync(filePath) && fs.statSync(filePath).isFile()) {
    const ext = path.extname(filePath).toLowerCase();
    res.writeHead(200, {
      'Content-Type': CONTENT_TYPES[ext] || 'application/octet-stream',
      'Cache-Control': 'no-store'
    });
    fs.createReadStream(filePath).pipe(res);
    return;
  }

  const indexFile = path.join(rootDir, 'index.html');
  if (fs.existsSync(indexFile)) {
    res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8', 'Cache-Control': 'no-store' });
    fs.createReadStream(indexFile).pipe(res);
    return;
  }

  res.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' });
  res.end('Not Found');
}

function sendJson(res, statusCode, payload) {
  res.writeHead(statusCode, {
    'Content-Type': 'application/json; charset=utf-8',
    'Cache-Control': 'no-store'
  });
  res.end(JSON.stringify(payload));
}

function projectSignature(projects, recentProjects, activeProjects) {
  const p = (Array.isArray(projects) ? projects : []).map(item => ({
    name: item?.name || '',
    root: item?.root || '',
    updatedAt: item?.updatedAt || 0,
    metrics: item?.metrics || {},
    changes: (item?.changes || []).map(change => `${change.id}:${change.updatedAt || 0}:${change.taskDone || 0}/${change.taskTotal || 0}`),
    specs: (item?.specs || []).map(spec => `${spec.id}:${spec.updatedAt || 0}:${spec.requirementCount || 0}/${spec.scenarioCount || 0}`),
    archives: (item?.archives || []).map(archive => `${archive.id}:${archive.updatedAt || 0}`)
  }));
  const r = (Array.isArray(recentProjects) ? recentProjects : [])
    .map(item => `${item.path}:${item.exists === false ? '0' : '1'}`)
    .sort();
  const a = (Array.isArray(activeProjects) ? activeProjects : [])
    .map(item => `${item.path}:${item.exists === false ? '0' : '1'}`)
    .sort();
  return JSON.stringify({ p, r, a });
}

function readJsonBody(req) {
  return new Promise((resolve, reject) => {
    let raw = '';
    req.on('data', chunk => {
      raw += chunk.toString('utf8');
      if (raw.length > 2 * 1024 * 1024) {
        reject(new Error('请求体过大'));
      }
    });
    req.on('end', () => {
      if (!raw.trim()) {
        resolve({});
        return;
      }
      try {
        resolve(JSON.parse(raw));
      } catch {
        reject(new Error('请求体不是合法 JSON'));
      }
    });
    req.on('error', reject);
  });
}

function tryOpenBrowser(url) {
  try {
    if (process.platform === 'darwin') {
      const p = spawn('open', [url], { detached: true, stdio: 'ignore' });
      p.unref();
      return true;
    }
    if (process.platform === 'win32') {
      const p = spawn('cmd', ['/c', 'start', '', url], { detached: true, stdio: 'ignore' });
      p.unref();
      return true;
    }
    const p = spawn('xdg-open', [url], { detached: true, stdio: 'ignore' });
    p.unref();
    return true;
  } catch {
    return false;
  }
}
