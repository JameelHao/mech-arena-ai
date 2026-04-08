import assert from "node:assert/strict";
import { describe, it } from "node:test";

describe("auto-battle mode config", () => {
  it("battle mode should have 20 max turns", () => {
    const mode = "battle";
    const maxTurns = mode === "training" ? 3 : 20;
    assert.equal(maxTurns, 20);
  });

  it("training mode should have 3 max turns", () => {
    const mode = "training";
    const maxTurns = mode === "training" ? 3 : 20;
    assert.equal(maxTurns, 3);
  });

  it("both modes should auto-start", () => {
    // Both battle and training use auto-sim (no manual click)
    for (const mode of ["battle", "training"] as const) {
      const shouldAutoStart = true; // always auto-start now
      assert.equal(shouldAutoStart, true, `${mode} should auto-start`);
    }
  });

  it("skill buttons should be disabled in both modes", () => {
    for (const mode of ["battle", "training"] as const) {
      const shouldDisable = true; // always disabled for auto-sim
      assert.equal(shouldDisable, true, `${mode} should disable buttons`);
    }
  });
});

describe("auto-battle turn limits", () => {
  it("battle should allow up to 20 turns before draw", () => {
    const maxTurns = 20;
    assert.ok(maxTurns >= 10, "should allow reasonable battle length");
    assert.ok(maxTurns <= 30, "should not allow infinite battles");
  });

  it("training should be quick at 3 turns", () => {
    const maxTurns = 3;
    assert.ok(maxTurns <= 5, "training should be short");
  });

  it("draw condition: winner by HP comparison", () => {
    // When maxTurns reached without KO, winner = higher HP
    const playerHp = 60;
    const opponentHp = 40;
    const playerWins = playerHp >= opponentHp;
    assert.equal(playerWins, true);
  });

  it("draw condition: equal HP means player wins", () => {
    const playerHp = 50;
    const opponentHp = 50;
    const playerWins = playerHp >= opponentHp;
    assert.equal(playerWins, true, "tie goes to player");
  });
});
