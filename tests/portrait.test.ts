import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { getPortraitState } from "../src/utils/portraitState";

describe("getPortraitState", () => {
  it("should return 'normal' when HP > 50%", () => {
    assert.equal(getPortraitState(1.0, false), "normal");
    assert.equal(getPortraitState(0.75, false), "normal");
    assert.equal(getPortraitState(0.51, false), "normal");
  });

  it("should return 'angry' when HP is 25%-50%", () => {
    assert.equal(getPortraitState(0.5, false), "angry");
    assert.equal(getPortraitState(0.4, false), "angry");
    assert.equal(getPortraitState(0.26, false), "angry");
  });

  it("should return 'defeated' when HP <= 25%", () => {
    assert.equal(getPortraitState(0.25, false), "defeated");
    assert.equal(getPortraitState(0.1, false), "defeated");
    assert.equal(getPortraitState(0.0, false), "defeated");
  });

  it("should return 'defeated' when isDefeated is true regardless of HP", () => {
    assert.equal(getPortraitState(1.0, true), "defeated");
    assert.equal(getPortraitState(0.75, true), "defeated");
    assert.equal(getPortraitState(0.5, true), "defeated");
  });

  it("should return 'defeated' for negative HP ratio", () => {
    assert.equal(getPortraitState(-0.1, false), "defeated");
  });

  it("should handle exact boundary values", () => {
    // Exactly 0.5 -> angry
    assert.equal(getPortraitState(0.5, false), "angry");
    // Exactly 0.25 -> defeated
    assert.equal(getPortraitState(0.25, false), "defeated");
    // Just above 0.5 -> normal
    assert.equal(getPortraitState(0.501, false), "normal");
    // Just above 0.25 -> angry
    assert.equal(getPortraitState(0.251, false), "angry");
  });
});
