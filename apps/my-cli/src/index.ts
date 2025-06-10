#!/usr/bin/env node

import { Command } from 'commander';
import chalk from 'chalk';
import { createCommand } from './commands/create';
import { generateCommand } from './commands/generate';
import { initCommand } from './commands/init';

// 创建程序实例
const program = new Command();

// 设置CLI基本信息
program
  .name('my-cli')
  .description('一个用于快速生成项目脚手架的CLI工具')
  .version('1.0.0', '-v, --version', '显示当前版本');

// 注册命令
createCommand(program);
generateCommand(program);
initCommand(program);

// 添加帮助信息
program.addHelpText('after', `
示例:
  $ my-cli create my-app
  $ my-cli generate component Button
  $ my-cli init --force
`);

// 解析命令行参数
program.parse(process.argv);

// 如果没有提供参数，则显示帮助信息并以0退出
if (!process.argv.slice(2).length) {
  program.outputHelp();
  process.exit(0); // 确保以退出码0退出
} 