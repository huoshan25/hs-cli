#!/usr/bin/env node

import { Command } from 'commander';
import chalk from 'chalk';
import { createCommand } from './commands/create';
import { generateCommand } from './commands/generate';
import { initCommand } from './commands/init';
import { readFileSync } from 'fs';
import { join } from 'path';

/**
 * 创建程序实例
 */
const program = new Command();

/**
 * 获取package.json中的版本号
 */
const packageJson = JSON.parse(
  readFileSync(join(__dirname, '../package.json'), 'utf-8')
);
const version = packageJson.version || '0.0.0';

/**
 * 设置CLI基本信息
 */
program
  .name('hs-cli')
  .description('一个持续进化的 CLI 工具集')
  .version(version, '-v, --version', '显示当前版本');

/**
 * 注册命令
 */
createCommand(program);
generateCommand(program);
initCommand(program);

/**
 * 添加帮助信息
 */
program.addHelpText('after', `
示例:
  $ npx hs-cli create
  $ npx hs-cli generate component Button
  $ npx hs-cli init
`);

/**
 * 检查参数
 */
const hasArgs = process.argv.slice(2).length > 0;

/**
 * 如果没有提供任何参数，则直接运行create命令
 */
if (!hasArgs) {
  // 手动触发create命令
  process.argv.push('create');
}

/**
 * 解析命令行参数
 */
program.parse(process.argv); 