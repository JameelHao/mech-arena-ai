import assert from "node:assert/strict";
import { beforeEach, describe, it } from "node:test";
import {
  buildPrompt,
  isRateLimited,
  parseResponse,
  rateLimitMap,
} from "../api/battle.ts";

describe("buildPrompt", () => {
  it("should contain game state and player strategy", () => {
    const prompt = buildPrompt({
      mechPrompt: "Be aggressive",
      gameState: {
        playerHP: 80,
        opponentHP: 60,
        lastMove: "Shield Bash",
        statusEffects: ["defense_up"],
      },
    });

    assert.ok(prompt.includes("Be aggressive"));
    assert.ok(prompt.includes("80"));
    assert.ok(prompt.includes("60"));
    assert.ok(prompt.includes("Shield Bash"));
    assert.ok(prompt.includes("defense_up"));
  });

  it("should handle empty status effects", () => {
    const prompt = buildPrompt({
      mechPrompt: "Play safe",
      gameState: {
        playerHP: 100,
        opponentHP: 100,
        lastMove: "",
        statusEffects: [],
      },
    });

    assert.ok(prompt.includes("Play safe"));
    assert.ok(prompt.includes("none"));
  });
});

describe("parseResponse", () => {
  it("should parse valid SKILL and REASON", () => {
    const result = parseResponse("SKILL: 2\nREASON: Need to heal");
    assert.deepStrictEqual(result, { move: 2, reasoning: "Need to heal" });
  });

  it("should parse all valid skill indices", () => {
    for (const i of [0, 1, 2, 3] as const) {
      const result = parseResponse(`SKILL: ${i}\nREASON: test`);
      assert.equal(result?.move, i);
    }
  });

  it("should return null for invalid format", () => {
    assert.equal(parseResponse("I choose skill 2"), null);
    assert.equal(parseResponse("SKILL: 5\nREASON: oops"), null);
    assert.equal(parseResponse("random garbage"), null);
  });

  it("should return null for empty response", () => {
    assert.equal(parseResponse(""), null);
  });

  it("should handle SKILL without REASON", () => {
    const result = parseResponse("SKILL: 1");
    assert.equal(result?.move, 1);
    assert.equal(result?.reasoning, undefined);
  });
});

describe("isRateLimited", () => {
  beforeEach(() => {
    rateLimitMap.clear();
  });

  it("should allow first request from an IP", () => {
    assert.equal(isRateLimited("1.2.3.4"), false);
  });

  it("should block same IP within rate limit window", () => {
    assert.equal(isRateLimited("1.2.3.4"), false);
    assert.equal(isRateLimited("1.2.3.4"), true);
  });

  it("should allow different IPs simultaneously", () => {
    assert.equal(isRateLimited("1.1.1.1"), false);
    assert.equal(isRateLimited("2.2.2.2"), false);
  });

  it("should clean up stale entries when map exceeds 10000", () => {
    // Fill with stale entries (timestamp = 0, well past expiry)
    for (let i = 0; i < 10001; i++) {
      rateLimitMap.set(`stale-${i}`, 0);
    }
    // Trigger cleanup via a new request
    isRateLimited("fresh-ip");
    // Stale entries should be evicted
    assert.ok(rateLimitMap.size < 10001);
    assert.ok(rateLimitMap.has("fresh-ip"));
  });
});
