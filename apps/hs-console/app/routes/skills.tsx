import { useCallback, useEffect, useMemo, useState } from 'react';
import type { MetaFunction } from 'react-router';
import { reportBootError, reportBootReady, reportBootStage } from '../boot';

interface InstalledSkillItem {
  name: string;
  canonicalPath: string;
  scope: 'project' | 'global';
  pluginName?: string;
  source?: string;
  sourceType?: string;
  installedAt?: string;
  updatedAt?: string;
}

interface SkillsPayload {
  version: number;
  projectInstalledItems?: InstalledSkillItem[];
  globalInstalledItems?: InstalledSkillItem[];
}

export const meta: MetaFunction = () => [
  { title: 'HS Console - Skills' },
  { name: 'description', content: 'HS Console skills module' }
];

type Section = 'project' | 'global';

async function fetchSkills(): Promise<SkillsPayload> {
  const res = await fetch('/api/skills', { headers: { 'Content-Type': 'application/json' } });
  const data = (await res.json()) as SkillsPayload & { message?: string };
  if (!res.ok) throw new Error(data?.message || `Request failed: ${res.status}`);
  return data;
}

function formatTime(ts?: number | string): string {
  if (!ts) return '-';
  const d = new Date(ts);
  if (Number.isNaN(d.getTime())) return '-';
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')} ${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
}

function InstalledCard({ item }: { item: InstalledSkillItem }) {
  return (
    <article className="skills-installed__card">
      <div className="skills-installed__title">
        <strong>{item.name}</strong>
        {item.pluginName && <span className="skills-installed__plugin">plugin: {item.pluginName}</span>}
      </div>
      {item.source && (
        <div className="skills-installed__meta">
          {item.sourceType ?? 'source'}: {item.source}
        </div>
      )}
      {(item.installedAt || item.updatedAt) && (
        <div className="skills-installed__meta">
          {item.installedAt ? `installed: ${formatTime(item.installedAt)}` : ''}
          {item.installedAt && item.updatedAt ? '  ·  ' : ''}
          {item.updatedAt ? `updated: ${formatTime(item.updatedAt)}` : ''}
        </div>
      )}
      <div className="skills-installed__path" title={item.canonicalPath}>
        {item.canonicalPath}
      </div>
    </article>
  );
}

export default function SkillsPage() {
  const [projectInstalledItems, setProjectInstalledItems] = useState<InstalledSkillItem[]>([]);
  const [globalInstalledItems, setGlobalInstalledItems] = useState<InstalledSkillItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [query, setQuery] = useState('');
  const [activeSection, setActiveSection] = useState<Section>('project');

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    reportBootError('');
    reportBootStage('读取 skills 数据');
    try {
      const payload = await fetchSkills();
      setProjectInstalledItems(Array.isArray(payload.projectInstalledItems) ? payload.projectInstalledItems : []);
      setGlobalInstalledItems(Array.isArray(payload.globalInstalledItems) ? payload.globalInstalledItems : []);
      reportBootStage('渲染 skills 列表');
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : '加载 skills 失败';
      setError(message);
      reportBootError(`初始化失败: ${message}`);
    } finally {
      setLoading(false);
      reportBootReady();
    }
  }, []);

  useEffect(() => { void load(); }, [load]);

  const filterInstalled = useCallback((items: InstalledSkillItem[], key: string) => {
    if (!key) return items;
    return items.filter((item) =>
      [item.name, item.source, item.pluginName].some(
        (f) => String(f || '').toLowerCase().includes(key)
      )
    );
  }, []);

  const filteredProject = useMemo(() => {
    const key = query.trim().toLowerCase();
    return filterInstalled(projectInstalledItems, key).sort((a, b) => a.name.localeCompare(b.name));
  }, [projectInstalledItems, query, filterInstalled]);

  const filteredGlobal = useMemo(() => {
    const key = query.trim().toLowerCase();
    return filterInstalled(globalInstalledItems, key).sort((a, b) => a.name.localeCompare(b.name));
  }, [globalInstalledItems, query, filterInstalled]);

  const sectionCount = (s: Section) => s === 'project' ? filteredProject.length : filteredGlobal.length;

  return (
    <>
      <main className="skills-page">
        <header className="skills-header">
          <h1>Skills</h1>
          <button className="skills-refresh" onClick={() => void load()} disabled={loading}>
            {loading ? '刷新中...' : '刷新'}
          </button>
        </header>

        <section className="skills-toolbar">
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="skills-search"
            placeholder="搜索名称 / 来源"
          />
        </section>

        <section className="skills-summary">
          <div className="skills-summary__item">
            <span>项目已安装</span>
            <strong>{projectInstalledItems.length}</strong>
          </div>
          <div className="skills-summary__item">
            <span>全局已安装</span>
            <strong>{globalInstalledItems.length}</strong>
          </div>
        </section>

        <section className="skills-shell">
          <aside className="skills-sidebar">
            <div className="skills-sidebar__group">
              {(['project', 'global'] as Section[]).map((s) => (
                <button
                  key={s}
                  type="button"
                  className={`skills-sidebar__item ${activeSection === s ? 'is-active' : ''}`}
                  onClick={() => setActiveSection(s)}
                >
                  <span>{s === 'project' ? '项目已安装' : '全局已安装'}</span>
                  <strong>{sectionCount(s)}</strong>
                </button>
              ))}
            </div>
            <div className="skills-sidebar__group">
              {activeSection === 'project' && (
                <div className="skills-sidebar__path">
                  <span>canonical</span>
                  <code>.agents/skills/</code>
                </div>
              )}
              {activeSection === 'global' && (
                <div className="skills-sidebar__path">
                  <span>canonical</span>
                  <code>~/.agents/skills/</code>
                </div>
              )}
            </div>
          </aside>

          <section className="skills-panel">
            <header className="skills-panel__head">
              <h2>{activeSection === 'project' ? '项目已安装 Skills' : '全局已安装 Skills'}</h2>
              <span className="skills-meta">{sectionCount(activeSection)} 项</span>
            </header>

            {activeSection === 'project' ? (
              !loading && filteredProject.length === 0 ? (
                <div className="skills-empty">
                  当前项目未安装任何 skills。执行 <code>npx skills add &lt;source&gt;</code> 安装。
                </div>
              ) : (
                <div className="skills-installed__list">
                  {filteredProject.map((item) => <InstalledCard key={item.name} item={item} />)}
                </div>
              )
            ) : (
              !loading && filteredGlobal.length === 0 ? (
                <div className="skills-empty">
                  全局未安装任何 skills。执行 <code>npx skills add &lt;source&gt; -g</code> 安装。
                </div>
              ) : (
                <div className="skills-installed__list">
                  {filteredGlobal.map((item) => <InstalledCard key={item.name} item={item} />)}
                </div>
              )
            )}
          </section>
        </section>

        {error ? <div className="skills-error">{error}</div> : null}
      </main>
    </>
  );
}
