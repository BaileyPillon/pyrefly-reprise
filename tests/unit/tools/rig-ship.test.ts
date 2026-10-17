/**
 * **What a rig must be to ship, on fixtures** (the rig program, 2026-10-17; both games, shared plumbing). The driver's two rules, binding:
 *   (a) a figure turns its rig on only with FULL COVERAGE (every pose it is painted in has a key), no per-pose fallback to paintings: the gate demands it by default and the stamp says so;
 *   (b) the deploy runs `rig-gate --verify` on every shipped rig, any refusal stops it, and `--owner-override` does not bypass it.
 * The puppet world (`rig-gate-fixtures.ts`) is a rig whose keys all make their paintings; every case below breaks ONE thing about it and must be refused for exactly that.
 */
import { cpSync, existsSync, mkdirSync, readFileSync, renameSync, rmSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import sharp from 'sharp';
import { beforeAll, describe, expect, it, vi } from 'vitest';
import { gateRig, sealOf, stampRig, verifyStamp } from '../../../tools/rig/rig-gate-lib.mjs';
import { enforceBuiltRigs, enforceShippedRigs, inventory, listRigFolders, paintedPosesOf, verifyShippableRig } from '../../../tools/rig/rig-ship.mjs';
import { TIER_DIR, halve, readImage, verifyTiers, writeTiers } from '../../../tools/rig/rig-tiers.mjs';
import { POSES, SUBJECT, paintPuppet, puppetWorld, tempDir, type RigJson } from './rig-gate-fixtures.ts';

vi.setConfig({ testTimeout: 180_000, hookTimeout: 180_000 });

interface Ship { art: string; rig: string; pub: string }

/** A stamped, tiered rig inside a release-shaped public folder: `<pub>/art/characters/<subject>/*` and `<pub>/art/rigs/<subject>/*`. */
let base: { art: string; rig: string; inputs: Awaited<ReturnType<typeof puppetWorld>>['inputs'] };

async function ship(mutate?: (s: Ship) => void | Promise<void>, from: { art: string; rig: string } = base): Promise<Ship> {
  const pub = tempDir('rig-pub-');
  cpSync(from.art, join(pub, 'art'), { recursive: true });
  cpSync(from.rig, join(pub, 'art', 'rigs', SUBJECT), { recursive: true });
  const s = { art: join(pub, 'art'), rig: join(pub, 'art', 'rigs', SUBJECT), pub };
  await mutate?.(s);
  return s;
}
const problems = async (s: Ship, o: { allowPartial?: boolean } = {}): Promise<string[]> => (await verifyShippableRig({ dir: s.rig, artDir: s.art, ...o })).problems.map((p) => p.code);
const editRig = (dir: string, f: (rig: RigJson) => void, keepGate = true): void => {
  const rig = JSON.parse(readFileSync(join(dir, 'rig.json'), 'utf8')) as RigJson;
  f(rig);
  if (!keepGate) delete rig.gate;
  writeFileSync(join(dir, 'rig.json'), JSON.stringify(rig));
};

beforeAll(async () => {
  const w = await puppetWorld();
  const r = await gateRig({ rig: w.rig, inputs: w.inputs, blends: false });
  expect(r.failures).toEqual([]);
  stampRig(w.rig, r);
  await writeTiers(w.rig);
  base = w;
});

describe('full coverage is the default, and the stamp says which it is', () => {
  it('refuses a rig with no key for a painted pose, names the pose, and refuses it by default', async () => {
    const w = await puppetWorld({ patch: (rig) => { delete rig.keys.item; } });
    const r = await gateRig({ rig: w.rig, inputs: w.inputs, blends: false });
    expect(r.status).toBe('refused');
    expect(r.uncovered).toEqual(['item']);
    expect(r.failures.find((f) => f.code === 'coverage')?.message).toMatch(/item/);
    expect(stampRig(w.rig, r)).toMatchObject({ status: 'refused', coverage: 'partial', uncovered: ['item'] });
  });
  it('lets a rig still being fitted through the dev loop, stamped `partial`, and verify (shipping) refuses that stamp', async () => {
    const w = await puppetWorld({ patch: (rig) => { delete rig.keys.item; } });
    const r = await gateRig({ rig: w.rig, inputs: w.inputs, blends: false, requireCoverage: false });
    expect(r.status).toBe('ok');
    const g = stampRig(w.rig, r);
    expect(g).toMatchObject({ status: 'ok', coverage: 'partial', uncovered: ['item'] });
    expect(verifyStamp(w.rig).ok).toBe(true); // the dev loop's check
    expect(verifyStamp(w.rig, { full: true })).toMatchObject({ ok: false, code: 'gate-partial' });
  });
  it('stamps full coverage, the exempt poses and a silhouette for every key it passed', () => {
    const raw = JSON.parse(readFileSync(join(base.rig, 'rig.json'), 'utf8')) as RigJson;
    expect(raw.gate).toMatchObject({ status: 'ok', coverage: 'full', exempt: [] });
    expect(Object.keys(raw.gate.silhouettes).sort()).toEqual(Object.keys(POSES).sort());
    expect(raw.gate.uncovered).toBeUndefined();
    expect(verifyStamp(base.rig, { full: true }).ok).toBe(true);
  });
  it('refuses a stamp from before the rule (no coverage field) and one with a key that has no silhouette', async () => {
    const s = await ship((x) => editRig(x.rig, (rig) => { delete rig.gate.coverage; }));
    expect(verifyStamp(s.rig, { full: true })).toMatchObject({ ok: false, code: 'gate-partial' });
    const t = await ship((x) => editRig(x.rig, (rig) => { delete rig.gate.silhouettes.attack; }));
    expect(verifyStamp(t.rig, { full: true })).toMatchObject({ ok: false, code: 'gate-seal' }); // the record was edited
    const u = await ship((x) => editRig(x.rig, (rig) => { delete rig.gate.silhouettes.attack; rig.gate.seal = sealOf(rig.gate); }));
    expect(verifyStamp(u.rig, { full: true })).toMatchObject({ ok: false, code: 'gate-silhouettes' }); // a record re-sealed by hand still has to be complete
  });
});

describe('each key\'s silhouette: the posed box, feet and painted front, in the master\'s pixels', () => {
  it('reads the idle puppet\'s box and feet where the SVG draws them', () => {
    const idle = (JSON.parse(readFileSync(join(base.rig, 'rig.json'), 'utf8')) as RigJson).gate.silhouettes.idle;
    // the puppet: legs and torso from x 160 to 247 (the arm), head top 120, soles 450
    expect(idle.box[0]).toBeGreaterThan(157);
    expect(idle.box[0]).toBeLessThan(164);
    expect(idle.box[2]).toBeGreaterThan(244);
    expect(idle.box[2]).toBeLessThan(251);
    expect(idle.box[1]).toBeGreaterThan(117);
    expect(idle.box[1]).toBeLessThan(124);
    expect(idle.box[3]).toBeGreaterThan(447);
    expect(idle.box[3]).toBeLessThan(453);
    expect(idle.feet[0]).toBeCloseTo(200, 0);
    expect(idle.feet[1]).toBeCloseTo(450, 0);
    expect(idle.profile.left).toHaveLength(40);
    expect(idle.profile.right).toHaveLength(40);
  });
  it('moves with the key: the raised arm of `attack` is a different box and a different front than the idle\'s', () => {
    const sil = (JSON.parse(readFileSync(join(base.rig, 'rig.json'), 'utf8')) as RigJson).gate.silhouettes;
    const [a, i] = [sil.attack, sil.idle];
    expect(a.box).not.toEqual(i.box);
    // the right end of the top band: the idle has only the head there; the raised arm reaches out
    const rightOf = (s: RigJson, band: number): number => s.profile.right[band] * (s.box[2] - s.box[0]) + s.box[0];
    expect(Math.max(...[2, 4, 6, 8].map((b) => rightOf(a, b)))).toBeGreaterThan(Math.max(...[2, 4, 6, 8].map((b) => rightOf(i, b))) + 5);
    for (const pose of Object.keys(POSES)) {
      const p = sil[pose];
      expect(p.box[2]).toBeGreaterThan(p.box[0]);
      expect(p.profile.left.filter((v: number | null) => v !== null).every((v: number) => v >= 0 && v <= 1)).toBe(true);
    }
  });
});

describe('verifyShippableRig: the cheap check `rig-gate --verify` and the deploy run', () => {
  it('passes the control, and says what it proved', async () => {
    const s = await ship();
    const v = await verifyShippableRig({ dir: s.rig, artDir: s.art });
    expect(v.problems).toEqual([]);
    expect(v.ok).toBe(true);
    expect(v.info.keys.sort()).toEqual(Object.keys(POSES).sort());
    expect(v.info.tiers?.checked).toBeGreaterThan(4);
  });
  it('refuses a stamp that is not there, and one that went stale with a hand edit', async () => {
    const none = await ship((x) => editRig(x.rig, () => {}, false));
    expect(await problems(none)).toEqual(['gate-not-ok']);
    const stale = await ship((x) => editRig(x.rig, (rig) => { rig.keys.attack.bones.upperarm.rot = -0.5; }));
    expect(await problems(stale)).toEqual(['gate-stale']);
  });
  it('refuses a rig whose folder is not named for its subject', async () => {
    const s = await ship((x) => { const to = join(x.pub, 'art', 'rigs', 'zz-other'); renameSync(x.rig, to); });
    const v = await verifyShippableRig({ dir: join(s.pub, 'art', 'rigs', 'zz-other'), artDir: s.art });
    expect(v.problems.map((p) => p.code)).toContain('subject');
  });
  it('refuses a rig whose costume was repainted after the gate ran', async () => {
    const s = await ship(async (x) => { await paintPuppet(x.art, 'idle', { chest: 0.2, head: 0, upper: 0, fore: 0 }); });
    expect(await problems(s)).toEqual(['costume-stale']);
  });
  it('refuses a pose painted AFTER the gate ran (the rig would draw it as the nearest key), and an exempt list edited by hand to excuse it', async () => {
    const s = await ship(async (x) => { await paintPuppet(x.art, 'cast', { chest: 0.05, head: 0, upper: -0.6, fore: 0 }); });
    const v = await verifyShippableRig({ dir: s.rig, artDir: s.art });
    expect(v.problems.map((p) => p.code)).toEqual(['coverage']);
    expect(v.problems[0]!.message).toMatch(/cast/);
    const excused = await ship(async (x) => { await paintPuppet(x.art, 'cast', { chest: 0, head: 0, upper: 0, fore: 0 }); editRig(x.rig, (rig) => { rig.gate.exempt = ['cast']; }); });
    expect(await problems(excused)).toEqual(['gate-seal']); // the gate writes the exempt list, with a seal over it; a hand edit breaks the seal
  });
  it('accepts a painted pose the gate itself exempted (a painting the pose table has no row for), and lists it in the stamp', async () => {
    const w = await puppetWorld();
    await paintPuppet(w.art, 'cast', { chest: 0, head: 0, upper: -0.6, fore: 0 });
    const r = await gateRig({ rig: w.rig, inputs: w.inputs, blends: false });
    expect(r.exempt).toEqual(['cast']);
    expect(r.uncovered).toEqual([]);
    stampRig(w.rig, r);
    await writeTiers(w.rig);
    const s = await ship(undefined, w);
    expect(await problems(s)).toEqual([]);
  });
  it('refuses a partial stamp unless the dev loop asks', async () => {
    const s = await ship((x) => editRig(x.rig, (rig) => { rig.gate.coverage = 'partial'; rig.gate.uncovered = ['item']; }));
    expect(await problems(s)).toEqual(['gate-partial']);
    expect(await problems(s, { allowPartial: true })).toEqual([]);
  });
  it('refuses a missing, a stale and an extra 1x file, and a file in the folder the rig does not name', async () => {
    const missing = await ship((x) => rmSync(join(x.rig, TIER_DIR, 'head.png')));
    expect(await problems(missing)).toEqual(['tier']);
    const absent = await ship((x) => rmSync(join(x.rig, TIER_DIR), { recursive: true }));
    expect(await problems(absent)).toEqual(['tier']);
    const stale = await ship(async (x) => {
      const f = join(x.rig, TIER_DIR, 'torso.png');
      const img = await readImage(f);
      img.data[0] = (img.data[0]! + 40) % 256; // one texel off the rule
      await sharp(img.data, { raw: { width: img.width, height: img.height, channels: img.channels as 4 } }).png().toFile(`${f}.new`);
      renameSync(`${f}.new`, f);
    });
    expect(await problems(stale)).toEqual(['tier']);
    const extra = await ship((x) => writeFileSync(join(x.rig, 'notes.txt'), 'hello'));
    expect(await problems(extra)).toEqual(['files']);
    const extraTier = await ship((x) => writeFileSync(join(x.rig, TIER_DIR, 'spare.png'), 'x'));
    expect(await problems(extraTier)).toContain('tier');
  });
});

describe('the 1x tier is the half of the file, by a rule that is the same on every machine', () => {
  it('halves with premultiplied alpha, keeps the colour bled under alpha 0, and takes an odd edge as it is', () => {
    // 3 x 1 RGBA: an opaque red, a half-transparent blue, a transparent texel that still carries green
    const px = [255, 0, 0, 255, 0, 0, 255, 128, 0, 200, 0, 0];
    const h = halve({ data: Buffer.from(px), width: 3, height: 1, channels: 4 });
    expect([h.width, h.height]).toEqual([2, 1]);
    // texel 0: red (a 255) and blue (a 128): colour = (255*255 + 0) / 383 = 170 red, blue = 128*255/383 = 85; alpha = 383/2 = 191.5 -> 192
    expect([...h.data.subarray(0, 4)]).toEqual([170, 0, 85, 192]);
    // texel 1: the odd edge, one texel inside, no alpha: the colour under alpha 0 stays, alpha stays 0
    expect([...h.data.subarray(4, 8)]).toEqual([0, 200, 0, 0]);
    const grey = halve({ data: Buffer.from([0, 255, 255]), width: 3, height: 1, channels: 1 });
    expect([...grey.data]).toEqual([128, 255]);
  });
  it('writes a folder that verifies, and the 1x files are a quarter of the texels', async () => {
    const v = await verifyTiers(base.rig);
    expect(v.problems).toEqual([]);
    const full = (JSON.parse(readFileSync(join(base.rig, 'rig.json'), 'utf8')) as RigJson).parts.reduce((n: number, p: RigJson) => n + p.box[2] * p.box[3], 0);
    expect(v.texels).toBeGreaterThan(full / 4 - 200);
    expect(v.texels).toBeLessThan(full / 4 + 600);
  });
});

describe('the deploy\'s rig gate, before the build', () => {
  const run = async (s: Ship): Promise<{ lines: string[]; failed: string | null; rigs: unknown[] }> => {
    const lines: string[] = [];
    let failed: string | null = null;
    const rigs = await enforceShippedRigs({ publicDir: s.pub, log: (l: string) => lines.push(l), fail: (m: string) => { failed = m; } });
    return { lines, failed, rigs };
  };
  it('passes a build with no rigs, saying so', async () => {
    const pub = tempDir('rig-none-');
    mkdirSync(join(pub, 'art'), { recursive: true });
    const r = await run({ art: join(pub, 'art'), rig: '', pub });
    expect(r.failed).toBeNull();
    expect(r.lines.join('\n')).toMatch(/no rigs ship/);
  });
  it('passes the verified control and returns it for the build check', async () => {
    const r = await run(await ship());
    expect(r.failed).toBeNull();
    expect(r.rigs).toHaveLength(1);
  });
  it('REFUSES the deploy for a bad rig (stale, partial, no tier), naming the rig and the code, and for a stray folder or file', async () => {
    for (const mutate of [
      (x: Ship) => editRig(x.rig, (rig) => { rig.keys.attack.bones.upperarm.rot = -0.5; }),
      (x: Ship) => editRig(x.rig, (rig) => { rig.gate.coverage = 'partial'; }),
      (x: Ship) => rmSync(join(x.rig, TIER_DIR), { recursive: true }),
    ]) {
      const r = await run(await ship(mutate));
      expect(r.failed).toMatch(/the rig gate refuses this deploy/);
      expect(r.failed).toMatch(/--owner-override and --skip-tests do not cover it/);
      expect(r.lines.join('\n')).toMatch(new RegExp(SUBJECT));
    }
    const folder = await ship((x) => void mkdirSync(join(x.pub, 'art', 'rigs', 'zz-loose'), { recursive: true }));
    expect((await run(folder)).failed).toMatch(/refuses/);
    const file = await ship((x) => writeFileSync(join(x.pub, 'art', 'rigs', 'readme.txt'), 'x'));
    expect((await run(file)).failed).toMatch(/refuses/);
  });
  it('lists the rig folders and the poses the art paints', async () => {
    const s = await ship();
    expect(listRigFolders(s.pub).folders.map((f) => f.subject)).toEqual([SUBJECT]);
    expect(paintedPosesOf(s.art, SUBJECT)).toEqual(Object.keys(POSES).sort());
    expect(inventory(s.rig, JSON.parse(readFileSync(join(s.rig, 'rig.json'), 'utf8'))).extra).toEqual([]);
  });
});

describe('the deploy\'s rig gate, on the build', () => {
  /** A build folder: the verified rig as the build holds it (a PNG as it is, a WebP for a master it derived), and the manifest. */
  const built = async (s: Ship, tweak?: (dist: string) => void): Promise<string> => {
    const dist = tempDir('rig-dist-');
    mkdirSync(join(dist, 'art'), { recursive: true });
    cpSync(join(s.art, 'rigs'), join(dist, 'art', 'rigs'), { recursive: true });
    writeFileSync(join(dist, 'art', 'manifest.json'), JSON.stringify({ version: 1, rigs: [SUBJECT], rigTiers: { [SUBJECT]: [1, 2] } }));
    tweak?.(dist);
    return dist;
  };
  const check = async (s: Ship, dist: string): Promise<string | null> => {
    let failed: string | null = null;
    const verified = await enforceShippedRigs({ publicDir: s.pub, log: () => {}, fail: (m: string) => { failed = m; } });
    enforceBuiltRigs({ dist, publicDir: s.pub, verified, log: () => {}, fail: (m: string) => { failed = m; } });
    return failed;
  };
  it('passes the build that holds exactly the verified rig, a master as its derived WebP included', async () => {
    const s = await ship();
    const dist = await built(s, (d) => renameSync(join(d, 'art', 'rigs', SUBJECT, 'head.png'), join(d, 'art', 'rigs', SUBJECT, 'head.webp')));
    expect(await check(s, dist)).toBeNull();
  });
  it('refuses a rig.json the build changed, a file nobody vetted, a missing file, a folder that was never verified, and a manifest that lists something else', async () => {
    const s = await ship();
    expect(await check(s, await built(s, (d) => writeFileSync(join(d, 'art', 'rigs', SUBJECT, 'rig.json'), '{}')))).toMatch(/refuses/);
    expect(await check(s, await built(s, (d) => writeFileSync(join(d, 'art', 'rigs', SUBJECT, 'extra.png'), 'x')))).toMatch(/refuses/);
    expect(await check(s, await built(s, (d) => rmSync(join(d, 'art', 'rigs', SUBJECT, 'head.png'))))).toMatch(/refuses/);
    expect(await check(s, await built(s, (d) => mkdirSync(join(d, 'art', 'rigs', 'zz-sneaked'), { recursive: true })))).toMatch(/refuses/);
    expect(await check(s, await built(s, (d) => writeFileSync(join(d, 'art', 'manifest.json'), JSON.stringify({ rigs: [SUBJECT, 'zz-other'] }))))).toMatch(/refuses/);
    expect(await check(s, await built(s, (d) => writeFileSync(join(d, 'art', 'manifest.json'), JSON.stringify({ rigs: [SUBJECT], rigTiers: { [SUBJECT]: [2] } }))))).toMatch(/refuses/);
    expect(existsSync(join(s.rig, 'rig.json'))).toBe(true);
  });
});
