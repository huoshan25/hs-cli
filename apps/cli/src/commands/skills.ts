import path from 'path';
import fs from 'fs-extra';
import chalk from 'chalk';
import { Command } from 'commander';
import { collectSkills, locateWorkspaceSkillsRoot } from '../util/skills-sources';

interface SkillMetadata {
  name: string;
  version: string;
  description: string;
}

interface LintIssue {
  skill: string;
  message: string;
}

const TEMPLATE_SUBDIR = path.join('templates', 'skill-template');
const REQUIRED_FILES = ['SKILL.md', 'metadata.yaml'];
const REQUIRED_DIRS = ['examples', 'tests'];
const DESCRIPTION_MIN_LENGTH = 20;
const DESCRIPTION_ACTION_HINTS = [
  '生成',
  '创建',
  '校验',
  '验证',
  '分析',
  '排查',
  '修复',
  '重构',
  '设计',
  'implement',
  'validate',
  'generate',
  'analyze',
  'refactor'
];
const DESCRIPTION_SCENE_HINTS = [
  '当',
  '用于',
  '场景',
  '如果',
  '当用户',
  '需求',
  'when',
  'if',
  'request',
  'workflow',
  'openspec'
];
const DESCRIPTION_GENERIC_PHRASES = [
  '通用助手',
  '帮助处理各种任务',
  '提升效率',
  '用于各种情况',
  '处理所有问题',
  'general assistant',
  'help with everything',
  'for all tasks',
  'improve productivity'
];

export function skillsCommand(program: Command): void {
  const skills = program
    .command('skills')
    .description('AI skill 作者侧工具：创建、校验、查看工作区 skills');

  skills
    .command('new')
    .description('基于模板创建新 skill')
    .argument('<name>', 'skill 名称，仅允许小写字母、数字和短横线')
    .action(async (name: string) => {
      if (!/^[a-z0-9-]+$/.test(name)) {
        console.error(chalk.red('skill 名称仅允许小写字母、数字和短横线'));
        process.exit(1);
      }

      const cwd = process.cwd();
      const skillsRoot = locateWorkspaceSkillsRoot(cwd);
      const templatePath = path.join(skillsRoot, TEMPLATE_SUBDIR);
      const targetPath = path.join(skillsRoot, name);
      const relTarget = path.relative(cwd, targetPath);

      if (!fs.existsSync(templatePath)) {
        console.error(chalk.red(`未找到 skill 模板目录: ${templatePath}`));
        process.exit(1);
      }

      if (fs.existsSync(targetPath)) {
        console.error(chalk.red(`skill 已存在: ${targetPath}`));
        process.exit(1);
      }

      await fs.copy(templatePath, targetPath);
      await replaceSkillNamePlaceholder(targetPath, name);

      console.log(chalk.green(`✓ 已创建 skill: ${relTarget}`));
      console.log(`\n安装到 AI 客户端（使用 npx skills）:`);
      console.log(`  npx skills add ${targetPath} --agent claude-code`);
      console.log(`  npx skills add ${targetPath} --agent codex`);
    });

  skills
    .command('list')
    .description('列出当前工作区所有 skills')
    .action(async () => {
      const cwd = process.cwd();
      const workspaceSkills = collectSkills({ cwd }).items.filter(
        (item) => item.source === 'workspace'
      );

      if (workspaceSkills.length === 0) {
        console.log(chalk.yellow('当前工作区未发现可用 skills'));
        console.log(`hint: skills 应放在 ${locateWorkspaceSkillsRoot(cwd)} 目录下`);
        return;
      }

      console.log(`workspace: ${locateWorkspaceSkillsRoot(cwd)}\n`);
      for (const item of workspaceSkills) {
        console.log(`- ${item.name}  v${item.version}`);
        console.log(`  ${item.description}`);
        console.log(`  root: ${item.root}`);
      }
    });

  skills
    .command('lint')
    .description('校验工作区 skill 目录结构与 description 质量')
    .argument('[name]', '只校验指定 skill，不传则校验全部')
    .action(async (name?: string) => {
      const cwd = process.cwd();
      const skillsRoot = locateWorkspaceSkillsRoot(cwd);
      const targetSkills = name ? [name] : await getSkillDirectories(skillsRoot);

      if (targetSkills.length === 0) {
        console.log(chalk.yellow('未找到需要校验的 skill'));
        return;
      }

      const issues: LintIssue[] = [];
      for (const skillName of targetSkills) {
        const skillPath = path.join(skillsRoot, skillName);
        if (!fs.existsSync(skillPath)) {
          issues.push({ skill: skillName, message: '目录不存在' });
          continue;
        }
        await collectLintIssues(skillName, skillPath, issues);
      }

      if (issues.length > 0) {
        for (const issue of issues) {
          console.error(chalk.red(`✗ [${issue.skill}] ${issue.message}`));
        }
        process.exit(1);
      }

      console.log(chalk.green(`✓ 校验通过，共 ${targetSkills.length} 个 skill`));
    });
}

async function getSkillDirectories(skillsRoot: string): Promise<string[]> {
  if (!fs.existsSync(skillsRoot)) {
    return [];
  }

  const entries = await fs.readdir(skillsRoot, { withFileTypes: true });
  return entries
    .filter((entry) => entry.isDirectory())
    .map((entry) => entry.name)
    .filter((name) => name !== 'templates' && name !== 'registry')
    .sort((a, b) => a.localeCompare(b));
}

async function replaceSkillNamePlaceholder(rootDir: string, skillName: string): Promise<void> {
  const items = await fs.readdir(rootDir, { withFileTypes: true });
  for (const item of items) {
    const fullPath = path.join(rootDir, item.name);
    if (item.isDirectory()) {
      await replaceSkillNamePlaceholder(fullPath, skillName);
      continue;
    }
    const content = await fs.readFile(fullPath, 'utf-8');
    await fs.writeFile(fullPath, content.replace(/__SKILL_NAME__/g, skillName));
  }
}

async function readMetadata(metadataPath: string): Promise<SkillMetadata | null> {
  if (!fs.existsSync(metadataPath)) {
    return null;
  }

  const content = await fs.readFile(metadataPath, 'utf-8');
  const name = extractYamlScalar(content, 'name');
  const version = extractYamlScalar(content, 'version');
  const description = extractYamlScalar(content, 'description');

  if (!name || !version || !description) {
    return null;
  }

  return { name, version, description };
}

function extractYamlScalar(content: string, key: string): string | null {
  const regex = new RegExp(`^${key}:\\s*(.+)$`, 'm');
  const match = content.match(regex);
  if (!match || !match[1]) {
    return null;
  }

  return match[1].trim().replace(/^['"]|['"]$/g, '');
}

async function collectLintIssues(skillName: string, skillPath: string, issues: LintIssue[]): Promise<void> {
  for (const file of REQUIRED_FILES) {
    if (!(await fs.pathExists(path.join(skillPath, file)))) {
      issues.push({ skill: skillName, message: `缺少文件 ${file}` });
    }
  }

  for (const dir of REQUIRED_DIRS) {
    const dirPath = path.join(skillPath, dir);
    if (!(await fs.pathExists(dirPath))) {
      issues.push({ skill: skillName, message: `缺少目录 ${dir}` });
      continue;
    }
    const stat = await fs.stat(dirPath);
    if (!stat.isDirectory()) {
      issues.push({ skill: skillName, message: `${dir} 不是目录` });
    }
  }

  const metadataPath = path.join(skillPath, 'metadata.yaml');
  const metadata = await readMetadata(metadataPath);
  if (!metadata) {
    issues.push({ skill: skillName, message: 'metadata.yaml 缺少 name/version/description 字段' });
    return;
  }

  collectDescriptionIssues(skillName, metadata.description, issues);
}

function collectDescriptionIssues(skillName: string, description: string, issues: LintIssue[]): void {
  const text = description.trim();
  const lowerText = text.toLowerCase();

  if (text.length < DESCRIPTION_MIN_LENGTH) {
    issues.push({
      skill: skillName,
      message: `description 过短，至少 ${DESCRIPTION_MIN_LENGTH} 个字符`
    });
  }

  if (text.includes('简要描述这个 skill 的用途')) {
    issues.push({
      skill: skillName,
      message: 'description 仍为模板占位文案，请改为可执行场景描述'
    });
  }

  if (!DESCRIPTION_ACTION_HINTS.some((hint) => lowerText.includes(hint.toLowerCase()))) {
    issues.push({
      skill: skillName,
      message: 'description 缺少动作词（如 生成/校验/分析/修复）'
    });
  }

  if (!DESCRIPTION_SCENE_HINTS.some((hint) => lowerText.includes(hint.toLowerCase()))) {
    issues.push({
      skill: skillName,
      message: 'description 缺少触发场景词（如 当/用于/when/request）'
    });
  }

  if (DESCRIPTION_GENERIC_PHRASES.some((phrase) => lowerText.includes(phrase.toLowerCase()))) {
    issues.push({
      skill: skillName,
      message: 'description 过于泛化，请提供明确边界和场景'
    });
  }
}
