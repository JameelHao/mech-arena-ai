/// <reference types="vite/client" />
/// <reference types="vite-plugin-pwa/client" />

// SVG raw string imports
declare module "*.svg?raw" {
  const content: string;
  export default content;
}

// PNG image imports
declare module "*.png" {
  const src: string;
  export default src;
}

declare module "virtual:pwa-register" {
  interface RegisterSWOptions {
    immediate?: boolean;
    onNeedRefresh?(): void;
    onOfflineReady?(): void;
    onRegisteredSW?(
      swScriptUrl: string,
      registration: ServiceWorkerRegistration,
    ): void;
    onRegisterError?(error: Error): void;
  }
  export function registerSW(
    options?: RegisterSWOptions,
  ): (reloadPage?: boolean) => Promise<void>;
}
