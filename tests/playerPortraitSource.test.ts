import assert from "node:assert/strict";
import { existsSync } from "node:fs";
import { readFile } from "node:fs/promises";
import { resolve } from "node:path";
import { describe, it } from "node:test";

const ROOT = resolve(import.meta.dirname, "..");
const REF_PATH = resolve(
  ROOT,
  "src/assets/reference/player-portrait-source.jpg",
);
const PORTRAIT_DIR = resolve(ROOT, "src/assets/portraits");

describe("player portrait source material", () => {
  it("player-portrait-source.jpg should exist in src/assets/reference/", () => {
    assert.ok(existsSync(REF_PATH), `Source file missing: ${REF_PATH}`);
  });

  it("player-portrait-source.jpg should be a valid JPEG", async () => {
    const buf = await readFile(REF_PATH);
    // JPEG files start with FF D8
    assert.ok(buf.length > 2, "file should not be empty");
    assert.equal(buf[0], 0xff, "first byte should be 0xFF");
    assert.equal(buf[1], 0xd8, "second byte should be 0xD8");
  });
});

describe("player portrait files", () => {
  const STATES = ["normal", "angry", "defeated"] as const;

  for (const state of STATES) {
    it(`player-${state}.png should exist`, () => {
      const p = resolve(PORTRAIT_DIR, `player-${state}.png`);
      assert.ok(existsSync(p), `Missing: ${p}`);
    });

    it(`player-${state}.png should be a valid PNG`, async () => {
      const buf = await readFile(resolve(PORTRAIT_DIR, `player-${state}.png`));
      // PNG files start with 0x89 P N G
      assert.ok(buf.length > 4, "file should not be empty");
      assert.equal(buf[0], 0x89, "first byte should be 0x89");
      assert.equal(buf[1], 0x50, "second byte should be 0x50 (P)");
      assert.equal(buf[2], 0x4e, "third byte should be 0x4E (N)");
      assert.equal(buf[3], 0x47, "fourth byte should be 0x47 (G)");
    });
  }

  it("player portraits should be distinct from enemy portraits", async () => {
    const playerNormal = await readFile(
      resolve(PORTRAIT_DIR, "player-normal.png"),
    );
    const enemyNormal = await readFile(
      resolve(PORTRAIT_DIR, "enemy-normal.png"),
    );
    // Files should differ (not the same red portrait)
    assert.notDeepEqual(
      playerNormal,
      enemyNormal,
      "Player portrait must be visually distinct from enemy portrait (files should differ)",
    );
  });
});
