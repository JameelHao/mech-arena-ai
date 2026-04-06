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
  hasSeenOnboarding,
  hasStarterMech,
  loadStarterMech,
  markOnboardingSeen,
  saveStarterMech,
} = await import("../src/utils/storage");

describe("clearStarterMech", () => {
  afterEach(() => {
    mockStorage.clear();
  });

  it("should clear starter mech", () => {
    saveStarterMech(2);
    assert.equal(hasStarterMech(), true);
    clearStarterMech();
    assert.equal(hasStarterMech(), false);
  });

  it("should clear onboarding state", () => {
    markOnboardingSeen();
    assert.equal(hasSeenOnboarding(), true);
    clearStarterMech();
    assert.equal(hasSeenOnboarding(), false);
  });

  it("should clear both starter and onboarding together", () => {
    saveStarterMech(1);
    markOnboardingSeen();
    clearStarterMech();
    assert.equal(hasStarterMech(), false);
    assert.equal(hasSeenOnboarding(), false);
  });

  it("should default starter to 0 after clear", () => {
    saveStarterMech(2);
    clearStarterMech();
    assert.equal(loadStarterMech(), 0);
  });

  it("should be safe to call when nothing is saved", () => {
    assert.doesNotThrow(() => clearStarterMech());
  });
});

describe("initialization flow integration", () => {
  afterEach(() => {
    mockStorage.clear();
  });

  it("fresh state should trigger mech binding", () => {
    assert.equal(!hasStarterMech(), true);
  });

  it("after binding, should trigger onboarding if not seen", () => {
    saveStarterMech(0);
    assert.equal(hasStarterMech(), true);
    assert.equal(!hasSeenOnboarding(), true);
  });

  it("after binding + onboarding, should go to normal lobby", () => {
    saveStarterMech(1);
    markOnboardingSeen();
    assert.equal(hasStarterMech(), true);
    assert.equal(hasSeenOnboarding(), true);
  });

  it("reset should restore fresh state", () => {
    saveStarterMech(1);
    markOnboardingSeen();
    clearStarterMech();
    // Should be back to fresh state
    assert.equal(hasStarterMech(), false);
    assert.equal(hasSeenOnboarding(), false);
  });

  it("full lifecycle: fresh → bind → onboard → normal → reset → fresh", () => {
    // Fresh
    assert.equal(hasStarterMech(), false);

    // Bind
    saveStarterMech(2);
    assert.equal(hasStarterMech(), true);
    assert.equal(loadStarterMech(), 2);

    // Onboard
    markOnboardingSeen();
    assert.equal(hasSeenOnboarding(), true);

    // Normal lobby (all set)
    assert.equal(hasStarterMech(), true);
    assert.equal(hasSeenOnboarding(), true);

    // Reset
    clearStarterMech();
    assert.equal(hasStarterMech(), false);
    assert.equal(hasSeenOnboarding(), false);
  });
});
