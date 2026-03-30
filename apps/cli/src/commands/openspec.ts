import path from 'path';
import inquirer from 'inquirer';
import { Command } from 'commander';
import { runOpenSpecPanel } from '../util/openspec-dashboard';
import { loadPanelUiPreference, savePanelUiPreference } from '../util/openspec-dashboard/preferences';

type ThemeMode = 'dark' | 'light';
type UIMode = 'auto' | 'tui' | 'web';

interface ConsoleOptions {
  doc?: string;
  theme?: string;
  ui?: string;
  watch?: boolean;
}

const SUPPORTED_THEMES = new Set<ThemeMode>(['dark', 'light']);
const SUPPORTED_UI = new Set<UIMode>(['auto', 'tui', 'web']);

function normalizeTheme(theme?: string): ThemeMode {
  return SUPPORTED_THEMES.has(theme as ThemeMode) ? (theme as ThemeMode) : 'dark';
}

async function resolveUiMode(inputUi?: string): Promise<'tui' | 'web'> {
  if (inputUi && SUPPORTED_UI.has(inputUi as UIMode)) {
    if (inputUi !== 'auto') {
      savePanelUiPreference(inputUi);
      return inputUi as 'tui' | 'web';
    }
    return chooseFromAuto();
  }

  const saved = loadPanelUiPreference();
  if (saved === 'tui' || saved === 'web') {
    return saved;
  }

  if (isHeadlessOrRemoteSession()) {
    return chooseFromAuto();
  }

  if (!process.stdin.isTTY || !process.stdout.isTTY) {
    return chooseFromAuto();
  }

  try {
    const { ui } = await inquirer.prompt<{ ui: 'tui' | 'web' }>([
      {
        type: 'list',
        name: 'ui',
        message: '选择 Console 面板默认模式',
        choices: [
          { value: 'web', name: '网页面板（推荐）' },
          { value: 'tui', name: '命令行面板' }
        ]
      }
    ]);
    const mode = ui || chooseFromAuto();
    savePanelUiPreference(mode);
    return mode;
  } catch {
    return chooseFromAuto();
  }
}

function chooseFromAuto(): 'tui' | 'web' {
  if (process.env.CI) return 'tui';
  if (process.platform === 'win32' || process.platform === 'darwin') return 'web';
  return process.env.DISPLAY || process.env.WAYLAND_DISPLAY ? 'web' : 'tui';
}

function isHeadlessOrRemoteSession(): boolean {
  if (!process.stdin.isTTY || !process.stdout.isTTY) return true;
  if (process.env.CI) return true;
  if (process.env.SSH_CONNECTION || process.env.SSH_CLIENT || process.env.SSH_TTY) return true;
  if (process.platform !== 'win32' && !process.env.DISPLAY && !process.env.WAYLAND_DISPLAY) return true;
  return false;
}

async function launchOpenSpecModule(options: ConsoleOptions): Promise<void> {
  await launchConsoleModule('openspec', options);
}

async function launchConsoleModule(module: 'openspec' | 'skills', options: ConsoleOptions): Promise<void> {
  const theme = normalizeTheme(options.theme);
  const ui = await resolveUiMode(options.ui);
  const watch = options.watch !== false;

  if (options.theme && !SUPPORTED_THEMES.has(options.theme as ThemeMode)) {
    console.warn(`主题 ${options.theme} 无效，已回退为 dark`);
  }
  if (options.ui && !SUPPORTED_UI.has(options.ui as UIMode)) {
    console.warn(`UI 模式 ${options.ui} 无效，已按 auto 处理`);
  }

  try {
    await runOpenSpecPanel({
      cwd: process.cwd(),
      theme,
      ui,
      watch,
      module,
      docPath: options.doc ? path.resolve(process.cwd(), options.doc) : undefined
    });
  } catch (error: any) {
    if (ui === 'web' && module === 'openspec') {
      console.warn(`Web 面板启动失败，已回退到命令行面板: ${error.message}`);
      try {
        await runOpenSpecPanel({
          cwd: process.cwd(),
          theme,
          ui: 'tui',
          watch,
          module,
          docPath: options.doc ? path.resolve(process.cwd(), options.doc) : undefined
        });
        return;
      } catch (fallbackError: any) {
        console.error(`Console 面板启动失败: ${fallbackError.message}`);
        process.exit(1);
      }
    }
    console.error(`Console 面板启动失败: ${error.message}`);
    process.exit(1);
  }
}

export function consoleCommand(program: Command): void {
  const consoleProgram = program
    .command('console')
    .description('HS Console 可视化面板');

  consoleProgram
    .option('-d, --doc <path>', '指定 OpenSpec 文档路径')
    .option('-t, --theme <theme>', '主题 dark|light', 'dark')
    .option('-u, --ui <mode>', '面板模式 auto|tui|web', 'auto')
    .option('--no-watch', '关闭 Web 热更新')
    .action(async (options: ConsoleOptions, command: Command) => {
      if (Array.isArray(command.args) && command.args.length > 0) {
        return;
      }
      await launchOpenSpecModule(options);
    });

  consoleProgram
    .command('openspec')
    .description('直接进入 OpenSpec 模块')
    .option('-d, --doc <path>', '指定 OpenSpec 文档路径')
    .option('-t, --theme <theme>', '主题 dark|light', 'dark')
    .option('-u, --ui <mode>', '面板模式 auto|tui|web', 'auto')
    .option('--no-watch', '关闭 Web 热更新')
    .action(async (options: ConsoleOptions) => {
      await launchOpenSpecModule(options);
    });

  consoleProgram
    .command('skills')
    .description('直接进入 Skills 模块')
    .option('-u, --ui <mode>', '面板模式 auto|tui|web', 'web')
    .option('-t, --theme <theme>', '主题 dark|light', 'dark')
    .option('--no-watch', '关闭 Web 热更新')
    .action(async (options: ConsoleOptions) => {
      await launchConsoleModule('skills', options);
    });

  consoleProgram.addHelpText('after', `
示例:
  $ hs-cli console --ui web
  $ hs-cli console openspec --ui web
  $ hs-cli console skills
`);
}
