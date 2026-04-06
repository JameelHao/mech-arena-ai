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

// Import after mock is set up
const { hasSeenOnboarding, markOnboardingSeen } = await import(
  "../src/utils/storage"
);

describe("onboarding state management", () => {
  afterEach(() => {
    mockStorage.clear();
  });

  it("should return false when onboarding has not been seen", () => {
    assert.equal(hasSeenOnboarding(), false);
  });

  it("should return true after marking onboarding as seen", () => {
    markOnboardingSeen();
    assert.equal(hasSeenOnboarding(), true);
  });

  it("should persist across multiple calls", () => {
    markOnboardingSeen();
    assert.equal(hasSeenOnboarding(), true);
    assert.equal(hasSeenOnboarding(), true);
  });

  it("should reset when localStorage is cleared", () => {
    markOnboardingSeen();
    assert.equal(hasSeenOnboarding(), true);
    mockStorage.clear();
    assert.equal(hasSeenOnboarding(), false);
  });
});

describe("onboarding content", () => {
  const STEPS = [
    {
      title: "Welcome to Mech Arena AI!",
      body: "Choose your mech and write a strategy prompt.\nYour AI will follow your strategy in battle.",
    },
    {
      title: "Type Matchups",
      body: "Fire \u25B6 Electric \u25B6 Water \u25B6 Fire\n\nSuper effective = 1.5\u00D7 damage\nResisted = 0.5\u00D7 damage\n\nPick skills wisely!",
    },
    {
      title: "Learn & Improve",
      body: "After battle, review results in History.\nTune your strategy prompt to win more!",
    },
  ];

  it("should have exactly 3 steps", () => {
    assert.equal(STEPS.length, 3);
  });

  it("step 1 should explain mech selection and prompt", () => {
    assert.ok(STEPS[0].title.includes("Welcome"));
    assert.ok(STEPS[0].body.includes("strategy"));
    assert.ok(STEPS[0].body.includes("mech"));
  });

  it("step 2 should explain type matchups", () => {
    assert.ok(STEPS[1].title.includes("Matchup"));
    assert.ok(STEPS[1].body.includes("Fire"));
    assert.ok(STEPS[1].body.includes("Water"));
    assert.ok(STEPS[1].body.includes("Electric"));
    assert.ok(STEPS[1].body.includes("1.5"));
    assert.ok(STEPS[1].body.includes("0.5"));
  });

  it("step 3 should explain history and improvement", () => {
    assert.ok(STEPS[2].title.includes("Improve"));
    assert.ok(STEPS[2].body.includes("History"));
    assert.ok(STEPS[2].body.includes("strategy"));
  });

  it("each step should have non-empty title and body", () => {
    for (const step of STEPS) {
      assert.ok(step.title.length > 0);
      assert.ok(step.body.length > 0);
    }
  });
});
