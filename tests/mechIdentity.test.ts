import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { OPPONENT_MECH, PLAYER_MECH } from "../src/data/mechs";

describe("mech identity fields", () => {
  it("PLAYER_MECH should have codename FALCON UNIT", () => {
    assert.equal(PLAYER_MECH.codename, "FALCON UNIT");
  });

  it("OPPONENT_MECH should have codename VENOM BATTALION", () => {
    assert.equal(OPPONENT_MECH.codename, "VENOM BATTALION");
  });

  it("PLAYER_MECH should have role Assault", () => {
    assert.equal(PLAYER_MECH.role, "Assault");
  });

  it("OPPONENT_MECH should have role Tank", () => {
    assert.equal(OPPONENT_MECH.role, "Tank");
  });

  it("both mechs should have bio strings", () => {
    assert.ok(PLAYER_MECH.bio && PLAYER_MECH.bio.length > 0);
    assert.ok(OPPONENT_MECH.bio && OPPONENT_MECH.bio.length > 0);
  });

  it("codenames should be different", () => {
    assert.notEqual(PLAYER_MECH.codename, OPPONENT_MECH.codename);
  });

  it("roles should be different", () => {
    assert.notEqual(PLAYER_MECH.role, OPPONENT_MECH.role);
  });
});

describe("mech HUD display name", () => {
  function getHudName(mech: { codename?: string; name: string }): string {
    return `${mech.codename ?? mech.name}  Lv.5`;
  }

  it("should use codename when available", () => {
    assert.equal(getHudName(PLAYER_MECH), "FALCON UNIT  Lv.5");
  });

  it("should fall back to name when no codename", () => {
    assert.equal(getHudName({ name: "Generic" }), "Generic  Lv.5");
  });

  it("opponent HUD should show VENOM BATTALION", () => {
    assert.equal(getHudName(OPPONENT_MECH), "VENOM BATTALION  Lv.5");
  });
});

describe("mech info card display", () => {
  function getCardName(mech: { codename?: string; name: string }): string {
    return mech.codename ?? mech.name;
  }

  it("should prefer codename for card title", () => {
    assert.equal(getCardName(PLAYER_MECH), "FALCON UNIT");
  });

  it("should fall back to name if no codename", () => {
    assert.equal(getCardName({ name: "Test" }), "Test");
  });
});
