/**
 * MechGraphics - Programmatic mech sprite generation using Phaser Graphics API
 * Enhanced with shadows, highlights, armor details, type effects, and smoother animations.
 */

import type Phaser from "phaser";
import { MechType } from "../types/game";

// PNG imports for mech sprites (扣图后的高质量素材，256x256 统一尺寸)
import fireMechPng from "../assets/mechs/fire-mech.png";
import waterMechPng from "../assets/mechs/water-mech.png";
// TODO: 等 Electric 机甲素材扣图完成后添加
// import electricMechPng from "../assets/mechs/electric-mech.png";

import enemyAngryPng from "../assets/portraits/enemy-angry.png";
import enemyDefeatedPng from "../assets/portraits/enemy-defeated.png";
// Portrait imports (64x64 cropped from material pack)
import enemyNormalPng from "../assets/portraits/enemy-normal.png";
import playerAngryPng from "../assets/portraits/player-angry.png";
import playerDefeatedPng from "../assets/portraits/player-defeated.png";
import playerNormalPng from "../assets/portraits/player-normal.png";

const MECH_TEXTURE_KEYS: Record<
  string,
  { key: string; url: string; type: "png" } | null
> = {
  [MechType.Fire]: { key: "mech-fire", url: fireMechPng, type: "png" },
  [MechType.Water]: { key: "mech-water", url: waterMechPng, type: "png" },
  [MechType.Electric]: null, // 暂时用程序化回退，等素材
};

import type { PortraitState } from "./portraitState";
export { type PortraitState, getPortraitState } from "./portraitState";

export const PORTRAIT_TEXTURE_KEYS: Record<
  string,
  Record<PortraitState, { key: string; url: string }>
> = {
  enemy: {
    normal: { key: "portrait-enemy-normal", url: enemyNormalPng },
    angry: { key: "portrait-enemy-angry", url: enemyAngryPng },
    defeated: { key: "portrait-enemy-defeated", url: enemyDefeatedPng },
  },
  player: {
    normal: { key: "portrait-player-normal", url: playerNormalPng },
    angry: { key: "portrait-player-angry", url: playerAngryPng },
    defeated: { key: "portrait-player-defeated", url: playerDefeatedPng },
  },
};

const MECH_COLORS: Record<
  string,
  { primary: number; secondary: number; glow: number; highlight: number }
> = {
  [MechType.Fire]: {
    primary: 0xff4500,
    secondary: 0xff6b35,
    glow: 0xff2200,
    highlight: 0xffaa66,
  },
  [MechType.Water]: {
    primary: 0x1e90ff,
    secondary: 0x4db8ff,
    glow: 0x0066cc,
    highlight: 0x99d6ff,
  },
  [MechType.Electric]: {
    primary: 0xffd700,
    secondary: 0xffed4a,
    glow: 0xccaa00,
    highlight: 0xfff5aa,
  },
};

// ─── Armor Details ────────────────────────────────────────────────────────────

/** Draw rivets (small circles) at given positions */
function drawRivets(
  g: Phaser.GameObjects.Graphics,
  positions: { x: number; y: number }[],
  radius: number,
): void {
  g.fillStyle(0x888888, 0.8);
  for (const p of positions) {
    g.fillCircle(p.x, p.y, radius);
  }
  g.fillStyle(0xcccccc, 0.5);
  for (const p of positions) {
    g.fillCircle(p.x - radius * 0.3, p.y - radius * 0.3, radius * 0.4);
  }
}

/** Draw panel lines (thin rectangles) */
function drawPanelLines(
  g: Phaser.GameObjects.Graphics,
  lines: { x: number; y: number; w: number; h: number }[],
  color: number,
): void {
  g.fillStyle(color, 0.3);
  for (const l of lines) {
    g.fillRect(l.x, l.y, l.w, l.h);
  }
}

// ─── Highlight Layer ──────────────────────────────────────────────────────────

/** Draw highlight accents on top edges */
function drawHighlights(
  g: Phaser.GameObjects.Graphics,
  type: string,
  w: number,
  h: number,
): void {
  const c = MECH_COLORS[type];
  g.lineStyle(1.5, c.highlight, 0.6);

  if (type === MechType.Fire) {
    // Top edge of head
    g.beginPath();
    g.moveTo(-w * 0.1, -h * 0.43);
    g.lineTo(w * 0.1, -h * 0.43);
    g.strokePath();
    // Top edge of body
    g.beginPath();
    g.moveTo(-w * 0.28, h * 0.11);
    g.lineTo(w * 0.28, h * 0.11);
    g.strokePath();
    // Shoulder top edges
    g.beginPath();
    g.moveTo(-w * 0.5, -h * 0.1);
    g.lineTo(-w * 0.38, h * 0.05);
    g.strokePath();
    g.beginPath();
    g.moveTo(w * 0.5, -h * 0.1);
    g.lineTo(w * 0.38, h * 0.05);
    g.strokePath();
  } else if (type === MechType.Water) {
    // Top arc of head
    g.beginPath();
    g.arc(0, -h * 0.2, w * 0.22, -Math.PI * 0.8, -Math.PI * 0.2);
    g.strokePath();
    // Top edge of body
    g.beginPath();
    g.moveTo(-w * 0.3, -h * 0.04);
    g.lineTo(w * 0.3, -h * 0.04);
    g.strokePath();
    // Shoulder top arcs
    g.beginPath();
    g.arc(-w * 0.42, h * 0.02, w * 0.09, -Math.PI * 0.9, -Math.PI * 0.1);
    g.strokePath();
    g.beginPath();
    g.arc(w * 0.42, h * 0.02, w * 0.09, -Math.PI * 0.9, -Math.PI * 0.1);
    g.strokePath();
  } else {
    // Top of crown spikes
    g.beginPath();
    g.moveTo(-w * 0.05, -h * 0.48);
    g.lineTo(w * 0.05, -h * 0.48);
    g.strokePath();
    // Body top edge
    g.beginPath();
    g.moveTo(-w * 0.28, h * 0.01);
    g.lineTo(w * 0.28, h * 0.01);
    g.strokePath();
  }
}

// ─── Thruster / Exhaust Ports ─────────────────────────────────────────────────

function drawThrusters(
  g: Phaser.GameObjects.Graphics,
  type: string,
  w: number,
  h: number,
): void {
  const c = MECH_COLORS[type];

  // Exhaust port housings (dark)
  g.fillStyle(0x333333, 0.9);
  g.fillRoundedRect(-w * 0.18, h * 0.36, w * 0.08, h * 0.08, 2);
  g.fillRoundedRect(w * 0.1, h * 0.36, w * 0.08, h * 0.08, 2);

  // Inner glow
  g.fillStyle(c.glow, 0.7);
  g.fillRoundedRect(-w * 0.16, h * 0.38, w * 0.04, h * 0.04, 1);
  g.fillRoundedRect(w * 0.12, h * 0.38, w * 0.04, h * 0.04, 1);

  // Exhaust flame hint
  g.fillStyle(c.highlight, 0.4);
  g.beginPath();
  g.moveTo(-w * 0.16, h * 0.42);
  g.lineTo(-w * 0.14, h * 0.48);
  g.lineTo(-w * 0.12, h * 0.42);
  g.closePath();
  g.fillPath();
  g.beginPath();
  g.moveTo(w * 0.12, h * 0.42);
  g.lineTo(w * 0.14, h * 0.48);
  g.lineTo(w * 0.16, h * 0.42);
  g.closePath();
  g.fillPath();
}

// ─── Glowing Eyes / Sensors ───────────────────────────────────────────────────

function drawGlowingEyes(
  g: Phaser.GameObjects.Graphics,
  type: string,
  w: number,
  h: number,
): void {
  if (type === MechType.Fire) {
    // Outer glow
    g.fillStyle(0xffaa00, 0.3);
    g.fillCircle(-w * 0.09, -h * 0.21, w * 0.07);
    g.fillCircle(w * 0.09, -h * 0.21, w * 0.07);
    // Bright core - sharp slits with glow
    g.fillStyle(0xffdd44, 1);
    g.fillRect(-w * 0.14, -h * 0.225, w * 0.1, h * 0.045);
    g.fillRect(w * 0.04, -h * 0.225, w * 0.1, h * 0.045);
    // Hot center
    g.fillStyle(0xffffff, 0.9);
    g.fillRect(-w * 0.12, -h * 0.215, w * 0.06, h * 0.025);
    g.fillRect(w * 0.06, -h * 0.215, w * 0.06, h * 0.025);
  } else if (type === MechType.Water) {
    // Outer glow
    g.fillStyle(0x00ffff, 0.25);
    g.fillCircle(-w * 0.08, -h * 0.23, w * 0.065);
    g.fillCircle(w * 0.08, -h * 0.23, w * 0.065);
    // Bright core
    g.fillStyle(0x00ffff, 1);
    g.fillCircle(-w * 0.08, -h * 0.23, w * 0.04);
    g.fillCircle(w * 0.08, -h * 0.23, w * 0.04);
    // White hot center
    g.fillStyle(0xffffff, 0.8);
    g.fillCircle(-w * 0.08, -h * 0.23, w * 0.02);
    g.fillCircle(w * 0.08, -h * 0.23, w * 0.02);
  } else {
    // Electric: glowing pupils
    g.fillStyle(0xffff00, 0.3);
    g.fillCircle(-w * 0.1, -h * 0.22, w * 0.07);
    g.fillCircle(w * 0.1, -h * 0.22, w * 0.07);
    g.fillStyle(0xffffff, 1);
    g.fillCircle(-w * 0.1, -h * 0.22, w * 0.05);
    g.fillCircle(w * 0.1, -h * 0.22, w * 0.05);
    g.fillStyle(0xffff00, 1);
    g.fillCircle(-w * 0.1, -h * 0.22, w * 0.03);
    g.fillCircle(w * 0.1, -h * 0.22, w * 0.03);
  }
}

// ─── Type-specific Body Drawers ───────────────────────────────────────────────

/** Draw a Fire-type mech: angular, aggressive shapes */
function drawFireMech(
  g: Phaser.GameObjects.Graphics,
  w: number,
  h: number,
): void {
  const c = MECH_COLORS[MechType.Fire];

  // Body - angular trapezoid
  g.fillStyle(c.primary, 1);
  g.beginPath();
  g.moveTo(-w * 0.3, h * 0.1);
  g.lineTo(-w * 0.4, h * 0.45);
  g.lineTo(w * 0.4, h * 0.45);
  g.lineTo(w * 0.3, h * 0.1);
  g.closePath();
  g.fillPath();

  // Head - angular diamond
  g.fillStyle(c.secondary, 1);
  g.beginPath();
  g.moveTo(0, -h * 0.45);
  g.lineTo(-w * 0.22, -h * 0.15);
  g.lineTo(0, h * 0.05);
  g.lineTo(w * 0.22, -h * 0.15);
  g.closePath();
  g.fillPath();

  // Shoulder spikes
  g.fillStyle(c.glow, 1);
  g.beginPath();
  g.moveTo(-w * 0.4, h * 0.1);
  g.lineTo(-w * 0.5, -h * 0.1);
  g.lineTo(-w * 0.3, h * 0.05);
  g.closePath();
  g.fillPath();
  g.beginPath();
  g.moveTo(w * 0.4, h * 0.1);
  g.lineTo(w * 0.5, -h * 0.1);
  g.lineTo(w * 0.3, h * 0.05);
  g.closePath();
  g.fillPath();

  // Armor panel lines
  drawPanelLines(
    g,
    [
      { x: -w * 0.15, y: h * 0.15, w: w * 0.3, h: 1 },
      { x: -w * 0.12, y: h * 0.25, w: w * 0.24, h: 1 },
      { x: -w * 0.1, y: h * 0.35, w: w * 0.2, h: 1 },
      { x: 0, y: h * 0.12, w: 1, h: h * 0.3 }, // vertical center seam
    ],
    0x000000,
  );

  // Rivets
  drawRivets(
    g,
    [
      { x: -w * 0.2, y: h * 0.16 },
      { x: w * 0.2, y: h * 0.16 },
      { x: -w * 0.25, y: h * 0.3 },
      { x: w * 0.25, y: h * 0.3 },
      { x: -w * 0.15, y: h * 0.4 },
      { x: w * 0.15, y: h * 0.4 },
    ],
    w * 0.015,
  );

  // Legs - angular pillars
  g.fillStyle(c.primary, 0.8);
  g.beginPath();
  g.moveTo(-w * 0.3, h * 0.45);
  g.lineTo(-w * 0.35, h * 0.5);
  g.lineTo(-w * 0.2, h * 0.5);
  g.lineTo(-w * 0.15, h * 0.45);
  g.closePath();
  g.fillPath();
  g.beginPath();
  g.moveTo(w * 0.15, h * 0.45);
  g.lineTo(w * 0.2, h * 0.5);
  g.lineTo(w * 0.35, h * 0.5);
  g.lineTo(w * 0.3, h * 0.45);
  g.closePath();
  g.fillPath();

  // Thrusters
  drawThrusters(g, MechType.Fire, w, h);

  // Glowing eyes
  drawGlowingEyes(g, MechType.Fire, w, h);

  // Highlights
  drawHighlights(g, MechType.Fire, w, h);

  // Outline
  g.lineStyle(2, c.glow, 0.8);
  g.beginPath();
  g.moveTo(0, -h * 0.45);
  g.lineTo(-w * 0.22, -h * 0.15);
  g.lineTo(-w * 0.4, h * 0.1);
  g.lineTo(-w * 0.4, h * 0.45);
  g.lineTo(w * 0.4, h * 0.45);
  g.lineTo(w * 0.4, h * 0.1);
  g.lineTo(w * 0.22, -h * 0.15);
  g.lineTo(0, -h * 0.45);
  g.strokePath();
}

/** Draw a Water-type mech: rounded, smooth shapes */
function drawWaterMech(
  g: Phaser.GameObjects.Graphics,
  w: number,
  h: number,
): void {
  const c = MECH_COLORS[MechType.Water];

  // Body - rounded rectangle
  g.fillStyle(c.primary, 1);
  g.fillRoundedRect(-w * 0.35, -h * 0.05, w * 0.7, h * 0.5, w * 0.1);

  // Head - circle
  g.fillStyle(c.secondary, 1);
  g.fillCircle(0, -h * 0.2, w * 0.22);

  // Visor - curved
  g.fillStyle(0x0a1a3a, 1);
  g.fillRoundedRect(-w * 0.16, -h * 0.28, w * 0.32, h * 0.1, 6);

  // Shoulder pads - ellipses
  g.fillStyle(c.glow, 0.9);
  g.fillEllipse(-w * 0.42, h * 0.02, w * 0.2, h * 0.18);
  g.fillEllipse(w * 0.42, h * 0.02, w * 0.2, h * 0.18);

  // Armor panel lines
  drawPanelLines(
    g,
    [
      { x: -w * 0.3, y: h * 0.08, w: w * 0.6, h: 1 },
      { x: -w * 0.25, y: h * 0.2, w: w * 0.5, h: 1 },
      { x: -w * 0.2, y: h * 0.32, w: w * 0.4, h: 1 },
      { x: 0, y: -h * 0.03, w: 1, h: h * 0.45 }, // center seam
    ],
    0x000033,
  );

  // Rivets
  drawRivets(
    g,
    [
      { x: -w * 0.22, y: h * 0.1 },
      { x: w * 0.22, y: h * 0.1 },
      { x: -w * 0.18, y: h * 0.25 },
      { x: w * 0.18, y: h * 0.25 },
      { x: -w * 0.42, y: h * 0.02 },
      { x: w * 0.42, y: h * 0.02 },
    ],
    w * 0.015,
  );

  // Legs - rounded pillars
  g.fillStyle(c.primary, 0.8);
  g.fillRoundedRect(-w * 0.28, h * 0.4, w * 0.2, h * 0.12, 4);
  g.fillRoundedRect(w * 0.08, h * 0.4, w * 0.2, h * 0.12, 4);

  // Thrusters
  drawThrusters(g, MechType.Water, w, h);

  // Glowing eyes
  drawGlowingEyes(g, MechType.Water, w, h);

  // Highlights
  drawHighlights(g, MechType.Water, w, h);

  // Outline
  g.lineStyle(2, c.glow, 0.7);
  g.strokeCircle(0, -h * 0.2, w * 0.22);
  g.strokeRoundedRect(-w * 0.35, -h * 0.05, w * 0.7, h * 0.5, w * 0.1);
}

/** Draw an Electric-type mech: spiky, jagged shapes */
function drawElectricMech(
  g: Phaser.GameObjects.Graphics,
  w: number,
  h: number,
): void {
  const c = MECH_COLORS[MechType.Electric];

  // Body - jagged polygon
  g.fillStyle(c.primary, 1);
  g.beginPath();
  g.moveTo(-w * 0.3, h * 0.0);
  g.lineTo(-w * 0.38, h * 0.2);
  g.lineTo(-w * 0.25, h * 0.15);
  g.lineTo(-w * 0.35, h * 0.45);
  g.lineTo(w * 0.35, h * 0.45);
  g.lineTo(w * 0.25, h * 0.15);
  g.lineTo(w * 0.38, h * 0.2);
  g.lineTo(w * 0.3, h * 0.0);
  g.closePath();
  g.fillPath();

  // Head - spiky crown
  g.fillStyle(c.secondary, 1);
  g.beginPath();
  g.moveTo(0, -h * 0.5);
  g.lineTo(-w * 0.12, -h * 0.3);
  g.lineTo(-w * 0.2, -h * 0.42);
  g.lineTo(-w * 0.25, -h * 0.15);
  g.lineTo(w * 0.25, -h * 0.15);
  g.lineTo(w * 0.2, -h * 0.42);
  g.lineTo(w * 0.12, -h * 0.3);
  g.lineTo(0, -h * 0.5);
  g.closePath();
  g.fillPath();

  // Lightning bolt accents on torso
  g.fillStyle(c.glow, 0.9);
  g.beginPath();
  g.moveTo(-w * 0.05, h * 0.05);
  g.lineTo(-w * 0.12, h * 0.2);
  g.lineTo(-w * 0.02, h * 0.15);
  g.lineTo(-w * 0.08, h * 0.35);
  g.lineTo(w * 0.02, h * 0.2);
  g.lineTo(-w * 0.05, h * 0.25);
  g.lineTo(w * 0.05, h * 0.05);
  g.closePath();
  g.fillPath();

  // Armor panel lines
  drawPanelLines(
    g,
    [
      { x: -w * 0.22, y: h * 0.08, w: w * 0.44, h: 1 },
      { x: -w * 0.18, y: h * 0.22, w: w * 0.36, h: 1 },
      { x: -w * 0.15, y: h * 0.36, w: w * 0.3, h: 1 },
    ],
    0x333300,
  );

  // Rivets
  drawRivets(
    g,
    [
      { x: -w * 0.2, y: h * 0.1 },
      { x: w * 0.2, y: h * 0.1 },
      { x: -w * 0.22, y: h * 0.28 },
      { x: w * 0.22, y: h * 0.28 },
    ],
    w * 0.015,
  );

  // Legs - spiky
  g.fillStyle(c.primary, 0.8);
  g.beginPath();
  g.moveTo(-w * 0.25, h * 0.45);
  g.lineTo(-w * 0.3, h * 0.52);
  g.lineTo(-w * 0.2, h * 0.48);
  g.lineTo(-w * 0.15, h * 0.52);
  g.lineTo(-w * 0.1, h * 0.45);
  g.closePath();
  g.fillPath();
  g.beginPath();
  g.moveTo(w * 0.1, h * 0.45);
  g.lineTo(w * 0.15, h * 0.52);
  g.lineTo(w * 0.2, h * 0.48);
  g.lineTo(w * 0.25, h * 0.52);
  g.lineTo(w * 0.3, h * 0.45);
  g.closePath();
  g.fillPath();

  // Thrusters
  drawThrusters(g, MechType.Electric, w, h);

  // Glowing eyes
  drawGlowingEyes(g, MechType.Electric, w, h);

  // Highlights
  drawHighlights(g, MechType.Electric, w, h);

  // Outline
  g.lineStyle(2, c.glow, 0.8);
  g.beginPath();
  g.moveTo(0, -h * 0.5);
  g.lineTo(-w * 0.25, -h * 0.15);
  g.lineTo(-w * 0.38, h * 0.2);
  g.lineTo(-w * 0.35, h * 0.45);
  g.lineTo(w * 0.35, h * 0.45);
  g.lineTo(w * 0.38, h * 0.2);
  g.lineTo(w * 0.25, -h * 0.15);
  g.lineTo(0, -h * 0.5);
  g.strokePath();
}

const DRAW_FN: Record<
  string,
  (g: Phaser.GameObjects.Graphics, w: number, h: number) => void
> = {
  [MechType.Fire]: drawFireMech,
  [MechType.Water]: drawWaterMech,
  [MechType.Electric]: drawElectricMech,
};

// ─── Type-specific Animated Effects ───────────────────────────────────────────

/** Fire: glowing ember particles rising from the mech */
function createFireEffects(
  scene: Phaser.Scene,
  container: Phaser.GameObjects.Container,
  w: number,
  h: number,
): Phaser.Time.TimerEvent {
  return scene.time.addEvent({
    delay: 200,
    loop: true,
    callback: () => {
      const ember = scene.add.graphics();
      const size = 1.5 + Math.random() * 2.5;
      const startX = (Math.random() - 0.5) * w * 0.6;
      const startY = h * 0.1 + Math.random() * h * 0.3;

      ember.fillStyle(
        Math.random() > 0.5 ? 0xff6600 : 0xff3300,
        0.7 + Math.random() * 0.3,
      );
      ember.fillCircle(0, 0, size);
      ember.setPosition(startX, startY);
      container.add(ember);

      scene.tweens.add({
        targets: ember,
        x: startX + (Math.random() - 0.5) * 15,
        y: startY - 20 - Math.random() * 25,
        alpha: 0,
        scaleX: 0.2,
        scaleY: 0.2,
        duration: 600 + Math.random() * 400,
        ease: "Quad.easeOut",
        onComplete: () => ember.destroy(),
      });
    },
  });
}

/** Water: wave ripple at base of the mech */
function createWaterEffects(
  scene: Phaser.Scene,
  container: Phaser.GameObjects.Container,
  w: number,
  h: number,
): Phaser.Time.TimerEvent {
  return scene.time.addEvent({
    delay: 1200,
    loop: true,
    callback: () => {
      const ripple = scene.add.graphics();
      ripple.lineStyle(1.5, 0x66ccff, 0.6);
      ripple.strokeEllipse(0, h * 0.52, w * 0.3, h * 0.06);
      ripple.setAlpha(0.8);
      container.add(ripple);

      scene.tweens.add({
        targets: ripple,
        scaleX: 2.2,
        scaleY: 1.5,
        alpha: 0,
        duration: 1000,
        ease: "Quad.easeOut",
        onComplete: () => ripple.destroy(),
      });
    },
  });
}

/** Electric: arc flicker bolts around the mech */
function createElectricEffects(
  scene: Phaser.Scene,
  container: Phaser.GameObjects.Container,
  w: number,
  h: number,
): Phaser.Time.TimerEvent {
  return scene.time.addEvent({
    delay: 300 + Math.random() * 200,
    loop: true,
    callback: () => {
      const arc = scene.add.graphics();
      const startX = (Math.random() - 0.5) * w * 0.7;
      const startY = -h * 0.3 + Math.random() * h * 0.6;
      const segments = 3 + Math.floor(Math.random() * 3);

      arc.lineStyle(1 + Math.random(), 0xffff66, 0.8);
      arc.beginPath();
      arc.moveTo(startX, startY);
      let cx = startX;
      let cy = startY;
      for (let i = 0; i < segments; i++) {
        cx += (Math.random() - 0.5) * 12;
        cy += (Math.random() - 0.5) * 10;
        arc.lineTo(cx, cy);
      }
      arc.strokePath();
      container.add(arc);

      scene.tweens.add({
        targets: arc,
        alpha: 0,
        duration: 100 + Math.random() * 150,
        onComplete: () => arc.destroy(),
      });
    },
  });
}

const EFFECT_FN: Record<
  string,
  (
    scene: Phaser.Scene,
    container: Phaser.GameObjects.Container,
    w: number,
    h: number,
  ) => Phaser.Time.TimerEvent
> = {
  [MechType.Fire]: createFireEffects,
  [MechType.Water]: createWaterEffects,
  [MechType.Electric]: createElectricEffects,
};

// ─── Public API ───────────────────────────────────────────────────────────────

export interface MechSprite {
  container: Phaser.GameObjects.Container;
  graphics: Phaser.GameObjects.Image | Phaser.GameObjects.Graphics;
  damageOverlay: Phaser.GameObjects.Graphics;
  idleTween: Phaser.Tweens.Tween;
  effectTimer?: Phaser.Time.TimerEvent;
}

/**
 * Preload SVG mech textures. Call in scene's preload() method.
 * Handles both regular URLs and data URIs (Vite may inline SVGs in production).
 * Falls back gracefully to programmatic graphics if SVG loading fails.
 */
export function preloadMechSVGs(scene: Phaser.Scene): void {
  for (const [type, entry] of Object.entries(MECH_TEXTURE_KEYS)) {
    if (!entry) {
      console.log(
        `[MechGraphics] ${type}: no texture, will use programmatic fallback`,
      );
      continue;
    }
    console.log(`[MechGraphics] Loading PNG: ${entry.key}`);
    if (scene.textures.exists(entry.key)) continue;

    try {
      scene.load.image(entry.key, entry.url);
      console.log(`[MechGraphics] Queued PNG load: ${entry.key}`);
    } catch (err) {
      console.warn(
        `[MechGraphics] Failed to queue load for ${type}, will use programmatic fallback:`,
        err,
      );
    }
  }

  // Load portrait textures
  for (const [side, states] of Object.entries(PORTRAIT_TEXTURE_KEYS)) {
    for (const [state, entry] of Object.entries(states)) {
      if (scene.textures.exists(entry.key)) continue;
      try {
        scene.load.image(entry.key, entry.url);
        console.log(`[MechGraphics] Queued portrait load: ${entry.key}`);
      } catch (err) {
        console.warn(
          `[MechGraphics] Failed to load portrait ${side}-${state}:`,
          err,
        );
      }
    }
  }
}

/**
 * Check if SVG textures are loaded and available.
 */
function hasSVGTexture(scene: Phaser.Scene, type: MechType): boolean {
  const entry = MECH_TEXTURE_KEYS[type];
  return !!entry && scene.textures.exists(entry.key);
}

/**
 * Create a mech sprite using SVG texture (preferred) or procedural fallback.
 * Includes shadow, effects, and idle animation.
 */
export function createMechSprite(
  scene: Phaser.Scene,
  type: MechType,
  x: number,
  y: number,
  spriteW: number,
  spriteH: number,
): MechSprite {
  const container = scene.add.container(x, y);

  // 1. Shadow layer - dark ellipse under the mech
  const shadow = scene.add.graphics();
  shadow.fillStyle(0x000000, 0.3);
  shadow.fillEllipse(0, spriteH * 0.52, spriteW * 0.7, spriteH * 0.1);
  container.add(shadow);

  // 2. Main mech visual - SVG texture or procedural fallback
  let graphicsObj: Phaser.GameObjects.Image | Phaser.GameObjects.Graphics;

  const entry = MECH_TEXTURE_KEYS[type];
  if (entry && hasSVGTexture(scene, type)) {
    try {
      const image = scene.add.image(0, 0, entry.key);
      image.setDisplaySize(spriteW, spriteH);
      graphicsObj = image;
    } catch (err) {
      console.warn(
        `[MechGraphics] SVG texture failed for ${type}, falling back to programmatic:`,
        err,
      );
      const graphics = scene.add.graphics();
      const drawFn = DRAW_FN[type] ?? drawFireMech;
      drawFn(graphics, spriteW, spriteH);
      graphicsObj = graphics;
    }
  } else {
    console.log(`[MechGraphics] Using programmatic graphics for ${type}`);
    const graphics = scene.add.graphics();
    const drawFn = DRAW_FN[type] ?? drawFireMech;
    drawFn(graphics, spriteW, spriteH);
    graphicsObj = graphics;
  }
  container.add(graphicsObj);

  // 3. Red tint overlay for damage flash (initially invisible)
  const damageOverlay = scene.add.graphics();
  damageOverlay.fillStyle(0xff0000, 0.5);
  damageOverlay.fillRect(-spriteW * 0.5, -spriteH * 0.5, spriteW, spriteH);
  damageOverlay.setAlpha(0);
  container.add(damageOverlay);

  // 4. Type-specific animated effects
  const effectFn = EFFECT_FN[type];
  const effectTimer = effectFn?.(scene, container, spriteW, spriteH);

  // 5. Smoother idle animation: Y float + subtle X wobble + scale pulse
  const baseY = y;
  const idleTween = scene.tweens.add({
    targets: container,
    y: baseY - 5,
    duration: 1800,
    yoyo: true,
    repeat: -1,
    ease: "Sine.easeInOut",
  });

  // Subtle X wobble
  scene.tweens.add({
    targets: container,
    x: x + 1.5,
    duration: 2400,
    yoyo: true,
    repeat: -1,
    ease: "Sine.easeInOut",
  });

  // Subtle scale pulse (breathing)
  scene.tweens.add({
    targets: container,
    scaleX: 1.015,
    scaleY: 1.015,
    duration: 2000,
    yoyo: true,
    repeat: -1,
    ease: "Sine.easeInOut",
  });

  // Shadow scale synced to float
  scene.tweens.add({
    targets: shadow,
    scaleX: 0.9,
    scaleY: 0.85,
    alpha: 0.2,
    duration: 1800,
    yoyo: true,
    repeat: -1,
    ease: "Sine.easeInOut",
  });

  return {
    container,
    graphics: graphicsObj,
    damageOverlay,
    idleTween,
    effectTimer,
  };
}

/** Play attack animation: lunge toward opponent then return */
export function playMechAttack(
  scene: Phaser.Scene,
  sprite: MechSprite,
  isPlayer: boolean,
): Promise<void> {
  return new Promise((resolve) => {
    const moveX = isPlayer ? 40 : -40;
    const moveY = isPlayer ? -20 : 20;
    const origX = sprite.container.x;

    // Pause idle during attack
    sprite.idleTween.pause();

    scene.tweens.add({
      targets: sprite.container,
      x: origX + moveX,
      y: sprite.container.y + moveY,
      duration: 120,
      ease: "Power2",
      yoyo: true,
      onComplete: () => {
        sprite.idleTween.resume();
        resolve();
      },
    });
  });
}

/** Flash red tint overlay on damage */
export function playMechDamageFlash(
  scene: Phaser.Scene,
  sprite: MechSprite,
): Promise<void> {
  return new Promise((resolve) => {
    scene.tweens.add({
      targets: sprite.damageOverlay,
      alpha: 0.6,
      duration: 80,
      yoyo: true,
      repeat: 2,
      onComplete: () => {
        sprite.damageOverlay.setAlpha(0);
        resolve();
      },
    });

    // Also flash the whole container
    scene.tweens.add({
      targets: sprite.container,
      alpha: 0.3,
      duration: 80,
      yoyo: true,
      repeat: 2,
      onComplete: () => {
        sprite.container.setAlpha(1);
      },
    });
  });
}
