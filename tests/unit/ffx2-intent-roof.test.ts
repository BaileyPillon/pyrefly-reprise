// @vitest-environment jsdom
/**
 * **A scene may hang the FFX-2 enemy-intent slab over the highest enemy's head (Chapter VI, FFX-2 only; branch r3941-spacing).**
 *
 * Bailey, 2026-10-08: the Syndicate stand where release 39.4 stood them, at their real sizes, and a card that now meets a head is "fixed with the card, not by
 * moving the fiends". The far-back tall fiends (Logos 2.119, Ormi 1.935) hold their heads higher on the screen than the near, shorter one (Fem-Goon, Ormi in
 * Act II), so a slab hung over the acting fiend's head lay across theirs: Act III's first card (Leblanc's) cut Logos's cap, and Act II's card, when Ormi was next,
 * covered 68 percent of Logos's head; and a tall slab held under the top bar reached every head (Act I's Blizzard card; every card at 1280x720).
 * `SceneStaging.intentRoof` hangs the slab over the **roof**, the highest living enemy's head, keeping the acting fiend's x (`FFX2BattleHud.intentHead`,
 * `intentBoard.highestEnemyHead`), and folds its body to the room above the roof (`intentMaxHeight`, `intentRoom`; the panel's half is
 * `ui-enemy-intent-fold.test.ts`). Measured on the real HUD at 1280x720, 1600x900 and 1920x1080 the slab then covers no head in any act, whichever fiend acts.
 *
 * The scene -> HUD wiring is `BattleScreen` -> `createHud(game, field, engine, artNamespace, advisorCap, intentRoof)` -> `new FFX2BattleHud({ intentRoof })`.
 */
import { readdirSync, readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';
import { createHud } from '../../src/app/screens/BattleScreenWiring.ts';
import type { BattleState, CombatantId } from '../../src/battle/common/types.ts';
import { LEBLANC_LAST_ROOM_SLOTS } from '../../src/scenes/leblanc-last-room.ts';
import { stagingOf } from '../../src/scenes/types.ts';
import { FFX2BattleHud } from '../../src/ui/ffx2/FFX2BattleHud.ts';
import type { IntentView } from '../../src/ui/common/EnemyIntent.ts';
import { highestEnemyHead, intentRoom, type ProjectFn } from '../../src/ui/ffx2/intentBoard.ts';

const here = dirname(fileURLToPath(import.meta.url));

type Fake = { side: 'party' | 'enemy'; hp?: number; removed?: boolean; hidden?: boolean };
/** A battle state with just what the roof reads: who is an enemy, alive, staged. */
function stateOf(combatants: Record<string, Fake>, enemyIds: string[]): BattleState {
  const out: Record<string, unknown> = {};
  for (const [id, c] of Object.entries(combatants)) out[id] = { id, side: c.side, hp: c.hp ?? 100, removed: c.removed ?? false, flags: c.hidden ? { hidden: true } : {} };
  return { combatants: out, enemyIds } as unknown as BattleState;
}

/** A projector over a table of head points (the chest and the feet hang 100 and 200 px under the head). */
function projectorOf(heads: Record<string, { x: number; y: number }>): ProjectFn {
  return (id, anchor = 'head') => {
    const h = heads[id];
    return h ? { x: h.x, y: h.y + (anchor === 'chest' ? 100 : anchor === 'feet' ? 200 : 0) } : null;
  };
}

const HEADS = {
  near: { x: 1000, y: 420 }, // Fem-Goon: near and short, the lowest head on the screen
  mid: { x: 850, y: 372 }, // Dr. Goon
  far: { x: 920, y: 350 }, // Ormi: far and tall, the highest
  yuna: { x: 300, y: 480 }, // a girl: never part of the roof
};
const STATE = stateOf({ near: { side: 'enemy' }, mid: { side: 'enemy' }, far: { side: 'enemy' }, yuna: { side: 'party' } }, ['near', 'mid', 'far']);

describe('highestEnemyHead: the roof', () => {
  it('is the smallest head y of the living enemies, never a girl\'s', () => {
    expect(highestEnemyHead(STATE, projectorOf(HEADS))).toBe(350);
    expect(highestEnemyHead(STATE, projectorOf({ ...HEADS, yuna: { x: 300, y: 100 } }))).toBe(350); // a girl standing higher does not count
  });

  it('drops with the highest fiend: a dead, hidden or removed one is not the roof', () => {
    const proj = projectorOf(HEADS);
    expect(highestEnemyHead(stateOf({ near: { side: 'enemy' }, mid: { side: 'enemy' }, far: { side: 'enemy', hp: 0 } }, ['near', 'mid', 'far']), proj)).toBe(372);
    expect(highestEnemyHead(stateOf({ near: { side: 'enemy' }, mid: { side: 'enemy' }, far: { side: 'enemy', hidden: true } }, ['near', 'mid', 'far']), proj)).toBe(372);
    expect(highestEnemyHead(stateOf({ near: { side: 'enemy' }, mid: { side: 'enemy' }, far: { side: 'enemy', removed: true } }, ['near', 'mid', 'far']), proj)).toBe(372);
  });

  it('is null with no state, no enemy, or nothing projected', () => {
    expect(highestEnemyHead(null, projectorOf(HEADS))).toBeNull();
    expect(highestEnemyHead(stateOf({ yuna: { side: 'party' } }, []), projectorOf(HEADS))).toBeNull();
    expect(highestEnemyHead(STATE, () => null)).toBeNull();
  });
});

type Hud = { intentHead(id: CombatantId, anchor?: 'head' | 'chest' | 'feet'): { x: number; y: number } | null };
function hudWith(make: () => FFX2BattleHud, state: BattleState | null = STATE): Hud {
  const hud = make();
  hud.setProjector(projectorOf(HEADS));
  (hud as unknown as { lastState: BattleState | null }).lastState = state;
  return hud as unknown as Hud;
}

describe('FFX2BattleHud.intentHead: what the intent slab hangs over', () => {
  it('with the roof on, any enemy\'s head is the roof\'s height at its own x', () => {
    const hud = hudWith(() => new FFX2BattleHud({ intentRoof: true }));
    expect(hud.intentHead('near', 'head')).toEqual({ x: 1000, y: 350 });
    expect(hud.intentHead('mid', 'head')).toEqual({ x: 850, y: 350 });
    expect(hud.intentHead('far', 'head')).toEqual({ x: 920, y: 350 }); // the highest one hangs over its own head, as always
  });

  it('every other anchor, and every other scene, is the plain projection', () => {
    const on = hudWith(() => new FFX2BattleHud({ intentRoof: true }));
    expect(on.intentHead('near', 'chest')).toEqual({ x: 1000, y: 520 });
    expect(on.intentHead('near', 'feet')).toEqual({ x: 1000, y: 620 });
    for (const make of [() => new FFX2BattleHud(), () => new FFX2BattleHud({}), () => new FFX2BattleHud({ intentRoof: false })]) {
      const off = hudWith(make);
      expect(off.intentHead('near', 'head')).toEqual({ x: 1000, y: 420 });
      expect(off.intentHead('far', 'head')).toEqual({ x: 920, y: 350 });
    }
  });

  it('follows the roof down as the highest fiend falls, and is the plain head with no state', () => {
    const dying = stateOf({ near: { side: 'enemy' }, mid: { side: 'enemy' }, far: { side: 'enemy', hp: 0 } }, ['near', 'mid', 'far']);
    expect(hudWith(() => new FFX2BattleHud({ intentRoof: true }), dying).intentHead('near', 'head')).toEqual({ x: 1000, y: 372 });
    expect(hudWith(() => new FFX2BattleHud({ intentRoof: true }), null).intentHead('near', 'head')).toEqual({ x: 1000, y: 420 });
  });

  it('a projection that is null stays null', () => {
    const hud = hudWith(() => new FFX2BattleHud({ intentRoof: true }));
    expect(hud.intentHead('nobody', 'head')).toBeNull();
  });

  it('while the camera moves the labels use the rest pose: the roof is read through the same projector', () => {
    const hud = new FFX2BattleHud({ intentRoof: true });
    hud.setProjector(projectorOf(HEADS));
    const rest = projectorOf({ near: { x: 1000, y: 430 }, mid: { x: 850, y: 380 }, far: { x: 920, y: 360 }, yuna: { x: 300, y: 480 } });
    hud.setLayoutProjector({ point: (id, anchor) => rest(id, anchor), rect: () => null, labelsAtRest: () => true });
    (hud as unknown as { lastState: BattleState | null }).lastState = STATE;
    expect((hud as unknown as Hud).intentHead('near', 'head')).toEqual({ x: 1000, y: 360 });
  });
});

describe('intentRoom: the most height the slab may take above the roof', () => {
  it('runs from the lowest top the placement solver allows (the edge, room for the chip, the help band) down to the gap over the roof', () => {
    // edge 4 x 2 = 8, chip 20 + 2 = 22, band reserved down to y 60 from a layer at y 10 (50): the top is 10 + 8 + 22 + 50 = 90; the gap is 10 x 2 = 20
    expect(intentRoom({ roof: 400, layerTop: 10, scale: 2, chipHeight: 20, bandTop: 60 })).toBe(400 - 20 - 90);
  });

  it('takes the chip as 8 grid px when it is not laid out, and no band as none', () => {
    expect(intentRoom({ roof: 400, layerTop: 0, scale: 2, chipHeight: 0, bandTop: 0 })).toBe(400 - 20 - (8 + (16 + 2)));
    expect(intentRoom({ roof: 400, layerTop: 100, scale: 2, chipHeight: 20, bandTop: 60 })).toBe(400 - 20 - (100 + 8 + 22)); // a band above the layer reserves nothing in it
  });

  it('is as much higher as the roof is', () => {
    const at = (roof: number): number => intentRoom({ roof, layerTop: 0, scale: 2.5, chipHeight: 23, bandTop: 46 });
    expect(at(367) - at(327)).toBe(40);
    expect(at(367)).toBeCloseTo(367 - 25 - (10 + 25.5 + 46), 6); // Act I at 1600x900: a 257 px room above Ormi's head
  });
});

describe('FFX2BattleHud.intentMaxHeight: what the HUD hands the panel', () => {
  type Maxed = { intentMaxHeight(): number | null; overlay: HTMLElement; stageScale: number };
  function mountedHud(opts: { intentRoof?: boolean }, heads = HEADS): { hud: FFX2BattleHud; max: Maxed } {
    const root = document.createElement('div');
    document.body.appendChild(root);
    const hud = new FFX2BattleHud(opts);
    hud.mount(root);
    hud.setProjector(projectorOf(heads));
    (hud as unknown as { lastState: BattleState | null }).lastState = STATE;
    const view = { enemyId: 'near', enemyName: 'Fem-Goon', turnsAway: 0, actsNext: true, kind: 'action', moveName: 'Blizzard', abilityId: 'blizzard', description: 'x', elements: [], statusText: [], estimate: null, confidence: 'scripted', branches: [], charge: null, counters: [], formNote: null, notes: [], cite: 'x' } as unknown as IntentView;
    hud.enemyIntent.setSource(() => view);
    const max = hud as unknown as Maxed;
    max.overlay.getBoundingClientRect = () => ({ x: 0, y: 0, left: 0, top: 0, right: 1600, bottom: 900, width: 1600, height: 900, toJSON: () => ({}) }) as DOMRect;
    max.stageScale = 2.5;
    return { hud, max };
  }
  const cleanup = (hud: FFX2BattleHud): void => { hud.unmount(); document.body.innerHTML = ''; };

  it('is the room above the roof for a scene with intentRoof, and moves with the roof', () => {
    const a = mountedHud({ intentRoof: true });
    const high = a.max.intentMaxHeight();
    expect(high).not.toBeNull();
    expect(high!).toBeGreaterThan(100);
    expect(high!).toBeLessThan(350);
    cleanup(a.hud);
    const b = mountedHud({ intentRoof: true }, { ...HEADS, far: { x: 920, y: 310 } });
    expect(b.max.intentMaxHeight()).toBeCloseTo(high! - 40, 6);
    cleanup(b.hud);
  });

  it('is null in every scene without it, with the slab folded away, and on the upright phone', () => {
    const off = mountedHud({});
    expect(off.max.intentMaxHeight()).toBeNull();
    cleanup(off.hud);
    const down = mountedHud({ intentRoof: true });
    down.hud.enemyIntent.setVisible(false);
    expect(down.max.intentMaxHeight()).toBeNull();
    cleanup(down.hud);
    const phone = mountedHud({ intentRoof: true });
    document.documentElement.dataset['phoneBattle'] = 'ffx2';
    try {
      expect(phone.max.intentMaxHeight()).toBeNull();
    } finally {
      delete document.documentElement.dataset['phoneBattle'];
      cleanup(phone.hud);
    }
  });
});

describe('the wiring, from the scene to the HUD', () => {
  it('stagingOf copies the switch when a scene sets it, and only then', () => {
    expect(stagingOf({ intentRoof: true }).intentRoof).toBe(true);
    expect('intentRoof' in stagingOf({})).toBe(false);
    expect('intentRoof' in stagingOf({ intentRoof: false })).toBe(false);
  });

  /** The FFX-2 HUD inside the wrappers `createHud` puts round it (coach, looks, phone layout all keep it as `inner`). */
  function ffx2HudIn(hud: unknown): FFX2BattleHud {
    let h = hud as { inner?: unknown } | undefined;
    for (let i = 0; i < 10 && h && !(h instanceof FFX2BattleHud); i++) h = h.inner as { inner?: unknown } | undefined;
    expect(h, 'an FFX2BattleHud inside the wrappers').toBeInstanceOf(FFX2BattleHud);
    return h as FFX2BattleHud;
  }

  it('createHud hands it to the FFX-2 HUD, and only the FFX-2 HUD', () => {
    const on = ffx2HudIn(createHud('ffx2', undefined, null, undefined, undefined, true));
    on.setProjector(projectorOf(HEADS));
    (on as unknown as { lastState: BattleState | null }).lastState = STATE;
    expect((on as unknown as Hud).intentHead('near', 'head')).toEqual({ x: 1000, y: 350 });
    const off = ffx2HudIn(createHud('ffx2', undefined, null, undefined, undefined, undefined));
    off.setProjector(projectorOf(HEADS));
    (off as unknown as { lastState: BattleState | null }).lastState = STATE;
    expect((off as unknown as Hud).intentHead('near', 'head')).toEqual({ x: 1000, y: 420 });
    // an FFX HUD takes the same argument and ignores it: FFX aims with the hand and has its own slab placement
    expect(() => createHud('ffx', undefined, null, undefined, undefined, true)).not.toThrow();
  });
});

describe('only Chapter VI\'s room asks for it (every other FFX-2 room hangs the slab over the acting fiend\'s head, as always)', () => {
  it('the Last Room publishes it', () => {
    expect(LEBLANC_LAST_ROOM_SLOTS.intentRoof).toBe(true);
  });

  it('no other scene file sets intentRoof', () => {
    const dir = join(here, '../../src/scenes');
    const users = readdirSync(dir)
      .filter((f) => f.endsWith('.ts'))
      .filter((f) => /intentRoof/.test(readFileSync(join(dir, f), 'utf8')))
      .sort();
    // the type and its copier, the room's staging numbers and the room that reads them
    expect(users).toEqual(['leblanc-last-room.ts', 'leblanc-staging.ts', 'types.ts']);
  });
});
