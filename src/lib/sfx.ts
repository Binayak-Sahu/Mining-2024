"use client";

/**
 * Tactile sound design, synthesised live with the Web Audio API (no audio files, works offline).
 * Every cue is short, soft and pitched on a pentatonic scale so stacked cues never clash.
 */
import { usePrefs } from "./prefs";

let ctx: AudioContext | null = null;
let master: GainNode | null = null;

function audio(): { ac: AudioContext; out: GainNode } | null {
  if (typeof window === "undefined") return null;
  if (usePrefs.getState().muted) return null;
  try {
    if (!ctx) {
      const AC = window.AudioContext ?? (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
      if (!AC) return null;
      ctx = new AC();
      master = ctx.createGain();
      master.gain.value = 0.55;
      const comp = ctx.createDynamicsCompressor();
      master.connect(comp).connect(ctx.destination);
    }
    if (ctx.state === "suspended") void ctx.resume();
    return { ac: ctx, out: master! };
  } catch {
    return null;
  }
}

function tone(freq: number, start: number, dur: number, opts: { type?: OscillatorType; gain?: number; glide?: number } = {}) {
  const a = audio();
  if (!a) return;
  const { ac, out } = a;
  const t0 = ac.currentTime + start;
  const osc = ac.createOscillator();
  const g = ac.createGain();
  osc.type = opts.type ?? "sine";
  osc.frequency.setValueAtTime(freq, t0);
  if (opts.glide) osc.frequency.exponentialRampToValueAtTime(freq * opts.glide, t0 + dur);
  const peak = opts.gain ?? 0.2;
  g.gain.setValueAtTime(0.0001, t0);
  g.gain.exponentialRampToValueAtTime(peak, t0 + 0.008);
  g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
  osc.connect(g).connect(out);
  osc.start(t0);
  osc.stop(t0 + dur + 0.02);
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

export const sfx = {
  /** Soft key-press click for buttons and tiles. */
  tap() {
    tone(1180, 0, 0.045, { type: "triangle", gain: 0.07, glide: 0.6 });
  },
  /** Detent tick while dragging a slider (rate-limited). */
  tick() {
    const now = performance.now();
    if (now - lastTick < 45) return;
    lastTick = now;
    tone(2100, 0, 0.025, { type: "square", gain: 0.018 });
  },
  /** Major-triad chime for a correct answer. */
  correct() {
    tone(659.25, 0, 0.16, { type: "triangle", gain: 0.16 });
    tone(830.61, 0.07, 0.18, { type: "triangle", gain: 0.14 });
    tone(987.77, 0.14, 0.32, { type: "sine", gain: 0.16 });
    vibrate(18);
  },
  /** Low, muted double-thud for a mistake. */
  wrong() {
    tone(196, 0, 0.16, { type: "sawtooth", gain: 0.06, glide: 0.8 });
    tone(155, 0.11, 0.22, { type: "sawtooth", gain: 0.06, glide: 0.8 });
    vibrate([30, 40, 30]);
  },
  /** Rising arpeggio when something is unlocked or a stage completes. */
  unlock() {
    [523.25, 659.25, 783.99, 1046.5].forEach((f, i) => tone(f, i * 0.06, 0.22, { type: "triangle", gain: 0.11 }));
  },
  /** Fanfare chord for finishing a lesson / boss. */
  fanfare() {
    [392, 523.25, 659.25].forEach((f) => tone(f, 0, 0.5, { type: "triangle", gain: 0.1 }));
    [523.25, 659.25, 783.99, 1046.5].forEach((f, i) => tone(f, 0.22 + i * 0.08, 0.6, { type: "sine", gain: 0.12 }));
    vibrate([20, 60, 20, 60, 40]);
  },
  /** Heart lost. */
  heart() {
    tone(440, 0, 0.12, { type: "square", gain: 0.05, glide: 0.5 });
  },
};

/**
 * One global listener gives every button, link and slider in the app tactile audio without touching
 * each component: taps on interactive elements click, slider drags tick.
 */
export function installGlobalSfx(): () => void {
  const onDown = (e: PointerEvent) => {
    const el = (e.target as HTMLElement | null)?.closest?.("button:not(:disabled), a[href], [role='button'], summary");
    if (el && !(el as HTMLElement).dataset.silent) sfx.tap();
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
