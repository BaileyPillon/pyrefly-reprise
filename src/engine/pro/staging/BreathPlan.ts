/**
 * THE HELD BREATH, THE PLAN (lane "pro-staging"; Bailey 2026-10-22: boss big moves "Held breath, full painting": "before a big blow the arena drains toward ivory and the party stays clear"). Pure: one function of
 * the clock gives every layer's strength, so the picture is the same at 60 and 144 Hz and a test can read it at any instant. The DOM layer (`ui/common/proStage/BreathView.ts`) only draws what this says.
 *
 * The four beats, as the options book's storyboard (`boss-attack-intro/attack-story-A-*.jpg`) drew them, all `[ours]` (the sources give a move no staging; the TIMES of the move are the game's own and nothing here
 * adds to them):
 *  - MARK  (the wind-up starts): a small name and a warm rim under the boss, which stay on while the party acts;
 *  - TELL  (the last 0.5 to 1.3 s before the first blow: the effect's own lead-in, `vfx.land`'s `ms`): the arena drains to ivory, a ring gathers on the floor, light flows into the boss, the HUD sinks to a sixth;
 *  - BLOW  (the first mark lands; feel's hit-stop, punch and rumble fire on the same beat, `BattlePresenterBossFx.bigBlow`): the core flashes white, the ring pulses; Mega Flare's flood opens with a window around the
 *    party; the wash holds while the rounds land;
 *  - LIFT  (the action ends): the wash lifts, the HUD returns with the new HP.
 */

export type BreathGame = 'ffx' | 'ffx2';

/** The clock marks of one staged move, in milliseconds on the layer's own clock (`performance.now()`); null = that beat has not come. */
export interface BreathMarks {
  markAt: number | null;
  tellAt: number | null;
  /** How long the tell runs: from `tellAt` to the first blow. */
  tellMs: number;
  blowAt: number | null;
  liftAt: number | null;
  game: BreathGame;
  /** Mega Flare opens a flood at the blow; Total Annihilation does not. */
  flood: boolean;
  /** REDUCE FLASHES: the wash is capped at 35 percent of its excursion, the flash is a glow at most and the flood is capped (the flash and the flood are ivory, never white: the view reads this). */
  tame: boolean;
  /** REDUCE MOTION: the ring does not travel (it fades in at its final size) and the motes do not drift (the view reads it); the light still changes. */
  calm?: boolean;
}

/** One frame's strengths, every one 0 to 1 (ring `scale` is a multiple of its resting size). */
export interface BreathFrame {
  /** The small name and the rim under the boss. */
  name: number;
  /** The ivory wash over the arena, with the windows cut for the figures that keep their colour. */
  drain: number;
  /** The HUD's strength: 1 normal, 0.17 at the tell's end ("a sixth"). */
  hud: number;
  /** The floor ring's opacity, and its size as a multiple of its final size (it gathers inward). */
  ring: number;
  ringScale: number;
  /** The share of the light that has flowed into the boss (the motes' travel), 0 to 1. */
  inflow: number;
  /** The white-hot core on the boss's chest, and the flash at the blow. */
  core: number;
  flash: number;
  /** Mega Flare's flood: its spread from the chest and its strength. */
  flood: number;
  /** Is any layer alive this frame? False when the move is over and everything has settled. */
  alive: boolean;
}

export const smooth = (x: number): number => {
  const t = x <= 0 ? 0 : x >= 1 ? 1 : x;
  return t * t * (3 - 2 * t);
};
const clamp01 = (x: number): number => (x <= 0 ? 0 : x >= 1 ? 1 : x);
const easeOut = (x: number): number => 1 - Math.pow(1 - clamp01(x), 3);

/** How far the HUD sinks: to a sixth of its strength. */
export const HUD_SINK_TO = 1 / 6;
/**
 * FFX-2, D-357 and D-441 ("nothing plays over an open command menu", `KeySlots.menuBlocks`): while a girl's menu is open the wash, the HUD's sink, the flood and the flash are held off completely (`menuHold` 1) and the
 * name, the ring and the core still play; the layer eases `menuHold` in and out over {@link MENU_EASE_MS} each way so a menu that opens or closes in the middle of a breath does not pop. (An earlier build played a
 * "restrained" breath over the menu: the review found it contradicted the rule, which stands until Bailey says otherwise.)
 */
export const MENU_EASE_MS = 260;
/** REDUCE FLASHES: the wash peaks at 35 percent (`flashRules.FLASH_PEAK_CAP`) of the full veil's 0.8: 0.35 / 0.8. */
export const TAME_WASH = 0.4375;
/** The wash's strength at its fullest in a tell, and while the rounds land (the veil's own alpha is this times the colour's). */
export const DRAIN_TELL = 1;
export const DRAIN_HOLD = 0.92;
/** The longest and the shortest a tell is allowed to be, ms: the effect's lead-in decides within these. */
export const TELL_MIN_MS = 450;
export const TELL_MAX_MS = 1500;
/** How long the lift takes, ms; the HUD comes back over the same time. */
export const LIFT_MS = 700;
/** The flood: rise, and how long it holds before it settles to the wash, ms. */
export const FLOOD_RISE_MS = 140;
export const FLOOD_HOLD_MS = 380;
export const FLOOD_FALL_MS = 900;
/** The white flash at the blow. */
export const FLASH_MS = 230;
/** A guard: a staged move that never lifts is let go this long after its blow, ms. */
export const BREATH_GUARD_MS = 9000;

/** The tell's length for an effect that says it lands in `msToBlow`: all of its lead-in, inside the bounds. */
export function tellLength(msToBlow: number): number {
  if (!Number.isFinite(msToBlow)) return TELL_MAX_MS;
  return Math.max(TELL_MIN_MS, Math.min(TELL_MAX_MS, msToBlow));
}

/** The frame at `now`. `menuHold` (0 to 1) is how far an open FFX-2 command menu holds the wash, the HUD sink, the flood and the flash off (see {@link MENU_EASE_MS}). Pure. */
export function breathFrame(now: number, m: BreathMarks, menuHold = 0): BreathFrame {
  const open = 1 - clamp01(menuHold); // 1 with no menu open, 0 with one fully open
  const lift = m.liftAt === null ? 0 : smooth((now - m.liftAt) / LIFT_MS);
  const keep = 1 - lift; // everything fades out with the lift
  const T = Math.max(1, m.tellMs);
  const t = m.tellAt === null ? -1 : now - m.tellAt;
  const sinceBlow = m.blowAt === null ? -1 : now - m.blowAt;
  const blown = sinceBlow >= 0;

  const name = m.markAt === null ? 0 : smooth((now - m.markAt) / 260) * keep;

  // the wash: drains over the first 62 percent of the tell, holds a hair under full through the rounds
  const drainIn = m.tellAt === null ? 0 : smooth(t / (0.62 * T));
  const drainHold = blown ? DRAIN_TELL - (DRAIN_TELL - DRAIN_HOLD) * smooth(sinceBlow / 400) : DRAIN_TELL;
  const drain = drainIn * drainHold * keep * (m.tame ? TAME_WASH : 1) * open;

  // the HUD sinks over the first 40 percent, comes back with the lift
  const sink = m.tellAt === null ? 0 : smooth(t / (0.4 * T));
  const hud = 1 - (1 - HUD_SINK_TO) * sink * keep * open;

  // the ring appears from 18 percent, gathers inward to its final size by the end of the tell, pulses wider at the blow and fades
  const ringIn = m.tellAt === null ? 0 : smooth((t - 0.18 * T) / (0.3 * T));
  const ringScale = m.calm === true ? 1 : m.tellAt === null ? 1.9 : 1 + 0.9 * (1 - easeOut(t / T)) + (blown ? 0.45 * easeOut(sinceBlow / 360) : 0);
  const ring = ringIn * (blown ? 1 - 0.65 * smooth(sinceBlow / 500) : 1) * keep;

  // light flows into the boss for the whole tell; it stops at the blow
  const inflow = m.tellAt === null ? 0 : clamp01(t / T);

  // the core heats from 55 percent to white-hot at the blow, then decays; the flash is the blow's own beat
  const coreUp = m.tellAt === null ? 0 : smooth((t - 0.55 * T) / (0.45 * T));
  const core = (blown ? coreUp * (1 - smooth(sinceBlow / 520)) : coreUp) * keep;
  const flashPeak = m.tame ? 0.3 : 0.85;
  const flash = blown ? flashPeak * (1 - smooth(sinceBlow / FLASH_MS)) * (sinceBlow < 12 ? sinceBlow / 12 : 1) * open : 0;

  // Mega Flare's flood: opens at the blow from the chest, holds, then settles into the wash
  let flood = 0;
  if (m.flood && blown) {
    const cap = (m.tame ? 0.35 : 1) * open;
    const rise = smooth(sinceBlow / FLOOD_RISE_MS);
    const fall = smooth((sinceBlow - FLOOD_RISE_MS - FLOOD_HOLD_MS) / FLOOD_FALL_MS);
    flood = cap * rise * (1 - 0.6 * fall) * keep;
  }

  const alive = (m.markAt !== null || m.tellAt !== null) && !(m.liftAt !== null && now - m.liftAt >= LIFT_MS);
  return { name, drain, hud, ring, ringScale, inflow, core, flash, flood, alive };
}

/** A marker that waits for its move (the FFX ladder is marked a turn or more ahead) is let go after this long, ms. */
export const MARK_GUARD_MS = 120000;

/** A move that has gone on this long since its blow without a lift is let go (a guard against an action whose end never reaches the layer). */
export function breathExpired(now: number, m: BreathMarks): boolean {
  if (m.liftAt !== null) return now - m.liftAt >= LIFT_MS;
  if (m.blowAt !== null) return now - m.blowAt > BREATH_GUARD_MS;
  if (m.tellAt !== null) return now - m.tellAt > m.tellMs + BREATH_GUARD_MS;
  return m.markAt !== null && now - m.markAt > MARK_GUARD_MS;
}

/**
 * The windows in the wash: which figures keep their colour. Each is an ellipse around the figure's rectangle (`rect`, CSS pixels), a little wider than the figure so the colour reads as a pool of light and not as a
 * cut-out; the boss's own window closes as Mega Flare's flood takes it (`bossKeep` 1 to 0), and the party's never does.
 */
export interface Rect {
  x: number;
  y: number;
  w: number;
  h: number;
}
export interface ClearWindow {
  cx: number;
  cy: number;
  rx: number;
  ry: number;
}

/** The window of one figure's rectangle: centred on its middle, 0.64 of its size either way plus a floor so a small figure still gets a pool. */
export function windowOf(r: Rect, grow = 1): ClearWindow {
  const rx = Math.max(48, r.w * 0.64) * grow;
  const ry = Math.max(64, r.h * 0.64) * grow;
  return { cx: r.x + r.w / 2, cy: r.y + r.h / 2, rx, ry };
}

