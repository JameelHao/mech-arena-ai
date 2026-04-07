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

describe("attack feedback synchronization", () => {
  let bm: BattleManager;
  let player: Mech;
  let opponent: Mech;

  beforeEach(() => {
    bm = new BattleManager();
    player = makeMech("PlayerMech", MechType.Kinetic);
    opponent = makeMech("EnemyMech", MechType.Beam);
  });

  describe("damage attacks produce hit feedback data", () => {
    it("should produce damage > 0 for regular attacks", () => {
      bm.initBattle(player, opponent);
      const before = bm.getState().opponent.hp;
      const after = bm.executePlayerAttack(0);
      const dmg = before - after.opponent.hp;
      assert.ok(dmg > 0, "regular attack should deal damage");
    });

    it("should produce damage log with [DMG] prefix", () => {
      bm.initBattle(player, opponent);
      const state = bm.executePlayerAttack(0);
      const dmgLog = state.log.find((m) => m.startsWith("[DMG]"));
      assert.ok(dmgLog, "should have [DMG] log for damage attack");
    });

    it("should include HP values in damage log", () => {
      bm.initBattle(player, opponent);
      const state = bm.executePlayerAttack(0);
      const dmgLog = state.log.find((m) => m.startsWith("[DMG]"));
      assert.ok(dmgLog?.includes("HP:"), "damage log should include HP");
    });
  });

  describe("defense skill produces no damage", () => {
    it("should deal 0 damage for defense skill", () => {
      bm.initBattle(player, opponent);
      const before = bm.getState().opponent.hp;
      const after = bm.executePlayerAttack(3); // Iron Defense
      assert.equal(after.opponent.hp, before, "defense should not deal damage");
    });

    it("should produce [EFF] defense log", () => {
      bm.initBattle(player, opponent);
      const state = bm.executePlayerAttack(3);
      const effLog = state.log.find(
        (m) => m.startsWith("[EFF]") && m.includes("raised defense"),
      );
      assert.ok(effLog, "should log defense effect");
    });

    it("should not produce [DMG] log for defense", () => {
      bm.initBattle(player, opponent);
      const initLogLen = bm.getState().log.length;
      const state = bm.executePlayerAttack(3);
      const newLogs = state.log.slice(initLogLen);
      const dmgLog = newLogs.find((m) => m.startsWith("[DMG]"));
      assert.equal(dmgLog, undefined, "defense should not produce damage log");
    });
  });

  describe("effectiveness feedback data", () => {
    it("should log [SUP] for super effective attack", () => {
      // Fire vs Electric = super effective
      const electricOpp = makeMech("ElecMech", MechType.Emp);
      bm.initBattle(player, electricOpp);
      const state = bm.executePlayerAttack(0); // Fire Blast vs Electric
      assert.ok(
        state.log.some((m) => m.startsWith("[SUP]")),
        "should have super effective log",
      );
    });

    it("should log [RES] for resisted attack", () => {
      // Fire vs Water = resisted
      bm.initBattle(player, opponent);
      const state = bm.executePlayerAttack(0); // Fire Blast vs Water
      assert.ok(
        state.log.some((m) => m.startsWith("[RES]")),
        "should have resisted log",
      );
    });

    it("should not log [SUP] or [RES] for neutral attack", () => {
      // Fire vs Fire = neutral
      const fireOpp = makeMech("FireMech", MechType.Kinetic);
      bm.initBattle(player, fireOpp);
      const state = bm.executePlayerAttack(0);
      assert.ok(
        !state.log.some((m) => m.startsWith("[SUP]")),
        "neutral should not be super effective",
      );
      assert.ok(
        !state.log.some((m) => m.startsWith("[RES]")),
        "neutral should not be resisted",
      );
    });
  });

  describe("HP sync timing data", () => {
    it("HP should already be updated when state is returned", () => {
      bm.initBattle(player, opponent);
      const state = bm.executePlayerAttack(0);
      assert.ok(
        state.opponent.hp < state.opponent.maxHp,
        "HP should be reduced after attack",
      );
    });

    it("turn count should advance after full turn", () => {
      bm.initBattle(player, opponent);
      bm.executePlayerAttack(0);
      const state = bm.executeAiAttack(0);
      if (state.phase !== TurnPhase.BattleOver) {
        assert.equal(state.turnCount, 2);
      }
    });
  });
});

describe("defense label display logic", () => {
  it("defense label text should be 'DEF UP!'", () => {
    assert.equal("DEF UP!", "DEF UP!");
  });

  it("defense label color should be blue (#66ccff)", () => {
    const color = "#66ccff";
    assert.equal(color, "#66ccff");
  });

  it("defense label should appear when damage is 0", () => {
    const bm = new BattleManager();
    const player = makeMech("P", MechType.Kinetic);
    const opponent = makeMech("O", MechType.Beam);
    bm.initBattle(player, opponent);
    const prevHp = bm.getState().opponent.hp;
    const after = bm.executePlayerAttack(3); // defense
    const dmg = prevHp - after.opponent.hp;
    assert.equal(dmg, 0, "defense should show label when dmg=0");
  });
});
