/**
 * Asset registry — single source of truth for all battle asset key/path mappings.
 *
 * Mech sprites and portraits for the weapon triangle system
 * (kinetic / beam / emp). All final PNGs live under src/assets/.
 */

import type Phaser from "phaser";
import { getAllSkinAssetEntries } from "../data/skinLoader";
import { MechType } from "../types/game";
import type { PortraitState } from "../utils/portraitState";

// Mech sprite PNGs (256x256)
import beamMechPng from "./mechs/beam-mech.png";
import empMechPng from "./mechs/emp-mech.png";
import kineticMechPng from "./mechs/kinetic-mech.png";

// Portrait PNGs (64x64) — indexed by MechType
import beamAngryPng from "./portraits/beam-angry.png";
import beamDefeatedPng from "./portraits/beam-defeated.png";
import beamNormalPng from "./portraits/beam-normal.png";
import empAngryPng from "./portraits/emp-angry.png";
import empDefeatedPng from "./portraits/emp-defeated.png";
import empNormalPng from "./portraits/emp-normal.png";
import kineticAngryPng from "./portraits/kinetic-angry.png";
import kineticDefeatedPng from "./portraits/kinetic-defeated.png";
import kineticNormalPng from "./portraits/kinetic-normal.png";

// Background PNGs
import battleBgCityPng from "./backgrounds/battle-bg-city.png";
import battleGroundPng from "./backgrounds/battle-ground.png";

export interface AssetEntry {
  key: string;
  path: string;
}

export const ASSET_REGISTRY = {
  mechs: {
    [MechType.Kinetic]: {
      key: "mech-kinetic",
      path: kineticMechPng,
    } as AssetEntry,
    [MechType.Beam]: { key: "mech-beam", path: beamMechPng } as AssetEntry,
    [MechType.Emp]: { key: "mech-emp", path: empMechPng } as AssetEntry,
  },
  portraits: {
    [MechType.Kinetic]: {
      normal: { key: "portrait-kinetic-normal", path: kineticNormalPng },
      angry: { key: "portrait-kinetic-angry", path: kineticAngryPng },
      defeated: {
        key: "portrait-kinetic-defeated",
        path: kineticDefeatedPng,
      },
    } as Record<PortraitState, AssetEntry>,
    [MechType.Beam]: {
      normal: { key: "portrait-beam-normal", path: beamNormalPng },
      angry: { key: "portrait-beam-angry", path: beamAngryPng },
      defeated: { key: "portrait-beam-defeated", path: beamDefeatedPng },
    } as Record<PortraitState, AssetEntry>,
    [MechType.Emp]: {
      normal: { key: "portrait-emp-normal", path: empNormalPng },
      angry: { key: "portrait-emp-angry", path: empAngryPng },
      defeated: { key: "portrait-emp-defeated", path: empDefeatedPng },
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
  for (const [mechType, states] of Object.entries(ASSET_REGISTRY.portraits)) {
    if (!states) continue;
    for (const [state, entry] of Object.entries(states)) {
      if (scene.textures.exists(entry.key)) continue;
      try {
        scene.load.image(entry.key, entry.path);
      } catch (err) {
        console.warn(
          `[AssetRegistry] Failed to queue portrait ${mechType}-${state}:`,
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

  // Skin pack assets
  for (const entry of getAllSkinAssetEntries()) {
    if (scene.textures.exists(entry.key)) continue;
    try {
      scene.load.image(entry.key, entry.path);
    } catch (err) {
      console.warn(
        `[AssetRegistry] Failed to queue skin asset ${entry.key}:`,
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
