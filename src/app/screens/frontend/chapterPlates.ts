/**
 * The boss painted on its own scene: the art of every chapter-select plate and
 * card.
 *
 * Approved end state: `docs/concepts/chapter-select-v2/option-C/` with
 * Bailey's two follow-ups of 2026-09-25 ("All recommendations", D-183): the
 * big plate and every card show the chapter's BOSS PAINTED ON ITS OWN SCENE
 * (the treatment the option-C Evrae capture shows), never the party close-up
 * pause plates, which stay on the pause screen they were approved for. The
 * README's critique asks for care in the composition: no crop cutting a face,
 * no small figure pasted onto a room. So each chapter has its own placement
 * for the plate and its own crop box on the boss for the card, measured on the
 * installed paintings (`public/art/characters/<key>/idle.png`, cut-outs on
 * transparency) over the chapter's scene (`public/art/backdrops/<scene>.png`).
 *
 * Nothing is generated and no approved file is replaced (hard rules 8, 9): the
 * paintings are layered by CSS. A chapter with no entry here still gets its
 * boss on its scene from the default placement.
 *
 * Pure string builders: no DOM. Game-aware (AGENTS.md rule 14): **both**. The
 * board is shared; each FFX-2 chapter uses only FFX-2 paintings and scenes,
 * which is what its own registry entry names.
 */

import { artUrl } from '../../../engine/PaintedArt.ts';
import type { ChapterTile } from './chapterGrid.ts';

/**
 * Where a painting sits in its box: its focus point (normally the boss's
 * face) lands at (`x`, `y`) of the box, in percent, and the painting is `h`
 * percent of the box's height tall. Anchoring on the face rather than on an
 * edge keeps the crop on the face whatever the box's shape: the plate is
 * about 1.9:1, a desktop card's art about 4.5:1, a phone card's about 7:1.
 */
export interface Placement {
  readonly x: number;
  readonly y: number;
  readonly h: number;
  /** Overrides the layer's focus for this box (fractions of the painting). */
  readonly focus?: readonly [number, number];
}

/** One boss painting in a composition, back to front. */
export interface BossLayer {
  readonly key: string;
  /** The face, as fractions of the painting's width and height (measured). */
  readonly focus: readonly [number, number];
  readonly hero: Placement;
  /** `null` leaves this painting off the card (a card crops to one face). */
  readonly card: Placement | null;
}

export interface PlateComposition {
  /** `object-position` of the scene in the plate and on the card. */
  readonly scene: { readonly hero: string; readonly card: string };
  readonly layers: readonly BossLayer[];
  /** The rim light the scene throws on the boss (an rgba colour). */
  readonly glow: string;
}

const P = (x: number, y: number, h: number, focus?: readonly [number, number]): Placement =>
  focus ? { x, y, h, focus } : { x, y, h };

/** Where every card's crop puts the face: the middle of the card's art. */
const CARD_FACE_X = 58;
const CARD_FACE_Y = 50;
const card = (h: number, focus?: readonly [number, number]): Placement => P(CARD_FACE_X, CARD_FACE_Y, h, focus);
/** A card whose long title would reach the face at 58 percent: the face sits at (`x`, `y`) instead. */
const cardAt = (x: number, y: number, h: number, focus: readonly [number, number]): Placement => P(x, y, h, focus);
/**
 * Where the face sits on a card whose title reaches 58 percent (measured for
 * Chapters X to XV): past the title's end, below-left of the corner ribbon.
 */
export const CARD_CLEAR = { x: 68, y: 64 } as const;
const cardClear = (h: number, focus: readonly [number, number]): Placement => cardAt(CARD_CLEAR.x, CARD_CLEAR.y, h, focus);

/**
 * Per chapter, measured on the paintings (face centres read off a 5 percent
 * grid laid over each `idle.png`). Plate heights above 100 percent frame a
 * standing boss from the thighs or the waist up, so the figure fills the
 * plate as a painted scene rather than standing small in it; card heights put
 * the head and shoulders across the card.
 */
export const PLATE_COMPOSITIONS: Readonly<Record<string, PlateComposition>> = {
  // I: Seymour, seated, over Mortiorchis on the Gagazet trail.
  'seymour-flux': {
    scene: { hero: '50% 55%', card: '50% 30%' },
    glow: 'rgba(150, 200, 255, 0.4)',
    layers: [
      { key: 'mortiorchis', focus: [0.5, 0.4], hero: P(80, 36, 72), card: null },
      { key: 'seymour-flux-body', focus: [0.47, 0.21], hero: P(62, 30, 122), card: card(350) },
    ],
  },
  // II: Lady Yunalesca under the dome, from the thighs up.
  yunalesca: {
    scene: { hero: '50% 45%', card: '50% 40%' },
    glow: 'rgba(190, 160, 255, 0.4)',
    layers: [{ key: 'yunalesca-1', focus: [0.44, 0.17], hero: P(68, 24, 150), card: card(400) }],
  },
  // III: Jecht in the aeon's body, before the Dream's End pyre. Its card
  // title is the longest on the board and runs past 58 percent, so the card
  // puts the face (measured at 0.33, 0.3; the skin spans 0.24 to 0.37 of the
  // width, 0.21 to 0.37 of the height) low and right: past the title's end
  // and under the beaten card's corner ribbon, at 1280, 1600, 2000 and 390.
  'braskas-final-aeon': {
    scene: { hero: '50% 55%', card: '50% 45%' },
    glow: 'rgba(255, 120, 70, 0.4)',
    layers: [
      {
        key: 'braskas-final-aeon-1',
        focus: [0.4, 0.3],
        hero: P(62, 37, 118),
        card: cardAt(78, 70, 270, [0.33, 0.3]),
      },
    ],
  },
  // IV (FFX-2): Bahamut in the Bevelle vault, wings open.
  'ffx2-bahamut': {
    scene: { hero: '50% 50%', card: '50% 40%' },
    glow: 'rgba(170, 140, 255, 0.38)',
    layers: [{ key: 'ffx2-bahamut', focus: [0.4, 0.12], hero: P(62, 17, 118), card: card(380) }],
  },
  // V (FFX-2): Vegnagun on the Farplane; the card crops on its lens.
  'ffx2-vegnagun-shuyin': {
    scene: { hero: '50% 60%', card: '50% 50%' },
    glow: 'rgba(230, 160, 255, 0.36)',
    layers: [
      { key: 'vegnagun-body', focus: [0.12, 0.25], hero: P(63, 56, 100, [0.5, 0.5]), card: card(220) },
    ],
  },
  // VI (FFX-2): Leblanc in her Last Room, from the thighs up.
  'ffx2-leblanc': {
    scene: { hero: '50% 55%', card: '50% 42%' },
    glow: 'rgba(247, 120, 200, 0.4)',
    layers: [{ key: 'leblanc', focus: [0.56, 0.1], hero: P(68, 19, 158), card: card(480) }],
  },
  // VII (coming): Anima in the Macalania antechamber.
  'seymour-anima-macalania': {
    scene: { hero: '50% 50%', card: '50% 40%' },
    glow: 'rgba(120, 190, 255, 0.36)',
    layers: [{ key: 'anima', focus: [0.4, 0.25], hero: P(66, 37, 140), card: card(260) }],
  },
  // VIII: Evrae over the deck of the Fahrenheit; the card crops on the head.
  'evrae-airship': {
    scene: { hero: '50% 40%', card: '50% 38%' },
    glow: 'rgba(120, 220, 230, 0.35)',
    layers: [{ key: 'evrae', focus: [0.25, 0.25], hero: P(62, 2, 104, [0.5, 0]), card: card(330) }],
  },
  // IX: Yojimbo in the Cavern of the Stolen Fayth, from the waist up.
  'yojimbo-cavern': {
    scene: { hero: '50% 55%', card: '50% 45%' },
    glow: 'rgba(200, 220, 255, 0.34)',
    layers: [{ key: 'yojimbo-cavern', focus: [0.46, 0.16], hero: P(68, 25, 150), card: card(400) }],
  },
  // XIII (FFX-2): Trema in the Via Infinito, from the waist up.
  'ffx2-trema': {
    scene: { hero: '50% 55%', card: '50% 30%' },
    glow: 'rgba(130, 200, 255, 0.34)',
    layers: [{ key: 'trema', focus: [0.51, 0.14], hero: P(66, 24, 150), card: card(420) }],
  },
  // The chapters after IX. Each card title reaches past 58 percent of the
  // card's art at 1280, 1600 and 2000 ('Seymour Omnis' covered his face on the
  // default crop), so each card puts the measured face at CARD_CLEAR: past the
  // title's end and below-left of the beaten card's corner ribbon. Measured
  // headless at 1280x720, 1600x900, 2000x1125 and 390x844, selected or not,
  // beaten or not: the face clears the title by 20 px or more and the ribbon's
  // band by 8 px or more at every size (captures in
  // docs/screenshots/chapter-select-c/card-crops/). Face boxes, as fractions of
  // each painting: Omnis 0.39-0.48 x 0.11-0.19, Natus 0.43-0.53 x 0.17-0.245,
  // Shiva 0.29-0.40 x 0.15-0.22, Isaaru 0.52-0.66 x 0.06-0.16, Baralai
  // 0.27-0.40 x 0.13-0.21.
  // X: Seymour Natus before the Highbridge gate, from the thighs up.
  'seymour-natus': {
    scene: { hero: '50% 50%', card: '50% 40%' },
    glow: 'rgba(255, 180, 90, 0.36)',
    layers: [
      { key: 'seymour-natus', focus: [0.48, 0.205], hero: P(64, 32, 150), card: cardClear(420, [0.48, 0.205]) },
    ],
  },
  // XI (FFX-2): Shiva on the Road to the Farplane, Anima (the Road's last
  // fallen aeon) behind her on the right; the card crops to Shiva alone.
  'ffx2-fallen-aeons': {
    scene: { hero: '50% 55%', card: '50% 40%' },
    glow: 'rgba(240, 170, 255, 0.38)',
    layers: [
      { key: 'x2-anima', focus: [0.42, 0.27], hero: P(85, 32, 112), card: null },
      { key: 'x2-shiva', focus: [0.345, 0.185], hero: P(60, 30, 150), card: cardClear(440, [0.345, 0.185]) },
    ],
  },
  // XII: Seymour Omnis in the Garden of Pain, claws spread, from the waist up.
  'seymour-omnis': {
    scene: { hero: '50% 45%', card: '50% 40%' },
    glow: 'rgba(150, 140, 255, 0.38)',
    layers: [
      { key: 'seymour-omnis', focus: [0.435, 0.15], hero: P(64, 32, 150), card: cardClear(400, [0.435, 0.15]) },
    ],
  },
  // XIV: Isaaru in the last chamber of the Via Purifico, sleeves open.
  'isaaru-via-purifico': {
    scene: { hero: '50% 55%', card: '50% 40%' },
    glow: 'rgba(255, 90, 70, 0.36)',
    layers: [{ key: 'isaaru', focus: [0.59, 0.11], hero: P(64, 24, 140), card: cardClear(340, [0.59, 0.11]) }],
  },
  // XV (FFX-2): the three shades in the Den of Woe, Baralai (the first one
  // met) in front between Gippal and Nooj; the card crops to Baralai.
  'ffx2-den-of-woe': {
    scene: { hero: '50% 55%', card: '50% 40%' },
    glow: 'rgba(110, 220, 230, 0.36)',
    layers: [
      { key: 'nooj-shade', focus: [0.55, 0.18], hero: P(82, 24, 120), card: null },
      { key: 'gippal-shade', focus: [0.51, 0.16], hero: P(46, 26, 120), card: null },
      { key: 'baralai-shade', focus: [0.335, 0.17], hero: P(64, 30, 150), card: cardClear(400, [0.335, 0.17]) },
    ],
  },
};

/** The placement a chapter without an entry gets: its boss, big, right of the title. */
const DEFAULT_HERO = P(68, 18, 130);
const DEFAULT_CARD = card(420);

/** The composition for a tile: its own entry, else its boss paintings at the default place. */
export function compositionFor(tile: Pick<ChapterTile, 'id' | 'silhouetteKeys'>): PlateComposition {
  const own = PLATE_COMPOSITIONS[tile.id];
  if (own) return own;
  const keys = tile.silhouetteKeys;
  return {
    scene: { hero: '50% 50%', card: '50% 40%' },
    glow: 'rgba(227, 185, 74, 0.3)',
    layers: keys.map((key, i) => ({
      key,
      focus: [0.5, 0.1] as const,
      hero: i === keys.length - 1 ? DEFAULT_HERO : P(40, 30, 80),
      card: i === keys.length - 1 ? DEFAULT_CARD : null,
    })),
  };
}

function placed(p: Placement, focus: readonly [number, number]): string {
  const [fx, fy] = p.focus ?? focus;
  return `--x:${p.x}%;--y:${p.y}%;--h:${p.h}%;--fx:${fx};--fy:${fy}`;
}

/**
 * The painted art for a plate (`'hero'`) or a card (`'card'`): the scene,
 * then each boss painting over it. An image that fails to load removes itself,
 * so a missing file never shows a broken-image glyph.
 */
export function plateArtHtml(
  tile: Pick<ChapterTile, 'id' | 'sceneKey' | 'silhouetteKeys' | 'title'>,
  where: 'hero' | 'card',
): string {
  const comp = compositionFor(tile);
  const scene = tile.sceneKey
    ? `<img class="cs-art__scene" src="${artUrl(`art/backdrops/${tile.sceneKey}.png`)}" alt="" ` +
      `style="object-position:${comp.scene[where]}" draggable="false" onerror="this.remove()">`
    : '';
  const bosses = comp.layers
    .map((layer) => {
      const at = where === 'hero' ? layer.hero : layer.card;
      if (!at) return '';
      const src = artUrl(`art/characters/${layer.key}/idle.png`);
      return `<img class="cs-art__boss" src="${src}" alt="" style="${placed(at, layer.focus)}" draggable="false" onerror="this.remove()">`;
    })
    .join('');
  return `<div class="cs-art cs-art--${where}" style="--glow:${comp.glow}">${scene}${bosses}</div>`;
}
