/**
 * THE SKY GRADE: THREE LIGHTER OPTIONS FOR THE FARPLANE'S TWO PLATES BEHIND A MEASURING WORD, DEFAULT OFF (release 71, branch `booth-ffx2-b4-sky`; FFX-2 only; `src/engine/look/pro/SkyGrade.ts`, `docs/handoff/booth-ffx2-b4-sky.md`).
 *
 * `?skygrade=a|b|c` makes the held `hd2d` look and `arena` grade play in Chapter V and Chapter XI (and only there, and only while the treatment reaches them) with one of three changes on the room's pro table, so the driver can film stills
 * for Bailey. These cases pin: nothing plays without the word (the very table object, the same LUT key), the word reaches the two chapters and no other, the three patches, the shipped tables are never written, and the engine's own LUT puts
 * the three options in the order the note predicts (the clip headroom of the burst's neighbourhood: a probe colour read off the r70 still).
 *
 * Game case (rule 14): FFX-2 only. Presentation only.
 */
import { afterEach, describe, expect, it } from 'vitest';
import { installProDebug } from '../../src/debug/proApi.ts';
import { setDemoChapter, setTreatedScope } from '../../src/engine/motion/DemoGate.ts';
import { chapterLook } from '../../src/engine/look/LookConfig.ts';
import { lutBytes, lutKey } from '../../src/engine/look/LookGrades.ts';
import { applyChapterLook, lookState } from '../../src/engine/look/LookState.ts';
import { PRO_ARENA, proRev, proRoom, type ProRoom } from '../../src/engine/look/pro/ProGrade.ts';
import { proArenaFor, setProMode, setProPiece } from '../../src/engine/look/pro/ProSwitch.ts';
import {
  SKY_CHANGES,
  SKY_CHAPTERS,
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

afterEach(() => {
  setSkyOption(undefined);
  setSkyRunning(undefined);
  setTreatedScope(null);
  setDemoChapter(undefined);
  setProMode(null);
  setProPiece(null);
  lookState.auto = true;
  lookState.name = null;
  lookState.armed = false;
  lookState.pro = false;
  lookState.strength = 'subtle';
});

/** The LUT of the room as the rig uploads it (32 cubed, red fastest, each axis encoded `c = 2 u^2`), sampled trilinearly the way the grade shader samples it. */
function sample(lut: Uint8Array, c: readonly number[]): number[] {
  const N = 32;
  const f = (x: number): number => Math.sqrt(Math.min(1, Math.max(0, x * 0.5))) * (N - 1);
  const [fr, fg, fb] = [f(c[0]!), f(c[1]!), f(c[2]!)];
  const [r0, g0, b0] = [Math.floor(fr), Math.floor(fg), Math.floor(fb)];
  const [r1, g1, b1] = [Math.min(N - 1, r0 + 1), Math.min(N - 1, g0 + 1), Math.min(N - 1, b0 + 1)];
  const [tr, tg, tb] = [fr - r0, fg - g0, fb - b0];
  const at = (r: number, g: number, b: number, k: number): number => lut[((b * N + g) * N + r) * 4 + k]!;
  return [0, 1, 2].map((k) => {
    const c00 = at(r0, g0, b0, k) * (1 - tr) + at(r1, g0, b0, k) * tr;
    const c10 = at(r0, g1, b0, k) * (1 - tr) + at(r1, g1, b0, k) * tr;
    const c01 = at(r0, g0, b1, k) * (1 - tr) + at(r1, g0, b1, k) * tr;
    const c11 = at(r0, g1, b1, k) * (1 - tr) + at(r1, g1, b1, k) * tr;
    return (c00 * (1 - tg) + c10 * tg) * (1 - tb) + (c01 * (1 - tg) + c11 * tg) * tb;
  });
}
const luma = (p: readonly number[]): number => 0.2126 * p[0]! + 0.7152 * p[1]! + 0.0722 * p[2]!;

/** The probe: the live (release 69) sky at the 90th percentile of luma in the band above the party at the first menu of Chapter V, 2560 x 1440, from the r70 evidence still (raw 0..1). */
const PROBE = [0.98, 0.78, 0.98] as const;

/** The multiple of the live sky at which the LUT first puts the probe over 240 (the headroom before the burst's neighbourhood clips), 4 when it never does; the room is the running chapter's. */
function clipGain(chapter: string, option: SkyOption | null): number {
  setTreatedScope('all');
  setSkyOption(option);
  setSkyRunning(chapter);
  const lut = lutBytes('cinematic', 'ffx2', SKY_CHAPTERS[chapter]!, PAL, 'bold', null, true);
  for (let s = 0.2; s <= 4; s += 0.01) if (luma(sample(lut, PROBE.map((x) => x * s))) > 240) return s;
  return 4;
}

describe('the word', () => {
  it('reads a, b or c from the address (any case) and nothing else', () => {
    expect(skyOptionFromSearch('?skygrade=a')).toBe('a');
    expect(skyOptionFromSearch('?skygrade=B')).toBe('b');
    expect(skyOptionFromSearch('?x=1&skygrade=c')).toBe('c');
    for (const s of [undefined, '', '?skygrade=', '?skygrade=d', '?skygrade=ab', '?skygrade=off', '?sky=a', '?pack=demo']) expect(skyOptionFromSearch(s), String(s)).toBeNull();
    expect(SKY_OPTIONS).toEqual(['a', 'b', 'c']);
  });

  it('is off with no page and no word (a unit test, a tool, every player): the option, the active option and the revision are all nothing', () => {
    expect(skyOption()).toBeNull();
    expect(skyActive()).toBeNull();
    expect(skyRevision()).toBe(0);
    for (const id of [V, XI, 'ffx2-bahamut', 'ffx2-den-of-woe', 'seymour-flux', undefined]) expect(skyGradeFor(id), String(id)).toBeNull();
  });

  it('is forced by the setter and read again from the address by undefined', () => {
    setSkyOption('b');
    expect(skyOption()).toBe('b');
    setSkyOption(null);
    expect(skyOption()).toBeNull();
    setSkyOption('c');
    setSkyOption(undefined);
    expect(skyOption()).toBeNull(); // no page in a unit test
  });
});

describe('with no word nothing changes: the very table, the same LUT key, no chapter look and no arena', () => {
  it("the room's table is the shipped object and the LUT key is the one it was before this branch (the key carries `proRev()`, unchanged by an absent word)", () => {
    setTreatedScope('all');
    setSkyRunning(V);
    expect(proRoom('farplane')).toBe(PRO_ARENA['farplane']);
    expect(proRoom('road-to-the-farplane')).toBe(PRO_ARENA['road-to-the-farplane']);
    expect(Number.isInteger(proRev())).toBe(true);
    const key = lutKey('cinematic', 'ffx2', 'farplane', PAL, 'bold', null, true);
    expect(key).toMatch(/:pro\d+$/);
  });

  it('the held look stays held: no chapter look and no arena in either chapter, with or without a pro switch', () => {
    setTreatedScope('all');
    setProMode('pro');
    for (const id of [V, XI]) {
      expect(chapterLook(id), id).toBeNull();
      expect(proArenaFor(id, ''), id).toBe(false);
      applyChapterLook(id);
      expect([lookState.name, lookState.armed, lookState.pro], id).toEqual([null, false, false]);
    }
  });
});

describe('with the word, in the two chapters only', () => {
  it('the word reaches Chapter V and Chapter XI and no other chapter, under all and not under pack (release 68)', () => {
    setSkyOption('a');
    setTreatedScope('all');
    expect(skyGradeFor(V)).toBe('a');
    expect(skyGradeFor(XI)).toBe('a');
    for (const id of ['ffx2-bahamut', 'ffx2-leblanc', 'ffx2-den-of-woe', 'ffx2-trema', 'seymour-flux', 'yunalesca', 'exp-leblanc', 'ffx2-valefor-besaid', undefined]) expect(skyGradeFor(id), String(id)).toBeNull();
    setTreatedScope('pack');
    expect(skyGradeFor(V)).toBeNull();
    expect(skyGradeFor(XI)).toBeNull();
  });

  it('the held look and arena play with it: the chapter look is the bold row, the arena is on (cinematic bold), in either chapter; a different word changes nothing about which', () => {
    setTreatedScope('all');
    setProMode('pro');
    for (const o of SKY_OPTIONS) {
      setSkyOption(o);
      for (const id of [V, XI]) {
        expect(chapterLook(id), `${id} ${o}`).toEqual({ name: 'hd2d', strength: 'bold' });
        expect(proArenaFor(id, ''), `${id} ${o}`).toBe(true);
        applyChapterLook(id);
        expect([lookState.name, lookState.strength, lookState.armed, lookState.pro], `${id} ${o}`).toEqual(['cinematic', 'bold', true, true]);
        expect(skyActive(), `${id} ${o}`).toBe(o);
      }
    }
  });

  it('an address that chose a look by hand, CLASSIC, `?pro=off` and the arena\'s own off piece all stand it aside, as they stand the arena aside', () => {
    setTreatedScope('all');
    setProMode('pro');
    setSkyOption('b');
    expect(proArenaFor(V, '?look=hd2d')).toBe(false); // the address wins
    setProPiece('arena', false);
    expect(proArenaFor(V, '')).toBe(false);
    setProPiece(null);
    applyChapterLook(V, 'classic'); // the player's style: no look at all, and no sky patch while it is chosen
    expect([lookState.name, lookState.armed, lookState.pro]).toEqual([null, false, false]);
    expect(skyActive()).toBeNull();
    lookState.auto = false; // an address `look` key or a hand-set look
    applyChapterLook(V);
    expect(skyActive()).toBeNull();
    lookState.auto = true;
    setProMode('today'); // ?pro=off: the bold look alone (the unpatched, brightest row of the r70 read)
    expect(proArenaFor(V, '')).toBe(false);
    expect(chapterLook(V)).toEqual({ name: 'hd2d', strength: 'bold' });
  });

  it('the patch applies to the running chapter\'s own plate only, and only while a battle in it is running', () => {
    setTreatedScope('all');
    setSkyOption('a');
    expect(skyRoom('farplane', PRO_ARENA['farplane'])).toBe(PRO_ARENA['farplane']); // no battle named yet
    setSkyRunning(V);
    expect(proRoom('farplane')).not.toBe(PRO_ARENA['farplane']);
    expect(proRoom('road-to-the-farplane')).toBe(PRO_ARENA['road-to-the-farplane']); // not Chapter V's plate
    expect(proRoom('den-of-woe')).toBe(PRO_ARENA['den-of-woe']);
    setSkyRunning(XI);
    expect(proRoom('road-to-the-farplane')).not.toBe(PRO_ARENA['road-to-the-farplane']);
    expect(proRoom('farplane')).toBe(PRO_ARENA['farplane']);
    setSkyRunning('ffx2-den-of-woe'); // another chapter's battle: the patch is gone
    expect(proRoom('road-to-the-farplane')).toBe(PRO_ARENA['road-to-the-farplane']);
    expect(skyRevision()).toBe(0);
  });
});

describe('the three options: one idea each, on the room\'s pro table, never written into it', () => {
  const room = (chapter: string, option: SkyOption): ProRoom => {
    setTreatedScope('all');
    setSkyOption(option);
    setSkyRunning(chapter);
    return proRoom(SKY_CHAPTERS[chapter]!)!;
  };

  it('a is an exposure cap: 1.0 (the rows are 1.45 and 1.5) and nothing else of the table', () => {
    for (const id of [V, XI]) {
      const base = PRO_ARENA[SKY_CHAPTERS[id]!]!;
      const r = room(id, 'a');
      expect(r.colour.exposure, id).toBe(1.0);
      expect(r.colour, id).toEqual({ ...base.colour, exposure: 1.0 });
      expect(r.tweaks, id).toBe(base.tweaks);
      expect(r.cone, id).toBe(base.cone);
      expect(r.haze, id).toBe(base.haze);
    }
    expect(SKY_CHANGES.a.name).toBe('exposure cap');
  });

  it('b is a highlight roll-off: a knee at 0.5 on the colour transform, exposure capped at 1.2, nothing else', () => {
    for (const id of [V, XI]) {
      const base = PRO_ARENA[SKY_CHAPTERS[id]!]!;
      const r = room(id, 'b');
      expect(r.colour.shoulder, id).toBe(0.5);
      expect(r.colour.exposure, id).toBe(1.2);
      expect(r.colour, id).toEqual({ ...base.colour, exposure: 1.2, shoulder: 0.5 });
      expect(r.tweaks, id).toBe(base.tweaks);
      expect(r.cone, id).toBe(base.cone);
    }
    expect(SKY_CHANGES.b.name).toBe('highlight roll-off');
  });

  it('c is a dimmer bold row: the beams, the stage light, the bloom and the figure key come down, the cone is 0.7 of itself, exposure capped at 1.2', () => {
    for (const id of [V, XI]) {
      const base = PRO_ARENA[SKY_CHAPTERS[id]!]!;
      const r = room(id, 'c');
      expect(r.colour.exposure, id).toBe(1.2);
      expect(r.colour.shoulder, id).toBeUndefined();
      expect(r.tweaks['shaft.gain'], id).toBe(0.8);
      expect(r.tweaks['bold.stage'], id).toBe(1.2);
      expect(r.tweaks['bloom.strength'], id).toBe(0.45);
      expect(r.tweaks['bloom.threshold'], id).toBe(0.8);
      expect(r.tweaks['relight.key'], id).toBe(1.3);
      expect(r.tweaks['bold.fog'], id).toBe(base.tweaks['bold.fog']); // the rest of the row stands
      expect(r.cone!.strength, id).toBeCloseTo(base.cone!.strength * 0.7, 10);
      expect(r.cone!.colour, id).toBe(base.cone!.colour);
    }
    expect(SKY_CHANGES.c.name).toBe('dimmer bold row');
  });

  it('the shipped tables are never written: after every option the rows read as they did', () => {
    for (const o of SKY_OPTIONS) for (const id of [V, XI]) room(id, o);
    expect(PRO_ARENA['farplane']!.colour.exposure).toBe(1.45);
    expect(PRO_ARENA['road-to-the-farplane']!.colour.exposure).toBe(1.5);
    expect(PRO_ARENA['farplane']!.colour.shoulder).toBeUndefined();
    expect(PRO_ARENA['farplane']!.tweaks['shaft.gain']).toBe(2);
    expect(PRO_ARENA['road-to-the-farplane']!.cone!.strength).toBe(0.42);
  });

  it('the LUT cache key tells the options apart and the revision follows the active option', () => {
    const keys = new Set<string>();
    setTreatedScope('all');
    setSkyRunning(V);
    for (const o of [null, ...SKY_OPTIONS]) {
      setSkyOption(o);
      keys.add(lutKey('cinematic', 'ffx2', 'farplane', PAL, 'bold', null, true));
      expect(skyRevision(), String(o)).toBe(o === null ? 0 : SKY_OPTIONS.indexOf(o) + 1);
    }
    expect(keys.size).toBe(4);
  });
});

describe('the engine\'s own LUT puts the options in the order the note predicts (the clip headroom of the burst\'s neighbourhood, the real `lutBytes` through the patched room)', () => {
  it('the r70 grade clips the probe at 1.3 times the live sky (the unclipped pixels of the r70 still sit at 1.2 to 2.2 times: the halo); a reaches about 2.1, c about 1.6, and b never reaches 240 up to 4 times', () => {
    for (const id of [V, XI]) {
      const def = clipGain(id, null);
      const a = clipGain(id, 'a');
      const b = clipGain(id, 'b');
      const c = clipGain(id, 'c');
      expect(def, `${id} default`).toBeGreaterThan(1.2);
      expect(def, `${id} default`).toBeLessThan(1.4);
      expect(a, `${id} a`).toBeGreaterThan(1.9);
      expect(a, `${id} a`).toBeLessThan(2.3);
      expect(c, `${id} c`).toBeGreaterThan(1.5);
      expect(c, `${id} c`).toBeLessThan(1.8);
      expect(b, `${id} b`).toBe(4);
      expect(def, id).toBeLessThan(c);
      expect(c, id).toBeLessThan(a);
      expect(a, id).toBeLessThan(b);
    }
  });

  it('the cap darkens the sky\'s middle too, which is what a moodier plate is: the probe at the live brightness reads far under the r70 grade, and b rolls the highlight without a clip', () => {
    setTreatedScope('all');
    setSkyRunning(V);
    const at = (o: SkyOption | null, s: number): number => {
      setSkyOption(o);
      return luma(sample(lutBytes('cinematic', 'ffx2', 'farplane', PAL, 'bold', null, true), PROBE.map((x) => x * s)));
    };
    expect(at(null, 1.25)).toBeGreaterThan(200); // the r70 grade is already near white at 1.25 times the live sky
    expect(at('a', 1.25)).toBeLessThan(80);
    expect(at('b', 1.25)).toBeLessThan(120);
    expect(at('b', 3)).toBeLessThan(240); // the knee: no clip even at three times the live sky
    expect(at('c', 1.25)).toBeLessThan(200);
  });
});

describe('`__pyrefly.skyGrade()`', () => {
  it('reads the word and the active option, sets and clears it live, and ignores anything that is not an option', () => {
    const api: Record<string, unknown> = {};
    installProDebug(api);
    const sky = api['skyGrade'] as (w?: SkyOption | null) => { word: SkyOption | null; active: SkyOption | null; chapters: Record<string, string>; options: Record<string, string> };
    expect(sky().word).toBeNull();
    expect(sky('b').word).toBe('b');
    expect(sky().word).toBe('b');
    expect(sky('x' as never).word).toBe('b'); // not an option: unchanged
    expect(sky(null).word).toBeNull();
    const r = sky();
    expect(r.chapters).toEqual({ [V]: 'farplane', [XI]: 'road-to-the-farplane' });
    expect(r.options).toEqual({ a: 'exposure cap', b: 'highlight roll-off', c: 'dimmer bold row' });
    setTreatedScope('all');
    setSkyRunning(V);
    expect(sky('c').active).toBe('c');
    expect(sky(null).active).toBeNull(); // the r70 grade unpatched, the control arm on the same page
  });
});
