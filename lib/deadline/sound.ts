// Deadline sounds: tiny synth blips made with Web Audio (no files to load).
// One mute switch for the whole game, remembered on this device.

const KEY = "dl-muted";
let muted = false;
try { muted = typeof window !== "undefined" && window.localStorage.getItem(KEY) === "1"; } catch { /* storage blocked */ }
const listeners = new Set<() => void>();

export const soundStore = {
  subscribe(fn: () => void) { listeners.add(fn); return () => { listeners.delete(fn); }; },
  get: () => muted,
  set(next: boolean) {
    muted = next;
    try { window.localStorage.setItem(KEY, next ? "1" : "0"); } catch { /* storage blocked */ }
    listeners.forEach((fn) => fn());
    if (!next) unlock();
  },
};

let ctx: AudioContext | null = null;
function audio(): AudioContext | null {
  if (muted || typeof window === "undefined") return null;
  if (!ctx) {
    const C = window.AudioContext ?? (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
    if (!C) return null;
    ctx = new C();
  }
  if (ctx.state === "suspended") void ctx.resume();
  return ctx;
}

/** Phones only play sound after a tap: open the audio on the first one. */
export function unlock() { audio(); }

function tone(freq: number, at: number, dur: number, { type = "sine", vol = 0.12, to }: { type?: OscillatorType; vol?: number; to?: number } = {}) {
  const a = audio();
  if (!a) return;
  const t = a.currentTime + at;
  const o = a.createOscillator();
  const g = a.createGain();
  o.type = type;
  o.frequency.setValueAtTime(freq, t);
  if (to) o.frequency.exponentialRampToValueAtTime(to, t + dur);
  g.gain.setValueAtTime(0.0001, t);
  g.gain.exponentialRampToValueAtTime(vol, t + 0.012);
  g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
  o.connect(g).connect(a.destination);
  o.start(t);
  o.stop(t + dur + 0.02);
}

// Only six moments make a sound (Nathan's call: anything more is noise).
export const sfx = {
  /** The draft passes on (a right answer): a quick swoosh up. */
  pass: () => tone(520, 0, 0.14, { type: "triangle", vol: 0.07, to: 1040 }),
  /** A rare answer (+5 and up): a bright run; a perfect 7 adds a sparkle. */
  rare: (points: number) => {
    [783.99, 987.77, 1174.66, 1567.98].forEach((f, i) => tone(f, i * 0.06, 0.18, { type: "triangle", vol: 0.1 }));
    if (points >= 7) for (let i = 0; i < 5; i++) tone(2093 + i * 220, 0.28 + i * 0.045, 0.1, { vol: 0.04 });
  },
  /** An extension earned. */
  extension: () => { tone(880, 0, 0.1, { vol: 0.09 }); tone(1318.51, 0.09, 0.22, { vol: 0.09 }); },
  /** Someone lost a deadline (a lower second note when it knocks them out). */
  miss: (out: boolean) => {
    tone(180, 0, 0.32, { type: "sawtooth", vol: 0.07, to: 90 });
    if (out) tone(120, 0.3, 0.5, { type: "sawtooth", vol: 0.06, to: 55 });
  },
  /** The draft reaches you: a clear two-note "ding-ding", louder than the rest. */
  yourTurn: () => { tone(987.77, 0, 0.16, { vol: 0.14 }); tone(1318.51, 0.13, 0.28, { vol: 0.14 }); },
  /** A wrong or taken answer on your turn. */
  wrong: () => tone(260, 0, 0.12, { type: "square", vol: 0.04, to: 200 }),
};
