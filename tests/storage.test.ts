import assert from "node:assert/strict";
import { afterEach, beforeEach, describe, it, mock } from "node:test";

// Mock localStorage
class MockStorage {
  private store = new Map<string, string>();
  getItem(key: string): string | null {
    return this.store.get(key) ?? null;
  }
  setItem(key: string, value: string): void {
    this.store.set(key, value);
  }
  removeItem(key: string): void {
    this.store.delete(key);
  }
  clear(): void {
    this.store.clear();
  }
}

// Install mock before importing modules
const mockStorage = new MockStorage();
(globalThis as Record<string, unknown>).localStorage = mockStorage;
// Force localStorage fallback by not providing indexedDB
(globalThis as Record<string, unknown>).indexedDB = undefined;

const {
  saveMechPrompt,
  loadMechPrompt,
  saveSettings,
  loadSettings,
  saveBattleHistory,
  loadBattleHistory,
  clearOldBattles,
} = await import("../src/utils/storage");
const { DEFAULT_SETTINGS } = await import("../src/types/storage");

function makeRecord(
  id: string,
  result: "win" | "loss" = "win",
  timestamp?: number,
) {
  return {
    id,
    timestamp: timestamp ?? Date.now(),
    playerMechType: "kinetic" as const,
    opponentMechType: "beam" as const,
    result,
    turns: 5,
    playerHpLeft: 50,
    opponentHpLeft: 0,
  };
}

describe("storage", () => {
  beforeEach(() => {
    mockStorage.clear();
  });

  describe("saveMechPrompt / loadMechPrompt", () => {
    it("should save and load prompt", () => {
      saveMechPrompt("Be aggressive");
      assert.equal(loadMechPrompt(), "Be aggressive");
    });

    it("should return empty string when no prompt saved", () => {
      assert.equal(loadMechPrompt(), "");
    });

    it("should overwrite existing prompt", () => {
      saveMechPrompt("First");
      saveMechPrompt("Second");
      assert.equal(loadMechPrompt(), "Second");
    });
  });

  describe("saveSettings / loadSettings", () => {
    it("should return default settings when none saved", () => {
      const settings = loadSettings();
      assert.deepEqual(settings, DEFAULT_SETTINGS);
    });

    it("should save and load settings", () => {
      const custom = {
        mechPrompt: "test",
        soundEnabled: false,
        animationSpeed: "fast" as const,
      };
      saveSettings(custom);
      assert.deepEqual(loadSettings(), custom);
    });

    it("should merge with defaults for partial settings", () => {
      // Simulate partial data in storage
      mockStorage.setItem(
        "mechArena_settings",
        JSON.stringify({ soundEnabled: false }),
      );
      const settings = loadSettings();
      assert.equal(settings.soundEnabled, false);
      assert.equal(settings.mechPrompt, "");
      assert.equal(settings.animationSpeed, "normal");
    });

    it("should return defaults for corrupted JSON", () => {
      mockStorage.setItem("mechArena_settings", "not-json");
      const settings = loadSettings();
      assert.deepEqual(settings, DEFAULT_SETTINGS);
    });
  });

  describe("saveBattleHistory / loadBattleHistory (localStorage fallback)", () => {
    it("should save and load a battle record", async () => {
      const record = makeRecord("battle-1");
      await saveBattleHistory(record);
      const records = await loadBattleHistory();
      assert.equal(records.length, 1);
      assert.equal(records[0].id, "battle-1");
    });

    it("should store newest first", async () => {
      await saveBattleHistory(makeRecord("b1", "win", 1000));
      await saveBattleHistory(makeRecord("b2", "loss", 2000));
      const records = await loadBattleHistory();
      assert.equal(records[0].id, "b2");
      assert.equal(records[1].id, "b1");
    });

    it("should return empty array when no history", async () => {
      const records = await loadBattleHistory();
      assert.deepEqual(records, []);
    });

    it("should handle corrupted JSON gracefully", async () => {
      mockStorage.setItem("mechArena_battleHistory", "broken");
      const records = await loadBattleHistory();
      assert.deepEqual(records, []);
    });

    it("should limit to 100 records", async () => {
      // Pre-fill with 100 records
      const existing = [];
      for (let i = 0; i < 100; i++) {
        existing.push(makeRecord(`old-${i}`, "win", 1000 + i));
      }
      mockStorage.setItem("mechArena_battleHistory", JSON.stringify(existing));

      // Add one more
      await saveBattleHistory(makeRecord("new-1", "loss", 9999));
      const records = await loadBattleHistory();
      assert.equal(records.length, 100);
      assert.equal(records[0].id, "new-1");
    });
  });

  describe("clearOldBattles (localStorage fallback)", () => {
    it("should return 0 when under limit", async () => {
      await saveBattleHistory(makeRecord("b1"));
      const deleted = await clearOldBattles();
      assert.equal(deleted, 0);
    });

    it("should trim records over limit", async () => {
      const records = [];
      for (let i = 0; i < 105; i++) {
        records.push(makeRecord(`r-${i}`, "win", 1000 + i));
      }
      mockStorage.setItem("mechArena_battleHistory", JSON.stringify(records));

      const deleted = await clearOldBattles();
      assert.equal(deleted, 5);

      const remaining = await loadBattleHistory();
      assert.equal(remaining.length, 100);
    });
  });
});
