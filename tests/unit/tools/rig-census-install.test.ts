/**
 * **Rigs in the pose gate and in the installer** (the rig program; both games). A pose a gate-ok rig serves is reported `rigged` by the pose gate, its painting row staying the fallback;
 * a rig that is not ok changes nothing (a note, never a failure, never a pass it did not earn); and `tools/art-install.mjs --rig` copies a rig into the rig root only through the gate.
 */
import { spawnSync } from 'node:child_process';
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it, vi } from 'vitest';
import { runGate } from '../../../tools/pose-gate-lib.mjs';
import { gateRig, stampRig } from '../../../tools/rig/rig-gate-lib.mjs';
import { applyRigInstall, planRigInstall } from '../../../tools/rig/rig-install.mjs';
import { fakeRoot, installedTable, FIXTURE_DECISIONS, modelInputs } from './pose-gate-fixtures.ts';
import { POSES, ROOT, SUBJECT, puppetTable, puppetWorld, tempDir, type RigJson } from './rig-gate-fixtures.ts';

vi.setConfig({ testTimeout: 120_000, hookTimeout: 120_000 });

/** A puppet world whose rig is gated and stamped ok, with the rig placed at `<rigs>/zz-puppet`. */
async function stampedWorld() {
  const w = await puppetWorld();
  const table = await installedTable(w.art, puppetTable() as never, SUBJECT);
  const inputs = await modelInputs(w.art, table);
  const g = await gateRig({ rig: w.rig, inputs, blends: true });
  expect(g.failures).toEqual([]);
  stampRig(w.rig, g);
  const rigs = join(w.rig, '..');
  return { ...w, table, inputs, rigs };
}

describe('the pose gate reports what a rig serves', () => {
  it('relabels the passing paintings of every pose the rig has a key for as `rigged`, and keeps a failing row failing', async () => {
    const w = await stampedWorld();
    const plain = await runGate({ root: ROOT, inputs: w.inputs, ledger: null, concurrency: 1, decisions: FIXTURE_DECISIONS, pin: null });
    expect(plain.entries.map((e) => e.outcome)).not.toContain('rigged');
    const withRig = await runGate({ root: ROOT, inputs: await modelInputs(w.art, w.table), ledger: null, concurrency: 1, decisions: FIXTURE_DECISIONS, pin: null, rigs: { dir: w.rigs } });
    expect(withRig.rigs).toEqual([{ subject: SUBJECT, ok: true, mode: 'full', keys: expect.arrayContaining(Object.keys(POSES)), why: null }]);
    for (const e of withRig.entries) {
      const before = plain.entries.find((p) => p.key === e.key)!;
      if (before.outcome === 'pass' || before.outcome === 'waived') expect(e).toMatchObject({ outcome: 'rigged', rigged: true, was: before.outcome });
      else expect(e.outcome).toBe(before.outcome); // a failing row still fails
    }
    expect(withRig.entries.filter((e) => e.outcome === 'rigged').length).toBeGreaterThan(0);
    expect(withRig.failures).toEqual(plain.failures);
  });

  it('counts nothing for a rig whose stamp is stale (a hand edit after the gate), and says why', async () => {
    const w = await stampedWorld();
    const raw = JSON.parse(readFileSync(join(w.rig, 'rig.json'), 'utf8')) as RigJson;
    raw.keys.attack.bones.upperarm.rot = -40;
    writeFileSync(join(w.rig, 'rig.json'), JSON.stringify(raw));
    const r = await runGate({ root: ROOT, inputs: await modelInputs(w.art, w.table), ledger: null, concurrency: 1, decisions: FIXTURE_DECISIONS, pin: null, rigs: { dir: w.rigs, mode: 'stamp' } });
    expect(r.entries.map((e) => e.outcome)).not.toContain('rigged');
    expect(r.rigs[0]).toMatchObject({ ok: false });
    expect(r.rigs[0]?.why).toContain('gate-stale');
    expect(r.notes.some((n) => n.message.includes('rig not counted'))).toBe(true);
  });

  it('counts nothing for a rig that the gate refuses today even though its stamp says ok (a typed-in stamp)', async () => {
    const w = await stampedWorld();
    const raw = JSON.parse(readFileSync(join(w.rig, 'rig.json'), 'utf8')) as RigJson;
    raw.keys.hurt.root = { dy: -30 }; // floats: the gate would refuse it
    writeFileSync(join(w.rig, 'rig.json'), JSON.stringify(raw));
    const g = await gateRig({ rig: w.rig, inputs: w.inputs, blends: false });
    expect(g.status).toBe('refused');
    // forge the stamp the way a hand would: put the old gate block back with a digest recomputed over the new content
    const forged = { ...stampRig(w.rig, { ...g, status: 'ok', failures: [], keys: g.keys.map((k) => ({ ...k, ok: true })) }) };
    expect(forged.status).toBe('ok');
    const r = await runGate({ root: ROOT, inputs: await modelInputs(w.art, w.table), ledger: null, concurrency: 1, decisions: FIXTURE_DECISIONS, pin: null, rigs: { dir: w.rigs, mode: 'full' } });
    expect(r.rigs[0]?.ok).toBe(false);
    expect(r.rigs[0]?.why).toContain('refuses it now');
    expect(r.entries.map((e) => e.outcome)).not.toContain('rigged');
  });

  it('is silent about a rig root that is not there', async () => {
    const w = await stampedWorld();
    const r = await runGate({ root: ROOT, inputs: await modelInputs(w.art, w.table), ledger: null, concurrency: 1, decisions: FIXTURE_DECISIONS, pin: null, rigs: { dir: join(tempDir('no-rigs-'), 'absent') } });
    expect(r.rigs).toEqual([]);
  });
});

describe('node tools/pose-gate.mjs --check --rigs', () => {
  it('reports the rigged poses in its summary line, and says nothing about rigs without the option', async () => {
    const w = await stampedWorld();
    const cli = (extra: string[]): { code: number; out: string } => {
      const r = spawnSync(process.execPath, [join(ROOT, 'tools', 'pose-gate.mjs'), '--check', '--root', fakeRoot(w.table), '--art', w.art, '--subjects', SUBJECT, '--quiet', ...extra], { encoding: 'utf8', timeout: 120_000 });
      return { code: r.status ?? -1, out: r.stdout };
    };
    const plain = cli([]);
    expect(plain.out).not.toContain('rigged');
    const withRigs = cli(['--rigs', w.rigs]);
    expect(withRigs.out).toMatch(/pose-gate: \d+ paintings of 1 subjects: \d+ pass, \d+ waived, [1-9]\d* rigged, \d+ exempt, \d+ fail;/);
    expect(withRigs.code).toBe(plain.code);
  });
});

describe('the rig installer', () => {
  it('copies a gated rig into the rig root, files and all, and refuses to overwrite it without --replace and a backup', async () => {
    const w = await stampedWorld();
    const rigsRoot = tempDir('rig-root-');
    const items = [{ subject: SUBJECT, from: w.rigs }];
    const plan = await planRigInstall({ rigsRoot, artDir: w.art, root: ROOT, inputs: w.inputs, items });
    expect(plan.problems).toEqual([]);
    expect(applyRigInstall(plan)[0]?.files).toBeGreaterThan(5);
    expect(existsSync(join(rigsRoot, SUBJECT, 'rig.json'))).toBe(true);
    expect(readFileSync(join(rigsRoot, SUBJECT, 'rig.json'), 'utf8')).toBe(readFileSync(join(w.rig, 'rig.json'), 'utf8'));
    const again = await planRigInstall({ rigsRoot, artDir: w.art, root: ROOT, inputs: w.inputs, items });
    expect(again.ok).toBe(false);
    expect(again.problems.join(' ')).toContain('--replace --backup');
    const backup = tempDir('rig-backup-');
    const replaced = await planRigInstall({ rigsRoot, artDir: w.art, root: ROOT, inputs: w.inputs, items, replace: true, backup });
    expect(replaced.problems).toEqual([]);
    applyRigInstall(replaced, { backup });
    expect(existsSync(join(backup, 'rigs', SUBJECT, 'rig.json'))).toBe(true);
  });

  it('refuses a rig the gate has not stamped, and one whose costume is not the installed painting', async () => {
    const w = await puppetWorld(); // never gated
    const rigsRoot = tempDir('rig-root-');
    const plan = await planRigInstall({ rigsRoot, artDir: w.art, root: ROOT, inputs: w.inputs, items: [{ subject: SUBJECT, from: join(w.rig, '..') }] });
    expect(plan.ok).toBe(false);
    expect(plan.problems.join('\n')).toContain('not stamped ok');
    const s = await stampedWorld();
    const other = tempDir('other-art-');
    mkdirSync(join(other, 'characters', SUBJECT), { recursive: true });
    const sharp = (await import('sharp')).default;
    const idle = await sharp(join(s.art, 'characters', SUBJECT, 'idle.png')).modulate({ brightness: 1.1 }).png().toBuffer();
    writeFileSync(join(other, 'characters', SUBJECT, 'idle.png'), idle);
    const stale = await planRigInstall({ rigsRoot, artDir: other, root: ROOT, items: [{ subject: SUBJECT, from: s.rigs }], inputs: await modelInputs(other, s.table) });
    expect(stale.ok).toBe(false);
    expect(stale.problems.join('\n')).toContain('costume-stale');
  });

  it('refuses a rig root inside public/ and a missing one', async () => {
    const w = await stampedWorld();
    const inPublic = await planRigInstall({ rigsRoot: join(ROOT, 'public', 'art', 'rigs-nope'), artDir: w.art, root: ROOT, inputs: w.inputs, items: [{ subject: SUBJECT, from: w.rigs }] });
    expect(inPublic.problems.join('\n')).toMatch(/inside public\/|does not exist/);
    const missing = await planRigInstall({ rigsRoot: join(tempDir('x-'), 'nope'), artDir: w.art, root: ROOT, inputs: w.inputs, items: [{ subject: SUBJECT, from: w.rigs }] });
    expect(missing.problems.join('\n')).toContain('does not exist');
  });
});
