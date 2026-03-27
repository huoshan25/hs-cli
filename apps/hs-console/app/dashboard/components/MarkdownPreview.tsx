import hljs from 'highlight.js/lib/core';
import plaintext from 'highlight.js/lib/languages/plaintext';
import bash from 'highlight.js/lib/languages/bash';
import css from 'highlight.js/lib/languages/css';
import go from 'highlight.js/lib/languages/go';
import java from 'highlight.js/lib/languages/java';
import javascript from 'highlight.js/lib/languages/javascript';
import json from 'highlight.js/lib/languages/json';
import php from 'highlight.js/lib/languages/php';
import python from 'highlight.js/lib/languages/python';
import ruby from 'highlight.js/lib/languages/ruby';
import rust from 'highlight.js/lib/languages/rust';
import sql from 'highlight.js/lib/languages/sql';
import typescript from 'highlight.js/lib/languages/typescript';
import xml from 'highlight.js/lib/languages/xml';
import yaml from 'highlight.js/lib/languages/yaml';
import MarkdownIt from 'markdown-it';
import { useEffect, useMemo } from 'react';

hljs.registerLanguage('plaintext', plaintext);
hljs.registerLanguage('bash', bash);
hljs.registerLanguage('css', css);
hljs.registerLanguage('go', go);
hljs.registerLanguage('java', java);
hljs.registerLanguage('javascript', javascript);
hljs.registerLanguage('json', json);
hljs.registerLanguage('php', php);
hljs.registerLanguage('python', python);
hljs.registerLanguage('ruby', ruby);
hljs.registerLanguage('rust', rust);
hljs.registerLanguage('sql', sql);
hljs.registerLanguage('typescript', typescript);
hljs.registerLanguage('xml', xml);
hljs.registerLanguage('yaml', yaml);

function escapeHtml(value: string): string {
  return String(value || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

const markdown = new MarkdownIt({
  html: false,
  linkify: true,
  typographer: true,
  highlight(code: string, language: string): string {
    const lang = String(language || '').trim().toLowerCase();
    if (lang === 'mermaid') {
      return `<pre><code class="language-mermaid">${escapeHtml(code)}</code></pre>`;
    }
    const fallback = lang || 'plaintext';
    if (hljs.getLanguage(fallback)) {
      return `<pre><code class="hljs language-${fallback}">${hljs.highlight(code, { language: fallback }).value}</code></pre>`;
    }
    return `<pre><code class="hljs language-plaintext">${hljs.highlight(code, { language: 'plaintext' }).value}</code></pre>`;
  }
});

let mermaidInitDone = false;
let mermaidRuntime: typeof import('mermaid') | null = null;

function detectLanguageByPath(filePath: string): string {
  const text = String(filePath || '').toLowerCase();
  if (text.endsWith('.yaml') || text.endsWith('.yml')) return 'yaml';
  if (text.endsWith('.json') || text.endsWith('.json5') || text.endsWith('.jsonc')) return 'json';
  if (text.endsWith('.ts')) return 'typescript';
  if (text.endsWith('.tsx')) return 'typescript';
  if (text.endsWith('.js') || text.endsWith('.mjs') || text.endsWith('.cjs')) return 'javascript';
  if (text.endsWith('.jsx')) return 'javascript';
  if (text.endsWith('.php') || text.endsWith('.phtml')) return 'php';
  if (text.endsWith('.sql')) return 'sql';
  if (text.endsWith('.go')) return 'go';
  if (text.endsWith('.java')) return 'java';
  if (text.endsWith('.py')) return 'python';
  if (text.endsWith('.rb')) return 'ruby';
  if (text.endsWith('.rs')) return 'rust';
  if (text.endsWith('.xml') || text.endsWith('.html') || text.endsWith('.svg') || text.endsWith('.vue')) return 'xml';
  if (text.endsWith('.css')) return 'css';
  if (text.endsWith('.scss') || text.endsWith('.sass') || text.endsWith('.less')) return 'css';
  if (text.endsWith('.sh') || text.endsWith('.bash') || text.endsWith('.zsh')) return 'bash';
  if (text.endsWith('.md')) return 'markdown';
  return 'plaintext';
}

function renderCodeHtml(raw: string, path: string): string {
  const language = detectLanguageByPath(path);
  if (hljs.getLanguage(language)) {
    return `<pre><code class="hljs language-${language}">${hljs.highlight(raw, { language }).value}</code></pre>`;
  }
  return `<pre><code class="hljs language-plaintext">${hljs.highlight(raw, { language: 'plaintext' }).value}</code></pre>`;
}

type Props = {
  raw: string;
  path: string;
  mode: 'markdown' | 'raw';
  view: 'rendered' | 'raw' | 'split';
};

export function MarkdownPreview({ raw, path, mode, view }: Props) {
  const renderedHtml = useMemo(() => {
    if (mode === 'raw') return renderCodeHtml(raw, path);
    try {
      return markdown.render(raw || '');
    } catch {
      return `<pre>${escapeHtml(raw || '')}</pre>`;
    }
  }, [mode, path, raw]);

  useEffect(() => {
    if (mode !== 'markdown') return;
    const codeBlocks = document.querySelectorAll('.md-block pre > code.language-mermaid');
    if (!codeBlocks.length) return;

    let cancelled = false;
    void (async () => {
      if (!mermaidRuntime) {
        mermaidRuntime = await import('mermaid');
      }
      if (cancelled || !mermaidRuntime) return;
      if (!mermaidInitDone) {
        mermaidRuntime.default.initialize({
          startOnLoad: false,
          theme: document.documentElement.dataset.theme === 'light' ? 'default' : 'dark'
        });
        mermaidInitDone = true;
      }
      codeBlocks.forEach(codeBlock => {
        const pre = codeBlock.parentElement;
        if (!pre) return;
        const host = document.createElement('div');
        host.className = 'mermaid';
        host.textContent = codeBlock.textContent || '';
        pre.replaceWith(host);
        void mermaidRuntime?.default.run({ nodes: [host], suppressErrors: true }).catch(() => undefined);
      });
    })();

    return () => {
      cancelled = true;
    };
  }, [mode, renderedHtml]);

  if (view === 'raw') return <pre className="raw-block">{raw}</pre>;
  if (view === 'rendered') return <div className="md-block" dangerouslySetInnerHTML={{ __html: renderedHtml }} />;

  return (
    <div className="split-grid">
      <div className="split-item">
        <div className="raw-title">Raw</div>
        <pre className="raw-block">{raw}</pre>
      </div>
      <div className="split-item">
        <div className="raw-title">Rendered</div>
        <div className="md-block" dangerouslySetInnerHTML={{ __html: renderedHtml }} />
      </div>
    </div>
  );
}
