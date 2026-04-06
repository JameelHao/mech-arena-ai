import assert from "node:assert/strict";
import { createHash } from "node:crypto";
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

  it("player-portrait-source.jpg SHA256 should match pinned hash", async () => {
    const PINNED_SHA256 =
      "a7edb06365c3699dab470dda99acd36f722835b97a59fb34ef848f48c2003e52";
    const buf = await readFile(REF_PATH);
    const hash = createHash("sha256").update(buf).digest("hex");
    assert.equal(
      hash,
      PINNED_SHA256,
      `Source file SHA256 mismatch — file may have been silently replaced. Got: ${hash}`,
    );
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

  it("player portraits should be 64x64 PNG (IHDR check)", async () => {
    for (const state of STATES) {
      const buf = await readFile(resolve(PORTRAIT_DIR, `player-${state}.png`));
      // PNG IHDR chunk starts at byte 16: width (4 bytes BE) + height (4 bytes BE) + bit depth + color type
      const width = buf.readUInt32BE(16);
      const height = buf.readUInt32BE(20);
      assert.equal(width, 64, `player-${state} width should be 64`);
      assert.equal(height, 64, `player-${state} height should be 64`);
      // color type at byte 25: 2 = RGB (no alpha)
      const colorType = buf[25];
      assert.equal(
        colorType,
        2,
        `player-${state} should be RGB (color type 2), got ${colorType}`,
      );
    }
  });

  it("crop-portraits.py HEAD_CROP should be a valid portrait-strip crop region", async () => {
    const script = await readFile(
      resolve(ROOT, "scripts/crop-portraits.py"),
      "utf-8",
    );
    // Extract HEAD_CROP = (x0, y0, x1, y1)
    const match = script.match(
      /HEAD_CROP\s*=\s*\((\d+),\s*(\d+),\s*(\d+),\s*(\d+)\)/,
    );
    assert.ok(match, "HEAD_CROP constant not found in crop-portraits.py");
    const [, x0Str, y0Str, x1Str, y1Str] = match;
    const x0 = Number(x0Str);
    const y0 = Number(y0Str);
    const x1 = Number(x1Str);
    const y1 = Number(y1Str);
    // Crop region must be within source image bounds (256x256)
    assert.ok(x0 >= 0 && x0 < 256, `x0=${x0} out of bounds`);
    assert.ok(y0 >= 0 && y0 < 256, `y0=${y0} out of bounds`);
    assert.ok(x1 > x0 && x1 <= 256, `x1=${x1} invalid (must be > x0 and <= 256)`);
    assert.ok(y1 > y0 && y1 <= 256, `y1=${y1} invalid (must be > y0 and <= 256)`);
    // Crop should be a reasonable portrait-sized sub-region, not the entire image
    const cropW = x1 - x0;
    const cropH = y1 - y0;
    assert.ok(
      cropW > 30 && cropW < 220,
      `HEAD_CROP width=${cropW} is unreasonable — should be a focused portrait region`,
    );
    assert.ok(
      cropH > 30 && cropH < 220,
      `HEAD_CROP height=${cropH} is unreasonable — should be a focused portrait region`,
    );
    // Crop area must be less than 50% of total image area to ensure it's a
    // focused portrait strip region, not a lazy full-image resize
    const cropArea = cropW * cropH;
    const totalArea = 256 * 256;
    assert.ok(
      cropArea < totalArea * 0.5,
      `HEAD_CROP area=${cropArea} is too large (>${totalArea * 0.5}) — must be a focused portrait strip region`,
    );
  });

  it("all three player portrait states should be visually distinct files", async () => {
    const bufs = await Promise.all(
      STATES.map((s) => readFile(resolve(PORTRAIT_DIR, `player-${s}.png`))),
    );
    assert.notDeepEqual(bufs[0], bufs[1], "normal and angry should differ");
    assert.notDeepEqual(bufs[1], bufs[2], "angry and defeated should differ");
    assert.notDeepEqual(bufs[0], bufs[2], "normal and defeated should differ");
  });
});
