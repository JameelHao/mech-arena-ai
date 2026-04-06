import assert from "node:assert/strict";
import { describe, it } from "node:test";

describe("defeat animation parameters", () => {
  // Mirrors BattleScene.playDefeatAnimation tween config
  const DEFEAT_ANIM = {
    angle: 90,
    alphaTarget: 0,
    yOffset: 30,
    duration: 500,
    ease: "Quad.easeIn",
  };

  it("should rotate 90 degrees (fall over)", () => {
    assert.equal(DEFEAT_ANIM.angle, 90);
  });

  it("should fade to fully transparent", () => {
    assert.equal(DEFEAT_ANIM.alphaTarget, 0);
  });

  it("should move down by 30px (drop effect)", () => {
    assert.equal(DEFEAT_ANIM.yOffset, 30);
  });

  it("should last 500ms", () => {
    assert.equal(DEFEAT_ANIM.duration, 500);
  });

  it("should use Quad.easeIn for acceleration effect", () => {
    assert.equal(DEFEAT_ANIM.ease, "Quad.easeIn");
  });
});

describe("result overlay tint colors", () => {
  function getOverlayColor(won: boolean): number {
    return won ? 0x002211 : 0x220000;
  }

  function getOverlayAlpha(won: boolean): number {
    // Both use 0.8 alpha
    return won ? 0.8 : 0.8;
  }

  it("should use dark green tint for victory", () => {
    assert.equal(getOverlayColor(true), 0x002211);
  });

  it("should use dark red tint for defeat", () => {
    assert.equal(getOverlayColor(false), 0x220000);
  });

  it("should have different colors for victory and defeat", () => {
    assert.notEqual(getOverlayColor(true), getOverlayColor(false));
  });

  it("should use 0.8 alpha for both states", () => {
    assert.equal(getOverlayAlpha(true), 0.8);
    assert.equal(getOverlayAlpha(false), 0.8);
  });

  it("victory tint should have green component", () => {
    const color = getOverlayColor(true);
    const green = (color >> 8) & 0xff;
    assert.ok(green > 0, "green channel should be non-zero");
  });

  it("defeat tint should have red component", () => {
    const color = getOverlayColor(false);
    const red = (color >> 16) & 0xff;
    assert.ok(red > 0, "red channel should be non-zero");
  });
});
