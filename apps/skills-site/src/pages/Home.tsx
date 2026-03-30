import { useEffect, useState } from 'react';
import { SkillCard } from '../components/SkillCard';
import type { SkillMeta } from '../types';

export function Home() {
  const [skills, setSkills] = useState<SkillMeta[]>([]);
  const [query, setQuery] = useState('');

  useEffect(() => {
    fetch('/.well-known/agent-skills/index.json')
      .then((r) => r.json())
      .then((data) => setSkills(data.skills ?? []));
  }, []);

  const filtered = skills.filter((s) =>
    [s.name, s.description, ...s.tags].some((f) =>
      f.toLowerCase().includes(query.toLowerCase())
    )
  );

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950">
      <div className="max-w-4xl mx-auto px-4 py-12">
        <header className="mb-10 text-center">
          <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-3">Skills</h1>
          <p className="text-gray-500 dark:text-gray-400">可安装到 AI 客户端的 skill 集合</p>
        </header>

        <div className="mb-6">
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="搜索 skill..."
            className="w-full px-4 py-2.5 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 outline-none focus:border-purple-400 transition"
          />
        </div>

        {filtered.length === 0 ? (
          <p className="text-center text-gray-400 py-16">没有找到匹配的 skill</p>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {filtered.map((skill) => (
              <SkillCard key={skill.id} skill={skill} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
