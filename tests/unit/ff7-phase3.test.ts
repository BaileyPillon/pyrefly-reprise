// @vitest-environment jsdom
/**
 * FF7 phase 3 (FF7 only; Bailey 2026-09-27, "I'll go with all of your
 * recommendations": D-244 B1, C1, G1, D1, E1, F1; D-259 Film; D-261 the look):
 * the results windows and Game Over from the engine's real result, the D1 win
 * sequence and G1's pan through the motion port, B1's painted keys, the F1
 * opening camera (skip on confirm, cut on reduced motion) and swirl (instant
 * path), the FF7 extra key poses loading from the manifest for `ff7-` art only,
 * and the lit active row. The engine is the real one (rule 3).
 */
import { afterEach, describe, expect, it, vi } from 'vitest';
import { PerspectiveCamera } from 'three';

import { Ff7ResultsScreen, ff7ResultsView } from '../../src/app/screens/Ff7ResultsScreen.ts';
import { Ff7ActionMotion } from '../../src/app/screens/BattleScreenFf7Motion.ts';
import { playFf7Opening } from '../../src/app/screens/BattleScreenFf7Opening.ts';
import { createEngine } from '../../src/app/screens/BattleScreenWiring.ts';
import { setupForChapter } from '../../src/app/screens/BattleScreenSetup.ts';
import type { InputSnapshot } from '../../src/app/Input.ts';
import type { BattleResult, BattleState } from '../../src/battle/common/types.ts';
import { FF7_POLICIES, runFf7Battle, type Ff7Engine } from '../../src/battle/ff7/index.ts';
import { FF7_GUARD_SCORPION } from '../../src/data/chapter-ff7-guard-scorpion.ts';
import { sector1ReactorBuild } from '../../src/data/ff7/index.ts';
import { BattleCamera } from '../../src/engine/BattleCamera.ts';
import { FixedCamera } from '../../src/engine/StageFacing.ts';
import type { ActionStartEvent, MotionCtx } from '../../src/engine/BattlePresenterMotion.ts';
import * as S from '../../src/scenes/sector1-reactor-staging.ts';
import { playFf7Swirl } from '../../src/ui/ff7/ff7Swirl.ts';
import { menuHtml } from '../../src/ui/ff7/ff7MenuHtml.ts';
import { ff7Geometry } from '../../src/ui/ff7/ff7Geometry.ts';
import { openMenu } from '../../src/ui/ff7/ff7MenuModel.ts';
import { gsSetup, REG } from './helpers/ff7.ts';
import { FakeActor, FakeStage, noSleep } from './helpers/FakeStage.ts';

afterEach(() => {
  document.body.innerHTML = '';
  vi.restoreAllMocks();
});

/** A real win from the engine (the sensible bench policy, seed 1). */
function realWin(): BattleResult {
  const run = runFf7Battle({ setup: gsSetup(1), registry: REG, policy: FF7_POLICIES.sensible });
  expect(run.result.outcome).toBe('victory');
  return run.result;
}

/** An input snapshot that reports `buttons` pressed once and `actions` tapped. */
function input(buttons: string[] = [], actions: string[] = []): InputSnapshot {
  const left = new Set(buttons);
  return {
    pressed: () => false,
    justPressed: (b) => left.has(b),
    justReleased: () => false,
    consume: (b) => left.delete(b),
    axis: { x: 0, y: 0 },
    actions,
    gamepadConnected: false,
    lastDevice: 'keyboard',
  } as InputSnapshot;
}

function mount(screen: Ff7ResultsScreen): HTMLElement {
  const root = document.createElement('div');
  document.body.appendChild(root);
  screen.root = root;
  void screen.enter();
  return root;
}

describe('C1: FF7\'s two results windows from the engine\'s result', () => {
  it('reads 100 EXP, 10 AP, 100 gil and the Assault Gun; each member with LV, EXP and AP to their Materia', () => {
    const v = ff7ResultsView(realWin(), sector1ReactorBuild);
    expect({ exp: v.exp, ap: v.ap, gil: v.gil }).toEqual({ exp: 100, ap: 10, gil: 100 });
    expect(v.items).toEqual([{ name: 'Assault Gun', count: 1, line: '(Barret: Att 17, Long Range)' }]);
    expect(v.members.map((m) => [m.name, m.level, m.exp, m.ap, m.materia.join(', ')])).toEqual([
      ['Cloud', 7, 100, 10, 'Lightning, Ice'],
      ['Barret', 6, 100, 10, 'Restore'],
    ]);
    expect(v.members[0]!.portrait.url).toContain('ff7-film-cloud/idle.png');
  });

  it("repair item 12: a member KO'd at the end gets 0 EXP (core §11); the standing member the full award", () => {
    const v = ff7ResultsView(realWin(), sector1ReactorBuild, ['cloud']);
    expect(v.members.map((m) => [m.id, m.exp])).toEqual([['cloud', 100], ['barret', 0]]);
    const screen = new Ff7ResultsScreen({ outcome: 'victory', result: realWin(), build: sector1ReactorBuild, standing: ['cloud'] });
    const root = mount(screen);
    screen.update(1);
    const award = (id: string): string | null | undefined => root.querySelector(`[data-win="res-member-${id}"] .ff7-res-award`)?.textContent;
    expect(award('cloud')).toBe('+100');
    expect(award('barret')).toBe('+0');
  });

  it('step 1, confirm, step 2, confirm: resolves continue, never writing anything', async () => {
    const onChoice = vi.fn();
    const screen = new Ff7ResultsScreen({ outcome: 'victory', result: realWin(), build: sector1ReactorBuild, onChoice });
    const root = mount(screen);
    expect(root.querySelector('.ff7res')?.getAttribute('data-step')).toBe('1');
    screen.update(1);
    expect(root.textContent).toContain('+100');
    expect(root.textContent).not.toContain('AP ·'); // FF7's member rows carry no AP line (repair item 12)
    screen.handleInput(input(['confirm']));
    expect(root.querySelector('.ff7res')?.getAttribute('data-step')).toBe('2');
    expect(root.textContent).toContain('Received 100 gil and the Assault Gun.');
    screen.handleInput(input([], ['results:continue'])); // a tap anywhere
    expect(await screen.done).toBe('continue');
    expect(onChoice).toHaveBeenCalledWith('continue');
  });
});

describe('G1: Game Over, then RETRY or CHAPTER SELECT', () => {
  it('shows GAME OVER, then the menu; confirm is RETRY, down then confirm is CHAPTER SELECT, a tap chooses', async () => {
    const make = (): [Ff7ResultsScreen, HTMLElement] => {
      const s = new Ff7ResultsScreen({ outcome: 'defeat', result: null, build: sector1ReactorBuild });
      return [s, mount(s)];
    };
    const [a, rootA] = make();
    expect(rootA.textContent).toContain('GAME OVER');
    expect(rootA.querySelector('[data-win="gameover-menu"]')).toBeNull();
    a.handleInput(input(['confirm'])); // too early: the words are still fading in
    a.update(1);
    expect(rootA.querySelector('[data-win="gameover-menu"]')).not.toBeNull();
    a.handleInput(input(['confirm']));
    expect(await a.done).toBe('retry');

    const [b] = make();
    b.update(1);
    b.handleInput(input(['down']));
    b.handleInput(input(['confirm']));
    expect(await b.done).toBe('chapter-select');

    const [c] = make();
    c.update(1);
    c.handleInput(input([], ['results:chapter-select']));
    expect(await c.done).toBe('chapter-select');
  });
});

// ------------------------------------------------------------------ motion

class Mover extends FakeActor {
  poses: string[] = [];
  override setPose(name: string): void {
    this.poses.push(name);
    super.setPose(name);
  }
  override async moveTo(p?: { x: number; y: number; z: number }): Promise<void> {
    if (p) Object.assign(this.position, p);
  }
}

class Stage3 extends FakeStage {
  constructor() {
    super([], []);
    for (const [id, side, p] of [['cloud', 'party', S.rowSpot(0, 'front')], ['barret', 'party', S.rowSpot(1, 'front')], ['guard-scorpion', 'enemy', [...S.SECTOR1_BOSS_SPOT]]] as const) {
      const a = new Mover(id, this.calls);
      Object.assign(a.position, { x: p[0], y: p[1], z: p[2] });
      this.actors.set(id, a);
      this.sides.set(id, side);
    }
  }
  m(id: string): Mover {
    return this.actors.get(id) as Mover;
  }
}

const start = (actorId: string, abilityId: string, targets: string[], kind = 'ability'): ActionStartEvent =>
  ({ seq: 0, type: 'action-start', actorId, command: { kind, id: abilityId, targets }, abilityId, abilityName: abilityId, targets }) as never;
const ctx = (stage: FakeStage): MotionCtx => ({ stage, speed: 'normal', sleep: noSleep });

describe('B1 and D1 through the FF7 motion port', () => {
  it('Cloud: wind-up on the run, the strike at the strike point, the follow-through, then idle home; the house lunge stays out', async () => {
    const stage = new Stage3();
    const motion = Ff7ActionMotion.forBuild(sector1ReactorBuild);
    const e = start('cloud', 'attack', ['guard-scorpion'], 'attack');
    await motion.open(e, ctx(stage));
    expect(motion.ownsWindUp(e)).toBe(true);
    await motion.close('cloud', ctx(stage));
    expect(stage.m('cloud').poses).toEqual(['windup', 'attack', 'follow', 'idle']);
  });

  it('Barret: aim, then fire from his spot (Big Shot charges longer); a caster raises his free hand', async () => {
    const stage = new Stage3();
    const motion = Ff7ActionMotion.forBuild(sector1ReactorBuild);
    await motion.open(start('barret', 'attack', ['guard-scorpion'], 'attack'), ctx(stage));
    await motion.close('barret', ctx(stage));
    await motion.open(start('barret', 'cure', ['cloud']), ctx(stage));
    expect(motion.ownsWindUp(start('barret', 'cure', ['cloud']))).toBe(false);
    expect(stage.m('barret').poses).toEqual(['aim', 'attack', 'aim', 'punch']);
    expect(stage.m('barret').position.x).toBeCloseTo(S.rowSpot(1, 'front')[0], 9);
  });

  it('Search Scope starts its lock-on effect on the target, with no lunge', async () => {
    const stage = new Stage3();
    const land = vi.fn(() => 0);
    (stage.vfx as { land?: unknown }).land = land;
    await Ff7ActionMotion.forBuild(sector1ReactorBuild).open(start('guard-scorpion', 'search-scope', ['cloud']), ctx(stage));
    expect(land).toHaveBeenCalledWith('cloud', expect.objectContaining({ abilityId: 'search-scope', sourceId: 'guard-scorpion' }));
  });

  it('D1: Cloud pumps, spins, puts the sword on his back; Barret squats and punches; a KO\'d member stays down', async () => {
    const stage = new Stage3();
    const state = { combatants: { cloud: { alive: true, removed: false }, barret: { alive: false, removed: false } } } as unknown as BattleState;
    await new Ff7ActionMotion(new Set(['cloud']), undefined, () => state).victory(ctx(stage));
    expect(stage.m('cloud').poses).toEqual(['victory', 'spin', 'back']);
    expect(stage.m('barret').poses).toEqual([]); // KO'd: no win pose

    const both = new Stage3();
    await new Ff7ActionMotion(new Set(['cloud'])).victory(ctx(both));
    expect(both.m('barret').poses.slice(0, 3)).toEqual(['victory', 'idle', 'punch']);
  });

  it('G1: the pan runs on the fixed camera\'s free port, to the Game Over rig', async () => {
    const stage = new Stage3();
    const moves: string[] = [];
    const free = { ...stage.camera, moveTo: async (rig: string) => void moves.push(rig) };
    (stage as unknown as { camera: unknown }).camera = new FixedCamera(free as never);
    await Ff7ActionMotion.forBuild(sector1ReactorBuild).defeat(ctx(stage));
    expect(moves).toEqual(['ff7-gameover']);
  });
});

// ------------------------------------------------------------------ F1

describe('F1: the swirl and the opening camera', () => {
  function cam(): BattleCamera {
    return new BattleCamera(new PerspectiveCamera(30, 16 / 9, 0.1, 100), { rigs: S.sector1RigsFor(16 / 9), initial: 'idle' });
  }

  it('reduced motion cuts: the camera is on the fixed view at once', async () => {
    const c = cam();
    const snap = vi.spyOn(c, 'snapTo');
    await playFf7Opening(c, { reduced: true });
    expect(snap).toHaveBeenCalledWith('idle');
  });

  it('a Confirm press cuts the settle short; the band waits hidden until then', async () => {
    const c = cam();
    const hud = document.createElement('div');
    hud.className = 'ff7hud';
    document.body.appendChild(hud);
    const snap = vi.spyOn(c, 'snapTo');
    const done = playFf7Opening(c, { reduced: false, ms: 60_000 });
    await new Promise((r) => setTimeout(r, 20));
    expect(snap).toHaveBeenCalledWith('ff7-open');
    expect(hud.hasAttribute('data-ff7-opening')).toBe(true);
    window.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter' }));
    await done;
    expect(snap).toHaveBeenLastCalledWith('idle');
    expect(hud.hasAttribute('data-ff7-opening')).toBe(false);
  });

  it('the instant swirl swaps the battle in at once (playback skip)', async () => {
    const root = document.createElement('div');
    document.body.appendChild(root);
    const onCover = vi.fn(async () => {});
    await playFf7Swirl(root, { instant: true, onCover });
    expect(onCover).toHaveBeenCalledTimes(1);
  });
});

// ------------------------------------------------------------------ look and poses

describe('the punchier look and the extra key poses', () => {
  it('lights the active row under the finger (D-261), and only there', async () => {
    const engine = (await createEngine('ff7', setupForChapter(FF7_GUARD_SCORPION, 1))) as Ff7Engine;
    let cmds = null as null | Parameters<typeof openMenu>[0];
    for (let i = 0; i < 200 && !cmds; i++) {
      const d = engine.nextDecision();
      if (d.kind === 'player-input') cmds = d.commands;
      else if (d.kind === 'waiting') engine.tick(d.nextEventMs);
    }
    const html = menuHtml(ff7Geometry(1600, 900), openMenu(cmds!), { actorMp: 57, limitLevel: 1, limitPhase: 0 });
    expect(html.match(/ff7-rowglow/g)).toHaveLength(1);
  });

  it('an ff7- art id loads every key pose its manifest lists; other ids keep the house set', async () => {
    vi.resetModules();
    vi.doMock('../../src/engine/ArtManifest.ts', async (orig) => ({
      ...(await orig<typeof import('../../src/engine/ArtManifest.ts')>()),
      artStatesFor: async (id: string) => (id === 'ff7-film-cloud' || id === 'tidus' ? ['idle', 'attack', 'windup', 'follow', 'spin', 'back', 'victory', 'hurt'] : null),
    }));
    const { resolvePoseMap } = await import('../../src/engine/BattlePresenterArt.ts');
    const ff7 = await resolvePoseMap('ff7-film-cloud', 'party');
    for (const p of ['windup', 'follow', 'spin', 'back']) expect(ff7[p], p).toContain(`ff7-film-cloud/${p}.png`);
    // Only its own paintings: a missing pose (cast, ko) resolves on the actor to a loaded one, never a second idle.png copy.
    expect(Object.keys(ff7).sort()).toEqual(['attack', 'back', 'follow', 'hurt', 'idle', 'spin', 'victory', 'windup']);
    const house = await resolvePoseMap('tidus', 'party');
    for (const p of ['windup', 'spin', 'back']) expect(house, p).not.toHaveProperty(p);
    expect(house['follow']).toContain('tidus/follow.png'); // r35 (D-313): FFX and FFX-2 figures have a follow-through slot too
    vi.doUnmock('../../src/engine/ArtManifest.ts');
  });
});
