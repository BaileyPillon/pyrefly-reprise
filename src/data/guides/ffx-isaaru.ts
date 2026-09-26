/**
 * Chapter XIV — Isaaru, the last chamber of the Via Purifico
 * [research/ffx-isaaru-bevelle.md].
 *
 * Written against the tactic in `src/engine/tactics/ffx-isaaru.ts`: every
 * `labels` entry below is a row that file asks for (an aeon's name, Grand
 * Summon, Shield, an Overdrive, Attack), so each hint explains the command the
 * player is being told to press.
 *
 * **Game case: FFX only** [AGENTS.md rule 14]. Yuna alone with her aeons, the
 * mirror lock, CTB and Shield; in FFX-2 Isaaru is a tour guide and nobody
 * summons (research §0.3).
 *
 * Every fact is the research's, with its tag: only aeons can fight his aeons,
 * and never the same aeon (§1.2, `[verified: 2 sources]`); a KO'd aeon stays
 * down for the rest of the chain (§1.2, `[derived]`); no healing between the
 * links (§1.2, `[single source: GameFAQs]`); Grothia starts with a full gauge
 * (§4.1, `[single source: wiki]`) and absorbs Fire (§2.3, `[verified: 3
 * sources]`); Pterya is weak and fills Bahamut (§5.2, §6.3); Spathi counts
 * down from 5 to Mega Flare (§4.3, `[verified: 2 sources]`, I-5); Shield
 * quarters Hellfire and Mega Flare (§5.3, `[verified: 3 sources]`). The guide
 * states no odds.
 */

import type { ChapterGuide } from './types.ts';

export const ISAARU_GUIDE: ChapterGuide = {
  id: 'isaaru-via-purifico',
  title: 'Isaaru',
  // His three aeons, one a link. Isaaru himself is an untargetable bystander (B8, our estimate).
  bossIds: ['grothia', 'pterya', 'spathi'],
  // The panel names the aeon standing, as Chapter XIII's does for its links (FOC16-06).
  linkTitles: { grothia: 'Grothia', pterya: 'Pterya', spathi: 'Spathi' },

  rules: [
    {
      text: 'Only an aeon can fight his aeons, and never the same one: while he has Ifrit out, yours will not come. Yuna can summon, heal herself and use items, nothing else.',
      short: 'Only aeons fight here, never the mirror of his',
      cite: 'ffx-isaaru-bevelle §1.2; B6 (our estimate for the greyed rows)',
    },
    {
      text: 'Three aeons back to back with no healing between them. An aeon you lose stays down for the rest of the contest, and with none left to summon the contest is lost.',
      short: 'No healing between links; a fallen aeon stays down',
      cite: 'ffx-isaaru-bevelle §1.2',
    },
    {
      text: 'Grothia opens with a full gauge, so his first move against an aeon is Hellfire, more than any of your aeons can take. Shield first: it quarters the blow.',
      short: 'Grothia: Hellfire first. Shield before it lands',
      cite: 'ffx-isaaru-bevelle §4.1, §5.2, §5.3',
    },
    {
      text: 'Pterya is the weak one. Bahamut takes her hits and fills his gauge doing it.',
      short: 'Pterya: let Bahamut take her hits',
      cite: 'ffx-isaaru-bevelle §5.2, §6.3',
    },
    {
      text: 'Spathi does not attack. He counts down from five, then Mega Flare hits the aeon on the field for more than it can take. Watch the turn order: Shield when the Flare will land before your next turn. Ifrit or Ixion, whichever has the fuller gauge, goes in first.',
      short: 'Spathi: Shield before the count runs out',
      cite: 'ffx-isaaru-bevelle §4.3, §5.2, §5.3; I-5',
    },
  ],

  hints: [
    {
      when: { labels: ['Shield'] },
      text: 'His big move lands before this aeon acts again. Shield quarters it, and lasts until the aeon’s next turn',
      cite: 'ffx-isaaru-bevelle §5.3',
    },
    {
      when: { labels: ['Grand Summon'] },
      text: 'Yuna’s gauge is full: the aeon arrives with its own gauge full, and its Overdrive is worth several turns of attacks',
      cite: 'ffx-isaaru-bevelle §5.4, §6.2',
    },
    {
      when: { kinds: ['overdrive'] },
      text: 'A full gauge: the Overdrive is worth several turns of attacks against HP this high',
      cite: 'ffx-isaaru-bevelle §5.4',
    },
    {
      when: { kinds: ['summon'] },
      text: 'Summon the aeon the sources suggest for this link. Its mirror stays greyed',
      cite: 'ffx-isaaru-bevelle §1.3, §6.3',
    },
    {
      when: { kinds: ['attack'] },
      text: 'Nothing is about to land: hit his aeon',
      cite: 'ffx-isaaru-bevelle §5.4',
    },
  ],

  // The count is the AI's own telegraph line each Spathi turn; no charge event to watch.
  watch: [],

  phases: [
    { bossId: 'grothia', label: 'Link 1 of 3: Grothia', note: 'His Ifrit. Hellfire first, then Attack or Fira; he absorbs Fire.', cite: 'ffx-isaaru-bevelle §2.3, §4.1' },
    { bossId: 'pterya', label: 'Link 2 of 3: Pterya', note: 'His Valefor. Attack or Sonic Wings, Energy Ray when her gauge fills.', cite: 'ffx-isaaru-bevelle §4.2' },
    { bossId: 'spathi', label: 'Link 3 of 3: Spathi', note: 'His Bahamut. Five, four, three, two, one, then Mega Flare, and again.', cite: 'ffx-isaaru-bevelle §4.3' },
  ],
};

export default ISAARU_GUIDE;
