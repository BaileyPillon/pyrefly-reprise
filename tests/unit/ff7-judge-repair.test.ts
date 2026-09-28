// @vitest-environment jsdom
/**
 * The phase-3 judge's repair pass on the FF7 high-fidelity fight (FF7 only, plus the shared plumbing it touches,
 * each part inert for FFX and FFX-2). Rule 3: the serialisation runs the real FF7 engine through the real presenter.
 *
 * 1, 2: every Film pose stands on the idle's stance (measured on the installed PNGs when they are on disk), and a
 *       pose change is a hard cut for FF7 only; 3: FF7 plays one action at a time; 4: a KO'd fighter lies down at
 *       once and gets up on a revive; 6: a numeral waits for the drawn strike; 7: D1 frames the party; 8: the boss's
 *       death; 10: the effects stay under the message window; 11: the aimed boxes stay inside the frame.
 */
import { existsSync, readFileSync } from 'node:fs';
import { Group, Object3D, PerspectiveCamera, Scene } from 'three';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import sharp from 'sharp';

import type { AvailableCommand, BattleEvent, CombatantId, Command } from '../../src/battle/common/types.ts';
import { FF7_FILM_POSE_SHIFT_PX } from '../../src/data/ff7/filmPoseAnchors.ts';
import * as S from '../../src/scenes/sector1-reactor-staging.ts';
import { stagingOf } from '../../src/scenes/types.ts';
import { targetHitsHtml } from '../../src/ui/ff7/ff7MenuHtml.ts';
import { FakeActor, FakeAudio, FakeCutscenes, FakeDamageNumbers, FakeMessageBar, FakeStage, noSleep } from './helpers/FakeStage.ts';

const created: Array<Record<string, unknown>> = [];
vi.mock('../../src/engine/PaintedActor.ts', () => ({
  PaintedActor: {
    create: vi.fn(async (o: Record<string, unknown>) => {
      created.push(o);
      const f = new Object3D() as Object3D & Record<string, unknown>;
      f.name = String(o['name']);
      f['setPose'] = (): void => {};
      f['lieDown'] = async (): Promise<void> => {};
      f['dispose'] = (): void => {};
      return f;
    }),
  },
}));
vi.mock('../../src/engine/VFX.ts', () => ({ HitEffects: class extends Group {} }));
vi.mock('../../src/engine/BattlePresenterArt.ts', async (orig) => ({
  ...(await orig<typeof import('../../src/engine/BattlePresenterArt.ts')>()),
  resolveArt: vi.fn(async (ids: string[]) => ({ artId: ids[0], poses: {} })),
}));

const { PaintedStage } = await import('../../src/engine/BattlePresenterStage.ts');
const { BattleCamera } = await import('../../src/engine/BattleCamera.ts');
const { BattlePresenter } = await import('../../src/engine/BattlePresenter.ts');
const { awaitSpellLanding } = await import('../../src/engine/BattlePresenterSpellFx.ts');
const { Ff7ActionMotion, FF7_KO_TILT } = await import('../../src/app/screens/BattleScreenFf7Motion.ts');
const { ff7FxClip } = await import('../../src/app/screens/battleFf7Fx.ts');
const { createEngine } = await import('../../src/app/screens/BattleScreenWiring.ts');
const { setupForChapter } = await import('../../src/app/screens/BattleScreenSetup.ts');
const { FF7_GUARD_SCORPION } = await import('../../src/data/chapter-ff7-guard-scorpion.ts');
const { ZANARKAND_DOME_SLOTS } = await import('../../src/scenes/zanarkand-dome.ts');
const { FF7_BOSS_DOWN } = await import('../../src/engine/spellfx/ff7/ff7FxSpecs.ts');

type Who = Parameters<InstanceType<typeof PaintedStage>['add']>[0];
const who = (id: string, side: 'enemy' | 'party', spriteKey = id): Who =>
  ({ id, side, slot: 0, alive: true, spriteKey, flags: { isBoss: side === 'enemy' } }) as unknown as Who;

function stageWith(slots: ConstructorParameters<typeof PaintedStage>[0]['slots']): InstanceType<typeof PaintedStage> {
  const cam = new PerspectiveCamera();
  return new PaintedStage({
    scene: new Scene(),
    camera: cam,
    battleCamera: new BattleCamera(cam, { rigs: { idle: { position: [0, 3, 10], lookAt: [0, 1, 0] } } }),
    slots,
    canvas: { getBoundingClientRect: () => ({ left: 0, top: 0, width: 1600, height: 900 }) } as unknown as HTMLCanvasElement,
  });
}

const FF7_SLOTS = {
  ...stagingOf(S.SECTOR1_STAGING),
  party: S.SECTOR1_FRONT.map((s) => [...s] as [number, number, number]),
  enemy: [[...S.SECTOR1_BOSS_SPOT] as [number, number, number]],
} as unknown as ConstructorParameters<typeof PaintedStage>[0]['slots'];

beforeEach(() => {
  created.length = 0;
});

// ------------------------------------------------------------------ 1, 2, 9

describe('items 1, 2 and 9: each Film key on the idle stance, a hard cut, the core light (FF7 only)', () => {
  it('FF7 actors get a hard cut, their pose shifts, the green rim from screen-right and an eroded fringe', async () => {
    const s = stageWith(FF7_SLOTS);
    await s.add(who('cloud', 'party', 'ff7-film-cloud'));
    await s.add(who('guard-scorpion', 'enemy', 'ff7-film-guard-scorpion'));
    const cloud = created.find((o) => o['name'] === 'cloud')!;
    const boss = created.find((o) => o['name'] === 'guard-scorpion')!;
    expect(cloud['crossfadeMs']).toBe(0);
    expect(boss['crossfadeMs']).toBe(0);
    expect(cloud['poseShiftPx']).toBe(FF7_FILM_POSE_SHIFT_PX['ff7-film-cloud']);
    expect(boss['poseShiftPx']).toBeUndefined(); // the machine's paintings already share its rear foot
    expect(cloud['rim']).toEqual({ color: 0xb8ffd8, dir: [1, 0.25], strength: 0.85, width: 3 });
    expect(cloud['erode']).toBe(2.5);
  });

  it('FFX keeps its crossfade, its house rim and no shift or erosion (rule 14)', async () => {
    const s = stageWith(ZANARKAND_DOME_SLOTS);
    await s.add(who('tidus', 'party'));
    const tidus = created.find((o) => o['name'] === 'tidus')!;
    expect(tidus['crossfadeMs']).toBe(120);
    expect(tidus['poseShiftPx']).toBeUndefined();
    expect(tidus['erode']).toBeUndefined();
    expect(tidus['rim']).toEqual({ strength: 0.7 });
  });

  /** The stance centre, as `film-set/scripts/anchors.py` measures it: the mean of the two boots' sole centres. */
  async function stance(file: string): Promise<{ x: number; w: number }> {
    const { data, info } = await sharp(file).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
    const W = info.width;
    const H = info.height;
    const px = (x: number, y: number): [number, number, number, number] => {
      const i = (y * W + x) * 4;
      return [data[i]!, data[i + 1]!, data[i + 2]!, data[i + 3]!];
    };
    let top = H;
    let bot = 0;
    for (let y = 0; y < H; y++) for (let x = 0; x < W; x += 2) if (px(x, y)[3] >= 128) { top = Math.min(top, y); bot = Math.max(bot, y); }
    const y0 = bot - Math.floor((bot - top) * 0.16);
    const boot = (x: number, y: number): boolean => {
      const [r, g, b, a] = px(x, y);
      return a >= 128 && r - b > 18 && Math.max(r, g, b) - Math.min(r, g, b) > 18;
    };
    // Connected boot-coloured blobs in the band (4-neighbour), the two largest are the boots; each boot's sole
    // centre is the mean x of its pixels in the 25 rows above its lowest one (anchors.py's scipy labelling).
    const seen = new Uint8Array(W * (bot - y0 + 1));
    const blobs: Array<Array<[number, number]>> = [];
    for (let y = y0; y <= bot; y++) {
      for (let x = 0; x < W; x++) {
        if (seen[(y - y0) * W + x] || !boot(x, y)) continue;
        const pts: Array<[number, number]> = [];
        const todo: Array<[number, number]> = [[x, y]];
        seen[(y - y0) * W + x] = 1;
        while (todo.length) {
          const [cx, cy] = todo.pop()!;
          pts.push([cx, cy]);
          for (const [nx, ny] of [[cx + 1, cy], [cx - 1, cy], [cx, cy + 1], [cx, cy - 1]] as const) {
            if (nx < 0 || nx >= W || ny < y0 || ny > bot || seen[(ny - y0) * W + nx] || !boot(nx, ny)) continue;
            seen[(ny - y0) * W + nx] = 1;
            todo.push([nx, ny]);
          }
        }
        if (pts.length >= 300) blobs.push(pts);
      }
    }
    const feet = blobs.sort((a, b) => b.length - a.length).slice(0, 2);
    const soles = feet.map((pts) => {
      const low = Math.max(...pts.map((q) => q[1]));
      const sole = pts.filter((q) => q[1] >= low - 24);
      return sole.reduce((a, q) => a + q[0], 0) / sole.length;
    });
    return { x: soles.reduce((a, b) => a + b, 0) / soles.length - W / 2, w: W };
  }

  const ART = 'public/art/characters';
  const onDisk = existsSync(`${ART}/ff7-film-barret/aim.png`);
  it.skipIf(!onDisk)('each pose, shifted, stands its feet within 6 px of the idle stance (the installed Film PNGs)', async () => {
    for (const [key, poses] of Object.entries(FF7_FILM_POSE_SHIFT_PX)) {
      const idle = await stance(`${ART}/${key}/idle.png`);
      for (const [pose, shift] of Object.entries(poses)) {
        if (key === 'ff7-film-barret' && pose === 'attack') continue; // registered on the aim by the legs (below)
        const meta = JSON.parse(readFileSync(`${ART}/${key}/${pose}.json`, 'utf8')) as { scale?: number };
        const k = pose === 'idle' ? 1 : (meta.scale ?? 1);
        const s = await stance(`${ART}/${key}/${pose}.png`);
        expect(Math.abs((s.x + shift) * k - idle.x), `${key}/${pose}`).toBeLessThanOrEqual(6);
      }
    }
    // Barret's fire keeps his aim's legs: the swap between the two moves him under 40 px (before: 0 by construction, 214 from idle).
    const aim = await stance(`${ART}/ff7-film-barret/aim.png`);
    const fire = await stance(`${ART}/ff7-film-barret/attack.png`);
    const b = FF7_FILM_POSE_SHIFT_PX['ff7-film-barret']!;
    expect(Math.abs(fire.x + b['attack']! - (aim.x + b['aim']!))).toBeLessThanOrEqual(40);
  });
});

// ------------------------------------------------------------------ 3

describe('item 3: FF7 resolves one action at a time (research/ff7-battle-core.md §2.6)', () => {
  it('a command confirmed during the boss\'s turn plays only after that turn has finished on screen', async () => {
    const engine = (await createEngine('ff7', setupForChapter(FF7_GUARD_SCORPION, 1))) as Awaited<ReturnType<typeof createEngine>> & {
      state(): { activeIds: CombatantId[]; enemyIds: CombatantId[] };
    };
    const st = engine!.state();
    const log: string[] = [];
    let menuOpen = false;
    let answer: ((c: Command) => void) | null = null;
    let offered: AvailableCommand[] = [];
    let answered = false;
    const party = new Set(st.activeIds);
    const hud = {
      mount() {}, unmount() {}, sync() {}, syncGauges() {}, setVisible() {}, setProjector() {},
      openMinigame: () => new Promise<never>(() => undefined),
      closeCommandMenu() {},
      onMenuLevel(listener: (level: 'top' | 'deep') => void) { listener('top'); return () => undefined; },
      chooseCommand(_id: CombatantId, commands: AvailableCommand[]) {
        if (answered) return new Promise<Command>(() => undefined);
        menuOpen = true;
        offered = commands;
        return new Promise<Command>((res) => (answer = res));
      },
      onEvent(e: BattleEvent) {
        if (e.type === 'action-start' || e.type === 'action-end') {
          const actor = e.type === 'action-start' ? e.actorId : (e as { actorId?: string }).actorId ?? '?';
          log.push(`${e.type}:${e.type === 'action-start' ? (party.has(actor) ? 'party' : 'enemy') : actor}`);
        }
        // The player confirms while the boss's turn is on screen.
        if (e.type === 'action-start' && !party.has(e.actorId) && menuOpen && !answered && answer) {
          answered = true;
          const row = offered.find((c) => c.enabled && c.command.kind === 'attack')!;
          answer({ ...row.command, targets: [row.validTargets[0]!] } as Command);
        }
      },
    };
    let clock = 0;
    const presenter = new BattlePresenter({
      stage: new FakeStage([...st.activeIds], [...st.enemyIds]),
      hud: hud as never,
      damageNumbers: new FakeDamageNumbers(),
      messageBar: new FakeMessageBar(),
      audio: new FakeAudio(),
      cutscenes: new FakeCutscenes(),
      sleep: (ms) => {
        clock += ms;
        return new Promise((r) => setTimeout(r, 0));
      },
      now: () => clock,
    });
    void presenter.run(engine as never);
    for (let i = 0; i < 4000 && !(answered && log.filter((l) => l === 'action-start:party').length > 0); i++) await new Promise((r) => setTimeout(r, 0));
    for (let i = 0; i < 400; i++) await new Promise((r) => setTimeout(r, 0));
    presenter.abort();
    expect(answered).toBe(true);
    const bossStart = log.indexOf('action-start:enemy');
    const partyStart = log.indexOf('action-start:party', bossStart);
    expect(partyStart).toBeGreaterThan(bossStart);
    // The boss's own action-end comes before the player's action-start: never two on screen at once.
    const between = log.slice(bossStart, partyStart);
    expect(between.some((l) => l.startsWith('action-end'))).toBe(true);
  }, 30_000);
});

// ------------------------------------------------------------------ 4, 7, 8

class Stage4 extends FakeStage {
  lies: Array<[string, number | undefined, number | undefined]> = [];
  constructor() {
    super(['cloud', 'barret'], ['guard-scorpion']);
    for (const id of ['cloud', 'barret']) {
      const a = this.actors.get(id)! as FakeActor & { lieDown: (ms?: number, tilt?: number) => Promise<void> };
      a.lieDown = async (ms?: number, tilt?: number): Promise<void> => void this.lies.push([id, ms, tilt]);
    }
  }
}
const mctx = (stage: FakeStage) => ({ stage, speed: 'normal' as const, sleep: noSleep });

describe('items 4, 7 and 8 through the FF7 motion port', () => {
  it('4: a KO\'d fighter lies down at once, tipped back only part way (readable, not a flat smear)', async () => {
    const stage = new Stage4();
    await Ff7ActionMotion.forBuild((await import('../../src/data/ff7/index.ts')).sector1ReactorBuild).ko('barret', mctx(stage));
    expect(stage.lies).toEqual([['barret', expect.any(Number), FF7_KO_TILT]]);
    expect(FF7_KO_TILT).toBeLessThan(Math.PI / 2);
  });

  it('7: the win eases the camera in on the party (the free port of the fixed camera)', async () => {
    const stage = new Stage4();
    const moves: string[] = [];
    const { FixedCamera } = await import('../../src/engine/StageFacing.ts');
    const free = { ...stage.camera, moveTo: async (rig: string) => void moves.push(rig) };
    (stage as unknown as { camera: unknown }).camera = new FixedCamera(free as never);
    await new Ff7ActionMotion(new Set(['cloud'])).victory(mctx(stage));
    expect(moves).toEqual(['ff7-victory']);
    const rig = S.sector1VictoryRig(16 / 9);
    const fixed = S.sector1FixedRig(16 / 9);
    // Aimed at the party, and the frame at the party's depth at most two thirds as tall as the fixed view's (so the
    // fighters stand at least 1.5x larger).
    const party = (S.SECTOR1_FRONT[0]![0] + S.SECTOR1_FRONT[1]![0]) / 2;
    expect(Math.abs((rig.lookAt as number[])[0]! - party)).toBeLessThan(0.5);
    const span = (r: typeof rig): number => 2 * Math.hypot((r.position as number[])[0]! - party, (r.position as number[])[2]!) * Math.tan(((r.fov ?? 30) * Math.PI) / 360);
    expect(span(rig)).toBeLessThan(span(fixed) * 0.67);
    expect(S.sector1RigsFor(390 / 844)['ff7-victory']).toBeDefined();
  });

  it('8: the boss goes out with a flash, its death effect and a fade of about a second', async () => {
    const stage = new Stage4();
    const land = vi.fn(() => 0);
    (stage.vfx as { land?: unknown }).land = land;
    await Ff7ActionMotion.forBuild((await import('../../src/data/ff7/index.ts')).sector1ReactorBuild).sendOff('guard-scorpion', mctx(stage));
    expect(land).toHaveBeenCalledWith('guard-scorpion', expect.objectContaining({ abilityId: FF7_BOSS_DOWN }));
    expect(stage.calls).toEqual(expect.arrayContaining(['flash:guard-scorpion', 'dissolve=1:guard-scorpion']));
  });
});

// ------------------------------------------------------------------ 6, 10, 11

describe('items 6, 10 and 11', () => {
  it('6: the numeral waits until the effect clock has drawn the strike, polling its pending landing', async () => {
    let left = 3;
    const slept: number[] = [];
    const ctx = {
      acting: { serial: 4, actorId: 'cloud', abilityId: 'bolt', targets: ['guard-scorpion'] },
      stage: { vfx: { land: () => 420, pendingLand: () => (left-- > 0 ? 90 : 0) } },
      moments: { impact: () => undefined },
      sleep: async (ms: number) => void slept.push(ms),
    };
    await awaitSpellLanding(ctx as never, { type: 'damage', targetId: 'guard-scorpion', amount: 94, hitIndex: 0, element: 'lightning' } as never, false);
    expect(slept).toEqual([420, 40, 40, 40]);
  });

  it("6: the FF7 HUD holds a blow's numeral from its event until the presenter's numeral beat", async () => {
    const { Ff7BattleHud } = await import('../../src/ui/ff7/Ff7BattleHud.ts');
    const hud = new Ff7BattleHud({ size: () => ({ w: 1600, h: 900 }) });
    hud.mount(document.body);
    hud.setProjector(() => ({ x: 1200, y: 400 }));
    hud.onEvent({ seq: 1, type: 'damage', targetId: 'guard-scorpion', amount: 94, crit: false, hitIndex: 0, hitCount: 1 } as never);
    hud.update(0.1);
    expect(document.querySelectorAll('.ff7-dmg')).toHaveLength(0);
    hud.numeralLanded('guard-scorpion');
    hud.update(0.05);
    expect(document.querySelectorAll('.ff7-dmg').length).toBeGreaterThan(0);
    // The HP rows wait with the numeral too: a vitals sync while a numeral is held lands when it does.
    const { createEngine: make } = await import('../../src/app/screens/BattleScreenWiring.ts');
    const eng = (await make('ff7', setupForChapter(FF7_GUARD_SCORPION, 1))) as unknown as { state(): never; gaugeSnapshot(): never };
    hud.sync(eng.state(), eng.gaugeSnapshot());
    const hp = (): number | undefined => hud.inspect().rows.find((r) => r.id === 'cloud')?.hp;
    const before = hp();
    expect(before).toBeGreaterThan(100);
    const hurt = structuredClone(eng.state()) as { combatants: Record<string, { hp: number }> };
    hurt.combatants['cloud']!.hp -= 73;
    hud.onEvent({ seq: 2, type: 'damage', targetId: 'cloud', amount: 73, crit: false, hitIndex: 0, hitCount: 1 } as never);
    hud.syncVitals(hurt as never);
    expect(hp()).toBe(before);
    hud.numeralLanded('cloud');
    expect(hp()).toBe(before! - 73);
    hud.unmount();
  });

  it('10: the effects draw only below the message window while it is up', () => {
    document.body.innerHTML = '<div class="ff7hud"><div class="ff7-win" data-win="message"></div></div>';
    const canvas = document.createElement('canvas');
    canvas.getBoundingClientRect = () => ({ left: 0, top: 0, width: 1600, height: 900, right: 1600, bottom: 900, x: 0, y: 0, toJSON: () => ({}) });
    const win = document.querySelector<HTMLElement>('[data-win="message"]')!;
    win.getBoundingClientRect = () => ({ left: 90, top: 40, width: 1420, height: 78, right: 1510, bottom: 118, x: 90, y: 40, toJSON: () => ({}) });
    expect(ff7FxClip(canvas)).toEqual({ x: 0, y: 118, w: 1600, h: 782 });
    win.remove();
    expect(ff7FxClip(canvas)).toBeNull();
  });

  it('11: an aimed box is clamped to the frame, so nothing can scroll the HUD sideways', () => {
    const html = targetHitsHtml([{ id: 'guard-scorpion', x: 150, y: 200, w: 343, h: 200 }], { W: 390, H: 844 });
    const el = document.createElement('div');
    el.innerHTML = html;
    const box = el.querySelector<HTMLElement>('[data-target="guard-scorpion"]')!;
    expect(parseFloat(box.style.left) + parseFloat(box.style.width)).toBeLessThanOrEqual(390);
  });
});
