/**
 * Mech Arena AI - Main Entry
 */

import { BattleScene } from "@/scenes/BattleScene";
import { HistoryScene } from "@/scenes/HistoryScene";
import { registerSW } from "@/utils/pwa";
import Phaser from "phaser";

const config: Phaser.Types.Core.GameConfig = {
  type: Phaser.AUTO,
  backgroundColor: "#1a1a1a",
  scale: {
    mode: Phaser.Scale.FIT,
    autoCenter: Phaser.Scale.CENTER_BOTH,
    width: 800,
    height: 600,
    min: { width: 320, height: 240 },
    max: { width: 1920, height: 1080 },
  },
  scene: [BattleScene, HistoryScene],
};

new Phaser.Game(config);
registerSW();
