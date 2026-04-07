import assert from "node:assert/strict";
import { afterEach, describe, it } from "node:test";
import {
  initSound,
  isMuted,
  playAttackSound,
  playClickSound,
  playDefeatSound,
  playHitSound,
  playVictorySound,
  resumeSound,
  setMuted,
} from "../src/utils/soundManager";

describe("soundManager", () => {
  afterEach(() => {
    setMuted(false);
  });

  describe("mute state", () => {
    it("should start unmuted by default", () => {
      assert.equal(isMuted(), false);
    });

    it("should toggle mute state", () => {
      setMuted(true);
      assert.equal(isMuted(), true);
      setMuted(false);
      assert.equal(isMuted(), false);
    });
  });

  describe("sound functions should not throw without AudioContext", () => {
    it("initSound should not throw", () => {
      assert.doesNotThrow(() => initSound());
    });

    it("resumeSound should not throw", () => {
      assert.doesNotThrow(() => resumeSound());
    });

    it("playClickSound should not throw when muted", () => {
      setMuted(true);
      assert.doesNotThrow(() => playClickSound());
    });

    it("playAttackSound should not throw for each type", () => {
      setMuted(true);
      assert.doesNotThrow(() => playAttackSound("kinetic"));
      assert.doesNotThrow(() => playAttackSound("beam"));
      assert.doesNotThrow(() => playAttackSound("emp"));
      assert.doesNotThrow(() => playAttackSound("defense"));
    });

    it("playHitSound should not throw when muted", () => {
      setMuted(true);
      assert.doesNotThrow(() => playHitSound());
    });

    it("playVictorySound should not throw when muted", () => {
      setMuted(true);
      assert.doesNotThrow(() => playVictorySound());
    });

    it("playDefeatSound should not throw when muted", () => {
      setMuted(true);
      assert.doesNotThrow(() => playDefeatSound());
    });

    it("playClickSound should not throw without AudioContext", () => {
      // AudioContext not available in Node test env
      assert.doesNotThrow(() => playClickSound());
    });

    it("playAttackSound should not throw without AudioContext", () => {
      assert.doesNotThrow(() => playAttackSound("kinetic"));
    });

    it("playHitSound should not throw without AudioContext", () => {
      assert.doesNotThrow(() => playHitSound());
    });

    it("playVictorySound should not throw without AudioContext", () => {
      assert.doesNotThrow(() => playVictorySound());
    });

    it("playDefeatSound should not throw without AudioContext", () => {
      assert.doesNotThrow(() => playDefeatSound());
    });
  });
});
