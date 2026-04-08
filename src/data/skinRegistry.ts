/** Registry of all available skin packs. */

import type { SkinPackManifest } from "../types/skin";

export const AVAILABLE_SKINS: SkinPackManifest[] = [
  {
    id: "default",
    name: "Standard Issue",
    codename: "FALCON UNIT",
    themeColor: "#C0C0C0",
    baseType: "kinetic",
  },
  {
    id: "desert-storm",
    name: "Desert Storm",
    codename: "FALCON UNIT",
    themeColor: "#D2B48C",
    baseType: "kinetic",
  },
  {
    id: "arctic-ops",
    name: "Arctic Ops",
    codename: "FALCON UNIT",
    themeColor: "#87CEEB",
    baseType: "kinetic",
  },
  {
    id: "crimson-fury",
    name: "Crimson Fury",
    codename: "FALCON UNIT",
    themeColor: "#DC143C",
    baseType: "kinetic",
  },
];
