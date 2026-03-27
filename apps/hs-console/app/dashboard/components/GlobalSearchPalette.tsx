import type { ReactNode, RefObject } from 'react';
import type { SearchHit } from '../types';

type Props = {
  open: boolean;
  query: string;
  index: number;
  hits: SearchHit[];
  inputRef: RefObject<HTMLInputElement | null>;
  onClose: () => void;
  onQueryChange: (value: string) => void;
  onIndexChange: (index: number) => void;
  onNavigate: (hit: SearchHit) => void;
};

export function GlobalSearchPalette(props: Props) {
  const { open, query, index, hits, inputRef, onClose, onQueryChange, onIndexChange, onNavigate } = props;
  if (!open) return null;

  const tabLabel: Record<SearchHit['tab'], string> = {
    specs: 'Spec',
    changes: 'Change',
    archive: 'Archive'
  };

  const terms = query.trim().toLowerCase().split(/\s+/).filter(Boolean);
  function highlightText(input: string): ReactNode {
    if (!terms.length) return input;
    const lower = input.toLowerCase();
    const ranges: Array<{ start: number; end: number }> = [];
    terms.forEach(term => {
      let from = 0;
      while (from < lower.length) {
        const idx = lower.indexOf(term, from);
        if (idx < 0) break;
        ranges.push({ start: idx, end: idx + term.length });
        from = idx + term.length;
      }
    });
    if (!ranges.length) return input;
    ranges.sort((a, b) => a.start - b.start);
    const merged: Array<{ start: number; end: number }> = [];
    ranges.forEach(range => {
      const prev = merged[merged.length - 1];
      if (!prev || range.start > prev.end) {
        merged.push({ ...range });
      } else {
        prev.end = Math.max(prev.end, range.end);
      }
    });
    const nodes: ReactNode[] = [];
    let cursor = 0;
    merged.forEach((range, idx) => {
      if (range.start > cursor) nodes.push(input.slice(cursor, range.start));
      nodes.push(<mark key={`${range.start}-${range.end}-${idx}`} className="hit-mark">{input.slice(range.start, range.end)}</mark>);
      cursor = range.end;
    });
    if (cursor < input.length) nodes.push(input.slice(cursor));
    return nodes;
  }

  return (
    <div className="palette-mask" onClick={onClose}>
      <div className="palette-card" onClick={e => e.stopPropagation()}>
        <div className="palette-head">
          <input
            ref={inputRef}
            value={query}
            onChange={e => onQueryChange(e.target.value)}
            placeholder="全局搜索（提案/变更/归档/上下文）..."
            className="palette-input"
          />
        </div>
        <div className="palette-list">
          {hits.length ? hits.map((hit, idx) => (
            <button
              key={`${hit.tab}-${hit.index}-${idx}`}
              className={`palette-item ${idx === index ? 'active' : ''}`}
              onMouseEnter={() => onIndexChange(idx)}
              onClick={() => onNavigate(hit)}
            >
              <div className="palette-item-top">
                <div className="palette-item-title">{highlightText(hit.label)}</div>
                <div className="palette-item-meta">{tabLabel[hit.tab]}</div>
              </div>
              <div className="palette-item-sub">{highlightText(hit.snippet || '-')}</div>
            </button>
          )) : <div className="palette-empty">无匹配结果</div>}
        </div>
        <div className="palette-foot">
          <span>↑/↓ 选择 · Enter 跳转 · Esc 关闭</span>
          <span>Cmd/Ctrl + K</span>
        </div>
      </div>
    </div>
  );
}
