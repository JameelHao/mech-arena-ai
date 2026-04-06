import assert from "node:assert/strict";
import { describe, it } from "node:test";

/**
 * Reasoning truncation logic (mirrors BattleScene inline logic).
 * Extracted here for testability.
 */
function truncateReasoning(reasoning: string, maxLen = 60): string {
  if (reasoning.length > maxLen) {
    return `${reasoning.slice(0, maxLen - 3)}...`;
  }
  return reasoning;
}

/**
 * Spinner label logic (mirrors BattleScene.showSpinner).
 */
function getSpinnerLabel(mechPrompt: string): string {
  return mechPrompt.trim() ? "Analyzing strategy..." : "AI Thinking...";
}

/**
 * Strategy indicator visibility logic (mirrors createPromptUI).
 */
function isStrategyActive(mechPrompt: string): boolean {
  return mechPrompt.trim().length > 0;
}

describe("prompt strategy visibility", () => {
  describe("reasoning truncation", () => {
    it("should not truncate short reasoning", () => {
      assert.equal(truncateReasoning("Use fire attack"), "Use fire attack");
    });

    it("should not truncate exactly 60 chars", () => {
      const text = "a".repeat(60);
      assert.equal(truncateReasoning(text), text);
    });

    it("should truncate reasoning longer than 60 chars", () => {
      const long = "a".repeat(80);
      const result = truncateReasoning(long);
      assert.equal(result.length, 60);
      assert.ok(result.endsWith("..."));
    });

    it("should preserve content before truncation point", () => {
      const text =
        "Using fire blast because opponent is weak to fire type attacks and this maximizes damage output significantly";
      const result = truncateReasoning(text);
      assert.ok(result.startsWith("Using fire blast"));
      assert.ok(result.endsWith("..."));
      assert.equal(result.length, 60);
    });

    it("should handle empty string", () => {
      assert.equal(truncateReasoning(""), "");
    });

    it("should handle single character", () => {
      assert.equal(truncateReasoning("x"), "x");
    });
  });

  describe("spinner label", () => {
    it("should show 'Analyzing strategy...' when prompt is set", () => {
      assert.equal(getSpinnerLabel("Be aggressive"), "Analyzing strategy...");
    });

    it("should show 'AI Thinking...' when prompt is empty", () => {
      assert.equal(getSpinnerLabel(""), "AI Thinking...");
    });

    it("should show 'AI Thinking...' when prompt is whitespace only", () => {
      assert.equal(getSpinnerLabel("   "), "AI Thinking...");
    });

    it("should show 'Analyzing strategy...' for any non-empty prompt", () => {
      assert.equal(getSpinnerLabel("x"), "Analyzing strategy...");
    });
  });

  describe("strategy indicator", () => {
    it("should be active when prompt has content", () => {
      assert.equal(isStrategyActive("Be defensive"), true);
    });

    it("should be inactive when prompt is empty", () => {
      assert.equal(isStrategyActive(""), false);
    });

    it("should be inactive when prompt is whitespace only", () => {
      assert.equal(isStrategyActive("   \t\n  "), false);
    });

    it("should be active for single-character prompt", () => {
      assert.equal(isStrategyActive("x"), true);
    });
  });

  describe("reasoning log format", () => {
    it("should format reasoning as [EFF] prefixed log message", () => {
      const reasoning = "Fire is effective";
      const logMsg = `[EFF]AI: ${truncateReasoning(reasoning)}`;
      assert.equal(logMsg, "[EFF]AI: Fire is effective");
    });

    it("should format truncated reasoning correctly", () => {
      const reasoning = "a".repeat(80);
      const logMsg = `[EFF]AI: ${truncateReasoning(reasoning)}`;
      assert.ok(logMsg.startsWith("[EFF]AI: "));
      assert.ok(logMsg.endsWith("..."));
    });
  });
});
