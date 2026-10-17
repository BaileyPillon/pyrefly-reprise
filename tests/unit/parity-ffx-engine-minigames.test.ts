// @vitest-environment jsdom
/**
 * The Overdrive minigames in the engine and the overlays (re-parity RC9, lane FFX-A). **Game case: FFX only.**
 *
 * The kernels are proven against the game's machine code in `parity-ffx-minigames.test.ts`. This file is the second half: what the ENGINE
 * publishes and does with them, checked against numbers restated here from the private note `FFX-G01` (sections 6.1 to 6.4, 10), not read
 * back from the kernels. A mutant of each rule is shown to fail.
 *
 * Source for every figure: FFX.exe, Steam build 25501027, SHA-256 0537B2A1...686D; `FFX-G01` section 6.2 (the Swordplay table: window
 * [lo, hi] on the bar, speed a frame, sweep time), 6.3 (the Bushido words), 6.4 (the casts after 5 / 10 / 15 / 20 / 30 rotations).
 */

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { AbilityDef, BattleEvent, Command, Decision, FFXCombatant, MinigameResult } from '../../src/battle/common/types.ts';
import { FFXContentRegistry, createFFXEngine } from '../../src/battle/ffx/index.ts';
import { furyCastsFor, minigameParams, rollDefaultMinigame, timerMsFor } from '../../src/battle/ffx/overdrive.ts';
import { resolveReelSpin } from '../../src/battle/ffx/reels.ts';
import { ABILITIES } from '../../src/data/ffx/index.ts';
import { ABILITIES as AURON } from '../../src/data/ffx/abilities/overdrive-auron.ts';
import { ABILITIES as LULU_1 } from '../../src/data/ffx/abilities/overdrive-lulu-1.ts';
import { ABILITIES as LULU_2 } from '../../src/data/ffx/abilities/overdrive-lulu-2.ts';
import { ABILITIES as MENU_MARKERS } from '../../src/data/ffx/abilities/special-menu-markers.ts';
import { ABILITIES as TIDUS } from '../../src/data/ffx/abilities/overdrive-tidus.ts';
import { ABILITIES as WAKKA_1 } from '../../src/data/ffx/abilities/overdrive-wakka-1.ts';
import { BUSHIDO_SEQUENCES } from '../../src/data/ffx/overdrives/inputs.ts';
import { openMinigame } from '../../src/ui/ffx/minigames/index.ts';
import { attackAbility, enemy, member, party, setup } from './ffx-fixtures.test.ts';

// ------------------------------------------------------------------------------------------------------------------------ the note's numbers

/** FFX-G01 section 6.2: [id, limit ms, window lo, window hi, units a frame, window percent of the bar, one sweep in ms]. */
const SWORDPLAY: ReadonlyArray<readonly [string, number, number, number, number, number, number]> = [
  ['spiral-cut', 3000, 243, 267, 11, 8.7, 833],
  ['slice-and-dice', 3000, 245, 265, 12, 7.3, 764],
  ['energy-rain', 3000, 245, 265, 13, 7.3, 705],
  ['blitz-ace', 2000, 246, 264, 14, 6.5, 655],
];

/** FFX-G01 section 6.3, in the game's pad names (PS2 layout): the sequences and the limits. */
const BUSHIDO: Readonly<Record<string, { limitMs: number; pads: readonly string[] }>> = {
  'shooting-star': { limitMs: 4000, pads: ['Triangle', 'Cross', 'Square', 'Circle', 'Left', 'Right', 'Circle'] },
  'dragon-fang': { limitMs: 4000, pads: ['Down', 'Left', 'Up', 'Right', 'L1', 'R1', 'Cross', 'Circle'] },
  'banishing-blade': { limitMs: 4000, pads: ['Up', 'L1', 'Down', 'R1', 'Right', 'Left', 'Triangle'] },
  tornado: { limitMs: 3000, pads: ['Circle', 'Right', 'R1', 'Left', 'L1', 'Triangle'] },
};
/** The overlay's own button names for the pad names (`src/ui/ffx/rawInput.ts`: `confirm` is Cross, `cancel` is Circle). */
const TOKEN: Readonly<Record<string, string>> = {
  Triangle: 'triangle', Circle: 'cancel', Cross: 'confirm', Square: 'square', L1: 'l1', R1: 'r1', Up: 'up', Down: 'down', Left: 'left', Right: 'right',
};

/** FFX-G01 section 6.4: casts after 5 / 10 / 15 / 20 / 30 rotations (the note's own examples). */
const FURY_EXAMPLES: ReadonlyArray<readonly [label: string, id: string, magic: number, casts: readonly number[]]> = [
  ['Fire Fury, Magic 0', 'fire-fury', 0, [4, 5, 7, 8, 11]],
  ['Fire Fury, Magic 128', 'fire-fury', 128, [6, 9, 12, 14, 16]],
  ['Fire Fury, Magic 255', 'fire-fury', 255, [6, 11, 16, 16, 16]],
  ['Flare Fury, Magic 128', 'flare-fury', 128, [3, 4, 6, 7, 10]],
  ['Ultima Fury, Magic 128', 'ultima-fury', 128, [2, 3, 4, 5, 6]],
];
const ROTATIONS = [5, 10, 15, 20, 30] as const;

// ------------------------------------------------------------------------------------------------------------------------ fixtures

/** The `minigame-request` the real engine emits when `who` fires `def` with no minigame result attached. */
function requestFor(who: 'tidus' | 'auron', def: AbilityDef): Extract<BattleEvent, { type: 'minigame-request' }> {
  const reg = new FFXContentRegistry();
  reg.addAbilities([attackAbility(), def]);
  const engine = createFFXEngine({ content: reg });
  engine.setSeed(1);
  const od = { gauge: 100, mode: 'stoic' as const, unlockedModes: ['stoic' as const], unlockedOverdriveIds: [def.id] };
  engine.init(
    setup({
      party: party({ members: [member({ id: 'tidus', ...(who === 'tidus' ? { overdrive: od } : {}) }), member({ id: 'auron', ...(who === 'auron' ? { overdrive: od } : {}) }), member({ id: 'yuna' })], activeSlots: ['tidus', 'auron', 'yuna'] }),
      enemies: { id: 'g', game: 'ffx', enemies: [enemy({ id: 'dummy', hp: 99_999 })] },
    }),
  );
  for (let i = 0; i < 200; i++) {
    const d: Decision = engine.nextDecision();
    if (d.kind === 'resolved') continue;
    if (d.kind !== 'player-input' || d.actorId === who) break;
    engine.submit({ kind: 'attack', targets: ['dummy'] });
  }
  const cmd: Command = { kind: 'overdrive', id: def.id, targets: ['dummy'] };
  const req = engine.submit(cmd).find((e): e is Extract<BattleEvent, { type: 'minigame-request' }> => e.type === 'minigame-request');
  if (!req) throw new Error(`${def.id}: no minigame-request`);
  return req;
}

function furyContent(): FFXContentRegistry {
  const reg = new FFXContentRegistry();
  reg.addAbilities([attackAbility()]);
  reg.addAbilities(Object.values(LULU_1));
  reg.addAbilities(Object.values(LULU_2));
  reg.addAbilities(Object.values(MENU_MARKERS));
  return reg;
}

function furyEngine(magic: number) {
  const base = enemy({ id: 'dummy' });
  const engine = createFFXEngine({ content: furyContent() });
  engine.setSeed(1);
  engine.init(
    setup({
      party: party({
        members: [
          member({
            id: 'lulu',
            stats: { ...member({ id: 'x' }).stats, agi: 40, mag: magic },
            overdrive: { gauge: 100, mode: 'stoic', unlockedModes: ['stoic'], unlockedOverdriveIds: ['fury'] },
          }),
          member({ id: 'yuna' }),
          member({ id: 'auron' }),
        ],
        activeSlots: ['lulu', 'yuna', 'auron'],
      }),
      enemies: { id: 'g', game: 'ffx', enemies: [enemy({ id: 'dummy', hp: 900_000, stats: { ...base.stats, hp: 900_000, maxHp: 900_000 }, forms: [{ name: 'dummy', spriteKey: 'dummy', hp: 900_000 }] })] },
    }),
  );
  for (let i = 0; i < 40; i++) {
    const d = engine.nextDecision();
    if (d.kind === 'player-input') {
      if (d.actorId === 'lulu') return engine;
      engine.submit({ kind: 'attack', targets: ['dummy'] });
    }
    if (d.kind === 'battle-over') break;
  }
  throw new Error('Lulu never got a turn');
}

/** How many Fury casts land when `id` is fired with `rotations` full rotations at `magic`. */
function castsFor(id: string, magic: number, rotations: number): number {
  const engine = furyEngine(magic);
  const events = engine.submit({ kind: 'overdrive', id, targets: ['dummy'], extra: { kind: 'lulu-fury', fury: { sweptDegrees: rotations * 360, casts: 0 } } });
  return events.filter((e) => e.type === 'damage' || e.type === 'miss').length;
}

// ------------------------------------------------------------------------------------------------------------------------ A1: the limits

describe('A1: the time limits are the game\'s', () => {
  it('Spiral Cut, Slice and Dice, Energy Rain 3 s, Blitz Ace 2 s: Energy Rain was 2.6 s and Blitz Ace 2.2 s', () => {
    for (const [id, limit] of SWORDPLAY) expect(timerMsFor(TIDUS[id] as AbilityDef), id).toBe(limit);
  });
  it('Shooting Star, Dragon Fang, Banishing Blade 4 s, Tornado 3 s; every Fury 4 s', () => {
    for (const [id, b] of Object.entries(BUSHIDO)) expect(timerMsFor(AURON[id] as AbilityDef), id).toBe(b.limitMs);
    for (const def of [...Object.values(LULU_1), ...Object.values(LULU_2)]) expect(timerMsFor(def), def.id).toBe(4000);
  });
  it('the engine tells the overlay the same limit', () => {
    for (const [id, limit] of SWORDPLAY) expect(requestFor('tidus', TIDUS[id] as AbilityDef).params['timerMs'], id).toBe(limit);
    for (const [id, b] of Object.entries(BUSHIDO)) expect(requestFor('auron', AURON[id] as AbilityDef).params['timerMs'], id).toBe(b.limitMs);
  });
  it('the headless roll draws against the game\'s limits (Energy Rain 3 s, Blitz Ace 2 s) and draws the same number of times as before', () => {
    const draws: number[][] = [];
    const ctx = { rng: { aux: { int: (a: number, b: number) => { draws.push([a, b]); return b; } } } } as never;
    const user = member({ id: 'tidus' }) as unknown as FFXCombatant;
    const rain = rollDefaultMinigame(ctx, 'tidus-timing', TIDUS['energy-rain'] as AbilityDef, user);
    expect(rain).toEqual({ kind: 'tidus-timing', timing: { success: false, timeRemainingMs: 0, timerMs: 3000 } }); // int(0, 99) = 99 is not below 75: a fail
    const lucky = { rng: { aux: { int: (a: number, b: number) => { draws.push([a, b]); return a; } } } } as never;
    draws.length = 0;
    const blitz = rollDefaultMinigame(lucky, 'tidus-timing', TIDUS['blitz-ace'] as AbilityDef, user);
    expect(blitz).toEqual({ kind: 'tidus-timing', timing: { success: true, timeRemainingMs: 0, timerMs: 2000 } });
    expect(draws).toEqual([[0, 99], [0, 2000]]); // a success draws twice: the 75 percent test, then the time left against the 2 s limit
    const hi = { rng: { aux: { int: (_a: number, b: number) => (b === 99 ? 0 : b) } } } as never;
    expect(rollDefaultMinigame(hi, 'tidus-timing', TIDUS['energy-rain'] as AbilityDef, user)).toEqual({ kind: 'tidus-timing', timing: { success: true, timeRemainingMs: 3000, timerMs: 3000 } });
  });
});

// ------------------------------------------------------------------------------------------------------------------------ A2: Swordplay

describe('A2: Swordplay publishes the game\'s bar, window and marker speed', () => {
  it.each(SWORDPLAY)('%s: window [%i, %i] on the 275-unit bar from 118, %i units a frame', (id, _limit, lo, hi, speed, percent, sweepMs) => {
    const p = requestFor('tidus', TIDUS[id] as AbilityDef).params;
    expect(p).toMatchObject({ x0: 118, bar: 275, windowLo: lo, windowHi: hi, speed });
    expect(Math.round((p['zonePercent'] as number) * 10) / 10).toBe(percent);
    expect(Math.round(p['travelMs'] as number)).toBe(sweepMs);
    expect(p['zonePercent'], 'the old estimates (22, 16, 12, 9 percent) are gone').toBeLessThan(9);
  });
  it('the zone narrows and the marker speeds up as the move gets stronger, as the sources say', () => {
    const ps = SWORDPLAY.map(([id]) => requestFor('tidus', TIDUS[id] as AbilityDef).params);
    for (let i = 1; i < ps.length; i++) {
      expect(ps[i]?.['zonePercent'] as number).toBeLessThanOrEqual(ps[i - 1]?.['zonePercent'] as number);
      expect(ps[i]?.['speed'] as number).toBeGreaterThan(ps[i - 1]?.['speed'] as number);
      expect(ps[i]?.['timerMs'] as number).toBeLessThanOrEqual(ps[i - 1]?.['timerMs'] as number);
    }
  });
});

// ------------------------------------------------------------------------------------------------------------------------ A3 to A5: Bushido

describe('A3 to A5: Bushido\'s button orders are the game\'s', () => {
  it.each(Object.entries(BUSHIDO))('%s: the engine publishes the sequence of the exe', (id, b) => {
    const want = b.pads.map((n) => TOKEN[n] as string);
    expect(BUSHIDO_SEQUENCES[id]).toEqual(want);
    expect(requestFor('auron', AURON[id] as AbilityDef).params['sequence']).toEqual(want);
    expect((AURON[id]?.extra?.['minigameParams'] as { sequence: string[] }).sequence).toEqual(want);
  });
  it('three of the four changed, Banishing Blade did not', () => {
    const was: Record<string, string[]> = {
      'dragon-fang': ['down', 'left', 'up', 'right', 'l1', 'r1', 'cancel', 'confirm'],
      'shooting-star': ['triangle', 'cancel', 'square', 'cancel', 'left', 'right', 'confirm'],
      'banishing-blade': ['up', 'l1', 'down', 'r1', 'right', 'left', 'triangle'],
      tornado: ['confirm', 'right', 'r1', 'left', 'l1', 'triangle'],
    };
    const changed = Object.keys(was).filter((id) => JSON.stringify(was[id]) !== JSON.stringify(BUSHIDO_SEQUENCES[id]));
    expect(changed.sort()).toEqual(['dragon-fang', 'shooting-star', 'tornado']);
    // where they differ: Dragon Fang's last two swapped, Shooting Star's inputs 2 and 7, Tornado's first
    const diff = (id: string): number[] => (BUSHIDO_SEQUENCES[id] as string[]).flatMap((t, i) => (t !== (was[id] as string[])[i] ? [i + 1] : []));
    expect(diff('dragon-fang')).toEqual([7, 8]);
    expect(diff('shooting-star')).toEqual([2, 7]);
    expect(diff('tornado')).toEqual([1]);
  });
});

// ------------------------------------------------------------------------------------------------------------------------ A6-A7: Fury

describe('A6 and A7: Fury\'s casts come from the game\'s table', () => {
  it.each(FURY_EXAMPLES)('%s: casts after 5 / 10 / 15 / 20 / 30 rotations (the note\'s own figures)', (_label, id, magic, casts) => {
    expect(ROTATIONS.map((r) => castsFor(id, magic, r))).toEqual([...casts]);
  });
  it('Fire Fury at Magic 90: 5, 8, 10, 13 casts after 5, 10, 15, 20 rotations (the engine was 3, 6, 9, 13)', () => {
    expect([5, 10, 15, 20].map((r) => castsFor('fire-fury', 90, r))).toEqual([5, 8, 10, 13]);
  });
  it('Drain and Osmose Fury have their own brackets, not Fira\'s: Magic 25 is a Fira cast of row 0, a Drain cast of row 7', () => {
    // Fira at Magic 25 (25-44) takes row 0: T 1 2 4 6 9 12 15 ...; Drain at Magic 25 (0-29) takes row 7: T 1 2 4 7 10 13 17 ...
    // after 5 rotations the counter is 6: Fira reaches T[3] = 6 -> 4 casts; Drain stops at T[2] = 4 -> 3 casts (T[3] = 7); after 6 rotations (counter 7) Drain reaches it too -> 4
    const at = (id: string, rotations: number): number => furyCastsFor({ ...LULU_1, ...LULU_2 }[id] as AbilityDef, 25, rotations * 360);
    expect([at('fira-fury', 5), at('drain-fury', 5), at('osmose-fury', 5)]).toEqual([4, 3, 3]);
    expect([at('fira-fury', 6), at('drain-fury', 6), at('osmose-fury', 6)]).toEqual([4, 4, 4]);
    // and through the engine, for a spell whose hits it does count as damage events: the thresholds are the ones the data says
    expect(castsFor('fira-fury', 25, 5)).toBe(4);
  });
  it('a Fury always casts at least once, even if the stick never turned', () => {
    expect(castsFor('fire-fury', 0, 0)).toBe(1);
    const engine = furyEngine(40);
    const events = engine.submit({ kind: 'overdrive', id: 'fire-fury', targets: ['dummy'], extra: { kind: 'lulu-fury', fury: { sweptDegrees: 0, casts: 0 } } });
    expect(events.filter((e) => e.type === 'damage' || e.type === 'miss')).toHaveLength(1);
  });
  it('a part of a rotation buys nothing: the angle counts whole rotations only (359 degrees is none, 540 is one, 719 is one)', () => {
    // Fire Fury at Magic 128 takes row 3: T 1 2 3 4 5 6 7 8 10 ...; the counter starts at 1 and each whole rotation adds 1, so 0 rotations buy 1 cast, 1 buys 2, 2 buy 3, 3 buy 4.
    // The headless roll hands the engine any whole number of degrees from 1,800 to 5,400, so the floor to whole rotations is what scores it (a rounded angle would give one more).
    const fire = LULU_1['fire-fury'] as AbilityDef;
    const at = (degrees: number): number => furyCastsFor(fire, 128, degrees);
    expect([0, 359, 360, 540, 719, 720, 1079, 1080].map(at)).toEqual([1, 1, 2, 2, 2, 3, 3, 4]);
  });
  it('a result that reports casts and no angle is taken as it is (a test rig\'s), 1 to 16', () => {
    const engine = furyEngine(40);
    const events = engine.submit({ kind: 'overdrive', id: 'fire-fury', targets: ['dummy'], extra: { kind: 'lulu-fury', fury: { sweptDegrees: 0, casts: 9 } } });
    expect(events.filter((e) => e.type === 'damage' || e.type === 'miss')).toHaveLength(9);
  });
  it('the engine tells the overlay the thresholds of the spell at Lulu\'s Magic', () => {
    const p = minigameParams(
      { rt: { inventory: new Map() }, content: furyContent() } as never,
      LULU_1['fire-fury'] as AbilityDef,
      member({ id: 'lulu', stats: { ...member({ id: 'x' }).stats, mag: 90 } }) as unknown as FFXCombatant,
    );
    // Fire Fury at Magic 90 takes row 2: 1111122222222222 -> 1 2 3 4 5 7 9 11 13 15 17 19 21 23 25 27
    expect(p['thresholds']).toEqual([1, 2, 3, 4, 5, 7, 9, 11, 13, 15, 17, 19, 21, 23, 25, 27]);
    expect(p).toMatchObject({ variant: 1, magic: 90, timerMs: 4000 });
  });
  it('the headless roll draws once, as before, and scores the angle with the table', () => {
    const draws: number[][] = [];
    const ctx = { rng: { aux: { int: (a: number, b: number) => { draws.push([a, b]); return b; } } } } as never;
    const lulu = member({ id: 'lulu', stats: { ...member({ id: 'x' }).stats, mag: 0 } }) as unknown as FFXCombatant;
    const r = rollDefaultMinigame(ctx, 'lulu-fury', LULU_1['fire-fury'] as AbilityDef, lulu);
    expect(draws).toEqual([[1800, 5400]]); // between 5 and 15 rotations, one draw
    expect(r).toEqual({ kind: 'lulu-fury', fury: { sweptDegrees: 5400, casts: 7 } }); // 15 rotations at Magic 0: 7 casts (the note)
  });
});

// ------------------------------------------------------------------------------------------------------------------------ A8: reels

describe('A8: a pair of Aurochs symbols is no match (the line classifier of the exe)', () => {
  const reels = WAKKA_1['aurochs-reels'] as AbilityDef;
  const spin = (symbols: [string, string, string]): ReturnType<typeof resolveReelSpin> => resolveReelSpin(reels, { symbols, threeOfAKind: symbols[0] === symbols[1] && symbols[1] === symbols[2], timeRemainingMs: 0 });
  it('three Aurochs symbols are the Aurochs shot at every enemy', () => {
    expect(spin(['aurochs', 'aurochs', 'aurochs'])).toMatchObject({ shotId: 'aurochs-shot', targeting: 'all-enemies' });
  });
  it('a pair of them is a Power Shot at one enemy, not the Aurochs shot', () => {
    expect(spin(['aurochs', 'aurochs', 'fire'])).toMatchObject({ targeting: 'random-enemy' });
    expect(spin(['aurochs', 'aurochs', 'fire'])?.shotId).not.toBe('aurochs-shot');
    expect(spin(['fire', 'aurochs', 'aurochs'])?.shotId).not.toBe('aurochs-shot');
  });
  it('the other pairs and threes are as the classifier says: a pair of Fire is the Fire shot at one enemy, three Skulls the Havoc shot at all', () => {
    expect(spin(['fire', 'fire', 'ice'])).toMatchObject({ shotId: 'fire-shot', targeting: 'random-enemy' });
    expect(spin(['skull', 'skull', 'skull'])).toMatchObject({ shotId: 'havoc-shot', targeting: 'all-enemies' });
    expect(spin(['fire', 'ice', 'water'])?.shotId).toBe(ABILITIES['aurochs-reels']?.extra?.['noMatchFallback']);
  });
});

// ------------------------------------------------------------------------------------------------------------------------ the overlays, with the engine's own params

describe('the three overlays run the game\'s controllers on the engine\'s params', () => {
  beforeEach(() => {
    vi.useFakeTimers({ toFake: ['setTimeout', 'clearTimeout', 'requestAnimationFrame', 'cancelAnimationFrame', 'performance'] });
  });
  afterEach(() => {
    vi.useRealTimers();
    document.body.innerHTML = '';
  });
  const key = (code: string): void => {
    window.dispatchEvent(new KeyboardEvent('keydown', { code, key: code }));
  };
  const open = (kind: Parameters<typeof openMinigame>[1], params: Record<string, unknown>) => {
    const root = document.createElement('div');
    document.body.appendChild(root);
    let result: MinigameResult | undefined;
    void openMinigame(root, kind, params).then((r) => (result = r));
    return { root, result: () => result };
  };

  it('Swordplay: Spiral Cut\'s marker steps 11 units a frame; a press in frame 13 (marker at 250) hits and is graded A = 3 - 13/30', async () => {
    const req = requestFor('tidus', TIDUS['spiral-cut'] as AbilityDef);
    const o = open(req.kind, req.params);
    const bar = o.root.querySelector<HTMLElement>('[data-role="bar"]') as HTMLElement;
    // the window as a share of the bar: starts (243 - 118) / 275 = 45.45 percent, 24 / 275 = 8.73 percent wide
    expect(parseFloat(bar.style.getPropertyValue('--ig-zone-start'))).toBeCloseTo(45.45, 1);
    expect(parseFloat(bar.style.getPropertyValue('--ig-zone-width'))).toBeCloseTo(8.73, 1);
    await vi.advanceTimersByTimeAsync(420); // frames 1 to 12 have run; frame 13 is due at 433 ms
    key('Enter');
    await vi.advanceTimersByTimeAsync(600);
    const r = o.result();
    expect(r?.kind).toBe('tidus-timing');
    if (r?.kind !== 'tidus-timing') return;
    expect(r.timing.success).toBe(true);
    expect(r.timing.frame).toBe(13);
    expect(r.timing.timerMs).toBe(3000);
    expect(r.timing.timeRemainingMs).toBeCloseTo((Math.fround(3 - 13 / 30)) * 1000, 6); // 2566.67 ms
  });

  it('Swordplay: a press in frame 15 (marker at 272, past the window) misses and sends the marker back to the left; the move goes on', async () => {
    const req = requestFor('tidus', TIDUS['spiral-cut'] as AbilityDef);
    const o = open(req.kind, req.params);
    const cursor = o.root.querySelector<HTMLElement>('[data-role="cursor"]') as HTMLElement;
    await vi.advanceTimersByTimeAsync(480); // frames 1 to 14 have run (frame 15 is due at 500 ms)
    key('Enter');
    await vi.advanceTimersByTimeAsync(40); // frame 15 judges the marker at 118 + 11 x 14 = 272: a miss
    expect(o.result()).toBeUndefined();
    expect(parseFloat(cursor.style.left)).toBeCloseTo(((118 + 11 - 118) / 275) * 100, 1); // back at the left, one step on: 4 percent
    await vi.advanceTimersByTimeAsync(4000); // never pressed again: the limit ends it as a fail
    const r = o.result();
    expect(r?.kind === 'tidus-timing' && r.timing.success).toBe(false);
  });

  it('Bushido: Dragon Fang takes one word a frame; a wrong word sets it back; the full run succeeds with A = 4 - frame/30', async () => {
    const req = requestFor('auron', AURON['dragon-fang'] as AbilityDef);
    const o = open(req.kind, req.params);
    const KEYS: Record<string, string> = { up: 'ArrowUp', down: 'ArrowDown', left: 'ArrowLeft', right: 'ArrowRight', confirm: 'Enter', cancel: 'KeyX', triangle: 'KeyQ', square: 'KeyK', l1: 'KeyF', r1: 'KeyR' };
    const seq = req.params['sequence'] as string[];
    for (const b of seq.slice(0, 3)) { key(KEYS[b] as string); await vi.advanceTimersByTimeAsync(100); }
    key(KEYS['triangle'] as string); // wrong: input 4 is "right"
    await vi.advanceTimersByTimeAsync(100);
    expect(o.root.querySelectorAll('.ig-minigame__key--done').length).toBe(0);
    for (const b of seq) { key(KEYS[b] as string); await vi.advanceTimersByTimeAsync(100); }
    await vi.advanceTimersByTimeAsync(600);
    const r = o.result();
    expect(r?.kind).toBe('auron-sequence');
    if (r?.kind !== 'auron-sequence') return;
    expect(r.sequence.success).toBe(true);
    expect(r.sequence.correctInputs).toBe(8);
    expect(r.sequence.frame).toBeGreaterThan(0);
    expect(r.sequence.timeRemainingMs).toBeCloseTo(Math.fround(4 - (r.sequence.frame as number) / 30) * 1000, 6);
  });

  it('Bushido: a held key is one press (the game reads the pad\'s pressed edge), so the auto-repeat of a held arrow does not reset a run', async () => {
    const o = open('auron-sequence', { sequence: ['up', 'down'], timerMs: 4000, name: 'Test' });
    key('ArrowUp');
    for (let i = 0; i < 5; i++) {
      await vi.advanceTimersByTimeAsync(40);
      window.dispatchEvent(new KeyboardEvent('keydown', { code: 'ArrowUp', key: 'ArrowUp', repeat: true })); // the operating system's repeat of a held key
    }
    await vi.advanceTimersByTimeAsync(100);
    expect(o.root.querySelectorAll('.ig-minigame__key--done').length).toBe(1); // Up counted once; the repeats did not count as a wrong Up
    expect(o.root.querySelectorAll('.ffx-mg-key--wrong').length).toBe(0);
    key('ArrowDown');
    await vi.advanceTimersByTimeAsync(600);
    expect(o.result()).toMatchObject({ kind: 'auron-sequence', sequence: { success: true, correctInputs: 2 } });
  });

  it('Bushido: two keys inside one frame are one word that matches nothing, even when the second of them is the right one', async () => {
    const o = open('auron-sequence', { sequence: ['up', 'down'], timerMs: 4000, name: 'Test' });
    key('KeyF'); // L1: a wrong key ...
    key('ArrowUp'); // ... and the right input, in the same 1/30 s frame: the pad's pressed word holds both bits, which is no word of the sequence
    await vi.advanceTimersByTimeAsync(100);
    expect(o.root.querySelectorAll('.ig-minigame__key--done').length).toBe(0); // nothing counted: the second key did not rescue the first
    expect(o.root.querySelectorAll('.ffx-mg-key--wrong').length).toBe(1); // the missed chip is marked
    await vi.advanceTimersByTimeAsync(300); // the wrong mark clears; the run goes on from input 1
    key('ArrowUp');
    await vi.advanceTimersByTimeAsync(100);
    key('ArrowDown');
    await vi.advanceTimersByTimeAsync(600);
    expect(o.result()).toMatchObject({ kind: 'auron-sequence', sequence: { success: true, correctInputs: 2 } });
  });

  it('Fury: a step is a left and a right press and two steps are a rotation; four pairs at Magic 20 make four steps, two rotations and two casts', async () => {
    const p = minigameParams(
      { rt: { inventory: new Map() }, content: furyContent() } as never,
      LULU_1['fire-fury'] as AbilityDef,
      member({ id: 'lulu', stats: { ...member({ id: 'x' }).stats, mag: 20 } }) as unknown as FFXCombatant,
    );
    const o = open('lulu-fury', p);
    for (let i = 0; i < 4; i++) {
      key('ArrowLeft');
      await vi.advanceTimersByTimeAsync(100);
      key('ArrowRight');
      await vi.advanceTimersByTimeAsync(100);
    }
    // Fire Fury at Magic 20 takes row 0 (T 1 2 4 6 9 ...). The game reads a button as newly pressed, so Left then Right is one step and 4 pairs are 4 steps
    // (the flags are cleared by a step, and a press is an edge, not a hold: 0x00630CF0). counter = 1 + 4 = 5, (5 + 1) / 2 = 3 reaches T[1] = 2 but not T[2] = 4 -> 2 casts;
    // rotations = 4 / 2 = 2.
    expect(o.root.querySelector('[data-role="counter"]')?.textContent).toBe('2');
    await vi.advanceTimersByTimeAsync(4500);
    const r = o.result();
    expect(r).toEqual({ kind: 'lulu-fury', fury: { sweptDegrees: 2 * 360, casts: 2 } });
  });

  it('Fury: a key held down counts once, and two presses on the same side never make a step', async () => {
    const p = minigameParams(
      { rt: { inventory: new Map() }, content: furyContent() } as never,
      LULU_1['fire-fury'] as AbilityDef,
      member({ id: 'lulu', stats: { ...member({ id: 'x' }).stats, mag: 20 } }) as unknown as FFXCombatant,
    );
    const o = open('lulu-fury', p);
    for (let i = 0; i < 6; i++) {
      key('ArrowLeft'); // Left, Left, Left ...: one flag, no step
      await vi.advanceTimersByTimeAsync(100);
    }
    expect(o.root.querySelector('[data-role="counter"]')?.textContent).toBe('1');
    key('ArrowRight'); // the 0.5 s stall clock has cleared the Lefts by now, so at most one step is made: counter 2, (2 + 1) / 2 = 1 is below T[1] = 2
    await vi.advanceTimersByTimeAsync(100);
    expect(o.root.querySelector('[data-role="counter"]')?.textContent).toBe('1');
    await vi.advanceTimersByTimeAsync(4500);
    expect(o.result()).toEqual({ kind: 'lulu-fury', fury: { sweptDegrees: 0, casts: 1 } });
  });

  it('Fury: Left and Right both held down (the keyboard\'s auto-repeat on each side) make one step, not a stream of them', async () => {
    const p = minigameParams(
      { rt: { inventory: new Map() }, content: furyContent() } as never,
      LULU_1['fire-fury'] as AbilityDef,
      member({ id: 'lulu', stats: { ...member({ id: 'x' }).stats, mag: 20 } }) as unknown as FFXCombatant,
    );
    const o = open('lulu-fury', p);
    const repeat = (code: string): void => {
      window.dispatchEvent(new KeyboardEvent('keydown', { code, key: code, repeat: true })); // the operating system's repeat of a held key
    };
    key('ArrowLeft');
    await vi.advanceTimersByTimeAsync(40);
    key('ArrowRight'); // a frame later than Left: one step, counter 2, (2 + 1) / 2 = 1 is below T[1] = 2 at Magic 20: still 1 cast
    for (let i = 0; i < 6; i++) {
      await vi.advanceTimersByTimeAsync(40);
      repeat('ArrowLeft'); // the repeats of the two held keys, each in a frame of its own: every pair of them would be one more step if a repeat counted
      await vi.advanceTimersByTimeAsync(40);
      repeat('ArrowRight');
    }
    await vi.advanceTimersByTimeAsync(100);
    expect(o.root.querySelector('[data-role="counter"]')?.textContent).toBe('1');
    await vi.advanceTimersByTimeAsync(4500);
    expect(o.result()).toEqual({ kind: 'lulu-fury', fury: { sweptDegrees: 0, casts: 1 } });
  });

  it.each([
    ['Swordplay (Spiral Cut, 3 s)', 'tidus' as const, TIDUS['spiral-cut'] as AbilityDef, 3010],
    ['Bushido (Dragon Fang, 4 s)', 'auron' as const, AURON['dragon-fang'] as AbilityDef, 4010],
  ])('%s: the move ends the moment the ring reads 0, not a frame later (the fail shows at once)', async (_name, who, def, ms) => {
    const req = requestFor(who, def);
    const o = open(req.kind, req.params);
    await vi.advanceTimersByTimeAsync(ms - 100);
    expect(o.root.querySelector('.ffx-mg--fail'), 'still going before the ring runs out').toBeNull();
    // the ring reads 0 on the animation frame at or after the limit; that frame runs the frames still due and then the frame that finds the limit gone (91 for 3 s, 121 for 4 s)
    await vi.advanceTimersByTimeAsync(100);
    expect(o.root.querySelector('.ffx-mg--fail'), 'ended in the ring\'s own frame').not.toBeNull();
    await vi.advanceTimersByTimeAsync(2000);
    const r = o.result();
    expect(r?.kind === 'tidus-timing' ? r.timing : r?.kind === 'auron-sequence' ? r.sequence : undefined).toMatchObject({ success: false, timeRemainingMs: 0, frame: who === 'tidus' ? 91 : 121 });
  });
});
