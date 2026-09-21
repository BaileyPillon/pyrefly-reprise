/**
 * Site C, "Pyrefly Reprise, exploded: the game, taken apart": wires the
 * shared explorer shell (`learn/shared/shell.ts`) to one finished battle
 * frame — Chapter II, Lady Yunalesca, the Zanarkand Dome great hall — and to
 * site C's own stage painter (`stage-exploded.ts`), built to the approved
 * frames in `docs/concepts/atlas/c-scene-exploded/`.
 *
 * FFX only (AGENTS.md hard rule 14): the frame is an FFX chapter, so it takes
 * Yevon gold and it draws a turn list, which is an FFX idea. The other four
 * chapters are offered switched off with an honest reason rather than faked.
 *
 * `public/art/manifest.json` is **fetched** here, never imported: the art tree
 * is gitignored and local-only, and a learning site that imported it could
 * not build without it.
 */

import { mountExplorer } from '../shared/shell.ts';
import type { CardAction, PresetTab, SwitcherEntry } from '../shared/shell.ts';
import type { Piece, Specimen } from '../shared/model.ts';
import { artUrl } from '../shared/urls.ts';
import { CHAPTER_IDS, getChapter } from '../../src/data/encounters.ts';
import type { ArtManifest } from './assets.ts';
import { chapterUseById } from './chapter-use.ts';
import { runFrameTurn } from './engine-run.ts';
import { LAYERS } from './layers.ts';
import type { RailRow } from './paint-chrome.ts';
import { buildFrameSpecimen } from './specimen.ts';
import { createExplodedPainter } from './stage-exploded.ts';
import { poseThumbs, thumbSize } from './thumbs.ts';

/** The unofficial fan tribute's own game, linked from the idle card. */
const FIGHT_URL = 'https://baileypillon.github.io/pyrefly-reprise/';

/** The one chapter this page has a frame for. */
const BUILT_CHAPTER = 'yunalesca';
const CHAPTER_LABEL = 'Chapter II';
/** The painted subject the frame's boss sheet draws, and whose poses the detail card shows. */
const BOSS_SUBJECT = 'yunalesca-1';

const ROMAN: Readonly<Record<number, string>> = { 1: 'I', 2: 'II', 3: 'III', 4: 'IV', 5: 'V' };

/** The face each chapter's switcher chip wears, as site B's does. Every path is a file in `public/art/portraits/`. */
const CHAPTER_FACE: Readonly<Record<string, string>> = {
  'seymour-flux': 'portraits/seymour.png',
  yunalesca: 'portraits/yunalesca.png',
  'braskas-final-aeon': 'portraits/jecht.png',
  'ffx2-bahamut': 'portraits/bahamut.png',
  'ffx2-vegnagun-shuyin': 'portraits/shuyin.png',
};

/**
 * The components panel's plain lines, ported verbatim from the approved
 * frames' own panel (`docs/concepts/atlas/c-scene-exploded/build.mjs`, `ROWS`)
 * — approved copy, so it is carried over rather than rewritten (hard rule 9).
 */
const PLAIN: Readonly<Record<string, string>> = {
  'backdrop-painting': 'One painting, cut into depth bands',
  'light-atmosphere': 'Light shafts, dust, mist and bloom',
  'boss-billboard': 'A flat cut-out that faces the camera',
  'party-billboards': 'Seven heroes, each a set of poses',
  effects: 'Slash arc, sparks, impact flash',
  'hud-ink-gold': 'Banner, turn list, numbers, in CSS',
  'battle-engine': 'The rules. It only reports events',
  presenter: 'Plays each event as motion, in order',
  'music-sound': 'Scene, boss and victory music + effects',
};

/** The frames' own "All / On screen / Not on screen" tabs. */
const PRESET_TABS: readonly PresetTab[] = [
  { label: 'On screen', systemIds: LAYERS.filter((layer) => layer.onScreen).map((layer) => layer.id) },
  { label: 'Not on screen', systemIds: LAYERS.filter((layer) => !layer.onScreen).map((layer) => layer.id) },
];

function switcherEntries(): SwitcherEntry[] {
  return CHAPTER_IDS.map((id) => {
    const chapter = getChapter(id);
    const face = CHAPTER_FACE[id];
    return {
      id,
      kicker: `${ROMAN[chapter?.number ?? 1] ?? ''} · ${chapter?.game === 'ffx2' ? 'FFX-2' : 'FFX'}`,
      title: chapter?.title ?? id,
      ...(face !== undefined ? { thumbUrl: artUrl(face) } : {}),
      enabled: id === BUILT_CHAPTER,
    };
  });
}

/**
 * The three rails. The battle engine's chips are the events the seed-1 turn
 * really emitted; the other two carry their own component's leading fact from
 * `layers.ts`. The plain tails are the approved frames' own words.
 */
function railRows(chips: readonly { lead: string; rest: string }[]): RailRow[] {
  const plains: Readonly<Record<string, string>> = {
    'battle-engine': 'what happened',
    presenter: 'how it looks',
    'music-sound': 'what you hear',
  };
  return LAYERS.filter((layer) => !layer.onScreen).map((layer) => {
    const fact = layer.staticFacts[0];
    // A rail is one line wide. The fact's own source reference is in brackets at the
    // end of its value and is already on the component's card, so the chip drops it
    // rather than running off the end of the strip.
    const short = fact === undefined ? '' : fact.value.replace(/\s*\([^()]*\)\s*$/, '');
    return {
      num: String(layer.order).padStart(2, '0'),
      layerId: layer.id,
      name: layer.name,
      chips: layer.id === 'battle-engine' ? chips : fact === undefined ? [] : [{ lead: fact.label, rest: short }],
      plain: plains[layer.id] ?? '',
    };
  });
}

/** The c2 card's pose strip: the painted poses this subject really has, and the size they were painted at. */
function posesExtra(host: HTMLElement, manifest: ArtManifest, inFramePose: string): void {
  const states = manifest.subjects[BOSS_SUBJECT]?.states ?? [];
  const thumbs = poseThumbs(BOSS_SUBJECT, states);
  if (thumbs.length === 0) return;
  const size = thumbSize(`pose-${BOSS_SUBJECT}-${inFramePose}`);
  host.innerHTML =
    `<div class="pyc-poses">${thumbs
      .map(
        (pose) =>
          `<figure class="${pose.state === inFramePose ? 'pyc-poses--on' : ''}"><div><img src="${pose.url}" alt=""></div><figcaption>${pose.state}</figcaption></figure>`,
      )
      .join('')}</div>` +
    (size === undefined
      ? ''
      : `<div class="pyc-measure">In this frame: the <b>${inFramePose}</b> pose, painted at <b>${size.w} &times; ${size.h}</b> px — measured from public/art/${size.src}</div>`);
}

const app = document.getElementById('app');
if (app === null) {
  throw new Error('exploded/main.ts: no #app element in exploded/index.html');
}

const response = await fetch(artUrl('manifest.json'));
if (!response.ok) {
  throw new Error(`exploded/main.ts: could not read the art manifest (${response.status})`);
}
const manifest = (await response.json()) as ArtManifest;

/**
 * `layers.ts` writes each component's overview twice — once as the card's lead
 * paragraph, once as its "Overview" tab. That is right for a data layer (either
 * reader gets the whole claim) and wrong on screen, where the card would print
 * the same sentences one under the other. The lead paragraph gives way; the
 * tabs keep every word, and the facts, cite and honesty note are untouched.
 */
function dedupeOverview(piece: Piece): Piece {
  const first = piece.card.tabs[0];
  if (first === undefined || first.body !== piece.card.body) return piece;
  return { ...piece, card: { ...piece.card, body: '' } };
}

const run = runFrameTurn();
const built = buildFrameSpecimen(manifest);
const specimen: Specimen = {
  ...built,
  pieces: built.pieces.map(dedupeOverview),
  // The frames title the page "Pyrefly Reprise, exploded" and put the counts in the
  // facts line under it; approved copy, ported (hard rule 9), as site B does.
  title: 'Pyrefly Reprise, exploded',
};
const chapter = getChapter(BUILT_CHAPTER);
const use = chapterUseById(BUILT_CHAPTER, manifest.pause);

const caption =
  `<b>${CHAPTER_LABEL}, ${chapter?.title ?? ''} &middot; ${chapter?.location ?? ''}.</b> ` +
  `${run.actorName} attacks for <em>${run.damage}</em>. ` +
  `That number comes from the game&rsquo;s own battle engine, run with seed ${run.seed}.`;

const handle = mountExplorer(app, {
  theme: 'cinema',
  siteName: 'How this game is built',
  siteTagline: 'one frame',
  specimens: switcherEntries(),
  initialSpecimenId: BUILT_CHAPTER,
  getSpecimen: (): Specimen => specimen,
  systemBlurbs: PLAIN,
  presetTabs: PRESET_TABS,
  createStagePainter: createExplodedPainter({
    run,
    use,
    chapterLabel: CHAPTER_LABEL,
    caption,
    rails: railRows(run.chips),
  }),
  sliderLabels: {
    start: 'Assembled',
    end: 'Every piece',
    plain: 'drag to pull the frame apart',
    stateFor: (explode, count) => {
      if (explode <= 0) return 'One finished frame';
      if (explode >= 1) return `Every piece · ${count}`;
      return 'Layers apart';
    },
  },
  secondaryAction: (_specimen: Specimen, piece: Piece | undefined): CardAction | undefined =>
    piece === undefined ? { label: 'Play this chapter', href: FIGHT_URL } : undefined,
  renderCardExtra: (host: HTMLElement, _specimen: Specimen, piece: Piece): void => {
    if (piece.id === 'layer-boss-billboard') posesExtra(host, manifest, 'hurt');
  },
  credits: 'Unofficial fan tribute',
});

// The approved frames open square to the camera and let the explode turn the frame
// itself; the shared stage opens at its three-quarter view, which has no perspective
// of its own and would only squash the composition. The rail's Tilt button still turns it.
handle.store.dispatch({ type: 'setView', view: 'front' });
