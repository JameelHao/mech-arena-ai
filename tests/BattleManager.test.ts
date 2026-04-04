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
      { name: "Fire Blast", type: MechType.Fire, damage: 40 },
      { name: "Water Cannon", type: MechType.Water, damage: 30 },
      { name: "Thunder Shock", type: MechType.Electric, damage: 25 },
      { name: "Iron Defense", type: "defense", damage: 0 },
    ],
  };
}

describe("BattleManager", () => {
  let bm: BattleManager;
  let player: Mech;
  let opponent: Mech;

  beforeEach(() => {
    bm = new BattleManager();
    player = makeMech("PlayerMech", MechType.Fire);
    opponent = makeMech("EnemyMech", MechType.Water);
  });

  describe("initBattle", () => {
    it("should initialize battle state correctly", () => {
      const state = bm.initBattle(player, opponent);
      assert.equal(state.player.name, "PlayerMech");
      assert.equal(state.opponent.name, "EnemyMech");
      assert.equal(state.player.hp, 100);
      assert.equal(state.opponent.hp, 100);
      assert.equal(state.phase, TurnPhase.PlayerTurn);
      assert.equal(state.turnCount, 1);
      assert.equal(state.winner, null);
      assert.ok(state.log.includes("Battle Start!"));
    });

    it("should reset HP to maxHp", () => {
      player.hp = 50;
      const state = bm.initBattle(player, opponent);
      assert.equal(state.player.hp, 100);
    });
  });

  describe("checkTypeEffectiveness", () => {
    it("Fire > Electric (super effective)", () => {
      assert.equal(
        bm.checkTypeEffectiveness(MechType.Fire, MechType.Electric),
        1.5,
      );
    });

    it("Electric > Water (super effective)", () => {
      assert.equal(
        bm.checkTypeEffectiveness(MechType.Electric, MechType.Water),
        1.5,
      );
    });

    it("Water > Fire (super effective)", () => {
      assert.equal(
        bm.checkTypeEffectiveness(MechType.Water, MechType.Fire),
        1.5,
      );
    });

    it("Fire vs Water (not effective)", () => {
      assert.equal(
        bm.checkTypeEffectiveness(MechType.Fire, MechType.Water),
        0.5,
      );
    });

    it("Water vs Electric (not effective)", () => {
      assert.equal(
        bm.checkTypeEffectiveness(MechType.Water, MechType.Electric),
        0.5,
      );
    });

    it("Electric vs Fire (not effective)", () => {
      assert.equal(
        bm.checkTypeEffectiveness(MechType.Electric, MechType.Fire),
        0.5,
      );
    });

    it("same type returns 1x", () => {
      assert.equal(bm.checkTypeEffectiveness(MechType.Fire, MechType.Fire), 1);
    });
  });

  describe("calculateDamage", () => {
    it("should apply super effective multiplier", () => {
      bm.initBattle(player, opponent);
      const skill = { name: "Water Cannon", type: MechType.Water, damage: 30 };
      // Water vs Fire defender → 1.5x → 45
      const fireMech = makeMech("Fire", MechType.Fire);
      const dmg = bm.calculateDamage(skill, opponent, fireMech);
      assert.equal(dmg, 45);
    });

    it("should apply not-effective multiplier", () => {
      bm.initBattle(player, opponent);
      const skill = { name: "Fire Blast", type: MechType.Fire, damage: 40 };
      // Fire vs Water defender → 0.5x → 20
      const waterMech = makeMech("Water", MechType.Water);
      const dmg = bm.calculateDamage(skill, player, waterMech);
      assert.equal(dmg, 20);
    });

    it("defense skill should deal 0 damage", () => {
      bm.initBattle(player, opponent);
      const skill = {
        name: "Iron Defense",
        type: "defense" as const,
        damage: 0,
      };
      const dmg = bm.calculateDamage(skill, player, opponent);
      assert.equal(dmg, 0);
    });
  });

  describe("executePlayerAttack", () => {
    it("should deal damage and move to AiThinking phase", () => {
      bm.initBattle(player, opponent);
      const state = bm.executePlayerAttack(0); // Fire Blast vs Water → 0.5x → 20
      assert.equal(state.opponent.hp, 80);
      assert.equal(state.phase, TurnPhase.AiThinking);
    });

    it("should ignore invalid skill index", () => {
      bm.initBattle(player, opponent);
      const state = bm.executePlayerAttack(99);
      assert.equal(state.opponent.hp, 100);
      assert.equal(state.phase, TurnPhase.PlayerTurn);
    });

    it("should ignore negative skill index", () => {
      bm.initBattle(player, opponent);
      const state = bm.executePlayerAttack(-1);
      assert.equal(state.opponent.hp, 100);
    });

    it("should not execute if not PLAYER_TURN phase", () => {
      const lowHpOpponent = makeMech("Weak", MechType.Electric, 10);
      bm.initBattle(player, lowHpOpponent);
      bm.executePlayerAttack(0); // KO → BattleOver
      const state = bm.executePlayerAttack(0); // Should be ignored
      assert.equal(state.phase, TurnPhase.BattleOver);
    });
  });

  describe("executeAiAttack", () => {
    it("should deal damage and return to PlayerTurn", () => {
      bm.initBattle(player, opponent);
      bm.executePlayerAttack(0); // Move to AiThinking
      // AI skill index 0 = Fire Blast (Fire, 40) vs Fire player → 1.0x → 40
      const state = bm.executeAiAttack(0);
      assert.equal(state.player.hp, 60);
      assert.equal(state.phase, TurnPhase.PlayerTurn);
      assert.equal(state.turnCount, 2);
    });

    it("should clamp out-of-range skill index", () => {
      bm.initBattle(player, opponent);
      bm.executePlayerAttack(0);
      const state = bm.executeAiAttack(99); // Clamped to last skill
      assert.ok(
        state.phase === TurnPhase.PlayerTurn ||
          state.phase === TurnPhase.BattleOver,
      );
    });

    it("should ignore if not AiThinking phase", () => {
      bm.initBattle(player, opponent);
      const state = bm.executeAiAttack(0); // Phase is PlayerTurn, not AiThinking
      assert.equal(state.phase, TurnPhase.PlayerTurn);
      assert.equal(state.player.hp, 100);
    });
  });

  describe("getRandomAiSkill", () => {
    it("should return valid skill index", () => {
      bm.initBattle(player, opponent);
      for (let i = 0; i < 20; i++) {
        const idx = bm.getRandomAiSkill();
        assert.ok(idx >= 0 && idx < opponent.skills.length);
      }
    });
  });

  describe("full turn flow (player + AI)", () => {
    it("should advance through full turn", () => {
      bm.initBattle(player, opponent);
      const afterPlayer = bm.executePlayerAttack(0);
      assert.equal(afterPlayer.phase, TurnPhase.AiThinking);

      const afterAi = bm.executeAiAttack(0);
      assert.ok(
        afterAi.phase === TurnPhase.PlayerTurn ||
          afterAi.phase === TurnPhase.BattleOver,
      );
    });

    it("should increment turn count after full turn", () => {
      bm.initBattle(player, opponent);
      bm.executePlayerAttack(0);
      const state = bm.executeAiAttack(0);
      if (state.phase !== TurnPhase.BattleOver) {
        assert.equal(state.turnCount, 2);
      }
    });
  });

  describe("updateHP", () => {
    it("should clamp HP to 0", () => {
      bm.initBattle(player, opponent);
      bm.updateHP("player", 999);
      assert.equal(bm.getState().player.hp, 0);
    });

    it("should subtract damage correctly", () => {
      bm.initBattle(player, opponent);
      bm.updateHP("opponent", 30);
      assert.equal(bm.getState().opponent.hp, 70);
    });
  });

  describe("checkWin", () => {
    it("should detect player win", () => {
      bm.initBattle(player, opponent);
      bm.updateHP("opponent", 100);
      const result = bm.checkWin();
      assert.equal(result, true);
      assert.equal(bm.getState().winner, "player");
      assert.equal(bm.getState().phase, TurnPhase.BattleOver);
    });

    it("should detect opponent win", () => {
      bm.initBattle(player, opponent);
      bm.updateHP("player", 100);
      const result = bm.checkWin();
      assert.equal(result, true);
      assert.equal(bm.getState().winner, "opponent");
    });

    it("should return false when both alive", () => {
      bm.initBattle(player, opponent);
      assert.equal(bm.checkWin(), false);
      assert.equal(bm.getState().winner, null);
    });
  });

  describe("addLog", () => {
    it("should append messages to log", () => {
      bm.initBattle(player, opponent);
      const initialLen = bm.getState().log.length;
      bm.addLog("Test message");
      assert.equal(bm.getState().log.length, initialLen + 1);
      assert.ok(bm.getState().log.includes("Test message"));
    });
  });

  describe("state machine flow", () => {
    it("should end battle when opponent KO'd on player turn", () => {
      const weakOpponent = makeMech("Weak", MechType.Electric, 1);
      bm.initBattle(player, weakOpponent);
      // Fire vs Electric = 1.5x * 40 = 60 → KO
      const state = bm.executePlayerAttack(0);
      assert.equal(state.phase, TurnPhase.BattleOver);
      assert.equal(state.winner, "player");
      assert.equal(state.opponent.hp, 0);
    });

    it("should end battle when player KO'd on AI turn", () => {
      const weakPlayer = makeMech("Weak", MechType.Fire, 1);
      bm.initBattle(weakPlayer, opponent);
      // Use Iron Defense (index 3, 0 damage) so opponent survives
      bm.executePlayerAttack(3);
      // Water Cannon (index 0) vs Fire → 1.5x * 30 = 45 → KO
      const state = bm.executeAiAttack(0);
      assert.equal(state.phase, TurnPhase.BattleOver);
      assert.equal(state.winner, "opponent");
    });
  });
});
