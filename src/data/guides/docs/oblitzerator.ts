/**
 * The hidden Oblitzerator chapter (the blitzball machine and the dock crane at Luca): the guide's one page for this fight.
 *
 * **Game case: FFX only** (AGENTS.md rule 14). Laid out as the FFX encounter guide lays a boss page out (`../doc-types.ts`): the boss header, the stat lines (HP, Steal, Drops), the advice in order, the strategy as numbered
 * steps. **Jegged's Luca page was read** (it is not in this repository's corpus) **and every sentence here is our own**, standing on the game's own files (`research/re-ffx-oblitzerator-crane.md`): the turn and the Rush are the
 * note's section 4.1, the counters and the speed-up its section 4.2, the crane its section 4.5, the figures its sections 1 and 5 (against the Luca build, an `[estimate]`). Where a written walkthrough and the file differ the
 * file wins: no Overdrive draws a Doze Ball and Threaten fails on the machine (the note's section 7).
 *
 * **Not modelled, so not promised:** the gear the machine drops (Lightningstrike or Piercing weapons, a Defense +3 percent armour, per the guides). The page prints the Steal and the Drops the chapter pays.
 */

import type { GuideDoc } from '../doc-types.ts';

export const OBLITZERATOR_DOC: GuideDoc = {
  id: 'oblitzerator',
  game: 'ffx',
  bossIds: ['oblitzerator'],
  blocks: [
    { t: 'head', at: ['oblitzerator'], title: 'Oblitzerator', tag: 'Boss Battle' },
    { t: 'field', label: 'HP', value: '6,000' },
    {
      t: 'p',
      text: 'A blitzball-throwing machine on the Number 4 Dock, with a dock crane to the right. It has no Defense and it is weak to Thunder; what it has is a Rush of ten balls and a ball for every blow it takes. The crane has no power.',
    },
    { t: 'h3', text: 'Its turns' },
    { t: 'p', text: 'It throws one move, the Blitzball Rush: ten balls, each at a member picked at random, 32 to 39 apiece. A Protect or a Shell does not halve them.' },
    { t: 'p', text: 'At the start it throws once for about six of your turns; under a third of its HP about twice as fast, under a twelfth three times.' },
    { t: 'h3', text: 'Its balls' },
    { t: 'p', text: 'When a blow lands it answers one time in three: a physical blow earns a Blind Ball on the attacker, a spell a Mute Ball.' },
    { t: 'p', text: 'Each leaves a little damage, and the status it leaves does not outlast the turn it lands in. A spell at the crane draws nothing.' },
    { t: 'h3', text: 'The crane' },
    { t: 'p', text: 'The crane swallows Thunder. The first two casts it answers, and the third wakes it (one Thunder Fury wakes it at once).' },
    { t: 'p', text: 'Tidus\'s Use crane then drops the machine by fifteen sixteenths of its HP, 5,625 from full, and it stops acting and answering. Used before the crane wakes it does nothing.' },
    { t: 'lead', text: 'The strategy:' },
    {
      t: 'ol',
      items: [
        'Tidus hastes Lulu, and everybody else waits. Nobody swings at the machine: every blow draws a ball back.',
        'Lulu casts Thunder at the crane, three times. Stand her up with a Phoenix Down if a Rush reached her.',
        'When the crane has power, Tidus uses it. The machine falls to about 375 HP.',
        'Anyone finishes it: it answers nothing now, and two blows are enough.',
        'If the crane is not for you, the slow way is twelve to fourteen Thunders from Lulu, or thirty to forty blows, against a machine that doubles its pace as it is hurt. Keep Potions and Phoenix Downs ready.',
      ],
    },
    { t: 'list', label: 'Steal', items: ['Potion (common)', 'Potion (rare)'] },
    { t: 'list', label: 'Drops', items: ['Elixir'] },
  ],
};

export default OBLITZERATOR_DOC;
