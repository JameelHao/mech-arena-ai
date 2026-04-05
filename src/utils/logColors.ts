/**
 * Battle log color mapping by message prefix.
 * Extracted for reuse and testability.
 */

const COLORS_ACCENT = "#00ff88";

export const LOG_COLORS: Record<string, string> = {
  "[DMG]": "#ffd700", // gold for damage
  "[EFF]": "#00ff88", // green for effects/defense
  "[TURN]": "#888888", // gray for turn transitions
  "[SUP]": "#ff6666", // red for super effective
  "[RES]": "#66ccff", // blue for not very effective
};

export const LOG_MAX_LINES = 8;

export interface ParsedLogMessage {
  displayMsg: string;
  color: string;
}

/**
 * Parse a raw log message, stripping the prefix and determining its color.
 */
export function parseLogMessage(msg: string): ParsedLogMessage {
  for (const [prefix, c] of Object.entries(LOG_COLORS)) {
    if (msg.startsWith(prefix)) {
      return { displayMsg: msg.slice(prefix.length), color: c };
    }
  }
  return { displayMsg: msg, color: COLORS_ACCENT };
}
