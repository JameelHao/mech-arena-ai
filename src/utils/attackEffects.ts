/**
 * Attack and hit-reaction visual effects for battle animations.
 * Projectile flight + explosion burst + container shake.
 */

import type Phaser from "phaser";
import { MechType } from "../types/game";
import type { MechSprite } from "./MechGraphics";

// ─── Projectile colors per skill type ────────────────────────────────────────

const PROJECTILE_COLORS: Record<string, { core: number; glow: number }> = {
  [MechType.Fire]: { core: 0xff4500, glow: 0xff6b35 },
  [MechType.Water]: { core: 0x1e90ff, glow: 0x4db8ff },
  [MechType.Electric]: { core: 0xffd700, glow: 0xffed4a },
  defense: { core: 0x888888, glow: 0xaaaaaa },
};

const EXPLOSION_COLORS: Record<string, { inner: number; outer: number }> = {
  [MechType.Fire]: { inner: 0xffaa00, outer: 0xff4500 },
  [MechType.Water]: { inner: 0x66ccff, outer: 0x1e90ff },
  [MechType.Electric]: { inner: 0xffff66, outer: 0xffd700 },
  defense: { inner: 0xcccccc, outer: 0x888888 },
};

/**
 * Play ranged attack animation: spawn a projectile from attacker that
 * flies toward the target, then destroy it on arrival.
 */
export function playAttackProjectile(
  scene: Phaser.Scene,
  attacker: MechSprite,
  target: MechSprite,
  skillType: MechType | "defense",
): Promise<void> {
  return new Promise((resolve) => {
    const colors = PROJECTILE_COLORS[skillType] ?? PROJECTILE_COLORS.defense;

    // Create projectile at attacker position
    const projectile = scene.add.graphics();

    // Outer glow
    projectile.fillStyle(colors.glow, 0.5);
    projectile.fillCircle(0, 0, 10);
    // Inner core
    projectile.fillStyle(colors.core, 1);
    projectile.fillCircle(0, 0, 5);
    // Bright center
    projectile.fillStyle(0xffffff, 0.8);
    projectile.fillCircle(0, 0, 2);

    projectile.setPosition(attacker.container.x, attacker.container.y);

    // Fly toward target
    scene.tweens.add({
      targets: projectile,
      x: target.container.x,
      y: target.container.y,
      duration: 350,
      ease: "Power2",
      onComplete: () => {
        projectile.destroy();
        resolve();
      },
    });
  });
}

/**
 * Play hit reaction on target: explosion burst + container shake.
 * Combines with existing damageFlash for full feedback.
 */
export function playHitReaction(
  scene: Phaser.Scene,
  target: MechSprite,
  skillType: MechType | "defense",
): Promise<void> {
  return new Promise((resolve) => {
    const colors = EXPLOSION_COLORS[skillType] ?? EXPLOSION_COLORS.defense;

    // Create explosion burst at target position
    const explosion = scene.add.graphics();
    explosion.setPosition(target.container.x, target.container.y);

    // Draw layered explosion
    explosion.fillStyle(colors.outer, 0.6);
    explosion.fillCircle(0, 0, 20);
    explosion.fillStyle(colors.inner, 0.8);
    explosion.fillCircle(0, 0, 12);
    explosion.fillStyle(0xffffff, 0.9);
    explosion.fillCircle(0, 0, 5);

    // Spark particles radiating outward
    const sparks: Phaser.GameObjects.Graphics[] = [];
    const sparkCount = 6;
    for (let i = 0; i < sparkCount; i++) {
      const spark = scene.add.graphics();
      spark.fillStyle(colors.inner, 0.9);
      spark.fillCircle(0, 0, 2 + Math.random() * 2);
      spark.setPosition(target.container.x, target.container.y);
      sparks.push(spark);

      const angle = (i / sparkCount) * Math.PI * 2 + Math.random() * 0.5;
      const dist = 25 + Math.random() * 20;

      scene.tweens.add({
        targets: spark,
        x: target.container.x + Math.cos(angle) * dist,
        y: target.container.y + Math.sin(angle) * dist,
        alpha: 0,
        duration: 300 + Math.random() * 150,
        ease: "Quad.easeOut",
        onComplete: () => spark.destroy(),
      });
    }

    // Explosion expand + fade
    scene.tweens.add({
      targets: explosion,
      scaleX: 1.8,
      scaleY: 1.8,
      alpha: 0,
      duration: 350,
      ease: "Quad.easeOut",
      onComplete: () => explosion.destroy(),
    });

    // Camera shake for impact (guard for test environments without cameras)
    scene.cameras?.main?.shake(150, 0.005);

    // Container shake (rapid X oscillation)
    const origX = target.container.x;
    scene.tweens.add({
      targets: target.container,
      x: origX + 6,
      duration: 40,
      yoyo: true,
      repeat: 4,
      ease: "Sine.easeInOut",
      onComplete: () => {
        target.container.x = origX;
        resolve();
      },
    });
  });
}

/**
 * Show a floating damage number above a mech that drifts up and fades out.
 */
export function showDamageNumber(
  scene: Phaser.Scene,
  target: MechSprite,
  damage: number,
  effectiveness: "super" | "resist" | "normal",
): void {
  const colorMap = { super: "#ff6666", resist: "#66ccff", normal: "#ffd700" };
  const color = colorMap[effectiveness];
  const prefix = damage > 0 ? "-" : "";

  const multiplierSuffix =
    effectiveness === "super"
      ? " \u00D71.5"
      : effectiveness === "resist"
        ? " \u00D70.5"
        : "";
  const text = scene.add
    .text(
      target.container.x,
      target.container.y - 30,
      `${prefix}${damage}${multiplierSuffix}`,
      {
        fontSize: "22px",
        color,
        fontStyle: "bold",
        stroke: "#000000",
        strokeThickness: 3,
      },
    )
    .setOrigin(0.5);

  scene.tweens.add({
    targets: text,
    y: text.y - 40,
    alpha: 0,
    duration: 800,
    ease: "Quad.easeOut",
    onComplete: () => text.destroy(),
  });
}

/**
 * Flash a skill name at the center of the screen, then fade out.
 */
export function showSkillName(
  scene: Phaser.Scene,
  skillName: string,
  color: string,
): Promise<void> {
  return new Promise((resolve) => {
    const { width, height } = scene.scale;
    const text = scene.add
      .text(width / 2, height * 0.3, skillName, {
        fontSize: "24px",
        color,
        fontStyle: "bold",
        stroke: "#000000",
        strokeThickness: 4,
      })
      .setOrigin(0.5)
      .setAlpha(0);

    scene.tweens.add({
      targets: text,
      alpha: 1,
      duration: 150,
      ease: "Linear",
      onComplete: () => {
        scene.tweens.add({
          targets: text,
          alpha: 0,
          duration: 450,
          delay: 200,
          ease: "Quad.easeIn",
          onComplete: () => {
            text.destroy();
            resolve();
          },
        });
      },
    });
  });
}

/**
 * Show a floating effectiveness label below the damage number.
 */
export function showEffectivenessLabel(
  scene: Phaser.Scene,
  target: MechSprite,
  effectiveness: "super" | "resist",
): void {
  const labelMap = {
    super: { text: "Super Effective!", color: "#ff6666" },
    resist: { text: "Not Very Effective...", color: "#66ccff" },
  };
  const { text: label, color } = labelMap[effectiveness];

  const text = scene.add
    .text(target.container.x, target.container.y + 5, label, {
      fontSize: "14px",
      color,
      fontStyle: "bold",
      stroke: "#000000",
      strokeThickness: 2,
    })
    .setOrigin(0.5);

  scene.tweens.add({
    targets: text,
    y: text.y - 20,
    alpha: 0,
    duration: 1000,
    delay: 200,
    ease: "Quad.easeOut",
    onComplete: () => text.destroy(),
  });
}
