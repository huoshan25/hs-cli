import { useCallback, useEffect, useMemo, useState } from 'react';
import type { MetaFunction } from 'react-router';
import { reportBootError, reportBootReady, reportBootStage } from '../boot';
import { ConsoleNav } from '../components/ConsoleNav';

interface SkillItem {
  id: string;
  name: string;
  version: string;
  owner: string;
  status: string;
  description: string;
  hasSkillDoc: boolean;
  examplesCount: number;
  testsCount: number;
  updatedAt: number;
  root?: string;
  source?: string;
  sourceRoot?: string;
}

interface InstalledSkillItem {
  id: string;
  version: string;
  sourceType: string;
  sourcePath: string;
  installedAt: number;
  root: string;
  linkedAgents: Array<{
    agent: string;
    targetPath: string;
    mode: string;
    linkedAt: number;
    valid: boolean;
  }>;
}

interface SkillsPayload {
  version: number;
  items: SkillItem[];
  root?: string;
  officialRoot?: string;
  officialItems?: SkillItem[];
  installedDir?: string;
  installedItems?: InstalledSkillItem[];
}

export const meta: MetaFunction = () => {
  return [
    { title: 'HS Console - Skills' },
    { name: 'description', content: 'HS Console skills module' }
  ];
};

function formatTime(ts?: number): string {
  if (!ts) return '-';
  const d = new Date(ts);
  if (Number.isNaN(d.getTime())) return '-';
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')} ${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
}

async function fetchSkills(): Promise<SkillsPayload> {
  const res = await fetch('/api/skills', { headers: { 'Content-Type': 'application/json' } });
  const data = (await res.json()) as SkillsPayload & { message?: string };
  if (!res.ok) throw new Error(data?.message || `Request failed: ${res.status}`);
  return data;
}

export default function SkillsPage() {
  const [items, setItems] = useState<SkillItem[]>([]);
  const [officialItems, setOfficialItems] = useState<SkillItem[]>([]);
  const [installedItems, setInstalledItems] = useState<InstalledSkillItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [version, setVersion] = useState(0);
  const [rootDir, setRootDir] = useState('');
  const [officialRootDir, setOfficialRootDir] = useState('');
  const [installedDir, setInstalledDir] = useState('');
  const [query, setQuery] = useState('');
  const [sortBy, setSortBy] = useState<'updated' | 'name'>('updated');
  const [activeSection, setActiveSection] = useState<'official' | 'installed' | 'workspace'>('official');
  const [activeSkill, setActiveSkill] = useState<SkillItem | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    reportBootError('');
    reportBootStage('读取 skills 数据');
    try {
      const payload = await fetchSkills();
      setItems(Array.isArray(payload.items) ? payload.items : []);
      setOfficialItems(Array.isArray(payload.officialItems) ? payload.officialItems : []);
      setInstalledItems(Array.isArray(payload.installedItems) ? payload.installedItems : []);
      setVersion(payload.version || 0);
      setRootDir(String(payload.root || ''));
      setOfficialRootDir(String(payload.officialRoot || ''));
      setInstalledDir(String(payload.installedDir || ''));
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

  useEffect(() => {
    void load();
  }, [load]);

  const filteredOfficial = useMemo(() => {
    const key = query.trim().toLowerCase();
    const base = officialItems.filter((item) => {
      if (!key) return true;
      return [item.id, item.version, item.owner, item.status, item.description].some((field) =>
        String(field || '').toLowerCase().includes(key)
      );
    });
    return [...base].sort((a, b) => {
      if (sortBy === 'name') return String(a.name || '').localeCompare(String(b.name || ''));
      return (b.updatedAt || 0) - (a.updatedAt || 0);
    });
  }, [officialItems, query, sortBy]);

  const filteredWorkspace = useMemo(() => {
    const key = query.trim().toLowerCase();
    const base = items.filter((item) => {
      if (!key) return true;
      return [item.id, item.version, item.owner, item.status, item.description].some((field) =>
        String(field || '').toLowerCase().includes(key)
      );
    });
    return [...base].sort((a, b) => {
      if (sortBy === 'name') return String(a.name || '').localeCompare(String(b.name || ''));
      return (b.updatedAt || 0) - (a.updatedAt || 0);
    });
  }, [items, query, sortBy]);

  const filteredInstalled = useMemo(() => {
    const key = query.trim().toLowerCase();
    const base = installedItems.filter((item) => {
      if (!key) return true;
      return [item.id, item.version, item.sourceType, item.sourcePath].some((field) =>
        String(field || '').toLowerCase().includes(key)
      );
    });
    return [...base].sort((a, b) => {
      if (sortBy === 'name') return String(a.id || '').localeCompare(String(b.id || ''));
      return (b.installedAt || 0) - (a.installedAt || 0);
    });
  }, [installedItems, query, sortBy]);

  const installedSummary = useMemo(() => {
    const totalLinks = installedItems.reduce((sum, item) => sum + item.linkedAgents.length, 0);
    const invalidLinks = installedItems.reduce((sum, item) => sum + item.linkedAgents.filter((linked) => !linked.valid).length, 0);
    return {
      installed: installedItems.length,
      linked: totalLinks,
      invalid: invalidLinks
    };
  }, [installedItems]);

  const installedLookup = useMemo(() => {
    return new Map(installedItems.map((item) => [item.id, item]));
  }, [installedItems]);

  return (
    <>
      <ConsoleNav />
      <main className="skills-page">
        <header className="skills-header">
          <div>
            <h1>Skills</h1>
          </div>
          <button className="skills-refresh" onClick={() => void load()} disabled={loading}>
            {loading ? '刷新中...' : '刷新'}
          </button>
        </header>

        <section className="skills-toolbar">
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="skills-search"
            placeholder="搜索名称/描述/状态/版本"
          />
          <select className="skills-select" value={sortBy} onChange={(e) => setSortBy(e.target.value as 'updated' | 'name')}>
            <option value="updated">排序: 最近更新</option>
            <option value="name">排序: 名称 A-Z</option>
          </select>
          <span className="skills-meta">数据版本 v{version}</span>
        </section>

        <section className="skills-summary">
          <div className="skills-summary__item">
            <span>HS CLI Skills</span>
            <strong>{officialItems.length}</strong>
          </div>
          <div className="skills-summary__item">
            <span>installed skills</span>
            <strong>{installedSummary.installed}</strong>
          </div>
          <div className="skills-summary__item">
            <span>linked agents</span>
            <strong>{installedSummary.linked}</strong>
          </div>
          <div className="skills-summary__item">
            <span>invalid links</span>
            <strong>{installedSummary.invalid}</strong>
          </div>
        </section>

        <section className="skills-shell">
          <aside className="skills-sidebar">
            <div className="skills-sidebar__group">
              <button
                type="button"
                className={`skills-sidebar__item ${activeSection === 'official' ? 'is-active' : ''}`}
                onClick={() => setActiveSection('official')}
              >
                <span>HS CLI Skills</span>
                <strong>{officialItems.length}</strong>
              </button>
              <button
                type="button"
                className={`skills-sidebar__item ${activeSection === 'installed' ? 'is-active' : ''}`}
                onClick={() => setActiveSection('installed')}
              >
                <span>已安装</span>
                <strong>{installedSummary.installed}</strong>
              </button>
            </div>
            <div className="skills-sidebar__group skills-sidebar__group--secondary">
              <div className="skills-sidebar__caption">更多</div>
              <button
                type="button"
                className={`skills-sidebar__item skills-sidebar__item--secondary ${activeSection === 'workspace' ? 'is-active' : ''}`}
                onClick={() => setActiveSection('workspace')}
              >
                <span>Workspace</span>
                <strong>{items.length}</strong>
              </button>
            </div>
            <div className="skills-sidebar__group">
              <div className="skills-sidebar__path">
                <span>official</span>
                <code>{officialRootDir || '-'}</code>
              </div>
              <div className="skills-sidebar__path">
                <span>installed</span>
                <code>{installedDir || '-'}</code>
              </div>
              {activeSection === 'workspace' ? (
                <div className="skills-sidebar__path">
                  <span>workspace</span>
                  <code>{rootDir || '-'}</code>
                </div>
              ) : null}
            </div>
            <div className="skills-sidebar__group">
              <div className="skills-install__hint">
                <code>hs-cli skills list --scope official</code>
              </div>
              <div className="skills-install__hint">
                <code>hs-cli skills add &lt;skill-or-source&gt;</code>
              </div>
              <div className="skills-install__hint">
                <code>hs-cli skills doctor</code>
              </div>
            </div>
          </aside>

          <section className="skills-panel">
            <header className="skills-panel__head">
              <h2>
                {activeSection === 'official'
                  ? 'HS CLI Skills'
                  : activeSection === 'installed'
                    ? '已安装 Skills'
                    : 'Workspace Skills'}
              </h2>
              <span className="skills-meta">
                {activeSection === 'official'
                  ? `${filteredOfficial.length} 项`
                  : activeSection === 'installed'
                    ? `${filteredInstalled.length} 项`
                    : `${filteredWorkspace.length} 项`}
              </span>
            </header>

            {activeSection === 'official' ? (
              !loading && filteredOfficial.length === 0 ? (
                <div className="skills-empty">当前没有可展示的 HS CLI skills。</div>
              ) : (
                <div className="skills-list">
                  {filteredOfficial.map((item) => (
                    <article key={item.id} className="skill-card">
                      <header className="skill-card__head">
                        <div className="skill-card__title-wrap">
                          <div className="skill-card__title">{item.name}</div>
                          <div className={`skill-card__source skill-card__source--${item.source || 'official'}`}>{item.source || 'official'}</div>
                        </div>
                        <div className="skill-card__tag">{item.status || 'unknown'}</div>
                      </header>
                      <div className="skill-card__status-row">
                        {(() => {
                          const installed = installedLookup.get(item.id);
                          if (!installed) {
                            return <span className="skills-installed__badge">未安装</span>;
                          }
                          const hasBroken = installed.linkedAgents.some((linked) => !linked.valid);
                          if (installed.linkedAgents.length === 0) {
                            return <span className="skills-installed__badge is-warning">已安装 · 未链接</span>;
                          }
                          return (
                            <span className={`skills-installed__badge ${hasBroken ? 'is-invalid' : 'is-valid'}`}>
                              已安装 · {hasBroken ? 'broken' : 'codex ok'}
                            </span>
                          );
                        })()}
                      </div>
                      <div className="skill-card__desc">{item.description || '暂无描述'}</div>
                      <div className="skill-card__meta">
                        <span>v{item.version || '0.0.0'}</span>
                        <span>owner: {item.owner || '-'}</span>
                        <span>examples: {item.examplesCount}</span>
                        <span>tests: {item.testsCount}</span>
                        <span>updated: {formatTime(item.updatedAt)}</span>
                      </div>
                      <div className="skill-card__root" title={item.root || item.sourceRoot || '-'}>
                        install: hs-cli skills add {item.id}
                      </div>
                      <div className="skill-card__actions">
                        <button type="button" className="skill-card__action-btn" onClick={() => setActiveSkill(item)}>
                          详情
                        </button>
                        <button
                          type="button"
                          className="skill-card__action-btn"
                          onClick={() => {
                            void navigator.clipboard?.writeText(`hs-cli skills add ${item.id}`);
                          }}
                        >
                          复制安装命令
                        </button>
                      </div>
                    </article>
                  ))}
                </div>
              )
            ) : null}

            {activeSection === 'installed' ? (
              filteredInstalled.length === 0 ? (
                <div className="skills-empty">
                  当前没有已安装 skills。先执行 <code>hs-cli skills add &lt;skill-or-source&gt;</code>。
                </div>
              ) : (
                <div className="skills-installed__list">
                  {filteredInstalled.map((item) => (
                    <article key={item.id} className="skills-installed__card">
                      <div className="skills-installed__title">
                        <strong>{item.id}</strong>
                        <span>v{item.version || '0.0.0'}</span>
                      </div>
                      <div className="skills-installed__meta">source: {item.sourceType} · installed: {formatTime(item.installedAt)}</div>
                      <div className="skills-installed__path" title={item.root}>{item.root}</div>
                      <div className="skills-installed__path" title={item.sourcePath}>from: {item.sourcePath}</div>
                      <div className="skills-installed__links">
                        {item.linkedAgents.length === 0 ? (
                          <span className="skills-installed__badge is-warning">未链接</span>
                        ) : (
                          item.linkedAgents.map((linked) => (
                            <span
                              key={`${item.id}-${linked.agent}`}
                              className={`skills-installed__badge ${linked.valid ? 'is-valid' : 'is-invalid'}`}
                              title={linked.targetPath}
                            >
                              {linked.agent} · {linked.valid ? 'ok' : 'broken'}
                            </span>
                          ))
                        )}
                      </div>
                    </article>
                  ))}
                </div>
              )
            ) : null}

            {activeSection === 'workspace' ? (
              !loading && filteredWorkspace.length === 0 ? (
                <div className="skills-empty">
                  当前目录没有可展示的 skills。请确认当前目录或使用 <code>hs-cli console skills --skills-dir &lt;path&gt;</code> 指定目录。
                </div>
              ) : (
                <div className="skills-list">
                  {filteredWorkspace.map((item) => (
                    <article key={item.id} className="skill-card">
                      <header className="skill-card__head">
                        <div className="skill-card__title-wrap">
                          <div className="skill-card__title">{item.name}</div>
                          <div className={`skill-card__source skill-card__source--${item.source || 'workspace'}`}>{item.source || 'workspace'}</div>
                        </div>
                        <div className="skill-card__tag">{item.status || 'unknown'}</div>
                      </header>
                      <div className="skill-card__desc">{item.description || '暂无描述'}</div>
                      <div className="skill-card__meta">
                        <span>v{item.version || '0.0.0'}</span>
                        <span>owner: {item.owner || '-'}</span>
                        <span>examples: {item.examplesCount}</span>
                        <span>tests: {item.testsCount}</span>
                        <span>SKILL.md: {item.hasSkillDoc ? 'yes' : 'no'}</span>
                        <span>updated: {formatTime(item.updatedAt)}</span>
                      </div>
                      <div className="skill-card__root" title={item.root || item.sourceRoot || '-'}>
                        root: {item.root || item.sourceRoot || '-'}
                      </div>
                      <div className="skill-card__actions">
                        <button type="button" className="skill-card__action-btn" onClick={() => setActiveSkill(item)}>
                          详情
                        </button>
                        <button
                          type="button"
                          className="skill-card__action-btn"
                          onClick={() => {
                            const targetPath = item.root || item.sourceRoot;
                            if (targetPath) {
                              void navigator.clipboard?.writeText(targetPath);
                            }
                          }}
                        >
                          复制路径
                        </button>
                      </div>
                    </article>
                  ))}
                </div>
              )
            ) : null}
          </section>
        </section>

        {error ? <div className="skills-error">{error}</div> : null}

        {activeSkill ? (
          <div className="skill-detail-mask" onClick={() => setActiveSkill(null)}>
            <aside className="skill-detail-drawer" onClick={(e) => e.stopPropagation()}>
              <header className="skill-detail__head">
                <div>
                  <h2>{activeSkill.name}</h2>
                  <div className="skill-detail__sub">
                    <span>v{activeSkill.version || '0.0.0'}</span>
                    <span>status: {activeSkill.status || 'unknown'}</span>
                  </div>
                </div>
                <button className="skill-detail__close" onClick={() => setActiveSkill(null)}>
                  关闭
                </button>
              </header>
              <section className="skill-detail__section">
                <h3>描述</h3>
                <p>{activeSkill.description || '暂无描述'}</p>
              </section>
              <section className="skill-detail__section">
                <h3>元信息</h3>
                <div className="skill-detail__grid">
                  <div>owner: {activeSkill.owner || '-'}</div>
                  <div>examples: {activeSkill.examplesCount}</div>
                  <div>tests: {activeSkill.testsCount}</div>
                  <div>SKILL.md: {activeSkill.hasSkillDoc ? 'yes' : 'no'}</div>
                  <div>updated: {formatTime(activeSkill.updatedAt)}</div>
                </div>
              </section>
              <section className="skill-detail__section">
                <h3>路径</h3>
                <div className="skill-detail__path">{activeSkill.root || activeSkill.sourceRoot || '-'}</div>
              </section>
              <footer className="skill-detail__actions">
                <button
                  className="skill-card__action-btn"
                  onClick={() => {
                    const targetPath = activeSkill.root || activeSkill.sourceRoot;
                    if (targetPath) {
                      void navigator.clipboard?.writeText(targetPath);
                    }
                  }}
                >
                  复制路径
                </button>
              </footer>
            </aside>
          </div>
        ) : null}
      </main>
    </>
  );
}
