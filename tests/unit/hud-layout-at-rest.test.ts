// @vitest-environment jsdom
/**
 * fb2-0929 camera comfort (both games; Bailey's friend: "I think it's cuz the UI
 * shifts with it"). Measured live on release 31a at 1600x900 by real keys:
 *
 * - Chapter I (FFX): the move advisor card jumped 100-140 px three times in 60 ms
 *   while the camera was still turning back to the master (t 23.21-23.27 s), and
 *   never moved while the camera held (0.00 px a still frame, 9.5 a moving one);
 * - Chapter IV (FFX-2): the card drifted 7.2 px a frame while the camera moved
 *   (1.2 still), the guide rail's MORE row 3.3 (0.5 still), the coach line 9.4 (0).
 *
 * Proven cause: those panels dodge the fighters, and the fighters were projected
 * through the camera *in flight*. The panels now lay out against the shot the
 * camera is settling on (`HudPort.setLayoutProjector`); world-anchored labels
 * (numerals, the cursor, the intent slab) keep the live projector.
 */
import { afterEach, describe, expect, it } from 'vitest';
import { FFXBattleHud } from '../../src/ui/ffx/FFXBattleHud.ts';
import { FFX2BattleHud } from '../../src/ui/ffx2/FFX2BattleHud.ts';
import { ActorRects } from '../../src/ui/coach/coachActorAvoid.ts';
import { makeFakeBattleState, makeFakeTurnPreview } from '../../src/ui/ffx/testFixtures.ts';
import type { AtbSnapshot, BattleState, CombatantId, FFX2Combatant } from '../../src/battle/common/types.ts';

type Pt = { x: number; y: number } | null;
type Proj = (id: CombatantId, anchor?: 'head' | 'chest' | 'feet') => Pt;

/** Every fighter at `x`, head at `y`, feet 200 px lower. */
const at = (x: number, y: number): Proj => (_id, anchor) => ({ x, y: anchor === 'feet' ? y + 200 : y });
const rectAt = (x: number, y: number) => () => ({ x: x - 40, y, w: 80, h: 200 });

const mounted: Array<{ unmount(): void }> = [];
afterEach(() => {
  for (const h of mounted.splice(0)) h.unmount();
  document.body.innerHTML = '';
});

describe('FFX: the advisor zone dodges the fighters where the shot comes to rest', () => {
  function ffxRects(live: Proj, layout: Proj | null): unknown {
    const root = document.createElement('div');
    document.body.appendChild(root);
    const hud = new FFXBattleHud();
    hud.mount(root);
    mounted.push(hud);
    hud.sync(makeFakeBattleState(), makeFakeTurnPreview());
    hud.setProjector(live);
    if (layout) hud.setLayoutProjector({ point: layout, rect: () => null });
    const h = hud as unknown as { partySpriteRects(): unknown; enemySpriteRects(): unknown };
    return { party: h.partySpriteRects(), enemies: h.enemySpriteRects() };
  }

  it('reads the layout projector, not the camera in flight', () => {
    const resting = ffxRects(at(300, 200), null);
    const moving = ffxRects(at(420, 260), null);
    expect(moving).not.toEqual(resting); // the fighters really did move on screen
    expect(ffxRects(at(420, 260), at(300, 200))).toEqual(resting);
  });
});

function girl(id: string): FFX2Combatant {
  return {
    id, name: id, side: 'party', spriteKey: id,
    stats: { hp: 1000, mp: 100, str: 10, def: 10, mag: 10, mdef: 10, agi: 10, luck: 10, eva: 10, acc: 10, maxHp: 1000, maxMp: 100 },
    hp: 1000, mp: 80, statuses: {}, affinities: {}, immunities: {}, immunityFlags: [], controller: 'player', alive: true, removed: false,
    slot: 0, flags: {}, level: 10,
    dresspheres: { current: 'gunner', owned: ['gunner'], garmentGrid: { id: 'g1', nodePosition: 0, passedGates: [], wornThisBattle: [] }, abilitiesLearned: {} },
    atb: { ticks: 0, required: 16000, gauge: 0, charging: null, recovery: 0 }, accessories: [], chainCount: 0, chainWindowTicks: 0,
  } as FFX2Combatant;
}
const ffx2State = (): BattleState => ({
  game: 'ffx2', combatants: { yuna: girl('yuna') }, activeIds: ['yuna'], reserveIds: [], enemyIds: [], aeonId: null,
  turn: 1, ticks: 0, log: [], nextSeq: 1, triggers: [], firedTriggerIds: [], result: null, seed: 1, flags: {},
}) as BattleState;
const snap: AtbSnapshot = { elapsedMs: 0, bars: [{ actorId: 'yuna', fill: 0.5, required: 16000, ready: false, charge: null, state: 'normal' }] } as AtbSnapshot;

describe('FFX-2: the guide rail and the advisor lane are fenced where the girls come to rest', () => {
  function fence(live: Proj, layout: Proj | null): string {
    const root = document.createElement('div');
    document.body.appendChild(root);
    const hud = new FFX2BattleHud();
    hud.mount(root);
    mounted.push(hud);
    hud.sync(ffx2State(), snap);
    hud.setProjector(live);
    if (layout) hud.setLayoutProjector({ point: layout, rect: () => null });
    hud.update(0);
    return root.querySelector<HTMLElement>('[data-fence="party-top"]')?.style.top ?? '';
  }

  it('reads the layout projector, not the camera in flight', () => {
    const resting = fence(at(100, 300), null);
    const moving = fence(at(100, 380), null);
    expect(resting).not.toBe('');
    expect(moving).not.toBe(resting);
    expect(fence(at(100, 380), at(100, 300))).toBe(resting);
  });
});

describe('Coach line: keeps off the fighters where the shot comes to rest (both games)', () => {
  it('prefers the rest silhouettes when the stage offers them', () => {
    const a = new ActorRects();
    a.port = { rect: rectAt(500, 100) } as unknown as NonNullable<ActorRects['port']>;
    a.track({ combatants: { yuna: { alive: true } } } as unknown as BattleState);
    expect(a.rects()).toEqual([{ left: 460, top: 100, right: 540, bottom: 300 }]);
    a.rest = rectAt(300, 100);
    expect(a.rects()).toEqual([{ left: 260, top: 100, right: 340, bottom: 300 }]);
  });
});
