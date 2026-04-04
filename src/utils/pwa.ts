/** PWA utilities: service worker registration, online state, install prompt */

const VISIT_COUNT_KEY = "mechArena_visitCount";
const INSTALL_DISMISSED_KEY = "mechArena_installDismissed";
const INSTALL_PROMPT_THRESHOLD = 3;

// --- Online state ---

let online = typeof navigator !== "undefined" ? navigator.onLine : true;
const listeners = new Set<(online: boolean) => void>();

export function isOnline(): boolean {
  return online;
}

export function onOnlineChange(cb: (online: boolean) => void): () => void {
  listeners.add(cb);
  return () => listeners.delete(cb);
}

function setOnline(value: boolean): void {
  if (online !== value) {
    online = value;
    for (const cb of listeners) cb(value);
  }
}

export function initOnlineListeners(): void {
  window.addEventListener("online", () => setOnline(true));
  window.addEventListener("offline", () => setOnline(false));
}

// --- Visit counting ---

export function getVisitCount(): number {
  try {
    const val = Number.parseInt(
      localStorage.getItem(VISIT_COUNT_KEY) ?? "0",
      10,
    );
    return Number.isNaN(val) ? 0 : val;
  } catch {
    return 0;
  }
}

export function incrementVisitCount(): number {
  const count = getVisitCount() + 1;
  try {
    localStorage.setItem(VISIT_COUNT_KEY, String(count));
  } catch {
    // Storage full or unavailable
  }
  return count;
}

// --- Install prompt ---

let deferredPrompt: BeforeInstallPromptEvent | null = null;

interface BeforeInstallPromptEvent extends Event {
  prompt(): Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

export function initInstallPrompt(): void {
  window.addEventListener("beforeinstallprompt", (e) => {
    e.preventDefault();
    deferredPrompt = e as BeforeInstallPromptEvent;
  });
}

export function shouldShowInstallPrompt(): boolean {
  if (!deferredPrompt) return false;
  if (window.matchMedia("(display-mode: standalone)").matches) return false;
  try {
    if (localStorage.getItem(INSTALL_DISMISSED_KEY) === "true") return false;
  } catch {
    // ignore
  }
  return getVisitCount() >= INSTALL_PROMPT_THRESHOLD;
}

export async function triggerInstallPrompt(): Promise<boolean> {
  if (!deferredPrompt) return false;
  await deferredPrompt.prompt();
  const { outcome } = await deferredPrompt.userChoice;
  deferredPrompt = null;
  if (outcome === "dismissed") {
    try {
      localStorage.setItem(INSTALL_DISMISSED_KEY, "true");
    } catch {
      // ignore
    }
  }
  return outcome === "accepted";
}

// --- Update notification ---

type UpdateCallback = (updateSW: () => void) => void;
let updateCallback: UpdateCallback | null = null;

export function onUpdateAvailable(cb: UpdateCallback): void {
  updateCallback = cb;
}

// --- Service worker registration ---

export async function registerSW(): Promise<void> {
  if (!("serviceWorker" in navigator)) return;

  initOnlineListeners();
  initInstallPrompt();
  incrementVisitCount();

  try {
    const { registerSW: register } = await import("virtual:pwa-register");
    register({
      immediate: true,
      onNeedRefresh() {
        if (updateCallback) {
          updateCallback(() => {
            register({ immediate: true });
            window.location.reload();
          });
        }
      },
      onOfflineReady() {
        console.log("[PWA] Offline ready");
      },
    });
  } catch {
    // Dev mode or SW not available
    console.log("[PWA] Service worker registration skipped");
  }
}
