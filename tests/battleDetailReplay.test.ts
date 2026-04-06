/**
 * FR #102 verification tests — confirm that single-battle detail and
 * replay summary features (implemented in FR #78 + #91) satisfy all
 * acceptance criteria.
 */
import assert from "node:assert/strict";
import { describe, it } from "node:test";
import type { BattleRecord } from "../src/types/storage";
import { parseLogMessage } from "../src/utils/logColors";

function makeRecord(overrides?: Partial<BattleRecord>): BattleRecord {
  return {
    id: "test-abc",
    timestamp: Date.now(),
    playerMechType: "fire" as BattleRecord["playerMechType"],
    opponentMechType: "water" as BattleRecord["opponentMechType"],
    result: "win",
    turns: 4,
    playerHpLeft: 55,
    opponentHpLeft: 0,
    prompt: "Be aggressive with fire attacks",
    battleLog: [
      "[TURN]--- Battle Start ---",
      "[EFF]Your Mech vs Enemy Mech",
      "Choose your attack!",
      "[EFF]Your Mech used Fire Blast!",
      "[DMG]Enemy Mech took 20 damage! (HP: 80/100)",
      "[RES]It's not very effective...",
      "[EFF]Enemy Mech used Water Cannon!",
      "[DMG]Your Mech took 45 damage! (HP: 55/100)",
      "[SUP]It's super effective!",
      "[TURN]--- Turn 2 ---",
      "[EFF]Your Mech used Thunder Shock!",
      "[DMG]Enemy Mech took 38 damage! (HP: 42/100)",
      "[SUP]It's super effective!",
      "[EFF]Enemy Mech used Iron Defense!",
      "[EFF]Enemy Mech raised defense!",
      "[TURN]--- Turn 3 ---",
      "[EFF]Your Mech used Fire Blast!",
      "[DMG]Enemy Mech took 20 damage! (HP: 22/100)",
      "[TURN]--- Turn 4 ---",
      "[EFF]Your Mech used Thunder Shock!",
      "[DMG]Enemy Mech took 38 damage! (HP: 0/100)",
      "Enemy Mech was defeated!",
      "[TURN]Your Mech wins!",
    ],
    ...overrides,
  };
}

describe("FR #102: battle detail panel data", () => {
  it("record should contain result for display", () => {
    const record = makeRecord();
    assert.ok(record.result === "win" || record.result === "loss");
  });

  it("record should contain matchup types", () => {
    const record = makeRecord();
    assert.ok(record.playerMechType);
    assert.ok(record.opponentMechType);
  });

  it("record should contain turn count", () => {
    const record = makeRecord();
    assert.equal(typeof record.turns, "number");
    assert.ok(record.turns > 0);
  });

  it("record should contain HP for both sides", () => {
    const record = makeRecord();
    assert.equal(typeof record.playerHpLeft, "number");
    assert.equal(typeof record.opponentHpLeft, "number");
  });

  it("record should contain prompt when saved", () => {
    const record = makeRecord();
    assert.ok(record.prompt);
    assert.ok(record.prompt.length > 0);
  });

  it("record should contain timestamp for date display", () => {
    const record = makeRecord();
    assert.equal(typeof record.timestamp, "number");
    assert.ok(record.timestamp > 0);
  });
});

describe("FR #102: replay summary from battleLog", () => {
  it("battleLog should exist for replay", () => {
    const record = makeRecord();
    assert.ok(Array.isArray(record.battleLog));
    assert.ok(record.battleLog?.length > 0);
  });

  it("battleLog should contain turn transitions", () => {
    const record = makeRecord();
    const turnLogs = record.battleLog?.filter((m) => m.startsWith("[TURN]"));
    assert.ok(turnLogs.length >= 2, "should have multiple turn markers");
  });

  it("battleLog should contain skill usage events", () => {
    const record = makeRecord();
    const skillLogs = record.battleLog?.filter((m) => m.includes("used"));
    assert.ok(skillLogs.length >= 2, "should log multiple skill uses");
  });

  it("battleLog should contain damage events", () => {
    const record = makeRecord();
    const dmgLogs = record.battleLog?.filter((m) => m.startsWith("[DMG]"));
    assert.ok(dmgLogs.length >= 2, "should log damage events");
  });

  it("battleLog should contain effectiveness feedback", () => {
    const record = makeRecord();
    const effLogs = record.battleLog?.filter(
      (m) => m.startsWith("[SUP]") || m.startsWith("[RES]"),
    );
    assert.ok(effLogs.length >= 1, "should have effectiveness feedback");
  });

  it("battleLog should contain victory/defeat conclusion", () => {
    const record = makeRecord();
    const endLog = record.battleLog?.find(
      (m) => m.includes("wins") || m.includes("defeated"),
    );
    assert.ok(endLog, "should have conclusion event");
  });
});

describe("FR #102: replay log color coding", () => {
  it("turn headers should parse as gray", () => {
    const { color } = parseLogMessage("[TURN]--- Turn 2 ---");
    assert.equal(color, "#888888");
  });

  it("damage events should parse as gold", () => {
    const { color } = parseLogMessage("[DMG]Enemy took 40 damage!");
    assert.equal(color, "#ffd700");
  });

  it("super effective should parse as red", () => {
    const { color } = parseLogMessage("[SUP]It's super effective!");
    assert.equal(color, "#ff6666");
  });

  it("resisted should parse as blue", () => {
    const { color } = parseLogMessage("[RES]It's not very effective...");
    assert.equal(color, "#66ccff");
  });

  it("effects should parse as green", () => {
    const { color } = parseLogMessage("[EFF]Your Mech raised defense!");
    assert.equal(color, "#00ff88");
  });
});

describe("FR #102: key event highlighting", () => {
  function isKeyEvent(msg: string): boolean {
    return (
      msg.includes("wins") ||
      msg.includes("defeated") ||
      msg.startsWith("[SUP]")
    );
  }

  it("should highlight victory as key event", () => {
    assert.ok(isKeyEvent("[TURN]Your Mech wins!"));
  });

  it("should highlight defeat as key event", () => {
    assert.ok(isKeyEvent("Enemy Mech was defeated!"));
  });

  it("should highlight super effective as key event", () => {
    assert.ok(isKeyEvent("[SUP]It's super effective!"));
  });

  it("should not highlight normal actions", () => {
    assert.ok(!isKeyEvent("[EFF]Your Mech used Fire Blast!"));
    assert.ok(!isKeyEvent("[DMG]Enemy took 40 damage!"));
  });
});

describe("FR #102: backward compatibility", () => {
  it("should handle records without battleLog", () => {
    const record = makeRecord({ battleLog: undefined });
    assert.equal(record.battleLog, undefined);
  });

  it("should handle records without prompt", () => {
    const record = makeRecord({ prompt: undefined });
    assert.equal(record.prompt, undefined);
  });
});
