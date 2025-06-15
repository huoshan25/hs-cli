import { Command } from 'commander';
import inquirer from 'inquirer';
import chalk from 'chalk';
import path from 'path';
import fs from 'fs-extra';
import ora from 'ora';
import cliProgress from 'cli-progress';
import { formatLog, validateName } from '@huo-shan/utils';

// 获取可用的模板列表
async function getAvailableTemplates() {
  const templatesDir = path.resolve(__dirname, '../templates');
  const templates = await fs.readdir(templatesDir);
  return templates.filter(item => fs.statSync(path.join(templatesDir, item)).isDirectory());
}

// 获取模板特性选项
function getTemplateFeatures(templateName: string) {
  const features = {
    vue3: [
      {
        name: 'typescript',
        message: 'TypeScript',
        description: '使用 TypeScript 进行开发，提供类型检查和更好的开发体验',
        checked: false
      },
      {
        name: 'unocss',
        message: 'UnoCSS',
        description: '使用 UnoCSS 原子化 CSS 框架，提供高效的样式开发体验',
        checked: false
      },
      {
        name: 'pinia',
        message: 'Pinia',
        description: '使用 Pinia 进行状态管理，提供更好的状态管理方案',
        checked: false
      },
      {
        name: 'vue-router',
        message: 'Vue Router',
        description: '使用 Vue Router 进行路由管理，实现页面导航功能',
        checked: false
      },
      {
        name: 'vitest',
        message: 'Vitest',
        description: '使用 Vitest 进行单元测试，确保代码质量',
        checked: false
      },
      {
        name: 'eslint',
        message: 'ESLint',
        description: '使用 ESLint 进行代码检查，保持代码风格一致',
        checked: false
      },
      {
        name: 'prettier',
        message: 'Prettier',
        description: '使用 Prettier 进行代码格式化，统一代码风格',
        checked: false
      }
    ],
    nuxt3: [
      {
        name: 'typescript',
        message: 'TypeScript',
        description: '使用 TypeScript 进行开发，提供类型检查和更好的开发体验',
        checked: false
      },
      {
        name: 'unocss',
        message: 'UnoCSS',
        description: '使用 UnoCSS 原子化 CSS 框架，提供高效的样式开发体验',
        checked: false
      },
      {
        name: 'eslint',
        message: 'ESLint',
        description: '使用 ESLint 进行代码检查，保持代码风格一致',
        checked: false
      },
      {
        name: 'prettier',
        message: 'Prettier',
        description: '使用 Prettier 进行代码格式化，统一代码风格',
        checked: false
      }
    ]
  };

  return features[templateName as keyof typeof features] || [];
}

// 生成基础模板文件
async function generateBaseTemplate(targetDir: string, templateName: string) {
  const baseFiles = {
    vue3: {
      'package.json': {
        name: '{{name}}',
        private: true,
        version: '0.0.0',
        type: 'module',
        scripts: {
          dev: 'vite',
          build: 'vite build',
          preview: 'vite preview'
        },
        dependencies: {
          vue: '^3.3.0'
        },
        devDependencies: {
          '@vitejs/plugin-vue': '^4.2.0',
          vite: '^4.3.0'
        }
      },
      'index.html': `<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8">
    <link rel="icon" href="/favicon.ico">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>{{name}}</title>
  </head>
  <body>
    <div id="app"></div>
    <script type="module" src="/src/main.js"></script>
  </body>
</html>`,
      'vite.config.js': `import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'

export default defineConfig({
  plugins: [vue()],
})`,
      'src/main.js': `import { createApp } from 'vue'
import App from './App.vue'

createApp(App).mount('#app')`,
      'src/App.vue': `<template>
  <div>
    <h1>{{name}}</h1>
  </div>
</template>

<script>
export default {
  name: 'App'
}
</script>

<style>
#app {
  font-family: Avenir, Helvetica, Arial, sans-serif;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  text-align: center;
  color: #2c3e50;
  margin-top: 60px;
}
</style>`,
      '.gitignore': `# Logs
logs
*.log
npm-debug.log*
yarn-debug.log*
yarn-error.log*
pnpm-debug.log*
lerna-debug.log*

node_modules
dist
dist-ssr
*.local

# Editor directories and files
.vscode/*
!.vscode/extensions.json
.idea
.DS_Store
*.suo
*.ntvs*
*.njsproj
*.sln
*.sw?`
    },
    nuxt3: {
      'package.json': {
        name: '{{name}}',
        private: true,
        version: '0.0.0',
        type: 'module',
        scripts: {
          dev: 'nuxt dev',
          build: 'nuxt build',
          generate: 'nuxt generate',
          preview: 'nuxt preview'
        },
        dependencies: {
          nuxt: '^3.0.0'
        }
      },
      'nuxt.config.ts': `export default defineNuxtConfig({
  devtools: { enabled: true }
})`,
      'app.vue': `<template>
  <div>
    <h1>{{name}}</h1>
  </div>
</template>`,
      '.gitignore': `# Nuxt dev/build outputs
.output
.data
.nuxt
.nitro
.cache
dist

# Node dependencies
node_modules

# Logs
logs
*.log

# Misc
.DS_Store
.fleet
.idea`
    }
  };

  const template = baseFiles[templateName as keyof typeof baseFiles];
  if (!template) {
    throw new Error(`模板 ${templateName} 不存在`);
  }

  for (const [file, content] of Object.entries(template)) {
    const filePath = path.join(targetDir, file);
    await fs.ensureDir(path.dirname(filePath));
    if (typeof content === 'string') {
      await fs.writeFile(filePath, content);
    } else {
      await fs.writeJson(filePath, content, { spaces: 2 });
    }
  }
}

// 生成特性模板文件
async function generateFeatureFiles(targetDir: string, features: Record<string, boolean>) {
  const featureFiles = {
    typescript: {
      'tsconfig.json': {
        compilerOptions: {
          target: 'ES2020',
          useDefineForClassFields: true,
          module: 'ESNext',
          lib: ['ES2020', 'DOM', 'DOM.Iterable'],
          skipLibCheck: true,
          moduleResolution: 'bundler',
          allowImportingTsExtensions: true,
          resolveJsonModule: true,
          isolatedModules: true,
          noEmit: true,
          jsx: 'preserve',
          strict: true,
          noUnusedLocals: true,
          noUnusedParameters: true,
          noFallthroughCasesInSwitch: true
        },
        include: ['src/**/*.ts', 'src/**/*.d.ts', 'src/**/*.tsx', 'src/**/*.vue'],
        references: [{ path: './tsconfig.node.json' }]
      },
      'tsconfig.node.json': {
        compilerOptions: {
          composite: true,
          skipLibCheck: true,
          module: 'ESNext',
          moduleResolution: 'bundler',
          allowSyntheticDefaultImports: true
        },
        include: ['vite.config.ts']
      },
      'env.d.ts': `/// <reference types="vite/client" />

declare module '*.vue' {
  import type { DefineComponent } from 'vue'
  const component: DefineComponent<{}, {}, any>
  export default component
}`,
      'src/main.ts': `import { createApp } from 'vue'
import App from './App.vue'

createApp(App).mount('#app')`,
      'src/App.vue': `<template>
  <div>
    <h1>{{name}}</h1>
  </div>
</template>

<script lang="ts">
import { defineComponent } from 'vue'

export default defineComponent({
  name: 'App'
})
</script>

<style>
#app {
  font-family: Avenir, Helvetica, Arial, sans-serif;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  text-align: center;
  color: #2c3e50;
  margin-top: 60px;
}
</style>`
    },
    unocss: {
      'uno.config.ts': `import { defineConfig, presetUno, presetAttributify, presetIcons } from 'unocss'

export default defineConfig({
  presets: [
    presetUno(),
    presetAttributify(),
    presetIcons()
  ]
})`,
      'src/main.ts': `import { createApp } from 'vue'
import App from './App.vue'
import 'uno.css'

createApp(App).mount('#app')`
    },
    pinia: {
      'src/stores/counter.ts': `import { defineStore } from 'pinia'

export const useCounterStore = defineStore('counter', {
  state: () => ({
    count: 0
  }),
  actions: {
    increment() {
      this.count++
    }
  }
})`,
      'src/main.ts': `import { createApp } from 'vue'
import { createPinia } from 'pinia'
import App from './App.vue'

const app = createApp(App)
app.use(createPinia())
app.mount('#app')`
    },
    'vue-router': {
      'src/router/index.ts': `import { createRouter, createWebHistory } from 'vue-router'
import Home from '../views/Home.vue'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/',
      name: 'home',
      component: Home
    }
  ]
})

export default router`,
      'src/views/Home.vue': `<template>
  <div class="home">
    <h1>Home</h1>
  </div>
</template>

<script lang="ts">
import { defineComponent } from 'vue'

export default defineComponent({
  name: 'HomeView'
})
</script>`,
      'src/main.ts': `import { createApp } from 'vue'
import App from './App.vue'
import router from './router'

const app = createApp(App)
app.use(router)
app.mount('#app')`,
      'src/App.vue': `<template>
  <div id="app">
    <nav>
      <router-link to="/">Home</router-link>
    </nav>
    <router-view/>
  </div>
</template>

<style>
#app {
  font-family: Avenir, Helvetica, Arial, sans-serif;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  text-align: center;
  color: #2c3e50;
}

nav {
  padding: 30px;
}

nav a {
  font-weight: bold;
  color: #2c3e50;
  text-decoration: none;
}

nav a.router-link-exact-active {
  color: #42b983;
}
</style>`
    },
    vitest: {
      'vitest.config.ts': `import { defineConfig } from 'vitest/config'
import vue from '@vitejs/plugin-vue'

export default defineConfig({
  plugins: [vue()],
  test: {
    environment: 'jsdom'
  }
})`,
      'src/components/__tests__/HelloWorld.spec.ts': `import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import HelloWorld from '../HelloWorld.vue'

describe('HelloWorld', () => {
  it('renders properly', () => {
    const wrapper = mount(HelloWorld, { props: { msg: 'Hello Vitest' } })
    expect(wrapper.text()).toContain('Hello Vitest')
  })
})`
    },
    eslint: {
      '.eslintrc.js': `module.exports = {
  root: true,
  env: {
    node: true
  },
  extends: [
    'plugin:vue/vue3-essential',
    'eslint:recommended',
    '@vue/typescript/recommended'
  ],
  parserOptions: {
    ecmaVersion: 2020
  },
  rules: {
    'no-console': process.env.NODE_ENV === 'production' ? 'warn' : 'off',
    'no-debugger': process.env.NODE_ENV === 'production' ? 'warn' : 'off'
  }
}`,
      '.eslintignore': `dist
node_modules`
    },
    prettier: {
      '.prettierrc': `{
  "semi": false,
  "singleQuote": true,
  "trailingComma": "none"
}`,
      '.prettierignore': `dist
node_modules`
    }
  };

  for (const [feature, enabled] of Object.entries(features)) {
    if (enabled) {
      const files = featureFiles[feature as keyof typeof featureFiles];
      if (files) {
        for (const [file, content] of Object.entries(files)) {
          const filePath = path.join(targetDir, file);
          await fs.ensureDir(path.dirname(filePath));
          if (typeof content === 'string') {
            await fs.writeFile(filePath, content);
          } else {
            await fs.writeJson(filePath, content, { spaces: 2 });
          }
        }
      }
    }
  }
}

// 处理模板文件
async function processTemplateFiles(templateDir: string, targetDir: string, features: Record<string, boolean>) {
  // 生成基础模板
  await generateBaseTemplate(targetDir, path.basename(templateDir));

  // 生成特性文件
  await generateFeatureFiles(targetDir, features);

  // 处理 package.json
  const pkgPath = path.join(targetDir, 'package.json');
  if (await fs.pathExists(pkgPath)) {
    const pkg = await fs.readJson(pkgPath);
    
    // 根据特性添加依赖
    if (features.typescript) {
      pkg.devDependencies = {
        ...pkg.devDependencies,
        typescript: '^5.0.0',
        '@types/node': '^18.0.0',
        'vue-tsc': '^1.0.0'
      };
    }

    if (features.unocss) {
      pkg.dependencies = {
        ...pkg.dependencies,
        '@unocss/preset-uno': '^0.45.0',
        '@unocss/preset-attributify': '^0.45.0',
        '@unocss/preset-icons': '^0.45.0',
        'unocss': '^0.45.0'
      };
    }

    if (features.pinia) {
      pkg.dependencies = {
        ...pkg.dependencies,
        'pinia': '^2.0.0'
      };
    }

    if (features['vue-router']) {
      pkg.dependencies = {
        ...pkg.dependencies,
        'vue-router': '^4.0.0'
      };
    }

    if (features.vitest) {
      pkg.devDependencies = {
        ...pkg.devDependencies,
        'vitest': '^0.34.0',
        '@vue/test-utils': '^2.4.0',
        'jsdom': '^22.0.0'
      };
      pkg.scripts = {
        ...pkg.scripts,
        'test:unit': 'vitest'
      };
    }

    if (features.eslint) {
      pkg.devDependencies = {
        ...pkg.devDependencies,
        'eslint': '^8.0.0',
        '@typescript-eslint/parser': '^5.0.0',
        '@typescript-eslint/eslint-plugin': '^5.0.0',
        'eslint-plugin-vue': '^9.0.0'
      };
      pkg.scripts = {
        ...pkg.scripts,
        'lint': 'eslint . --ext .vue,.js,.jsx,.cjs,.mjs,.ts,.tsx,.cts,.mts --fix --ignore-path .gitignore'
      };
    }

    if (features.prettier) {
      pkg.devDependencies = {
        ...pkg.devDependencies,
        'prettier': '^2.0.0'
      };
      pkg.scripts = {
        ...pkg.scripts,
        'format': 'prettier --write src/'
      };
    }

    await fs.writeJson(pkgPath, pkg, { spaces: 2 });
  }
}

// 获取模板的默认启动命令
function getTemplateCommands(templateName: string, pkgExists: boolean, pkg: any = null) {
  const installCmd = 'npm install';
  let startCmd = 'npm start';
  
  // 针对特定模板的默认命令
  if (templateName === 'nuxt3') {
    startCmd = 'npm run dev';
  } else if (templateName === 'vue3') {
    startCmd = 'npm run dev';
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
        console.log(chalk.bold.blue('\n欢迎使用 火山CLI - 项目创建向导\n'));
        
        // 创建进度条
        const progressBar = new cliProgress.SingleBar({
          format: chalk.cyan('{bar}') + ' | {percentage}% | {step}',
          barCompleteChar: '\u2588',
          barIncompleteChar: '\u2591',
          hideCursor: true
        });
        
        // 1. 先选择模板
        const availableTemplates = await getAvailableTemplates();
        
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

        // 2. 选择模板特性
        console.log(chalk.yellow('✨ 第 2 步：选择项目特性'));
        const features = getTemplateFeatures(selectedTemplate);
        const { selectedFeatures } = await inquirer.prompt([
          {
            type: 'checkbox',
            name: 'selectedFeatures',
            message: '请选择项目特性（使用空格键选择/取消选择，回车键确认）:',
            choices: features,
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

        // 获取模板路径
        const templateDir = path.resolve(__dirname, '../templates', selectedTemplate);
        if (!fs.existsSync(templateDir)) {
          console.log(chalk.red(`错误：模板 ${selectedTemplate} 不存在`));
          return;
        }

        // 处理模板文件
        console.log(chalk.cyan('\n🚀 开始创建项目...\n'));
        
        // 启动进度条
        progressBar.start(100, 0, { step: '准备创建项目...' });
        
        // 更新进度
        progressBar.update(10, { step: '创建项目目录...' });
        await fs.ensureDir(targetDir);
        
        // 更新进度
        progressBar.update(30, { step: '生成基础模板...' });
        await generateBaseTemplate(targetDir, selectedTemplate);
        
        // 更新进度
        progressBar.update(60, { step: '添加项目特性...' });
        await generateFeatureFiles(targetDir, featuresObj);
        
        // 更新进度
        progressBar.update(80, { step: '配置项目依赖...' });

        // 替换模板中的项目名称（如果存在package.json）
        const pkgJsonPath = path.join(targetDir, 'package.json');
        const pkgExists = fs.existsSync(pkgJsonPath);
        let pkg = null;
        
        if (pkgExists) {
          pkg = await fs.readJson(pkgJsonPath);
          pkg.name = projectName;
          await fs.writeJson(pkgJsonPath, pkg, { spaces: 2 });
        }
        
        // 完成进度
        progressBar.update(100, { step: '项目创建完成!' });
        progressBar.stop();

        console.log(chalk.green(`\n✨ 项目 ${chalk.bold(projectName)} 创建成功！\n`));
        
        // 获取正确的启动命令
        const { installCmd, startCmd } = getTemplateCommands(selectedTemplate, pkgExists, pkg);
        
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