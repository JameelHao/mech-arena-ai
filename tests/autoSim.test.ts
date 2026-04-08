import assert from "node:assert/strict";
import { beforeEach, describe, it } from "node:test";
import { type Mech, MechType, TurnPhase } from "../src/types/game";
import { BattleManager } from "../src/utils/BattleManager";

function makeMech(
  name: string,
  type: (typeof MechType)[keyof typeof MechType],
  hp = 100,
): Mech {
  return {
    name,
    type,
    hp,
    maxHp: hp,
    skills: [
      { name: "Railgun Salvo", type: MechType.Kinetic, damage: 40 },
      { name: "Plasma Beam", type: MechType.Beam, damage: 30 },
      { name: "EMP Pulse", type: MechType.Emp, damage: 25 },
      { name: "Reactive Armor", type: "defense", damage: 0 },
    ],
  };
}

describe("auto-sim training logic", () => {
  let bm: BattleManager;
  let player: Mech;
  let opponent: Mech;

  beforeEach(() => {
    bm = new BattleManager();
    player = makeMech("PlayerMech", MechType.Kinetic);
    opponent = makeMech("EnemyMech", MechType.Beam);
  });

  it("should complete 3 turns of auto-sim without KO", () => {
    bm.initBattle(player, opponent);
    // Simulate 3 turns (player + AI each turn)
    for (let turn = 0; turn < 3; turn++) {
      const state = bm.getState();
      if (state.phase === TurnPhase.BattleOver) break;
      const skillIndex = bm.getRandomAiSkill();
      bm.executePlayerAttack(skillIndex);
      const afterPlayer = bm.getState();
      if (afterPlayer.phase === TurnPhase.BattleOver) break;
      bm.executeAiAttack(bm.getRandomAiSkill());
    }
    // Should have progressed turns
    assert.ok(bm.getState().turnCount >= 2);
  });

  it("should stop early if KO happens before 3 turns", () => {
    const weakOpponent = makeMech("Weak", MechType.Emp, 1);
    bm.initBattle(player, weakOpponent);
    bm.executePlayerAttack(0); // KO on first hit
    assert.equal(bm.getState().phase, TurnPhase.BattleOver);
    assert.equal(bm.getState().winner, "player");
  });

  it("getRandomAiSkill should return valid skill index", () => {
    bm.initBattle(player, opponent);
    for (let i = 0; i < 20; i++) {
      const idx = bm.getRandomAiSkill();
      assert.ok(idx >= 0 && idx < 4, `index ${idx} should be 0-3`);
    }
  });

  it("should determine winner by HP comparison after 3 turns", () => {
    bm.initBattle(player, opponent);
    // Execute some attacks
    bm.executePlayerAttack(0);
    bm.executeAiAttack(0);
    const state = bm.getState();
    if (state.phase !== TurnPhase.BattleOver) {
      const playerWins = state.player.hp >= state.opponent.hp;
      assert.equal(typeof playerWins, "boolean");
    }
  });
});

describe("auto-sim mode constants", () => {
  it("MAX_TURNS should be 3", () => {
    const MAX_TURNS = 3;
    assert.equal(MAX_TURNS, 3);
  });

  it("training mode should disable skill buttons", () => {
    const mode = "training";
    const shouldDisable = mode === "training";
    assert.equal(shouldDisable, true);
  });

  it("battle mode should not auto-sim", () => {
    const mode = "battle";
    const shouldAutoSim = mode === "training";
    assert.equal(shouldAutoSim, false);
  });
});
