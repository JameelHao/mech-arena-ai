/** Skin pack loader — resolves skin ID to asset paths for Phaser textures. */

import type { SkinPack } from "../types/skin";
import { AVAILABLE_SKINS } from "./skinRegistry";

// Default skin assets
import defaultMech from "../assets/skins/default/mech.png";
import defaultPortraitAngry from "../assets/skins/default/portrait-angry.png";
import defaultPortraitDefeated from "../assets/skins/default/portrait-defeated.png";
import defaultPortraitNormal from "../assets/skins/default/portrait-normal.png";
import defaultThumbnail from "../assets/skins/default/thumbnail.png";

// Desert Storm skin assets
import desertMech from "../assets/skins/desert-storm/mech.png";
import desertPortraitAngry from "../assets/skins/desert-storm/portrait-angry.png";
import desertPortraitDefeated from "../assets/skins/desert-storm/portrait-defeated.png";
import desertPortraitNormal from "../assets/skins/desert-storm/portrait-normal.png";
import desertThumbnail from "../assets/skins/desert-storm/thumbnail.png";

// Arctic Ops skin assets
import arcticMech from "../assets/skins/arctic-ops/mech.png";
import arcticPortraitAngry from "../assets/skins/arctic-ops/portrait-angry.png";
import arcticPortraitDefeated from "../assets/skins/arctic-ops/portrait-defeated.png";
import arcticPortraitNormal from "../assets/skins/arctic-ops/portrait-normal.png";
import arcticThumbnail from "../assets/skins/arctic-ops/thumbnail.png";

// Crimson Fury skin assets
import crimsonMech from "../assets/skins/crimson-fury/mech.png";
import crimsonPortraitAngry from "../assets/skins/crimson-fury/portrait-angry.png";
import crimsonPortraitDefeated from "../assets/skins/crimson-fury/portrait-defeated.png";
import crimsonPortraitNormal from "../assets/skins/crimson-fury/portrait-normal.png";
import crimsonThumbnail from "../assets/skins/crimson-fury/thumbnail.png";

interface SkinAssetPaths {
  mech: string;
  portraits: { normal: string; angry: string; defeated: string };
  thumbnail: string;
}

const SKIN_ASSETS: Record<string, SkinAssetPaths> = {
  default: {
    mech: defaultMech,
    portraits: {
      normal: defaultPortraitNormal,
      angry: defaultPortraitAngry,
      defeated: defaultPortraitDefeated,
    },
    thumbnail: defaultThumbnail,
  },
  "desert-storm": {
    mech: desertMech,
    portraits: {
      normal: desertPortraitNormal,
      angry: desertPortraitAngry,
      defeated: desertPortraitDefeated,
    },
    thumbnail: desertThumbnail,
  },
  "arctic-ops": {
    mech: arcticMech,
    portraits: {
      normal: arcticPortraitNormal,
      angry: arcticPortraitAngry,
      defeated: arcticPortraitDefeated,
    },
    thumbnail: arcticThumbnail,
  },
  "crimson-fury": {
    mech: crimsonMech,
    portraits: {
      normal: crimsonPortraitNormal,
      angry: crimsonPortraitAngry,
      defeated: crimsonPortraitDefeated,
    },
    thumbnail: crimsonThumbnail,
  },
};

/** Build a Phaser texture key for a skin asset. */
export function skinTextureKey(
  skinId: string,
  asset:
    | "mech"
    | "portrait-normal"
    | "portrait-angry"
    | "portrait-defeated"
    | "thumbnail",
): string {
  return `skin-${skinId}-${asset}`;
}

/** Resolve a skin ID to a full SkinPack with asset paths. Falls back to "default". */
export function loadSkinPack(skinId: string): SkinPack {
  const manifest = AVAILABLE_SKINS.find((s) => s.id === skinId);
  const assets = SKIN_ASSETS[skinId];

  if (!manifest || !assets) {
    return loadSkinPack("default");
  }

  return {
    ...manifest,
    mechSprite: assets.mech,
    portraits: assets.portraits,
    thumbnail: assets.thumbnail,
  };
}

/** Get all skin asset entries for Phaser preloading. */
export function getAllSkinAssetEntries(): {
  key: string;
  path: string;
}[] {
  const entries: { key: string; path: string }[] = [];
  for (const manifest of AVAILABLE_SKINS) {
    const assets = SKIN_ASSETS[manifest.id];
    if (!assets) continue;
    entries.push({
      key: skinTextureKey(manifest.id, "mech"),
      path: assets.mech,
    });
    entries.push({
      key: skinTextureKey(manifest.id, "portrait-normal"),
      path: assets.portraits.normal,
    });
    entries.push({
      key: skinTextureKey(manifest.id, "portrait-angry"),
      path: assets.portraits.angry,
    });
    entries.push({
      key: skinTextureKey(manifest.id, "portrait-defeated"),
      path: assets.portraits.defeated,
    });
    entries.push({
      key: skinTextureKey(manifest.id, "thumbnail"),
      path: assets.thumbnail,
    });
  }
  return entries;
}
