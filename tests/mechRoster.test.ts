import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { MECH_ROSTER, OPPONENT_MECH, PLAYER_MECH } from "../src/data/mechs";
import { MechType } from "../src/types/game";

describe("MECH_ROSTER", () => {
  it("should contain at least 3 mechs", () => {
    assert.ok(MECH_ROSTER.length >= 3);
  });

  it("each mech should have required fields", () => {
    for (const mech of MECH_ROSTER) {
      assert.ok(mech.name);
      assert.ok(mech.type);
      assert.equal(typeof mech.hp, "number");
      assert.equal(typeof mech.maxHp, "number");
      assert.ok(mech.skills.length >= 1);
    }
  });

  it("should contain all three types", () => {
    const types = new Set(MECH_ROSTER.map((m) => m.type));
    assert.ok(types.has(MechType.Fire));
    assert.ok(types.has(MechType.Water));
    assert.ok(types.has(MechType.Electric));
  });

  it("each mech should have 4 skills", () => {
    for (const mech of MECH_ROSTER) {
      assert.equal(mech.skills.length, 4);
    }
  });

  it("each mech should have codename and role", () => {
    for (const mech of MECH_ROSTER) {
      assert.ok(mech.codename, `${mech.type} mech missing codename`);
      assert.ok(mech.role, `${mech.type} mech missing role`);
    }
  });

  it("codenames should be unique", () => {
    const names = MECH_ROSTER.map((m) => m.codename);
    assert.equal(new Set(names).size, names.length);
  });

  it("all mechs should have distinct types", () => {
    const types = MECH_ROSTER.map((m) => m.type);
    assert.equal(new Set(types).size, types.length);
  });
});

describe("PLAYER_MECH default", () => {
  it("should be the first roster mech", () => {
    assert.deepStrictEqual(PLAYER_MECH, MECH_ROSTER[0]);
  });
});

describe("OPPONENT_MECH", () => {
  it("should have Water type", () => {
    assert.equal(OPPONENT_MECH.type, MechType.Water);
  });

  it("should have VENOM BATTALION codename", () => {
    assert.equal(OPPONENT_MECH.codename, "VENOM BATTALION");
  });
});

describe("mech roster balance", () => {
  it("FALCON UNIT (Fire) should have highest single-hit damage", () => {
    const falcon = MECH_ROSTER.find((m) => m.codename === "FALCON UNIT");
    assert.ok(falcon);
    const maxDmg = Math.max(...falcon.skills.map((s) => s.damage));
    assert.equal(maxDmg, 40);
  });

  it("HYDRA SENTINEL (Water) should have highest HP", () => {
    const hydra = MECH_ROSTER.find((m) => m.codename === "HYDRA SENTINEL");
    assert.ok(hydra);
    assert.ok(hydra.maxHp >= 120);
  });

  it("VOLT STRIKER (Electric) should have highest primary skill damage", () => {
    const volt = MECH_ROSTER.find((m) => m.codename === "VOLT STRIKER");
    assert.ok(volt);
    const maxDmg = Math.max(...volt.skills.map((s) => s.damage));
    assert.equal(maxDmg, 45);
  });

  it("VOLT STRIKER should have lowest HP to balance burst damage", () => {
    const volt = MECH_ROSTER.find((m) => m.codename === "VOLT STRIKER");
    assert.ok(volt);
    const minHp = Math.min(...MECH_ROSTER.map((m) => m.maxHp));
    assert.equal(volt.maxHp, minHp);
  });
});
