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
import { DEGREES_PER_ROTATION, FURY_MAX_CASTS, furyCastsFor, furySpellIdsFor } from './fury.ts';
import { furyParams, minigameLimitMs, swordplayParams } from './adapt/minigame.ts';
import { timingScale } from './kernel/minigame-timer.ts';
import { attackReelHits } from './reels.ts';
import { defaultGrandSummonAeon } from './aeon-duel.ts';
import { MIX_PREVIEW_ALL_PAIRS, grandSummonEntries, mixPickerParams } from './pickerParams.ts';
import { gaugeAdd, gaugePay } from './gauge.ts';

/** The Attack Reels strip, in both spellings the tree uses [§5.6, `reels.ts`]. */
const ATTACK_REEL_SYMBOLS = new Set(['1-hit', '2-hit', 'miss', '1hit', '2hit']);

// Re-exported so callers have one import site for Overdrive behaviour.
export { DEGREES_PER_ROTATION, FURY_MAX_CASTS, furyCastsFor, furySpellIdsFor, isMenuMarker } from './fury.ts';

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

/**
 * Default timer for a minigame kind, in ms. **`0` means "not a timed input"**,
 * not "no time" — see {@link minigameParams}, which omits the field entirely in
 * that case so an overlay cannot start a zero-length countdown.
 *
 * Lulu's Fury **is** timed: 4 s for all 19 spells (the game's, `FFX-G01` section 6.4; §5.7 had it as "~4 s" `[estimate]`). It returning 0 is why Fury
 * settled in 431 ms with `{ sweptDegrees: 0, casts: 0 }` and spent the gauge
 * for nothing. Ronso Rage and Mix are **pickers** — `types.ts` says so of Rage
 * in as many words — and stay untimed. §5.2 excludes Fury from the *damage*
 * bonus ("Lulu's timer always reaches 0"), which is about the bonus, not about
 * whether the window exists; `timingBonusFrom` keeps honouring that.
 */
export function timerMsFor(def: AbilityDef): number {
  switch (def.minigame) {
    // The game's limits (re-parity RC9, FFX only; `FFX-G01` sections 6.2 to 6.4, `adapt/minigame.ts#minigameLimitMs`): Spiral Cut, Slice and Dice and
    // Energy Rain 3 s, Blitz Ace 2 s; Shooting Star, Dragon Fang and Banishing Blade 4 s, Tornado 3 s; every Fury 4 s. An ability that is none of them
    // (a test's) keeps the old defaults.
    case 'tidus-timing':
      return minigameLimitMs(def) ?? 3000;
    case 'auron-sequence':
      return minigameLimitMs(def) ?? (def.id === 'tornado' ? 3000 : 4000);
    case 'lulu-fury':
      return minigameLimitMs(def) ?? 4000;
    case 'wakka-reels':
    case 'ladyluck-reels':
      return 20000;
    default:
      return 0;
  }
}

/**
 * Every pair the party can actually mix right now [ffx-combat-core §5.9]. The game's table is complete (any two items make something, `kernel/mix.ts`;
 * re-parity RC7), so this is every pair of items in the bag, in the bag's order, each with the result it makes. A pair is mixable when both ingredients are
 * in the bag, and when the two ids are the same (Potion + Potion -> Ultra Potion) the bag must hold **two** (the menu's rule, FFX-G05 section 3.3).
 */
export function mixablePairs(ctx: Ctx): Array<[ItemId, ItemId, AbilityId]> {
  const stock = [...ctx.rt.inventory].filter(([, count]) => count > 0);
  const out: Array<[ItemId, ItemId, AbilityId]> = [];
  for (let i = 0; i < stock.length; i++) {
    for (let j = i; j < stock.length; j++) {
      const [a, held] = stock[i] as [ItemId, number];
      const [b] = stock[j] as [ItemId, number];
      if (i === j && held < 2) continue;
      const result = ctx.content.mixResult(a, b);
      if (result !== undefined && ctx.content.ability(result) !== undefined) out.push([a, b, result]);
    }
  }
  return out;
}

/**
 * The pairs the Mix picker's preview names [ffx-combat-core §5.9]. With {@link MIX_PREVIEW_ALL_PAIRS} off (the shipped state) this is the registered recipes
 * whose two ingredients are in the bag (the same item twice needs two in stock), in the registry's order: the line every build before re-parity RC7
 * shipped, and "? ? ?" for any other pair. With it on, it is {@link mixablePairs}: every pair of the bag with the result the game's chart gives it.
 * **Only the preview reads this.** The engine's resolution of a fired pair, and the automatic draw of an AI or headless Mix, stay on the full chart.
 */
export function mixPreviewPairs(ctx: Ctx, allPairs: boolean = MIX_PREVIEW_ALL_PAIRS): Array<[ItemId, ItemId, AbilityId]> {
  if (allPairs) return mixablePairs(ctx);
  const held = (id: ItemId): number => ctx.rt.inventory.get(id) ?? 0;
  return ctx.content.mixPairs().filter(([a, b]) => (a === b ? held(a) >= 2 : held(a) >= 1 && held(b) >= 1));
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
      Object.assign(base, { name: def.name, ...swordplayParams(def) }); // the title is the Overdrive chosen (od4); the bar, window and marker speed are the game's for this move (RC9)
      break;
    case 'auron-sequence':
      Object.assign(base, { name: def.name }); // the title is the Overdrive chosen (od4); its `sequence` (the game's order) comes from extra.minigameParams below (PR-0308, RC9)
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
      // The spell's variant and the 16 thresholds the game builds from it and Lulu's Magic (`adapt/minigame.ts`); the overlay turns them into casts.
      Object.assign(base, { maxCasts: FURY_MAX_CASTS, magic: user.stats.mag, spellAbilityId: def.id, ...furyParams(def, user.stats.mag) });
      break;
    case 'kimahri-rage':
      Object.assign(base, { rages: user.overdrive?.unlockedOverdriveIds ?? [] });
      break;
    case 'rikku-mix':
      // Hotfix 24: the named bag and the recipes the overlay reads (`pickerParams.ts`).
      Object.assign(base, mixPickerParams(ctx, mixPreviewPairs(ctx))); // the preview's pairs, not the engine's (`MIX_PREVIEW_ALL_PAIRS`)
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
 * model: Slots in particular is fully player-controlled [ffx-combat-core §5.6]. So every draw here is a stand-in for what the player would
 * do and comes from the engine-side stream (`BattleRng.aux`), which can never move one of the game's 68 streams (the game's own reel
 * builder, stream 19, is not modelled: the player's stops decide the reels).
 */
export function rollDefaultMinigame(ctx: Ctx, kind: MinigameKind, def: AbilityDef, user: FFXCombatant): MinigameResult {
  const timerMs = timerMsFor(def);
  switch (kind) {
    case 'tidus-timing': {
      const success = ctx.rng.aux.int(0, 99) < 75;
      return {
        kind,
        timing: { success, timeRemainingMs: success ? ctx.rng.aux.int(0, timerMs) : 0, timerMs },
      };
    }
    case 'auron-sequence': {
      const success = ctx.rng.aux.int(0, 99) < 75, seqLen = ((def.extra?.['minigameParams'] as { sequence?: unknown[] } | undefined)?.sequence ?? []).length || 7; // this Overdrive's own length (PR-0308)
      return {
        kind,
        sequence: {
          success,
          correctInputs: success ? seqLen : ctx.rng.aux.int(0, seqLen - 1),
          timeRemainingMs: success ? ctx.rng.aux.int(0, timerMs) : 0,
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
      const symbols: [string, string, string] = [ctx.rng.aux.pick(strip), ctx.rng.aux.pick(strip), ctx.rng.aux.pick(strip)];
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
      // Roll the *input*, not the outcome: a swept angle of 5 to 15 rotations
      // (one draw, as ever), then let the game's table decide how many casts
      // that buys at this Magic and spell (`furyCastsFor`, RC9).
      const budget = 15 * DEGREES_PER_ROTATION;
      const sweptDegrees = ctx.rng.aux.int(Math.floor(budget / 3), budget);
      return { kind, fury: { sweptDegrees, casts: furyCastsFor(def, user.stats.mag, sweptDegrees) } };
    }
    case 'rikku-mix': {
      // Roll the *input*, as everywhere else in this switch: two ingredients out of the bag, not a chosen outcome. The game's table is complete
      // (re-parity RC7, `kernel/mix.ts`), so the draw is made among every pair the party is carrying (`mixablePairs`): any two items make something.
      const pairs = mixablePairs(ctx);
      const chosen = pairs.length > 0 ? ctx.rng.aux.pick(pairs) : undefined;
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
      return { kind, trigger: { hits: ctx.rng.aux.int(4, 16) } };
    case 'yuna-grand-summon':
      return { kind, grandSummon: { aeonId: defaultGrandSummonAeon(ctx) } }; // was always '': gauge spent, no aeon
    default:
      return { kind: 'tidus-timing', timing: { success: false, timeRemainingMs: 0, timerMs } };
  }
}

/**
 * A Swordplay or Bushido result as the damage code reads it: the time left in milliseconds (0 for a failure, which earns no bonus) and **the game's own
 * `A` and `B`** (`scale`, float32 seconds, built from the controller's frame; re-parity RC9, lane FFX-B3, `FFX-G01` section 5 and row 22).
 */
function controllerBonus(success: boolean, timeRemainingMs: number, frame: number | undefined, limitMs: number): TimingBonus {
  const left = success ? timeRemainingMs : 0;
  return { timeRemainingMs: left, timerMs: limitMs, scale: timingScale(limitMs, left, success ? frame : undefined) };
}

/** The §5.2 timing bonus carried by a minigame outcome, or `null`. A failed Swordplay or Bushido earns none (§5.3 rule 1, §5.5; PR-0267, od2). */
export function timingBonusFrom(result: MinigameResult | undefined, def: AbilityDef): TimingBonus | null {
  if (!result) return null;
  const timerMs = timerMsFor(def);
  if (timerMs <= 0) return null;
  if (result.kind === 'tidus-timing') {
    return controllerBonus(result.timing.success, result.timing.timeRemainingMs, result.timing.frame, result.timing.timerMs || timerMs);
  }
  if (result.kind === 'auron-sequence') {
    return controllerBonus(result.sequence.success, result.sequence.timeRemainingMs, result.sequence.frame, timerMs);
  }
  if (result.kind === 'wakka-reels' || result.kind === 'ladyluck-reels') {
    return { timeRemainingMs: result.reels.timeRemainingMs, timerMs };
  }
  return null;
}
