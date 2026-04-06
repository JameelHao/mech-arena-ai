import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { existsSync } from "node:fs";
import { readFile } from "node:fs/promises";
import { resolve } from "node:path";
import { describe, it } from "node:test";

const ROOT = resolve(import.meta.dirname, "..");
const PORTRAIT_DIR = resolve(ROOT, "src/assets/portraits");

// Final portrait source files (single source of truth per FR #66)
const PLAYER_SOURCE = resolve(
  PORTRAIT_DIR,
  "final-player-falcon-unit.png",
);
const ENEMY_SOURCE = resolve(
  PORTRAIT_DIR,
  "final-enemy-venom-battalion.png",
);

describe("final portrait source files", () => {
  it("final-player-falcon-unit.png should exist", () => {
    assert.ok(existsSync(PLAYER_SOURCE), `Missing: ${PLAYER_SOURCE}`);
  });

  it("final-enemy-venom-battalion.png should exist", () => {
    assert.ok(existsSync(ENEMY_SOURCE), `Missing: ${ENEMY_SOURCE}`);
  });

  it("final-player-falcon-unit.png should be a valid PNG", async () => {
    const buf = await readFile(PLAYER_SOURCE);
    assert.ok(buf.length > 4, "file should not be empty");
    assert.equal(buf[0], 0x89);
    assert.equal(buf[1], 0x50);
  });

  it("final-enemy-venom-battalion.png should be a valid PNG", async () => {
    const buf = await readFile(ENEMY_SOURCE);
    assert.ok(buf.length > 4, "file should not be empty");
    assert.equal(buf[0], 0x89);
    assert.equal(buf[1], 0x50);
  });

  it("player source SHA256 should match pinned hash", async () => {
    const PINNED =
      "9ee475c23b8fc516e2b62b30d9c69379a4138a4ac61ac59f2fe66cf3c23f84a0";
    const buf = await readFile(PLAYER_SOURCE);
    const hash = createHash("sha256").update(buf).digest("hex");
    assert.equal(
      hash,
      PINNED,
      `FALCON UNIT source SHA256 mismatch. Got: ${hash}`,
    );
  });

  it("enemy source SHA256 should match pinned hash", async () => {
    const PINNED =
      "362481a1dac0d8e6b9095e43362089684c29015af53949d1a3e2e79a9ba7e4f4";
    const buf = await readFile(ENEMY_SOURCE);
    const hash = createHash("sha256").update(buf).digest("hex");
    assert.equal(
      hash,
      PINNED,
      `VENOM BATTALION source SHA256 mismatch. Got: ${hash}`,
    );
  });

  it("player and enemy source files should be different", async () => {
    const playerBuf = await readFile(PLAYER_SOURCE);
    const enemyBuf = await readFile(ENEMY_SOURCE);
    assert.notDeepEqual(
      playerBuf,
      enemyBuf,
      "Player and enemy source files must be distinct",
    );
  });
});

describe("portrait state variant files", () => {
  const STATES = ["normal", "angry", "defeated"] as const;

  for (const prefix of ["player", "water"] as const) {
    for (const state of STATES) {
      const filename = `${prefix}-${state}.png`;

      it(`${filename} should exist`, () => {
        assert.ok(
          existsSync(resolve(PORTRAIT_DIR, filename)),
          `Missing: ${filename}`,
        );
      });

      it(`${filename} should be a valid 64x64 RGB PNG`, async () => {
        const buf = await readFile(resolve(PORTRAIT_DIR, filename));
        // PNG signature
        assert.equal(buf[0], 0x89);
        assert.equal(buf[1], 0x50);
        assert.equal(buf[2], 0x4e);
        assert.equal(buf[3], 0x47);
        // IHDR: 64x64
        const width = buf.readUInt32BE(16);
        const height = buf.readUInt32BE(20);
        assert.equal(width, 64, `${filename} width should be 64`);
        assert.equal(height, 64, `${filename} height should be 64`);
        // color type 2 = RGB
        assert.equal(buf[25], 2, `${filename} should be RGB`);
      });
    }
  }

  it("player portraits should be distinct from water portraits", async () => {
    for (const state of STATES) {
      const playerBuf = await readFile(
        resolve(PORTRAIT_DIR, `player-${state}.png`),
      );
      const waterBuf = await readFile(
        resolve(PORTRAIT_DIR, `water-${state}.png`),
      );
      assert.notDeepEqual(
        playerBuf,
        waterBuf,
        `player-${state} must differ from water-${state}`,
      );
    }
  });

  it("all three player states should be visually distinct", async () => {
    const bufs = await Promise.all(
      STATES.map((s) => readFile(resolve(PORTRAIT_DIR, `player-${s}.png`))),
    );
    assert.notDeepEqual(bufs[0], bufs[1], "normal and angry should differ");
    assert.notDeepEqual(bufs[1], bufs[2], "angry and defeated should differ");
    assert.notDeepEqual(bufs[0], bufs[2], "normal and defeated should differ");
  });

  it("all three enemy states should be visually distinct", async () => {
    const bufs = await Promise.all(
      STATES.map((s) => readFile(resolve(PORTRAIT_DIR, `water-${s}.png`))),
    );
    assert.notDeepEqual(bufs[0], bufs[1], "normal and angry should differ");
    assert.notDeepEqual(bufs[1], bufs[2], "angry and defeated should differ");
    assert.notDeepEqual(bufs[0], bufs[2], "normal and defeated should differ");
  });
});
