import path from 'path';
import { TemplateHandler } from './template-interface';
import { Vue3TemplateHandler } from './templates/vue3-template-handler';
import { Nuxt3TemplateHandler } from './templates/nuxt3-template-handler';

/**
 * 模板工厂类
 * 负责创建和返回正确的模板处理器
 */
export class TemplateFactory {
  private templatesDir: string;
  private handlers: Map<string, TemplateHandler>;

  constructor(templatesDir: string) {
    this.templatesDir = templatesDir;
    this.handlers = new Map();
    this.registerHandlers();
  }

  /**
   * 注册所有模板处理器
   */
  private registerHandlers(): void {
    // 注册Vue3模板处理器
    this.handlers.set('vue3', new Vue3TemplateHandler(this.templatesDir));
    
    // 注册Nuxt3模板处理器
    this.handlers.set('nuxt3', new Nuxt3TemplateHandler(this.templatesDir));
    
  }

  /**
   * 获取所有可用的模板名称
   */
  getAvailableTemplates(): string[] {
    return Array.from(this.handlers.keys());
  }

  /**
   * 获取指定模板的处理器
   * @param templateName 模板名称
   */
  getHandler(templateName: string): TemplateHandler | undefined {
    return this.handlers.get(templateName);
  }
} 