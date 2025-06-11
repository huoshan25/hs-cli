import { Command } from 'commander';
import inquirer from 'inquirer';
import chalk from 'chalk';
import path from 'path';
import fs from 'fs-extra';
import { formatLog, validateName, camelToKebab } from '@huo-shan/utils';

type ComponentType = 'component' | 'page' | 'service' | 'hook';

export function generateCommand(program: Command): void {
  program
    .command('generate')
    .alias('g')
    .description('生成代码文件')
    .argument('<type>', '生成的类型 (component, page, service, hook)')
    .argument('<name>', '名称')
    .option('-d, --dir <directory>', '目标目录', '')
    .action(async (type, name, options) => {
      try {
        // 验证名称
        if (!validateName(name)) {
          console.log(chalk.red('错误：名称只能包含字母、数字、下划线和短横线'));
          return;
        }

        // 验证类型
        const validTypes: ComponentType[] = ['component', 'page', 'service', 'hook'];
        if (!validTypes.includes(type as ComponentType)) {
          console.log(chalk.red(`错误：类型必须是 ${validTypes.join(', ')} 之一`));
          return;
        }

        // 确定目标目录
        let targetDir = process.cwd();
        if (options.dir) {
          targetDir = path.resolve(process.cwd(), options.dir);
          if (!fs.existsSync(targetDir)) {
            await fs.mkdirp(targetDir);
          }
        }

        // 根据类型生成不同的文件
        switch (type) {
          case 'component':
            await generateComponent(name, targetDir);
            break;
          case 'page':
            await generatePage(name, targetDir);
            break;
          case 'service':
            await generateService(name, targetDir);
            break;
          case 'hook':
            await generateHook(name, targetDir);
            break;
        }

        console.log(chalk.green(`成功生成 ${type} ${name}`));
      } catch (error: any) {
        console.error(chalk.red(formatLog(`生成代码失败：${error.message}`, 'error')));
        process.exit(1);
      }
    });
}

// 生成组件
async function generateComponent(name: string, targetDir: string): Promise<void> {
  const componentName = name;
  const fileName = camelToKebab(name);
  const dirPath = path.join(targetDir, fileName);
  
  await fs.mkdirp(dirPath);
  
  // 创建组件文件
  const componentContent = `import React from 'react';
import './${fileName}.css';

interface ${componentName}Props {
  // props类型定义
}

export const ${componentName}: React.FC<${componentName}Props> = (props) => {
  return (
    <div className="${fileName}">
      <h2>${componentName} Component</h2>
    </div>
  );
};

export default ${componentName};
`;

  // 创建样式文件
  const styleContent = `.${fileName} {
  /* 样式定义 */
}
`;

  // 创建索引文件
  const indexContent = `export * from './${fileName}';
export { default } from './${fileName}';
`;

  await fs.writeFile(path.join(dirPath, `${fileName}.tsx`), componentContent);
  await fs.writeFile(path.join(dirPath, `${fileName}.css`), styleContent);
  await fs.writeFile(path.join(dirPath, 'index.ts'), indexContent);
}

// 生成页面
async function generatePage(name: string, targetDir: string): Promise<void> {
  const pageName = name;
  const fileName = camelToKebab(name);
  const dirPath = path.join(targetDir, fileName);
  
  await fs.mkdirp(dirPath);
  
  // 创建页面文件
  const pageContent = `import React from 'react';
import './${fileName}.css';

export const ${pageName}Page: React.FC = () => {
  return (
    <div className="${fileName}-page">
      <h1>${pageName} Page</h1>
    </div>
  );
};

export default ${pageName}Page;
`;

  // 创建样式文件
  const styleContent = `.${fileName}-page {
  /* 样式定义 */
}
`;

  // 创建索引文件
  const indexContent = `export * from './${fileName}';
export { default } from './${fileName}';
`;

  await fs.writeFile(path.join(dirPath, `${fileName}.tsx`), pageContent);
  await fs.writeFile(path.join(dirPath, `${fileName}.css`), styleContent);
  await fs.writeFile(path.join(dirPath, 'index.ts'), indexContent);
}

// 生成服务
async function generateService(name: string, targetDir: string): Promise<void> {
  const serviceName = name;
  const fileName = camelToKebab(name);
  
  // 创建服务文件
  const serviceContent = `// ${serviceName} Service
export interface ${serviceName}Data {
  // 数据类型定义
  id: string;
  name: string;
}

export class ${serviceName}Service {
  async getAll(): Promise<${serviceName}Data[]> {
    // 实现获取所有数据的逻辑
    return [];
  }
  
  async getById(id: string): Promise<${serviceName}Data | null> {
    // 实现根据ID获取数据的逻辑
    return null;
  }
  
  async create(data: Omit<${serviceName}Data, 'id'>): Promise<${serviceName}Data> {
    // 实现创建数据的逻辑
    return { id: '1', ...data };
  }
  
  async update(id: string, data: Partial<${serviceName}Data>): Promise<${serviceName}Data | null> {
    // 实现更新数据的逻辑
    return null;
  }
  
  async delete(id: string): Promise<boolean> {
    // 实现删除数据的逻辑
    return true;
  }
}

export default new ${serviceName}Service();
`;

  await fs.writeFile(path.join(targetDir, `${fileName}.service.ts`), serviceContent);
}

// 生成Hook
async function generateHook(name: string, targetDir: string): Promise<void> {
  if (!name.startsWith('use')) {
    name = `use${name.charAt(0).toUpperCase()}${name.slice(1)}`;
  }
  
  const hookName = name;
  const fileName = camelToKebab(name);
  
  // 创建Hook文件
  const hookContent = `import { useState, useEffect } from 'react';

export function ${hookName}<T>(initialState: T) {
  const [data, setData] = useState<T>(initialState);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<Error | null>(null);

  // Hook的具体实现
  
  return {
    data,
    loading,
    error,
    setData
  };
}

export default ${hookName};
`;

  await fs.writeFile(path.join(targetDir, `${fileName}.ts`), hookContent);
} 