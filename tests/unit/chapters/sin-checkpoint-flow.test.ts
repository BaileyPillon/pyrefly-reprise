// @vitest-environment jsdom
/**
 * **Chapter XVII's link-3 checkpoint through the real flow, with the switch ON** (CHECK 3 finding C3-3; FFX only).
 *
 * `sin-checkpoint.test.ts` pins `checkpointAt`, `resumeSetup` and the bench's retry loop. This file drives the path a
 * player takes: the real `GameFlow` runs the chapter, and its battle stand-in does what `BattleScreen` does with the
 * real pieces: the real FFX engine (`BattleScreenWiring.createEngine`), the real `runEncounterChain` across the real
 * seams, and on RETRY `resumeSetup(resumeAt, seed)`, `group = resumeAt.group`, `startLink = resumeAt.link`,
 * `priorWon = resumeAt.won` (`BattleScreen.ts`). Only the presenter is a script of outcomes: what is under test is
 * where a retry lands and what it opens on, not who wins. `SIN_LINK3_CHECKPOINT` ships `true` (D-284, PR-0268): the
 * first block runs the shipped formation as the game finds it (`findEnemyGroup`); the ON and OFF shapes are the
 * switch's own (`sinLink3Checkpoint`), handed to the chain through `findGroup`, so both positions stay pinned.
 */

import { afterEach, beforeEach, describe, expect, it } from 'vitest';

import type { App } from '../../../src/app/App.ts';
import { pinRunSeed } from '../../../src/app/runSeed.ts';
import { SaveStore } from '../../../src/app/SaveData.ts';
import { Screen } from '../../../src/app/Screen.ts';
import { GameFlow, registerFlowScreens, resetFlowScreens, type FlowScreen } from '../../../src/app/screens/BattleScreenFlow.ts';
import type { BattleScreenOptions, BattleScreenResult } from '../../../src/app/screens/BattleScreen.ts';
import { resumeSetup } from '../../../src/app/screens/BattleChainCheckpoint.ts';
import { runEncounterChain } from '../../../src/app/screens/BattleEncounterChain.ts';
import { findEnemyGroup, setupForChapter } from '../../../src/app/screens/BattleScreenSetup.ts';
import { createEngine } from '../../../src/app/screens/BattleScreenWiring.ts';
import type { BattleEngine, BattleSetup, EnemyGroupDef, FFXCombatant, FFXPartyBuild } from '../../../src/battle/common/types.ts';
import type { BattleOutcome, BattlePresenter } from '../../../src/engine/BattlePresenter.ts';
import { getChapter } from '../../../src/data/encounters.ts';
import { sinGenaisCoreGroup, sinLink3Checkpoint } from '../../../src/data/ffx/enemies/sin-genais-core.ts';
import { SIN_GENAIS_CORE_GROUP_ID } from '../../../src/data/ffx/enemies/sin-fins.ts';

const SIN = getChapter('sin-fins-core')!;
const ON: EnemyGroupDef = { ...sinGenaisCoreGroup, ...sinLink3Checkpoint(true) };
const { checkpointOnEntry: _shippedSwitch, ...withoutSwitch } = sinGenaisCoreGroup;
const OFF: EnemyGroupDef = { ...withoutSwitch, ...sinLink3Checkpoint(false) };

type Kind = 'victory' | 'defeat';

/** One attempt as the screen saw it. */
interface Attempt {
  opts: BattleScreenOptions;
  onLinks: number[];
  fought: string[][];
  /** Auron's HP when each link's fight began (the carry, or the checkpoint's replay). */
  auronHp: number[];
}

const shown: string[] = [];
const attempts: Attempt[] = [];
let scripts: Kind[][] = [];
/** 'shipped' = the formation as `findEnemyGroup` returns it; 'on' / 'off' = the switch's two shapes. */
let switchOn: 'shipped' | 'on' | 'off' = 'on';
/** Auron's HP in the opening setup: a value the carry has to keep, so a replay of the wrong state shows. */
const AURON_OPENS_AT = 4321; // above half of his 6,492, so no SOS

function opening(chapterSeed: number): BattleSetup {
  const setup = setupForChapter(SIN, chapterSeed);
  const party = setup.party as FFXPartyBuild;
  const members = party.members.map((m) => (m.id === 'auron' ? { ...m, hp: AURON_OPENS_AT } : m));
  return { ...setup, party: { ...party, members } };
}

/** The battle screen's own engine and chain calls (`BattleScreen.ts`), with a presenter that plays a script. */
class ChainBattle extends Screen implements FlowScreen<BattleScreenResult> {
  readonly name = 'battle';
  readonly done: Promise<BattleScreenResult>;
  constructor(opts: BattleScreenOptions) {
    super();
    const rec: Attempt = { opts, onLinks: [], fought: [], auronHp: [] };
    attempts.push(rec);
    this.done = this.fight(opts, rec, scripts.shift() ?? ['defeat']);
  }
  private async fight(opts: BattleScreenOptions, rec: Attempt, kinds: Kind[]): Promise<BattleScreenResult> {
    const resume = opts.resumeAt;
    const setup = resume ? resumeSetup(resume, opts.seed ?? 1) : opening(opts.seed ?? 1);
    const group = resume ? resume.group : SIN.enemyGroupRef;
    const engine = await createEngine(SIN.game, setup, { automated: true });
    const presenter = {
      syncHud: () => undefined,
      run: async (e: BattleEngine): Promise<BattleOutcome> => {
        rec.fought.push(e.state().enemyIds.slice());
        rec.auronHp.push((e.state().combatants['auron'] as FFXCombatant).hp);
        return { kind: kinds.shift() ?? 'defeat', result: { turns: 1, elapsedMs: 0, elapsedTicks: 0 } } as unknown as BattleOutcome;
      },
    } as unknown as BattlePresenter;
    const chain = await runEncounterChain({
      chapter: SIN,
      presenter,
      engine,
      stage: { stage: async () => undefined },
      group,
      setup,
      seed: opts.seed ?? 1,
      findGroup: async (id) => (id !== SIN_GENAIS_CORE_GROUP_ID || switchOn === 'shipped' ? findEnemyGroup(id) : switchOn === 'on' ? ON : OFF),
      startLink: resume?.link ?? 1,
      priorWon: resume?.won ?? [],
      onLink: ({ links }) => rec.onLinks.push(links),
    });
    return {
      chapterId: SIN.id,
      outcome: chain.outcome.kind,
      result: chain.outcome.kind === 'victory' ? chain.outcome.result : null,
      elapsedMs: 10,
      links: chain.links,
      preview: false,
      ...(chain.checkpoint ? { checkpoint: chain.checkpoint } : {}),
    };
  }
  override enter(): void {
    shown.push(this.name);
  }
}

class Done<T> extends Screen implements FlowScreen<T> {
  readonly done: Promise<T>;
  constructor(readonly name: string, value: T) {
    super();
    this.done = Promise.resolve(value);
  }
  override enter(): void {
    shown.push(this.name);
  }
}

class FakeApp {
  readonly uiRoot: HTMLElement;
  readonly save = new SaveStore();
  readonly flow: GameFlow;
  current: Screen | null = null;
  constructor() {
    this.uiRoot = document.createElement('div');
    document.body.appendChild(this.uiRoot);
    this.flow = new GameFlow(this as unknown as App);
  }
  get overlayActive(): boolean {
    return false;
  }
  async replace(screen: Screen): Promise<void> {
    const previous = this.current;
    this.current = null;
    if (previous) {
      await previous.exit();
      previous.root?.remove();
    }
    screen.app = this as unknown as App;
    screen.root = document.createElement('div');
    this.uiRoot.appendChild(screen.root);
    this.current = screen;
    await screen.enter();
  }
  async goto(): Promise<boolean> {
    return true;
  }
  fade(): Promise<void> {
    return Promise.resolve();
  }
  nextFrame(): Promise<void> {
    return Promise.resolve();
  }
}

let choices: Array<'retry' | 'chapter-select'> = [];
let app: FakeApp;

beforeEach(() => {
  pinRunSeed(1);
  shown.length = 0;
  attempts.length = 0;
  scripts = [];
  choices = [];
  switchOn = 'on';
  document.body.innerHTML = '';
  resetFlowScreens();
  registerFlowScreens({
    partyPrep: () => new Done('party-prep', true),
    battle: (opts) => new ChainBattle(opts),
    results: (opts) => {
      if (opts.outcome === 'defeat') opts.onChoice?.(choices.shift() ?? 'chapter-select');
      return new Done('results', undefined);
    },
  });
  app = new FakeApp();
});

afterEach(() => {
  resetFlowScreens();
  pinRunSeed(null);
});

const FINS: string[][] = [['left-fin'], ['right-fin']];

describe('Sin, link-3 checkpoint ON: RETRY after a loss at Genais and the Core lands on link 3 (C3-3)', () => {
  it('win both Fins, lose link 3, RETRY: the next battle opens on link 3, no prep, on the state it was entered on', async () => {
    scripts = [['victory', 'victory', 'defeat'], ['defeat']];
    choices = ['retry', 'chapter-select'];
    await app.flow.runChapter(SIN.id, { skipCutscenes: true, speed: 'skip' });

    expect(attempts).toHaveLength(2);
    const [first, retry] = attempts as [Attempt, Attempt];
    expect(first.onLinks).toEqual([1, 2, 3]);
    expect(first.fought.slice(0, 2).map((ids) => ids.slice(0, 1))).toEqual(FINS);
    const link3Enemies = first.fought[2]!;

    const cp = retry.opts.resumeAt!;
    expect(cp).toBeDefined();
    expect(cp.link).toBe(3);
    expect(cp.group.id).toBe(SIN_GENAIS_CORE_GROUP_ID);
    expect(cp.won).toHaveLength(2); // the two Fins, carried for the results (PR-0138)
    expect(retry.opts.seed).toBe(1001); // reseeded, as every retry is
    expect(retry.onLinks).toEqual([3]);
    expect(retry.fought).toEqual([link3Enemies]);
    // The carry (HP) as entered, replayed: the retry opens where link 3 first opened, not on a fresh party.
    expect(retry.auronHp).toEqual([first.auronHp[2]]);
    expect(first.auronHp).toEqual([AURON_OPENS_AT, AURON_OPENS_AT, AURON_OPENS_AT]);
    expect(shown).toEqual(['party-prep', 'battle', 'results', 'battle', 'results']);
  });

  it('a loss at a Fin makes no checkpoint even with the switch on: RETRY starts over at the Left Fin, through prep', async () => {
    scripts = [['victory', 'defeat'], ['defeat']];
    choices = ['retry', 'chapter-select'];
    await app.flow.runChapter(SIN.id, { skipCutscenes: true, speed: 'skip' });
    expect(attempts.map((a) => a.opts.resumeAt)).toEqual([undefined, undefined]);
    expect(attempts[1]!.onLinks).toEqual([1]);
    expect(shown.filter((s) => s === 'party-prep')).toHaveLength(2);
  });

  it('with the switch OFF the same loss at link 3 retries from the Left Fin', async () => {
    switchOn = 'off';
    scripts = [['victory', 'victory', 'defeat'], ['defeat']];
    choices = ['retry', 'chapter-select'];
    await app.flow.runChapter(SIN.id, { skipCutscenes: true, speed: 'skip' });
    expect(attempts[0]!.onLinks).toEqual([1, 2, 3]);
    expect(attempts[1]!.opts.resumeAt).toBeUndefined();
    expect(attempts[1]!.onLinks).toEqual([1]);
    expect(shown).toEqual(['party-prep', 'battle', 'results', 'party-prep', 'battle', 'results']);
  });
});

describe('Sin as shipped (D-284, PR-0268): the formation the game finds carries the link-3 checkpoint', () => {
  it('win both Fins, lose link 3, RETRY: the retry opens on Genais and the Core, not the Left Fin', async () => {
    switchOn = 'shipped';
    scripts = [['victory', 'victory', 'defeat'], ['defeat']];
    choices = ['retry', 'chapter-select'];
    await app.flow.runChapter(SIN.id, { skipCutscenes: true, speed: 'skip' });
    const [first, retry] = attempts as [Attempt, Attempt];
    expect(first.onLinks).toEqual([1, 2, 3]);
    expect(retry.opts.resumeAt?.link).toBe(3);
    expect(retry.onLinks).toEqual([3]);
    expect(retry.fought).toEqual([first.fought[2]]);
    expect(retry.auronHp).toEqual([first.auronHp[2]]);
    expect(shown).toEqual(['party-prep', 'battle', 'results', 'battle', 'results']);
  });

  it('a loss at link 1 or link 2 still retries from the Left Fin, through prep', async () => {
    switchOn = 'shipped';
    scripts = [['defeat'], ['victory', 'defeat'], ['defeat']];
    choices = ['retry', 'retry', 'chapter-select'];
    await app.flow.runChapter(SIN.id, { skipCutscenes: true, speed: 'skip' });
    expect(attempts.map((a) => a.opts.resumeAt)).toEqual([undefined, undefined, undefined]);
    expect(attempts.map((a) => a.onLinks[0])).toEqual([1, 1, 1]);
    expect(shown.filter((s) => s === 'party-prep')).toHaveLength(3);
  });
});
