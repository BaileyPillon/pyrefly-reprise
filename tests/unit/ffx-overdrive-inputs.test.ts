// @vitest-environment jsdom
/**
 * r38 / PR-0308 (FFX only): Bushido and Swordplay play the Overdrive that was chosen.
 *
 * Before, every Bushido showed one invented 7-input sequence (Dragon Fang, sourced at 8, showed 7 chips) and
 * every Swordplay tier had the same zone and speed (`minigameParams` sent `inputs: 7`, `zonePercent` and
 * `travelMs`, and the overlays read none of them). Sourced then: the sequence LENGTHS 8 / 7 / 7 / 6
 * (`research/ffx-overdrive-input-rules-2026-09-30.md` D2) and the Swordplay ORDERING (zone narrower, marker
 * faster, timer shorter as the Overdrive gets stronger, `ffx-combat-core.md` §5.3 rule 2).
 *
 * Re-parity RC9 (lane FFX-A, FFX only; Bailey 2026-10-11 "all your recommendations", D-763 and D-765) replaced both estimates with the game's own:
 * the button ORDER of the four Bushido is the exe's (`FFX-G01` section 6.3: Dragon Fang ends Cross, Circle; Shooting Star is Triangle, Cross, Square,
 * Circle, Left, Right, Circle; Tornado opens with Circle) and the Swordplay window and speed are the controller's (section 6.2: 8.7 / 7.3 / 7.3 /
 * 6.5 percent of the bar, 11 / 12 / 13 / 14 units a 1/30 s frame), the limits 3 / 3 / 3 / 2 s. Game case: FFX only.
 *
 * The request comes from the real engine, its params open the real overlay, and the sequence is typed with
 * real `keydown` events (the same `RawInputWatcher` the game uses).
 */

import fs from 'node:fs';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { AbilityDef, BattleEvent, Command, Decision, MinigameResult } from '../../src/battle/common/types.ts';
import { FFXContentRegistry, createFFXEngine } from '../../src/battle/ffx/index.ts';
import { rollDefaultMinigame, timerMsFor } from '../../src/battle/ffx/overdrive.ts';
import { ABILITIES as AURON } from '../../src/data/ffx/abilities/overdrive-auron.ts';
import { ABILITIES as TIDUS } from '../../src/data/ffx/abilities/overdrive-tidus.ts';
import { BUSHIDO_SEQUENCES } from '../../src/data/ffx/overdrives/inputs.ts';
import { RawInputWatcher, type UiButton } from '../../src/ui/ffx/rawInput.ts';
import { openAuronSequence } from '../../src/ui/ffx/minigames/AuronSequence.ts';
import { swordplayGeometryFor } from '../../src/ui/ffx/minigames/TidusTiming.ts';
import { openMinigame } from '../../src/ui/ffx/minigames/index.ts';
import { attackAbility, enemy, member, party, setup } from './ffx-fixtures.test.ts';

const BUSHIDO_IDS = ['dragon-fang', 'shooting-star', 'banishing-blade', 'tornado'] as const;
const SWORDPLAY_IDS = ['spiral-cut', 'slice-and-dice', 'energy-rain', 'blitz-ace'] as const;
const LENGTH: Record<string, number> = { 'dragon-fang': 8, 'shooting-star': 7, 'banishing-blade': 7, tornado: 6 };
const GLYPH: Record<string, string> = { up: '↑', down: '↓', left: '←', right: '→', confirm: '✕', cancel: '○', triangle: '△', square: '□', l1: 'L1', r1: 'R1' };
const KEY: Record<string, string> = { up: 'ArrowUp', down: 'ArrowDown', left: 'ArrowLeft', right: 'ArrowRight', confirm: 'Enter', cancel: 'KeyX', triangle: 'KeyQ', square: 'KeyK', l1: 'KeyF', r1: 'KeyR' };

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

describe('Bushido data: the sourced lengths, per Overdrive', () => {
  it.each(BUSHIDO_IDS)('%s has its sourced length and only real buttons', (id) => {
    const seq = BUSHIDO_SEQUENCES[id]!;
    expect(seq.length).toBe(LENGTH[id]);
    for (const b of seq) expect(Object.keys(GLYPH)).toContain(b);
  });

  it('the four sequences are four different sequences (no more one invented default for all)', () => {
    const seen = new Set(BUSHIDO_IDS.map((id) => BUSHIDO_SEQUENCES[id]!.join(',')));
    expect(seen.size).toBe(4);
  });

  it('the order is the game\'s, from the exe (RC9): Dragon Fang ends Cross, Circle; Tornado opens Circle; Shooting Star is Triangle, Cross, Square, Circle, Left, Right, Circle', () => {
    expect(BUSHIDO_SEQUENCES['dragon-fang']!.slice(-2)).toEqual(['confirm', 'cancel']);
    expect(BUSHIDO_SEQUENCES['tornado']![0]).toBe('cancel');
    expect(BUSHIDO_SEQUENCES['shooting-star']).toEqual(['triangle', 'confirm', 'square', 'cancel', 'left', 'right', 'cancel']);
    expect(BUSHIDO_SEQUENCES['banishing-blade']).toEqual(['up', 'l1', 'down', 'r1', 'right', 'left', 'triangle']);
  });

  it('each Bushido ability record carries its own sequence', () => {
    for (const id of BUSHIDO_IDS) {
      expect((AURON[id]!.extra?.['minigameParams'] as { sequence: string[] }).sequence).toEqual([...BUSHIDO_SEQUENCES[id]!]);
    }
  });
});

describe('Swordplay data: the game\'s windows, speeds and limits (RC9)', () => {
  const published = (id: (typeof SWORDPLAY_IDS)[number]) => requestFor('tidus', TIDUS[id]!).params as { zonePercent: number; travelMs: number; speed: number; timerMs: number; category: number };

  it('a stronger tier has a narrower zone, a faster marker and a shrinking window in time; the timer never lengthens', () => {
    const rows = SWORDPLAY_IDS.map((id) => published(id));
    for (let i = 1; i < rows.length; i++) {
      expect(rows[i]!.zonePercent, `${SWORDPLAY_IDS[i]} zone`).toBeLessThanOrEqual(rows[i - 1]!.zonePercent); // Slice and Dice and Energy Rain share 7.3 percent
      expect(rows[i]!.speed, `${SWORDPLAY_IDS[i]} speed`).toBeGreaterThan(rows[i - 1]!.speed);
      expect(rows[i]!.travelMs, `${SWORDPLAY_IDS[i]} crossing`).toBeLessThan(rows[i - 1]!.travelMs);
      expect((rows[i]!.zonePercent / 100) * rows[i]!.travelMs, `${SWORDPLAY_IDS[i]} window`).toBeLessThan((rows[i - 1]!.zonePercent / 100) * rows[i - 1]!.travelMs);
      expect(timerMsFor(TIDUS[SWORDPLAY_IDS[i]!]!)).toBeLessThanOrEqual(timerMsFor(TIDUS[SWORDPLAY_IDS[i - 1]!]!));
    }
  });

  it('the four rows are the game\'s: windows 8.7 / 7.3 / 7.3 / 6.5 percent of the bar, a sweep of 833 / 764 / 705 / 655 ms (FFX-G01 section 6.2)', () => {
    expect(SWORDPLAY_IDS.map((id) => Math.round(published(id).zonePercent * 10) / 10)).toEqual([8.7, 7.3, 7.3, 6.5]);
    expect(SWORDPLAY_IDS.map((id) => Math.round(published(id).travelMs))).toEqual([833, 764, 705, 655]);
    expect(SWORDPLAY_IDS.map((id) => published(id).category)).toEqual([0x20, 0x30, 0x40, 0x50]);
  });

  it('the limits are the game\'s: 3 000, 3 000, 3 000 and 2 000 ms (Energy Rain was 2 600 and Blitz Ace 2 200)', () => {
    expect(SWORDPLAY_IDS.map((id) => timerMsFor(TIDUS[id]!))).toEqual([3000, 3000, 3000, 2000]);
  });

  it('the overlay plays the bar the engine published, and a bare call plays Spiral Cut', () => {
    const blitz = swordplayGeometryFor(requestFor('tidus', TIDUS['blitz-ace']!).params);
    expect(blitz).toEqual({ limit: 2, speed: 14, width: 18, x0: 118, bar: 275, lo: 246, hi: 264 });
    expect(swordplayGeometryFor({ name: 'Spiral Cut', timerMs: 3000 })).toEqual({ limit: 3, speed: 11, width: 24, x0: 118, bar: 275, lo: 243, hi: 267 });
    expect(swordplayGeometryFor({ category: 0x40 })).toMatchObject({ speed: 13, lo: 245, hi: 265, limit: 3 }); // the category alone is enough
    // nonsense is ignored, not trusted
    expect(swordplayGeometryFor({ category: 0x99, timerMs: -5, speed: Number.NaN })).toMatchObject({ speed: 11, lo: 243, hi: 267 });
  });

  it('every window is a real slice of the bar (never empty, never half of it) and every crossing takes time', () => {
    for (const id of SWORDPLAY_IDS) {
      const t = published(id);
      expect(t.zonePercent).toBeGreaterThan(0);
      expect(t.zonePercent).toBeLessThan(50);
      expect(t.travelMs).toBeGreaterThan(0);
    }
  });

  it('the data header names its source: the exe and the note, no estimate any more', () => {
    const header = fs.readFileSync('src/data/ffx/overdrives/inputs.ts', 'utf8');
    expect(header).toContain('FFX-G01');
    expect(header).toContain("game's order");
    expect(header).not.toContain('our estimate, adopted by Bailey');
  });
});

describe('the engine request carries each Overdrive\'s own parameters', () => {
  it.each(BUSHIDO_IDS)('Bushido %s publishes its sequence', (id) => {
    const req = requestFor('auron', AURON[id]!);
    expect(req.params['sequence']).toEqual([...BUSHIDO_SEQUENCES[id]!]);
    expect((req.params['sequence'] as string[]).length).toBe(LENGTH[id]);
  });

  it.each(SWORDPLAY_IDS)('Swordplay %s publishes its own zone, speed and timer', (id) => {
    const req = requestFor('tidus', TIDUS[id]!);
    expect(req.params).toMatchObject({ timerMs: timerMsFor(TIDUS[id]!), x0: 118, bar: 275 });
    expect(req.params['windowHi'] as number).toBeGreaterThan(req.params['windowLo'] as number);
    expect(req.params['speed']).toBeGreaterThan(0);
  });

  it.each(BUSHIDO_IDS)('the engine\'s own roll for %s reports a full run as that Overdrive\'s length, not 7', (id) => {
    const ctx = { rng: { aux: { int: () => 0 } } } as never; // 0 < 75: the success branch (the minigame stand-in draws on the engine-side stream)
    const r = rollDefaultMinigame(ctx, 'auron-sequence', AURON[id]!, member({ id: 'auron' }) as never);
    expect(r.kind === 'auron-sequence' && r.sequence.correctInputs).toBe(LENGTH[id]);
  });
});

describe('the real overlay shows and plays the Overdrive chosen', () => {
  beforeEach(() => {
    vi.useFakeTimers({ toFake: ['setTimeout', 'clearTimeout', 'requestAnimationFrame', 'cancelAnimationFrame', 'performance'] });
  });
  afterEach(() => {
    vi.useRealTimers();
    document.body.innerHTML = '';
  });

  const press = (button: string): void => {
    window.dispatchEvent(new KeyboardEvent('keydown', { code: KEY[button], key: KEY[button] }));
  };

  it.each(BUSHIDO_IDS)('Bushido %s: the chips on screen are its sequence, and typing them with the keys succeeds', async (id) => {
    const req = requestFor('auron', AURON[id]!);
    const root = document.createElement('div');
    document.body.appendChild(root);
    let result: MinigameResult | undefined;
    void openMinigame(root, req.kind, req.params).then((r) => (result = r));
    const chipEls = [...root.querySelectorAll<HTMLElement>('.ig-minigame__bar--sequence .ig-minigame__key')];
    // PR-0361: on a keyboard a chip prints its key with the symbol beside it, so the chip's own button is `data-btn` and the
    // PlayStation symbol is the small label (an arrow, which is its own symbol, has only the big one).
    const symbols = chipEls.map((c) => c.querySelector('.ffx-mg-key__sub')?.textContent ?? c.querySelector('.ffx-mg-key__main')?.textContent);
    expect(chipEls.map((c) => c.dataset['btn'])).toEqual([...BUSHIDO_SEQUENCES[id]!]);
    expect(symbols).toEqual(BUSHIDO_SEQUENCES[id]!.map((b) => GLYPH[b]));
    expect(chipEls.length).toBe(LENGTH[id]);
    for (const b of BUSHIDO_SEQUENCES[id]!) {
      press(b);
      await vi.advanceTimersByTimeAsync(100);
    }
    await vi.advanceTimersByTimeAsync(1000);
    expect(result?.kind).toBe('auron-sequence');
    if (result?.kind !== 'auron-sequence') return;
    expect(result.sequence.success).toBe(true);
    expect(result.sequence.correctInputs).toBe(LENGTH[id]);
  });

  it('Dragon Fang is not complete after 7 correct inputs (the old default length)', async () => {
    const req = requestFor('auron', AURON['dragon-fang']!);
    const root = document.createElement('div');
    document.body.appendChild(root);
    let result: MinigameResult | undefined;
    void openAuronSequence(root, req.params).then((r) => (result = r));
    for (const b of BUSHIDO_SEQUENCES['dragon-fang']!.slice(0, 7)) {
      press(b);
      await vi.advanceTimersByTimeAsync(100);
    }
    await vi.advanceTimersByTimeAsync(300);
    expect(result).toBeUndefined();
    expect(root.querySelectorAll('.ig-minigame__key--done').length).toBe(7);
  });

  it.each(SWORDPLAY_IDS)('Swordplay %s: the gold zone and the marker follow its own pair', async (id) => {
    const req = requestFor('tidus', TIDUS[id]!);
    const root = document.createElement('div');
    document.body.appendChild(root);
    void openMinigame(root, req.kind, req.params);
    const bar = root.querySelector<HTMLElement>('[data-role="bar"]')!;
    const cursor = root.querySelector<HTMLElement>('[data-role="cursor"]')!;
    const tune = req.params as { zonePercent: number; travelMs: number };
    expect(parseFloat(bar.style.getPropertyValue('--ig-zone-width'))).toBeCloseTo(tune.zonePercent, 1);
    expect(parseFloat(bar.style.getPropertyValue('--ig-zone-start'))).toBeCloseTo(50 - tune.zonePercent / 2, 0); // the window is centred on the bar, to within a unit of its 275
    // half way across (percent of the bar) after half the travel time, to within one step of the marker
    await vi.advanceTimersByTimeAsync(Math.round(tune.travelMs / 2));
    expect(parseFloat(cursor.style.left)).toBeGreaterThan(40);
    expect(parseFloat(cursor.style.left)).toBeLessThan(60);
    await vi.advanceTimersByTimeAsync(10_000); // let it expire and close
  });
});

describe('the Square button (Shooting Star asks for it)', () => {
  afterEach(() => {
    document.body.innerHTML = '';
  });
  it('K reaches a HUD watcher as square, and the other keys are unchanged', () => {
    const seen: UiButton[] = [];
    const w = new RawInputWatcher((b) => seen.push(b));
    w.attach();
    for (const code of ['KeyK', 'KeyX', 'Enter', 'KeyQ']) window.dispatchEvent(new KeyboardEvent('keydown', { code }));
    w.detach();
    expect(seen).toEqual(['square', 'cancel', 'confirm', 'triangle']);
  });
});
