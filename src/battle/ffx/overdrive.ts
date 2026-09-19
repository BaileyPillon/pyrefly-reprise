/**
 * Overdrive gauges, modes and the timed-input protocol [ffx-combat-core §5].
 *
 * The gauge is **0-100 where one point is one percent**; every character
 * Overdrive costs the full 100. Aeons share the scale but fill at 5x, because
 * their `od_cost` is 20 rather than 100 [ffx-combat-core §6.5].
 */

import type {
  AbilityDef,
  CombatantId,
  FFXCombatant,
  MinigameKind,
  MinigameResult,
  OverdriveModeId,
  StatusId,
} from '../common/types.ts';
import { type Ctx, has, tryActor } from './state.ts';
import { estimatedDamage } from './formulas.ts';
import { hasAuto } from './equipment.ts';
import type { TimingBonus } from './formulas.ts';
import { FURY_ANCHOR_BUDGET, FURY_MAX_CASTS, degreesPerCast, furyCastsFor, furySpellIdsFor, furyTierOf } from './fury.ts';
import { attackReelHits } from './reels.ts';

/** The Attack Reels strip, in both spellings the tree uses [§5.6, `reels.ts`]. */
const ATTACK_REEL_SYMBOLS = new Set(['1-hit', '2-hit', 'miss', '1hit', '2hit']);

// Re-exported so callers have one import site for Overdrive behaviour.
export {
  DEGREES_PER_ROTATION,
  FURY_ANCHOR_BUDGET,
  FURY_MAX_CASTS,
  degreesPerCast,
  furyCastsFor,
  furySpellIdsFor,
  furyTierOf,
  isMenuMarker,
} from './fury.ts';
export type { FuryTier } from './fury.ts';

/** Aeon gauges fill 5x as fast, since their Overdrive costs one fifth as much. */
export const AEON_FILL_MULT = 5;

/** Statuses that satisfy Tactician's "inflicted an ailment" trigger [§5.1]. */
export const TACTICIAN_STATUSES: readonly StatusId[] = [
  'sleep',
  'silence',
  'darkness',
  'poison',
  'petrify',
  'slow',
  'zombie',
  'power-break',
  'magic-break',
  'armor-break',
  'mental-break',
  'threaten',
  'provoke',
  'doom',
];

/** Statuses that satisfy Victim and Sufferer. Deliberately a shorter list. */
export const VICTIM_STATUSES: readonly StatusId[] = [
  'silence',
  'sleep',
  'doom',
  'darkness',
  'slow',
  'poison',
  'zombie',
  'confuse',
];

/** Flat increments, in percent of the gauge [ffx-combat-core §5.1]. */
const FLAT_INCREMENT: Readonly<Partial<Record<OverdriveModeId, number>>> = {
  tactician: 16,
  victim: 16,
  dancer: 16,
  avenger: 30,
  slayer: 20,
  hero: 20,
  rook: 10,
  victor: 20,
  coward: 10,
  ally: 3,
  sufferer: 16,
  daredevil: 5,
  loner: 16,
};

/** Multipliers from equipment and mix flags. */
function gaugeMultiplier(c: FFXCombatant): number {
  let mult = 1;
  if (hasAuto(c, 'triple-overdrive')) mult *= 3;
  else if (hasAuto(c, 'double-overdrive')) mult *= 2;
  if (has(c, 'overdrive-x1_5')) mult *= 1.5;
  if (has(c, 'overdrive-x2')) mult *= 2;
  if (c.side === 'aeon') mult *= AEON_FILL_MULT;
  return mult;
}

/** Add to a combatant's gauge and emit the HUD event. */
export function addGauge(ctx: Ctx, c: FFXCombatant, raw: number, cause: string): void {
  const od = c.overdrive;
  if (!od || raw <= 0) return;
  // Curse stops the gauge filling at all; Shield zeroes an aeon's gain.
  if (has(c, 'curse')) return;
  if (c.side === 'aeon' && has(c, 'shield')) return;
  if (hasAuto(c, 'overdrive-to-ap')) return;
  if (hasAuto(c, 'sos-overdrive') && !has(c, 'critical')) return;

  let gain = raw * gaugeMultiplier(c);
  if (c.side === 'aeon' && has(c, 'boost')) gain *= 1.5;

  const from = od.gauge;
  const to = Math.max(0, Math.min(100, Math.floor(from + gain)));
  if (to === from) return;
  od.gauge = to;
  ctx.emit({ type: 'overdrive-gauge', who: c.id, from, to, cause });
}

/** Set a gauge outright (Talk zeroing Braska's Final Aeon, scripted fills). */
export function setGauge(ctx: Ctx, c: FFXCombatant, value: number, cause: string): void {
  const od = c.overdrive;
  if (!od) return;
  const from = od.gauge;
  const to = Math.max(0, Math.min(100, Math.floor(value)));
  if (to === from) return;
  od.gauge = to;
  ctx.emit({ type: 'overdrive-gauge', who: c.id, from, to, cause });
}

/** Stoic and Comrade: someone took damage. */
export function onDamageTaken(ctx: Ctx, victim: FFXCombatant, amount: number, fromEnemy: boolean): void {
  if (amount <= 0 || !fromEnemy) return;
  if (victim.side === 'aeon') {
    addGauge(ctx, victim, (amount * 30) / Math.max(1, victim.stats.maxHp), 'aeon-damage');
    return;
  }
  if (victim.overdrive?.mode === 'stoic') {
    addGauge(ctx, victim, (amount * 30) / Math.max(1, victim.stats.maxHp), 'stoic');
  }
  for (const id of ctx.state.activeIds) {
    if (id === victim.id) continue;
    const ally = tryActor(ctx, id);
    if (ally?.overdrive?.mode === 'comrade') {
      addGauge(ctx, ally, (amount * 20) / Math.max(1, victim.stats.maxHp), 'comrade');
    }
  }
}

/** Warrior: the user damaged an enemy, not via an item or an Overdrive. */
export function onDamageDealt(ctx: Ctx, user: FFXCombatant, def: AbilityDef, amount: number): void {
  if (amount <= 0) return;
  if (def.category === 'item' || def.category === 'overdrive') return;
  if (user.side === 'aeon') {
    addGauge(ctx, user, Math.min(16, (amount * 10) / estimatedDamage(user)), 'aeon-attack');
    return;
  }
  if (user.overdrive?.mode !== 'warrior') return;
  addGauge(ctx, user, Math.min(16, (amount * 10) / estimatedDamage(user)), 'warrior');
}

/** Healer: the user restored an ally's HP. Counts even at full HP. */
export function onHealDealt(ctx: Ctx, user: FFXCombatant, target: FFXCombatant, amount: number): void {
  if (amount <= 0 || user.overdrive?.mode !== 'healer') return;
  addGauge(ctx, user, (amount * 16) / Math.max(1, target.stats.maxHp), 'healer');
}

/** A flat-increment mode fired. */
export function onFlatTrigger(ctx: Ctx, c: FFXCombatant, mode: OverdriveModeId, cause: string): void {
  if (c.overdrive?.mode !== mode) return;
  const flat = FLAT_INCREMENT[mode];
  if (flat === undefined) return;
  addGauge(ctx, c, flat, cause);
}

/** Start-of-turn modes: Ally, Sufferer, Daredevil, Loner. */
export function onTurnStartGauge(ctx: Ctx, c: FFXCombatant, soleSurvivor: boolean): void {
  const mode = c.overdrive?.mode;
  if (!mode) return;
  switch (mode) {
    case 'ally':
      onFlatTrigger(ctx, c, 'ally', 'ally');
      break;
    case 'sufferer':
      if (VICTIM_STATUSES.some((s) => has(c, s))) onFlatTrigger(ctx, c, 'sufferer', 'sufferer');
      break;
    case 'daredevil':
      if (has(c, 'critical')) onFlatTrigger(ctx, c, 'daredevil', 'daredevil');
      break;
    case 'loner':
      if (soleSurvivor) onFlatTrigger(ctx, c, 'loner', 'loner');
      break;
    default:
      break;
  }
}

/** Spend the gauge. Grand Summon's temporary pool is consumed first [§5.4]. */
export function spendOverdrive(ctx: Ctx, c: FFXCombatant): void {
  if (c.aeon && c.aeon.temporaryOverdrive !== null && c.aeon.temporaryOverdrive >= 100) {
    c.aeon.temporaryOverdrive = null;
    ctx.emit({ type: 'overdrive-gauge', who: c.id, from: 100, to: c.overdrive?.gauge ?? 0, cause: 'grand-summon' });
    return;
  }
  setGauge(ctx, c, 0, 'spent');
}

/** True when this combatant may fire an Overdrive right now. */
export function overdriveReady(c: FFXCombatant): boolean {
  if (has(c, 'curse')) return false;
  const temp = c.aeon?.temporaryOverdrive;
  if (temp !== null && temp !== undefined && temp >= 100) return true;
  return (c.overdrive?.gauge ?? 0) >= 100;
}

// ---------------------------------------------------------------------------
// Minigame protocol [docs/CONTRACTS.md]
// ---------------------------------------------------------------------------

/** Published timer lengths [ffx-combat-core §5.2, §5.3]. */
const TIMER_MS: Readonly<Record<string, number>> = {
  'spiral-cut': 3000,
  'slice-and-dice': 3000,
  'energy-rain': 2600,
  'blitz-ace': 2200,
};

/**
 * Default timer for a minigame kind, in ms. **`0` means "not a timed input"**,
 * not "no time" — see {@link minigameParams}, which omits the field entirely in
 * that case so an overlay cannot start a zero-length countdown.
 *
 * Lulu's Fury **is** timed: §5.7 gives it an input window of "~4 s, consistent
 * with the other timed Overdrives" `[estimate]`. It returning 0 is why Fury
 * settled in 431 ms with `{ sweptDegrees: 0, casts: 0 }` and spent the gauge
 * for nothing. Ronso Rage and Mix are **pickers** — `types.ts` says so of Rage
 * in as many words — and stay untimed. §5.2 excludes Fury from the *damage*
 * bonus ("Lulu's timer always reaches 0"), which is about the bonus, not about
 * whether the window exists; `timingBonusFrom` keeps honouring that.
 */
export function timerMsFor(def: AbilityDef): number {
  switch (def.minigame) {
    case 'tidus-timing':
      return TIMER_MS[def.id] ?? 3000;
    case 'auron-sequence':
      return 4000;
    case 'lulu-fury':
      return 4000;
    case 'wakka-reels':
    case 'ladyluck-reels':
      return 20000;
    default:
      return 0;
  }
}

/** The `<spell>-fury` rows a Fury marker expands into for this caster [§5.7]. */
export function furySpellsFor(ctx: Ctx, user: FFXCombatant, marker: AbilityDef): AbilityDef[] {
  const out: AbilityDef[] = [];
  for (const id of furySpellIdsFor(marker, user.learnedAbilityIds)) {
    const def = ctx.content.ability(id);
    if (def) out.push(def);
  }
  return out;
}

/** Overlay tuning the UI needs, merged with anything the data file supplied. */
export function minigameParams(ctx: Ctx, def: AbilityDef, user: FFXCombatant): Record<string, unknown> {
  const authored = (def.extra?.['minigameParams'] as Record<string, unknown> | undefined) ?? {};
  const timerMs = timerMsFor(def);
  // An untimed picker publishes **no** `timerMs` rather than `timerMs: 0`: the
  // overlays read it as `num(params['timerMs'], 4000)` and a 0 passes that
  // guard, so a picker opened a countdown that expired on its first step.
  const base: Record<string, unknown> = { abilityId: def.id, ...(timerMs > 0 ? { timerMs } : {}) };
  switch (def.minigame) {
    case 'tidus-timing':
      Object.assign(base, { travelMs: 1400, zonePercent: 22 });
      break;
    case 'auron-sequence':
      Object.assign(base, { inputs: 7 });
      break;
    case 'wakka-reels':
      // The strip comes off the reel set the player picked — it was hard-coded
      // to the Element Reels symbols, so Attack, Status and Aurochs Reels all
      // opened the wrong overlay [§5.6's per-set symbol table].
      Object.assign(base, {
        reels: 3,
        symbolsPerSecond: 6,
        strip: (def.extra?.['reelSymbols'] as string[] | undefined) ?? ['fire', 'ice', 'water', 'thunder'],
      });
      break;
    case 'lulu-fury':
      Object.assign(base, {
        maxCasts: FURY_MAX_CASTS,
        magic: user.stats.mag,
        spellAbilityId: def.id,
        furyTier: furyTierOf(def),
        degreesPerCast: degreesPerCast(def, user.stats.mag),
        anchorBudgetDegrees: FURY_ANCHOR_BUDGET,
      });
      break;
    case 'kimahri-rage':
      Object.assign(base, { rages: user.overdrive?.unlockedOverdriveIds ?? [] });
      break;
    case 'rikku-mix':
      Object.assign(base, {
        inventory: [...ctx.rt.inventory.entries()].map(([itemId, count]) => ({ itemId, count })),
      });
      break;
    case 'yuna-grand-summon':
      Object.assign(base, { aeons: [...ctx.rt.aeonRoster.keys()] });
      break;
    default:
      break;
  }
  return { ...base, ...authored };
}

/**
 * Roll a default outcome when the UI cannot run the minigame — AI, auto-battle
 * or a deterministic test. This is an engine convenience, **not** the game's
 * model: Slots in particular is fully player-controlled [ffx-combat-core §5.6].
 */
export function rollDefaultMinigame(ctx: Ctx, kind: MinigameKind, def: AbilityDef, user: FFXCombatant): MinigameResult {
  const timerMs = timerMsFor(def);
  switch (kind) {
    case 'tidus-timing': {
      const success = ctx.rng.int(0, 99) < 75;
      return {
        kind,
        timing: { success, timeRemainingMs: success ? ctx.rng.int(0, timerMs) : 0, timerMs },
      };
    }
    case 'auron-sequence': {
      const success = ctx.rng.int(0, 99) < 75;
      return {
        kind,
        sequence: {
          success,
          correctInputs: success ? 7 : ctx.rng.int(0, 6),
          timeRemainingMs: success ? ctx.rng.int(0, timerMs) : 0,
        },
      };
    }
    case 'wakka-reels':
    case 'ladyluck-reels': {
      // The strip is `extra.reelSymbols` — the key the four reel-set records
      // actually ship. Reading a `reelStrip` that exists nowhere meant every
      // set fell back to the **Attack Reels** strip, so Element, Status and
      // Aurochs Reels were rolled against symbols they do not have and could
      // never match anything. §5.6's own note applies: a uniform draw is an AI
      // convenience, not the game's model — Slots is fully player-controlled.
      const authored = (def.extra?.['reelSymbols'] ?? def.extra?.['reelStrip']) as string[] | undefined;
      const strip = (authored && authored.length > 0 ? authored : ['1-hit', '2-hit', 'miss']).slice();
      const symbols: [string, string, string] = [ctx.rng.pick(strip), ctx.rng.pick(strip), ctx.rng.pick(strip)];
      const three = symbols[0] === symbols[1] && symbols[1] === symbols[2];
      // `hits` is **Attack Reels only** (`types.ts`); on any other set it used
      // to come back 0 and overwrite the resolved shot's own hit count.
      const hits = attackReelHits(symbols);
      const attackStrip = strip.every((s) => ATTACK_REEL_SYMBOLS.has(s));
      return {
        kind,
        reels: { symbols, threeOfAKind: three, ...(attackStrip ? { hits } : {}), timeRemainingMs: 0 },
      };
    }
    case 'lulu-fury': {
      // Roll the *input*, not the outcome: a swept angle inside the published
      // 15-rotation budget, then let `degreesPerCast` decide how many casts
      // that buys at this Magic and tier.
      const sweptDegrees = ctx.rng.int(Math.floor(FURY_ANCHOR_BUDGET / 3), FURY_ANCHOR_BUDGET);
      return { kind, fury: { sweptDegrees, casts: furyCastsFor(def, user.stats.mag, sweptDegrees) } };
    }
    case 'rikku-mix':
      return { kind, mix: { ingredients: ['', ''], resultAbilityId: null } };
    case 'kimahri-rage':
      // The Rage rode in on `OverdriveCommand.id`, exactly like Lulu's Fury
      // spell above, so `def` is already the record the player chose — a menu
      // marker can never reach here, `execute.ts` refuses those first.
      //
      // Defaulting to `unlockedOverdriveIds[0]` instead **discarded that
      // choice** and resolved every Ronso Rage as whatever sat first in the
      // list. For the Gagazet preset that is Jump, so Kimahri's Mighty Guard —
      // the canonical answer to Total Annihilation, and the reason
      // `research/ffx-seymour-flux.md` §7.9.2 makes his full gauge a *rule*
      // rather than an estimate (§6 row 13, §6.1) — was uncastable: the
      // command named it, the gauge was spent, and Jump came out. Measured on
      // seed 1 as `action-start{ command.id: 'mighty-guard', abilityId:
      // 'jump' }`.
      return { kind, rage: { rageId: def.id } };
    case 'gunner-trigger':
      return { kind, trigger: { hits: ctx.rng.int(4, 16) } };
    case 'yuna-grand-summon':
      return { kind, grandSummon: { aeonId: '' } };
    default:
      return { kind: 'tidus-timing', timing: { success: false, timeRemainingMs: 0, timerMs } };
  }
}

/** The §5.2 timing bonus carried by a minigame outcome, or `null`. */
export function timingBonusFrom(result: MinigameResult | undefined, def: AbilityDef): TimingBonus | null {
  if (!result) return null;
  const timerMs = timerMsFor(def);
  if (timerMs <= 0) return null;
  if (result.kind === 'tidus-timing') {
    return { timeRemainingMs: result.timing.timeRemainingMs, timerMs: result.timing.timerMs || timerMs };
  }
  if (result.kind === 'auron-sequence') {
    return { timeRemainingMs: result.sequence.timeRemainingMs, timerMs };
  }
  if (result.kind === 'wakka-reels' || result.kind === 'ladyluck-reels') {
    return { timeRemainingMs: result.reels.timeRemainingMs, timerMs };
  }
  return null;
}

/** Combatants whose gauge should be paid out when the battle is won (Victor). */
export function payVictorGauge(ctx: Ctx, activeIds: readonly CombatantId[]): void {
  for (const id of activeIds) {
    const c = tryActor(ctx, id);
    if (c) onFlatTrigger(ctx, c, 'victor', 'victor');
  }
}
