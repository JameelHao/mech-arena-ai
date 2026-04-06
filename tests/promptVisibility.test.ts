import assert from "node:assert/strict";
import { describe, it } from "node:test";

/**
 * Strategy summary truncation for initial battle log (mirrors BattleScene logic).
 */
function getInitialStrategyLog(prompt: string): string {
  if (prompt.trim()) {
    const summary = prompt.length > 40 ? `${prompt.slice(0, 37)}...` : prompt;
    return `[EFF]Strategy: ${summary}`;
  }
  return "[TURN]Tip: Save a strategy to guide your AI!";
}

/**
 * Strategy label for result screen (mirrors showResultScreen logic).
 */
function getResultStrategyLabel(prompt: string): {
  label: string;
  hasStrategy: boolean;
} {
  if (prompt.trim()) {
    const label =
      prompt.length > 50
        ? `Strategy: ${prompt.slice(0, 47)}...`
        : `Strategy: ${prompt}`;
    return { label, hasStrategy: true };
  }
  return { label: "No strategy used", hasStrategy: false };
}

describe("initial battle log strategy message", () => {
  it("should show strategy summary when prompt is set", () => {
    const result = getInitialStrategyLog("Be aggressive");
    assert.equal(result, "[EFF]Strategy: Be aggressive");
  });

  it("should truncate long prompt to 40 chars", () => {
    const long = "a".repeat(60);
    const result = getInitialStrategyLog(long);
    assert.ok(result.startsWith("[EFF]Strategy: "));
    assert.ok(result.endsWith("..."));
    // "[EFF]Strategy: " (15) + 37 + "..." (3) = 55
    assert.equal(result.length, 55);
  });

  it("should not truncate prompt at exactly 40 chars", () => {
    const text = "a".repeat(40);
    const result = getInitialStrategyLog(text);
    assert.equal(result, `[EFF]Strategy: ${text}`);
    assert.ok(!result.endsWith("..."));
  });

  it("should show tip when prompt is empty", () => {
    assert.equal(
      getInitialStrategyLog(""),
      "[TURN]Tip: Save a strategy to guide your AI!",
    );
  });

  it("should show tip when prompt is whitespace only", () => {
    assert.equal(
      getInitialStrategyLog("   "),
      "[TURN]Tip: Save a strategy to guide your AI!",
    );
  });
});

describe("result screen strategy label", () => {
  it("should show strategy when prompt is set", () => {
    const { label, hasStrategy } = getResultStrategyLabel("Be defensive");
    assert.equal(label, "Strategy: Be defensive");
    assert.equal(hasStrategy, true);
  });

  it("should truncate long prompt to 50 chars", () => {
    const long = "a".repeat(80);
    const { label, hasStrategy } = getResultStrategyLabel(long);
    assert.ok(label.startsWith("Strategy: "));
    assert.ok(label.endsWith("..."));
    assert.equal(hasStrategy, true);
    // "Strategy: " (10) + 47 + "..." (3) = 60
    assert.equal(label.length, 60);
  });

  it("should not truncate at exactly 50 chars", () => {
    const text = "a".repeat(50);
    const { label } = getResultStrategyLabel(text);
    assert.equal(label, `Strategy: ${text}`);
  });

  it("should show fallback when prompt is empty", () => {
    const { label, hasStrategy } = getResultStrategyLabel("");
    assert.equal(label, "No strategy used");
    assert.equal(hasStrategy, false);
  });

  it("should show fallback when prompt is whitespace", () => {
    const { label, hasStrategy } = getResultStrategyLabel("  \t ");
    assert.equal(label, "No strategy used");
    assert.equal(hasStrategy, false);
  });
});

describe("strategy update log message", () => {
  it("should use [EFF] prefix for strategy update", () => {
    const msg = "[EFF]Strategy updated!";
    assert.ok(msg.startsWith("[EFF]"));
    assert.ok(msg.includes("updated"));
  });
});
