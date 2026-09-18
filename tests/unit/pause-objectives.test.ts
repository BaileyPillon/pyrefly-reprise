/**
 * The `ObjectiveRule` -> `BattleState` evaluator (`ui/common/chapterObjectives.ts`).
 *
 * `src/data/chapter-meta.ts` ships the objectives as pure descriptors and
 * `docs/handoff/pause-screen.md` names the evaluator as the missing half. This
 * suite is that half's contract: every rule shape, the two that were invented
 * for objectives the brief's six shapes could not express (`parts-downed`,
 * `chain-landed`), and — the one most likely to rot — the fact that the five
 * *shipped* objectives resolve against the ability ids the engines actually
 * emit, which are namespaced in FFX-2 and bare in FFX.
 */
import { describe, expect, it } from 'vitest';

import type { BattleEvent, BattleState, StatusId } from '../../src/battle/common/types.ts';
import { CHAPTER_META, getChapterMeta } from '../../src/data/chapter-meta.ts';
import {
  encounterProgress,
  evaluateObjective,
  evaluateObjectives,
  formatPlayTime,
  objectivesCleared,
  type ObjectiveContext,
} from '../../src/ui/common/chapterObjectives.ts';

/**
 * Number a hand-written event list the way the engine would.
 *
 * Takes loose records rather than `Omit<BattleEvent, 'seq'>`: `BattleEvent` is
 * a wide union, so an object literal typed against it trips excess-property
 * checking on whichever member TypeScript picks first. These are fixtures — the
 * point is to write the six fields a rule actually reads, not a valid instance
 * of every variant.
 */
function log(...events: Array<Record<string, unknown>>): BattleEvent[] {
  return events.map((e, seq) => ({ ...e, seq }) as unknown as BattleEvent);
}

function ctx(events: BattleEvent[], over: Partial<ObjectiveContext> = {}): ObjectiveContext {
  return { state: null, log: events, links: 1, ...over };
}

/** Just enough `BattleState` for the rules that read live state. */
function stateWith(enemies: Array<{ id: string; hp: number; maxHp: number; removed?: boolean }>): BattleState {
  const combatants: Record<string, unknown> = {};
  for (const e of enemies) {
    combatants[e.id] = {
      id: e.id,
      hp: e.hp,
      stats: { maxHp: e.maxHp },
      removed: e.removed ?? false,
    };
  }
  return {
    enemyIds: enemies.map((e) => e.id),
    combatants,
    log: [],
    result: null,
  } as unknown as BattleState;
}

describe('evaluateObjective — victory', () => {
  it('is false on an empty log', () => {
    expect(evaluateObjective({ kind: 'victory' }, ctx([]))).toBe(false);
  });

  it('reads a victory event', () => {
    const events = log({ type: 'victory', result: { outcome: 'victory' } } as Omit<BattleEvent, 'seq'>);
    expect(evaluateObjective({ kind: 'victory' }, ctx(events))).toBe(true);
  });

  it('also reads a settled result with no victory event in the slice it was given', () => {
    const state = { ...stateWith([]), result: { outcome: 'victory' } } as unknown as BattleState;
    expect(evaluateObjective({ kind: 'victory' }, ctx([], { state }))).toBe(true);
  });

  it('is false for a defeat', () => {
    const state = { ...stateWith([]), result: { outcome: 'defeat' } } as unknown as BattleState;
    expect(evaluateObjective({ kind: 'victory' }, ctx([], { state }))).toBe(false);
  });
});

describe('evaluateObjective — status-cured', () => {
  const removal = (status: string, reason: string): BattleEvent[] =>
    log({ type: 'status-remove', targetId: 'tidus', status: status as StatusId, reason } as Omit<BattleEvent, 'seq'>);

  it('counts a cure', () => {
    expect(evaluateObjective({ kind: 'status-cured', status: 'zombie' }, ctx(removal('zombie', 'cured')))).toBe(true);
  });

  it('counts a dispel — which is what Yunalesca’s Regen objective is', () => {
    expect(evaluateObjective({ kind: 'status-cured', status: 'regen' }, ctx(removal('regen', 'dispelled')))).toBe(true);
  });

  it.each(['expired', 'ko', 'consumed', 'overwritten'])('does not count a %s removal', (reason) => {
    expect(evaluateObjective({ kind: 'status-cured', status: 'zombie' }, ctx(removal('zombie', reason)))).toBe(false);
  });

  it('does not count a different status', () => {
    expect(evaluateObjective({ kind: 'status-cured', status: 'zombie' }, ctx(removal('poison', 'cured')))).toBe(false);
  });
});

describe('evaluateObjective — survived-ability', () => {
  const cast = (abilityId: string): Omit<BattleEvent, 'seq'> =>
    ({ type: 'action-start', actorId: 'seymour', command: {}, abilityId, targets: [] }) as Omit<BattleEvent, 'seq'>;
  const end = (): Omit<BattleEvent, 'seq'> => ({ type: 'action-end', actorId: 'seymour' }) as Omit<BattleEvent, 'seq'>;
  const defeat = (): Omit<BattleEvent, 'seq'> =>
    ({ type: 'defeat', result: { outcome: 'defeat' } }) as Omit<BattleEvent, 'seq'>;

  it('needs the ability to have resolved, not just started', () => {
    const rule = { kind: 'survived-ability', ability: 'total-annihilation' } as const;
    expect(evaluateObjective(rule, ctx(log(cast('total-annihilation'))))).toBe(false);
    expect(evaluateObjective(rule, ctx(log(cast('total-annihilation'), end())))).toBe(true);
  });

  it('is false when the party wiped to it', () => {
    const rule = { kind: 'survived-ability', ability: 'total-annihilation' } as const;
    expect(evaluateObjective(rule, ctx(log(cast('total-annihilation'), end(), defeat())))).toBe(false);
  });

  it('ignores a defeat that happened before the ability was cast', () => {
    // Not a real sequence — a defeat ends the battle — but it pins the window:
    // the rule looks forward from the cast, never backward.
    const rule = { kind: 'survived-ability', ability: 'mega-flare' } as const;
    expect(evaluateObjective(rule, ctx(log(defeat(), cast('mega-flare'), end())))).toBe(true);
  });

  /**
   * The suffix rule. `chapter-meta.ts` writes the move's plain name because
   * that is what the objective row says; the FFX-2 tables namespace it.
   */
  it('matches a namespaced engine id by its hyphenated suffix', () => {
    const rule = { kind: 'survived-ability', ability: 'mega-flare' } as const;
    expect(evaluateObjective(rule, ctx(log(cast('x2-bahamut-mega-flare'), end())))).toBe(true);
  });

  /**
   * The guard is against an accidental substring, not against a loosely named
   * objective: `'flare'` is a hyphen-delimited suffix of `'mega-flare'` and
   * does match, but it is not one of `'megaflare'` and does not.
   */
  it('does not match a substring that is not hyphen-delimited', () => {
    const rule = { kind: 'survived-ability', ability: 'flare' } as const;
    expect(evaluateObjective(rule, ctx(log(cast('megaflare'), end())))).toBe(false);
    expect(evaluateObjective(rule, ctx(log(cast('mega-flare'), end())))).toBe(true);
  });

  it('does not match a different move', () => {
    const rule = { kind: 'survived-ability', ability: 'total-annihilation' } as const;
    expect(evaluateObjective(rule, ctx(log(cast('x2-bahamut-mega-flare'), end())))).toBe(false);
  });
});

describe('evaluateObjective — form-reached', () => {
  const form = (formIndex: number): Omit<BattleEvent, 'seq'> =>
    ({ type: 'form-change', enemyId: 'yunalesca', formIndex, name: 'Yunalesca' }) as Omit<BattleEvent, 'seq'>;

  /** `formIndex` is 0-based; the copy counts forms the way a player does. */
  it('treats Form III as formIndex 2', () => {
    const rule = { kind: 'form-reached', form: 3 } as const;
    expect(evaluateObjective(rule, ctx(log(form(1))))).toBe(false);
    expect(evaluateObjective(rule, ctx(log(form(1), form(2))))).toBe(true);
  });

  it('is satisfied by overshooting the form', () => {
    expect(evaluateObjective({ kind: 'form-reached', form: 2 }, ctx(log(form(3))))).toBe(true);
  });
});

describe('evaluateObjective — boss-hp-below', () => {
  it('reads the largest enemy on the field, not the first', () => {
    // A formation is a boss plus furniture; the rule means the boss.
    const state = stateWith([
      { id: 'yu-pagoda-left', hp: 1, maxHp: 4000 },
      { id: 'braskas-final-aeon', hp: 30_000, maxHp: 60_000 },
    ]);
    expect(evaluateObjective({ kind: 'boss-hp-below', fraction: 0.5 }, ctx([], { state }))).toBe(true);
    expect(evaluateObjective({ kind: 'boss-hp-below', fraction: 0.25 }, ctx([], { state }))).toBe(false);
  });

  it('skips removed combatants', () => {
    const state = stateWith([
      { id: 'huge-but-gone', hp: 0, maxHp: 99_999, removed: true },
      { id: 'boss', hp: 900, maxHp: 1000 },
    ]);
    expect(evaluateObjective({ kind: 'boss-hp-below', fraction: 0.5 }, ctx([], { state }))).toBe(false);
  });

  it('is false with no battle', () => {
    expect(evaluateObjective({ kind: 'boss-hp-below', fraction: 0.9 }, ctx([]))).toBe(false);
  });
});

describe('evaluateObjective — link-reached', () => {
  it('reads the screen’s chain position, not anything on the log', () => {
    const rule = { kind: 'link-reached', link: 4 } as const;
    expect(evaluateObjective(rule, ctx([], { links: 3 }))).toBe(false);
    expect(evaluateObjective(rule, ctx([], { links: 4 }))).toBe(true);
    expect(evaluateObjective(rule, ctx([], { links: 5 }))).toBe(true);
  });
});

describe('evaluateObjective — parts-downed', () => {
  const rule = { kind: 'parts-downed', targetIds: ['yu-pagoda-left', 'yu-pagoda-right'] } as const;
  const ko = (targetId: string): Omit<BattleEvent, 'seq'> => ({ type: 'ko', targetId }) as Omit<BattleEvent, 'seq'>;
  const revive = (targetId: string): Omit<BattleEvent, 'seq'> =>
    ({ type: 'revive', targetId, hp: 1, cause: 'life' }) as Omit<BattleEvent, 'seq'>;
  const destroyed = (partId: string): Omit<BattleEvent, 'seq'> =>
    ({ type: 'part-destroyed', partId }) as Omit<BattleEvent, 'seq'>;
  const restored = (partId: string): Omit<BattleEvent, 'seq'> =>
    ({ type: 'part-restored', partId, hp: 4000 }) as Omit<BattleEvent, 'seq'>;

  it('needs both down at the same time', () => {
    // One, then the other comes back before the second goes down: the pair was
    // never down together, which is the whole point of the objective.
    expect(evaluateObjective(rule, ctx(log(ko('yu-pagoda-left'), revive('yu-pagoda-left'), ko('yu-pagoda-right'))))).toBe(
      false,
    );
  });

  it('is satisfied the moment the second one falls', () => {
    expect(evaluateObjective(rule, ctx(log(ko('yu-pagoda-left'), ko('yu-pagoda-right'))))).toBe(true);
  });

  it('stays satisfied after one is restored', () => {
    // A checklist records what happened; it does not un-tick itself.
    expect(
      evaluateObjective(rule, ctx(log(ko('yu-pagoda-left'), ko('yu-pagoda-right'), revive('yu-pagoda-left')))),
    ).toBe(true);
  });

  it('accepts part-destroyed as well as ko, and undoes on part-restored', () => {
    expect(evaluateObjective(rule, ctx(log(destroyed('yu-pagoda-left'), destroyed('yu-pagoda-right'))))).toBe(true);
    expect(
      evaluateObjective(
        rule,
        ctx(log(destroyed('yu-pagoda-left'), restored('yu-pagoda-left'), destroyed('yu-pagoda-right'))),
      ),
    ).toBe(false);
  });

  it('is false for an empty target list', () => {
    expect(evaluateObjective({ kind: 'parts-downed', targetIds: [] }, ctx(log(ko('anything'))))).toBe(false);
  });
});

describe('evaluateObjective — chain-landed', () => {
  const chain = (count: number): Omit<BattleEvent, 'seq'> =>
    ({ type: 'chain', targetId: 'ffx2-bahamut', count, multiplier: 1.4 + 0.05 * count }) as Omit<BattleEvent, 'seq'>;

  it('needs the counter to reach the target', () => {
    const rule = { kind: 'chain-landed', count: 5 } as const;
    expect(evaluateObjective(rule, ctx(log(chain(1), chain(2), chain(0))))).toBe(false);
    expect(evaluateObjective(rule, ctx(log(chain(4), chain(5))))).toBe(true);
  });

  /** `chain-landed` and `link-reached` are unrelated despite the similar name. */
  it('is not satisfied by the chapter’s chain position', () => {
    expect(evaluateObjective({ kind: 'chain-landed', count: 5 }, ctx([], { links: 5 }))).toBe(false);
  });
});

describe('the five shipped chapters', () => {
  it('start with nothing ticked', () => {
    for (const meta of CHAPTER_META) {
      expect(objectivesCleared(meta, ctx([]))).toBe(0);
    }
  });

  it('returns a row per objective, in the order the data lists them', () => {
    const meta = CHAPTER_META[0]!;
    const rows = evaluateObjectives(meta.objectives, ctx([]));
    expect(rows.map((r) => r.id)).toEqual(meta.objectives.map((o) => o.id));
    expect(rows.map((r) => r.label)).toEqual(meta.objectives.map((o) => o.label));
  });

  /**
   * The regression that matters: FFX-2's ability ids are namespaced
   * (`x2-bahamut-mega-flare`) and chapter-meta writes the bare name. If the
   * suffix match is ever tightened to an exact match, this goes red.
   */
  it('ticks FFX-2 Bahamut’s objectives from the ids that chapter’s tables emit', () => {
    const meta = getChapterMeta('ffx2-bahamut')!;
    const events = log(
      { type: 'action-start', actorId: 'ffx2-bahamut', command: {}, abilityId: 'x2-bahamut-mega-flare', targets: [] },
      { type: 'action-end', actorId: 'ffx2-bahamut' },
      { type: 'chain', targetId: 'ffx2-bahamut', count: 5, multiplier: 1.65 },
      { type: 'victory', result: { outcome: 'victory' } },
    );
    expect(evaluateObjectives(meta.objectives, ctx(events)).map((r) => r.done)).toEqual([true, true, true]);
  });

  it('ticks Seymour Flux’s objectives from bare FFX ids', () => {
    const meta = getChapterMeta('seymour-flux')!;
    const events = log(
      { type: 'status-remove', targetId: 'tidus', status: 'zombie' as StatusId, reason: 'cured' },
      { type: 'action-start', actorId: 'seymour-flux', command: {}, abilityId: 'total-annihilation', targets: [] },
      { type: 'action-end', actorId: 'seymour-flux' },
      { type: 'victory', result: { outcome: 'victory' } },
    );
    expect(evaluateObjectives(meta.objectives, ctx(events)).map((r) => r.done)).toEqual([true, true, true]);
  });

  it('ticks Vegnagun’s chain objective from the screen’s link count', () => {
    const meta = getChapterMeta('ffx2-vegnagun-shuyin')!;
    const rows = evaluateObjectives(meta.objectives, ctx([], { links: 4 }));
    expect(rows[0]?.done).toBe(true);
  });
});

describe('encounterProgress', () => {
  it('counts links for a chained chapter', () => {
    const p = encounterProgress(ctx([], { links: 2 }), { chainLength: 4 });
    expect(p).toMatchObject({ label: 'LINK 2 OF 4', value: 2, total: 4 });
    expect(p?.ratio).toBeCloseTo(0.5);
  });

  it('clamps a link count past the end of the chain', () => {
    expect(encounterProgress(ctx([], { links: 9 }), { chainLength: 4 })?.label).toBe('LINK 4 OF 4');
  });

  it('counts forms when the chapter has them instead', () => {
    const events = log({
      type: 'form-change',
      enemyId: 'yunalesca',
      formIndex: 2,
      name: 'Yunalesca',
    } as Omit<BattleEvent, 'seq'>);
    expect(encounterProgress(ctx(events))?.label).toBe('FORM 3');
  });

  it('falls back to the boss’s remaining HP', () => {
    const state = stateWith([{ id: 'seymour-flux', hp: 6000, maxHp: 24_000 }]);
    expect(encounterProgress(ctx([], { state }))?.label).toBe('BOSS HP 25%');
  });

  it('is null with nothing to report', () => {
    expect(encounterProgress(ctx([]))).toBeNull();
  });
});

describe('formatPlayTime', () => {
  it.each([
    [0, '0:00'],
    [999, '0:00'],
    [1000, '0:01'],
    [61_000, '1:01'],
    [600_000, '10:00'],
    [3_600_000, '1:00:00'],
    [3_723_000, '1:02:03'],
  ])('%i ms reads as %s', (ms, expected) => {
    expect(formatPlayTime(ms)).toBe(expected);
  });

  it('never prints a negative clock', () => {
    expect(formatPlayTime(-5000)).toBe('0:00');
  });
});
