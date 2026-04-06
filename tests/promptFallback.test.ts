import assert from "node:assert/strict";
import { describe, it } from "node:test";

describe("prompt strategy fallback logic", () => {
  function getAiFallbackLog(
    hasPrompt: boolean,
    isOnline: boolean,
    apiResult: { move: number; reasoning?: string } | null,
  ): { useRandom: boolean; logMessage?: string } {
    if (hasPrompt && isOnline) {
      if (apiResult) {
        return { useRandom: false };
      }
      return {
        useRandom: true,
        logMessage: "[TURN]Strategy offline \u2014 using random AI",
      };
    }
    return { useRandom: true };
  }

  it("should use API result when available", () => {
    const result = getAiFallbackLog(true, true, {
      move: 0,
      reasoning: "test",
    });
    assert.equal(result.useRandom, false);
    assert.equal(result.logMessage, undefined);
  });

  it("should fall back to random when API returns null", () => {
    const result = getAiFallbackLog(true, true, null);
    assert.equal(result.useRandom, true);
    assert.ok(result.logMessage);
    assert.ok(result.logMessage.includes("offline"));
    assert.ok(result.logMessage.includes("random"));
  });

  it("should use random without fallback message when no prompt", () => {
    const result = getAiFallbackLog(false, true, null);
    assert.equal(result.useRandom, true);
    assert.equal(result.logMessage, undefined);
  });

  it("should use random without fallback message when offline", () => {
    const result = getAiFallbackLog(true, false, null);
    assert.equal(result.useRandom, true);
    assert.equal(result.logMessage, undefined);
  });

  it("fallback message should use [TURN] prefix for gray color", () => {
    const result = getAiFallbackLog(true, true, null);
    assert.ok(result.logMessage?.startsWith("[TURN]"));
  });

  it("should not show fallback when prompt is empty and offline", () => {
    const result = getAiFallbackLog(false, false, null);
    assert.equal(result.useRandom, true);
    assert.equal(result.logMessage, undefined);
  });
});
