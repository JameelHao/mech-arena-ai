import assert from "node:assert/strict";
import { existsSync } from "node:fs";
import { readFile } from "node:fs/promises";
import { resolve } from "node:path";
import { describe, it } from "node:test";
import {
  SKIN_ASSET_SPECS,
  SKIN_REQUIRED_FILES,
  type SkinPackManifest,
} from "../src/types/skin";

const ROOT = resolve(import.meta.dirname, "..");
const DEFAULT_SKIN_DIR = resolve(ROOT, "src/assets/skins/default");

describe("SkinPack type specification", () => {
  it("SKIN_REQUIRED_FILES should list 6 required files", () => {
    assert.equal(SKIN_REQUIRED_FILES.length, 6);
  });

  it("should require mech.png", () => {
    assert.ok(SKIN_REQUIRED_FILES.includes("mech.png"));
  });

  it("should require all 3 portrait states", () => {
    assert.ok(SKIN_REQUIRED_FILES.includes("portrait-normal.png"));
    assert.ok(SKIN_REQUIRED_FILES.includes("portrait-angry.png"));
    assert.ok(SKIN_REQUIRED_FILES.includes("portrait-defeated.png"));
  });

  it("should require thumbnail.png", () => {
    assert.ok(SKIN_REQUIRED_FILES.includes("thumbnail.png"));
  });

  it("should require manifest.json", () => {
    assert.ok(SKIN_REQUIRED_FILES.includes("manifest.json"));
  });

  it("mechSprite spec should be 256x256 PNG", () => {
    assert.equal(SKIN_ASSET_SPECS.mechSprite.width, 256);
    assert.equal(SKIN_ASSET_SPECS.mechSprite.height, 256);
    assert.equal(SKIN_ASSET_SPECS.mechSprite.format, "PNG");
  });

  it("portrait spec should be 64x64 PNG", () => {
    assert.equal(SKIN_ASSET_SPECS.portrait.width, 64);
    assert.equal(SKIN_ASSET_SPECS.portrait.height, 64);
  });

  it("thumbnail spec should be 128x128 PNG", () => {
    assert.equal(SKIN_ASSET_SPECS.thumbnail.width, 128);
    assert.equal(SKIN_ASSET_SPECS.thumbnail.height, 128);
  });
});

describe("default skin pack completeness", () => {
  for (const file of SKIN_REQUIRED_FILES) {
    it(`${file} should exist in default skin pack`, () => {
      assert.ok(existsSync(resolve(DEFAULT_SKIN_DIR, file)));
    });
  }

  it("manifest.json should be valid JSON with required fields", async () => {
    const raw = await readFile(
      resolve(DEFAULT_SKIN_DIR, "manifest.json"),
      "utf-8",
    );
    const manifest: SkinPackManifest = JSON.parse(raw);
    assert.ok(manifest.id.length > 0, "id should not be empty");
    assert.ok(manifest.name.length > 0, "name should not be empty");
    assert.ok(manifest.codename.length > 0, "codename should not be empty");
    assert.ok(manifest.themeColor.startsWith("#"), "themeColor should be hex");
    assert.ok(manifest.baseType.length > 0, "baseType should not be empty");
  });

  it("mech.png should be a valid PNG", async () => {
    const buf = await readFile(resolve(DEFAULT_SKIN_DIR, "mech.png"));
    assert.equal(buf[0], 0x89);
    assert.equal(buf[1], 0x50);
  });

  it("portrait PNGs should be valid 64x64", async () => {
    for (const state of ["normal", "angry", "defeated"]) {
      const buf = await readFile(
        resolve(DEFAULT_SKIN_DIR, `portrait-${state}.png`),
      );
      assert.equal(buf[0], 0x89, `portrait-${state} should be PNG`);
      assert.equal(buf.readUInt32BE(16), 64, `portrait-${state} width`);
      assert.equal(buf.readUInt32BE(20), 64, `portrait-${state} height`);
    }
  });

  it("thumbnail.png should be a valid PNG", async () => {
    const buf = await readFile(resolve(DEFAULT_SKIN_DIR, "thumbnail.png"));
    assert.equal(buf[0], 0x89);
    assert.equal(buf[1], 0x50);
    assert.equal(buf.readUInt32BE(16), 128, "thumbnail width");
    assert.equal(buf.readUInt32BE(20), 128, "thumbnail height");
  });
});
