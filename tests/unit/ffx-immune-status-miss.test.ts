/**
 * FOC54-003 (release 55; FFX only): a status move the target is wholly immune to lands nothing, and now says so the way every other immune
 * action does, with a `miss` event whose reason is `'immune'` (the HUD prints IMMUNE; `BattlePresenterEvents.reasonText`). Before this, Slow on
 * Seymour Flux (his record makes him Slow-proof, D7) and Shell on a Yu Pagoda (D10) lost their effect and showed nothing at all, which reads like
 * a broken button; only Scan on a Pagoda said "immune". The rule and its one switch are `src/battle/ffx/immune-status-miss.ts`.
 *
 * The change adds one event and nothing else: it is emitted after the status step has run and only reads, so it draws no roll and moves no number.
 * What proves that is below: with the switch OFF the engine's whole-chain event-log digests of the four chapters whose digest moved (the Yunalesca and
 * Macalania lines cast a status the boss is wholly immune to) are exactly the ones `ffx-engine-golden` pinned before, and with it ON the logs differ
 * from the OFF logs by miss events only, every one `reason: 'immune'`, the outcomes, turns and every other event identical.
 */

import { beforeAll, describe, expect, it } from 'vitest';
import type { BattleSetup, BattleState, Command, Decision, EnemyGroupDef, FFXCombatant } from '../../src/battle/common/types.ts';
import { FFXEngine, getFFXRegistry, resolveAbility } from '../../src/battle/ffx/index.ts';
import { BOSS_DATA_SWITCH_IDS, BOSS_DATA_SWITCHES, setBossDataSwitches } from '../../src/battle/ffx/boss-data-corrections.ts';
import { IMMUNE_STATUS_MISS } from '../../src/battle/ffx/immune-status-miss.ts';
import { makeFfxRng } from '../../src/battle/ffx/adapt/streams.ts';
import type { EventInput } from '../../src/battle/ffx/state.ts';
import { buildBattle } from '../../src/battle/ffx/setup.ts';
import { registerBattleContent } from '../../src/app/screens/BattleScreenContent.ts';
import { findEnemyGroup, setupForChapter, setupForNextLink } from '../../src/app/screens/BattleScreenSetup.ts';
import { CHAPTERS, getChapter, type Chapter } from '../../src/data/encounters.ts';
import { ALL_ABILITIES } from '../../src/data/ffx/index.ts';
import { reasonText } from '../../src/engine/BattlePresenterEvents.ts';
import { intendedStrategy } from '../../src/engine/BattlePresenterStrategies.ts';
import { ALL_OFF, loadWorld } from './helpers/ffxBossData.ts';

beforeAll(loadWorld);

function cast(chapterId: string, target: string, abilityId: string, on: Partial<Record<(typeof BOSS_DATA_SWITCH_IDS)[number], boolean>> = {}): { events: EventInput[]; target: FFXCombatant } {
  const restore = setBossDataSwitches(on);
  try {
    const events: EventInput[] = [];
    const ctx = buildBattle(setupForChapter(getChapter(chapterId) as Chapter, 1), makeFfxRng(1), getFFXRegistry().clone(), (e) => events.push(e));
    const user = Object.values(ctx.state.combatants).find((c) => c.side === 'party') as FFXCombatant;
    const def = ALL_ABILITIES.find((a) => a.id === abilityId)!;
    resolveAbility(ctx, user, def, [target]);
    return { events, target: ctx.state.combatants[target] as FFXCombatant };
  } finally {
    restore();
  }
}

const misses = (events: EventInput[]): EventInput[] => events.filter((e) => e.type === 'miss');

describe('a status move the target is wholly immune to says IMMUNE (FOC54-003)', () => {
  it('Slow on Seymour Flux (shipped: D7 on) lands nothing and emits one immune miss; the presenter prints IMMUNE for it', () => {
    const { events, target } = cast('seymour-flux', 'seymour-flux', 'slow');
    expect(target.statuses['slow']).toBeUndefined();
    expect(misses(events)).toEqual([{ type: 'miss', targetId: 'seymour-flux', sourceId: expect.any(String), reason: 'immune' }]);
    expect(reasonText('immune')).toMatch(/immune/i);
  });

  it('with D7 off Slow lands on Flux (the row as it was) and no miss is emitted: the miss follows the refusal, nothing else', () => {
    const { events, target } = cast('seymour-flux', 'seymour-flux', 'slow', ALL_OFF);
    expect(target.statuses['slow']).toBeDefined();
    expect(misses(events)).toEqual([]);
  });

  it('with the switch OFF Slow on Flux is silent again, as in release 54', () => {
    IMMUNE_STATUS_MISS.on = false;
    try {
      const { events, target } = cast('seymour-flux', 'seymour-flux', 'slow');
      expect(target.statuses['slow']).toBeUndefined();
      expect(misses(events)).toEqual([]);
    } finally {
      IMMUNE_STATUS_MISS.on = true;
    }
  });

  it('Shell on a Yu Pagoda (D10 on) says immune too; with D10 off it lands and says nothing', () => {
    const on = cast('braskas-final-aeon', 'yu-pagoda-left', 'shell');
    expect(on.target.statuses['shell']).toBeUndefined();
    expect(misses(on.events).map((e) => (e.type === 'miss' ? e.reason : ''))).toEqual(['immune']);
    const off = cast('braskas-final-aeon', 'yu-pagoda-left', 'shell', ALL_OFF);
    expect(off.target.statuses['shell']).toBeDefined();
    expect(misses(off.events)).toEqual([]);
  });

  it('Scan on a Yu Pagoda keeps its single immune miss (the reveal path already says it; the new rule skips Scan)', () => {
    const { events } = cast('braskas-final-aeon', 'yu-pagoda-left', 'scan');
    expect(misses(events)).toHaveLength(1);
  });

  it('a move that does damage never emits the status miss, and the boss-data switches are restored', () => {
    const { events } = cast('seymour-flux', 'seymour-flux', 'fire');
    expect(misses(events).filter((e) => e.type === 'miss' && e.reason === 'immune')).toEqual([]);
    for (const id of BOSS_DATA_SWITCH_IDS) expect(BOSS_DATA_SWITCHES[id]).toBe(true);
  });
});

type Input = Extract<Decision, { kind: 'player-input' }>;

function fallback(d: Input): Command {
  const row = d.commands.find((c) => c.enabled && c.command.kind === 'attack') ?? d.commands.find((c) => c.enabled);
  if (!row) return { kind: 'defend', targets: [] } as Command;
  const t = row.validTargets[0];
  return { ...row.command, targets: t ? [t] : [] } as Command;
}

function fnv(s: string): string {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) h = Math.imul(h ^ s.charCodeAt(i), 16777619) >>> 0;
  return h.toString(16);
}

/** The digests `ffx-engine-golden` pinned for these four rows in release 54 (the switch off must give them back). */
const RELEASE_54: Record<string, string> = {
  'yunalesca#1': 'fc0f6441:victory',
  'yunalesca#7': '3a7bc64f:victory',
  'seymour-anima-macalania#1': 'c4ad03e:victory',
  'seymour-anima-macalania#7': 'ff0b2fa0:victory',
};

/** `ffx-engine-golden`'s own play of one chapter's line (every link): each link's whole event log, then the outcome. */
async function logsOf(chapterId: string, seed: number): Promise<Array<{ log: ReadonlyArray<{ type: string; reason?: string }>; outcome: string }>> {
  await registerBattleContent();
  const chapter = CHAPTERS.find((c) => c.id === chapterId)!;
  let setup: BattleSetup = setupForChapter(chapter, seed);
  let group: EnemyGroupDef = chapter.enemyGroupRef;
  const e = new FFXEngine({ autoResolveMinigames: true });
  e.setSeed(setup.seed);
  e.init(setup);
  const out: Array<{ log: ReadonlyArray<{ type: string; reason?: string }>; outcome: string }> = [];
  let link = 1;
  for (let step = 0; step < 200_000; step++) {
    const d = e.nextDecision();
    if (d.kind === 'resolved' || d.kind === 'waiting') continue;
    if (d.kind === 'battle-over') {
      out.push({ log: e.state().log as ReadonlyArray<{ type: string; reason?: string }>, outcome: d.result.outcome });
      if (d.result.outcome !== 'victory' || !group.nextGroupId || link >= 12) break;
      const next = await findEnemyGroup(group.nextGroupId);
      if (!next) break;
      setup = setupForNextLink(setup, next, e.state() as BattleState, seed + link);
      group = next;
      link += 1;
      e.setSeed(setup.seed);
      e.init(setup);
      continue;
    }
    e.submit(intendedStrategy(d.actorId, d.commands, e as never) ?? fallback(d));
  }
  return out;
}

describe('only an event is added: the whole-chain logs of the chapters whose golden moved', () => {
  const cases: Array<[string, number]> = [['yunalesca', 1], ['yunalesca', 7], ['seymour-anima-macalania', 1], ['seymour-anima-macalania', 7]];
  it.each(cases)('%s seed %i: with the switch off the release 54 digest comes back; with it on the logs differ by immune misses only', async (id, seed) => {
    IMMUNE_STATUS_MISS.on = false;
    let off: Awaited<ReturnType<typeof logsOf>>;
    try {
      off = await logsOf(id, seed);
    } finally {
      IMMUNE_STATUS_MISS.on = true;
    }
    const on = await logsOf(id, seed);
    expect(off.map((l) => `${fnv(JSON.stringify(l.log))}:${l.outcome}`).join(' ')).toBe(RELEASE_54[`${id}#${seed}`]); // switched off, the digest release 54 pinned comes back
    expect(on.map((l) => l.outcome)).toEqual(off.map((l) => l.outcome));
    expect(on).toHaveLength(off.length);
    let added = 0;
    on.forEach((link, i) => {
      const was = off[i]!;
      const extra = link.log.filter((e) => e.type === 'miss' && e.reason === 'immune');
      const base = was.log.filter((e) => e.type === 'miss' && e.reason === 'immune');
      expect(extra.length).toBeGreaterThanOrEqual(base.length);
      added += extra.length - base.length;
      const strip = (log: ReadonlyArray<{ type: string; reason?: string }>): string[] => log.filter((e) => !(e.type === 'miss' && e.reason === 'immune')).map((e) => JSON.stringify({ ...e, seq: 0 }));
      expect(strip(link.log)).toEqual(strip(was.log));
    });
    expect(added).toBeGreaterThan(0);
  }, 120_000);
});
