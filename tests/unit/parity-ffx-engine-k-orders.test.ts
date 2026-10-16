/**
 * The Magus Sisters' seven orders in the engine (re-parity lane FFX-K, the Sisters' orders of 2026-10-15; **FFX only**). Source: `research/re-ffx-zanmato-and-orders.md`
 * Part 2 (branch `re-ffx-zanmato-and-orders`, final decode `f59c4592`): the target search proved on the real code (24,000 vectors) and the sixteen handlers proved on the
 * game's script VM (24,000 runs). `parity-ffx-sister-orders.test.ts` replays those proofs through the kernels; THIS file is the engine's wiring, one order after another,
 * against an **independent oracle** (`helpers/ffxSisterOracle.ts`: the note's search and handlers written out again as straight-line code, with no import of a kernel or
 * an adapter).
 *
 * Every case plays a real order of a real sister from the start of her turn (`helpers/ffxOrderRig.ts`: the Sisters summoned in a test build, the scenario applied to the
 * engine and handed to the oracle, every draw of the game's generator tapped). The oracle is run on the SAME draws and must say: which commands she performs and in what
 * order, how many draws of stream 18 (rolls) and stream 4 (picks) the handler takes (the engine takes exactly that many, and none more), what she gains or loses, what the
 * standing order and her private variables are afterwards, and the rest command when nothing in her list is taken. Each order is swept over many seeds so every branch of
 * its chain is reached; the sweeps assert the branches they reached.
 *
 * The test values (the Sisters' motivation and gauge, the HP and MP of the scenarios, the test monsters) are the test's own; the real chapter's are its builder's.
 */

import { describe, expect, it } from 'vitest';
import { type Played, ORDER_COMMAND, abilityFor, seeds, sistersRt, sweep } from './helpers/ffxOrderRig.ts';

const REST = 0x312c;
const clamp = (v: number, lo: number, hi: number): number => Math.min(hi, Math.max(lo, v));

const commands = (ps: Played[]): Set<string> => new Set(ps.flatMap((p) => p.performed));
const restTurns = (ps: Played[]): number => ps.filter((p) => p.oracle.fx.some((f) => f.kind === 'perform' && f.cmd === REST)).length;

describe('"Fight!" (0x3126, event 15): the sister\'s own special, then her Attack (note 11.1 to 11.3)', () => {
  it('Cindy: Camisade at 20 + M, else Attack at 150 + M, else the rest command; her draws are stream 18 for the rolls and stream 4 for a pick among several foes', () => {
    const ps = sweep('cindy fight', () => ({ who: 'cindy', event: 15, m: 0 }), seeds(40));
    expect(commands(ps)).toEqual(new Set(['camisade', 'cindy-attack']));
    expect(ps.some((p) => p.d4.length > 0), 'a pick among two foes drew on stream 4').toBe(true);
  });
  it('Sandy: Razzia at M + 50, else Attack at M + 180', () => {
    const ps = sweep('sandy fight', () => ({ who: 'sandy', event: 15, m: 0 }), seeds(40));
    expect(commands(ps)).toEqual(new Set(['razzia', 'sandy-attack']));
  });
  it('Mindy: Passado at M + 30, else Attack at M + 180', () => {
    const ps = sweep('mindy fight', () => ({ who: 'mindy', event: 15, m: 0 }), seeds(40));
    expect(commands(ps)).toEqual(new Set(['passado', 'mindy-attack']));
  });
  it('nothing in the list can be taken (the foes are out of reach of her melee special and her Attack): the loss of 5 and the rest command, no action', () => {
    const ps = sweep('cindy fight, far foes', () => ({ who: 'cindy', event: 15, m: 40, monsters: [{ distance: 3 }, { distance: 2 }] }));
    for (const p of ps) {
      expect(p.performed).toEqual([]);
      expect(sistersRt(p.rig).motivation['cindy']).toBe(35);
      expect(sistersRt(p.rig).memory['cindy']!.last).toBe(REST);
    }
    expect(restTurns(ps)).toBe(ps.length);
  });
});

describe('"Do as you will" (0x3124, event 13): each sister\'s free choice', () => {
  it('Cindy: Auto-Life, Full-Life, Life, Attack, Flare and the four -aga spells in the order of the note, every branch of it reached', () => {
    const ps = [
      ...sweep('cindy free', () => ({ who: 'cindy', event: 13, m: 40 }), seeds(48)),
      ...sweep('cindy free, Sandy fallen', () => ({ who: 'cindy', event: 13, m: 40, sisters: { sandy: { dead: true } } }), seeds(48)),
      ...sweep('cindy free, all protected', () => ({ who: 'cindy', event: 13, m: 100, sisters: { sandy: { autoLife: true }, mindy: { autoLife: true }, cindy: { autoLife: true } } }), seeds(24)),
    ];
    const seen = commands(ps);
    for (const c of ['auto-life', 'cindy-attack', 'full-life-spell', 'life']) expect(seen.has(c), c).toBe(true);
    expect(ps.some((p) => ['firaga', 'thundaga', 'blizzaga', 'waterga'].some((c) => p.performed.includes(c))), 'a gated -aga spell').toBe(true);
  });
  it('Cindy with no MP and the foes out of reach has nothing to cast or hit with: the rest command and a loss of 5', () => {
    const ps = sweep('cindy free, nothing', () => ({ who: 'cindy', event: 13, m: 40, sisters: { cindy: { mp: 0 } }, monsters: [{ distance: 3 }] }));
    expect(restTurns(ps)).toBeGreaterThan(0);
  });
  it('Sandy: Reflect on Cindy when she has none (M + 200), else Razzia at 128, else Attack with no roll', () => {
    const ps = [
      ...sweep('sandy free', () => ({ who: 'sandy', event: 13, m: 100 }), seeds(16)),
      ...sweep('sandy free, Cindy reflecting', () => ({ who: 'sandy', event: 13, m: 100, sisters: { cindy: { reflect: true } } }), seeds(24)),
    ];
    const seen = commands(ps);
    expect(seen.has('reflect')).toBe(true);
    expect(seen.has('razzia') || seen.has('sandy-attack')).toBe(true);
    // The Reflect really lands on Cindy.
    const cast = ps.find((p) => p.performed.includes('reflect'))!;
    expect(cast.rig.fighter('cindy').statuses['reflect']).toBeDefined();
  });
  it('Mindy without Reflect on Cindy: Passado, then Attack, each at M + 100', () => {
    const ps = sweep('mindy free, plain', () => ({ who: 'mindy', event: 13, m: 40 }), seeds(32));
    expect(commands(ps)).toEqual(new Set(['passado', 'mindy-attack']));
  });
});

describe('Mindy\'s Reflect combo (note section 14): spells cast AT Cindy, who has Reflect, so they bounce onto the enemies', () => {
  it('with Cindy alive and holding Reflect, one or two spells are searched on Cindy alone and queued, the list is stored, and no foe-side Passado or Attack is chosen until nothing is found', () => {
    const ps = sweep('mindy combo', () => ({ who: 'mindy', event: 13, m: 100, sisters: { cindy: { reflect: true } } }), seeds(60));
    const combos = ps.filter((p) => p.state.cnt > 0);
    expect(combos.length, 'seeds that found at least one spell').toBeGreaterThan(10);
    expect(combos.some((p) => p.state.cnt === 2), 'a round of two spells').toBe(true);
    expect(combos.some((p) => p.state.cnt === 1), 'a round of one spell').toBe(true);
    for (const p of combos) {
      expect(p.performed.length).toBe(p.state.cnt);
      expect(p.state.lst.slice(0, p.state.cnt).map((c) => abilityFor(c, 'mindy'))).toEqual(p.performed);
    }
  });
  it('the spells bounce: Cindy is not hurt and the enemies are, one stream-6 draw per spell when two foes could be hit', () => {
    const ps = sweep('mindy combo bounce', () => ({ who: 'mindy', event: 13, m: 100, sisters: { cindy: { reflect: true } } }), seeds(60)).filter((p) => p.state.cnt > 0);
    expect(ps.length).toBeGreaterThan(5);
    for (const p of ps) {
      expect(p.rig.fighter('cindy').hp, 'Cindy is untouched').toBe(6000);
      const onFoes = p.events.filter((e) => 'targetId' in e && e.targetId.startsWith('m'));
      expect(onFoes.length, 'the enemies took the spells').toBeGreaterThan(0);
      expect(p.events.filter((e) => 'targetId' in e && e.targetId === 'cindy' && ['damage', 'ko', 'status-add'].includes(e.type))).toEqual([]);
      expect(p.taps.filter((t) => t.stream === 6).length, 'the Reflect bounce draws once per spell on stream 6').toBe(p.performed.length);
    }
  });
  it('without Reflect on Cindy, with Cindy fallen, or with an order standing, the combo is not tried', () => {
    for (const sisters of [{ cindy: { reflect: false } }, { cindy: { dead: true, reflect: true } }] as const) {
      const ps = sweep('mindy no combo', () => ({ who: 'mindy', event: 13, m: 100, sisters }), seeds(16));
      for (const p of ps) expect(p.state.cnt).toBe(0);
    }
  });
});

describe('"Go, go!" (0x3127, event 16): Cindy heals the side, drains MP, hits, then the big spells', () => {
  it('hurt Cindy (HP and MP below the maximum): Pray at the gap, aimed at the stored group (all three sisters), then Osmose, Attack at 2M, the gated spells, Camisade', () => {
    const ps = [
      ...sweep('gogo hurt', () => ({ who: 'cindy', event: 16, m: 60, sisters: { cindy: { hp: 2000, mp: 120 } } }), seeds(40)),
      ...sweep('gogo healthy', () => ({ who: 'cindy', event: 16, m: 90 }), seeds(40)),
      ...sweep('gogo low motivation', () => ({ who: 'cindy', event: 16, m: 10 }), seeds(40)),
    ];
    const seen = commands(ps);
    for (const c of ['pray', 'osmose-spell', 'cindy-attack']) expect(seen.has(c), c).toBe(true);
    expect([...seen].some((c) => ['ultima', 'flare', 'drain', 'blizzaga', 'waterga', 'thundaga', 'firaga', 'camisade'].includes(c)), 'a gated spell or the tail').toBe(true);
    const pray = ps.find((p) => p.performed.includes('pray'))!;
    const start = pray.events.find((e) => e.type === 'action-start' && e.abilityId === 'pray');
    expect(start && start.type === 'action-start' ? [...start.targets].sort() : []).toEqual(['cindy', 'mindy', 'sandy']);
  });
});

describe('"Help each other!" (0x3128, event 17): Cindy revives, protects and cures', () => {
  it('Full-Life and Life on a fallen sister, Auto-Life on one without it, the Cure family on the others when they are hurt, then Camisade', () => {
    const ps = [
      ...sweep('help fallen', () => ({ who: 'cindy', event: 17, m: 80, sisters: { sandy: { dead: true } } }), seeds(40)),
      ...sweep('help hurt', () => ({ who: 'cindy', event: 17, m: 80, sisters: { sandy: { hp: 1000 }, mindy: { hp: 900, autoLife: true }, cindy: { autoLife: true } } }), seeds(40)),
      ...sweep('help healthy', () => ({ who: 'cindy', event: 17, m: 40 }), seeds(24)),
    ];
    const seen = commands(ps);
    for (const c of ['full-life-spell', 'auto-life', 'camisade']) expect(seen.has(c), c).toBe(true);
    expect([...seen].some((c) => ['cure', 'cura', 'curaga', 'life'].includes(c)), 'a Cure or a Life').toBe(true);
  });
});

describe('"Defense!" (0x312A, event 19): Sandy protects the side', () => {
  it('Shell, Protect, Haste (on those without it and without Reflect), NulAll at the stored group, the Cure family, Razzia, Attack', () => {
    const ps = [
      ...sweep('defense bare', () => ({ who: 'sandy', event: 19, m: 100 }), seeds(40)),
      ...sweep('defense shelled', () => ({ who: 'sandy', event: 19, m: 100, sisters: { cindy: { shell: true }, sandy: { shell: true }, mindy: { shell: true } } }), seeds(32)),
      ...sweep('defense buffed', () => ({ who: 'sandy', event: 19, m: 100, sisters: { cindy: { shell: true, protect: true, haste: true }, sandy: { shell: true, protect: true, haste: true }, mindy: { shell: true, protect: true, haste: true, hp: 800 } } }), seeds(32)),
      ...sweep('defense reflecting', () => ({ who: 'sandy', event: 19, m: 100, sisters: { cindy: { reflect: true }, sandy: { reflect: true }, mindy: { reflect: true } } }), seeds(24)),
    ];
    const seen = commands(ps);
    for (const c of ['shell', 'protect']) expect(seen.has(c), c).toBe(true);
    expect([...seen].some((c) => ['haste', 'nul-all-aeon', 'cure', 'cura', 'curaga', 'razzia', 'sandy-attack'].includes(c)), 'a later row of the list').toBe(true);
    const shell = ps.find((p) => p.performed[0] === 'shell')!;
    expect(['cindy', 'sandy', 'mindy'].some((id) => shell.rig.fighter(id).statuses['shell'] !== undefined)).toBe(true);
  });
  it('a sister with Reflect is never given Shell, Protect or Haste', () => {
    const ps = sweep('defense reflecting only', () => ({ who: 'sandy', event: 19, m: 100, sisters: { cindy: { reflect: true }, sandy: { reflect: true }, mindy: { reflect: true } } }), seeds(24));
    for (const p of ps) for (const c of ['shell', 'protect', 'haste']) expect(p.performed).not.toContain(c);
  });
});

describe('what she cannot use is not searched for: Silence, and a side that already has everything', () => {
  it('Silence takes every spell out of her list (Pray and her specials are not spells): Cindy silenced only ever hits or rests', () => {
    const ps = sweep('cindy silenced', () => ({ who: 'cindy', event: 13, m: 100, sisters: { cindy: { silence: true }, sandy: { dead: true } } }), seeds(48));
    for (const p of ps) for (const c of p.performed) expect(['cindy-attack', 'camisade']).toContain(c);
    expect(commands(ps).has('cindy-attack')).toBe(true);
    const gogo = sweep('cindy silenced, Go go', () => ({ who: 'cindy', event: 16, m: 100, sisters: { cindy: { silence: true, hp: 2000 } } }), seeds(32));
    expect(commands(gogo).has('pray'), 'Pray is a special, not a spell: Silence does not stop it').toBe(true);
    for (const p of gogo) for (const c of p.performed) expect(['pray', 'cindy-attack', 'camisade']).toContain(c);
  });
  it('NulAll is cast only on a side that lacks one of the four Nuls: with all four on all three sisters her Defense! skips it', () => {
    const buffed = { shell: true, protect: true, haste: true };
    const all = sweep('defense, all Nul', () => ({ who: 'sandy', event: 19, m: 100, sisters: { cindy: { ...buffed, allNul: true }, sandy: { ...buffed, allNul: true }, mindy: { ...buffed, allNul: true } } }), seeds(24));
    for (const p of all) expect(p.performed).not.toContain('nul-all-aeon');
    const some = sweep('defense, one lacks Nul', () => ({ who: 'sandy', event: 19, m: 100, sisters: { cindy: { ...buffed, allNul: true }, sandy: { ...buffed, allNul: true }, mindy: buffed } }), seeds(24));
    expect(commands(some).has('nul-all-aeon')).toBe(true);
    const cast = some.find((p) => p.performed.includes('nul-all-aeon'))!;
    for (const id of ['cindy', 'sandy', 'mindy']) expect(cast.rig.fighter(id).statuses['nulshock'], `${id} has the Nuls`).toBeDefined();
    // One sister lacked a Nul, yet the spell is aimed at the whole stored group: all three (the group of the lowest accepted slot), not only the one that passed the filter.
    const start = cast.events.find((e) => e.type === 'action-start' && e.abilityId === 'nul-all-aeon');
    expect(start && start.type === 'action-start' ? [...start.targets].sort() : []).toEqual(['cindy', 'mindy', 'sandy']);
  });
});

describe('"Are you all right?" (0x312B, event 20): Mindy drains', () => {
  it('Lancet at M div 2, Drain by her missing HP, Osmose by her missing MP; with none taken the loss is 1, not 5', () => {
    const ps = [
      ...sweep('aar hurt', () => ({ who: 'mindy', event: 20, m: 80, sisters: { mindy: { hp: 600, mp: 100 } } }), seeds(40)),
      ...sweep('aar healthy', () => ({ who: 'mindy', event: 20, m: 10 }), seeds(40)),
    ];
    const seen = commands(ps);
    for (const c of ['lancet', 'drain', 'osmose-spell']) expect(seen.has(c), c).toBe(true);
    const rested = ps.filter((p) => p.performed.length === 0);
    expect(rested.length).toBeGreaterThan(0);
    for (const p of rested) expect(sistersRt(p.rig).motivation['mindy']).toBe(clamp(p.state.m - 1, 0, 100));
  });
});

describe('every order is offered by its own number (the requester maps 0x3124 to 0x312B to events 13 to 20)', () => {
  it('the engine\'s ability ids and the game\'s order commands agree', () => {
    expect([13, 14, 15, 16, 17, 18, 19, 20].map(ORDER_COMMAND)).toEqual([0x3124, 0x3125, 0x3126, 0x3127, 0x3128, 0x3129, 0x312a, 0x312b]);
  });
});
