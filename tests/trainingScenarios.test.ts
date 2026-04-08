import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { TRAINING_SCENARIOS } from "../src/data/trainingScenarios";

describe("TRAINING_SCENARIOS", () => {
  it("should have at least 4 scenarios", () => {
    assert.ok(TRAINING_SCENARIOS.length >= 4);
  });

  it("each scenario should have required fields", () => {
    for (const s of TRAINING_SCENARIOS) {
      assert.ok(s.id.length > 0, `${s.name} missing id`);
      assert.ok(s.name.length > 0, `id ${s.id} missing name`);
      assert.ok(s.icon.length > 0, `${s.name} missing icon`);
      assert.ok(s.description.length > 0, `${s.name} missing description`);
      assert.ok(s.opponentHp > 0, `${s.name} opponentHp must be > 0`);
      assert.ok(s.maxTurns >= 1, `${s.name} maxTurns must be >= 1`);
    }
  });

  it("scenario IDs should be unique", () => {
    const ids = TRAINING_SCENARIOS.map((s) => s.id);
    assert.equal(new Set(ids).size, ids.length);
  });

  it("should include Standard Drill", () => {
    const std = TRAINING_SCENARIOS.find((s) => s.id === "standard");
    assert.ok(std);
    assert.equal(std.opponentHp, 100);
    assert.equal(std.maxTurns, 3);
  });

  it("should include Damage Test with low HP opponent", () => {
    const dmg = TRAINING_SCENARIOS.find((s) => s.id === "damage");
    assert.ok(dmg);
    assert.ok(dmg.opponentHp <= 50, "damage test should have weak opponent");
    assert.equal(dmg.maxTurns, 1);
  });

  it("should include Survival Test with high HP opponent", () => {
    const surv = TRAINING_SCENARIOS.find((s) => s.id === "survival");
    assert.ok(surv);
    assert.ok(surv.opponentHp >= 150, "survival should have tough opponent");
  });

  it("should include Endurance Run with more turns", () => {
    const end = TRAINING_SCENARIOS.find((s) => s.id === "endurance");
    assert.ok(end);
    assert.ok(end.maxTurns >= 5, "endurance should have more turns");
  });
});

describe("scenario application logic", () => {
  it("should override opponent HP from scenario", () => {
    const baseHp = 100;
    const scenario = TRAINING_SCENARIOS.find((s) => s.id === "damage");
    const effectiveHp = scenario ? scenario.opponentHp : baseHp;
    assert.equal(effectiveHp, 30);
  });

  it("should override maxTurns from scenario", () => {
    const defaultMax = 3;
    const scenario = TRAINING_SCENARIOS.find((s) => s.id === "endurance");
    const maxTurns = scenario?.maxTurns ?? defaultMax;
    assert.equal(maxTurns, 5);
  });

  it("should use default when no scenario provided", () => {
    const scenario = undefined;
    const maxTurns = scenario?.maxTurns ?? 3;
    assert.equal(maxTurns, 3);
  });
});
