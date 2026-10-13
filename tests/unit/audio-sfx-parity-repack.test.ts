/**
 * SFX parity, the final repack of the v2 sprite (both games): which stand-ins a recorded original has made unnecessary
 * (`tools/audio/sfx-parity-retire.mjs`), the generated list the build keeps (`retired.ts`), and the command that writes it
 * (`tools/audio/sfx-parity-repack.mjs`).
 *
 * The rule is strict on purpose: a cue retires only when EVERY way the game reaches it ends at a recorded original in the
 * game's core pack, which every chapter of the game loads. So Auron's recording of the katana swing does not retire the
 * katana swing while the foes still play it, a boss pack's recording retires nothing, and a cue nothing was seen to use stays.
 * With no pack shipped nothing retires and the list is empty. Since 2026-10-12 the two core packs ship (the loose set of the SFX run), the plan took
 * three stand-ins out of the sprite (buff-generic, hit-dagger, water: 0.17 MB), and `retired.ts` holds them: a plan made on the repacked sprite keeps the
 * names already out of it (`already`), so the generated list does not lose them and `--check` stays green.
 */
import { spawnSync } from 'node:child_process';
import { readFileSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { describe, expect, it } from 'vitest';
import { planRetirement, retiredBytes, type RetireInput, type Use } from '../../tools/audio/sfx-parity-retire.mjs';
import { V2_CUES } from '../../src/audio/sfxV2/cues.ts';
import { RETIRED_V2_CUES } from '../../src/audio/sfxV2/retired.ts';

const ROOT = resolve(import.meta.dirname, '../..');
const cues = { 'swing-sword': { game: 'ffx', fallback: 'a' }, 'swing-katana': { game: 'ffx', fallback: 'a' }, shell: { game: 'both', fallback: 'a' }, 'hit-gun': { game: 'ffx2', fallback: 'a' }, cure: { game: 'ffx', fallback: 'a' } } as const;
const use = (key: string, events?: string[]): Use => ({ key, events });
const input = (over: Partial<RetireInput>): RetireInput => ({
  sprite: new Set(Object.keys(cues)),
  cues: cues as unknown as RetireInput['cues'],
  core: { ffx: undefined, ffx2: undefined },
  uses: { ffx: [], ffx2: [] },
  ...over,
});

describe('which stand-ins a recorded original retires', () => {
  it('retires nothing while no core pack has shipped', () => {
    const plan = planRetirement(input({ uses: { ffx: [use('v2:swing-sword', ['swing-sword'])], ffx2: [] } }));
    expect(plan.retired).toEqual([]);
    expect(plan.kept['swing-sword']).toMatch(/no core pack/);
  });

  it('retires a cue when every use of it lists an original the core pack holds', () => {
    const plan = planRetirement(input({
      core: { ffx: { 'swing-sword': { game: 'ffx' } }, ffx2: undefined },
      uses: { ffx: [use('v2:swing-sword', ['swing-sword']), use('v2:swing-sword', ['swing-sword', 'swing-foe'])], ffx2: [] },
    }));
    expect(plan.retired).toEqual(['swing-sword']);
  });

  it('keeps a cue some use still plays as the stand-in (Auron\'s katana swing against a foe\'s)', () => {
    const plan = planRetirement(input({
      core: { ffx: { 'swing-katana': { game: 'ffx' } }, ffx2: undefined },
      uses: { ffx: [use('v2:swing-katana', ['swing-katana']), use('v2:swing-katana', [])], ffx2: [] },
    }));
    expect(plan.retired).toEqual([]);
    expect(plan.kept['swing-katana']).toMatch(/still plays it as the stand-in \(an event with no original\)/);
  });

  it('follows a chain: a tier that falls back to a recorded tier is covered, one whose chain is unrecorded is not', () => {
    const recorded = { ffx: { cure: { game: 'ffx' as const } }, ffx2: undefined };
    const covered = planRetirement(input({ core: recorded, uses: { ffx: [use('v2:cure', ['cure-2', 'cure'])], ffx2: [] } }));
    expect(covered.retired).toEqual(['cure']);
    const open = planRetirement(input({ core: recorded, uses: { ffx: [use('v2:cure', ['cure-2', 'cure']), use('v2:cure', ['cure-3'])], ffx2: [] } }));
    expect(open.retired).toEqual([]);
    expect(open.kept['cure']).toMatch(/cure-3 not in ffx-core/);
  });

  it('reads a use with no events as a lookup by the cue\'s own name (a menu key)', () => {
    const core = { ffx: { cure: { game: 'ffx' as const } }, ffx2: undefined };
    expect(planRetirement(input({ core, uses: { ffx: [use('v2:cure')], ffx2: [] } })).retired).toEqual(['cure']);
    expect(planRetirement(input({ core: { ffx: {}, ffx2: undefined }, uses: { ffx: [use('v2:cure')], ffx2: [] } })).retired).toEqual([]);
  });

  it('keeps a cue nothing was seen to use (nothing proves what depends on it)', () => {
    const plan = planRetirement(input({ core: { ffx: { 'swing-sword': { game: 'ffx' } }, ffx2: undefined }, uses: { ffx: [], ffx2: [] } }));
    expect(plan.retired).toEqual([]);
    expect(plan.kept['swing-sword']).toMatch(/no observed use in ffx/);
  });

  it('needs every game that plays a cue to have its original: a both-games cue retires only when each core holds one', () => {
    const uses = { ffx: [use('v2:shell', ['shell'])], ffx2: [use('v2:shell', ['shell'])] };
    const one = planRetirement(input({ core: { ffx: { shell: { game: 'both' } }, ffx2: undefined }, uses }));
    expect(one.retired).toEqual([]);
    const both = planRetirement(input({ core: { ffx: { shell: { game: 'ffx' } }, ffx2: { shell: { game: 'ffx2' } } }, uses }));
    expect(both.retired).toEqual(['shell']);
  });

  it('never lets one game\'s original retire the other game\'s stand-in (rule 14)', () => {
    const wrongGame = planRetirement(input({ core: { ffx: undefined, ffx2: { 'hit-gun': { game: 'ffx' } } }, uses: { ffx: [], ffx2: [use('v2:hit-gun', ['hit-gun'])] } }));
    expect(wrongGame.retired).toEqual([]);
    const right = planRetirement(input({ core: { ffx: undefined, ffx2: { 'hit-gun': { game: 'ffx2' } } }, uses: { ffx: [], ffx2: [use('v2:hit-gun', ['hit-gun'])] } }));
    expect(right.retired).toEqual(['hit-gun']);
  });

  it('keeps a name that is not in the key space', () => {
    const plan = planRetirement(input({ sprite: new Set(['mystery']) }));
    expect(plan.kept['mystery']).toMatch(/key space/);
  });

  it('carries the names a repack already took out of the sprite, sorted, apart from what it retires now (so a second run on the repacked sprite loses none)', () => {
    const core = { ffx: { 'swing-sword': { game: 'ffx' as const } }, ffx2: undefined };
    const now = { ffx: [use('v2:swing-sword', ['swing-sword'])], ffx2: [] };
    const first = planRetirement(input({ core, uses: now }));
    expect(first.retired).toEqual(['swing-sword']);
    expect(first.already).toEqual([]);
    // The repack took it out: the sprite no longer holds it, the plan on that sprite retires nothing new and still reports it.
    const sprite = new Set(Object.keys(cues).filter((name) => name !== 'swing-sword'));
    const second = planRetirement(input({ sprite, core, uses: now, already: ['swing-sword'] }));
    expect(second.retired).toEqual([]);
    expect(second.already).toEqual(['swing-sword']);
    expect(planRetirement(input({ already: ['water', 'buff-generic'] })).already).toEqual(['buff-generic', 'water']);
    expect(retiredBytes(second, {}, 1_000_000, 100)).toBe(0); // it gives back nothing now
  });
});

describe('what the repack gives back', () => {
  it('is the retired cues\' share of the sprite\'s length, gaps included', () => {
    const plan = { retired: ['a', 'b'], kept: {} };
    const bytes = retiredBytes(plan, { a: { duration: 1 }, b: { duration: 2 } }, 1_000_000, 100);
    expect(bytes).toBe(Math.round(((1 + 0.05 + 2 + 0.05) / 100) * 1_000_000));
    expect(retiredBytes({ retired: [], kept: {} }, {}, 1e6, 100)).toBe(0);
    expect(retiredBytes(plan, {}, 1e6, 0)).toBe(0);
  });
});

describe('the retired list the build keeps', () => {
  const manifest = JSON.parse(readFileSync(join(ROOT, 'public', 'audio', 'manifest.json'), 'utf8')) as { sfxV2: { cues: Record<string, unknown> } };

  it('is the sprite\'s complement in the key space: the sprite plus the retired list is exactly V2_CUES, with no overlap', () => {
    const sprite = Object.keys(manifest.sfxV2.cues);
    expect(new Set([...sprite, ...RETIRED_V2_CUES]).size).toBe(sprite.length + RETIRED_V2_CUES.length);
    expect([...sprite, ...RETIRED_V2_CUES].sort()).toEqual(Object.keys(V2_CUES).sort());
  });

  it('is empty while no core pack has shipped, and holds the nine cues the two repacks took out (2026-10-12: three; 2026-10-13: six more) now that both have', () => {
    const packs = (JSON.parse(readFileSync(join(ROOT, 'public', 'audio', 'manifest.json'), 'utf8')) as { sfxParity?: { packs?: Record<string, unknown> } }).sfxParity?.packs ?? {};
    if (!packs['ffx-core'] && !packs['ffx2-core']) expect(RETIRED_V2_CUES).toEqual([]);
    else expect(RETIRED_V2_CUES).toEqual(['buff-generic', 'dissolve-pyreflies', 'gun-burst', 'hit-dagger', 'hit-greatsword', 'hit-gun', 'hit-katana', 'hit-spear', 'water']);
  });

  it('is what the command writes: --check passes, and the report retires nothing today', () => {
    const check = spawnSync(process.execPath, ['tools/audio/sfx-parity-repack.mjs', '--check'], { cwd: ROOT, encoding: 'utf8' });
    expect(check.status, check.stderr + check.stdout).toBe(0);
    expect(check.stdout).toMatch(/retired\.ts is current/);
    const report = spawnSync(process.execPath, ['tools/audio/sfx-parity-repack.mjs'], { cwd: ROOT, encoding: 'utf8' });
    expect(report.status, report.stderr).toBe(0);
    expect(report.stdout).toMatch(/retire 0:/); // nothing new: the nine it took out are already out of the sprite
    expect(report.stdout).toMatch(/already out of the sprite \(retired\.ts keeps them\): buff-generic, dissolve-pyreflies, gun-burst, hit-dagger, hit-greatsword, hit-gun, hit-katana, hit-spear, water/);
    expect(report.stdout).toMatch(/keep \d+ \(ffx still plays it as the stand-in\)/);
  }, 180_000);
});
