/**
 * Battle API - Vercel Serverless Function
 * POST /api/battle
 * Integrates Claude Haiku for AI move selection
 */

import Anthropic from "@anthropic-ai/sdk";
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

// Simple rate limiter: 1 req/sec per IP
export const rateLimitMap = new Map<string, number>();
const RATE_LIMIT_MS = 1000;

export function isRateLimited(ip: string): boolean {
  const now = Date.now();
  const last = rateLimitMap.get(ip);
  if (last && now - last < RATE_LIMIT_MS) {
    return true;
  }
  rateLimitMap.set(ip, now);

  // Evict stale entries to prevent memory leak
  if (rateLimitMap.size > 10000) {
    for (const [key, ts] of rateLimitMap) {
      if (now - ts > RATE_LIMIT_MS * 10) {
        rateLimitMap.delete(key);
      }
    }
  }

  return false;
}

function getRandomMove(): 0 | 1 | 2 | 3 {
  return Math.floor(Math.random() * 4) as 0 | 1 | 2 | 3;
}

export function buildPrompt(body: BattleRequest): string {
  const { mechPrompt, gameState } = body;
  return `You are an AI controlling a battle mech. The player has given you this strategy:
"${mechPrompt}"

Current game state:
- Your HP: ${gameState.playerHP}
- Opponent HP: ${gameState.opponentHP}
- Opponent's last move: ${gameState.lastMove || "none"}
- Active status effects: ${gameState.statusEffects.length > 0 ? gameState.statusEffects.join(", ") : "none"}

Available skills (choose by index):
0: Laser Beam - High damage, low accuracy
1: Shield Bash - Medium damage, raises defense
2: Repair - Heals HP, skips attack
3: EMP Strike - Disables opponent's next move

Based on the strategy and game state, choose the best skill index (0-3).
Respond with EXACTLY this format:
SKILL: <index>
REASON: <brief explanation>`;
}

export function parseResponse(
  text: string,
): { move: 0 | 1 | 2 | 3; reasoning?: string } | null {
  const skillMatch = text.match(/SKILL:\s*([0-3])/);
  if (!skillMatch) return null;

  const move = Number.parseInt(skillMatch[1], 10) as 0 | 1 | 2 | 3;
  const reasonMatch = text.match(/REASON:\s*(.+)/);
  const reasoning = reasonMatch?.[1]?.trim();

  return { move, reasoning };
}

async function callClaude(prompt: string): Promise<string> {
  const client = new Anthropic();
  const message = await client.messages.create(
    {
      model: "claude-haiku-4-5-20251001",
      max_tokens: 150,
      messages: [{ role: "user", content: prompt }],
    },
    { timeout: 5000 },
  );

  const block = message.content[0];
  if (block.type !== "text") return "";
  return block.text;
}

export default async function handler(
  req: VercelRequest,
  res: VercelResponse<BattleResponse | { error: string }>,
) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  if (!process.env.ANTHROPIC_API_KEY) {
    return res.status(500).json({ error: "API key not configured" });
  }

  const ip =
    (req.headers["x-forwarded-for"] as string)?.split(",")[0]?.trim() ||
    req.socket.remoteAddress ||
    "unknown";

  if (isRateLimited(ip)) {
    return res
      .status(429)
      .json({ error: "Rate limited. Max 1 request per second." });
  }

  const body = req.body as BattleRequest;
  const prompt = buildPrompt(body);

  // Try up to 2 times (initial + 1 retry for malformed response)
  for (let attempt = 0; attempt < 2; attempt++) {
    try {
      const text = await callClaude(prompt);
      const result = parseResponse(text);
      if (result) {
        return res.status(200).json(result);
      }
      // Malformed response — retry once
    } catch (err) {
      if (
        err instanceof Anthropic.APIConnectionError ||
        err instanceof Anthropic.APIConnectionTimeoutError
      ) {
        // Timeout or connection error — fall back to random move
        return res
          .status(200)
          .json({ move: getRandomMove(), reasoning: "timeout fallback" });
      }
      if (err instanceof Anthropic.AuthenticationError) {
        return res.status(500).json({ error: "Invalid API key" });
      }
      // Other API errors — fall back to random
      return res
        .status(200)
        .json({ move: getRandomMove(), reasoning: "error fallback" });
    }
  }

  // Both attempts returned malformed responses
  return res
    .status(200)
    .json({ move: getRandomMove(), reasoning: "parse fallback" });
}
