// @vitest-environment jsdom
/**
 * Test 10 of the FFX-2 Special look (step A; GROWS: steps C1, C2 and D append their guards; game case: FFX-2 only in what is seen, the plumbing both games and inert): with the
 * switch `specialDressUp` OFF, which is every shipped chapter, nothing new is called. Spies on every new port member and exported guard prove it.
 *
 * Here (step A): `holdRows` and `showAtbChip` are never called by a full playback of an ordinary Change burst through the real presenter; `portraitWait()` returns null with no
 * portrait; `specialsEngineOptions()` is `{}` with `__PYREFLY_SPECIALS__ === false`, the real `createEngine` builds an engine with the switch off, and the word, the debug call and the look
 * words are inert.
 *
 * Removal: call `holdRows` once from an ordinary Change burst and the spy case fails.
 */

import { afterEach, describe, expect, it, vi } from 'vitest';
import { Group, type Mesh, type MeshBasicMaterial, type RingGeometry } from 'three';
import { PART_RING_COLOUR, PartRings, type PartAnchor } from '../../src/engine/PartAnchors.ts';
import { sceneOwnHeight } from '../../src/engine/PartyStature.ts';
import { heldOffAll, heldOffStage } from '../../src/engine/SummonStaging.ts';
import { anchorSourceOf, formHandleOf, formKeepIds, formSlots, partViewOf, specialFitOf } from '../../src/engine/SpecialStaging.ts';

import type { AvailableCommand, BattleEvent, Command, CombatantId } from '../../src/battle/common/types.ts';
import { createEngine } from '../../src/app/screens/BattleScreenWiring.ts';
import { specialsDebug, specialsEngineOptions, specialsLookWord, specialsOn } from '../../src/app/specialsWord.ts';
import { BattleMoments } from '../../src/engine/BattleMoments.ts';
import { BattlePresenter } from '../../src/engine/BattlePresenter.ts';
import type { BigMoveCut } from '../../src/engine/BigMoveCutIn.ts';
import type { HudPort } from '../../src/engine/HudPort.ts';
import { bevelleBuild } from '../../src/data/ffx2/builds/bevelle.ts';
import { FakeAudio, FakeCutscenes, FakeDamageNumbers, FakeMessageBar, FakeStage, noSleep } from './helpers/FakeStage.ts';
import { bahamutGroup, chapterIV } from './helpers/specialFormState.ts';
import { openSpecial } from './helpers/specialDrive.ts';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { formHandleOf as formHandleAgain } from '../../src/engine/SpecialStaging.ts';
import * as SpecialPresenter from '../../src/engine/BattlePresenterSpecial.ts';
import { loadLog, rig } from './helpers/specialPlayback.ts';
import * as SpecialRows from '../../src/ui/ffx2/specialRows.ts';
import * as PartCrop from '../../src/ui/ffx2/partCrop.ts';
import * as SpecialLeave from '../../src/ui/ffx2/specialLeave.ts';
import { PlateTaps } from '../../src/ui/ffx2/plateTap.ts';
import { FFX2BattleHud } from '../../src/ui/ffx2/FFX2BattleHud.ts';
import { nextInput } from './helpers/specialDrive.ts';
import { FFX2Engine } from '../../src/battle/ffx2/index.ts';
import { getChapter } from '../../src/data/encounters.ts';
import { setAtbBarsSmooth } from '../../src/ui/ffx2/AtbLive.ts';
import { ffx2Options } from './helpers/ffx2ChapterDrive.ts';
import type { BattleState, FFX2PartyBuild } from '../../src/battle/common/types.ts';

// Step C1: every stage hook of the Special look is wrapped in a pass-through spy, so the cases below can prove an ordinary playback never calls one and that, called with no form, each changes no value.
vi.mock('../../src/engine/SpecialStaging.ts', async (importOriginal) => {
  const real = await importOriginal<typeof import('../../src/engine/SpecialStaging.ts')>();
  return {
    ...real,
    formHandleOf: vi.fn(real.formHandleOf),
    partViewOf: vi.fn(real.partViewOf),
    specialFitOf: vi.fn(real.specialFitOf),
    anchorSourceOf: vi.fn(real.anchorSourceOf),
    formKeepIds: vi.fn(real.formKeepIds),
    formSlots: vi.fn(real.formSlots),
  };
});

// Step C2: the guards and the three beats they route to are wrapped in pass-through spies too, so the burst below proves what the presenter asked and what was answered.
vi.mock('../../src/engine/BattlePresenterSpecial.ts', async (importOriginal) => {
  const real = await importOriginal<typeof import('../../src/engine/BattlePresenterSpecial.ts')>();
  return {
    ...real,
    specialHolds: vi.fn(real.specialHolds),
    specialStatusHolds: vi.fn(real.specialStatusHolds),
    specialBeat: vi.fn(real.specialBeat),
    partKo: vi.fn(real.partKo),
    formRevive: vi.fn(real.formRevive),
    formStatus: vi.fn(real.formStatus),
  };
});

// Step D1: the row helpers, the part tile and the way-out label are wrapped in pass-through spies, so the cases below can prove what an ordinary menu and an ordinary party list ask of them and what they answer.
vi.mock('../../src/ui/ffx2/specialRows.ts', async (importOriginal) => {
  const real = await importOriginal<typeof import('../../src/ui/ffx2/specialRows.ts')>();
  return { ...real, formRoleOf: vi.fn(real.formRoleOf), faceDressOf: vi.fn(real.faceDressOf), badgeHtml: vi.fn(real.badgeHtml), formTargetOrder: vi.fn(real.formTargetOrder) };
});
vi.mock('../../src/ui/ffx2/partCrop.ts', async (importOriginal) => {
  const real = await importOriginal<typeof import('../../src/ui/ffx2/partCrop.ts')>();
  return { ...real, partCropOf: vi.fn(real.partCropOf), partFaceHtml: vi.fn(real.partFaceHtml) };
});
vi.mock('../../src/ui/ffx2/specialLeave.ts', async (importOriginal) => {
  const real = await importOriginal<typeof import('../../src/ui/ffx2/specialLeave.ts')>();
  return { ...real, leaveLabelOf: vi.fn(real.leaveLabelOf) };
});

afterEach(() => {
  vi.unstubAllGlobals();
  specialsDebug(false);
  setAtbBarsSmooth(null);
});

/** The real presenter over a real engine with the switch OFF, a HUD double that spies on every new member, one ordinary Change answered. */
async function playAnOrdinaryChange() {
  const engine = openSpecial({ build: chapterIV(), group: bahamutGroup, seed: 1, specials: false });
  const holdRows = vi.fn();
  const showAtbChip = vi.fn();
  const asked: CombatantId[] = [];
  const events: BattleEvent[] = [];
  let answer: ((c: Command) => void) | null = null;
  let offered: AvailableCommand[] = [];
  const hud: HudPort = {
    mount() {},
    unmount() {},
    sync() {},
    syncVitals() {},
    syncGauges() {},
    setVisible() {},
    setProjector() {},
    setAtbMode() {},
    holdRows,
    showAtbChip,
    openMinigame: () => new Promise<never>(() => undefined),
    chooseCommand(actorId: CombatantId, commands: AvailableCommand[]) {
      asked.push(actorId);
      if (asked.length === 1) {
        offered = commands;
        return new Promise<Command>((res) => {
          answer = res;
        });
      }
      return new Promise<Command>(() => undefined);
    },
    onEvent(event: BattleEvent) {
      events.push(event);
    },
  } as unknown as HudPort;
  const state = engine.state();
  let clock = 0;
  const presenter = new BattlePresenter({
    stage: new FakeStage([...state.activeIds], [...state.enemyIds]),
    hud,
    damageNumbers: new FakeDamageNumbers(),
    messageBar: new FakeMessageBar(),
    audio: new FakeAudio(),
    cutscenes: new FakeCutscenes(),
    sleep: (ms) => {
      clock += ms;
      return Promise.resolve();
    },
    now: () => clock,
  });
  void presenter.run(engine);
  const until = async (cond: () => boolean, max = 60_000): Promise<void> => {
    for (let i = 0; i < max && !cond(); i++) await Promise.resolve();
  };
  await until(() => asked.length > 0);
  const row = offered.find((c) => c.enabled && c.command.kind === 'spherechange');
  expect(row, 'the first menu offers an ordinary Change').toBeDefined();
  answer!({ ...row!.command, targets: [] } as Command);
  await until(() => events.some((e) => e.type === 'spherechange') && asked.length > 1);
  for (let i = 0; i < 2000; i++) await Promise.resolve();
  presenter.abort();
  return { holdRows, showAtbChip, events };
}

describe('the presenter, with the switch off', () => {
  it('plays an ordinary Change burst through to the next menu and never calls holdRows or showAtbChip', async () => {
    const { holdRows, showAtbChip, events } = await playAnOrdinaryChange();
    const change = events.find((e) => e.type === 'spherechange');
    expect(change, 'the burst held a spherechange').toBeDefined();
    expect((change as { special?: string }).special, 'an ordinary change names no Special').toBeUndefined();
    expect(holdRows).not.toHaveBeenCalled();
    expect(showAtbChip).not.toHaveBeenCalled();
  }, 120_000);
});

describe('BattleMomentsHeld.portraitWait', () => {
  const noStage = () => new FakeStage(['yuna'], ['bahamut']);
  const req = { name: 'Special', who: 'yuna' } as unknown as BigMoveCut;

  it('is null with no portrait: nothing was started, or the layer has no portrait to play, or skip speed started none', () => {
    const plain = new BattleMoments({ stage: noStage(), sleep: noSleep, speed: () => 'normal' });
    expect(plain.portraitWait()).toBeNull();
    plain.bigMoveCutIn(req, true); // no moments overlay: no portrait
    expect(plain.portraitWait()).toBeNull();
    const skip = new BattleMoments({ stage: noStage(), sleep: noSleep, speed: () => 'skip' });
    expect(skip.portraitWait()).toBeNull();
  });

  it('hands back the portrait\'s promise once, only to a caller who asked to keep it', async () => {
    let done!: () => void;
    const turnCutIn = vi.fn(() => new Promise<void>((r) => (done = r)));
    const moments = new BattleMoments({ stage: noStage(), moments: { turnCutIn } as never, sleep: noSleep, speed: () => 'normal' });
    moments.bigMoveCutIn(req, true);
    const p = moments.portraitWait();
    expect(p).not.toBeNull();
    expect(moments.portraitWait(), 'only once').toBeNull();
    done();
    await expect(p).resolves.toBeUndefined();
    moments.bigMoveCutIn(req, false); // an action that does not keep it leaves nothing for the next caller
    expect(moments.portraitWait()).toBeNull();
  });
});

describe('the test word, with the production define (`__PYREFLY_SPECIALS__` false)', () => {
  it('specialsEngineOptions() is {}, the word is not on, the debug call and the look words are inert', () => {
    vi.stubGlobal('__PYREFLY_SPECIALS__', false);
    expect(specialsEngineOptions()).toEqual({});
    expect(specialsOn('?specials=on')).toBe(false);
    expect(specialsDebug(true)).toBe(false);
    expect(specialsOn('')).toBe(false);
    expect(specialsLookWord('?specials=on&specialsfit=larger&specialsmark=b&specialshold=short-always')).toBeNull();
    expect(specialsEngineOptions()).toEqual({});
  });

  it('the real createEngine builds an engine with the switch OFF, with the word absent and with the production define even when asked', async () => {
    const setup = { game: 'ffx2' as const, party: bevelleBuild, enemies: bahamutGroup, triggers: [], seed: 1, condition: 'normal' as const, canEscape: false };
    const off = await createEngine('ffx2', setup);
    expect(off.state().flags['specialDressUp']).toBeUndefined();
    vi.stubGlobal('__PYREFLY_SPECIALS__', false);
    specialsDebug(true);
    const stillOff = await createEngine('ffx2', setup);
    expect(stillOff.state().flags['specialDressUp']).toBeUndefined();
  }, 60_000);

  it('and with the define true and the word given, createEngine does turn it on (the control: this method can see the switch)', async () => {
    const setup = { game: 'ffx2' as const, party: bevelleBuild, enemies: bahamutGroup, triggers: [], seed: 1, condition: 'normal' as const, canEscape: false };
    vi.stubGlobal('__PYREFLY_SPECIALS__', true);
    specialsDebug(true);
    const on = await createEngine('ffx2', setup);
    expect(on.state().flags['specialDressUp']).toBe(true);
  }, 60_000);
});

// ------------------------------------------------------------------ step C1: the stage hooks, with no form registered

const hooks = [formHandleOf, partViewOf, specialFitOf, anchorSourceOf, formKeepIds, formSlots] as const;

describe('step C1: the stage hooks of the Special look, with no form registered (every shipped chapter)', () => {
  it('an ordinary Change burst through the real presenter calls none of them', async () => {
    for (const hook of hooks) vi.mocked(hook).mockClear();
    await playAnOrdinaryChange();
    for (const hook of hooks) expect(hook, hook.name).not.toHaveBeenCalled();
  }, 120_000);

  it('each answers undefined, an empty list or the very same object, whatever it is asked', () => {
    const stage = {};
    const slots = { party: [], enemy: [], partyHeight: 1.82, enemyHeight: 4.1 } as never;
    const c = { id: 'yuna-pod-r', side: 'party', flags: {} } as never;
    expect(formSlots(stage, slots)).toBe(slots);
    expect(formSlots(stage, slots, 'attack')).toBe(slots);
    expect(partViewOf(stage, c)).toBe(c);
    expect(formHandleOf(stage, 'yuna', { get: () => undefined })).toBeUndefined();
    expect(formHandleOf(stage, 'yuna-pod-r', { get: () => ({ actor: {} as never }) })).toBeUndefined();
    expect(specialFitOf(stage, { slots, canvas: { clientWidth: 1600, clientHeight: 900 } })).toBeUndefined();
    expect(anchorSourceOf(stage)).toBeUndefined();
    expect(formKeepIds(stage)).toEqual([]);
  });

  it('heldOffAll equals heldOffStage, and sceneOwnHeight without a fit is the old one-line body', () => {
    const stage = new FakeStage(['yuna', 'rikku'], ['bahamut']);
    expect(heldOffAll(stage)).toEqual(heldOffStage(stage));
    const slots = { figureHeights: { yuna: 2.4 }, formHeights: { 'yuna-gunner': 2.2 } };
    for (const [id, art] of [['yuna', 'yuna-floral-fallal'], ['rikku', 'yuna-gunner'], ['rikku', 'rikku-thief']] as const) {
      expect(sceneOwnHeight(slots, id, art)).toBe(slots.figureHeights?.[id as 'yuna'] ?? slots.formHeights?.[art as 'yuna-gunner']);
    }
  });

  it('PartRings.add of an anchor with no hidden, mark or colour makes the mesh it always made, and setMark and setAnchor leave it alone', () => {
    const anchor: PartAnchor = { mode: 'onParent', px: [10, 20], paint: { width: 100, height: 100, baselineY: 95, contentTop: 5 }, ring: { radius: 0.6, ground: true } };
    const root = new Group();
    const rings = new PartRings(root);
    rings.add('p', anchor);
    const mesh = root.children[0] as Mesh;
    const mat = mesh.material as MeshBasicMaterial;
    const geo = mesh.geometry as RingGeometry;
    expect([mat.color.getHex(), mat.opacity, mat.transparent, mat.depthTest, mat.depthWrite]).toEqual([PART_RING_COLOUR, 0, true, false, false]);
    expect([geo.parameters.innerRadius, geo.parameters.outerRadius, geo.parameters.thetaSegments]).toEqual([0.6 * 0.86, 0.6, 48]);
    expect([mesh.name, mesh.renderOrder, mesh.rotation.x]).toEqual(['part-ring:p', 7, -Math.PI / 2]);
    rings.setMark('p', true);
    rings.update(0.1, () => ({ x: 0, y: 0, z: 0, height: 2 }), null);
    expect(mat.opacity).toBe(0.62);
    expect(mat.color.getHex()).toBe(PART_RING_COLOUR);
  });
});


// ------------------------------------------------------------------ step C2: the presenter's call-ins, with the switch OFF

describe('step C2: the presenter\'s call-ins, with the switch off (every shipped chapter)', () => {
  /** An ordinary Change (no `special` on any event) followed by a KO, a revive and a status on ids a form WOULD own, all with `flags.specialDressUp` unset. */
  async function ordinaryBurst() {
    const log = loadLog('entry-yuna');
    const r = rig(log);
    r.use(log, {}); // the flag is not set
    const events = log.events.map((e) => (e.type === 'spherechange' ? ({ ...e, special: undefined } as typeof e) : e));
    delete (events.find((e) => e.type === 'spherechange') as { special?: unknown }).special;
    const extra = [
      { type: 'ko', targetId: 'floral-fallal-right-pistil', sourceId: 'bahamut', seq: 900 },
      { type: 'revive', targetId: 'floral-fallal-right-pistil', hp: 10, cause: 'item', seq: 901 },
      { type: 'status-add', targetId: 'floral-fallal-left-pistil', sourceId: 'bahamut', status: 'poison', instance: { id: 'poison' }, seq: 902 },
      { type: 'status-remove', targetId: 'floral-fallal-left-pistil', status: 'poison', reason: 'expired', seq: 903 },
      { type: 'status-add', targetId: 'yuna', sourceId: 'yuna', status: 'auto-life', instance: { id: 'auto-life' }, seq: 904 },
    ] as never[];
    for (const fn of [SpecialPresenter.specialHolds, SpecialPresenter.specialStatusHolds, SpecialPresenter.specialBeat, SpecialPresenter.partKo, SpecialPresenter.formRevive, SpecialPresenter.formStatus]) vi.mocked(fn).mockClear();
    r.hud.hudLog.length = 0;
    r.stage.calls.length = 0;
    await r.play([...events, ...extra]);
    return r;
  }

  it('calls no new port member: no setForm, no special piece, no stub, no fade, no held rows, no chip, no mode', async () => {
    const r = await ordinaryBurst();
    expect(r.stage.calls.filter((c) => c.startsWith('setForm:') || c.startsWith('special:') || c.startsWith('add:') || c.startsWith('fade='))).toEqual([]);
    expect(r.hud.holdLog).toEqual([]);
    expect(r.hud.chipLog).toEqual([]);
    expect(r.hud.modeLog).toEqual([]);
    expect(r.stage.form).toBeNull();
  });

  it('never makes a runtime, never reaches partKo, formRevive or formStatus, and every guard answers false or null', async () => {
    const r = await ordinaryBurst();
    expect((SpecialPresenter as unknown as { runtimeOf(c: unknown): unknown }).runtimeOf((r.presenter as unknown as { ctx: unknown }).ctx)).toBeUndefined();
    for (const fn of [SpecialPresenter.partKo, SpecialPresenter.formRevive, SpecialPresenter.formStatus]) expect(fn).not.toHaveBeenCalled();
    for (const fn of [SpecialPresenter.specialHolds, SpecialPresenter.specialStatusHolds, SpecialPresenter.specialBeat]) {
      expect(fn).toHaveBeenCalled();
      for (const res of vi.mocked(fn).mock.results) expect(res.value === false || res.value === null, fn.name).toBe(true);
    }
  });

  it('the stage hooks answer "no form" and the art candidates are the step-0 pin\'s (special-c2-pins.test.ts)', () => {
    expect(formHandleAgain({}, 'yuna', { get: () => ({ actor: {} as never }) })).toBeUndefined();
  });

  it('a source scan: the guards are plain functions, and no call-in line awaits or makes a promise before they return', () => {
    const src = (f: string): string => readFileSync(resolve(__dirname, '..', '..', 'src', 'engine', f), 'utf8').replace(/\r\n/g, '\n');
    const text = src('BattlePresenterSpecial.ts');
    for (const name of ['noteSpecial', 'preSubmit', 'specialBeat', 'specialHolds', 'specialStatusHolds', 'releaseSpecial', 'runtimeOf']) {
      const at = text.indexOf(`export function ${name}(`);
      expect(at, `${name} is a plain exported function`).toBeGreaterThan(-1);
      expect(text.slice(Math.max(0, at - 7), at), name).not.toMatch(/async\s*$/);
      const body = text.slice(at, text.indexOf('\n}\n', at));
      expect(body, `${name} has no await and makes no promise`).not.toMatch(/\bawait\b|new Promise|Promise\.resolve|\basync\b/);
    }
    const lines = ['BattlePresenterEvents.ts', 'BattlePresenterBeats.ts', 'BattlePresenterArrivals.ts', 'BattlePresenterPlayback.ts', 'BattlePresenterBase.ts', 'BattlePresenterCommands.ts', 'BattlePresenter.ts']
      .flatMap((f) => src(f).split('\n').filter((l) => /\b(specialHolds|specialStatusHolds|specialBeat|noteSpecial|preSubmit|releaseSpecial)\(/.test(l) && !/^\s*(export|import|\/\/|\*)/.test(l)));
    expect(lines.length).toBeGreaterThanOrEqual(8);
    for (const l of lines) expect(l, l).not.toMatch(/\bawait\b\s*[^;]*\b(specialHolds|specialStatusHolds|specialBeat)\(/);
  });
});

// ------------------------------------------------------------------ step D1: the party rows, the command menu and the cursor, with the switch OFF

describe('step D1: the party list, the command menu and the ally pick, with the switch off (every shipped chapter)', () => {
  /**
   * A real FFX2BattleHud mounted and synced over the real engine at Chapter IV with the switch OFF (the world of `command-menu-off-pin.test.ts`, whose pin the second case compares with),
   * and Yuna's first real decision from the Chapter IV party of the form tests.
   */
  function offHud() {
    localStorage.clear(); // the pin was taken in a fresh page: settings an earlier case in this file left (the move advisor, the ATB mode) are not part of the surface under test
    sessionStorage.clear();
    document.body.innerHTML = '';
    const engine = openSpecial({ build: chapterIV(), group: bahamutGroup, seed: 1, specials: false });
    let d = nextInput(engine);
    for (let i = 0; i < 400 && d !== null && d.actorId !== 'yuna'; i++) {
      engine.submit({ kind: 'defend', targets: [] });
      d = nextInput(engine);
    }
    expect(d?.actorId).toBe('yuna');
    const chapter = getChapter('ffx2-bahamut')!;
    const world = new FFX2Engine(ffx2Options());
    world.setSeed(1);
    world.init({ game: 'ffx2', party: chapter.buildRef as FFX2PartyBuild, enemies: chapter.enemyGroupRef, triggers: [], seed: 1, condition: 'normal', canEscape: false });
    const root = document.createElement('div');
    document.body.appendChild(root);
    vi.stubGlobal('requestAnimationFrame', () => 0);
    vi.stubGlobal('cancelAnimationFrame', () => {});
    vi.spyOn(performance, 'now').mockReturnValue(1000);
    setAtbBarsSmooth(false);
    const hud = new FFX2BattleHud();
    hud.mount(root);
    const snap = world.gaugeSnapshot();
    hud.sync(world.state() as BattleState, snap);
    return { hud, root, snap, d: d! };
  }
  const project = (id: string) => ({ x: id === 'bahamut' ? 560 : 120, y: 200 });
  const spies = [SpecialRows.formRoleOf, SpecialRows.faceDressOf, SpecialRows.badgeHtml, SpecialRows.formTargetOrder, PartCrop.partCropOf, PartCrop.partFaceHtml, SpecialLeave.leaveLabelOf] as const;
  const key = (code: string): void => {
    window.dispatchEvent(new KeyboardEvent('keydown', { code, bubbles: true, cancelable: true }));
  };

  it('a click on any ordinary row calls no handler, and .ffx2hud__party\'s className and the .ffx2hud outerHTML are byte for byte the pinned ones before, during and after a menu open and an ally pick', async () => {
    const { hud, root, snap, d } = offHud();
    const hudEl = (): HTMLElement => root.querySelector<HTMLElement>('.ffx2hud')!;
    const party = (): HTMLElement => root.querySelector<HTMLElement>('.ffx2hud__party')!;
    // as in the pin: the move advisor's card is left out (whether it has text depends on whether the tactics data was imported yet, a cold-load artifact of the file it runs in)
    const take = (): { partyClass: string; hud: string } => {
      const copy = hudEl().cloneNode(true) as HTMLElement;
      copy.querySelectorAll('[data-role="move-advisor"]').forEach((e) => e.remove());
      return { partyClass: party().className, hud: copy.outerHTML };
    };
    const row = d.commands.find((c) => c.enabled && c.command.kind === 'item' && c.validTargets.length > 1)!;
    const out: Record<string, { partyClass: string; hud: string }> = { synced: take() };
    hud.setProjector(project);
    const pick = hud.chooseCommand('yuna', [row], () => snap);
    out['menuOpen'] = take();
    key('Enter');
    out['aimed'] = take();
    // a click on any ordinary row: no row has a form role, so nothing is confirmed and nothing is written
    expect(party().querySelectorAll('[data-form-role]').length).toBe(0);
    for (const el of party().querySelectorAll<HTMLElement>('.ig-stat')) el.click();
    const settled = await Promise.race([pick.then(() => true), new Promise<boolean>((r) => setTimeout(() => r(false), 30))]);
    expect(settled, 'a click on an ordinary row confirms nothing').toBe(false);
    expect(take(), 'the clicks wrote nothing').toEqual(out['aimed']);
    key('ArrowRight');
    out['stepped'] = take();
    key('Enter');
    await pick;
    out['picked'] = take();
    // the pin of the step's first commit, taken before any source edit; on a mismatch the message names the state and the first differing text, not the whole page
    const pinned = JSON.parse(readFileSync(resolve(__dirname, '..', 'fixtures', 'specials', 'off-pins', 'hud-menu-ffx2-ch4.json'), 'utf8')) as typeof out;
    for (const state of Object.keys(pinned)) {
      const got = out[state];
      const want = pinned[state]!;
      expect(got?.partyClass, state + ' className').toBe(want.partyClass);
      const at = [...want.hud].findIndex((ch, i) => ch !== got?.hud[i]);
      expect(at < 0 && got?.hud.length === want.hud.length ? 'same' : state + ' differs at ' + at + ': pinned ' + JSON.stringify(want.hud.slice(Math.max(0, at - 60), at + 120)) + ' got ' + JSON.stringify(got?.hud.slice(Math.max(0, at - 60), at + 120))).toBe('same');
    }
    expect(Object.keys(out).sort()).toEqual(Object.keys(pinned).sort());
    hud.unmount();
  }, 120_000);

  it('a full ordinary Change submenu and an ally pick: badgeHtml and partCropOf are never reached, and every helper answers "no form"', async () => {
    const { hud, root, snap, d } = offHud();
    hud.setProjector(project);
    for (const s of spies) vi.mocked(s).mockClear();
    const taps = vi.spyOn(PlateTaps.prototype, 'set');

    // the Change submenu of the real decision (leaveLabelOf is asked of every Change row)
    void hud.chooseCommand('yuna', d.commands, () => snap);
    const change = [...root.querySelectorAll<HTMLElement>('.ig-cmd')].find((r) => r.querySelector('.ffx2cmd__label')?.textContent === 'Change');
    expect(change).toBeTruthy();
    change!.click();
    expect(root.querySelectorAll('.ffx2cmd__label').length).toBeGreaterThan(1);
    hud.closeCommandMenu();

    // the ally pick: the first item row that lists the girls
    const row = d.commands.find((c) => c.enabled && c.command.kind === 'item' && c.validTargets.length > 1)!;
    const pick = hud.chooseCommand('yuna', [row], () => snap);
    key('Enter');
    key('ArrowRight');
    key('Enter');
    await pick;

    expect(vi.mocked(SpecialRows.badgeHtml)).not.toHaveBeenCalled();
    expect(vi.mocked(PartCrop.partCropOf)).not.toHaveBeenCalled();
    expect(vi.mocked(PartCrop.partFaceHtml)).not.toHaveBeenCalled();
    expect(vi.mocked(SpecialLeave.leaveLabelOf).mock.calls.length, 'asked of every Change row').toBeGreaterThan(0);
    for (const r of vi.mocked(SpecialLeave.leaveLabelOf).mock.results) expect(r.value).toBeNull();
    expect(vi.mocked(SpecialRows.formTargetOrder).mock.calls.length, 'asked at the ally pick').toBeGreaterThan(0);
    for (const r of vi.mocked(SpecialRows.formTargetOrder).mock.results) expect(r.value).toBeNull();
    expect(vi.mocked(SpecialRows.formRoleOf).mock.calls.length).toBeGreaterThan(0);
    for (const r of vi.mocked(SpecialRows.formRoleOf).mock.results) expect(r.value).toBeNull();
    for (const [i, r] of vi.mocked(SpecialRows.faceDressOf).mock.results.entries()) expect(r.value, `faceDressOf call ${i} hands back the dress it was given`).toBe(vi.mocked(SpecialRows.faceDressOf).mock.calls[i]![1]);
    // the taps ARE handed a handler at every menu build, and taken away at its end; what matters is below
    expect(taps.mock.calls.length).toBeGreaterThanOrEqual(4);
    expect(taps.mock.calls.some((c) => typeof c[0] === 'function')).toBe(true);
    expect(taps.mock.calls.at(-1)![0]).toBeNull();
    taps.mockRestore();
    hud.unmount();
  }, 120_000);
});
