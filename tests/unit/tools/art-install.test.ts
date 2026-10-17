/**
 * **The one install path for character art** (pose continuity, W1; both games): `tools/art-install.mjs` copies a set of paintings and their sidecars into a
 * TARGET folder, registers them and runs the pose gate. The roughly 17 throwaway installers of `D:/Tools/pyrefly-scratch` each looked after hard links, backups
 * and the ten-field sidecar and none registered what it installed (the Dark Aeons shipped with no stance row, FOC501-01). Bailey, 2026-10-16: "pose continuity
 * is the strongest recurring issue we need a permanent fix for this please." The cases here are the refusals: before it writes a byte the tool says why not,
 * and above all it will not write into a folder whose files are hard links (the live art and every mirror of it share their bytes).
 */
import { spawnSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import { existsSync, linkSync, mkdirSync, readFileSync, readdirSync, statSync, writeFileSync } from 'node:fs';
import { join, resolve } from 'node:path';
import sharp from 'sharp';
import { describe, expect, it, vi } from 'vitest';
import { applyInstall, hardLinked, planInstall, posesIn, register, sidecarProblems } from '../../../tools/art-install-lib.mjs';
import { IDLE_FIG, ROOT, TALL_FIG, must, paint, tempDir } from './pose-gate-fixtures.ts';

// each test spawns node processes or decodes images; under a full run of the suite the machine is busy, so the default 15 s is too short
vi.setConfig({ testTimeout: 120_000, hookTimeout: 120_000 });

const CLI = resolve(ROOT, 'tools', 'art-install.mjs');
const sha = (p: string): string => createHash('sha256').update(readFileSync(p)).digest('hex');
const sidecar = (over: Record<string, unknown> = {}): string => `${JSON.stringify({ width: 400, height: 500, baselineY: 450, facing: 'right', ...over })}\n`;

/** A source set: `<pose>.png` and `<pose>.json` for each pose, in a folder of its own. */
async function sourceSet(poses: Record<string, typeof IDLE_FIG> = { idle: IDLE_FIG, attack: TALL_FIG }, side: Record<string, unknown> = {}): Promise<string> {
  const dir = tempDir('art-install-src-');
  for (const [pose, fig] of Object.entries(poses)) {
    const file = await paint(dir, 'set', pose, fig);
    const flat = join(dir, `${pose}.png`);
    writeFileSync(flat, readFileSync(file));
    writeFileSync(join(dir, `${pose}.json`), sidecar(side));
  }
  return dir;
}

const cli = (args: string[]): { code: number; out: string; err: string } => {
  const r = spawnSync(process.execPath, [CLI, ...args], { encoding: 'utf8', timeout: 120_000 });
  return { code: r.status ?? -1, out: r.stdout, err: r.stderr };
};

describe('a target whose files are hard links (the live art and every mirror of it)', () => {
  /** A target holding `characters/zz-boss/idle.png` + `.json` as hard links to files kept elsewhere, as a mirror of the live art does. */
  async function linkedTarget(): Promise<{ target: string; original: string; originalBytes: Buffer }> {
    const live = tempDir('art-install-live-');
    const target = tempDir('art-install-mirror-');
    await paint(live, 'zz-boss', 'idle', IDLE_FIG);
    writeFileSync(join(live, 'characters', 'zz-boss', 'idle.json'), sidecar());
    mkdirSync(join(target, 'characters', 'zz-boss'), { recursive: true });
    for (const f of ['idle.png', 'idle.json']) linkSync(join(live, 'characters', 'zz-boss', f), join(target, 'characters', 'zz-boss', f));
    const original = join(live, 'characters', 'zz-boss', 'idle.png');
    return { target, original, originalBytes: readFileSync(original) };
  }

  it('counts the links of every file in a folder', async () => {
    const { target } = await linkedTarget();
    expect(hardLinked(join(target, 'characters', 'zz-boss'))).toEqual([{ name: 'idle.json', nlink: 2 }, { name: 'idle.png', nlink: 2 }]);
    const plain = tempDir('art-install-plain-');
    writeFileSync(join(plain, 'a.png'), 'x');
    expect(hardLinked(plain)).toEqual([]);
    expect(hardLinked(join(plain, 'missing'))).toEqual([]);
  });

  it('refuses to plan an install into it, and says the live art would change', async () => {
    const { target } = await linkedTarget();
    const from = await sourceSet();
    const plan = await planInstall({ target, items: [{ subject: 'zz-boss', from }] });
    expect(plan.ok).toBe(false);
    expect(plan.problems.some((p) => /2 file\(s\) in .* are hard links \(idle\.json x2, idle\.png x2\).*live art included/.test(p))).toBe(true);
  });

  it('refuses even a replace with a backup: a write there reaches every folder that shares the file', async () => {
    const { target } = await linkedTarget();
    const from = await sourceSet();
    const plan = await planInstall({ target, items: [{ subject: 'zz-boss', from }], replace: true, backup: tempDir('art-install-backup-') });
    expect(plan.ok).toBe(false);
    expect(plan.problems.join('\n')).toContain('hard links');
  });

  it('the command line exits 3 and writes nothing (the linked file is unchanged and no attack.png appears)', async () => {
    const { target, original, originalBytes } = await linkedTarget();
    const from = await sourceSet();
    const r = cli(['--target', target, '--subject', 'zz-boss', '--from', from]);
    expect(r.code).toBe(3);
    expect(r.err).toContain('REFUSED');
    expect(r.err).toContain('hard links');
    expect(r.err).toContain('nothing was written');
    expect(readFileSync(original).equals(originalBytes)).toBe(true);
    expect(readdirSync(join(target, 'characters', 'zz-boss')).sort()).toEqual(['idle.json', 'idle.png']);
    expect(statSync(join(target, 'characters', 'zz-boss', 'idle.png')).nlink).toBe(2);
  });

  it('a new subject folder in the same target is fine: nothing there is linked', async () => {
    const { target } = await linkedTarget();
    const from = await sourceSet();
    const plan = await planInstall({ target, items: [{ subject: 'zz-fresh', from }] });
    expect(plan.problems).toEqual([]);
    expect(plan.writes.map((w) => w.pose)).toEqual(['attack', 'idle']);
  });
});

describe('a plain install into a folder that holds copies', () => {
  it('writes each painting and sidecar beside a temporary name, renames it into place, and the sha256 equals the source\'s', async () => {
    const target = tempDir('art-install-target-');
    const from = await sourceSet();
    const plan = await planInstall({ target, items: [{ subject: 'zz-boss', from }] });
    expect(plan.problems).toEqual([]);
    expect(plan.ok).toBe(true);
    const done = applyInstall(plan);
    expect(done.map((d) => `${d.subject}/${d.pose}`)).toEqual(['zz-boss/attack', 'zz-boss/idle']);
    for (const d of done) {
      expect(sha(join(target, 'characters', 'zz-boss', `${d.pose}.png`))).toBe(d.sha);
      expect(sha(join(target, 'characters', 'zz-boss', `${d.pose}.png`))).toBe(sha(join(from, `${d.pose}.png`)));
      expect(readFileSync(join(target, 'characters', 'zz-boss', `${d.pose}.json`), 'utf8')).toBe(sidecar());
    }
    expect(readdirSync(join(target, 'characters', 'zz-boss')).filter((f) => f.includes('.tmp-'))).toEqual([]);
    expect(posesIn(join(target, 'characters', 'zz-boss'))).toEqual(['attack', 'idle']);
  });

  it('never overwrites an installed painting; --replace needs --backup and moves the old file there first', async () => {
    const target = tempDir('art-install-target-');
    const from = await sourceSet();
    applyInstall(await planInstall({ target, items: [{ subject: 'zz-boss', from }] }));
    const again = await planInstall({ target, items: [{ subject: 'zz-boss', from }] });
    expect(again.ok).toBe(false);
    expect(again.problems.join('\n')).toContain('an installed painting is never overwritten');

    const noBackup = await planInstall({ target, items: [{ subject: 'zz-boss', from }], replace: true });
    expect(noBackup.problems.join('\n')).toContain('--replace needs --backup');

    const backup = tempDir('art-install-backup-');
    const newer = await sourceSet({ idle: IDLE_FIG, attack: { ...TALL_FIG, y0: 100 } });
    const before = sha(join(target, 'characters', 'zz-boss', 'attack.png'));
    const plan = await planInstall({ target, items: [{ subject: 'zz-boss', from: newer, poses: ['attack'] }], replace: true, backup });
    expect(plan.problems).toEqual([]);
    const done = must(applyInstall(plan, { backup })[0], 'install result');
    expect(done.movedAside).toHaveLength(2);
    expect(sha(join(backup, 'zz-boss', 'attack.png'))).toBe(before);
    expect(sha(join(target, 'characters', 'zz-boss', 'attack.png'))).toBe(sha(join(newer, 'attack.png')));
    expect(sha(join(target, 'characters', 'zz-boss', 'attack.png'))).not.toBe(before);
  });

  it('refuses a source with no sidecar, a path in a sidecar, a field the game does not read, and a size that is not the painting\'s', async () => {
    const target = tempDir('art-install-target-');
    const noSide = await sourceSet({ idle: IDLE_FIG });
    writeFileSync(join(noSide, 'attack.png'), readFileSync(join(noSide, 'idle.png')));
    let plan = await planInstall({ target, items: [{ subject: 'zz-boss', from: noSide }] });
    expect(plan.problems.join('\n')).toContain('no sidecar attack.json beside the painting');

    const bad = await sourceSet({ idle: IDLE_FIG }, { prompt: 'a knight', notes: 'private', seed: 'C:\\Users\\Administrator\\x', width: 399 });
    plan = await planInstall({ target, items: [{ subject: 'zz-boss', from: bad }] });
    const text = plan.problems.join('\n');
    expect(text).toContain('fields the game does not read (notes)');
    expect(text).toContain('a path, a drive letter or a user name');
    expect(text).toContain('the sidecar says width 399, the painting is 400');
    expect(plan.ok).toBe(false);
    expect(sidecarProblems({ prompt: 'a knight \\(ff10\\), sword' }, 'x')).toEqual([]); // an escaped parenthesis is not a path
    expect(sidecarProblems([], 'x')).toEqual(['x: a sidecar is a JSON object']);
  });

  it('refuses a target that is not a folder, a set with no idle, a pose name the game cannot ask for, and a painting without alpha', async () => {
    expect((await planInstall({ target: join(tempDir('art-install-'), 'nope'), items: [{ subject: 'zz-boss', from: await sourceSet() }] })).problems.join('\n')).toContain('does not exist');
    const target = tempDir('art-install-target-');
    const noIdle = await sourceSet({ attack: TALL_FIG });
    expect((await planInstall({ target, items: [{ subject: 'zz-boss', from: noIdle }] })).problems.join('\n')).toContain('no idle.png in the set or in the target');
    const set = await sourceSet();
    expect((await planInstall({ target, items: [{ subject: 'zz-boss', from: set, poses: ['idle', 'attack@2x'] }] })).problems.join('\n')).toContain('not a pose name the game can ask for');
    expect((await planInstall({ target, items: [{ subject: 'Zz_Boss', from: set }] })).problems.join('\n')).toContain('lowercase kebab');
    const rgb = tempDir('art-install-rgb-');
    await sharp({ create: { width: 40, height: 50, channels: 3, background: '#ffffff' } }).png().toFile(join(rgb, 'idle.png'));
    writeFileSync(join(rgb, 'idle.json'), sidecar({ width: 40, height: 50 }));
    expect((await planInstall({ target, items: [{ subject: 'zz-boss', from: rgb }] })).problems.join('\n')).toContain('a painting is a PNG with an alpha channel');
    expect((await planInstall({ target, items: [] })).problems.join('\n')).toContain('nothing to install');
    expect((await planInstall({ target, items: [{ subject: 'zz-boss', from: set }, { subject: 'zz-boss', from: set }] })).problems.join('\n')).toContain('listed twice');
  });
});

/** A repository root whose tools/posescale/subjects.json annotates `subjects` (what `measure.py` needs before it will register them). */
function annotatedRoot(...subjects: string[]): string {
  const root = tempDir('art-install-root-');
  mkdirSync(join(root, 'tools', 'posescale'), { recursive: true });
  writeFileSync(join(root, 'tools', 'posescale', 'subjects.json'), JSON.stringify(Object.fromEntries(subjects.map((s) => [s, { game: 'foe', rowFromBaseline: true }]))));
  return root;
}

describe('registering and gating what was installed', () => {
  it('runs measure, table, then the gate on the installed subjects only, with the target as the art folder', () => {
    const target = tempDir('art-install-reg-');
    const root = annotatedRoot('zz-boss', 'zz-tiny');
    const calls: Array<{ cmd: string; args: string[]; env?: Record<string, string> }> = [];
    const logs: string[] = [];
    const r = register({
      subjects: ['zz-boss', 'zz-tiny'], target, root, python: 'py.exe', log: (l) => logs.push(l),
      run: (cmd, args, o) => { calls.push({ cmd, args, env: o.env }); return { status: 0 }; },
    });
    expect(r).toMatchObject({ ok: true, step: null });
    expect(calls.map((c) => (c.cmd === 'py.exe' ? c.args.slice(1, 4).join(' ') : 'gate'))).toEqual([
      'tools/posescale/measure.py measure zz-boss', 'tools/posescale/measure.py table', 'gate',
    ]);
    expect(must(calls[0], 'call 0').args).toEqual(['-s', 'tools/posescale/measure.py', 'measure', 'zz-boss', 'zz-tiny', '--write']);
    expect(must(calls[2], 'call 2').args.slice(1)).toEqual(['--check', '--art', resolve(target), '--root', root, '--subjects', 'zz-boss,zz-tiny']);
    for (const c of calls) expect(c.env?.PYREFLY_ART_DIR).toBe(resolve(target));
    expect(logs).toHaveLength(3);
  });

  it('stops at the first step that fails and says which, so a painting the gate refuses is never reported as installed well', () => {
    const calls: string[] = [];
    const root = annotatedRoot('zz-boss');
    const gateFails = register({ subjects: ['zz-boss'], target: tempDir('art-install-reg-'), root, python: 'py.exe', log: () => {}, run: (cmd) => { calls.push(cmd); return { status: cmd === 'py.exe' ? 0 : 1 }; } });
    expect(gateFails).toMatchObject({ ok: false, step: 'gate' });
    expect(calls).toHaveLength(3);
    calls.length = 0;
    const measureFails = register({ subjects: ['zz-boss'], target: tempDir('art-install-reg-'), root, python: 'py.exe', log: () => {}, run: (cmd) => { calls.push(cmd); return { status: 1 }; } });
    expect(measureFails).toMatchObject({ ok: false, step: 'measure' });
    expect(calls).toHaveLength(1);
  });
});

describe('node tools/art-install.mjs', () => {
  it('has no default target: nothing is installed into public/art by accident', async () => {
    const from = await sourceSet();
    const r = cli(['--subject', 'zz-boss', '--from', from]);
    expect(r.code).toBe(2);
    expect(r.err).toContain('--target <the art folder> is required');
    expect(r.err).toContain('no default');
  });

  it('exits 2 for no subject or plan, and for a --subject with neither --from nor --register', () => {
    const target = tempDir('art-install-target-');
    expect(cli(['--target', target]).code).toBe(2);
    expect(cli(['--target', target, '--subject', 'zz-boss']).code).toBe(2);
  });

  it('--dry checks the whole plan and writes nothing', async () => {
    const target = tempDir('art-install-target-');
    const from = await sourceSet();
    const r = cli(['--target', target, '--subject', 'zz-boss', '--from', from, '--dry']);
    expect(r.code).toBe(0);
    expect(r.out).toContain('--dry, 2 painting(s) checked, nothing written');
    expect(existsSync(join(target, 'characters'))).toBe(false);
  });

  it('exits 1 when the paintings are installed but registration did not finish: they are NOT shippable', async () => {
    const target = tempDir('art-install-target-');
    const from = await sourceSet();
    const r = cli(['--target', target, '--subject', 'zz-boss', '--from', from, '--root', annotatedRoot('zz-boss'), '--python', join(tempDir('art-install-nopy-'), 'no-such-python.exe')]);
    expect(r.code).toBe(1);
    expect(r.out).toContain('installed 2 painting(s)');
    expect(r.err).toContain('the measure step failed');
    expect(r.err).toContain('NOT shippable');
    expect(existsSync(join(target, 'characters', 'zz-boss', 'attack.png'))).toBe(true);
  });

  it('reads a plan file with several subjects', async () => {
    const target = tempDir('art-install-target-');
    const a = await sourceSet();
    const b = await sourceSet({ idle: IDLE_FIG });
    const plan = join(tempDir('art-install-plan-'), 'plan.json');
    writeFileSync(plan, JSON.stringify({ items: [{ subject: 'zz-one', from: a }, { subject: 'zz-two', from: b }] }));
    const r = cli(['--target', target, '--plan', plan, '--dry']);
    expect(r.code).toBe(0);
    expect(r.out).toContain('zz-one/attack');
    expect(r.out).toContain('zz-two/idle');
    expect(r.out).toContain('3 painting(s) checked');
  });
});
