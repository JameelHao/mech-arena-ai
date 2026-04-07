import assert from "node:assert/strict";
import { existsSync } from "node:fs";
import { readFile } from "node:fs/promises";
import { resolve } from "node:path";
import { describe, it } from "node:test";

const ROOT = resolve(import.meta.dirname, "..");
const MECH_DIR = resolve(ROOT, "src/assets/mechs");
const PORTRAIT_DIR = resolve(ROOT, "src/assets/portraits");

const MECH_TYPES = ["kinetic", "beam", "emp"] as const;
const STATES = ["normal", "angry", "defeated"] as const;

describe("mech sprite files", () => {
  for (const type of MECH_TYPES) {
    const filename = `${type}-mech.png`;

    it(`${filename} should exist`, () => {
      assert.ok(existsSync(resolve(MECH_DIR, filename)));
    });

    it(`${filename} should be a valid PNG`, async () => {
      const buf = await readFile(resolve(MECH_DIR, filename));
      assert.ok(buf.length > 100, "file should not be empty");
      assert.equal(buf[0], 0x89);
      assert.equal(buf[1], 0x50);
    });
  }
});

describe("portrait files", () => {
  for (const type of MECH_TYPES) {
    for (const state of STATES) {
      const filename = `${type}-${state}.png`;

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

  it("all types should have visually distinct normal portraits", async () => {
    const bufs = await Promise.all(
      MECH_TYPES.map((t) => readFile(resolve(PORTRAIT_DIR, `${t}-normal.png`))),
    );
    assert.notDeepEqual(bufs[0], bufs[1], "kinetic vs beam");
    assert.notDeepEqual(bufs[1], bufs[2], "beam vs emp");
    assert.notDeepEqual(bufs[0], bufs[2], "kinetic vs emp");
  });

  it("each type should have distinct state variants", async () => {
    for (const type of MECH_TYPES) {
      const bufs = await Promise.all(
        STATES.map((s) => readFile(resolve(PORTRAIT_DIR, `${type}-${s}.png`))),
      );
      assert.notDeepEqual(bufs[0], bufs[1], `${type} normal vs angry`);
      assert.notDeepEqual(bufs[1], bufs[2], `${type} angry vs defeated`);
      assert.notDeepEqual(bufs[0], bufs[2], `${type} normal vs defeated`);
    }
  });
});
