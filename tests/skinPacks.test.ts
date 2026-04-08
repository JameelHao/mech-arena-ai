import assert from "node:assert/strict";
import { existsSync } from "node:fs";
import { readFile } from "node:fs/promises";
import { resolve } from "node:path";
import { describe, it } from "node:test";
import { AVAILABLE_SKINS } from "../src/data/skinRegistry";
import { SKIN_REQUIRED_FILES, type SkinPackManifest } from "../src/types/skin";

const ROOT = resolve(import.meta.dirname, "..");
const SKINS_DIR = resolve(ROOT, "src/assets/skins");

describe("AVAILABLE_SKINS registry", () => {
  it("should have at least 4 skins (default + 3 free)", () => {
    assert.ok(AVAILABLE_SKINS.length >= 4);
  });

  it("skin IDs should be unique", () => {
    const ids = AVAILABLE_SKINS.map((s) => s.id);
    assert.equal(new Set(ids).size, ids.length);
  });

  it("should include default skin", () => {
    assert.ok(AVAILABLE_SKINS.some((s) => s.id === "default"));
  });

  it("should include desert-storm", () => {
    assert.ok(AVAILABLE_SKINS.some((s) => s.id === "desert-storm"));
  });

  it("should include arctic-ops", () => {
    assert.ok(AVAILABLE_SKINS.some((s) => s.id === "arctic-ops"));
  });

  it("should include crimson-fury", () => {
    assert.ok(AVAILABLE_SKINS.some((s) => s.id === "crimson-fury"));
  });

  it("each skin should have all required manifest fields", () => {
    for (const skin of AVAILABLE_SKINS) {
      assert.ok(skin.id.length > 0, `${skin.name} missing id`);
      assert.ok(skin.name.length > 0, `${skin.id} missing name`);
      assert.ok(skin.codename.length > 0, `${skin.id} missing codename`);
      assert.ok(
        skin.themeColor.startsWith("#"),
        `${skin.id} themeColor should be hex`,
      );
      assert.ok(skin.baseType.length > 0, `${skin.id} missing baseType`);
    }
  });

  it("all skins should have distinct theme colors", () => {
    const colors = AVAILABLE_SKINS.map((s) => s.themeColor);
    assert.equal(new Set(colors).size, colors.length);
  });
});

describe("all skin pack directories are complete", () => {
  for (const skin of AVAILABLE_SKINS) {
    describe(`${skin.id} skin pack`, () => {
      const skinDir = resolve(SKINS_DIR, skin.id);

      it("directory should exist", () => {
        assert.ok(existsSync(skinDir), `${skin.id} directory missing`);
      });

      for (const file of SKIN_REQUIRED_FILES) {
        it(`${file} should exist`, () => {
          assert.ok(existsSync(resolve(skinDir, file)));
        });
      }

      it("manifest.json should match registry", async () => {
        const raw = await readFile(resolve(skinDir, "manifest.json"), "utf-8");
        const manifest: SkinPackManifest = JSON.parse(raw);
        assert.equal(manifest.id, skin.id);
        assert.equal(manifest.name, skin.name);
      });

      it("mech.png should be valid PNG", async () => {
        const buf = await readFile(resolve(skinDir, "mech.png"));
        assert.equal(buf[0], 0x89);
        assert.equal(buf[1], 0x50);
      });

      it("portraits should be 64x64 PNG", async () => {
        for (const state of ["normal", "angry", "defeated"]) {
          const buf = await readFile(resolve(skinDir, `portrait-${state}.png`));
          assert.equal(buf[0], 0x89);
          assert.equal(buf.readUInt32BE(16), 64);
          assert.equal(buf.readUInt32BE(20), 64);
        }
      });

      it("thumbnail should be 128x128 PNG", async () => {
        const buf = await readFile(resolve(skinDir, "thumbnail.png"));
        assert.equal(buf[0], 0x89);
        assert.equal(buf.readUInt32BE(16), 128);
        assert.equal(buf.readUInt32BE(20), 128);
      });
    });
  }
});
