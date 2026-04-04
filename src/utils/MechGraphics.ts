/**
 * MechGraphics - Programmatic mech sprite generation using Phaser Graphics API
 */

import type Phaser from "phaser";
import { MechType } from "../types/game";

const MECH_COLORS: Record<
  string,
  { primary: number; secondary: number; glow: number }
> = {
  [MechType.Fire]: { primary: 0xff4500, secondary: 0xff6b35, glow: 0xff2200 },
  [MechType.Water]: { primary: 0x1e90ff, secondary: 0x4db8ff, glow: 0x0066cc },
  [MechType.Electric]: {
    primary: 0xffd700,
    secondary: 0xffed4a,
    glow: 0xccaa00,
  },
};

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

  // Eyes - sharp slits
  g.fillStyle(0xffffff, 1);
  g.fillRect(-w * 0.14, -h * 0.22, w * 0.1, h * 0.04);
  g.fillRect(w * 0.04, -h * 0.22, w * 0.1, h * 0.04);

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
  // Eye glow
  g.fillStyle(0x00ffff, 1);
  g.fillCircle(-w * 0.08, -h * 0.23, w * 0.04);
  g.fillCircle(w * 0.08, -h * 0.23, w * 0.04);

  // Shoulder pads - ellipses
  g.fillStyle(c.glow, 0.9);
  g.fillEllipse(-w * 0.42, h * 0.02, w * 0.2, h * 0.18);
  g.fillEllipse(w * 0.42, h * 0.02, w * 0.2, h * 0.18);

  // Legs - rounded pillars
  g.fillStyle(c.primary, 0.8);
  g.fillRoundedRect(-w * 0.28, h * 0.4, w * 0.2, h * 0.12, 4);
  g.fillRoundedRect(w * 0.08, h * 0.4, w * 0.2, h * 0.12, 4);

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

  // Eyes - electric dots
  g.fillStyle(0xffffff, 1);
  g.fillCircle(-w * 0.1, -h * 0.22, w * 0.05);
  g.fillCircle(w * 0.1, -h * 0.22, w * 0.05);
  g.fillStyle(0x000000, 1);
  g.fillCircle(-w * 0.1, -h * 0.22, w * 0.025);
  g.fillCircle(w * 0.1, -h * 0.22, w * 0.025);

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

export interface MechSprite {
  container: Phaser.GameObjects.Container;
  graphics: Phaser.GameObjects.Graphics;
  damageOverlay: Phaser.GameObjects.Graphics;
  idleTween: Phaser.Tweens.Tween;
}

/**
 * Create a programmatic mech sprite with idle animation.
 * Returns container, graphics, damage overlay, and idle tween handle.
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

  const graphics = scene.add.graphics();
  const drawFn = DRAW_FN[type] ?? drawFireMech;
  drawFn(graphics, spriteW, spriteH);

  // Red tint overlay for damage flash (initially invisible)
  const damageOverlay = scene.add.graphics();
  damageOverlay.fillStyle(0xff0000, 0.5);
  damageOverlay.fillRect(-spriteW * 0.5, -spriteH * 0.5, spriteW, spriteH);
  damageOverlay.setAlpha(0);

  container.add([graphics, damageOverlay]);

  // Idle animation: breathing y-oscillation
  const idleTween = scene.tweens.add({
    targets: container,
    y: y - 4,
    duration: 1200,
    yoyo: true,
    repeat: -1,
    ease: "Sine.easeInOut",
  });

  return { container, graphics, damageOverlay, idleTween };
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
