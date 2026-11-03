/**
 * **The painted glyphs say what the engine says** (FFX only; the hidden Spectral Keeper chapter; r75-boss-art, independent check finding M1, the driver's decision 219u).
 *
 * The stage draws a platform with its `occupied` painting while somebody stands on it. The engine's flags are not that answer: a Switch hands the platform to the member coming in and leaves the outgoing member's
 * `plat.at.<id>` flag where it was, and an Ejected member's flag is never cleared. The engine's own answer is `freeCircleIds` (the platforms Move may land on). Before the fix `decalStateOf` read the raw flags, so after a
 * Switch (and after an Eject) the glyph showed a FREE platform as taken for the rest of the fight. These tests run the REAL engine (hard rule 3: no hand-made flags) through a hand-over, a Move, an Eject, a KO, a
 * summon and a mine, and compare every glyph with `freeCircleIds`; one runs the whole way through `PartRings.sync`, the call the stage makes.
 *
 * Game case: FFX only (the Keeper is FFX's; nothing here is true of FFX-2).
 */
import { describe, expect, it } from 'vitest';
import { Group, PerspectiveCamera, Texture } from 'three';
import { PartRings, decalStateOf, type DecalLoader, type DecalState, type FloorDecal, type PartAnchor } from '../../../src/engine/PartAnchors.ts';
import { SPECTRAL_KEEPER_PART_ANCHORS } from '../../../src/scenes/spectral-keeper.ts';
import { armCircle, freeCircleIds } from '../../../src/battle/ffx/platforms.ts';
import { actor, circleId, ctxOf, inputFor, move, newEngine, nextInput, platformOfId } from '../helpers/keeperDrive.ts';

type Engine = ReturnType<typeof newEngine>;

const ringOf = (platform: number): { litFlag?: string; decal?: FloorDecal } => {
  const a = SPECTRAL_KEEPER_PART_ANCHORS[circleId(platform)] as PartAnchor;
  if (a.mode !== 'overhead' || !a.floorRing) throw new Error(`platform ${platform} has no floor ring`);
  return a.floorRing;
};

/** What each glyph (platforms 1 to 7) would draw now, from the real engine's own state. */
const glyphs = (engine: Engine): DecalState[] => [1, 2, 3, 4, 5, 6, 7].map((p) => decalStateOf(engine.state(), ringOf(p)));

/** The platforms (1 to 6) the engine says Move may land on. */
const free = (engine: Engine): number[] => freeCircleIds(ctxOf(engine)).map((id) => Number(id.replace('spectral-circle-', '')));

/** The invariant: a glyph shows `occupied` exactly when the engine counts the platform as held (a lit one shows the mine's picture whoever stands on it). */
function expectGlyphsAgreeWithEngine(engine: Engine, label: string): void {
  const states = glyphs(engine);
  const freeNow = free(engine);
  for (let p = 1; p <= 6; p++) {
    if (states[p - 1] === 'mined') continue;
    expect(states[p - 1] === 'occupied', `${label}: glyph ${p} is ${states[p - 1]}; the engine's free platforms are ${freeNow.join(',')}`).toBe(!freeNow.includes(p));
  }
}

const eject = (engine: Engine, id: string): void => {
  actor(engine, id).statuses['eject'] = { id: 'eject', turnsRemaining: 255, ticksRemaining: null, charges: null, stacks: 0, permanent: true };
};

describe('the glyphs follow the real engine (FFX only)', () => {
  it('at the opening: the front line stands on 1, 2 and 3; 4 to 6 and the rock are plain', () => {
    const engine = newEngine(31);
    expect(glyphs(engine)).toEqual(['occupied', 'occupied', 'occupied', 'unlit', 'unlit', 'unlit', 'unlit']);
    expect(free(engine)).toEqual([4, 5, 6]);
    expectGlyphsAgreeWithEngine(engine, 'opening');
  });

  it('a Switch hands the platform on, then the newcomer Moves: the platform he left is FREE and its glyph is plain, though Yuna\'s flag still says 2', () => {
    const engine = newEngine(24);
    const yuna = inputFor(engine, 'yuna');
    const sw = yuna.commands.find((c) => c.command.kind === 'switch' && c.command.extra.inId === 'wakka' && c.enabled)!;
    engine.submit(sw.command);
    expect(platformOfId(engine, 'wakka')).toBe(2);
    expect(platformOfId(engine, 'yuna'), 'the engine never clears the outgoing member\'s flag (RE 3 item 6)').toBe(2);
    expect(glyphs(engine).slice(0, 4), 'after the hand-over Wakka holds 2').toEqual(['occupied', 'occupied', 'occupied', 'unlit']);
    expectGlyphsAgreeWithEngine(engine, 'after the Switch');

    const wakka = nextInput(engine);
    expect(wakka.actorId).toBe('wakka');
    engine.submit(move(wakka, 4)!);
    expect(platformOfId(engine, 'wakka')).toBe(4);
    expect(platformOfId(engine, 'yuna'), 'Yuna\'s flag is still 2: this is the stale one').toBe(2);
    expect(free(engine)).toEqual([2, 5, 6]);
    expect(glyphs(engine)).toEqual(['occupied', 'unlit', 'occupied', 'occupied', 'unlit', 'unlit', 'unlit']);
    expectGlyphsAgreeWithEngine(engine, 'after the Switch and the Move');
  });

  it('an Eject frees the platform: its glyph is plain although the Ejected member\'s flag still names it', () => {
    const engine = newEngine(25);
    inputFor(engine, 'tidus');
    eject(engine, 'tidus');
    inputFor(engine, 'auron');
    expect(platformOfId(engine, 'tidus'), 'the flag outlives the Eject').toBe(1);
    expect(free(engine)).toEqual([1, 4, 5, 6]);
    expect(glyphs(engine)).toEqual(['unlit', 'occupied', 'occupied', 'unlit', 'unlit', 'unlit', 'unlit']);
    expectGlyphsAgreeWithEngine(engine, 'after the Eject');
  });

  it('a KO keeps its platform (the engine and the glyph agree: still held)', () => {
    const engine = newEngine(26);
    inputFor(engine, 'tidus');
    const tidus = actor(engine, 'tidus');
    tidus.statuses['ko'] = { id: 'ko', turnsRemaining: 255, ticksRemaining: null, charges: null, stacks: 0, permanent: true };
    tidus.hp = 0;
    tidus.alive = false;
    inputFor(engine, 'yuna');
    expect(free(engine)).not.toContain(1);
    expect(glyphs(engine)[0]).toBe('occupied');
    expectGlyphsAgreeWithEngine(engine, 'after the KO');
  });

  it('with an aeon out the glyphs still agree with the engine (the front three keep their platforms)', () => {
    const engine = newEngine(61);
    const yuna = inputFor(engine, 'yuna');
    const summon = yuna.commands.find((c) => c.command.kind === 'summon' && c.enabled)!;
    engine.submit(summon.command);
    nextInput(engine);
    expectGlyphsAgreeWithEngine(engine, 'with an aeon out');
  });

  it('an armed Circle shows the mine, whoever stands on it; the others keep agreeing', () => {
    const engine = newEngine(32);
    armCircle(ctxOf(engine), circleId(5));
    armCircle(ctxOf(engine), circleId(2)); // Yuna stands on 2: the mine's picture still wins
    const states = glyphs(engine);
    expect(states[4]).toBe('mined');
    expect(states[1]).toBe('mined');
    expectGlyphsAgreeWithEngine(engine, 'with two mines');
  });
});

describe('the stage\'s call (`PartRings.sync` with the engine\'s own state) draws the same glyphs', () => {
  const camera = new PerspectiveCamera();
  const parent = { x: 0, y: 0, z: -6, height: 3 };
  const flush = (): Promise<void> => new Promise((r) => setTimeout(r, 0));
  const load: DecalLoader = async () => new Texture();

  it('after a Switch and a Move, the ring of platform 2 draws the plain picture and platform 4 the occupied one', async () => {
    const engine = newEngine(24);
    const yuna = inputFor(engine, 'yuna');
    engine.submit(yuna.commands.find((c) => c.command.kind === 'switch' && c.command.extra.inId === 'wakka' && c.enabled)!.command);
    engine.submit(move(nextInput(engine), 4)!);

    const root = new Group();
    const rings = new PartRings(root, load);
    for (let p = 1; p <= 7; p++) rings.add(circleId(p), SPECTRAL_KEEPER_PART_ANCHORS[circleId(p)] as PartAnchor);
    await flush();
    for (let i = 0; i < 12; i++) {
      for (let p = 1; p <= 7; p++) rings.sync(circleId(p), engine.state());
      rings.update(0.25, () => parent, camera);
    }
    const drawn = Object.fromEntries(rings.snapshot().map((r) => [r.id, r.decal?.state]));
    expect(drawn[circleId(2)], 'platform 2 is free').toBe('unlit');
    expect(drawn[circleId(4)], 'platform 4 is held by Wakka').toBe('occupied');
    expect([1, 2, 3, 4, 5, 6, 7].map((p) => drawn[circleId(p)])).toEqual(glyphs(engine));
  });
});
