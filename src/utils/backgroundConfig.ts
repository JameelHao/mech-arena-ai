/**
 * Background layer configuration for BattleScene.
 * Extracted for testability and reuse.
 */

export const BATTLE_BG_TINT = 0xaaaaaa;
export const GROUND_TINT = 0xcccccc;
export const TRANSITION_HEIGHT_RATIO = 0.05;
export const TRANSITION_MIN_HEIGHT = 30;
export const EDGE_OVERLAY_ALPHA = 0.3;

export interface BackgroundLayout {
  bgX: number;
  bgY: number;
  bgW: number;
  bgH: number;
  groundX: number;
  groundY: number;
  groundW: number;
  groundH: number;
  transitionY: number;
  transitionH: number;
}

/**
 * Computes background and ground layer positions/sizes for a given screen size.
 */
export function computeBackgroundLayout(
  screenW: number,
  screenH: number,
): BackgroundLayout {
  const groundH = Math.max(80, screenH * 0.15);
  const transitionH = Math.max(
    TRANSITION_MIN_HEIGHT,
    screenH * TRANSITION_HEIGHT_RATIO,
  );
  // Transition zone sits directly above the ground top edge
  const groundTopY = screenH - groundH;
  const transitionY = groundTopY - transitionH;
  return {
    bgX: screenW / 2,
    bgY: screenH / 2,
    bgW: screenW,
    bgH: screenH,
    groundX: screenW / 2,
    groundY: screenH - groundH / 2,
    groundW: screenW,
    groundH,
    transitionY,
    transitionH,
  };
}
