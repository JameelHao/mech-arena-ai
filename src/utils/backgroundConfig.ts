/**
 * Background layer configuration for BattleScene.
 * Extracted for testability and reuse.
 */

export const BATTLE_BG_TINT = 0xaaaaaa;

export interface BackgroundLayout {
  bgX: number;
  bgY: number;
  bgW: number;
  bgH: number;
  groundX: number;
  groundY: number;
  groundW: number;
  groundH: number;
}

/**
 * Computes background and ground layer positions/sizes for a given screen size.
 */
export function computeBackgroundLayout(
  screenW: number,
  screenH: number,
): BackgroundLayout {
  const groundH = Math.max(80, screenH * 0.15);
  return {
    bgX: screenW / 2,
    bgY: screenH / 2,
    bgW: screenW,
    bgH: screenH,
    groundX: screenW / 2,
    groundY: screenH - groundH / 2,
    groundW: screenW,
    groundH,
  };
}
