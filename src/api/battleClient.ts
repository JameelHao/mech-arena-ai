/** Battle API client - calls /api/battle for AI move selection */

import { COMBAT_CORES } from "../data/strategies";
import type { BattleState } from "../types/game";
import { loadCombatCore } from "../utils/storage";

interface BattleAPIRequest {
  mechPrompt: string;
  gameState: {
    playerHP: number;
    opponentHP: number;
    lastMove: string;
    statusEffects: string[];
    skills: Array<{ name: string; type: string; damage: number }>;
    combatCore?: { name: string; prompt: string };
  };
}

interface BattleAPIResponse {
  move: 0 | 1 | 2 | 3;
  reasoning?: string;
}

const MAX_RETRIES = 2;

/**
 * Build the request body for the battle API.
 *
 * IMPORTANT: Only combat-relevant data (HP, skills, combatCore, mechPrompt)
 * is included. Skin/cosmetic data (skinId, skin name, etc.) must NEVER be
 * sent to the API — skins are purely visual and do not affect battle behavior.
 */
export function buildRequestBody(
  prompt: string,
  state: BattleState,
): BattleAPIRequest {
  const lastLog = state.log.filter((l) => l.includes("used")).pop() ?? "";
  return {
    mechPrompt: prompt,
    gameState: {
      playerHP: state.player.hp,
      opponentHP: state.opponent.hp,
      lastMove: lastLog,
      statusEffects: [],
      skills: state.player.skills.map((s) => ({
        name: s.name,
        type: String(s.type),
        damage: s.damage,
      })),
      combatCore: (() => {
        const core = COMBAT_CORES[loadCombatCore()];
        return core ? { name: core.name, prompt: core.prompt } : undefined;
      })(),
    },
  };
}

/**
 * Call the battle API to get an AI move.
 * Retries up to 2 times on failure. Returns null if all attempts fail.
 */
export async function callBattleAPI(
  prompt: string,
  gameState: BattleState,
): Promise<BattleAPIResponse | null> {
  const body = buildRequestBody(prompt, gameState);

  for (let attempt = 0; attempt < MAX_RETRIES; attempt++) {
    try {
      const res = await fetch("/api/battle", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      if (!res.ok) {
        continue;
      }

      const data = (await res.json()) as BattleAPIResponse;
      if (typeof data.move === "number" && data.move >= 0 && data.move <= 3) {
        return data;
      }
    } catch {
      // Network error — retry
    }
  }

  return null;
}
