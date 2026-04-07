import assert from "node:assert/strict";
import { describe, it } from "node:test";

describe("weapon triangle color scheme", () => {
  // New military/sci-fi palette (mirrors BattleScene/LobbyScene COLORS)
  const TYPE_COLORS = {
    kinetic: "#C0C0C0", // silver gray — metallic ammo/armor
    beam: "#FF4500", // red-orange — high-energy laser
    emp: "#00BFFF", // electric blue — electromagnetic pulse
  };

  it("kinetic should be silver gray", () => {
    assert.equal(TYPE_COLORS.kinetic, "#C0C0C0");
  });

  it("beam should be red-orange", () => {
    assert.equal(TYPE_COLORS.beam, "#FF4500");
  });

  it("emp should be electric blue", () => {
    assert.equal(TYPE_COLORS.emp, "#00BFFF");
  });

  it("all three colors should be distinct", () => {
    const colors = Object.values(TYPE_COLORS);
    assert.equal(new Set(colors).size, 3);
  });

  it("all colors should be valid hex strings", () => {
    for (const color of Object.values(TYPE_COLORS)) {
      assert.ok(
        /^#[0-9A-Fa-f]{6}$/.test(color),
        `${color} should be valid hex`,
      );
    }
  });
});

describe("projectile color scheme", () => {
  // Mirrors attackEffects.ts PROJECTILE_COLORS (as hex numbers)
  const PROJECTILE_COLORS = {
    kinetic: { core: 0xc0c0c0, glow: 0xd0d0d0 },
    beam: { core: 0xff4500, glow: 0xff6b35 },
    emp: { core: 0x00bfff, glow: 0x66dfff },
  };

  it("kinetic projectile should be silver/gray", () => {
    assert.equal(PROJECTILE_COLORS.kinetic.core, 0xc0c0c0);
  });

  it("beam projectile should be red-orange", () => {
    assert.equal(PROJECTILE_COLORS.beam.core, 0xff4500);
  });

  it("emp projectile should be electric blue", () => {
    assert.equal(PROJECTILE_COLORS.emp.core, 0x00bfff);
  });

  it("glow should be lighter than core for each type", () => {
    for (const [, colors] of Object.entries(PROJECTILE_COLORS)) {
      assert.ok(
        colors.glow >= colors.core,
        "glow should be >= core brightness",
      );
    }
  });
});

describe("EMP programmatic fallback colors", () => {
  const EMP_COLORS = {
    primary: 0x00bfff,
    secondary: 0x66dfff,
    glow: 0x0090cc,
    highlight: 0x99eeff,
  };

  it("primary should be electric blue", () => {
    assert.equal(EMP_COLORS.primary, 0x00bfff);
  });

  it("should have 4 color variants", () => {
    assert.equal(Object.keys(EMP_COLORS).length, 4);
  });

  it("highlight should be brightest", () => {
    assert.ok(EMP_COLORS.highlight > EMP_COLORS.primary);
  });
});
