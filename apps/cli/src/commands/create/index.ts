import { Command } from 'commander';
import inquirer from 'inquirer';
import chalk from 'chalk';
import path from 'path';
import fs from 'fs-extra';
import ora from 'ora';
import cliProgress from 'cli-progress';
import { formatLog, validateName } from '@huo-shan/utils';
import { TemplateFactory } from './templates-handler';

export function createCommand(program: Command): void {
  program
    .command('create')
    .description('创建一个新项目')
    .option('-f, --force', '强制覆盖已存在的目录', false)
    .action(async (options) => {
      try {
        console.log(chalk.bold.blue('\n欢迎使用 火山CLI - 项目创建向导\n'));
        
        // 创建进度条
        const progressBar = new cliProgress.SingleBar({
          format: chalk.cyan('{bar}') + ' | {percentage}% | {step}',
          barCompleteChar: '\u2588',
          barIncompleteChar: '\u2591',
          hideCursor: true
        });
        
        // 创建模板工厂，指定模板文件目录
        const templateFactory = new TemplateFactory(path.resolve(__dirname, './templates'));
        
        // 1. 先选择模板
        const availableTemplates = templateFactory.getAvailableTemplates();
        
        if (availableTemplates.length === 0) {
          console.log(chalk.red('错误：未找到可用的项目模板'));
          return;
        }
        
        console.log(chalk.yellow('✨ 第 1 步：选择项目模板'));
        const { selectedTemplate } = await inquirer.prompt([
          {
            type: 'list',
            name: 'selectedTemplate',
            message: '请选择项目模板:',
            choices: availableTemplates.map(template => ({
              name: template === 'vue3' ? 'Vue.js - 渐进式 JavaScript 框架' : 'Nuxt.js - Vue.js 框架',
              value: template
            })),
            prefix: chalk.green('?')
          }
        ]);
        
        console.log(chalk.green(`✓ 已选择: ${selectedTemplate === 'vue3' ? 'Vue.js' : 'Nuxt.js'}\n`));

        // 获取选定模板的处理器
        const templateHandler = templateFactory.getHandler(selectedTemplate);
        if (!templateHandler) {
          console.log(chalk.red(`错误：未找到模板 ${selectedTemplate} 的处理器`));
          return;
        }

        // 2. 选择模板特性
        console.log(chalk.yellow('✨ 第 2 步：选择项目特性'));
        const features = templateHandler.getFeatures();

        const { selectedFeatures } = await inquirer.prompt([
          {
            type: 'checkbox',
            name: 'selectedFeatures',
            message: '选择项目特性:',
            choices: features.map(feature => ({
              name: feature.message,
              value: feature.name,
              checked: feature.checked
            })),
            pageSize: 10,
            prefix: chalk.green('?'),
            validate: (answer) => {
              if (answer.length === 0) {
                return '请至少选择一个特性';
              }
              return true;
            }
          }
        ]);

        // 将选中的特性转换为对象
        const featuresObj = features.reduce((acc, feature) => {
          acc[feature.name] = selectedFeatures.includes(feature.name);
          return acc;
        }, {} as Record<string, boolean>);

        console.log(chalk.green(`✓ 已选择特性: ${selectedFeatures.join(', ')}\n`));
        
        // 3. 输入项目名称
        console.log(chalk.yellow('✨ 第 3 步：设置项目信息'));
        const { projectName } = await inquirer.prompt([
          {
            type: 'input',
            name: 'projectName',
            message: '请输入项目名称:',
            prefix: chalk.green('?'),
            validate: (input: string) => {
              if (!input.trim()) {
                return '项目名称不能为空';
              }
              if (!validateName(input)) {
                return '项目名称只能包含字母、数字、下划线和短横线';
              }
              return true;
            }
          }
        ]);
        
        console.log(chalk.green(`✓ 项目名称: ${projectName}\n`));

        // 检查目标目录是否已存在
        const targetDir = path.resolve(process.cwd(), projectName);
        if (fs.existsSync(targetDir)) {
          if (options.force) {
            console.log(chalk.yellow(`目录 ${targetDir} 已存在，正在强制删除...`));
            await fs.remove(targetDir);
          } else {
            const { proceed } = await inquirer.prompt([
              {
                type: 'confirm',
                name: 'proceed',
                message: `目录 ${projectName} 已存在，是否继续？`,
                default: false,
                prefix: chalk.yellow('!')
              }
            ]);
            
            if (!proceed) {
              console.log(chalk.yellow('已取消操作'));
              return;
            }
            
            const spinner = ora('正在清理目录...').start();
            await fs.remove(targetDir);
            spinner.succeed('目录清理完成');
          }
        }

        // 处理模板文件
        console.log(chalk.cyan('\n🚀 开始创建项目...\n'));
        
        // 启动进度条
        progressBar.start(100, 0, { step: '准备创建项目...' });
        
        // 更新进度
        progressBar.update(10, { step: '创建项目目录...' });
        await fs.ensureDir(targetDir);
        
        // 更新进度并处理模板
        progressBar.update(30, { step: '处理项目模板...' });
        await templateHandler.processTemplate(targetDir, featuresObj, projectName);
        
        // 完成进度
        progressBar.update(100, { step: '项目创建完成!' });
        progressBar.stop();

        console.log(chalk.green(`\n✨ 项目 ${chalk.bold(projectName)} 创建成功！\n`));
        
        // 获取正确的启动命令
        const { installCmd, startCmd } = templateHandler.getCommands();
        
        console.log(chalk.cyan(`接下来你可以运行以下命令：\n`));
        console.log(chalk.white(`  cd ${projectName}`));
        console.log(chalk.white(`  ${installCmd}`));
        console.log(chalk.white(`  ${startCmd}\n`));
        console.log(chalk.yellow(`提示: 您也可以使用 pnpm 或 yarn 作为包管理器\n`));
        console.log(chalk.yellow('愉快地编码吧! 🎉\n'));
      } catch (error: any) {
        console.error(chalk.red(formatLog(`创建项目失败：${error.message}`, 'error')));
        process.exit(1);
      }
    });
} 