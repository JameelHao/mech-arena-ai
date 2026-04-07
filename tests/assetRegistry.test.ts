import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { ASSET_REGISTRY, type AssetEntry } from "../src/assets";
import { MechType } from "../src/types/game";

describe("ASSET_REGISTRY", () => {
  describe("mechs", () => {
    it("should have entries for fire and water types", () => {
      const fire = ASSET_REGISTRY.mechs[MechType.Kinetic];
      const water = ASSET_REGISTRY.mechs[MechType.Beam];
      assert.ok(fire, "fire entry should exist");
      assert.ok(water, "water entry should exist");
      assert.equal(fire?.key, "mech-fire");
      assert.equal(water?.key, "mech-water");
    });

    it("should have null for electric type (no PNG yet)", () => {
      assert.equal(ASSET_REGISTRY.mechs[MechType.Emp], null);
    });

    it("each non-null entry should have key and path", () => {
      for (const [type, entry] of Object.entries(ASSET_REGISTRY.mechs)) {
        if (entry === null) continue;
        assert.ok(
          typeof entry.key === "string" && entry.key.length > 0,
          `${type} key should be a non-empty string`,
        );
        assert.ok(
          typeof entry.path === "string" && entry.path.length > 0,
          `${type} path should be a non-empty string`,
        );
      }
    });
  });

  describe("portraits", () => {
    const STATES = ["normal", "angry", "defeated"] as const;

    it("should index portraits by MechType, not player/enemy", () => {
      assert.ok(
        ASSET_REGISTRY.portraits[MechType.Kinetic],
        "fire portraits should exist",
      );
      assert.ok(
        ASSET_REGISTRY.portraits[MechType.Beam],
        "water portraits should exist",
      );
      assert.equal(
        ASSET_REGISTRY.portraits[MechType.Emp],
        null,
        "electric portraits should be null",
      );
      // Ensure old player/enemy keys no longer exist
      assert.equal(
        (ASSET_REGISTRY.portraits as Record<string, unknown>).player,
        undefined,
        "player key should not exist",
      );
      assert.equal(
        (ASSET_REGISTRY.portraits as Record<string, unknown>).enemy,
        undefined,
        "enemy key should not exist",
      );
    });

    for (const state of STATES) {
      it(`should have player-${state} portrait entry for Fire type`, () => {
        const entry = ASSET_REGISTRY.portraits[MechType.Kinetic]?.[state];
        assert.ok(entry, `player-${state} should exist`);
        assert.equal(entry.key, `portrait-player-${state}`);
        assert.ok(typeof entry.path === "string" && entry.path.length > 0);
      });
    }

    for (const state of STATES) {
      it(`should have water-${state} portrait entry`, () => {
        const entry = ASSET_REGISTRY.portraits[MechType.Beam]?.[state];
        assert.ok(entry, `water-${state} should exist`);
        assert.equal(entry.key, `portrait-water-${state}`);
        assert.ok(typeof entry.path === "string" && entry.path.length > 0);
      });
    }

    it("should have null for electric type (no portrait yet)", () => {
      assert.equal(ASSET_REGISTRY.portraits[MechType.Emp], null);
    });

    it("player portrait paths should reference player-prefixed files", () => {
      const states = ASSET_REGISTRY.portraits[MechType.Kinetic];
      assert.ok(states);
      for (const [state, entry] of Object.entries(states)) {
        assert.ok(
          (entry as AssetEntry).path.includes(`player-${state}`),
          `player-${state} path should contain "player-${state}", got: ${(entry as AssetEntry).path}`,
        );
      }
    });

    it("water portrait paths should reference water-prefixed files", () => {
      const states = ASSET_REGISTRY.portraits[MechType.Beam];
      assert.ok(states);
      for (const [state, entry] of Object.entries(states)) {
        assert.ok(
          (entry as AssetEntry).path.includes(`water-${state}`),
          `water-${state} path should contain "water-${state}", got: ${(entry as AssetEntry).path}`,
        );
      }
    });
  });

  describe("backgrounds", () => {
    it("should have city background entry", () => {
      const entry = ASSET_REGISTRY.backgrounds.city;
      assert.equal(entry.key, "bg-city");
      assert.ok(typeof entry.path === "string" && entry.path.length > 0);
    });

    it("should have ground entry", () => {
      const entry = ASSET_REGISTRY.backgrounds.ground;
      assert.equal(entry.key, "bg-ground");
      assert.ok(typeof entry.path === "string" && entry.path.length > 0);
    });
  });

  describe("portrait distinction", () => {
    const STATES = ["normal", "angry", "defeated"] as const;

    for (const state of STATES) {
      it(`player-${state} and water-${state} should have different texture keys`, () => {
        const player = ASSET_REGISTRY.portraits[MechType.Kinetic]?.[state];
        const water = ASSET_REGISTRY.portraits[MechType.Beam]?.[state];
        assert.ok(player, `player-${state} should exist`);
        assert.ok(water, `water-${state} should exist`);
        assert.notEqual(
          player.key,
          water.key,
          `player and water ${state} portraits must have different keys`,
        );
      });

      it(`player-${state} and water-${state} should have different paths`, () => {
        const player = ASSET_REGISTRY.portraits[MechType.Kinetic]?.[state];
        const water = ASSET_REGISTRY.portraits[MechType.Beam]?.[state];
        assert.ok(player && water);
        assert.notEqual(
          player.path,
          water.path,
          `player and water ${state} portraits must reference different files`,
        );
      });
    }
  });

  describe("key uniqueness", () => {
    it("all texture keys should be unique across the registry", () => {
      const keys: string[] = [];

      for (const entry of Object.values(ASSET_REGISTRY.mechs)) {
        if (entry) keys.push(entry.key);
      }
      for (const states of Object.values(ASSET_REGISTRY.portraits)) {
        if (!states) continue;
        for (const entry of Object.values(states)) {
          keys.push((entry as AssetEntry).key);
        }
      }
      for (const entry of Object.values(ASSET_REGISTRY.backgrounds)) {
        keys.push(entry.key);
      }

      const uniqueKeys = new Set(keys);
      assert.equal(
        uniqueKeys.size,
        keys.length,
        `Found duplicate keys: ${keys.filter((k, i) => keys.indexOf(k) !== i)}`,
      );
    });
  });
});
