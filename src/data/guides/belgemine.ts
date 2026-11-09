/**
 * The hidden Belgemine's Challenge chapter (the eight aeon duels of the Remiem Temple; hidden FFX chapter 45, the typed word `sidequest`)
 * [research/re-ffx-belgemine-aeon-duels.md "RE section n" (the monster records, the formations and the Atel scripts read from the game's own files and run on their real bytecode), research/ffx-combat-core.md
 * sections 6.1, 6.2 and 6.4 (the aeons, their Shield and Boost, their stats)]. Every cite below names one of them in the corpus's own form: the digest first, then the game's file.
 *
 * Written against the tactic in `src/engine/tactics/belgemine.ts`: every hint below explains a row that file asks for (Grand Summon, the summons, Shield, the Overdrive, the plain blow), so each line says why the command the
 * player is told to press is the right one. The tactic is the bench's advisor line (`tests/unit/helpers/belgemineDrive.ts`), measured on the real engine over 100 seeds a cell.
 *
 * **Game case: FFX only** [AGENTS.md rule 14]. Belgemine's duels are fought with FFX's CTB engine and Yuna's FFX aeons; FFX-2's aeons are enemies of another kind and no file of theirs reads this one.
 *
 * **The written guides** (Gamer Guides HD, Jegged) **are read in the note, not quoted here**: every line stands on the game's own files, and where a guide and a file differ the file wins (rule 6; the note's section 8 lists the
 * points: Mi'ihen's Ifrit and the first-win rewards, neither in this chapter). **No number is invented, and none is printed**: the card teaches the habit of each aeon, and the numbers are the HUD's.
 */

import type { ChapterGuide } from './types.ts';

/** Her eight foes' combatant ids (`src/data/ffx/belgemine-ids.ts`), written out here: a guide data module imports no tactic. */
export const BELGEMINE_GUIDE_IDS = ['belg-valefor', 'belg-ifrit', 'belg-ixion', 'belg-shiva', 'belg-bahamut', 'belg-yojimbo', 'belg-anima', 'belg-mindy', 'belg-sandy', 'belg-cindy'] as const;
const [VALEFOR, IFRIT, IXION, SHIVA, BAHAMUT, YOJIMBO, ANIMA, MINDY, SANDY, CINDY] = BELGEMINE_GUIDE_IDS;
const NOTE = 're-ffx-belgemine-aeon-duels';

export const BELGEMINE_GUIDE: ChapterGuide = {
  id: 'belgemine',
  title: "Belgemine's Challenge",
  bossIds: [...BELGEMINE_GUIDE_IDS],
  linkTitles: {
    [VALEFOR]: 'Belgemine: Valefor',
    [IFRIT]: 'Belgemine: Ifrit',
    [IXION]: 'Belgemine: Ixion',
    [SHIVA]: 'Belgemine: Shiva',
    [BAHAMUT]: 'Belgemine: Bahamut',
    [YOJIMBO]: 'Belgemine: Yojimbo',
    [ANIMA]: 'Belgemine: Anima',
    [MINDY]: 'Belgemine: the Sisters',
    [SANDY]: 'Belgemine: the Sisters',
    [CINDY]: 'Belgemine: the Sisters',
  },

  rules: [
    {
      text: 'Yuna fights alone and only her aeons can answer Belgemine\'s. You cannot call the aeon she holds. Every one of hers has a habit, and the habit decides the duel: read it before you choose.',
      short: 'Every aeon of hers has a habit; read it',
      cite: `ffx-combat-core §6.1, §6.2; ${NOTE} §3.1, §5`,
    },
    {
      text: 'Their gauges fill from the hits they take and from their own turns, and a full gauge is a great blow on the whole field. Shield on the turn before it lands; the HUD shows the gauge.',
      short: 'Shield before the great blow',
      cite: `ffx-combat-core §6.2; ${NOTE} §3.5, §3.6, §3.9, §3.10`,
    },
    {
      text: 'An Overdrive is worth several blows. Open with Yuna\'s Grand Summon, which calls an aeon with its Overdrive ready, and spend every Overdrive as soon as it is full. Against Anima call a plain Summon instead.',
      short: 'Grand Summon first, not vs Anima; use Overdrives',
      cite: `ffx-combat-core §6.2; ${NOTE} §3.1, §6`,
    },
    {
      text: 'Against the Magus Sisters strike Cindy first: her Mighty Guard, Regen and Cura are what make the fight long, and with any one of the three down their joint attack is over for good. Anima\'s Oblivion hits all three.',
      short: 'The Sisters: Anima, and Cindy first',
      cite: `ffx-combat-core §6.2; ${NOTE} §3.12`,
    },
    {
      text: 'Anima\'s Pain kills an aeon outright, and her next turn can fall on Yuna herself. Keep an aeon ready to call, and end her quickly.',
      short: 'Anima\'s Pain kills; end her quickly',
      cite: `ffx-combat-core §6.2; ${NOTE} §3.11`,
    },
  ],

  hints: [
    { when: { labels: ['Grand Summon'] }, text: 'Yuna\'s Grand Summon calls the first aeon with its Overdrive ready, so the duel opens with the biggest blow it has', cite: `ffx-combat-core §6.2; ${NOTE} §3.1, §6` },
    { when: { kinds: ['summon'], bossId: ANIMA }, text: '{actor} is called plain against Anima: a Grand Summon\'s ready Overdrive pours many hits into a gauge that fills from every hit', cite: `ffx-combat-core §6.2; ${NOTE} §3.11` },
    { when: { kinds: ['summon'], bossId: CINDY }, text: '{actor} is called to break the Sisters: Anima first, her Oblivion strikes all three', cite: `ffx-combat-core §6.2; ${NOTE} §3.12` },
    { when: { kinds: ['summon'], bossId: IFRIT }, text: '{actor} is called against Ifrit: a physical hit brings his Meteor Strike, so Shiva and Ixion first', cite: `ffx-combat-core §6.2; ${NOTE} §3.6` },
    { when: { kinds: ['summon'], bossId: BAHAMUT }, text: '{actor} is called against Bahamut: he does nothing for five turns, so the heaviest hitter makes them count', cite: `ffx-combat-core §6.2; ${NOTE} §3.9` },
    { when: { kinds: ['summon'] }, text: '{actor} is the heaviest hitter you can call against this one', cite: `ffx-combat-core §6.2; ${NOTE} §3.1, §5` },
    { when: { labels: ['Shield'] }, text: '{actor} takes the great blow its gauge says is next on a quarter of its weight', cite: `ffx-combat-core §6.2; ${NOTE} §3.5, §3.9` },
    { when: { kinds: ['overdrive'] }, text: '{actor}\'s Overdrive is full: spend it now, it is worth several blows', cite: `ffx-combat-core §6.2; ${NOTE} §3.1` },
    { when: { kinds: ['attack'], targetId: CINDY }, text: 'Strike Cindy first: her guarding and healing are what stretch this fight, and the joint attack needs all three of them alive', cite: `ffx-combat-core §6.2; ${NOTE} §3.12` },
    { when: { kinds: ['attack'], targetId: ANIMA }, text: 'Her gauge fills only when she is struck: fewer, heavier blows serve better than many light ones', cite: `ffx-combat-core §6.2; ${NOTE} §3.11` },
    { when: { kinds: ['attack'], targetId: IXION }, text: 'Ixion braces or evades half his turns and charges his gauge from the blow he is guarding against: strike while he is open', cite: `ffx-combat-core §6.2; ${NOTE} §3.7` },
    { when: { kinds: ['attack'] }, text: '{actor} strikes {target} while the gauges fill', cite: `ffx-combat-core §6.2; ${NOTE} §3.1` },
  ],

  watch: [],

  phases: [
    { bossId: VALEFOR, label: 'VALEFOR', note: 'A magical hit wakes her Energy Ray once her gauge is up; a physical one does not. Her great blow, Energy Blast, falls on a full gauge.', cite: `ffx-combat-core §6.2; ${NOTE} §3.5` },
    { bossId: IFRIT, label: 'IFRIT', note: 'He answers a physical hit with Meteor Strike on his next turn. Hellfire falls on a full gauge, and Fire heals him.', cite: `ffx-combat-core §6.2; ${NOTE} §3.6` },
    { bossId: IXION, label: 'IXION', note: 'Half his turns he braces (Defense and Magic Defense at their limit) or evades, and a blow of the type he guards against charges his gauge a great deal. Thunder heals him.', cite: `ffx-combat-core §6.2; ${NOTE} §3.7` },
    { bossId: SHIVA, label: 'SHIVA', note: 'Under half her HP she heals with Blizzaga; Ice heals her. She is quick and slippery, so end her quickly.', cite: `ffx-combat-core §6.2; ${NOTE} §3.8` },
    { bossId: BAHAMUT, label: 'BAHAMUT', note: 'Five quiet turns, then Mega Flare, then five quiet turns again. He answers every hit with an Attack, and the fifth with Impulse.', cite: `ffx-combat-core §6.2; ${NOTE} §3.9` },
    { bossId: YOJIMBO, label: 'YOJIMBO', note: 'His blades come by the gauge: Daigoro first, then Kozuka and Wakizashi as it climbs, and Zanmato when it is full. Every hit you land feeds it.', cite: `ffx-combat-core §6.2; ${NOTE} §3.10` },
    { bossId: ANIMA, label: 'ANIMA', note: 'Dispel, Demi, Pain and Attack by chance; Oblivion when her gauge is full, and it fills only from the hits she takes. Pain kills outright.', cite: `ffx-combat-core §6.2; ${NOTE} §3.11` },
    { bossId: CINDY, label: 'THE SISTERS', note: 'Cindy guards all three every seventh turn and heals; Sandy strikes hard; Mindy casts, and under a quarter of her HP her spells grow a tier. When all three gauges are full, Cindy leads the Delta Attack.', cite: `ffx-combat-core §6.2; ${NOTE} §3.12` },
  ],
};

export default BELGEMINE_GUIDE;
