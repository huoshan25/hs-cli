import fs from 'fs-extra';
import path from 'path';
import * as ts from 'typescript';
import { TemplateHandler } from './template-interface';
import { TemplateFeature } from './types';

/**
 * 基础模板处理器抽象类
 * 实现一些通用方法，特定模板可以继承此类
 */
export abstract class BaseTemplateHandler implements TemplateHandler {
  protected templatesDir: string;
  protected templateName: string;

  constructor(templatesDir: string, templateName: string) {
    this.templatesDir = templatesDir;
    this.templateName = templateName;
  }

  /**
   * 获取模板名称
   */
  getName(): string {
    return this.templateName;
  }

  /**
   * 获取模板特性选项
   * 子类必须实现此方法
   */
  abstract getFeatures(): TemplateFeature[];

  /**
   * 处理模板
   * @param targetDir 目标目录
   * @param features 选择的特性
   * @param projectName 项目名称
   */
  async processTemplate(targetDir: string, features: Record<string, boolean>, projectName: string): Promise<void> {
    const templateDir = path.join(this.templatesDir, this.templateName);

    // 确保模板目录存在
    if (!fs.existsSync(templateDir)) {
      throw new Error(`模板 ${this.templateName} 不存在`);
    }

    // 验证特性依赖关系
    const validatedFeatures = this.validateFeatureDependencies(features);

    // 复制整个模板目录到目标目录
    await fs.copy(templateDir, targetDir);

    // 处理项目名称
    await this.processProjectName(targetDir, projectName);

    // 处理特性
    await this.processFeatures(targetDir, validatedFeatures);
  }

  /**
   * 验证特性依赖关系
   * @param features 用户选择的特性
   * @returns 验证后的特性配置
   */
  protected validateFeatureDependencies(features: Record<string, boolean>): Record<string, boolean> {
    // TODO: 直接返回用户选择的特性
    return { ...features };
  }

  /**
   * 处理项目名称
   * @param targetDir 目标目录
   * @param projectName 项目名称
   */
  protected async processProjectName(targetDir: string, projectName: string): Promise<void> {
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
   * 处理特性
   * 子类必须实现此方法
   * @param targetDir 目标目录
   * @param features 选择的特性
   */
  protected abstract processFeatures(targetDir: string, features: Record<string, boolean>): Promise<void>;

  /**
   * 获取模板的启动命令
   */
  getCommands(): { installCmd: string, startCmd: string } {
    return {
      installCmd: 'npm install',
      startCmd: 'npm run dev'
    };
  }

  /**
   * 处理TypeScript相关文件
   * @param targetDir 目标目录
   */
  protected async handleTypescriptFiles(targetDir: string): Promise<void> {
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
    
    // 2. 转换配置文件扩展名 - 由子类实现
    await this.convertConfigFiles(targetDir);
    
    // 3. 转换src目录下的ts文件
    await this.convertTsToJsInDir(path.join(targetDir, 'src'));
    
    // 4. 移除TypeScript配置文件
    await this.removeTypeScriptConfigFiles(targetDir);
    
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
  protected async convertTsToJsInDir(dirPath: string): Promise<void> {
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
  protected transpileTsToJs(source: string): string {
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
   * 转换配置文件扩展名
   * 子类应该重写此方法以处理特定模板的配置文件
   * @param targetDir 目标目录
   */
  protected async convertConfigFiles(targetDir: string): Promise<void> {
    // 基类提供空实现，由子类重写
  }

  /**
   * 移除TypeScript配置文件
   * 子类可以重写此方法以处理特定模板的TypeScript配置文件
   * @param targetDir 目标目录
   */
  protected async removeTypeScriptConfigFiles(targetDir: string): Promise<void> {
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
  }
}
