/**
 * Portrait state logic — pure function, no asset imports.
 */

export type PortraitState = "normal" | "angry" | "defeated";

/**
 * Determine portrait state from HP ratio.
 * - HP > 50% → normal
 * - HP 25%–50% → angry
 * - HP ≤ 25% or defeated → defeated
 */
export function getPortraitState(
  hpRatio: number,
  isDefeated: boolean,
): PortraitState {
  if (isDefeated) return "defeated";
  if (!Number.isFinite(hpRatio)) return "defeated";
  const clamped = Math.max(0, Math.min(1, hpRatio));
  if (clamped <= 0) return "defeated";
  if (clamped <= 0.25) return "defeated";
  if (clamped <= 0.5) return "angry";
  return "normal";
}
