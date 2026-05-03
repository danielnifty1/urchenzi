/**
 * Notification tones via Web Audio (no asset files). One-shots respect a minimum gap
 * between plays. Repeating rings use a separate timer and ignore that gap.
 */

export type NotificationSoundKind =
  | "alert"
  | "assignment"
  | "other"
  | "error"
  | "status";

let audioCtx: AudioContext | null = null;
let lastPlayAt = 0;
const MIN_GAP_MS = 380;

/** Time between scheduling each full ring cycle (4 bursts). */
const RING_CYCLE_MS = 3400;

let ringTimeoutId: ReturnType<typeof setTimeout> | null = null;
let ringActiveKind: "assignment" | "alert" | null = null;

function getContext(): AudioContext | null {
  if (typeof window === "undefined") return null;
  if (!audioCtx) {
    try {
      audioCtx = new AudioContext();
    } catch {
      return null;
    }
  }
  return audioCtx;
}

async function ensureRunning(ctx: AudioContext): Promise<void> {
  if (ctx.state === "suspended") {
    try {
      await ctx.resume();
    } catch {
      /* autoplay policy may block until user gesture */
    }
  }
}

function tone(
  ctx: AudioContext,
  startTime: number,
  freq: number,
  durationSec: number,
  peakGain: number,
): void {
  const osc = ctx.createOscillator();
  const g = ctx.createGain();
  osc.type = "sine";
  osc.frequency.setValueAtTime(freq, startTime);
  g.gain.setValueAtTime(0, startTime);
  g.gain.linearRampToValueAtTime(peakGain, startTime + 0.012);
  g.gain.exponentialRampToValueAtTime(0.0008, startTime + durationSec);
  osc.connect(g);
  g.connect(ctx.destination);
  osc.start(startTime);
  osc.stop(startTime + durationSec + 0.04);
}

/** Several “ring ring” bursts: alternating two-tone trills with gaps (new order / rider job). */
function repeatedRinging(
  ctx: AudioContext,
  t0: number,
  highHz: number,
  lowHz: number,
  bursts: number,
): void {
  const step = 0.1;
  const gapBetweenBursts = 0.38;
  let t = t0;
  for (let b = 0; b < bursts; b++) {
    tone(ctx, t, highHz, step, 0.1);
    t += step + 0.02;
    tone(ctx, t, lowHz, step, 0.095);
    t += step + 0.02;
    tone(ctx, t, highHz, step, 0.1);
    t += step + 0.02;
    tone(ctx, t, lowHz, step, 0.095);
    t += step + gapBetweenBursts;
  }
}

/**
 * Stops the repeating ring loop started by {@link startRepeatingRing} (if any).
 */
export function stopRepeatingRing(): void {
  ringActiveKind = null;
  if (ringTimeoutId !== null) {
    clearTimeout(ringTimeoutId);
    ringTimeoutId = null;
  }
}

/**
 * Loops the long ring pattern until {@link stopRepeatingRing} is called.
 * Idempotent: if the same kind is already looping, does nothing.
 */
export function startRepeatingRing(kind: "assignment" | "alert"): void {
  if (ringActiveKind === kind && ringTimeoutId !== null) {
    return;
  }
  stopRepeatingRing();
  ringActiveKind = kind;

  const highHz = kind === "assignment" ? 1040 : 880;
  const lowHz = kind === "assignment" ? 780 : 620;

  const playCycle = () => {
    if (ringActiveKind !== kind) return;
    const ctx = getContext();
    if (!ctx) {
      ringTimeoutId = setTimeout(playCycle, RING_CYCLE_MS);
      return;
    }
    void ensureRunning(ctx);
    repeatedRinging(ctx, ctx.currentTime, highHz, lowHz, 4);
    ringTimeoutId = setTimeout(playCycle, RING_CYCLE_MS);
  };

  playCycle();
}

/**
 * Plays a short beep. Safe to call from effects; failures are ignored.
 */
export function playNotificationSound(kind: NotificationSoundKind): void {
  const now = Date.now();
  if (now - lastPlayAt < MIN_GAP_MS) return;
  lastPlayAt = now;

  const ctx = getContext();
  if (!ctx) return;
  void ensureRunning(ctx);

  const t = ctx.currentTime;
  switch (kind) {
    case "assignment":
      repeatedRinging(ctx, t, 1040, 780, 2);
      break;
    case "alert":
      repeatedRinging(ctx, t, 880, 620, 2);
      break;
    case "other":
      tone(ctx, t, 523, 0.14, 0.07);
      break;
    case "error":
      tone(ctx, t, 220, 0.18, 0.11);
      tone(ctx, t + 0.2, 165, 0.22, 0.09);
      break;
    case "status":
      tone(ctx, t, 523, 0.06, 0.055);
      break;
    default:
      tone(ctx, t, 440, 0.08, 0.06);
  }
}
