/**
 * Asset registry — single source of truth for all battle asset key/path mappings.
 *
 * Asset source: mech sprites and portraits were cropped from a Gemini-generated
 * game asset pack (gemini-game-asset-pack.png). Background layers were generated
 * separately. All final PNGs live under src/assets/.
 */

import type Phaser from "phaser";
import { MechType } from "../types/game";
import type { PortraitState } from "../utils/portraitState";

// Mech sprite PNGs (256x256)
import fireMechPng from "./mechs/fire-mech.png";
import waterMechPng from "./mechs/water-mech.png";

// Portrait PNGs (64x64)
import enemyAngryPng from "./portraits/enemy-angry.png";
import enemyDefeatedPng from "./portraits/enemy-defeated.png";
import enemyNormalPng from "./portraits/enemy-normal.png";
import playerAngryPng from "./portraits/player-angry.png";
import playerDefeatedPng from "./portraits/player-defeated.png";
import playerNormalPng from "./portraits/player-normal.png";

// Background PNGs
import battleBgCityPng from "./backgrounds/battle-bg-city.png";
import battleGroundPng from "./backgrounds/battle-ground.png";

export interface AssetEntry {
  key: string;
  path: string;
}

export const ASSET_REGISTRY = {
  mechs: {
    [MechType.Fire]: { key: "mech-fire", path: fireMechPng } as AssetEntry,
    [MechType.Water]: { key: "mech-water", path: waterMechPng } as AssetEntry,
    [MechType.Electric]: null, // programmatic fallback until asset is ready
  },
  portraits: {
    player: {
      normal: { key: "portrait-player-normal", path: playerNormalPng },
      angry: { key: "portrait-player-angry", path: playerAngryPng },
      defeated: { key: "portrait-player-defeated", path: playerDefeatedPng },
    } as Record<PortraitState, AssetEntry>,
    enemy: {
      normal: { key: "portrait-enemy-normal", path: enemyNormalPng },
      angry: { key: "portrait-enemy-angry", path: enemyAngryPng },
      defeated: { key: "portrait-enemy-defeated", path: enemyDefeatedPng },
    } as Record<PortraitState, AssetEntry>,
  },
  backgrounds: {
    city: { key: "bg-city", path: battleBgCityPng } as AssetEntry,
    ground: { key: "bg-ground", path: battleGroundPng } as AssetEntry,
  },
} as const;

/**
 * Preload all registered assets into a Phaser scene.
 */
export function preloadAllAssets(scene: Phaser.Scene): void {
  // Mechs
  for (const entry of Object.values(ASSET_REGISTRY.mechs)) {
    if (!entry) continue;
    if (scene.textures.exists(entry.key)) continue;
    try {
      scene.load.image(entry.key, entry.path);
    } catch (err) {
      console.warn(
        `[AssetRegistry] Failed to queue mech asset ${entry.key}:`,
        err,
      );
    }
  }

  // Portraits
  for (const [side, states] of Object.entries(ASSET_REGISTRY.portraits)) {
    for (const [state, entry] of Object.entries(states)) {
      if (scene.textures.exists(entry.key)) continue;
      try {
        scene.load.image(entry.key, entry.path);
      } catch (err) {
        console.warn(
          `[AssetRegistry] Failed to queue portrait ${side}-${state}:`,
          err,
        );
      }
    }
  }

  // Backgrounds
  for (const entry of Object.values(ASSET_REGISTRY.backgrounds)) {
    if (scene.textures.exists(entry.key)) continue;
    try {
      scene.load.image(entry.key, entry.path);
    } catch (err) {
      console.warn(
        `[AssetRegistry] Failed to queue background ${entry.key}:`,
        err,
      );
    }
  }
}

/**
 * Check if a texture key is loaded in the scene.
 */
export function hasTexture(scene: Phaser.Scene, key: string): boolean {
  return scene.textures.exists(key);
}
