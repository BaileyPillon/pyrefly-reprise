/**
 * DEMO MODE (release 60; `src/app/demoMode.ts`; Bailey 157c, "Demo mode: party moves first"; Chapter I is FFX only, Chapter IV FFX-2 only).
 *
 * Three claims, each proved on the engines and not by reading the table:
 *  1. Chapter I's demo seeds put the party's first command menu before any enemy act, with nobody down (the RE audit's 7, 10 and 12), and the shipped line wins each; seeds the audit did not list do
 *     not all do it (so the test would notice a table that stopped meaning anything).
 *  2. Chapter IV's demo seed wins at Wait, with no girl down, in the time of a two-to-three-minute demo slot (engine seconds; a person at Wait adds the menus).
 *  3. Without `?demo=1` nothing changes: the seed a fresh run draws and a retry's `+ 1000` are what they were; with it, a fresh attempt takes the next seed and a retry the one after.
 * The engines are never touched by the switch: it only chooses a seed.
 */
import { afterEach, describe, expect, it } from 'vitest';
import type { BattleSetup, Command, Decision } from '../../src/battle/common/types.ts';
import { FFXEngine } from '../../src/battle/ffx/index.ts';
import { registerBattleContent } from '../../src/app/screens/BattleScreenContent.ts';
import { setupForChapter } from '../../src/app/screens/BattleScreenSetup.ts';
import { CHAPTERS } from '../../src/data/encounters.ts';
import { intendedStrategy } from '../../src/engine/BattlePresenterStrategies.ts';
import { DEMO_SEEDS, attemptSeed, demoModeOn, demoSeedAt, demoSeedsOf, nextDemoRunSeed, readDemoFlag, setDemoMode } from '../../src/app/demoMode.ts';
import { drawRunSeed, pinRunSeed } from '../../src/app/runSeed.ts';
import { driveChapter4 } from './helpers/ffx2ChapterDrive.ts';

type Input = Extract<Decision, { kind: 'player-input' }>;

const PARTY = ['tidus', 'yuna', 'auron', 'wakka', 'lulu', 'kimahri', 'rikku'];
const GIRLS = ['yuna', 'rikku', 'paine'];

afterEach(() => {
  setDemoMode(null);
  pinRunSeed(null);
});

function fallback(d: Input): Command {
  const row = d.commands.find((c) => c.enabled && c.command.kind === 'attack') ?? d.commands.find((c) => c.enabled);
  if (!row) return { kind: 'defend', targets: [] } as Command;
  const t = row.validTargets[0];
  return { ...row.command, targets: t ? [t] : [] } as Command;
}

/** Chapter I on the FFX engine up to the party's first command menu, then through the whole fight on the shipped line. */
async function chapterOne(seed: number) {
  await registerBattleContent();
  const chapter = CHAPTERS.find((c) => c.id === 'seymour-flux')!;
  const setup: BattleSetup = setupForChapter(chapter, seed);
  const e = new FFXEngine({ autoResolveMinigames: true });
  e.setSeed(setup.seed);
  e.init(setup);
  let first: { actorId: string; log: Array<{ type: string }>; allAlive: boolean } | null = null;
  let outcome = 'none';
  for (let step = 0; step < 100_000; step++) {
    const d = e.nextDecision();
    if (d.kind === 'resolved' || d.kind === 'waiting') continue;
    if (d.kind === 'battle-over') {
      outcome = d.result.outcome;
      break;
    }
    if (first === null) {
      const st = e.state();
      const ids = [...st.activeIds, ...st.enemyIds];
      first = { actorId: d.actorId, log: st.log.map((ev) => ({ type: ev.type })), allAlive: ids.every((id) => ((st.combatants[id] as unknown as { hp: number }).hp ?? 1) > 0) };
    }
    e.submit(intendedStrategy(d.actorId, d.commands, e as never) ?? fallback(d));
  }
  const log = e.state().log as unknown as Array<{ type: string; targetId?: string }>;
  const partyDown = log.filter((ev) => ev.type === 'ko' && PARTY.includes(String(ev.targetId))).length;
  return { first, outcome, partyDown };
}

describe('Chapter I (FFX only): the party opens on every demo seed', () => {
  it('the table is 7, 10 and 12', () => {
    expect(DEMO_SEEDS['seymour-flux']).toEqual([7, 10, 12]);
  });

  for (const seed of DEMO_SEEDS['seymour-flux']!) {
    it(`seed ${seed}: the first command menu is a party member's, before any enemy act, nobody down; the shipped line wins`, async () => {
      const r = await chapterOne(seed);
      expect(r.first).not.toBeNull();
      expect(PARTY).toContain(r.first!.actorId);
      // nothing the enemy did, and nothing that hurt anyone, is in the log before the menu
      const types = r.first!.log.map((e) => e.type);
      for (const t of ['action-start', 'damage', 'miss', 'ko', 'status-add', 'heal']) expect(types).not.toContain(t);
      expect(r.first!.allAlive).toBe(true);
      expect(r.outcome).toBe('victory');
    }, 60_000);
  }

  it('seed 7 is the cleanest: no one in the party falls in the whole fight', async () => {
    const r = await chapterOne(7);
    expect(r.partyDown).toBe(0);
  }, 60_000);

  it('the audit is not vacuous: some seeds OUTSIDE the table open with an enemy act before the first menu', async () => {
    let enemyFirst = 0;
    for (const seed of [1, 2, 3, 4, 5, 6, 8, 9]) {
      const r = await chapterOne(seed);
      if (r.first!.log.some((e) => e.type === 'action-start')) enemyFirst++;
    }
    expect(enemyFirst).toBeGreaterThanOrEqual(6);
  }, 120_000);
});

describe('Chapter IV (FFX-2 only): the demo seed is a clean win at Wait', () => {
  it('the table is seed 56', () => {
    expect(DEMO_SEEDS['ffx2-bahamut']).toEqual([56]);
  });

  it('seed 56 at Wait: victory, no girl falls, one Mega Flare, 90 to 130 s of engine time (a 2 to 3 minute slot with the menus)', () => {
    const r = driveChapter4(56, 1500, { atbMode: 'wait' });
    expect(r.outcome).toBe('victory');
    const log = r.logs[0] as unknown as Array<{ type: string; targetId?: string; abilityId?: string }>;
    expect(log.filter((e) => e.type === 'ko' && GIRLS.includes(String(e.targetId)))).toHaveLength(0);
    const seconds = r.ticks / 29.97;
    expect(seconds).toBeGreaterThan(90);
    expect(seconds).toBeLessThan(130);
    expect(JSON.stringify(log.filter((e) => e.type === 'action-start')).match(/mega-flare|megaflare|mega_flare/gi)?.length ?? 0).toBeGreaterThanOrEqual(1);
  });
});

describe('the switch: ?demo=1 on the address, remembered for the tab', () => {
  it('reads the address and the tab\'s memory (pure)', () => {
    expect(readDemoFlag(undefined, null)).toEqual({ on: false, remember: undefined });
    expect(readDemoFlag('', null)).toEqual({ on: false, remember: undefined });
    expect(readDemoFlag('?demo=1', null)).toEqual({ on: true, remember: '1' });
    expect(readDemoFlag('?x=1&demo=1', null)).toEqual({ on: true, remember: '1' });
    expect(readDemoFlag('', '1')).toEqual({ on: true, remember: undefined }); // a reload keeps it
    expect(readDemoFlag('?demo=0', '1')).toEqual({ on: false, remember: null }); // ?demo=0 clears it
    expect(readDemoFlag('?demo=yes', null)).toEqual({ on: false, remember: undefined }); // only 1 turns it on
  });

  it('is off where there is no page, and setDemoMode forces it', () => {
    expect(demoModeOn()).toBe(false);
    setDemoMode(true);
    expect(demoModeOn()).toBe(true);
    setDemoMode(false);
    expect(demoModeOn()).toBe(false);
  });
});

describe('the seeds: demo mode picks the seed of a fresh attempt, and nothing else', () => {
  it('rotates through the chapter\'s table (pure) and has none for any other chapter', () => {
    expect([0, 1, 2, 3, 4].map((n) => demoSeedAt('seymour-flux', n))).toEqual([7, 10, 12, 7, 10]);
    expect([0, 1, 2].map((n) => demoSeedAt('ffx2-bahamut', n))).toEqual([56, 56, 56]);
    for (const other of ['yunalesca', 'braskas-final-aeon', 'ffx2-vegnagun-shuyin', 'ffx2-leblanc', 'nonsense']) {
      expect(demoSeedsOf(other)).toBeNull();
      expect(demoSeedAt(other, 0)).toBeNull();
    }
  });

  it('WITHOUT demo mode a fresh run draws as it always did and a retry adds 1000: nothing changed', () => {
    expect(demoModeOn()).toBe(false);
    expect(nextDemoRunSeed('seymour-flux')).toBeNull();
    expect(drawRunSeed(() => 0, 'seymour-flux')).toBe(1);
    expect(drawRunSeed(() => 0.5, 'seymour-flux')).toBe(drawRunSeed(() => 0.5));
    expect(drawRunSeed(() => 0.5, 'ffx2-bahamut')).toBe(drawRunSeed(() => 0.5));
    for (const id of ['seymour-flux', 'ffx2-bahamut', 'yunalesca']) {
      expect(attemptSeed(id, 7, 0)).toBe(7);
      expect(attemptSeed(id, 7, 1)).toBe(1007);
      expect(attemptSeed(id, 12345, 3)).toBe(15345);
    }
  });

  it('WITH demo mode: a fresh attempt of Chapter I takes the next of 7, 10, 12 (per tab), a retry (TRY AGAIN, release 62) is the SAME seed, a pinned seed still wins, other chapters draw as always', () => {
    setDemoMode(true);
    // the tab's counter is sessionStorage; there is none under node, so the first draw is the table's first and stays there: the rotation is `demoSeedAt` over the counter
    expect(demoSeedAt('seymour-flux', 0)).toBe(7);
    expect(drawRunSeed(() => 0.5, 'seymour-flux')).toBe(7);
    expect(attemptSeed('seymour-flux', 7, 0)).toBe(7);
    expect(attemptSeed('seymour-flux', 7, 1)).toBe(7); // release 62, decision 173g: "Try again" = the same fight, fresh, same demo seed (release 61 took 10 here)
    expect(attemptSeed('seymour-flux', 7, 2)).toBe(7);
    expect(attemptSeed('seymour-flux', 10, 3)).toBe(10);
    expect(attemptSeed('seymour-flux', 12, 1)).toBe(12);
    expect(drawRunSeed(() => 0.5, 'ffx2-bahamut')).toBe(56);
    expect(attemptSeed('ffx2-bahamut', 56, 2)).toBe(56);
    // a chapter with no table, and a first seed the table does not hold (a caller's own), keep the game's rule
    expect(drawRunSeed(() => 0.5, 'yunalesca')).toBe(drawRunSeed(() => 0.5));
    expect(attemptSeed('yunalesca', 7, 1)).toBe(1007);
    expect(attemptSeed('seymour-flux', 99, 1)).toBe(1099);
    // a seed pinned by the debug API (`setSeed`) is the developer's word and wins
    pinRunSeed(3);
    expect(drawRunSeed(() => 0.5, 'seymour-flux')).toBe(3);
  });

  it('rotates across fresh attempts through the tab\'s store when there is one', () => {
    const mem = new Map<string, string>();
    const fake = { getItem: (k: string) => mem.get(k) ?? null, setItem: (k: string, v: string) => void mem.set(k, v), removeItem: (k: string) => void mem.delete(k) };
    (globalThis as { sessionStorage?: unknown }).sessionStorage = fake;
    try {
      setDemoMode(true);
      expect([0, 1, 2, 3].map(() => nextDemoRunSeed('seymour-flux'))).toEqual([7, 10, 12, 7]);
      expect(nextDemoRunSeed('ffx2-bahamut')).toBe(56);
    } finally {
      delete (globalThis as { sessionStorage?: unknown }).sessionStorage;
    }
  });
});
