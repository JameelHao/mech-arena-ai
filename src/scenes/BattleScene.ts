/**
 * BattleScene - Pokémon-style battle UI layout
 */

import Phaser from "phaser";

const COLORS = {
  background: 0x1a1a1a,
  text: "#ffffff",
  accent: "#00ff88",
  accentHex: 0x00ff88,
  hpGreen: 0x00ff88,
  hpYellow: 0xffd700,
  hpRed: 0xff4500,
  panelBg: 0x2a2a2a,
  panelBorder: 0x444444,
  buttonBg: 0x333333,
  buttonHover: 0x444444,
  fire: "#FF4500",
  water: "#1E90FF",
  electric: "#FFD700",
  defense: "#888888",
} as const;

const SKILLS = [
  { name: "Fire Blast", type: "fire", color: COLORS.fire, dmg: 40 },
  { name: "Water Cannon", type: "water", color: COLORS.water, dmg: 30 },
  { name: "Thunder Shock", type: "electric", color: COLORS.electric, dmg: 25 },
  { name: "Iron Defense", type: "defense", color: COLORS.defense, dmg: 0 },
] as const;

export class BattleScene extends Phaser.Scene {
  private opponentHP = 100;
  private playerHP = 100;
  private opponentHPBar!: Phaser.GameObjects.Graphics;
  private playerHPBar!: Phaser.GameObjects.Graphics;
  private opponentHPText!: Phaser.GameObjects.Text;
  private playerHPText!: Phaser.GameObjects.Text;
  private battleLog!: Phaser.GameObjects.Text;
  private logMessages: string[] = [];
  private skillButtons: Phaser.GameObjects.Container[] = [];
  private isAnimating = false;

  constructor() {
    super({ key: "BattleScene" });
  }

  create(): void {
    const { width, height } = this.scale;

    this.createOpponentArea(width, height);
    this.createPlayerArea(width, height);
    this.createBattleLog(width, height);
    this.createSkillButtons(width, height);

    this.addLogMessage("Battle Start!");
    this.addLogMessage("Your mech is ready to fight!");

    this.scale.on("resize", this.handleResize, this);
  }

  // --- Opponent area (top) ---

  private createOpponentArea(w: number, h: number): void {
    // Opponent mech sprite placeholder
    const spriteX = w * 0.65;
    const spriteY = h * 0.18;
    const spriteW = Math.min(w * 0.2, 120);
    const spriteH = Math.min(h * 0.22, 120);

    const opponentSprite = this.add.graphics();
    opponentSprite.fillStyle(0x555555);
    opponentSprite.fillRoundedRect(
      spriteX - spriteW / 2,
      spriteY - spriteH / 2,
      spriteW,
      spriteH,
      8,
    );
    opponentSprite.lineStyle(2, COLORS.accentHex, 0.6);
    opponentSprite.strokeRoundedRect(
      spriteX - spriteW / 2,
      spriteY - spriteH / 2,
      spriteW,
      spriteH,
      8,
    );

    this.add
      .text(spriteX, spriteY, "ENEMY\nMECH", {
        fontSize: `${Math.max(12, Math.floor(w * 0.02))}px`,
        color: COLORS.text,
        align: "center",
      })
      .setOrigin(0.5);

    // Opponent info panel (top-left)
    const panelX = w * 0.03;
    const panelY = h * 0.05;
    const panelW = w * 0.42;
    const panelH = h * 0.12;

    this.drawPanel(panelX, panelY, panelW, panelH);

    this.add
      .text(panelX + 10, panelY + 6, "Opponent Mech  Lv.5", {
        fontSize: `${Math.max(11, Math.floor(w * 0.018))}px`,
        color: COLORS.text,
        fontStyle: "bold",
      })
      .setOrigin(0, 0);

    // HP bar
    const barX = panelX + 10;
    const barY = panelY + panelH * 0.5;
    const barW = panelW - 20;
    const barH = Math.max(8, panelH * 0.2);

    this.add
      .text(barX, barY - 2, "HP", {
        fontSize: `${Math.max(10, Math.floor(w * 0.014))}px`,
        color: COLORS.accent,
        fontStyle: "bold",
      })
      .setOrigin(0, 0.5);

    this.opponentHPBar = this.add.graphics();
    this.drawHPBar(
      this.opponentHPBar,
      barX + 24,
      barY - barH / 2,
      barW - 24,
      barH,
      1,
    );

    this.opponentHPText = this.add
      .text(barX + barW, barY + barH + 2, "100 / 100", {
        fontSize: `${Math.max(9, Math.floor(w * 0.013))}px`,
        color: "#aaaaaa",
      })
      .setOrigin(1, 0);
  }

  // --- Player area (bottom-left) ---

  private createPlayerArea(w: number, h: number): void {
    // Player mech sprite placeholder
    const spriteX = w * 0.25;
    const spriteY = h * 0.6;
    const spriteW = Math.min(w * 0.22, 140);
    const spriteH = Math.min(h * 0.25, 140);

    const playerSprite = this.add.graphics();
    playerSprite.fillStyle(0x446644);
    playerSprite.fillRoundedRect(
      spriteX - spriteW / 2,
      spriteY - spriteH / 2,
      spriteW,
      spriteH,
      8,
    );
    playerSprite.lineStyle(2, COLORS.accentHex, 0.8);
    playerSprite.strokeRoundedRect(
      spriteX - spriteW / 2,
      spriteY - spriteH / 2,
      spriteW,
      spriteH,
      8,
    );

    this.add
      .text(spriteX, spriteY, "YOUR\nMECH", {
        fontSize: `${Math.max(14, Math.floor(w * 0.022))}px`,
        color: COLORS.accent,
        align: "center",
        fontStyle: "bold",
      })
      .setOrigin(0.5);

    // Player info panel (bottom-right, above skill buttons)
    const panelW = w * 0.45;
    const panelH = h * 0.12;
    const panelX = w * 0.53;
    const panelY = h * 0.5;

    this.drawPanel(panelX, panelY, panelW, panelH);

    this.add
      .text(panelX + 10, panelY + 6, "Your Mech  Lv.5", {
        fontSize: `${Math.max(11, Math.floor(w * 0.018))}px`,
        color: COLORS.text,
        fontStyle: "bold",
      })
      .setOrigin(0, 0);

    // HP bar
    const barX = panelX + 10;
    const barY = panelY + panelH * 0.5;
    const barW = panelW - 20;
    const barH = Math.max(8, panelH * 0.2);

    this.add
      .text(barX, barY - 2, "HP", {
        fontSize: `${Math.max(10, Math.floor(w * 0.014))}px`,
        color: COLORS.accent,
        fontStyle: "bold",
      })
      .setOrigin(0, 0.5);

    this.playerHPBar = this.add.graphics();
    this.drawHPBar(
      this.playerHPBar,
      barX + 24,
      barY - barH / 2,
      barW - 24,
      barH,
      1,
    );

    this.playerHPText = this.add
      .text(barX + barW, barY + barH + 2, "100 / 100", {
        fontSize: `${Math.max(9, Math.floor(w * 0.013))}px`,
        color: "#aaaaaa",
      })
      .setOrigin(1, 0);
  }

  // --- Battle log (center) ---

  private createBattleLog(w: number, h: number): void {
    const logX = w * 0.03;
    const logY = h * 0.35;
    const logW = w * 0.94;
    const logH = h * 0.12;

    const bg = this.add.graphics();
    bg.fillStyle(0x111111, 0.85);
    bg.fillRoundedRect(logX, logY, logW, logH, 6);
    bg.lineStyle(1, COLORS.panelBorder);
    bg.strokeRoundedRect(logX, logY, logW, logH, 6);

    this.battleLog = this.add
      .text(logX + 10, logY + 6, "", {
        fontSize: `${Math.max(11, Math.floor(w * 0.016))}px`,
        color: COLORS.accent,
        wordWrap: { width: logW - 20 },
        lineSpacing: 4,
      })
      .setOrigin(0, 0);
  }

  // --- Skill buttons (bottom-right, 2x2 grid) ---

  private createSkillButtons(w: number, h: number): void {
    const gridX = w * 0.5;
    const gridY = h * 0.66;
    const gridW = w * 0.48;
    const gridH = h * 0.3;
    const gap = 6;
    const btnW = (gridW - gap) / 2;
    const btnH = (gridH - gap) / 2;

    for (let i = 0; i < 4; i++) {
      const col = i % 2;
      const row = Math.floor(i / 2);
      const x = gridX + col * (btnW + gap);
      const y = gridY + row * (btnH + gap);
      const skill = SKILLS[i];

      const container = this.add.container(x, y);

      const bg = this.add.graphics();
      bg.fillStyle(COLORS.buttonBg);
      bg.fillRoundedRect(0, 0, btnW, btnH, 6);
      bg.lineStyle(
        2,
        Phaser.Display.Color.HexStringToColor(skill.color).color,
        0.8,
      );
      bg.strokeRoundedRect(0, 0, btnW, btnH, 6);

      const fontSize = Math.max(11, Math.floor(w * 0.018));
      const subFontSize = Math.max(9, Math.floor(w * 0.013));

      const nameText = this.add
        .text(btnW / 2, btnH * 0.38, skill.name, {
          fontSize: `${fontSize}px`,
          color: skill.color,
          fontStyle: "bold",
          align: "center",
        })
        .setOrigin(0.5);

      const infoText = this.add
        .text(
          btnW / 2,
          btnH * 0.68,
          skill.dmg > 0
            ? `${skill.type.toUpperCase()} · ${skill.dmg} DMG`
            : "BUFF · DEF +50%",
          {
            fontSize: `${subFontSize}px`,
            color: "#999999",
            align: "center",
          },
        )
        .setOrigin(0.5);

      container.add([bg, nameText, infoText]);

      // Interactive hit zone
      const hitZone = this.add
        .zone(x, y, btnW, btnH)
        .setOrigin(0)
        .setInteractive({ useHandCursor: true });

      hitZone.on("pointerover", () => {
        bg.clear();
        bg.fillStyle(COLORS.buttonHover);
        bg.fillRoundedRect(0, 0, btnW, btnH, 6);
        bg.lineStyle(
          2,
          Phaser.Display.Color.HexStringToColor(skill.color).color,
          1,
        );
        bg.strokeRoundedRect(0, 0, btnW, btnH, 6);
      });

      hitZone.on("pointerout", () => {
        bg.clear();
        bg.fillStyle(COLORS.buttonBg);
        bg.fillRoundedRect(0, 0, btnW, btnH, 6);
        bg.lineStyle(
          2,
          Phaser.Display.Color.HexStringToColor(skill.color).color,
          0.8,
        );
        bg.strokeRoundedRect(0, 0, btnW, btnH, 6);
      });

      hitZone.on("pointerdown", () => {
        this.onSkillSelected(i);
      });

      this.skillButtons.push(container);
    }
  }

  // --- Panel drawing ---

  private drawPanel(x: number, y: number, w: number, h: number): void {
    const panel = this.add.graphics();
    panel.fillStyle(COLORS.panelBg, 0.9);
    panel.fillRoundedRect(x, y, w, h, 8);
    panel.lineStyle(1, COLORS.panelBorder);
    panel.strokeRoundedRect(x, y, w, h, 8);
  }

  // --- HP bar drawing ---

  private drawHPBar(
    graphics: Phaser.GameObjects.Graphics,
    x: number,
    y: number,
    w: number,
    h: number,
    ratio: number,
  ): void {
    graphics.clear();

    // Background
    graphics.fillStyle(0x333333);
    graphics.fillRoundedRect(x, y, w, h, 3);

    // Fill
    if (ratio > 0) {
      let color: number = COLORS.hpGreen;
      if (ratio < 0.25) color = COLORS.hpRed;
      else if (ratio < 0.5) color = COLORS.hpYellow;

      graphics.fillStyle(color);
      graphics.fillRoundedRect(x, y, w * ratio, h, 3);
    }
  }

  // --- Update HP display ---

  private updateHP(
    hpBar: Phaser.GameObjects.Graphics,
    hpText: Phaser.GameObjects.Text,
    current: number,
    max: number,
  ): void {
    const { width: w, height: h } = this.scale;

    // Determine if opponent or player bar by reference
    const isOpponent = hpBar === this.opponentHPBar;
    const panelX = isOpponent ? w * 0.03 : w * 0.53;
    const panelW = isOpponent ? w * 0.42 : w * 0.45;
    const panelH = h * 0.12;
    const panelY = isOpponent ? h * 0.05 : h * 0.5;

    const barX = panelX + 10 + 24;
    const barY = panelY + panelH * 0.5 - Math.max(8, panelH * 0.2) / 2;
    const barW = panelW - 20 - 24;
    const barH = Math.max(8, panelH * 0.2);

    this.drawHPBar(hpBar, barX, barY, barW, barH, current / max);
    hpText.setText(`${current} / ${max}`);
  }

  // --- Battle log ---

  private addLogMessage(msg: string): void {
    this.logMessages.push(`> ${msg}`);
    if (this.logMessages.length > 3) {
      this.logMessages.shift();
    }
    this.battleLog.setText(this.logMessages.join("\n"));
  }

  // --- Skill selected handler ---

  private onSkillSelected(index: number): void {
    if (this.isAnimating) return;
    this.isAnimating = true;

    const skill = SKILLS[index];
    this.addLogMessage(`Your mech used ${skill.name}!`);

    // Apply damage to opponent
    if (skill.dmg > 0) {
      this.opponentHP = Math.max(0, this.opponentHP - skill.dmg);
      this.updateHP(
        this.opponentHPBar,
        this.opponentHPText,
        this.opponentHP,
        100,
      );
    }

    // Simple bot response after delay
    this.time.delayedCall(800, () => {
      if (this.opponentHP <= 0) {
        this.addLogMessage("Enemy mech defeated! You win!");
        this.isAnimating = false;
        return;
      }

      // Bot picks random skill
      const botSkillIndex = Phaser.Math.Between(0, 3);
      const botSkill = SKILLS[botSkillIndex];
      this.addLogMessage(`Enemy used ${botSkill.name}!`);

      if (botSkill.dmg > 0) {
        this.playerHP = Math.max(0, this.playerHP - botSkill.dmg);
        this.updateHP(this.playerHPBar, this.playerHPText, this.playerHP, 100);
      }

      if (this.playerHP <= 0) {
        this.time.delayedCall(400, () => {
          this.addLogMessage("Your mech was defeated...");
          this.isAnimating = false;
        });
      } else {
        this.isAnimating = false;
      }
    });
  }

  // --- Responsive resize ---

  private handleResize(gameSize: Phaser.Structs.Size): void {
    const { width, height } = gameSize;
    this.cameras.main.setViewport(0, 0, width, height);

    // Rebuild UI on resize
    this.children.removeAll(true);
    this.skillButtons = [];
    this.logMessages = [];

    this.createOpponentArea(width, height);
    this.createPlayerArea(width, height);
    this.createBattleLog(width, height);
    this.createSkillButtons(width, height);

    this.updateHP(
      this.opponentHPBar,
      this.opponentHPText,
      this.opponentHP,
      100,
    );
    this.updateHP(this.playerHPBar, this.playerHPText, this.playerHP, 100);
    this.addLogMessage("Battle in progress...");
  }
}
