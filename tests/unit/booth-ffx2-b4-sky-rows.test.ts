/**
 * THE FARPLANE'S TWO PLATES COME BACK WITH THE LOOK HELD (release 71, branch `booth-ffx2-b4-sky`; FFX-2 only: Chapter V, `ffx2-vegnagun-shuyin`, and Chapter XI, `ffx2-fallen-aeons`; `docs/handoff/booth-ffx2-b4-sky.md`).
 *
 * The r70 browser read took both chapters off the treated list: the HD-2D bold look over the Farplane's very bright sky clips the spire's burst to a flat white halo (Chapter V's first menu at 2560 x 1440: mean luma 126.6 against release 69's 101.5,
 * 13.5 percent of pixels over 240 against 2.7). They are on the list again with `hd2d` and `arena` HELD, so the plate draws as release 69 draws it; Chapter XI also holds `cam` (its follower crops Yuna where release 69's frame never does and is what
 * puts the burst in frame). The brief named a hold of the "look"; in the code the piece `look` is the pro hits, glass numbers and markers (`ProSwitch.proLookOn`), which put no light on the plate, so the two pieces that do are held and `look` plays
 * (the census below reads the source for every reader of the two pieces, so a new reader fails here until it is judged).
 *
 * Game case (rule 14): FFX-2 only. Presentation only: no number of a fight changes.
 */
import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { afterEach, describe, expect, it } from 'vitest';
import { getChapter } from '../../src/data/encounters.ts';
import {
  PIECE_HOLDS,
  TREATED_CHAPTERS,
  TREATED_PIECES,
  demoGameOf,
  isTreatedChapter,
  setDemoChapter,
  setTreatedScope,
  treatedHold,
  type TreatedPiece,
} from '../../src/engine/motion/DemoGate.ts';
import { CHAPTER_LOOKS, chapterLook } from '../../src/engine/look/LookConfig.ts';
import { applyChapterLook, lookState } from '../../src/engine/look/LookState.ts';
import { PRO_ARENA } from '../../src/engine/look/pro/ProGrade.ts';
import { proArenaFor, proGame, proLookOn, proPieceOn, setProMode, setProPiece } from '../../src/engine/look/pro/ProSwitch.ts';
import { SCOPE_EXCEPTIONS } from '../../src/engine/motion/SwapSwitch.ts';
import { SCRIPTED_RIGS } from '../../src/engine/procam/ProAutoStage.ts';
import { momentsOn, setMomentsMode } from '../../src/engine/motion/MomentsSwitch.ts';
import { proCamOn, resetProCamForTests } from '../../src/engine/procam/ProCamSwitch.ts';

const V = 'ffx2-vegnagun-shuyin';
const XI = 'ffx2-fallen-aeons';
const SKY = [V, XI] as const;
const DEN = 'ffx2-den-of-woe'; // the one other chapter whose look plays on a plate of this family: the control that the hold, and nothing else, changes
const LIFT = 'Lifts when a lighter grade picked by Bailey from stills reads under 3 percent of pixels over 240 on the Farplane plates';

afterEach(() => {
  setTreatedScope(null);
  setDemoChapter(undefined);
  setProMode(null);
  setProPiece(null);
  setMomentsMode(null);
  resetProCamForTests();
  lookState.auto = true;
  lookState.name = null;
  lookState.armed = false;
  lookState.pro = false;
  lookState.strength = 'subtle';
});

describe('the holds: the look in both chapters, the camera in Chapter XI too, each written to be lifted', () => {
  it('Chapter V holds the look (the bold look and the arena grade), the colossus camera, the staged breath and the moments; Chapter XI the same five (the follower camera instead of the colossus one)', () => {
    for (const id of SKY) expect(Object.keys(PIECE_HOLDS[id]!), id).toEqual(['hd2d', 'arena', 'cam', 'breath', 'moments']);
    expect(treatedHold(V, 'cam')).toMatch(/colossus/);
    expect(treatedHold(XI, 'cam')).toMatch(/follower/);
    expect(treatedHold(XI, 'cam')).not.toMatch(/colossus/);
  });

  it("both look holds carry the driver's lift: a lighter grade picked by Bailey from stills reads under 3 percent of pixels over 240 on the Farplane plates, the three candidates and the note named", () => {
    for (const id of SKY) {
      for (const piece of ['hd2d', 'arena'] as const) {
        const why = treatedHold(id, piece)!;
        expect(why.length, `${id} ${piece}`).toBeGreaterThan(80);
        expect(why, `${id} ${piece}`).toContain(LIFT);
        expect(why, `${id} ${piece}`).toMatch(/\?skygrade=a\|b\|c/);
        expect(why, `${id} ${piece}`).toMatch(/docs\/handoff\/booth-ffx2-b4-sky\.md/);
        expect(why, `${id} ${piece}`).toMatch(/against release 69/);
        expect(why.endsWith('against release 69).'), `${id} ${piece} ends in its lift`).toBe(true);
      }
    }
  });

  it("the look holds state the r70 numbers they answer, the Chapter V ones from the first menu at 2560 x 1440 and the sky band above the party, the Chapter XI ones from the idle rig and the Anima link", () => {
    const v = treatedHold(V, 'hd2d')!;
    for (const n of [/126\.6/, /101\.5/, /13\.5 percent/, /232\.5/, /64\.2 percent/, /179\.4/, /21\.4 percent over 235/, /164\.4/, /149\.5/, /D-V1/]) expect(v).toMatch(n);
    const xi = treatedHold(XI, 'hd2d')!;
    for (const n of [/85\.0/, /88\.9/, /0\.8 percent/, /19\.1 percent over 235/, /1\.5 in the release 68 control/, /D-XI1/]) expect(xi).toMatch(n);
    expect(treatedHold(V, 'arena')).toMatch(/exposure 1\.45/);
    expect(treatedHold(XI, 'arena')).toMatch(/exposure 1\.5/);
    expect(treatedHold(V, 'arena')).toMatch(/only reduces/);
    for (const id of SKY) expect(treatedHold(id, 'arena'), id).toMatch(/while `hd2d` is held it cannot play/);
  });

  it("Chapter XI's camera hold states the crop it answers (46 of 1,969 frames at 2560 x 1440, none at 3440 x 1440, against release 69's own 0 of 1,982), the table's one rule, and a lift that is the same work as Leblanc's and the Den's", () => {
    const cam = treatedHold(XI, 'cam')!;
    for (const n of [/46 of 1,969/, /2\.3 percent/, /worst 50 px/, /0 of 1,982/, /D-XI2/, /D-XI3/, /0\.45 s/, /does not crop a party member more often than the frame it replaces/, /Leblanc and the Den of Woe hold this piece/, /road-links/, /SCRIPTED_RIGS/]) {
      expect(cam).toMatch(n);
    }
    expect(cam).toMatch(/Lifts when `ProAutoStage` re-scores the Road's candidates for its group .* 0 sampled frames/);
    expect(treatedHold('ffx2-leblanc', 'cam')).toMatch(/Lifts when `ProAutoStage` re-scores the candidates for her group/);
  });

  it('no hold names a bare job number or an art JSON (the two source guards of the booth tests)', () => {
    const src = readFileSync(resolve('src/engine/motion/PieceHolds.ts'), 'utf8');
    for (const m of src.matchAll(/\bJ\d{1,2}\b/g)) expect(src.slice(Math.max(0, (m.index ?? 0) - 150), (m.index ?? 0) + 150), m[0]).toMatch(/booth-[a-z0-9-]+\.md/);
    expect(src).not.toMatch(/\.json/);
  });
});

describe('with the look held the plate is release 69\'s: no chapter look, no arena grade, the look state of a chapter the treatment does not reach', () => {
  it('the rows stay in their tables, unchanged (the failed rows are what a lighter grade will replace)', () => {
    for (const id of SKY) expect(CHAPTER_LOOKS[id], id).toEqual({ name: 'hd2d', strength: 'bold' });
    expect(PRO_ARENA['farplane']!.colour.exposure).toBe(1.45);
    expect(PRO_ARENA['road-to-the-farplane']!.colour.exposure).toBe(1.5);
    expect(PRO_ARENA['farplane']!.tweaks['shaft.gain']).toBe(2);
    expect(PRO_ARENA['farplane']!.tweaks['bold.stage']).toBe(1.7);
    expect(PRO_ARENA['farplane']!.cone!.strength).toBe(0.42);
    expect(PRO_ARENA['farplane']!.colour.shoulder).toBeUndefined(); // the knee of option b is not a row of the table
  });

  it('under all the chapter look is null and the arena is off; under pack the same (release 68); the Den of Woe, which holds neither, plays both', () => {
    setProMode('pro');
    for (const scope of ['all', 'pack'] as const) {
      setTreatedScope(scope);
      for (const id of SKY) {
        expect(chapterLook(id), `${id} ${scope}`).toBeNull();
        expect(proArenaFor(id, ''), `${id} ${scope}`).toBe(false);
      }
    }
    setTreatedScope('all');
    expect(chapterLook(DEN)).toEqual({ name: 'hd2d', strength: 'bold' });
    expect(proArenaFor(DEN, '')).toBe(true);
  });

  it("the look state a battle leaves in either chapter IS the state of a chapter the treatment does not reach and of `?treated=pack` (armed false, no look, not the pro arena, subtle), and the Den's is not", () => {
    setProMode('pro');
    const snap = (): unknown[] => [lookState.name, lookState.strength, lookState.armed, lookState.pro];
    applyChapterLook('ffx2-valefor-besaid'); // a hidden chapter the treatment never reaches: the control
    const control = snap();
    expect(control).toEqual([null, 'subtle', false, false]);
    setTreatedScope('all');
    for (const id of SKY) {
      applyChapterLook(id);
      expect(snap(), id).toEqual(control);
    }
    setTreatedScope('pack');
    for (const id of SKY) {
      applyChapterLook(id);
      expect(snap(), `${id} pack`).toEqual(control);
    }
    setTreatedScope('all');
    applyChapterLook(DEN);
    expect(snap()).toEqual(['cinematic', 'bold', true, true]); // what the hold removes: the pro arena over the bold look
  });

  it('what the hold does NOT remove: the pro hits, glass numbers and markers (the piece `look`) and the game, in both chapters, with no light thrown on the plate', () => {
    setProMode('pro');
    setTreatedScope('all');
    for (const id of SKY) {
      setDemoChapter(id);
      expect(isTreatedChapter(id, 'look'), id).toBe(true);
      expect(proLookOn(), id).toBe(true);
      for (const p of ['hits', 'numbers', 'markers'] as const) expect(proPieceOn(p), `${id} ${p}`).toBe(true);
      expect(proGame(), id).toBe('ffx2');
      expect(demoGameOf(id, 'ffx'), id).toBe('ffx2');
    }
  });

  it('every piece but the held five plays in both chapters; the held five are the four hold rows and the arena (rule 14: FFX-2 only)', () => {
    setTreatedScope('all');
    for (const id of SKY) {
      for (const p of TREATED_PIECES) expect(isTreatedChapter(id, p as TreatedPiece), `${id} ${p}`).toBe(!['hd2d', 'arena', 'cam', 'breath', 'moments'].includes(p));
      expect(getChapter(id)?.game, id).toBe('ffx2');
      expect(TREATED_CHAPTERS[id], id).toEqual({ game: 'ffx2', since: 'r71' });
    }
  });
});

describe('the other lights are held with it (the held moments, the held camera), and nothing else of these chapters is a swap exception', () => {
  it('the moments are held in both (defect class 4: the KO cut over 0.5 of the drawn height; the girls\' grids field Gunner and Thief), so no hard KO cut plays', () => {
    setTreatedScope('all');
    setMomentsMode('new');
    for (const id of SKY) {
      setDemoChapter(id);
      expect(momentsOn(), id).toBe(false);
      expect(treatedHold(id, 'moments'), id).toMatch(/Garment Grids/);
    }
  });

  it("the camera is held in both: V keeps the approved colossus frame, XI keeps release 69's resting camera (defects 2 and 3: no follower to cut away from or to crop Yuna), the follower row and its stand-down wait", () => {
    setTreatedScope('all');
    resetProCamForTests('?pack=demo');
    for (const id of SKY) {
      setDemoChapter(id);
      expect(proCamOn(), id).toBe(false);
    }
    expect(Object.keys(SCRIPTED_RIGS)).toContain(XI); // built, waits behind the hold
    expect(Object.keys(SCRIPTED_RIGS)).not.toContain(V); // the colossus rigs are the scene's own, no position-gated plate
  });

  it('neither is a swap exception (defect class 6: a SCOPE_EXCEPTIONS chapter must hold the smear; these two have no exception, so the smear plays)', () => {
    for (const id of SKY) expect(Object.keys(SCOPE_EXCEPTIONS), id).not.toContain(id);
    setTreatedScope('all');
    for (const id of SKY) expect(isTreatedChapter(id, 'smear'), id).toBe(true);
  });
});

describe('the census: which pieces can put light on the plate (a new reader of the two light pieces fails here until it is judged)', () => {
  /** Every `.ts` file under `src`. */
  function walk(dir: string, out: string[] = []): string[] {
    for (const name of readdirSync(dir)) {
      const p = join(dir, name);
      if (statSync(p).isDirectory()) walk(p, out);
      else if (p.endsWith('.ts')) out.push(p);
    }
    return out;
  }
  const FILES = walk(resolve('src'));
  const readers = (piece: string): string[] =>
    FILES.filter((f) => new RegExp(`(isTreatedChapter|treatedHold)\\((?:[^()]|\\([^()]*\\))*'${piece}'`).test(readFileSync(f, 'utf8')))
      .map((f) => f.replace(/\\/g, '/').replace(/^.*\/src\//, 'src/'))
      .sort();

  it("the HD-2D bold look is read in one place (`LookConfig.chapterLook`, which `applyChapterLook` asks) and the pro arena grade in one (`ProSwitch.proArenaFor`, built only on a chapter look)", () => {
    expect(readers('hd2d')).toEqual(['src/engine/look/LookConfig.ts']);
    expect(readers('arena')).toEqual(['src/engine/look/pro/ProSwitch.ts']);
  });

  it('the piece `look` is the pro hits, glass numbers, markers and the seam (`ProSwitch.proLookOn` and `proGame`): effects at a strike, not a grade of the plate', () => {
    expect(readers('look')).toEqual(['src/engine/look/pro/ProSwitch.ts']);
    const src = readFileSync(resolve('src/engine/look/pro/ProSwitch.ts'), 'utf8');
    expect(src).toMatch(/- `hits`\s+"Ink and light"/);
    expect(src).toMatch(/- `numbers` the glass damage numbers/);
    expect(src).toMatch(/- `markers` the big FFX glove/);
  });

  it('the arena is built only on top of a chapter look (`applyChapterLook`: `pro = d !== null && proArenaFor(...)`), so holding `hd2d` alone already keeps it off; the `arena` row keeps a lift of the look from switching it on', () => {
    const src = readFileSync(resolve('src/engine/look/LookState.ts'), 'utf8');
    expect(src).toMatch(/const pro = d !== null && proArenaFor\(chapterId\);/);
  });
});

describe('the handoff note carries the result, where the release plan reads it', () => {
  const NOTE = readFileSync(resolve('docs/handoff/booth-ffx2-b4-sky.md'), 'utf8');
  it('names both chapters, the held pieces with their Lifts when, the defect classes, the three options and the browser jobs', () => {
    for (const id of SKY) expect(NOTE, id).toContain(id);
    expect(NOTE).toContain(LIFT);
    expect(NOTE).toMatch(/hd2d/);
    expect(NOTE).toMatch(/\?skygrade=a\|b\|c/);
    expect(NOTE).toMatch(/exposure cap/);
    expect(NOTE).toMatch(/highlight roll-off/);
    expect(NOTE).toMatch(/dimmer bold row/);
    expect(NOTE).toMatch(/46 of 1,969/);
    expect(NOTE).toMatch(/Defect classes/);
    expect(NOTE).toMatch(/Browser jobs/);
    expect(NOTE).toMatch(/CHANGELOG/);
  });
});
