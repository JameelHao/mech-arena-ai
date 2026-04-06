/**
 * LobbyScene - Pre-battle setup showing mech preview, skills, and strategy.
 */

import Phaser from "phaser";
import { ASSET_REGISTRY, preloadAllAssets } from "../assets";
import { MECH_ROSTER, OPPONENT_MECH } from "../data/mechs";
import {
  hasSeenOnboarding,
  hasStarterMech,
  loadMechPrompt,
  loadStarterMech,
  markOnboardingSeen,
  saveStarterMech,
} from "../utils/storage";

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
  private selectedIndex = 0;

  constructor() {
    super({ key: "LobbyScene" });
  }

  preload(): void {
    preloadAllAssets(this);
  }

  create(): void {
    this.selectedIndex = hasStarterMech() ? loadStarterMech() : 0;
    const { width: w, height: h } = this.scale;
    this.buildUI(w, h);
    this.scale.on("resize", this.handleResize, this);

    if (!hasStarterMech()) {
      this.showMechBinding();
    } else if (!hasSeenOnboarding()) {
      this.showOnboarding();
    }
  }

  private selectedMech() {
    return MECH_ROSTER[this.selectedIndex];
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

    // Mech roster selection
    this.drawRosterSelection(w, h);

    // VS section
    this.drawMechPreview(w, h);

    // Skills preview
    this.drawSkillPreview(w, h);

    // Strategy preview
    this.drawStrategyPreview(w, h);

    // Buttons
    this.drawButtons(w, h);
  }

  private drawRosterSelection(w: number, h: number): void {
    const cardW = Math.min(w * 0.25, 120);
    const cardH = 32;
    const gap = 8;
    const totalW = MECH_ROSTER.length * (cardW + gap) - gap;
    const startX = (w - totalW) / 2;
    const y = h * 0.12;
    const fontSize = `${Math.max(10, Math.floor(w * 0.014))}px`;

    for (let i = 0; i < MECH_ROSTER.length; i++) {
      const mech = MECH_ROSTER[i];
      const x = startX + i * (cardW + gap);
      const isSelected = i === this.selectedIndex;

      const bg = this.add.graphics();
      bg.fillStyle(isSelected ? 0x334433 : COLORS.buttonBg, 1);
      bg.fillRoundedRect(x, y, cardW, cardH, 6);
      bg.lineStyle(2, isSelected ? COLORS.accentHex : COLORS.panelBorder);
      bg.strokeRoundedRect(x, y, cardW, cardH, 6);

      const label = mech.codename ?? mech.name;
      const color = isSelected
        ? COLORS.accent
        : (TYPE_COLORS[mech.type] ?? COLORS.text);
      this.add
        .text(x + cardW / 2, y + cardH / 2, label, {
          fontSize,
          color,
          fontStyle: isSelected ? "bold" : "normal",
        })
        .setOrigin(0.5);

      const zone = this.add
        .zone(x, y, cardW, cardH)
        .setOrigin(0)
        .setInteractive({ useHandCursor: true });

      zone.on("pointerdown", () => {
        this.selectedIndex = i;
        this.buildUI(w, h);
      });
    }
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
    const playerPortrait = ASSET_REGISTRY.portraits[this.selectedMech().type];
    if (playerPortrait) {
      const key = playerPortrait.normal.key;
      if (this.textures.exists(key)) {
        const img = this.add.image(playerX, centerY - 10, key);
        img.setDisplaySize(portraitSize, portraitSize);
      }
    }
    const playerNameY = centerY + portraitSize / 2;
    this.add
      .text(
        playerX,
        playerNameY,
        this.selectedMech().codename ?? this.selectedMech().name,
        {
          fontSize,
          color: TYPE_COLORS[this.selectedMech().type] ?? COLORS.text,
          fontStyle: "bold",
        },
      )
      .setOrigin(0.5, 0);
    if (this.selectedMech().role) {
      this.add
        .text(playerX, playerNameY + 16, this.selectedMech().role as string, {
          fontSize: subFontSize,
          color: COLORS.dimText,
        })
        .setOrigin(0.5, 0);
    }
    if (this.selectedMech().bio) {
      this.add
        .text(playerX, playerNameY + 30, this.selectedMech().bio as string, {
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

    for (let i = 0; i < this.selectedMech().skills.length; i++) {
      const skill = this.selectedMech().skills[i];
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
      this.scene.start("BattleScene", {
        selectedMech: this.selectedMech(),
      });
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

    // Help button
    const helpSize = 30;
    const helpX = w - helpSize - w * 0.03;
    const helpY = h * 0.03;

    const helpBg = this.add.graphics();
    helpBg.fillStyle(COLORS.buttonBg, 1);
    helpBg.fillRoundedRect(helpX, helpY, helpSize, helpSize, 6);
    helpBg.lineStyle(1, COLORS.panelBorder);
    helpBg.strokeRoundedRect(helpX, helpY, helpSize, helpSize, 6);

    this.add
      .text(helpX + helpSize / 2, helpY + helpSize / 2, "?", {
        fontSize: `${Math.max(14, Math.floor(w * 0.025))}px`,
        color: COLORS.accent,
        fontStyle: "bold",
      })
      .setOrigin(0.5);

    const helpZone = this.add
      .zone(helpX, helpY, helpSize, helpSize)
      .setOrigin(0)
      .setInteractive({ useHandCursor: true });

    helpZone.on("pointerdown", () => {
      this.showOnboarding();
    });
  }

  // --- Mech Binding ---

  private showMechBinding(): void {
    const { width: w, height: h } = this.scale;
    const overlay = this.add.container(0, 0);

    // Backdrop
    const bg = this.add.graphics();
    bg.fillStyle(0x000000, 0.9);
    bg.fillRect(0, 0, w, h);
    overlay.add(bg);

    // Title
    overlay.add(
      this.add
        .text(w / 2, h * 0.06, "CHOOSE YOUR MECH", {
          fontSize: `${Math.max(20, Math.floor(w * 0.035))}px`,
          color: COLORS.accent,
          fontStyle: "bold",
        })
        .setOrigin(0.5),
    );

    overlay.add(
      this.add
        .text(w / 2, h * 0.11, "Select your starter mech to begin", {
          fontSize: `${Math.max(12, Math.floor(w * 0.018))}px`,
          color: "#888888",
        })
        .setOrigin(0.5),
    );

    let bindingIndex = 0;
    const cardW = Math.min(w * 0.85, 400);
    const cardH = Math.max(60, h * 0.12);
    const cardX = (w - cardW) / 2;
    const startY = h * 0.17;
    const gap = 8;
    const fontSize = `${Math.max(12, Math.floor(w * 0.018))}px`;
    const subFont = `${Math.max(10, Math.floor(w * 0.014))}px`;

    const drawCards = () => {
      // Remove old card elements (tagged)
      for (const obj of overlay.list.filter((o) =>
        (o as Phaser.GameObjects.GameObject).getData("card"),
      )) {
        obj.destroy();
      }

      for (let i = 0; i < MECH_ROSTER.length; i++) {
        const mech = MECH_ROSTER[i];
        const y = startY + i * (cardH + gap);
        const isSelected = i === bindingIndex;

        const cardBg = this.add.graphics();
        cardBg.setData("card", true);
        cardBg.fillStyle(isSelected ? 0x1a3a1a : COLORS.panelBg, 1);
        cardBg.fillRoundedRect(cardX, y, cardW, cardH, 8);
        cardBg.lineStyle(2, isSelected ? COLORS.accentHex : COLORS.panelBorder);
        cardBg.strokeRoundedRect(cardX, y, cardW, cardH, 8);
        overlay.add(cardBg);

        const typeColor = TYPE_COLORS[mech.type] ?? COLORS.text;

        // Portrait
        const portraitSize = Math.min(48, cardH - 12);
        const portrait = ASSET_REGISTRY.portraits[mech.type];
        if (portrait) {
          const key = portrait.normal.key;
          if (this.textures.exists(key)) {
            const img = this.add
              .image(cardX + 10 + portraitSize / 2, y + cardH / 2, key)
              .setDisplaySize(portraitSize, portraitSize)
              .setData("card", true);
            overlay.add(img);
          }
        }

        const textX = cardX + 10 + portraitSize + 12;

        const name = this.add
          .text(textX, y + 8, mech.codename ?? mech.name, {
            fontSize,
            color: typeColor,
            fontStyle: "bold",
          })
          .setData("card", true);
        overlay.add(name);

        const role = this.add
          .text(textX, y + 26, `${mech.role ?? mech.type.toUpperCase()}`, {
            fontSize: subFont,
            color: "#888888",
          })
          .setData("card", true);
        overlay.add(role);

        if (mech.bio) {
          const bio = this.add
            .text(textX, y + 40, mech.bio, {
              fontSize: `${Math.max(9, Math.floor(w * 0.012))}px`,
              color: "#666666",
              wordWrap: { width: cardW - portraitSize - 40 },
            })
            .setData("card", true);
          overlay.add(bio);
        }

        const zone = this.add
          .zone(cardX, y, cardW, cardH)
          .setOrigin(0)
          .setInteractive({ useHandCursor: true })
          .setData("card", true);

        zone.on("pointerdown", () => {
          bindingIndex = i;
          drawCards();
        });
        overlay.add(zone);
      }
    };

    drawCards();

    // Confirm button
    const btnW = Math.min(w * 0.5, 220);
    const btnH = 44;
    const btnX = w / 2 - btnW / 2;
    const btnY = h * 0.17 + MECH_ROSTER.length * (cardH + gap) + 16;

    const confirmBg = this.add.graphics();
    confirmBg.fillStyle(COLORS.accentHex, 1);
    confirmBg.fillRoundedRect(btnX, btnY, btnW, btnH, 8);
    overlay.add(confirmBg);

    overlay.add(
      this.add
        .text(w / 2, btnY + btnH / 2, "Choose This Mech", {
          fontSize: `${Math.max(15, Math.floor(w * 0.023))}px`,
          color: "#000000",
          fontStyle: "bold",
        })
        .setOrigin(0.5),
    );

    const confirmZone = this.add
      .zone(btnX, btnY, btnW, btnH)
      .setOrigin(0)
      .setInteractive({ useHandCursor: true });

    confirmZone.on("pointerover", () => {
      confirmBg.clear();
      confirmBg.fillStyle(0x00cc66, 1);
      confirmBg.fillRoundedRect(btnX, btnY, btnW, btnH, 8);
    });
    confirmZone.on("pointerout", () => {
      confirmBg.clear();
      confirmBg.fillStyle(COLORS.accentHex, 1);
      confirmBg.fillRoundedRect(btnX, btnY, btnW, btnH, 8);
    });
    confirmZone.on("pointerdown", () => {
      saveStarterMech(bindingIndex);
      this.selectedIndex = bindingIndex;
      overlay.destroy();
      this.buildUI(w, h);

      if (!hasSeenOnboarding()) {
        this.showOnboarding();
      }
    });
    overlay.add(confirmZone);
  }

  // --- Onboarding ---

  private showOnboarding(): void {
    const { width: w, height: h } = this.scale;
    const overlay = this.add.container(0, 0);

    const STEPS = [
      {
        title: "Welcome to Mech Arena AI!",
        body: "Choose your mech and write a strategy prompt.\nYour AI will follow your strategy in battle.",
      },
      {
        title: "Type Matchups",
        body: "Fire \u25B6 Electric \u25B6 Water \u25B6 Fire\n\nSuper effective = 1.5\u00D7 damage\nResisted = 0.5\u00D7 damage\n\nPick skills wisely!",
      },
      {
        title: "Learn & Improve",
        body: "After battle, review results in History.\nTune your strategy prompt to win more!",
      },
    ];

    let step = 0;

    const drawStep = () => {
      overlay.removeAll(true);

      // Backdrop
      const bg = this.add.graphics();
      bg.fillStyle(0x000000, 0.85);
      bg.fillRect(0, 0, w, h);
      overlay.add(bg);

      // Panel
      const panelW = Math.min(w * 0.8, 400);
      const panelH = Math.min(h * 0.5, 280);
      const panelX = (w - panelW) / 2;
      const panelY = (h - panelH) / 2;

      const panel = this.add.graphics();
      panel.fillStyle(0x2a2a2e, 1);
      panel.fillRoundedRect(panelX, panelY, panelW, panelH, 10);
      panel.lineStyle(2, COLORS.accentHex);
      panel.strokeRoundedRect(panelX, panelY, panelW, panelH, 10);
      overlay.add(panel);

      const cx = w / 2;
      const s = STEPS[step];

      // Step indicator
      overlay.add(
        this.add
          .text(cx, panelY + 15, `${step + 1} / ${STEPS.length}`, {
            fontSize: `${Math.max(10, Math.floor(w * 0.014))}px`,
            color: COLORS.dimText,
          })
          .setOrigin(0.5, 0),
      );

      // Title
      overlay.add(
        this.add
          .text(cx, panelY + 35, s.title, {
            fontSize: `${Math.max(18, Math.floor(w * 0.03))}px`,
            color: COLORS.accent,
            fontStyle: "bold",
          })
          .setOrigin(0.5, 0),
      );

      // Body
      overlay.add(
        this.add
          .text(cx, panelY + 70, s.body, {
            fontSize: `${Math.max(13, Math.floor(w * 0.02))}px`,
            color: COLORS.text,
            align: "center",
            lineSpacing: 6,
            wordWrap: { width: panelW - 40 },
          })
          .setOrigin(0.5, 0),
      );

      // Buttons row
      const btnH = 36;
      const btnY = panelY + panelH - btnH - 15;

      // Skip button (always visible)
      const skipW = 70;
      const skipX = panelX + 20;
      overlay.add(
        this.add
          .text(skipX + skipW / 2, btnY + btnH / 2, "Skip", {
            fontSize: `${Math.max(12, Math.floor(w * 0.018))}px`,
            color: COLORS.dimText,
          })
          .setOrigin(0.5),
      );
      const skipZone = this.add
        .zone(skipX, btnY, skipW, btnH)
        .setOrigin(0)
        .setInteractive({ useHandCursor: true });
      skipZone.on("pointerdown", () => {
        markOnboardingSeen();
        overlay.destroy();
      });
      overlay.add(skipZone);

      // Next / Got it button
      const nextW = Math.min(panelW * 0.35, 130);
      const nextX = panelX + panelW - nextW - 20;
      const isLast = step === STEPS.length - 1;
      const nextLabel = isLast ? "Got it!" : "Next \u2192";

      const nextBg = this.add.graphics();
      nextBg.fillStyle(COLORS.accentHex, 1);
      nextBg.fillRoundedRect(nextX, btnY, nextW, btnH, 6);
      overlay.add(nextBg);

      overlay.add(
        this.add
          .text(nextX + nextW / 2, btnY + btnH / 2, nextLabel, {
            fontSize: `${Math.max(13, Math.floor(w * 0.02))}px`,
            color: "#000000",
            fontStyle: "bold",
          })
          .setOrigin(0.5),
      );

      const nextZone = this.add
        .zone(nextX, btnY, nextW, btnH)
        .setOrigin(0)
        .setInteractive({ useHandCursor: true });
      nextZone.on("pointerdown", () => {
        if (isLast) {
          markOnboardingSeen();
          overlay.destroy();
        } else {
          step++;
          drawStep();
        }
      });
      overlay.add(nextZone);
    };

    drawStep();
  }

  private handleResize(gameSize: Phaser.Structs.Size): void {
    const { width, height } = gameSize;
    this.cameras.main.setViewport(0, 0, width, height);
    this.buildUI(width, height);
  }
}
