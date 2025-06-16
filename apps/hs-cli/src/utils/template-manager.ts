import fs from 'fs-extra';
import path from 'path';
import * as ts from 'typescript';

/**
 * 模板特性配置接口
 */
export interface TemplateFeature {
  /** 特性名称 */
  name: string;
  /** 特性描述 */
  message: string;
  /** 是否默认选中该特性 */
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
    // 根据模板名称获取对应的特性
    if (templateName === 'vue3') {
      return this.getVue3Features();
    } else if (templateName === 'nuxt3') {
      return this.getNuxt3Features();
    }
    
    return [];
  }

  /**
   * 获取Vue3模板的特性
   */
  private getVue3Features(): TemplateFeature[] {
    return [
      {
        name: 'typescript',
        message: 'TypeScript',
        checked: true
      },
      {
        name: 'jsx',
        message: 'JSX 支持',
        checked: true
      },
      {
        name: 'router',
        message: 'Vue Router (单页面应用开发)',
        checked: true
      },
      {
        name: 'pinia',
        message: 'Pinia (状态管理)',
        checked: true
      },
      {
        name: 'unocss',
        message: 'UnoCSS (原子化CSS)',
        checked: true
      },
      {
        name: 'vitest',
        message: 'Vitest (单元测试)',
        checked: true
      },
      {
        name: 'auto-import',
        message: 'Auto Import (自动导入)',
        checked: true
      },
      {
        name: 'components',
        message: 'Components (组件自动注册)',
        checked: true
      }
    ];
  }

  /**
   * 获取Nuxt3模板的特性
   */
  private getNuxt3Features(): TemplateFeature[] {
    return [
      {
        name: 'typescript',
        message: 'TypeScript',
        checked: true
      },
      {
        name: 'unocss',
        message: 'UnoCSS (原子化CSS)',
        checked: true
      },
      {
        name: 'sass',
        message: 'Sass (CSS预处理器)',
        checked: true
      },
      {
        name: 'vueuse',
        message: 'VueUse (实用工具集)',
        checked: true
      },
      {
        name: 'nuxt-image',
        message: 'Nuxt Image (图像优化)',
        checked: true
      },
      {
        name: 'auto-import',
        message: 'Auto Import (自动导入)',
        checked: true
      },
      {
        name: 'components',
        message: 'Components (组件自动注册)',
        checked: true
      }
    ];
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
    const templateDir = path.join(this.templatesDir, templateName);
    
    // 确保模板目录存在
    if (!fs.existsSync(templateDir)) {
      throw new Error(`模板 ${templateName} 不存在`);
    }

    // 复制整个模板目录到目标目录
    await fs.copy(templateDir, targetDir);

    // 处理项目名称
    await this.processProjectName(targetDir, projectName);
    
    // 根据选择的特性处理项目文件
    await this.processFeatures(templateName, targetDir, features);
  }

  /**
   * 根据选择的特性处理项目文件
   * @param templateName 模板名称
   * @param targetDir 目标目录
   * @param features 选择的特性
   */
  private async processFeatures(
    templateName: string,
    targetDir: string,
    features: Record<string, boolean>
  ): Promise<void> {
    const pkgPath = path.join(targetDir, 'package.json');
    if (!await fs.pathExists(pkgPath)) {
      return;
    }

    const pkg = await fs.readJson(pkgPath);
    
    // 处理依赖项
    await this.processDependencies(templateName, targetDir, features, pkg);
    
    // 处理配置文件
    await this.processConfigFiles(templateName, targetDir, features);
  }

  /**
   * 处理依赖项
   * @param templateName 模板名称
   * @param targetDir 目标目录
   * @param features 选择的特性
   * @param pkg package.json内容
   */
  private async processDependencies(
    templateName: string,
    targetDir: string,
    features: Record<string, boolean>,
    pkg: any
  ): Promise<void> {
    const pkgPath = path.join(targetDir, 'package.json');
    
    // Vue3模板特性处理
    if (templateName === 'vue3') {
      // 如果不需要TypeScript，处理相关文件
      if (!features.typescript) {
        // 处理TypeScript相关文件
        await this.handleTypescriptFiles(targetDir);
      }
      
      // 如果不需要JSX支持，移除相关依赖
      if (!features.jsx) {
        delete pkg.devDependencies['@vitejs/plugin-vue-jsx'];
        // 同时修改vite.config.ts
        await this.removeJsxFromViteConfig(targetDir);
      }
      
      // 如果不需要Pinia，移除相关依赖
      if (!features.pinia) {
        delete pkg.dependencies['pinia'];
        // 同时移除stores目录
        const storesDir = path.join(targetDir, 'src/stores');
        if (await fs.pathExists(storesDir)) {
          await fs.remove(storesDir);
        }
        // 修改main.ts，移除pinia相关代码
        await this.removePiniaFromMainTs(targetDir);
      }
      
      // 如果不需要Vue Router，移除相关依赖
      if (!features.router) {
        delete pkg.dependencies['vue-router'];
        // 同时移除router目录和views目录
        const routerDir = path.join(targetDir, 'src/router');
        const viewsDir = path.join(targetDir, 'src/views');
        if (await fs.pathExists(routerDir)) {
          await fs.remove(routerDir);
        }
        if (await fs.pathExists(viewsDir)) {
          await fs.remove(viewsDir);
        }
        // 修改main.ts，移除router相关代码
        await this.removeRouterFromMainTs(targetDir);
      }
      
      // 如果不需要UnoCSS，移除相关依赖
      if (!features.unocss) {
        delete pkg.devDependencies['unocss'];
        // 同时移除uno.config.ts
        const unoConfigPath = path.join(targetDir, 'uno.config.ts');
        if (await fs.pathExists(unoConfigPath)) {
          await fs.remove(unoConfigPath);
        }
        // 修改vite.config.ts，移除UnoCSS相关代码
        await this.removeUnoFromViteConfig(targetDir);
        // 修改main.ts，移除UnoCSS相关导入
        await this.removeUnoFromMainTs(targetDir);
      }
      
      // 如果不需要Vitest，移除相关依赖
      if (!features.vitest) {
        delete pkg.devDependencies['vitest'];
        delete pkg.devDependencies['@vue/test-utils'];
        delete pkg.devDependencies['jsdom'];
        delete pkg.scripts['test:unit'];
        // 同时移除vitest.config.ts
        const vitestConfigPath = path.join(targetDir, 'vitest.config.ts');
        if (await fs.pathExists(vitestConfigPath)) {
          await fs.remove(vitestConfigPath);
        }
        // 移除tsconfig.vitest.json
        const tsVitestPath = path.join(targetDir, 'tsconfig.vitest.json');
        if (await fs.pathExists(tsVitestPath)) {
          await fs.remove(tsVitestPath);
        }
      }
      
      // 如果不需要Auto Import，移除相关依赖
      if (!features['auto-import']) {
        delete pkg.devDependencies['unplugin-auto-import'];
        // 修改vite.config.ts，移除Auto Import相关代码
        await this.removeAutoImportFromViteConfig(targetDir);
        // 移除auto-import.d.ts
        const autoImportDtsPath = path.join(targetDir, 'src/auto-import.d.ts');
        if (await fs.pathExists(autoImportDtsPath)) {
          await fs.remove(autoImportDtsPath);
        }
      }
      
      // 如果不需要Components，移除相关依赖
      if (!features.components) {
        delete pkg.devDependencies['unplugin-vue-components'];
        // 修改vite.config.ts，移除Components相关代码
        await this.removeComponentsFromViteConfig(targetDir);
        // 移除components.d.ts
        const componentsDtsPath = path.join(targetDir, 'components.d.ts');
        if (await fs.pathExists(componentsDtsPath)) {
          await fs.remove(componentsDtsPath);
        }
      }
    }
    
    // Nuxt3模板特性处理
    else if (templateName === 'nuxt3') {
      // 如果不需要TypeScript，处理相关文件
      if (!features.typescript) {
        // 处理TypeScript相关文件
        await this.handleTypescriptFiles(targetDir);
      }
      
      // 如果不需要UnoCSS，移除相关依赖
      if (!features.unocss) {
        delete pkg.devDependencies['unocss'];
        delete pkg.devDependencies['@unocss/nuxt'];
        // 同时移除uno.config.ts
        const unoConfigPath = path.join(targetDir, 'uno.config.ts');
        if (await fs.pathExists(unoConfigPath)) {
          await fs.remove(unoConfigPath);
        }
        // 修改nuxt.config.ts，移除UnoCSS相关代码
        await this.removeUnoFromNuxtConfig(targetDir);
      }
      
      // 如果不需要Sass，移除相关依赖
      if (!features.sass) {
        delete pkg.devDependencies['sass'];
      }
      
      // 如果不需要VueUse，移除相关依赖
      if (!features.vueuse) {
        delete pkg.devDependencies['@vueuse/core'];
        delete pkg.devDependencies['@vueuse/nuxt'];
        // 修改nuxt.config.ts，移除VueUse相关代码
        await this.removeVueUseFromNuxtConfig(targetDir);
      }
      
      // 如果不需要Nuxt Image，移除相关依赖
      if (!features['nuxt-image']) {
        delete pkg.dependencies['@nuxt/image'];
        // 修改nuxt.config.ts，移除Nuxt Image相关代码
        await this.removeNuxtImageFromNuxtConfig(targetDir);
      }
      
      // 如果不需要Auto Import，修改nuxt.config.ts
      if (!features['auto-import']) {
        delete pkg.devDependencies['unplugin-auto-import'];
        // 修改nuxt.config.ts，移除Auto Import相关代码
        await this.removeAutoImportFromNuxtConfig(targetDir);
      }
      
      // 如果不需要Components，修改nuxt.config.ts
      if (!features.components) {
        delete pkg.devDependencies['unplugin-vue-components'];
        // 修改nuxt.config.ts，移除Components相关代码
        await this.removeComponentsFromNuxtConfig(targetDir);
      }
    }
    
    // 保存修改后的package.json
    await fs.writeJson(pkgPath, pkg, { spaces: 2 });
  }

  /**
   * 处理配置文件
   * @param templateName 模板名称
   * @param targetDir 目标目录
   * @param features 选择的特性
   */
  private async processConfigFiles(
    templateName: string,
    targetDir: string,
    features: Record<string, boolean>
  ): Promise<void> {
    // 这里可以根据需要进一步处理配置文件
    // 目前大部分配置文件处理已经在processDependencies中完成
  }

  /**
   * 从Vite配置中移除JSX支持
   * @param targetDir 目标目录
   */
  private async removeJsxFromViteConfig(targetDir: string): Promise<void> {
    const viteConfigPath = path.join(targetDir, 'vite.config.ts');
    if (!await fs.pathExists(viteConfigPath)) {
      return;
    }

    let content = await fs.readFile(viteConfigPath, 'utf-8');
    
    // 移除import
    content = content.replace(/import vueJsx from ['"]@vitejs\/plugin-vue-jsx['"][\r\n]/g, '');
    
    // 移除插件配置
    content = content.replace(/vueJsx\(\),[\r\n]/g, '');
    
    await fs.writeFile(viteConfigPath, content);
  }

  /**
   * 从main.ts中移除Pinia相关代码
   * @param targetDir 目标目录
   */
  private async removePiniaFromMainTs(targetDir: string): Promise<void> {
    const mainTsPath = path.join(targetDir, 'src/main.ts');
    if (!await fs.pathExists(mainTsPath)) {
      return;
    }

    let content = await fs.readFile(mainTsPath, 'utf-8');
    
    // 移除import
    content = content.replace(/import { createPinia } from ['"]pinia['"][\r\n]/g, '');
    
    // 移除pinia使用
    content = content.replace(/app\.use\(createPinia\(\)\)[\r\n]/g, '');
    
    await fs.writeFile(mainTsPath, content);
  }

  /**
   * 从main.ts中移除Router相关代码
   * @param targetDir 目标目录
   */
  private async removeRouterFromMainTs(targetDir: string): Promise<void> {
    const mainTsPath = path.join(targetDir, 'src/main.ts');
    if (!await fs.pathExists(mainTsPath)) {
      return;
    }

    let content = await fs.readFile(mainTsPath, 'utf-8');
    
    // 移除import
    content = content.replace(/import router from ['"]\.\/router['"][\r\n]/g, '');
    
    // 移除router使用
    content = content.replace(/app\.use\(router\)[\r\n]/g, '');
    
    await fs.writeFile(mainTsPath, content);
  }

  /**
   * 从Vite配置中移除UnoCSS
   * @param targetDir 目标目录
   */
  private async removeUnoFromViteConfig(targetDir: string): Promise<void> {
    const viteConfigPath = path.join(targetDir, 'vite.config.ts');
    if (!await fs.pathExists(viteConfigPath)) {
      return;
    }

    let content = await fs.readFile(viteConfigPath, 'utf-8');
    
    // 移除import
    content = content.replace(/import UnoCSS from ['"]unocss\/vite['"][\r\n]/g, '');
    
    // 移除插件配置
    content = content.replace(/UnoCSS\(\),[\r\n]/g, '');
    
    await fs.writeFile(viteConfigPath, content);
  }

  /**
   * 从main.ts中移除UnoCSS相关导入
   * @param targetDir 目标目录
   */
  private async removeUnoFromMainTs(targetDir: string): Promise<void> {
    const mainTsPath = path.join(targetDir, 'src/main.ts');
    if (!await fs.pathExists(mainTsPath)) {
      return;
    }

    let content = await fs.readFile(mainTsPath, 'utf-8');
    
    // 移除import
    content = content.replace(/import ['"]uno\.css['"][\r\n]/g, '');
    content = content.replace(/import ['"]@unocss\/reset\/tailwind\.css['"][\r\n]/g, '');
    
    await fs.writeFile(mainTsPath, content);
  }

  /**
   * 从Vite配置中移除Auto Import
   * @param targetDir 目标目录
   */
  private async removeAutoImportFromViteConfig(targetDir: string): Promise<void> {
    const viteConfigPath = path.join(targetDir, 'vite.config.ts');
    if (!await fs.pathExists(viteConfigPath)) {
      return;
    }

    let content = await fs.readFile(viteConfigPath, 'utf-8');
    
    // 移除import
    content = content.replace(/import AutoImport from ['"]unplugin-auto-import\/vite['"][\r\n]/g, '');
    
    // 移除插件配置 (这是一个简化的实现，可能需要更复杂的正则表达式来匹配多行配置)
    content = content.replace(/AutoImport\(\{[\s\S]*?\}\),[\r\n]/g, '');
    
    await fs.writeFile(viteConfigPath, content);
  }

  /**
   * 从Vite配置中移除Components
   * @param targetDir 目标目录
   */
  private async removeComponentsFromViteConfig(targetDir: string): Promise<void> {
    const viteConfigPath = path.join(targetDir, 'vite.config.ts');
    if (!await fs.pathExists(viteConfigPath)) {
      return;
    }

    let content = await fs.readFile(viteConfigPath, 'utf-8');
    
    // 移除import
    content = content.replace(/import Components from ['"]unplugin-vue-components\/vite['"][\r\n]/g, '');
    
    // 移除插件配置
    content = content.replace(/Components\(\{[\s\S]*?\}\),[\r\n]/g, '');
    
    await fs.writeFile(viteConfigPath, content);
  }

  /**
   * 从Nuxt配置中移除UnoCSS
   * @param targetDir 目标目录
   */
  private async removeUnoFromNuxtConfig(targetDir: string): Promise<void> {
    const nuxtConfigPath = path.join(targetDir, 'nuxt.config.ts');
    if (!await fs.pathExists(nuxtConfigPath)) {
      return;
    }

    let content = await fs.readFile(nuxtConfigPath, 'utf-8');
    
    // 从modules数组中移除@unocss/nuxt
    content = content.replace(/['"]@unocss\/nuxt['"],?\s*/g, '');
    
    await fs.writeFile(nuxtConfigPath, content);
  }

  /**
   * 从Nuxt配置中移除VueUse
   * @param targetDir 目标目录
   */
  private async removeVueUseFromNuxtConfig(targetDir: string): Promise<void> {
    const nuxtConfigPath = path.join(targetDir, 'nuxt.config.ts');
    if (!await fs.pathExists(nuxtConfigPath)) {
      return;
    }

    let content = await fs.readFile(nuxtConfigPath, 'utf-8');
    
    // 从modules数组中移除@vueuse/nuxt
    content = content.replace(/['"]@vueuse\/nuxt['"],?\s*/g, '');
    
    await fs.writeFile(nuxtConfigPath, content);
  }

  /**
   * 从Nuxt配置中移除Nuxt Image
   * @param targetDir 目标目录
   */
  private async removeNuxtImageFromNuxtConfig(targetDir: string): Promise<void> {
    const nuxtConfigPath = path.join(targetDir, 'nuxt.config.ts');
    if (!await fs.pathExists(nuxtConfigPath)) {
      return;
    }

    let content = await fs.readFile(nuxtConfigPath, 'utf-8');
    
    // 从modules数组中移除@nuxt/image
    content = content.replace(/['"]@nuxt\/image['"],?\s*/g, '');
    
    await fs.writeFile(nuxtConfigPath, content);
  }

  /**
   * 从Nuxt配置中移除Auto Import
   * @param targetDir 目标目录
   */
  private async removeAutoImportFromNuxtConfig(targetDir: string): Promise<void> {
    const nuxtConfigPath = path.join(targetDir, 'nuxt.config.ts');
    if (!await fs.pathExists(nuxtConfigPath)) {
      return;
    }

    let content = await fs.readFile(nuxtConfigPath, 'utf-8');
    
    // 移除import
    content = content.replace(/import AutoImport from ['"]unplugin-auto-import\/vite['"][\r\n]/g, '');
    
    // 移除vite.plugins中的配置
    content = content.replace(/AutoImport\(\{[\s\S]*?\}\),[\r\n]/g, '');
    
    await fs.writeFile(nuxtConfigPath, content);
  }

  /**
   * 从Nuxt配置中移除Components
   * @param targetDir 目标目录
   */
  private async removeComponentsFromNuxtConfig(targetDir: string): Promise<void> {
    const nuxtConfigPath = path.join(targetDir, 'nuxt.config.ts');
    if (!await fs.pathExists(nuxtConfigPath)) {
      return;
    }

    let content = await fs.readFile(nuxtConfigPath, 'utf-8');
    
    // 移除import
    content = content.replace(/import Components from ['"]unplugin-vue-components\/vite['"][\r\n]/g, '');
    
    // 移除vite.plugins中的配置
    content = content.replace(/Components\(\{[\s\S]*?\}\),[\r\n]/g, '');
    
    await fs.writeFile(nuxtConfigPath, content);
  }

  /**
   * 处理项目名称
   * @param targetDir 目标目录
   * @param projectName 项目名称
   */
  private async processProjectName(targetDir: string, projectName: string): Promise<void> {
    const pkgPath = path.join(targetDir, 'package.json');
    if (!await fs.pathExists(pkgPath)) {
      return;
    }

    const pkg = await fs.readJson(pkgPath);
    pkg.name = projectName;
    await fs.writeJson(pkgPath, pkg, { spaces: 2 });

    // 处理HTML文件中的标题
    const indexHtmlPath = path.join(targetDir, 'index.html');
    if (await fs.pathExists(indexHtmlPath)) {
      let content = await fs.readFile(indexHtmlPath, 'utf-8');
      content = content.replace(/<title>.*?<\/title>/g, `<title>${projectName}</title>`);
      await fs.writeFile(indexHtmlPath, content);
    }

    // 处理README.md
    const readmePath = path.join(targetDir, 'README.md');
    if (await fs.pathExists(readmePath)) {
      let content = await fs.readFile(readmePath, 'utf-8');
      // 替换第一行的标题
      content = content.replace(/^#\s+.*$/m, `# ${projectName}`);
      await fs.writeFile(readmePath, content);
    }
  }

  /**
   * 获取模板的默认启动命令
   * @param templateName 模板名称
   * @returns 安装命令和启动命令
   */
  getTemplateCommands(templateName: string): { installCmd: string, startCmd: string } {
    const installCmd = 'npm install';
    let startCmd = 'npm run dev';
    
    return { installCmd, startCmd };
  }

  /**
   * 处理TypeScript相关文件
   * @param targetDir 目标目录
   */
  private async handleTypescriptFiles(targetDir: string): Promise<void> {
    // 1. 修改package.json，移除TypeScript相关依赖
    const pkgPath = path.join(targetDir, 'package.json');
    if (await fs.pathExists(pkgPath)) {
      const pkg = await fs.readJson(pkgPath);
      
      // 移除TypeScript相关依赖
      delete pkg.devDependencies['typescript'];
      delete pkg.devDependencies['vue-tsc'];
      
      // 修改scripts，将带有typescript的命令替换为js版本
      if (pkg.scripts) {
        if (pkg.scripts.type) {
          delete pkg.scripts.type;
        }
        
        if (pkg.scripts.build) {
          pkg.scripts.build = pkg.scripts.build.replace('vue-tsc', '');
        }
        
        // 替换其他可能包含ts的脚本
        Object.keys(pkg.scripts).forEach(key => {
          if (pkg.scripts[key].includes('.ts')) {
            pkg.scripts[key] = pkg.scripts[key].replace('.ts', '.js');
          }
        });
      }
      
      await fs.writeJson(pkgPath, pkg, { spaces: 2 });
    }
    
    // 2. 转换配置文件扩展名
    const configFiles = [
      'vite.config.ts',
      'uno.config.ts',
      'vitest.config.ts'
    ];
    
    for (const file of configFiles) {
      const tsPath = path.join(targetDir, file);
      if (await fs.pathExists(tsPath)) {
        const jsPath = tsPath.replace('.ts', '.js');
        const content = await fs.readFile(tsPath, 'utf-8');
        
        // 使用TypeScript编译器API转换代码
        const jsContent = this.transpileTsToJs(content);
        
        await fs.writeFile(jsPath, jsContent);
        await fs.remove(tsPath);
      }
    }
    
    // 3. 转换src目录下的ts文件
    await this.convertTsToJsInDir(path.join(targetDir, 'src'));
    
    // 4. 移除TypeScript配置文件
    const tsConfigFiles = [
      'tsconfig.json',
      'tsconfig.app.json',
      'tsconfig.node.json',
      'tsconfig.vitest.json',
      'env.d.ts'
    ];
    
    for (const file of tsConfigFiles) {
      const filePath = path.join(targetDir, file);
      if (await fs.pathExists(filePath)) {
        await fs.remove(filePath);
      }
    }
    
    // 5. 移除components.d.ts和auto-import.d.ts
    const dtsFiles = [
      'components.d.ts',
      path.join('src', 'auto-import.d.ts')
    ];
    
    for (const file of dtsFiles) {
      const filePath = path.join(targetDir, file);
      if (await fs.pathExists(filePath)) {
        await fs.remove(filePath);
      }
    }
  }
  
  /**
   * 递归转换目录下的所有.ts文件为.js文件
   * @param dirPath 目录路径
   */
  private async convertTsToJsInDir(dirPath: string): Promise<void> {
    if (!await fs.pathExists(dirPath)) {
      return;
    }
    
    const entries = await fs.readdir(dirPath, { withFileTypes: true });
    
    for (const entry of entries) {
      const fullPath = path.join(dirPath, entry.name);
      
      if (entry.isDirectory()) {
        // 递归处理子目录
        await this.convertTsToJsInDir(fullPath);
      } else if (entry.name.endsWith('.ts') && !entry.name.endsWith('.d.ts')) {
        // 处理.ts文件（排除.d.ts文件）
        const jsPath = fullPath.replace('.ts', '.js');
        const content = await fs.readFile(fullPath, 'utf-8');
        
        // 使用TypeScript编译器API转换代码
        const jsContent = this.transpileTsToJs(content);
        
        await fs.writeFile(jsPath, jsContent);
        await fs.remove(fullPath);
      }
    }
  }

  /**
   * 使用TypeScript编译器API将TypeScript代码转换为JavaScript代码
   * @param source TypeScript源代码
   * @returns 转换后的JavaScript代码
   */
  private transpileTsToJs(source: string): string {
    // 设置编译选项
    const compilerOptions: ts.CompilerOptions = {
      target: ts.ScriptTarget.ES2020,
      module: ts.ModuleKind.ESNext,
      moduleResolution: ts.ModuleResolutionKind.NodeJs,
      esModuleInterop: true,
      removeComments: false,
      strict: false,
      skipLibCheck: true
    };
    
    // 使用TypeScript编译器API转换代码
    const result = ts.transpileModule(source, {
      compilerOptions,
      reportDiagnostics: false
    });
    
    // 返回转换后的JavaScript代码
    return result.outputText;
  }

  /**
   * 移除TypeScript类型注解
   * @param content 文件内容
   * @returns 处理后的内容
   */
  private removeTypeAnnotations(content: string): string {
    // 使用TypeScript编译器API转换代码，替代原来的正则表达式方法
    return this.transpileTsToJs(content);
  }
} 