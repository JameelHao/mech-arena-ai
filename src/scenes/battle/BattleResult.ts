/**
 * BattleResult - History button, sound toggle, save record, result screen, defeat animation
 */

import type Phaser from "phaser";
import { OPPONENT_MECH } from "../../data/mechs";
import type { Mech } from "../../types/game";
import type { BattleRecord } from "../../types/storage";
import type { BattleManager } from "../../utils/BattleManager";
import { saveBattleHistory } from "../../utils/storage";
import {
  isMuted,
  loadSettings,
  playDefeatSound,
  playVictorySound,
  resumeSound,
  saveSettings,
  setMuted,
} from "./soundImports";

// Re-export sound imports from a single place to keep the module self-contained
// (actual imports come from soundManager and storage)

const COLORS = {
  accent: "#00ff88",
  accentHex: 0x00ff88,
  panelBg: 0x2a2a2a,
  panelBorder: 0x444444,
  buttonBg: 0x333333,
  buttonHover: 0x444444,
} as const;

export function createHistoryButton(
  scene: Phaser.Scene,
  w: number,
  h: number,
  onCleanup: () => void,
): void {
  const btnW = Math.min(w * 0.15, 100);
  const btnH = 28;
  const btnX = w - btnW - w * 0.03;
  const btnY = h * 0.03;

  const bg = scene.add.graphics();
  bg.fillStyle(COLORS.buttonBg);
  bg.fillRoundedRect(btnX, btnY, btnW, btnH, 6);
  bg.lineStyle(1, COLORS.panelBorder);
  bg.strokeRoundedRect(btnX, btnY, btnW, btnH, 6);

  scene.add
    .text(btnX + btnW / 2, btnY + btnH / 2, "History", {
      fontSize: `${Math.max(11, Math.floor(w * 0.016))}px`,
      color: COLORS.accent,
      fontStyle: "bold",
    })
    .setOrigin(0.5);

  const zone = scene.add
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
    onCleanup();
    scene.scene.start("HistoryScene");
  });
}

export function createSoundToggle(
  scene: Phaser.Scene,
  w: number,
  h: number,
): void {
  const btnSize = 28;
  const histBtnW = Math.min(w * 0.15, 100);
  const btnX = w - histBtnW - w * 0.03 - btnSize - 8;
  const btnY = h * 0.03;

  const bg = scene.add.graphics();
  const label = scene.add
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

  const zone = scene.add
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

export function saveBattleRecord(
  battleManager: BattleManager,
  playerMech: Mech,
  mechPrompt: string,
  won: boolean,
): void {
  const state = battleManager.getState();
  const record: BattleRecord = {
    id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    timestamp: Date.now(),
    playerMechType: playerMech.type,
    opponentMechType: OPPONENT_MECH.type,
    result: won ? "win" : "loss",
    turns: state.turnCount,
    playerHpLeft: state.player.hp,
    opponentHpLeft: state.opponent.hp,
    prompt: mechPrompt.trim() || undefined,
    battleLog: state.log.slice(0, 100),
  };
  saveBattleHistory(record);
}

export function showResultScreen(
  scene: Phaser.Scene,
  won: boolean,
  battleManager: BattleManager,
  playerMech: Mech,
  mechPrompt: string,
  onRestart: () => void,
  onCleanup: () => void,
): Phaser.GameObjects.Container {
  if (won) playVictorySound();
  else playDefeatSound();
  saveBattleRecord(battleManager, playerMech, mechPrompt, won);
  const state = battleManager.getState();
  const { width: w, height: h } = scene.scale;

  const resultOverlay = scene.add.container(0, 0);

  const bg = scene.add.graphics();
  bg.fillStyle(won ? 0x002211 : 0x220000, 0.8);
  bg.fillRect(0, 0, w, h);
  resultOverlay.add(bg);

  const icon = scene.add
    .text(w / 2, h * 0.22, won ? "\uD83C\uDFC6" : "\uD83D\uDC80", {
      fontSize: `${Math.max(40, Math.floor(w * 0.07))}px`,
    })
    .setOrigin(0.5);
  resultOverlay.add(icon);

  const titleText = won ? "VICTORY!" : "DEFEAT...";
  const titleColor = won ? "#00ff88" : "#ff4500";
  const title = scene.add
    .text(w / 2, h * 0.33, titleText, {
      fontSize: `${Math.max(32, Math.floor(w * 0.06))}px`,
      color: titleColor,
      fontStyle: "bold",
      stroke: "#000000",
      strokeThickness: 4,
    })
    .setOrigin(0.5)
    .setScale(0);
  resultOverlay.add(title);

  const subtitle = scene.add
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
  resultOverlay.add(subtitle);

  const summaryFontSize = Math.max(12, Math.floor(w * 0.02));
  const hpText = won
    ? `HP: ${state.player.hp}/${state.player.maxHp}`
    : `HP: 0/${state.player.maxHp}`;
  const summary = scene.add
    .text(w / 2, h * 0.48, `Turns: ${state.turnCount}  |  ${hpText}`, {
      fontSize: `${summaryFontSize}px`,
      color: "#aaaaaa",
    })
    .setOrigin(0.5);
  resultOverlay.add(summary);

  const strategyLabel = mechPrompt.trim()
    ? mechPrompt.length > 50
      ? `Strategy: ${mechPrompt.slice(0, 47)}...`
      : `Strategy: ${mechPrompt}`
    : "No strategy used";
  const strategyColor = mechPrompt.trim() ? COLORS.accent : "#666666";
  const strategyText = scene.add
    .text(w / 2, h * 0.52, strategyLabel, {
      fontSize: `${Math.max(10, Math.floor(w * 0.015))}px`,
      color: strategyColor,
      wordWrap: { width: w * 0.6 },
    })
    .setOrigin(0.5);
  resultOverlay.add(strategyText);

  // Play Again button
  const btnW = Math.min(w * 0.3, 200);
  const btnH = 44;
  const btnX = w / 2 - btnW / 2;
  const btnY = h * 0.58;

  const btnBg = scene.add.graphics();
  btnBg.fillStyle(COLORS.accentHex, 1);
  btnBg.fillRoundedRect(btnX, btnY, btnW, btnH, 8);
  resultOverlay.add(btnBg);

  const btnText = scene.add
    .text(w / 2, btnY + btnH / 2, "Play Again", {
      fontSize: `${Math.max(16, Math.floor(w * 0.025))}px`,
      color: "#000000",
      fontStyle: "bold",
    })
    .setOrigin(0.5);
  resultOverlay.add(btnText);

  const btnZone = scene.add
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
    onRestart();
  });
  resultOverlay.add(btnZone);

  // History button
  const histBtnY = btnY + btnH + 12;
  const histBg = scene.add.graphics();
  histBg.fillStyle(COLORS.buttonBg, 1);
  histBg.fillRoundedRect(btnX, histBtnY, btnW, btnH, 8);
  histBg.lineStyle(1, COLORS.panelBorder);
  histBg.strokeRoundedRect(btnX, histBtnY, btnW, btnH, 8);
  resultOverlay.add(histBg);

  const histText = scene.add
    .text(w / 2, histBtnY + btnH / 2, "History", {
      fontSize: `${Math.max(14, Math.floor(w * 0.022))}px`,
      color: "#cccccc",
    })
    .setOrigin(0.5);
  resultOverlay.add(histText);

  const histZone = scene.add
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
    scene.scene.start("HistoryScene");
  });
  resultOverlay.add(histZone);

  // Back to Lobby button
  const lobbyBtnY = histBtnY + btnH + 8;
  const lobbyH = 32;
  const lobbyText = scene.add
    .text(w / 2, lobbyBtnY + lobbyH / 2, "Back to Lobby", {
      fontSize: `${Math.max(11, Math.floor(w * 0.018))}px`,
      color: "#888888",
    })
    .setOrigin(0.5);
  resultOverlay.add(lobbyText);

  const lobbyZone = scene.add
    .zone(btnX, lobbyBtnY, btnW, lobbyH)
    .setOrigin(0)
    .setInteractive({ useHandCursor: true });

  lobbyZone.on("pointerover", () => {
    lobbyText.setColor(COLORS.accent);
  });
  lobbyZone.on("pointerout", () => {
    lobbyText.setColor("#888888");
  });
  lobbyZone.on("pointerdown", () => {
    onCleanup();
    scene.scene.start("LobbyScene");
  });
  resultOverlay.add(lobbyZone);

  // Fade in overlay, then bounce title
  resultOverlay.setAlpha(0);
  scene.tweens.add({
    targets: resultOverlay,
    alpha: 1,
    duration: 300,
    ease: "Power2",
    onComplete: () => {
      scene.tweens.add({
        targets: title,
        scaleX: 1,
        scaleY: 1,
        duration: 600,
        ease: "Bounce.easeOut",
      });
    },
  });

  return resultOverlay;
}
