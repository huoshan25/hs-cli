import fs from 'fs-extra';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const skillsRoot = path.resolve(__dirname, '../../../packages/skills');
const outDir = path.resolve(__dirname, '../public/.well-known/agent-skills');

function parseYamlScalar(content, key) {
  const match = String(content || '').match(new RegExp(`^${key}:\\s*(.+)$`, 'm'));
  if (!match?.[1]) return '';
  return String(match[1]).trim().replace(/^['"]|['"]$/g, '');
}

function parseYamlList(content, key) {
  const lines = content.split('\n');
  const start = lines.findIndex((l) => l.startsWith(`${key}:`));
  if (start === -1) return [];
  const items = [];
  for (let i = start + 1; i < lines.length; i++) {
    const m = lines[i].match(/^\s+-\s+(.+)$/);
    if (!m) break;
    items.push(m[1].trim());
  }
  return items;
}

async function build() {
  await fs.ensureDir(outDir);

  const entries = (await fs.readdir(skillsRoot, { withFileTypes: true }))
    .filter((e) => e.isDirectory() && e.name !== 'templates' && e.name !== 'registry')
    .map((e) => e.name);

  const skills = [];

  for (const id of entries) {
    const skillDir = path.join(skillsRoot, id);
    const metaRaw = await fs.readFile(path.join(skillDir, 'metadata.yaml'), 'utf-8').catch(() => '');
    const skillMd = path.join(skillDir, 'SKILL.md');

    if (!(await fs.pathExists(skillMd))) continue;

    skills.push({
      id,
      name: parseYamlScalar(metaRaw, 'name') || id,
      version: parseYamlScalar(metaRaw, 'version') || '0.0.0',
      owner: parseYamlScalar(metaRaw, 'owner') || '',
      status: parseYamlScalar(metaRaw, 'status') || 'active',
      description: parseYamlScalar(metaRaw, 'description') || '',
      tags: parseYamlList(metaRaw, 'tags'),
      files: ['SKILL.md'],
    });

    // 复制 SKILL.md 到 well-known 目录
    await fs.ensureDir(path.join(outDir, id));
    await fs.copy(skillMd, path.join(outDir, id, 'SKILL.md'));
  }

  // 生成 index.json
  await fs.writeJson(path.join(outDir, 'index.json'), { skills }, { spaces: 2 });

  console.log(`✓ 生成 ${skills.length} 个 skill → public/.well-known/agent-skills/`);
  skills.forEach((s) => console.log(`  - ${s.id}`));
}

build().catch((e) => { console.error(e); process.exit(1); });
