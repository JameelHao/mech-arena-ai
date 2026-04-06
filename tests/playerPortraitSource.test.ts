import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { existsSync } from "node:fs";
import { readFile } from "node:fs/promises";
import { resolve } from "node:path";
import { describe, it } from "node:test";

const ROOT = resolve(import.meta.dirname, "..");
const PORTRAIT_DIR = resolve(ROOT, "src/assets/portraits");
const REF_DIR = resolve(ROOT, "src/assets/reference/portraits");

// Reference JPG files (single source of truth per FR #68)
const PLAYER_REF = resolve(REF_DIR, "final-player-falcon-unit.jpg");
const ENEMY_REF = resolve(REF_DIR, "final-enemy-venom-battalion.jpg");

describe("portrait reference JPG files", () => {
  it("final-player-falcon-unit.jpg should exist in reference dir", () => {
    assert.ok(existsSync(PLAYER_REF), `Missing: ${PLAYER_REF}`);
  });

  it("final-enemy-venom-battalion.jpg should exist in reference dir", () => {
    assert.ok(existsSync(ENEMY_REF), `Missing: ${ENEMY_REF}`);
  });

  it("player reference should be a valid JPEG", async () => {
    const buf = await readFile(PLAYER_REF);
    assert.ok(buf.length > 2, "file should not be empty");
    assert.equal(buf[0], 0xff, "JPEG starts with 0xFF");
    assert.equal(buf[1], 0xd8, "JPEG second byte is 0xD8");
  });

  it("enemy reference should be a valid JPEG", async () => {
    const buf = await readFile(ENEMY_REF);
    assert.ok(buf.length > 2, "file should not be empty");
    assert.equal(buf[0], 0xff);
    assert.equal(buf[1], 0xd8);
  });

  it("player reference SHA256 should match pinned hash", async () => {
    const PINNED =
      "8f8ce89508df37d62fa039945bdd97141797c320658c7bb1670e96b3ec9e3ec0";
    const buf = await readFile(PLAYER_REF);
    const hash = createHash("sha256").update(buf).digest("hex");
    assert.equal(hash, PINNED, `FALCON UNIT ref SHA256 mismatch. Got: ${hash}`);
  });

  it("enemy reference SHA256 should match pinned hash", async () => {
    const PINNED =
      "1e98cf45dd23e32fa8105b657d76390f03fb03d5476a25b2eae9c166f4f2ed3f";
    const buf = await readFile(ENEMY_REF);
    const hash = createHash("sha256").update(buf).digest("hex");
    assert.equal(
      hash,
      PINNED,
      `VENOM BATTALION ref SHA256 mismatch. Got: ${hash}`,
    );
  });

  it("player and enemy references should be different files", async () => {
    const a = await readFile(PLAYER_REF);
    const b = await readFile(ENEMY_REF);
    assert.notDeepEqual(a, b, "References must be distinct");
  });
});

describe("portrait runtime PNG files", () => {
  const STATES = ["normal", "angry", "defeated"] as const;

  // Final base PNGs
  it("final-player-falcon-unit.png should exist", () => {
    assert.ok(
      existsSync(resolve(PORTRAIT_DIR, "final-player-falcon-unit.png")),
    );
  });

  it("final-enemy-venom-battalion.png should exist", () => {
    assert.ok(
      existsSync(resolve(PORTRAIT_DIR, "final-enemy-venom-battalion.png")),
    );
  });

  // State variants existence + format
  for (const prefix of ["player", "water"] as const) {
    for (const state of STATES) {
      const filename = `${prefix}-${state}.png`;

      it(`${filename} should exist`, () => {
        assert.ok(existsSync(resolve(PORTRAIT_DIR, filename)));
      });

      it(`${filename} should be a valid 64x64 RGB PNG`, async () => {
        const buf = await readFile(resolve(PORTRAIT_DIR, filename));
        assert.equal(buf[0], 0x89);
        assert.equal(buf[1], 0x50);
        assert.equal(buf[2], 0x4e);
        assert.equal(buf[3], 0x47);
        assert.equal(buf.readUInt32BE(16), 64, `${filename} width`);
        assert.equal(buf.readUInt32BE(20), 64, `${filename} height`);
        assert.equal(buf[25], 2, `${filename} should be RGB`);
      });
    }
  }

  it("player portraits should be distinct from water portraits", async () => {
    for (const state of STATES) {
      const p = await readFile(resolve(PORTRAIT_DIR, `player-${state}.png`));
      const w = await readFile(resolve(PORTRAIT_DIR, `water-${state}.png`));
      assert.notDeepEqual(
        p,
        w,
        `player-${state} must differ from water-${state}`,
      );
    }
  });

  it("all three player states should be visually distinct", async () => {
    const bufs = await Promise.all(
      STATES.map((s) => readFile(resolve(PORTRAIT_DIR, `player-${s}.png`))),
    );
    assert.notDeepEqual(bufs[0], bufs[1], "normal vs angry");
    assert.notDeepEqual(bufs[1], bufs[2], "angry vs defeated");
    assert.notDeepEqual(bufs[0], bufs[2], "normal vs defeated");
  });

  it("all three enemy states should be visually distinct", async () => {
    const bufs = await Promise.all(
      STATES.map((s) => readFile(resolve(PORTRAIT_DIR, `water-${s}.png`))),
    );
    assert.notDeepEqual(bufs[0], bufs[1], "normal vs angry");
    assert.notDeepEqual(bufs[1], bufs[2], "angry vs defeated");
    assert.notDeepEqual(bufs[0], bufs[2], "normal vs defeated");
  });
});
