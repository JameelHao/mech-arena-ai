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

const { hasStarterMech, loadStarterMech, saveStarterMech } = await import(
  "../src/utils/storage"
);

describe("starter mech persistence", () => {
  afterEach(() => {
    mockStorage.clear();
  });

  it("should return false when no starter is saved", () => {
    assert.equal(hasStarterMech(), false);
  });

  it("should return true after saving a starter", () => {
    saveStarterMech(1);
    assert.equal(hasStarterMech(), true);
  });

  it("should load saved starter index", () => {
    saveStarterMech(2);
    assert.equal(loadStarterMech(), 2);
  });

  it("should default to 0 when no starter saved", () => {
    assert.equal(loadStarterMech(), 0);
  });

  it("should persist index 0", () => {
    saveStarterMech(0);
    assert.equal(hasStarterMech(), true);
    assert.equal(loadStarterMech(), 0);
  });

  it("should overwrite previous selection", () => {
    saveStarterMech(0);
    saveStarterMech(2);
    assert.equal(loadStarterMech(), 2);
  });

  it("should handle corrupted value gracefully", () => {
    mockStorage.setItem("mechArena_starterMech", "invalid");
    assert.equal(loadStarterMech(), 0);
  });

  it("should reset when localStorage is cleared", () => {
    saveStarterMech(1);
    mockStorage.clear();
    assert.equal(hasStarterMech(), false);
    assert.equal(loadStarterMech(), 0);
  });
});

describe("mech binding flow logic", () => {
  afterEach(() => {
    mockStorage.clear();
  });

  it("should show binding when no starter exists", () => {
    const shouldShowBinding = !hasStarterMech();
    assert.equal(shouldShowBinding, true);
  });

  it("should skip binding when starter exists", () => {
    saveStarterMech(1);
    const shouldShowBinding = !hasStarterMech();
    assert.equal(shouldShowBinding, false);
  });

  it("should show onboarding after binding if not seen", async () => {
    saveStarterMech(0);
    const { hasSeenOnboarding } = await import("../src/utils/storage");
    const shouldShowOnboarding = hasStarterMech() && !hasSeenOnboarding();
    assert.equal(shouldShowOnboarding, true);
  });
});
