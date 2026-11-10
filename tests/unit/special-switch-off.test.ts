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

afterEach(() => {
  vi.unstubAllGlobals();
  specialsDebug(false);
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
