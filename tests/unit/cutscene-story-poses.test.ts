// @vitest-environment jsdom
/**
 * The story-pose paintings on the cutscene stage (D-301; Bailey, 2026-09-30 ~13:00 EDT: "all your recommendations,
 * godspeed"): Seymour at Macalania's kneel and fall (FFX only, Chapter VII), Isaaru's kneel (FFX only, Chapter XIV)
 * and Shuyin's kneel (FFX-2 only, Chapter V).
 *
 * Both ways: with the painting installed (the art manifest lists it) the figure shows it on its own feet line; without
 * it, Seymour keeps PR-0244's staging (the standing painting lowered, then laid down) and Isaaru and Shuyin stand,
 * exactly as before. The sizes are checked against the staged install package's sidecars where it is on this disk.
 */

import { existsSync, readFileSync } from 'node:fs';
import path from 'node:path';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { CutsceneStage, paintedPose } from '../../src/app/screens/CutsceneStage.ts';
import { CUTSCENE_FIGURES, cutsceneFigure, type PosePainting } from '../../src/app/screens/cutsceneFigures.ts';
import { resetArtManifest, setArtManifest, type ArtManifest } from '../../src/engine/ArtManifest.ts';
import { setPose, showActor, type Step } from '../../src/story/dsl.ts';
import { isaaruScripts as ffxIsaaruScripts } from '../../src/story/scripts/ffx-isaaru.ts';
import { seymourAnimaMacalaniaScripts } from '../../src/story/scripts/seymour-anima-macalania.ts';
import { ffx2VegnagunShuyinScripts as vegnagunShuyinScripts } from '../../src/story/scripts/ffx2-vegnagun-shuyin.ts';

const PKG = 'D:/Tools/pyrefly-art-backup/approved/2026-09-30-poses';
const ART = path.resolve(__dirname, '../../public/art');
const POSED = { 'seymour-macalania': ['kneel', 'ko'], isaaru: ['kneel'], shuyin: ['kneel'] } as const;

function manifest(withDaySet: boolean): ArtManifest {
  const subject = (states: string[]) => ({ states, portrait: false, facing: 'left' as const });
  return {
    version: 1,
    generatedAt: 'test',
    subjects: {
      'seymour-macalania': subject(withDaySet ? ['cast', 'hurt', 'idle', 'kneel', 'ko'] : ['cast', 'hurt', 'idle']),
      isaaru: subject(withDaySet ? ['idle', 'kneel'] : ['idle']),
      shuyin: subject(withDaySet ? ['idle', 'kneel'] : ['idle']),
      ginnem: subject(['idle']),
    },
    portraits: [],
    backdrops: [],
    pause: [],
    pause2x: [],
    title: [],
    title2x: [],
  } as unknown as ArtManifest;
}

describe('the figure table (D-301)', () => {
  it('gives story-pose paintings to Seymour at Macalania (kneel, ko), Isaaru (kneel) and Shuyin (kneel), nobody else', () => {
    const got = Object.fromEntries(
      Object.entries(CUTSCENE_FIGURES)
        .filter(([, f]) => f.poses)
        .map(([id, f]) => [id, Object.keys(f.poses!)]),
    );
    expect(got).toEqual(POSED);
    for (const [id, poses] of Object.entries(POSED)) {
      for (const pose of poses) expect(cutsceneFigure(id)!.poses![pose]!.art).toBe(`art/characters/${id}/${pose}.png`);
    }
  });

  it.skipIf(!existsSync(path.join(PKG, 'hashes.json')))('sizes each painting from its staged sidecar and the installed idle', () => {
    type Side = { width: number; height: number; baselineY: number; scale?: number; facing?: string; decision?: string };
    const read = (f: string): Side => JSON.parse(readFileSync(f, 'utf8')) as Side;
    for (const [id, poses] of Object.entries(POSED)) {
      const idle = read(path.join(ART, 'characters', id, 'idle.json'));
      for (const pose of poses) {
        const side = read(path.join(PKG, 'characters', id, `${pose}.json`));
        const p = cutsceneFigure(id)!.poses![pose as 'kneel']! as PosePainting;
        expect(p.aspect, `${id}/${pose}`).toBeCloseTo(side.width / side.height, 6);
        expect(p.baseline, `${id}/${pose}`).toBeCloseTo(side.baselineY / side.height, 6);
        expect(p.heightOfIdle, `${id}/${pose}`).toBeCloseTo((side.height * (side.scale ?? 1)) / idle.height, 6);
        // Painted facing the way the idle faces, so the script's facing never flips one and not the other.
        expect(side.facing, `${id}/${pose}`).toBe(idle.facing);
        expect(side.decision).toBe('D-301');
      }
    }
  });
});

describe('CutsceneStage.setPose with and without the painting', () => {
  let root: HTMLElement;
  let stage: CutsceneStage;
  beforeEach(() => {
    vi.useFakeTimers();
    root = document.createElement('div');
    document.body.appendChild(root);
    stage = new CutsceneStage(root);
    stage.mount();
  });
  afterEach(() => {
    stage.unmount();
    root.remove();
    resetArtManifest();
    vi.useRealTimers();
  });
  const el = (actor: string): HTMLElement => root.querySelector(`.cutscene__figure[data-actor="${actor}"]`)!;
  const src = (actor: string): string => el(actor).querySelector('img')!.getAttribute('src')!;
  const ghosts = (): number => root.querySelectorAll('.cutscene__figure.is-ghost').length;

  it('installed: Seymour kneels, then falls, in his own paintings on his own spot, and stands again for idle', () => {
    setArtManifest(manifest(true));
    void stage.showActor(showActor('seymour-macalania', { ms: 0 }));
    const fig = el('seymour-macalania');
    const kneel = cutsceneFigure('seymour-macalania')!.poses!.kneel!;
    const ko = cutsceneFigure('seymour-macalania')!.poses!.ko!;
    stage.setPose(setPose('seymour-macalania', 'kneel'));
    expect(src('seymour-macalania')).toMatch(/art\/characters\/seymour-macalania\/kneel\.png$/);
    expect(fig.className).not.toMatch(/is-kneel|is-ko/);
    expect(fig.classList.contains('is-painted-pose')).toBe(true);
    expect(Number(fig.style.getPropertyValue('--h-l'))).toBeCloseTo(0.62 * kneel.heightOfIdle, 6);
    expect(Number(fig.style.getPropertyValue('--h-p'))).toBeCloseTo(0.46 * kneel.heightOfIdle, 6);
    expect(Number(fig.style.getPropertyValue('--baseline'))).toBeCloseTo(kneel.baseline, 6);
    expect(Number(fig.style.getPropertyValue('--aspect'))).toBeCloseTo(kneel.aspect, 6);
    // the standing painting fades off over it, then goes
    expect(ghosts()).toBe(1);
    vi.advanceTimersByTime(900);
    expect(ghosts()).toBe(0);

    stage.setPose(setPose('seymour-macalania', 'ko'));
    expect(src('seymour-macalania')).toMatch(/seymour-macalania\/ko\.png$/);
    expect(fig.className).not.toMatch(/is-kneel|is-ko\b/);
    expect(Number(fig.style.getPropertyValue('--aspect'))).toBeCloseTo(ko.aspect, 6);
    expect(Number(fig.style.getPropertyValue('--h-l'))).toBeCloseTo(0.62 * ko.heightOfIdle, 6);
    // the fall keeps his feet line; its centre moves right of the box (only the robe tail runs off the screen's
    // right edge; portrait 0.65 keeps the wide painting's hair tips inside the left edge at 390x844)
    expect(fig.style.getPropertyValue('--x-l')).toBe('0.94');
    expect(fig.style.getPropertyValue('--x-p')).toBe('0.65');
    expect(fig.style.getPropertyValue('--feet-l')).toBe('0.9');
    expect(fig.style.getPropertyValue('--feet-p')).toBe('0.74');

    stage.setPose(setPose('seymour-macalania', 'idle'));
    expect(src('seymour-macalania')).toMatch(/seymour-macalania\/idle\.png$/);
    expect(fig.classList.contains('is-painted-pose')).toBe(false);
    expect(Number(fig.style.getPropertyValue('--h-l'))).toBeCloseTo(0.62, 6);
    expect(fig.style.getPropertyValue('--x-l')).toBe('0.8');
  });

  it('not installed: Seymour keeps the PR-0244 staging on his standing painting; Isaaru and Shuyin stand as before', () => {
    setArtManifest(manifest(false));
    for (const id of ['seymour-macalania', 'isaaru', 'shuyin']) void stage.showActor(showActor(id, { ms: 0 }));
    stage.setPose(setPose('seymour-macalania', 'kneel'));
    expect(el('seymour-macalania').classList.contains('is-kneel')).toBe(true);
    stage.setPose(setPose('seymour-macalania', 'ko'));
    expect(el('seymour-macalania').classList.contains('is-ko')).toBe(true);
    expect(src('seymour-macalania')).toMatch(/seymour-macalania\/idle\.png$/);
    for (const id of ['isaaru', 'shuyin']) {
      const before = el(id).outerHTML;
      stage.setPose(setPose(id, 'kneel'));
      expect(el(id).outerHTML, id).toBe(before);
    }
    expect(ghosts()).toBe(0);
  });

  it('no manifest loaded: nothing is claimed installed, so nothing is requested that may not exist', () => {
    setArtManifest(null);
    for (const [id, poses] of Object.entries(POSED)) {
      for (const pose of poses) expect(paintedPose(cutsceneFigure(id)!, pose), `${id}/${pose}`).toBeUndefined();
    }
  });

  it('installed: Isaaru and Shuyin kneel in their paintings; a figure posed before it is shown fades in kneeling, with no ghost', () => {
    setArtManifest(manifest(true));
    stage.setPose(setPose('shuyin', 'kneel'));
    void stage.showActor(showActor('shuyin', { ms: 0 }));
    expect(src('shuyin')).toMatch(/shuyin\/kneel\.png$/);
    expect(el('shuyin').classList.contains('is-on')).toBe(true);
    expect(ghosts()).toBe(0);
    void stage.showActor(showActor('isaaru', { ms: 0 }));
    stage.setPose(setPose('isaaru', 'kneel'));
    expect(src('isaaru')).toMatch(/isaaru\/kneel\.png$/);
    expect(el('isaaru').className).not.toMatch(/is-kneel/);
    // every other figure is untouched
    void stage.showActor(showActor('ginnem', { ms: 0 }));
    const before = el('ginnem').outerHTML;
    stage.setPose(setPose('ginnem', 'kneel'));
    expect(el('ginnem').outerHTML).toBe(before);
  });
});

describe('the post scenes pose them where the words say (no dialogue changed)', () => {
  const steps = (script: readonly Step[]): Step[] => script.flatMap((s) => (s.type === 'parallel' ? s.steps : [s]));
  const idx = (list: Step[], pred: (s: Step) => boolean): number => list.findIndex(pred);

  it('Chapter XIV (FFX only): Isaaru kneels at the "Isaaru kneels" beat, after he is on the plate and before his first line', () => {
    const post = steps(ffxIsaaruScripts.post);
    const show = idx(post, (s) => s.type === 'showActor' && s.actor === 'isaaru');
    const kneel = idx(post, (s) => s.type === 'setPose' && s.actor === 'isaaru' && s.state === 'kneel');
    const firstLine = idx(post, (s) => s.type === 'say');
    expect(show).toBeGreaterThanOrEqual(0);
    expect(kneel).toBeGreaterThan(show);
    expect(kneel).toBeLessThan(firstLine);
    expect(post[kneel + 1]).toMatchObject({ type: 'wait' });
  });

  it('Chapter V (FFX-2 only): Shuyin is posed before he is shown, so the kneel is up from the first frame', () => {
    const post = steps(vegnagunShuyinScripts.post);
    const kneel = idx(post, (s) => s.type === 'setPose' && s.actor === 'shuyin' && s.state === 'kneel');
    const show = idx(post, (s) => s.type === 'showActor' && s.actor === 'shuyin');
    expect(kneel).toBeGreaterThanOrEqual(0);
    expect(kneel).toBeLessThan(show);
  });

  it('Chapter VII (FFX only): Seymour is posed kneeling before each showActor and falls before the fall caption', () => {
    const post = steps(seymourAnimaMacalaniaScripts.post);
    const shows = post.map((s, i) => (s.type === 'showActor' && s.actor === 'seymour-macalania' ? i : -1)).filter((i) => i >= 0);
    expect(shows.length).toBe(2);
    for (const i of shows) expect(post[i - 1]).toMatchObject({ type: 'setPose', actor: 'seymour-macalania', state: 'kneel' });
    const fall = idx(post, (s) => s.type === 'narrate' && /Then he fell/.test(s.text));
    expect(post[fall - 1]).toMatchObject({ type: 'setPose', actor: 'seymour-macalania', state: 'ko' });
  });
});
