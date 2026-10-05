/**
 * Lady Luck's timed reels (Bailey's pick A of 2026-10-04; FFX-2 only): the random half of a human's spin is the **engine's**.
 *
 * The overlay times the presses against a strip that runs at a constant rate (`src/ui/ffx2/ladyLuckTiming.ts`). What the
 * player's hands decide is *when* each press lands; the stop order (the pink arrow's order) and where each strip starts
 * must still be a function of the seed. So the engine draws them from its seeded stream when it raises the
 * `minigame-request` (`src/battle/ffx2/minigames.ts` `rollReelLayout`), and the overlay reads them off the request. Before
 * this the overlay drew them itself with `Math.random`.
 *
 * Every assertion is made on the shipped data through the real engine: the request a human's Magic Reels raises, the one
 * Attack Reels raises, the request Trigger Happy raises (which carries no layout), and the unattended spin (no request,
 * the stream it always had).
 */
import { describe, expect, it } from 'vitest';
import {
  FFX2Engine,
  abilityRegistryFrom,
  dressphereRegistryFrom,
  garmentGridRegistryFrom,
  itemRegistryFrom,
  rollReelLayout,
  rollReels,
} from '../../src/battle/ffx2/index.ts';
import { SeededRng } from '../../src/battle/common/rng.ts';
import type { BattleEvent, Command, FFX2PartyBuild } from '../../src/battle/common/types.ts';
import * as data from '../../src/data/ffx2/index.ts';
import { farplaneBuild } from '../../src/data/ffx2/builds/farplane.ts';
import { LADY_LUCK_REELS } from '../../src/data/ffx2/reels.ts';

const MAGIC_REELS = 'x2-lady-luck-magic-reels';
const ATTACK_REELS = 'x2-lady-luck-attack-reels';
const SPINNER = 'yuna';

type Request = Extract<BattleEvent, { type: 'minigame-request' }>;

function party(): FFX2PartyBuild {
  const [yuna, rikku, paine] = farplaneBuild.members;
  return { ...farplaneBuild, members: [{ ...yuna, currentDressphere: 'lady-luck' }, rikku, paine] };
}

function newEngine(seed: number, minigames: boolean): FFX2Engine {
  const engine = new FFX2Engine({
    abilities: abilityRegistryFrom(Object.values(data.ABILITIES)),
    items: itemRegistryFrom(Object.values(data.ITEMS)),
    dresspheres: dressphereRegistryFrom(Object.values(data.STANDARD_DRESSPHERES)),
    garmentGrids: garmentGridRegistryFrom(Object.values(data.GARMENT_GRIDS)),
    minigames,
  });
  engine.init({ game: 'ffx2', party: party(), enemies: data.ENEMY_GROUPS_BY_ID['vegnagun-tail']!, triggers: [], seed, condition: 'normal', canEscape: false });
  return engine;
}

/** Drive to the spinner's turn, throw `reelId` with nobody at the controls of the answer, and return what the engine raised. */
function runUntilRequest(seed: number, reelId: string, minigames = true): { request: Request | null; events: BattleEvent[] } {
  const engine = newEngine(seed, minigames);
  const events: BattleEvent[] = [];
  let submitted = false;
  const take = (batch: BattleEvent[]): Request | null => {
    for (const e of batch) {
      if (submitted) events.push(e);
      if (e.type === 'minigame-request') return e;
    }
    return null;
  };
  for (let i = 0; i < 4000; i++) {
    const d = engine.nextDecision();
    if (d.kind === 'battle-over') break;
    if (d.kind === 'resolved') {
      const r = take(d.events);
      if (r) return { request: r, events };
      continue;
    }
    if (d.kind === 'waiting') {
      const r = take(engine.tick(d.nextEventMs));
      if (r) return { request: r, events };
      if (submitted && events.some((e) => e.type === 'action-end' && (e as { actorId?: string }).actorId === SPINNER)) break;
      continue;
    }
    if (d.kind !== 'player-input') break;
    if (d.actorId === SPINNER && !submitted) {
      const row = d.commands.find((c) => c.command.kind === 'ability' && c.command.id === reelId);
      if (!row) throw new Error(`${reelId} was not offered`);
      submitted = true;
      const r = take(engine.submit({ ...row.command, targets: [row.validTargets[0]!] } as Command));
      if (r) return { request: r, events };
      continue;
    }
    const filler = d.commands.find((c) => c.enabled && c.command.kind === 'attack' && c.validTargets.length > 0)
      ?? d.commands.find((c) => c.enabled && c.validTargets.length > 0);
    if (!filler) break;
    const r = take(engine.submit({ ...filler.command, targets: [filler.validTargets[0]!] } as Command));
    if (r) return { request: r, events };
  }
  return { request: null, events };
}

const isPermutation = (v: unknown): boolean => Array.isArray(v) && v.length === 3 && [0, 1, 2].every((i) => v.includes(i));

describe('a human’s Lady Luck spin carries its seeded layout on the minigame-request (FFX-2 only)', () => {
  it('Magic Reels: a stop order that is a permutation of the three reels, three strip phases inside the six-symbol strip, and the strip itself', () => {
    const { request } = runUntilRequest(3, MAGIC_REELS);
    expect(request, 'the spin never asked for its overlay').not.toBeNull();
    const p = request!.params;
    expect(request!.kind).toBe('ladyluck-reels');
    expect(p['symbols']).toEqual([...LADY_LUCK_REELS.magic.symbols]);
    expect(isPermutation(p['stopOrder'])).toBe(true);
    const phases = p['phases'] as number[];
    expect(phases).toHaveLength(3);
    for (const x of phases) {
      expect(Number.isFinite(x)).toBe(true);
      expect(x).toBeGreaterThanOrEqual(0);
      expect(x).toBeLessThan(6);
    }
  });

  it('Attack Reels carry it too, over their own strip', () => {
    const { request } = runUntilRequest(3, ATTACK_REELS);
    expect(request!.params['symbols']).toEqual([...LADY_LUCK_REELS.attack.symbols]);
    expect(isPermutation(request!.params['stopOrder'])).toBe(true);
    expect((request!.params['phases'] as number[]).length).toBe(3);
  });

  it('is a function of the seed: the same seed asks for the same layout, and the seeds do not all agree', () => {
    const layouts = (seed: number): string => {
      const p = runUntilRequest(seed, MAGIC_REELS).request!.params;
      return JSON.stringify([p['stopOrder'], p['phases']]);
    };
    for (const seed of [1, 2, 3, 4, 5]) expect(layouts(seed), `seed ${seed}`).toBe(layouts(seed));
    const distinct = new Set([1, 2, 3, 4, 5, 6, 7, 8].map(layouts));
    expect(distinct.size).toBeGreaterThan(5);
  });

  it('draws the five values exactly once, at the request: everything before it is the stream it was, and an unattended spin never draws them', () => {
    // five draws, in a fixed order: two for the stop order, three for the phases
    const a = new SeededRng(11);
    const b = new SeededRng(11);
    rollReelLayout(a, 6);
    for (let i = 0; i < 5; i++) b.next();
    expect(a.next()).toBe(b.next());

    // the engine's own blind roll is untouched: still exactly three draws, and no request at all
    const c = new SeededRng(12);
    const d = new SeededRng(12);
    rollReels(c);
    for (let i = 0; i < 3; i++) d.next();
    expect(c.next()).toBe(d.next());
    const unattended = runUntilRequest(3, MAGIC_REELS, false);
    expect(unattended.request).toBeNull();
    expect(unattended.events.some((e) => e.type === 'message' && /Dud!|Flare|Cura|Bio|Break|Thundara|Esuna|Demi|Firaga|Black Sky|Ultima|Auto-Life/.test((e as { text: string }).text))).toBe(true);
  });

  it('the stop order shuffles over many seeds: all six orders turn up, none dominates', () => {
    const rng = new SeededRng(99);
    const count = new Map<string, number>();
    for (let i = 0; i < 1200; i++) {
      const { stopOrder } = rollReelLayout(rng, 6);
      const key = stopOrder.join('');
      count.set(key, (count.get(key) ?? 0) + 1);
    }
    expect([...count.keys()].sort()).toEqual(['012', '021', '102', '120', '201', '210']);
    for (const n of count.values()) expect(n).toBeGreaterThan(140); // 200 each in expectation
  });

  it('phases are spread across the strip (the layout is not a fixed offset)', () => {
    const rng = new SeededRng(5);
    let min = 6;
    let max = 0;
    for (let i = 0; i < 300; i++) {
      for (const x of rollReelLayout(rng, 6).phases) {
        min = Math.min(min, x);
        max = Math.max(max, x);
      }
    }
    expect(min).toBeLessThan(0.3);
    expect(max).toBeGreaterThan(5.7);
  });
});
