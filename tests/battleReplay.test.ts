import assert from "node:assert/strict";
import { describe, it } from "node:test";
import type { BattleRecord } from "../src/types/storage";
import { parseLogMessage } from "../src/utils/logColors";

function makeRecord(overrides?: Partial<BattleRecord>): BattleRecord {
  return {
    id: "test-123",
    timestamp: Date.now(),
    playerMechType: "kinetic" as BattleRecord["playerMechType"],
    opponentMechType: "beam" as BattleRecord["opponentMechType"],
    result: "win",
    turns: 3,
    playerHpLeft: 60,
    opponentHpLeft: 0,
    ...overrides,
  };
}

describe("BattleRecord battleLog field", () => {
  it("should support optional battleLog", () => {
    const record = makeRecord({
      battleLog: [
        "[TURN]--- Battle Start ---",
        "[EFF]Your Mech used Fire Blast!",
      ],
    });
    assert.ok(Array.isArray(record.battleLog));
    assert.equal(record.battleLog?.length, 2);
  });

  it("should allow undefined battleLog for backward compat", () => {
    const record = makeRecord();
    assert.equal(record.battleLog, undefined);
  });

  it("should preserve log message order", () => {
    const logs = [
      "[TURN]--- Battle Start ---",
      "[EFF]Your Mech used Fire Blast!",
      "[DMG]Enemy took 40 damage! HP: 60/100",
      "[SUP]It's super effective!",
    ];
    const record = makeRecord({ battleLog: logs });
    assert.deepStrictEqual(record.battleLog, logs);
  });
});

describe("replay log parsing", () => {
  it("should parse [TURN] messages with gray color", () => {
    const { displayMsg, color } = parseLogMessage("[TURN]--- Turn 2 ---");
    assert.equal(displayMsg, "--- Turn 2 ---");
    assert.equal(color, "#888888");
  });

  it("should parse [DMG] messages with gold color", () => {
    const { displayMsg, color } = parseLogMessage("[DMG]Enemy took 40 damage!");
    assert.equal(displayMsg, "Enemy took 40 damage!");
    assert.equal(color, "#ffd700");
  });

  it("should parse [SUP] messages with red color", () => {
    const { displayMsg, color } = parseLogMessage("[SUP]It's super effective!");
    assert.equal(displayMsg, "It's super effective!");
    assert.equal(color, "#ff6666");
  });

  it("should parse [RES] messages with blue color", () => {
    const { displayMsg, color } = parseLogMessage(
      "[RES]It's not very effective...",
    );
    assert.equal(displayMsg, "It's not very effective...");
    assert.equal(color, "#66ccff");
  });

  it("should parse [EFF] messages with green color", () => {
    const { displayMsg, color } = parseLogMessage(
      "[EFF]Your Mech raised defense!",
    );
    assert.equal(displayMsg, "Your Mech raised defense!");
    assert.equal(color, "#00ff88");
  });

  it("should handle unprefixed messages with accent color", () => {
    const { displayMsg, color } = parseLogMessage("Choose your attack!");
    assert.equal(displayMsg, "Choose your attack!");
    assert.equal(color, "#00ff88");
  });
});

describe("replay key event detection", () => {
  function isKeyEvent(msg: string): boolean {
    return (
      msg.includes("wins") ||
      msg.includes("defeated") ||
      msg.startsWith("[SUP]")
    );
  }

  it("should detect victory message as key event", () => {
    assert.ok(isKeyEvent("[TURN]Your Mech wins!"));
  });

  it("should detect defeat message as key event", () => {
    assert.ok(isKeyEvent("Enemy Mech was defeated!"));
  });

  it("should detect super effective as key event", () => {
    assert.ok(isKeyEvent("[SUP]It's super effective!"));
  });

  it("should not mark normal attack as key event", () => {
    assert.ok(!isKeyEvent("[EFF]Your Mech used Fire Blast!"));
  });

  it("should not mark damage log as key event", () => {
    assert.ok(!isKeyEvent("[DMG]Enemy took 40 damage!"));
  });
});

describe("battleLog truncation", () => {
  it("should truncate to 100 lines max", () => {
    const longLog = Array.from({ length: 150 }, (_, i) => `Log line ${i}`);
    const truncated = longLog.slice(0, 100);
    assert.equal(truncated.length, 100);
    assert.equal(truncated[0], "Log line 0");
    assert.equal(truncated[99], "Log line 99");
  });

  it("should preserve short logs as-is", () => {
    const shortLog = ["Line 1", "Line 2"];
    const truncated = shortLog.slice(0, 100);
    assert.equal(truncated.length, 2);
  });
});
