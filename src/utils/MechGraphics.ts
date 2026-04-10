/**
 * MechGraphics - Mech sprite rendering using PNG assets from the registry,
 * with programmatic fallback for Electric type (no PNG yet).
 */

import type Phaser from "phaser";
import { ASSET_REGISTRY, hasTexture, preloadAllAssets } from "../assets";
import { MechType } from "../types/game";

export { type PortraitState, getPortraitState } from "./portraitState";

// Re-export registry references so existing consumers keep working
export const PORTRAIT_TEXTURE_KEYS = ASSET_REGISTRY.portraits;

// Colors only needed for EMP programmatic fallback
const EMP_COLORS = {
  primary: 0x00bfff,
  secondary: 0x66dfff,
  glow: 0x0090cc,
  highlight: 0x99eeff,
};

// ─── Electric Mech Programmatic Fallback ─────────────────────────────────────
// Fire and Water mechs use PNG assets from the registry. Electric retains
// programmatic drawing until its sprite is ready.

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

function drawHighlights(
  g: Phaser.GameObjects.Graphics,
  w: number,
  h: number,
): void {
  g.lineStyle(1.5, EMP_COLORS.highlight, 0.6);
  g.beginPath();
  g.moveTo(-w * 0.05, -h * 0.48);
  g.lineTo(w * 0.05, -h * 0.48);
  g.strokePath();
  g.beginPath();
  g.moveTo(-w * 0.28, h * 0.01);
  g.lineTo(w * 0.28, h * 0.01);
  g.strokePath();
}

function drawThrusters(
  g: Phaser.GameObjects.Graphics,
  w: number,
  h: number,
): void {
  g.fillStyle(0x333333, 0.9);
  g.fillRoundedRect(-w * 0.18, h * 0.36, w * 0.08, h * 0.08, 2);
  g.fillRoundedRect(w * 0.1, h * 0.36, w * 0.08, h * 0.08, 2);
  g.fillStyle(EMP_COLORS.glow, 0.7);
  g.fillRoundedRect(-w * 0.16, h * 0.38, w * 0.04, h * 0.04, 1);
  g.fillRoundedRect(w * 0.12, h * 0.38, w * 0.04, h * 0.04, 1);
  g.fillStyle(EMP_COLORS.highlight, 0.4);
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

function drawGlowingEyes(
  g: Phaser.GameObjects.Graphics,
  w: number,
  h: number,
): void {
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

/** Draw an Electric-type mech: spiky, jagged shapes (programmatic fallback) */
function drawElectricMech(
  g: Phaser.GameObjects.Graphics,
  w: number,
  h: number,
): void {
  const c = EMP_COLORS;

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

  drawPanelLines(
    g,
    [
      { x: -w * 0.22, y: h * 0.08, w: w * 0.44, h: 1 },
      { x: -w * 0.18, y: h * 0.22, w: w * 0.36, h: 1 },
      { x: -w * 0.15, y: h * 0.36, w: w * 0.3, h: 1 },
    ],
    0x333300,
  );

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

  drawThrusters(g, w, h);
  drawGlowingEyes(g, w, h);
  drawHighlights(g, w, h);

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
  [MechType.Kinetic]: createFireEffects,
  [MechType.Beam]: createWaterEffects,
  [MechType.Emp]: createElectricEffects,
};

// ─── Public API ───────────────────────────────────────────���───────────────────

export interface MechSprite {
  container: Phaser.GameObjects.Container;
  graphics: Phaser.GameObjects.Image | Phaser.GameObjects.Graphics;
  damageOverlay: Phaser.GameObjects.Graphics;
  idleTween: Phaser.Tweens.Tween;
  effectTimer?: Phaser.Time.TimerEvent;
}

/**
 * Preload all mech and portrait assets. Call in scene's preload() method.
 * Delegates to the centralized asset registry.
 */
export function preloadMechAssets(scene: Phaser.Scene): void {
  preloadAllAssets(scene);
}

/**
 * Create a mech sprite using PNG texture (preferred) or procedural fallback.
 * Includes shadow, effects, and idle animation.
 * @param skinTextureKey Optional texture key override (for skin packs).
 */
export function createMechSprite(
  scene: Phaser.Scene,
  type: MechType,
  x: number,
  y: number,
  spriteW: number,
  spriteH: number,
  skinTexture?: string,
): MechSprite {
  const container = scene.add.container(x, y);

  // 1. Shadow layer
  const shadow = scene.add.graphics();
  shadow.fillStyle(0x000000, 0.3);
  shadow.fillEllipse(0, spriteH * 0.52, spriteW * 0.7, spriteH * 0.1);
  container.add(shadow);

  // 2. Main mech visual - skin override, PNG texture, or procedural fallback
  let graphicsObj: Phaser.GameObjects.Image | Phaser.GameObjects.Graphics;

  const textureKey =
    skinTexture && hasTexture(scene, skinTexture) ? skinTexture : null;
  const entry = ASSET_REGISTRY.mechs[type];
  if (textureKey) {
    const image = scene.add.image(0, 0, textureKey);
    image.setDisplaySize(spriteW, spriteH);
    graphicsObj = image;
  } else if (entry && hasTexture(scene, entry.key)) {
    const image = scene.add.image(0, 0, entry.key);
    image.setDisplaySize(spriteW, spriteH);
    graphicsObj = image;
  } else {
    // Programmatic fallback (currently only Electric has no PNG)
    const graphics = scene.add.graphics();
    drawElectricMech(graphics, spriteW, spriteH);
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

  // 5. Idle animation: Y float + subtle X wobble + scale pulse
  const baseY = y;
  const idleTween = scene.tweens.add({
    targets: container,
    y: baseY - 5,
    duration: 1800,
    yoyo: true,
    repeat: -1,
    ease: "Sine.easeInOut",
  });

  scene.tweens.add({
    targets: container,
    x: x + 1.5,
    duration: 2400,
    yoyo: true,
    repeat: -1,
    ease: "Sine.easeInOut",
  });

  scene.tweens.add({
    targets: container,
    scaleX: 1.015,
    scaleY: 1.015,
    duration: 2000,
    yoyo: true,
    repeat: -1,
    ease: "Sine.easeInOut",
  });

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

// Re-export attack effect functions from dedicated module
export {
  playAttackProjectile,
  playHitReaction,
  showDamageNumber,
  showEffectivenessLabel,
  showSkillName,
} from "./attackEffects";
