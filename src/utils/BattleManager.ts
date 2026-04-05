/** BattleManager - Turn-based battle state machine */

import {
  type BattleState,
  type Mech,
  MechType,
  type Skill,
  TurnPhase,
} from "../types/game";

// Type effectiveness: Fire > Electric > Water > Fire (1.5x super, 0.5x weak)
const EFFECTIVENESS: Record<MechType, { strong: MechType; weak: MechType }> = {
  [MechType.Fire]: { strong: MechType.Electric, weak: MechType.Water },
  [MechType.Water]: { strong: MechType.Fire, weak: MechType.Electric },
  [MechType.Electric]: { strong: MechType.Water, weak: MechType.Fire },
};

const SUPER_EFFECTIVE_MULTIPLIER = 1.5;
const NOT_EFFECTIVE_MULTIPLIER = 0.5;

export class BattleManager {
  private state: BattleState;

  constructor() {
    this.state = this.createEmptyState();
  }

  /** Initialize a new battle with the given mechs */
  initBattle(player: Mech, opponent: Mech): BattleState {
    this.state = {
      player: { ...player, hp: player.maxHp },
      opponent: { ...opponent, hp: opponent.maxHp },
      phase: TurnPhase.PlayerTurn,
      log: [],
      turnCount: 1,
      winner: null,
    };
    this.addLog("Battle Start!");
    return this.getState();
  }

  /** Execute player's attack phase. Returns state after player attack + win check. */
  executePlayerAttack(skillIndex: number): BattleState {
    if (this.state.phase !== TurnPhase.PlayerTurn) return this.getState();
    if (skillIndex < 0 || skillIndex >= this.state.player.skills.length) {
      return this.getState();
    }

    const playerSkill = this.state.player.skills[skillIndex];
    const playerDmg = this.calculateDamage(
      playerSkill,
      this.state.player,
      this.state.opponent,
    );
    this.addLog(`${this.state.player.name} used ${playerSkill.name}!`);
    this.updateHP("opponent", playerDmg);
    if (playerSkill.type === "defense" || playerDmg === 0) {
      this.addLog(`[EFF]${this.state.player.name} raised defense!`);
    } else {
      this.addLog(
        `[DMG]${this.state.opponent.name} took ${playerDmg} damage! (HP: ${this.state.opponent.hp}/${this.state.opponent.maxHp})`,
      );
    }

    this.state.phase = TurnPhase.CheckWin;
    if (this.checkWin()) return this.getState();

    this.state.phase = TurnPhase.AiThinking;
    return this.getState();
  }

  /** Execute AI's attack phase with given skill index. */
  executeAiAttack(aiSkillIndex: number): BattleState {
    if (this.state.phase !== TurnPhase.AiThinking) return this.getState();
    const clampedIndex = Math.max(
      0,
      Math.min(aiSkillIndex, this.state.opponent.skills.length - 1),
    );

    this.state.phase = TurnPhase.AiTurn;
    const aiSkill = this.state.opponent.skills[clampedIndex];
    const aiDmg = this.calculateDamage(
      aiSkill,
      this.state.opponent,
      this.state.player,
    );
    this.addLog(`${this.state.opponent.name} used ${aiSkill.name}!`);
    this.updateHP("player", aiDmg);
    if (aiSkill.type === "defense" || aiDmg === 0) {
      this.addLog(`[EFF]${this.state.opponent.name} raised defense!`);
    } else {
      this.addLog(
        `[DMG]${this.state.player.name} took ${aiDmg} damage! (HP: ${this.state.player.hp}/${this.state.player.maxHp})`,
      );
    }

    this.state.phase = TurnPhase.CheckWin;
    if (this.checkWin()) return this.getState();

    this.state.turnCount++;
    this.addLog(`[TURN]--- Turn ${this.state.turnCount} ---`);
    this.state.phase = TurnPhase.PlayerTurn;
    return this.getState();
  }

  /** Get a random AI skill index (fallback when API unavailable) */
  getRandomAiSkill(): number {
    return Math.floor(Math.random() * this.state.opponent.skills.length);
  }

  /** Calculate damage with type effectiveness */
  calculateDamage(skill: Skill, _attacker: Mech, defender: Mech): number {
    if (skill.type === "defense" || skill.damage === 0) return 0;

    const effectiveness = this.checkTypeEffectiveness(
      skill.type as MechType,
      defender.type,
    );
    const damage = Math.round(skill.damage * effectiveness);
    if (effectiveness > 1) this.addLog("[SUP]It's super effective!");
    if (effectiveness < 1) this.addLog("[RES]It's not very effective...");
    return damage;
  }

  /** Check type effectiveness multiplier */
  checkTypeEffectiveness(attackType: MechType, defenderType: MechType): number {
    const info = EFFECTIVENESS[attackType];
    if (info.strong === defenderType) return SUPER_EFFECTIVE_MULTIPLIER;
    if (info.weak === defenderType) return NOT_EFFECTIVE_MULTIPLIER;
    return 1;
  }

  /** Apply damage to target mech */
  updateHP(target: "player" | "opponent", damage: number): void {
    const mech = this.state[target];
    mech.hp = Math.max(0, mech.hp - damage);
  }

  /** Append a message to the battle log */
  addLog(message: string): void {
    this.state.log.push(message);
  }

  /** Check if either mech is defeated. Returns true if battle is over. */
  checkWin(): boolean {
    if (this.state.opponent.hp <= 0) {
      this.state.winner = "player";
      this.state.phase = TurnPhase.BattleOver;
      this.addLog(`${this.state.opponent.name} was defeated!`);
      this.addLog(`[TURN]${this.state.player.name} wins!`);
      return true;
    }
    if (this.state.player.hp <= 0) {
      this.state.winner = "opponent";
      this.state.phase = TurnPhase.BattleOver;
      this.addLog(`${this.state.player.name} was defeated...`);
      this.addLog(`[TURN]${this.state.opponent.name} wins!`);
      return true;
    }
    return false;
  }

  /** Get a snapshot of the current state */
  getState(): BattleState {
    return { ...this.state };
  }

  private createEmptyState(): BattleState {
    const emptyMech: Mech = {
      name: "",
      type: MechType.Fire,
      hp: 0,
      maxHp: 0,
      skills: [],
    };
    return {
      player: emptyMech,
      opponent: { ...emptyMech },
      phase: TurnPhase.PlayerTurn,
      log: [],
      turnCount: 0,
      winner: null,
    };
  }
}
