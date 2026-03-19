import fs from 'fs-extra';
import path from 'path';
import { BaseTemplateHandler } from '../base-template-handler';
import { TemplateFeature } from '../types';

/**
 * Nuxt3模板处理器
 */
export class Nuxt3TemplateHandler extends BaseTemplateHandler {
  constructor(templatesDir: string) {
    super(templatesDir, 'nuxt3');
  }

  /**
   * 获取Nuxt3模板的特性
   */
  getFeatures(): TemplateFeature[] {
    return [
      {
        name: 'typescript',
        message: 'TypeScript',
        checked: true
      },
      {
        name: 'unocss',
        message: 'UnoCSS',
        checked: true
      },
      {
        name: 'sass',
        message: 'Sass',
        checked: true
      },
      {
        name: 'vueuse',
        message: 'VueUse',
        checked: true
      },
      {
        name: 'nuxt-image',
        message: 'Nuxt Image',
        checked: true
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
   * 处理Nuxt3模板特性
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
      // 处理TypeScript相关文件
      await this.handleTypescriptFiles(targetDir);
      
      // Nuxt3特殊处理：保留某些TypeScript依赖以避免运行时错误
      // 因为Nuxt3内部依赖TypeScript，即使用户选择不使用TypeScript
      if (!pkg.devDependencies) {
        pkg.devDependencies = {};
      }
      
      // 确保这些依赖存在，以避免运行时错误
      pkg.devDependencies['typescript'] = '^5.0.0';
      pkg.devDependencies['vue-tsc'] = '^1.0.0';
      
      await this.disableTypeCheckInNuxtConfig(targetDir);
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

    // 保存修改后的package.json
    await fs.writeJson(pkgPath, pkg, { spaces: 2 });
  }

  /**
   * 在Nuxt配置中禁用TypeScript检查
   * @param targetDir 目标目录
   */
  private async disableTypeCheckInNuxtConfig(targetDir: string): Promise<void> {
    // 检查nuxt.config.ts或nuxt.config.js是否存在
    let nuxtConfigPath = path.join(targetDir, 'nuxt.config.ts');
    let isTs = true;
    
    if (!await fs.pathExists(nuxtConfigPath)) {
      nuxtConfigPath = path.join(targetDir, 'nuxt.config.js');
      isTs = false;
      
      if (!await fs.pathExists(nuxtConfigPath)) {
        return; // 如果配置文件不存在，直接返回
      }
    }
    
    // 读取配置文件
    let content = await fs.readFile(nuxtConfigPath, 'utf-8');
    
    // 添加TypeScript检查禁用配置
    if (content.includes('export default defineNuxtConfig(')) {
      // 如果已经有配置对象，在其中添加typeCheck: false
      content = content.replace(
        'export default defineNuxtConfig({',
        'export default defineNuxtConfig({\n  typescript: { typeCheck: false },\n'
      );
    } else {
      // 如果没有找到配置对象，尝试在文件末尾添加
      content += `\n\n// 禁用TypeScript检查以提高开发性能\nexport default defineNuxtConfig({\n  typescript: { typeCheck: false }\n});\n`;
    }
    
    // 写回文件
    await fs.writeFile(nuxtConfigPath, content);
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
   * 转换Nuxt3特定的配置文件扩展名
   * @param targetDir 目标目录
   */
  protected async convertConfigFiles(targetDir: string): Promise<void> {
    const configFiles = [
      'nuxt.config.ts',
      'uno.config.ts'
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

  /**
   * 重写移除TypeScript配置文件方法，处理Nuxt3特定的配置
   * @param targetDir 目标目录
   */
  protected async removeTypeScriptConfigFiles(targetDir: string): Promise<void> {
    // Nuxt3只有一个tsconfig.json
    const tsConfigFiles = [
      'tsconfig.json'
    ];

    for (const file of tsConfigFiles) {
      const filePath = path.join(targetDir, file);
      if (await fs.pathExists(filePath)) {
        await fs.remove(filePath);
      }
    }
  }
}
