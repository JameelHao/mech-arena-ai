/** Storage types for battle history and game settings */

import type { MechType } from "./game";

export interface BattleRecord {
  id: string;
  timestamp: number;
  playerMechType: MechType;
  opponentMechType: MechType;
  result: "win" | "loss";
  turns: number;
  playerHpLeft: number;
  opponentHpLeft: number;
  prompt?: string;
  battleLog?: string[];
  playerMechCodename?: string;
  combatCoreName?: string;
}

export interface GameSettings {
  mechPrompt: string;
  soundEnabled: boolean;
  animationSpeed: "normal" | "fast";
}

export const DEFAULT_SETTINGS: GameSettings = {
  mechPrompt: "",
  soundEnabled: true,
  animationSpeed: "normal",
};
