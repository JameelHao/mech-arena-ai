/**
 * Prompt input layout configuration for BattleScene DOM overlay.
 * Extracted for testability and single-source-of-truth styling.
 */

export interface PromptLayoutConfig {
  container: {
    bottom: string;
    left: string;
    width: string;
    maxWidth: string;
    gap: string;
  };
  textarea: {
    height: string;
    padding: string;
  };
  saveButton: {
    padding: string;
  };
  installBanner: {
    bottom: string;
    left: string;
  };
}

export const PROMPT_LAYOUT: PromptLayoutConfig = {
  container: {
    bottom: "12px",
    left: "12px",
    width: "280px",
    maxWidth: "calc(100vw - 24px)",
    gap: "8px",
  },
  textarea: {
    height: "80px",
    padding: "8px",
  },
  saveButton: {
    padding: "6px 16px",
  },
  installBanner: {
    bottom: "112px",
    left: "12px",
  },
};

/** Build the full CSS string for the prompt container. */
export function buildContainerStyle(cfg: PromptLayoutConfig["container"]): string {
  return `position:fixed;bottom:${cfg.bottom};left:${cfg.left};z-index:100;display:flex;flex-direction:column;gap:${cfg.gap};width:${cfg.width};max-width:${cfg.maxWidth};`;
}

/** Build the full CSS string for the prompt textarea. */
export function buildTextareaStyle(cfg: PromptLayoutConfig["textarea"]): string {
  return `width:100%;height:${cfg.height};background:#222;color:#0f8;border:1px solid #444;border-radius:6px;padding:${cfg.padding};font-size:12px;resize:none;font-family:monospace;box-sizing:border-box;`;
}

/** Build the full CSS string for the save button. */
export function buildSaveButtonStyle(cfg: PromptLayoutConfig["saveButton"]): string {
  return `background:#0f8;color:#000;border:none;border-radius:4px;padding:${cfg.padding};font-size:12px;font-weight:bold;cursor:pointer;font-family:monospace;`;
}

/** Build the full CSS string for the install banner. */
export function buildInstallBannerStyle(cfg: PromptLayoutConfig["installBanner"]): string {
  return `position:fixed;bottom:${cfg.bottom};left:${cfg.left};background:#2a2a2a;color:#0f8;border:1px solid #444;border-radius:8px;padding:10px 14px;font-size:13px;font-family:monospace;z-index:200;display:flex;align-items:center;gap:10px;max-width:280px;`;
}
