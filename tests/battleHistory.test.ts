import assert from "node:assert/strict";
import { describe, it } from "node:test";
import type { BattleRecord } from "../src/types/storage";

/**
 * Helper to create a mock BattleRecord.
 */
function makeRecord(overrides?: Partial<BattleRecord>): BattleRecord {
  return {
    id: "test-123",
    timestamp: Date.now(),
    playerMechType: "fire" as BattleRecord["playerMechType"],
    opponentMechType: "water" as BattleRecord["opponentMechType"],
    result: "win",
    turns: 5,
    playerHpLeft: 60,
    opponentHpLeft: 0,
    ...overrides,
  };
}

describe("BattleRecord type", () => {
  it("should support prompt field", () => {
    const record = makeRecord({ prompt: "Be aggressive" });
    assert.equal(record.prompt, "Be aggressive");
  });

  it("should allow prompt to be undefined for backward compat", () => {
    const record = makeRecord();
    assert.equal(record.prompt, undefined);
  });

  it("should store all required battle data", () => {
    const record = makeRecord({
      result: "loss",
      turns: 8,
      playerHpLeft: 0,
      opponentHpLeft: 45,
      prompt: "Use defense when low HP",
    });
    assert.equal(record.result, "loss");
    assert.equal(record.turns, 8);
    assert.equal(record.playerHpLeft, 0);
    assert.equal(record.opponentHpLeft, 45);
    assert.equal(record.prompt, "Use defense when low HP");
  });
});

describe("battle history display logic", () => {
  /**
   * Format HP display string (mirrors HistoryScene row rendering).
   */
  function formatHpDisplay(record: BattleRecord): string {
    return `${record.playerHpLeft}/${record.opponentHpLeft}`;
  }

  /**
   * Format date string (mirrors HistoryScene row rendering).
   */
  function formatDate(timestamp: number): string {
    const date = new Date(timestamp);
    return `${date.getMonth() + 1}/${date.getDate()} ${date.getHours().toString().padStart(2, "0")}:${date.getMinutes().toString().padStart(2, "0")}`;
  }

  /**
   * Truncate prompt for detail panel display.
   */
  function formatPromptDisplay(prompt?: string): string {
    if (!prompt) return "No strategy saved";
    return prompt.length > 80 ? `${prompt.slice(0, 77)}...` : prompt;
  }

  describe("HP display", () => {
    it("should show player/opponent HP", () => {
      assert.equal(formatHpDisplay(makeRecord()), "60/0");
    });

    it("should show 0 HP for defeated player", () => {
      assert.equal(
        formatHpDisplay(makeRecord({ playerHpLeft: 0, opponentHpLeft: 80 })),
        "0/80",
      );
    });
  });

  describe("date formatting", () => {
    it("should format date as M/D HH:MM", () => {
      // 2026-03-15 14:05 UTC
      const ts = new Date(2026, 2, 15, 14, 5).getTime();
      const result = formatDate(ts);
      assert.equal(result, "3/15 14:05");
    });

    it("should pad hours and minutes", () => {
      const ts = new Date(2026, 0, 1, 8, 3).getTime();
      const result = formatDate(ts);
      assert.equal(result, "1/1 08:03");
    });
  });

  describe("prompt display", () => {
    it("should show fallback for undefined prompt", () => {
      assert.equal(formatPromptDisplay(undefined), "No strategy saved");
    });

    it("should show fallback for empty prompt", () => {
      assert.equal(formatPromptDisplay(""), "No strategy saved");
    });

    it("should show short prompts as-is", () => {
      assert.equal(formatPromptDisplay("Be aggressive"), "Be aggressive");
    });

    it("should show prompt at exactly 80 chars without truncation", () => {
      const text = "a".repeat(80);
      assert.equal(formatPromptDisplay(text), text);
    });

    it("should truncate prompt longer than 80 chars", () => {
      const text = "a".repeat(100);
      const result = formatPromptDisplay(text);
      assert.equal(result.length, 80);
      assert.ok(result.endsWith("..."));
    });
  });

  describe("pagination", () => {
    const ROWS_PER_PAGE = 8;

    it("should calculate total pages correctly", () => {
      const records = Array.from({ length: 20 }, () => makeRecord());
      const totalPages = Math.ceil(records.length / ROWS_PER_PAGE);
      assert.equal(totalPages, 3);
    });

    it("should return 1 page for empty records", () => {
      const totalPages = Math.max(1, Math.ceil(0 / ROWS_PER_PAGE));
      assert.equal(totalPages, 1);
    });

    it("should slice correct records for page", () => {
      const records = Array.from({ length: 20 }, (_, i) =>
        makeRecord({ id: `rec-${i}` }),
      );
      const page = 1;
      const pageRecords = records.slice(
        page * ROWS_PER_PAGE,
        (page + 1) * ROWS_PER_PAGE,
      );
      assert.equal(pageRecords.length, 8);
      assert.equal(pageRecords[0].id, "rec-8");
    });
  });

  describe("stats calculation", () => {
    it("should calculate win rate correctly", () => {
      const records = [
        makeRecord({ result: "win" }),
        makeRecord({ result: "win" }),
        makeRecord({ result: "loss" }),
        makeRecord({ result: "win" }),
      ];
      const wins = records.filter((r) => r.result === "win").length;
      const total = records.length;
      const winRate = Math.round((wins / total) * 100);
      assert.equal(winRate, 75);
    });

    it("should handle 0 total for win rate", () => {
      const total = 0;
      const winRate = total > 0 ? Math.round((0 / total) * 100) : 0;
      assert.equal(winRate, 0);
    });
  });
});
