import type { SkillMeta } from '../types';
import { Link } from 'react-router-dom';

export function SkillCard({ skill }: { skill: SkillMeta }) {
  return (
    <Link
      to={`/skills/${skill.id}`}
      className="block rounded-xl border border-gray-200 dark:border-gray-700 p-5 hover:border-purple-400 hover:shadow-md transition-all bg-white dark:bg-gray-900"
    >
      <div className="flex items-start justify-between gap-2 mb-2">
        <h2 className="text-base font-semibold text-gray-900 dark:text-gray-100">{skill.name}</h2>
        <span className="text-xs px-2 py-0.5 rounded-full bg-purple-100 dark:bg-purple-900 text-purple-700 dark:text-purple-300 shrink-0">
          {skill.status}
        </span>
      </div>
      <p className="text-sm text-gray-500 dark:text-gray-400 line-clamp-2 mb-3">{skill.description}</p>
      <div className="flex flex-wrap gap-1">
        {skill.tags.map((tag) => (
          <span key={tag} className="text-xs px-2 py-0.5 rounded bg-gray-100 dark:bg-gray-800 text-gray-500 dark:text-gray-400">
            {tag}
          </span>
        ))}
      </div>
    </Link>
  );
}
