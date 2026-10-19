/**
 * The animation prototype's clip library (`AnimLibrary.ts`, `AnimStyles.ts`, `LuluAnim.ts`): the three styles are the same clips with different numbers; every clip compiles against Lulu's real rig
 * (read only, `D:/pyrefly-art-rigs/lulu-v2`, skipped where the disk lacks it) and against a rig with only the keys; each ends exactly on the key it names; each mark is where the presenter and the props expect.
 */
import { existsSync, readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { CH, C_ROT, compileClip, frameOf, markTime, sampleClip, type ClipRig, type CompiledClip } from '../../../src/engine/rig/anim/AnimClip.ts';
import { buildLibrary, scaleDeltas, sumDeltas } from '../../../src/engine/rig/anim/AnimLibrary.ts';
import { animFromQuery, STYLE_A, STYLE_B, STYLE_C, STYLES } from '../../../src/engine/rig/anim/AnimStyles.ts';
import { LULU, LULU_ACCENTS } from '../../../src/engine/rig/anim/LuluAnim.ts';
import { readRig } from '../../../src/engine/rig/RigData.ts';
import { compileKeys } from '../../../src/engine/rig/RigKeys.ts';
import { normaliseRig } from '../../../tools/rig/rig-format.mjs';
import { clipRigOf } from '../../../tools/rig/lane/anim-rig.mjs';

const LULU_V2 = 'D:/pyrefly-art-rigs/lulu-v2';
const NEEDED = ['idle', 'ready', 'attack', 'follow', 'cast', 'item', 'hurt', 'ko', 'victory'];

/** A rig with only what the generic clips need: one bone of each kind and the nine keys, each a different arm angle. */
function bare(): ClipRig {
  const boneIndex = new Map([['root', 0], ['arm', 1]]);
  const keys = new Map<string, Float64Array>();
  NEEDED.forEach((k, i) => {
    const a = new Float64Array(2 * CH);
    a[3] = a[4] = a[CH + 3] = a[CH + 4] = 1;
    a[CH + C_ROT] = i * 0.2;
    keys.set(k, a);
  });
  return { boneIndex, roots: [0], channels: 2 * CH, keys };
}

describe('the three styles', () => {
  it('are three different parameter sets over the same shape, and A is the quickest to move and C the slowest', () => {
    expect(Object.keys(STYLES)).toEqual(['A', 'B', 'C', 'P2']); // P2 is pass 2 (`anim-pass2.test.ts`)
    expect(STYLE_A.attack.anticipation).toBeLessThan(STYLE_B.attack.anticipation);
    expect(STYLE_B.attack.anticipation).toBeLessThan(STYLE_C.attack.anticipation);
    expect(STYLE_A.attack.action).toBeLessThan(STYLE_B.attack.action);
    expect(STYLE_B.attack.action).toBeLessThan(STYLE_C.attack.action);
    expect(STYLE_A.attack.recovery).toBeLessThan(STYLE_C.attack.recovery);
    expect(STYLE_B.attack.hitStop).toBeGreaterThan(STYLE_A.attack.hitStop); // showpiece holds the hit longer
    expect(STYLE_C.attack.hitStop).toBe(0); // calm: no hit-stop
    expect(STYLE_B.overshoot).toBeGreaterThan(STYLE_A.overshoot);
    expect(STYLE_B.stretch).toBe(1);
    expect(STYLE_A.stretch + STYLE_C.stretch).toBe(0);
    expect(STYLE_B.camera.contact).toBeGreaterThan(0);
    expect(STYLE_A.camera.contact + STYLE_C.camera.contact).toBe(0);
    expect(STYLE_B.secondary.gain).toBeGreaterThan(STYLE_A.secondary.gain);
  });

  it('the researcher\'s starting profiles hold: snappy 80-120 ms anticipation, weighty 180-260, floaty 250-400; hit-stop 30-50, 60-100, 0-30', () => {
    expect(STYLE_A.attack.anticipation).toBeGreaterThanOrEqual(80);
    expect(STYLE_A.attack.anticipation).toBeLessThanOrEqual(120);
    expect(STYLE_B.attack.anticipation).toBeGreaterThanOrEqual(180);
    expect(STYLE_B.attack.anticipation).toBeLessThanOrEqual(260);
    expect(STYLE_C.attack.anticipation).toBeGreaterThanOrEqual(250);
    expect(STYLE_C.attack.anticipation).toBeLessThanOrEqual(400);
    expect(STYLE_A.attack.hitStop).toBeGreaterThanOrEqual(30);
    expect(STYLE_A.attack.hitStop).toBeLessThanOrEqual(50);
    expect(STYLE_B.attack.hitStop).toBeGreaterThanOrEqual(60);
    expect(STYLE_B.attack.hitStop).toBeLessThanOrEqual(100);
    expect(STYLE_C.attack.hitStop).toBeLessThanOrEqual(30);
  });

  it('the query reads only the dev flag: ?anim=proto, style A by default, B and C by name, nothing otherwise', () => {
    expect(animFromQuery('')).toBeNull();
    expect(animFromQuery('?anim=off')).toBeNull();
    expect(animFromQuery('?style=B')).toBeNull();
    expect(animFromQuery('?anim=proto')).toBe(STYLE_A);
    expect(animFromQuery('?rig=on&anim=proto&style=b')).toBe(STYLE_B);
    expect(animFromQuery('?anim=proto&style=C')).toBe(STYLE_C);
    expect(animFromQuery('?anim=proto&style=Z')).toBe(STYLE_A);
  });
});

describe('delta helpers', () => {
  it('scale and sum', () => {
    expect(scaleDeltas({ a: { rot: 1, dx: 2 } }, 0.5)).toEqual({ a: { rot: 0.5, dx: 1, dy: 0, sx: 0, sy: 0 } });
    expect(sumDeltas({ a: { rot: 1 } }, { a: { rot: 2, dy: 1 }, b: { sx: 1 } }, undefined)).toEqual({ a: { rot: 3, dx: 0, dy: 1, sx: 0, sy: 0 }, b: { rot: 0, dx: 0, dy: 0, sx: 1, sy: 0 } });
  });
});

describe('the library on a rig with only the keys (the procedural set)', () => {
  for (const style of Object.values(STYLES)) {
    it(`style ${style.id}: every clip compiles with no accents, ends on the key it names, and its marks are in order`, () => {
      const rig = bare();
      const lib = buildLibrary(style);
      const clips = [lib.ready, lib.windup, lib.strike, lib.follow, lib.cast, lib.item, lib.hurt, lib.ko, lib.victory, lib.recover('attack'), lib.recover('ko')];
      for (const def of clips) {
        const c = compileClip(rig, def);
        expect(c.total, def.name).toBeGreaterThan(0);
        expect(rig.keys.has(def.key), def.name).toBe(true);
        const out = new Float64Array(rig.channels);
        sampleClip(c, c.total + 100, rig.keys.get('idle')!, out);
        expect(Array.from(out).every(Number.isFinite), def.name).toBe(true);
        const ends = compileClip(rig, { ...def, segments: def.segments.slice(-1) }).target[0]!;
        expect(Array.from(out)).toEqual(Array.from(ends));
      }
    });
  }
});

describe.skipIf(!existsSync(`${LULU_V2}/rig.json`))('the library on Lulu\'s real rig', () => {
  const raw = JSON.parse(readFileSync(`${LULU_V2}/rig.json`, 'utf8'));
  const r = readRig(raw);
  if (!r.ok) throw new Error(r.reason);
  const data = r.data;
  const norm = normaliseRig(raw, { dir: LULU_V2 }).rt!;
  const real: ClipRig = { boneIndex: data.boneIndex, roots: data.roots, keys: compileKeys(data), channels: data.bones.length * CH };

  it('the tool\'s reading of the rig (what the previewer draws) is the engine\'s, channel for channel', () => {
    const tool = clipRigOf(norm) as ClipRig;
    expect([...tool.keys.keys()].sort()).toEqual([...real.keys.keys()].sort());
    for (const [k, a] of real.keys) expect(Array.from(tool.keys.get(k)!), k).toEqual(Array.from(a));
    expect(tool.roots).toEqual(real.roots);
  });

  it('has every bone the accents and the secondary spec name (a typo would silently do nothing in the layer, loudly here)', () => {
    const names = new Set(data.bones.map((b) => b.name));
    for (const set of Object.values(LULU_ACCENTS)) if (set && !Array.isArray(set) && !('armN' in set)) for (const bone of Object.keys(set)) expect(names.has(bone), `accent bone ${bone}`).toBe(true);
    for (const bone of [...(LULU_ACCENTS.groups?.armN ?? []), ...(LULU_ACCENTS.groups?.armF ?? [])]) expect(names.has(bone)).toBe(true);
    for (const s of Object.values(STYLES)) {
      const sec = LULU.secondary(s);
      for (const q of [...sec.rots, ...sec.points]) expect(names.has(q.bone), q.bone).toBe(true);
      for (const c of sec.chains ?? []) for (const b of c.bones) expect(names.has(b), b).toBe(true);
    }
    expect(names.has(LULU.attach!.bone)).toBe(true);
    expect(data.landmarks.has(LULU.attach!.landmark)).toBe(true);
    expect(data.landmarks.has(LULU.hand)).toBe(true);
    expect(data.landmarks.has('wristPt')).toBe(true);
  });

  for (const style of Object.values(STYLES)) {
    describe(`style ${style.id}`, () => {
      const lib = buildLibrary(style, LULU_ACCENTS);
      const comp = (d: Parameters<typeof compileClip>[1]): CompiledClip => compileClip(real, d);
      const out = new Float64Array(real.channels);

      it('compiles every clip, each ending on its key (the idle for a recovery), nothing non-finite', () => {
        for (const def of [lib.ready, lib.windup, lib.strike, lib.follow, lib.cast, lib.item, lib.hurt, lib.ko, lib.victory, lib.recover('ready'), lib.recover('cast'), lib.recover('ko'), lib.recover('victory')]) {
          const c = comp(def);
          for (let t = 0; t <= c.total + 50; t += 7) {
            sampleClip(c, t, real.keys.get('idle')!, out);
            for (const v of out) expect(Number.isFinite(v), `${def.name} at ${t}`).toBe(true);
          }
          sampleClip(c, c.total + 1000, real.keys.get('idle')!, out);
          const last = c.target[c.count - 1]!;
          expect(Array.from(out), def.name).toEqual(Array.from(last));
        }
        for (const [clip, key] of [[lib.strike, 'attack'], [lib.follow, 'follow'], [lib.cast, 'cast'], [lib.hurt, 'hurt'], [lib.ko, 'ko'], [lib.victory, 'victory']] as const) {
          const c = comp(clip);
          expect(Array.from(c.target[c.count - 1]!), clip.name).toEqual(Array.from(real.keys.get(key)!)); // the settle is the painted key itself
        }
        const item = comp(lib.item);
        expect(item.key).toBe('item');
      });

      it('names the marks the presenter and the vial wait for, in order', () => {
        const strike = comp(lib.strike);
        expect(markTime(strike, 'contact')).toBeCloseTo(style.attack.action, 6);
        const windup = comp(lib.windup);
        expect(markTime(windup, 'coiled')).toBe(style.attack.anticipation);
        const cast = comp(lib.cast);
        expect(markTime(cast, 'gather')).toBe(style.cast.gather);
        expect(markTime(cast, 'channel')).toBe(style.cast.gather + style.cast.channel);
        expect(markTime(cast, 'release')).toBe(style.cast.gather + style.cast.channel + style.cast.beat + style.cast.release);
        const item = comp(lib.item);
        expect(markTime(item, 'reach')).toBe(style.item.reach);
        expect(markTime(item, 'drawn')).toBe(style.item.reach + style.item.draw);
        expect(markTime(item, 'release')).toBeCloseTo(style.item.reach + style.item.draw + style.item.beat + style.item.throw * 0.7, 6);
        expect(markTime(item, 'reach')).toBeLessThan(markTime(item, 'drawn'));
        expect(markTime(item, 'drawn')).toBeLessThan(markTime(item, 'release'));
        expect(markTime(comp(lib.ko), 'ground')).toBe(style.ko.stagger + style.ko.buckle + style.ko.fall);
        expect(markTime(comp(lib.hurt), 'impact')).toBe(style.hurt.recoil);
      });

      it('the leads: the wind-up\'s length, the spell\'s release (half way into the thrust), the vial\'s landing', () => {
        const at = (d: Parameters<typeof compileClip>[1], mark: string, off: number): number => markTime(comp(d), mark) + off;
        expect(at(lib.windup, lib.leads.attack.mark, lib.leads.attack.offsetMs)).toBe(style.attack.anticipation);
        expect(at(lib.cast, lib.leads.cast.mark, lib.leads.cast.offsetMs)).toBeCloseTo(style.cast.gather + style.cast.channel + style.cast.beat + style.cast.release * 0.5, 6);
        expect(at(lib.item, lib.leads.item.mark, lib.leads.item.offsetMs)).toBeCloseTo(markTime(comp(lib.item), 'release') + style.item.flight, 6);
      });

      it('the contact pose is exactly the pose at its mark, which falls on the frame the mark names (60 fps); the frame before is still moving', () => {
        const strike = comp(lib.strike);
        const t = markTime(strike, 'contact');
        const f = frameOf(t);
        expect(f).toBe(Math.ceil((style.attack.action * 60) / 1000 - 1e-9));
        expect((f * 1000) / 60).toBeGreaterThanOrEqual(t);
        expect(((f - 1) * 1000) / 60).toBeLessThan(t);
        sampleClip(strike, t, real.keys.get('ready')!, out);
        expect(Array.from(out)).toEqual(Array.from(strike.target[1]!));
        sampleClip(strike, ((f - 1) * 1000) / 60, real.keys.get('ready')!, out);
        expect(Array.from(out)).not.toEqual(Array.from(strike.target[1]!));
      });
    });
  }

  it('an extrapolation never adds more than its cap to any bone (the overshoot of a four-radian arm swing is bounded)', () => {
    for (const style of Object.values(STYLES)) {
      const c = compileClip(real, buildLibrary(style, LULU_ACCENTS).strike);
      const attack = real.keys.get('attack')!;
      const contact = c.target[1]!;
      const cap = 0.12 + style.overshoot * 0.9;
      const body = ['upperarm', 'forearm', 'hand', 'upperarmF', 'forearmF'];
      for (const b of body) {
        const i = data.boneIndex.get(b)! * CH + C_ROT;
        // the contact is `attack` past itself plus the authored lean (accents are not capped): the arm bones carry no accent but `hand`
        if (b !== 'hand') expect(Math.abs(contact[i]! - attack[i]!), `${style.id} ${b}`).toBeLessThanOrEqual(cap + 1e-9);
      }
    }
  });
});
