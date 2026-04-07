/**
 * Lazy scene loader — dynamically imports and registers Phaser scenes on demand.
 */

/**
 * Launch HistoryScene on demand. Dynamically imports and registers
 * the scene if not already present, then starts it.
 */
export async function launchHistoryScene(
  currentScene: Phaser.Scene,
): Promise<void> {
  if (!currentScene.scene.get("HistoryScene")) {
    const { HistoryScene } = await import("../scenes/HistoryScene");
    currentScene.scene.add("HistoryScene", HistoryScene, false);
  }
  currentScene.scene.start("HistoryScene");
}
