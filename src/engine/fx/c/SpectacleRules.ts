/**
 * Option C, "Spectacle Combat" (eye-candy options round, 2026-09-29): what one blow does to
 * the presentation, per game, per tier and under the accessibility flags.
 *
 * Pure: no DOM and no `three`, so vitest runs it in Node. The engine, the seeded RNG and the
 * ATB clock never see any of this; the presenter only asks the stage port to draw it.
 *
 * Game case: both, two skins. FFX (Chapters I and VII) is gold and calm: longer holds, round
 * gold streaks, gold foil. FFX-2 (Chapters IV and XVI) is pink and quick: shorter holds, crits
 * only, pink streaks with four-point glints, pink foil (`research/ffx-vs-ffx2-presentation.md`).
 */

import { demoStopMs, demoTrauma } from '../../motion/DemoHit.ts'; // `?motion=demo` (part 4): the stop and the shake grow with the blow
import type { PunchMode, StopMode } from '../../feel/FeelSwitch.ts'; // the motion program's feel switches (`?punch=`, `?hitstop=`)
import { shortStopMs } from '../../feel/HitStopShort.ts';
import { newPunchFraction } from '../../feel/PunchCurve.ts';

export type SpectacleGame = 'ffx' | 'ffx2';
export type SpectacleTier = 'full' | 'phone' | 'low';

/** The elements a spell layer exists for (C5). Everything else gets sparks only. */
export type SpellLayerKind = 'fire' | 'ice' | 'thunder' | 'water' | 'holy' | 'nova' | null;

export interface HitInfo {
  element?: string | undefined;
  crit: boolean;
  /** Crit, overkill, capped, or the finishing blow. */
  heavy: boolean;
  hitIndex: number;
  hitCount: number;
  /** The action is an Overdrive (FFX) or a boss / party Special (FFX-2). */
  big: boolean;
  /** A magical action: with no element it gets the `nova` layer (Flare, Ultima, non-elemental spells). */
  magic?: boolean;
  /** Playback speed; nothing holds at `fast` or `skip`. */
  speed: 'normal' | 'fast' | 'skip' | string;
  /**
   * This blow is the LAST ONE THE ACTION SHOWS, in the order the engine applied its hits (FFX only; `presenterHooks.ts#isLastShownBlow`). Since RC10 an action that hits several targets
   * replays its hits round by round, and a damage event keeps the index it was CALCULATED at, so `hitIndex >= hitCount - 1` is the last calculated hit: with unequal hit counts (Fire Fury over foes
   * taking five and two hits) that is the fourth blow of seven shown. Absent: no burst was at hand (a test rig), and the index rule stands. FFX-2 never reads it (its blows are shown in the order they
   * were calculated, and its accent keeps the index rule).
   */
  lastShown?: boolean | undefined;
  /** `?motion=demo` only (`motion/DemoHit.hitPower`): how hard the blow is, 0 to 1.5; absent reads as a middling blow. */
  power?: number | undefined;
  /** A foe's headline move (`feel/HitStopShort.isBossBigMove`): read by `?hitstop=short` and `?punch=new` only. */
  bossBig?: boolean | undefined;
  /** FFX-2: a command menu is open (`KeySlots.menuBlocks`); `?punch=new` plays no camera punch over it (D-316, the target frame hold). */
  menuOpen?: boolean | undefined;
}

export interface SpectacleFlags {
  tier: SpectacleTier;
  reduceMotion: boolean;
  reduceFlashes: boolean;
  /** Strength multipliers, 1 = as tuned (`?fxdial=`). */
  dial: (name: 'shake' | 'sparks' | 'impact' | 'spells' | 'hitstop') => number;
  /** `?motion=demo` (`motion/DemoMotion.ts`): the stop and the shake are the demo's (`motion/DemoHit.ts`); absent or false: as tuned. */
  demo?: boolean | undefined;
  /** The motion program's feel switches (`feel/FeelSwitch.feelFlags`, chapter-gated); absent = today's camera and stop. */
  feel?: { punch: PunchMode; stop: StopMode } | undefined;
}

export interface HitPlan {
  /** C1: the 2-frame ink/paper frame. 'full', 'soft' (REDUCE FLASHES: one ivory frame), or none. */
  impactFrame: 'full' | 'soft' | null;
  /** C2: presentation freeze in ms (0 = none). */
  freezeMs: number;
  /** C4: trauma added (0..1). */
  trauma: number;
  /** C4: a quick dolly kick, as a fraction of the camera distance (`kickMode` `today`) or of the struck figure's depth (`settle`). */
  kick: number;
  /** `today`: 90 ms in, 380 ms out, 9 world units per unit; `settle`: `?punch=new` (`feel/PunchCurve.ts`). */
  kickMode: 'today' | 'settle';
  /** C3: streak count (0 = today's burst only). */
  streaks: number;
  /** C3: one shock ring. */
  ring: boolean;
  /** C3: the colour cast onto the fighters near the blow, peak 0..1. */
  cast: number;
  /** C5: the element layer, or null. */
  spell: SpellLayerKind;
}

export interface GameTuning {
  /** FFX: 85 ms on heavy hits; FFX-2: 55 ms on crits only (ATB pace). */
  freezeHeavyMs: number;
  /** A shorter hold on an ordinary first hit: presentation only, the presenter does not wait for it. */
  freezeLightMs: number;
  traumaCrit: number;
  traumaHeavy: number;
  traumaBig: number;
  traumaLight: number;
  /** Trauma model: max offset (world units), max roll (degrees), noise frequency (Hz), decay per second. */
  shakeMax: number;
  rollMaxDeg: number;
  shakeHz: number;
  decay: number;
  streaksBase: number;
  streaksCrit: number;
  /** Streak palette: core and edge (linear RGB, may exceed 1 so the bloom takes them). */
  streakCore: [number, number, number];
  streakEdge: [number, number, number];
  ring: [number, number, number];
  /** C1 colours, 0..1 RGB. */
  ink: [number, number, number];
  paper: [number, number, number];
  edge: [number, number, number];
  /** Lightning glow (C5). */
  bolt: [number, number, number];
  /** The four-point glints at streak heads (FFX-2 only). */
  stars: boolean;
}

const hex = (h: number): [number, number, number] => [((h >> 16) & 255) / 255, ((h >> 8) & 255) / 255, (h & 255) / 255];

export const SPECTACLE_TUNING: Record<SpectacleGame, GameTuning> = {
  ffx: {
    freezeHeavyMs: 85,
    freezeLightMs: 40,
    traumaCrit: 0.55,
    traumaHeavy: 0.42,
    traumaBig: 0.75,
    traumaLight: 0.2,
    shakeMax: 0.16,
    rollMaxDeg: 1.6,
    shakeHz: 18,
    decay: 1.6,
    streaksBase: 34,
    streaksCrit: 56,
    streakCore: [2.0, 1.7, 1.1],
    streakEdge: [1.6, 0.9, 0.25],
    ring: [1.3, 1.0, 0.45],
    ink: hex(0x0b1020),
    paper: hex(0xfff6e0),
    edge: hex(0xe3b94a),
    bolt: hex(0xbfd8ff),
    stars: false,
  },
  ffx2: {
    freezeHeavyMs: 55,
    freezeLightMs: 28,
    traumaCrit: 0.5,
    traumaHeavy: 0.36,
    traumaBig: 0.8,
    traumaLight: 0.18,
    shakeMax: 0.2,
    rollMaxDeg: 2.2,
    shakeHz: 24,
    decay: 2.0,
    streaksBase: 38,
    streaksCrit: 60,
    streakCore: [2.0, 1.5, 1.85],
    streakEdge: [1.7, 0.45, 1.1],
    ring: [1.4, 0.55, 1.1],
    ink: hex(0x1a0b24),
    paper: hex(0xffe8f4),
    edge: hex(0xf7b6d9),
    bolt: hex(0xe7b6ff),
    stars: true,
  },
};

/** The engine's element names, folded onto the layers C5 draws. */
export function spellLayerOf(element: string | undefined): SpellLayerKind {
  switch (element) {
    case 'fire':
      return 'fire';
    case 'ice':
    case 'blizzard':
      return 'ice';
    case 'thunder':
    case 'lightning':
      return 'thunder';
    case 'water':
      return 'water';
    case 'holy':
      return 'holy';
    default:
      return null;
  }
}

/** Streak share per tier (the phone draws 60 %, Low effects keeps today's burst only). */
export const TIER_DENSITY: Record<SpectacleTier, number> = { full: 1, phone: 0.6, low: 0 };

/**
 * What one damage event does. The caller enforces the flash budget (at most one impact
 * frame per action and three per second) and the hit-stop's playback-speed rule.
 */
export function planHit(game: SpectacleGame, hit: HitInfo, f: SpectacleFlags): HitPlan {
  const t = SPECTACLE_TUNING[game];
  const normal = hit.speed === 'normal';
  const first = hit.hitIndex === 0;
  // The finishing blow of an Overdrive or Special. FFX: the last blow SHOWN (the engine replays a spread round by round, so the highest calculation index is not always the last one on screen);
  // FFX-2 and any caller that does not say: the highest index, as before.
  const last = game === 'ffx' && hit.lastShown !== undefined ? hit.lastShown : hit.hitIndex >= hit.hitCount - 1;
  // FFX holds on every heavy blow; FFX-2 only on a crit, and never on chain hits 2 and later.
  const holdsHeavy = game === 'ffx' ? hit.heavy : hit.crit && first;
  let freezeMs = 0;
  const facts = { crit: hit.crit, heavy: hit.heavy, big: hit.big, hitIndex: hit.hitIndex, hitCount: hit.hitCount, last, power: hit.power };
  const stopMode = f.feel?.stop ?? 'today';
  const punchMode = f.feel?.punch ?? 'today';
  if (normal && !f.reduceMotion && stopMode !== 'off') {
    if (stopMode === 'short') freezeMs = shortStopMs({ crit: hit.crit, big: hit.big, last, bossBig: hit.bossBig === true, hitIndex: hit.hitIndex, hitCount: hit.hitCount });
    else if (f.demo) freezeMs = demoStopMs(facts, t.freezeLightMs); // never lighter than today's own light hold (FFX 40 ms, FFX-2 28 ms)
    else if (holdsHeavy || (hit.big && last)) freezeMs = t.freezeHeavyMs;
    else if (first) freezeMs = t.freezeLightMs;
    freezeMs = Math.round(freezeMs * f.dial('hitstop'));
  }
  const wantsFrame = (hit.heavy && first) || (hit.big && last);
  const impactFrame = !wantsFrame || f.reduceMotion || f.dial('impact') <= 0 ? null : f.reduceFlashes ? 'soft' : 'full';
  const trauma = f.reduceMotion
    ? 0
    : Math.min(1, (f.demo ? demoTrauma(facts) : hit.big && last ? t.traumaBig : hit.crit ? t.traumaCrit : hit.heavy ? t.traumaHeavy : first ? t.traumaLight : t.traumaLight * 0.5) * f.dial('shake'));
  const density = TIER_DENSITY[f.tier] * f.dial('sparks');
  const streaks = Math.round((hit.crit || hit.heavy ? t.streaksCrit : t.streaksBase) * density * (hit.hitCount > 4 && !first ? 0.45 : 1));
  const spell = f.tier === 'low' || f.dial('spells') <= 0 ? null : (spellLayerOf(hit.element) ?? (hit.magic ? 'nova' : null));
  return {
    impactFrame,
    freezeMs,
    trauma,
    kick: f.reduceMotion || punchMode === 'off' ? 0 : punchMode === 'new' ? (hit.menuOpen === true ? 0 : newPunchFraction({ crit: hit.crit, heavy: hit.heavy, big: hit.big, last, bossBig: hit.bossBig === true, first })) : hit.crit || (hit.big && last) ? 0.05 : hit.heavy ? 0.035 : 0,
    kickMode: punchMode === 'new' ? 'settle' : 'today',
    streaks,
    ring: density > 0 && (first || hit.heavy),
    cast: f.tier === 'low' ? 0 : hit.heavy || hit.big ? 0.5 : 0.3,
    spell,
  };
}

/**
 * C6's splash mode: REDUCE MOTION, and REDUCE FLASHES (PR-0032: the slab slams in over 180 ms and a repeat is a 250 ms flash), take
 * the 200 ms static fade, every play. Otherwise a move's first play in a battle is the full splash and a repeat is the 250 ms flash.
 */
export function splashMode(f: Pick<SpectacleFlags, 'reduceMotion' | 'reduceFlashes'>, seen: boolean): 'full' | 'repeat' | 'calm' {
  return f.reduceMotion || f.reduceFlashes ? 'calm' : seen ? 'repeat' : 'full';
}

/** C1's flash budget: at most one impact frame per action and `perSecond` in any rolling second. */
export class FlashBudget {
  private readonly times: number[] = [];
  private lastAction = -1;

  constructor(private readonly perSecond = 3) {}

  /** True when an impact frame may play now for `action`; records it when it may. */
  take(nowMs: number, action: number): boolean {
    if (action >= 0 && action === this.lastAction) return false;
    while (this.times.length && nowMs - this.times[0]! > 1000) this.times.shift();
    if (this.times.length >= this.perSecond) return false;
    this.times.push(nowMs);
    this.lastAction = action;
    return true;
  }
}

/** C9: the victory arc. `pose` chapters orbit; `hold` (Chapter IV) only pushes in, sombre. */
export interface OrbitPlan {
  yawDeg: number;
  rise: number;
  push: number;
  ms: number;
  sparkleSweep: boolean;
}

export function planVictory(game: SpectacleGame, kind: 'pose' | 'hold', f: Pick<SpectacleFlags, 'tier' | 'reduceMotion'>, dial = 1): OrbitPlan | null {
  if (f.reduceMotion || dial <= 0) return null;
  if (kind === 'hold') return { yawDeg: 0, rise: 0, push: 0.03, ms: 1800, sparkleSweep: false };
  const yaw = (f.tier === 'phone' ? 8 : 12) * Math.min(1, dial);
  return game === 'ffx'
    ? { yawDeg: yaw, rise: 0.28, push: 0.07, ms: 2600, sparkleSweep: false }
    : { yawDeg: -yaw, rise: 0.28, push: 0.07, ms: 2200, sparkleSweep: true };
}

/** Smooth ease used by the orbit and the splash (0..1 -> 0..1). */
export function easeInOut(p: number): number {
  const x = Math.min(1, Math.max(0, p));
  return x < 0.5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2;
}
