import assert from "node:assert/strict";
import { afterEach, describe, it } from "node:test";

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
  hasCommanderName,
  loadCommanderName,
  saveCommanderName,
  saveStarterMech,
} = await import("../src/utils/storage");

describe("commander name storage", () => {
  afterEach(() => {
    mockStorage.clear();
  });

  it("should return default 'Commander' when no name saved", () => {
    assert.equal(loadCommanderName(), "Commander");
  });

  it("should save and load a custom name", () => {
    saveCommanderName("Ace");
    assert.equal(loadCommanderName(), "Ace");
  });

  it("should trim whitespace", () => {
    saveCommanderName("  Rex  ");
    assert.equal(loadCommanderName(), "Rex");
  });

  it("should default to 'Commander' for empty string", () => {
    saveCommanderName("");
    assert.equal(loadCommanderName(), "Commander");
  });

  it("should default to 'Commander' for whitespace-only", () => {
    saveCommanderName("   ");
    assert.equal(loadCommanderName(), "Commander");
  });

  it("should truncate to 20 characters", () => {
    saveCommanderName("a".repeat(30));
    assert.equal(loadCommanderName().length, 20);
  });

  it("should report hasCommanderName correctly", () => {
    assert.equal(hasCommanderName(), false);
    saveCommanderName("Test");
    assert.equal(hasCommanderName(), true);
  });

  it("should be cleared by clearStarterMech", () => {
    saveCommanderName("Test");
    saveStarterMech(1);
    clearStarterMech();
    assert.equal(hasCommanderName(), false);
    assert.equal(loadCommanderName(), "Commander");
  });
});
