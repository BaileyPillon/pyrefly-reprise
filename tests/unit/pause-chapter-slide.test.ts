// @vitest-environment jsdom
/**
 * D-234 / PR-0171: the pause CHAPTER tab slides the Chapter II and Chapter IX plates clear of
 * the chrome (option C of `docs/concepts/pause-dossier-2026-09-27/`), under the member-tab slide
 * rule, never below 0.88x of the approved framing.
 *
 * The pure half is tested here against chrome boxes shaped like the live 1600x900 battle
 * layout (THIS ENCOUNTER 64-524, THE PARTY 572-963, as measured on the B6 build in Ch II); the
 * DOM half is proved on a production build (`docs/screenshots/iter2-b6/`).
 *
 * Game case: FFX data (two FFX plates) on shared pause chrome.
 */

import { describe, expect, it } from 'vitest';
import { CHAPTER_SLIDE_FACES, CHAPTER_SLIDE_MIN_SCALE, slideChapterPlate, slideClears } from '../../src/app/screens/pause/chapterSlide.ts';
import { placeDossier } from '../../src/app/screens/pause/dossierPlace.ts';
import { faceOverlap, faceRectOn, type Rect } from '../../src/app/screens/pause/faceClear.ts';
import { SLIDE_MIN_SCALE, frameFace } from '../../src/app/screens/pause/faceSlide.ts';
import { framePlate, framingFor } from '../../src/app/screens/pause/plates.ts';

const W = 1600;
const H = 900;
/** The CHAPTER tab in battle at 1600x900: the two reading columns, the tab strip, the objective. */
const BATTLE: Rect[] = [
  { left: 64, right: 524, top: 238, bottom: 500 },
  { left: 572, right: 963, top: 238, bottom: 510 },
  { left: 64, right: 560, top: 120, bottom: 160 },
  { left: 64, right: 700, top: 800, bottom: 840 },
];

describe('D-234: the CHAPTER plate slide (pure)', () => {
  it('has a face for exactly the two FFX plates the pick is for', () => {
    expect(Object.keys(CHAPTER_SLIDE_FACES).sort()).toEqual(['ch2-yunalesca', 'ch9-yojimbo']);
    expect(CHAPTER_SLIDE_MIN_SCALE).toBe(0.88);
    expect(CHAPTER_SLIDE_MIN_SCALE).toBeGreaterThan(SLIDE_MIN_SCALE);
  });

  it('today the approved framing puts THE PARTY on both faces (the defect)', () => {
    for (const id of Object.keys(CHAPTER_SLIDE_FACES)) {
      const base = framePlate(framingFor(id), W, H);
      expect(faceOverlap(faceRectOn(base, CHAPTER_SLIDE_FACES[id]!), BATTLE), id).toBeGreaterThan(0);
    }
  });

  it('slides each plate right until the face clears, no smaller than 0.88x, with the face on screen', () => {
    for (const id of Object.keys(CHAPTER_SLIDE_FACES)) {
      const f = framingFor(id);
      const base = framePlate(f, W, H);
      const box = frameFace(base, f, CHAPTER_SLIDE_FACES[id], W, H, BATTLE, CHAPTER_SLIDE_MIN_SCALE);
      expect(box.slid, id).toBe(true);
      expect(box.left, `${id} slides right, under the falloff on the chrome side`).toBeGreaterThan(0);
      expect(box.width / base.width, id).toBeGreaterThanOrEqual(CHAPTER_SLIDE_MIN_SCALE - 1e-9);
      expect(slideClears(box, CHAPTER_SLIDE_FACES[id]!, BATTLE, W, H), id).toBe(true);
    }
  });

  it('never goes below the caller floor: a chrome no slide inside 0.88x clears keeps the approved framing', () => {
    const id = 'ch9-yojimbo';
    const f = framingFor(id);
    const base = framePlate(f, W, H);
    // A wall of chrome across nearly the whole frame: nothing but a tiny plate would clear it.
    const wall: Rect[] = [{ left: 0, right: 1450, top: 100, bottom: 800 }];
    const box = frameFace(base, f, CHAPTER_SLIDE_FACES[id], W, H, wall, CHAPTER_SLIDE_MIN_SCALE);
    expect(box).toBe(base);
    expect(box.slid).toBeUndefined();
  });
});

describe('D-234: the CHAPTER plate slide (DOM guards)', () => {
  function screen(tab: string): { root: HTMLElement; art: HTMLElement } {
    const root = document.createElement('div');
    root.innerHTML = `<div data-role="art"></div><div data-role="body" data-tab="${tab}">
      <div class="pause__col" data-col="detail"></div>
      <div class="pause__col" data-col="dossier"><h3>Cavern of the Stolen Fayth</h3><blockquote class="pause__quote">q</blockquote></div>
    </div>`;
    document.body.appendChild(root);
    return { root, art: root.querySelector<HTMLElement>('[data-role="art"]')! };
  }

  it('does nothing off the CHAPTER tab, or for a plate with no face on record', () => {
    const id = 'ch9-yojimbo';
    const f = framingFor(id);
    const base = framePlate(f, W, H);
    const member = screen('member:yuna');
    expect(slideChapterPlate(member.root, member.art, id, base, f, W, H)).toBeNull();
    expect(member.root.dataset['dossierSlid']).toBeUndefined();
    const other = screen('chapter');
    expect(slideChapterPlate(other.root, other.art, 'ch1-seymour-flux', base, f, W, H)).toBeNull();
    expect(other.root.dataset['dossierSlid']).toBeUndefined();
  });

  it('does nothing in a portrait frame (the phone stacks the chrome under the face)', () => {
    const id = 'ch2-yunalesca';
    const f = framingFor(id);
    const base = framePlate(f, 390, 844);
    const s = screen('chapter');
    expect(slideChapterPlate(s.root, s.art, id, base, f, 390, 844)).toBeNull();
  });

  it("the dossier rule keeps the placement a slide measured the plate against", () => {
    const s = screen('chapter');
    const plate = document.createElement('img');
    plate.dataset['plate'] = 'ch9-yojimbo';
    s.root.dataset['dossierSlid'] = 'ch9-yojimbo';
    s.root.dataset['dossier'] = 'under-lean';
    s.root.classList.add('pause--dossier-under', 'pause--dossier-lean');
    expect(placeDossier(s.root, s.art, plate)).toBe('under-lean');
    expect(s.root.classList.contains('pause--dossier-lean')).toBe(true);
    // Another plate (or no slide) goes back to the face rule: no face box, so beside.
    delete s.root.dataset['dossierSlid'];
    expect(placeDossier(s.root, s.art, plate)).toBe('beside');
    expect(s.root.classList.contains('pause--dossier-lean')).toBe(false);
  });
});
