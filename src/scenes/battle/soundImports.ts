/**
 * Re-exports from soundManager and storage to avoid repetitive imports
 */

export {
  isMuted,
  playDefeatSound,
  playVictorySound,
  resumeSound,
  setMuted,
} from "../../utils/soundManager";

export {
  loadSettings,
  saveSettings,
} from "../../utils/storage";

// playClickSound is used in BattleScene directly, not re-exported here
