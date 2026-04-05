import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, it } from "node:test";

const REPO_ROOT = resolve(import.meta.dirname, "..");
const REFERENCE_DIR = resolve(REPO_ROOT, "src/assets/reference");
const PORTRAITS_DIR = resolve(REPO_ROOT, "src/assets/portraits");

const SOURCE_FILE = resolve(REFERENCE_DIR, "player-portrait-source.png");

const PLAYER_PORTRAITS = [
  "player-normal.png",
  "player-angry.png",
  "player-defeated.png",
] as const;

const WATER_PORTRAITS = [
  "water-normal.png",
  "water-angry.png",
  "water-defeated.png",
] as const;

// PNG magic bytes: 89 50 4E 47 0D 0A 1A 0A
const PNG_SIGNATURE = Buffer.from([
  0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a,
]);

function isPng(buf: Buffer): boolean {
  return buf.length >= 8 && buf.subarray(0, 8).equals(PNG_SIGNATURE);
}

describe("playerPortraitSource", () => {
  it("reference source image should exist", () => {
    assert.ok(
      existsSync(SOURCE_FILE),
      `Source image not found at ${SOURCE_FILE}`,
    );
  });

  it("reference source should be a valid PNG", () => {
    const buf = readFileSync(SOURCE_FILE);
    assert.ok(isPng(buf), "Source file should have PNG signature");
  });

  for (const name of PLAYER_PORTRAITS) {
    const filePath = resolve(PORTRAITS_DIR, name);

    it(`${name} should exist`, () => {
      assert.ok(existsSync(filePath), `Portrait not found: ${filePath}`);
    });

    it(`${name} should be a valid PNG`, () => {
      const buf = readFileSync(filePath);
      assert.ok(isPng(buf), `${name} should have PNG signature`);
    });
  }

  for (const name of WATER_PORTRAITS) {
    const filePath = resolve(PORTRAITS_DIR, name);

    it(`${name} should exist (enemy counterpart)`, () => {
      assert.ok(existsSync(filePath), `Portrait not found: ${filePath}`);
    });
  }

  it("player portraits should be distinct from water portraits", () => {
    for (let i = 0; i < PLAYER_PORTRAITS.length; i++) {
      const playerBuf = readFileSync(
        resolve(PORTRAITS_DIR, PLAYER_PORTRAITS[i]),
      );
      const waterBuf = readFileSync(resolve(PORTRAITS_DIR, WATER_PORTRAITS[i]));
      assert.ok(
        !playerBuf.equals(waterBuf),
        `${PLAYER_PORTRAITS[i]} must differ from ${WATER_PORTRAITS[i]}`,
      );
    }
  });

  it("each player portrait should be unique (no duplicates among states)", () => {
    const buffers = PLAYER_PORTRAITS.map((name) =>
      readFileSync(resolve(PORTRAITS_DIR, name)),
    );
    for (let i = 0; i < buffers.length; i++) {
      for (let j = i + 1; j < buffers.length; j++) {
        assert.ok(
          !buffers[i].equals(buffers[j]),
          `${PLAYER_PORTRAITS[i]} and ${PLAYER_PORTRAITS[j]} should not be identical`,
        );
      }
    }
  });
});
