import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { MechType } from "../src/types/game";
import {
  PROJECTILE_COLORS,
  getProjectileColors,
} from "../src/utils/projectileColors";

describe("getProjectileColors", () => {
  it("should return fire colors for fire type", () => {
    const colors = getProjectileColors(MechType.Fire);
    assert.deepEqual(colors, PROJECTILE_COLORS[MechType.Fire]);
    assert.equal(colors.core, 0xffaa00);
    assert.equal(colors.glow, 0xff4500);
    assert.equal(colors.trail, 0xff6600);
  });

  it("should return water colors for water type", () => {
    const colors = getProjectileColors(MechType.Water);
    assert.deepEqual(colors, PROJECTILE_COLORS[MechType.Water]);
    assert.equal(colors.core, 0x00ddff);
    assert.equal(colors.glow, 0x1e90ff);
    assert.equal(colors.trail, 0x4db8ff);
  });

  it("should return electric colors for electric type", () => {
    const colors = getProjectileColors(MechType.Electric);
    assert.deepEqual(colors, PROJECTILE_COLORS[MechType.Electric]);
    assert.equal(colors.core, 0xffff00);
    assert.equal(colors.glow, 0xffd700);
    assert.equal(colors.trail, 0xffed4a);
  });

  it("should fall back to fire colors for unknown type", () => {
    const colors = getProjectileColors("unknown");
    assert.deepEqual(colors, PROJECTILE_COLORS[MechType.Fire]);
  });

  it("should fall back to fire colors for empty string", () => {
    const colors = getProjectileColors("");
    assert.deepEqual(colors, PROJECTILE_COLORS[MechType.Fire]);
  });

  it("should return an object with core, glow, and trail keys", () => {
    for (const type of [MechType.Fire, MechType.Water, MechType.Electric]) {
      const colors = getProjectileColors(type);
      assert.ok("core" in colors, `${type} missing core`);
      assert.ok("glow" in colors, `${type} missing glow`);
      assert.ok("trail" in colors, `${type} missing trail`);
      assert.equal(typeof colors.core, "number");
      assert.equal(typeof colors.glow, "number");
      assert.equal(typeof colors.trail, "number");
    }
  });

  it("should cover all MechType values in PROJECTILE_COLORS", () => {
    for (const type of Object.values(MechType)) {
      assert.ok(
        PROJECTILE_COLORS[type] !== undefined,
        `Missing color entry for ${type}`,
      );
    }
  });
});
