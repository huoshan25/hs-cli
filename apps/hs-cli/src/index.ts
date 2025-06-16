#!/usr/bin/env node

import { Command } from 'commander';
import chalk from 'chalk';
import { createCommand } from './commands/create';
import { generateCommand } from './commands/generate';
import { initCommand } from './commands/init';

/**
 * 创建程序实例
 */
const program = new Command();

/**
 * 设置CLI基本信息
 */
program
  .name('create-hs-cli')
  .description('一个用于快速生成项目脚手架的CLI工具')
  .version('0.2.0', '-v, --version', '显示当前版本');

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
  $ npx create-hs-cli
  $ npx create-hs-cli --force
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