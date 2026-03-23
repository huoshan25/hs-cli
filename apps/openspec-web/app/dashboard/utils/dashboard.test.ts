import { describe, expect, it } from 'vitest';
import { getItemMeta, getNextPaletteIndex, getProjectAvatarColor, getProjectAvatarText, includesQuery, normalizeDashboardData } from './dashboard';

describe('dashboard utils', () => {
  it('normalizeDashboardData should fallback invalid structures', () => {
    const normalized = normalizeDashboardData({
      version: '2',
      projects: [{ name: 'demo', root: '/tmp/demo', specs: 'x' }],
      recentProjects: null,
      activeProjects: 'invalid'
    });

    expect(normalized.version).toBe(2);
    expect(normalized.projects).toHaveLength(1);
    expect(normalized.projects[0].name).toBe('demo');
    expect(normalized.projects[0].specs).toEqual([]);
    expect(normalized.recentProjects).toEqual([]);
    expect(normalized.activeProjects).toEqual([]);
  });

  it('includesQuery should match deep payload text', () => {
    expect(includesQuery({ a: { b: 'OpenSpec' } }, 'openspec')).toBe(true);
    expect(includesQuery({ a: { b: 'OpenSpec' } }, 'missing')).toBe(false);
  });

  it('getNextPaletteIndex should wrap in range', () => {
    expect(getNextPaletteIndex(0, 'up', 10)).toBe(9);
    expect(getNextPaletteIndex(0, 'down', 10)).toBe(1);
    expect(getNextPaletteIndex(9, 'down', 10)).toBe(0);
    expect(getNextPaletteIndex(1, 'up', 10)).toBe(0);
    expect(getNextPaletteIndex(3, 'down', 0)).toBe(0);
  });

  it('getItemMeta should render tab-specific summary', () => {
    expect(getItemMeta('specs', { id: 'a', source: 'base', requirementCount: 2, scenarioCount: 3, requirements: [], scenarios: [], rawContent: '', designRaw: '' })).toBe('base · 2R/3S');
    expect(getItemMeta('changes', { id: 'b', taskDone: 1, taskTotal: 4, isTaskComplete: false, tasks: [], summary: { title: '', why: '', what: '' }, proposalRaw: '', tasksRaw: '', designRaw: '' })).toBe('1/4 · todo');
    expect(getItemMeta('archive', { id: 'c', markdownFiles: [{ relativePath: 'a.md', rawContent: '' }] })).toBe('1 files');
  });

  it('project avatar helpers should be stable', () => {
    expect(getProjectAvatarText('open spec')).toBe('OS');
    expect(getProjectAvatarText('demo')).toBe('DE');
    expect(getProjectAvatarColor('/tmp/demo')).toBe(getProjectAvatarColor('/tmp/demo'));
  });
});
