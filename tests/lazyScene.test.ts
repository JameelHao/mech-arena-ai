import assert from "node:assert/strict";
import { describe, it } from "node:test";

describe("lazy scene loading", () => {
  it("HistoryScene should NOT be in main.ts scene array", async () => {
    // Read main.ts to verify HistoryScene is not statically registered
    const { readFile } = await import("node:fs/promises");
    const { resolve } = await import("node:path");
    const mainTs = await readFile(
      resolve(import.meta.dirname, "..", "src", "main.ts"),
      "utf-8",
    );

    assert.ok(
      !mainTs.includes("import { HistoryScene }"),
      "main.ts should not statically import HistoryScene",
    );
    assert.ok(
      !mainTs.includes("HistoryScene"),
      "main.ts should not reference HistoryScene at all",
    );
  });

  it("lazyScene.ts should exist and export launchHistoryScene", async () => {
    const { readFile } = await import("node:fs/promises");
    const { resolve } = await import("node:path");
    const lazyTs = await readFile(
      resolve(import.meta.dirname, "..", "src", "utils", "lazyScene.ts"),
      "utf-8",
    );

    assert.ok(
      lazyTs.includes("export async function launchHistoryScene"),
      "should export launchHistoryScene",
    );
    assert.ok(lazyTs.includes("await import("), "should use dynamic import");
    assert.ok(
      lazyTs.includes("scene.add"),
      "should register scene dynamically with scene.add",
    );
  });

  it("BattleResult should use launchHistoryScene instead of scene.start", async () => {
    const { readFile } = await import("node:fs/promises");
    const { resolve } = await import("node:path");
    const resultTs = await readFile(
      resolve(
        import.meta.dirname,
        "..",
        "src",
        "scenes",
        "battle",
        "BattleResult.ts",
      ),
      "utf-8",
    );

    assert.ok(
      !resultTs.includes('scene.start("HistoryScene")'),
      "should not have direct scene.start for HistoryScene",
    );
    assert.ok(
      resultTs.includes("launchHistoryScene"),
      "should use launchHistoryScene",
    );
  });

  it("LobbyScene should use launchHistoryScene instead of scene.start", async () => {
    const { readFile } = await import("node:fs/promises");
    const { resolve } = await import("node:path");
    const lobbyTs = await readFile(
      resolve(import.meta.dirname, "..", "src", "scenes", "LobbyScene.ts"),
      "utf-8",
    );

    assert.ok(
      !lobbyTs.includes('.start("HistoryScene")'),
      "should not have direct scene.start for HistoryScene",
    );
    assert.ok(
      lobbyTs.includes("launchHistoryScene"),
      "should use launchHistoryScene",
    );
  });
});
