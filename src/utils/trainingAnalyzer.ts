/**
 * Training analyzer — extracts stats and generates feedback from battle log.
 */

export interface TrainingSummary {
  attackCount: number;
  defenseCount: number;
  damageDealt: number;
  damageTaken: number;
  superEffectiveCount: number;
  resistedCount: number;
  suggestion: string;
}

/**
 * Analyze a battle log to produce training feedback.
 */
export function analyzeTraining(
  log: string[],
  coreName: string,
): TrainingSummary {
  let attackCount = 0;
  let defenseCount = 0;
  let damageDealt = 0;
  let damageTaken = 0;
  let superEffectiveCount = 0;
  let resistedCount = 0;

  for (const msg of log) {
    if (msg.includes("used") && msg.startsWith("[EFF]")) {
      if (msg.includes("raised defense") || msg.includes("Reactive Armor")) {
        defenseCount++;
      } else {
        attackCount++;
      }
    }
    if (msg.startsWith("[DMG]")) {
      const dmgMatch = msg.match(/(\d+) damage/);
      const dmg = dmgMatch ? Number.parseInt(dmgMatch[1], 10) : 0;
      if (msg.includes("Enemy") || msg.includes("opponent")) {
        damageDealt += dmg;
      } else {
        damageTaken += dmg;
      }
    }
    if (msg.startsWith("[SUP]")) superEffectiveCount++;
    if (msg.startsWith("[RES]")) resistedCount++;
  }

  const suggestion = generateSuggestion(
    coreName.toLowerCase(),
    attackCount,
    defenseCount,
    superEffectiveCount,
    resistedCount,
  );

  return {
    attackCount,
    defenseCount,
    damageDealt,
    damageTaken,
    superEffectiveCount,
    resistedCount,
    suggestion,
  };
}

function generateSuggestion(
  coreName: string,
  attacks: number,
  defenses: number,
  supers: number,
  _resists: number,
): string {
  const total = attacks + defenses;
  if (total === 0) return "Try running a longer training session.";

  const attackRatio = attacks / total;

  if (coreName === "aggressive") {
    if (attackRatio < 0.7) {
      return "Your Aggressive core used too many defenses. Focus on attack skills.";
    }
    if (supers > 0) {
      return "Good aggression! Type advantages are landing well.";
    }
    return "Solid attack focus. Try exploiting type matchups more.";
  }

  if (coreName === "defensive") {
    if (defenses === 0) {
      return "Your Defensive core never used defense. Consider adding Reactive Armor.";
    }
    if (attackRatio > 0.8) {
      return "Too aggressive for a Defensive core. Use more defensive skills.";
    }
    return "Good balance of defense and counter-attacks.";
  }

  // Balanced
  if (attackRatio > 0.9) {
    return "Your Balanced core is too attack-heavy. Mix in some defense.";
  }
  if (attackRatio < 0.4) {
    return "Your Balanced core is too defensive. Try more attacks.";
  }
  return "Well-balanced approach. Keep mixing offense and defense.";
}
