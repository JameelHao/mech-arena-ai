import assert from "node:assert/strict";
import { afterEach, beforeEach, describe, it, mock } from "node:test";

// Mock localStorage before importing modules that use it
if (typeof globalThis.localStorage === "undefined") {
  const store = new Map<string, string>();
  (globalThis as Record<string, unknown>).localStorage = {
    getItem: (k: string) => store.get(k) ?? null,
    setItem: (k: string, v: string) => store.set(k, v),
    removeItem: (k: string) => store.delete(k),
    clear: () => store.clear(),
  };
}

import { buildPrompt } from "../api/battle.ts";
import { buildRequestBody } from "../src/api/battleClient";
import type { BattleState } from "../src/types/game";
import { MechType, TurnPhase } from "../src/types/game";
import type { SkinPack, SkinPackManifest } from "../src/types/skin";

function makeGameState(overrides?: Partial<BattleState>): BattleState {
  return {
    player: {
      name: "PlayerMech",
      type: MechType.Kinetic,
      hp: 80,
      maxHp: 100,
      skills: [
        { name: "Railgun Salvo", type: MechType.Kinetic, damage: 40 },
        { name: "Plasma Beam", type: MechType.Beam, damage: 30 },
        { name: "EMP Pulse", type: MechType.Emp, damage: 25 },
        { name: "Reactive Armor", type: "defense", damage: 0 },
      ],
    },
    opponent: {
      name: "EnemyMech",
      type: MechType.Beam,
      hp: 60,
      maxHp: 100,
      skills: [
        { name: "Plasma Beam", type: MechType.Beam, damage: 30 },
        { name: "Railgun Salvo", type: MechType.Kinetic, damage: 40 },
        { name: "EMP Pulse", type: MechType.Emp, damage: 25 },
        { name: "Reactive Armor", type: "defense", damage: 0 },
      ],
    },
    phase: TurnPhase.AiThinking,
    log: ["[EFF]PlayerMech used Fire Blast!"],
    turnCount: 1,
    winner: null,
    ...overrides,
  };
}

describe("skin separation — SkinPack types are cosmetic only", () => {
  it("SkinPackManifest should not contain combat fields", () => {
    // Verify the type contract: only visual/identity fields exist
    const manifest: SkinPackManifest = {
      id: "test-skin",
      name: "Test Skin",
      codename: "FALCON UNIT",
      themeColor: "#FF0000",
      baseType: MechType.Kinetic,
    };
    // These fields should exist
    assert.ok(manifest.id);
    assert.ok(manifest.name);
    assert.ok(manifest.codename);
    assert.ok(manifest.themeColor);
    assert.ok(manifest.baseType);
    // Ensure no combat fields are present at runtime
    const keys = Object.keys(manifest);
    const combatFields = [
      "hp",
      "maxHp",
      "damage",
      "skills",
      "defense",
      "attack",
      "power",
    ];
    for (const field of combatFields) {
      assert.ok(
        !keys.includes(field),
        `SkinPackManifest must not contain combat field: ${field}`,
      );
    }
  });

  it("SkinPack should only add visual asset paths, no combat fields", () => {
    const pack: SkinPack = {
      id: "test-skin",
      name: "Test Skin",
      codename: "FALCON UNIT",
      themeColor: "#FF0000",
      baseType: MechType.Kinetic,
      mechSprite: "/assets/skins/test/mech.png",
      portraits: {
        normal: "/assets/skins/test/portrait-normal.png",
        angry: "/assets/skins/test/portrait-angry.png",
        defeated: "/assets/skins/test/portrait-defeated.png",
      },
      thumbnail: "/assets/skins/test/thumbnail.png",
    };
    const keys = Object.keys(pack);
    const combatFields = [
      "hp",
      "maxHp",
      "damage",
      "skills",
      "defense",
      "attack",
      "power",
    ];
    for (const field of combatFields) {
      assert.ok(
        !keys.includes(field),
        `SkinPack must not contain combat field: ${field}`,
      );
    }
  });
});

describe("skin separation — buildRequestBody excludes skin data", () => {
  let originalFetch: typeof globalThis.fetch;

  beforeEach(() => {
    originalFetch = globalThis.fetch;
  });

  afterEach(() => {
    globalThis.fetch = originalFetch;
    mock.restoreAll();
  });

  it("request body should not contain skinId or skin-related fields", () => {
    const body = buildRequestBody("be aggressive", makeGameState());
    const json = JSON.stringify(body);
    // Skin fields must not appear in the request body
    assert.ok(!json.includes("skinId"), "request body must not contain skinId");
    assert.ok(
      !json.includes("skinName"),
      "request body must not contain skinName",
    );
    assert.ok(
      !json.includes("themeColor"),
      "request body must not contain themeColor",
    );
    assert.ok(
      !json.includes("mechSprite"),
      "request body must not contain mechSprite",
    );
    assert.ok(
      !json.includes("thumbnail"),
      "request body must not contain thumbnail",
    );
    assert.ok(
      !json.includes("portrait"),
      "request body must not contain portrait",
    );
  });

  it("request body should only contain combat-relevant fields", () => {
    const body = buildRequestBody("test prompt", makeGameState());
    // Top-level keys
    const topKeys = Object.keys(body);
    assert.deepEqual(topKeys.sort(), ["gameState", "mechPrompt"]);
    // gameState keys
    const gsKeys = Object.keys(body.gameState);
    const expected = [
      "combatCore",
      "lastMove",
      "opponentHP",
      "playerHP",
      "skills",
      "statusEffects",
    ];
    assert.deepEqual(gsKeys.sort(), expected);
  });
});

describe("skin separation — buildPrompt excludes skin data", () => {
  it("prompt output should not contain skin-related terms", () => {
    const prompt = buildPrompt({
      mechPrompt: "Focus fire",
      gameState: {
        playerHP: 80,
        opponentHP: 60,
        lastMove: "Railgun Salvo",
        statusEffects: [],
        skills: [
          { name: "Railgun Salvo", type: "kinetic", damage: 40 },
          { name: "Plasma Beam", type: "beam", damage: 30 },
          { name: "EMP Pulse", type: "emp", damage: 25 },
          { name: "Reactive Armor", type: "defense", damage: 0 },
        ],
        combatCore: { name: "Aggressive", prompt: "Always attack first" },
      },
    });
    // Prompt should not reference skins
    assert.ok(
      !prompt.toLowerCase().includes("skin"),
      "prompt must not mention 'skin'",
    );
    assert.ok(
      !prompt.toLowerCase().includes("cosmetic"),
      "prompt must not mention 'cosmetic'",
    );
    assert.ok(
      !prompt.toLowerCase().includes("appearance"),
      "prompt must not mention 'appearance'",
    );
    // Prompt should contain combat data
    assert.ok(
      prompt.includes("Aggressive"),
      "prompt should include combat core name",
    );
    assert.ok(
      prompt.includes("Focus fire"),
      "prompt should include player instructions",
    );
    assert.ok(prompt.includes("80"), "prompt should include player HP");
  });

  it("prompt should only use combatCore, mechPrompt, and gameState", () => {
    const prompt = buildPrompt({
      mechPrompt: "",
      gameState: {
        playerHP: 100,
        opponentHP: 100,
        lastMove: "",
        statusEffects: [],
        skills: [{ name: "Test Skill", type: "kinetic", damage: 10 }],
      },
    });
    // Should contain game state
    assert.ok(prompt.includes("Your HP: 100"));
    assert.ok(prompt.includes("Opponent HP: 100"));
    assert.ok(prompt.includes("Test Skill"));
    // Should not contain cosmetic references
    assert.ok(!prompt.includes("desert-storm"));
    assert.ok(!prompt.includes("arctic-ops"));
    assert.ok(!prompt.includes("crimson-fury"));
  });
});
