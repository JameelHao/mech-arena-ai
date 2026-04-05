import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  BATTLE_BG_TINT,
  EDGE_OVERLAY_ALPHA,
  GROUND_TINT,
  TRANSITION_HEIGHT_RATIO,
  TRANSITION_MIN_HEIGHT,
  computeBackgroundLayout,
} from "../src/utils/backgroundConfig";

describe("computeBackgroundLayout", () => {
  it("should center the background image", () => {
    const layout = computeBackgroundLayout(800, 600);
    assert.equal(layout.bgX, 400);
    assert.equal(layout.bgY, 300);
    assert.equal(layout.bgW, 800);
    assert.equal(layout.bgH, 600);
  });

  it("should position ground at the bottom of the screen", () => {
    const layout = computeBackgroundLayout(800, 600);
    const expectedH = 600 * 0.15; // 90
    const expectedY = 600 - expectedH / 2;
    assert.equal(layout.groundH, expectedH);
    assert.equal(layout.groundY, expectedY);
    assert.equal(layout.groundW, 800);
    assert.equal(layout.groundX, 400);
  });

  it("should enforce minimum ground height of 80px", () => {
    const layout = computeBackgroundLayout(400, 400);
    // 400 * 0.15 = 60, but minimum is 80
    assert.equal(layout.groundH, 80);
    assert.equal(layout.groundY, 400 - 40);
  });

  it("should scale ground proportionally for large screens", () => {
    const layout = computeBackgroundLayout(1920, 1080);
    // 1080 * 0.15 = 162
    assert.equal(layout.groundH, 162);
  });

  it("should handle very small screens", () => {
    const layout = computeBackgroundLayout(320, 480);
    assert.equal(layout.bgW, 320);
    assert.equal(layout.bgH, 480);
    // 480 * 0.15 = 72, min 80 applies
    assert.equal(layout.groundH, 80);
  });
});

describe("transition zone layout", () => {
  it("should compute transitionY above ground top edge", () => {
    const layout = computeBackgroundLayout(800, 600);
    const groundTopY = 600 - layout.groundH;
    assert.equal(layout.transitionY, groundTopY - layout.transitionH);
    assert.ok(layout.transitionY < groundTopY);
  });

  it("should enforce minimum transition height", () => {
    // Small screen: 400 * 0.05 = 20, below min 30
    const layout = computeBackgroundLayout(400, 400);
    assert.equal(layout.transitionH, TRANSITION_MIN_HEIGHT);
  });

  it("should scale transition proportionally for large screens", () => {
    const layout = computeBackgroundLayout(1920, 1080);
    // 1080 * 0.05 = 54 > 30
    assert.equal(layout.transitionH, 1080 * TRANSITION_HEIGHT_RATIO);
  });

  it("transition zone should not overlap with background center", () => {
    const layout = computeBackgroundLayout(800, 600);
    // transitionY should be in lower half of screen (above ground)
    assert.ok(layout.transitionY > layout.bgY * 0.5);
  });

  it("transition zone should sit flush against ground top", () => {
    const layout = computeBackgroundLayout(1024, 768);
    const groundTopY = 768 - layout.groundH;
    assert.equal(layout.transitionY + layout.transitionH, groundTopY);
  });
});

describe("BATTLE_BG_TINT", () => {
  it("should be a darkening tint value (less than 0xffffff)", () => {
    assert.ok(BATTLE_BG_TINT < 0xffffff);
    assert.ok(BATTLE_BG_TINT > 0x000000);
  });
});

describe("GROUND_TINT", () => {
  it("should be brighter than BATTLE_BG_TINT but still darkened", () => {
    assert.ok(GROUND_TINT > BATTLE_BG_TINT);
    assert.ok(GROUND_TINT < 0xffffff);
  });
});

describe("EDGE_OVERLAY_ALPHA", () => {
  it("should be a valid alpha value between 0 and 1", () => {
    assert.ok(EDGE_OVERLAY_ALPHA > 0);
    assert.ok(EDGE_OVERLAY_ALPHA <= 1);
  });
});
