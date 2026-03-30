import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import type { SkillMeta } from '../types';

export function Skill() {
  const { id } = useParams<{ id: string }>();
  const [skill, setSkill] = useState<SkillMeta | null>(null);
  const [doc, setDoc] = useState('');
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    fetch('/.well-known/agent-skills/index.json')
      .then((r) => r.json())
      .then((data) => {
        const found = (data.skills ?? []).find((s: SkillMeta) => s.id === id);
        setSkill(found ?? null);
      });
  }, [id]);

  useEffect(() => {
    if (!id) return;
    fetch(`/.well-known/agent-skills/${id}/SKILL.md`)
      .then((r) => r.text())
      .then(setDoc)
      .catch(() => setDoc(''));
  }, [id]);

  const installCmd = `npx skills add ${window.location.origin} --skill ${id}`;

  function copyCmd() {
    void navigator.clipboard?.writeText(installCmd);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  if (!skill) return (
    <div className="min-h-screen flex items-center justify-center text-gray-400">加载中...</div>
  );

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950">
      <div className="max-w-3xl mx-auto px-4 py-12">
        <Link to="/" className="text-sm text-purple-500 hover:underline mb-6 inline-block">← 返回列表</Link>

        <header className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">{skill.name}</h1>
            <span className="text-xs px-2 py-0.5 rounded-full bg-purple-100 dark:bg-purple-900 text-purple-700 dark:text-purple-300">
              {skill.status}
            </span>
          </div>
          <p className="text-gray-500 dark:text-gray-400 mb-4">{skill.description}</p>
          <div className="flex flex-wrap gap-1 mb-6">
            {skill.tags.map((tag) => (
              <span key={tag} className="text-xs px-2 py-0.5 rounded bg-gray-100 dark:bg-gray-800 text-gray-500 dark:text-gray-400">
                {tag}
              </span>
            ))}
          </div>

          <div className="flex items-center gap-2 bg-gray-900 dark:bg-gray-800 rounded-lg px-4 py-3">
            <code className="flex-1 text-sm text-green-400 font-mono truncate">{installCmd}</code>
            <button
              onClick={copyCmd}
              className="text-xs text-gray-400 hover:text-white transition shrink-0"
            >
              {copied ? '已复制' : '复制'}
            </button>
          </div>
        </header>

        {doc && (
          <section className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-700 p-6">
            <pre className="text-sm text-gray-700 dark:text-gray-300 whitespace-pre-wrap font-mono">{doc}</pre>
          </section>
        )}
      </div>
    </div>
  );
}
