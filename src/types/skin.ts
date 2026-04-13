/**
 * Skin Pack type definitions — asset contract for mech visual customization.
 *
 * Each skin pack must include:
 * - Battle sprite (256×256 PNG, transparent background)
 * - 3 HUD portraits: normal, angry, defeated (64×64 PNG, RGB)
 * - Selection thumbnail (128×128 PNG, transparent background)
 * - Manifest metadata (name, codename, themeColor, baseType)
 */

import type { MechType } from "./game";

/**
 * Manifest metadata for a skin pack (stored in manifest.json).
 *
 * COSMETIC ONLY — skin packs must never contain combat-related fields
 * (hp, damage, skills, type effectiveness, etc.). All battle behavior
 * is driven exclusively by Combat Core and player prompt.
 */
export interface SkinPackManifest {
  /** Unique identifier for this skin (kebab-case). */
  id: string;
  /** Display name of the skin. */
  name: string;
  /** Mech codename this skin applies to. */
  codename: string;
  /** Primary theme color as hex string (e.g. "#C0C0C0"). */
  themeColor: string;
  /** Base mech type this skin is designed for. */
  baseType: MechType;
}

/**
 * Runtime representation of a loaded skin pack with asset paths.
 *
 * COSMETIC ONLY — extends SkinPackManifest with visual asset paths only.
 * No combat stats, no behavioral modifiers.
 */
export interface SkinPack extends SkinPackManifest {
  /** Path to battle sprite (256×256 PNG). */
  mechSprite: string;
  /** Paths to HUD portraits (64×64 PNG). */
  portraits: {
    normal: string;
    angry: string;
    defeated: string;
  };
  /** Path to selection thumbnail (128×128 PNG). */
  thumbnail: string;
}

/** Asset dimensions required for each skin pack file. */
export const SKIN_ASSET_SPECS = {
  mechSprite: { width: 256, height: 256, format: "PNG" as const },
  portrait: { width: 64, height: 64, format: "PNG" as const },
  thumbnail: { width: 128, height: 128, format: "PNG" as const },
} as const;

/** Required files in a skin pack directory. */
export const SKIN_REQUIRED_FILES = [
  "mech.png",
  "portrait-normal.png",
  "portrait-angry.png",
  "portrait-defeated.png",
  "thumbnail.png",
  "manifest.json",
] as const;
