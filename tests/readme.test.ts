import assert from "node:assert";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, it } from "node:test";

describe("README.md", () => {
  const readmePath = resolve(import.meta.dirname, "..", "README.md");
  const content = readFileSync(readmePath, "utf-8");

  it("should not contain 'hello'", () => {
    assert.ok(!content.includes("hello"), "README.md must not contain 'hello'");
  });

  it("should preserve existing content", () => {
    assert.ok(
      content.includes("# Mech Arena AI"),
      "README.md must keep the original title",
    );
  });
});
