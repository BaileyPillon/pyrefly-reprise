/**
 * Site B, "Pyrefly Studio: one turn, taken apart": wires the shared explorer
 * shell (`learn/shared/shell.ts`) to one real turn of the FFX CTB engine and
 * to site B's own stage painter (`stage-studio.ts`), built to the approved
 * frames in `docs/concepts/atlas/b-battle-studio/`.
 *
 * What this file owns beyond the wiring is the chrome those frames have and
 * the shared shell does not: the FFX / FFX-2 game switch, the "Live engine"
 * panel with the seed and its Re-roll, and the caption strip under the stage.
 *
 * FFX only (AGENTS.md hard rule 14). Chapter 1 is built; chapters 2 to 5 and
 * the FFX-2 side are offered as disabled with an honest reason, never faked —
 * FFX-2 has per-character gauges and no turn list at all
 * (`research/ffx2-combat-core.md`), so there is nothing here to reuse and no
 * data to invent (hard rule 6).
 */

import { mountExplorer } from '../shared/shell.ts';
import type { CardAction, SwitcherEntry } from '../shared/shell.ts';
import type { Piece, Specimen } from '../shared/model.ts';
import type { Store } from '../shared/store.ts';
import { artUrl } from '../shared/urls.ts';
import { requireEl } from '../shared/dom.ts';
import { CHAPTER_IDS, getChapter } from '../../src/data/encounters.ts';
import { STUDIO_COMPONENTS, STUDIO_RULES } from './rules.ts';
import { buildTurnSpecimen } from './specimen.ts';
import { createStudioPainter } from './stage-studio.ts';
import { createLive, isTurnOrderPiece, renderAgilityControl, syncCardToLive } from './live.ts';
import type { StudioLive } from './live.ts';

/** The unofficial fan tribute's own game, linked from every card. */
const FIGHT_URL = 'https://baileypillon.github.io/pyrefly-reprise/';

const ROMAN: Readonly<Record<number, string>> = { 1: 'I', 2: 'II', 3: 'III', 4: 'IV', 5: 'V' };

/** The face each chapter's switcher chip wears in the frames. Every path is a file in `public/art/portraits/`. */
const CHAPTER_FACE: Readonly<Record<string, string>> = {
  'seymour-flux': 'portraits/seymour.png',
  yunalesca: 'portraits/yunalesca.png',
  'braskas-final-aeon': 'portraits/jecht.png',
  'ffx2-bahamut': 'portraits/bahamut.png',
  'ffx2-vegnagun-shuyin': 'portraits/shuyin.png',
};

/** The one chapter whose turn this site can actually run. */
const BUILT_CHAPTER = 'seymour-flux';

const SYSTEM_BLURBS: Readonly<Record<string, string>> = Object.fromEntries(
  STUDIO_COMPONENTS.map((component) => [component.id, component.plain]),
);

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

/** The FFX / FFX-2 switch of the frames, with the FFX-2 side honestly switched off. */
function gameSwitchHtml(): string {
  return `
    <div class="pyb-gameswitch">
      <div class="pyb-gameswitch__row" role="group" aria-label="Which game’s battle system">
        <button type="button" class="pyb-gameswitch__b pyb-gameswitch__b--on" aria-pressed="true">FFX</button>
        <button type="button" class="pyb-gameswitch__b" aria-pressed="false" disabled
          title="Not built yet: FFX-2 has gauges, not a turn list">FFX-2</button>
      </div>
      <span class="pyb-gameswitch__note">Not built yet: FFX-2 has gauges, not a turn list</span>
    </div>`;
}

/** The frames' "Live engine" panel: what the page is running, on which seed, and the control that changes it. */
function liveHtml(seed: number): string {
  return `
    <aside class="pyb-live">
      <div class="pyx-caps pyb-live__k"><i></i>Live engine</div>
      <p>Nothing here is typed in. This page runs the game’s own battle code.</p>
      <div class="pyb-live__row"><span>Seed<b data-seed>${seed}</b></span>
        <button type="button" class="pyb-live__btn" data-reroll>Re-roll</button></div>
    </aside>`;
}

/** The caption under the stage, which names the state the slider is in. */
function captionFor(explode: number, ruleCount: number): string {
  if (explode <= 0.02) return 'One turn · assembled';
  if (explode >= 0.98) return `Rule inventory · ${ruleCount} rules · largest first`;
  return 'Separated steps';
}

function mountChrome(canvas: HTMLElement, live: StudioLive, store: Store, ruleCount: number): void {
  const extra = document.createElement('div');
  extra.className = 'pyb-chrome';
  extra.innerHTML = `${gameSwitchHtml()}${liveHtml(live.seed())}
    <div class="pyx-caps pyb-xcap"><span data-xcap></span></div>
    <div class="pyb-vignette"></div>`;
  canvas.appendChild(extra);

  const seedEl = requireEl(extra, '[data-seed]');
  const caption = requireEl(extra, '[data-xcap]');

  requireEl<HTMLButtonElement>(extra, '[data-reroll]').addEventListener('click', () => {
    seedEl.textContent = String(live.reroll());
  });

  function paintCaption(): void {
    caption.textContent = captionFor(store.getState().explode, ruleCount);
  }
  store.subscribe(paintCaption);
  paintCaption();
}

const app = document.getElementById('app');
if (app === null) {
  throw new Error('studio/main.ts: no #app element in studio/index.html');
}

const live = createLive(1);
/**
 * The specimen's **shape** — which pieces exist, which system each belongs to
 * — never changes with the Agility control: the same eight steps and the same
 * 137 rules are there at every Agility. Only the numbers change, and those are
 * read live from `live.trace()` by the stage and by the open card, so the page
 * is never rebuilt mid-drag and nothing a reader has selected is lost.
 */
const specimen: Specimen = {
  ...buildTurnSpecimen(live.trace(), STUDIO_RULES),
  // The frames title the page "One Turn" and put who-did-what-to-whom in the facts line
  // under it; the specimen's own generated title is that same sentence, so it would read
  // twice. Approved copy, ported (AGENTS.md hard rule 9).
  title: 'One Turn',
};

const handle = mountExplorer(app, {
  theme: 'studio',
  siteName: 'Pyrefly Studio',
  siteTagline: 'Battle system',
  specimens: switcherEntries(),
  initialSpecimenId: BUILT_CHAPTER,
  getSpecimen: (): Specimen => specimen,
  systemBlurbs: SYSTEM_BLURBS,
  createStagePainter: createStudioPainter({ rules: STUDIO_RULES, trace: () => live.trace() }),
  sliderLabels: {
    start: 'Assembled',
    end: 'Every rule',
    plain: 'drag to take the turn apart',
    stateFor: (explode, count) => {
      if (explode <= 0) return 'One turn';
      if (explode >= 1) return `Rule inventory · ${count} pieces`;
      return 'Separated steps';
    },
  },
  // Only on the nothing-selected card: the b2 frame's detail card carries "Isolate step" and
  // "Clear selection" and nothing else, and a second button beside Isolate wraps in a 320px card.
  secondaryAction: (_specimen: Specimen, piece: Piece | undefined): CardAction | undefined =>
    piece === undefined ? { label: 'Fight this chapter', href: FIGHT_URL } : undefined,
  renderCardExtra: (host: HTMLElement, _specimen: Specimen, piece: Piece) =>
    isTurnOrderPiece(piece) ? renderAgilityControl(host, live, piece) : syncCardToLive(host, live, piece),
  credits: 'Unofficial fan tribute',
});

mountChrome(requireEl(app, '.pyx-canvas'), live, handle.store, STUDIO_RULES.length);

// The frames are drawn front-on — a studio turntable, photographed square. The shared
// stage opens at its three-quarter view, which foreshortens the whole composition, so
// site B asks for Front at the start. The rail's Tilt button still turns it.
handle.store.dispatch({ type: 'setView', view: 'front' });

// Re-running the engine changes no explorer state, but every live number on the stage comes
// from the new trace — so nudge the store with the value it already holds to make it repaint.
live.subscribe(() => handle.store.dispatch({ type: 'setExplode', explode: handle.store.getState().explode }));
