/**
 * BattleUIPanel - HP bars, turn indicator, battle log rendering, spinner
 */

import Phaser from "phaser";
import { ASSET_REGISTRY } from "../../assets";
import { OPPONENT_MECH } from "../../data/mechs";
import { skinTextureKey } from "../../data/skinLoader";
import type { MechType, TurnPhase } from "../../types/game";
import { TurnPhase as TP } from "../../types/game";
import {
  PORTRAIT_TEXTURE_KEYS,
  type PortraitState,
  getPortraitState,
} from "../../utils/MechGraphics";
import {
  BATTLE_BG_TINT,
  EDGE_OVERLAY_ALPHA,
  GROUND_TINT,
  computeBackgroundLayout,
} from "../../utils/backgroundConfig";
import { LOG_MAX_LINES, parseLogMessage } from "../../utils/logColors";
import { loadCommanderName } from "../../utils/storage";

const COLORS = {
  text: "#ffffff",
  accent: "#00ff88",
  accentHex: 0x00ff88,
  hpGreen: 0x00ff88,
  hpYellow: 0xffd700,
  hpRed: 0xff4500,
  panelBg: 0x2a2a2a,
  panelBorder: 0x444444,
} as const;

const SPINNER_FRAMES = ["⠋", "⠙", "⠹", "⠸", "⠼", "⠴", "⠦", "⠧", "⠇", "⠏"];
const HP_TWEEN_DURATION = 500;

export interface UIState {
  // HP display
  opponentHPBar: Phaser.GameObjects.Graphics;
  playerHPBar: Phaser.GameObjects.Graphics;
  opponentHPText: Phaser.GameObjects.Text;
  playerHPText: Phaser.GameObjects.Text;
  displayedOpponentRatio: number;
  displayedPlayerRatio: number;
  opponentBarGeom: { x: number; y: number; w: number; h: number };
  playerBarGeom: { x: number; y: number; w: number; h: number };

  // Portrait
  opponentPortrait?: Phaser.GameObjects.Image;
  playerPortrait?: Phaser.GameObjects.Image;
  opponentPortraitState: PortraitState;
  playerPortraitState: PortraitState;

  // Battle log
  battleLogText: Phaser.GameObjects.Text;
  logMessages: string[];
  logLineTexts: Phaser.GameObjects.Text[];
  logLineColors: string[];
  logContainer: Phaser.GameObjects.Container;
  logFontSize: number;
  logLineWidth: number;

  // Turn indicator
  turnIndicator: Phaser.GameObjects.Text;

  // Spinner
  spinnerText: Phaser.GameObjects.Text;
  spinnerTimer?: Phaser.Time.TimerEvent;

  // Background
  bgImage: Phaser.GameObjects.Image;
  groundImage: Phaser.GameObjects.TileSprite;
  transitionGradient: Phaser.GameObjects.Graphics;
  groundEdgeOverlay: Phaser.GameObjects.Graphics;
}

export function createBackground(
  scene: Phaser.Scene,
  w: number,
  h: number,
): {
  bgImage: Phaser.GameObjects.Image;
  groundImage: Phaser.GameObjects.TileSprite;
  transitionGradient: Phaser.GameObjects.Graphics;
  groundEdgeOverlay: Phaser.GameObjects.Graphics;
} {
  const layout = computeBackgroundLayout(w, h);

  const bgImage = scene.add.image(
    layout.bgX,
    layout.bgY,
    ASSET_REGISTRY.backgrounds.city.key,
  );
  bgImage.setDisplaySize(layout.bgW, layout.bgH);
  bgImage.setOrigin(0.5);
  bgImage.setTint(BATTLE_BG_TINT);

  const transitionGradient = scene.add.graphics();
  const steps = 16;
  for (let i = 0; i < steps; i++) {
    const alpha = i / steps;
    const y = layout.transitionY + (layout.transitionH / steps) * i;
    const h = layout.transitionH / steps + 1;
    transitionGradient.fillStyle(0x1a1a1a, alpha * 0.5);
    transitionGradient.fillRect(0, y, layout.groundW, h);
  }

  const groundImage = scene.add.tileSprite(
    layout.groundX,
    layout.groundY,
    layout.groundW,
    layout.groundH,
    ASSET_REGISTRY.backgrounds.ground.key,
  );
  groundImage.setOrigin(0.5);
  groundImage.setTint(GROUND_TINT);

  const groundTopY = layout.groundY - layout.groundH / 2;
  const edgeH = Math.min(20, layout.groundH * 0.25);
  const groundEdgeOverlay = scene.add.graphics();
  const edgeSteps = 10;
  for (let i = 0; i < edgeSteps; i++) {
    const alpha = EDGE_OVERLAY_ALPHA * (1 - i / edgeSteps);
    const y = groundTopY + (edgeH / edgeSteps) * i;
    const h = edgeH / edgeSteps + 1;
    groundEdgeOverlay.fillStyle(0x1a1a1a, alpha);
    groundEdgeOverlay.fillRect(0, y, layout.groundW, h);
  }

  return { bgImage, groundImage, transitionGradient, groundEdgeOverlay };
}

export function drawPanel(
  scene: Phaser.Scene,
  x: number,
  y: number,
  w: number,
  h: number,
): void {
  const panel = scene.add.graphics();
  panel.fillStyle(COLORS.panelBg, 0.9);
  panel.fillRoundedRect(x, y, w, h, 8);
  panel.lineStyle(1, COLORS.panelBorder);
  panel.strokeRoundedRect(x, y, w, h, 8);
}

export function drawHPBar(
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

export function addPortrait(
  scene: Phaser.Scene,
  mechType: MechType,
  state: PortraitState,
  x: number,
  y: number,
  size: number,
  skinId?: string,
): Phaser.GameObjects.Image | undefined {
  // Try skin portrait first
  if (skinId) {
    const skinKey = skinTextureKey(skinId, `portrait-${state}`);
    if (scene.textures.exists(skinKey)) {
      const img = scene.add.image(x, y, skinKey);
      img.setDisplaySize(size, size);
      return img;
    }
  }
  // Fallback to type-based portrait
  const states = PORTRAIT_TEXTURE_KEYS[mechType];
  if (!states) return undefined;
  const entry = states[state];
  if (!entry || !scene.textures.exists(entry.key)) return undefined;

  const img = scene.add.image(x, y, entry.key);
  img.setDisplaySize(size, size);
  return img;
}

export function updatePortraitState(
  scene: Phaser.Scene,
  isOpponent: boolean,
  hpRatio: number,
  isDefeated: boolean,
  opponentPortraitState: PortraitState,
  playerPortraitState: PortraitState,
  opponentPortrait: Phaser.GameObjects.Image | undefined,
  playerPortrait: Phaser.GameObjects.Image | undefined,
  playerMechType: MechType,
  playerSkinId?: string,
): {
  opponentPortraitState: PortraitState;
  playerPortraitState: PortraitState;
} {
  const newState = getPortraitState(hpRatio, isDefeated);
  const currentState = isOpponent ? opponentPortraitState : playerPortraitState;
  const portrait = isOpponent ? opponentPortrait : playerPortrait;

  if (newState === currentState || !portrait) {
    return { opponentPortraitState, playerPortraitState };
  }

  // Try skin portrait for player side
  if (!isOpponent && playerSkinId) {
    const skinKey = skinTextureKey(playerSkinId, `portrait-${newState}`);
    if (scene.textures.exists(skinKey)) {
      portrait.setTexture(skinKey);
      scene.tweens.add({
        targets: portrait,
        scaleX: portrait.scaleX * 0.9,
        scaleY: portrait.scaleY * 0.9,
        duration: 100,
        yoyo: true,
        ease: "Power2",
      });
      return {
        opponentPortraitState,
        playerPortraitState: newState,
      };
    }
  }

  // Fallback to type-based portrait
  const mechType = isOpponent ? OPPONENT_MECH.type : playerMechType;
  const states = PORTRAIT_TEXTURE_KEYS[mechType];
  if (!states) return { opponentPortraitState, playerPortraitState };
  const entry = states[newState];
  if (!entry || !scene.textures.exists(entry.key)) {
    return { opponentPortraitState, playerPortraitState };
  }

  const updatedOpponent = isOpponent ? newState : opponentPortraitState;
  const updatedPlayer = isOpponent ? playerPortraitState : newState;

  portrait.setTexture(entry.key);
  scene.tweens.add({
    targets: portrait,
    scaleX: portrait.scaleX * 0.9,
    scaleY: portrait.scaleY * 0.9,
    duration: 100,
    yoyo: true,
    ease: "Power2",
  });

  return {
    opponentPortraitState: updatedOpponent,
    playerPortraitState: updatedPlayer,
  };
}

export function createOpponentArea(
  scene: Phaser.Scene,
  w: number,
  h: number,
  opponentMech: { type: MechType; codename?: string; name: string },
  opponentPortraitState: PortraitState,
): {
  opponentHPBar: Phaser.GameObjects.Graphics;
  opponentHPText: Phaser.GameObjects.Text;
  opponentBarGeom: { x: number; y: number; w: number; h: number };
  opponentPortrait?: Phaser.GameObjects.Image;
} {
  const panelX = w * 0.03;
  const panelY = h * 0.05;
  const panelW = w * 0.42;
  const panelH = h * 0.12;

  drawPanel(scene, panelX, panelY, panelW, panelH);

  const portraitSize = Math.max(32, Math.floor(panelH * 0.8));
  const portraitX = panelX + 6 + portraitSize / 2;
  const portraitY = panelY + panelH / 2;
  const showPortrait = w >= 400;

  let opponentPortrait: Phaser.GameObjects.Image | undefined;
  if (showPortrait) {
    opponentPortrait = addPortrait(
      scene,
      opponentMech.type,
      opponentPortraitState,
      portraitX,
      portraitY,
      portraitSize,
    );
  }

  const textOffsetX = showPortrait ? portraitSize + 12 : 10;

  scene.add
    .text(
      panelX + textOffsetX,
      panelY + 6,
      `${opponentMech.codename ?? opponentMech.name}  Lv.5`,
      {
        fontSize: `${Math.max(11, Math.floor(w * 0.018))}px`,
        color: COLORS.text,
        fontStyle: "bold",
      },
    )
    .setOrigin(0, 0);

  const barX = panelX + textOffsetX + 24;
  const barY = panelY + panelH * 0.5 - Math.max(8, panelH * 0.2) / 2;
  const barW = panelW - textOffsetX - 10 - 24;
  const barH = Math.max(8, panelH * 0.2);

  const opponentBarGeom = { x: barX, y: barY, w: barW, h: barH };

  scene.add
    .text(panelX + textOffsetX, panelY + panelH * 0.5 - 2, "HP", {
      fontSize: `${Math.max(10, Math.floor(w * 0.014))}px`,
      color: COLORS.accent,
      fontStyle: "bold",
    })
    .setOrigin(0, 0.5);

  const opponentHPBar = scene.add.graphics();
  drawHPBar(opponentHPBar, barX, barY, barW, barH, 1);

  const opponentHPText = scene.add
    .text(panelX + panelW - 10, barY + barH + 2, "100 / 100", {
      fontSize: `${Math.max(9, Math.floor(w * 0.013))}px`,
      color: "#aaaaaa",
    })
    .setOrigin(1, 0);

  return { opponentHPBar, opponentHPText, opponentBarGeom, opponentPortrait };
}

export function createPlayerArea(
  scene: Phaser.Scene,
  w: number,
  h: number,
  playerMech: { type: MechType; codename?: string; name: string },
  playerPortraitState: PortraitState,
  displayedPlayerRatio: number,
  skinId?: string,
): {
  playerHPBar: Phaser.GameObjects.Graphics;
  playerHPText: Phaser.GameObjects.Text;
  playerBarGeom: { x: number; y: number; w: number; h: number };
  playerPortrait?: Phaser.GameObjects.Image;
} {
  const panelW = w * 0.45;
  const panelH = h * 0.12;
  const panelX = w * 0.53;
  const panelY = h * 0.5;

  drawPanel(scene, panelX, panelY, panelW, panelH);

  const portraitSize = Math.max(32, Math.floor(panelH * 0.8));
  const showPortrait = w >= 400;
  const portraitRightPad = showPortrait ? portraitSize + 12 : 0;

  let playerPortrait: Phaser.GameObjects.Image | undefined;
  if (showPortrait) {
    const portraitX = panelX + panelW - 6 - portraitSize / 2;
    const portraitY = panelY + panelH / 2;
    playerPortrait = addPortrait(
      scene,
      playerMech.type,
      playerPortraitState,
      portraitX,
      portraitY,
      portraitSize,
      skinId,
    );
  }

  scene.add
    .text(
      panelX + 10,
      panelY + 6,
      `${loadCommanderName()} — ${playerMech.codename ?? playerMech.name}`,
      {
        fontSize: `${Math.max(11, Math.floor(w * 0.018))}px`,
        color: COLORS.text,
        fontStyle: "bold",
      },
    )
    .setOrigin(0, 0);

  const barX = panelX + 10 + 24;
  const barY = panelY + panelH * 0.5 - Math.max(8, panelH * 0.2) / 2;
  const barW = panelW - 20 - 24 - portraitRightPad;
  const barH = Math.max(8, panelH * 0.2);

  const playerBarGeom = { x: barX, y: barY, w: barW, h: barH };

  scene.add
    .text(panelX + 10, panelY + panelH * 0.5 - 2, "HP", {
      fontSize: `${Math.max(10, Math.floor(w * 0.014))}px`,
      color: COLORS.accent,
      fontStyle: "bold",
    })
    .setOrigin(0, 0.5);

  const playerHPBar = scene.add.graphics();
  drawHPBar(playerHPBar, barX, barY, barW, barH, displayedPlayerRatio);

  const playerHPText = scene.add
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

  return { playerHPBar, playerHPText, playerBarGeom, playerPortrait };
}

export function createTurnIndicator(
  scene: Phaser.Scene,
  w: number,
  h: number,
): Phaser.GameObjects.Text {
  return scene.add
    .text(w * 0.5, h * 0.33, "", {
      fontSize: `${Math.max(13, Math.floor(w * 0.02))}px`,
      color: COLORS.accent,
      fontStyle: "bold",
    })
    .setOrigin(0.5);
}

export function setTurnIndicator(
  turnIndicator: Phaser.GameObjects.Text,
  phase: TurnPhase,
): void {
  switch (phase) {
    case TP.PlayerTurn:
      turnIndicator.setText("⚔ Your Turn");
      turnIndicator.setColor(COLORS.accent);
      break;
    case TP.AiThinking:
      turnIndicator.setText("AI Thinking...");
      turnIndicator.setColor("#ffd700");
      break;
    case TP.AiTurn:
      turnIndicator.setText("⚔ AI Turn");
      turnIndicator.setColor("#ff6666");
      break;
    case TP.BattleOver:
      turnIndicator.setText("Battle Over");
      turnIndicator.setColor("#ffffff");
      break;
    default:
      turnIndicator.setText("");
  }
}

export function createBattleLog(
  scene: Phaser.Scene,
  w: number,
  h: number,
): {
  battleLogText: Phaser.GameObjects.Text;
  logContainer: Phaser.GameObjects.Container;
  logFontSize: number;
  logLineWidth: number;
} {
  const logX = w * 0.03;
  const logY = h * 0.37;
  const logW = w * 0.44;
  const logH = Math.min(h * 0.35, h - logY - 10);

  const bg = scene.add.graphics();
  bg.fillStyle(0x1a1a2e, 0.95);
  bg.fillRoundedRect(logX, logY, logW, logH, 6);
  bg.lineStyle(2, 0x555555);
  bg.strokeRoundedRect(logX, logY, logW, logH, 6);
  bg.setDepth(10);

  const titleSize = Math.max(11, Math.floor(w * 0.015));
  scene.add
    .text(logX + 10, logY + 5, "\u2694 Battle Log", {
      fontSize: `${titleSize}px`,
      color: "#888888",
    })
    .setOrigin(0, 0)
    .setDepth(11);

  const titleOffset = titleSize + 10;
  const logContainer = scene.add.container(logX + 10, logY + titleOffset);
  logContainer.setDepth(12);

  const battleLogText = scene.add
    .text(0, 0, "", {
      fontSize: `${Math.max(12, Math.floor(w * 0.018))}px`,
      color: COLORS.accent,
      wordWrap: { width: logW - 20 },
      lineSpacing: 3,
    })
    .setOrigin(0, 0)
    .setVisible(false);

  const logFontSize = Math.max(12, Math.floor(w * 0.018));
  const logLineWidth = logW - 20;

  const mask = scene.add.graphics();
  mask.fillStyle(0xffffff);
  mask.fillRect(logX, logY, logW, logH);
  logContainer.setMask(new Phaser.Display.Masks.GeometryMask(scene, mask));

  return { battleLogText, logContainer, logFontSize, logLineWidth };
}

export function addLogMessage(
  scene: Phaser.Scene,
  msg: string,
  logMessages: string[],
  logLineColors: string[],
  logLineTexts: Phaser.GameObjects.Text[],
  logContainer: Phaser.GameObjects.Container,
  logFontSize: number,
  logLineWidth: number,
): Phaser.GameObjects.Text[] {
  const { displayMsg, color } = parseLogMessage(msg);

  logMessages.push(`> ${displayMsg}`);
  logLineColors.push(color);

  if (logMessages.length > LOG_MAX_LINES) {
    logMessages.shift();
    logLineColors.shift();
  }

  for (const t of logLineTexts) {
    t.destroy();
  }
  const newLineTexts: Phaser.GameObjects.Text[] = [];

  const lineHeight = logFontSize + 6;
  for (let i = 0; i < logMessages.length; i++) {
    const lineText = scene.add
      .text(0, i * lineHeight, logMessages[i], {
        fontSize: `${logFontSize}px`,
        color: logLineColors[i],
        wordWrap: { width: logLineWidth },
      })
      .setOrigin(0, 0);
    logContainer.add(lineText);
    newLineTexts.push(lineText);
  }

  logContainer.setAlpha(0.5);
  scene.tweens.add({
    targets: logContainer,
    alpha: 1,
    duration: 300,
    ease: "Linear",
  });

  return newLineTexts;
}

export function createSpinner(
  scene: Phaser.Scene,
  w: number,
  h: number,
): Phaser.GameObjects.Text {
  return scene.add
    .text(w * 0.5, h * 0.45, "", {
      fontSize: `${Math.max(14, Math.floor(w * 0.022))}px`,
      color: "#ffd700",
    })
    .setOrigin(0.5)
    .setVisible(false);
}

export function showSpinner(
  scene: Phaser.Scene,
  spinnerText: Phaser.GameObjects.Text,
  mechPrompt: string,
): Phaser.Time.TimerEvent {
  let i = 0;
  const label = mechPrompt.trim() ? "Analyzing strategy..." : "AI Thinking...";
  spinnerText.setVisible(true);
  return scene.time.addEvent({
    delay: 80,
    loop: true,
    callback: () => {
      spinnerText.setText(`${SPINNER_FRAMES[i]} ${label} ${SPINNER_FRAMES[i]}`);
      i = (i + 1) % SPINNER_FRAMES.length;
    },
  });
}

export function hideSpinner(
  spinnerText: Phaser.GameObjects.Text,
  spinnerTimer?: Phaser.Time.TimerEvent,
): void {
  spinnerText.setVisible(false);
  if (spinnerTimer) {
    spinnerTimer.destroy();
  }
}

export function animateHP(
  scene: Phaser.Scene,
  isOpponent: boolean,
  targetRatio: number,
  newHp: number,
  maxHp: number,
  displayedOpponentRatio: number,
  displayedPlayerRatio: number,
  opponentHPBar: Phaser.GameObjects.Graphics,
  playerHPBar: Phaser.GameObjects.Graphics,
  opponentHPText: Phaser.GameObjects.Text,
  playerHPText: Phaser.GameObjects.Text,
  opponentBarGeom: { x: number; y: number; w: number; h: number },
  playerBarGeom: { x: number; y: number; w: number; h: number },
  onComplete: (isOpponent: boolean, targetRatio: number) => void,
): Promise<void> {
  return new Promise((resolve) => {
    const fromRatio = isOpponent
      ? displayedOpponentRatio
      : displayedPlayerRatio;
    const hpBar = isOpponent ? opponentHPBar : playerHPBar;
    const hpText = isOpponent ? opponentHPText : playerHPText;
    const geom = isOpponent ? opponentBarGeom : playerBarGeom;
    const fromHp = Math.round(fromRatio * maxHp);

    const target = { ratio: fromRatio, hp: fromHp };

    scene.tweens.add({
      targets: target,
      ratio: targetRatio,
      hp: newHp,
      duration: HP_TWEEN_DURATION,
      ease: "Power2",
      onUpdate: () => {
        drawHPBar(hpBar, geom.x, geom.y, geom.w, geom.h, target.ratio);
        hpText.setText(`${Math.round(target.hp)} / ${maxHp}`);
      },
      onComplete: () => {
        hpText.setText(`${newHp} / ${maxHp}`);
        onComplete(isOpponent, targetRatio);
        resolve();
      },
    });
  });
}
