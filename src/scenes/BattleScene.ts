/**
 * BattleScene - Pokémon-style battle UI connected to BattleManager
 */

import Phaser from "phaser";
import { callBattleAPI } from "../api/battleClient";
import { ASSET_REGISTRY } from "../assets";
import { type Mech, type MechType, TurnPhase } from "../types/game";
import type { BattleRecord } from "../types/storage";
import { BattleManager } from "../utils/BattleManager";
import { getEffectiveness } from "../utils/BattleManager";
import {
  type MechSprite,
  PORTRAIT_TEXTURE_KEYS,
  type PortraitState,
  createMechSprite,
  getPortraitState,
  playAttackProjectile,
  playHitReaction,
  playMechAttack,
  playMechDamageFlash,
  preloadMechAssets,
  showDamageNumber,
  showEffectivenessLabel,
  showSkillName,
} from "../utils/MechGraphics";
import {
  BATTLE_BG_TINT,
  EDGE_OVERLAY_ALPHA,
  GROUND_TINT,
  computeBackgroundLayout,
} from "../utils/backgroundConfig";
import { LOG_MAX_LINES, parseLogMessage } from "../utils/logColors";
import {
  PROMPT_LAYOUT,
  buildContainerStyle,
  buildInstallBannerStyle,
  buildSaveButtonStyle,
  buildTextareaStyle,
} from "../utils/promptLayout";
import {
  isOnline,
  onOnlineChange,
  onUpdateAvailable,
  shouldShowInstallPrompt,
  triggerInstallPrompt,
} from "../utils/pwa";
import {
  initSound,
  isMuted,
  playAttackSound,
  playClickSound,
  playDefeatSound,
  playHitSound,
  playVictorySound,
  resumeSound,
  setMuted,
} from "../utils/soundManager";
import {
  loadMechPrompt,
  loadSettings,
  saveBattleHistory,
  saveMechPrompt,
  saveSettings,
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

// Mech definitions imported from shared module
import { OPPONENT_MECH, PLAYER_MECH } from "../data/mechs";

const SPINNER_FRAMES = ["⠋", "⠙", "⠹", "⠸", "⠼", "⠴", "⠦", "⠧", "⠇", "⠏"];
const HP_TWEEN_DURATION = 500;

const PROMPT_MAX_LENGTH = 500;
const PROMPT_PLACEHOLDER =
  "Enter your mech's battle strategy... e.g. 'Be aggressive, use high-damage attacks when HP is high. Switch to defense when low.'";

export class BattleScene extends Phaser.Scene {
  // Battle state
  private battleManager!: BattleManager;
  private isAnimating = false;

  // Background layers
  private bgImage!: Phaser.GameObjects.Image;
  private groundImage!: Phaser.GameObjects.TileSprite;
  private transitionGradient!: Phaser.GameObjects.Graphics;
  private groundEdgeOverlay!: Phaser.GameObjects.Graphics;

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

  // Portrait UI
  private opponentPortrait?: Phaser.GameObjects.Image;
  private playerPortrait?: Phaser.GameObjects.Image;
  private opponentPortraitState: PortraitState = "normal";
  private playerPortraitState: PortraitState = "normal";

  // Battle log
  private battleLogText!: Phaser.GameObjects.Text;
  private logMessages: string[] = [];
  private logLineTexts: Phaser.GameObjects.Text[] = [];
  private logLineColors: string[] = [];
  private logContainer!: Phaser.GameObjects.Container;
  private logFontSize = 12;
  private logLineWidth = 200;

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

  // Selected player mech (set via init data or default)
  private playerMech: Mech = PLAYER_MECH;

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

  init(data?: { selectedMech?: Mech }): void {
    this.playerMech = data?.selectedMech ?? PLAYER_MECH;
  }

  preload(): void {
    console.log("[BattleScene] preload() start");

    // Catch any asset load errors so they don't cause a black screen
    this.load.on("loaderror", (file: { key: string; url: string }) => {
      console.error("[BattleScene] Failed to load asset:", file.key, file.url);
    });

    preloadMechAssets(this);

    this.load.on("complete", () => {
      console.log("[BattleScene] preload complete");
    });
  }

  create(): void {
    console.log("[BattleScene] create() start");
    this.battleManager = new BattleManager();
    this.battleManager.initBattle(
      JSON.parse(JSON.stringify(this.playerMech)),
      JSON.parse(JSON.stringify(OPPONENT_MECH)),
    );

    this.displayedOpponentRatio = 1;
    this.displayedPlayerRatio = 1;
    this.isAnimating = false;

    // Load saved prompt
    this.mechPrompt = loadMechPrompt();

    // Init sound
    initSound();
    const settings = loadSettings();
    setMuted(!settings.soundEnabled);
    this.input.once("pointerdown", () => resumeSound());

    const { width, height } = this.scale;
    this.buildUI(width, height);
    this.createPromptUI();
    this.initPWABanners();

    // Sync initial log
    const state = this.battleManager.getState();
    for (const msg of state.log) {
      this.addLogMessage(msg);
    }

    // Show strategy status in log
    if (this.mechPrompt.trim()) {
      const summary =
        this.mechPrompt.length > 40
          ? `${this.mechPrompt.slice(0, 37)}...`
          : this.mechPrompt;
      this.addLogMessage(`[EFF]Strategy: ${summary}`);
    } else {
      this.addLogMessage("[TURN]Tip: Save a strategy to guide your AI!");
    }

    this.setTurnIndicator(state.phase);

    this.scale.on("resize", this.handleResize, this);
  }

  private buildUI(w: number, h: number): void {
    this.skillButtons = [];
    this.skillHitZones = [];
    this.createBackground(w, h);
    this.createOpponentArea(w, h);
    this.createPlayerArea(w, h);
    this.createTurnIndicator(w, h);
    this.createBattleLog(w, h);
    this.createSkillButtons(w, h);
    this.createSpinner(w, h);
    this.createHistoryButton(w, h);
    this.createSoundToggle(w, h);
  }

  // --- Background layers ---

  private createBackground(w: number, h: number): void {
    const layout = computeBackgroundLayout(w, h);

    // Full-screen background image, darkened for UI readability
    this.bgImage = this.add.image(
      layout.bgX,
      layout.bgY,
      ASSET_REGISTRY.backgrounds.city.key,
    );
    this.bgImage.setDisplaySize(layout.bgW, layout.bgH);
    this.bgImage.setOrigin(0.5);
    this.bgImage.setTint(BATTLE_BG_TINT);

    // Transition gradient: fades from transparent to ground tone above ground
    this.transitionGradient = this.add.graphics();
    const steps = 16;
    for (let i = 0; i < steps; i++) {
      const alpha = i / steps;
      const y = layout.transitionY + (layout.transitionH / steps) * i;
      const h = layout.transitionH / steps + 1; // +1 to avoid sub-pixel gaps
      this.transitionGradient.fillStyle(0x1a1a1a, alpha * 0.5);
      this.transitionGradient.fillRect(0, y, layout.groundW, h);
    }

    // Ground tile layer at the bottom of the scene
    this.groundImage = this.add.tileSprite(
      layout.groundX,
      layout.groundY,
      layout.groundW,
      layout.groundH,
      ASSET_REGISTRY.backgrounds.ground.key,
    );
    this.groundImage.setOrigin(0.5);
    this.groundImage.setTint(GROUND_TINT);

    // Ground edge overlay: feathered top edge for soft blending
    const groundTopY = layout.groundY - layout.groundH / 2;
    const edgeH = Math.min(20, layout.groundH * 0.25);
    this.groundEdgeOverlay = this.add.graphics();
    const edgeSteps = 10;
    for (let i = 0; i < edgeSteps; i++) {
      const alpha = EDGE_OVERLAY_ALPHA * (1 - i / edgeSteps);
      const y = groundTopY + (edgeH / edgeSteps) * i;
      const h = edgeH / edgeSteps + 1;
      this.groundEdgeOverlay.fillStyle(0x1a1a1a, alpha);
      this.groundEdgeOverlay.fillRect(0, y, layout.groundW, h);
    }
  }

  // --- Opponent area (top) ---

  private createOpponentArea(w: number, h: number): void {
    const spriteX = w * 0.65;
    const spriteY = 150;
    const spriteW = Math.min(w * 0.4, 240);
    const spriteH = Math.min(h * 0.44, 240);

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

    // Portrait (left side of panel)
    const portraitSize = Math.max(32, Math.floor(panelH * 0.8));
    const portraitX = panelX + 6 + portraitSize / 2;
    const portraitY = panelY + panelH / 2;
    const showPortrait = w >= 400;

    if (showPortrait) {
      this.opponentPortrait = this.addPortrait(
        OPPONENT_MECH.type,
        this.opponentPortraitState,
        portraitX,
        portraitY,
        portraitSize,
      );
    }

    const textOffsetX = showPortrait ? portraitSize + 12 : 10;

    this.add
      .text(
        panelX + textOffsetX,
        panelY + 6,
        `${OPPONENT_MECH.codename ?? OPPONENT_MECH.name}  Lv.5`,
        {
          fontSize: `${Math.max(11, Math.floor(w * 0.018))}px`,
          color: COLORS.text,
          fontStyle: "bold",
        },
      )
      .setOrigin(0, 0);

    // HP bar
    const barX = panelX + textOffsetX + 24;
    const barY = panelY + panelH * 0.5 - Math.max(8, panelH * 0.2) / 2;
    const barW = panelW - textOffsetX - 10 - 24;
    const barH = Math.max(8, panelH * 0.2);

    this.opponentBarGeom = { x: barX, y: barY, w: barW, h: barH };

    this.add
      .text(panelX + textOffsetX, panelY + panelH * 0.5 - 2, "HP", {
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
    const spriteW = Math.min(w * 0.44, 280);
    const spriteH = Math.min(h * 0.5, 280);

    this.playerMechSprite = createMechSprite(
      this,
      this.playerMech.type,
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

    // Portrait (right side of panel)
    const portraitSize = Math.max(32, Math.floor(panelH * 0.8));
    const showPortrait = w >= 400;
    const portraitRightPad = showPortrait ? portraitSize + 12 : 0;

    if (showPortrait) {
      const portraitX = panelX + panelW - 6 - portraitSize / 2;
      const portraitY = panelY + panelH / 2;
      this.playerPortrait = this.addPortrait(
        this.playerMech.type,
        this.playerPortraitState,
        portraitX,
        portraitY,
        portraitSize,
      );
    }

    this.add
      .text(
        panelX + 10,
        panelY + 6,
        `${this.playerMech.codename ?? this.playerMech.name}  Lv.5`,
        {
          fontSize: `${Math.max(11, Math.floor(w * 0.018))}px`,
          color: COLORS.text,
          fontStyle: "bold",
        },
      )
      .setOrigin(0, 0);

    // HP bar
    const barX = panelX + 10 + 24;
    const barY = panelY + panelH * 0.5 - Math.max(8, panelH * 0.2) / 2;
    const barW = panelW - 20 - 24 - portraitRightPad;
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
      .text(
        panelX + panelW - 10 - portraitRightPad,
        barY + barH + 2,
        "100 / 100",
        {
          fontSize: `${Math.max(9, Math.floor(w * 0.013))}px`,
          color: "#aaaaaa",
        },
      )
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
    const logH = Math.min(h * 0.25, h - logY - 10);

    const bg = this.add.graphics();
    bg.fillStyle(0x1a1a2e, 0.92);
    bg.fillRoundedRect(logX, logY, logW, logH, 6);
    bg.lineStyle(1, COLORS.panelBorder);
    bg.strokeRoundedRect(logX, logY, logW, logH, 6);

    // Panel title
    const titleSize = Math.max(11, Math.floor(w * 0.015));
    this.add
      .text(logX + 10, logY + 5, "\u2694 Battle Log", {
        fontSize: `${titleSize}px`,
        color: "#888888",
      })
      .setOrigin(0, 0);

    const titleOffset = titleSize + 10;
    this.logContainer = this.add.container(logX + 10, logY + titleOffset);

    // Keep legacy text object for compatibility (hidden)
    this.battleLogText = this.add
      .text(0, 0, "", {
        fontSize: `${Math.max(12, Math.floor(w * 0.018))}px`,
        color: COLORS.accent,
        wordWrap: { width: logW - 20 },
        lineSpacing: 3,
      })
      .setOrigin(0, 0)
      .setVisible(false);

    this.logFontSize = Math.max(12, Math.floor(w * 0.018));
    this.logLineWidth = logW - 20;

    // Mask to clip overflow
    const mask = this.add.graphics();
    mask.fillStyle(0xffffff);
    mask.fillRect(logX, logY, logW, logH);
    this.logContainer.setMask(
      new Phaser.Display.Masks.GeometryMask(this, mask),
    );
  }

  private addLogMessage(msg: string): void {
    const { displayMsg, color } = parseLogMessage(msg);

    this.logMessages.push(`> ${displayMsg}`);
    this.logLineColors.push(color);

    // Keep last N lines for auto-scroll
    if (this.logMessages.length > LOG_MAX_LINES) {
      this.logMessages.shift();
      this.logLineColors.shift();
    }

    // Rebuild per-line Text objects
    for (const t of this.logLineTexts) {
      t.destroy();
    }
    this.logLineTexts = [];

    const lineHeight = this.logFontSize + 6;
    for (let i = 0; i < this.logMessages.length; i++) {
      const lineText = this.add
        .text(0, i * lineHeight, this.logMessages[i], {
          fontSize: `${this.logFontSize}px`,
          color: this.logLineColors[i],
          wordWrap: { width: this.logLineWidth },
        })
        .setOrigin(0, 0);
      this.logContainer.add(lineText);
      this.logLineTexts.push(lineText);
    }

    // Flash highlight for new message
    this.logContainer.setAlpha(0.5);
    this.tweens.add({
      targets: this.logContainer,
      alpha: 1,
      duration: 300,
      ease: "Linear",
    });
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
    const label = this.mechPrompt.trim()
      ? "Analyzing strategy..."
      : "AI Thinking...";
    this.spinnerText.setVisible(true);
    this.spinnerTimer = this.time.addEvent({
      delay: 80,
      loop: true,
      callback: () => {
        this.spinnerText.setText(
          `${SPINNER_FRAMES[i]} ${label} ${SPINNER_FRAMES[i]}`,
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
    container.style.cssText = buildContainerStyle(PROMPT_LAYOUT.container);

    const textarea = document.createElement("textarea");
    textarea.maxLength = PROMPT_MAX_LENGTH;
    textarea.placeholder = PROMPT_PLACEHOLDER;
    textarea.value = this.mechPrompt;
    textarea.style.cssText = buildTextareaStyle(PROMPT_LAYOUT.textarea);

    const row = document.createElement("div");
    row.style.cssText =
      "display:flex;justify-content:space-between;align-items:center;";

    const counter = document.createElement("span");
    counter.style.cssText = "color:#666;font-size:11px;font-family:monospace;";
    counter.textContent = `${this.mechPrompt.length}/${PROMPT_MAX_LENGTH}`;

    const saveBtn = document.createElement("button");
    saveBtn.textContent = "Save";
    saveBtn.style.cssText = buildSaveButtonStyle(PROMPT_LAYOUT.saveButton);

    textarea.addEventListener("input", () => {
      this.mechPrompt = textarea.value;
      counter.textContent = `${textarea.value.length}/${PROMPT_MAX_LENGTH}`;
    });

    saveBtn.addEventListener("click", () => {
      saveMechPrompt(this.mechPrompt);
      saveBtn.textContent = "Saved!";
      saveBtn.style.background = "#0a5";
      this.addLogMessage("[EFF]Strategy updated!");
      setTimeout(() => {
        saveBtn.textContent = "Save";
        saveBtn.style.background = "#0f8";
      }, 1000);
    });

    const indicator = document.createElement("span");
    indicator.style.cssText =
      "color:#0f8;font-size:11px;font-family:monospace;display:none;";
    indicator.textContent = "\u26A1 Strategy Active";
    if (this.mechPrompt.trim()) {
      indicator.style.display = "inline";
    }

    saveBtn.addEventListener("click", () => {
      indicator.style.display = this.mechPrompt.trim() ? "inline" : "none";
    });

    row.appendChild(counter);
    row.appendChild(indicator);
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
    banner.style.cssText = buildInstallBannerStyle(PROMPT_LAYOUT.installBanner);
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

      // Effectiveness hint for attack skills
      let infoLabel: string;
      let infoColor = "#999999";
      if (skill.damage > 0 && skill.type !== "defense") {
        const eff = getEffectiveness(
          skill.type as MechType,
          OPPONENT_MECH.type,
        );
        if (eff > 1) {
          infoLabel = `${skill.type.toUpperCase()} · ${skill.damage} DMG  \u25B2 1.5x`;
          infoColor = COLORS.accent;
        } else if (eff < 1) {
          infoLabel = `${skill.type.toUpperCase()} · ${skill.damage} DMG  \u25BC 0.5x`;
          infoColor = "#ff6666";
        } else {
          infoLabel = `${skill.type.toUpperCase()} · ${skill.damage} DMG`;
        }
      } else {
        infoLabel = "BUFF · DEF +50%";
      }

      const infoText = this.add
        .text(btnW / 2, btnH * 0.68, infoLabel, {
          fontSize: `${subFontSize}px`,
          color: infoColor,
          align: "center",
        })
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

  // --- Portrait helpers ---

  private addPortrait(
    mechType: MechType,
    state: PortraitState,
    x: number,
    y: number,
    size: number,
  ): Phaser.GameObjects.Image | undefined {
    const states = PORTRAIT_TEXTURE_KEYS[mechType];
    if (!states) return undefined;
    const entry = states[state];
    if (!entry || !this.textures.exists(entry.key)) return undefined;

    const img = this.add.image(x, y, entry.key);
    img.setDisplaySize(size, size);
    return img;
  }

  private updatePortraitState(
    isOpponent: boolean,
    hpRatio: number,
    isDefeated: boolean,
  ): void {
    const newState = getPortraitState(hpRatio, isDefeated);
    const currentState = isOpponent
      ? this.opponentPortraitState
      : this.playerPortraitState;
    const portrait = isOpponent ? this.opponentPortrait : this.playerPortrait;

    if (newState === currentState || !portrait) return;

    const mechType = isOpponent ? OPPONENT_MECH.type : this.playerMech.type;
    const states = PORTRAIT_TEXTURE_KEYS[mechType];
    if (!states) return;
    const entry = states[newState];
    if (!entry || !this.textures.exists(entry.key)) return;

    // Update state
    if (isOpponent) {
      this.opponentPortraitState = newState;
    } else {
      this.playerPortraitState = newState;
    }

    // Switch texture with a scale pulse transition
    portrait.setTexture(entry.key);
    this.tweens.add({
      targets: portrait,
      scaleX: portrait.scaleX * 0.9,
      scaleY: portrait.scaleY * 0.9,
      duration: 100,
      yoyo: true,
      ease: "Power2",
    });
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
          this.updatePortraitState(isOpponent, targetRatio, targetRatio <= 0);
          resolve();
        },
      });
    });
  }

  private playAttackAnimation(isPlayer: boolean): Promise<void> {
    const sprite = isPlayer ? this.playerMechSprite : this.opponentMechSprite;
    return playMechAttack(this, sprite, isPlayer);
  }

  private playDefeatAnimation(sprite: MechSprite): Promise<void> {
    return new Promise((resolve) => {
      this.tweens.add({
        targets: sprite.container,
        angle: 90,
        alpha: 0,
        y: sprite.container.y + 30,
        duration: 500,
        ease: "Quad.easeIn",
        onComplete: () => resolve(),
      });
    });
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
    playClickSound();

    this.isAnimating = true;
    this.setButtonsEnabled(false);

    const prevOpponentHp = state.opponent.hp;
    const prevLogLen = state.log.length;

    // --- Phase 1: Player attack ---
    const afterPlayer = this.battleManager.executePlayerAttack(index);
    const playerLogs = afterPlayer.log.slice(prevLogLen);

    const playerSkill = this.playerMech.skills[index];

    this.setTurnIndicator(TurnPhase.PlayerTurn);
    for (const msg of playerLogs) {
      this.addLogMessage(msg);
    }

    await showSkillName(
      this,
      playerSkill.name,
      SKILL_COLORS[playerSkill.type] ?? COLORS.accent,
    );
    await this.playAttackAnimation(true);
    playAttackSound(
      playerSkill.type as "fire" | "water" | "electric" | "defense",
    );
    await playAttackProjectile(
      this,
      this.playerMechSprite,
      this.opponentMechSprite,
      playerSkill.type,
    );

    const playerDmg = prevOpponentHp - afterPlayer.opponent.hp;
    if (playerDmg > 0) {
      const eff = playerLogs.some((m: string) => m.startsWith("[SUP]"))
        ? "super"
        : playerLogs.some((m: string) => m.startsWith("[RES]"))
          ? "resist"
          : "normal";
      playHitSound();
      showDamageNumber(this, this.opponentMechSprite, playerDmg, eff);
      if (eff !== "normal") {
        showEffectivenessLabel(this, this.opponentMechSprite, eff);
      }
      await Promise.all([
        playHitReaction(this, this.opponentMechSprite, playerSkill.type),
        this.playDamageFlash(true),
        this.animateHP(
          true,
          afterPlayer.opponent.hp / afterPlayer.opponent.maxHp,
          afterPlayer.opponent.hp,
          afterPlayer.opponent.maxHp,
        ),
      ]);
    } else {
      await this.animateHP(
        true,
        afterPlayer.opponent.hp / afterPlayer.opponent.maxHp,
        afterPlayer.opponent.hp,
        afterPlayer.opponent.maxHp,
      );
    }

    // Check if opponent defeated
    if (afterPlayer.winner === "player") {
      this.setTurnIndicator(TurnPhase.BattleOver);
      await this.playDefeatAnimation(this.opponentMechSprite);
      this.showResultScreen(true);
      return;
    }

    // --- Phase 2: AI thinking + API call ---
    this.setTurnIndicator(TurnPhase.AiThinking);
    this.showSpinner();

    let aiSkillIndex: number;
    let aiReasoning: string | undefined;
    if (this.mechPrompt.trim() && isOnline()) {
      const apiResult = await callBattleAPI(
        this.mechPrompt,
        this.battleManager.getState(),
      );
      aiSkillIndex = apiResult?.move ?? this.battleManager.getRandomAiSkill();
      aiReasoning = apiResult?.reasoning;
    } else {
      aiSkillIndex = this.battleManager.getRandomAiSkill();
    }

    this.hideSpinner();

    // --- Phase 3: AI attack ---
    const prevPlayerHp = afterPlayer.player.hp;
    const aiLogLen = this.battleManager.getState().log.length;
    const afterAi = this.battleManager.executeAiAttack(aiSkillIndex);
    const aiLogs = afterAi.log.slice(aiLogLen);

    const aiSkill = OPPONENT_MECH.skills[aiSkillIndex];

    this.setTurnIndicator(TurnPhase.AiTurn);
    for (const msg of aiLogs) {
      this.addLogMessage(msg);
    }
    if (aiReasoning) {
      const truncated =
        aiReasoning.length > 60
          ? `${aiReasoning.slice(0, 57)}...`
          : aiReasoning;
      this.addLogMessage(`[EFF]AI: ${truncated}`);
    }

    await showSkillName(
      this,
      aiSkill.name,
      SKILL_COLORS[aiSkill.type] ?? COLORS.accent,
    );
    await this.playAttackAnimation(false);
    playAttackSound(aiSkill.type as "fire" | "water" | "electric" | "defense");
    await playAttackProjectile(
      this,
      this.opponentMechSprite,
      this.playerMechSprite,
      aiSkill.type,
    );

    const aiDmg = prevPlayerHp - afterAi.player.hp;
    if (aiDmg > 0) {
      const eff = aiLogs.some((m: string) => m.startsWith("[SUP]"))
        ? "super"
        : aiLogs.some((m: string) => m.startsWith("[RES]"))
          ? "resist"
          : "normal";
      playHitSound();
      showDamageNumber(this, this.playerMechSprite, aiDmg, eff);
      if (eff !== "normal") {
        showEffectivenessLabel(this, this.playerMechSprite, eff);
      }
      await Promise.all([
        playHitReaction(this, this.playerMechSprite, aiSkill.type),
        this.playDamageFlash(false),
        this.animateHP(
          false,
          afterAi.player.hp / afterAi.player.maxHp,
          afterAi.player.hp,
          afterAi.player.maxHp,
        ),
      ]);
    } else {
      await this.animateHP(
        false,
        afterAi.player.hp / afterAi.player.maxHp,
        afterAi.player.hp,
        afterAi.player.maxHp,
      );
    }

    // Check if player defeated
    if (afterAi.winner === "opponent") {
      this.setTurnIndicator(TurnPhase.BattleOver);
      await this.playDefeatAnimation(this.playerMechSprite);
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

  // --- Sound toggle button ---

  private createSoundToggle(w: number, h: number): void {
    const btnSize = 28;
    const histBtnW = Math.min(w * 0.15, 100);
    const btnX = w - histBtnW - w * 0.03 - btnSize - 8;
    const btnY = h * 0.03;

    const bg = this.add.graphics();
    const label = this.add
      .text(btnX + btnSize / 2, btnY + btnSize / 2, "", {
        fontSize: `${Math.max(14, Math.floor(w * 0.02))}px`,
      })
      .setOrigin(0.5);

    const updateVisual = () => {
      bg.clear();
      bg.fillStyle(COLORS.buttonBg);
      bg.fillRoundedRect(btnX, btnY, btnSize, btnSize, 6);
      bg.lineStyle(1, COLORS.panelBorder);
      bg.strokeRoundedRect(btnX, btnY, btnSize, btnSize, 6);
      label.setText(isMuted() ? "\uD83D\uDD07" : "\uD83D\uDD0A");
    };
    updateVisual();

    const zone = this.add
      .zone(btnX, btnY, btnSize, btnSize)
      .setOrigin(0)
      .setInteractive({ useHandCursor: true });

    zone.on("pointerdown", () => {
      resumeSound();
      setMuted(!isMuted());
      const s = loadSettings();
      s.soundEnabled = !isMuted();
      saveSettings(s);
      updateVisual();
    });
  }

  // --- Save battle record ---

  private saveBattleRecord(won: boolean): void {
    const state = this.battleManager.getState();
    const record: BattleRecord = {
      id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      timestamp: Date.now(),
      playerMechType: this.playerMech.type,
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
    if (won) playVictorySound();
    else playDefeatSound();
    this.saveBattleRecord(won);
    const state = this.battleManager.getState();
    const { width: w, height: h } = this.scale;

    this.resultOverlay = this.add.container(0, 0);

    // Tinted overlay (green for victory, red for defeat)
    const bg = this.add.graphics();
    bg.fillStyle(won ? 0x002211 : 0x220000, 0.8);
    bg.fillRect(0, 0, w, h);
    this.resultOverlay.add(bg);

    // Result icon
    const icon = this.add
      .text(w / 2, h * 0.22, won ? "\uD83C\uDFC6" : "\uD83D\uDC80", {
        fontSize: `${Math.max(40, Math.floor(w * 0.07))}px`,
      })
      .setOrigin(0.5);
    this.resultOverlay.add(icon);

    // Result title with bounce animation
    const titleText = won ? "VICTORY!" : "DEFEAT...";
    const titleColor = won ? "#00ff88" : "#ff4500";
    const title = this.add
      .text(w / 2, h * 0.33, titleText, {
        fontSize: `${Math.max(32, Math.floor(w * 0.06))}px`,
        color: titleColor,
        fontStyle: "bold",
        stroke: "#000000",
        strokeThickness: 4,
      })
      .setOrigin(0.5)
      .setScale(0);
    this.resultOverlay.add(title);

    // Subtitle
    const subtitle = this.add
      .text(
        w / 2,
        h * 0.42,
        won ? "Enemy mech destroyed!" : "Your mech was destroyed...",
        {
          fontSize: `${Math.max(14, Math.floor(w * 0.025))}px`,
          color: "#cccccc",
        },
      )
      .setOrigin(0.5);
    this.resultOverlay.add(subtitle);

    // Battle summary
    const summaryFontSize = Math.max(12, Math.floor(w * 0.02));
    const hpText = won
      ? `HP: ${state.player.hp}/${state.player.maxHp}`
      : `HP: 0/${state.player.maxHp}`;
    const summary = this.add
      .text(w / 2, h * 0.48, `Turns: ${state.turnCount}  |  ${hpText}`, {
        fontSize: `${summaryFontSize}px`,
        color: "#aaaaaa",
      })
      .setOrigin(0.5);
    this.resultOverlay.add(summary);

    // Strategy used
    const strategyLabel = this.mechPrompt.trim()
      ? this.mechPrompt.length > 50
        ? `Strategy: ${this.mechPrompt.slice(0, 47)}...`
        : `Strategy: ${this.mechPrompt}`
      : "No strategy used";
    const strategyColor = this.mechPrompt.trim() ? COLORS.accent : "#666666";
    const strategyText = this.add
      .text(w / 2, h * 0.52, strategyLabel, {
        fontSize: `${Math.max(10, Math.floor(w * 0.015))}px`,
        color: strategyColor,
        wordWrap: { width: w * 0.6 },
      })
      .setOrigin(0.5);
    this.resultOverlay.add(strategyText);

    // Play Again button
    const btnW = Math.min(w * 0.3, 200);
    const btnH = 44;
    const btnX = w / 2 - btnW / 2;
    const btnY = h * 0.58;

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

    // History button
    const histBtnY = btnY + btnH + 12;
    const histBg = this.add.graphics();
    histBg.fillStyle(COLORS.buttonBg, 1);
    histBg.fillRoundedRect(btnX, histBtnY, btnW, btnH, 8);
    histBg.lineStyle(1, COLORS.panelBorder);
    histBg.strokeRoundedRect(btnX, histBtnY, btnW, btnH, 8);
    this.resultOverlay.add(histBg);

    const histText = this.add
      .text(w / 2, histBtnY + btnH / 2, "History", {
        fontSize: `${Math.max(14, Math.floor(w * 0.022))}px`,
        color: "#cccccc",
      })
      .setOrigin(0.5);
    this.resultOverlay.add(histText);

    const histZone = this.add
      .zone(btnX, histBtnY, btnW, btnH)
      .setOrigin(0)
      .setInteractive({ useHandCursor: true });

    histZone.on("pointerover", () => {
      histBg.clear();
      histBg.fillStyle(COLORS.buttonHover, 1);
      histBg.fillRoundedRect(btnX, histBtnY, btnW, btnH, 8);
      histBg.lineStyle(1, COLORS.panelBorder);
      histBg.strokeRoundedRect(btnX, histBtnY, btnW, btnH, 8);
    });

    histZone.on("pointerout", () => {
      histBg.clear();
      histBg.fillStyle(COLORS.buttonBg, 1);
      histBg.fillRoundedRect(btnX, histBtnY, btnW, btnH, 8);
      histBg.lineStyle(1, COLORS.panelBorder);
      histBg.strokeRoundedRect(btnX, histBtnY, btnW, btnH, 8);
    });

    histZone.on("pointerdown", () => {
      this.scene.start("HistoryScene");
    });
    this.resultOverlay.add(histZone);

    // Fade in overlay, then bounce title
    this.resultOverlay.setAlpha(0);
    this.tweens.add({
      targets: this.resultOverlay,
      alpha: 1,
      duration: 300,
      ease: "Power2",
      onComplete: () => {
        this.tweens.add({
          targets: title,
          scaleX: 1,
          scaleY: 1,
          duration: 600,
          ease: "Bounce.easeOut",
        });
      },
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
    this.opponentPortraitState = "normal";
    this.playerPortraitState = "normal";

    this.battleManager.initBattle(
      JSON.parse(JSON.stringify(this.playerMech)),
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
