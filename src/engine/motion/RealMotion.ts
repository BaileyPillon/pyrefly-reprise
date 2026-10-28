/**
 * THE REAL GAME'S NUMBERS, READ FOR THE ENGINE (conference demo, integration 2, 2026-10-22; Bailey's decision 179: "Timing + camera now, full later": by Sunday every demo action takes its
 * wind-up, contact and recovery timing from the real game's clips). Pure: no `three`, no DOM, no clock. The table is `data/motion/realMotion.ts` (generated, FFX and FFX-2 each their own);
 * this file answers, for a game and a figure's art id, "what does the real game do here", for the five things `?curves=real` and `?curves=real-snappy` change:
 *
 * - the ATTACK ({@link realStrikeProfile}): a `StrikeProfile` the house sampler plays (`StrikeCurve.resolveStrike`, `RealStrike.ts`), with the real phases (`real`) or the same phases scaled to
 *   Bailey's "about 1.1 s" pick (`snappy`, the real proportions kept), the real arcs (Tidus leaps 21 percent of his height and returns in a flip; Yuna, Auron and Kimahri crouch, no leap) and
 *   the leaping approach and return;
 * - the CAST ({@link realCastOf}): the wind-up the caster rises over and the lift's height; the lift is HELD until the spell lands (`CurveDriver.LiftChannel`, as with the house curves);
 * - the HIT ({@link realHitMs}): how long the hit reaction lasts;
 * - the KNOCK-OUT ({@link realKoHoldMs}): when the body reaches the floor;
 * - the VICTORY ({@link realVictoryOf}): how long the crouch and the spring take.
 *
 * `real` = the real speed (party attacks 1.5 to 2.9 s, bosses 4.2 to 4.7 s: no heft stretch on top); `snappy` = the same proportions at about 1.1 s (a boss's heft stretch stays: about 1.5 s).
 * Casts, hits, knock-outs and victories have no 1.1 s pick (Bailey's pick covers attacks only): both modes read them real.
 *
 * Game cases (AGENTS.md rule 14): `ffx` is FFX only (Chapter I), `ffx2` FFX-2 only (Chapter IV); a figure the table has no row for answers undefined and the house curves (`?curves=new`) play it.
 */
import { REAL_MOTION, type RealAttackRow, type RealPhases, type RealCastRow, type RealGame, type RealKoRow, type RealRow, type RealVictoryRow } from '../../data/motion/realMotion.ts';
import type { CurveGame, RealKind } from './CurvesSwitch.ts';
import { moveWord } from './MoveSwitch.ts'; // MF-14 V3 (`?strikeshape=travel`): the dash keeps the house travel at the 1.1 s pick
import { PROFILES, REAL_MIN_MS, defaultPaceFactor, heftFactors, type StrikeProfile } from './StrikeCurve.ts';

/** An attack whose real approach lifts the hip this much of the figure's height or more leaps (Tidus .21, Wakka .26, Seymour .24, Bahamut .14); below it the figure crouches into the lunge. */
export const APPROACH_LEAP_MIN = 0.1;
/** A real return that lifts the hip this much or more is a leap back (Tidus .86, Yuna .54, Kimahri .49, Bahamut .37, Rikku .35, Paine .14); below it the house return plays. */
export const RETURN_LEAP_MIN = 0.1;

/** The real-motion key of a figure by its art id (`tidus`, `yuna-white-mage`, `seymour-flux`, `ffx2-bahamut`...), per game; undefined for a figure the table does not cover. */
export function realKeyOf(artId: string | undefined, game: RealGame): string | undefined {
  if (!artId) return undefined;
  const id = artId.toLowerCase();
  if (game === 'ffx') {
    for (const k of ['tidus', 'yuna', 'auron', 'kimahri', 'wakka', 'lulu']) if (id === k || id.startsWith(`${k}-`)) return k;
    return id.startsWith('seymour-flux') ? 'seymourFlux' : undefined;
  }
  for (const k of ['yuna', 'rikku', 'paine']) if (id === k || id.startsWith(`${k}-`)) return k;
  return id === 'bahamut' || id.endsWith('-bahamut') || id.startsWith('bahamut') ? 'bahamut' : undefined;
}

/** The table's row for a figure (by art id) in a game, or undefined. */
export function realRowOf(game: RealGame, artId: string | undefined): RealRow | undefined {
  const key = realKeyOf(artId, game);
  return key ? REAL_MOTION[game][key] : undefined;
}

/** The global gain on the real lifts (`?realarc=0..1.5`, default 1: the real arcs). A capture or the driver can dial a flip down without a rebuild. */
export function realArcGainFromSearch(search: string | undefined): number {
  if (search === undefined) return 1;
  try {
    const raw = new URLSearchParams(search).get('realarc');
    if (raw === null || raw.trim() === '') return 1;
    const v = Number(raw);
    return Number.isFinite(v) && v >= 0 && v <= 1.5 ? v : 1;
  } catch {
    return 1;
  }
}

let gain: number | null = null;
/** The gain as the page asked for it; read once. */
export function realArcGain(): number {
  if (gain === null) gain = realArcGainFromSearch(globalThis.location === undefined ? undefined : (globalThis.location.search ?? ''));
  return gain;
}
/** Tests and `window.__pyrefly`: force the gain (`null` reads the address again). */
export function setRealArcGain(v: number | null): void {
  gain = v;
}

/** MF-14 V3: the wind-up and the hold of a house-travel strike are at least this long, ms (the plan's "300 ms or more"); the return and the settle pay for them. */
export const TRAVEL_MIN_MS = 300;
/** MF-14 V3: the return and the settle keep at least this share of the move's total when the wind-up, the travel and the hold are paid. */
export const TRAVEL_REST_SHARE = 0.2;
/** MF-14 V3: of that rest, the settle (a quiet phase) pays first: it keeps at most this share of the move's total, and the return keeps its 1.1 s length when the rest allows. */
export const TRAVEL_SETTLE_FLOOR = 0.06;

/** MF-14 V3 is on: the 1.1 s pick with the house dash (`?strikeshape=travel`, the default since release 67; `?strikeshape=today` is the clip's own dash). Only the 1.1 s pick reads it, so it acts exactly where `?curves=real-snappy` plays. */
export const houseTravel = (kind: RealKind): boolean => kind === 'snappy' && moveWord('strikeshape') === 'travel';

/**
 * The phases of a real attack in a mode. `real`: the clips'. `snappy`: the same proportions at 1.1 s, which gives a quick swing (Paine's travel is 34 ms: 228 px in one frame at 2,560 wide). With
 * `?strikeshape=travel` (MF-14 V3, the default since release 67, only at the 1.1 s pick, both games): the same total, the dash kept at the game's house travel and ease (FFX 250 ms, FFX-2 200), the wind-up at least 300 ms, the hold 300, and the
 * return and the settle paying for it, never under a fifth of the total, the settle first (the way home keeps the length it has at the 1.1 s pick when it can, so V3 does not trade a slow dash for a
 * faster flight home: Paine's return at 118 ms was a 47 px frame in the first capture). Pure; `today` and the real speed return the row's phases untouched.
 *
 * **What "the dash" is for a figure whose clip leaps** (`row.arc >= APPROACH_LEAP_MIN`: Tidus, Wakka, Seymour Flux, Bahamut): `travelMs` is still the house 250 or 200, but `RealStrike.realPre` plays the arc and the x path
 * over wind-up PLUS travel as one leap (no separate stand-and-pull-back, then dash), so for them the visible approach is `windupMs + travelMs`: Tidus 558 ms (about half a second), Seymour Flux 564, Bahamut 555 (before the heft stretch), and
 * the dash itself is the clip's recorded path over that span (the CP-05 card reads about 25 px a 60 Hz frame at 2,560 wide for Tidus). The 308 / 250 pair reads as a wind-up and a dash only for a figure that crouches into the lunge (Yuna, Auron, Kimahri, Lulu; every FFX-2 girl).
 */
export function phasesOf(game: CurveGame, row: RealAttackRow, kind: RealKind): RealPhases {
  if (kind !== 'snappy') return row.real;
  const ph = row.snappy;
  if (!houseTravel(kind)) return ph;
  const total = ph.windupMs + ph.travelMs + ph.holdMs + ph.returnMs + ph.settleMs;
  const windupMs = Math.max(ph.windupMs, TRAVEL_MIN_MS);
  const travelMs = PROFILES[game].travelMs;
  const rest = Math.max(TRAVEL_REST_SHARE * total, total - windupMs - travelMs - TRAVEL_MIN_MS);
  const holdMs = Math.max(0, Math.round(total - windupMs - travelMs - rest));
  const settleFloor = Math.min(ph.settleMs, TRAVEL_SETTLE_FLOOR * total);
  const returnMs = Math.max(0, Math.round(Math.min(ph.returnMs, rest - settleFloor)));
  return { windupMs, travelMs, holdMs, returnMs, settleMs: Math.round(rest) - returnMs };
}

/** The strike profile of a real attack: the game's own house profile with the table's durations, arcs and shapes over it. `kind` picks the real speed or the 1.1 s scale. */
export function profileOfRow(game: CurveGame, row: RealAttackRow, kind: RealKind): StrikeProfile {
  const ph = phasesOf(game, row, kind);
  const approach = row.arc >= APPROACH_LEAP_MIN;
  const leapBack = row.returnArc >= RETURN_LEAP_MIN && row.returnProfile !== undefined;
  return {
    ...PROFILES[game],
    windupMs: ph.windupMs,
    travelMs: ph.travelMs,
    holdMs: ph.holdMs,
    returnMs: ph.returnMs,
    settleMs: ph.settleMs,
    arc: row.arc,
    arcApex: row.arcApex,
    returnArc: row.returnArc,
    bias: houseTravel(kind) ? PROFILES[game].bias : row.bias, // V3: the house dash's ease too (the real clips' bias is 4 for most rows, a burst at the end of the travel)
    real: {
      approach,
      ...(approach && row.approachProfile ? { approachProfile: row.approachProfile } : {}),
      ...(approach && row.xApproach ? { xApproach: row.xApproach } : {}),
      ...(leapBack && row.returnProfile ? { returnProfile: row.returnProfile } : {}),
      ...(leapBack && row.xReturn ? { xReturn: row.xReturn } : {}),
      exactTime: kind === 'real',
    },
  };
}

/** The real attack profile of a figure (by art id) in this game, or undefined when the table has none for it (the house curves play). */
export function realStrikeProfile(game: CurveGame, artId: string | undefined, kind: RealKind): StrikeProfile | undefined {
  const row = realRowOf(game, artId)?.attack;
  return row ? profileOfRow(game, row, kind) : undefined;
}

/**
 * The strike's contact, ms at timeScale 1 and pace 1 (what `StrikeBeat.strikeBeatNow` and the contact beat's caps are written in): wind-up plus travel of the profile, a heavy body's heft stretch
 * only where the profile has not already got the real times, divided by the game's default pace (the profile's milliseconds are on screen at it).
 */
export function contactMsOf(profile: StrikeProfile, heft = 0): number {
  const stretch = profile.real?.exactTime ? 1 : heftFactors(heft).time;
  const floor = profile.real ? REAL_MIN_MS : 0;
  return Math.round(((Math.max(floor, profile.windupMs * stretch) + Math.max(floor, profile.travelMs * stretch)) / defaultPaceFactor(profile.game)));
}

/** How long a strike of this profile holds at the contact at least, ms at timeScale 1 and pace 1 (the contact beat's hold cap grows by it). */
export function holdMsOf(profile: StrikeProfile, heft = 0): number {
  const stretch = profile.real?.exactTime ? 1 : heftFactors(heft).hold;
  return Math.round((profile.holdMs * stretch) / defaultPaceFactor(profile.game));
}

/** The real cast of a figure: the wind-up, the hit's offset in the release clip, the lift's height (a share of the figure's height). */
export function realCastOf(game: CurveGame, artId: string | undefined): RealCastRow | undefined {
  return realRowOf(game, artId)?.cast;
}

/** How long the real hit reaction lasts (the recovery's end, else the whole clip), ms; undefined when the table has none. */
export function realHitMs(game: CurveGame, artId: string | undefined): number | undefined {
  const h = realRowOf(game, artId)?.hit;
  return h?.recoveryEndMs ?? h?.totalMs;
}

/** The real knock-out of a figure. */
export function realKoOf(game: CurveGame, artId: string | undefined): RealKoRow | undefined {
  return realRowOf(game, artId)?.ko;
}

/**
 * How long the standing figure buckles before the body reaches the floor, ms (the house buckle is 220 ms in FFX and 170 in FFX-2): the real floor impact, less the cross to the lying painting.
 * Undefined when the table has no knock-out for the figure.
 */
export function realKoHoldMs(game: CurveGame, artId: string | undefined, crossMs: number): number | undefined {
  const impact = realKoOf(game, artId)?.floorImpactMs;
  return impact === undefined ? undefined : Math.max(0, impact - Math.max(0, crossMs));
}

/** The real victory pose of a figure (the crouch, then the spring to its highest). */
export function realVictoryOf(game: CurveGame, artId: string | undefined): RealVictoryRow | undefined {
  return realRowOf(game, artId)?.victory;
}
