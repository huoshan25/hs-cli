import fs from 'fs-extra';
import * as ts from 'typescript';

/**
 * 代码修改工具类
 * 使用 AST 方式进行代码修改
 */
export class CodeModifier {
  /**
   * 从文件中移除指定的 import 语句
   * @param filePath 文件路径
   * @param moduleSpecifier 模块名称，如 'pinia' 或 '@vitejs/plugin-vue-jsx'
   */
  static async removeImport(filePath: string, moduleSpecifier: string): Promise<void> {
    if (!await fs.pathExists(filePath)) {
      return;
    }

    const content = await fs.readFile(filePath, 'utf-8');
    const sourceFile = ts.createSourceFile(
      filePath,
      content,
      ts.ScriptTarget.Latest,
      true
    );

    const printer = ts.createPrinter({ newLine: ts.NewLineKind.LineFeed });
    const importToRemove: ts.Node[] = [];

    // 查找需要移除的 import 语句
    ts.forEachChild(sourceFile, (node) => {
      if (ts.isImportDeclaration(node)) {
        const moduleSpec = node.moduleSpecifier;
        if (ts.isStringLiteral(moduleSpec) && moduleSpec.text === moduleSpecifier) {
          importToRemove.push(node);
        }
      }
    });

    if (importToRemove.length === 0) {
      return;
    }

    // 移除 import 语句
    let newContent = content;
    for (const node of importToRemove) {
      const start = node.getStart(sourceFile);
      const end = node.getEnd();
      // 包括换行符
      const fullText = content.substring(start, end);
      const nextChar = content[end];
      const textToRemove = nextChar === '\n' ? fullText + '\n' : fullText;
      newContent = newContent.replace(textToRemove, '');
    }

    await fs.writeFile(filePath, newContent);
  }

  /**
   * 从文件中移除指定的函数调用
   * @param filePath 文件路径
   * @param functionName 函数名称，如 'app.use'
   * @param argumentPattern 参数模式，用于匹配特定的调用，如 'createPinia'
   */
  static async removeFunctionCall(
    filePath: string,
    functionName: string,
    argumentPattern?: string
  ): Promise<void> {
    if (!await fs.pathExists(filePath)) {
      return;
    }

    let content = await fs.readFile(filePath, 'utf-8');
    const sourceFile = ts.createSourceFile(
      filePath,
      content,
      ts.ScriptTarget.Latest,
      true
    );

    const callsToRemove: ts.Node[] = [];

    // 递归查找函数调用
    function visit(node: ts.Node) {
      if (ts.isCallExpression(node)) {
        const expression = node.expression;
        let matches = false;

        // 检查是否匹配函数名
        if (ts.isPropertyAccessExpression(expression)) {
          const fullName = expression.expression.getText(sourceFile) + '.' + expression.name.text;
          matches = fullName === functionName;
        } else if (ts.isIdentifier(expression)) {
          matches = expression.text === functionName;
        }

        // 如果提供了参数模式，还需要检查参数
        if (matches && argumentPattern) {
          const args = node.arguments;
          if (args.length > 0) {
            const firstArg = args[0].getText(sourceFile);
            matches = firstArg.includes(argumentPattern);
          } else {
            matches = false;
          }
        }

        if (matches) {
          // 找到父语句节点（通常是 ExpressionStatement）
          let parent = node.parent;
          while (parent && !ts.isExpressionStatement(parent) && !ts.isSourceFile(parent)) {
            parent = parent.parent;
          }
          if (parent && ts.isExpressionStatement(parent)) {
            callsToRemove.push(parent);
          }
        }
      }

      ts.forEachChild(node, visit);
    }

    visit(sourceFile);

    if (callsToRemove.length === 0) {
      return;
    }

    // 移除函数调用
    for (const node of callsToRemove) {
      const start = node.getStart(sourceFile);
      const end = node.getEnd();
      const fullText = content.substring(start, end);
      // 包括换行符
      const nextChar = content[end];
      const textToRemove = nextChar === '\n' ? fullText + '\n' : fullText;
      content = content.replace(textToRemove, '');
    }

    await fs.writeFile(filePath, content);
  }

  /**
   * 从 Vite 配置的 plugins 数组中移除指定插件
   * @param filePath Vite 配置文件路径
   * @param pluginName 插件名称，如 'vueJsx' 或 'UnoCSS'
   */
  static async removeVitePlugin(filePath: string, pluginName: string): Promise<void> {
    if (!await fs.pathExists(filePath)) {
      return;
    }

    let content = await fs.readFile(filePath, 'utf-8');

    // 使用正则表达式移除插件调用
    // 匹配 pluginName() 或 pluginName({...})，包括可能的换行和空格
    const pluginRegex = new RegExp(
      `\\s*${pluginName}\\s*\\([^)]*\\)\\s*,?\\s*\\n?`,
      'g'
    );
    
    content = content.replace(pluginRegex, '');

    // 清理可能的多余逗号和空行
    content = content.replace(/,(\s*,)+/g, ','); // 多个逗号
    content = content.replace(/,(\s*)\]/g, '$1]'); // 数组末尾的逗号
    content = content.replace(/\n\s*\n\s*\n/g, '\n\n'); // 多个空行

    await fs.writeFile(filePath, content);
  }

  /**
   * 从文件中移除所有匹配指定模式的导入
   * @param filePath 文件路径
   * @param importNames 要移除的导入名称数组
   */
  static async removeImportsByNames(filePath: string, importNames: string[]): Promise<void> {
    if (!await fs.pathExists(filePath)) {
      return;
    }

    let content = await fs.readFile(filePath, 'utf-8');

    for (const name of importNames) {
      // 移除 import xxx from 'xxx'
      const importRegex1 = new RegExp(`import\\s+${name}\\s+from\\s+['"][^'"]+['"]\\s*;?\\s*\\n?`, 'g');
      content = content.replace(importRegex1, '');

      // 移除 import { xxx } from 'xxx'
      const importRegex2 = new RegExp(`import\\s+\\{[^}]*\\b${name}\\b[^}]*\\}\\s+from\\s+['"][^'"]+['"]\\s*;?\\s*\\n?`, 'g');
      content = content.replace(importRegex2, '');

      // 移除 import 'xxx'
      const importRegex3 = new RegExp(`import\\s+['"]${name}['"]\\s*;?\\s*\\n?`, 'g');
      content = content.replace(importRegex3, '');
    }

    // 清理多余的空行
    content = content.replace(/\n\s*\n\s*\n/g, '\n\n');

    await fs.writeFile(filePath, content);
  }

  /**
   * 检查文件中是否包含指定的 import
   * @param filePath 文件路径
   * @param moduleSpecifier 模块名称
   * @returns 是否包含该 import
   */
  static async hasImport(filePath: string, moduleSpecifier: string): Promise<boolean> {
    if (!await fs.pathExists(filePath)) {
      return false;
    }

    const content = await fs.readFile(filePath, 'utf-8');
    const sourceFile = ts.createSourceFile(
      filePath,
      content,
      ts.ScriptTarget.Latest,
      true
    );

    let found = false;
    ts.forEachChild(sourceFile, (node) => {
      if (ts.isImportDeclaration(node)) {
        const moduleSpec = node.moduleSpecifier;
        if (ts.isStringLiteral(moduleSpec) && moduleSpec.text === moduleSpecifier) {
          found = true;
        }
      }
    });

    return found;
  }

  /**
   * 从 package.json 中移除依赖
   * @param pkgPath package.json 文件路径
   * @param dependencies 要移除的依赖名称数组
   * @param section 依赖类型：'dependencies' 或 'devDependencies'
   */
  static async removeDependencies(
    pkgPath: string,
    dependencies: string[],
    section: 'dependencies' | 'devDependencies' = 'dependencies'
  ): Promise<void> {
    if (!await fs.pathExists(pkgPath)) {
      return;
    }

    const pkg = await fs.readJson(pkgPath);

    if (pkg[section]) {
      for (const dep of dependencies) {
        delete pkg[section][dep];
      }
    }

    await fs.writeJson(pkgPath, pkg, { spaces: 2 });
  }

  /**
   * 从 package.json 中移除脚本命令
   * @param pkgPath package.json 文件路径
   * @param scripts 要移除的脚本名称数组
   */
  static async removeScripts(pkgPath: string, scripts: string[]): Promise<void> {
    if (!await fs.pathExists(pkgPath)) {
      return;
    }

    const pkg = await fs.readJson(pkgPath);

    if (pkg.scripts) {
      for (const script of scripts) {
        delete pkg.scripts[script];
      }
    }

    await fs.writeJson(pkgPath, pkg, { spaces: 2 });
  }
}

