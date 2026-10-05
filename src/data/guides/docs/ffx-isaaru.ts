/**
 * Chapter 14, Isaaru's aeons (Via Purifico): the guide's page for this fight.
 *
 * **Game case: FFX only** (AGENTS.md rule 14). Follows the FFX encounter guide for these three
 * duels in our own words and in its order (layout: `../doc-types.ts`);
 * `research/jegged-encounter-guides-ffx-b.md` section 5 holds the page and every difference. HP is
 * the number this game uses, and so is Spathi's countdown (it opens at 5 here, not 4). One claim on
 * that page is left out because our research says the game does otherwise: that Ice spells are
 * Grothia's weakness (it takes ordinary damage from every element).
 *
 * The page is one box with three parts, so the panel opens on the part for the aeon on the field.
 */

import type { GuideDoc } from '../doc-types.ts';

export const ISAARU_DOC: GuideDoc = {
  id: 'isaaru-via-purifico',
  game: 'ffx',
  bossIds: ['grothia', 'pterya', 'spathi'],
  blocks: [
    {
      t: 'p',
      text: "The next couple of battles are Yuna's alone. If you have not used her much, charge her Overdrive to full before walking down the hallway.",
    },
    {
      t: 'p',
      text: 'At the end of the red-lit hallway a short cutscene begins: Yevon has ordered Isaaru to stop you, so he fights Yuna with his aeons.',
    },
    { t: 'head', at: ['grothia'], title: "Isaaru's Aeons", tag: 'Boss Battle' },
    { t: 'field', label: 'Grothia (aka Ifrit): HP', value: '8,000' },
    { t: 'p', text: 'Isaaru opens by summoning Grothia, essentially Ifrit under a new name.' },
    {
      t: 'p',
      text: "If you charged Yuna's Grand Summon, use it to bring out Bahamut, then fire his Mega Flare Overdrive for big damage fast.",
    },
    {
      t: 'p',
      text: 'Mega Flare might not finish Grothia, and then Grothia hits Bahamut with its Hellfire Overdrive.',
    },
    { t: 'field', at: ['pterya'], label: 'Pterya (aka Valefor): HP', value: '12,000' },
    {
      t: 'p',
      text: 'Bahamut is probably hurt by now. If he came through well and has another Overdrive charged, use it on Valefor.',
    },
    {
      t: 'p',
      text: 'Otherwise summon Ixion and heal him with his own Thundara when he needs it: aeons absorb their own element, so lightning restores Ixion instead of hurting him.',
    },
    { t: 'p', text: 'Pterya has 12,000 HP, so you need a bit more firepower to take it down.' },
    { t: 'field', at: ['spathi'], label: 'Spathi (aka Bahamut): HP', value: '20,000' },
    {
      t: 'p',
      text: "Isaaru's final aeon is Spathi, a Bahamut clone, so you cannot summon Bahamut this time. Summon Shiva instead.",
    },
    {
      t: 'p',
      text: 'Shiva suits this fight: she is fast, and she is your second-strongest aeon after Bahamut.',
    },
    {
      t: 'p',
      text: "Spathi counts down from 5 to 1 and then casts Mega Flare. Shiva's Shield, used just before, is the one way to survive it.",
    },
    {
      t: 'p',
      text: 'Afterwards heal Shiva with Blizzara; Spathi starts another count right away.',
    },
    {
      t: 'p',
      text: 'Spathi resists the slow from Heavenly Strike, and you want your MP for Blizzara, so use plain attacks to wear Spathi down.',
    },
    { t: 'p', text: 'Beat Spathi and the fight with Isaaru is over.' },
  ],
};
