import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { MechType } from "../src/types/game";
import {
  EFFECTIVENESS,
  NOT_EFFECTIVE_MULTIPLIER,
  SUPER_EFFECTIVE_MULTIPLIER,
  getEffectiveness,
} from "../src/utils/BattleManager";

describe("type effectiveness constants", () => {
  it("should have entries for all three types", () => {
    assert.ok(EFFECTIVENESS[MechType.Kinetic]);
    assert.ok(EFFECTIVENESS[MechType.Beam]);
    assert.ok(EFFECTIVENESS[MechType.Emp]);
  });

  it("Fire should be strong against Electric and weak to Water", () => {
    assert.equal(EFFECTIVENESS[MechType.Kinetic].strong, MechType.Emp);
    assert.equal(EFFECTIVENESS[MechType.Kinetic].weak, MechType.Beam);
  });

  it("Water should be strong against Fire and weak to Electric", () => {
    assert.equal(EFFECTIVENESS[MechType.Beam].strong, MechType.Kinetic);
    assert.equal(EFFECTIVENESS[MechType.Beam].weak, MechType.Emp);
  });

  it("Electric should be strong against Water and weak to Fire", () => {
    assert.equal(EFFECTIVENESS[MechType.Emp].strong, MechType.Beam);
    assert.equal(EFFECTIVENESS[MechType.Emp].weak, MechType.Kinetic);
  });

  it("super effective multiplier should be 1.5", () => {
    assert.equal(SUPER_EFFECTIVE_MULTIPLIER, 1.5);
  });

  it("not effective multiplier should be 0.5", () => {
    assert.equal(NOT_EFFECTIVE_MULTIPLIER, 0.5);
  });
});

describe("getEffectiveness", () => {
  it("should return 1.5 for super effective matchups", () => {
    assert.equal(getEffectiveness(MechType.Kinetic, MechType.Emp), 1.5);
    assert.equal(getEffectiveness(MechType.Beam, MechType.Kinetic), 1.5);
    assert.equal(getEffectiveness(MechType.Emp, MechType.Beam), 1.5);
  });

  it("should return 0.5 for not effective matchups", () => {
    assert.equal(getEffectiveness(MechType.Kinetic, MechType.Beam), 0.5);
    assert.equal(getEffectiveness(MechType.Beam, MechType.Emp), 0.5);
    assert.equal(getEffectiveness(MechType.Emp, MechType.Kinetic), 0.5);
  });

  it("should return 1 for neutral matchups", () => {
    assert.equal(getEffectiveness(MechType.Kinetic, MechType.Kinetic), 1);
    assert.equal(getEffectiveness(MechType.Beam, MechType.Beam), 1);
    assert.equal(getEffectiveness(MechType.Emp, MechType.Emp), 1);
  });
});

describe("skill button effectiveness hint logic", () => {
  function getHintLabel(
    skillType: string,
    damage: number,
    defenderType: MechType,
  ): { label: string; isSuper: boolean; isResist: boolean } {
    if (damage <= 0 || skillType === "defense") {
      return { label: "BUFF \u00B7 DEF +50%", isSuper: false, isResist: false };
    }
    const eff = getEffectiveness(skillType as MechType, defenderType);
    if (eff > 1) {
      return {
        label: `${skillType.toUpperCase()} \u00B7 ${damage} DMG  \u25B2 1.5x`,
        isSuper: true,
        isResist: false,
      };
    }
    if (eff < 1) {
      return {
        label: `${skillType.toUpperCase()} \u00B7 ${damage} DMG  \u25BC 0.5x`,
        isSuper: false,
        isResist: true,
      };
    }
    return {
      label: `${skillType.toUpperCase()} \u00B7 ${damage} DMG`,
      isSuper: false,
      isResist: false,
    };
  }

  it("should show ▲ 1.5x for super effective skill", () => {
    const result = getHintLabel("kinetic", 40, MechType.Emp);
    assert.ok(result.label.includes("\u25B2 1.5x"));
    assert.equal(result.isSuper, true);
  });

  it("should show ▼ 0.5x for not effective skill", () => {
    const result = getHintLabel("kinetic", 40, MechType.Beam);
    assert.ok(result.label.includes("\u25BC 0.5x"));
    assert.equal(result.isResist, true);
  });

  it("should show no hint for neutral skill", () => {
    const result = getHintLabel("kinetic", 40, MechType.Kinetic);
    assert.ok(!result.label.includes("\u25B2"));
    assert.ok(!result.label.includes("\u25BC"));
    assert.equal(result.isSuper, false);
    assert.equal(result.isResist, false);
  });

  it("should show BUFF label for defense skill", () => {
    const result = getHintLabel("defense", 0, MechType.Beam);
    assert.equal(result.label, "BUFF \u00B7 DEF +50%");
  });
});

describe("damage number multiplier suffix", () => {
  function getDamageText(
    damage: number,
    eff: "super" | "resist" | "normal",
  ): string {
    const prefix = damage > 0 ? "-" : "";
    const suffix =
      eff === "super" ? " \u00D71.5" : eff === "resist" ? " \u00D70.5" : "";
    return `${prefix}${damage}${suffix}`;
  }

  it("should append ×1.5 for super effective", () => {
    assert.equal(getDamageText(60, "super"), "-60 \u00D71.5");
  });

  it("should append ×0.5 for resisted", () => {
    assert.equal(getDamageText(20, "resist"), "-20 \u00D70.5");
  });

  it("should have no suffix for normal", () => {
    assert.equal(getDamageText(40, "normal"), "-40");
  });
});
