export function formatLog(message: string, type: 'info' | 'error' | 'success' = 'info'): string {
  const date = new Date().toISOString();
  const prefix = `[${date}] [${type.toUpperCase()}]`;
  return `${prefix} ${message}`;
}

export function validateName(name: string): boolean {
  return /^[a-zA-Z0-9_-]+$/.test(name);
}

export function camelToKebab(str: string): string {
  return str.replace(/([a-z0-9])([A-Z])/g, '$1-$2').toLowerCase();
}
