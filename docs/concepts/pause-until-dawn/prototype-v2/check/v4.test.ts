import { existsSync, readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { readV4 } from '../src/layers.ts';

/** v4: the rig carries nine keys about 20 degrees apart, every file on disk, one tassel path and per-key expressions. */
const ART = new URL('../art/', import.meta.url);
const rig = JSON.parse(readFileSync(new URL('rig.json', ART), 'utf8'));
const keys = [...rig.keys].sort((a: { yawDeg: number }, b: { yawDeg: number }) => a.yawDeg - b.yawDeg) as Array<{ id: string; yawDeg: number; landmarks: number[][] }>;

describe('v4 rig', () => {
  it('has keys from -85 to +85, none more than 25 degrees apart, and paints them by warp', () => {
    expect(keys.map((k) => k.yawDeg)).toEqual([-85, -60, -40, -20, 0, 20, 40, 60, 85]);
    for (let i = 1; i < keys.length; i++) expect(keys[i]!.yawDeg - keys[i - 1]!.yawDeg).toBeLessThanOrEqual(25);
    expect(readV4(rig.artMeta)?.paint).toBe('warp');
  });
  it('every layer, lid and patch file it names exists', () => {
    const v3 = rig.artMeta.v3;
    const files: string[] = [];
    for (const id of Object.keys(v3.keys)) files.push(v3.keys[id].back.file, v3.keys[id].front.file);
    for (const frames of Object.values(v3.keyLids) as Array<Array<{ file: string }>>) files.push(...frames.map((f) => f.file));
    for (const kp of Object.values(v3.keyPatches) as Array<{ rest: string; mouth: Record<string, { file: string }>; brows: Record<string, { file: string }> }>) {
      files.push(kp.rest, ...Object.values(kp.mouth).map((p) => p.file), ...Object.values(kp.brows).map((p) => p.file));
    }
    for (const f of files) expect(existsSync(new URL(f, ART)), f).toBe(true);
    expect(files.length).toBeGreaterThan(80);
  });
  it('every turned key blinks, and the +-20 and +-40 keys carry all six expressions', () => {
    for (const k of keys) if (k.id !== 'frontal') expect(rig.artMeta.v3.keyLids[k.id]?.length, k.id).toBe(8);
    for (const id of ['v4-l40', 'v4-l20', 'v4-r20', 'v4-r40']) {
      const kp = rig.artMeta.v3.keyPatches[id];
      expect(Object.keys(kp.mouth).sort()).toEqual(['parted', 'pressed', 'slightSmile', 'smile']);
      expect(Object.keys(kp.brows).sort()).toEqual(['drawn', 'raised']);
    }
  });
  it('the tassel follows her right ear: toward the head axis on either turn, further the further she turns', () => {
    const dx = rig.artMeta.v4.tassel.dx as Record<string, number>;
    expect(dx.frontal).toBe(0);
    const left = keys.filter((k) => k.yawDeg <= 0).map((k) => dx[k.id]!); // -85 .. 0
    const right = keys.filter((k) => k.yawDeg >= 0).map((k) => dx[k.id]!); // 0 .. 85
    for (let i = 1; i < left.length; i++) expect(left[i]!).toBeLessThan(left[i - 1]!);
    for (let i = 1; i < right.length; i++) expect(right[i]!).toBeGreaterThan(right[i - 1]!);
    // the ear starts 222 px left of the axis (x 473): it never crosses it
    for (const v of Object.values(dx)) expect(v).toBeLessThan(230);
  });
});
