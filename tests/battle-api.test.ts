import assert from "node:assert/strict";
import { beforeEach, describe, it } from "node:test";
import {
  buildPrompt,
  isRateLimited,
  mockBattleResponse,
  parseResponse,
  rateLimitMap,
} from "../api/battle.ts";

const TEST_SKILLS = [
  { name: "Railgun Salvo", type: "kinetic", damage: 40 },
  { name: "Plasma Beam", type: "beam", damage: 30 },
  { name: "EMP Pulse", type: "emp", damage: 25 },
  { name: "Reactive Armor", type: "defense", damage: 0 },
];

describe("buildPrompt", () => {
  it("should contain game state and player strategy", () => {
    const prompt = buildPrompt({
      mechPrompt: "Be aggressive",
      gameState: {
        playerHP: 80,
        opponentHP: 60,
        lastMove: "Railgun Salvo",
        statusEffects: ["defense_up"],
        skills: TEST_SKILLS,
      },
    });

    assert.ok(prompt.includes("Be aggressive"));
    assert.ok(prompt.includes("80"));
    assert.ok(prompt.includes("60"));
    assert.ok(prompt.includes("Railgun Salvo"));
    assert.ok(prompt.includes("defense_up"));
  });

  it("should include actual skill names from skills array", () => {
    const prompt = buildPrompt({
      mechPrompt: "test",
      gameState: {
        playerHP: 100,
        opponentHP: 100,
        lastMove: "",
        statusEffects: [],
        skills: TEST_SKILLS,
      },
    });

    assert.ok(prompt.includes("Railgun Salvo"), "should contain Railgun Salvo");
    assert.ok(prompt.includes("Plasma Beam"), "should contain Plasma Beam");
    assert.ok(prompt.includes("EMP Pulse"), "should contain EMP Pulse");
    assert.ok(
      prompt.includes("Reactive Armor"),
      "should contain Reactive Armor",
    );
    assert.ok(prompt.includes("kinetic"), "should contain kinetic type");
    assert.ok(prompt.includes("40 dmg"), "should contain damage value");
    // Should NOT contain old hardcoded names
    assert.ok(!prompt.includes("Laser Beam"), "should not contain Laser Beam");
    assert.ok(
      !prompt.includes("Shield Bash"),
      "should not contain Shield Bash",
    );
    assert.ok(!prompt.includes("Repair"), "should not contain Repair");
  });

  it("should handle empty status effects", () => {
    const prompt = buildPrompt({
      mechPrompt: "Play safe",
      gameState: {
        playerHP: 100,
        opponentHP: 100,
        lastMove: "",
        statusEffects: [],
        skills: TEST_SKILLS,
      },
    });

    assert.ok(prompt.includes("Play safe"));
    assert.ok(prompt.includes("none"));
  });

  it("should fallback when skills not provided", () => {
    const prompt = buildPrompt({
      mechPrompt: "test",
      gameState: {
        playerHP: 100,
        opponentHP: 100,
        lastMove: "",
        statusEffects: [],
      },
    });

    assert.ok(prompt.includes("Skills not available"));
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

describe("mockBattleResponse", () => {
  const makeRequest = (playerHP = 100, opponentHP = 100) => ({
    mechPrompt: "test",
    gameState: {
      playerHP,
      opponentHP,
      lastMove: "",
      statusEffects: [] as string[],
    },
  });

  it("should return a valid move (0-3)", () => {
    const result = mockBattleResponse(makeRequest());
    assert.ok(result.move >= 0 && result.move <= 3);
  });

  it("should include [MOCK] prefix in reasoning", () => {
    const result = mockBattleResponse(makeRequest());
    assert.ok(result.reasoning?.includes("[MOCK]"));
  });

  it("should return reasoning string", () => {
    const result = mockBattleResponse(makeRequest());
    assert.ok(typeof result.reasoning === "string");
    assert.ok(result.reasoning.length > 0);
  });

  it("should favor defense when HP is critical", () => {
    let defenseCount = 0;
    const runs = 100;
    for (let i = 0; i < runs; i++) {
      const result = mockBattleResponse(makeRequest(20));
      if (result.move === 3) defenseCount++;
    }
    // With 50% chance at HP<30%, expect ~50 out of 100
    assert.ok(
      defenseCount > 20,
      `Expected more defense at low HP, got ${defenseCount}/100`,
    );
  });

  it("should mostly pick attack skills at full HP", () => {
    let attackCount = 0;
    const runs = 100;
    for (let i = 0; i < runs; i++) {
      const result = mockBattleResponse(makeRequest(100));
      if (result.move < 3) attackCount++;
    }
    // At full HP, defense weight is only 0.1 → ~90% attack
    assert.ok(
      attackCount > 70,
      `Expected more attacks at full HP, got ${attackCount}/100`,
    );
  });

  it("should return all 4 possible moves over many runs", () => {
    const seen = new Set<number>();
    for (let i = 0; i < 200; i++) {
      // Mix low and high HP to cover both branches
      const hp = i % 2 === 0 ? 100 : 20;
      seen.add(mockBattleResponse(makeRequest(hp)).move);
    }
    assert.equal(seen.size, 4, "All 4 moves should be reachable");
  });
});
