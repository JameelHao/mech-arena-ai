/**
 * BattleSkills - Skill button creation, hover/click states, disable logic
 */

import Phaser from "phaser";
import { OPPONENT_MECH } from "../../data/mechs";
import type { MechType } from "../../types/game";
import { getEffectiveness } from "../../utils/BattleManager";

const COLORS = {
  accent: "#00ff88",
  buttonBg: 0x333333,
  buttonHover: 0x444444,
  defense: "#888888",
  kinetic: "#C0C0C0",
  beam: "#FF4500",
  emp: "#00BFFF",
} as const;

export const SKILL_COLORS: Record<string, string> = {
  kinetic: COLORS.kinetic,
  beam: COLORS.beam,
  emp: COLORS.emp,
  defense: COLORS.defense,
};

export function createSkillButtons(
  scene: Phaser.Scene,
  skills: { name: string; type: string; damage: number }[],
  w: number,
  h: number,
  onSkillSelected: (index: number) => void,
): {
  skillButtons: Phaser.GameObjects.Container[];
  skillHitZones: Phaser.GameObjects.Zone[];
} {
  const skillButtons: Phaser.GameObjects.Container[] = [];
  const skillHitZones: Phaser.GameObjects.Zone[] = [];

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

    const container = scene.add.container(x, y);

    const bg = scene.add.graphics();
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

    const nameText = scene.add
      .text(btnW / 2, btnH * 0.38, skill.name, {
        fontSize: `${fontSize}px`,
        color: skillColor,
        fontStyle: "bold",
        align: "center",
      })
      .setOrigin(0.5);

    let infoLabel: string;
    let infoColor = "#999999";
    if (skill.damage > 0 && skill.type !== "defense") {
      const eff = getEffectiveness(skill.type as MechType, OPPONENT_MECH.type);
      if (eff > 1) {
        infoLabel = `${skill.type.toUpperCase()} · ${skill.damage} DMG  \u25B2 1.5x`;
        infoColor = "#00ff88";
      } else if (eff < 1) {
        infoLabel = `${skill.type.toUpperCase()} · ${skill.damage} DMG  \u25BC 0.5x`;
        infoColor = "#ff6666";
      } else {
        infoLabel = `${skill.type.toUpperCase()} · ${skill.damage} DMG`;
      }
    } else {
      infoLabel = "BUFF · DEF +50%";
    }

    const infoText = scene.add
      .text(btnW / 2, btnH * 0.68, infoLabel, {
        fontSize: `${subFontSize}px`,
        color: infoColor,
        align: "center",
      })
      .setOrigin(0.5);

    container.add([bg, nameText, infoText]);

    const hitZone = scene.add
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
      onSkillSelected(i);
    });

    skillButtons.push(container);
    skillHitZones.push(hitZone);
  }

  return { skillButtons, skillHitZones };
}

export function setButtonsEnabled(
  enabled: boolean,
  skillHitZones: Phaser.GameObjects.Zone[],
  skillButtons: Phaser.GameObjects.Container[],
): void {
  for (const zone of skillHitZones) {
    if (enabled) {
      zone.setInteractive({ useHandCursor: true });
    } else {
      zone.disableInteractive();
    }
  }
  for (const container of skillButtons) {
    container.setAlpha(enabled ? 1 : 0.5);
  }
}
