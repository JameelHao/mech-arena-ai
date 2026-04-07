/**
 * BattlePrompt - Prompt textarea input, PWA install/offline/update banners
 */

import {
  PROMPT_LAYOUT,
  buildContainerStyle,
  buildInstallBannerStyle,
  buildSaveButtonStyle,
  buildTextareaStyle,
} from "../../utils/promptLayout";
import {
  isOnline,
  onOnlineChange,
  onUpdateAvailable,
  shouldShowInstallPrompt,
  triggerInstallPrompt,
} from "../../utils/pwa";
import { saveMechPrompt } from "../../utils/storage";

const PROMPT_MAX_LENGTH = 500;
const PROMPT_PLACEHOLDER =
  "Enter your mech's battle strategy... e.g. 'Be aggressive, use high-damage attacks when HP is high. Switch to defense when low.'";

export interface PromptState {
  promptContainer?: HTMLDivElement;
  mechPrompt: string;
  offlineBanner?: HTMLDivElement;
  updateBanner?: HTMLDivElement;
  installBanner?: HTMLDivElement;
  onlineCleanup?: () => void;
  updateSWFn?: () => void;
}

export function createPromptUI(
  state: PromptState,
  onLogMessage: (msg: string) => void,
): void {
  if (state.promptContainer) {
    state.promptContainer.remove();
  }

  const container = document.createElement("div");
  container.style.cssText = buildContainerStyle(PROMPT_LAYOUT.container);

  const textarea = document.createElement("textarea");
  textarea.maxLength = PROMPT_MAX_LENGTH;
  textarea.placeholder = PROMPT_PLACEHOLDER;
  textarea.value = state.mechPrompt;
  textarea.style.cssText = buildTextareaStyle(PROMPT_LAYOUT.textarea);

  const row = document.createElement("div");
  row.style.cssText =
    "display:flex;justify-content:space-between;align-items:center;";

  const counter = document.createElement("span");
  counter.style.cssText = "color:#666;font-size:11px;font-family:monospace;";
  counter.textContent = `${state.mechPrompt.length}/${PROMPT_MAX_LENGTH}`;

  const saveBtn = document.createElement("button");
  saveBtn.textContent = "Save";
  saveBtn.style.cssText = buildSaveButtonStyle(PROMPT_LAYOUT.saveButton);

  textarea.addEventListener("input", () => {
    state.mechPrompt = textarea.value;
    counter.textContent = `${textarea.value.length}/${PROMPT_MAX_LENGTH}`;
  });

  saveBtn.addEventListener("click", () => {
    saveMechPrompt(state.mechPrompt);
    saveBtn.textContent = "Saved!";
    saveBtn.style.background = "#0a5";
    onLogMessage("[EFF]Strategy updated!");
    setTimeout(() => {
      saveBtn.textContent = "Save";
      saveBtn.style.background = "#0f8";
    }, 1000);
  });

  const indicator = document.createElement("span");
  indicator.style.cssText =
    "color:#0f8;font-size:11px;font-family:monospace;display:none;";
  indicator.textContent = "\u26A1 Strategy Active";
  if (state.mechPrompt.trim()) {
    indicator.style.display = "inline";
  }

  saveBtn.addEventListener("click", () => {
    indicator.style.display = state.mechPrompt.trim() ? "inline" : "none";
  });

  row.appendChild(counter);
  row.appendChild(indicator);
  row.appendChild(saveBtn);
  container.appendChild(textarea);
  container.appendChild(row);

  document.body.appendChild(container);
  state.promptContainer = container;
}

export function initPWABanners(state: PromptState): void {
  state.onlineCleanup = onOnlineChange((online) => {
    if (!online) {
      showOfflineBanner(state);
    } else {
      removeOfflineBanner(state);
    }
  });
  if (!isOnline()) showOfflineBanner(state);

  onUpdateAvailable((updateSW) => {
    state.updateSWFn = updateSW;
    showUpdateBanner(state);
  });

  if (shouldShowInstallPrompt()) {
    showInstallBanner(state);
  }
}

function showOfflineBanner(state: PromptState): void {
  if (state.offlineBanner) return;
  const banner = document.createElement("div");
  banner.style.cssText =
    "position:fixed;top:0;left:0;right:0;background:#ff4500;color:#fff;text-align:center;padding:6px 12px;font-size:13px;font-family:monospace;z-index:200;";
  banner.textContent = "⚡ Offline — LLM disabled, using Bot moves";
  document.body.appendChild(banner);
  state.offlineBanner = banner;
}

function removeOfflineBanner(state: PromptState): void {
  if (state.offlineBanner) {
    state.offlineBanner.remove();
    state.offlineBanner = undefined;
  }
}

function showUpdateBanner(state: PromptState): void {
  if (state.updateBanner) return;
  const banner = document.createElement("div");
  banner.style.cssText =
    "position:fixed;top:0;left:0;right:0;background:#1e90ff;color:#fff;text-align:center;padding:6px 12px;font-size:13px;font-family:monospace;z-index:201;display:flex;justify-content:center;align-items:center;gap:12px;";
  const text = document.createElement("span");
  text.textContent = "Update available!";
  const btn = document.createElement("button");
  btn.textContent = "Refresh";
  btn.style.cssText =
    "background:#fff;color:#1e90ff;border:none;border-radius:4px;padding:3px 10px;font-size:12px;font-weight:bold;cursor:pointer;font-family:monospace;";
  btn.addEventListener("click", () => {
    state.updateSWFn?.();
  });
  const dismiss = document.createElement("button");
  dismiss.textContent = "\u2715";
  dismiss.style.cssText =
    "background:none;color:#fff;border:none;font-size:16px;cursor:pointer;padding:0 4px;";
  dismiss.addEventListener("click", () => {
    state.updateBanner?.remove();
    state.updateBanner = undefined;
  });
  banner.appendChild(text);
  banner.appendChild(btn);
  banner.appendChild(dismiss);
  document.body.appendChild(banner);
  state.updateBanner = banner;
}

function showInstallBanner(state: PromptState): void {
  if (state.installBanner) return;
  const banner = document.createElement("div");
  banner.style.cssText = buildInstallBannerStyle(PROMPT_LAYOUT.installBanner);
  const text = document.createElement("span");
  text.textContent = "Install Mech Arena AI?";
  const btn = document.createElement("button");
  btn.textContent = "Install";
  btn.style.cssText =
    "background:#0f8;color:#000;border:none;border-radius:4px;padding:4px 12px;font-size:12px;font-weight:bold;cursor:pointer;font-family:monospace;";
  btn.addEventListener("click", async () => {
    await triggerInstallPrompt();
    state.installBanner?.remove();
    state.installBanner = undefined;
  });
  const dismiss = document.createElement("button");
  dismiss.textContent = "\u2715";
  dismiss.style.cssText =
    "background:none;color:#666;border:none;font-size:16px;cursor:pointer;padding:0 4px;";
  dismiss.addEventListener("click", () => {
    state.installBanner?.remove();
    state.installBanner = undefined;
  });
  banner.appendChild(text);
  banner.appendChild(btn);
  banner.appendChild(dismiss);
  document.body.appendChild(banner);
  state.installBanner = banner;
}

export function cleanupPWABanners(state: PromptState): void {
  state.onlineCleanup?.();
  state.offlineBanner?.remove();
  state.updateBanner?.remove();
  state.installBanner?.remove();
  state.offlineBanner = undefined;
  state.updateBanner = undefined;
  state.installBanner = undefined;
}
