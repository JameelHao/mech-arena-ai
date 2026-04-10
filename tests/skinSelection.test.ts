import assert from "node:assert/strict";
import { afterEach, beforeEach, describe, it } from "node:test";
import { AVAILABLE_SKINS } from "../src/data/skinRegistry";

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
(globalThis as Record<string, unknown>).indexedDB = undefined;

const { saveSkinId, loadSkinId, clearStarterMech } = await import(
  "../src/utils/storage"
);
const { loadSkinPack, skinTextureKey, getAllSkinAssetEntries } = await import(
  "../src/data/skinLoader"
);

describe("skin selection storage", () => {
  beforeEach(() => {
    mockStorage.clear();
  });

  it("loadSkinId should return 'default' when no skin saved", () => {
    assert.equal(loadSkinId(), "default");
  });

  it("saveSkinId / loadSkinId round-trip", () => {
    saveSkinId("arctic-ops");
    assert.equal(loadSkinId(), "arctic-ops");
  });

  it("should overwrite previous skin selection", () => {
    saveSkinId("desert-storm");
    saveSkinId("crimson-fury");
    assert.equal(loadSkinId(), "crimson-fury");
  });

  it("clearStarterMech should also clear skin selection", () => {
    saveSkinId("arctic-ops");
    clearStarterMech();
    assert.equal(loadSkinId(), "default");
  });
});

describe("loadSkinPack", () => {
  it("should return default skin pack for 'default' id", () => {
    const pack = loadSkinPack("default");
    assert.equal(pack.id, "default");
    assert.equal(pack.name, "Standard Issue");
    assert.ok(pack.mechSprite.length > 0);
    assert.ok(pack.portraits.normal.length > 0);
    assert.ok(pack.portraits.angry.length > 0);
    assert.ok(pack.portraits.defeated.length > 0);
    assert.ok(pack.thumbnail.length > 0);
  });

  it("should return correct pack for 'desert-storm'", () => {
    const pack = loadSkinPack("desert-storm");
    assert.equal(pack.id, "desert-storm");
    assert.equal(pack.name, "Desert Storm");
    assert.equal(pack.themeColor, "#D2B48C");
  });

  it("should return correct pack for 'arctic-ops'", () => {
    const pack = loadSkinPack("arctic-ops");
    assert.equal(pack.id, "arctic-ops");
    assert.equal(pack.name, "Arctic Ops");
    assert.equal(pack.themeColor, "#87CEEB");
  });

  it("should return correct pack for 'crimson-fury'", () => {
    const pack = loadSkinPack("crimson-fury");
    assert.equal(pack.id, "crimson-fury");
    assert.equal(pack.name, "Crimson Fury");
    assert.equal(pack.themeColor, "#DC143C");
  });

  it("should fallback to default for unknown skin id", () => {
    const pack = loadSkinPack("nonexistent-skin");
    assert.equal(pack.id, "default");
    assert.equal(pack.name, "Standard Issue");
  });

  it("each pack should have distinct asset paths", () => {
    const packs = AVAILABLE_SKINS.map((s) => loadSkinPack(s.id));
    const mechPaths = packs.map((p) => p.mechSprite);
    assert.equal(new Set(mechPaths).size, packs.length);
  });
});

describe("skinTextureKey", () => {
  it("should generate correct key for mech", () => {
    assert.equal(skinTextureKey("default", "mech"), "skin-default-mech");
  });

  it("should generate correct key for portrait", () => {
    assert.equal(
      skinTextureKey("arctic-ops", "portrait-normal"),
      "skin-arctic-ops-portrait-normal",
    );
  });

  it("should generate correct key for thumbnail", () => {
    assert.equal(
      skinTextureKey("crimson-fury", "thumbnail"),
      "skin-crimson-fury-thumbnail",
    );
  });
});

describe("getAllSkinAssetEntries", () => {
  it("should return 5 entries per skin (mech + 3 portraits + thumbnail)", () => {
    const entries = getAllSkinAssetEntries();
    assert.equal(entries.length, AVAILABLE_SKINS.length * 5);
  });

  it("all entries should have non-empty key and path", () => {
    for (const entry of getAllSkinAssetEntries()) {
      assert.ok(entry.key.length > 0, "entry key should not be empty");
      assert.ok(entry.path.length > 0, "entry path should not be empty");
    }
  });

  it("all keys should be unique", () => {
    const entries = getAllSkinAssetEntries();
    const keys = entries.map((e) => e.key);
    assert.equal(new Set(keys).size, keys.length);
  });

  it("keys should follow skin-{id}-{asset} pattern", () => {
    const entries = getAllSkinAssetEntries();
    for (const entry of entries) {
      assert.ok(
        entry.key.startsWith("skin-"),
        `key ${entry.key} should start with skin-`,
      );
    }
  });
});
