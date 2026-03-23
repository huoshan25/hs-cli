// @ts-nocheck
import { spawnSync } from 'child_process';

const IDENTIFIER_PATTERN = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
const MAX_IDENTIFIER_LENGTH = 80;

function normalizeIdentifier(value, label) {
  const text = String(value || '').trim();
  if (!text) {
    throw new Error(`${label}不能为空`);
  }
  if (text.length > MAX_IDENTIFIER_LENGTH) {
    throw new Error(`${label}长度不能超过 ${MAX_IDENTIFIER_LENGTH}`);
  }
  if (!IDENTIFIER_PATTERN.test(text)) {
    throw new Error(`${label}格式无效，仅支持小写字母、数字与短横线`);
  }
  return text;
}

export function buildPanelActionCommand({ action, changeId, name }) {
  const actionType = String(action || '').trim();
  if (!actionType) {
    throw new Error('缺少动作类型');
  }

  if (actionType === 'validate-change') {
    const id = normalizeIdentifier(changeId, '变更 ID');
    return {
      action: actionType,
      args: ['validate', id, '--strict', '--no-interactive']
    };
  }

  if (actionType === 'archive-change') {
    const id = normalizeIdentifier(changeId, '变更 ID');
    return {
      action: actionType,
      args: ['archive', id, '-y']
    };
  }

  if (actionType === 'new-change') {
    const changeName = normalizeIdentifier(name, '提案名');
    throw new Error(`当前面板未开放创建提案，请先通过 AI 生成提案内容（建议变更名: ${changeName}）`);
  }

  throw new Error('动作不支持');
}

function commandToString(args) {
  return ['openspec', ...(args || [])].join(' ');
}

function runOpenSpecCommand(cwd, args) {
  const command = commandToString(args);
  const result = spawnSync('openspec', args, {
    cwd,
    encoding: 'utf8',
    maxBuffer: 2 * 1024 * 1024
  });
  if (result.error && result.error.code === 'ENOENT') {
    throw new Error('未找到 openspec 命令，请先安装 OpenSpec CLI');
  }
  const stdout = String(result.stdout || '');
  const stderr = String(result.stderr || '');
  return {
    command,
    exitCode: Number(result.status || 0),
    output: [stdout.trim(), stderr.trim()].filter(Boolean).join('\n').trim()
  };
}

export function executeOpenSpecPanelAction({ projectPath, action, changeId, name, runner }) {
  const cwd = String(projectPath || '').trim();
  if (!cwd) {
    throw new Error('缺少项目路径');
  }
  const commandConfig = buildPanelActionCommand({ action, changeId, name });
  const execute = typeof runner === 'function'
    ? runner
    : (dir, args) => runOpenSpecCommand(dir, args);
  const result = execute(cwd, commandConfig.args);
  const exitCode = Number(result?.exitCode || 0);
  const output = String(result?.output || '').trim();
  const command = String(result?.command || commandToString(commandConfig.args));

  if (exitCode !== 0) {
    const details = output || `命令执行失败（退出码: ${exitCode}）`;
    const error = new Error(details);
    error.exitCode = exitCode;
    error.output = output;
    error.command = command;
    throw error;
  }

  return {
    action: commandConfig.action,
    command,
    output
  };
}
