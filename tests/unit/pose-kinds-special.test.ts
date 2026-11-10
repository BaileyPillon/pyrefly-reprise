/**
 * Test 20 of the FFX-2 Special look (step C1, tooling half; game case: FFX-2 only: the three Special dresspheres exist only in FFX-2, and the pose tooling is both games and unchanged for every
 * other subject).
 *
 * THE PIN (written in the step-0 commit, BEFORE `tools/posescale/pose-kinds.mjs` is edited): `tests/fixtures/specials/subject-kinds.txt` is `subjectKind`, `gameOf` and `sideOf` of every
 * subject in `tools/posescale/subjects.json` plus a few ids the tool never lists, taken with the unedited tool. Adding the kind `special-ffx2` must not move any of them.
 *
 * The stage-2 half (every Special row of `POSE_REGISTRATION_FOES` is not prone and not class `wide`, `upright: true` on the Machina Maw rows) extends this same file when the paintings exist.
 */
import { readFileSync, readdirSync } from 'node:fs';
import { resolve } from 'node:path';
import sharp from 'sharp';
import { describe, expect, it } from 'vitest';
import { computePoseScale } from '../../src/engine/PaintedScale.ts';
import { gameOf, poseClassOf, sideOf, SPECIALS, subjectKind } from '../../tools/posescale/pose-kinds.mjs';

const ROOT = resolve(__dirname, '..', '..');
const MASKS = resolve(ROOT, 'tests', 'fixtures', 'specials', 'masks');
const IDS = ['yuna-floral-fallal', 'rikku-machina-maw', 'paine-full-throttle'];

/** The subjects of the registry, plus ids that fall to the default, a namespaced copy and an id that looks like a Special part. */
function subjectIds(): string[] {
  const subjects = JSON.parse(readFileSync(resolve(ROOT, 'tools', 'posescale', 'subjects.json'), 'utf8')) as Record<string, unknown>;
  return [...Object.keys(subjects), 'exp-leblanc-yuna-gunner', 'ff7-cloud', 'nobody-at-all', 'yuna-floral-fallal-extra', 'floral-fallal'];
}

describe('the pose kinds of every existing subject, pinned', () => {
  it('matches the snapshot taken with the unedited pose-kinds.mjs', async () => {
    const rows = subjectIds().map((id) => ({ id, kind: subjectKind(id), game: gameOf(id, undefined), side: sideOf(id) }));
    expect(rows.length).toBeGreaterThan(150);
    await expect(rows.map((r) => `${r.id} ${r.kind} ${r.game} ${r.side}`).join('\n') + '\n').toMatchFileSnapshot('../fixtures/specials/subject-kinds.txt');
  });
});

describe('the Special kind', () => {
  it('is special-ffx2, not boss-foe, for exactly the three ids; the game is FFX-2; the side is the party\'s (+1)', () => {
    expect([...SPECIALS].sort()).toEqual([...IDS].sort());
    for (const id of IDS) {
      expect(subjectKind(id), id).toBe('special-ffx2');
      expect(gameOf(id, undefined), id).toBe('FFX-2');
      expect(sideOf(id), id).toBe(1);
    }
    // nothing near them moves: a namespaced copy is the hidden chapter's, a look-alike is a foe
    expect(subjectKind('exp-leblanc-yuna-floral-fallal')).toBe('exp-leblanc');
    expect(subjectKind('yuna-floral-fallal-extra')).toBe('boss-foe');
    expect(subjectKind('floral-fallal')).toBe('boss-foe');
    expect(subjectKind('yuna-gunner')).toBe('dressphere-ffx2');
  });

  it('keeps the class standing, judged in the stature band: never part, never the staged class', () => {
    const o = { kind: 'special-ffx2', isRef: false, prone: false };
    expect(poseClassOf({ ...o, pose: 'attack' })).toBe('standing');
    expect(poseClassOf({ ...o, pose: 'cast' })).toBe('standing');
    expect(poseClassOf({ ...o, pose: 'hurt' })).toBe('standing');
    expect(poseClassOf({ ...o, pose: 'idle', isRef: true })).toBe('idle');
    expect(poseClassOf({ ...o, pose: 'twirl-end' })).toBe('standing'); // the staged class is the dresspheres' only
    expect(poseClassOf({ ...o, pose: 'attack', prone: true })).toBe('wide'); // a prone painting would still be judged, not waived
    expect(poseClassOf({ ...o, pose: 'ko' })).toBe('ko');
    expect(poseClassOf({ pose: 'attack', kind: 'special-ffx2', prone: false, isRef: false })).not.toBe('part');
  });
});

describe('the prone rule, read on the committed fixtures', () => {
  /** The figure's box at full size, from the mask itself (a quarter-size mask keeps a block when any pixel of it is drawn: within one block, 4 px, at each edge). */
  async function measuredBox(dir: string, scale: number): Promise<{ w: number; h: number }> {
    const { data, info } = await sharp(resolve(dir, 'whole.png')).raw().toBuffer({ resolveWithObject: true });
    let x0 = info.width, y0 = info.height, x1 = 0, y1 = 0;
    for (let y = 0; y < info.height; y++) {
      for (let x = 0; x < info.width; x++) {
        if (data[(y * info.width + x) * info.channels + (info.channels - 1)]! <= 16) continue;
        x0 = Math.min(x0, x); y0 = Math.min(y0, y); x1 = Math.max(x1, x + 1); y1 = Math.max(y1, y + 1);
      }
    }
    return { w: (x1 - x0) / scale, h: (y1 - y0) / scale };
  }

  it('only Machina Maw\'s attack and hurt paintings are prone (771x636 = 1.212 and 659x538 = 1.225); idle 634x553 = 1.146 is not; no other Special pose is', async () => {
    const prone: string[] = [];
    const seen: string[] = [];
    for (const special of readdirSync(MASKS).filter((n) => !n.includes('.'))) {
      for (const pose of readdirSync(resolve(MASKS, special))) {
        const dir = resolve(MASKS, special, pose);
        const meta = JSON.parse(readFileSync(resolve(dir, 'meta.json'), 'utf8')) as { scale: number; wholeBbox: [number, number, number, number] };
        const width = meta.wholeBbox[2] - meta.wholeBbox[0];
        const height = meta.wholeBbox[3] - meta.wholeBbox[1];
        // the quarter-size mask agrees with the full-size box to within a block at each edge (8 px), so the fixture holds the answer, not only its sidecar
        const m = await measuredBox(dir, meta.scale);
        expect(Math.abs(m.w - width), `${special}/${pose} width`).toBeLessThanOrEqual(8);
        expect(Math.abs(m.h - height), `${special}/${pose} height`).toBeLessThanOrEqual(8);
        const scaled = computePoseScale({ width, height, baselineY: height }, { worldHeight: 1.82 });
        seen.push(`${special}/${pose}`);
        if (scaled.prone) prone.push(`${special}/${pose}`);
        if (special === 'machina-maw' && pose === 'attack') expect([width, height]).toEqual([771, 636]);
        if (special === 'machina-maw' && pose === 'hurt') expect([width, height]).toEqual([659, 538]);
        if (special === 'machina-maw' && pose === 'idle') expect([width, height]).toEqual([634, 553]);
      }
    }
    expect(seen.length).toBe(12);
    expect(prone.sort()).toEqual(['machina-maw/attack', 'machina-maw/hurt']);
  });

  it('an `upright` row is not prone, which is what the stage-2 Machina Maw rows will carry', () => {
    expect(computePoseScale({ width: 771, height: 636, baselineY: 636, upright: true }, { worldHeight: 1.82 }).prone).toBe(false);
    expect(computePoseScale({ width: 771, height: 636, baselineY: 636 }, { worldHeight: 1.82 }).prone).toBe(true);
  });
});
