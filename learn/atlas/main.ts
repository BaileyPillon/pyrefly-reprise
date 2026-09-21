/**
 * Site A, "Pyrefly Atlas": wires the shared explorer engine
 * (`learn/shared/shell.ts`) to the five chapters' `Specimen`s
 * (`learn/atlas/data.ts`). Vegnagun (chapter 5, the complete reference
 * chapter) opens by default; the other four chapters switch in through the
 * same shell, built from the exact same data path.
 */

import { buildAllChapterSpecimens } from './data.ts';
import { mountExplorer } from '../shared/shell.ts';
import type { CardAction, PresetTab, SwitcherEntry } from '../shared/shell.ts';
import type { Piece, Specimen } from '../shared/model.ts';
import { artUrl } from '../shared/urls.ts';
import { CHAPTER_IDS, getChapter } from '../../src/data/encounters.ts';
import type { ChapterId } from '../../src/data/encounters.ts';

const ROMAN_BY_NUMBER: Readonly<Record<number, string>> = { 1: 'I', 2: 'II', 3: 'III', 4: 'IV', 5: 'V' };

/** The unofficial fan tribute's own game, linked from a chapter's card (`docs/plans/learning-sites.md` site A). */
const FIGHT_URL = 'https://baileypillon.github.io/pyrefly-reprise/';

const PRESET_TABS: readonly PresetTab[] = [
  { label: 'What it does', systemIds: ['abilities', 'statuses-inflicted', 'turn-patterns'] },
  { label: 'What stops it', systemIds: ['immunities', 'affinities'] },
];

/** Plain captions for the systems panel (`docs/concepts/atlas/a-boss-atlas/a1-assembled.html`'s `.sys .pl` lines), generalised to fit any chapter rather than Vegnagun's specific numbers. */
const SYSTEM_BLURBS: Readonly<Record<string, string>> = {
  'parts-and-forms': 'what stands on the field, battle by battle',
  abilities: 'every move any part can make',
  'statuses-inflicted': 'what it can put on your party',
  immunities: 'statuses that some part shrugs off',
  affinities: 'elemental strengths and weaknesses',
  'turn-patterns': 'how each kind of part decides its move',
  rewards: 'what it drops, and what you can steal',
};

/** The largest painted piece in a specimen, for the switcher's chip thumbnail — never a hand-picked art path per chapter. */
function biggestPaintingArt(specimen: Specimen): string | undefined {
  const paintings = specimen.pieces.filter((piece): piece is Piece & { art: string } => piece.kind === 'painting' && piece.art !== undefined);
  if (paintings.length === 0) return undefined;
  return paintings.reduce((best, piece) => (piece.size > best.size ? piece : best)).art;
}

const specimensById = buildAllChapterSpecimens();

const switcherEntries: SwitcherEntry[] = CHAPTER_IDS.map((id) => {
  const chapter = getChapter(id);
  const specimen = specimensById[id];
  const art = biggestPaintingArt(specimen);
  return {
    id,
    kicker: `${ROMAN_BY_NUMBER[chapter?.number ?? 1] ?? ''} · ${chapter?.game === 'ffx2' ? 'FFX-2' : 'FFX'}`,
    title: specimen.title,
    thumbUrl: art !== undefined ? artUrl(art) : undefined,
    enabled: true,
  };
});

function fightThisChapter(): CardAction {
  return { label: 'Fight this chapter', href: FIGHT_URL };
}

const app = document.getElementById('app');
if (app === null) {
  throw new Error('atlas/main.ts: no #app element in atlas/index.html');
}

mountExplorer(app, {
  theme: 'paper',
  siteName: 'Pyrefly Atlas',
  siteTagline: 'boss anatomy',
  specimens: switcherEntries,
  initialSpecimenId: 'ffx2-vegnagun-shuyin' satisfies ChapterId,
  getSpecimen: (id) => specimensById[id as ChapterId],
  presetTabs: PRESET_TABS,
  systemBlurbs: SYSTEM_BLURBS,
  sliderLabels: {
    start: 'Assembled',
    end: 'Every piece',
    plain: 'drag to take it apart',
    stateFor: (explode, count) => {
      if (explode <= 0) return 'Whole boss';
      if (explode >= 1) return `Inventory · ${count} pieces`;
      return 'Separated parts';
    },
  },
  secondaryAction: fightThisChapter,
  credits: 'Unofficial fan tribute',
});
