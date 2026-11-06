/**
 * **The six other Dark Aeons' rules, as numbers** (FFX only; the hidden Dark Aeons chapter, number 34; `research/re-ffx-dark-aeons-six.md`, "RE six n"). The scripts themselves are `./dark-aeons-six.ts`; this file holds
 * what they read, so that both stay under the house limit [AGENTS.md hard rule 7] and every number has one home and one source. **Every number here is the note's** (rule 6): the six scripts of the game's own monster files
 * (m334 to m339), read from the bytes and run in the earlier lanes' interpreter with exact tallies over all 65,536 results of the random stream (`[bytes] [run]` there). Nothing in this file is an estimate of ours.
 *
 * ## The gauges (RE six 3 and 4)
 *
 * | | per own turn | per allowed hit event | draw on an ordinary turn | Counter |
 * |---|---:|---:|---|---|
 * | Dark Valefor | +5 | +15 | `GetRandomValue() mod 4`: 0 Energy Ray (all), 1 Sonic Wings (one), 2 and 3 Attack (one) | none |
 * | Dark Ifrit | +10 | +5 | none: Meteor Strike on one, every time | his Attack on the attacker, on every allowed hit event |
 * | Dark Ixion, first fight | +5 | +10 | none: Thundaja on one, every time | his Attack on the attacker, on every allowed hit event |
 * | Dark Ixion, second fight | +10 | +10 | `mod 3`: 0 Aerospark (one), 1 and 2 Attack (one) | none |
 * | Dark Shiva | +10 | +10 | `mod 3`: 0 Heavenly Strike (one), 1 and 2 Attack (one) | none |
 * | Dark Bahamut | +10 | +10 | none: Attack on one, every time | Impulse on the whole front line on every fifth allowed hit event |
 * | Dark Anima | +10 | +5, **ungated** | `mod 3`: 0 Mega Graviton (all), 1 Pain (one), 2 Attack (one) | none |
 *
 * A gauge of 100 or more is the Overdrive on the next turn (Energy Blast, Hellfire, Aerospark, Thor's Hammer, Diamond Dust, Mega Flare, Oblivion): the gauge is written 0 first and **nothing is added after an Overdrive**
 * (the interpreter's "gauge-after 0"). A "hit event" is one per action that reaches the aeon, a miss and a status-only command included, however many blows the action has (RE six 3); the gain and the counter are gated by
 * `isCounterattackAllowed()` (`./hit-gates.ts#counterAllowed`: the owner can act and the hit is not part of a reaction), **except Dark Anima's gain, which has no gate**. A single-target move picks a random living front-line
 * character (stream 4, a draw only with two or more). Dark Ifrit's and Dark Ixion's Hellfire and Thor's Hammer have a second row for "Anima on the field" with identical numbers; the carried one is used always (RE six 4.2).
 */

/** The AI script ids and the combatant ids (copies of `src/data/ffx/dark-aeons-six-ids.ts`: the battle layer imports no `src/data`; `tests/unit/chapters/dark-aeons-six-data.test.ts` pins the copies equal). */
export const SIX_SCRIPTS = {
  valefor: 'dark6-valefor',
  ifrit: 'dark6-ifrit',
  ixion1: 'dark6-ixion-1',
  ixion2: 'dark6-ixion-2',
  shiva: 'dark6-shiva',
  anima: 'dark6-anima',
  bahamut: 'dark6-bahamut',
} as const;

/** The ability ids (copies of `src/data/ffx/enemies/dark-aeons-six-abilities.ts#DARK_SIX_ROWS`, plus the row Dark Anima shares with the Dark Magus Sisters). */
export const SIX_ROWS = {
  valeforAttack: 'dark6-valefor-attack',
  energyRay: 'dark6-energy-ray',
  sonicWings: 'dark6-sonic-wings',
  energyBlast: 'dark6-energy-blast',
  meteorStrike: 'dark6-meteor-strike',
  ifritAttack: 'dark6-ifrit-attack',
  hellfire: 'dark6-hellfire',
  thundaja: 'dark6-thundaja',
  ixionAttack1: 'dark6-ixion-attack-1',
  aerospark: 'dark6-aerospark',
  ixionAttack2: 'dark6-ixion-attack-2',
  thorsHammer: 'dark6-thors-hammer',
  shivaAttack: 'dark6-shiva-attack',
  heavenlyStrike: 'dark6-heavenly-strike',
  diamondDust: 'dark6-diamond-dust',
  impulse: 'dark6-impulse',
  megaFlare: 'dark6-mega-flare',
  animaAttack: 'dark6-anima-attack',
  pain: 'dark6-pain',
  oblivion: 'dark6-oblivion',
  megaGraviton: 'dark-mega-graviton',
} as const;

/** Property 20 (the gauge's maximum) is written 100 in all six scripts (RE six 4). */
export const SIX_GAUGE_FULL = 100;

/** The gauge a turn and an allowed hit event add (RE six 4.1 to 4.6, table 4.7). */
export interface SixGain {
  readonly perTurn: number;
  readonly perHit: number;
}
export const SIX_GAINS = {
  valefor: { perTurn: 5, perHit: 15 },
  ifrit: { perTurn: 10, perHit: 5 },
  ixion1: { perTurn: 5, perHit: 10 },
  ixion2: { perTurn: 10, perHit: 10 },
  shiva: { perTurn: 10, perHit: 10 },
  bahamut: { perTurn: 10, perHit: 10 },
  anima: { perTurn: 10, perHit: 5 },
} as const satisfies Record<string, SixGain>;

/** The draws: `GetRandomValue() mod n` (RE six 4.1, 4.3, 4.4, 4.6). */
export const SIX_DRAW_MODULO = { valefor: 4, ixion2: 3, shiva: 3, anima: 3 } as const;

/** Dark Bahamut's Impulse comes on every fifth allowed hit event (RE six 4.5). */
export const IMPULSE_EVERY = 5;
/** The memory slot of Dark Bahamut's private hit counter (the game's `v1`; reset to 0 at five). */
export const IMPULSE_COUNTER = 'dark6.impulseHits';

/** The tag on an enemy gauge these scripts own (`EnemyFields`' `enemyGaugeRules` is a string tag only). */
export const SIX_GAUGE_RULES = 'dark-aeons-six';

/** One formation as the setup sees it: who stands in it, and the Overdrive row whose gauge it shows. Group ids are copies of `data/ffx/dark-aeons-six-ids.ts`. */
export interface SixFormation {
  readonly bodyId: string;
  readonly overdrive: string;
  /** Dark Ixion's second fight: the current HP his script writes over the record's maximum (RE six 4.3). */
  readonly currentHp?: number;
}
export const SIX_FORMATIONS: Readonly<Record<string, SixFormation>> = {
  'dark-aeons-valefor': { bodyId: 'dark-valefor', overdrive: SIX_ROWS.energyBlast },
  'dark-aeons-ifrit': { bodyId: 'dark-ifrit', overdrive: SIX_ROWS.hellfire },
  'dark-aeons-ixion-1': { bodyId: 'dark-ixion', overdrive: SIX_ROWS.aerospark },
  'dark-aeons-ixion-2': { bodyId: 'dark-ixion-2', overdrive: SIX_ROWS.thorsHammer, currentHp: 1_300_000 },
  'dark-aeons-shiva': { bodyId: 'dark-shiva', overdrive: SIX_ROWS.diamondDust },
  'dark-aeons-anima': { bodyId: 'dark-anima', overdrive: SIX_ROWS.oblivion },
  'dark-aeons-bahamut': { bodyId: 'dark-bahamut', overdrive: SIX_ROWS.megaFlare },
};
