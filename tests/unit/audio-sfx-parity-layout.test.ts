/**
 * SFX parity, the pack layout and the audio budget (both games): the planner (`tools/audio/sfx-parity-layout-lib.mjs`), the rows it
 * plans (`docs/audio/sfx-parity-rows.json`), the coverage that says where each row can be heard
 * (`tools/audio/sfx-parity-coverage.mjs`), and the tool that prints it (`tools/audio/sfx-parity-layout.mjs`).
 *
 * What this pins: the byte arithmetic and the order the levers come in (the v2 repack, boss packs at q3 biggest first, shorter
 * long-tail rows, then a bigger budget; the ones beyond the spec's list marked as needing a yes); a pack over the 5 MB sprite
 * gate is caught; the rows are well formed and sit in packs a chapter loads; and no row's sound can be heard in a chapter that
 * does not load its pack (it would be silent there).
 */
import { spawnSync } from 'node:child_process';
import { readFileSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { describe, expect, it } from 'vitest';
import { GAP_SECONDS, PACK_GATE_BYTES, RATE_BPS, groupRows, packBytes, planLayout, type LayoutRow } from '../../tools/audio/sfx-parity-layout-lib.mjs';
import { BOSS_PACKS, PARITY_PACK_NAME, corePack } from '../../src/audio/sfxV2/packs.ts';
import { FFX_UNHOOKED } from '../../src/audio/sfxV2/eventCuesFfx.ts';
import { FFX2_UNHOOKED } from '../../src/audio/sfxV2/eventCuesFfx2.ts';
import { createCoverage } from '../../tools/audio/sfx-parity-coverage.mjs';
import { AUDIO_BUDGET_BYTES } from '../../tools/audio/manifest-io.mjs';

const ROOT = resolve(import.meta.dirname, '../..');
const row = (id: string, pack: string, secs: number, game: LayoutRow['game'] = pack.startsWith('ffx2') ? 'ffx2' : 'ffx'): LayoutRow => ({ id, pack, secs, game });

describe('the byte arithmetic', () => {
  it('costs a pack its cues\' seconds plus a 50 ms gap before the first and after each, at the quality\'s rate', () => {
    expect(packBytes(100, 10, 'V0')).toBe(Math.round((100 + GAP_SECONDS * 11) * RATE_BPS.V0));
    expect(packBytes(100, 10, 'q3')).toBeLessThan(packBytes(100, 10, 'V0'));
    expect(packBytes(100, 10, 'q5')).toBeLessThan(packBytes(100, 10, 'q3'));
    // The measured rates: the shipped v2 sprite is 25.7 KB/s, and q3 costs about two thirds of V0.
    expect(RATE_BPS.V0).toBeCloseTo(4_891_552 / 190.323946, -2);
    expect(RATE_BPS.q3 / RATE_BPS.V0).toBeGreaterThan(0.6);
    expect(RATE_BPS.q3 / RATE_BPS.V0).toBeLessThan(0.7);
  });

  it('carries the menu assets both games share in each game\'s core pack', () => {
    const g = groupRows([row('ffx.ui.tick', 'ffx-core', 0.5, 'both'), row('ffx.fire.t1', 'ffx-core', 2), row('ffx2.fire', 'ffx2-core', 2)]);
    expect(g.get('ffx-core')!.rows.map((r) => r.id)).toEqual(['ffx.ui.tick', 'ffx.fire.t1']);
    expect(g.get('ffx2-core')!.rows.map((r) => r.id)).toEqual(['ffx.ui.tick', 'ffx2.fire']);
    expect(g.get('ffx2-core')!.seconds).toBe(2.5);
  });

  it('leaves out a row with no length (a held row)', () => {
    expect([...groupRows([row('ffx.hold.x', 'ffx-core', 0)]).keys()]).toEqual([]);
  });
});

describe('the levers, in the order the accepted rule gives', () => {
  const base = { budgetBytes: 100e6, shippedBytes: 90e6 };

  it('changes nothing when the set fits at V0', () => {
    const plan = planLayout({ ...base, rows: [row('a', 'ffx-core', 40), row('b', 'ffx-flux', 20)] });
    expect(plan.fits).toBe(true);
    expect(plan.levers).toEqual([]);
    expect(plan.packs.map((p) => p.quality)).toEqual(['V0', 'V0']);
    expect(plan.headroomBytes).toBeGreaterThan(0);
  });

  it('moves boss packs to q3, the biggest first and no more than it takes', () => {
    const rows = [row('core', 'ffx-core', 60), row('big', 'ffx-final-aeon', 80), row('mid', 'ffx-lady', 50), row('small', 'ffx-flux', 20)];
    const v0 = rows.reduce((s, r) => s + r.secs, 0) * RATE_BPS.V0;
    // Allowance a little under the V0 total: converting the biggest boss pack is enough.
    const plan = planLayout({ ...base, rows, shippedBytes: 100e6 - v0 + 0.5e6 });
    const q3 = plan.packs.filter((p) => p.quality === 'q3').map((p) => p.pack);
    expect(q3).toEqual(['ffx-final-aeon']);
    expect(plan.levers.filter((l) => l.lever === 1)).toHaveLength(1);
    expect(plan.fits).toBe(true);
    expect(plan.packs.find((p) => p.pack === 'ffx-core')!.quality).toBe('V0'); // a core pack is not touched by lever 1
  });

  it('names the long rows to shorten, longest first, never touching a row', () => {
    const rows = [...[1, 2, 3, 4, 5, 6].map((i) => row(`core${i}`, 'ffx-core', 5)), row('l1', 'ffx-lady', 14.5), row('l2', 'ffx-lady', 12), row('l3', 'ffx-lady', 3)];
    const v0 = packBytes(30, 6, 'V0') + packBytes(29.5, 3, 'V0');
    const plan = planLayout({ ...base, rows, shippedBytes: 100e6 - v0 + 0.7e6 });
    expect(plan.packs.find((p) => p.pack === 'ffx-lady')!.quality).toBe('q3');
    // q3 on the boss pack leaves the set a little over, so the longest row is named for cutting.
    expect(plan.trimCandidates.map((t) => t.row)[0]).toBe('l1');
    expect(plan.trimCandidates[0]).toMatchObject({ secs: 14.5, cutTo: 7 });
    expect(plan.trimCandidates.every((t) => t.secs > 6)).toBe(true);
    expect(rows.find((r) => r.id === 'l1')!.secs).toBe(14.5);
  });

  it('puts the levers beyond the spec\'s list after it and marks them as needing a yes; reports what is still missing', () => {
    const rows = [row('core', 'ffx-core', 150), row('boss', 'ffx-flux', 60)];
    const plan = planLayout({ ...base, rows, shippedBytes: 99.5e6 });
    expect(plan.fits).toBe(false);
    const order = plan.levers.map((l) => l.lever);
    expect(order.indexOf(1)).toBeLessThan(order.indexOf('x'));
    expect(plan.levers.filter((l) => l.lever === 'x').every((l) => l.needsYes)).toBe(true);
    expect(plan.levers.at(-1)).toMatchObject({ lever: 3 });
    expect(plan.problems.join(' ')).toMatch(/over the audio budget/);
  });

  it('counts the v2 repack first and gives it as lever 0', () => {
    const rows = [row('core', 'ffx-core', 100), row('boss', 'ffx-flux', 40)];
    const without = planLayout({ ...base, rows, shippedBytes: 100e6 - 3e6 });
    const withRepack = planLayout({ ...base, rows, shippedBytes: 100e6 - 3e6, repackSavingBytes: 3e6 });
    expect(withRepack.levers[0]).toMatchObject({ lever: 0, savedBytes: 3e6 });
    expect(withRepack.allowanceBytes).toBe(without.allowanceBytes + 3e6);
    expect(withRepack.packs.filter((p) => p.quality !== 'V0').length).toBeLessThanOrEqual(without.packs.filter((p) => p.quality !== 'V0').length);
  });

  it('catches a pack over the 5 MB sprite gate, and a core pack taken to q3 for it needs a yes', () => {
    const rows = [row('c', 'ffx-core', 215)];
    expect(packBytes(215, 1, 'V0')).toBeGreaterThan(PACK_GATE_BYTES);
    const plan = planLayout({ ...base, rows, shippedBytes: 80e6 });
    expect(plan.packs[0]!.quality).toBe('q3');
    expect(plan.packs[0]!.bytes).toBeLessThan(PACK_GATE_BYTES);
    expect(plan.levers.find((l) => l.what.includes('sprite gate'))?.needsYes).toBe(true);
    const tooBig = planLayout({ ...base, rows: [row('c', 'ffx-core', 400)], shippedBytes: 80e6 });
    expect(tooBig.problems.join(' ')).toMatch(/cut the pack in two/);
    expect(tooBig.fits).toBe(false);
  });

  it('keeps the games apart: an FFX pack and an FFX-2 pack are planned separately', () => {
    const plan = planLayout({ ...base, rows: [row('a', 'ffx-core', 10), row('b', 'ffx2-core', 10)] });
    expect(plan.packs.map((p) => p.pack)).toEqual(['ffx-core', 'ffx2-core']);
    expect(plan.packs.every((p) => p.kind === 'core')).toBe(true);
  });
});

// ------------------------------------------------------------------ the rows

interface RowsFile { rows: Array<{ id: string; game: 'ffx' | 'ffx2' | 'both'; wave: number; hold?: true; sharedWith?: string; pack?: string; secs?: number; cat?: string }> }
const rowsFile = JSON.parse(readFileSync(join(ROOT, 'docs', 'audio', 'sfx-parity-rows.json'), 'utf8')) as RowsFile;
const rows = rowsFile.rows;

describe('the plan\'s rows', () => {
  it('are 214, each once, each in exactly one of: a pack with a length, held, or shared', () => {
    expect(rows).toHaveLength(214);
    expect(new Set(rows.map((r) => r.id)).size).toBe(214);
    for (const r of rows) {
      const kinds = [r.hold ? 'hold' : null, r.sharedWith ? 'shared' : null, r.pack ? 'pack' : null].filter(Boolean);
      expect(kinds, r.id).toHaveLength(1);
      if (r.pack) expect(r.secs! > 0, `${r.id} has a length`).toBe(true);
    }
  });

  it('keep a pack in their own game, and only the four menu assets are shared by both', () => {
    for (const r of rows.filter((x) => x.pack)) {
      expect(r.pack, r.id).toMatch(PARITY_PACK_NAME);
      const game = r.id.startsWith('ffx2.') ? 'ffx2' : 'ffx';
      expect(r.pack!.startsWith(`${game}-`), `${r.id} -> ${r.pack}`).toBe(true);
      expect(r.game === 'both' ? r.id : 'ok').toMatch(/^ffx\.ui\.(tick|cancel|error|turn)$|^ok$/);
    }
    expect(rows.filter((r) => r.game === 'both').map((r) => r.id).sort()).toEqual(['ffx.ui.cancel', 'ffx.ui.error', 'ffx.ui.tick', 'ffx.ui.turn']);
  });

  it('sit in packs a chapter loads (a core pack, or one a chapter\'s boss list names)', () => {
    const loadable = new Set([corePack('ffx'), corePack('ffx2'), ...Object.values(BOSS_PACKS).flat()]);
    for (const r of rows.filter((x) => x.pack)) expect(loadable.has(r.pack!), `${r.id} -> ${r.pack}`).toBe(true);
  });

  it('have a length close to the plan\'s: no row longer than 15 s, the long beds are the known ones', () => {
    expect(Math.max(...rows.map((r) => r.secs ?? 0))).toBeLessThanOrEqual(14.5);
    for (const r of rows.filter((x) => (x.secs ?? 0) > 10)) expect(r.id, 'a long bed').toMatch(/slow|dispel|aeon\.(shiva|yojimbo)|boss\.(fa|lady)/);
  });
});

describe('the coverage: no row\'s sound can be heard where its pack is not loaded', () => {
  const cov = createCoverage();
  const unhooked = { ...FFX_UNHOOKED, ...FFX2_UNHOOKED };
  const planned = rows.filter((r) => r.pack && !(unhooked[r.id]?.kind === 'open'));

  it('reads every chapter of both games', () => {
    expect(cov.facts.filter((c) => c.game === 'ffx').length).toBeGreaterThanOrEqual(11);
    expect(cov.facts.filter((c) => c.game === 'ffx2').length).toBeGreaterThanOrEqual(8);
  });

  it('finds Seymour Flux\'s Banish in Natus\' chapter too, which loads no Flux pack, so the row is in the core pack', () => {
    expect(cov.rowChapters('ffx.boss.flux.banish').has('seymour-natus')).toBe(true);
    expect(rows.find((r) => r.id === 'ffx.boss.flux.banish')!.pack).toBe('ffx-core');
  });

  it('keeps each boss row inside the chapters that load its pack', () => {
    const gaps: string[] = [];
    for (const r of planned) {
      const heard = cov.rowChapters(r.id);
      const loaded = cov.packChapters(r.pack!);
      for (const c of heard) if (!loaded.has(c)) gaps.push(`${r.id} (${r.pack}) is heard in ${c}`);
    }
    expect(gaps).toEqual([]);
  });

  it('puts the foes of the Leblanc chapter in the pack that chapter loads, and nowhere else', () => {
    for (const id of ['ormi', 'logos', 'leblanc', 'goon', 'fgoon']) {
      const heard = [...cov.rowChapters(`ffx2.lb.${id}.attack`)].sort();
      expect(heard, id).toEqual(['exp-leblanc', 'ffx2-leblanc']);
      expect(rows.find((r) => r.id === `ffx2.lb.${id}.attack`)!.pack).toBe('ffx2-leblanc');
    }
  });

  it('knows which party abilities the chapters carry (a Lore breath in the chapters whose Kimahri learned it)', () => {
    expect([...cov.rowChapters('ffx.breath.stone')].sort()).toEqual(['braskas-final-aeon', 'mirror-aeons', 'seymour-omnis', 'sin-face', 'sin-fins-core']); // Mirror Aeons (2026-10-16): Kimahri is on its bench with the breath learned
    expect(cov.rowChapters('ffx.breath.aqua').size).toBe(0); // no chapter's build or foes carry it
  });

  it('loads a pack where a chapter lists it, and a game\'s core pack in every chapter of the game', () => {
    expect(cov.packChapters('ffx-final-aeon')).toEqual(new Set(['braskas-final-aeon', 'mirror-aeons'])); // Mirror Aeons: Lulu casts Ultima there
    expect(cov.packChapters('ffx2-aeons')).toEqual(new Set(['ffx2-fallen-aeons', 'ffx2-ixion-djose']));
    expect(cov.packChapters('ffx2-core').size).toBe(cov.facts.filter((c) => c.game === 'ffx2').length);
  });
});

describe('the layout tool', () => {
  it('plans every row and keeps every pack under the sprite gate once the levers are applied', () => {
    const cov = createCoverage();
    const unhooked = { ...FFX_UNHOOKED, ...FFX2_UNHOOKED };
    const planned = rows.filter((r) => r.pack && !(unhooked[r.id]?.kind === 'open')).map((r) => row(r.id, r.pack!, r.secs!, r.game));
    const plan = planLayout({ rows: planned, budgetBytes: AUDIO_BUDGET_BYTES, shippedBytes: 100.85e6, repackSavingBytes: 4e6 });
    expect(plan.packs.every((p) => p.bytes < PACK_GATE_BYTES)).toBe(true);
    expect(plan.packs.map((p) => p.pack).sort()).toEqual([...new Set(planned.flatMap((r) => (r.game === 'both' ? ['ffx-core', 'ffx2-core'] : [r.pack])))].sort());
    expect(cov.facts.length).toBeGreaterThan(0);
  });

  it('runs end to end as a command and prints the plan', () => {
    const run = spawnSync(process.execPath, ['tools/audio/sfx-parity-layout.mjs', '--allow-over', '--repack', '4000000'], { cwd: ROOT, encoding: 'utf8', env: { ...process.env } });
    expect(run.status, run.stderr).toBe(0);
    expect(run.stdout).toMatch(/shipped audio besides the parity packs/);
    expect(run.stdout).toMatch(/total [\d.]+ MB; headroom/);
    expect(run.stdout).toMatch(/ffx-core/);
    expect(run.stdout).toMatch(/not planned until a battle moment answers them \(open\): \d+ row/);
    expect(run.stdout).not.toMatch(/PROBLEM: .*can be heard in/);
  }, 180_000);
});
