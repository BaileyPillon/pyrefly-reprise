/**
 * Chapter 6, the Leblanc Syndicate at Chateau Leblanc: the guide's own line (`../line-types.ts`).
 *
 * **Game case: FFX-2 only** [AGENTS.md rule 14]: ATB, dresspheres. The FFX-2 encounter guide the project
 * settled on (D-350; `research/jegged-encounter-guides-ffx2.md` §4) has nothing to follow for this fight:
 * three fights it calls easy, no numbers, no moves, no order. So the line is this chapter's own research
 * (`research/ffx2-leblanc-syndicate.md` §3.4, §4.4, §5.4, §6.2), and `support` is set on every step to say
 * so: kill Logos, then Ormi, then Leblanc; Dispel Not-So-Mighty Guard; magic and Cheap Shot through Ormi's
 * Defense; Armor Break on Ormi; keep the party topped up for Concussive Blast.
 */

import type { GuideLine } from '../line-types.ts';
import { FFX2_HEALS, FFX2_PARTY_HEALS, FFX2_REVIVES, revive, swing, pray } from './kit.ts';

const R = 'ffx2-leblanc-syndicate';
const F = 'jegged-encounter-guides-ffx2 §4';

/** Act I's goons, then Logos, then Ormi, then Leblanc: §5.4's order, with the earlier acts' ids (`killRank`). */
const KILL_ORDER = ['fem-goon', 'dr-goon', 'logos', 'logos-room', 'ormi', 'ormi-logos-room', 'ormi-entrance', 'leblanc'] as const;
const ORMI = ['ormi', 'ormi-logos-room', 'ormi-entrance'] as const;
/** Everyone who dies before Ormi in that order. */
const BEFORE_ORMI = ['fem-goon', 'dr-goon', 'logos', 'logos-room'] as const;

export const FFX2_LEBLANC_LINE: GuideLine = [
  { ...revive(`${R} §5.4`, FFX2_REVIVES), support: true },
  {
    labels: ['Dispel'],
    aim: { foeHas: 'protect' },
    why: 'Dispel strips Not-So-Mighty Guard in one action: Protect, Shell and Regen on all three go together',
    from: `${R} §4.4; ${F}`,
    support: true,
  },
  {
    labels: [...FFX2_PARTY_HEALS, ...FFX2_HEALS],
    when: { anyBelowHp: 0.6 },
    aim: 'weakest',
    why: "Heal {target}: Concussive Blast hits the whole party and no Defense stat reduces it, so bank the HP early",
    from: `${R} §5.4, §6.1`,
    support: true,
  },
  {
    labels: ['Armor Break'],
    when: { foeGone: BEFORE_ORMI },
    aim: { foes: ORMI, lacks: 'def-down' },
    why: "Armor Break Ormi: his Defense is 84, and the Break makes every physical hit land harder",
    from: `${R} §7.3`,
    support: true,
  },
  {
    labels: ['Fira', 'Blizzara', 'Thundara', 'Watera', 'Fire', 'Blizzard', 'Thunder', 'Water'],
    when: { foeGone: BEFORE_ORMI },
    aim: { foes: ORMI },
    why: "Cast at Ormi: his Magic Defense is only 16 against a Defense of 84, so spells are the route that hurts him",
    from: `${R} §3.4, §6.2`,
    support: true,
  },
  {
    labels: ['Cheap Shot'],
    when: { foeGone: BEFORE_ORMI },
    aim: { foes: ORMI },
    why: 'Cheap Shot ignores Defense outright, so it does not care that Ormi has 84',
    from: `${R} §6.2, §7.3`,
    support: true,
  },
  {
    kinds: ['attack'],
    aim: { foes: KILL_ORDER },
    why: 'Swing at {target}: Logos first, then Ormi, then Leblanc, so Ormi never reaches Huggles with company',
    from: `${R} §5.4`,
    support: true,
  },
  pray(`${R} §5.4`),
  swing(`${R} §5.4`, 'Swing at {target}'),
];
