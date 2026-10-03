/**
 * Evrae, on the deck of the *Fahrenheit* [research/ffx-evrae-airship.md].
 *
 * Written against the tactic in `src/engine/tactics/evrae.ts`: every `labels`
 * entry below is a row that file actually asks for, so a hint fires for the
 * command the player is being told to press rather than for a name that only
 * exists in the research.
 *
 * **Game case: FFX only** [AGENTS.md rule 14]. `research/ffx-evrae-airship.md`
 * §0.4 fences the whole encounter to FFX: the airship distance mechanic, the
 * Trigger Commands and the three-active/three-reserve bench "have no X-2
 * counterpart". Nothing here is true of FFX-2.
 *
 * The RULES and the NEXT line (`./lines/evrae.ts`) follow the FFX encounter guide the project
 * settled on (D-350, `research/jegged-encounter-guides-ffx-a.md` Chapter 8); `cite` names the
 * research section behind each mechanic and is never rendered. The `hints` below are the move
 * advisor's borrowed sentences for the chapter tactic's pick (`src/engine/tactics/evrae.ts`): the
 * panel does not read them.
 */

import type { ChapterGuide } from './types.ts';
import { EVRAE_LINE } from './lines/evrae.ts';

export const EVRAE_GUIDE: ChapterGuide = {
  id: 'evrae-airship',
  title: 'Evrae',
  bossIds: ['evrae'],

  rules: [
    {
      text: 'Pull the ship back first. Cid can move the ship or fire the missiles, never both, and Evrae is weak at range, so let him work. One volley is about 2,400, and it costs the party no turn at all. Pull back again whenever the party needs to recover.',
      short: 'Pull back first, and whenever you must recover',
      cite: 'ffx-evrae-airship §4.2, §7.4, §8 row 1',
    },
    {
      text: 'Spend the time at range on buffs. Tidus Cheers up to five, which works at any distance, and Wakka keeps attacking, because his shots reach no matter how far the ship is.',
      short: 'At range: Cheer to five; Wakka keeps swinging',
      cite: 'ffx-evrae-airship §4.3, §8 row 3',
    },
    {
      text: 'The Al Bhed Potion is the only heal in this party, and Rikku carries it. It is party-wide, heals exactly 1,000, and cures Poison, Silence and Petrify in the same cast. A petrified member is one Swooping Scythe from being gone for good.',
      short: 'Al Bhed Potion heals and cures; use it early',
      cite: 'ffx-evrae-airship §6.4, §3.3 note 3, §8 row 2',
    },
    {
      text: 'Slow it before its bar drops under a third. At that point it casts Haste on itself, and it casts it again every time you Slow it, which undoes the Slow. Reflect on it turns the same Haste onto your party instead.',
      short: 'Slow it before it Hastes itself',
      cite: 'ffx-evrae-airship §6.3, §6.5, §8 rows 5 and 11',
    },
    {
      text: 'When Evrae inhales while the ship is far, do nothing that names it. Attacking makes it Swoop in and breathe anyway. The dodge is refusing the bait, and a turn spent on an ally is the play.',
      short: 'Ship far and it inhales: do not attack',
      cite: 'ffx-evrae-airship §4.5, §8 row 8',
    },
  ],

  hints: [
    {
      when: { labels: ['Pull back', 'Pull Back'] },
      text: "Cid pulls the ship out of reach — Poison Breath and Swooping Scythe cannot land while it is FAR, and Cid's missiles only fire from out here",
      cite: 'ffx-evrae-airship §4.1, §4.2',
    },
    {
      when: { labels: ['Close in', 'Close In'] },
      text: 'Bring the ship NEAR when nothing is charging — Wakka and Lulu can reach at either range, but the rest of the party needs this to swing at all',
      cite: 'ffx-evrae-airship §4.3, §4.4',
    },
    {
      when: { labels: ['Al Bhed Potion'] },
      text: 'Stand the party back up to 1,000 and clear Poison, Silence and Petrify in one cast — the only heal this party has without Yuna',
      cite: 'ffx-evrae-airship §6.4',
    },
    {
      when: { labels: ['Slow'] },
      text: "Its recovery counter roughly doubles while Slow holds — cast this before Reflect, or a Reflected Evrae bounces it straight back onto {actor}'s own party",
      cite: 'ffx-evrae-airship §6.3, §6.5',
    },
    {
      when: { labels: ['Reflect'] },
      text: "Deny the self-Haste it casts under a third HP — Reflected, that same cast lands as a free Haste on {actor}'s own party instead",
      cite: 'ffx-evrae-airship §6.5',
    },
    {
      when: { labels: ['Dark Buster', 'Dark Attack'] },
      text: 'Blinded, its Attack row goes out — Swooping Scythe still connects, so this only ever blunts half the NEAR-range melee, never all of it',
      cite: 'ffx-evrae-airship §6.1',
    },
    {
      when: { labels: ['Power Break'] },
      text: 'Halves both Attack and Swooping Scythe at once — the one debuff that touches the scythe limbs at all',
      cite: 'ffx-evrae-airship §6.2',
    },
    {
      when: { labels: ['Cheer'] },
      text: 'Stacks up to five and works at FAR — the range game is a setup zone, not a dead one, so bank this while the ship is pulled back',
      cite: 'ffx-evrae-airship §4.3, §8 row 3',
    },
    {
      when: { labels: ['Haste'] },
      text: 'Tempo bought at FAR carries into the NEAR exchanges later — cast it on whoever can already reach from out here',
      cite: 'ffx-evrae-airship §4.3, §8 row 3',
    },
    {
      when: { labels: ['Watera', 'Thundara', 'Blizzara', 'Fira', 'Water', 'Thunder', 'Blizzard', 'Fire'] },
      text: 'Every element is halved on this thing and holy is neutral — there is no weakness to aim for, only base power, and never into a Reflected Evrae',
      cite: 'ffx-evrae-airship §1.2, §6.5',
    },
    {
      when: { labels: ['Lancet'] },
      text: "One of the three swings that reach at FAR, with Lulu's Blk Magic and Wakka's blitzball — and it drains HP and MP on the way",
      cite: 'ffx-evrae-airship §4.3',
    },
    {
      when: { kinds: ['attack'] },
      text: 'A physical swing rolls to hit like any other — the only thing guaranteed here is Cid missiles and the boss magic, not this',
      cite: 'ffx-evrae-airship §3.1',
    },
    {
      // FFX's window has no Defend row, so the quiet turn is a spare item on an
      // ally (`src/engine/tactics/evrae-quiet.ts#spareItem`). The same three
      // labels also come up from `harmlessTurn()`'s end-of-line fallback (§10
      // in `evrae.ts`'s tactic — nothing reaches and no bench swap applies),
      // which is not the breath dodge this line describes, so the hint is
      // keyed on the state that actually makes it true (`F_BREATH`/`F_RANGE`
      // in `evrae.ts`) rather than firing on the label alone.
      when: {
        labels: ['Potion', 'Eye Drops', 'Echo Screen'],
        flags: { 'airship.breathCharged': true, 'airship.range': 'far' },
      },
      text: 'A turn spent on an ally names no enemy. It is the dodge whenever Evrae holds a breath with the ship FAR, because naming Evrae then makes it Swoop in and breathe anyway',
      cite: 'ffx-evrae-airship §4.5',
    },
  ],

  watch: [
    {
      name: 'Inhale',
      payload: 'Poison Breath — roughly 1,500 to all three active members at once',
      advice: 'If the ship is already FAR, do nothing that names it. If it is NEAR, pull back now — the dodge is a race between two clocks',
      cite: 'ffx-evrae-airship §3.3, §4.5, §8 row 8',
    },
  ],

  phases: [
    {
      aboveHpFraction: 0.3334,
      label: 'Phase 1 - the range game',
      note: "Pull back, farm the missile volleys, close in only to hit what does not reach from FAR. Stone Gaze's aggro counter builds on every hit landed on it — it resets when Evrae acts, so a quiet turn is never wasted.",
      cite: 'ffx-evrae-airship §5.2, §5.3',
    },
    {
      belowHpFraction: 0.3334,
      label: 'Phase 2 - do not poke it from FAR',
      note: 'Swooping Scythe is live: any attack made at FAR drags the ship back to NEAR on its own. Get Reflect up before its self-Haste lands, and stop re-ordering the ship out — the only order worth a turn from here is the Poison Breath dodge.',
      cite: 'ffx-evrae-airship §4.5, §5.4, §5.5',
    },
  ],
  line: EVRAE_LINE,
};

export default EVRAE_GUIDE;
