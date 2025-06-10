import { Command } from 'commander';
import inquirer from 'inquirer';
import chalk from 'chalk';
import path from 'path';
import fs from 'fs-extra';
import { formatLog } from '@my-cli/utils';

export function initCommand(program: Command): void {
  program
    .command('init')
    .description('在当前目录初始化配置')
    .option('-f, --force', '强制覆盖已存在的配置', false)
    .action(async (options) => {
      try {
        const configFile = path.join(process.cwd(), 'my-cli.config.js');
        
        // 检查配置文件是否已存在
        if (fs.existsSync(configFile) && !options.force) {
          const { overwrite } = await inquirer.prompt([
            {
              type: 'confirm',
              name: 'overwrite',
              message: '配置文件已存在，是否覆盖？',
              default: false
            }
          ]);
          
          if (!overwrite) {
            console.log(chalk.yellow('初始化已取消'));
            return;
          }
        }
        
        // 创建配置文件
        const configContent = `/**
 * my-cli 配置文件
 */
module.exports = {
  // 项目名称
  projectName: '${path.basename(process.cwd())}',
  
  // 自定义模板路径
  templatesDir: './templates',
  
  // 组件配置
  component: {
    // 默认组件路径
    outputDir: './src/components',
    // 组件样式文件格式 (css, scss, less)
    styleExt: 'css',
  },
  
  // 页面配置
  page: {
    // 默认页面路径
    outputDir: './src/pages',
    // 页面样式文件格式 (css, scss, less)
    styleExt: 'css',
  },
  
  // 服务配置
  service: {
    // 默认服务路径
    outputDir: './src/services',
  },
  
  // Hook配置
  hook: {
    // 默认Hook路径
    outputDir: './src/hooks',
  },
};
`;
        
        await fs.writeFile(configFile, configContent);
        console.log(chalk.green('配置文件初始化成功！'));
        console.log(chalk.blue(`配置文件路径: ${configFile}`));
      } catch (error: any) {
        console.error(chalk.red(formatLog(`初始化配置失败：${error.message}`, 'error')));
        process.exit(1);
      }
    });
} 