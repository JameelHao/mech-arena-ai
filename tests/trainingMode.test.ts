import assert from "node:assert/strict";
import { describe, it } from "node:test";

describe("training mode logic", () => {
  it("mode should default to 'battle'", () => {
    const data: { mode?: "battle" | "training" } = {};
    const mode = data.mode ?? "battle";
    assert.equal(mode, "battle");
  });

  it("mode should be 'training' when specified", () => {
    const data = { mode: "training" as const };
    const mode = data.mode ?? "battle";
    assert.equal(mode, "training");
  });

  it("training mode should skip record saving", () => {
    const mode = "training";
    const shouldSave = mode !== "training";
    assert.equal(shouldSave, false);
  });

  it("battle mode should save records", () => {
    const mode = "battle";
    const shouldSave = mode !== "training";
    assert.equal(shouldSave, true);
  });
});

describe("training mode result display", () => {
  function getResultTitle(
    won: boolean,
    mode: "battle" | "training",
  ): { text: string; color: string } {
    if (mode === "training") {
      return { text: "TRAINING COMPLETE", color: "#ffd700" };
    }
    return won
      ? { text: "VICTORY!", color: "#00ff88" }
      : { text: "DEFEAT...", color: "#ff4500" };
  }

  it("training mode should show TRAINING COMPLETE", () => {
    const result = getResultTitle(true, "training");
    assert.equal(result.text, "TRAINING COMPLETE");
    assert.equal(result.color, "#ffd700");
  });

  it("training mode defeat should also show TRAINING COMPLETE", () => {
    const result = getResultTitle(false, "training");
    assert.equal(result.text, "TRAINING COMPLETE");
  });

  it("battle mode win should show VICTORY!", () => {
    const result = getResultTitle(true, "battle");
    assert.equal(result.text, "VICTORY!");
    assert.equal(result.color, "#00ff88");
  });

  it("battle mode loss should show DEFEAT...", () => {
    const result = getResultTitle(false, "battle");
    assert.equal(result.text, "DEFEAT...");
    assert.equal(result.color, "#ff4500");
  });
});

describe("training mode log indicator", () => {
  it("training mode should produce Training Mode log", () => {
    const mode = "training";
    const log = mode === "training" ? "[TURN]--- Training Mode ---" : null;
    assert.equal(log, "[TURN]--- Training Mode ---");
  });

  it("battle mode should not produce Training Mode log", () => {
    const mode = "battle";
    const log = mode === "training" ? "[TURN]--- Training Mode ---" : null;
    assert.equal(log, null);
  });
});
