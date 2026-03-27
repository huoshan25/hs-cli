export const BOOT_STAGE_EVENT = 'hs-console-boot-stage';
export const BOOT_ERROR_EVENT = 'hs-console-boot-error';
export const BOOT_READY_EVENT = 'hs-console-boot-ready';

export function reportBootStage(text: string): void {
  if (typeof window === 'undefined') return;
  window.dispatchEvent(new CustomEvent<string>(BOOT_STAGE_EVENT, { detail: text }));
}

export function reportBootError(text: string): void {
  if (typeof window === 'undefined') return;
  window.dispatchEvent(new CustomEvent<string>(BOOT_ERROR_EVENT, { detail: text }));
}

export function reportBootReady(): void {
  if (typeof window === 'undefined') return;
  window.dispatchEvent(new Event(BOOT_READY_EVENT));
}
