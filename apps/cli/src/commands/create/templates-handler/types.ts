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