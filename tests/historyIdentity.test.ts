import assert from "node:assert/strict";
import { describe, it } from "node:test";
import type { BattleRecord } from "../src/types/storage";

function makeRecord(overrides?: Partial<BattleRecord>): BattleRecord {
  return {
    id: "test-id",
    timestamp: Date.now(),
    playerMechType: "kinetic" as BattleRecord["playerMechType"],
    opponentMechType: "beam" as BattleRecord["opponentMechType"],
    result: "win",
    turns: 3,
    playerHpLeft: 55,
    opponentHpLeft: 0,
    ...overrides,
  };
}

describe("BattleRecord identity fields", () => {
  it("should support playerMechCodename", () => {
    const record = makeRecord({ playerMechCodename: "FALCON UNIT" });
    assert.equal(record.playerMechCodename, "FALCON UNIT");
  });

  it("should support combatCoreName", () => {
    const record = makeRecord({ combatCoreName: "Aggressive" });
    assert.equal(record.combatCoreName, "Aggressive");
  });

  it("should allow both fields undefined for backward compat", () => {
    const record = makeRecord();
    assert.equal(record.playerMechCodename, undefined);
    assert.equal(record.combatCoreName, undefined);
  });

  it("should store both identity fields together", () => {
    const record = makeRecord({
      playerMechCodename: "HYDRA SENTINEL",
      combatCoreName: "Defensive",
    });
    assert.equal(record.playerMechCodename, "HYDRA SENTINEL");
    assert.equal(record.combatCoreName, "Defensive");
  });

  it("should coexist with existing optional fields", () => {
    const record = makeRecord({
      prompt: "test prompt",
      battleLog: ["[TURN]--- Battle Start ---"],
      playerMechCodename: "VOLT STRIKER",
      combatCoreName: "Balanced",
    });
    assert.equal(record.prompt, "test prompt");
    assert.ok(Array.isArray(record.battleLog));
    assert.equal(record.playerMechCodename, "VOLT STRIKER");
    assert.equal(record.combatCoreName, "Balanced");
  });
});

describe("history detail display logic", () => {
  function getIdentityLines(
    record: BattleRecord,
  ): Array<{ label: string; value: string }> {
    const lines: Array<{ label: string; value: string }> = [];
    if (record.playerMechCodename) {
      lines.push({ label: "Mech", value: record.playerMechCodename });
    }
    if (record.combatCoreName) {
      lines.push({ label: "Core", value: record.combatCoreName });
    }
    return lines;
  }

  it("should show mech codename when present", () => {
    const lines = getIdentityLines(
      makeRecord({ playerMechCodename: "FALCON UNIT" }),
    );
    assert.equal(lines.length, 1);
    assert.equal(lines[0].label, "Mech");
    assert.equal(lines[0].value, "FALCON UNIT");
  });

  it("should show combat core when present", () => {
    const lines = getIdentityLines(
      makeRecord({ combatCoreName: "Aggressive" }),
    );
    assert.equal(lines.length, 1);
    assert.equal(lines[0].label, "Core");
  });

  it("should show both when both present", () => {
    const lines = getIdentityLines(
      makeRecord({
        playerMechCodename: "HYDRA SENTINEL",
        combatCoreName: "Defensive",
      }),
    );
    assert.equal(lines.length, 2);
  });

  it("should show nothing for old records without identity", () => {
    const lines = getIdentityLines(makeRecord());
    assert.equal(lines.length, 0);
  });
});
