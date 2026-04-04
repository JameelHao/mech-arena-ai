/// <reference types="vite/client" />
/// <reference types="vite-plugin-pwa/client" />

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
