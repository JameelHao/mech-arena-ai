/** Combat Core templates — persistent mech behavioral identity. */

export interface CombatCore {
  name: string;
  icon: string;
  prompt: string;
}

export const COMBAT_CORES: CombatCore[] = [
  {
    name: "Aggressive",
    icon: "\u2694\uFE0F",
    prompt:
      "Always prioritize the highest damage attack. Use super-effective moves when possible. Only use defense as a last resort when HP is critically low.",
  },
  {
    name: "Balanced",
    icon: "\u2696\uFE0F",
    prompt:
      "Use a mix of offense and defense. Attack with type advantage when available. Switch to defense when HP drops below 40%. Prioritize consistent damage over risky plays.",
  },
  {
    name: "Defensive",
    icon: "\uD83D\uDEE1\uFE0F",
    prompt:
      "Prioritize survival. Use Reactive Armor frequently to build up shields. Only attack when HP is above 60%. Prefer resisted attacks over risky super-effective moves.",
  },
];

/** @deprecated Use COMBAT_CORES instead */
export const STRATEGY_TEMPLATES = COMBAT_CORES;
/** @deprecated Use CombatCore instead */
export type StrategyTemplate = CombatCore;
