import { useEffect, useMemo, useState } from 'react';
import type { ArchiveItem, ChangeItem, DetailFile, DetailModel, SpecItem, TabMode } from '../types';
import { getItemLabel, getItemMeta, getProjectAvatarColor, getProjectAvatarText } from '../utils/dashboard';
import type { RefObject } from 'react';
import { MarkdownPreview } from './MarkdownPreview';

const BRANCH_ICON = (
  <svg viewBox="0 0 16 16" fill="currentColor" aria-hidden="true">
    <path d="M2.5 1.75a2.25 2.25 0 1 1 1.858 2.215 2.5 2.5 0 0 0 2.142 2.474V6.5h1v-.06a2.5 2.5 0 0 0 2.142-2.474 2.251 2.251 0 1 1 1.11.002 3.5 3.5 0 0 1-2.252 3.051v2.462a2.251 2.251 0 1 1-1 0V7.02a3.5 3.5 0 0 1-2.252-3.05A2.25 2.25 0 0 1 2.5 1.75Zm0 1a1.25 1.25 0 1 0 2.5 0 1.25 1.25 0 0 0-2.5 0Zm8.5 0a1.25 1.25 0 1 0 2.5 0 1.25 1.25 0 0 0-2.5 0Zm-4.25 8.5a1.25 1.25 0 1 0 2.5 0 1.25 1.25 0 0 0-2.5 0Z" />
  </svg>
);

type DashboardItem = SpecItem | ChangeItem | ArchiveItem;

type Props = {
  tab: TabMode;
  projectName: string;
  projectRoot: string;
  projectBranch: string;
  projectContextLabel: string;
  projectUpdatedAt: string;
  projectSpecCount: number;
  projectActiveChangeCount: number;
  projectArchivedChangeCount: number;
  projectRequirementCount: number;
  projectScenarioCount: number;
  search: string;
  setSearch: (value: string) => void;
  searchInputRef: RefObject<HTMLInputElement | null>;
  onCycleFilter: () => void;
  filterLabel: string;
  currentItems: DashboardItem[];
  itemIndex: number;
  setItemIndex: (index: number) => void;
  detailModel: DetailModel;
  projectSwitchLabel: string;
  projectSwitchBranch: string;
  onOpenProjectHub: () => void;
  onOpenActionCenter: () => void;
  showActionButton: boolean;
  busy: boolean;
  actionStatusText: string;
  actionStatusMode: '' | 'ok' | 'error';
  actionLog: string;
  onValidateAction: () => void;
  onArchiveAction: () => void;
};

export function DashboardPanels(props: Props) {
  const {
    tab,
    projectName,
    projectRoot,
    projectBranch,
    projectContextLabel,
    projectUpdatedAt,
    projectSpecCount,
    projectActiveChangeCount,
    projectArchivedChangeCount,
    projectRequirementCount,
    projectScenarioCount,
    search,
    setSearch,
    searchInputRef,
    onCycleFilter,
    filterLabel,
    currentItems,
    itemIndex,
    setItemIndex,
    detailModel,
    projectSwitchLabel,
    projectSwitchBranch,
    onOpenProjectHub,
    onOpenActionCenter,
    showActionButton,
    busy,
    actionStatusText,
    actionStatusMode,
    actionLog,
    onValidateAction,
    onArchiveAction
  } = props;

  const leftTitleMap: Record<TabMode, string> = {
    overview: '概览',
    specs: '提案列表',
    changes: '变更列表',
    archive: '归档列表'
  };
  const leftTitle = leftTitleMap[tab];
  const contextPath = projectRoot ? `${projectRoot}/openspec/${projectContextLabel}` : '-';
  const avatarText = getProjectAvatarText(projectName);
  const avatarColor = getProjectAvatarColor(projectRoot || projectName);
  const [detailFileKey, setDetailFileKey] = useState('');
  const [contentView, setContentView] = useState<'rendered' | 'raw' | 'split'>('rendered');

  useEffect(() => {
    setDetailFileKey('');
    setContentView('rendered');
  }, [tab, itemIndex, projectName]);

  const activeFile = useMemo<DetailFile | undefined>(() => {
    if (!detailModel.files.length) return undefined;
    return detailModel.files.find(file => file.key === detailFileKey) || detailModel.files[0];
  }, [detailModel.files, detailFileKey]);
  const isMarkdownFile = !!activeFile && activeFile.mode !== 'raw';

  return (
    <section className="grid">
      <aside className="panel left-panel">
        <div className="panel-title panel-title-with-action">
          <span>{leftTitle}</span>
          <div className="project-switch-wrap">
            <button className="panel-title-action" onClick={onOpenProjectHub}>
              <span className="switch-left">
                <span className="switch-avatar" style={{ background: avatarColor }}>{avatarText}</span>
                <span className="switch-name">{projectSwitchLabel}</span>
                <span className="switch-caret">▾</span>
              </span>
            </button>
            <span className="switch-branch">
              <span className="switch-branch-icon">{BRANCH_ICON}</span>
              <span className="switch-branch-text">{projectSwitchBranch}</span>
            </span>
          </div>
        </div>
        <div className="panel-body">
          <div className="project-card">
            <div className="project-top">
              <div className="project-identity">
                <span className="project-avatar" style={{ background: avatarColor }}>{avatarText}</span>
                <span className="project-name">{projectName}</span>
              </div>
              <span className="project-branch">{projectBranch || '-'}</span>
            </div>
            <div className="project-path">{contextPath}</div>
            <div className="project-metrics">
              <span className="project-metric">Specs {projectSpecCount}</span>
              <span className="project-metric">Changes {projectActiveChangeCount}</span>
              <span className="project-metric">Archive {projectArchivedChangeCount}</span>
              <span className="project-metric">Req {projectRequirementCount}</span>
              <span className="project-metric">Scn {projectScenarioCount}</span>
            </div>
            <div className="project-shortcut">快捷键: / 列表搜索 · T 主题 · Cmd/Ctrl+K 全局搜索</div>
          </div>

          <div className="list-tools">
            <input ref={searchInputRef} value={search} onChange={e => setSearch(e.target.value)} placeholder="搜索..." className="search" />
            {(tab === 'specs' || tab === 'changes') ? (
              <button className="link list-filter" onClick={onCycleFilter} title="过滤">
                {`过滤:${filterLabel}`}
              </button>
            ) : null}
          </div>

          <div className="list">
            {tab === 'overview' ? (
              <div className="overview">
                <div>
                  <span className="muted">项目</span>
                  <span className="overview-value">{projectName}</span>
                </div>
                <div>
                  <span className="muted">分支</span>
                  <span className="overview-value">{projectBranch}</span>
                </div>
                <div>
                  <span className="muted">上下文文件</span>
                  <span className="overview-value">{projectContextLabel}</span>
                </div>
                <div>
                  <span className="muted">最近更新</span>
                  <span className="overview-value">{projectUpdatedAt}</span>
                </div>
                <div>
                  <span className="muted">specs</span>
                  <span className="overview-value">{projectSpecCount}</span>
                </div>
                <div>
                  <span className="muted">active changes</span>
                  <span className="overview-value">{projectActiveChangeCount}</span>
                </div>
                <div>
                  <span className="muted">archived changes</span>
                  <span className="overview-value">{projectArchivedChangeCount}</span>
                </div>
              </div>
            ) : (
              currentItems.map((item, idx) => (
                <button key={`${tab}-${idx}`} className={`list-item ${idx === itemIndex ? 'active' : ''}`} onClick={() => setItemIndex(idx)}>
                  <div className="list-item-title">{getItemLabel(tab, item)}</div>
                  <div className="muted list-item-meta">{getItemMeta(tab, item)}</div>
                </button>
              ))
            )}
            {tab !== 'overview' && !currentItems.length ? <div className="muted">暂无内容</div> : null}
          </div>
        </div>
      </aside>

      <section className="panel">
        <div className="panel-title panel-head-row">
          <span>详情</span>
          {showActionButton ? (
            <button className="link" onClick={onOpenActionCenter}>
              动作中心 (O)
            </button>
          ) : null}
        </div>
        <div className="panel-body detail">
          <h2 className="detail-title">{detailModel.title}</h2>
          {detailModel.subtitle ? <div className="detail-subtitle">{detailModel.subtitle}</div> : null}

          {detailModel.lines.map((line, idx) => (
            <div key={`${line.label}-${idx}`} className="line">
              <span className="muted">{line.label}</span>
              <span className={`${line.accent === false ? '' : 'accent'} ${line.tone ? `status-${line.tone}` : ''}`.trim()}>
                {line.value || '-'}
              </span>
            </div>
          ))}

          {detailModel.sections.map(section => (
            <div key={section.title} className="section">
              <h3>{section.title}</h3>
              {section.items ? (
                section.items.length ? (
                  <ul className="detail-list">
                    {section.items.map((item, idx) => <li key={`${section.title}-${idx}`}>{item}</li>)}
                  </ul>
                ) : (
                  <p className="muted">暂无内容</p>
                )
              ) : null}
              {section.tasks ? (
                section.tasks.length ? (
                  <ul className="task-list">
                    {section.tasks.map((task, idx) => (
                      <li key={`${section.title}-${idx}`} className="task-row">
                        <span>{task.done ? '✅' : '⬜'}</span>
                        <span className={task.done ? 'task-done' : ''}>{task.text}</span>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="muted">未解析到 tasks 项</p>
                )
              ) : null}
              {section.text ? <pre className="raw-block">{section.text}</pre> : null}
            </div>
          ))}

          {tab === 'changes' && showActionButton ? (
            <div className="change-actions">
              <div className="change-actions-top">
                <div className="change-actions-title">变更操作（仅执行命令，不生成提案内容）</div>
                <div className="change-actions-btns">
                  <button className="link btn-primary" disabled={busy} onClick={onValidateAction}>严格验证</button>
                  <button className="link" disabled={busy} onClick={onArchiveAction}>确认归档</button>
                </div>
              </div>
              <div className={`change-action-status ${actionStatusMode}`.trim()}>{actionStatusText}</div>
              <pre className="change-action-output">{actionLog || '执行结果将显示在这里'}</pre>
            </div>
          ) : null}

          {detailModel.pathHint ? <p className="muted detail-path-hint">{detailModel.pathHint}</p> : null}

          {activeFile ? (
            <div className="section">
              {detailModel.files.length > 1 ? (
                <div className="tabs-wrap detail-file-tabs">
                  {detailModel.files.map(file => (
                    <button
                      key={file.key}
                      className={`tab ${activeFile.key === file.key ? 'active' : ''}`}
                      onClick={() => setDetailFileKey(file.key)}
                    >
                      {file.label}
                    </button>
                  ))}
                </div>
              ) : null}
              <div className="file-head">
                <div className="file-meta">{`${activeFile.label} · ${activeFile.path || '-'} · ${activeFile.source || '-'}`}</div>
                {isMarkdownFile ? (
                  <div className="viewer-toolbar">
                    <button className={`viewer-switch ${contentView === 'raw' ? 'active' : ''}`} onClick={() => setContentView('raw')}>
                      {'</>'}
                    </button>
                    <button className={`viewer-switch ${contentView === 'split' ? 'active' : ''}`} onClick={() => setContentView('split')}>
                      {'▥'}
                    </button>
                    <button className={`viewer-switch ${contentView === 'rendered' ? 'active' : ''}`} onClick={() => setContentView('rendered')}>
                      {'◫'}
                    </button>
                  </div>
                ) : null}
              </div>
              <MarkdownPreview
                raw={activeFile.raw}
                path={activeFile.path}
                mode={activeFile.mode === 'raw' ? 'raw' : 'markdown'}
                view={isMarkdownFile ? contentView : 'rendered'}
              />
            </div>
          ) : (
            <p className="muted">{detailModel.emptyText || '无详情'}</p>
          )}
        </div>
      </section>
    </section>
  );
}
