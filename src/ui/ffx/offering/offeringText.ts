/**
 * The words of the offering screen (the hidden Last Summoning; **FFX only**), **all ours** (`research/writing-bible.md`; no line of the game is reproduced). The headline, the sub-line and the Sisters' panel
 * are the approved frame's (`frame-2b-offering-menu.png`, Bailey's delegated pick); the other seven aeons' panels are written the same way: what Yu Yevon's copy does (the rows of
 * `research/re-ffx-last-summoning.md` section 1.4 and `research/re-ffx-ai-yunalesca-bfa.md` section 5.5, which are the game's, said in words and with one number only where the file gives it) and what the player
 * loses (the aeon's own commands, which the player holds until the moment it is taken).
 *
 * Pure data and one pure function: no DOM, tested without one (`tests/unit/chapters/last-summoning-offering.test.ts`).
 */

import type { OfferingKey } from '../../../data/ffx/last-summoning-ids.ts';

/** The small gold line above the headline. */
export const OFFERING_EYEBROW = "THE LAST SUMMONING · DREAM'S END";

/** The headline and the line under it: the frame's wording while several aeons are held, and a quieter pair for the last one. */
export const OFFERING_HEAD = {
  several: { title: 'Yu Yevon reaches for one of your aeons.', sub: 'Whichever you give up is fought next. The others stay with you until they are taken.' },
  last: { title: 'Yu Yevon reaches for your last aeon.', sub: 'Give it up, and there is nothing left of them to hold him back.' },
} as const;

/** The display name of an offering. */
export const OFFERING_NAMES: Readonly<Record<OfferingKey, string>> = {
  valefor: 'Valefor',
  ifrit: 'Ifrit',
  ixion: 'Ixion',
  shiva: 'Shiva',
  bahamut: 'Bahamut',
  anima: 'Anima',
  yojimbo: 'Yojimbo',
  sisters: 'Magus Sisters',
};

/** One panel: how the copy Yu Yevon makes fights (left column) and what the player gives up (right column). */
export interface OfferingPanel {
  /** "IF YU YEVON TAKES ..." body. */
  fought: string;
  /** "WHAT YOU LOSE" body. */
  lose: string;
}

/** The panel of each aeon (the Sisters' two sentences about the other aeon are added by {@link panelFor}). */
export const OFFERING_PANELS: Readonly<Record<OfferingKey, OfferingPanel>> = {
  valefor: {
    fought: 'Valefor is fought with the stats you gave it. It favours Sonic Wings and closes with Energy Ray, or Energy Blast if yours had learned it.',
    lose: 'Sonic Wings and its Overdrive: the first aeon you ever called.',
  },
  ifrit: {
    fought: 'Ifrit is fought with the stats you gave it, and it drinks Fire. It answers with Meteor Strike, and Hellfire at a full gauge.',
    lose: 'Meteor Strike, Hellfire, and the aeon that feeds on Fire.',
  },
  ixion: {
    fought: 'Ixion is fought with the stats you gave it, and it drinks Thunder. It answers with Aerospark, and Thor’s Hammer at a full gauge.',
    lose: 'Aerospark, Thor’s Hammer, and the aeon that feeds on Thunder.',
  },
  shiva: {
    fought: 'Shiva is fought with the stats you gave her, and she drinks Ice. She answers with Heavenly Strike, and Diamond Dust at a full gauge.',
    lose: 'Heavenly Strike, Diamond Dust, and the aeon that feeds on Ice.',
  },
  bahamut: {
    fought: 'Bahamut is fought with the stats you gave him. Impulse can fall on all three of you at once, and Mega Flare follows when his gauge is full.',
    lose: 'Impulse and Mega Flare.',
  },
  anima: {
    fought: 'Anima is fought with the stats you gave her. Every turn she puts Pain on one of you, and she spends her Overdrive on Oblivion.',
    lose: 'Pain and Oblivion.',
  },
  yojimbo: {
    fought: 'Yojimbo is fought with Kozuka and Wakizashi, one or the other on a coin. When his gauge is full, Zanmato strikes all three of you for 9,999.',
    lose: 'Pay, his free attacks, and the gamble of Zanmato.',
  },
  sisters: {
    fought: 'Cindy, Sandy and Mindy are fought together, with the stats you gave them. Yu Pagodas feed a sister whose gauge is not full.',
    lose: 'The three orders, Combine powers and the Delta Attack.',
  },
};

/**
 * The panel for `focus` given what is still held: the aeon's own two sentences, and, where it matters, one sentence about the aeons that stay (the frame's Sisters panel ends "Yojimbo stays yours until he is
 * taken"; the same line is said about the Sisters when Yojimbo is the one on the table and they are still held).
 */
export function panelFor(focus: OfferingKey, held: readonly OfferingKey[]): OfferingPanel {
  const base = OFFERING_PANELS[focus];
  const others = held.filter((k) => k !== focus);
  let lose = base.lose;
  if (focus === 'sisters' && others.includes('yojimbo')) lose += ' Yojimbo stays yours until he is taken.';
  else if (focus === 'yojimbo' && others.includes('sisters')) lose += ' The Sisters stay yours until they are taken.';
  else if (others.length === 0) lose += ' It is the last you hold.';
  return { fought: base.fought, lose };
}

/** The headings above the two columns of the panel. */
export function panelHeadings(focus: OfferingKey): { fought: string; lose: string } {
  // The approved frame heads the Sisters' panel "IF YU YEVON TAKES THE MAGUS SISTERS".
  const name = focus === 'sisters' ? `THE ${OFFERING_NAMES[focus].toUpperCase()}` : OFFERING_NAMES[focus].toUpperCase();
  return { fought: `IF YU YEVON TAKES ${name}`, lose: 'WHAT YOU LOSE' };
}

/** The legend of the keys strip. */
export const OFFERING_KEYS_LEGEND = { choose: 'choose', give: 'give' } as const;

/** The state tags on the cards. */
export const OFFERING_TAGS = { taken: 'TAKEN', select: 'SELECT' } as const;
