// src/types/window.d.ts
// Window interface augmentation — declares global Tauri-injected APIs for TypeScript

export {};

interface TauriDialog {
  save: (options?: Record<string, unknown>) => Promise<string | null>;
}

interface TauriInstance {
  dialog: TauriDialog;
}

declare global {
  interface Window {
    triggerElysiumLog: (level: string, module: string, message: string) => void;
    __TAURI__?: TauriInstance;
    __TAURI_INTERNALS__?: { invoke: (cmd: string, args?: Record<string, unknown>) => Promise<unknown> };
  }
}
