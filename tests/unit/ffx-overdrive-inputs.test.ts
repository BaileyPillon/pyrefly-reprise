// @vitest-environment jsdom
/**
 * r38 / PR-0308 (FFX only): Bushido and Swordplay play the Overdrive that was chosen.
 *
 * Before, every Bushido showed one invented 7-input sequence (Dragon Fang, sourced at 8, showed 7 chips) and
 * every Swordplay tier had the same zone and speed (`minigameParams` sent `inputs: 7`, `zonePercent` and
 * `travelMs`, and the overlays read none of them).
 *
 * Sourced: the sequence LENGTHS 8 / 7 / 7 / 6 (`research/ffx-overdrive-input-rules-2026-09-30.md` D2,
 * `[verified: 4 sources]`) and the Swordplay ORDERING (zone narrower, marker faster, timer shorter as the
 * Overdrive gets stronger, `ffx-combat-core.md` §5.3 rule 2). The button ORDER is our estimate (the GameFAQs
 * order, Bailey 2026-10-03; D3) and the Swordplay zone and speed numbers are unsourced, so every tier keeps today's pair (12.22 %, 1 059 ms).
 *
 * The request comes from the real engine, its params open the real overlay, and the sequence is typed with
 * real `keydown` events (the same `RawInputWatcher` the game uses).
 */

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { AbilityDef, BattleEvent, Command, Decision, MinigameResult } from '../../src/battle/common/types.ts';
import { FFXContentRegistry, createFFXEngine } from '../../src/battle/ffx/index.ts';
import { rollDefaultMinigame, timerMsFor } from '../../src/battle/ffx/overdrive.ts';
import { ABILITIES as AURON } from '../../src/data/ffx/abilities/overdrive-auron.ts';
import { ABILITIES as TIDUS } from '../../src/data/ffx/abilities/overdrive-tidus.ts';
import { BUSHIDO_SEQUENCES, SWORDPLAY_TUNING } from '../../src/data/ffx/overdrives/inputs.ts';
import { RawInputWatcher, type UiButton } from '../../src/ui/ffx/rawInput.ts';
import { openAuronSequence } from '../../src/ui/ffx/minigames/AuronSequence.ts';
import { swordplayGeometry } from '../../src/ui/ffx/minigames/logic.ts';
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

  it('the order is the GameFAQs one, our estimate (D3): Dragon Fang ends Circle, Cross; Tornado opens Cross; Shooting Star is GF-KB\'s', () => {
    expect(BUSHIDO_SEQUENCES['dragon-fang']!.slice(-2)).toEqual(['cancel', 'confirm']);
    expect(BUSHIDO_SEQUENCES['tornado']![0]).toBe('confirm');
    expect(BUSHIDO_SEQUENCES['shooting-star']).toEqual(['triangle', 'cancel', 'square', 'cancel', 'left', 'right', 'confirm']);
    expect(BUSHIDO_SEQUENCES['banishing-blade']).toEqual(['up', 'l1', 'down', 'r1', 'right', 'left', 'triangle']);
  });

  it('each Bushido ability record carries its own sequence', () => {
    for (const id of BUSHIDO_IDS) {
      expect((AURON[id]!.extra?.['minigameParams'] as { sequence: string[] }).sequence).toEqual([...BUSHIDO_SEQUENCES[id]!]);
    }
  });
});

describe('Swordplay data: the ordering is sourced, the zone and speed numbers are still owed', () => {
  it('the timer shortens with the tier (the sourced ordering, already shipped); zone and speed never get easier', () => {
    for (let i = 1; i < SWORDPLAY_IDS.length; i++) {
      const prev = SWORDPLAY_TUNING[SWORDPLAY_IDS[i - 1]!]!;
      const cur = SWORDPLAY_TUNING[SWORDPLAY_IDS[i]!]!;
      expect(cur.zonePercent).toBeLessThanOrEqual(prev.zonePercent);
      expect(cur.travelMs).toBeLessThanOrEqual(prev.travelMs);
      expect(timerMsFor(TIDUS[SWORDPLAY_IDS[i]!]!)).toBeLessThanOrEqual(timerMsFor(TIDUS[SWORDPLAY_IDS[i - 1]!]!));
    }
  });

  it('no unsourced zone or speed ships: every tier plays what the game played before release 38 (12.22 %, 1 059 ms)', () => {
    for (const id of SWORDPLAY_IDS) expect(SWORDPLAY_TUNING[id]).toEqual({ travelMs: 1059, zonePercent: 12.22 });
  });

  it('that pair is the old overlay default: a 22 px half width and 340 px/s on a 360 px meter', () => {
    const g = swordplayGeometry({ ...SWORDPLAY_TUNING['blitz-ace']! }, 360);
    expect(g.zoneHalfWidth).toBeCloseTo(22, 2);
    expect(g.speedPxPerSec).toBeCloseTo(340, 0);
  });

  it('swordplayGeometry turns percent and travel time into the overlay\'s pixels, and keeps the old defaults', () => {
    // the wiring is kept for when per-tier values are sourced: any pair converts, not only today's
    expect(swordplayGeometry({ zonePercent: 22, travelMs: 1400 }, 360)).toEqual({ zoneHalfWidth: 39.6, speedPxPerSec: 360 / 1.4 });
    expect(swordplayGeometry({ zonePercent: 9, travelMs: 700 }, 360).zoneHalfWidth).toBeCloseTo(16.2, 6);
    expect(swordplayGeometry({}, 360)).toEqual({ zoneHalfWidth: 22, speedPxPerSec: 340 });
    // the demo's explicit pixel params win
    expect(swordplayGeometry({ zoneHalfWidth: 30, speedPxPerSec: 200, zonePercent: 9, travelMs: 700 }, 360)).toEqual({ zoneHalfWidth: 30, speedPxPerSec: 200 });
    // nonsense is ignored, not trusted
    expect(swordplayGeometry({ zonePercent: 0, travelMs: -5 }, 360)).toEqual({ zoneHalfWidth: 22, speedPxPerSec: 340 });
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
    expect(req.params).toMatchObject({ ...SWORDPLAY_TUNING[id]!, timerMs: timerMsFor(TIDUS[id]!) });
  });

  it.each(BUSHIDO_IDS)('the engine\'s own roll for %s reports a full run as that Overdrive\'s length, not 7', (id) => {
    const ctx = { rng: { int: () => 0 } } as never; // 0 < 75: the success branch
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
    const chips = [...root.querySelectorAll<HTMLElement>('.ig-minigame__bar--sequence .ig-minigame__key')].map((c) => c.textContent);
    expect(chips).toEqual(BUSHIDO_SEQUENCES[id]!.map((b) => GLYPH[b]));
    expect(chips.length).toBe(LENGTH[id]);
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
    const tune = SWORDPLAY_TUNING[id]!;
    expect(parseFloat(bar.style.getPropertyValue('--ig-zone-width'))).toBeCloseTo(tune.zonePercent, 1);
    expect(parseFloat(bar.style.getPropertyValue('--ig-zone-start'))).toBeCloseTo(50 - tune.zonePercent / 2, 1);
    // half way across (percent of the bar) after half the travel time
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
