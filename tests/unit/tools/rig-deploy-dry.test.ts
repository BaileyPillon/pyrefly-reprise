/**
 * **A bad rig refuses the deploy, in dry mode, before anything is built or uploaded** (the rig program, 2026-10-17; both games, shared plumbing). The driver's rule (b): the deploy runs
 * `rig-gate --verify` on every shipped rig, any refusal stops it, and `--owner-override` does not bypass it, the same as the pose gate.
 *
 * These run the REAL `tools/deploy-pages.mjs --dry-run` as a child process against a fake repository root: a copy of `tools/`, a junction to this repository's `node_modules`, and a
 * `public/art` that holds the puppet's art and one rig folder. The deploy finds its root from its own location, so nothing here touches the real `public/art`, the real release or the network
 * (a dry run asks Cloudflare nothing). The cases are the rig as it can go wrong: nothing stamped, a hand edit after the stamp, partial coverage, a missing 1x tier, a file nobody vetted, a
 * folder that is not a rig; and the same refusals with `--owner-override` and `--skip-tests`, which must not change them.
 */
import { spawnSync } from 'node:child_process';
import { cpSync, existsSync, mkdirSync, readFileSync, rmSync, symlinkSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { beforeAll, describe, expect, it, vi } from 'vitest';
import { gateRig, stampRig } from '../../../tools/rig/rig-gate-lib.mjs';
import { writeTiers } from '../../../tools/rig/rig-tiers.mjs';
import { ROOT, SUBJECT, puppetWorld, tempDir, type RigJson } from './rig-gate-fixtures.ts';

vi.setConfig({ testTimeout: 180_000, hookTimeout: 180_000 });

let world: Awaited<ReturnType<typeof puppetWorld>>;

let base: string;

/**
 * A fake repository root with the real tools, this repository's node_modules and a public/art made of the puppet's art plus its rig (built once; the tools are 14 MB). Each case gets the root
 * with a fresh copy of the rig (and none of what an earlier case added), mutated as it asks.
 */
function fakeRoot(mutate?: (rig: string, root: string) => void): { root: string; rig: string } {
  if (!base) {
    base = tempDir('rig-deploy-');
    cpSync(join(ROOT, 'tools'), join(base, 'tools'), { recursive: true, filter: (src) => !/[\\/]zz-[^\\/]*$/.test(src) && !/__pycache__/.test(src) });
    // The deploy tools read the title's release notes and the Behind the Scenes switch from the source tree (release 39.5, `tools/release-notes.mjs`, `tools/dist-filter.mjs`): two import-free leaf folders.
    cpSync(join(ROOT, 'src', 'app', 'changelog'), join(base, 'src', 'app', 'changelog'), { recursive: true });
    symlinkSync(join(ROOT, 'node_modules'), join(base, 'node_modules'), 'junction');
    writeFileSync(join(base, 'package.json'), JSON.stringify({ name: 'fake', type: 'module' }));
    mkdirSync(join(base, 'public'), { recursive: true });
    cpSync(world.art, join(base, 'public', 'art'), { recursive: true });
  }
  const root = base;
  rmSync(join(root, 'public', 'art', 'rigs'), { recursive: true, force: true });
  const rig = join(root, 'public', 'art', 'rigs', SUBJECT);
  cpSync(world.rig, rig, { recursive: true });
  mutate?.(rig, root);
  return { root, rig };
}

function dryRun(root: string, extra: string[] = []): { code: number | null; out: string } {
  const r = spawnSync(process.execPath, [join(root, 'tools', 'deploy-pages.mjs'), '--dry-run', '--host=cloudflare', ...extra], { cwd: root, encoding: 'utf8', timeout: 150_000 });
  return { code: r.status, out: `${r.stdout}\n${r.stderr}` };
}

const edit = (dir: string, f: (rig: RigJson) => void): void => {
  const rig = JSON.parse(readFileSync(join(dir, 'rig.json'), 'utf8')) as RigJson;
  f(rig);
  writeFileSync(join(dir, 'rig.json'), JSON.stringify(rig));
};

beforeAll(async () => {
  world = await puppetWorld();
  stampRig(world.rig, await gateRig({ rig: world.rig, inputs: world.inputs, blends: false }));
  await writeTiers(world.rig);
});

describe('the real deploy, --dry-run, against a fake root', () => {
  it('a sound rig passes the rig gate and the run goes on to the checks behind it (it stops there only because the fake root has no audio)', () => {
    const f = fakeRoot();
    const r = dryRun(f.root, ['--skip-tests']);
    expect(r.out).toMatch(/rig gate: 1 rig\(s\) in .*, 1 verified/);
    expect(r.out).not.toMatch(/the rig gate refuses this deploy/);
    expect(r.out).toMatch(/preflight: node tools\/audio\/qa\.mjs/); // past the rig gate
  });

  it.each([
    ['nothing is stamped', (rig: string) => edit(rig, (j) => { delete j.gate; }), /gate-not-ok/],
    ['a hand edit after the stamp', (rig: string) => edit(rig, (j) => { j.keys.attack.bones.upperarm.rot = -0.5; }), /gate-stale/],
    ['partial coverage', (rig: string) => edit(rig, (j) => { j.gate.coverage = 'partial'; j.gate.uncovered = ['item']; }), /gate-partial/],
    ['the 1x tier is missing', (rig: string) => rmSync(join(rig, '1x'), { recursive: true }), /tier/],
    ['a file nobody vetted is in the folder', (rig: string) => writeFileSync(join(rig, 'readme.txt'), 'x'), /files {2}readme\.txt/],
    ['a folder that is not a rig', (_rig: string, root: string) => mkdirSync(join(root, 'public', 'art', 'rigs', 'zz-loose'), { recursive: true }), /zz-loose/],
  ])('REFUSES when %s, names it, and stops before the type check, the tests, the audio check and the build', (_why, mutate, expected) => {
    const f = fakeRoot(mutate);
    const r = dryRun(f.root);
    expect(r.code).toBe(1);
    expect(r.out).toMatch(/FAIL: the rig gate refuses this deploy/);
    expect(r.out).toMatch(expected);
    expect(r.out).not.toMatch(/preflight: (npx tsc|npx vitest|node tools\/audio\/qa\.mjs)/); // nothing after it ran
    expect(r.out).not.toMatch(/\[deploy\] (building|publishing|kicking)/); // the plan of the host is printed first; the steps are not
  });

  it('--owner-override and --skip-tests do not change a refusal: the words are not the rig gate\'s to waive', () => {
    const f = fakeRoot((rig) => edit(rig, (j) => { j.gate.coverage = 'partial'; }));
    for (const extra of [['--owner-override=Bailey: ship it now please'], ['--skip-tests'], ['--skip-tests', '--allow-dirty', '--owner-override=Bailey: ship it now please']]) {
      const r = dryRun(f.root, extra);
      expect(r.code, extra.join(' ')).toBe(1);
      expect(r.out).toMatch(/FAIL: the rig gate refuses this deploy/);
      expect(r.out).toMatch(/--owner-override and --skip-tests do not cover it/);
    }
  });

  it('a public/art with no rigs at all says so and the run goes on', () => {
    const f = fakeRoot((rig) => rmSync(join(rig, '..'), { recursive: true }));
    expect(existsSync(join(f.root, 'public', 'art', 'rigs'))).toBe(false);
    const r = dryRun(f.root, ['--skip-tests']);
    expect(r.out).toMatch(/rig gate: no rigs ship in this build/);
    expect(r.out).toMatch(/preflight: node tools\/audio\/qa\.mjs/);
  });
});

describe('where the gate sits in the deploy (structure: the one thing a dry run cannot show is the build step)', () => {
  const src = readFileSync(join(ROOT, 'tools', 'deploy-pages.mjs'), 'utf8').replace(/\r\n/g, '\n');
  it('is called before the dry-run exit, the type check, the tests and the audio check, outside every flag that skips something', () => {
    const at = src.indexOf('await enforceShippedRigs(');
    expect(at).toBeGreaterThan(0);
    expect(at).toBeLessThan(src.indexOf('if (DRY_RUN) {'));
    expect(at).toBeLessThan(src.indexOf('if (!SKIP_TESTS) {'));
    expect(at).toBeLessThan(src.indexOf("join(ROOT, 'tools', 'audio', 'qa.mjs')"));
    const lead = src.slice(src.lastIndexOf('\n', at - 1) - 5, at);
    expect(lead).not.toMatch(/SKIP_TESTS|OWNER_OVERRIDE|ALLOW_DIRTY/);
    const preflight = src.slice(src.indexOf("log('preflight: the rig gate"), at);
    expect(preflight).not.toMatch(/SKIP_TESTS|OWNER_OVERRIDE/);
  });
  it('is called again on the build, after the art identity gates and before the manifest of the artifact is written', () => {
    const at = src.indexOf('enforceBuiltRigs({ dist: DIST');
    expect(at).toBeGreaterThan(src.indexOf('enforceBuiltPaintings({ dist: DIST'));
    expect(at).toBeLessThan(src.indexOf('hashing and decode-checking every shipped file'));
    expect(src.slice(at - 200, at + 200)).not.toMatch(/OWNER_OVERRIDE|SKIP_TESTS/);
  });
});
