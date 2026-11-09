/**
 * **Belgemine's eight aeon duels at the Remiem Temple** (the hidden Belgemine's Challenge chapter, number 45; **FFX only**): the ids the scripts need, every constant with its source, and the encounter's setup hook.
 *
 * Source: `research/re-ffx-belgemine-aeon-duels.md` section 3 ("RE 3.n"), the ten monster scripts (`m254`, `m284` to `m291`, `m265`, `m266`) as the game's bytecode runs them, run in the earlier lanes' interpreter on all the
 * draws (`t-belgemine.out.txt`, `t-extra.out.txt`, `t-extra2.out.txt` of the note). The scripts are `./belgemine.ts` (Valefor, Ifrit, Ixion, Shiva), `./belgemine-b.ts` (Bahamut, Yojimbo and his dog, Anima) and
 * `./belgemine-sisters.ts` (the three Magus Sisters); the rows are `src/data/ffx/enemies/belgemine-abilities.ts` and the earlier chapters' (`./isaaru-rules.ts`, `./yojimbo-rules.ts`). **No number here is ours.**
 *
 * **Game case: FFX only** [AGENTS.md rule 14].
 *
 * The battle layer never imports `src/data`, so the ids are restated here; `tests/unit/chapters/belgemine-data.test.ts` pins every copy equal to `src/data/ffx/belgemine-ids.ts`.
 */

import type { Command, EnemyGroupDef, FFXCombatant } from '../../common/types.ts';
import { type Ctx, rtOf, tryActor } from '../state.ts';
import { setGauge } from '../overdrive.ts';
import { randomLiving } from './game-rolls.ts';
import { applyBossOpening } from './opening.ts';
import { type AiContext, use } from './types.ts';

// ---------------------------------------------------------------------------
// Ids (copies of `src/data/ffx/belgemine-ids.ts`)
// ---------------------------------------------------------------------------

export const BELGEMINE_ID = 'belgemine';
export const BELGEMINE_BYSTANDER_SCRIPT = 'belgemine-bystander';

export const BELG_IDS = {
  valefor: 'belg-valefor', ifrit: 'belg-ifrit', ixion: 'belg-ixion', shiva: 'belg-shiva', bahamut: 'belg-bahamut', yojimbo: 'belg-yojimbo', dog: 'belg-daigoro', anima: 'belg-anima', mindy: 'belg-mindy', sandy: 'belg-sandy', cindy: 'belg-cindy',
} as const;

export const BELG_SCRIPTS = {
  valefor: 'belg-valefor', ifrit: 'belg-ifrit', ixion: 'belg-ixion', shiva: 'belg-shiva', bahamut: 'belg-bahamut', yojimbo: 'belg-yojimbo', dog: 'belg-daigoro', anima: 'belg-anima', mindy: 'belg-mindy', sandy: 'belg-sandy', cindy: 'belg-cindy',
} as const;

/** The move rows the scripts queue (the earlier chapters' where the kernel row is the same: `isaaru-abilities.ts`, `yojimbo-abilities.ts`). */
export const BELG_ROWS = {
  summonValefor: 'pterya-summon', summonIfrit: 'grothia-summon', summonShiva: 'belg-summon-shiva', summonIxion: 'belg-summon-ixion', summonBahamut: 'spathi-summon', summonYojimbo: 'yojimbo-summon',
  summonAnima: 'belg-summon-anima', summonSisters: 'belg-summon-sisters', attackA: 'grothia-attack', attackB: 'grothia-attack-yuna', animaAttack: 'belg-anima-attack', sonicWings: 'pterya-sonic-wings',
  energyRay: 'pterya-energy-ray', energyBlast: 'belg-energy-blast', meteorStrike: 'belg-meteor-strike', hellfire: 'grothia-hellfire', aerospark: 'belg-aerospark', thorsHammer: 'belg-thors-hammer',
  heavenlyStrike: 'belg-heavenly-strike', diamondDust: 'belg-diamond-dust', impulse: 'belg-impulse', megaFlare: 'spathi-mega-flare', kozuka: 'yojimbo-kozuka', wakizashi: 'yojimbo-wakizashi',
  zanmato: 'yojimbo-zanmato', daigoroOrder: 'belg-daigoro-order', daigoroBite: 'daigoro-attack', pain: 'belg-pain', oblivion: 'belg-oblivion', razzia: 'belg-razzia', camisade: 'belg-camisade',
  passado: 'belg-passado', deltaAttack: 'belg-delta-attack', mightyGuard: 'belg-mighty-guard', whiteWind: 'belg-white-wind',
} as const;

/** The player's own spell rows the scripts cast by id. */
export const BELG_SPELLS = {
  blizzara: 'blizzara', blizzaga: 'blizzaga', fira: 'fira', firaga: 'firaga', thundara: 'thundara', thundaga: 'thundaga', watera: 'watera', waterga: 'waterga', flare: 'flare', ultima: 'ultima', holy: 'holy', drain: 'drain',
  osmose: 'osmose-spell', demi: 'demi', dispel: 'dispel', shell: 'shell', protect: 'protect', cura: 'cura', regen: 'regen', haste: 'haste',
} as const;

export const BELG_FLAGS = { guardCount: 'belgemine.guardCount', battleId: 'belgemine.battleId' } as const;
export const BELG_GAUGE_RULES = 'belgemine-aeon';

// ---------------------------------------------------------------------------
// The gauges and counts (RE 3.5 to 3.12)
// ---------------------------------------------------------------------------

/** A full gauge: the Overdrive on the next turn (RE 3.1: the maximum of every gauge is 100). */
export const GAUGE_FULL = 100;

/** Valefor (m254 f2/f3 @0x4cf to 0x6d3): +10 a turn; hit by a magical command +15 and the Energy Ray flag, any other allowed hit +5; the Ray needs a gauge of 30. */
export const VALEFOR = { perTurn: 10, perMagicHit: 15, perOtherHit: 5, rayAt: 30 } as const;
/** Ifrit (m284 @0x621 to 0x6f4, f3 @0x6fb): +7 a turn, +3 an allowed hit; MAG written 35 on an ordinary turn, 48 for Hellfire (45 after, never read). A physical hit raises the Meteor Strike flag. */
export const IFRIT = { perTurn: 7, perHit: 3, ordinaryMag: 35, hellfireMag: 48 } as const;
/** Ixion (m285 @0x3ed to 0x832, f3 @0x836): +5 an action and an ordinary hit, +25 a hit of the matching type while braced (magical) or evading (physical); Defense and Magic Defense 40, Evasion 10 reset every turn, 255 braced or evading. */
export const IXION = { perAction: 5, perMatchingHit: 25, perOtherHit: 5, resetDef: 40, resetMdef: 40, resetEva: 10, guarded: 255, draws: 4 } as const;
/** Shiva (m286 @0x34a to 0x662, f3 @0x666): +10 a turn, +20 for the Blizzaga that heals her (under half HP), +5 for a hit that took HP. */
export const SHIVA = { perTurn: 10, perHealTurn: 20, perHit: 5, draws: 4 } as const;
/** Bahamut (m287 @0x3cc to 0x4bc, f3 @0x4c0): +20 a turn (five empty turns, then Mega Flare); every allowed hit is countered, the fifth with Impulse. */
export const BAHAMUT = { perTurn: 20, impulseEvery: 5 } as const;
/** Yojimbo (m288 @0x382 to 0x52f, f3 @0x533): the Cavern's bands (25, 50, 80, 100), +2 a turn, +3 an allowed hit. */
export const YOJIMBO = { bandKozuka: 25, bandWakizashi: 50, bandHeightened: 80, perTurn: 2, perHit: 3 } as const;
/** Anima (m265 @0x289 to 0x3b6, f4): her own turns add nothing (the +10 at @0x324 is unreachable code); each hit she takes adds 5, ungated. */
export const ANIMA = { perHit: 5, draws: 10 } as const;
/** The Sisters (m289 to m291): +10 a turn (Mighty Guard and White Wind +5), +5 an allowed hit that took HP; Cindy's Mighty Guard counter starts at 4 and fires at 7. */
export const SISTERS = { perTurn: 10, perSmallTurn: 5, perHit: 5, guardStart: 4, guardAt: 7 } as const;

/** Memory keys (per actor, `rtOf(ctx, id).ai`). */
export const MEM = {
  firstDone: 'belgemine.firstDone',
  rayFlag: 'belgemine.rayFlag',
  meteorFlag: 'belgemine.meteorFlag',
  secondDone: 'belgemine.secondDone',
  braced: 'belgemine.braced',
  evading: 'belgemine.evading',
  empty: 'belgemine.empty',
  hits: 'belgemine.hits',
} as const;

// ---------------------------------------------------------------------------
// The acts: the bodies with a gauge, and each gauge's Overdrive row
// ---------------------------------------------------------------------------

interface ActSetup {
  readonly battleId: number;
  /** The bodies that carry an Overdrive gauge, with the row the gauge unlocks. */
  readonly gauges: ReadonlyArray<readonly [id: string, overdrive: string]>;
  /** Bodies with a turn that opens at counter 0 (the formation's start hook writes them). */
  readonly firstStrike: readonly string[];
  /** Bodies that only act on an order and never decide the battle. */
  readonly bystanders: readonly string[];
}

/** The eight formation groups (`src/data/ffx/belgemine-ids.ts` `BELG_ACTS`), by id. */
export const BELG_ACT_SETUP: Readonly<Record<string, ActSetup>> = {
  'belgemine-1-valefor': { battleId: 29229056, gauges: [[BELG_IDS.valefor, BELG_ROWS.energyBlast]], firstStrike: [BELG_IDS.valefor], bystanders: [BELGEMINE_ID] },
  'belgemine-2-ifrit': { battleId: 29229057, gauges: [[BELG_IDS.ifrit, BELG_ROWS.hellfire]], firstStrike: [BELG_IDS.ifrit], bystanders: [BELGEMINE_ID] },
  'belgemine-3-ixion': { battleId: 29229058, gauges: [[BELG_IDS.ixion, BELG_ROWS.thorsHammer]], firstStrike: [BELG_IDS.ixion], bystanders: [BELGEMINE_ID] },
  'belgemine-4-shiva': { battleId: 29229059, gauges: [[BELG_IDS.shiva, BELG_ROWS.diamondDust]], firstStrike: [BELG_IDS.shiva], bystanders: [BELGEMINE_ID] },
  'belgemine-5-bahamut': { battleId: 29229060, gauges: [[BELG_IDS.bahamut, BELG_ROWS.megaFlare]], firstStrike: [BELG_IDS.bahamut], bystanders: [BELGEMINE_ID] },
  'belgemine-6-yojimbo': { battleId: 29229061, gauges: [[BELG_IDS.yojimbo, BELG_ROWS.zanmato]], firstStrike: [BELG_IDS.yojimbo], bystanders: [BELGEMINE_ID, BELG_IDS.dog] },
  'belgemine-7-anima': { battleId: 29229062, gauges: [[BELG_IDS.anima, BELG_ROWS.oblivion]], firstStrike: [BELG_IDS.anima], bystanders: [BELGEMINE_ID] },
  'belgemine-8-sisters': {
    battleId: 29229063,
    gauges: [[BELG_IDS.mindy, BELG_ROWS.deltaAttack], [BELG_IDS.sandy, BELG_ROWS.deltaAttack], [BELG_IDS.cindy, BELG_ROWS.deltaAttack]],
    firstStrike: [BELG_IDS.cindy],
    bystanders: [BELGEMINE_ID],
  },
};

/**
 * The encounter's set-up, once from `./dark-aeons-setup.ts` (which `setup.ts#buildBattle` calls); a no-op in every battle whose group is not one of the eight.
 *
 * - **Every aeon's Overdrive gauge** is shown with a maximum of 100 and starts at 0 (RE 0: the harness's `OD 0`; no script writes a current value), tagged so the HUD can tell it from a party gauge.
 * - **Belgemine and Yojimbo's dog take no turns and are no part of the victory** (her script clears the turn, targetable and must-be-killed flags: RE 0; the dog's is the Cavern's): marked `ordersOnly` and `nonCombatant`.
 * - **The formation's start hook** (RE 3.1; the `lmyt01_0n` scripts' slot 137): the aeon is written Counter 0 and First Strike, each party slot goes up one tick, so the aeon's first turn (the Summon) comes before anyone's.
 *   **The Sisters' hook differs** (`lmyt01_07`): Cindy alone is written 0, and Mindy and Sandy are written the first character's counter plus 2, so the Summon is Cindy's and the other two follow it.
 */
export function applyBelgemineSetup(ctx: Ctx, group: EnemyGroupDef): void {
  const act = BELG_ACT_SETUP[group.id];
  if (act === undefined) return;
  ctx.state.flags[BELG_FLAGS.battleId] = act.battleId;
  for (const [id, overdrive] of act.gauges) {
    const c = tryActor(ctx, id);
    if (c !== undefined) c.overdrive = { gauge: 0, mode: 'stoic', unlockedOverdriveIds: [overdrive], enemyGaugeRules: BELG_GAUGE_RULES };
  }
  for (const id of act.bystanders) {
    if (tryActor(ctx, id) === undefined) continue;
    const rt = rtOf(ctx, id);
    rt.ordersOnly = true;
    rt.nonCombatant = true;
  }
  if (group.id === 'belgemine-8-sisters') {
    const first = ctx.state.activeIds[0];
    const base = first === undefined ? 0 : rtOf(ctx, first).ctb;
    for (const id of [BELG_IDS.mindy, BELG_IDS.sandy]) if (tryActor(ctx, id) !== undefined) rtOf(ctx, id).ctb = Math.min(255, base + 2);
  }
  applyBossOpening(ctx, act.firstStrike);
}

// ---------------------------------------------------------------------------
// Shared helpers of the scripts
// ---------------------------------------------------------------------------

/** The Overdrive gauge of a combatant (0 when it has none). */
export const gaugeOf = (c: FFXCombatant): number => c.overdrive?.gauge ?? 0;

/** Add to the gauge, capped at 100, the way the scripts write the property. */
export function gain(ctx: Ctx, self: FFXCombatant, amount: number, cause: string): void {
  setGauge(ctx, self, gaugeOf(self) + amount, cause);
}

/** `findMatchingChr` over the front line, then the row aimed at that one living character (a draw only with two or more standing). */
export function victimRow(ai: AiContext, row: string): Command {
  const target = randomLiving(ai.ctx);
  return use(ai, row, target === undefined ? [] : [target.id]);
}

/** The first call of a script is the Summon, aimed at Belgemine; later calls answer `undefined`. */
export function summonFirst(ai: AiContext, row: string): Command | undefined {
  if (ai.memory[MEM.firstDone] === true) return undefined;
  ai.memory[MEM.firstDone] = true;
  return use(ai, row, [BELGEMINE_ID]);
}
