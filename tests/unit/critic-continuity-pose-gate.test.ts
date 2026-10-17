/**
 * Pose continuity in the critic, second half (W4, CHK-026 and CHK-027; both games): what the planner says, and the critic and the gate reading the same real paintings
 * the same way (split out of `critic-continuity-pose.test.ts`, which had passed 400 lines). Bailey, 2026-10-16: "pose continuity is the strongest recurring issue we need a
 * permanent fix for this please."
 */
import { existsSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it, vi } from 'vitest';
import { continuityConfig } from '../../critic/runner/lib/continuity.mjs';
import { classifyChange, loadPolicy } from '../../tools/critic-policy.mjs';
import type { Anchors } from '../../critic/runner/lib/continuity-pure.mjs';
import { readHeight } from '../../critic/runner/lib/continuity-readings.mjs';
import { unitSquareToQuad } from '../../critic/runner/lib/continuity-geometry.mjs';
import { anchorsFor } from '../../critic/runner/lib/continuity-silhouette.mjs';

const ROOT = resolve(__dirname, '..', '..');
// decoding real paintings and importing the model's tables is slow on a loaded machine; nothing here is timing-sensitive
vi.setConfig({ testTimeout: 60_000 });
const CFG = continuityConfig();

// ------------------------------------------------------------------ the planner and the census

describe('what the planner says about pose continuity (W4)', () => {
  const policy = loadPolicy(ROOT);
  const plan = (paths: string[]) => classifyChange(paths, policy);

  it('maps the registration, the scale, the head lock, the blend, the rulers, the gate and the ledger to CHK-026 and CHK-027', () => {
    for (const path of [
      'src/data/art/poseRegistrationFfx2.ts', 'src/engine/PoseRegistration.ts', 'src/engine/HeadLock.ts', 'src/engine/HeadLockStage.ts', 'src/engine/PaintedScale.ts', 'src/engine/PoseBlend.ts', 'src/engine/PoseTrust.ts',
      'tools/posescale/measure.py', 'tools/posescale/pose-bands.mjs', 'tools/pose-gate.mjs', 'tools/pose-gate-lib.mjs', 'tools/art-install.mjs', 'docs/target/pose-waivers.json', 'docs/target/pose-measure.json',
    ]) {
      const p = plan([path]);
      expect(p.checks, path).toEqual(expect.arrayContaining(['CHK-026', 'CHK-027']));
      expect(p.depth, path).not.toBe('none');
    }
  });

  it('keeps the depth the registration tables had (deep: they were unclassified) and reviews the tooling and the ledger with the harness (focused), which were no product effect', () => {
    expect(plan(['src/data/art/poseRegistrationFoes.ts']).depth).toBe('deep');
    expect(plan(['tools/posescale/measure.py']).depth).toBe('focused');
    expect(plan(['docs/target/pose-waivers.json']).depth).toBe('focused');
    expect(plan(['tools/critic-plan.mjs', 'docs/handoff/NOW.md']).depth).toBe('none'); // everything else in tools/ and docs/ stays out
  });

  it('hands every candidate the pose census as data, whatever its depth, and adds no check to a plan that did not have it', () => {
    for (const paths of [[], ['docs/handoff/NOW.md'], ['src/ui/ffx/CommandMenu.ts'], null]) {
      const p = classifyChange(paths as string[], policy);
      expect(p.staticChecks.map((c) => c.id), JSON.stringify(paths)).toEqual(['pose-census']);
    }
    expect(plan([]).checks).not.toContain('CHK-026'); // listing it would owe the browser harness to every candidate
    const census = plan([]).staticChecks[0]!;
    expect(census).toMatchObject({ checks: ['CHK-026'], mode: 'report', needs: ['public/art'] });
    expect(census.command.slice(0, 3)).toEqual(['node', 'tools/pose-gate.mjs', '--report']);
    expect(existsSync(resolve(ROOT, census.command[1]!)), 'the census command names a tool that exists (the gate lane builds it)').toBe(true);
    expect(plan([]).staticChecks[0]).not.toBe(policy['alwaysAtDeployStatic'] && (policy['alwaysAtDeployStatic'] as unknown[])[0]); // a copy: a reviewer's edit never reaches the policy
  });
});

// ------------------------------------------------------------------ the critic and the gate read the same paintings the same way

const ART = resolve(ROOT, 'public', 'art');
const artPresent = existsSync(resolve(ART, 'characters', 'lulu', 'idle.png')) && existsSync(resolve(ART, 'characters', 'paine-lady-luck', 'hurt.png'));

describe.skipIf(!artPresent)('the critic and the gate (tools/pose-gate.mjs) read the same height and the same feet off the same paintings', () => {
  // The gate's model places a painting the way the engine does (PaintedScale + PoseRegistration + HeadLock, in numbers) and reads its stature from the table's anchor row; the critic reads
  // the plane's quad and the painting's own alpha. Two readers of one painting must not disagree about which poses are off, or a live review and a deploy refusal would.
  const S = 300; // px per world unit of an orthographic front view
  const planeOf = (r: { size: number[]; drawn: { upp: number; anchor: number } }): number[] => {
    const u = r.drawn.upp * S, top = 470 - r.drawn.anchor * u, left = 400 - (r.size[0]! / 2) * u;
    return [left, top, left + r.size[0]! * u, top, left + r.size[0]! * u, top + r.size[1]! * u, left, top + r.size[1]! * u];
  };
  /** `legacy`: the registration table as r50.1 shipped Paine Lady Luck's hurt (a `feetRow` at the knees; the data lane repaired it on 2026-10-17), so the proof that the critic sees the defect stays. */
  const both = async (subject: string, pose: string, legacy = false) => {
    const { readPose, loadModelInputs } = await import('../../tools/posescale/pose-model.mjs');
    const { decodeMask } = await import('../../critic/runner/lib/continuity-silhouette.mjs');
    const { unitSquareToQuad } = await import('../../critic/runner/lib/continuity-geometry.mjs');
    const { poseReadings } = await import('../../critic/runner/lib/continuity-readings.mjs');
    let inputs = await loadModelInputs({ root: ROOT });
    if (legacy) {
      const table = { ...inputs.table, 'paine-lady-luck': { ...inputs.table['paine-lady-luck'], hurt: { stanceX: 287.5, feetRow: 472.0, head: [0.3136, 0.2478, 0.4962, 0.3429] } } };
      inputs = { ...inputs, table, refs: new Map() } as unknown as typeof inputs;
    }
    const gi = await readPose(subject, 'idle', { inputs }), gp = await readPose(subject, pose, { inputs });
    const anchor = async (p: string) => anchorsFor({ url: `/art/characters/${subject}/${p}.webp`, mask: await decodeMask(readFileSync(resolve(ART, 'characters', subject, `${p}.png`))), measure: null });
    const aI = await anchor('idle'), aP = await anchor(pose);
    const critic = poseReadings({ aFrom: aI, aTo: aP, Hf: unitSquareToQuad(planeOf(gi as never)), Ht: unitSquareToQuad(planeOf(gp as never)), k1600: 1, head: null, cfg: CFG, judged: true });
    return { gate: gp, critic };
  };

  it.each([['lulu', 'hurt'], ['lulu', 'critical'], ['auron', 'item'], ['yuna', 'item'], ['kimahri', 'follow'], ['tidus', 'victory']])('%s %s: the stature the critic reads from the pixels is the gate\'s within 0.02', async (subject, pose) => {
    const { gate, critic } = await both(subject!, pose!);
    expect(critic.height).not.toBeNull();
    expect(critic.height!.stature).not.toBeNull();
    expect(Math.abs(critic.height!.stature! - gate.stature!)).toBeLessThan(0.02);
    expect(critic.height!.class).toBe(gate.class);
  });

  it('reads Lulu\'s KO by its length, as the gate does (0.42 of the idle\'s height: report-only, the owner has not ruled)', async () => {
    const { gate, critic } = await both('lulu', 'ko');
    expect(critic.height!.length).not.toBeNull();
    expect(Math.abs(critic.height!.length! - gate.lengthRatio!)).toBeLessThan(0.03);
    expect(critic.height!.flags).toEqual([]);
    expect(critic.failHeight).toBe(false);
  });

  it('agrees that Paine Lady Luck\'s hurt is planted at the knees: the gate says it stands on its feetRow, the critic sees the soles 100 px under the idle\'s floor', async () => {
    const { bandVerdict } = await import('../../tools/posescale/pose-bands.mjs');
    const { gate, critic } = await both('paine-lady-luck', 'hurt', true);
    expect(bandVerdict(gate).flags.some((f: string) => f.startsWith('feet'))).toBe(true);
    expect(critic.feetSil).not.toBeNull();
    expect(critic.feetSil!.dy).toBeGreaterThan(60);
    expect(critic.failFeetSil).toBe(true);
  });

  it('and sees the repaired row (2026-10-17: the feetRow guard) on its soles: no feet flag from the gate, and the critic reads the soles within 30 px of the idle floor, not 100 px under it', async () => {
    const { bandVerdict } = await import('../../tools/posescale/pose-bands.mjs');
    const before = await both('paine-lady-luck', 'hurt', true);
    const after = await both('paine-lady-luck', 'hurt');
    expect(bandVerdict(after.gate).flags.some((f: string) => f.startsWith('feet'))).toBe(false);
    expect(after.critic.feetSil).not.toBeNull();
    expect(Math.abs(after.critic.feetSil!.dy)).toBeLessThan(30);
    expect(Math.abs(after.critic.feetSil!.dy)).toBeLessThan(Math.abs(before.critic.feetSil!.dy) / 3);
  });
});

describe('the HEIGHT reading judges a props-out pose head to soles, as the gate does (W3, 2026-10-17)', () => {
  // an idle 400 px tall whose head top is at 0.10 of its painting (body 360 px); a victory pose `h` px tall whose real head top is at `t` of it
  const sq = (hh: number) => unitSquareToQuad([0, 0, 100, 0, 100, hh, 0, hh]);
  const ext = { top: 0, base: 1, left: 0, right: 1 };
  const idle = { pose: 'idle', cls: 'idle', extent: ext, headTopT: 0.1, propsOut: false } as unknown as Anchors;
  const pose = (name: string, t: number, propsOut: boolean) => ({ pose: name, cls: 'standing', extent: ext, headTopT: t, propsOut }) as unknown as Anchors;

  it('reads Tidus\'s victory at box 1.39 and body 1.10 as in band: the raised sword is not height', () => {
    // 558 px tall, head top at 0.29: body 396 px over the idle\'s 360 = 1.10
    const r = readHeight({ aFrom: idle, aTo: pose('victory', 0.29, true), Hf: sq(400), Ht: sq(558), k1600: 1 })!;
    expect(r.stature).toBeCloseTo(1.1, 2);
    expect(r.basis).toBe('body');
    expect(r.flags).toEqual([]);
    // the same painting read by its box, as a pose that is not props out: 558 / 400 = 1.395, out of band
    const box = readHeight({ aFrom: idle, aTo: pose('attack', 0.29, false), Hf: sq(400), Ht: sq(558), k1600: 1 })!;
    expect(box.stature).toBeCloseTo(1.395, 2);
    expect(box.flags).toEqual(['stature-high']);
  });

  it('still fails a props-out pose whose BODY is out of band (a victory whose body is 1.25 of the idle\'s)', () => {
    const r = readHeight({ aFrom: idle, aTo: pose('victory', 0.2, true), Hf: sq(400), Ht: sq(562), k1600: 1 })!; // 562 x 0.8 = 450 / 360
    expect(r.stature).toBeCloseTo(1.249, 2);
    expect(r.flags).toEqual(['stature-high']);
    expect(readHeight({ aFrom: idle, aTo: pose('defend', 0.2, true), Hf: sq(400), Ht: sq(300), k1600: 1 })!.flags).toEqual(['stature-low']); // 240 / 360 = 0.67
  });

  it('falls back to the box for a props-out pose with no head box to measure from', () => {
    const bare = { pose: 'victory', cls: 'standing', extent: ext, headTopT: null, propsOut: true } as unknown as Anchors;
    const r = readHeight({ aFrom: idle, aTo: bare, Hf: sq(400), Ht: sq(558), k1600: 1 })!;
    expect(r.basis).toBeUndefined();
    expect(r.stature).toBeCloseTo(1.395, 2);
  });

  it('compares a pair with a props-out pose in it head to soles on both sides, not box to box (a victory against an attack is no 1.5 jump)', () => {
    const attack = pose('attack', 0.1, false); // 400 px tall, body 360
    const victory = pose('victory', 0.29, true); // 558 px tall, body 396
    const r = readHeight({ aFrom: attack, aTo: victory, Hf: sq(400), Ht: sq(558), k1600: 1 })!;
    expect(r.basis).toBe('body');
    expect(r.ratio).toBeCloseTo(1.1, 2);
    expect(r.flags).toEqual([]);
    // with no head to measure from on one side, the pair is reported unread, never failed on a box ratio that counts the sword
    const bare = { ...victory, headTopT: null } as unknown as Anchors;
    const u = readHeight({ aFrom: attack, aTo: bare, Hf: sq(400), Ht: sq(558), k1600: 1 })!;
    expect(u.flags).toEqual([]);
    expect(u.report).toContain('props-out-unread');
  });

  it('anchors a recorded painting with its props-out flag and the top of its REAL head (a virtual box is the real one grown about its centre by the record\'s ratio)', () => {
    const mask = { w: 8, h: 8, bits: new Uint8Array(64).fill(1), srcW: 200, srcH: 300 };
    const measure = { path: 'x', sha256: 'x', count: 1, subjects: { tidus: { poses: { victory: { size: [200, 300], head: [70, 40, 130, 100], stance: { x: 100, row: 290 }, prone: false, standing: true, ruled: { headRatio: 0.875 } } } } } } as never;
    const a = anchorsFor({ url: '/art/characters/tidus/victory.webp', mask, measure });
    expect(a.propsOut).toBe(true);
    // the box spans t 0.1333 to 0.3333 (centre 0.2333, half 0.1): the real head is 0.875 of it, so its top is at 0.2333 - 0.1 x 0.875
    expect(a.headTopT).toBeCloseTo(0.2333 - 0.0875, 3);
    const attack = anchorsFor({ url: '/art/characters/tidus/attack.webp', mask, measure: null });
    expect(attack.propsOut).toBe(false);
  });
});

describe('the HEIGHT reading allows for reading a stature off the screen (READ_SLACK)', () => {
  // an idle 400 px tall and a pose of `h` px, both planes drawn straight on: the stature is h / 400
  const reading = (h: number) => {
    const sq = (hh: number) => unitSquareToQuad([0, 0, 100, 0, 100, hh, 0, hh]);
    const ext = { top: 0, base: 1, left: 0, right: 1 };
    const idle = { pose: 'idle', cls: 'idle', extent: ext } as unknown as Anchors;
    const pose = { pose: 'hurt', cls: 'standing', extent: ext } as unknown as Anchors;
    return readHeight({ aFrom: idle, aTo: pose, Hf: sq(400), Ht: sq(h), k1600: 1 });
  };

  it('does not fail a painting the gate passes at the edge of its band: the hurt of X2 Ixion is 1.103 in the model and reads 1.107 on the screen', () => {
    expect(reading(442.8)!.flags).toEqual([]); // 1.107: inside 1.10 + the gate's 0.005 + the reading's 0.01
    expect(reading(443.9)!.flags).toEqual([]); // 1.110
  });

  it('still fails a pose that is really out of band', () => {
    expect(reading(448)!.flags).toEqual(['stature-high']); // 1.12
    expect(reading(300)!.flags).toEqual(['stature-low']); // 0.75
    expect(reading(358)!.flags).toEqual([]); // 0.895: the low edge is 0.90 - 0.015
    expect(reading(352)!.flags).toEqual(['stature-low']); // 0.88
  });
});
