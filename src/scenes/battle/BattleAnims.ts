/**
 * BattleAnims - Attack animation, damage flash, defense label, showDefenseLabel
 */

import type Phaser from "phaser";
import {
  type MechSprite,
  playMechAttack,
  playMechDamageFlash,
} from "../../utils/MechGraphics";

export function playAttackAnimation(
  scene: Phaser.Scene,
  playerMechSprite: MechSprite,
  opponentMechSprite: MechSprite,
  isPlayer: boolean,
): Promise<void> {
  const sprite = isPlayer ? playerMechSprite : opponentMechSprite;
  return playMechAttack(scene, sprite, isPlayer);
}

export function playDefeatAnimation(
  scene: Phaser.Scene,
  sprite: MechSprite,
): Promise<void> {
  return new Promise((resolve) => {
    scene.tweens.add({
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

export function showDefenseLabel(
  scene: Phaser.Scene,
  sprite: MechSprite,
): void {
  const text = scene.add
    .text(sprite.container.x, sprite.container.y - 25, "DEF UP!", {
      fontSize: "16px",
      color: "#66ccff",
      fontStyle: "bold",
      stroke: "#000000",
      strokeThickness: 3,
    })
    .setOrigin(0.5);

  scene.tweens.add({
    targets: text,
    y: text.y - 30,
    alpha: 0,
    duration: 700,
    ease: "Quad.easeOut",
    onComplete: () => text.destroy(),
  });
}

export function playDamageFlash(
  scene: Phaser.Scene,
  playerMechSprite: MechSprite,
  opponentMechSprite: MechSprite,
  targetIsOpponent: boolean,
): Promise<void> {
  const sprite = targetIsOpponent ? opponentMechSprite : playerMechSprite;
  return playMechDamageFlash(scene, sprite);
}
