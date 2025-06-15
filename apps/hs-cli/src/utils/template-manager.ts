import fs from 'fs-extra';
import path from 'path';

// 定义模板特性接口
export interface TemplateFeature {
  name: string;
  message: string;
  description: string;
  checked: boolean;
}

/**
 * 模板管理器类
 */
export class TemplateManager {
  private templatesDir: string;

  constructor(templatesDir: string) {
    this.templatesDir = templatesDir;
  }

  /**
   * 获取可用的模板列表
   */
  async getAvailableTemplates(): Promise<string[]> {
    const templates = await fs.readdir(this.templatesDir);
    return templates.filter(item => fs.statSync(path.join(this.templatesDir, item)).isDirectory());
  }

  /**
   * 获取模板特性选项
   * @param templateName 模板名称
   */
  getTemplateFeatures(templateName: string): TemplateFeature[] {
    const features: Record<string, TemplateFeature[]> = {
      vue3: [
        {
          name: 'typescript',
          message: 'TypeScript',
          description: '使用 TypeScript 进行开发，提供类型检查和更好的开发体验',
          checked: false
        },
        {
          name: 'jsx',
          message: 'JSX 支持',
          description: '支持在 Vue 组件中使用 JSX 语法',
          checked: false
        },
        {
          name: 'router',
          message: 'Router (单页面应用开发)',
          description: '使用 Vue Router 进行路由管理，实现页面导航功能',
          checked: false
        },
        {
          name: 'pinia',
          message: 'Pinia (状态管理)',
          description: '使用 Pinia 进行状态管理，提供更好的状态管理方案',
          checked: false
        },
        {
          name: 'vitest',
          message: 'Vitest (单元测试)',
          description: '使用 Vitest 进行单元测试，确保代码质量',
          checked: false
        },
        {
          name: 'eslint',
          message: 'ESLint (错误预防)',
          description: '使用 ESLint 进行代码检查，保持代码风格一致',
          checked: false
        },
        {
          name: 'prettier',
          message: 'Prettier (代码格式化)',
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

  /**
   * 处理模板文件
   * @param templateName 模板名称
   * @param targetDir 目标目录
   * @param features 选择的特性
   * @param projectName 项目名称
   */
  async processTemplate(
    templateName: string,
    targetDir: string,
    features: Record<string, boolean>,
    projectName: string
  ): Promise<void> {
    // 生成基础模板
    await this.generateBaseTemplate(templateName, targetDir);

    // 生成特性文件
    await this.generateFeatureFiles(targetDir, features);

    // 处理 package.json
    await this.processPackageJson(targetDir, templateName, features, projectName);
  }

  /**
   * 生成基础模板
   * @param templateName 模板名称
   * @param targetDir 目标目录
   */
  private async generateBaseTemplate(templateName: string, targetDir: string): Promise<void> {
    const baseTemplateDir = path.join(this.templatesDir, templateName, 'base');
    
    // 如果存在base目录，则复制整个目录
    if (fs.existsSync(baseTemplateDir)) {
      await fs.copy(baseTemplateDir, targetDir);
      return;
    }
    
    // 否则使用内置的基础模板
    const baseFiles = this.getBaseFiles(templateName);
    
    for (const [file, content] of Object.entries(baseFiles)) {
      const filePath = path.join(targetDir, file);
      await fs.ensureDir(path.dirname(filePath));
      
      if (typeof content === 'string') {
        await fs.writeFile(filePath, content);
      } else {
        await fs.writeJson(filePath, content, { spaces: 2 });
      }
    }
  }

  /**
   * 获取基础文件
   * @param templateName 模板名称
   */
  private getBaseFiles(templateName: string): Record<string, any> {
    const baseFiles: Record<string, Record<string, any>> = {
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

    return baseFiles[templateName as keyof typeof baseFiles] || {};
  }

  /**
   * 生成特性文件
   * @param targetDir 目标目录
   * @param features 选择的特性
   */
  private async generateFeatureFiles(targetDir: string, features: Record<string, boolean>): Promise<void> {
    const featureFiles = this.getFeatureFiles();
    
    for (const [feature, enabled] of Object.entries(features)) {
      if (enabled && featureFiles[feature]) {
        for (const [file, content] of Object.entries(featureFiles[feature])) {
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

  /**
   * 获取特性文件
   */
  private getFeatureFiles(): Record<string, Record<string, any>> {
    return {
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
      jsx: {
        'vite.config.js': `import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import vueJsx from '@vitejs/plugin-vue-jsx'

export default defineConfig({
  plugins: [vue(), vueJsx()],
})`
      },
      router: {
        'src/router/index.js': `import { createRouter, createWebHistory } from 'vue-router'
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

<script>
export default {
  name: 'HomeView'
}
</script>`,
        'src/main.js': `import { createApp } from 'vue'
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
      pinia: {
        'src/stores/counter.js': `import { defineStore } from 'pinia'

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
        'src/main.js': `import { createApp } from 'vue'
import { createPinia } from 'pinia'
import App from './App.vue'

const app = createApp(App)
app.use(createPinia())
app.mount('#app')`
      },
      vitest: {
        'vitest.config.js': `import { defineConfig } from 'vitest/config'
import vue from '@vitejs/plugin-vue'

export default defineConfig({
  plugins: [vue()],
  test: {
    environment: 'jsdom'
  }
})`,
        'src/components/__tests__/HelloWorld.spec.js': `import { describe, it, expect } from 'vitest'
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
    'eslint:recommended'
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
  }

  /**
   * 处理package.json文件
   * @param targetDir 目标目录
   * @param templateName 模板名称
   * @param features 选择的特性
   * @param projectName 项目名称
   */
  private async processPackageJson(
    targetDir: string,
    templateName: string,
    features: Record<string, boolean>,
    projectName: string
  ): Promise<void> {
    const pkgPath = path.join(targetDir, 'package.json');
    if (!await fs.pathExists(pkgPath)) {
      return;
    }

    const pkg = await fs.readJson(pkgPath);
    
    // 设置项目名称
    pkg.name = projectName;
    
    // 根据特性添加依赖
    if (features.typescript) {
      pkg.devDependencies = {
        ...pkg.devDependencies,
        typescript: '^5.0.0',
        '@types/node': '^18.0.0',
        'vue-tsc': '^1.0.0'
      };
      
      // 修改构建脚本
      if (templateName === 'vue3') {
        pkg.scripts.build = 'vue-tsc --noEmit && vite build';
      }
      
      // 更新index.html中的入口
      const indexPath = path.join(targetDir, 'index.html');
      if (await fs.pathExists(indexPath)) {
        let indexContent = await fs.readFile(indexPath, 'utf-8');
        indexContent = indexContent.replace('src/main.js', 'src/main.ts');
        await fs.writeFile(indexPath, indexContent);
      }
      
      // 更新vite配置
      const viteConfigPath = path.join(targetDir, 'vite.config.js');
      if (await fs.pathExists(viteConfigPath)) {
        await fs.rename(viteConfigPath, path.join(targetDir, 'vite.config.ts'));
      }
    }

    if (features.jsx) {
      pkg.devDependencies = {
        ...pkg.devDependencies,
        '@vitejs/plugin-vue-jsx': '^3.0.0'
      };
    }

    if (features.router) {
      pkg.dependencies = {
        ...pkg.dependencies,
        'vue-router': '^4.0.0'
      };
    }

    if (features.pinia) {
      pkg.dependencies = {
        ...pkg.dependencies,
        'pinia': '^2.0.0'
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
        'eslint-plugin-vue': '^9.0.0'
      };
      
      // 为TypeScript添加特定的ESLint配置
      if (features.typescript) {
        pkg.devDependencies = {
          ...pkg.devDependencies,
          '@typescript-eslint/parser': '^5.0.0',
          '@typescript-eslint/eslint-plugin': '^5.0.0'
        };
      }
      
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

  /**
   * 获取模板的默认启动命令
   * @param templateName 模板名称
   * @returns 安装命令和启动命令
   */
  getTemplateCommands(templateName: string): { installCmd: string, startCmd: string } {
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
} 