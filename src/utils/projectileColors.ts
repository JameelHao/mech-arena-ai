/**
 * Projectile / explosion color definitions — pure module, no asset imports.
 */

import { MechType } from "../types/game";

export const PROJECTILE_COLORS: Record<
  string,
  { core: number; glow: number; trail: number }
> = {
  [MechType.Fire]: { core: 0xffaa00, glow: 0xff4500, trail: 0xff6600 },
  [MechType.Water]: { core: 0x00ddff, glow: 0x1e90ff, trail: 0x4db8ff },
  [MechType.Electric]: { core: 0xffff00, glow: 0xffd700, trail: 0xffed4a },
};

/**
 * Get projectile/explosion colors for a skill type.
 * Falls back to fire colors for unknown types.
 */
export function getProjectileColors(
  skillType: string,
): { core: number; glow: number; trail: number } {
  return PROJECTILE_COLORS[skillType] ?? PROJECTILE_COLORS[MechType.Fire];
}
