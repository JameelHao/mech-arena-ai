/**
 * Mech Arena AI - Main Entry
 */

import Phaser from "phaser";

const config: Phaser.Types.Core.GameConfig = {
  type: Phaser.AUTO,
  width: 800,
  height: 600,
  backgroundColor: "#1a1a1a",
  scene: {
    preload: () => {
      // TODO: Load assets
    },
    create: function () {
      const text = this.add.text(400, 300, "Mech Arena AI", {
        fontSize: "32px",
        color: "#00ff88",
      });
      text.setOrigin(0.5);
    },
  },
};

new Phaser.Game(config);
