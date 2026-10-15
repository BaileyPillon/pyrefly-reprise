/**
 * The hidden Biran and Yenke chapter: Kimahri alone against the two Ronso at the gate of Mt. Gagazet [research/ffx-biran-yenke.md "§n"].
 *
 * Written against the tactic in `src/engine/tactics/biran-yenke.ts`: every hint below explains a row that file asks for (White Wind and the potions, the two breaths, the single-target Rages,
 * Lancet, the Attack once the two stand apart), so each line says why the command the player is told to press is the right one.
 *
 * **Game case: FFX only** [AGENTS.md rule 14]. Biran and Yenke, Kimahri's Lancet and his Ronso Rage exist only in FFX; no FFX-2 file reads this one.
 *
 * Sourced facts only, and **Kimahri's numbers are not here**: his preset is an estimate (`data/ffx/builds/gagazet-gate.ts`), and the Ronso's numbers are written from his (§2.2), so no line
 * quotes a hit or an HP. The rules are §4: the guarding while they stand together and Bulldoze splitting them (§4.4, our model: Cover with Sentinel, so "at half"), Lancet teaching one Rage and
 * filling the gauge (§4.5), the last lesson of each only after his own cast below a quarter (§4.2), the fall of one (§4.3), Kimahri alone (§5) and Self-Destruct (§4.6). **Not modelled, so not
 * promised:** the rare Friend Sphere and the piece of equipment each Ronso drops are never mentioned.
 */

import type { ChapterGuide, GuideHint, GuidePhase, GuideRule } from './types.ts';

/** The two Ronso (`src/data/ffx/biran-yenke-ids.ts`; `tests/unit/chapters/biran-yenke-data.test.ts` pins the agreement): Biran first, the formation's boss. */
export const BIRAN_YENKE_GUIDE_IDS = ['biran-ronso', 'yenke-ronso'] as const;

const [BIRAN, YENKE] = BIRAN_YENKE_GUIDE_IDS;

const RULES: GuideRule[] = [
  {
    text: 'Side by side, Biran and Yenke guard each other: an Attack on one is taken by the other, at half. Lancet, items and every Ronso Rage get through. A Bulldoze moves its user to the other row, and while they stand apart nobody is covered.',
    short: 'Side by side, they guard each other',
    cite: 'ffx-biran-yenke §4.4, §3.3',
  },
  {
    text: 'Every Lancet that lands teaches Kimahri one Ronso Rage he does not know yet, and learning one fills his Overdrive gauge. Biran teaches Self-Destruct, Thrust Kick, Doom and Mighty Guard; Yenke Fire Breath, Stone Breath, Aqua Breath and White Wind.',
    short: 'Lancet them: each new Rage fills the gauge',
    cite: 'ffx-biran-yenke §4.5',
  },
  {
    text: 'Mighty Guard and White Wind are taught only after the Ronso has used it, and each uses his once, when he falls below a quarter of his HP. Bring each one low without finishing him, then Lancet him.',
    short: 'The last lessons come below a quarter',
    cite: 'ffx-biran-yenke §4.2, §4.5',
  },
  {
    text: 'If Yenke falls first, Biran goes berserk, only Bulldozes, and never casts Mighty Guard. If Biran falls first, Yenke hastes himself. Learn Mighty Guard before Yenke falls.',
    short: 'Keep Yenke up until Biran\'s Mighty Guard',
    cite: 'ffx-biran-yenke §4.3',
  },
  {
    text: 'Kimahri fights alone, so keep him above half: Hi-Potions and Potions, and White Wind once he has learned it. Never use Self-Destruct: it takes him out of the battle.',
    short: 'Kimahri is alone: keep him above half',
    cite: 'ffx-biran-yenke §5, §4.6',
  },
];

const HINTS: GuideHint[] = [
  { when: { labels: ['White Wind'] }, text: 'White Wind, Yenke\'s lesson: a full gauge spent on keeping Kimahri up', cite: 'ffx-biran-yenke §4.5, §5' },
  { when: { labels: ['Hi-Potion', 'Potion'] }, text: 'Kimahri fights alone: top him up before a Bulldoze and a breath land together', cite: 'ffx-biran-yenke §5, §4.1' },
  { when: { labels: ['Aqua Breath', 'Fire Breath'] }, text: 'A breath reaches both Ronso at once, and the guarding never catches a Ronso Rage', cite: 'ffx-biran-yenke §3.3, §4.4' },
  { when: { labels: ['Thrust Kick', 'Jump', 'Seed Cannon'] }, text: 'A full gauge on {target}: a Ronso Rage is never caught by the guarding', cite: 'ffx-biran-yenke §3.3, §4.4' },
  { when: { labels: ['Lancet'], targetId: YENKE }, text: 'Lancet passes the guard and drains, and teaches any Rage Yenke still has for Kimahri', cite: 'ffx-biran-yenke §4.5, §3.3' },
  { when: { labels: ['Lancet'], targetId: BIRAN }, text: 'Lancet passes the guard and drains, and teaches any Rage Biran still has for Kimahri', cite: 'ffx-biran-yenke §4.5, §3.3' },
  { when: { kinds: ['attack'] }, text: 'Nobody covers {target} now: the blow lands in full', cite: 'ffx-biran-yenke §4.4' },
];

const PHASES: GuidePhase[] = [
  {
    bossId: BIRAN,
    aboveHpFraction: 0,
    belowHpFraction: 0.25,
    label: 'BIRAN BELOW A QUARTER',
    note: 'Unless he has gone berserk, he casts Mighty Guard once now; a Lancet after it teaches it.',
    cite: 'ffx-biran-yenke §4.2, §4.3, §4.5',
  },
  {
    bossId: YENKE,
    aboveHpFraction: 0,
    belowHpFraction: 0.25,
    label: 'YENKE BELOW A QUARTER',
    note: 'He calls White Wind once now; a Lancet after it teaches it.',
    cite: 'ffx-biran-yenke §4.2, §4.5',
  },
  {
    label: 'THE MOUNTAIN GATE',
    note: 'Two Ronso and Kimahri alone. Lancet first: every Rage he learns fills his gauge.',
    cite: 'ffx-biran-yenke §4.5, §5',
  },
];

export const BIRAN_YENKE_GUIDE: ChapterGuide = {
  id: 'biran-yenke',
  title: 'Biran and Yenke',
  bossIds: [...BIRAN_YENKE_GUIDE_IDS],
  rules: RULES,
  hints: HINTS,
  watch: [],
  phases: PHASES,
};

export default BIRAN_YENKE_GUIDE;
