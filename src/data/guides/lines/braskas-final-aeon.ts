/**
 * Chapter 3, Braska's Final Aeon, the possessed aeons and Yu Yevon: the guide's own line
 * (`../line-types.ts`).
 *
 * **Game case: FFX only** [AGENTS.md rule 14]: CTB, Talk's two charges, Soft, aeons, the Yu Pagodas.
 * Follows the FFX encounter guide the project settled on (D-350) as read in
 * `research/jegged-encounter-guides-ffx-a.md`, Chapter 3, for the first link: cure Petrify at once
 * (a shatter is permanent), keep Hastega, Protect and Regen up, spend both Talks in form 2, leave the
 * Yu Pagodas alone in form 1 and take them down together in form 2, and Break him (Armor, Mental).
 * The guide it follows has one line on Yu Yevon, a Reflect if the fight drags, and nothing on the
 * possessed aeons, so those links run on this chapter's own research
 * (`research/ffx-bfa-yu-yevon.md` §2, §3): Doom him with the Candle of Life, keep the Pagodas
 * down, never damage him.
 *
 * FFX's command window has no Defend row, so a turn nothing needs is a spare item on an ally. Steps
 * marked `support` are not the plan's own.
 */

import type { GuideLine } from '../line-types.ts';
import { FFX_HEALS, heal, revive, swing } from './kit.ts';

const F = "jegged-encounter-guides-ffx-a §Chapter 3";
const R = 'ffx-bfa-yu-yevon';

export const BRASKAS_FINAL_AEON_LINE: GuideLine = [
  {
    labels: ['Soft', 'Remedy', 'Esuna'],
    when: { partyHas: 'petrify' },
    aim: { has: 'petrify' },
    why: "Cure {target}'s Petrify now: the next physical hit shatters a petrified member for good",
    from: `${F}, plan 5`,
  },
  // ---- Yu Yevon: the guide it follows only says a Reflect helps if the fight drags
  {
    labels: ['Candle of Life'],
    when: { bossId: 'yu-yevon', bossLacks: 'doom' },
    aim: 'boss',
    why: 'Doom him with the Candle of Life: it kills him in three of his own turns and deals no damage he can heal back',
    from: `${R} §3.2, §3.5`,
    support: true,
  },
  {
    labels: ['Reflect'],
    when: { bossId: 'yu-yevon', bossLacks: 'reflect' },
    aim: 'boss',
    why: 'If the fight drags, put Reflect on him',
    from: `${F}, plan 8`,
  },
  {
    kinds: ['attack'],
    when: { bossId: 'yu-yevon' },
    aim: { parts: 'lowest' },
    why: 'Keep the Pagodas down: their Power Wave heals him more than his own Gravija takes off',
    from: `${R} §1.4, §3.5`,
    support: true,
  },
  {
    labels: ['Potion', 'Hi-Potion', 'Eye Drops', 'Echo Screen'],
    when: { bossId: 'yu-yevon' },
    aim: 'first',
    why: 'Nothing here is worth hitting: spend the turn on a spare item so no blow names him',
    from: `${R} §3.5`,
    support: true,
  },
  // ---- Braska's Final Aeon
  {
    labels: ['Talk'],
    when: { formIndex: 1, flagFrom: { 'bfa.gauge': 50 }, aeonOut: false },
    aim: 'first',
    why: 'Talk to him: it empties his Overdrive gauge and costs him his next turn. Spend both Talks in this form',
    from: `${F}, plan 6`,
  },
  {
    labels: ['Hastega'],
    when: { partyLacks: 'haste', partyLacksAtLeast: 2 },
    aim: 'first',
    why: 'Cast Hastega: his Overdrive comes on his clock, and the party answers it with more turns',
    from: `${F}, plan 4`,
  },
  {
    labels: ['Haste'],
    when: { partyLacks: 'haste' },
    aim: { lacks: 'haste', prefer: 'tidus' },
    why: 'Haste {target}: his Overdrive comes on his clock, and the party answers it with more turns',
    from: `${F}, plan 4`,
  },
  {
    labels: ['Protect'],
    when: { partyLacks: 'protect' },
    aim: { lacks: 'protect' },
    why: 'Put Protect on {target}: his Blade Blitz and the shatter that follows a Petrify are physical',
    from: `${F}, plan 4`,
  },
  {
    labels: ['Regen'],
    when: { partyLacks: 'regen' },
    aim: { lacks: 'regen' },
    why: 'Put Regen on {target}: it keeps the party topped up between the big hits',
    from: `${F}, plan 4`,
  },
  {
    labels: ['Mental Break'],
    when: { bossLacks: 'mental-break', bossId: 'braskas-final-aeon' },
    aim: 'boss',
    why: 'Mental Break him: every spell and Overdrive of yours lands harder',
    from: `${F}, plan 7`,
  },
  {
    labels: ['Armor Break'],
    when: { bossLacks: 'armor-break', bossId: 'braskas-final-aeon' },
    aim: 'boss',
    why: 'Armor Break him: every sword swing lands harder',
    from: `${F}, plan 7`,
  },
  // a fallen member and a low one come before the damage steps, or the swings below would shadow them for the whole fight
  { ...revive(`${F}, fit`), support: true },
  { ...heal(`${F}, fit`, 0.5, FFX_HEALS), support: true },
  {
    kinds: ['attack'],
    when: { formIndex: 1, bossId: 'braskas-final-aeon' },
    aim: { parts: 'highest' },
    why: 'Take the Pagodas down together: hit the sturdier one first so both fall in the same round, because a lone one starts casting Curse',
    from: `${F}, plan 3`,
  },
  // ---- the possessed aeons: the guide it follows does not cover them
  {
    kinds: ['overdrive'],
    when: { aeonOut: false },
    aim: 'boss',
    why: 'Spend the full gauge: the chain gives it back between links',
    from: `${R} §2.2`,
    support: true,
  },
  swing(`${F}, plan 1`, 'Swing at {target}'),
];
