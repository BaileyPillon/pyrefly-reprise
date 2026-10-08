/**
 * **Chapter XII — the colour ring around a disc is Fire → Ice → Water → Thunder → Fire**,
 * in the engine, the scene and the readout together (research O-7).
 *
 * Why this file exists: the order was an estimate until 2026-10-07 (GameFAQs' reset
 * cycle drawn as the ring, Fire → Water → Ice → Thunder, B8 = b). The game's own
 * battle AI script settled it: Fire, Ice, Water, Thunder, a magic hit one step
 * forward, a physical hit one step back (datamined from the Steam HD Remaster,
 * build 25501027, 2026-10-07). Three places draw that ring, and they must never
 * drift apart: the rules that turn a disc (`seymour-omnis-rules.ts`), the painted
 * disc that turns on screen (`garden-of-pain-discs.ts`) and the strip that names
 * what each disc shows (`omnisReadoutModel.ts`). The advisor previews the same turn
 * (`advisor-omnis.ts`).
 *
 * The painted masters were painted in the old order, so the scene re-seats their
 * quarters (four triangles, `discGeometry`); the last block reads the real PNGs so
 * the constant that says what they hold cannot be wrong without a red test.
 *
 * **Game case: FFX only** [AGENTS.md rule 14]: the discs exist only in the Chapter XII fight.
 */

import { existsSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import sharp from 'sharp';
import { describe, expect, it } from 'vitest';
import type { BattleEvent, BattleState, Command } from '../../../src/battle/common/types.ts';
import {
  DISC_RING,
  type Element4,
  MORTIPHASM_IDS,
  discAfterTurn,
  omnisDiscs,
  turnDisc,
} from '../../../src/battle/ffx/ai/seymour-omnis-rules.ts';
import { discTurnOf } from '../../../src/engine/tactics/advisor-omnis.ts';
import {
  DISC_PAINTED_RING,
  DISC_RING_ON_SCREEN,
  GardenDiscs,
  discAngleFor,
  discGeometry,
  nearestAngle,
  quarterTurns,
} from '../../../src/scenes/garden-of-pain-discs.ts';
import { discPlacements } from '../../../src/scenes/garden-of-pain.ts';
import { ELEMENT_NAME, intentText, omnisReadoutView } from '../../../src/ui/ffx/omnisReadoutModel.ts';
import { newEngine } from '../helpers/omnisUnits.ts';

const HERE = dirname(fileURLToPath(import.meta.url));
const ROOT = join(HERE, '..', '..', '..');

/** The ring, written out once, the way the game's script walks it: Fire, Ice, Water, Thunder. */
const RING: readonly Element4[] = ['fire', 'ice', 'water', 'lightning'];
/** One lap by spells (forward) and one by blows (back), starting from Fire. */
const BY_SPELLS: readonly Element4[] = ['ice', 'water', 'lightning', 'fire'];
const BY_BLOWS: readonly Element4[] = ['lightning', 'water', 'ice', 'fire'];

type RulesCtx = Parameters<typeof turnDisc>[0];
const ctxOf = (engine: ReturnType<typeof newEngine>): RulesCtx => (engine as unknown as { ctx: RulesCtx }).ctx;

/** The newest `affinity-change` the engine logged (what the presenter, the tap and the strip read). */
function lastTurn(engine: ReturnType<typeof newEngine>): Extract<BattleEvent, { type: 'affinity-change' }> {
  const log = engine.state().log;
  for (let i = log.length - 1; i >= 0; i--) {
    const e = log[i]!;
    if (e.type === 'affinity-change') return e;
  }
  throw new Error('the engine logged no disc turn');
}

describe('the ring in the engine', () => {
  it('is Fire, Ice, Water, Thunder; a spell steps forward round it, a blow steps back', () => {
    expect([...DISC_RING]).toEqual(RING);
    let now: Element4 = 'fire';
    const forward: Element4[] = [];
    for (let i = 0; i < 4; i++) forward.push((now = discAfterTurn(now, 'right')));
    expect(forward).toEqual(BY_SPELLS);
    const back: Element4[] = [];
    for (let i = 0; i < 4; i++) back.push((now = discAfterTurn(now, 'left')));
    expect(back).toEqual(BY_BLOWS);
    for (const e of RING) expect(discAfterTurn(discAfterTurn(e, 'right'), 'left')).toBe(e); // a blow undoes a spell
  });

  it('the live engine turns a disc the same way: a lap of spells, then a lap of blows, each logged with its direction and its facings', () => {
    const e = newEngine(1);
    const ctx = ctxOf(e);
    for (const [direction, expected] of [['right', BY_SPELLS], ['left', BY_BLOWS]] as const) {
      for (const element of expected) {
        turnDisc(ctx, 0, direction);
        const turn = lastTurn(e);
        expect(turn).toMatchObject({ cause: 'part-turn', partId: 'mortiphasm-1', direction });
        expect(turn.facings?.['mortiphasm-1']).toBe(element);
        expect(omnisDiscs(e.state())[0]).toBe(element);
      }
    }
    expect(omnisDiscs(e.state())).toEqual(['fire', 'fire', 'fire', 'fire']); // two laps, back where it began
  });
});

describe('the advisor previews the turn the engine makes', () => {
  /** What the advisor says disc 1 shows after a landed hit of this kind on a disc that shows `element`. */
  function previewed(element: Element4, direction: 'left' | 'right'): Element4 {
    const e = newEngine(1);
    const state = structuredClone(e.state()) as BattleState;
    state.flags['omnis.discs'] = `${element},fire,fire,fire`;
    const command: Command = direction === 'left' ? { kind: 'attack', targets: ['mortiphasm-1'] } : { kind: 'ability', id: 'blizzara', targets: ['mortiphasm-1'] };
    const outcome = { events: [{ type: 'damage', targetId: 'mortiphasm-1', amount: 0 }], ability: direction === 'left' ? null : { damageType: 'magical' } } as never;
    const turn = discTurnOf(state, command, outcome);
    expect(turn?.direction).toBe(direction);
    return turn!.after[0]!;
  }

  /** What the engine does to disc 1 in the same position. */
  function turned(element: Element4, direction: 'left' | 'right'): Element4 {
    const e = newEngine(1);
    e.state().flags['omnis.discs'] = `${element},fire,fire,fire`;
    turnDisc(ctxOf(e), 0, direction);
    return omnisDiscs(e.state())[0]!;
  }

  it('agrees with the engine for every colour and both directions', () => {
    for (const element of RING) {
      for (const direction of ['left', 'right'] as const) expect(previewed(element, direction), `${element} ${direction}`).toBe(turned(element, direction));
    }
  });
});

describe('the ring on screen', () => {
  it('runs clockwise from screen right as Fire, Thunder, Water, Ice: the engine ring read the way a spell turns the disc', () => {
    expect([...DISC_RING_ON_SCREEN]).toEqual(['fire', 'lightning', 'water', 'ice']);
    expect([...DISC_RING_ON_SCREEN]).toEqual([RING[0], ...RING.slice(1).reverse()]);
  });

  it('a spell turns the disc a quarter clockwise round the ring, a blow a quarter back, on both sides of him', () => {
    for (const towardHim of [0, 180] as const) {
      RING.forEach((from, i) => {
        const next = RING[(i + 1) % 4]!;
        const a = discAngleFor(from, towardHim);
        expect(nearestAngle(a, discAngleFor(next, towardHim)) - a, `${from} to ${next}`).toBe(90);
        const b = discAngleFor(next, towardHim);
        expect(nearestAngle(b, discAngleFor(from, towardHim)) - b, `${next} to ${from}`).toBe(-90);
      });
    }
  });

  it('every quarter shows the painted quarter of its own colour: the table of turns puts each colour where the ring says', () => {
    const turns = quarterTurns();
    expect(turns).toEqual([0, 2, 3, 3]);
    DISC_RING_ON_SCREEN.forEach((element, k) => expect(DISC_PAINTED_RING[(k + turns[k]!) % 4], `shown quarter ${k}`).toBe(element));
    // A painting already in the shown order needs no turn at all.
    expect(quarterTurns(DISC_RING_ON_SCREEN, DISC_RING_ON_SCREEN)).toEqual([0, 0, 0, 0]);
  });

  /** A point in the disc's plane and its source point on the painting, as angles clockwise from screen right. */
  const clockwiseDeg = (x: number, y: number): number => ((Math.round((Math.atan2(-y, x) * 180) / Math.PI) % 360) + 360) % 360;

  it('the disc is four quarter triangles tiling the square, each sampling the painted quarter of its colour a whole number of quarter turns away', () => {
    const size = 2;
    const h = size / 2;
    const geometry = discGeometry(size);
    const pos = geometry.getAttribute('position');
    const uv = geometry.getAttribute('uv');
    expect(pos.count).toBe(12);
    expect(uv.count).toBe(12);
    let area = 0;
    for (let k = 0; k < 4; k++) {
      const v = [0, 1, 2].map((j) => ({ x: pos.getX(3 * k + j), y: pos.getY(3 * k + j), u: uv.getX(3 * k + j), v: uv.getY(3 * k + j) }));
      const [o, b, a] = v as [(typeof v)[0], (typeof v)[0], (typeof v)[0]];
      const signed = ((b.x - o.x) * (a.y - o.y) - (a.x - o.x) * (b.y - o.y)) / 2;
      expect(signed, `quarter ${k} faces the camera (counter-clockwise)`).toBeGreaterThan(0);
      area += signed;
      for (const p of v) expect([0, 0.5, 1]).toContain(p.u); // every UV is a corner of the painting or its centre: the pixels are moved, never resampled
      for (const p of v) expect([0, 0.5, 1]).toContain(p.v);
      // The quarter's own centroid lies on its axis, k x 90 degrees clockwise from screen right...
      const shown = clockwiseDeg((o.x + a.x + b.x) / 3, (o.y + a.y + b.y) / 3);
      expect(shown).toBe(90 * k);
      // ...and samples the painting on the axis of the quarter that holds its colour.
      const su = (o.u + a.u + b.u) / 3;
      const sv = (o.v + a.v + b.v) / 3;
      const source = clockwiseDeg((2 * su - 1) * h, (2 * sv - 1) * h);
      const painted = DISC_PAINTED_RING.indexOf(DISC_RING_ON_SCREEN[k]!);
      expect(source, `the source of quarter ${k}`).toBe(90 * painted);
    }
    expect(area).toBeCloseTo(size * size, 10);
  });

  it('with the painting already in the shown order the four triangles are the plain square', () => {
    const plain = discGeometry(2, quarterTurns(DISC_RING_ON_SCREEN, DISC_RING_ON_SCREEN));
    const pos = plain.getAttribute('position');
    const uv = plain.getAttribute('uv');
    for (let i = 0; i < pos.count; i++) {
      expect(uv.getX(i)).toBeCloseTo((pos.getX(i) + 1) / 2, 12);
      expect(uv.getY(i)).toBeCloseTo((pos.getY(i) + 1) / 2, 12);
    }
  });

  it('GardenDiscs draws every disc with those four triangles and keeps the plain square for the facing layer', () => {
    const discs = new GardenDiscs(discPlacements(), 1.5);
    const meshes = discs.group.children as unknown as Array<{ name: string; geometry: { getAttribute(n: string): { count: number } } }>;
    const body = meshes.filter((m) => m.name.startsWith('mortiphasm-disc:'));
    const face = meshes.filter((m) => m.name.startsWith('mortiphasm-facing:'));
    expect(body.map((m) => m.name)).toEqual(MORTIPHASM_IDS.map((id) => `mortiphasm-disc:${id}`));
    for (const m of body) expect(m.geometry.getAttribute('position').count).toBe(12);
    expect(face).toHaveLength(4);
    for (const m of face) expect(m.geometry.getAttribute('position').count).toBe(4);
    discs.dispose();
  });
});

describe('the ring in the readout', () => {
  it('names, round a whole lap, what the engine turned the disc to, and says so in the intent line', () => {
    for (const [direction, expected] of [['right', BY_SPELLS], ['left', BY_BLOWS]] as const) {
      const e = newEngine(1);
      const ctx = ctxOf(e);
      for (const element of expected) {
        turnDisc(ctx, 0, direction);
        const discs = omnisDiscs(e.state());
        const view = omnisReadoutView({ discs, state: 'normal', living: 3, turned: [0], weakBefore: null });
        expect(view.chips.find((c) => c.index === 0)).toMatchObject({ element, name: ELEMENT_NAME[element], turned: true });
        const lead = element === 'fire' ? 'Every disc shows Fire' : `One disc turned to ${ELEMENT_NAME[element]}`;
        expect(intentText(view.intent).startsWith(`${lead}: `), intentText(view.intent)).toBe(true);
      }
    }
  });
});

describe('the engine, the scene and the strip march round one ring together', () => {
  it('a lap of spells turns the painted disc +90 degrees a hit, a lap of blows -90, and the strip names the colour the engine logged', () => {
    for (const [direction, expected, step] of [['right', BY_SPELLS, 90], ['left', BY_BLOWS, -90]] as const) {
      const e = newEngine(1);
      const ctx = ctxOf(e);
      let drawn = discAngleFor('fire', 0); // the scene opens on Fire
      for (const element of expected) {
        turnDisc(ctx, 0, direction);
        const logged = lastTurn(e).facings?.['mortiphasm-1'] as Element4;
        expect(logged).toBe(element); // the engine
        const aimed = nearestAngle(drawn, discAngleFor(logged, 0)); // the scene turns the short way
        expect(aimed - drawn, `${direction}: ${logged}`).toBe(step);
        drawn = aimed;
        const view = omnisReadoutView({ discs: omnisDiscs(e.state()), state: 'normal', living: 3, turned: [0], weakBefore: null });
        expect(view.chips.find((c) => c.index === 0)?.name).toBe(ELEMENT_NAME[logged]); // the strip
      }
      expect(drawn - discAngleFor('fire', 0)).toBe(4 * step); // one whole lap, and the disc stands on Fire again
    }
  });
});

describe('the painted masters hold the order the scene says they hold (needs public/art)', () => {
  const MASTERS = [
    { file: 'public/art/characters/mortiphasm/idle.png', scale: 1 },
    { file: 'public/art/characters/mortiphasm/idle@2x.png', scale: 2 },
  ] as const;
  const HAVE_ART = MASTERS.every((m) => existsSync(join(ROOT, m.file)));
  /** The tints the disc was painted with (`research/ffx-seymour-omnis.md` §4.1; `mortiphasm/idle.json` quarterColours). */
  const SOURCED: Readonly<Record<Element4, readonly [number, number, number]>> = {
    fire: [240, 118, 30],
    ice: [160, 100, 235],
    water: [40, 120, 235],
    lightning: [245, 212, 50],
  };
  const unit = (c: readonly number[]): number[] => {
    const n = Math.hypot(...c);
    return c.map((v) => v / n);
  };
  const cosine = (a: readonly number[], b: readonly number[]): number => unit(a).reduce((s, v, i) => s + v * unit(b)[i]!, 0);

  for (const { file, scale } of MASTERS) {
    it.skipIf(!HAVE_ART)(`${file}: quarter k, k x 90 degrees clockwise from screen right, is DISC_PAINTED_RING[k] (a different painting needs the constant and the turns re-stated)`, async () => {
      const { data, info } = await sharp(join(ROOT, file)).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
      expect(info.width).toBe(668 * scale);
      const centre = (info.width - 1) / 2;
      const radius = 318 * scale;
      DISC_PAINTED_RING.forEach((expected, k) => {
        for (const reach of [0.45, 0.55, 0.65]) {
          const angle = (k * Math.PI) / 2; // image y points down, so +y is clockwise on screen
          const px = Math.round(centre + Math.cos(angle) * radius * reach);
          const py = Math.round(centre + Math.sin(angle) * radius * reach);
          const sum = [0, 0, 0];
          let n = 0;
          for (let y = py - 6 * scale; y <= py + 6 * scale; y++) {
            for (let x = px - 6 * scale; x <= px + 6 * scale; x++) {
              const at = (y * info.width + x) * info.channels;
              if (data[at + 3]! < 250) continue;
              for (let c = 0; c < 3; c++) sum[c] = (sum[c] ?? 0) + data[at + c]!;
              n++;
            }
          }
          expect(n, `quarter ${k} at ${reach} of the radius is opaque paint`).toBeGreaterThan(0);
          const mean = sum.map((v) => v / n);
          const ranked = (Object.keys(SOURCED) as Element4[]).map((e) => [e, cosine(mean, SOURCED[e])] as const).sort((a, b) => b[1] - a[1]);
          expect(ranked[0]![0], `quarter ${k} at ${reach} of the radius (mean ${mean.map(Math.round)})`).toBe(expected);
          expect(ranked[0]![1] - ranked[1]![1]).toBeGreaterThan(0.01); // not a near tie with its runner-up
        }
      });
    });
  }
});
