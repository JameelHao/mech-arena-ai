import assert from "node:assert/strict";
import { afterEach, describe, it } from "node:test";
import { COMBAT_CORES } from "../src/data/strategies";

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

const mockStorage = new MockStorage();
(globalThis as Record<string, unknown>).localStorage = mockStorage;

const {
  clearStarterMech,
  hasCombatCore,
  loadCombatCore,
  saveCombatCore,
  saveStarterMech,
} = await import("../src/utils/storage");

describe("combat core storage", () => {
  afterEach(() => {
    mockStorage.clear();
  });

  it("should default to index 0 when no core saved", () => {
    assert.equal(loadCombatCore(), 0);
  });

  it("should save and load a core index", () => {
    saveCombatCore(2);
    assert.equal(loadCombatCore(), 2);
  });

  it("should report hasCombatCore correctly", () => {
    assert.equal(hasCombatCore(), false);
    saveCombatCore(1);
    assert.equal(hasCombatCore(), true);
  });

  it("should persist index 0 as a valid selection", () => {
    saveCombatCore(0);
    assert.equal(hasCombatCore(), true);
    assert.equal(loadCombatCore(), 0);
  });

  it("should handle corrupted value gracefully", () => {
    mockStorage.setItem("mechArena_combatCore", "invalid");
    assert.equal(loadCombatCore(), 0);
  });

  it("should be cleared by clearStarterMech", () => {
    saveCombatCore(2);
    saveStarterMech(1);
    clearStarterMech();
    assert.equal(hasCombatCore(), false);
    assert.equal(loadCombatCore(), 0);
  });
});

describe("COMBAT_CORES data", () => {
  it("should have at least 3 cores", () => {
    assert.ok(COMBAT_CORES.length >= 3);
  });

  it("each core should have name, icon, and prompt", () => {
    for (const core of COMBAT_CORES) {
      assert.ok(core.name.length > 0);
      assert.ok(core.icon.length > 0);
      assert.ok(core.prompt.length > 30);
    }
  });

  it("core names should be unique", () => {
    const names = COMBAT_CORES.map((c) => c.name);
    assert.equal(new Set(names).size, names.length);
  });

  it("should include Aggressive, Balanced, Defensive", () => {
    assert.ok(COMBAT_CORES.some((c) => c.name === "Aggressive"));
    assert.ok(COMBAT_CORES.some((c) => c.name === "Balanced"));
    assert.ok(COMBAT_CORES.some((c) => c.name === "Defensive"));
  });
});
