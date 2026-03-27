import { useEffect, type ReactNode } from 'react';
import { Links, Meta, Outlet, Scripts, ScrollRestoration } from 'react-router';
import './app.css';
import { BOOT_ERROR_EVENT, BOOT_READY_EVENT, BOOT_STAGE_EVENT } from './boot';
import { THEME_KEY } from './theme';

const PRELOAD_SCRIPT = `
(() => {
  try {
    const key = '${THEME_KEY}';
    const raw = window.localStorage.getItem(key);
    const preferLight = typeof window.matchMedia === 'function' && window.matchMedia('(prefers-color-scheme: light)').matches;
    const theme = raw === 'light' || raw === 'dark' ? raw : (preferLight ? 'light' : 'dark');
    document.documentElement.dataset.theme = theme;
    window.localStorage.setItem(key, theme);
  } catch {}
})();
`;

export function Layout({ children }: { children: ReactNode }) {
  return (
    <html lang="zh-CN">
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <Meta />
        <Links />
        <script dangerouslySetInnerHTML={{ __html: PRELOAD_SCRIPT }} />
      </head>
      <body className="console-booting">
        <div id="hs-console-boot" className="boot-loading" aria-hidden="false">
          <div className="boot-loading-card">
            <div className="boot-head">
              <span className="boot-logo" />
              <span className="boot-title">HS Console</span>
            </div>
            <div className="boot-sub">正在准备项目数据与渲染能力，请稍候…</div>
            <div className="boot-track"><div className="boot-bar" /></div>
            <div className="boot-stage">
              <span>状态</span>
              <strong id="hs-console-boot-stage">初始化中</strong>
            </div>
            <div id="hs-console-boot-error" className="boot-error" />
          </div>
        </div>
        <div id="hs-console-app">{children}</div>
        <ScrollRestoration />
        <Scripts />
      </body>
    </html>
  );
}

export default function App() {
  useEffect(() => {
    const stageNode = document.getElementById('hs-console-boot-stage');
    const errorNode = document.getElementById('hs-console-boot-error');
    const bootNode = document.getElementById('hs-console-boot');

    const onStage = (event: Event) => {
      const detail = (event as CustomEvent<string>).detail;
      if (stageNode) {
        stageNode.textContent = String(detail || '初始化中');
      }
    };

    const onError = (event: Event) => {
      const detail = String((event as CustomEvent<string>).detail || '').trim();
      if (!errorNode) return;
      if (!detail) {
        errorNode.style.display = 'none';
        errorNode.textContent = '';
        return;
      }
      errorNode.style.display = 'block';
      errorNode.textContent = detail;
    };

    const onReady = () => {
      document.body.classList.remove('console-booting');
      document.body.classList.add('console-ready');
      window.setTimeout(() => {
        if (bootNode) {
          bootNode.classList.add('hidden');
          bootNode.setAttribute('aria-hidden', 'true');
        }
      }, 220);
    };

    window.addEventListener(BOOT_STAGE_EVENT, onStage as EventListener);
    window.addEventListener(BOOT_ERROR_EVENT, onError as EventListener);
    window.addEventListener(BOOT_READY_EVENT, onReady);

    return () => {
      window.removeEventListener(BOOT_STAGE_EVENT, onStage as EventListener);
      window.removeEventListener(BOOT_ERROR_EVENT, onError as EventListener);
      window.removeEventListener(BOOT_READY_EVENT, onReady);
    };
  }, []);

  return <Outlet />;
}
