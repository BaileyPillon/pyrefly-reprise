/**
 * CHAPTER XI PLAYS SKY GRADE C BY DEFAULT (r72, branch `r72-sky`; FFX-2 only: Chapter XI, `ffx2-fallen-aeons`; `docs/handoff/r72-sky.md`).
 *
 * Bailey's pick from the sky stills (his blanket yes of 2026-10-31: "dimmer lights: a dark night where the burst still shines") is option C of `look/pro/SkyGrade.ts`. On the stills it reads under 3 percent of pixels over 240 on Chapter XI's first menu
 * and with the burst in frame, so the Road's `hd2d` and `arena` holds are lifted: the look rig and the pro arena play, with C patched on the room's pro table by default. Chapter V keeps today's sky (C leaves 21 percent of its sky band over 240): both its
 * holds stand. `?skygrade=today` restores release 71's Chapter XI exactly (the two holds answer again, from `PieceHoldsSky.ts`); `?skygrade=a|b|c` names an option in either chapter as before. These cases pin: the default and who has it, the word `today`,
 * the patched table (the shipped rows are never written), the engine's own LUT, the debug read, the holds table and its shape, and the layering of the new state.
 *
 * Game case (rule 14): FFX-2 only. Presentation only: no number of a fight changes.
 */
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { getChapter } from '../../src/data/encounters.ts';
import { installProDebug } from '../../src/debug/proApi.ts';
import {
  PIECE_HOLDS,
  TREATED_CHAPTERS,
  TREATED_PIECES,
  isTreatedChapter,
  setDemoChapter,
  setTreatedScope,
  skyWord,
  skyWordFromSearch,
  treatedHold,
  treatedHolds,
} from '../../src/engine/motion/DemoGate.ts';
import { SKY_TODAY_HOLDS } from '../../src/engine/motion/PieceHoldsSky.ts';
import { chapterLook } from '../../src/engine/look/LookConfig.ts';
import { lutBytes } from '../../src/engine/look/LookGrades.ts';
import { applyChapterLook, lookState } from '../../src/engine/look/LookState.ts';
import { PRO_ARENA, proRev, proRoom } from '../../src/engine/look/pro/ProGrade.ts';
import { proArenaFor, setProMode } from '../../src/engine/look/pro/ProSwitch.ts';
import {
  SKY_CHANGES,
  SKY_CHAPTERS,
  SKY_DEFAULTS,
  SKY_OPTIONS,
  setSkyOption,
  setSkyRunning,
  skyActive,
  skyGradeFor,
  skyOption,
  skyOptionFromSearch,
  skyRevision,
  skyRoom,
  type SkyOption,
} from '../../src/engine/look/pro/SkyGrade.ts';

const V = 'ffx2-vegnagun-shuyin';
const XI = 'ffx2-fallen-aeons';
const PAL = { key: 0xffe0b0, sky: 0x30405a };
const R71_XI_ROW = ['hd2d', 'arena', 'cam', 'breath', 'moments']; // release 71's held row of Chapter XI, in its order
const CTRL = [null, 'subtle', false, false]; // the look state of a chapter the treatment does not reach

afterEach(() => {
  vi.unstubAllGlobals();
  setSkyOption(undefined);
  setSkyRunning(undefined);
  setTreatedScope(null);
  setDemoChapter(undefined);
  setProMode(null);
  lookState.auto = true;
  lookState.name = null;
  lookState.armed = false;
  lookState.pro = false;
  lookState.strength = 'subtle';
});

const snap = (): unknown[] => [lookState.name, lookState.strength, lookState.armed, lookState.pro];

describe('the default: Chapter XI plays grade C, no other chapter has one', () => {
  it('the table is one row, Chapter XI, grade C, and the chapter is an FFX-2 chapter that the sky word reaches (rule 14)', () => {
    expect(SKY_DEFAULTS).toEqual({ [XI]: 'c' });
    for (const id of Object.keys(SKY_DEFAULTS)) {
      expect(Object.keys(SKY_CHAPTERS), id).toContain(id);
      expect(getChapter(id)?.game, id).toBe('ffx2');
      expect(TREATED_CHAPTERS[id]?.game, id).toBe('ffx2');
    }
    expect(SKY_CHANGES.c.name).toBe('dimmer bold row');
  });

  it('with no word under all, Chapter XI is grade C and nothing else is (Chapter V keeps today\'s sky, and no FFX chapter or other FFX-2 chapter answers the word); under pack Chapter XI is release 68\'s: nothing', () => {
    setTreatedScope('all');
    expect(skyWord()).toBe('default');
    expect(skyOption()).toBeNull(); // no option was NAMED; the default is the chapter's
    expect(skyGradeFor(XI)).toBe('c');
    for (const id of [V, 'ffx2-bahamut', 'ffx2-leblanc', 'ffx2-den-of-woe', 'ffx2-trema', 'ffx2-ixion-djose', 'seymour-flux', 'yunalesca', 'exp-leblanc', undefined]) expect(skyGradeFor(id), String(id)).toBeNull();
    setTreatedScope('pack');
    expect(skyGradeFor(XI)).toBeNull();
  });

  it('the look and the arena PLAY in Chapter XI with no hold, and the battle arms the cinematic bold rig with the pro arena (the Den of Woe\'s state); Chapter V stays at the control state', () => {
    setTreatedScope('all');
    setProMode('pro');
    expect(isTreatedChapter(XI, 'hd2d')).toBe(true);
    expect(isTreatedChapter(XI, 'arena')).toBe(true);
    expect(treatedHold(XI, 'hd2d')).toBeUndefined();
    expect(treatedHold(XI, 'arena')).toBeUndefined();
    expect(chapterLook(XI)).toEqual({ name: 'hd2d', strength: 'bold' });
    expect(proArenaFor(XI, '')).toBe(true);
    applyChapterLook(V);
    expect(snap()).toEqual(CTRL);
    applyChapterLook(XI);
    expect(snap()).toEqual(['cinematic', 'bold', true, true]);
    expect(skyActive()).toBe('c');
    expect(skyRevision()).toBe(3);
  });

  it('every piece but cam, breath and moments plays in Chapter XI (the three holds of release 71 that stay); Chapter V still holds its five', () => {
    setTreatedScope('all');
    const held = new Set(['cam', 'breath', 'moments']);
    for (const p of TREATED_PIECES) expect(isTreatedChapter(XI, p), `${XI} ${p}`).toBe(!held.has(p));
    expect(treatedHolds(XI)).toEqual(['cam', 'breath', 'moments']);
    expect(treatedHolds(V)).toEqual(['hd2d', 'arena', 'cam', 'breath', 'moments']);
  });

  it('the room\'s table in Chapter XI is the shipped row patched by option C (the same numbers as `?skygrade=c`), and the patch is a copy: the shipped rows are never written', () => {
    setTreatedScope('all');
    setSkyRunning(XI);
    const base = PRO_ARENA['road-to-the-farplane']!;
    const baseCone = base.cone!.strength;
    const r = proRoom('road-to-the-farplane')!;
    expect(r).not.toBe(base);
    expect(r.colour.exposure).toBe(1.2);
    expect(r.tweaks['shaft.gain']).toBe(0.8);
    expect(r.tweaks['bold.stage']).toBe(1.2);
    expect(r.tweaks['bloom.strength']).toBe(0.45);
    expect(r.tweaks['bloom.threshold']).toBe(0.8);
    expect(r.tweaks['relight.key']).toBe(1.3);
    expect(r.cone!.strength).toBeCloseTo(baseCone * 0.7, 10);
    expect(PRO_ARENA['road-to-the-farplane']!.colour.exposure).toBe(1.5);
    expect(PRO_ARENA['road-to-the-farplane']!.tweaks['shaft.gain']).toBe(2);
    expect(PRO_ARENA['road-to-the-farplane']!.cone!.strength).toBe(baseCone);
    expect(proRoom('farplane')).toBe(PRO_ARENA['farplane']); // not Chapter XI's plate
    setSkyOption('c');
    const named = proRoom('road-to-the-farplane')!;
    expect(named).toEqual(r); // the default IS option c, not a lookalike
  });

  it('Chapter V in battle has no default: its room is the shipped object and the revision is 0; a named option still patches it, as before', () => {
    setTreatedScope('all');
    setSkyRunning(V);
    expect(proRoom('farplane')).toBe(PRO_ARENA['farplane']);
    expect(skyRevision()).toBe(0);
    expect(Number.isInteger(proRev())).toBe(true);
    setSkyOption('c');
    expect(skyActive()).toBe('c');
    expect(proRoom('farplane')).not.toBe(PRO_ARENA['farplane']);
  });

  it('the engine\'s own LUT: Chapter XI\'s default LUT is option c\'s byte for byte, differs from the unpatched grade (`null`, the control arm) and from a and b; Chapter V\'s default is the unpatched one', () => {
    const lut = (chapter: string, option: SkyOption | null | undefined): Uint8Array => {
      setTreatedScope('all');
      setSkyOption(option);
      setSkyRunning(chapter);
      return lutBytes('cinematic', 'ffx2', SKY_CHAPTERS[chapter]!, PAL, 'bold', null, true);
    };
    const same = (a: Uint8Array, b: Uint8Array): boolean => a.length === b.length && a.every((x, i) => x === b[i]);
    const def = lut(XI, undefined);
    expect(same(def, lut(XI, 'c'))).toBe(true);
    expect(same(def, lut(XI, null))).toBe(false);
    expect(same(def, lut(XI, 'a'))).toBe(false);
    expect(same(def, lut(XI, 'b'))).toBe(false);
    expect(same(lut(V, undefined), lut(V, null))).toBe(true);
    expect(same(lut(V, undefined), lut(V, 'c'))).toBe(false);
  });
});

describe('the other words: a, b and c name an option in either chapter; null is the control arm; today is release 71', () => {
  it('a named option wins over the default in Chapter XI, and reaches Chapter V as before', () => {
    setTreatedScope('all');
    for (const o of SKY_OPTIONS) {
      setSkyOption(o);
      expect(skyGradeFor(XI), o).toBe(o);
      expect(skyGradeFor(V), o).toBe(o);
      expect(skyOption(), o).toBe(o);
    }
  });

  it('`null` is NO grade at all in either chapter (the r70 control arm: the room\'s own table unpatched), also in Chapter XI where the default would be C; Chapter XI still plays its look then', () => {
    setTreatedScope('all');
    setProMode('pro');
    setSkyOption(null);
    expect(skyWord()).toBe('off');
    expect(skyGradeFor(XI)).toBeNull();
    expect(chapterLook(XI)).not.toBeNull(); // no hold: the rig is built, and draws the unpatched (r70) grade
    setSkyRunning(XI);
    expect(proRoom('road-to-the-farplane')).toBe(PRO_ARENA['road-to-the-farplane']);
    expect(skyRevision()).toBe(0);
  });

  it('the address: `today` is a word and not an option; every other unknown word is no word', () => {
    expect(skyWordFromSearch('?skygrade=today')).toBe('today');
    expect(skyWordFromSearch('?x=1&skygrade=TODAY')).toBe('today');
    for (const o of SKY_OPTIONS) expect(skyWordFromSearch(`?skygrade=${o}`)).toBe(o);
    for (const s of [undefined, '', '?skygrade=', '?skygrade=d', '?skygrade=off', '?skygrade=default', '?sky=today', '?pack=demo']) expect(skyWordFromSearch(s), String(s)).toBe('default');
    expect(skyOptionFromSearch('?skygrade=today')).toBeNull();
    expect(skyOptionFromSearch('?skygrade=c')).toBe('c');
  });

  it('a page whose address says `?skygrade=today` reads it once and `setSkyOption(undefined)` reads the address again', () => {
    vi.stubGlobal('location', { search: '?coach=off&skygrade=today' });
    setSkyOption(undefined);
    expect(skyWord()).toBe('today');
    setSkyOption('b');
    expect(skyWord()).toBe('b');
    setSkyOption(undefined);
    expect(skyWord()).toBe('today');
  });
});

describe('`?skygrade=today` is release 71\'s Chapter XI exactly: the look and the arena held again, no grade, the plate as release 69 draws it', () => {
  it('the two holds answer with a reason, the row reads as release 71\'s did (the same five pieces, in the same order), and the pieces that played still play', () => {
    setTreatedScope('all');
    setSkyOption('today');
    expect(treatedHolds(XI)).toEqual(R71_XI_ROW);
    for (const p of ['hd2d', 'arena'] as const) {
      expect(treatedHold(XI, p), p).toBe(SKY_TODAY_HOLDS[XI]![p]);
      expect(isTreatedChapter(XI, p), p).toBe(false);
    }
    const held = new Set(R71_XI_ROW);
    for (const p of TREATED_PIECES) expect(isTreatedChapter(XI, p), `${XI} ${p}`).toBe(!held.has(p));
  });

  it('no look, no arena, no grade, the control look state; the battle leaves the state of a chapter the treatment does not reach (release 69\'s plate)', () => {
    setTreatedScope('all');
    setProMode('pro');
    setSkyOption('today');
    expect(skyGradeFor(XI)).toBeNull();
    expect(chapterLook(XI)).toBeNull();
    expect(proArenaFor(XI, '')).toBe(false);
    applyChapterLook(XI);
    expect(snap()).toEqual(CTRL);
    expect(skyActive()).toBeNull();
    expect(skyRevision()).toBe(0);
    setSkyRunning(XI);
    expect(skyRoom('road-to-the-farplane', PRO_ARENA['road-to-the-farplane'])).toBe(PRO_ARENA['road-to-the-farplane']);
  });

  it('the word touches Chapter XI alone: Chapter V and every other chapter answer as without it, the other hold rows are unchanged', () => {
    setTreatedScope('all');
    setSkyOption('today');
    expect(treatedHolds(V)).toEqual(['hd2d', 'arena', 'cam', 'breath', 'moments']);
    expect(treatedHold(V, 'hd2d')).toBe(PIECE_HOLDS[V]!['hd2d']);
    for (const id of Object.keys(TREATED_CHAPTERS)) {
      if (id === XI) continue;
      expect(treatedHolds(id), id).toEqual(Object.keys(PIECE_HOLDS[id] ?? {}));
      for (const p of TREATED_PIECES) expect(treatedHold(id, p), `${id} ${p}`).toBe(PIECE_HOLDS[id]?.[p]);
    }
    setSkyOption(undefined);
    expect(treatedHold(XI, 'hd2d')).toBeUndefined();
  });

  it('under `?treated=pack` the word changes nothing (release 68\'s frame in both): no look, no arena', () => {
    setTreatedScope('pack');
    setProMode('pro');
    for (const w of ['today', undefined] as const) {
      setSkyOption(w);
      for (const id of [V, XI]) {
        expect(chapterLook(id), `${id} ${String(w)}`).toBeNull();
        expect(proArenaFor(id, ''), `${id} ${String(w)}`).toBe(false);
      }
    }
  });
});

describe('what stands the default aside, as it stands the arena aside', () => {
  it('CLASSIC (the player\'s style), an address that chose a look by hand and `?pro=off` leave Chapter XI at the frame each already gave it', () => {
    setTreatedScope('all');
    setProMode('pro');
    applyChapterLook(XI, 'classic');
    expect(snap()).toEqual(CTRL);
    expect(skyActive()).toBeNull(); // no look is built, so no grade is patched
    lookState.auto = false;
    applyChapterLook(XI);
    expect(skyActive()).toBeNull();
    lookState.auto = true;
    expect(proArenaFor(XI, '?look=hd2d')).toBe(false); // the address wins
    setProMode('today'); // ?pro=off (also a phone, ?pack=off, ?look=today): no pro table to patch, so the bold look alone is NOT played either (review M1; more in booth-r72-sky-m1.test.ts)
    expect(proArenaFor(XI, '')).toBe(false);
    expect(chapterLook(XI)).toBeNull();
  });
});

describe('`__pyrefly.skyGrade()` and `__pyrefly.treated()`', () => {
  type Read = { word: SkyOption | null; mode: string; active: SkyOption | null; armed: boolean; screen: string | null; defaults: Record<string, string> };
  const api = (): { sky: (w?: SkyOption | 'today' | null) => Read; treated: (s?: 'all' | 'pack' | null) => { holds: Record<string, string[]> } } => {
    const a: Record<string, unknown> = {};
    installProDebug(a);
    return { sky: a['skyGrade'] as (w?: SkyOption | 'today' | null) => Read, treated: a['treated'] as (s?: 'all' | 'pack' | null) => { holds: Record<string, string[]> } };
  };

  it('reads the whole word and the defaults; a page that opened with no word in Chapter XI is armed and `screen` is c; the control arm is `r70`; `today` and an option are set live', () => {
    const { sky } = api();
    setTreatedScope('all');
    setProMode('pro');
    applyChapterLook(XI);
    const r = sky();
    expect([r.word, r.mode, r.active, r.armed, r.screen]).toEqual([null, 'default', 'c', true, 'c']);
    expect(r.defaults).toEqual({ [XI]: 'c' });
    const control = sky(null);
    expect([control.word, control.mode, control.active, control.armed, control.screen]).toEqual([null, 'off', null, true, 'r70']);
    expect(sky('a').screen).toBe('a');
    const today = sky('today');
    expect([today.word, today.mode, today.active]).toEqual([null, 'today', null]);
    expect(sky('x' as never).mode).toBe('today'); // not a word: unchanged
  });

  it('a page that opened with `today`: the battle sets up with the look held, `armed` false and `screen` release69; Chapter V without a word reads the same', () => {
    const { sky } = api();
    setTreatedScope('all');
    setProMode('pro');
    setSkyOption('today');
    applyChapterLook(XI);
    expect([sky().armed, sky().screen, sky().active]).toEqual([false, 'release69', null]);
    setSkyOption(undefined);
    applyChapterLook(V);
    expect([sky().armed, sky().screen, sky().active]).toEqual([false, 'release69', null]);
  });

  it('`treated().holds` lists what each chapter holds right now: Chapter XI\'s three, its five under `today`', () => {
    const { treated, sky } = api();
    expect(treated('all').holds[XI]).toEqual(['cam', 'breath', 'moments']);
    sky('today');
    expect(treated('all').holds[XI]).toEqual(R71_XI_ROW);
    expect(treated('all').holds[V]).toEqual(['hd2d', 'arena', 'cam', 'breath', 'moments']);
    expect(treated('all').holds['ffx2-bahamut']).toBeUndefined(); // the booth pair holds nothing
    treated(null);
  });
});

describe('the holds that `?skygrade=today` puts back are written like every hold', () => {
  it('Chapter XI only, the two look pieces, each a reason of 80 characters or more that names the word, release 71, the r70 numbers it answers and how it lifts', () => {
    expect(Object.keys(SKY_TODAY_HOLDS)).toEqual([XI]);
    expect(Object.keys(SKY_TODAY_HOLDS[XI]!)).toEqual(['hd2d', 'arena']);
    for (const p of ['hd2d', 'arena'] as const) {
      const why = SKY_TODAY_HOLDS[XI]![p]!;
      expect(why.length, p).toBeGreaterThan(80);
      expect(why, p).toMatch(/^FFX-2, Chapter XI: held only while the address says `\?skygrade=today`/);
      expect(why, p).toMatch(/release 71/);
      expect(why, p).toMatch(/Lifts when the address drops `\?skygrade=today`/);
      expect(why.endsWith('picks an option).'), p).toBe(true);
    }
    expect(SKY_TODAY_HOLDS[XI]!['hd2d']).toMatch(/19\.1 percent over 235/);
    expect(SKY_TODAY_HOLDS[XI]!['hd2d']).toMatch(/0\.58 percent/);
    expect(SKY_TODAY_HOLDS[XI]!['arena']).toMatch(/exposure 1\.5/);
    expect(SKY_TODAY_HOLDS[XI]!['arena']).toMatch(/exposure is capped at 1\.2/);
  });

  it('no row names a bare job number or an art JSON (the two source guards of the booth tests)', () => {
    const src = readFileSync(resolve('src/engine/motion/PieceHoldsSky.ts'), 'utf8');
    for (const m of src.matchAll(/\bJ\d{1,2}\b/g)) expect(src.slice(Math.max(0, (m.index ?? 0) - 150), (m.index ?? 0) + 150), m[0]).toMatch(/booth-[a-z0-9-]+\.md/);
    expect(src).not.toMatch(/\.json/);
  });

  it('Chapter XI\'s camera hold records the r72 status: the burst condition is met by the stills (grade C), the crop condition is not', () => {
    const cam = treatedHold(XI, 'cam')!;
    expect(cam).toMatch(/Status at r72: the Road plays grade C by default/);
    expect(cam).toMatch(/0\.48 and 0\.53 percent of pixels over 240/);
    expect(cam).toMatch(/the crop condition is not/);
    expect(cam).toMatch(/not a crop-only lift/); // the release 71 text stays
  });
});

describe('layering (hard rule 1) and the house limit', () => {
  it('`DemoGate.ts` does not import `SkyGrade.ts` (the word lives in the gate so that the look module can import the gate, with no cycle), and `PieceHoldsSky.ts` imports a type only', () => {
    const gate = readFileSync(resolve('src/engine/motion/DemoGate.ts'), 'utf8');
    expect(gate).not.toMatch(/from '[^']*SkyGrade\.ts'/);
    expect(gate).toMatch(/import \{ SKY_TODAY_HOLDS \} from '\.\/PieceHoldsSky\.ts';/);
    const data = readFileSync(resolve('src/engine/motion/PieceHoldsSky.ts'), 'utf8');
    const imports = data.split(/\r?\n/).filter((l) => /^import /.test(l));
    expect(imports).toEqual(["import type { TreatedPiece } from './DemoGate.ts';"]);
    expect(data).not.toMatch(/from 'three'/);
    expect(data).not.toMatch(/document\.|window\./);
  });

  it('every source file this branch changed is under 400 lines (the files already over it were not grown)', () => {
    for (const f of ['src/engine/look/pro/SkyGrade.ts', 'src/engine/motion/DemoGate.ts', 'src/engine/motion/PieceHolds.ts', 'src/engine/motion/PieceHoldsSky.ts', 'src/engine/look/LookConfig.ts', 'src/engine/look/pro/ProSwitch.ts', 'src/debug/proApi.ts']) {
      expect(readFileSync(resolve(f), 'utf8').split('\n').length, f).toBeLessThanOrEqual(400);
    }
  });
});

describe('the handoff note carries the result where the release plan reads it', () => {
  const NOTE = readFileSync(resolve('docs/handoff/r72-sky.md'), 'utf8').replace(/\r\n/g, '\n');
  it('names the chapter, the default, the word, the stills numbers, the per-chapter table, the browser jobs with predictions and the CHANGELOG lines', () => {
    for (const s of [XI, V, 'SKY_DEFAULTS', '?skygrade=today', 'dimmer lights: a dark night where the burst still shines', 'FFX-2 only', 'CHANGELOG', 'Browser jobs', 'Predictions']) expect(NOTE, s).toContain(s);
    for (const n of [/0\.58/, /0\.48/, /20\.9/, /21\.9/, /1\.32/, /1\.52/]) expect(NOTE).toMatch(n);
    for (const id of ['R72-1', 'R72-2', 'R72-3', 'R72-4']) expect(NOTE, id).toContain(id);
  });
});
