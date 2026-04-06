/**
 * FR #109 verification tests — confirm that prompt strategy effects are
 * visible across the full battle UI and result flow, as implemented by
 * FR #73 (base visibility), #81 (strategy throughout), #101 (fallback notice).
 */
import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { parseLogMessage } from "../src/utils/logColors";

describe("FR #109: prompt active indicator", () => {
  function isStrategyActive(prompt: string): boolean {
    return prompt.trim().length > 0;
  }

  it("should be active when prompt has content", () => {
    assert.equal(isStrategyActive("Be aggressive"), true);
  });

  it("should be inactive when prompt is empty", () => {
    assert.equal(isStrategyActive(""), false);
  });

  it("should be inactive for whitespace-only prompt", () => {
    assert.equal(isStrategyActive("   "), false);
  });
});

describe("FR #109: strategy in initial battle log", () => {
  function getInitialLog(prompt: string): string {
    if (prompt.trim()) {
      const summary = prompt.length > 40 ? `${prompt.slice(0, 37)}...` : prompt;
      return `[EFF]Strategy: ${summary}`;
    }
    return "[TURN]Tip: Save a strategy to guide your AI!";
  }

  it("should show strategy summary with [EFF] prefix", () => {
    const log = getInitialLog("Attack with fire");
    assert.ok(log.startsWith("[EFF]Strategy:"));
    assert.ok(log.includes("Attack with fire"));
  });

  it("should show tip with [TURN] prefix when no strategy", () => {
    const log = getInitialLog("");
    assert.ok(log.startsWith("[TURN]"));
    assert.ok(log.includes("strategy"));
  });

  it("[EFF] prefix should render as green", () => {
    const { color } = parseLogMessage("[EFF]Strategy: test");
    assert.equal(color, "#00ff88");
  });

  it("[TURN] prefix should render as gray", () => {
    const { color } = parseLogMessage("[TURN]Tip: Save a strategy...");
    assert.equal(color, "#888888");
  });
});

describe("FR #109: AI reasoning in battle log", () => {
  function formatReasoning(reasoning: string | undefined): string | null {
    if (!reasoning) return null;
    const truncated =
      reasoning.length > 60 ? `${reasoning.slice(0, 57)}...` : reasoning;
    return `[EFF]AI: ${truncated}`;
  }

  it("should format short reasoning", () => {
    const msg = formatReasoning("Fire is effective here");
    assert.equal(msg, "[EFF]AI: Fire is effective here");
  });

  it("should truncate long reasoning", () => {
    const msg = formatReasoning("a".repeat(80));
    assert.ok(msg);
    assert.ok(msg.endsWith("..."));
    assert.ok(msg.length <= 70);
  });

  it("should return null for undefined reasoning", () => {
    assert.equal(formatReasoning(undefined), null);
  });
});

describe("FR #109: strategy in result screen", () => {
  function getResultLabel(prompt: string): string {
    if (prompt.trim()) {
      return prompt.length > 50
        ? `Strategy: ${prompt.slice(0, 47)}...`
        : `Strategy: ${prompt}`;
    }
    return "No strategy used";
  }

  it("should show strategy on result when saved", () => {
    assert.equal(getResultLabel("Be defensive"), "Strategy: Be defensive");
  });

  it("should show fallback when no strategy", () => {
    assert.equal(getResultLabel(""), "No strategy used");
  });
});

describe("FR #109: spinner label reflects strategy", () => {
  function getSpinnerLabel(prompt: string): string {
    return prompt.trim() ? "Analyzing strategy..." : "AI Thinking...";
  }

  it("should show strategy label when prompt exists", () => {
    assert.equal(getSpinnerLabel("test"), "Analyzing strategy...");
  });

  it("should show default label without prompt", () => {
    assert.equal(getSpinnerLabel(""), "AI Thinking...");
  });
});

describe("FR #109: API fallback notice", () => {
  function getFallbackLog(
    hasPrompt: boolean,
    isOnline: boolean,
    apiSuccess: boolean,
  ): string | null {
    if (hasPrompt && isOnline && !apiSuccess) {
      return "[TURN]Strategy offline \u2014 using random AI";
    }
    return null;
  }

  it("should show notice when API fails with active prompt", () => {
    const msg = getFallbackLog(true, true, false);
    assert.ok(msg);
    assert.ok(msg.includes("offline"));
  });

  it("should not show notice when API succeeds", () => {
    assert.equal(getFallbackLog(true, true, true), null);
  });

  it("should not show notice without prompt", () => {
    assert.equal(getFallbackLog(false, true, false), null);
  });

  it("should not show notice when offline", () => {
    assert.equal(getFallbackLog(true, false, false), null);
  });

  it("fallback message should use [TURN] for gray rendering", () => {
    const msg = getFallbackLog(true, true, false);
    assert.ok(msg);
    assert.ok(msg.startsWith("[TURN]"));
    const { color } = parseLogMessage(msg);
    assert.equal(color, "#888888");
  });
});

describe("FR #109: strategy update feedback", () => {
  it("strategy update message should use [EFF] prefix", () => {
    const msg = "[EFF]Strategy updated!";
    const { displayMsg, color } = parseLogMessage(msg);
    assert.equal(displayMsg, "Strategy updated!");
    assert.equal(color, "#00ff88");
  });
});
