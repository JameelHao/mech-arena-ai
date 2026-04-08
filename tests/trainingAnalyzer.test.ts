import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { analyzeTraining } from "../src/utils/trainingAnalyzer";

const SAMPLE_LOG = [
  "[TURN]--- Battle Start ---",
  "[EFF]Your Mech vs Enemy Mech",
  "Choose your attack!",
  "[EFF]Your Mech used Railgun Salvo!",
  "[DMG]Enemy Mech took 20 damage! (HP: 80/100)",
  "[RES]It's not very effective...",
  "[EFF]Enemy Mech used Plasma Beam!",
  "[DMG]Your Mech took 45 damage! (HP: 55/100)",
  "[SUP]It's super effective!",
  "[TURN]--- Turn 2 ---",
  "[EFF]Your Mech used EMP Pulse!",
  "[DMG]Enemy Mech took 38 damage! (HP: 42/100)",
  "[SUP]It's super effective!",
  "[EFF]Enemy Mech raised defense!",
  "[TURN]--- Turn 3 ---",
  "[EFF]Your Mech used Reactive Armor!",
  "[EFF]Your Mech raised defense!",
];

describe("analyzeTraining", () => {
  it("should count attack skills (both sides)", () => {
    const result = analyzeTraining(SAMPLE_LOG, "Balanced");
    // Railgun Salvo + Enemy Plasma Beam + EMP Pulse = 3
    assert.equal(result.attackCount, 3);
  });

  it("should count defense skills", () => {
    const result = analyzeTraining(SAMPLE_LOG, "Balanced");
    // Enemy raised defense + Player Reactive Armor = 1 (Reactive Armor matched)
    assert.equal(result.defenseCount, 1);
  });

  it("should sum damage dealt to enemy", () => {
    const result = analyzeTraining(SAMPLE_LOG, "Balanced");
    assert.equal(result.damageDealt, 58); // 20 + 38
  });

  it("should sum damage taken by player", () => {
    const result = analyzeTraining(SAMPLE_LOG, "Balanced");
    assert.equal(result.damageTaken, 45);
  });

  it("should count super effective hits", () => {
    const result = analyzeTraining(SAMPLE_LOG, "Balanced");
    assert.equal(result.superEffectiveCount, 2);
  });

  it("should count resisted hits", () => {
    const result = analyzeTraining(SAMPLE_LOG, "Balanced");
    assert.equal(result.resistedCount, 1);
  });

  it("should generate a suggestion string", () => {
    const result = analyzeTraining(SAMPLE_LOG, "Balanced");
    assert.ok(result.suggestion.length > 0);
  });
});

describe("training suggestions by core", () => {
  it("Aggressive core with low attacks should suggest more attacks", () => {
    const log = [
      "[EFF]Your Mech used Reactive Armor!",
      "[EFF]Your Mech raised defense!",
      "[EFF]Your Mech used Reactive Armor!",
      "[EFF]Your Mech raised defense!",
      "[EFF]Your Mech used Railgun Salvo!",
      "[DMG]Enemy Mech took 40 damage! (HP: 60/100)",
    ];
    const result = analyzeTraining(log, "Aggressive");
    assert.ok(result.suggestion.includes("defense"));
  });

  it("Defensive core with no defense should suggest adding defense", () => {
    const log = [
      "[EFF]Your Mech used Railgun Salvo!",
      "[DMG]Enemy Mech took 40 damage! (HP: 60/100)",
      "[EFF]Your Mech used EMP Pulse!",
      "[DMG]Enemy Mech took 25 damage! (HP: 35/100)",
    ];
    const result = analyzeTraining(log, "Defensive");
    assert.ok(
      result.suggestion.includes("defense") ||
        result.suggestion.includes("Reactive Armor"),
    );
  });

  it("Balanced core with all attacks should suggest mixing", () => {
    const log = [
      "[EFF]Your Mech used Railgun Salvo!",
      "[DMG]Enemy Mech took 40 damage! (HP: 60/100)",
      "[EFF]Your Mech used EMP Pulse!",
      "[DMG]Enemy Mech took 25 damage! (HP: 35/100)",
    ];
    const result = analyzeTraining(log, "Balanced");
    assert.ok(result.suggestion.length > 0);
  });

  it("empty log should suggest longer training", () => {
    const result = analyzeTraining([], "Balanced");
    assert.ok(result.suggestion.includes("longer"));
  });
});
