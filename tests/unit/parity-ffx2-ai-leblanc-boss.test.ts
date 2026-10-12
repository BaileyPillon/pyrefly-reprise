/**
 * **Re-parity AI lane C, Leblanc herself, the Syndicate's records and the rows W3's command records answer** (Chapter VI, Act III; **FFX-2 only**):
 * `research/re-ffx2-ai-leblanc-den-ixion.md` section 3.5 (rows L1 to L8 of section 8) and section 2 (rows R1, R2, K1, K2). The other actors of the
 * room are in `parity-ffx2-ai-leblanc.test.ts`.
 *
 * One of the note's tallies is reproduced here: the deterministic walk of her counters, `MG A N - S L A M A S L N - ...` (No Love Lost on commands
 * 3, 11, 19, 27 ..., Not-So-Mighty Guard on commands 1 and 29), and the exact residue counts of `random() % 5` over the 65,536 values.
 */

import { describe, expect, it, vi } from 'vitest';

// Some tests walk all 65,536 roll values; on a loaded machine they need more than the default 5 seconds.
vi.setConfig({ testTimeout: 60_000 });
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import * as data from '../../src/data/ffx2/index.ts';
import { aiHarness, aiUnit } from '../../src/battle/ffx2/fixtures.ts';
import { setMem } from '../../src/battle/ffx2/internal.ts';
import { resolveCommand } from '../../src/battle/ffx2/adapt/command.ts';
import { enemy, bench } from './helpers/ffx2ScriptRig.ts';

const here = (name: string): string => fileURLToPath(new URL(`../fixtures/parity/ffx2/${name}`, import.meta.url));
const ROWS = JSON.parse(readFileSync(here('monster_rows.json'), 'utf8')) as Record<string, Record<string, number>>;

const ATTACK = 'x2-ormi-shield-bash';
const SUPERCOLLIDER = 'x2-ormi-supercollider';
const HUGGLES = 'x2-ormi-huggles';
const BLAST = 'x2-ormi-concussive-blast';

// ---------------------------------------------------------------------------------------------------------------------
// Leblanc
// ---------------------------------------------------------------------------------------------------------------------

describe('Leblanc (m253): rows L1 to L8', () => {
  /**
   * The note's section 3.5 walk of her counters with Ormi and Logos alive, one symbol per command (MG Not-So-Mighty Guard,
   * A Attack, S spell or Osmose, L Love Tap or White Wind, M Mach Fan or a grenade, N No Love Lost); `-` is the clean-up
   * poll that issues nothing, which the engine folds into the next poll. Reproduced from the interpreter-style walk
   * (`sim-leblanc`) and the note's printed head `MG A N - S L A M A S L N - A M A S L A M N - A S L A M A S N - L MG ...`.
   */
  const WALK =
    'MG A N - S L A M A S L N - A M A S L A M N - A S L A M A S N - L MG A M A S L N - A M A S L A M N - A S L A M A S N - L A M A S L A N - M'.split(' ');
  const commands = WALK.filter((x) => x !== '-');

  const symbol = (id: string | null): string => {
    if (id === 'x2-leblanc-not-so-mighty-guard') return 'MG';
    if (id === 'x2-leblanc-fan-slap') return 'A';
    if (id === 'x2-nll-1') return 'N';
    if (id === 'x2-leblanc-osmose' || /^x2-leblanc-(fira|thundara|blizzara|watera)$/.test(id ?? '')) return 'S';
    if (id === 'x2-leblanc-love-tap' || id === 'x2-leblanc-white-wind') return 'L';
    if (id === 'x2-leblanc-mach-fan' || id === 'x2-leblanc-flash-bomb' || id === 'x2-leblanc-hush-grenade') return 'M';
    return `?${id}`;
  };

  function leblanc(henchmen: ReadonlyArray<'ormi' | 'logos'> = ['ormi', 'logos'], seed = 11): ReturnType<typeof aiHarness> {
    const self = enemy('leblanc', 1380, { mp: 460 });
    const others = henchmen.map((id, i) => enemy(id, id === 'ormi' ? 1344 : 989, { slot: i + 1 }));
    return aiHarness(self, others, 'ffx2-leblanc', seed);
  }

  it('walks the note\'s command order with Ormi and Logos alive: No Love Lost on commands 3, 11, 19, 27 ... and never in place of a cycle step (L1)', () => {
    for (const seed of [1, 2, 3, 4]) {
      const h = leblanc(['ormi', 'logos'], seed);
      const got = h.run(commands.length).map(symbol);
      expect(got.join(' ')).toBe(commands.join(' '));
    }
    const n = commands.map((s, i) => (s === 'N' ? i + 1 : 0)).filter(Boolean);
    expect(n).toEqual([3, 11, 19, 27, 35, 43, 51, 59]);
  });

  it('issues a command on every call: the clean-up poll of the game is folded into the next one (L6)', () => {
    const h = leblanc();
    expect(h.run(60).every((x) => x !== null)).toBe(true);
  });

  it('Not-So-Mighty Guard is cast on the first command and on the 25th ordinary turn (command 29 with four No Love Losts before it), never else; turn 5 is an Attack (L2)', () => {
    const h = leblanc();
    const got = h.run(120).map(symbol);
    expect(got.map((s, i) => (s === 'MG' ? i + 1 : 0)).filter(Boolean)).toEqual([1, 29]);
    // Neither Guard nor No Love Lost takes a cycle step: what is left is Attack, spell, Love Tap or White Wind, Attack, Mach Fan or a grenade, in a loop.
    const cycle = got.filter((s) => s !== 'MG' && s !== 'N');
    expect(cycle.join(' ')).toBe(Array.from({ length: cycle.length }, (_, i) => ['A', 'S', 'L', 'A', 'M'][i % 5]).join(' '));
    expect(got[4]).toBe('L'); // the fifth command is the third cycle step, not a second Guard
  });

  it('with Ormi or Logos down the counter stays at 8 or more and No Love Lost never returns; the second Guard comes on command 25 (L1, L2)', () => {
    for (const survivors of [['ormi'], ['logos'], []] as const) {
      const h = leblanc(survivors);
      const got = h.run(80).map(symbol);
      expect(got).not.toContain('N');
      expect(got.map((s, i) => (s === 'MG' ? i + 1 : 0)).filter(Boolean)).toEqual([1, 25]);
    }
    const mid = leblanc();
    const first = mid.run(2); // MG, A
    expect(first.length).toBe(2);
    mid.ctx.allies().find((u) => u.id === 'ormi')!.alive = false;
    expect(mid.run(30).map(symbol)).not.toContain('N'); // down before the 3rd command
  });

  it('the cycle in detail: Attack, spell, Love Tap or White Wind, Attack, Mach Fan or a grenade (L4, L5)', () => {
    const b = bench(enemy('leblanc', 1380, { mp: 460 }), 'ffx2-leblanc', [enemy('ormi', 1344, { slot: 1 }), enemy('logos', 989, { slot: 2 })]);
    expect(b.id(b.poll())).toBe('x2-leblanc-not-so-mighty-guard');
    expect(b.rng.calls).toEqual([]);
    expect(b.id(b.poll(1))).toBe('x2-leblanc-fan-slap'); // command 2, step 1: a pick over three girls
    // command 3 is No Love Lost (no draws), command 4 is the folded clean-up plus step 2: a spell, `% 4` then a girl
    expect(b.id(b.poll())).toBe('x2-nll-1');
    const spells = [0, 1, 2, 3].map((k) => {
      const c = bench(enemy('leblanc', 1380, { mp: 460 }), 'ffx2-leblanc', [enemy('ormi', 1344, { slot: 1 }), enemy('logos', 989, { slot: 2 })]);
      setMem(c.self, 'cycle', 1);
      setMem(c.self, 'guard', 5);
      return c.id(c.poll(k, 1));
    });
    expect(spells).toEqual(['x2-leblanc-fira', 'x2-leblanc-thundara', 'x2-leblanc-blizzara', 'x2-leblanc-watera']);
  });

  it('Osmose below 15 MP, a spell at 15 (L4)', () => {
    for (const [mp, want] of [[14, 'x2-leblanc-osmose'], [15, 'x2-leblanc-fira']] as const) {
      const c = bench(enemy('leblanc', 1380, { mp }), 'ffx2-leblanc', [enemy('ormi', 1344, { slot: 1 }), enemy('logos', 989, { slot: 2 })]);
      setMem(c.self, 'cycle', 1);
      setMem(c.self, 'guard', 5);
      expect(c.id(c.poll(0, 1))).toBe(want);
    }
  });

  it('step 3: a coin picks Ormi or Logos for Love Tap; a fallen one means White Wind on all monsters (L5)', () => {
    const at = (coin: number, ormiAlive: boolean, logosAlive: boolean): [string | null, string[]] => {
      const o = enemy('ormi', 1344, { slot: 1 });
      const l = enemy('logos', 989, { slot: 2 });
      o.alive = ormiAlive;
      l.alive = logosAlive;
      const c = bench(enemy('leblanc', 1380, { mp: 460 }), 'ffx2-leblanc', [o, l]);
      setMem(c.self, 'cycle', 2);
      setMem(c.self, 'guard', 5);
      setMem(c.self, 'trio', 0);
      const command = c.poll(coin);
      return [c.id(command), c.targets(command)];
    };
    expect(at(0, true, true)).toEqual(['x2-leblanc-love-tap', ['ormi']]);
    expect(at(1, true, true)).toEqual(['x2-leblanc-love-tap', ['logos']]);
    expect(at(0, false, true)).toEqual(['x2-leblanc-white-wind', []]);
    expect(at(1, true, false)).toEqual(['x2-leblanc-white-wind', []]);
  });

  it('step 5: `random() % 5` over the 65,536 values is Flash Bomb 13,108, Hush Grenade 13,107 and Mach Fan 39,321', () => {
    const tally: Record<string, number> = {};
    const c = bench(enemy('leblanc', 1380, { mp: 460 }), 'ffx2-leblanc', [enemy('ormi', 1344, { slot: 1 }), enemy('logos', 989, { slot: 2 })]);
    for (let v = 0; v <= 0xffff; v++) {
      setMem(c.self, 'cycle', 4);
      setMem(c.self, 'guard', 5);
      setMem(c.self, 'trio', 0);
      c.rng.drain();
      const id = c.id(c.poll(v))!;
      tally[id] = (tally[id] ?? 0) + 1;
    }
    expect(tally).toEqual({ 'x2-leblanc-flash-bomb': 13108, 'x2-leblanc-hush-grenade': 13107, 'x2-leblanc-mach-fan': 39321 });
  });

  it('No Love Lost is one action of three parts, and its numbers are Leblanc\'s rows (L7)', () => {
    const nll = data.ABILITIES['x2-nll-1']!;
    expect(nll.extra?.['sequence']).toEqual(['x2-nll-2', 'x2-nll-3']);
    expect(nll.ffx2Record).toMatchObject({ id: 0x40f6, hits: 8, power: 5, formula: 1 });
    expect(data.ABILITIES['x2-nll-2']!.ffx2Record).toMatchObject({ id: 0x40f7, power: 22, formula: 1 });
    expect(data.ABILITIES['x2-nll-3']!.ffx2Record).toMatchObject({ id: 0x40f8, power: 6, formula: 4 });
  });
});

// ---------------------------------------------------------------------------------------------------------------------
// The records (R1, R2, K1, K2)
// ---------------------------------------------------------------------------------------------------------------------

describe('the Syndicate\'s records are the game\'s rows (R1, R2, K1, K2)', () => {
  const GROUPS: Array<[string, string[]]> = [
    ['ffx2-leblanc-entrance', ['ormi-entrance', 'dr-goon', 'fem-goon']],
    ['ffx2-leblanc-logos-room', ['logos-room', 'ormi-logos-room']],
    ['ffx2-leblanc-last-room', ['leblanc', 'logos', 'ormi']],
  ];

  it('level, HP, MP and every stat byte of all eight enemies equal monster.bin (numbers only, monster_rows.json)', () => {
    for (const [groupId, ids] of GROUPS) {
      const group = data.ENEMY_GROUPS_BY_ID[groupId]!;
      for (const id of ids) {
        const e = group.enemies.find((x) => x.id === id)!;
        const row = ROWS[`${groupId}/${id}`]!;
        const got = { level: e.level, hp: e.hp, mp: e.mp, str: e.stats.str, def: e.stats.def, mag: e.stats.mag, mdef: e.stats.mdef, agi: e.stats.agi, eva: e.stats.eva, luck: e.stats.luck, acc: e.stats.acc };
        const want = { level: row['level'], hp: row['hp'], mp: row['mp'], str: row['str'], def: row['def'], mag: row['mag'], mdef: row['mdef'], agi: row['agi'], eva: row['eva'], luck: row['luck'], acc: row['acc'] };
        expect(got, `${groupId}/${id}`).toEqual(want);
        expect([e.stats.maxHp, e.stats.maxMp]).toEqual([row['hp'], row['mp']]);
      }
    }
  });

  it('Ormi\'s Acts I and II do not carry the Concussive Blast and Logos\' Act II does not carry the Hail of Bullets (O1, G1)', () => {
    const lists = (groupId: string, id: string): string[] => data.ENEMY_GROUPS_BY_ID[groupId]!.enemies.find((x) => x.id === id)!.abilityIds;
    expect(lists('ffx2-leblanc-entrance', 'ormi-entrance')).not.toContain(BLAST);
    expect(lists('ffx2-leblanc-logos-room', 'ormi-logos-room')).not.toContain(BLAST);
    expect(lists('ffx2-leblanc-logos-room', 'logos-room')).not.toContain('x2-logos-hail-of-bullets');
    expect(lists('ffx2-leblanc-last-room', 'ormi')).toContain(BLAST);
    expect(lists('ffx2-leblanc-last-room', 'logos')).toContain('x2-logos-hail-of-bullets');
  });

  it('every ability a Syndicate script can issue is in its enemy\'s list', () => {
    const issue: Record<string, string[]> = {
      'ffx2-leblanc-entrance/ormi-entrance': [ATTACK, SUPERCOLLIDER, HUGGLES],
      'ffx2-leblanc-entrance/fem-goon': ['x2-leblanc-fan-slap', 'x2-fem-goon-fira', 'x2-fem-goon-thundara', 'x2-fem-goon-watera', 'x2-fem-goon-blizzara', 'x2-fem-goon-fire', 'x2-fem-goon-thunder', 'x2-fem-goon-water', 'x2-fem-goon-blizzard'],
      'ffx2-leblanc-entrance/dr-goon': ['x2-goon-strike'],
      'ffx2-leblanc-logos-room/logos-room': ['x2-logos-double-shot', 'x2-logos-russian-roulette'],
      'ffx2-leblanc-logos-room/ormi-logos-room': [ATTACK, SUPERCOLLIDER, HUGGLES],
      'ffx2-leblanc-last-room/ormi': [ATTACK, SUPERCOLLIDER, HUGGLES, BLAST],
      'ffx2-leblanc-last-room/logos': ['x2-logos-double-shot', 'x2-logos-russian-roulette', 'x2-logos-hail-of-bullets'],
      'ffx2-leblanc-last-room/leblanc': ['x2-leblanc-fan-slap', 'x2-leblanc-fira', 'x2-leblanc-thundara', 'x2-leblanc-blizzara', 'x2-leblanc-watera', 'x2-leblanc-mach-fan', 'x2-leblanc-flash-bomb', 'x2-leblanc-hush-grenade', 'x2-leblanc-love-tap', 'x2-leblanc-not-so-mighty-guard', 'x2-leblanc-white-wind', 'x2-leblanc-osmose', 'x2-nll-1'],
    };
    for (const [key, ids] of Object.entries(issue)) {
      const [groupId, id] = key.split('/') as [string, string];
      const e = data.ENEMY_GROUPS_BY_ID[groupId]!.enemies.find((x) => x.id === id)!;
      for (const ability of ids) expect(e.abilityIds, `${key}`).toContain(ability);
    }
  });
});

// ---------------------------------------------------------------------------------------------------------------------
// Rows the command records already answer (H1, E4, G3, L8): pinned here so the script rows above rest on them
// ---------------------------------------------------------------------------------------------------------------------

describe('which Syndicate moves roll to hit and which damage types reduce them (H1, E4, G3, L8; rows from W3)', () => {
  const user = aiUnit('probe', 'enemy');
  const formulaOf = (id: string): number => resolveCommand(data.ABILITIES[id]!, user).accuracyFormula;
  const damageBits = (id: string): number => data.ABILITIES[id]!.ffx2Record!.flagsDamage & 3; // 1 physical only, 2 magical only, 0 neither

  it('only the plain Attacks and the 1H Pistol roll to hit; Supercollider, Huggles, Hail of Bullets, Mach Fan, the grenades and every spell never do', () => {
    expect(formulaOf('x2-ormi-shield-bash')).toBe(2);
    expect(formulaOf('x2-logos-double-shot')).toBe(1);
    for (const id of [SUPERCOLLIDER, HUGGLES, BLAST, 'x2-logos-hail-of-bullets', 'x2-leblanc-mach-fan', 'x2-leblanc-flash-bomb', 'x2-leblanc-hush-grenade', 'x2-leblanc-fira', 'x2-nll-1']) {
      expect(formulaOf(id), id).toBe(0);
    }
  });

  it('Supercollider and Hail of Bullets are physical (Protect halves them); Huggles, the Blast and No Love Lost are untyped; the spells are magical', () => {
    expect([damageBits(SUPERCOLLIDER), damageBits('x2-logos-hail-of-bullets')]).toEqual([1, 1]);
    expect([damageBits(HUGGLES), damageBits(BLAST), damageBits('x2-nll-1')]).toEqual([0, 0, 0]);
    expect([damageBits('x2-leblanc-fira'), damageBits('x2-fem-goon-fire')]).toEqual([2, 2]);
  });

  it('Fira and its kin are power 12, the base spells of the goons power 7, Osmose takes 3/16 of the current MP of the girl, Mach Fan is power 24 with the Defense of the girls (L8)', () => {
    expect([data.ABILITIES['x2-leblanc-fira']!.ffx2Record!.power, data.ABILITIES['x2-fem-goon-fire']!.ffx2Record!.power]).toEqual([12, 7]);
    expect(data.ABILITIES['x2-leblanc-osmose']!.ffx2Record).toMatchObject({ damageClass: 2, formula: 4, power: 3 });
    expect(data.ABILITIES['x2-leblanc-mach-fan']!.ffx2Record).toMatchObject({ formula: 0, power: 24 });
  });
});
