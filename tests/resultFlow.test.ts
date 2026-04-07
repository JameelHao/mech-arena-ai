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
      { name: "Fire Blast", type: MechType.Kinetic, damage: 40 },
      { name: "Water Cannon", type: MechType.Beam, damage: 30 },
      { name: "Thunder Shock", type: MechType.Emp, damage: 25 },
      { name: "Iron Defense", type: "defense", damage: 0 },
    ],
  };
}

describe("battle result flow data", () => {
  let bm: BattleManager;
  let player: Mech;
  let opponent: Mech;

  beforeEach(() => {
    bm = new BattleManager();
    player = makeMech("PlayerMech", MechType.Kinetic);
    opponent = makeMech("EnemyMech", MechType.Beam);
  });

  describe("victory state", () => {
    it("should set winner to 'player' when opponent HP reaches 0", () => {
      const weakOpponent = makeMech("Weak", MechType.Emp, 1);
      bm.initBattle(player, weakOpponent);
      const state = bm.executePlayerAttack(0); // Fire vs Electric → 1.5x → 60 → KO
      assert.equal(state.winner, "player");
      assert.equal(state.phase, TurnPhase.BattleOver);
    });

    it("should clamp opponent HP to 0 on overkill", () => {
      const weakOpponent = makeMech("Weak", MechType.Emp, 1);
      bm.initBattle(player, weakOpponent);
      const state = bm.executePlayerAttack(0);
      assert.equal(state.opponent.hp, 0);
    });

    it("should preserve player HP in victory state for summary", () => {
      const weakOpponent = makeMech("Weak", MechType.Emp, 1);
      bm.initBattle(player, weakOpponent);
      const state = bm.executePlayerAttack(0);
      assert.equal(state.player.hp, state.player.maxHp);
      assert.ok(state.player.hp > 0, "player should have HP remaining");
    });

    it("should track turn count for victory summary", () => {
      const weakOpponent = makeMech("Weak", MechType.Emp, 1);
      bm.initBattle(player, weakOpponent);
      const state = bm.executePlayerAttack(0);
      assert.equal(state.turnCount, 1);
    });

    it("should log victory message", () => {
      const weakOpponent = makeMech("Weak", MechType.Emp, 1);
      bm.initBattle(player, weakOpponent);
      const state = bm.executePlayerAttack(0);
      const winLog = state.log.find(
        (m) => m.includes("wins") && m.includes("PlayerMech"),
      );
      assert.ok(winLog, "should log player victory");
    });
  });

  describe("defeat state", () => {
    it("should set winner to 'opponent' when player HP reaches 0", () => {
      const weakPlayer = makeMech("Weak", MechType.Kinetic, 1);
      bm.initBattle(weakPlayer, opponent);
      bm.executePlayerAttack(3); // defense — no damage, move to AI
      const state = bm.executeAiAttack(1); // Water Cannon vs Fire → 1.5x → 45 → KO
      assert.equal(state.winner, "opponent");
      assert.equal(state.phase, TurnPhase.BattleOver);
    });

    it("should clamp player HP to 0 on overkill", () => {
      const weakPlayer = makeMech("Weak", MechType.Kinetic, 1);
      bm.initBattle(weakPlayer, opponent);
      bm.executePlayerAttack(3);
      const state = bm.executeAiAttack(1);
      assert.equal(state.player.hp, 0);
    });

    it("should log defeat message", () => {
      const weakPlayer = makeMech("Weak", MechType.Kinetic, 1);
      bm.initBattle(weakPlayer, opponent);
      bm.executePlayerAttack(3);
      const state = bm.executeAiAttack(1);
      const defeatLog = state.log.find(
        (m) => m.includes("defeated") || m.includes("wins"),
      );
      assert.ok(defeatLog, "should log defeat");
    });
  });

  describe("result summary data availability", () => {
    it("should provide turnCount for summary display", () => {
      bm.initBattle(player, opponent);
      bm.executePlayerAttack(0);
      bm.executeAiAttack(0);
      const state = bm.getState();
      assert.equal(typeof state.turnCount, "number");
      assert.ok(state.turnCount >= 1);
    });

    it("should provide player HP and maxHp for summary", () => {
      bm.initBattle(player, opponent);
      const state = bm.getState();
      assert.equal(typeof state.player.hp, "number");
      assert.equal(typeof state.player.maxHp, "number");
      assert.ok(state.player.maxHp > 0);
    });

    it("should provide opponent HP and maxHp for summary", () => {
      bm.initBattle(player, opponent);
      const state = bm.getState();
      assert.equal(typeof state.opponent.hp, "number");
      assert.equal(typeof state.opponent.maxHp, "number");
      assert.ok(state.opponent.maxHp > 0);
    });

    it("should track turns across multi-turn battle", () => {
      bm.initBattle(player, opponent);
      bm.executePlayerAttack(0);
      bm.executeAiAttack(0);
      bm.executePlayerAttack(0);
      bm.executeAiAttack(0);
      const state = bm.getState();
      assert.equal(state.turnCount, 3);
    });

    it("should distinguish win from loss via winner field", () => {
      const weakOpponent = makeMech("Weak", MechType.Emp, 1);
      bm.initBattle(player, weakOpponent);
      const winState = bm.executePlayerAttack(0);
      assert.equal(winState.winner, "player");

      const bm2 = new BattleManager();
      const weakPlayer = makeMech("Weak", MechType.Kinetic, 1);
      bm2.initBattle(weakPlayer, opponent);
      bm2.executePlayerAttack(3);
      const loseState = bm2.executeAiAttack(1);
      assert.equal(loseState.winner, "opponent");
    });
  });

  describe("battle cannot continue after result", () => {
    it("should not allow player attack after victory", () => {
      const weakOpponent = makeMech("Weak", MechType.Emp, 1);
      bm.initBattle(player, weakOpponent);
      bm.executePlayerAttack(0); // KO
      const state = bm.executePlayerAttack(0); // should be ignored
      assert.equal(state.phase, TurnPhase.BattleOver);
    });

    it("should not allow AI attack after defeat", () => {
      const weakPlayer = makeMech("Weak", MechType.Kinetic, 1);
      bm.initBattle(weakPlayer, opponent);
      bm.executePlayerAttack(3);
      bm.executeAiAttack(1); // KO
      const state = bm.executeAiAttack(0); // should be ignored
      assert.equal(state.phase, TurnPhase.BattleOver);
    });
  });
});
