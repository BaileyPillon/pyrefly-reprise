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
 */

import type { ChapterGuide } from './types.ts';

export const EVRAE_GUIDE: ChapterGuide = {
  id: 'evrae-airship',
  title: 'Evrae',
  bossIds: ['evrae'],

  rules: [
    {
      text: 'Cid can move the ship or fire the missiles, never both — pull back the moment the fight opens. FAR is the only range Cid can fire from, and one volley (~2,400) outdamages a whole turn of party swings for no party turn at all.',
      short: 'Pull back — Cid does more than you do',
      cite: 'ffx-evrae-airship §4.2, §7.4, §8 row 1',
    },
    {
      text: 'The Al Bhed Potion is the only heal in this party — no Yuna, no White Magic. Rank 2, party-wide, exactly 1,000, and it cures Poison, Silence and Petrify in the same cast. A petrified member is one Swooping Scythe from being gone for good.',
      short: 'Al Bhed Potion is your only heal — use it early',
      cite: 'ffx-evrae-airship §6.4, §3.3 note 3, §8 row 2',
    },
    {
      text: 'When Evrae inhales while the ship is FAR, do nothing that names it. Attacking now makes it Swoop in and breathe anyway — the dodge is refusing the bait, not landing a counter.',
      short: 'Ship is FAR and it inhales — do not attack',
      cite: 'ffx-evrae-airship §4.5, §8 row 8',
    },
    {
      text: 'Once its bar drops under a third, everything it does gets worse at once: it goes berserk, and if it is still un-Reflected its next big turn is a self-cast Haste. Reflect denies the Haste and turns it into a free Haste on your own party instead.',
      short: 'Under 1/3 HP: get Reflect up before the Haste',
      cite: 'ffx-evrae-airship §5.4, §6.5, §8 row 11',
    },
    {
      text: 'Slow only helps while it can still be applied — cast it before Reflect goes up, never after, because Slow is reflectable and a Reflected Evrae bounces it onto the party that cast it.',
      short: 'Slow before Reflect, never after',
      cite: 'ffx-evrae-airship §6.3, §6.5, §8 row 5',
    },
  ],

  hints: [
    {
      when: { labels: ['Pull back', 'Pull Back'] },
      text: "Cid pulls the {actor}'s ship out of reach — Poison Breath and Swooping Scythe cannot land while it is FAR, and Cid's missiles only fire from out here",
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
      // ally (`src/engine/tactics/evrae-quiet.ts#spareItem`).
      when: { labels: ['Potion', 'Eye Drops', 'Echo Screen'] },
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
};

export default EVRAE_GUIDE;
