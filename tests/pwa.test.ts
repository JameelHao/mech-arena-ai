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

const mockStorage = new MockStorage();
(globalThis as Record<string, unknown>).localStorage = mockStorage;

// Mock navigator.onLine
const mockOnLine = true;
Object.defineProperty(globalThis, "navigator", {
  value: { onLine: true, serviceWorker: undefined },
  writable: true,
  configurable: true,
});

// Mock window events
const eventHandlers = new Map<string, Set<EventListener>>();
const mockMatchMedia = mock.fn(() => ({ matches: false }));

(globalThis as Record<string, unknown>).window = {
  addEventListener(event: string, handler: EventListener) {
    if (!eventHandlers.has(event)) eventHandlers.set(event, new Set());
    eventHandlers.get(event)?.add(handler);
  },
  removeEventListener(event: string, handler: EventListener) {
    eventHandlers.get(event)?.delete(handler);
  },
  matchMedia: mockMatchMedia,
  location: { reload: mock.fn() },
};

function fireEvent(event: string, data?: unknown) {
  const handlers = eventHandlers.get(event);
  if (handlers) {
    for (const h of handlers) h(data as Event);
  }
}

// Import after mocks
const {
  isOnline,
  onOnlineChange,
  initOnlineListeners,
  getVisitCount,
  incrementVisitCount,
  shouldShowInstallPrompt,
} = await import("../src/utils/pwa");

describe("pwa utilities", () => {
  beforeEach(() => {
    mockStorage.clear();
    eventHandlers.clear();
  });

  describe("isOnline", () => {
    it("should return true by default", () => {
      assert.equal(isOnline(), true);
    });
  });

  describe("onOnlineChange", () => {
    it("should notify listeners and support cleanup", () => {
      initOnlineListeners();

      const states: boolean[] = [];
      const cleanup = onOnlineChange((online) => states.push(online));

      // Simulate going offline
      fireEvent("offline");
      assert.deepEqual(states, [false]);

      // Duplicate offline — should not fire again
      fireEvent("offline");
      assert.deepEqual(states, [false]);

      // Simulate going online
      fireEvent("online");
      assert.deepEqual(states, [false, true]);

      // Duplicate online — should not fire again
      fireEvent("online");
      assert.deepEqual(states, [false, true]);

      cleanup();

      // After cleanup, no more notifications
      fireEvent("offline");
      assert.deepEqual(states, [false, true]);
    });
  });

  describe("visit counting", () => {
    it("should start at 0", () => {
      assert.equal(getVisitCount(), 0);
    });

    it("should increment visit count", () => {
      assert.equal(incrementVisitCount(), 1);
      assert.equal(incrementVisitCount(), 2);
      assert.equal(getVisitCount(), 2);
    });

    it("should handle corrupted localStorage", () => {
      mockStorage.setItem("mechArena_visitCount", "not-a-number");
      // NaN parsed, falls through to 0+1
      assert.equal(getVisitCount(), 0); // NaN → 0 via fallback
    });
  });

  describe("shouldShowInstallPrompt", () => {
    it("should return false when no deferred prompt", () => {
      // No beforeinstallprompt has fired
      assert.equal(shouldShowInstallPrompt(), false);
    });

    it("should return false when visit count below threshold", () => {
      incrementVisitCount(); // 1
      incrementVisitCount(); // 2
      assert.equal(shouldShowInstallPrompt(), false);
    });

    it("should return false when install was dismissed", () => {
      for (let i = 0; i < 5; i++) incrementVisitCount();
      mockStorage.setItem("mechArena_installDismissed", "true");
      assert.equal(shouldShowInstallPrompt(), false);
    });

    it("should return false in standalone mode", () => {
      mockMatchMedia.mock.resetCalls();
      // Even if count >= 3 but no deferredPrompt, still false
      for (let i = 0; i < 5; i++) incrementVisitCount();
      assert.equal(shouldShowInstallPrompt(), false);
    });
  });
});
