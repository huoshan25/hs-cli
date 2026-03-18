import fs from 'fs-extra';
import path from 'path';
import { BaseTemplateHandler } from '../base-template-handler';
import { TemplateFeature } from '../types';
import { CodeModifier } from '../code-modifier';

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
        message: 'JSX',
        checked: false
      },
      {
        name: 'router',
        message: 'Vue Router',
        checked: false
      },
      {
        name: 'pinia',
        message: 'Pinia',
        checked: false
      },
      {
        name: 'unocss',
        message: 'UnoCSS',
        checked: false
      },
      {
        name: 'vitest',
        message: 'Vitest',
        checked: false
      },
      {
        name: 'auto-import',
        message: 'Auto Import',
        checked: true
      },
      {
        name: 'components',
        message: 'Components',
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

    // 如果不需要TypeScript，处理相关文件
    if (!features.typescript) {
      await this.handleTypescriptFiles(targetDir);
    }

    // 如果不需要JSX支持，移除相关依赖
    if (!features.jsx) {
      await CodeModifier.removeDependencies(pkgPath, ['@vitejs/plugin-vue-jsx'], 'devDependencies');
      await this.removeJsxFromViteConfig(targetDir);
    }

    // 如果不需要Pinia，移除相关依赖
    if (!features.pinia) {
      await CodeModifier.removeDependencies(pkgPath, ['pinia'], 'dependencies');
      // 移除stores目录
      const storesDir = path.join(targetDir, 'src/stores');
      if (await fs.pathExists(storesDir)) {
        await fs.remove(storesDir);
      }
      // 修改main.ts，移除pinia相关代码
      await this.removePiniaFromMainTs(targetDir);
    }

    // 如果不需要Vue Router，移除相关依赖
    if (!features.router) {
      await CodeModifier.removeDependencies(pkgPath, ['vue-router'], 'dependencies');
      // 移除router目录和views目录
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
      await CodeModifier.removeDependencies(pkgPath, ['unocss'], 'devDependencies');
      // 移除uno.config.ts
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
      await CodeModifier.removeDependencies(
        pkgPath,
        ['vitest', '@vue/test-utils', 'jsdom'],
        'devDependencies'
      );
      await CodeModifier.removeScripts(pkgPath, ['test:unit']);
      // 移除vitest.config.ts
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
      await CodeModifier.removeDependencies(pkgPath, ['unplugin-auto-import'], 'devDependencies');
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
      await CodeModifier.removeDependencies(pkgPath, ['unplugin-vue-components'], 'devDependencies');
      // 修改vite.config.ts，移除Components相关代码
      await this.removeComponentsFromViteConfig(targetDir);
      // 移除components.d.ts
      const componentsDtsPath = path.join(targetDir, 'components.d.ts');
      if (await fs.pathExists(componentsDtsPath)) {
        await fs.remove(componentsDtsPath);
      }
    }
  }

  /**
   * 从Vite配置中移除JSX支持
   * @param targetDir 目标目录
   */
  private async removeJsxFromViteConfig(targetDir: string): Promise<void> {
    const viteConfigPath = path.join(targetDir, 'vite.config.ts');
    await CodeModifier.removeImport(viteConfigPath, '@vitejs/plugin-vue-jsx');
    await CodeModifier.removeVitePlugin(viteConfigPath, 'vueJsx');
  }

  /**
   * 从main.ts中移除Pinia相关代码
   * @param targetDir 目标目录
   */
  private async removePiniaFromMainTs(targetDir: string): Promise<void> {
    const mainTsPath = path.join(targetDir, 'src/main.ts');
    await CodeModifier.removeImport(mainTsPath, 'pinia');
    await CodeModifier.removeFunctionCall(mainTsPath, 'app.use', 'createPinia');
  }

  /**
   * 从main.ts中移除Router相关代码
   * @param targetDir 目标目录
   */
  private async removeRouterFromMainTs(targetDir: string): Promise<void> {
    const mainTsPath = path.join(targetDir, 'src/main.ts');
    await CodeModifier.removeImportsByNames(mainTsPath, ['router']);
    await CodeModifier.removeFunctionCall(mainTsPath, 'app.use', 'router');
  }

  /**
   * 从Vite配置中移除UnoCSS
   * @param targetDir 目标目录
   */
  private async removeUnoFromViteConfig(targetDir: string): Promise<void> {
    const viteConfigPath = path.join(targetDir, 'vite.config.ts');
    await CodeModifier.removeImport(viteConfigPath, 'unocss/vite');
    await CodeModifier.removeVitePlugin(viteConfigPath, 'UnoCSS');
  }

  /**
   * 从main.ts中移除UnoCSS相关导入
   * @param targetDir 目标目录
   */
  private async removeUnoFromMainTs(targetDir: string): Promise<void> {
    const mainTsPath = path.join(targetDir, 'src/main.ts');
    await CodeModifier.removeImportsByNames(mainTsPath, ['uno.css', '@unocss/reset/tailwind.css']);
  }

  /**
   * 从Vite配置中移除Auto Import
   * @param targetDir 目标目录
   */
  private async removeAutoImportFromViteConfig(targetDir: string): Promise<void> {
    const viteConfigPath = path.join(targetDir, 'vite.config.ts');
    await CodeModifier.removeImport(viteConfigPath, 'unplugin-auto-import/vite');
    await CodeModifier.removeVitePlugin(viteConfigPath, 'AutoImport');
  }

  /**
   * 从Vite配置中移除Components
   * @param targetDir 目标目录
   */
  private async removeComponentsFromViteConfig(targetDir: string): Promise<void> {
    const viteConfigPath = path.join(targetDir, 'vite.config.ts');
    await CodeModifier.removeImport(viteConfigPath, 'unplugin-vue-components/vite');
    await CodeModifier.removeVitePlugin(viteConfigPath, 'Components');
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