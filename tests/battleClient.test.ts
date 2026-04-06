import assert from "node:assert/strict";
import { afterEach, beforeEach, describe, it, mock } from "node:test";
import { callBattleAPI } from "../src/api/battleClient";
import type { BattleState } from "../src/types/game";
import { MechType, TurnPhase } from "../src/types/game";

function makeGameState(overrides?: Partial<BattleState>): BattleState {
  return {
    player: {
      name: "PlayerMech",
      type: MechType.Fire,
      hp: 80,
      maxHp: 100,
      skills: [
        { name: "Fire Blast", type: MechType.Fire, damage: 40 },
        { name: "Water Cannon", type: MechType.Water, damage: 30 },
        { name: "Thunder Shock", type: MechType.Electric, damage: 25 },
        { name: "Iron Defense", type: "defense", damage: 0 },
      ],
    },
    opponent: {
      name: "EnemyMech",
      type: MechType.Water,
      hp: 60,
      maxHp: 100,
      skills: [
        { name: "Water Cannon", type: MechType.Water, damage: 30 },
        { name: "Fire Blast", type: MechType.Fire, damage: 40 },
        { name: "Thunder Shock", type: MechType.Electric, damage: 25 },
        { name: "Iron Defense", type: "defense", damage: 0 },
      ],
    },
    phase: TurnPhase.AiThinking,
    log: [
      "[TURN]--- Battle Start ---",
      "[EFF]PlayerMech vs EnemyMech",
      "Choose your attack!",
      "[EFF]PlayerMech used Fire Blast!",
    ],
    turnCount: 1,
    winner: null,
    ...overrides,
  };
}

describe("callBattleAPI", () => {
  let originalFetch: typeof globalThis.fetch;

  beforeEach(() => {
    originalFetch = globalThis.fetch;
  });

  afterEach(() => {
    globalThis.fetch = originalFetch;
    mock.restoreAll();
  });

  it("should return move on successful API response", async () => {
    globalThis.fetch = mock.fn(async () =>
      Response.json({ move: 2, reasoning: "strategic choice" }),
    ) as typeof fetch;

    const result = await callBattleAPI("be aggressive", makeGameState());
    assert.deepEqual(result, { move: 2, reasoning: "strategic choice" });
  });

  it("should send correct request body", async () => {
    const fetchMock = mock.fn(async () =>
      Response.json({ move: 1 }),
    ) as typeof fetch;
    globalThis.fetch = fetchMock;

    await callBattleAPI("test prompt", makeGameState());

    assert.equal(fetchMock.mock.calls.length, 1);
    const [url, options] = fetchMock.mock.calls[0].arguments;
    assert.equal(url, "/api/battle");
    assert.equal(options?.method, "POST");

    const body = JSON.parse(options?.body as string);
    assert.equal(body.mechPrompt, "test prompt");
    assert.equal(body.gameState.playerHP, 80);
    assert.equal(body.gameState.opponentHP, 60);
    assert.equal(body.gameState.lastMove, "[EFF]PlayerMech used Fire Blast!");
  });

  it("should return null after max retries on network error", async () => {
    globalThis.fetch = mock.fn(async () => {
      throw new TypeError("Failed to fetch");
    }) as typeof fetch;

    const result = await callBattleAPI("test", makeGameState());
    assert.equal(result, null);

    const calls = (globalThis.fetch as ReturnType<typeof mock.fn>).mock.calls;
    assert.equal(calls.length, 2);
  });

  it("should return null after max retries on non-ok response", async () => {
    globalThis.fetch = mock.fn(
      async () => new Response("error", { status: 500 }),
    ) as typeof fetch;

    const result = await callBattleAPI("test", makeGameState());
    assert.equal(result, null);
  });

  it("should retry on first failure then succeed", async () => {
    let callCount = 0;
    globalThis.fetch = mock.fn(async () => {
      callCount++;
      if (callCount === 1) {
        throw new TypeError("Failed to fetch");
      }
      return Response.json({ move: 3 });
    }) as typeof fetch;

    const result = await callBattleAPI("test", makeGameState());
    assert.deepEqual(result, { move: 3 });
    assert.equal(callCount, 2);
  });

  it("should return null for invalid move value", async () => {
    globalThis.fetch = mock.fn(async () =>
      Response.json({ move: 5 }),
    ) as typeof fetch;

    const result = await callBattleAPI("test", makeGameState());
    assert.equal(result, null);
  });

  it("should extract last move from log", async () => {
    const fetchMock = mock.fn(async () =>
      Response.json({ move: 0 }),
    ) as typeof fetch;
    globalThis.fetch = fetchMock;

    const state = makeGameState({
      log: [
        "[TURN]--- Battle Start ---",
        "[EFF]PlayerMech vs EnemyMech",
        "Choose your attack!",
        "[EFF]PlayerMech used Fire Blast!",
        "It's not very effective...",
        "[EFF]EnemyMech used Water Cannon!",
      ],
    });

    await callBattleAPI("test", state);

    const body = JSON.parse(
      fetchMock.mock.calls[0].arguments[1]?.body as string,
    );
    assert.equal(body.gameState.lastMove, "[EFF]EnemyMech used Water Cannon!");
  });
});
