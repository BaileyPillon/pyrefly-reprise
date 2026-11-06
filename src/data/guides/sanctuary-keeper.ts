/**
 * The hidden Sanctuary Keeper chapter (the beast on the Mt. Gagazet summit; hidden FFX chapter 39, the typed word `beast`)
 * [research/re-ffx-sanctuary-keeper.md "RE section n" (the monster record, the formation and the Atel script read from the game's own files, and the arithmetic against Chapter I's preset), research/ffx-combat-core.md
 * sections 1.4, 1.5, 4.2 and 7.1 to 7.5 (Haste, Delay, the status table, the player's own spells and skills)]. Every cite below names one of them in the corpus's own form: the digest first, then the game's file.
 *
 * Written against the tactic in `src/engine/tactics/sanctuary-keeper.ts`: every hint below explains a row that file asks for (Hastega, Bio or a Poison Fang, Reflect after the poison, Dispel under half, Shell and Protect,
 * Armor Break, the cures), so each line says why the command the player is told to press is the right one. The tactic is the bench's advisor line (`tests/unit/helpers/sanctuaryBot.ts`), measured on the real engine.
 *
 * **Game case: FFX only** [AGENTS.md rule 14]. The Keeper's record, its script and the Reflect trick exist only in FFX; FFX-2's Bevelle Underground guardians are separate fights in the ATB engine and no file of
 * theirs reads this one.
 *
 * **Jegged's Mt. Gagazet page is not in the repository's corpus**, so every line stands on the game's own files and on the combat-core notes; where a written walkthrough and the file differ the file wins (rule 6;
 * `research/re-ffx-sanctuary-keeper.md` section 7 lists the points: Photon Wings also inflicts Curse, and the half-HP gate of the Reflect answer is the file's). **No number here is invented**: the HP is the record's, the damage
 * figures are the note's arithmetic against Chapter I's preset (an `[estimate]` over a sourced build point), the counter's three to seven is the script's. **Not modelled, so not promised:** the gear the Keeper drops.
 */

import type { ChapterGuide } from './types.ts';

/** The Keeper's combatant id (`src/data/ffx/sanctuary-keeper-ids.ts`), written out here: a guide data module imports no tactic. */
export const SANCTUARY_KEEPER_GUIDE_IDS = ['sanctuary-keeper'] as const;
const KEEPER = SANCTUARY_KEEPER_GUIDE_IDS[0];

export const SANCTUARY_KEEPER_GUIDE: ChapterGuide = {
  id: 'sanctuary-keeper',
  title: 'Sanctuary Keeper',
  bossIds: [...SANCTUARY_KEEPER_GUIDE_IDS],

  rules: [
    {
      text: 'Plain blows cannot win this. Left alone, it heals itself for nearly 10,000 twice every six turns, so do not try to out-hit it: take the healing away from it.',
      short: 'Take its healing away; do not out-hit it',
      cite: 'ffx-combat-core §4.2; re-ffx-sanctuary-keeper §4.2, §6',
    },
    {
      text: 'Poison it first, then Reflect it. A Reflect on the Keeper bounces your own Bio back at you, so the poison goes on before the Reflect. With both on it, its own Curaga mends your party and the poison goes on ticking for 2,000.',
      short: 'Poison it first, then Reflect it',
      cite: 'ffx-combat-core §4.2, §7.5; re-ffx-sanctuary-keeper §1.2, §4.2, §6',
    },
    {
      text: 'Shell everyone before the breath. Mana Breath takes roughly 2,500 to 3,600 off one of you, half with Shell. Photon Wings ignores both Shell and Protect.',
      short: 'Shell before the breath',
      cite: 'ffx-combat-core §4.2; re-ffx-sanctuary-keeper §4.2, §6',
    },
    {
      text: 'It counts your blows, and after three to seven it lashes all three of you with its tail: your Haste is taken off and every next turn is pushed back. Cast Hastega again after each sweep. Bio, Reflect and Protect do not count toward it.',
      short: 'Hastega again after the tail',
      cite: 'ffx-combat-core §1.4, §1.5, §7.1; re-ffx-sanctuary-keeper §4.3, §6',
    },
    {
      text: 'Under half, it aims its healing at anyone of yours who holds Reflect, so that the spell bounces back onto it. Dispel the Reflect off your own line.',
      short: 'Under half, Dispel a Reflect on your own line',
      cite: 'ffx-combat-core §4.2, §7.5; re-ffx-sanctuary-keeper §4.2',
    },
  ],

  hints: [
    { when: { labels: ['Hastega'] }, text: 'Hastega puts Haste on all three of you; the Keeper\'s tail takes it off, so cast it again after a sweep', cite: 'ffx-combat-core §1.4, §7.1; re-ffx-sanctuary-keeper §4.3, §6' },
    { when: { labels: ['Bio', 'Poison Fang'], targetId: KEEPER }, text: '{actor} poisons {target}: 2,000 a turn of its own, and a support turn spent curing it. Do this before Reflect, which would send a Bio back at you', cite: 'ffx-combat-core §4.2; re-ffx-sanctuary-keeper §1.2, §4.2, §6' },
    { when: { labels: ['Reflect'], targetId: KEEPER }, text: 'Reflect on {target}: its own Curaga and Esuna now land on your side of the field', cite: 'ffx-combat-core §4.2, §7.5; re-ffx-sanctuary-keeper §4.2' },
    { when: { labels: ['Dispel'] }, text: 'Dispel {target}: under half, it aims its healing at whoever holds Reflect, so the spell bounces back onto it. Take the Reflect off your own line', cite: 'ffx-combat-core §4.2, §7.5; re-ffx-sanctuary-keeper §4.2' },
    { when: { labels: ['Shell'] }, text: 'Shell halves Mana Breath, which takes 2,500 to 3,600 off one of you; Photon Wings ignores it', cite: 'ffx-combat-core §4.2; re-ffx-sanctuary-keeper §4.2, §6' },
    { when: { labels: ['Protect'] }, text: 'Protect halves its Attacks and its tail; Photon Wings and Mana Breath are not touched by it', cite: 'ffx-combat-core §4.2; re-ffx-sanctuary-keeper §6' },
    { when: { labels: ['Armor Break'], targetId: KEEPER }, text: 'Armor Break takes the Keeper\'s Defense to nothing, so Auron\'s blows land for more than twice as much. It answers with Protect on a later turn, and a Reflect sends that to your side', cite: 'ffx-combat-core §2.10, §7.3; re-ffx-sanctuary-keeper §4.2, §6' },
    { when: { labels: ['Esuna'] }, text: '{actor} cures {target}: Photon Wings can leave Confuse, Sleep, Silence and Darkness on all three of you', cite: 'ffx-combat-core §4.2; re-ffx-sanctuary-keeper §1.2, §4.2' },
    { when: { labels: ['Remedy', 'Eye Drops'] }, text: 'Cure {target}: Photon Wings can leave Confuse, Silence and Darkness on all three of you, and a Confused member strikes his friends', cite: 'ffx-combat-core §4.2; re-ffx-sanctuary-keeper §4.2' },
    { when: { labels: ['Echo Screen'] }, text: 'Echo Screen cures Silence on {target}, who cannot cast a spell until it is gone', cite: 'ffx-combat-core §4.2; re-ffx-sanctuary-keeper §4.2' },
    { when: { labels: ['Curaga', 'Hi-Potion', 'X-Potion', 'Mega-Potion'] }, text: 'Top {target} up: Photon Wings, the tail and the breath all land on the same few people', cite: 'ffx-combat-core §7.5; re-ffx-sanctuary-keeper §6' },
    { when: { labels: ['Phoenix Down'] }, text: 'Stand {target} up first: every one of you matters to the line', cite: 'ffx-combat-core §7.5; re-ffx-sanctuary-keeper §6' },
    { when: { kinds: ['attack'], targetId: KEEPER }, text: 'A plain blow only chips at it; the real work is the poison, the Reflect and the broken armour, with the blows landing behind them', cite: 'ffx-combat-core §2.10; re-ffx-sanctuary-keeper §6' },
  ],

  watch: [],

  phases: [
    {
      belowHpFraction: 0.25,
      label: 'UNDER A QUARTER',
      note: 'It puts Regen on itself on a support turn in place of a Curaga, until Esuna, Protect or the Reflect answer needs the turn instead.',
      cite: 'ffx-combat-core §4.3; re-ffx-sanctuary-keeper §4.2',
    },
    {
      belowHpFraction: 0.5,
      label: 'UNDER HALF',
      note: 'The Reflect answer wakes: with Reflect on it, it aims its support spell at a member of yours who holds Reflect, so that it bounces onto itself. Dispel the Reflect off your own line.',
      cite: 'ffx-combat-core §4.2; re-ffx-sanctuary-keeper §4.2',
    },
    {
      label: 'THE CYCLE',
      note: 'Photon Wings first, then two Attacks, Mana Breath, and two turns of healing. A hidden count answers three to seven of your blows with a sweep of its tail.',
      cite: 'ffx-combat-core §1.5; re-ffx-sanctuary-keeper §4.2, §4.3',
    },
  ],
};

export default SANCTUARY_KEEPER_GUIDE;
