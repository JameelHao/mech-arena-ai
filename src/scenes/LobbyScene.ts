/**
 * LobbyScene - Pre-battle setup showing mech preview, skills, and strategy.
 */

import Phaser from "phaser";
import { ASSET_REGISTRY, preloadAllAssets } from "../assets";
import { OPPONENT_MECH, PLAYER_MECH } from "../data/mechs";
import { loadMechPrompt } from "../utils/storage";

const COLORS = {
  background: 0x1a1a1a,
  text: "#ffffff",
  accent: "#00ff88",
  accentHex: 0x00ff88,
  panelBg: 0x2a2a2a,
  panelBorder: 0x444444,
  dimText: "#888888",
  buttonBg: 0x333333,
  buttonHover: 0x444444,
  fire: "#FF4500",
  water: "#1E90FF",
  electric: "#FFD700",
  defense: "#888888",
} as const;

const TYPE_COLORS: Record<string, string> = {
  fire: COLORS.fire,
  water: COLORS.water,
  electric: COLORS.electric,
  defense: COLORS.defense,
};

export class LobbyScene extends Phaser.Scene {
  constructor() {
    super({ key: "LobbyScene" });
  }

  preload(): void {
    preloadAllAssets(this);
  }

  create(): void {
    const { width: w, height: h } = this.scale;
    this.buildUI(w, h);
    this.scale.on("resize", this.handleResize, this);
  }

  private buildUI(w: number, h: number): void {
    this.children.removeAll(true);

    // Background
    this.cameras.main.setBackgroundColor(COLORS.background);

    // Title
    this.add
      .text(w / 2, h * 0.06, "MECH ARENA AI", {
        fontSize: `${Math.max(24, Math.floor(w * 0.04))}px`,
        color: COLORS.accent,
        fontStyle: "bold",
      })
      .setOrigin(0.5);

    // VS section
    this.drawMechPreview(w, h);

    // Skills preview
    this.drawSkillPreview(w, h);

    // Strategy preview
    this.drawStrategyPreview(w, h);

    // Buttons
    this.drawButtons(w, h);
  }

  private drawMechPreview(w: number, h: number): void {
    const fontSize = `${Math.max(13, Math.floor(w * 0.02))}px`;
    const subFontSize = `${Math.max(11, Math.floor(w * 0.016))}px`;
    const panelY = h * 0.14;
    const panelH = h * 0.22;
    const panelW = w * 0.9;
    const panelX = (w - panelW) / 2;

    const bg = this.add.graphics();
    bg.fillStyle(COLORS.panelBg, 0.9);
    bg.fillRoundedRect(panelX, panelY, panelW, panelH, 8);
    bg.lineStyle(1, COLORS.panelBorder);
    bg.strokeRoundedRect(panelX, panelY, panelW, panelH, 8);

    const centerY = panelY + panelH / 2;
    const portraitSize = Math.min(64, panelH * 0.7);

    // Player side
    const playerX = panelX + panelW * 0.25;
    const playerPortrait = ASSET_REGISTRY.portraits[PLAYER_MECH.type];
    if (playerPortrait) {
      const key = playerPortrait.normal.key;
      if (this.textures.exists(key)) {
        const img = this.add.image(playerX, centerY - 10, key);
        img.setDisplaySize(portraitSize, portraitSize);
      }
    }
    const playerNameY = centerY + portraitSize / 2;
    this.add
      .text(playerX, playerNameY, PLAYER_MECH.codename ?? PLAYER_MECH.name, {
        fontSize,
        color: TYPE_COLORS[PLAYER_MECH.type] ?? COLORS.text,
        fontStyle: "bold",
      })
      .setOrigin(0.5, 0);
    if (PLAYER_MECH.role) {
      this.add
        .text(playerX, playerNameY + 16, PLAYER_MECH.role, {
          fontSize: subFontSize,
          color: COLORS.dimText,
        })
        .setOrigin(0.5, 0);
    }
    if (PLAYER_MECH.bio) {
      this.add
        .text(playerX, playerNameY + 30, PLAYER_MECH.bio, {
          fontSize: `${Math.max(9, Math.floor(w * 0.012))}px`,
          color: "#777777",
          wordWrap: { width: panelW * 0.35 },
          align: "center",
        })
        .setOrigin(0.5, 0);
    }

    // VS
    this.add
      .text(w / 2, centerY, "VS", {
        fontSize: `${Math.max(20, Math.floor(w * 0.035))}px`,
        color: COLORS.dimText,
        fontStyle: "bold",
      })
      .setOrigin(0.5);

    // Opponent side
    const opponentX = panelX + panelW * 0.75;
    const opponentPortrait = ASSET_REGISTRY.portraits[OPPONENT_MECH.type];
    if (opponentPortrait) {
      const key = opponentPortrait.normal.key;
      if (this.textures.exists(key)) {
        const img = this.add.image(opponentX, centerY - 10, key);
        img.setDisplaySize(portraitSize, portraitSize);
      }
    }
    const opponentNameY = centerY + portraitSize / 2;
    this.add
      .text(
        opponentX,
        opponentNameY,
        OPPONENT_MECH.codename ?? OPPONENT_MECH.name,
        {
          fontSize,
          color: TYPE_COLORS[OPPONENT_MECH.type] ?? COLORS.text,
          fontStyle: "bold",
        },
      )
      .setOrigin(0.5, 0);
    if (OPPONENT_MECH.role) {
      this.add
        .text(opponentX, opponentNameY + 16, OPPONENT_MECH.role, {
          fontSize: subFontSize,
          color: COLORS.dimText,
        })
        .setOrigin(0.5, 0);
    }
    if (OPPONENT_MECH.bio) {
      this.add
        .text(opponentX, opponentNameY + 30, OPPONENT_MECH.bio, {
          fontSize: `${Math.max(9, Math.floor(w * 0.012))}px`,
          color: "#777777",
          wordWrap: { width: panelW * 0.35 },
          align: "center",
        })
        .setOrigin(0.5, 0);
    }
  }

  private drawSkillPreview(w: number, h: number): void {
    const panelY = h * 0.39;
    const panelW = w * 0.9;
    const panelX = (w - panelW) / 2;
    const fontSize = `${Math.max(11, Math.floor(w * 0.016))}px`;
    const lineH = Math.max(18, h * 0.035);

    this.add
      .text(panelX + 10, panelY, "YOUR SKILLS", {
        fontSize,
        color: COLORS.dimText,
        fontStyle: "bold",
      })
      .setOrigin(0, 0);

    for (let i = 0; i < PLAYER_MECH.skills.length; i++) {
      const skill = PLAYER_MECH.skills[i];
      const y = panelY + lineH * (i + 1);
      const typeColor = TYPE_COLORS[skill.type] ?? COLORS.defense;
      const dmgText =
        skill.damage > 0
          ? `${skill.type.toUpperCase()} · ${skill.damage} DMG`
          : "BUFF · DEF +50%";

      this.add
        .text(panelX + 20, y, skill.name, {
          fontSize,
          color: typeColor,
          fontStyle: "bold",
        })
        .setOrigin(0, 0);

      this.add
        .text(panelX + panelW * 0.5, y, dmgText, {
          fontSize,
          color: COLORS.dimText,
        })
        .setOrigin(0, 0);
    }
  }

  private drawStrategyPreview(w: number, h: number): void {
    const panelY = h * 0.62;
    const panelW = w * 0.9;
    const panelX = (w - panelW) / 2;
    const panelH = h * 0.1;
    const fontSize = `${Math.max(11, Math.floor(w * 0.016))}px`;

    const bg = this.add.graphics();
    bg.fillStyle(COLORS.panelBg, 0.6);
    bg.fillRoundedRect(panelX, panelY, panelW, panelH, 6);

    const prompt = loadMechPrompt();
    let label: string;
    let color: string;

    if (prompt.trim()) {
      const summary = prompt.length > 60 ? `${prompt.slice(0, 57)}...` : prompt;
      label = `\u26A1 Strategy: ${summary}`;
      color = COLORS.accent;
    } else {
      label = "No strategy set — enter one in battle to guide your AI";
      color = COLORS.dimText;
    }

    this.add
      .text(panelX + 12, panelY + panelH / 2, label, {
        fontSize,
        color,
        wordWrap: { width: panelW - 24 },
      })
      .setOrigin(0, 0.5);
  }

  private drawButtons(w: number, h: number): void {
    const btnW = Math.min(w * 0.4, 220);
    const btnH = 48;

    // Start Battle button
    const startX = w / 2 - btnW / 2;
    const startY = h * 0.77;

    const startBg = this.add.graphics();
    startBg.fillStyle(COLORS.accentHex, 1);
    startBg.fillRoundedRect(startX, startY, btnW, btnH, 8);

    this.add
      .text(w / 2, startY + btnH / 2, "START BATTLE", {
        fontSize: `${Math.max(16, Math.floor(w * 0.025))}px`,
        color: "#000000",
        fontStyle: "bold",
      })
      .setOrigin(0.5);

    const startZone = this.add
      .zone(startX, startY, btnW, btnH)
      .setOrigin(0)
      .setInteractive({ useHandCursor: true });

    startZone.on("pointerover", () => {
      startBg.clear();
      startBg.fillStyle(0x00cc66, 1);
      startBg.fillRoundedRect(startX, startY, btnW, btnH, 8);
    });
    startZone.on("pointerout", () => {
      startBg.clear();
      startBg.fillStyle(COLORS.accentHex, 1);
      startBg.fillRoundedRect(startX, startY, btnW, btnH, 8);
    });
    startZone.on("pointerdown", () => {
      this.scale.off("resize", this.handleResize, this);
      this.scene.start("BattleScene");
    });

    // History button
    const histY = startY + btnH + 12;
    const histH = 36;
    const histBg = this.add.graphics();
    histBg.fillStyle(COLORS.buttonBg, 1);
    histBg.fillRoundedRect(startX, histY, btnW, histH, 6);
    histBg.lineStyle(1, COLORS.panelBorder);
    histBg.strokeRoundedRect(startX, histY, btnW, histH, 6);

    this.add
      .text(w / 2, histY + histH / 2, "History", {
        fontSize: `${Math.max(13, Math.floor(w * 0.02))}px`,
        color: "#cccccc",
      })
      .setOrigin(0.5);

    const histZone = this.add
      .zone(startX, histY, btnW, histH)
      .setOrigin(0)
      .setInteractive({ useHandCursor: true });

    histZone.on("pointerover", () => {
      histBg.clear();
      histBg.fillStyle(COLORS.buttonHover, 1);
      histBg.fillRoundedRect(startX, histY, btnW, histH, 6);
      histBg.lineStyle(1, COLORS.panelBorder);
      histBg.strokeRoundedRect(startX, histY, btnW, histH, 6);
    });
    histZone.on("pointerout", () => {
      histBg.clear();
      histBg.fillStyle(COLORS.buttonBg, 1);
      histBg.fillRoundedRect(startX, histY, btnW, histH, 6);
      histBg.lineStyle(1, COLORS.panelBorder);
      histBg.strokeRoundedRect(startX, histY, btnW, histH, 6);
    });
    histZone.on("pointerdown", () => {
      this.scale.off("resize", this.handleResize, this);
      this.scene.start("HistoryScene");
    });
  }

  private handleResize(gameSize: Phaser.Structs.Size): void {
    const { width, height } = gameSize;
    this.cameras.main.setViewport(0, 0, width, height);
    this.buildUI(width, height);
  }
}
