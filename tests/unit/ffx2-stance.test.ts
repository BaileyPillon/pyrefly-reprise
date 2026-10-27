// @vitest-environment jsdom
/**
 * **The ready stance, MF-05 of the motion-fluidity plan** (lane L1; both games; `?stance=today|v1a|v1b|v3`, default `today`).
 *
 * The presenter's side of it, with the real `FFX2Engine`, chapter 4 data and the real presenter, and a stage whose figures read a `paint` request the way `PaintedActor` does (the painting shown is
 * the request's `paint`, else the pose): what the menu asks for, what the turn start leaves alone, what the action opens on, and what the harness's reason log says about each.
 *
 * - `today`: the menu asks for `ready` (the painting and the state), as always.
 * - `v1a`: the menu asks for `ready` on the IDLE painting; the attack's wind-up asks for the real ready painting.
 * - `v1b`: the menu and the wind-up both ask for `ready` on the idle painting (no ready painting anywhere).
 * - A girl on the stance with the idle painting is still held through her turn start into her own attack, spell or item (MF-01).
 */
import { afterEach, describe, expect, it } from 'vitest';
import { FFX2Engine } from '../../src/battle/ffx2/index.ts';
import type { AvailableCommand, BattleEvent, CombatantId, Command } from '../../src/battle/common/types.ts';
import * as data from '../../src/data/ffx2/index.ts';
import { bevelleBuild } from '../../src/data/ffx2/builds/bevelle.ts';
import { BattlePresenter } from '../../src/engine/BattlePresenter.ts';
import type { HudPort } from '../../src/engine/HudPort.ts';
import { setDemoChapter } from '../../src/engine/motion/DemoGate.ts';
import { resetSwapLog, swapLog } from '../../src/engine/motion/SwapLog.ts';
import { setStanceMode } from '../../src/engine/motion/SwapSwitch.ts';
import { FakeActor, FakeAudio, FakeCutscenes, FakeDamageNumbers, FakeMessageBar, FakeStage } from './helpers/FakeStage.ts';
import { ffx2Options } from './helpers/ffx2ChapterDrive.ts';

afterEach(() => {
  setStanceMode(null);
  setDemoChapter(undefined);
  resetSwapLog();
});

/** A figure that reads `paint` the way the real actor does: the pose it names is the state, the painting shown is the request's `paint` or the pose. */
class StanceActor extends FakeActor {
  readonly asked: string[] = [];
  override setPose(name: string, opts?: { immediate?: boolean; force?: boolean; paint?: string }): void {
    this.asked.push(opts?.paint ? `${name}/${opts.paint}` : name);
    super.setPose(name);
    this.pose = opts?.paint ?? name;
  }
}

class PaintingStage extends FakeStage {
  constructor(party: CombatantId[], enemies: CombatantId[], private readonly own: readonly string[]) {
    super(party, enemies);
    for (const id of party) this.actors.set(id, new StanceActor(id, this.calls));
  }
  paints(id: CombatantId, pose: string): boolean {
    return this.sideOf(id) === 'party' && this.own.includes(pose);
  }
}

interface Played {
  stage: PaintingStage;
  asked: CombatantId[];
  answered: Array<{ id: CombatantId; kind: string }>;
}

async function play(answers: number, stance: 'today' | 'v1a' | 'v1b' | 'v3'): Promise<Played> {
  setDemoChapter('ffx2-bahamut');
  setStanceMode(stance);
  const group = data.ENEMY_GROUPS_BY_ID['ffx2-bahamut'];
  if (!group) throw new Error('ffx2-bahamut missing');
  const engine = new FFX2Engine(ffx2Options({ atbMode: 'active' }));
  engine.init({ game: 'ffx2', party: bevelleBuild, enemies: group, triggers: [], seed: 1, condition: 'normal', canEscape: false });
  const state = engine.state();
  let clock = 0;
  const stage = new PaintingStage([...state.activeIds], [...state.enemyIds], ['ready', 'attack', 'follow', 'cast', 'item']);
  const played: Played = { stage, asked: [], answered: [] };
  const hud: HudPort = {
    mount() {},
    unmount() {},
    sync() {},
    syncGauges() {},
    setVisible() {},
    setProjector() {},
    setAtbMode() {},
    onMenuLevel: () => () => undefined,
    openMinigame: () => new Promise<never>(() => undefined),
    chooseCommand(actorId: CombatantId, commands: AvailableCommand[]): Promise<Command> {
      played.asked.push(actorId);
      const row =
        actorId === 'yuna'
          ? commands.find((c) => c.enabled && c.command.kind === 'ability' && c.validTargets.length > 0) ?? commands.find((c) => c.enabled && c.command.kind === 'attack')
          : commands.find((c) => c.enabled && c.command.kind === 'attack');
      if (!row || played.answered.length >= answers) return new Promise<Command>(() => undefined);
      played.answered.push({ id: actorId, kind: row.command.kind });
      return Promise.resolve({ ...row.command, targets: [row.validTargets[0]!] } as Command);
    },
    onEvent(_event: BattleEvent) {},
  };
  const presenter = new BattlePresenter({
    stage,
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
  } as ConstructorParameters<typeof BattlePresenter>[0]);
  void presenter.run(engine);
  for (let i = 0; i < 600_000 && !(played.answered.length >= answers && played.asked.length > answers + 1); i++) await Promise.resolve();
  return played;
}

const askedBy = (p: Played, id: string): string => (p.stage.actors.get(id) as StanceActor).asked.join(' ');

describe('the menu and the wind-up under each stance word', () => {
  it('today: the menu asks for ready (the painting and the state), the wind-up asks for ready, nothing is painted over', async () => {
    const p = await play(8, 'today');
    expect(p.answered.filter((a) => a.kind === 'attack').length).toBeGreaterThanOrEqual(3);
    const rikku = askedBy(p, 'rikku');
    expect(rikku).toContain('ready ready idle');
    expect(rikku).not.toContain('/idle');
  });

  it('v1a: the menu asks for the ready stance on the idle painting; the attack\'s wind-up asks for the real ready painting', async () => {
    const p = await play(8, 'v1a');
    const rikku = askedBy(p, 'rikku');
    expect(rikku).toContain('ready/idle ready idle'); // menu (idle painting), turn start holds, wind-up (ready painting), the end of the action's idle
    expect(rikku).not.toContain('ready/idle idle ready'); // the turn start did not drop her to idle in between
  });

  it('v1b: the menu and the wind-up both ask for the stance on the idle painting: no ready painting is asked for at all', async () => {
    const p = await play(8, 'v1b');
    const rikku = askedBy(p, 'rikku');
    expect(rikku).toContain('ready/idle ready/idle idle');
    expect(rikku.split(' ').filter((w) => w === 'ready')).toEqual([]);
  });

  it('v1b: a girl who casts goes from the stance on the idle painting straight into the cast (one blend, no idle between)', async () => {
    const p = await play(10, 'v1b');
    expect(p.answered.some((a) => a.id === 'yuna' && a.kind === 'ability')).toBe(true);
    const yuna = askedBy(p, 'yuna');
    expect(yuna).toContain('ready/idle cast');
    expect(yuna).not.toContain('ready/idle idle cast');
  });

  it('v3 keeps the paintings the presenter asks for (the blend is the actor\'s): the sequence is today\'s', async () => {
    const p = await play(8, 'v3');
    expect(askedBy(p, 'rikku')).toContain('ready ready idle');
  });
});

describe('the reason log the harness reads', () => {
  it('names the menu, the wind-up and the end of the action, and the turn start that did not drop a held girl', async () => {
    resetSwapLog();
    await play(8, 'v1b');
    const rikku = swapLog().reasons.filter((r) => r.actor === 'rikku');
    const words = rikku.map((r) => `${r.reason}:${r.pose}${r.paint ? '/' + r.paint : ''}`);
    expect(words.join(' ')).toContain('menu:ready/idle wind-up:ready/idle');
    expect(words.join(' ')).toContain('after-action:idle');
    expect(words.filter((w) => w === 'turn-start:idle').length).toBe(0); // every attack of hers was held through the turn start
  });

  it('today: the log names the menu\'s ready and the wind-up\'s ready without a paint', async () => {
    resetSwapLog();
    await play(8, 'today');
    const words = swapLog().reasons.filter((r) => r.actor === 'rikku').map((r) => `${r.reason}:${r.pose}${r.paint ? '/' + r.paint : ''}`);
    expect(words.join(' ')).toContain('menu:ready wind-up:ready');
  });
});
