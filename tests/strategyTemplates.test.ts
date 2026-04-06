import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { STRATEGY_TEMPLATES } from "../src/data/strategies";

describe("STRATEGY_TEMPLATES", () => {
  it("should contain at least 3 templates", () => {
    assert.ok(STRATEGY_TEMPLATES.length >= 3);
  });

  it("each template should have name, icon, and prompt", () => {
    for (const tmpl of STRATEGY_TEMPLATES) {
      assert.ok(tmpl.name.length > 0, "name should not be empty");
      assert.ok(tmpl.icon.length > 0, "icon should not be empty");
      assert.ok(tmpl.prompt.length > 0, "prompt should not be empty");
    }
  });

  it("should include Aggressive template", () => {
    assert.ok(STRATEGY_TEMPLATES.some((t) => t.name === "Aggressive"));
  });

  it("should include Balanced template", () => {
    assert.ok(STRATEGY_TEMPLATES.some((t) => t.name === "Balanced"));
  });

  it("should include Defensive template", () => {
    assert.ok(STRATEGY_TEMPLATES.some((t) => t.name === "Defensive"));
  });

  it("template names should be unique", () => {
    const names = STRATEGY_TEMPLATES.map((t) => t.name);
    assert.equal(new Set(names).size, names.length);
  });

  it("prompts should be non-trivial (> 30 chars)", () => {
    for (const tmpl of STRATEGY_TEMPLATES) {
      assert.ok(tmpl.prompt.length > 30, `${tmpl.name} prompt too short`);
    }
  });

  it("prompts should be within 500 char limit", () => {
    for (const tmpl of STRATEGY_TEMPLATES) {
      assert.ok(
        tmpl.prompt.length <= 500,
        `${tmpl.name} prompt exceeds 500 chars`,
      );
    }
  });
});

describe("strategy template content", () => {
  it("Aggressive should mention high damage", () => {
    const tmpl = STRATEGY_TEMPLATES.find((t) => t.name === "Aggressive");
    assert.ok(tmpl);
    assert.ok(
      tmpl.prompt.toLowerCase().includes("damage") ||
        tmpl.prompt.toLowerCase().includes("attack"),
    );
  });

  it("Balanced should mention both offense and defense", () => {
    const tmpl = STRATEGY_TEMPLATES.find((t) => t.name === "Balanced");
    assert.ok(tmpl);
    assert.ok(tmpl.prompt.toLowerCase().includes("defense"));
    assert.ok(
      tmpl.prompt.toLowerCase().includes("attack") ||
        tmpl.prompt.toLowerCase().includes("offense"),
    );
  });

  it("Defensive should mention survival or defense", () => {
    const tmpl = STRATEGY_TEMPLATES.find((t) => t.name === "Defensive");
    assert.ok(tmpl);
    assert.ok(
      tmpl.prompt.toLowerCase().includes("defense") ||
        tmpl.prompt.toLowerCase().includes("survival") ||
        tmpl.prompt.toLowerCase().includes("survive"),
    );
  });
});
