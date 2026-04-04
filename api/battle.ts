/**
 * Battle API - Vercel Serverless Function
 * POST /api/battle
 */

import type { VercelRequest, VercelResponse } from "@vercel/node";

interface BattleRequest {
  mechPrompt: string;
  gameState: {
    playerHP: number;
    opponentHP: number;
    lastMove: string;
    statusEffects: string[];
  };
}

interface BattleResponse {
  move: 0 | 1 | 2 | 3;
  reasoning?: string;
}

export default function handler(
  req: VercelRequest,
  res: VercelResponse<BattleResponse | { error: string }>,
) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const body = req.body as BattleRequest;

  // TODO: Integrate Claude Haiku
  // For now, return random move
  const move = Math.floor(Math.random() * 4) as 0 | 1 | 2 | 3;

  return res.status(200).json({ move });
}
