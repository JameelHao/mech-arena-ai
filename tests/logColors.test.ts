import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  LOG_COLORS,
  LOG_MAX_LINES,
  parseLogMessage,
} from "../src/utils/logColors";

describe("parseLogMessage", () => {
  it("should strip [DMG] prefix and return gold color", () => {
    const result = parseLogMessage("[DMG] Fire deals 25 damage!");
    assert.equal(result.displayMsg, " Fire deals 25 damage!");
    assert.equal(result.color, "#ffd700");
  });

  it("should strip [EFF] prefix and return green color", () => {
    const result = parseLogMessage("[EFF] Defense activated");
    assert.equal(result.displayMsg, " Defense activated");
    assert.equal(result.color, "#00ff88");
  });

  it("should strip [TURN] prefix and return gray color", () => {
    const result = parseLogMessage("[TURN] Turn 3 begins");
    assert.equal(result.displayMsg, " Turn 3 begins");
    assert.equal(result.color, "#888888");
  });

  it("should strip [SUP] prefix and return red color", () => {
    const result = parseLogMessage("[SUP] Super effective!");
    assert.equal(result.displayMsg, " Super effective!");
    assert.equal(result.color, "#ff6666");
  });

  it("should strip [RES] prefix and return blue color", () => {
    const result = parseLogMessage("[RES] Not very effective...");
    assert.equal(result.displayMsg, " Not very effective...");
    assert.equal(result.color, "#66ccff");
  });

  it("should return accent color for messages without a known prefix", () => {
    const result = parseLogMessage("Battle started!");
    assert.equal(result.displayMsg, "Battle started!");
    assert.equal(result.color, "#00ff88");
  });

  it("should handle empty message", () => {
    const result = parseLogMessage("");
    assert.equal(result.displayMsg, "");
    assert.equal(result.color, "#00ff88");
  });

  it("should match only the first prefix when message contains multiple", () => {
    const result = parseLogMessage("[DMG][SUP] Critical hit!");
    assert.equal(result.displayMsg, "[SUP] Critical hit!");
    assert.equal(result.color, "#ffd700");
  });
});

describe("LOG_COLORS", () => {
  it("should have 5 color entries", () => {
    assert.equal(Object.keys(LOG_COLORS).length, 5);
  });

  it("all values should be valid hex color strings", () => {
    for (const [prefix, color] of Object.entries(LOG_COLORS)) {
      assert.match(
        color,
        /^#[0-9a-f]{6}$/,
        `${prefix} color should be a valid hex color`,
      );
    }
  });
});

describe("LOG_MAX_LINES", () => {
  it("should be 12", () => {
    assert.equal(LOG_MAX_LINES, 12);
  });
});
