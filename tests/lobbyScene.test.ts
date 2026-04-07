import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { OPPONENT_MECH, PLAYER_MECH } from "../src/data/mechs";
import { MechType } from "../src/types/game";

describe("shared mech definitions", () => {
  it("PLAYER_MECH should be Fire type", () => {
    assert.equal(PLAYER_MECH.type, MechType.Kinetic);
  });

  it("OPPONENT_MECH should be Water type", () => {
    assert.equal(OPPONENT_MECH.type, MechType.Beam);
  });

  it("both mechs should have 100 HP", () => {
    assert.equal(PLAYER_MECH.hp, 100);
    assert.equal(PLAYER_MECH.maxHp, 100);
    assert.equal(OPPONENT_MECH.hp, 100);
    assert.equal(OPPONENT_MECH.maxHp, 100);
  });

  it("both mechs should have 4 skills", () => {
    assert.equal(PLAYER_MECH.skills.length, 4);
    assert.equal(OPPONENT_MECH.skills.length, 4);
  });

  it("player mech should have names", () => {
    assert.ok(PLAYER_MECH.name.length > 0);
    assert.ok(OPPONENT_MECH.name.length > 0);
  });

  it("player and opponent should have different types", () => {
    assert.notEqual(PLAYER_MECH.type, OPPONENT_MECH.type);
  });

  it("each skill should have name, type, and damage", () => {
    for (const skill of PLAYER_MECH.skills) {
      assert.equal(typeof skill.name, "string");
      assert.ok(skill.name.length > 0);
      assert.equal(typeof skill.type, "string");
      assert.equal(typeof skill.damage, "number");
    }
  });
});

describe("lobby strategy preview logic", () => {
  function getStrategyPreview(prompt: string): {
    label: string;
    hasStrategy: boolean;
  } {
    if (prompt.trim()) {
      const summary = prompt.length > 60 ? `${prompt.slice(0, 57)}...` : prompt;
      return { label: `\u26A1 Strategy: ${summary}`, hasStrategy: true };
    }
    return {
      label: "No strategy set \u2014 enter one in battle to guide your AI",
      hasStrategy: false,
    };
  }

  it("should show strategy when prompt is set", () => {
    const { label, hasStrategy } = getStrategyPreview("Be aggressive");
    assert.ok(label.includes("Be aggressive"));
    assert.equal(hasStrategy, true);
  });

  it("should truncate long prompt", () => {
    const { label } = getStrategyPreview("a".repeat(80));
    assert.ok(label.endsWith("..."));
  });

  it("should show guidance when prompt is empty", () => {
    const { label, hasStrategy } = getStrategyPreview("");
    assert.ok(label.includes("No strategy set"));
    assert.equal(hasStrategy, false);
  });

  it("should show guidance for whitespace-only prompt", () => {
    const { hasStrategy } = getStrategyPreview("   ");
    assert.equal(hasStrategy, false);
  });
});

describe("lobby skill preview logic", () => {
  function formatSkillInfo(skill: {
    name: string;
    type: string;
    damage: number;
  }): string {
    return skill.damage > 0
      ? `${skill.type.toUpperCase()} \u00B7 ${skill.damage} DMG`
      : "BUFF \u00B7 DEF +50%";
  }

  it("should format attack skill info", () => {
    assert.equal(
      formatSkillInfo(PLAYER_MECH.skills[0]),
      "KINETIC \u00B7 40 DMG",
    );
  });

  it("should format defense skill info", () => {
    assert.equal(
      formatSkillInfo(PLAYER_MECH.skills[3]),
      "BUFF \u00B7 DEF +50%",
    );
  });

  it("should format water skill info", () => {
    assert.equal(formatSkillInfo(PLAYER_MECH.skills[1]), "BEAM \u00B7 30 DMG");
  });
});
