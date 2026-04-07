/** Shared mech definitions used across scenes. */

import { type Mech, MechType } from "../types/game";

export const MECH_ROSTER: Mech[] = [
  {
    name: "Your Mech",
    type: MechType.Kinetic,
    hp: 100,
    maxHp: 100,
    codename: "FALCON UNIT",
    role: "Assault",
    bio: "Agile fire-type striker built for aggressive offense.",
    skills: [
      { name: "Railgun Salvo", type: MechType.Kinetic, damage: 40 },
      { name: "Plasma Beam", type: MechType.Beam, damage: 30 },
      { name: "EMP Pulse", type: MechType.Emp, damage: 25 },
      { name: "Reactive Armor", type: "defense", damage: 0 },
    ],
  },
  {
    name: "Your Mech",
    type: MechType.Beam,
    hp: 120,
    maxHp: 120,
    codename: "HYDRA SENTINEL",
    role: "Support",
    bio: "Resilient water-type defender with healing capabilities.",
    skills: [
      { name: "Plasma Beam", type: MechType.Beam, damage: 35 },
      { name: "Railgun Salvo", type: MechType.Kinetic, damage: 25 },
      { name: "EMP Pulse", type: MechType.Emp, damage: 20 },
      { name: "Reactive Armor", type: "defense", damage: 0 },
    ],
  },
  {
    name: "Your Mech",
    type: MechType.Emp,
    hp: 90,
    maxHp: 90,
    codename: "VOLT STRIKER",
    role: "Specialist",
    bio: "High-speed electric mech with devastating burst damage.",
    skills: [
      { name: "EMP Pulse", type: MechType.Emp, damage: 45 },
      { name: "Railgun Salvo", type: MechType.Kinetic, damage: 30 },
      { name: "Plasma Beam", type: MechType.Beam, damage: 20 },
      { name: "Reactive Armor", type: "defense", damage: 0 },
    ],
  },
];

/** Default player mech (first in roster). */
export const PLAYER_MECH: Mech = MECH_ROSTER[0];

export const OPPONENT_MECH: Mech = {
  name: "Enemy Mech",
  type: MechType.Beam,
  hp: 100,
  maxHp: 100,
  codename: "VENOM BATTALION",
  role: "Tank",
  bio: "Heavy water-type defender with punishing counter-attacks.",
  skills: [
    { name: "Plasma Beam", type: MechType.Beam, damage: 30 },
    { name: "Railgun Salvo", type: MechType.Kinetic, damage: 40 },
    { name: "EMP Pulse", type: MechType.Emp, damage: 25 },
    { name: "Reactive Armor", type: "defense", damage: 0 },
  ],
};
