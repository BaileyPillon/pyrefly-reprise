// @vitest-environment jsdom
/**
 * The experimental Leblanc chapter's dialogue portraits, pause plates and CHAPTER panel (branch `exp-leblanc`; FFX-2 only).
 *
 * The chapter draws its figures from the art namespace `exp-leblanc` (`src/data/art/artNamespace.ts`); this file is about the OTHER surfaces that read paintings by an id
 * of their own: the dialogue box and the story scenes (`portraits/<id>`), the turn cut-in, the results wedge, and the pause screen (`pause/<plate>`, the CHAPTER tab's hero
 * plate and its journal snapshots). Each takes the namespace's own painting when it has one, and Chapter VI, which has no namespace, is exactly what it was.
 */
import { existsSync, readFileSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

import { artNamespaceOfScene, EXP_LEBLANC_SCENE } from '../../src/data/art/artNamespace.ts';
import { EXP_LEBLANC_META } from '../../src/data/chapter-meta-exp-leblanc.ts';
import { FFX2_LEBLANC_META } from '../../src/data/chapter-meta-ffx2-leblanc.ts';
import { FFX2_LEBLANC, getChapter } from '../../src/data/encounters.ts';
import { sceneArtUrls } from '../../src/app/screens/sceneArt.ts';
import { FACE_BOXES } from '../../src/app/screens/pause/faceClear.ts';
import { chromeSideForCombatant, EXP_PLATE_FRAMING, framingFor, plateIdFor, PLATE_FRAMING } from '../../src/app/screens/pause/plates.ts';
import { resetArtManifest, setArtManifest } from '../../src/engine/ArtManifest.ts';
import { DialogueBox } from '../../src/ui/common/DialogueBox.ts';
import { measuredFilePx, measuredPortraitIds, portraitCrop } from '../../src/ui/common/portrait.ts';
import { portraitIdIn } from '../../src/ui/common/portraitNamespace.ts';
import { resultsHeroBox } from '../../src/ui/common/resultsMath.ts';
import { wedgePortraitId } from '../../src/ui/common/victoryLine.ts';
import { say } from '../../src/story/dsl.ts';

const ROOT = resolve(__dirname, '../..');
const ART = join(ROOT, 'public', 'art');
const HAVE_ART = existsSync(join(ART, 'manifest.json')) && existsSync(join(ART, 'portraits', 'exp-leblanc-yuna-x2.png'));
const NS = 'exp-leblanc';
const SPEAKERS = ['yuna-x2', 'rikku-x2', 'paine', 'leblanc', 'logos', 'ormi', 'brother-x2'] as const;
const exp = getChapter('exp-leblanc')!;

function pngSize(file: string): [number, number] {
  const head = readFileSync(file).subarray(0, 24);
  return [head.readUInt32BE(16), head.readUInt32BE(20)];
}

function mountBox(artNamespace?: string): DialogueBox {
  const root = document.createElement('div');
  document.body.appendChild(root);
  const box = new DialogueBox({ root, ...(artNamespace ? { artNamespace } : {}) });
  box.mount();
  return box;
}

describe('portraitIdIn: the namespace has repainted seven speakers, and every other id keeps its base portrait', () => {
  it('maps the seven repainted speakers into the namespace', () => {
    for (const id of SPEAKERS) expect(portraitIdIn(NS, id), id).toBe(`${NS}-${id}`);
  });

  it('keeps an id the namespace has not repainted (Nooj, Baralai, Gippal), an id already inside it, and every id with no namespace', () => {
    for (const id of ['nooj', 'baralai', 'gippal', 'yuna', 'seymour']) expect(portraitIdIn(NS, id), id).toBe(id);
    expect(portraitIdIn(NS, `${NS}-leblanc`)).toBe(`${NS}-leblanc`);
    for (const id of [...SPEAKERS, 'nooj']) expect(portraitIdIn(undefined, id), id).toBe(id);
    expect(portraitIdIn(NS, undefined)).toBeUndefined();
  });

  it('has a measured face row for every one of them, measured on a file of the house size', () => {
    for (const id of SPEAKERS) {
      expect(measuredPortraitIds(), id).toContain(`${NS}-${id}`);
      expect(measuredFilePx(`${NS}-${id}`), id).toEqual([832, 1216]);
      const crop = portraitCrop(`${NS}-${id}`);
      expect(crop.fx, id).toBeGreaterThan(0.4);
      expect(crop.fx, id).toBeLessThan(0.6);
      expect(crop.fy, id).toBeGreaterThan(0.2);
      expect(crop.fy, id).toBeLessThan(0.45);
      expect(crop.ipd, id).toBeGreaterThan(0.15);
      expect(crop.ipd, id).toBeLessThan(0.34);
    }
  });

  it.skipIf(!HAVE_ART)('the files are there, 832x1216 each, and only the namespace\'s own: Chapter VI\'s portraits are the files they were', () => {
    for (const id of SPEAKERS) {
      expect(pngSize(join(ART, 'portraits', `${NS}-${id}.png`)), id).toEqual([832, 1216]);
      expect(existsSync(join(ART, 'portraits', `${id}.png`)), `base ${id}`).toBe(true);
    }
  });
});

describe('the dialogue box and the story scenes read the namespace\'s portrait', () => {
  it('shows the namespaced portrait of a repainted speaker, and the base one of anybody else, inside the namespace', () => {
    resetArtManifest();
    const box = mountBox(NS);
    void box.say(say('leblanc', 'Darling.'));
    expect(box.el.querySelector('.dbox__portrait img')?.getAttribute('src') ?? '').toContain('/art/portraits/exp-leblanc-leblanc.png');
    void box.say(say('brother-x2', 'I CANNOT HEAR YOU!'));
    expect(box.el.querySelector('.dbox__portrait img')?.getAttribute('src') ?? '').toContain('/art/portraits/exp-leblanc-brother-x2.png');
    void box.say(say('nooj', 'Hm.'));
    expect(box.el.querySelector('.dbox__portrait img')?.getAttribute('src') ?? '').toContain('/art/portraits/nooj.png');
  });

  it('follows a step\'s own `portrait` and the box\'s `portraitFor` into the namespace too', () => {
    resetArtManifest();
    const box = mountBox(NS);
    void box.say(say('narrator', 'A voice.', { portrait: 'yuna-x2' }));
    expect(box.el.querySelector('.dbox__portrait img')?.getAttribute('src') ?? '').toContain('/art/portraits/exp-leblanc-yuna-x2.png');
  });

  it('is exactly what it was with no namespace (Chapter VI)', () => {
    resetArtManifest();
    const box = mountBox();
    void box.say(say('leblanc', 'Darling.'));
    const src = box.el.querySelector('.dbox__portrait img')?.getAttribute('src') ?? '';
    expect(src).toContain('/art/portraits/leblanc.png');
    expect(src).not.toContain('exp-leblanc');
  });

  it('the story scene warms the namespaced portraits of its speakers, and Chapter VI\'s warm its own', () => {
    const script = exp.scriptsRef!.pre!;
    const mine = sceneArtUrls(script, exp.sceneKey);
    const all = [...mine.first, ...mine.rest];
    expect(all.some((u) => u.includes('/art/portraits/exp-leblanc-leblanc.png'))).toBe(true);
    expect(all.some((u) => /\/art\/portraits\/(?:leblanc|ormi|logos)\.png/.test(u)), 'no base portrait of a repainted speaker').toBe(false);
    const base = sceneArtUrls(FFX2_LEBLANC.scriptsRef!.pre!, FFX2_LEBLANC.sceneKey);
    expect([...base.first, ...base.rest].some((u) => u.includes('exp-leblanc')), 'Chapter VI names nothing of the preview').toBe(false);
  });

  it('every speaker of the preview\'s scripts that has a painting in the namespace is one of the seven', () => {
    const speakers = new Set<string>();
    for (const step of [...(exp.scriptsRef!.pre ?? []), ...(exp.scriptsRef!.post ?? [])]) {
      if (step.type === 'say') speakers.add(step.portrait ?? step.who);
    }
    const repainted = [...speakers].filter((id) => portraitIdIn(NS, id) !== id);
    for (const id of repainted) expect(SPEAKERS as readonly string[], id).toContain(id);
    expect(repainted.length).toBeGreaterThanOrEqual(5);
  });
});

describe('the results wedge', () => {
  it('stands the namespace\'s portrait for the leader the chapter names, and Chapter VI\'s stays Chapter VI\'s', () => {
    expect(wedgePortraitId('yuna', exp)).toBe('exp-leblanc-yuna-x2');
    expect(wedgePortraitId('rikku', exp)).toBe('exp-leblanc-rikku-x2');
    expect(wedgePortraitId('paine', exp)).toBe('exp-leblanc-paine');
    expect(wedgePortraitId('yuna', FFX2_LEBLANC)).toBe('yuna-x2');
    expect(wedgePortraitId('paine', FFX2_LEBLANC)).toBe('paine');
  });

  it('places each wedge portrait from its own measured row (the eye line lands where the frame wants it)', () => {
    for (const id of ['yuna-x2', 'rikku-x2', 'paine']) {
      const box = resultsHeroBox(`${NS}-${id}`);
      expect(box.width, id).toBeGreaterThan(300);
      expect(box.height, id).toBeGreaterThan(box.width); // a 2:3 painting
    }
  });
});

describe('the pause screen takes the namespace\'s plates', () => {
  it('plateIdFor: the namespace\'s three member plates replace the base ones, inside it only', () => {
    expect(plateIdFor('yuna', 'ffx2', NS)).toBe('exp-leblanc-yuna-ffx2');
    expect(plateIdFor('rikku', 'ffx2', NS)).toBe('exp-leblanc-rikku-ffx2');
    expect(plateIdFor('paine', 'ffx2', NS)).toBe('exp-leblanc-paine');
    expect(plateIdFor('yuna', 'ffx2')).toBe('yuna-ffx2');
    expect(plateIdFor('paine', 'ffx2')).toBe('paine');
    expect(plateIdFor('yuna', 'ffx', NS), 'an FFX chapter keeps its own').toBe('yuna');
    expect(plateIdFor('tidus', 'ffx2', NS), 'nobody else has one').toBe('tidus');
  });

  it('frames and mirrors the namespace\'s plates by their own rows, and leaves the shipped plates\' table alone', () => {
    expect(Object.keys(EXP_PLATE_FRAMING).sort()).toEqual(['exp-leblanc-paine', 'exp-leblanc-rikku-ffx2', 'exp-leblanc-yuna-ffx2']);
    for (const id of Object.keys(EXP_PLATE_FRAMING)) {
      expect(framingFor(id), id).toBe(EXP_PLATE_FRAMING[id]);
      expect(FACE_BOXES[id], `${id} has a face box`).toBeDefined();
      expect(Object.hasOwn(PLATE_FRAMING, id), `${id} is not in the shipped table`).toBe(false);
    }
    for (const id of ['yuna-ffx2', 'rikku-ffx2', 'paine']) expect(framingFor(id)).toBe(PLATE_FRAMING[id]);
    for (const c of ['yuna', 'rikku', 'paine']) {
      expect(['left', 'right']).toContain(chromeSideForCombatant(c, 'ffx2', NS));
      expect(chromeSideForCombatant(c, 'ffx2', NS)).toBe(EXP_PLATE_FRAMING[plateIdFor(c, 'ffx2', NS)]!.side);
    }
    expect(chromeSideForCombatant('yuna', 'ffx2')).toBe('left'); // Chapter VI's, as it was
  });

  it.skipIf(!HAVE_ART)('every plate of the namespace is a 1344x768 file with a 2x master, and its sidecar says the focal the table frames by', () => {
    for (const [id, f] of Object.entries(EXP_PLATE_FRAMING)) {
      expect(pngSize(join(ART, 'pause', `${id}.png`)), id).toEqual([1344, 768]);
      expect(existsSync(join(ART, 'pause', `${id}.2x.webp`)), `${id} master`).toBe(true);
      const side = JSON.parse(readFileSync(join(ART, 'pause', `${id}.json`), 'utf8')) as { focal: { x: number; y: number } };
      expect(side.focal.x, `${id} focal x`).toBeCloseTo(f.x, 5);
      expect(side.focal.y, `${id} focal y`).toBeCloseTo(f.y, 5);
    }
    expect(pngSize(join(ART, 'pause', `${NS}-leblanc.png`))).toEqual([1344, 768]); // the CHAPTER tab's hero plate
  });

  it('keeps every face box inside its painting and the right way round', () => {
    for (const id of Object.keys(EXP_PLATE_FRAMING)) {
      const f = FACE_BOXES[id]!;
      expect(f.x0, id).toBeGreaterThanOrEqual(0);
      expect(f.x1, id).toBeLessThanOrEqual(1);
      expect(f.x0, id).toBeLessThan(f.x1);
      expect(f.y0, id).toBeGreaterThanOrEqual(0);
      expect(f.y1, id).toBeLessThanOrEqual(1);
      expect(f.y0, id).toBeLessThan(f.y1);
    }
  });
});

describe('the CHAPTER tab: the hero plate, its fallback and the journal snapshots are the preview\'s own paintings', () => {
  it('names the namespace\'s plate, portrait and idles; the base Chapter VI record is untouched', () => {
    expect(EXP_LEBLANC_META.heroArt).toBe('pause/exp-leblanc-leblanc');
    expect(EXP_LEBLANC_META.heroArtFallback).toBe('portraits/exp-leblanc-leblanc.png');
    expect(EXP_LEBLANC_META.snapshots.map((s) => s.image)).toEqual([`backdrops/${EXP_LEBLANC_SCENE}.png`, 'characters/exp-leblanc-leblanc/idle.png', 'characters/exp-leblanc-ormi/idle.png']);
    expect(EXP_LEBLANC_META.snapshots.map((s) => s.caption)).toEqual(FFX2_LEBLANC_META.snapshots.map((s) => s.caption));
    expect(FFX2_LEBLANC_META.heroArt).toBe('pause/leblanc');
    expect(FFX2_LEBLANC_META.heroArtFallback).toBe('portraits/leblanc.png');
    expect(FFX2_LEBLANC_META.snapshots.map((s) => s.image)).toEqual(['backdrops/leblanc-last-room.png', 'characters/leblanc/idle.png', 'characters/ormi/idle.png']);
  });

  it('is the chapter\'s own scene namespace that the pause reads (the experimental chapter has one, Chapter VI none)', () => {
    expect(artNamespaceOfScene(exp.sceneKey)).toBe(NS);
    expect(artNamespaceOfScene(FFX2_LEBLANC.sceneKey)).toBeUndefined();
  });

  it.skipIf(!HAVE_ART)('every file the tab names is on disk', () => {
    for (const rel of [`${EXP_LEBLANC_META.heroArt}.png`, `${EXP_LEBLANC_META.heroArt}.2x.webp`, EXP_LEBLANC_META.heroArtFallback, ...EXP_LEBLANC_META.snapshots.map((s) => s.image)]) {
      expect(existsSync(join(ART, rel)), rel).toBe(true);
    }
  });

  it('the art manifest the game loads lists the new files, so nothing asks for a missing one', () => {
    setArtManifest({ version: 1, generatedAt: '2026-10-07T00:00:00.000Z', subjects: {}, portraits: SPEAKERS.map((id) => `${NS}-${id}`), backdrops: [], pause: ['exp-leblanc-leblanc'], pause2x: [], title: [], title2x: [] });
    const box = mountBox(NS);
    void box.say(say('logos', 'Hm.'));
    expect(box.el.querySelector('.dbox__portrait img')?.getAttribute('src') ?? '').toContain('exp-leblanc-logos.png');
    resetArtManifest();
  });
});
