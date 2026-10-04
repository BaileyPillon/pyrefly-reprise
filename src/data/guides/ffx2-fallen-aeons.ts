/**
 * Chapter XI — Shiva, the Magus Sisters, then Anima on the Road to the Farplane
 * [research/ffx2-fallen-aeons.md].
 *
 * Written against the tactic in `src/engine/tactics/ffx2-fallen-aeons.ts`: every `labels` entry
 * below is a row that file asks for, so each hint explains the command the player is told to press.
 *
 * **Game case: FFX-2 only** [AGENTS.md rule 14]. ATB, dresspheres, the aeons' action counter.
 *
 * ## What it says, and on whose word
 *
 * - The numbers and behaviours are the research's: Shiva's Fire weakness and Ice absorption and
 *   Heavenly Strike's Stop (§3.1, §4.1; the Stop chance itself is SinirothX only, so no chance is
 *   printed); Delta Attack's three-alive condition and the first kill disarming it for good
 *   (§4.2, `[verified: 4 sources]`); Cindy's Not-So-Mighty Guard (§4.2); Pain's statuses and
 *   stacking losses (§4.3); the Dark Knight clear (§5, `[verified: 3 sources]`).
 * - The Save Sphere between links and the retry from the lost link are Bailey's picks on a
 *   sourced conflict (FA2 b and FA3 b, research §9 F-1): the rule says what the chapter does.
 * - **The Wait split's habit** (`clockRules.wait`, decision sheet 2026-09-25 item 3): the line
 *   exactly as main ships it for every FFX-2 guide ({@link WAIT_SPLIT_HABIT_RULE}).
 * - Holy is Anima's one weakness (§3.3) but this preset learns no Holy (`builds/farplane.ts`), so
 *   no line tells the player to use it.
 */

import type { ChapterGuide, GuideHint, GuidePhase, GuideRule } from './types.ts';
import { WAIT_SPLIT_HABIT_RULE } from './ffx2-wait-habit.ts';

/** The five combatant ids, link by link (`src/engine/tactics/ffx2-fallen-aeons.ts` registers the same). */
const IDS = { shiva: 'x2-shiva', sandy: 'sandy', cindy: 'cindy', mindy: 'mindy', anima: 'x2-anima' } as const;

const SHIVA: GuideRule = {
  text: 'Shiva: Fire hurts her and Ice heals her. Heavenly Strike halves a girl\'s HP and MP and can Stop her; a Remedy cures Stop.',
  short: 'Shiva: a Remedy cures Stop, no Ice',
  cite: 'ffx2-fallen-aeons §3.1, §4.1',
};
const DELTA: GuideRule = {
  text: 'Delta Attack needs all three Sisters standing: bring any one of them down and it is gone for good. Dispel the guard Cindy puts on her sisters.',
  short: 'Down one Sister and Delta Attack is gone',
  cite: 'ffx2-fallen-aeons §4.2',
};
const PAIN: GuideRule = {
  text: 'Anima\'s Pain brings Silence, Darkness and Itchy, and its stat losses stack. A Remedy clears the statuses; the losses stay for the fight.',
  short: 'Anima: a Remedy after each Pain',
  cite: 'ffx2-fallen-aeons §4.3',
};
const DARKNESS: GuideRule = {
  text: 'Two Dark Knights on Darkness do the damage in all three fights, and Yuna keeps them standing.',
  short: 'Two Dark Knights on Darkness, Yuna heals',
  cite: 'ffx2-fallen-aeons §5',
};
const SAVE_SPHERE: GuideRule = {
  text: 'A Save Sphere between the platforms restores HP and MP, and a loss starts again from the platform you lost on.',
  short: 'HP and MP refill between platforms',
  cite: 'ffx2-fallen-aeons §6.2, §9 F-1',
};

const HINTS: GuideHint[] = [
  { when: { labels: ['Remedy'], targetHas: 'stop' }, text: 'Cure {target}\'s Stop: a stopped girl loses every turn until it wears off', cite: 'ffx2-fallen-aeons §4.1' },
  { when: { labels: ['Remedy'], bossId: IDS.anima }, text: 'Clear the Silence and Darkness Pain left on {target}', cite: 'ffx2-fallen-aeons §4.3' },
  { when: { labels: ['Dispel'] }, text: 'Strip the Protect, Shell and Regen Cindy put on {target}', cite: 'ffx2-fallen-aeons §4.2' },
  { when: { labels: ['Darkness'], bossId: IDS.shiva }, text: 'Darkness is the damage line; Fire is her weakness, Ice would heal her', cite: 'ffx2-fallen-aeons §3.1, §5' },
  { when: { labels: ['Darkness'] }, text: 'Darkness hits every enemy at once: the damage line the clears use', cite: 'ffx2-fallen-aeons §5' },
  { when: { labels: ['Shell'] }, text: 'Shell for the party early, before the spells land', cite: 'ffx2-fallen-aeons §5' },
  { when: { labels: ['Protect'] }, text: 'Protect for the party early, against the physical hits', cite: 'ffx2-fallen-aeons §5' },
  { when: { labels: ['Mega Phoenix'] }, text: 'Two girls are down: one Mega Phoenix stands them both up', cite: 'ffx2-fallen-aeons §5' },
  { when: { labels: ['Phoenix Down', 'Life'] }, text: 'Stand {target} back up', cite: 'ffx2-fallen-aeons §5' },
  { when: { labels: ['Megalixir'] }, text: 'Two girls are near the floor: one Megalixir refills everyone', cite: 'ffx2-fallen-aeons §5' },
  { when: { labels: ['Mega-Potion'] }, text: 'Two girls are down by half: a Mega-Potion tops up everyone', cite: 'ffx2-fallen-aeons §5' },
  { when: { labels: ['X-Potion', 'Curaga'] }, text: '{target} is low: a big heal now', cite: 'ffx2-fallen-aeons §5' },
  { when: { labels: ['Cura'] }, text: 'Top {target} up while nothing worse needs her', cite: 'ffx2-fallen-aeons §5' },
  { when: { labels: ['Turbo Ether'] }, text: 'Yuna is low on MP: refill it before the next heal', cite: 'ffx2-fallen-aeons §5' },
  { when: { labels: ['Pray'] }, text: 'Nothing needs her: Pray tops up the whole party', cite: 'ffx2-fallen-aeons §5' },
];

const PHASES: GuidePhase[] = [
  {
    bossId: IDS.shiva,
    label: 'SHIVA',
    note: 'Every blow on her brings Diamond Dust sooner. Keep the party healed.',
    cite: 'ffx2-fallen-aeons §4.1',
  },
  ...[IDS.sandy, IDS.cindy, IDS.mindy].map((bossId) => ({
    bossId,
    label: 'THE MAGUS SISTERS',
    note: 'Delta Attack takes all three. Once one sister falls, it never comes.',
    cite: 'ffx2-fallen-aeons §4.2',
  })),
  {
    bossId: IDS.anima,
    aboveHpFraction: 0.5,
    label: 'ANIMA',
    note: 'A long fight: her Pain losses pile up, so answer each one.',
    cite: 'ffx2-fallen-aeons §4.3',
  },
  {
    bossId: IDS.anima,
    label: 'BELOW HALF',
    note: 'Every blow on her still brings Oblivion sooner. Stay healed.',
    cite: 'ffx2-fallen-aeons §4.3',
  },
];

export const FFX2_FALLEN_AEONS_GUIDE: ChapterGuide = {
  id: 'ffx2-fallen-aeons',
  title: 'Fallen Aeons',
  bossIds: [IDS.shiva, IDS.sandy, IDS.cindy, IDS.mindy, IDS.anima],
  rules: [SHIVA, DELTA, PAIN, DARKNESS, SAVE_SPHERE],
  hints: HINTS,
  watch: [],
  phases: PHASES,
  // The headline names the link that stands (FOC16-06), in play order.
  linkTitles: {
    [IDS.shiva]: 'Shiva',
    [IDS.sandy]: 'Magus Sisters',
    [IDS.cindy]: 'Magus Sisters',
    [IDS.mindy]: 'Magus Sisters',
    [IDS.anima]: 'Anima',
  },
  clockRules: { wait: WAIT_SPLIT_HABIT_RULE },
};

export default FFX2_FALLEN_AEONS_GUIDE;
