/**
 * The Leblanc Syndicate — Chateau Leblanc, FFX-2 Chapter 2. Five AI scripts.
 *
 * **Game case: FFX-2 only** [AGENTS.md rule 14].
 * Source: `research/ffx2-leblanc-syndicate.md` §5.3, §5.4 (abbreviated `§`);
 * spec `docs/plans/chapter-leblanc-review.md` §2.5.
 *
 * ### The three AI facts that decide the fight [§5.4]
 *
 * 1. **Killing *either* henchman switches off No Love Lost.** The trigger
 *    requires both. Logos has the least HP (989) and the worst threat, so he is
 *    the correct target — which is what every published strategy says, arrived
 *    at here independently from the script.
 * 2. **Ormi only reaches Huggles when he is the last enemy alive** (~1,185 on a
 *    party whose largest standard-dressphere pool at Lv 22 is a Warrior's
 *    1,089). **Killing Leblanc and Logos first arms the fight's deadliest
 *    move.** This inverts the reflexive "weakest first" habit.
 * 3. **Leblanc alone is a stalemate engine, not a threat.** With both henchmen
 *    dead her turn-4 branch resolves to White Wind — she heals an empty enemy
 *    party and **cures her own statuses, wiping your Darkness** — while turns 1
 *    and 5 keep re-applying Protect + Shell + Regen.
 *
 * The derived correct order is therefore **Logos -> Ormi -> Leblanc**, with a
 * heal banked for Concussive Blast at Ormi's 25 %.
 */

import type { Command } from '../../common/types.ts';
import type { AiContext, AiScript, Ffx2Unit } from '../internal.ts';
import { mem, setMem } from '../internal.ts';

/**
 * Ormi's Supercollider targets the character **furthest away** [§4.2] — a
 * positional rule, and we have no positions: `Ffx2Unit` carries only `slot`, a
 * formation index, and the free-movement battlefield the rule implies does not
 * exist in our presentation either.
 *
 * **AUTHORED, owner-approved 2026-09-21:** the highest `slot` is the back of
 * the formation and therefore the stand-in for "furthest away". Adding a
 * `Targeting` union member in `src/battle/common/types.ts` for one ability
 * would be a contract change for a rule we cannot honour faithfully anyway,
 * so the script picks the target instead.
 */
export const SUPERCOLLIDER_TARGETS_BACK_OF_FORMATION = true;

/**
 * Leblanc's `[8x - 5]`-th turn is her 3rd, 11th, 19th… — i.e. `turn % 8 === 3`.
 * [§4.5, §5.3, verified: 2 sources]
 */
const NO_LOVE_LOST_PHASE = 3;
const NO_LOVE_LOST_PERIOD = 8;

/** "After her [25 + times No Love Lost was used] turn -> Not-So-Mighty Guard." §5.3 */
const FAILSAFE_TURN = 25;

/** Leblanc reaches for Osmose only at or below this MP. She starts on 460. §4.4 */
const OSMOSE_MP_GATE = 14;

/** Ormi's Concussive Blast branch: `HP < 1/4 max`. §5.3 */
const CONCUSSIVE_BLAST_HP_FRACTION = 0.25;

function randomPartyTarget(ctx: AiContext): string[] {
  const party = ctx.party();
  return party.length > 0 ? [ctx.rng.pick(party).id] : [];
}

/** The back of the formation — see {@link SUPERCOLLIDER_TARGETS_BACK_OF_FORMATION}. */
function backOfFormation(ctx: AiContext): string[] {
  const party = ctx.party();
  if (party.length === 0) return [];
  let furthest = party[0] as Ffx2Unit;
  for (const unit of party) if (unit.slot > furthest.slot) furthest = unit;
  return [furthest.id];
}

/** Advance and return this unit's 1-based turn number. */
function nextTurn(ctx: AiContext): number {
  const taken = mem(ctx.self, 'actions');
  setMem(ctx.self, 'actions', taken + 1);
  return taken + 1;
}

/** A living enemy-side unit whose id starts with `prefix` (Acts I–III share names). */
function livingAlly(ctx: AiContext, prefix: string): Ffx2Unit | undefined {
  return ctx.allies().find((u) => u.id === prefix || u.id.startsWith(`${prefix}-`));
}

// ---------------------------------------------------------------------------
// Ormi — "Chateau End" [§5.3, verified: 2 sources — decompile-derived]
// ---------------------------------------------------------------------------
//
// ```
// Turn 1-3  Normal Attack on a random character
// Turn 4    Supercollider on the character FURTHEST AWAY
// If (HP < 1/4 max) -> Concussive Blast
// If (Ormi is the ONLY enemy remaining):
//    Normal Attack 1/2 | Supercollider 1/4 | Huggles 1/4
// ```
//
// **The precedence between the two overrides is AUTHORED.** The source lists
// them sequentially — basic pattern, then the HP branch, then the last-enemy
// branch — and states no order. This script takes them in the order the source
// prints them, which keeps both of §5.4's facts true: a *healthy* last-standing
// Ormi still reaches Huggles (the credible-mistake loss the chapter is built
// around), and a dying Ormi still opens with Concussive Blast whether or not
// his friends are up (§5.4: "budget a heal for it").

export const ormiScript: AiScript = {
  id: 'ffx2-leblanc-ormi',

  decide(ctx: AiContext): Command | null {
    const turn = nextTurn(ctx);
    const self = ctx.self;

    if (self.hp < self.stats.maxHp * CONCUSSIVE_BLAST_HP_FRACTION) {
      return { kind: 'ability', id: 'x2-ormi-concussive-blast', targets: [] };
    }

    if (ctx.allies().length === 0) {
      const roll = ctx.rng.int(0, 3);
      if (roll <= 1) {
        return { kind: 'ability', id: 'x2-ormi-shield-bash', targets: randomPartyTarget(ctx) };
      }
      if (roll === 2) {
        return { kind: 'ability', id: 'x2-ormi-supercollider', targets: backOfFormation(ctx) };
      }
      return { kind: 'ability', id: 'x2-ormi-huggles', targets: randomPartyTarget(ctx) };
    }

    const step = ((turn - 1) % 4) + 1;
    if (step === 4) {
      return { kind: 'ability', id: 'x2-ormi-supercollider', targets: backOfFormation(ctx) };
    }
    return { kind: 'ability', id: 'x2-ormi-shield-bash', targets: randomPartyTarget(ctx) };
  },
};

// ---------------------------------------------------------------------------
// Leblanc — "Chateau End" [§5.3, verified: 2 sources — decompile-derived]
// ---------------------------------------------------------------------------
//
// ```
// Turn 1  Not-So-Mighty Guard
// Turn 2  Normal Attack (Fan Slap) on a random character
// Turn 3  If (MP <= 14) -> Osmose; else Fira/Blizzara/Thundara/Watera, 1/4 each
// Turn 4A (1/2)  If (Ormi alive)  -> Love Tap on Ormi   else White Wind
// Turn 4B (1/2)  If (Logos alive) -> Love Tap on Logos  else White Wind
// Turn 5  Not-So-Mighty Guard
// Turn 6  Mach Fan (3/5) | Flash Bomb (1/5) | Hush Grenade (1/5)
// Repeat from Turn 2
//
// Action Number Pattern (overrides the above):
//   After her [8x-5] turn, if BOTH Ormi and Logos have HP -> No Love Lost.
//   After her [25 + timesNoLoveLostUsed] turn -> Not-So-Mighty Guard.
// ```

const LEBLANC_ELEMENTS = [
  'x2-leblanc-fira',
  'x2-leblanc-blizzara',
  'x2-leblanc-thundara',
  'x2-leblanc-watera',
] as const;

export const leblancScript: AiScript = {
  id: 'ffx2-leblanc',

  decide(ctx: AiContext): Command | null {
    const turn = nextTurn(ctx);
    const uses = mem(ctx.self, 'noLoveLostUses');

    const ormi = livingAlly(ctx, 'ormi');
    const logos = livingAlly(ctx, 'logos');

    // Override 1 — the trio combo. Requires **both** henchmen to have HP.
    if (turn % NO_LOVE_LOST_PERIOD === NO_LOVE_LOST_PHASE && ormi && logos) {
      setMem(ctx.self, 'noLoveLostUses', uses + 1);
      return { kind: 'ability', id: 'x2-nll-1', targets: [] };
    }

    // Override 2 — the failsafe.
    if (turn > FAILSAFE_TURN + uses) {
      return { kind: 'ability', id: 'x2-leblanc-not-so-mighty-guard', targets: [] };
    }

    // The basic loop: turn 1 once, then turns 2..6 repeating.
    const step = turn === 1 ? 1 : ((turn - 2) % 5) + 2;

    if (step === 1 || step === 5) {
      return { kind: 'ability', id: 'x2-leblanc-not-so-mighty-guard', targets: [] };
    }
    if (step === 2) {
      return { kind: 'ability', id: 'x2-leblanc-fan-slap', targets: randomPartyTarget(ctx) };
    }
    if (step === 3) {
      if (ctx.self.mp <= OSMOSE_MP_GATE) {
        return { kind: 'ability', id: 'x2-leblanc-osmose', targets: randomPartyTarget(ctx) };
      }
      const spell = ctx.rng.pick([...LEBLANC_ELEMENTS]);
      return { kind: 'ability', id: spell, targets: randomPartyTarget(ctx) };
    }
    if (step === 4) {
      // 4A / 4B, one coin flip. Each branch names one henchman and falls back
      // to White Wind when *that* one is down — which is why killing Logos
      // first already costs her half her support turns.
      const favoured = ctx.rng.int(0, 1) === 0 ? ormi : logos;
      if (favoured) {
        return { kind: 'ability', id: 'x2-leblanc-love-tap', targets: [favoured.id] };
      }
      return { kind: 'ability', id: 'x2-leblanc-white-wind', targets: [] };
    }

    // Step 6 — Mach Fan 3/5, Flash Bomb 1/5, Hush Grenade 1/5.
    const roll = ctx.rng.int(0, 4);
    if (roll <= 2) return { kind: 'ability', id: 'x2-leblanc-mach-fan', targets: [] };
    if (roll === 3) return { kind: 'ability', id: 'x2-leblanc-flash-bomb', targets: [] };
    return { kind: 'ability', id: 'x2-leblanc-hush-grenade', targets: [] };
  },
};

// ---------------------------------------------------------------------------
// Logos — **AUTHORED, not canon** [§5.3, §13 G3]
// ---------------------------------------------------------------------------
//
// **No AI script is published for Logos, in any of his fights.** His infobox
// carries no `aiscript` flag where Leblanc's and Ormi's do. What *is* known is
// his Last Room ability set: Hail of Bullets + Russian Roulette on top of
// Double Shot.
//
// §13's recommended reconstruction, shipped here and labelled: a **3-turn loop
// of Double Shot, Double Shot, then Russian Roulette or Hail of Bullets**,
// because the two published Syndicate scripts are both 3-6 turn loops with an
// action-count override and that is the house shape. Nothing about the
// encounter's design depends on the reconstruction being right; what it must
// not do is present itself as canon.

/** AUTHORED. §13 G3 — no source publishes Logos' script. */
export const LOGOS_SCRIPT_IS_AUTHORED = true;

export const logosScript: AiScript = {
  id: 'ffx2-leblanc-logos',

  decide(ctx: AiContext): Command | null {
    const turn = nextTurn(ctx);
    const step = ((turn - 1) % 3) + 1;

    if (step <= 2) {
      return { kind: 'ability', id: 'x2-logos-double-shot', targets: randomPartyTarget(ctx) };
    }
    if (ctx.rng.int(0, 1) === 0) {
      return { kind: 'ability', id: 'x2-logos-russian-roulette', targets: randomPartyTarget(ctx) };
    }
    return { kind: 'ability', id: 'x2-logos-hail-of-bullets', targets: [] };
  },
};

// ---------------------------------------------------------------------------
// The two goons — Act I only. §4.6
// ---------------------------------------------------------------------------
//
// **AUTHORED.** §4.6 publishes the goons' ability *lists* and nothing about how
// they choose. Both scripts do the least interesting thing that uses the whole
// published list: the Dr. Goon has one action, and the Fem-Goon picks uniformly
// from hers. They exist to make Act I's lesson — Def 120 versus MDef 4 —
// legible, not to be a threat.

export const drGoonScript: AiScript = {
  id: 'ffx2-leblanc-dr-goon',
  decide: (ctx) => ({ kind: 'ability', id: 'x2-goon-strike', targets: randomPartyTarget(ctx) }),
};

const FEM_GOON_PARTY_WIDE = [
  'x2-fem-goon-fire',
  'x2-fem-goon-blizzard',
  'x2-fem-goon-thunder',
  'x2-fem-goon-water',
] as const;

const FEM_GOON_SINGLE = [
  'x2-fem-goon-fira',
  'x2-fem-goon-blizzara',
  'x2-fem-goon-thundara',
  'x2-fem-goon-watera',
  'x2-leblanc-fan-slap',
] as const;

export const femGoonScript: AiScript = {
  id: 'ffx2-leblanc-fem-goon',
  decide(ctx: AiContext): Command | null {
    if (ctx.rng.int(0, 1) === 0) {
      return { kind: 'ability', id: ctx.rng.pick([...FEM_GOON_PARTY_WIDE]), targets: [] };
    }
    return {
      kind: 'ability',
      id: ctx.rng.pick([...FEM_GOON_SINGLE]),
      targets: randomPartyTarget(ctx),
    };
  },
};

export const leblancSyndicateScripts: readonly AiScript[] = [
  leblancScript,
  logosScript,
  ormiScript,
  drGoonScript,
  femGoonScript,
];

export default leblancSyndicateScripts;
