// @vitest-environment jsdom
/**
 * **The Pilgrimage, driven end to end through its own flow** (hidden prototype, FFX only; Bailey, 2026-10-18, decision 122): `src/app/pilgrim/PilgrimFlow.ts` with the REAL road, boon and run-over screens mounted in jsdom
 * and the real run state, and a stand-in for the host's one expensive thing, `GameFlow.runChapter` (a fight): it answers victory, defeat or null on cue and hands the test the options and the fight hook the flow gave it.
 *
 * Pinned: the order of the fights (Macalania, a stop of each fork, the finale); every fight is skipped past cutscenes and results and carries the run's hook; the boon taken after a win is **in the next fight's party and
 * only that fight's** (the shipped chapter is never changed); the Elite pays two; a loss ends the run on the run-over page; **Again** starts a new run with no road screen, in two key presses to the next fight; the best
 * run is kept under its own keys and **never the save**; a run left by the pause menu's exits is dropped without a word.
 *
 * Game case: FFX only.
 */
import { afterEach, beforeEach, describe, expect, it } from 'vitest';

import type { App } from '../../src/app/App.ts';
import type { Button, InputSnapshot } from '../../src/app/Input.ts';
import type { Screen } from '../../src/app/Screen.ts';
import type { BattleScreenResult } from '../../src/app/screens/BattleScreen.ts';
import type { RunChapterOptions } from '../../src/app/screens/BattleScreenFlow.ts';
import { SAVE_KEY } from '../../src/app/SaveData.ts';
import { pinRunSeed } from '../../src/app/runSeed.ts';
import { EXPERIMENTS_KEY, experimentRecord, setExperimentStorageForTests } from '../../src/app/experiments/experimentRecords.ts';
import { experimentRunActive } from '../../src/app/experiments/experimentRun.ts';
import { activeFight } from '../../src/app/pilgrim/activeRun.ts';
import { boonHtml, overHtml, routeHtml, runPanelHtml } from '../../src/app/pilgrim/pilgrimMarkup.ts';
import { BOON_POOL } from '../../src/app/pilgrim/boons.ts';
import { chooseRoad, finishFight, newRun, pickBoon, summarize } from '../../src/app/pilgrim/runState.ts';
import { drawOffers, boonById } from '../../src/app/pilgrim/boons.ts';
import { fightSeed, runPilgrimage } from '../../src/app/pilgrim/PilgrimFlow.ts';
import type { PilgrimHost } from '../../src/app/pilgrim/pilgrimHook.ts';
import { PILGRIM_KEY, readPilgrim, setPilgrimStorageForTests } from '../../src/app/pilgrim/runStore.ts';
import { ROUTE_LENGTH } from '../../src/app/pilgrim/route.ts';
import { getChapter, type Chapter, type ChapterId } from '../../src/data/encounters.ts';

const SEED = 4242;

/** One frame's input: the buttons that went down and the clicked actions. */
function snap(buttons: Button[] = [], actions: string[] = []): InputSnapshot {
  const down = [...buttons];
  return {
    pressed: () => false,
    justPressed: (b) => down.includes(b),
    justReleased: () => false,
    consume: (b) => {
      const i = down.indexOf(b);
      if (i < 0) return false;
      down.splice(i, 1);
      return true;
    },
    axis: { x: 0, y: 0 },
    actions,
    gamepadConnected: false,
    lastDevice: 'keyboard',
  };
}

type Fate = 'victory' | 'defeat' | 'null' | 'quit' | 'aborted';
interface Fight {
  id: ChapterId;
  opts: RunChapterOptions;
  /** The chapter the flow fought: the shipped one run through the hook. */
  fought: Chapter;
  /** What party prep's RUN tab would have been told. */
  tab: ReturnType<typeof activeFight>;
}

/** A scripted session: what each fight ends in, which road to take, and what to press on each of the run's screens. */
interface Script {
  fates: Fate[];
  /** After a fork's pick: Left/Right presses to take the option at this index. */
  roads?: number[];
  /** Over-screen answer per run. */
  over: Array<'again' | 'leave'>;
}

function rig(script: Script) {
  const shown: string[] = [];
  const fights: Fight[] = [];
  const presses: Record<string, number> = {}; // buttons pressed on each screen, for the "two key presses" count
  let away = false;
  let roadAt = 0;
  let fateAt = 0;
  let overAt = 0;
  const roots: HTMLElement[] = [];

  const press = (screen: Screen, buttons: Button[]): void => {
    presses[screen.name] = (presses[screen.name] ?? 0) + buttons.length;
    screen.handleInput(snap(buttons));
  };

  /** Mount a screen the way `GameFlow.show` would, and answer it on cue. */
  const show = async (screen: Screen): Promise<boolean> => {
    if (away) return false;
    const root = document.createElement('div');
    document.body.appendChild(root);
    roots.push(root);
    screen.root = root;
    screen.app = { fade: () => Promise.resolve() } as unknown as App;
    await screen.enter();
    shown.push(screen.name);
    setTimeout(() => {
      if (screen.name === 'pilgrim-route') press(screen, ['confirm']);
      else if (screen.name === 'pilgrim-boons') {
        press(screen, ['confirm']); // take the first card
        if ((screen.snapshot()['phase'] as string) === 'boons') press(screen, ['confirm']); // the Elite's second pick
        const want = script.roads?.[roadAt++] ?? 0;
        for (let i = 0; i < want; i++) press(screen, ['right']);
        press(screen, ['confirm']); // on to the road's next stop
      } else if (screen.name === 'pilgrim-over') {
        const answer = script.over[overAt++] ?? 'leave';
        if (answer === 'leave') press(screen, ['cancel']);
        else press(screen, ['confirm']);
      }
    }, 0);
    return true;
  };

  const host: PilgrimHost = {
    app: {} as App,
    show,
    setStep: () => undefined,
    claim: () => undefined,
    away: () => away,
    fight: async (id, opts) => {
      const shipped = getChapter(id)!;
      const fought = opts.pilgrim!.chapter(shipped);
      fights.push({ id, opts, fought, tab: activeFight() });
      const fate = script.fates[fateAt++] ?? 'defeat';
      if (fate === 'null') return null;
      const base = { chapterId: id, result: null, elapsedMs: 1000, links: 1, preview: false } as const;
      if (fate === 'quit') {
        away = true;
        return { ...base, outcome: 'aborted', quitToTitle: true };
      }
      return { ...base, outcome: fate } as BattleScreenResult;
    },
  };
  return { host, shown, fights, presses, cleanup: () => roots.forEach((r) => r.remove()), setAway: (v: boolean) => (away = v) };
}

const stored = (): Record<string, string | null> => Object.fromEntries(Array.from({ length: window.localStorage.length }, (_, i) => window.localStorage.key(i) ?? '').map((k) => [k, window.localStorage.getItem(k)]));

beforeEach(() => {
  window.localStorage.clear();
  setPilgrimStorageForTests(undefined);
  setExperimentStorageForTests(undefined);
  pinRunSeed(SEED);
});

afterEach(() => {
  pinRunSeed(null);
  document.body.innerHTML = '';
});

describe('a whole winning run', () => {
  it('fights Macalania, Evrae, Natus and the finale in order, each skipped past cutscenes and results, and ends on a won run-over page', async () => {
    const r = rig({ fates: ['victory', 'victory', 'victory', 'victory'], over: ['leave'] });
    const before = stored();
    const result = await runPilgrimage(r.host);
    expect(result?.outcome).toBe('victory');
    expect(r.fights.map((f) => f.id)).toEqual(['seymour-anima-macalania', 'evrae-airship', 'seymour-natus', 'braskas-final-aeon']);
    for (const f of r.fights) expect(f.opts).toMatchObject({ skipCutscenes: true, skipResults: true });
    expect(r.fights.map((f) => f.opts.seed)).toEqual([1, 2, 3, 4].map((n) => SEED + n));
    expect(r.shown).toEqual(['pilgrim-route', 'pilgrim-boons', 'pilgrim-boons', 'pilgrim-boons', 'pilgrim-over']);
    expect(readPilgrim()).toMatchObject({ runs: 1, clears: 1, best: { won: ROUTE_LENGTH, cleared: true, reached: ROUTE_LENGTH } });
    expect(experimentRecord('pilgrimage')).toMatchObject({ attempts: 1, clears: 1 });
    // Nothing of the run is in the save, and the keys it did write are its own.
    expect(window.localStorage.getItem(SAVE_KEY)).toBeNull();
    expect(Object.keys(stored()).sort()).toEqual([EXPERIMENTS_KEY, PILGRIM_KEY].sort());
    expect(Object.keys(before)).toEqual([]);
    expect(experimentRunActive(), 'the coach\'s memory goes back to the save when the run ends').toBe(false);
    expect(activeFight()).toBeNull();
    r.cleanup();
  });

  it('puts the boon taken after a win into the NEXT fight\'s party and only that one, never changing the shipped chapter', async () => {
    const r = rig({ fates: ['victory', 'victory', 'victory', 'victory'], over: ['leave'] });
    const shippedBefore = ['evrae-airship', 'seymour-natus', 'braskas-final-aeon'].map((id) => JSON.stringify(getChapter(id as ChapterId)!.buildRef));
    await runPilgrimage(r.host);
    // Run state, replayed: pick number n offers drawOffers(seed, n) when its pack is empty; every pick here is the first card.
    const taken = [0, 1, 2].map((n) => drawOffers(SEED, n)[0]!);
    expect(r.fights[0]!.tab!.lines, 'the first fight has no boon').toEqual([]);
    expect(r.fights[0]!.fought).toBe(getChapter('seymour-anima-macalania'));
    r.fights.slice(1).forEach((f, i) => {
      expect(f.tab!.run.pack, `fight ${i + 2}`).toEqual([taken[i]]);
      expect(f.tab!.lines.map((l) => l.boon)).toEqual([taken[i]]);
      expect(f.fought, `fight ${i + 2} is the shipped chapter with its boon`).not.toBe(getChapter(f.id));
      expect(f.fought.enemyGroupRef).toBe(getChapter(f.id)!.enemyGroupRef);
      expect(f.tab!.lines[0]!.line.length).toBeGreaterThan(5);
      expect(boonById(taken[i]!).name.length).toBeGreaterThan(2);
    });
    expect(['evrae-airship', 'seymour-natus', 'braskas-final-aeon'].map((id) => JSON.stringify(getChapter(id as ChapterId)!.buildRef))).toEqual(shippedBefore);
    r.cleanup();
  });

  it('a fight\'s progress hook is empty: its clear writes nothing and reads no best time', async () => {
    const r = rig({ fates: ['victory', 'defeat'], over: ['leave'] });
    await runPilgrimage(r.host);
    const progress = r.fights[0]!.opts.pilgrim!.progress;
    progress.recordAttempt('seymour-anima-macalania');
    progress.recordClear('seymour-anima-macalania', 5000, 7);
    expect(progress.chapter('seymour-anima-macalania').bestTimeMs).toBeNull();
    expect(window.localStorage.getItem(SAVE_KEY)).toBeNull();
    r.cleanup();
  });
});

describe('the road and the Elite', () => {
  it('takes the stop the cursor is on at each fork, and the Elite pays two boons into the finale', async () => {
    const r = rig({ fates: ['victory', 'victory', 'victory', 'victory'], roads: [1, 1, 0], over: ['leave'] });
    await runPilgrimage(r.host);
    expect(r.fights.map((f) => f.id)).toEqual(['seymour-anima-macalania', 'yojimbo-cavern', 'mirror-aeons', 'braskas-final-aeon']);
    const finale = r.fights[3]!;
    expect(finale.tab!.run.pack).toHaveLength(2);
    expect(new Set(finale.tab!.run.pack).size).toBe(2);
    expect(finale.tab!.lines).toHaveLength(2);
    expect(r.fights[2]!.tab!.run.pack, 'the Elite itself was fought on one boon').toHaveLength(1);
    r.cleanup();
  });
});

describe('a loss, and Again', () => {
  it('a loss ends the run on the run-over page with the fights won and the reached stop kept as the best run', async () => {
    const r = rig({ fates: ['victory', 'defeat'], over: ['leave'] });
    await runPilgrimage(r.host);
    expect(r.fights).toHaveLength(2);
    expect(r.shown).toEqual(['pilgrim-route', 'pilgrim-boons', 'pilgrim-over']);
    expect(readPilgrim()).toMatchObject({ runs: 1, clears: 0, best: { won: 1, reached: 2, cleared: false, boonsUsed: 1 } });
    expect(experimentRecord('pilgrimage')).toMatchObject({ attempts: 1, clears: 0 });
    r.cleanup();
  });

  it('Again starts a new run with no road screen: the next fight is two key presses from the run-over page, and a better run replaces the best', async () => {
    const r = rig({ fates: ['defeat', 'victory', 'defeat'], over: ['again', 'leave'] });
    await runPilgrimage(r.host);
    expect(r.shown).toEqual(['pilgrim-route', 'pilgrim-over', 'pilgrim-boons', 'pilgrim-over']);
    expect(r.fights.map((f) => f.id)).toEqual(['seymour-anima-macalania', 'seymour-anima-macalania', 'evrae-airship']);
    expect(r.fights[1]!.tab!.run.pack, 'a new run starts with an empty pack').toEqual([]);
    expect(r.fights[1]!.tab!.run.road).toEqual(['macalania']);
    // From the run-over page: Again is ONE press (Enter), and the first stop's party prep is the next thing up (Enter starts its battle: the second press).
    expect(r.presses['pilgrim-over']).toBe(2); // one Again, then one Esc to leave the second run
    expect(r.shown.indexOf('pilgrim-route')).toBe(0);
    expect(r.shown.lastIndexOf('pilgrim-route')).toBe(0);
    expect(readPilgrim()).toMatchObject({ runs: 2, clears: 0, best: { won: 1 } });
    r.cleanup();
  });
});

describe('leaving the run', () => {
  it('backing out of party prep (the fight returns null) ends the run as left, on the run-over page', async () => {
    const r = rig({ fates: ['null'], over: ['leave'] });
    await runPilgrimage(r.host);
    expect(r.shown).toEqual(['pilgrim-route', 'pilgrim-over']);
    expect(readPilgrim()).toMatchObject({ runs: 1, best: null, last: { won: 0, reached: 1, cleared: false } }); // a run that won nothing is never the best
    r.cleanup();
  });

  it('QUIT TO TITLE from the pause menu hands the result back at once, with no run-over page and no record of the unfinished run', async () => {
    const r = rig({ fates: ['victory', 'quit'], over: ['leave'] });
    const result = await runPilgrimage(r.host);
    expect(result?.quitToTitle).toBe(true);
    expect(r.shown).toEqual(['pilgrim-route', 'pilgrim-boons']);
    expect(readPilgrim().best).toBeNull();
    expect(readPilgrim().last).toBeNull(); // the unfinished run left no record of its end
    expect(experimentRunActive()).toBe(false);
    r.cleanup();
  });

  it('a flow navigated away under the run (the pause menu\'s CHAPTER SELECT) drops it on the next screen without a word', async () => {
    const r = rig({ fates: ['victory'], over: ['leave'] });
    const fight = r.host.fight;
    r.host.fight = async (id, opts) => {
      const out = await fight(id, opts);
      r.setAway(true);
      return out;
    };
    await runPilgrimage(r.host);
    expect(r.shown).toEqual(['pilgrim-route']);
    r.cleanup();
  });

  it('Esc on the road screen goes back to the board with nothing started', async () => {
    const r = rig({ fates: [], over: [] });
    r.host.show = async (screen) => {
      screen.root = document.body.appendChild(document.createElement('div'));
      screen.app = { fade: () => Promise.resolve() } as unknown as App;
      await screen.enter();
      setTimeout(() => screen.handleInput(snap(['cancel'])), 0);
      return true;
    };
    expect(await runPilgrimage(r.host)).toBeNull();
    expect(r.fights).toHaveLength(0);
    expect(readPilgrim().runs, 'looking at the road is not a run').toBe(0);
    r.cleanup();
  });
});

describe('the fight seed', () => {
  it('moves with the fight number, so the same run replays', () => {
    expect(fightSeed({ seed: 100, road: ['macalania'] } as never)).toBe(101);
    expect(fightSeed({ seed: 100, road: ['macalania', 'evrae', 'natus'] } as never)).toBe(103);
  });
});

describe('what a player reads', () => {
  /** Developer text: a repo path, a research reference, or the word "ours". */
  const DEV = /src\/|\.ts\b|combat-core|data\/ffx|\bours\b/i;
  const text = (html: string): string => {
    const el = document.createElement('div');
    el.innerHTML = html;
    return el.textContent ?? '';
  };

  it('no screen prints a file path, a research reference or "ours": the boon cards end in a short tag, the road, the run-over page and the RUN tab say none', () => {
    const record = { runs: 2, clears: 0, best: { won: 2, reached: 3, cleared: false, timeMs: 5000, boonsUsed: 2, finishedAt: 1 }, last: null };
    expect(text(routeHtml(record))).not.toMatch(DEV);
    expect(text(routeHtml({ runs: 0, clears: 0, best: null, last: null }))).not.toMatch(DEV);
    // The boon pick: every boon of the pool, as a card, on the pick screen.
    let run = finishFight(newRun(1, 0), 'victory', 1);
    expect(text(boonHtml(run, { zone: 'boons', boonSel: 0, roadSel: 0, notice: '' }))).not.toMatch(DEV);
    const tags = new Set<string>();
    for (let seed = 1; seed < 60; seed++) {
      const picking = finishFight(newRun(seed, 0), 'victory', 1);
      const html = boonHtml(picking, { zone: 'boons', boonSel: 1, roadSel: 0, notice: '' });
      expect(text(html), String(seed)).not.toMatch(DEV);
      for (const m of html.matchAll(/pgx-card__src">([^<]*)</g)) tags.add(m[1]!);
    }
    expect([...tags].sort()).toEqual(['FFX armour ability', 'FFX item', 'New boon']);
    for (const b of BOON_POOL) expect(text(boonHtml({ ...run, offers: [b.id] }, { zone: 'boons', boonSel: 0, roadSel: 0, notice: '' })), b.id).not.toMatch(DEV);
    run = chooseRoad(pickBoon(run, 0), 'evrae');
    expect(text(boonHtml(finishFight(pickBoon(finishFight(run, 'victory', 2), 0), 'victory', 3) && pickBoon(finishFight(run, 'victory', 2), 0), { zone: 'road', boonSel: 0, roadSel: 0, notice: '' }))).not.toMatch(DEV);
    // The run-over page for a loss, a win and leaving, and the RUN tab with and without boons.
    const lost = finishFight(run, 'defeat', 9);
    for (const done of [lost, finishFight(newRun(3, 0), 'left', 5)]) expect(text(overHtml(done, summarize(done, 10), null, true)), String(done.end)).not.toMatch(DEV);
    expect(text(runPanelHtml(run, []))).not.toMatch(DEV);
    expect(text(runPanelHtml(run, [{ boon: 'auto-regen', line: 'Auto-Regen is worn by Tidus.' }]))).not.toMatch(DEV);
  });
});
