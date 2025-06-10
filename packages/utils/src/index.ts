/**
 * 格式化日志输出
 */
export function formatLog(message: string, type: 'info' | 'error' | 'success' = 'info'): string {
  const date = new Date().toISOString();
  const prefix = `[${date}] [${type.toUpperCase()}]`;
  return `${prefix} ${message}`;
}

/**
 * 验证字符串是否符合命名规范（仅允许字母、数字、-和_）
 */
export function validateName(name: string): boolean {
  return /^[a-zA-Z0-9_-]+$/.test(name);
}

/**
 * 转换驼峰命名为短横线命名
 */
export function camelToKebab(str: string): string {
  return str.replace(/([a-z0-9])([A-Z])/g, '$1-$2').toLowerCase();
}

/**
 * 转换短横线命名为驼峰命名
 */
export function kebabToCamel(str: string): string {
  return str.replace(/-([a-z])/g, (_, letter) => letter.toUpperCase());
} 