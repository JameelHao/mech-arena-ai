import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { ASSET_REGISTRY, type AssetEntry } from "../src/assets";
import { MechType } from "../src/types/game";

const MECH_TYPES = [MechType.Kinetic, MechType.Beam, MechType.Emp] as const;
const STATES = ["normal", "angry", "defeated"] as const;

describe("ASSET_REGISTRY", () => {
  describe("mechs", () => {
    it("should have entries for all three mech types", () => {
      for (const type of MECH_TYPES) {
        const entry = ASSET_REGISTRY.mechs[type];
        assert.ok(entry, `${type} mech entry should exist`);
        assert.ok(
          entry.key.startsWith("mech-"),
          `${type} key should start with mech-`,
        );
      }
    });

    it("should have correct keys for each type", () => {
      assert.equal(ASSET_REGISTRY.mechs[MechType.Kinetic]?.key, "mech-kinetic");
      assert.equal(ASSET_REGISTRY.mechs[MechType.Beam]?.key, "mech-beam");
      assert.equal(ASSET_REGISTRY.mechs[MechType.Emp]?.key, "mech-emp");
    });

    it("each entry should have key and path", () => {
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
    it("should have portrait entries for all three types", () => {
      for (const type of MECH_TYPES) {
        assert.ok(
          ASSET_REGISTRY.portraits[type],
          `${type} portraits should exist`,
        );
      }
    });

    for (const type of MECH_TYPES) {
      for (const state of STATES) {
        it(`should have ${type}-${state} portrait entry`, () => {
          const entry = ASSET_REGISTRY.portraits[type]?.[state];
          assert.ok(entry, `${type}-${state} should exist`);
          assert.equal(entry.key, `portrait-${type}-${state}`);
          assert.ok(typeof entry.path === "string" && entry.path.length > 0);
        });
      }
    }

    it("portrait paths should reference type-prefixed files", () => {
      for (const type of MECH_TYPES) {
        const states = ASSET_REGISTRY.portraits[type];
        assert.ok(states);
        for (const [state, entry] of Object.entries(states)) {
          assert.ok(
            (entry as AssetEntry).path.includes(`${type}-${state}`),
            `${type}-${state} path should contain "${type}-${state}"`,
          );
        }
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
    for (const state of STATES) {
      it(`all types should have different ${state} portrait keys`, () => {
        const keys = MECH_TYPES.map(
          (t) => ASSET_REGISTRY.portraits[t]?.[state]?.key,
        );
        assert.equal(new Set(keys).size, 3, `${state} keys should be unique`);
      });

      it(`all types should have different ${state} portrait paths`, () => {
        const paths = MECH_TYPES.map(
          (t) => ASSET_REGISTRY.portraits[t]?.[state]?.path,
        );
        assert.equal(new Set(paths).size, 3, `${state} paths should be unique`);
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
      assert.equal(uniqueKeys.size, keys.length, "all keys should be unique");
    });
  });
});
