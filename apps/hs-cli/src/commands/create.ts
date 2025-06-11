import { Command } from 'commander';
import inquirer from 'inquirer';
import chalk from 'chalk';
import path from 'path';
import fs from 'fs-extra';
import { formatLog, validateName } from '@huo-shan/utils';

// 获取可用的模板列表
async function getAvailableTemplates() {
  const templatesDir = path.resolve(__dirname, '../templates');
  const templates = await fs.readdir(templatesDir);
  return templates.filter(item => fs.statSync(path.join(templatesDir, item)).isDirectory());
}

// 获取模板的默认启动命令
function getTemplateCommands(templateName: string, pkgExists: boolean, pkg: any = null, hasLockFile: string | null = null) {
  let installCmd = 'npm install';
  let startCmd = 'npm start';
  
  // 根据锁文件判断包管理器
  if (hasLockFile === 'pnpm') {
    installCmd = 'pnpm install';
  } else if (hasLockFile === 'yarn') {
    installCmd = 'yarn';
  }
  
  // 针对特定模板的默认命令
  if (templateName === 'nuxt3') {
    startCmd = installCmd.startsWith('pnpm') ? 'pnpm dev' : 
              installCmd.startsWith('yarn') ? 'yarn dev' : 'npm run dev';
  } else if (templateName === 'vue3') {
    startCmd = installCmd.startsWith('pnpm') ? 'pnpm dev' : 
              installCmd.startsWith('yarn') ? 'yarn dev' : 'npm run dev';
  }
  
  // 如果有package.json，根据scripts字段确定启动命令
  if (pkgExists && pkg && pkg.scripts) {
    if (pkg.scripts.dev) {
      startCmd = installCmd.startsWith('pnpm') ? 'pnpm dev' : 
                installCmd.startsWith('yarn') ? 'yarn dev' : 'npm run dev';
    } else if (pkg.scripts.serve) {
      startCmd = installCmd.startsWith('pnpm') ? 'pnpm serve' : 
                installCmd.startsWith('yarn') ? 'yarn serve' : 'npm run serve';
    } else if (pkg.scripts.start) {
      startCmd = installCmd.startsWith('pnpm') ? 'pnpm start' : 
                installCmd.startsWith('yarn') ? 'yarn start' : 'npm run start';
    }
  }
  
  return { installCmd, startCmd };
}

export function createCommand(program: Command): void {
  program
    .command('create')
    .description('创建一个新项目')
    .option('-f, --force', '强制覆盖已存在的目录', false)
    .action(async (options) => {
      try {
        // 1. 先选择模板
        const availableTemplates = await getAvailableTemplates();
        
        if (availableTemplates.length === 0) {
          console.log(chalk.red('错误：未找到可用的项目模板'));
          return;
        }
        
        const { selectedTemplate } = await inquirer.prompt([
          {
            type: 'list',
            name: 'selectedTemplate',
            message: '请选择项目模板:',
            choices: availableTemplates
          }
        ]);
        
        // 2. 输入项目名称
        const { projectName } = await inquirer.prompt([
          {
            type: 'input',
            name: 'projectName',
            message: '请输入项目名称:',
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
        const templateDir = path.resolve(__dirname, '../templates', selectedTemplate);
        if (!fs.existsSync(templateDir)) {
          console.log(chalk.red(`错误：模板 ${selectedTemplate} 不存在`));
          return;
        }

        // 复制模板到目标目录
        console.log(chalk.blue(`正在创建项目 ${projectName}，使用模板 ${selectedTemplate}...`));
        await fs.copy(templateDir, targetDir);

        // 替换模板中的项目名称（如果存在package.json）
        const pkgJsonPath = path.join(targetDir, 'package.json');
        const pkgExists = fs.existsSync(pkgJsonPath);
        let pkg = null;
        
        if (pkgExists) {
          pkg = await fs.readJson(pkgJsonPath);
          pkg.name = projectName;
          await fs.writeJson(pkgJsonPath, pkg, { spaces: 2 });
        } else {
          // 如果模板中没有package.json，为nuxt3等特殊模板创建一个
          if (selectedTemplate === 'nuxt3') {
            pkg = {
              name: projectName,
              private: true,
              type: "module",
              scripts: {
                "dev": "nuxt dev",
                "build": "nuxt build",
                "generate": "nuxt generate",
                "preview": "nuxt preview"
              }
            };
            await fs.writeJson(pkgJsonPath, pkg, { spaces: 2 });
          }
        }

        console.log(chalk.green(`项目 ${projectName} 创建成功！`));
        
        // 确定项目使用的包管理器
        let hasLockFile = null;
        if (fs.existsSync(path.join(targetDir, 'pnpm-lock.yaml'))) {
          hasLockFile = 'pnpm';
        } else if (fs.existsSync(path.join(targetDir, 'yarn.lock'))) {
          hasLockFile = 'yarn';
        }
        
        // 获取正确的启动命令
        const { installCmd, startCmd } = getTemplateCommands(selectedTemplate, pkgExists, pkg, hasLockFile);
        
        console.log(chalk.blue(`
  接下来你可以运行以下命令：
  
  cd ${projectName}
  ${installCmd}
  ${startCmd}
        `));
      } catch (error: any) {
        console.error(chalk.red(formatLog(`创建项目失败：${error.message}`, 'error')));
        process.exit(1);
      }
    });
} 