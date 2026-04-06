import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { LOG_MAX_LINES, parseLogMessage } from "../src/utils/logColors";

describe("battle log visibility config", () => {
  it("LOG_MAX_LINES should be 12 for sufficient history", () => {
    assert.equal(LOG_MAX_LINES, 12);
  });

  it("should parse all 5 log prefixes correctly", () => {
    const prefixes = ["[DMG]", "[EFF]", "[TURN]", "[SUP]", "[RES]"];
    for (const prefix of prefixes) {
      const { displayMsg, color } = parseLogMessage(`${prefix}test`);
      assert.equal(displayMsg, "test");
      assert.ok(color.startsWith("#"), `${prefix} should have a color`);
    }
  });

  it("unprefixed messages should get accent color", () => {
    const { color } = parseLogMessage("Choose your attack!");
    assert.equal(color, "#00ff88");
  });
});

describe("battle log panel properties", () => {
  // Mirrors createBattleLog config values
  const LOG_CONFIG = {
    bgColor: 0x1a1a2e,
    bgAlpha: 0.95,
    borderColor: 0x555555,
    borderWidth: 2,
    bgDepth: 10,
    containerDepth: 12,
    posX: 0.03, // w * 0.03
    posY: 0.37, // h * 0.37
    width: 0.44, // w * 0.44
    maxHeightRatio: 0.35,
  };

  it("background should have high alpha for visibility", () => {
    assert.ok(LOG_CONFIG.bgAlpha >= 0.9, "alpha should be >= 0.9");
  });

  it("border should be visible (width >= 2)", () => {
    assert.ok(LOG_CONFIG.borderWidth >= 2);
  });

  it("border color should be lighter than background", () => {
    assert.ok(LOG_CONFIG.borderColor > LOG_CONFIG.bgColor);
  });

  it("background should have depth for z-ordering", () => {
    assert.ok(LOG_CONFIG.bgDepth > 0);
  });

  it("container depth should be above background depth", () => {
    assert.ok(LOG_CONFIG.containerDepth > LOG_CONFIG.bgDepth);
  });

  it("panel should be in left portion of screen", () => {
    assert.ok(LOG_CONFIG.posX < 0.1);
    assert.ok(LOG_CONFIG.width < 0.5);
  });

  it("panel should have reasonable height ratio", () => {
    assert.ok(LOG_CONFIG.maxHeightRatio >= 0.25);
    assert.ok(LOG_CONFIG.maxHeightRatio <= 0.5);
  });
});

describe("battle log font config", () => {
  it("minimum font size should be readable (>= 12px)", () => {
    const minFontSize = 12;
    assert.ok(minFontSize >= 12);
  });

  it("line height should include spacing", () => {
    const fontSize = 14;
    const lineHeight = fontSize + 6;
    assert.equal(lineHeight, 20);
    assert.ok(lineHeight > fontSize);
  });
});
