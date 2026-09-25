/**
 * Chapter XV — the Den of Woe: the shades of Baralai, Gippal and Nooj, back to back under
 * Mushroom Rock Road [research/ffx2-gippal-den-of-woe.md].
 *
 * Written against the tactic in `src/engine/tactics/ffx2-den-of-woe.ts`, which plays the
 * chapter bench's intended line (`tests/unit/helpers/denOfWoeDrive.ts` `LINES.intended`): every
 * `labels` entry below is a row that tactic asks for, so each hint explains the command the
 * player is told to press.
 *
 * **Game case: FFX-2 only** [AGENTS.md rule 14]. ATB, dresspheres, the FFX-2 status set.
 *
 * Numbers are the research's: Baralai's counter at 8 and Drill Shot's 3/4 of max HP (§4.2,
 * the dump's value, G-5), Looming Glacier's MP to 0 and Stop (§4.2); Gippal's five-step cycle,
 * the random set with Mortar below a third, Bullseye's 9/16 of current HP that cannot kill
 * (§4.1, `[verified: 2 sources]`); Nooj's Greedy Aura, 3/16 of max HP and MP, and Lightfall,
 * 5,000 to everyone once at 2,999 HP or less (§4.3, the dump's trigger, G-2); the sourced line,
 * two Dark Knights on Darkness plus a healer and Protect first (§5, `[verified: 4 sources]`);
 * HP carried between the shades (§2, 2 sources). Carrying statuses and the dressphere too is our
 * reading of "no break" (GP3 a, `[derived]`), and the guide says only what the build does.
 *
 * The chapter preset has no Dark Matter or Hero Drink (GP6 a), so Yuna (2,488 max HP) cannot
 * outlast Lightfall: the guide says so and names the Phoenix Down (plan R3).
 *
 * The Wait split's habit line leads the RULES under Wait (`./ffx2-wait-habit.ts`, decision sheet
 * 2026-09-25 item 3 with D-136's wording), as main ships it for the FFX-2 guides.
 */

import type { ChapterGuide, GuideHint, GuidePhase, GuideRule } from './types.ts';
import { WAIT_SPLIT_HABIT_RULE } from './ffx2-wait-habit.ts';

/** The three shades, in the order they rise (`src/data/ffx2/enemies/den-of-woe.ts`). */
export const DEN_OF_WOE_BOSS_IDS = ['shade-baralai', 'shade-gippal', 'shade-nooj'] as const;
const [BARALAI, GIPPAL, NOOJ] = DEN_OF_WOE_BOSS_IDS;

/** Nooj's Lightfall line as a fraction of his 23,800 HP: "2,999 or less" (§4.3). */
const LIGHTFALL_AT = 2999 / 23800;

const RULES: GuideRule[] = [
  {
    text: 'Three shades, one after another, and nothing is healed between them: what one leaves you with, the next one meets.',
    short: 'No rest between the three shades',
    cite: 'ffx2-gippal-den-of-woe §2',
  },
  {
    text: 'Two Dark Knights on Darkness do the damage, and Yuna keeps them standing. Protect goes up first.',
    short: 'Darkness x2, Yuna heals, Protect first',
    cite: 'ffx2-gippal-den-of-woe §5',
  },
  {
    text: 'Baralai counts every blow. At eight, the last girl to hit him loses three quarters of her max HP; keep her healed.',
    short: 'Baralai: at 8 hits, Drill Shot',
    cite: 'ffx2-gippal-den-of-woe §4.2',
  },
  {
    text: 'Near the end Nooj calls down Lightfall, 5,000 to everyone, once. Yuna cannot survive it; have a Phoenix Down ready.',
    short: 'Nooj: Lightfall, 5,000 to all, once',
    cite: 'ffx2-gippal-den-of-woe §4.3, §5',
  },
];

const HINTS: GuideHint[] = [
  { when: { labels: ['Darkness'] }, text: "Darkness ignores Defense, even Nooj's 144, and costs HP, not MP", cite: 'ffx2-gippal-den-of-woe §5' },
  { when: { labels: ['Protect'] }, text: 'Protect for the party before the staff, the Grinder and the Mortar land', cite: 'ffx2-gippal-den-of-woe §5' },
  { when: { labels: ['Shell'] }, text: "Shell for the party: Glint and Absorb are Baralai's magic", cite: 'ffx2-gippal-den-of-woe §4.2' },
  { when: { labels: ['Light Curtain'] }, text: 'Protect on {target} from the bag while Yuna cannot cast', cite: 'ffx2-gippal-den-of-woe §5' },
  {
    when: { labels: ['Remedy'], bossId: BARALAI },
    text: "Cure {target}: Looming Glacier's Stop and his Silence both cost turns",
    cite: 'ffx2-gippal-den-of-woe §4.2',
  },
  { when: { labels: ['Remedy'] }, text: 'Cure {target}', cite: 'ffx2-gippal-den-of-woe §4.1' },
  {
    when: { labels: ['Curaga'], bossId: NOOJ },
    text: 'Keep {target} above 5,000 HP before Lightfall comes',
    cite: 'ffx2-gippal-den-of-woe §4.3, §5',
  },
  { when: { labels: ['Curaga', 'Cura', 'X-Potion'] }, text: 'Top {target} up before the next hit', cite: 'ffx2-gippal-den-of-woe §5' },
  { when: { labels: ['Mega-Potion'] }, text: 'Two girls are low: a Mega-Potion tops up everyone', cite: 'ffx2-gippal-den-of-woe §5' },
  { when: { labels: ['Megalixir'] }, text: 'Two girls are near the floor: one Megalixir refills everyone', cite: 'ffx2-gippal-den-of-woe §5' },
  {
    when: { labels: ['Mega Phoenix'], bossId: NOOJ },
    text: 'Lightfall took more than one: stand everyone back up',
    cite: 'ffx2-gippal-den-of-woe §4.3',
  },
  { when: { labels: ['Phoenix Down', 'Mega Phoenix'] }, text: 'Stand {target} back up', cite: 'ffx2-gippal-den-of-woe §5' },
  { when: { labels: ['Turbo Ether'] }, text: 'Yuna needs MP for Curaga, and Greedy Aura takes it', cite: 'ffx2-gippal-den-of-woe §4.3' },
  { when: { labels: ['Pray'] }, text: 'Nothing urgent: Pray keeps everyone ticking up', cite: 'ffx2-gippal-den-of-woe §5' },
  {
    when: { kinds: ['attack'], bossId: NOOJ },
    text: 'A plain swing while Nooj is near the end: Darkness would take {actor} to 5,000 HP or less before Lightfall',
    cite: 'ffx2-gippal-den-of-woe §4.3, §5',
  },
];

const PHASES: GuidePhase[] = [
  {
    bossId: BARALAI,
    aboveHpFraction: 1 / 3,
    label: 'BARALAI',
    note: 'Five steps, then round again: a strike, Glint, three blows, Looming Glacier, then Silence or Absorb.',
    cite: 'ffx2-gippal-den-of-woe §4.2',
  },
  {
    bossId: BARALAI,
    label: 'BARALAI, BELOW A THIRD',
    note: 'He may Regen or raise his own guard now. Finish him before it pays for itself.',
    cite: 'ffx2-gippal-den-of-woe §4.2',
  },
  {
    bossId: GIPPAL,
    aboveHpFraction: 1 / 3,
    label: 'GIPPAL',
    note: 'Grinder, a swing, Grinder, a swing, then Bullseye, which takes 9/16 of your HP but never kills.',
    cite: 'ffx2-gippal-den-of-woe §4.1',
  },
  {
    bossId: GIPPAL,
    label: 'GIPPAL, BELOW A THIRD',
    note: 'The pattern breaks: any of his moves can come, Mortar among them. Heal before you finish him; Nooj is next.',
    cite: 'ffx2-gippal-den-of-woe §4.1, §2',
  },
  {
    bossId: NOOJ,
    aboveHpFraction: LIGHTFALL_AT,
    label: 'NOOJ',
    note: "Two swings, a blow through Magic Defense, a swing, then Greedy Aura: 3/16 of everyone's max HP and MP.",
    cite: 'ffx2-gippal-den-of-woe §4.3',
  },
  {
    bossId: NOOJ,
    label: 'NOOJ, LAST STRETCH',
    note: 'Lightfall comes once in here, 5,000 to everyone. After it, nothing new is coming.',
    cite: 'ffx2-gippal-den-of-woe §4.3',
  },
];

/** Chapter XV's guide. */
export const FFX2_DEN_OF_WOE_GUIDE: ChapterGuide = {
  id: 'ffx2-den-of-woe',
  title: 'The Den of Woe',
  bossIds: [...DEN_OF_WOE_BOSS_IDS],
  // The headline names the standing shade (FOC16-06's field, `engine/tactics/lookup.ts` `guideTitle`).
  linkTitles: { [BARALAI]: 'Baralai', [GIPPAL]: 'Gippal', [NOOJ]: 'Nooj' },
  rules: RULES,
  hints: HINTS,
  watch: [],
  phases: PHASES,
  clockRules: { wait: WAIT_SPLIT_HABIT_RULE },
};

export default FFX2_DEN_OF_WOE_GUIDE;
