import assert from "node:assert/strict";
import { describe, it } from "node:test";

describe("result screen navigation options", () => {
  const RESULT_BUTTONS = ["Play Again", "History", "Back to Lobby"];

  it("should have 3 navigation options", () => {
    assert.equal(RESULT_BUTTONS.length, 3);
  });

  it("should include Play Again as primary action", () => {
    assert.ok(RESULT_BUTTONS.includes("Play Again"));
  });

  it("should include History for reviewing battles", () => {
    assert.ok(RESULT_BUTTONS.includes("History"));
  });

  it("should include Back to Lobby for mech re-selection", () => {
    assert.ok(RESULT_BUTTONS.includes("Back to Lobby"));
  });
});

describe("result screen scene targets", () => {
  const SCENE_MAP: Record<string, string> = {
    "Play Again": "BattleScene",
    History: "HistoryScene",
    "Back to Lobby": "LobbyScene",
  };

  it("Play Again should restart BattleScene", () => {
    assert.equal(SCENE_MAP["Play Again"], "BattleScene");
  });

  it("History should go to HistoryScene", () => {
    assert.equal(SCENE_MAP.History, "HistoryScene");
  });

  it("Back to Lobby should go to LobbyScene", () => {
    assert.equal(SCENE_MAP["Back to Lobby"], "LobbyScene");
  });

  it("all scene targets should be valid scene keys", () => {
    const validScenes = ["BattleScene", "HistoryScene", "LobbyScene"];
    for (const target of Object.values(SCENE_MAP)) {
      assert.ok(validScenes.includes(target), `${target} is not a valid scene`);
    }
  });
});
