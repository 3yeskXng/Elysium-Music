// src/types/window.d.ts
// Window interface augmentation — declares global Tauri-injected APIs for TypeScript

export {};

declare global {
  interface Window {
    triggerElysiumLog: (level: string, module: string, message: string) => void;
  }
}
