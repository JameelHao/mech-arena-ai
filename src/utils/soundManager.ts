/**
 * Lightweight sound effects using Web Audio API synthesis.
 * No external audio files needed — all sounds are generated procedurally.
 */

let audioCtx: AudioContext | null = null;
let muted = false;

/** Initialize the AudioContext (call after user interaction on mobile). */
export function initSound(): void {
  try {
    audioCtx = new AudioContext();
  } catch {
    // Web Audio API not available — degrade silently
  }
}

/** Resume AudioContext if suspended (required after first user interaction on mobile). */
export function resumeSound(): void {
  if (audioCtx?.state === "suspended") {
    audioCtx.resume();
  }
}

export function setMuted(value: boolean): void {
  muted = value;
}

export function isMuted(): boolean {
  return muted;
}

function playTone(
  frequency: number,
  duration: number,
  type: OscillatorType = "square",
  volume = 0.15,
): void {
  if (muted || !audioCtx) return;

  const osc = audioCtx.createOscillator();
  const gain = audioCtx.createGain();
  osc.type = type;
  osc.frequency.value = frequency;
  gain.gain.setValueAtTime(volume, audioCtx.currentTime);
  gain.gain.exponentialRampToValueAtTime(
    0.001,
    audioCtx.currentTime + duration,
  );

  osc.connect(gain);
  gain.connect(audioCtx.destination);
  osc.start();
  osc.stop(audioCtx.currentTime + duration);
}

function playNoise(duration: number, volume = 0.1): void {
  if (muted || !audioCtx) return;

  const bufferSize = Math.floor(audioCtx.sampleRate * duration);
  const buffer = audioCtx.createBuffer(1, bufferSize, audioCtx.sampleRate);
  const data = buffer.getChannelData(0);
  for (let i = 0; i < bufferSize; i++) {
    data[i] = Math.random() * 2 - 1;
  }

  const source = audioCtx.createBufferSource();
  source.buffer = buffer;
  const gain = audioCtx.createGain();
  gain.gain.setValueAtTime(volume, audioCtx.currentTime);
  gain.gain.exponentialRampToValueAtTime(
    0.001,
    audioCtx.currentTime + duration,
  );

  source.connect(gain);
  gain.connect(audioCtx.destination);
  source.start();
}

/** Short click sound for button presses. */
export function playClickSound(): void {
  playTone(800, 0.05, "square", 0.08);
}

/** Attack sound with frequency based on skill type. */
export function playAttackSound(
  type: "kinetic" | "beam" | "emp" | "defense",
): void {
  const freqMap = { kinetic: 300, beam: 500, emp: 700, defense: 200 };
  const freq = freqMap[type] ?? 400;
  playTone(freq, 0.12, "sawtooth", 0.12);
  playTone(freq * 1.5, 0.08, "square", 0.06);
}

/** Impact sound on hit. */
export function playHitSound(): void {
  playNoise(0.1, 0.15);
  playTone(150, 0.08, "sine", 0.2);
}

/** Victory jingle — ascending tones. */
export function playVictorySound(): void {
  const notes = [523, 659, 784, 1047]; // C5 E5 G5 C6
  for (let i = 0; i < notes.length; i++) {
    setTimeout(() => playTone(notes[i], 0.15, "triangle", 0.12), i * 120);
  }
}

/** Defeat sound — descending tones. */
export function playDefeatSound(): void {
  const notes = [400, 350, 300, 200]; // descending
  for (let i = 0; i < notes.length; i++) {
    setTimeout(() => playTone(notes[i], 0.2, "sine", 0.1), i * 150);
  }
}
