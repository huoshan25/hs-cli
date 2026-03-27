import path from 'path';
import fs from 'fs-extra';
import chalk from 'chalk';
import { Command } from 'commander';
import { collectSkills, locateWorkspaceSkillsRoot } from '../util/skills-sources';
import { collectOfficialSkills, resolveOfficialSkillsRoot } from '../util/skills-official';
import { cloneGitSkillSource, isGitSkillSource } from '../util/skills-git';
import {
  type InstalledSkillLock,
  getInstalledSkillRoot,
  installSkillFromSource,
  listInstalledSkillLocks,
  readInstalledSkillLock,
  resolveInstalledSkillsDir,
  writeInstalledSkillLock
} from '../util/skills-installed';
import {
  getSupportedSkillAgents,
  inspectAgentLink,
  linkInstalledSkillToAgent,
  removeInstalledSkillLink,
  type SkillAgent
} from '../util/skills-agent-adapters';

interface SkillMetadata {
  name: string;
  version: string;
  description: string;
}

interface LintIssue {
  skill: string;
  message: string;
}

const SKILLS_DIR = 'skills';
const TEMPLATE_DIR = path.join(SKILLS_DIR, 'templates', 'skill-template');
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
  const skills = program.command('skills').description('AI skills 工具集管理');

  skills
    .command('new')
    .description('基于模板创建新 skill')
    .argument('<name>', 'skill 名称，仅允许字母数字和短横线')
    .action(async (name: string) => {
      if (!/^[a-z0-9-]+$/.test(name)) {
        console.error(chalk.red('skill 名称仅允许小写字母、数字和短横线'));
        process.exit(1);
      }

      const cwd = process.cwd();
      const templatePath = path.join(cwd, TEMPLATE_DIR);
      const targetPath = path.join(cwd, SKILLS_DIR, name);

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

      console.log(chalk.green(`已创建 skill: ${path.join(SKILLS_DIR, name)}`));
    });

  skills
    .command('list')
    .description('列出 skills，可查看当前工作区、官方内置或已安装列表（--scope workspace|official|installed）')
    .option('--scope <scope>', '范围: workspace | official | installed', 'workspace')
    .action(async (options: { scope?: string }) => {
      const scope = String(options.scope || 'workspace').trim().toLowerCase();
      if (scope === 'installed') {
        const installed = await listInstalledSkillLocks();
        if (installed.length === 0) {
          console.log(chalk.yellow('当前没有已安装 skills'));
          return;
        }

        for (const entry of installed) {
          console.log(`- ${entry.lock.id}  v${entry.lock.version}`);
          console.log(`  source: ${entry.lock.sourceType}  ${entry.lock.sourcePath}`);
          console.log(`  installed: ${entry.root}`);
          console.log(`  linked: ${entry.lock.linkedAgents.map((item) => item.agent).join(', ') || '-'}`);
        }
        return;
      }

      if (scope === 'official') {
        const officialSkills = collectOfficialSkills();
        if (officialSkills.items.length === 0) {
          console.log(chalk.yellow('当前没有可用的官方内置 skills'));
          console.log(`official root: ${officialSkills.root}`);
          return;
        }

        console.log(`official root: ${officialSkills.root}`);
        for (const item of officialSkills.items) {
          console.log(`- ${item.name}  v${item.version}`);
          console.log(`  ${item.description}`);
          console.log(`  root: ${item.root}`);
        }
        return;
      }

      if (scope !== 'workspace') {
        console.error(chalk.red(`无效 scope: ${options.scope}. 仅支持 workspace | official | installed`));
        process.exit(1);
      }

      const cwd = process.cwd();
      const workspaceSkills = collectSkills({ cwd }).items.filter((item) => item.source === 'workspace');
      if (workspaceSkills.length === 0) {
        console.log(chalk.yellow('当前工作区未发现可用 skills'));
        return;
      }

      for (const item of workspaceSkills) {
        console.log(`- ${item.name}  v${item.version}`);
        console.log(`  ${item.description}`);
        console.log(`  root: ${item.root}`);
      }
    });

  skills
    .command('add')
    .description('用户侧主命令：安装 skill 到全局目录，并默认链接到 Codex')
    .argument('<source>', 'skill 目录路径，或当前工作区 skills 下的 skill 名称')
    .option('--agent <agent>', `安装后自动链接到的客户端，默认 codex，可选: ${getSupportedSkillAgents().join(' | ')}`, 'codex')
    .option('--no-link', '只安装，不自动链接到 agent')
    .action(async (input: string, options: { agent?: string; link?: boolean }) => {
      await addSkillFromInput(input, {
        cwd: process.cwd(),
        agent: normalizeAgent(options.agent),
        autoLink: options.link !== false
      });
    });

  skills
    .command('lint')
    .description('校验当前工作区 skill 目录结构与 description 质量')
    .argument('[name]', '只校验指定 skill 名称')
    .action(async (name?: string) => {
      const cwd = process.cwd();
      const skillsRoot = path.join(cwd, SKILLS_DIR);
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

  skills
    .command('install')
    .description('将 workspace 或本地目录中的 skill 安装到用户目录')
    .argument('<source>', 'skill 目录路径，或当前工作区 skills 下的 skill 名称')
    .option('--agent <agent>', `安装后自动链接到的客户端，默认 codex，可选: ${getSupportedSkillAgents().join(' | ')}`, 'codex')
    .option('--no-link', '只安装，不自动链接到 agent')
    .action(async (input: string, options: { agent?: string; link?: boolean }) => {
      await addSkillFromInput(input, {
        cwd: process.cwd(),
        agent: normalizeAgent(options.agent),
        autoLink: options.link !== false
      });
    });

  skills
    .command('remove')
    .description('移除已安装 skill，并清理相关 agent link')
    .argument('<name>', '已安装 skill 名称')
    .action(async (name: string) => {
      const lock = await readInstalledSkillLock(name);
      if (!lock) {
        console.log(chalk.yellow(`未找到已安装 skill: ${name}`));
        return;
      }

      for (const linked of lock.linkedAgents) {
        await removeInstalledSkillLink(lock.id, linked.agent as SkillAgent);
      }

      await fs.remove(getInstalledSkillRoot(name));
      console.log(chalk.green(`已移除 skill: ${name}`));
    });

  skills
    .command('link')
    .description('将已安装 skill 链接到指定 AI 客户端目录')
    .argument('<name>', '已安装 skill 名称')
    .requiredOption('--agent <agent>', `目标客户端: ${getSupportedSkillAgents().join(' | ')}`)
    .action(async (name: string, options: { agent?: string }) => {
      const agent = normalizeAgent(options.agent);
      const lock = await readInstalledSkillLock(name);
      if (!lock) {
        console.error(chalk.red(`未找到已安装 skill: ${name}`));
        process.exit(1);
      }

      const installRoot = getInstalledSkillRoot(name);
      const linked = await linkInstalledSkillToAgent(lock.id, installRoot, agent);
      const nextLock = {
        ...lock,
        linkedAgents: [
          ...lock.linkedAgents.filter((item) => item.agent !== agent),
          linked
        ]
      } satisfies InstalledSkillLock;
      await writeInstalledSkillLock(installRoot, nextLock);

      console.log(chalk.green(`已链接 skill: ${name}`));
      console.log(`agent: ${agent}`);
      console.log(`target: ${linked.targetPath}`);
      console.log(`mode: ${linked.mode}`);
    });

  skills
    .command('doctor')
    .description('检查已安装 skill、用户安装目录与 agent link 状态')
    .action(async () => {
      const installedDir = resolveInstalledSkillsDir();
      const locks = await listInstalledSkillLocks();
      console.log(`installed dir: ${installedDir}`);

      if (locks.length === 0) {
        console.log(chalk.yellow('当前没有已安装 skills'));
        return;
      }

      let hasIssue = false;
      for (const entry of locks) {
        console.log(`\n[${entry.lock.id}] v${entry.lock.version}`);
        console.log(`  source: ${entry.lock.sourceType} ${entry.lock.sourcePath}`);
        console.log(`  install: ${entry.root}`);
        if (!(await fs.pathExists(entry.root))) {
          hasIssue = true;
          console.log(chalk.red('  issue: 安装目录不存在'));
          continue;
        }

        if (entry.lock.linkedAgents.length === 0) {
          console.log(chalk.yellow('  warning: 尚未链接到任何 agent'));
          continue;
        }

        for (const linked of entry.lock.linkedAgents) {
          const info = await inspectAgentLink(entry.lock.id, linked.agent as SkillAgent);
          if (!info.exists || !info.valid) {
            hasIssue = true;
            console.log(chalk.red(`  issue: ${linked.agent} link 异常 -> ${info.targetPath}`));
            console.log(`  hint: 重新执行 hs-cli skills link ${entry.lock.id} --agent ${linked.agent}`);
            continue;
          }
          console.log(chalk.green(`  ok: ${linked.agent} -> ${info.targetPath}`));
        }
      }

      if (!hasIssue) {
        console.log(chalk.green('\n✓ doctor 检查通过'));
      }
    });
}

async function addSkillFromInput(
  input: string,
  options: { cwd: string; agent: SkillAgent; autoLink: boolean }
): Promise<void> {
  const cwd = options.cwd;
  const workspaceRoot = locateWorkspaceSkillsRoot(cwd);
  const resolved = await resolveInstallSource(cwd, workspaceRoot, input);

  try {
    const skillName = path.basename(resolved.sourcePath);
    const issues: LintIssue[] = [];
    await collectLintIssues(skillName, resolved.sourcePath, issues);
    if (issues.length > 0) {
      for (const issue of issues) {
        console.error(chalk.red(`✗ [${issue.skill}] ${issue.message}`));
      }
      process.exit(1);
    }

    const metadata = await readMetadata(path.join(resolved.sourcePath, 'metadata.yaml'));
    if (!metadata) {
      console.error(chalk.red('metadata.yaml 缺少 name/version/description 字段'));
      process.exit(1);
    }

    if (!/^[a-z0-9-]+$/.test(metadata.name)) {
      console.error(chalk.red(`metadata.name 无效: ${metadata.name}`));
      process.exit(1);
    }

    const result = await installSkillFromSource({
      sourcePath: resolved.sourcePath,
      skillId: metadata.name,
      version: metadata.version,
      sourceType: resolved.sourceType,
      sourceRef: resolved.sourceRef
    });

    console.log(chalk.green(`已安装 skill: ${result.lock.id}`));
    console.log(`source: ${resolved.sourceRef}`);
    console.log(`target: ${result.installDir}`);
    console.log(`installed dir: ${resolveInstalledSkillsDir()}`);

    if (options.autoLink) {
      const linked = await linkInstalledSkillToAgent(result.lock.id, result.installDir, options.agent);
      const nextLock = {
        ...result.lock,
        linkedAgents: [
          ...result.lock.linkedAgents.filter((item) => item.agent !== options.agent),
          linked
        ]
      } satisfies InstalledSkillLock;
      await writeInstalledSkillLock(result.installDir, nextLock);
      console.log(chalk.green(`已自动链接到 ${options.agent}`));
      console.log(`agent target: ${linked.targetPath}`);
    } else {
      console.log(chalk.yellow('未自动链接到 agent，可稍后执行:'));
      console.log(`hs-cli skills link ${result.lock.id} --agent ${options.agent}`);
    }
  } finally {
    await resolved.cleanup();
  }
}

async function resolveInstallSource(
  cwd: string,
  workspaceRoot: string,
  input: string
): Promise<{
  sourcePath: string;
  sourceType: 'workspace' | 'local' | 'official' | 'git';
  sourceRef: string;
  cleanup: () => Promise<void>;
}> {
  const attempts = new Set<string>();
  const rawInput = String(input || '').trim();
  const officialRoot = resolveOfficialSkillsRoot();

  if (isGitSkillSource(rawInput)) {
    const gitSource = await cloneGitSkillSource(rawInput);
    return {
      sourcePath: gitSource.sourcePath,
      sourceType: 'git',
      sourceRef: rawInput,
      cleanup: gitSource.cleanup
    };
  }

  const directPath = path.resolve(cwd, rawInput);
  attempts.add(directPath);
  if (await isDirectory(directPath)) {
    return {
      sourcePath: directPath,
      sourceType: detectInstallSourceType(directPath, workspaceRoot),
      sourceRef: directPath,
      cleanup: async () => {}
    };
  }

  if (!path.isAbsolute(rawInput)) {
    const workspaceProjectRoot = path.dirname(workspaceRoot);
    const workspaceRelativePath = path.resolve(workspaceProjectRoot, rawInput);
    attempts.add(workspaceRelativePath);
    if (await isDirectory(workspaceRelativePath)) {
      return {
        sourcePath: workspaceRelativePath,
        sourceType: detectInstallSourceType(workspaceRelativePath, workspaceRoot),
        sourceRef: workspaceRelativePath,
        cleanup: async () => {}
      };
    }

    const workspaceSkillPath = path.join(workspaceRoot, rawInput);
    attempts.add(workspaceSkillPath);
    if (await isDirectory(workspaceSkillPath)) {
      return {
        sourcePath: workspaceSkillPath,
        sourceType: detectInstallSourceType(workspaceSkillPath, workspaceRoot),
        sourceRef: workspaceSkillPath,
        cleanup: async () => {}
      };
    }

    const officialSkillPath = path.join(officialRoot, rawInput);
    attempts.add(officialSkillPath);
    if (await isDirectory(officialSkillPath)) {
      return {
        sourcePath: officialSkillPath,
        sourceType: detectInstallSourceType(officialSkillPath, workspaceRoot),
        sourceRef: officialSkillPath,
        cleanup: async () => {}
      };
    }
  }

  console.error(chalk.red(`未找到可安装的 skill 目录: ${input}`));
  console.error(`cwd: ${cwd}`);
  console.error(`workspace skills root: ${workspaceRoot}`);
  console.error('tried:');
  for (const candidate of attempts) {
    console.error(`- ${candidate}`);
  }
  console.error('hint:');
  console.error('- 如果这是 CLI 内置的官方 skill，请先执行 `hs-cli skills list --scope official` 查看名称');
  console.error('- 如果你在项目子目录中执行，请直接传 skill 名称，如 `hs-cli skills install my-skill`');
  console.error('- 如果这是 git skill，请传仓库地址，例如 `hs-cli skills add git+https://example.com/your-skill.git`');
  console.error('- 或传绝对路径到 skill 目录');
  process.exit(1);
}

function detectInstallSourceType(
  sourcePath: string,
  workspaceRoot: string
): 'workspace' | 'local' | 'official' {
  const resolvedSource = path.resolve(sourcePath);
  const resolvedWorkspaceRoot = path.resolve(workspaceRoot);
  const resolvedOfficialRoot = path.resolve(resolveOfficialSkillsRoot());

  if (resolvedSource.startsWith(resolvedOfficialRoot + path.sep) || resolvedSource === resolvedOfficialRoot) {
    return 'official';
  }

  if (resolvedSource.startsWith(resolvedWorkspaceRoot + path.sep) || resolvedSource === resolvedWorkspaceRoot) {
    return 'workspace';
  }

  return 'local';
}

async function isDirectory(targetPath: string): Promise<boolean> {
  try {
    const stat = await fs.stat(targetPath);
    return stat.isDirectory();
  } catch {
    return false;
  }
}

function normalizeAgent(input?: string): SkillAgent {
  const value = String(input || '').trim().toLowerCase();
  if (getSupportedSkillAgents().includes(value as SkillAgent)) {
    return value as SkillAgent;
  }
  console.error(chalk.red(`无效 agent: ${input}. 仅支持 ${getSupportedSkillAgents().join(' | ')}`));
  process.exit(1);
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
