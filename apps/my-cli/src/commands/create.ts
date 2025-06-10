import { Command } from 'commander';
import inquirer from 'inquirer';
import chalk from 'chalk';
import path from 'path';
import fs from 'fs-extra';
import { formatLog, validateName } from '@my-cli/utils';

export function createCommand(program: Command): void {
  program
    .command('create')
    .description('创建一个新项目')
    .argument('<name>', '项目名称')
    .option('-t, --template <template>', '项目模板', 'default')
    .option('-f, --force', '强制覆盖已存在的目录', false)
    .action(async (name, options) => {
      try {
        // 验证项目名称
        if (!validateName(name)) {
          console.log(chalk.red('错误：项目名称只能包含字母、数字、下划线和短横线'));
          return;
        }

        // 检查目标目录是否已存在
        const targetDir = path.resolve(process.cwd(), name);
        if (fs.existsSync(targetDir)) {
          if (options.force) {
            console.log(chalk.yellow(`目录 ${targetDir} 已存在，正在强制删除...`));
            await fs.remove(targetDir);
          } else {
            const { proceed } = await inquirer.prompt([
              {
                type: 'confirm',
                name: 'proceed',
                message: `目录 ${name} 已存在，是否继续？`,
                default: false
              }
            ]);
            
            if (!proceed) {
              console.log(chalk.yellow('已取消操作'));
              return;
            }
            await fs.remove(targetDir);
          }
        }

        // 获取模板路径
        const templateDir = path.resolve(__dirname, '../templates', options.template);
        if (!fs.existsSync(templateDir)) {
          console.log(chalk.red(`错误：模板 ${options.template} 不存在`));
          return;
        }

        // 复制模板到目标目录
        console.log(chalk.blue(`正在创建项目 ${name}...`));
        await fs.copy(templateDir, targetDir);

        // 替换模板中的项目名称
        const pkgJsonPath = path.join(targetDir, 'package.json');
        if (fs.existsSync(pkgJsonPath)) {
          const pkg = await fs.readJson(pkgJsonPath);
          pkg.name = name;
          await fs.writeJson(pkgJsonPath, pkg, { spaces: 2 });
        }

        console.log(chalk.green(`项目 ${name} 创建成功！`));
        console.log(chalk.blue(`
  接下来你可以运行以下命令：
  
  cd ${name}
  npm install
  npm start
        `));
      } catch (error: any) {
        console.error(chalk.red(formatLog(`创建项目失败：${error.message}`, 'error')));
        process.exit(1);
      }
    });
} 