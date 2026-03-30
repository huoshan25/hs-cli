import { useCallback, useEffect, useMemo, useState } from 'react';
import type { MetaFunction } from 'react-router';
import { reportBootError, reportBootReady, reportBootStage } from '../boot';
import { ConsoleNav } from '../components/ConsoleNav';

interface WorkspaceSkillItem {
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
}

interface LinkedAgentStatus {
  agent: string;
  targetPath: string;
  valid: boolean;
}

interface InstalledSkillItem {
  name: string;
  canonicalPath: string;
  scope: 'project' | 'global';
  pluginName?: string;
  source?: string;
  sourceType?: string;
  installedAt?: string;
  updatedAt?: string;
  linkedAgents: LinkedAgentStatus[];
}

interface SkillsPayload {
  version: number;
  items: WorkspaceSkillItem[];
  root?: string;
  projectInstalledItems?: InstalledSkillItem[];
  globalInstalledItems?: InstalledSkillItem[];
}

export const meta: MetaFunction = () => [
  { title: 'HS Console - Skills' },
  { name: 'description', content: 'HS Console skills module' }
];

type Section = 'workspace' | 'project' | 'global';

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

function AgentBadge({ linked }: { linked: LinkedAgentStatus }) {
  return (
    <span
      className={`skills-installed__badge ${linked.valid ? 'is-valid' : 'is-invalid'}`}
      title={linked.targetPath}
    >
      {linked.agent} · {linked.valid ? 'ok' : 'broken'}
    </span>
  );
}

function InstalledCard({ item }: { item: InstalledSkillItem }) {
  const hasInvalid = item.linkedAgents.some((l) => !l.valid);
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
      <div className="skills-installed__links">
        {item.linkedAgents.length === 0 ? (
          <span className="skills-installed__badge is-warning">未链接任何 agent</span>
        ) : (
          item.linkedAgents.map((linked) => (
            <AgentBadge key={`${item.name}-${linked.agent}`} linked={linked} />
          ))
        )}
      </div>
      {hasInvalid && (
        <div className="skills-installed__hint">
          链接失效，可重新执行：<code>npx skills add {item.source ?? item.canonicalPath}</code>
        </div>
      )}
    </article>
  );
}

export default function SkillsPage() {
  const [workspaceItems, setWorkspaceItems] = useState<WorkspaceSkillItem[]>([]);
  const [projectInstalledItems, setProjectInstalledItems] = useState<InstalledSkillItem[]>([]);
  const [globalInstalledItems, setGlobalInstalledItems] = useState<InstalledSkillItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [version, setVersion] = useState(0);
  const [workspaceRoot, setWorkspaceRoot] = useState('');
  const [query, setQuery] = useState('');
  const [sortBy, setSortBy] = useState<'updated' | 'name'>('updated');
  const [activeSection, setActiveSection] = useState<Section>('workspace');
  const [activeSkill, setActiveSkill] = useState<WorkspaceSkillItem | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    reportBootError('');
    reportBootStage('读取 skills 数据');
    try {
      const payload = await fetchSkills();
      setWorkspaceItems(Array.isArray(payload.items) ? payload.items : []);
      setProjectInstalledItems(Array.isArray(payload.projectInstalledItems) ? payload.projectInstalledItems : []);
      setGlobalInstalledItems(Array.isArray(payload.globalInstalledItems) ? payload.globalInstalledItems : []);
      setVersion(payload.version || 0);
      setWorkspaceRoot(String(payload.root || ''));
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

  const filterWorkspace = useCallback((items: WorkspaceSkillItem[], key: string) => {
    if (!key) return items;
    return items.filter((item) =>
      [item.id, item.name, item.description, item.owner, item.status, item.version].some(
        (f) => String(f || '').toLowerCase().includes(key)
      )
    );
  }, []);

  const filterInstalled = useCallback((items: InstalledSkillItem[], key: string) => {
    if (!key) return items;
    return items.filter((item) =>
      [item.name, item.source, item.pluginName].some(
        (f) => String(f || '').toLowerCase().includes(key)
      )
    );
  }, []);

  const filteredWorkspace = useMemo(() => {
    const key = query.trim().toLowerCase();
    const base = filterWorkspace(workspaceItems, key);
    return [...base].sort((a, b) =>
      sortBy === 'name' ? a.name.localeCompare(b.name) : (b.updatedAt || 0) - (a.updatedAt || 0)
    );
  }, [workspaceItems, query, sortBy, filterWorkspace]);

  const filteredProject = useMemo(() => {
    const key = query.trim().toLowerCase();
    const base = filterInstalled(projectInstalledItems, key);
    return [...base].sort((a, b) =>
      sortBy === 'name' ? a.name.localeCompare(b.name) : a.name.localeCompare(b.name)
    );
  }, [projectInstalledItems, query, sortBy, filterInstalled]);

  const filteredGlobal = useMemo(() => {
    const key = query.trim().toLowerCase();
    const base = filterInstalled(globalInstalledItems, key);
    return [...base].sort((a, b) =>
      sortBy === 'name' ? a.name.localeCompare(b.name) : (b.updatedAt ?? '').localeCompare(a.updatedAt ?? '')
    );
  }, [globalInstalledItems, query, sortBy, filterInstalled]);

  const invalidProjectCount = useMemo(
    () => projectInstalledItems.reduce((n, item) => n + item.linkedAgents.filter((l) => !l.valid).length, 0),
    [projectInstalledItems]
  );

  const invalidGlobalCount = useMemo(
    () => globalInstalledItems.reduce((n, item) => n + item.linkedAgents.filter((l) => !l.valid).length, 0),
    [globalInstalledItems]
  );

  const sectionCount = (s: Section) => {
    if (s === 'workspace') return filteredWorkspace.length;
    if (s === 'project') return filteredProject.length;
    return filteredGlobal.length;
  };

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
            placeholder="搜索名称 / 描述 / 来源"
          />
          <select className="skills-select" value={sortBy} onChange={(e) => setSortBy(e.target.value as 'updated' | 'name')}>
            <option value="updated">排序: 最近更新</option>
            <option value="name">排序: 名称 A-Z</option>
          </select>
          <span className="skills-meta">数据版本 v{version}</span>
        </section>

        <section className="skills-summary">
          <div className="skills-summary__item">
            <span>Workspace Skills</span>
            <strong>{workspaceItems.length}</strong>
          </div>
          <div className="skills-summary__item">
            <span>项目已安装</span>
            <strong>{projectInstalledItems.length}</strong>
          </div>
          <div className="skills-summary__item">
            <span>全局已安装</span>
            <strong>{globalInstalledItems.length}</strong>
          </div>
          <div className="skills-summary__item">
            <span>失效链接</span>
            <strong style={{ color: (invalidProjectCount + invalidGlobalCount) > 0 ? 'var(--color-error, #e53)' : undefined }}>
              {invalidProjectCount + invalidGlobalCount}
            </strong>
          </div>
        </section>

        <section className="skills-shell">
          <aside className="skills-sidebar">
            <div className="skills-sidebar__group">
              {(['workspace', 'project', 'global'] as Section[]).map((s) => (
                <button
                  key={s}
                  type="button"
                  className={`skills-sidebar__item ${activeSection === s ? 'is-active' : ''}`}
                  onClick={() => setActiveSection(s)}
                >
                  <span>
                    {s === 'workspace' ? 'Workspace' : s === 'project' ? '项目已安装' : '全局已安装'}
                  </span>
                  <strong>{sectionCount(s)}</strong>
                </button>
              ))}
            </div>

            <div className="skills-sidebar__group">
              {activeSection === 'workspace' && workspaceRoot && (
                <div className="skills-sidebar__path">
                  <span>workspace</span>
                  <code>{workspaceRoot}</code>
                </div>
              )}
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

            <div className="skills-sidebar__group">
              <div className="skills-install__hint">
                <code>hs-cli skills new &lt;name&gt;</code>
              </div>
              <div className="skills-install__hint">
                <code>hs-cli skills lint [name]</code>
              </div>
              <div className="skills-install__hint">
                <code>npx skills add &lt;source&gt;</code>
              </div>
            </div>
          </aside>

          <section className="skills-panel">
            <header className="skills-panel__head">
              <h2>
                {activeSection === 'workspace' ? 'Workspace Skills' : activeSection === 'project' ? '项目已安装 Skills' : '全局已安装 Skills'}
              </h2>
              <span className="skills-meta">{sectionCount(activeSection)} 项</span>
            </header>

            {/* Workspace */}
            {activeSection === 'workspace' ? (
              !loading && filteredWorkspace.length === 0 ? (
                <div className="skills-empty">
                  当前工作区未发现 skills。请确认 <code>skills/</code> 目录存在，或使用 <code>hs-cli skills new &lt;name&gt;</code> 创建。
                </div>
              ) : (
                <div className="skills-list">
                  {filteredWorkspace.map((item) => (
                    <article key={item.id} className="skill-card">
                      <header className="skill-card__head">
                        <div className="skill-card__title-wrap">
                          <div className="skill-card__title">{item.name}</div>
                          <div className="skill-card__source skill-card__source--workspace">workspace</div>
                        </div>
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
                      <div className="skill-card__actions">
                        <button type="button" className="skill-card__action-btn" onClick={() => setActiveSkill(item)}>
                          详情
                        </button>
                        <button
                          type="button"
                          className="skill-card__action-btn"
                          onClick={() => {
                            void navigator.clipboard?.writeText(`npx skills add ${item.root ?? `./skills/${item.id}`}`);
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

            {/* 项目已安装 */}
            {activeSection === 'project' ? (
              !loading && filteredProject.length === 0 ? (
                <div className="skills-empty">
                  当前项目未安装任何 skills。执行 <code>npx skills add &lt;source&gt;</code> 安装。
                </div>
              ) : (
                <div className="skills-installed__list">
                  {filteredProject.map((item) => (
                    <InstalledCard key={item.name} item={item} />
                  ))}
                </div>
              )
            ) : null}

            {/* 全局已安装 */}
            {activeSection === 'global' ? (
              !loading && filteredGlobal.length === 0 ? (
                <div className="skills-empty">
                  全局未安装任何 skills。执行 <code>npx skills add &lt;source&gt; -g</code> 安装。
                </div>
              ) : (
                <div className="skills-installed__list">
                  {filteredGlobal.map((item) => (
                    <InstalledCard key={item.name} item={item} />
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
                <button className="skill-detail__close" onClick={() => setActiveSkill(null)}>关闭</button>
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
                <div className="skill-detail__path">{activeSkill.root || '-'}</div>
              </section>
              <footer className="skill-detail__actions">
                <button
                  className="skill-card__action-btn"
                  onClick={() => {
                    void navigator.clipboard?.writeText(`npx skills add ${activeSkill.root ?? `./skills/${activeSkill.id}`}`);
                  }}
                >
                  复制安装命令
                </button>
              </footer>
            </aside>
          </div>
        ) : null}
      </main>
    </>
  );
}
