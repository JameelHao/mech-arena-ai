/** Core game state types for Mech Arena AI */

export const MechType = {
  Fire: "fire",
  Water: "water",
  Electric: "electric",
} as const;

export type MechType = (typeof MechType)[keyof typeof MechType];

export const TurnPhase = {
  PlayerTurn: "PLAYER_TURN",
  AiThinking: "AI_THINKING",
  AiTurn: "AI_TURN",
  CheckWin: "CHECK_WIN",
  BattleOver: "BATTLE_OVER",
} as const;

export type TurnPhase = (typeof TurnPhase)[keyof typeof TurnPhase];

export interface Skill {
  name: string;
  type: MechType | "defense";
  damage: number;
}

export interface Mech {
  name: string;
  type: MechType;
  hp: number;
  maxHp: number;
  skills: Skill[];
}

export interface BattleState {
  player: Mech;
  opponent: Mech;
  phase: TurnPhase;
  log: string[];
  turnCount: number;
  winner: "player" | "opponent" | null;
}
