/**
 * Overdrive gauges, modes and the timed-input protocol [ffx-combat-core §5].
 *
 * The gauge is 0-100 as the HUD shows it, one point a percent of the bar. **The gains, the costs and the aeons' bar are the
 * game's** (re-parity W5; FFX only): a party member's bar is 100 points wide, an aeon's is 20 (its gauge moves in steps of
 * five here), and `./gauge.ts` runs the game's own hooks over the hit records, the deaths, the turns and the end of the battle.
 * What stays in this file is the engine's way to set a gauge outright (an enemy script's variable, a Talk), the gauge that
 * fills on being targeted, the ready test and the minigame protocol.
 */

import type {
  AbilityDef, AbilityId, FFXCombatant, ItemId, MinigameKind, MinigameResult,
} from '../common/types.ts';
import { type Ctx, has } from './state.ts';
import type { TimingBonus } from './formulas.ts';
import { FURY_ANCHOR_BUDGET, FURY_MAX_CASTS, degreesPerCast, furyCastsFor, furySpellIdsFor, furyTierOf } from './fury.ts';
import { attackReelHits } from './reels.ts';
import { defaultGrandSummonAeon } from './aeon-duel.ts';
import { grandSummonEntries, mixPickerParams } from './pickerParams.ts';
import { gaugeAdd, gaugePay } from './gauge.ts';

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

/** Add to a combatant's gauge and emit the HUD event: the game's gauge add for a party member or an aeon (`./gauge.ts#gaugeAdd`). */
export function addGauge(ctx: Ctx, c: FFXCombatant, raw: number, cause: string): void {
  gaugeAdd(ctx, c, raw, cause);
}

/** Set a gauge outright (Talk zeroing Braska's Final Aeon, scripted fills, a fallen aeon). */
export function setGauge(ctx: Ctx, c: FFXCombatant, value: number, cause: string): void {
  const od = c.overdrive;
  if (!od) return;
  const from = od.gauge;
  const to = Math.max(0, Math.min(100, Math.floor(value)));
  if (to === from) return;
  od.gauge = to;
  ctx.emit({ type: 'overdrive-gauge', who: c.id, from, to, cause });
}

/**
 * **An enemy gauge that fills on being targeted**, not on being damaged.
 *
 * Macalania Anima's third clock advances "every time she gets a turn **or is attacked**", Boost-independent — a heal or a debuff
 * aimed at her counts too [ffx-seymour-anima-macalania §3.4, §5.3]. Called from `abilities.ts#resolveAbility` once the targets
 * are resolved and before the hit loop, so one action is one targeting however many hits it lands.
 *
 * The amount comes from {@link ActorRuntime.gaugePerTargeting}, which only the Macalania script sets, so this is inert in every
 * other battle. The value itself is an `[estimate]` (C-4) and is labelled as one in-product. An enemy's gauge is a plain clamped
 * sum (`./gauge.ts#gaugeAdd`), so Boost never changes it: exactly Anima's canon Boost-independence. Do not "fix" that.
 */
export function onTargeted(ctx: Ctx, target: FFXCombatant, by: FFXCombatant): void {
  if (by.side === 'enemy' || target.side !== 'enemy') return;
  const rt = ctx.rt.actors.get(target.id);
  if (rt?.countsPartyTargetings === true) rt.partyTargetings = (rt.partyTargetings ?? 0) + 1; // Evrae §4.5
  const per = rt?.gaugePerTargeting ?? 0;
  if (per > 0) addGauge(ctx, target, per, 'targeted');
}

/** Spend the gauge: the cost is the whole bar, or a Grand Summon's held full gauge, whose stored gauge comes back [§5.4]. */
export function spendOverdrive(ctx: Ctx, c: FFXCombatant): void {
  gaugePay(ctx, c);
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
    case 'auron-sequence': // Tornado 3 s [estimate, Bailey D-312: GF-KB, XU, AGS; input-rules note D1], the rest 4 s
      return def.id === 'tornado' ? 3000 : 4000;
    case 'lulu-fury':
      return 4000;
    case 'wakka-reels':
    case 'ladyluck-reels':
      return 20000;
    default:
      return 0;
  }
}

/**
 * Every recipe the party can actually make right now [ffx-combat-core §5.9].
 *
 * A pair is mixable when both ingredients are in the bag — and when the two
 * ids are the same (Potion + Potion -> Ultra Potion) the bag must hold **two**.
 */
export function mixablePairs(ctx: Ctx): Array<[ItemId, ItemId, AbilityId]> {
  const held = (id: ItemId): number => ctx.rt.inventory.get(id) ?? 0;
  return ctx.content
    .mixPairs()
    .filter(([a, b]) => (a === b ? held(a) >= 2 : held(a) >= 1 && held(b) >= 1));
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
      Object.assign(base, { travelMs: 1059, zonePercent: 12.22, name: def.name }); // title (od4); each tier's own pair is in extra.minigameParams (PR-0308)
      break;
    case 'auron-sequence':
      Object.assign(base, { name: def.name }); // the title is the Overdrive chosen (od4); its `sequence` comes from extra.minigameParams below (PR-0308)
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
      // Hotfix 24: the named bag and the recipes the overlay reads (`pickerParams.ts`).
      Object.assign(base, mixPickerParams(ctx, mixablePairs(ctx)));
      break;
    case 'yuna-grand-summon':
      Object.assign(base, { aeons: grandSummonEntries(ctx) }); // the roster unless a duel narrows it, as the picker reads it (hotfix 24)
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
      const success = ctx.rng.int(0, 99) < 75, seqLen = ((def.extra?.['minigameParams'] as { sequence?: unknown[] } | undefined)?.sequence ?? []).length || 7; // this Overdrive's own length (PR-0308)
      return {
        kind,
        sequence: {
          success,
          correctInputs: success ? seqLen : ctx.rng.int(0, seqLen - 1),
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
    case 'rikku-mix': {
      // Roll the *input*, as everywhere else in this switch: two ingredients
      // out of the bag, not a chosen outcome. The shipped recipe table is
      // explicitly partial ("only ONE confirmed recipe per result",
      // `data/ffx/mixes/recipes.ts`), so the draw is made among the pairs the
      // party is actually carrying that the table can resolve — a uniform draw
      // over the whole bag would return "no recipe" almost every time and hand
      // the player a spent gauge, which is the bug this replaces.
      const pairs = mixablePairs(ctx);
      const chosen = pairs.length > 0 ? ctx.rng.pick(pairs) : undefined;
      return {
        kind,
        mix: chosen
          ? { ingredients: [chosen[0], chosen[1]], resultAbilityId: chosen[2] }
          : { ingredients: ['', ''], resultAbilityId: null },
      };
    }
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
      return { kind, grandSummon: { aeonId: defaultGrandSummonAeon(ctx) } }; // was always '': gauge spent, no aeon
    default:
      return { kind: 'tidus-timing', timing: { success: false, timeRemainingMs: 0, timerMs } };
  }
}

/** The §5.2 timing bonus carried by a minigame outcome, or `null`. A failed Swordplay or Bushido earns none (§5.3 rule 1, §5.5; PR-0267, od2). */
export function timingBonusFrom(result: MinigameResult | undefined, def: AbilityDef): TimingBonus | null {
  if (!result) return null;
  const timerMs = timerMsFor(def);
  if (timerMs <= 0) return null;
  if (result.kind === 'tidus-timing') {
    return { timeRemainingMs: result.timing.success ? result.timing.timeRemainingMs : 0, timerMs: result.timing.timerMs || timerMs };
  }
  if (result.kind === 'auron-sequence') {
    return { timeRemainingMs: result.sequence.success ? result.sequence.timeRemainingMs : 0, timerMs };
  }
  if (result.kind === 'wakka-reels' || result.kind === 'ladyluck-reels') {
    return { timeRemainingMs: result.reels.timeRemainingMs, timerMs };
  }
  return null;
}
