/**
 * BattleScene - Thin orchestrator for the battle screen.
 * Delegates UI creation to modules under ./battle/
 */

import Phaser from "phaser";
import { callBattleAPI } from "../api/battleClient";
import { OPPONENT_MECH, PLAYER_MECH } from "../data/mechs";
import { type Mech, TurnPhase } from "../types/game";
import { BattleManager } from "../utils/BattleManager";
import type { MechSprite, PortraitState } from "../utils/MechGraphics";
import {
  createMechSprite,
  playAttackProjectile,
  playHitReaction,
  preloadMechAssets,
  showDamageNumber,
  showEffectivenessLabel,
  showSkillName,
} from "../utils/MechGraphics";
import { LOG_MAX_LINES } from "../utils/logColors";
import { isOnline } from "../utils/pwa";
import {
  initSound,
  playAttackSound,
  playClickSound,
  playHitSound,
  resumeSound,
  setMuted,
} from "../utils/soundManager";
import { loadMechPrompt, loadSettings } from "../utils/storage";

// Battle sub-modules
import {
  playAttackAnimation,
  playDamageFlash,
  playDefeatAnimation,
  showDefenseLabel,
} from "./battle/BattleAnims";
import {
  type PromptState,
  cleanupPWABanners,
  createPromptUI,
  initPWABanners,
} from "./battle/BattlePrompt";
import { showResultScreen } from "./battle/BattleResult";
import { createHistoryButton, createSoundToggle } from "./battle/BattleResult";
import {
  SKILL_COLORS,
  createSkillButtons,
  setButtonsEnabled,
} from "./battle/BattleSkills";
import {
  addLogMessage,
  animateHP,
  createBackground,
  createBattleLog,
  createOpponentArea,
  createPlayerArea,
  createSpinner,
  createTurnIndicator,
  drawHPBar,
  hideSpinner,
  setTurnIndicator,
  showSpinner,
  updatePortraitState,
} from "./battle/BattleUIPanel";

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

  // Prompt / PWA state (shared with BattlePrompt module)
  private promptState: PromptState = {
    mechPrompt: "",
  };

  // Selected player mech (set via init data or default)
  private playerMech: Mech = PLAYER_MECH;

  constructor() {
    super({ key: "BattleScene" });
    console.log("[BattleScene] constructor called");
  }

  init(data?: { selectedMech?: Mech }): void {
    this.playerMech = data?.selectedMech ?? PLAYER_MECH;
  }

  preload(): void {
    console.log("[BattleScene] preload() start");

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
    this.promptState.mechPrompt = loadMechPrompt();

    // Init sound
    initSound();
    const settings = loadSettings();
    setMuted(!settings.soundEnabled);
    this.input.once("pointerdown", () => resumeSound());

    const { width, height } = this.scale;
    this.buildUI(width, height);
    createPromptUI(this.promptState, (msg) => this.addLogMessage(msg));
    initPWABanners(this.promptState);

    // Sync initial log
    const state = this.battleManager.getState();
    for (const msg of state.log) {
      this.addLogMessage(msg);
    }

    // Show strategy status in log
    if (this.promptState.mechPrompt.trim()) {
      const summary =
        this.promptState.mechPrompt.length > 40
          ? `${this.promptState.mechPrompt.slice(0, 37)}...`
          : this.promptState.mechPrompt;
      this.addLogMessage(`[EFF]Strategy: ${summary}`);
    } else {
      this.addLogMessage("[TURN]Tip: Save a strategy to guide your AI!");
    }

    setTurnIndicator(this.turnIndicator, state.phase);

    this.scale.on("resize", this.handleResize, this);
  }

  private buildUI(w: number, h: number): void {
    this.skillButtons = [];
    this.skillHitZones = [];

    // Background
    createBackground(this, w, h);

    // Opponent mech sprite + info panel
    const spriteX1 = w * 0.65;
    const spriteY1 = 150;
    const spriteW1 = Math.min(w * 0.4, 240);
    const spriteH1 = Math.min(h * 0.44, 240);
    this.opponentMechSprite = createMechSprite(
      this,
      OPPONENT_MECH.type,
      spriteX1,
      spriteY1,
      spriteW1,
      spriteH1,
    );

    const oppResult = createOpponentArea(
      this,
      w,
      h,
      OPPONENT_MECH,
      this.opponentPortraitState,
    );
    this.opponentHPBar = oppResult.opponentHPBar;
    this.opponentHPText = oppResult.opponentHPText;
    this.opponentBarGeom = oppResult.opponentBarGeom;
    this.opponentPortrait = oppResult.opponentPortrait;

    // Player mech sprite + info panel
    const spriteX2 = w * 0.25;
    const spriteY2 = 450;
    const spriteW2 = Math.min(w * 0.44, 280);
    const spriteH2 = Math.min(h * 0.5, 280);
    this.playerMechSprite = createMechSprite(
      this,
      this.playerMech.type,
      spriteX2,
      spriteY2,
      spriteW2,
      spriteH2,
    );

    const plrResult = createPlayerArea(
      this,
      w,
      h,
      this.playerMech,
      this.playerPortraitState,
      this.displayedPlayerRatio,
    );
    this.playerHPBar = plrResult.playerHPBar;
    this.playerHPText = plrResult.playerHPText;
    this.playerBarGeom = plrResult.playerBarGeom;
    this.playerPortrait = plrResult.playerPortrait;

    // Turn indicator
    this.turnIndicator = createTurnIndicator(this, w, h);

    // Battle log
    const logResult = createBattleLog(this, w, h);
    this.battleLogText = logResult.battleLogText;
    this.logContainer = logResult.logContainer;
    this.logFontSize = logResult.logFontSize;
    this.logLineWidth = logResult.logLineWidth;

    // Skill buttons
    const state = this.battleManager.getState();
    const skillResult = createSkillButtons(
      this,
      state.player.skills,
      w,
      h,
      (i) => this.onSkillSelected(i),
    );
    this.skillButtons = skillResult.skillButtons;
    this.skillHitZones = skillResult.skillHitZones;

    // Spinner
    this.spinnerText = createSpinner(this, w, h);

    // History & sound buttons
    createHistoryButton(this, w, h, () => this.cleanupForSceneChange());
    createSoundToggle(this, w, h);
  }

  private addLogMessage(msg: string): void {
    this.logLineTexts = addLogMessage(
      this,
      msg,
      this.logMessages,
      this.logLineColors,
      this.logLineTexts,
      this.logContainer,
      this.logFontSize,
      this.logLineWidth,
    );
  }

  private animateHPBar(
    isOpponent: boolean,
    targetRatio: number,
    newHp: number,
    maxHp: number,
  ): Promise<void> {
    return animateHP(
      this,
      isOpponent,
      targetRatio,
      newHp,
      maxHp,
      this.displayedOpponentRatio,
      this.displayedPlayerRatio,
      this.opponentHPBar,
      this.playerHPBar,
      this.opponentHPText,
      this.playerHPText,
      this.opponentBarGeom,
      this.playerBarGeom,
      (isOpp, ratio) => {
        if (isOpp) {
          this.displayedOpponentRatio = ratio;
        } else {
          this.displayedPlayerRatio = ratio;
        }
        const result = updatePortraitState(
          this,
          isOpp,
          ratio,
          ratio <= 0,
          this.opponentPortraitState,
          this.playerPortraitState,
          this.opponentPortrait,
          this.playerPortrait,
          this.playerMech.type,
        );
        this.opponentPortraitState = result.opponentPortraitState;
        this.playerPortraitState = result.playerPortraitState;
      },
    );
  }

  // --- Turn execution ---

  private async onSkillSelected(index: number): Promise<void> {
    if (this.isAnimating) return;
    const state = this.battleManager.getState();
    if (state.phase !== TurnPhase.PlayerTurn) return;
    playClickSound();

    this.isAnimating = true;
    setButtonsEnabled(false, this.skillHitZones, this.skillButtons);

    const prevOpponentHp = state.opponent.hp;
    const prevLogLen = state.log.length;

    // --- Phase 1: Player attack ---
    const afterPlayer = this.battleManager.executePlayerAttack(index);
    const playerLogs = afterPlayer.log.slice(prevLogLen);

    const playerSkill = this.playerMech.skills[index];

    setTurnIndicator(this.turnIndicator, TurnPhase.PlayerTurn);
    for (const msg of playerLogs) {
      this.addLogMessage(msg);
    }

    await showSkillName(
      this,
      playerSkill.name,
      SKILL_COLORS[playerSkill.type] ?? "#00ff88",
    );
    await playAttackAnimation(
      this,
      this.playerMechSprite,
      this.opponentMechSprite,
      true,
    );
    playAttackSound(playerSkill.type as "kinetic" | "beam" | "emp" | "defense");
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
        playDamageFlash(
          this,
          this.playerMechSprite,
          this.opponentMechSprite,
          true,
        ),
        this.animateHPBar(
          true,
          afterPlayer.opponent.hp / afterPlayer.opponent.maxHp,
          afterPlayer.opponent.hp,
          afterPlayer.opponent.maxHp,
        ),
      ]);
    } else {
      showDefenseLabel(this, this.playerMechSprite);
      await this.animateHPBar(
        true,
        afterPlayer.opponent.hp / afterPlayer.opponent.maxHp,
        afterPlayer.opponent.hp,
        afterPlayer.opponent.maxHp,
      );
    }

    // Check if opponent defeated
    if (afterPlayer.winner === "player") {
      setTurnIndicator(this.turnIndicator, TurnPhase.BattleOver);
      await playDefeatAnimation(this, this.opponentMechSprite);
      this.showResult(true);
      return;
    }

    // --- Phase 2: AI thinking + API call ---
    setTurnIndicator(this.turnIndicator, TurnPhase.AiThinking);
    this.spinnerTimer = showSpinner(
      this,
      this.spinnerText,
      this.promptState.mechPrompt,
    );

    let aiSkillIndex: number;
    let aiReasoning: string | undefined;
    if (this.promptState.mechPrompt.trim() && isOnline()) {
      const apiResult = await callBattleAPI(
        this.promptState.mechPrompt,
        this.battleManager.getState(),
      );
      if (apiResult) {
        aiSkillIndex = apiResult.move;
        aiReasoning = apiResult.reasoning;
      } else {
        aiSkillIndex = this.battleManager.getRandomAiSkill();
        this.addLogMessage("[TURN]Strategy offline \u2014 using random AI");
      }
    } else {
      aiSkillIndex = this.battleManager.getRandomAiSkill();
    }

    hideSpinner(this.spinnerText, this.spinnerTimer);
    this.spinnerTimer = undefined;

    // --- Phase 3: AI attack ---
    const prevPlayerHp = afterPlayer.player.hp;
    const aiLogLen = this.battleManager.getState().log.length;
    const afterAi = this.battleManager.executeAiAttack(aiSkillIndex);
    const aiLogs = afterAi.log.slice(aiLogLen);

    const aiSkill = OPPONENT_MECH.skills[aiSkillIndex];

    setTurnIndicator(this.turnIndicator, TurnPhase.AiTurn);
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
      SKILL_COLORS[aiSkill.type] ?? "#00ff88",
    );
    await playAttackAnimation(
      this,
      this.playerMechSprite,
      this.opponentMechSprite,
      false,
    );
    playAttackSound(aiSkill.type as "kinetic" | "beam" | "emp" | "defense");
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
        playDamageFlash(
          this,
          this.playerMechSprite,
          this.opponentMechSprite,
          false,
        ),
        this.animateHPBar(
          false,
          afterAi.player.hp / afterAi.player.maxHp,
          afterAi.player.hp,
          afterAi.player.maxHp,
        ),
      ]);
    } else {
      showDefenseLabel(this, this.opponentMechSprite);
      await this.animateHPBar(
        false,
        afterAi.player.hp / afterAi.player.maxHp,
        afterAi.player.hp,
        afterAi.player.maxHp,
      );
    }

    // Check if player defeated
    if (afterAi.winner === "opponent") {
      setTurnIndicator(this.turnIndicator, TurnPhase.BattleOver);
      await playDefeatAnimation(this, this.playerMechSprite);
      this.showResult(false);
      return;
    }

    // --- Back to player turn ---
    setTurnIndicator(this.turnIndicator, TurnPhase.PlayerTurn);
    setButtonsEnabled(true, this.skillHitZones, this.skillButtons);
    this.isAnimating = false;
  }

  private showResult(won: boolean): void {
    this.resultOverlay = showResultScreen(
      this,
      won,
      this.battleManager,
      this.playerMech,
      this.promptState.mechPrompt,
      () => this.restartBattle(),
      () => this.cleanupForSceneChange(),
    );
  }

  private cleanupForSceneChange(): void {
    this.scale.off("resize", this.handleResize, this);
    if (this.promptState.promptContainer) {
      this.promptState.promptContainer.remove();
      this.promptState.promptContainer = undefined;
    }
    cleanupPWABanners(this.promptState);
  }

  private restartBattle(): void {
    hideSpinner(this.spinnerText, this.spinnerTimer);
    this.spinnerTimer = undefined;
    if (this.resultOverlay) {
      this.resultOverlay.destroy();
      this.resultOverlay = undefined;
    }
    this.children.removeAll(true);
    this.logMessages = [];
    this.logLineTexts = [];
    this.logLineColors = [];
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
    setTurnIndicator(this.turnIndicator, state.phase);
  }

  private handleResize(gameSize: Phaser.Structs.Size): void {
    const { width, height } = gameSize;
    this.cameras.main.setViewport(0, 0, width, height);

    hideSpinner(this.spinnerText, this.spinnerTimer);
    this.spinnerTimer = undefined;
    this.children.removeAll(true);
    this.skillButtons = [];
    this.skillHitZones = [];
    const savedLog = [...this.logMessages];
    this.logMessages = [];
    this.logLineTexts = [];
    this.logLineColors = [];

    this.buildUI(width, height);

    // Restore state
    const state = this.battleManager.getState();
    this.displayedOpponentRatio = state.opponent.hp / state.opponent.maxHp;
    this.displayedPlayerRatio = state.player.hp / state.player.maxHp;

    drawHPBar(
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

    drawHPBar(
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

    setTurnIndicator(this.turnIndicator, state.phase);

    if (state.phase === TurnPhase.BattleOver) {
      this.showResult(state.winner === "player");
    } else if (this.isAnimating) {
      setButtonsEnabled(false, this.skillHitZones, this.skillButtons);
    }
  }
}
