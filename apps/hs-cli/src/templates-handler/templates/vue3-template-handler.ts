import fs from 'fs-extra';
import path from 'path';
import { BaseTemplateHandler } from '../base-template-handler';
import { TemplateFeature } from '../types';

/**
 * Vue3模板处理器
 */
export class Vue3TemplateHandler extends BaseTemplateHandler {
  constructor(templatesDir: string) {
    super(templatesDir, 'vue3');
  }

  /**
   * 获取Vue3模板的特性
   */
  getFeatures(): TemplateFeature[] {
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
   * 处理Vue3模板特性
   * @param targetDir 目标目录
   * @param features 选择的特性
   */
  protected async processFeatures(targetDir: string, features: Record<string, boolean>): Promise<void> {
    const pkgPath = path.join(targetDir, 'package.json');
    if (!await fs.pathExists(pkgPath)) {
      return;
    }

    const pkg = await fs.readJson(pkgPath);

    // 如果不需要TypeScript，处理相关文件
    if (!features.typescript) {
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

    // 保存修改后的package.json
    await fs.writeJson(pkgPath, pkg, { spaces: 2 });
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
    
    // 移除插件配置
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
   * 转换Vue3特定的配置文件扩展名
   * @param targetDir 目标目录
   */
  protected async convertConfigFiles(targetDir: string): Promise<void> {
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
  }
}