/**
 * BattleScene - Pokémon-style battle UI connected to BattleManager
 */

import Phaser from "phaser";
import { callBattleAPI } from "../api/battleClient";
import { type Mech, MechType, TurnPhase } from "../types/game";
import type { BattleRecord } from "../types/storage";
import { BattleManager } from "../utils/BattleManager";
import {
  type MechSprite,
  createMechSprite,
  playMechAttack,
  playMechDamageFlash,
  preloadMechSVGs,
} from "../utils/MechGraphics";
import {
  isOnline,
  onOnlineChange,
  onUpdateAvailable,
  shouldShowInstallPrompt,
  triggerInstallPrompt,
} from "../utils/pwa";
import {
  loadMechPrompt,
  saveBattleHistory,
  saveMechPrompt,
} from "../utils/storage";

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

const SKILL_COLORS: Record<string, string> = {
  fire: COLORS.fire,
  water: COLORS.water,
  electric: COLORS.electric,
  defense: COLORS.defense,
};

const PLAYER_MECH: Mech = {
  name: "Your Mech",
  type: MechType.Fire,
  hp: 100,
  maxHp: 100,
  skills: [
    { name: "Fire Blast", type: MechType.Fire, damage: 40 },
    { name: "Water Cannon", type: MechType.Water, damage: 30 },
    { name: "Thunder Shock", type: MechType.Electric, damage: 25 },
    { name: "Iron Defense", type: "defense", damage: 0 },
  ],
};

const OPPONENT_MECH: Mech = {
  name: "Enemy Mech",
  type: MechType.Water,
  hp: 100,
  maxHp: 100,
  skills: [
    { name: "Water Cannon", type: MechType.Water, damage: 30 },
    { name: "Fire Blast", type: MechType.Fire, damage: 40 },
    { name: "Thunder Shock", type: MechType.Electric, damage: 25 },
    { name: "Iron Defense", type: "defense", damage: 0 },
  ],
};

const SPINNER_FRAMES = ["⠋", "⠙", "⠹", "⠸", "⠼", "⠴", "⠦", "⠧", "⠇", "⠏"];
const LOG_MAX_LINES = 5;
const HP_TWEEN_DURATION = 500;

const PROMPT_MAX_LENGTH = 500;
const PROMPT_PLACEHOLDER =
  "Enter your mech's battle strategy... e.g. 'Be aggressive, use high-damage attacks when HP is high. Switch to defense when low.'";

export class BattleScene extends Phaser.Scene {
  // Battle state
  private battleManager!: BattleManager;
  private isAnimating = false;

  // HP display
  private opponentHPBar!: Phaser.GameObjects.Graphics;
  private playerHPBar!: Phaser.GameObjects.Graphics;
  private opponentHPText!: Phaser.GameObjects.Text;
  private playerHPText!: Phaser.GameObjects.Text;
  private displayedOpponentRatio = 1;
  private displayedPlayerRatio = 1;
  private opponentBarGeom = { x: 0, y: 0, w: 0, h: 0 };
  private playerBarGeom = { x: 0, y: 0, w: 0, h: 0 };

  // Mech sprites
  private playerMechSprite!: MechSprite;
  private opponentMechSprite!: MechSprite;

  // Battle log
  private battleLogText!: Phaser.GameObjects.Text;
  private logMessages: string[] = [];

  // Skill buttons
  private skillButtons: Phaser.GameObjects.Container[] = [];
  private skillHitZones: Phaser.GameObjects.Zone[] = [];

  // Turn indicator
  private turnIndicator!: Phaser.GameObjects.Text;

  // AI spinner
  private spinnerText!: Phaser.GameObjects.Text;
  private spinnerTimer?: Phaser.Time.TimerEvent;

  // Result overlay
  private resultOverlay?: Phaser.GameObjects.Container;

  // Prompt UI (DOM elements)
  private promptContainer?: HTMLDivElement;
  private mechPrompt = "";

  // PWA banners (DOM elements)
  private offlineBanner?: HTMLDivElement;
  private updateBanner?: HTMLDivElement;
  private installBanner?: HTMLDivElement;
  private onlineCleanup?: () => void;
  private updateSWFn?: () => void;

  constructor() {
    super({ key: "BattleScene" });
    console.log("[BattleScene] constructor called");
  }

  preload(): void {
    console.log("[BattleScene] preload() start");

    // Catch any asset load errors so they don't cause a black screen
    this.load.on("loaderror", (file: { key: string; url: string }) => {
      console.error("[BattleScene] Failed to load asset:", file.key, file.url);
    });

    preloadMechSVGs(this);

    this.load.on("complete", () => {
      console.log("[BattleScene] preload complete");
    });
  }

  create(): void {
    console.log("[BattleScene] create() start");
    this.battleManager = new BattleManager();
    this.battleManager.initBattle(
      JSON.parse(JSON.stringify(PLAYER_MECH)),
      JSON.parse(JSON.stringify(OPPONENT_MECH)),
    );

    this.displayedOpponentRatio = 1;
    this.displayedPlayerRatio = 1;
    this.isAnimating = false;

    // Load saved prompt
    this.mechPrompt = loadMechPrompt();

    const { width, height } = this.scale;
    this.buildUI(width, height);
    this.createPromptUI();
    this.initPWABanners();

    // Sync initial log
    const state = this.battleManager.getState();
    for (const msg of state.log) {
      this.addLogMessage(msg);
    }
    this.setTurnIndicator(state.phase);

    this.scale.on("resize", this.handleResize, this);
  }

  private buildUI(w: number, h: number): void {
    this.skillButtons = [];
    this.skillHitZones = [];
    this.createOpponentArea(w, h);
    this.createPlayerArea(w, h);
    this.createTurnIndicator(w, h);
    this.createBattleLog(w, h);
    this.createSkillButtons(w, h);
    this.createSpinner(w, h);
    this.createHistoryButton(w, h);
  }

  // --- Opponent area (top) ---

  private createOpponentArea(w: number, h: number): void {
    const spriteX = w * 0.65;
    const spriteY = 150;
    const spriteW = Math.min(w * 0.2, 120);
    const spriteH = Math.min(h * 0.22, 120);

    this.opponentMechSprite = createMechSprite(
      this,
      OPPONENT_MECH.type,
      spriteX,
      spriteY,
      spriteW,
      spriteH,
    );

    // Opponent info panel (top-left)
    const panelX = w * 0.03;
    const panelY = h * 0.05;
    const panelW = w * 0.42;
    const panelH = h * 0.12;

    this.drawPanel(panelX, panelY, panelW, panelH);

    this.add
      .text(panelX + 10, panelY + 6, "Enemy Mech  Lv.5", {
        fontSize: `${Math.max(11, Math.floor(w * 0.018))}px`,
        color: COLORS.text,
        fontStyle: "bold",
      })
      .setOrigin(0, 0);

    // HP bar
    const barX = panelX + 10 + 24;
    const barY = panelY + panelH * 0.5 - Math.max(8, panelH * 0.2) / 2;
    const barW = panelW - 20 - 24;
    const barH = Math.max(8, panelH * 0.2);

    this.opponentBarGeom = { x: barX, y: barY, w: barW, h: barH };

    this.add
      .text(panelX + 10, panelY + panelH * 0.5 - 2, "HP", {
        fontSize: `${Math.max(10, Math.floor(w * 0.014))}px`,
        color: COLORS.accent,
        fontStyle: "bold",
      })
      .setOrigin(0, 0.5);

    this.opponentHPBar = this.add.graphics();
    this.drawHPBar(
      this.opponentHPBar,
      barX,
      barY,
      barW,
      barH,
      this.displayedOpponentRatio,
    );

    this.opponentHPText = this.add
      .text(panelX + panelW - 10, barY + barH + 2, "100 / 100", {
        fontSize: `${Math.max(9, Math.floor(w * 0.013))}px`,
        color: "#aaaaaa",
      })
      .setOrigin(1, 0);
  }

  // --- Player area (bottom-left) ---

  private createPlayerArea(w: number, h: number): void {
    const spriteX = w * 0.25;
    const spriteY = 450;
    const spriteW = Math.min(w * 0.22, 140);
    const spriteH = Math.min(h * 0.25, 140);

    this.playerMechSprite = createMechSprite(
      this,
      PLAYER_MECH.type,
      spriteX,
      spriteY,
      spriteW,
      spriteH,
    );

    // Player info panel
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
    const barX = panelX + 10 + 24;
    const barY = panelY + panelH * 0.5 - Math.max(8, panelH * 0.2) / 2;
    const barW = panelW - 20 - 24;
    const barH = Math.max(8, panelH * 0.2);

    this.playerBarGeom = { x: barX, y: barY, w: barW, h: barH };

    this.add
      .text(panelX + 10, panelY + panelH * 0.5 - 2, "HP", {
        fontSize: `${Math.max(10, Math.floor(w * 0.014))}px`,
        color: COLORS.accent,
        fontStyle: "bold",
      })
      .setOrigin(0, 0.5);

    this.playerHPBar = this.add.graphics();
    this.drawHPBar(
      this.playerHPBar,
      barX,
      barY,
      barW,
      barH,
      this.displayedPlayerRatio,
    );

    this.playerHPText = this.add
      .text(panelX + panelW - 10, barY + barH + 2, "100 / 100", {
        fontSize: `${Math.max(9, Math.floor(w * 0.013))}px`,
        color: "#aaaaaa",
      })
      .setOrigin(1, 0);
  }

  // --- Turn indicator ---

  private createTurnIndicator(w: number, h: number): void {
    this.turnIndicator = this.add
      .text(w * 0.5, h * 0.33, "", {
        fontSize: `${Math.max(13, Math.floor(w * 0.02))}px`,
        color: COLORS.accent,
        fontStyle: "bold",
      })
      .setOrigin(0.5);
  }

  private setTurnIndicator(phase: TurnPhase): void {
    switch (phase) {
      case TurnPhase.PlayerTurn:
        this.turnIndicator.setText("⚔ Your Turn");
        this.turnIndicator.setColor(COLORS.accent);
        break;
      case TurnPhase.AiThinking:
        this.turnIndicator.setText("AI Thinking...");
        this.turnIndicator.setColor("#ffd700");
        break;
      case TurnPhase.AiTurn:
        this.turnIndicator.setText("⚔ AI Turn");
        this.turnIndicator.setColor("#ff6666");
        break;
      case TurnPhase.BattleOver:
        this.turnIndicator.setText("Battle Over");
        this.turnIndicator.setColor("#ffffff");
        break;
      default:
        this.turnIndicator.setText("");
    }
  }

  // --- Battle log ---

  private createBattleLog(w: number, h: number): void {
    const logX = w * 0.03;
    const logY = h * 0.37;
    const logW = w * 0.44;
    const logH = h * 0.12;

    const bg = this.add.graphics();
    bg.fillStyle(0x111111, 0.85);
    bg.fillRoundedRect(logX, logY, logW, logH, 6);
    bg.lineStyle(1, COLORS.panelBorder);
    bg.strokeRoundedRect(logX, logY, logW, logH, 6);

    this.battleLogText = this.add
      .text(logX + 10, logY + 6, "", {
        fontSize: `${Math.max(10, Math.floor(w * 0.014))}px`,
        color: COLORS.accent,
        wordWrap: { width: logW - 20 },
        lineSpacing: 3,
      })
      .setOrigin(0, 0);

    // Mask to clip overflow
    const mask = this.add.graphics();
    mask.fillStyle(0xffffff);
    mask.fillRect(logX, logY, logW, logH);
    this.battleLogText.setMask(
      new Phaser.Display.Masks.GeometryMask(this, mask),
    );
  }

  private addLogMessage(msg: string): void {
    this.logMessages.push(`> ${msg}`);
    // Keep last N lines for auto-scroll
    if (this.logMessages.length > LOG_MAX_LINES) {
      this.logMessages.shift();
    }
    this.battleLogText.setText(this.logMessages.join("\n"));
  }

  // --- Spinner ---

  private createSpinner(w: number, h: number): void {
    this.spinnerText = this.add
      .text(w * 0.5, h * 0.45, "", {
        fontSize: `${Math.max(14, Math.floor(w * 0.022))}px`,
        color: "#ffd700",
      })
      .setOrigin(0.5)
      .setVisible(false);
  }

  private showSpinner(): void {
    let i = 0;
    this.spinnerText.setVisible(true);
    this.spinnerTimer = this.time.addEvent({
      delay: 80,
      loop: true,
      callback: () => {
        this.spinnerText.setText(
          `${SPINNER_FRAMES[i]} AI Thinking... ${SPINNER_FRAMES[i]}`,
        );
        i = (i + 1) % SPINNER_FRAMES.length;
      },
    });
  }

  private hideSpinner(): void {
    this.spinnerText.setVisible(false);
    if (this.spinnerTimer) {
      this.spinnerTimer.destroy();
      this.spinnerTimer = undefined;
    }
  }

  // --- Prompt UI (DOM overlay) ---

  private createPromptUI(): void {
    // Remove existing if rebuilding
    if (this.promptContainer) {
      this.promptContainer.remove();
    }

    const container = document.createElement("div");
    container.style.cssText =
      "position:fixed;bottom:8px;left:8px;z-index:100;display:flex;flex-direction:column;gap:4px;width:220px;";

    const textarea = document.createElement("textarea");
    textarea.maxLength = PROMPT_MAX_LENGTH;
    textarea.placeholder = PROMPT_PLACEHOLDER;
    textarea.value = this.mechPrompt;
    textarea.style.cssText =
      "width:100%;height:60px;background:#222;color:#0f8;border:1px solid #444;border-radius:6px;padding:6px;font-size:12px;resize:none;font-family:monospace;";

    const row = document.createElement("div");
    row.style.cssText =
      "display:flex;justify-content:space-between;align-items:center;";

    const counter = document.createElement("span");
    counter.style.cssText = "color:#666;font-size:11px;font-family:monospace;";
    counter.textContent = `${this.mechPrompt.length}/${PROMPT_MAX_LENGTH}`;

    const saveBtn = document.createElement("button");
    saveBtn.textContent = "Save";
    saveBtn.style.cssText =
      "background:#0f8;color:#000;border:none;border-radius:4px;padding:4px 12px;font-size:12px;font-weight:bold;cursor:pointer;font-family:monospace;";

    textarea.addEventListener("input", () => {
      this.mechPrompt = textarea.value;
      counter.textContent = `${textarea.value.length}/${PROMPT_MAX_LENGTH}`;
    });

    saveBtn.addEventListener("click", () => {
      saveMechPrompt(this.mechPrompt);
      saveBtn.textContent = "Saved!";
      saveBtn.style.background = "#0a5";
      setTimeout(() => {
        saveBtn.textContent = "Save";
        saveBtn.style.background = "#0f8";
      }, 1000);
    });

    row.appendChild(counter);
    row.appendChild(saveBtn);
    container.appendChild(textarea);
    container.appendChild(row);

    document.body.appendChild(container);
    this.promptContainer = container;
  }

  // --- PWA banners ---

  private initPWABanners(): void {
    // Offline banner
    this.onlineCleanup = onOnlineChange((online) => {
      if (!online) {
        this.showOfflineBanner();
      } else {
        this.removeOfflineBanner();
      }
    });
    if (!isOnline()) this.showOfflineBanner();

    // Update available banner
    onUpdateAvailable((updateSW) => {
      this.updateSWFn = updateSW;
      this.showUpdateBanner();
    });

    // Install prompt (3rd visit)
    if (shouldShowInstallPrompt()) {
      this.showInstallBanner();
    }
  }

  private showOfflineBanner(): void {
    if (this.offlineBanner) return;
    const banner = document.createElement("div");
    banner.style.cssText =
      "position:fixed;top:0;left:0;right:0;background:#ff4500;color:#fff;text-align:center;padding:6px 12px;font-size:13px;font-family:monospace;z-index:200;";
    banner.textContent = "⚡ Offline — LLM disabled, using Bot moves";
    document.body.appendChild(banner);
    this.offlineBanner = banner;
  }

  private removeOfflineBanner(): void {
    if (this.offlineBanner) {
      this.offlineBanner.remove();
      this.offlineBanner = undefined;
    }
  }

  private showUpdateBanner(): void {
    if (this.updateBanner) return;
    const banner = document.createElement("div");
    banner.style.cssText =
      "position:fixed;top:0;left:0;right:0;background:#1e90ff;color:#fff;text-align:center;padding:6px 12px;font-size:13px;font-family:monospace;z-index:201;display:flex;justify-content:center;align-items:center;gap:12px;";
    const text = document.createElement("span");
    text.textContent = "Update available!";
    const btn = document.createElement("button");
    btn.textContent = "Refresh";
    btn.style.cssText =
      "background:#fff;color:#1e90ff;border:none;border-radius:4px;padding:3px 10px;font-size:12px;font-weight:bold;cursor:pointer;font-family:monospace;";
    btn.addEventListener("click", () => {
      this.updateSWFn?.();
    });
    const dismiss = document.createElement("button");
    dismiss.textContent = "✕";
    dismiss.style.cssText =
      "background:none;color:#fff;border:none;font-size:16px;cursor:pointer;padding:0 4px;";
    dismiss.addEventListener("click", () => {
      this.updateBanner?.remove();
      this.updateBanner = undefined;
    });
    banner.appendChild(text);
    banner.appendChild(btn);
    banner.appendChild(dismiss);
    document.body.appendChild(banner);
    this.updateBanner = banner;
  }

  private showInstallBanner(): void {
    if (this.installBanner) return;
    const banner = document.createElement("div");
    banner.style.cssText =
      "position:fixed;bottom:80px;left:8px;background:#2a2a2a;color:#0f8;border:1px solid #444;border-radius:8px;padding:10px 14px;font-size:13px;font-family:monospace;z-index:200;display:flex;align-items:center;gap:10px;max-width:280px;";
    const text = document.createElement("span");
    text.textContent = "Install Mech Arena AI?";
    const btn = document.createElement("button");
    btn.textContent = "Install";
    btn.style.cssText =
      "background:#0f8;color:#000;border:none;border-radius:4px;padding:4px 12px;font-size:12px;font-weight:bold;cursor:pointer;font-family:monospace;";
    btn.addEventListener("click", async () => {
      await triggerInstallPrompt();
      this.installBanner?.remove();
      this.installBanner = undefined;
    });
    const dismiss = document.createElement("button");
    dismiss.textContent = "✕";
    dismiss.style.cssText =
      "background:none;color:#666;border:none;font-size:16px;cursor:pointer;padding:0 4px;";
    dismiss.addEventListener("click", () => {
      this.installBanner?.remove();
      this.installBanner = undefined;
    });
    banner.appendChild(text);
    banner.appendChild(btn);
    banner.appendChild(dismiss);
    document.body.appendChild(banner);
    this.installBanner = banner;
  }

  private cleanupPWABanners(): void {
    this.onlineCleanup?.();
    this.offlineBanner?.remove();
    this.updateBanner?.remove();
    this.installBanner?.remove();
    this.offlineBanner = undefined;
    this.updateBanner = undefined;
    this.installBanner = undefined;
  }

  // --- Skill buttons (2x2 grid) ---

  private createSkillButtons(w: number, h: number): void {
    const state = this.battleManager.getState();
    const skills = state.player.skills;

    const gridX = w * 0.5;
    const gridY = h * 0.66;
    const gridW = w * 0.48;
    const gridH = h * 0.3;
    const gap = 6;
    const btnW = (gridW - gap) / 2;
    const btnH = (gridH - gap) / 2;

    for (let i = 0; i < skills.length; i++) {
      const col = i % 2;
      const row = Math.floor(i / 2);
      const x = gridX + col * (btnW + gap);
      const y = gridY + row * (btnH + gap);
      const skill = skills[i];
      const skillColor = SKILL_COLORS[skill.type] || COLORS.defense;

      const container = this.add.container(x, y);

      const bg = this.add.graphics();
      bg.fillStyle(COLORS.buttonBg);
      bg.fillRoundedRect(0, 0, btnW, btnH, 6);
      bg.lineStyle(
        2,
        Phaser.Display.Color.HexStringToColor(skillColor).color,
        0.8,
      );
      bg.strokeRoundedRect(0, 0, btnW, btnH, 6);

      const fontSize = Math.max(11, Math.floor(w * 0.018));
      const subFontSize = Math.max(9, Math.floor(w * 0.013));

      const nameText = this.add
        .text(btnW / 2, btnH * 0.38, skill.name, {
          fontSize: `${fontSize}px`,
          color: skillColor,
          fontStyle: "bold",
          align: "center",
        })
        .setOrigin(0.5);

      const infoText = this.add
        .text(
          btnW / 2,
          btnH * 0.68,
          skill.damage > 0
            ? `${skill.type.toUpperCase()} · ${skill.damage} DMG`
            : "BUFF · DEF +50%",
          {
            fontSize: `${subFontSize}px`,
            color: "#999999",
            align: "center",
          },
        )
        .setOrigin(0.5);

      container.add([bg, nameText, infoText]);

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
          Phaser.Display.Color.HexStringToColor(skillColor).color,
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
          Phaser.Display.Color.HexStringToColor(skillColor).color,
          0.8,
        );
        bg.strokeRoundedRect(0, 0, btnW, btnH, 6);
      });

      hitZone.on("pointerdown", () => {
        this.onSkillSelected(i);
      });

      this.skillButtons.push(container);
      this.skillHitZones.push(hitZone);
    }
  }

  private setButtonsEnabled(enabled: boolean): void {
    for (const zone of this.skillHitZones) {
      if (enabled) {
        zone.setInteractive({ useHandCursor: true });
      } else {
        zone.disableInteractive();
      }
    }
    for (const container of this.skillButtons) {
      container.setAlpha(enabled ? 1 : 0.5);
    }
  }

  // --- Panel / HP drawing ---

  private drawPanel(x: number, y: number, w: number, h: number): void {
    const panel = this.add.graphics();
    panel.fillStyle(COLORS.panelBg, 0.9);
    panel.fillRoundedRect(x, y, w, h, 8);
    panel.lineStyle(1, COLORS.panelBorder);
    panel.strokeRoundedRect(x, y, w, h, 8);
  }

  private drawHPBar(
    graphics: Phaser.GameObjects.Graphics,
    x: number,
    y: number,
    w: number,
    h: number,
    ratio: number,
  ): void {
    graphics.clear();
    graphics.fillStyle(0x333333);
    graphics.fillRoundedRect(x, y, w, h, 3);

    if (ratio > 0) {
      let color: number = COLORS.hpGreen;
      if (ratio < 0.25) color = COLORS.hpRed;
      else if (ratio < 0.5) color = COLORS.hpYellow;

      graphics.fillStyle(color);
      graphics.fillRoundedRect(x, y, w * Math.max(ratio, 0.01), h, 3);
    }
  }

  // --- Animations ---

  private animateHP(
    isOpponent: boolean,
    targetRatio: number,
    newHp: number,
    maxHp: number,
  ): Promise<void> {
    return new Promise((resolve) => {
      const fromRatio = isOpponent
        ? this.displayedOpponentRatio
        : this.displayedPlayerRatio;
      const hpBar = isOpponent ? this.opponentHPBar : this.playerHPBar;
      const hpText = isOpponent ? this.opponentHPText : this.playerHPText;
      const geom = isOpponent ? this.opponentBarGeom : this.playerBarGeom;
      const fromHp = Math.round(fromRatio * maxHp);

      const target = { ratio: fromRatio, hp: fromHp };

      this.tweens.add({
        targets: target,
        ratio: targetRatio,
        hp: newHp,
        duration: HP_TWEEN_DURATION,
        ease: "Power2",
        onUpdate: () => {
          this.drawHPBar(hpBar, geom.x, geom.y, geom.w, geom.h, target.ratio);
          hpText.setText(`${Math.round(target.hp)} / ${maxHp}`);
        },
        onComplete: () => {
          if (isOpponent) {
            this.displayedOpponentRatio = targetRatio;
          } else {
            this.displayedPlayerRatio = targetRatio;
          }
          hpText.setText(`${newHp} / ${maxHp}`);
          resolve();
        },
      });
    });
  }

  private playAttackAnimation(isPlayer: boolean): Promise<void> {
    const sprite = isPlayer ? this.playerMechSprite : this.opponentMechSprite;
    return playMechAttack(this, sprite, isPlayer);
  }

  private playDamageFlash(targetIsOpponent: boolean): Promise<void> {
    const sprite = targetIsOpponent
      ? this.opponentMechSprite
      : this.playerMechSprite;
    return playMechDamageFlash(this, sprite);
  }

  // --- Turn execution ---

  private async onSkillSelected(index: number): Promise<void> {
    if (this.isAnimating) return;
    const state = this.battleManager.getState();
    if (state.phase !== TurnPhase.PlayerTurn) return;

    this.isAnimating = true;
    this.setButtonsEnabled(false);

    const prevOpponentHp = state.opponent.hp;
    const prevLogLen = state.log.length;

    // --- Phase 1: Player attack ---
    const afterPlayer = this.battleManager.executePlayerAttack(index);
    const playerLogs = afterPlayer.log.slice(prevLogLen);

    this.setTurnIndicator(TurnPhase.PlayerTurn);
    for (const msg of playerLogs) {
      this.addLogMessage(msg);
    }

    await this.playAttackAnimation(true);

    if (afterPlayer.opponent.hp < prevOpponentHp) {
      await this.playDamageFlash(true);
    }

    await this.animateHP(
      true,
      afterPlayer.opponent.hp / afterPlayer.opponent.maxHp,
      afterPlayer.opponent.hp,
      afterPlayer.opponent.maxHp,
    );

    // Check if opponent defeated
    if (afterPlayer.winner === "player") {
      this.setTurnIndicator(TurnPhase.BattleOver);
      this.showResultScreen(true);
      return;
    }

    // --- Phase 2: AI thinking + API call ---
    this.setTurnIndicator(TurnPhase.AiThinking);
    this.showSpinner();

    let aiSkillIndex: number;
    if (this.mechPrompt.trim() && isOnline()) {
      const apiResult = await callBattleAPI(
        this.mechPrompt,
        this.battleManager.getState(),
      );
      aiSkillIndex = apiResult?.move ?? this.battleManager.getRandomAiSkill();
    } else {
      aiSkillIndex = this.battleManager.getRandomAiSkill();
    }

    this.hideSpinner();

    // --- Phase 3: AI attack ---
    const prevPlayerHp = afterPlayer.player.hp;
    const aiLogLen = this.battleManager.getState().log.length;
    const afterAi = this.battleManager.executeAiAttack(aiSkillIndex);
    const aiLogs = afterAi.log.slice(aiLogLen);

    this.setTurnIndicator(TurnPhase.AiTurn);
    for (const msg of aiLogs) {
      this.addLogMessage(msg);
    }

    await this.playAttackAnimation(false);

    if (afterAi.player.hp < prevPlayerHp) {
      await this.playDamageFlash(false);
    }

    await this.animateHP(
      false,
      afterAi.player.hp / afterAi.player.maxHp,
      afterAi.player.hp,
      afterAi.player.maxHp,
    );

    // Check if player defeated
    if (afterAi.winner === "opponent") {
      this.setTurnIndicator(TurnPhase.BattleOver);
      this.showResultScreen(false);
      return;
    }

    // --- Back to player turn ---
    this.setTurnIndicator(TurnPhase.PlayerTurn);
    this.setButtonsEnabled(true);
    this.isAnimating = false;
  }

  // --- History button ---

  private createHistoryButton(w: number, h: number): void {
    const btnW = Math.min(w * 0.15, 100);
    const btnH = 28;
    const btnX = w - btnW - w * 0.03;
    const btnY = h * 0.03;

    const bg = this.add.graphics();
    bg.fillStyle(COLORS.buttonBg);
    bg.fillRoundedRect(btnX, btnY, btnW, btnH, 6);
    bg.lineStyle(1, COLORS.panelBorder);
    bg.strokeRoundedRect(btnX, btnY, btnW, btnH, 6);

    this.add
      .text(btnX + btnW / 2, btnY + btnH / 2, "History", {
        fontSize: `${Math.max(11, Math.floor(w * 0.016))}px`,
        color: COLORS.accent,
        fontStyle: "bold",
      })
      .setOrigin(0.5);

    const zone = this.add
      .zone(btnX, btnY, btnW, btnH)
      .setOrigin(0)
      .setInteractive({ useHandCursor: true });

    zone.on("pointerover", () => {
      bg.clear();
      bg.fillStyle(COLORS.buttonHover);
      bg.fillRoundedRect(btnX, btnY, btnW, btnH, 6);
      bg.lineStyle(1, COLORS.accentHex);
      bg.strokeRoundedRect(btnX, btnY, btnW, btnH, 6);
    });

    zone.on("pointerout", () => {
      bg.clear();
      bg.fillStyle(COLORS.buttonBg);
      bg.fillRoundedRect(btnX, btnY, btnW, btnH, 6);
      bg.lineStyle(1, COLORS.panelBorder);
      bg.strokeRoundedRect(btnX, btnY, btnW, btnH, 6);
    });

    zone.on("pointerdown", () => {
      this.scale.off("resize", this.handleResize, this);
      if (this.promptContainer) {
        this.promptContainer.remove();
        this.promptContainer = undefined;
      }
      this.cleanupPWABanners();
      this.scene.start("HistoryScene");
    });
  }

  // --- Save battle record ---

  private saveBattleRecord(won: boolean): void {
    const state = this.battleManager.getState();
    const record: BattleRecord = {
      id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      timestamp: Date.now(),
      playerMechType: PLAYER_MECH.type,
      opponentMechType: OPPONENT_MECH.type,
      result: won ? "win" : "loss",
      turns: state.turnCount,
      playerHpLeft: state.player.hp,
      opponentHpLeft: state.opponent.hp,
    };
    saveBattleHistory(record);
  }

  // --- Result screen ---

  private showResultScreen(won: boolean): void {
    this.saveBattleRecord(won);
    const { width: w, height: h } = this.scale;

    this.resultOverlay = this.add.container(0, 0);

    // Dark overlay
    const bg = this.add.graphics();
    bg.fillStyle(0x000000, 0.7);
    bg.fillRect(0, 0, w, h);
    this.resultOverlay.add(bg);

    // Result text
    const titleText = won ? "VICTORY!" : "DEFEAT...";
    const titleColor = won ? "#00ff88" : "#ff4500";
    const title = this.add
      .text(w / 2, h * 0.35, titleText, {
        fontSize: `${Math.max(32, Math.floor(w * 0.06))}px`,
        color: titleColor,
        fontStyle: "bold",
        stroke: "#000000",
        strokeThickness: 4,
      })
      .setOrigin(0.5);
    this.resultOverlay.add(title);

    // Subtitle
    const subtitle = this.add
      .text(
        w / 2,
        h * 0.45,
        won ? "Enemy mech destroyed!" : "Your mech was destroyed...",
        {
          fontSize: `${Math.max(14, Math.floor(w * 0.025))}px`,
          color: "#cccccc",
        },
      )
      .setOrigin(0.5);
    this.resultOverlay.add(subtitle);

    // Play Again button
    const btnW = Math.min(w * 0.3, 200);
    const btnH = 48;
    const btnX = w / 2 - btnW / 2;
    const btnY = h * 0.56;

    const btnBg = this.add.graphics();
    btnBg.fillStyle(COLORS.accentHex, 1);
    btnBg.fillRoundedRect(btnX, btnY, btnW, btnH, 8);
    this.resultOverlay.add(btnBg);

    const btnText = this.add
      .text(w / 2, btnY + btnH / 2, "Play Again", {
        fontSize: `${Math.max(16, Math.floor(w * 0.025))}px`,
        color: "#000000",
        fontStyle: "bold",
      })
      .setOrigin(0.5);
    this.resultOverlay.add(btnText);

    const btnZone = this.add
      .zone(btnX, btnY, btnW, btnH)
      .setOrigin(0)
      .setInteractive({ useHandCursor: true });

    btnZone.on("pointerover", () => {
      btnBg.clear();
      btnBg.fillStyle(0x00cc66, 1);
      btnBg.fillRoundedRect(btnX, btnY, btnW, btnH, 8);
    });

    btnZone.on("pointerout", () => {
      btnBg.clear();
      btnBg.fillStyle(COLORS.accentHex, 1);
      btnBg.fillRoundedRect(btnX, btnY, btnW, btnH, 8);
    });

    btnZone.on("pointerdown", () => {
      this.restartBattle();
    });
    this.resultOverlay.add(btnZone);

    // Fade in
    this.resultOverlay.setAlpha(0);
    this.tweens.add({
      targets: this.resultOverlay,
      alpha: 1,
      duration: 400,
      ease: "Power2",
    });
  }

  private restartBattle(): void {
    this.hideSpinner();
    if (this.resultOverlay) {
      this.resultOverlay.destroy();
      this.resultOverlay = undefined;
    }
    this.children.removeAll(true);
    this.logMessages = [];
    this.skillButtons = [];
    this.skillHitZones = [];
    this.isAnimating = false;
    this.displayedOpponentRatio = 1;
    this.displayedPlayerRatio = 1;

    this.battleManager.initBattle(
      JSON.parse(JSON.stringify(PLAYER_MECH)),
      JSON.parse(JSON.stringify(OPPONENT_MECH)),
    );

    const { width, height } = this.scale;
    this.buildUI(width, height);

    const state = this.battleManager.getState();
    for (const msg of state.log) {
      this.addLogMessage(msg);
    }
    this.setTurnIndicator(state.phase);
  }

  // --- Responsive resize ---

  private handleResize(gameSize: Phaser.Structs.Size): void {
    const { width, height } = gameSize;
    this.cameras.main.setViewport(0, 0, width, height);

    this.hideSpinner();
    this.children.removeAll(true);
    this.skillButtons = [];
    this.skillHitZones = [];
    const savedLog = [...this.logMessages];
    this.logMessages = [];

    this.buildUI(width, height);

    // Restore state
    const state = this.battleManager.getState();
    this.displayedOpponentRatio = state.opponent.hp / state.opponent.maxHp;
    this.displayedPlayerRatio = state.player.hp / state.player.maxHp;

    this.drawHPBar(
      this.opponentHPBar,
      this.opponentBarGeom.x,
      this.opponentBarGeom.y,
      this.opponentBarGeom.w,
      this.opponentBarGeom.h,
      this.displayedOpponentRatio,
    );
    this.opponentHPText.setText(
      `${state.opponent.hp} / ${state.opponent.maxHp}`,
    );

    this.drawHPBar(
      this.playerHPBar,
      this.playerBarGeom.x,
      this.playerBarGeom.y,
      this.playerBarGeom.w,
      this.playerBarGeom.h,
      this.displayedPlayerRatio,
    );
    this.playerHPText.setText(`${state.player.hp} / ${state.player.maxHp}`);

    // Restore log
    for (const msg of savedLog) {
      this.logMessages.push(msg);
    }
    if (this.logMessages.length > LOG_MAX_LINES) {
      this.logMessages.splice(0, this.logMessages.length - LOG_MAX_LINES);
    }
    this.battleLogText.setText(this.logMessages.join("\n"));

    this.setTurnIndicator(state.phase);

    if (state.phase === TurnPhase.BattleOver) {
      this.showResultScreen(state.winner === "player");
    } else if (this.isAnimating) {
      this.setButtonsEnabled(false);
    }
  }
}
