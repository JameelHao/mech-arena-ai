/** Training scenario definitions for the Simulation Chamber. */

export interface TrainingScenario {
  id: string;
  name: string;
  icon: string;
  description: string;
  opponentHp: number;
  maxTurns: number;
}

export const TRAINING_SCENARIOS: TrainingScenario[] = [
  {
    id: "standard",
    name: "Standard Drill",
    icon: "\u2694\uFE0F",
    description: "3 rounds against a standard opponent",
    opponentHp: 100,
    maxTurns: 3,
  },
  {
    id: "damage",
    name: "Damage Test",
    icon: "\uD83D\uDCA5",
    description: "1 round against a weak target (30 HP)",
    opponentHp: 30,
    maxTurns: 1,
  },
  {
    id: "survival",
    name: "Survival Test",
    icon: "\uD83D\uDEE1\uFE0F",
    description: "3 rounds against a tough opponent (150 HP)",
    opponentHp: 150,
    maxTurns: 3,
  },
  {
    id: "endurance",
    name: "Endurance Run",
    icon: "\u23F1\uFE0F",
    description: "5 rounds — test long-term strategy",
    opponentHp: 100,
    maxTurns: 5,
  },
];
