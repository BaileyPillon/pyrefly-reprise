/**
 * r38-motion SKILL TRAVEL's drawing (`spellfx/FlightFx.ts`, `SpellFxLayer.fly`): what a shot draws in each game's skin, how
 * long it flies, that it lands, and the places it draws nothing. Read off the draw list; no GPU.
 */
import { describe, expect, it } from 'vitest';
import { BURST_S, FLIGHT_LEAD_MS, FLIGHT_MIN_MS, FlightLayer, SKIN_SCALE, type Rect } from '../../src/engine/spellfx/FlightFx.ts';
import { FxDrawList, type FxItem } from '../../src/engine/spellfx/FxDrawList.ts';
import { DEFAULT_FLASH_PARAMS, REDUCED_FLASH_PARAMS } from '../../src/engine/spellfx/SpellFxParams.ts';
import { SpellFxLayer } from '../../src/engine/spellfx/SpellFxLayer.ts';
import type { FxGame } from '../../src/engine/spellfx/SpellFxRegistry.ts';

const rects: Record<string, Rect> = {
  caster: { x: 300, y: 450, w: 150, h: 280 },
  boss: { x: 900, y: 150, w: 400, h: 520 },
};
const view = { w: 1600, h: 900 };

function layer(game: FxGame): FlightLayer {
  return new FlightLayer(game, (id) => rects[id] ?? null, () => 0);
}

function frame(l: FlightLayer, game: FxGame, flash = DEFAULT_FLASH_PARAMS, dens = 1): FxItem[] {
  const out = new FxDrawList(game, dens, flash);
  l.draw(out);
  return out.items;
}

const tiles = (items: FxItem[]): string[] => items.map((i) => i.tile);

describe('the flight', () => {
  it('crosses from the caster to the target and lands: the promise settles on the frame the clock reaches the flight time', async () => {
    const l = layer('ffx');
    let landed = false;
    const done = l.launch('caster', 'boss', 'thunder', 'orb', 360).then(() => (landed = true));
    l.advance(0.3);
    await Promise.resolve();
    expect(landed).toBe(false);
    l.advance(0.07); // 0.37 s: past 0.36
    await done;
    expect(landed).toBe(true);
    expect(l.stats()).toMatchObject({ launched: 1, landed: 1, live: 1 }); // still drawing its impact frame
    l.advance(BURST_S + 0.01);
    expect(l.active).toBe(false);
  });

  it('starts at the caster\'s hand and ends on the target\'s chest, on a lifted arc for an orb and flat for a tracer', () => {
    const l = layer('ffx');
    void l.launch('caster', 'boss', 'thunder', 'orb', 400);
    l.advance(0.2);
    const mid = frame(l, 'ffx').find((i) => i.tile === 'mote')!;
    const straight = { x: (375 + 375 + 0.2 * 150 + 1100) / 2, y: (450 + 0.42 * 280 + 150 + 0.45 * 520) / 2 };
    expect(mid.y).toBeLessThan(straight.y); // lifted: screen y is down
    const t = layer('ffx');
    void t.launch('caster', 'boss', 'hit', 'tracer', 150);
    t.advance(0.075);
    const tm = frame(t, 'ffx').find((i) => i.tile === 'mote')!;
    expect(tm.x).toBeGreaterThan(rects['caster']!.x);
    expect(tm.x).toBeLessThan(rects['boss']!.x + rects['boss']!.w / 2);
  });

  it('follows the live rectangles, so a camera cut mid-flight carries the shot with it', () => {
    let boss: Rect = rects['boss']!;
    const l = new FlightLayer('ffx', (id) => (id === 'boss' ? boss : rects[id] ?? null), () => 0);
    void l.launch('caster', 'boss', 'fire', 'orb', 400);
    l.advance(0.1);
    boss = { ...boss, x: boss.x - 400 };
    l.advance(0.31);
    const burst = frame(l, 'ffx').find((i) => i.tile === 'spark4')!;
    expect(burst.x).toBeCloseTo(boss.x + boss.w / 2, 0);
  });
});

describe('each game keeps its own skin', () => {
  it('FFX: round motes, a gold ring on the head, an eight-ray starburst (two stars a quarter turn apart)', () => {
    const l = layer('ffx');
    void l.launch('caster', 'boss', 'thunder', 'orb', 360);
    l.advance(0.18);
    const air = frame(l, 'ffx');
    expect(tiles(air)).toContain('mote');
    expect(tiles(air)).not.toContain('spark4');
    expect(air.some((i) => i.shape === 1 && i.col[0] > 0.85 && i.col[2] < 0.4)).toBe(true); // the gold ring (#E3B94A)
    l.advance(0.2); // landed
    l.advance(0.12); // the impact frame is open
    const impact = frame(l, 'ffx');
    expect(impact.filter((i) => i.tile === 'spark4' && i.w > 80)).toHaveLength(2);
  });

  it('FFX-2: four-point sparkles in the trail and on the head, a four-ray starburst, a pink ring', () => {
    const l = layer('ffx2');
    void l.launch('caster', 'boss', 'thunder', 'orb', 360);
    l.advance(0.18);
    const air = frame(l, 'ffx2');
    expect(tiles(air).filter((t) => t === 'spark4').length).toBeGreaterThan(3);
    l.advance(0.2);
    l.advance(0.12);
    const impact = frame(l, 'ffx2');
    expect(impact.filter((i) => i.tile === 'spark4' && i.w > 80)).toHaveLength(1);
    expect(impact.some((i) => i.shape === 1 && i.col[0] > 0.9 && i.col[1] < 0.8 && i.col[2] > 0.8)).toBe(true); // the pink ring (#F7B6D9)
  });

  it('FFX-2 draws it larger: its frame is wider and its figures smaller', () => {
    const head = (game: FxGame): number => {
      const l = layer(game);
      void l.launch('caster', 'boss', 'thunder', 'orb', 360);
      l.advance(0.1);
      return Math.max(...frame(l, game).filter((i) => i.tile === 'glow').map((i) => i.w));
    };
    expect(head('ffx2') / head('ffx')).toBeCloseTo(SKIN_SCALE.ffx2 / SKIN_SCALE.ffx, 1);
    expect(SKIN_SCALE.ffx2).toBeGreaterThan(1.3);
  });

  it('Darkness is a violet beam that grows from the caster and holds for the impact', () => {
    const l = layer('ffx2');
    void l.launch('caster', 'boss', 'dark', 'beam', 180);
    l.advance(0.1);
    const bars = frame(l, 'ffx2').filter((i) => i.shape === 2);
    expect(bars.length).toBeGreaterThanOrEqual(2);
    const longest = Math.max(...bars.map((b) => b.p[0]));
    expect(longest).toBeGreaterThan(150);
    expect(bars.some((b) => b.col[2] > 0.9 && b.col[0] < 0.75)).toBe(true); // the violet edge (#A66BFF) reads blue-violet
    l.advance(0.1); // landed: the beam holds a beat while the impact opens
    expect(frame(l, 'ffx2').some((i) => i.shape === 2)).toBe(true);
  });
});

describe('quality and accessibility', () => {
  it('the phone thins the trail (density 0.6)', () => {
    const count = (dens: number): number => {
      const l = layer('ffx');
      void l.launch('caster', 'boss', 'fire', 'orb', 360);
      l.advance(0.18);
      return frame(l, 'ffx', DEFAULT_FLASH_PARAMS, dens).length;
    };
    expect(count(0.6)).toBeLessThan(count(1));
  });

  it('REDUCE FLASHES caps the glow over the target (the impact frame never washes the figure)', () => {
    const l = layer('ffx');
    void l.launch('caster', 'boss', 'thunder', 'orb', 360);
    l.advance(0.38);
    // the big soft shapes over the target (glow, star, ring); the small sparkles thrown off are not flashes
    const peak = (flash: typeof REDUCED_FLASH_PARAMS): number => Math.max(...frame(l, 'ffx', flash).filter((i) => i.w > 60 && (i.tile === 'glow' || i.tile === 'spark4' || i.shape === 1)).map((i) => i.a));
    expect(peak(DEFAULT_FLASH_PARAMS)).toBeGreaterThan(0.6);
    expect(peak(REDUCED_FLASH_PARAMS)).toBeLessThanOrEqual(REDUCED_FLASH_PARAMS.actorCap + 1e-9);
    // never a full-screen wash: the list carries quads only
    const out = new FxDrawList('ffx', 1, DEFAULT_FLASH_PARAMS);
    l.draw(out);
    expect(out.washes).toEqual([]);
  });

  it('clearing settles every pending landing so nothing waits for ever', async () => {
    const l = layer('ffx');
    const p = l.launch('caster', 'boss', 'fire', 'orb', 360);
    l.clear();
    await p;
    expect(l.active).toBe(false);
  });
});

describe('SpellFxLayer.fly: when it draws, and how long', () => {
  const mk = (game: FxGame, quality?: 'low'): SpellFxLayer => {
    const l = new SpellFxLayer({ game, rectOf: (id) => rects[id] ?? null, view: () => view });
    if (quality) l.qualityOverride = quality;
    return l;
  };
  const flight = (l: SpellFxLayer, id: string | undefined, kind: 'orb' | 'tracer' | 'beam', ms: number): number => l.fly('caster', 'boss', { ...(id ? { abilityId: id } : {}), kind, ms }).ms;

  it('lands a spell just before its own first mark, inside the wait the spell already has', () => {
    const l = mk('ffx');
    expect(flight(l, 'thunder', 'orb', 480)).toBe(420 - FLIGHT_LEAD_MS); // Thunder's mark is 0.42 s
    expect(flight(l, 'fire', 'orb', 480)).toBe(440); // 0.5 s
    expect(flight(l, 'water', 'orb', 480)).toBe(480); // 0.8 s: the longest an orb flies
  });

  it('stretches only a mark too short for the shot to read (the slash of Darkness: 0.1 s)', () => {
    const l = mk('ffx2');
    expect(flight(l, 'x2-dark-knight-darkness', 'beam', 200)).toBe(FLIGHT_MIN_MS.beam);
    expect(flight(l, 'attack', 'tracer', 150)).toBe(FLIGHT_MIN_MS.tracer);
  });

  it('a spell with no drawn effect (the bare impact bloom) flies the shortest crossing that reads, and adds just that', () => {
    const l = mk('ffx2');
    expect(flight(l, 'x2-dark-knight-demi', 'orb', 480)).toBe(FLIGHT_MIN_MS.orb);
    expect(flight(l, 'x2-dark-knight-drain', 'orb', 480)).toBe(FLIGHT_MIN_MS.orb);
  });

  it('draws nothing, and says so, at the low tier, in FF7, for a special and when a figure is off the field', () => {
    expect(flight(mk('ffx', 'low'), 'thunder', 'orb', 480)).toBe(0); // LOW EFFECTS / REDUCE MOTION
    expect(flight(mk('ff7'), 'thunder', 'orb', 480)).toBe(0);
    expect(flight(mk('ffx'), 'spiral-cut', 'orb', 480)).toBe(0); // D-233's own effect
    expect(flight(mk('ffx2'), 'x2-bahamut-mega-flare', 'orb', 480)).toBe(0);
    expect(mk('ffx').fly('ghost', 'boss', { abilityId: 'thunder', kind: 'orb', ms: 400 }).ms).toBe(0);
    expect(mk('ffx').canFly('thunder', 'caster')).toBe(true);
    expect(mk('ffx', 'low').canFly('thunder', 'caster')).toBe(false);
  });

  it('is counted in the snapshot the capture script reads', () => {
    const l = mk('ffx');
    l.fly('caster', 'boss', { abilityId: 'thunder', kind: 'orb', ms: 480 });
    expect(l.snapshot().flights.launched).toBe(1);
    l.update(0.5);
    expect(l.snapshot().flights.landed).toBe(1);
  });

  it('draws its quads in the layer\'s batch with the effects, and only while something is up', () => {
    const l = mk('ffx');
    expect(l.drawList()).toBeNull();
    l.fly('caster', 'boss', { abilityId: 'thunder', kind: 'orb', ms: 360 });
    l.update(0.1);
    expect(l.drawList()!.count).toBeGreaterThan(5);
    l.update(1); // lands (its impact frame is drawn once)
    l.update(1);
    expect(l.drawList()).toBeNull();
  });

  it('marks of the effect, by the effect\'s own clock: `markIn` counts down to the strike and is 0 after it', () => {
    const l = mk('ffx');
    const ms = l.land('boss', { abilityId: 'thunder', action: 7, hitIndex: 0 });
    expect(ms).toBe(420);
    expect(l.markIn('boss', 7)).toBe(420);
    l.update(0.3);
    expect(l.markIn('boss', 7)).toBe(120);
    l.update(0.2);
    expect(l.markIn('boss', 7)).toBe(0);
    expect(l.markIn('boss', 99)).toBe(0);
  });
});
