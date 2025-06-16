import { TemplateFeature } from './types';

/**
 * 模板处理器接口
 * 定义所有模板必须实现的方法
 */
export interface TemplateHandler {
  /**
   * 获取模板名称
   */
  getName(): string;
  
  /**
   * 获取模板特性选项
   */
  getFeatures(): TemplateFeature[];
  
  /**
   * 处理模板
   * @param targetDir 目标目录
   * @param features 选择的特性
   * @param projectName 项目名称
   */
  processTemplate(targetDir: string, features: Record<string, boolean>, projectName: string): Promise<void>;
  
  /**
   * 获取模板的启动命令
   */
  getCommands(): { installCmd: string, startCmd: string };
} 