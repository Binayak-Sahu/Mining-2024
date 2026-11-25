"use client";

/**
 * STRATA studio audio — layered Web Audio synthesis (no asset files, works offline).
 *
 * Signal path for every sound:
 *   voice layers (oscillators / filtered noise) → per-layer ADSR gain → per-voice low-pass
 *   → bus gain → gentle compressor → dry (≈ 88 %) + short generated-IR convolution reverb (≈ 12 % wet)
 *   → master → speakers.
 * No oscillator ever reaches the output without an envelope and a filter. One AudioContext is created
 * lazily on the first user gesture and reused; it is resumed on later gestures if the browser
 * suspended it. The public API (`sfx.*`, `installGlobalSfx`) is unchanged from earlier phases.
 */
import { usePrefs } from "./prefs";

interface Engine {
  ac: AudioContext;
  bus: GainNode;
  noise: AudioBuffer;
}

let engine: Engine | null = null;

/** Exponentially decaying stereo noise → a small, soft room (≈ 0.9 s tail). */
function impulse(ac: AudioContext): AudioBuffer {
  const len = Math.floor(ac.sampleRate * 0.9);
  const buf = ac.createBuffer(2, len, ac.sampleRate);
  for (let ch = 0; ch < 2; ch++) {
    const d = buf.getChannelData(ch);
    let lp = 0;
    for (let i = 0; i < len; i++) {
      const t = i / ac.sampleRate;
      lp += 0.35 * ((Math.random() * 2 - 1) - lp); // one-pole low-pass: a darker, woodier room
      d[i] = lp * Math.exp(-t / 0.22) * (t < 0.004 ? t / 0.004 : 1);
    }
  }
  return buf;
}

function build(): Engine | null {
  if (typeof window === "undefined") return null;
  const AC = window.AudioContext ?? (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
  if (!AC) return null;
  const ac = new AC();
  const bus = ac.createGain();
  bus.gain.value = 0.7;
  const comp = ac.createDynamicsCompressor();
  comp.threshold.value = -20;
  comp.knee.value = 12;
  comp.ratio.value = 3;
  comp.attack.value = 0.003;
  comp.release.value = 0.15;
  const dry = ac.createGain();
  dry.gain.value = 0.88;
  const wet = ac.createGain();
  wet.gain.value = 0.12; // ≤ 15 % wet
  const verb = ac.createConvolver();
  verb.buffer = impulse(ac);
  const master = ac.createGain();
  master.gain.value = 0.9;
  bus.connect(comp);
  comp.connect(dry).connect(master);
  comp.connect(verb).connect(wet).connect(master);
  master.connect(ac.destination);
  const noise = ac.createBuffer(1, ac.sampleRate, ac.sampleRate);
  const nd = noise.getChannelData(0);
  for (let i = 0; i < nd.length; i++) nd[i] = Math.random() * 2 - 1;
  return { ac, bus, noise };
}

function audio(): Engine | null {
  if (usePrefs.getState().muted) return null;
  try {
    if (!engine) engine = build();
    if (engine && engine.ac.state === "suspended") void engine.ac.resume();
    return engine;
  } catch {
    return null;
  }
}

interface Env {
  a: number; // attack s
  d: number; // decay s
  s: number; // sustain level (0..1 of peak)
  r: number; // release s
  hold?: number; // time at sustain before release, s
}

/** Apply an ADSR envelope to a gain param; returns the end time. */
function adsr(g: GainNode, t0: number, peak: number, e: Env): number {
  const p = g.gain;
  const floor = 0.0001;
  const sus = Math.max(floor, peak * e.s);
  p.setValueAtTime(floor, t0);
  p.exponentialRampToValueAtTime(Math.max(floor, peak), t0 + e.a);
  p.exponentialRampToValueAtTime(sus, t0 + e.a + e.d);
  const relAt = t0 + e.a + e.d + (e.hold ?? 0);
  p.setValueAtTime(sus, relAt);
  p.exponentialRampToValueAtTime(floor, relAt + e.r);
  return relAt + e.r;
}

/** A voice = layers summed into one low-pass filter, then the bus. */
function voice(en: Engine, t0: number, cutoff: number, q = 0.7): BiquadFilterNode {
  const lp = en.ac.createBiquadFilter();
  lp.type = "lowpass";
  lp.frequency.setValueAtTime(cutoff, t0);
  lp.Q.value = q;
  lp.connect(en.bus);
  return lp;
}

function tone(en: Engine, out: AudioNode, t0: number, freq: number, peak: number, e: Env, type: OscillatorType = "sine", glideTo?: number) {
  const o = en.ac.createOscillator();
  const g = en.ac.createGain();
  o.type = type;
  o.frequency.setValueAtTime(freq, t0);
  if (glideTo) o.frequency.exponentialRampToValueAtTime(glideTo, t0 + e.a + e.d);
  const end = adsr(g, t0, peak, e);
  o.connect(g).connect(out);
  o.start(t0);
  o.stop(end + 0.02);
}

function noiseBurst(en: Engine, out: AudioNode, t0: number, peak: number, e: Env, band: { type: BiquadFilterType; f: number; q: number }) {
  const src = en.ac.createBufferSource();
  src.buffer = en.noise;
  src.playbackRate.value = 0.9 + Math.random() * 0.2;
  const bp = en.ac.createBiquadFilter();
  bp.type = band.type;
  bp.frequency.value = band.f;
  bp.Q.value = band.q;
  const g = en.ac.createGain();
  const end = adsr(g, t0, peak, e);
  src.connect(bp).connect(g).connect(out);
  src.start(t0, Math.random() * 0.5);
  src.stop(end + 0.02);
}

/**
 * Marimba-style bar: a warm fundamental, the bar's inharmonic 3.93× and 9.2× modes (which decay much
 * faster than the fundamental), and a soft felt-mallet transient.
 */
function marimba(en: Engine, t0: number, f: number, vel = 1) {
  const out = voice(en, t0, Math.min(7000, f * 7));
  tone(en, out, t0, f, 0.32 * vel, { a: 0.003, d: 0.55, s: 0.0005, r: 0.05 });
  tone(en, out, t0, f * 3.93, 0.09 * vel, { a: 0.002, d: 0.14, s: 0.0005, r: 0.03 });
  tone(en, out, t0, f * 9.2, 0.025 * vel, { a: 0.001, d: 0.05, s: 0.0005, r: 0.02 });
  noiseBurst(en, out, t0, 0.05 * vel, { a: 0.001, d: 0.012, s: 0.0005, r: 0.008 }, { type: "bandpass", f: f * 2.5, q: 1.2 });
}

/** Low, muted wooden thump: a pitch-dropping body tone plus a dark knock. No buzzer, no dissonance. */
function thump(en: Engine, t0: number, vel = 1) {
  const out = voice(en, t0, 650, 0.6);
  tone(en, out, t0, 150, 0.42 * vel, { a: 0.002, d: 0.16, s: 0.0005, r: 0.04 }, "sine", 92);
  tone(en, out, t0, 300, 0.08 * vel, { a: 0.002, d: 0.06, s: 0.0005, r: 0.02 }, "sine", 210);
  noiseBurst(en, out, t0, 0.12 * vel, { a: 0.001, d: 0.03, s: 0.0005, r: 0.02 }, { type: "lowpass", f: 420, q: 0.8 });
}

function vibrate(pattern: number | number[]) {
  if (usePrefs.getState().muted) return;
  try {
    navigator.vibrate?.(pattern);
  } catch {
    /* unsupported */
  }
}

let lastTick = 0;
const jitter = (amt: number) => 1 + (Math.random() * 2 - 1) * amt;

export const sfx = {
  /** Button press: a soft, low tactile switch thud (< 40 ms, quiet). */
  tap() {
    const en = audio();
    if (!en) return;
    const t0 = en.ac.currentTime + 0.001;
    const out = voice(en, t0, 1400, 0.7);
    tone(en, out, t0, 210 * jitter(0.04), 0.5, { a: 0.001, d: 0.022, s: 0.0005, r: 0.012 }, "sine", 140);
    noiseBurst(en, out, t0, 0.22, { a: 0.0008, d: 0.008, s: 0.0005, r: 0.006 }, { type: "bandpass", f: 900, q: 1 });
  },
  /** Slider / drag-grip detent: filtered noise burst + tiny resonant click (< 18 ms), ≤ 25 per second, jittered. */
  tick() {
    const now = performance.now();
    if (now - lastTick < 40) return;
    lastTick = now;
    const en = audio();
    if (!en) return;
    const t0 = en.ac.currentTime + 0.001;
    const out = voice(en, t0, 6500, 0.7);
    const v = 0.6 * jitter(0.15);
    noiseBurst(en, out, t0, 0.9 * v, { a: 0.0006, d: 0.006, s: 0.0005, r: 0.005 }, { type: "bandpass", f: 3200 * jitter(0.08), q: 2.5 });
    tone(en, out, t0, 2300 * jitter(0.08), 0.12 * v, { a: 0.0005, d: 0.009, s: 0.0005, r: 0.004 }, "triangle");
  },
  /** Correct / goal met: two marimba notes rising a fifth. */
  correct() {
    const en = audio();
    if (en) {
      const t0 = en.ac.currentTime + 0.005;
      marimba(en, t0, 659.25, 0.9);
      marimba(en, t0 + 0.09, 987.77, 1);
    }
    vibrate(18);
  },
  /** Wrong: a low, muted wooden thump. */
  wrong() {
    const en = audio();
    if (en) thump(en, en.ac.currentTime + 0.005, 1);
    vibrate([30, 40, 30]);
  },
  /** Heart lost: a softer, lower thump. */
  heart() {
    const en = audio();
    if (en) thump(en, en.ac.currentTime + 0.12, 0.4);
  },
  /** Codex / formula unlocked: a light marimba grace figure. */
  unlock() {
    const en = audio();
    if (!en) return;
    const t0 = en.ac.currentTime + 0.005;
    marimba(en, t0, 1046.5, 0.55);
    marimba(en, t0 + 0.07, 1318.5, 0.6);
  },
  /** Lesson / Boss / unit victory: a three-note marimba arpeggio (≤ 1.2 s including the tail). */
  fanfare() {
    const en = audio();
    if (en) {
      const t0 = en.ac.currentTime + 0.01;
      marimba(en, t0, 523.25, 0.85);
      marimba(en, t0 + 0.11, 659.25, 0.9);
      marimba(en, t0 + 0.22, 783.99, 1);
    }
    vibrate([20, 60, 20, 60, 40]);
  },
};

/** Names and descriptions for the sound test panel. */
export const SFX_PALETTE: { key: keyof typeof sfx; label: string; note: string }[] = [
  { key: "tick", label: "Slider / grip tick", note: "noise burst + resonant click, < 18 ms, ≤ 25/s, jittered" },
  { key: "tap", label: "Button press", note: "low tactile switch thud, < 40 ms" },
  { key: "correct", label: "Correct / goal met", note: "marimba, rising fifth" },
  { key: "wrong", label: "Wrong answer", note: "muted wooden thump" },
  { key: "heart", label: "Heart lost", note: "softer, lower thump" },
  { key: "unlock", label: "Codex unlock", note: "marimba grace figure" },
  { key: "fanfare", label: "Lesson / Boss victory", note: "three-note marimba arpeggio, ≤ 1.2 s" },
];

/**
 * One global listener gives every button, link and slider in the app tactile audio without touching
 * each component: taps on interactive elements click, slider drags tick. The first gesture also
 * creates/resumes the shared AudioContext.
 */
export function installGlobalSfx(): () => void {
  const onDown = (e: PointerEvent) => {
    const el = (e.target as HTMLElement | null)?.closest?.("button:not(:disabled), a[href], [role='button'], summary");
    if (el && !(el as HTMLElement).dataset.silent) sfx.tap();
    else if (engine && engine.ac.state === "suspended") void engine.ac.resume();
  };
  const onInput = (e: Event) => {
    const t = e.target as HTMLInputElement | null;
    if (t && t.type === "range") sfx.tick();
  };
  document.addEventListener("pointerdown", onDown, { passive: true });
  document.addEventListener("input", onInput, { passive: true });
  return () => {
    document.removeEventListener("pointerdown", onDown);
    document.removeEventListener("input", onInput);
  };
}
