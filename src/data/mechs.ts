/** Shared mech definitions used across scenes. */

import { type Mech, MechType } from "../types/game";

export const PLAYER_MECH: Mech = {
  name: "Your Mech",
  type: MechType.Fire,
  hp: 100,
  maxHp: 100,
  codename: "FALCON UNIT",
  role: "Assault",
  bio: "Agile fire-type striker built for aggressive offense.",
  skills: [
    { name: "Fire Blast", type: MechType.Fire, damage: 40 },
    { name: "Water Cannon", type: MechType.Water, damage: 30 },
    { name: "Thunder Shock", type: MechType.Electric, damage: 25 },
    { name: "Iron Defense", type: "defense", damage: 0 },
  ],
};

export const OPPONENT_MECH: Mech = {
  name: "Enemy Mech",
  type: MechType.Water,
  hp: 100,
  maxHp: 100,
  codename: "VENOM BATTALION",
  role: "Tank",
  bio: "Heavy water-type defender with punishing counter-attacks.",
  skills: [
    { name: "Water Cannon", type: MechType.Water, damage: 30 },
    { name: "Fire Blast", type: MechType.Fire, damage: 40 },
    { name: "Thunder Shock", type: MechType.Electric, damage: 25 },
    { name: "Iron Defense", type: "defense", damage: 0 },
  ],
};
