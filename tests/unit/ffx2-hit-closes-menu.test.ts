/**
 * **An enemy hit closes an open FFX-2 command menu** (decision sheet 2026-09-25 item 4, A1;
 * `research/ffx2-combat-core.md` §1.1 and §1.5, single source). **FFX-2 only** (AGENTS.md rule 14).
 * Plan: `docs/plans/ffx2-hit-closes-menu-review.md`. Proven on the real engine (rule 3): Chapter
 * IV's Bahamut against the Bevelle build, the clock run under an open menu until something lands.
 * No delay is applied (A2 is unsourced): she is offered a fresh menu at once.
 */

import { describe, expect, it } from 'vitest';
import type { BattleEvent, CombatantId, Command, Decision } from '../../src/battle/common/types.ts';
import { FFX2Engine } from '../../src/battle/ffx2/index.ts';
import { closesOpenMenu } from '../../src/battle/ffx2/active.ts';
import type { EventDraft, Ffx2EngineOptions, Ffx2Unit } from '../../src/battle/ffx2/internal.ts';
import * as data from '../../src/data/ffx2/index.ts';
import { bevelleBuild } from '../../src/data/ffx2/builds/bevelle.ts';
import { driveChapter4, driveChapter5, driveChapter6, ffx2Options, logHash } from './helpers/ffx2ChapterDrive.ts';

type Input = Extract<Decision, { kind: 'player-input' }>;

function engineAt(seed: number, extra: Partial<Ffx2EngineOptions>): { engine: FFX2Engine; menu: Input } {
  const engine = new FFX2Engine(ffx2Options(extra));
  const group = data.ENEMY_GROUPS_BY_ID['ffx2-bahamut'];
  if (!group) throw new Error('ffx2-bahamut missing');
  engine.setSeed(seed);
  engine.init({ game: 'ffx2', party: bevelleBuild, enemies: group, triggers: [], seed, condition: 'normal', canEscape: false });
  for (let i = 0; i < 1000; i++) {
    const d = engine.nextDecision();
    if (d.kind === 'player-input') return { engine, menu: d };
    if (d.kind === 'waiting') engine.tick(d.nextEventMs);
    if (d.kind === 'battle-over') break;
  }
  throw new Error('no menu opened');
}

const isEnemyHitOn = (engine: FFX2Engine, owner: CombatantId) => (e: BattleEvent): boolean =>
  e.type === 'damage' && e.targetId === owner && e.amount > 0 && !!e.sourceId && engine.state().enemyIds.includes(e.sourceId);

/** Run the clock under the open menu in 100 ms steps until it closes or `ms` pass; returns what landed. */
function runUnderMenu(engine: FFX2Engine, owner: CombatantId, ms: number, top?: boolean): { events: BattleEvent[]; closed: boolean } {
  const events: BattleEvent[] = [];
  for (let t = 0; t < ms; t += 100) {
    if (top) engine.setMenuLevel('top');
    events.push(...engine.tick(100, { throughInput: true }));
    if (!engine.inputValid(owner)) return { events, closed: true };
  }
  return { events, closed: false };
}

/** The first seed whose opening menu an enemy hit closes, the owner still standing. */
function closedByHit(extra: Partial<Ffx2EngineOptions>, top?: boolean) {
  for (let seed = 1; seed <= 30; seed++) {
    const { engine, menu } = engineAt(seed, extra);
    const run = runUnderMenu(engine, menu.actorId, 60_000, top);
    const owner = engine.state().combatants[menu.actorId];
    if (run.closed && owner && owner.hp > 0 && run.events.some(isEnemyHitOn(engine, menu.actorId))) {
      return { seed, engine, menu, run };
    }
  }
  throw new Error('no seed in 1-30 closed a menu by a hit');
}

describe('item 4 A1: an enemy hit closes the open menu (FFX-2 only)', () => {
  it('Active: the hit closes it, and she is offered a fresh menu at once (no delay: A2 is not built)', () => {
    const { engine, menu } = closedByHit({ atbMode: 'active' });
    expect(engine.inputValid(menu.actorId)).toBe(false);
    const again = engine.nextDecision();
    expect(again.kind).toBe('player-input');
    if (again.kind !== 'player-input') return;
    expect(again.actorId).toBe(menu.actorId); // still ready: her bar was not touched
    expect(engine.inputValid(again.actorId)).toBe(true);
  });

  it('Active: a confirm that races the hit is refused and spends nothing', () => {
    const { engine, menu } = closedByHit({ atbMode: 'active' });
    const row = menu.commands.find((c) => c.enabled && c.validTargets.length > 0)!;
    const logBefore = engine.state().log.length;
    expect(engine.submit({ ...row.command, targets: [row.validTargets[0]!] } as Command)).toEqual([]);
    expect(engine.state().log.length).toBe(logBefore);
    expect(engine.nextDecision().kind).toBe('player-input');
  });

  it('Wait split at the top-level list: the same close; the fresh menu starts held until the HUD reports its top list', () => {
    const { engine, menu } = closedByHit({ atbMode: 'wait', waitSplit: true }, true);
    expect(engine.inputValid(menu.actorId)).toBe(false);
    const again = engine.nextDecision();
    expect(again.kind).toBe('player-input');
    expect(engine.menuLevel()).toBe('deep');
    expect(engine.clockHeld()).toBe(true);
    if (again.kind === 'player-input') expect(engine.inputValid(again.actorId)).toBe(true);
  });

  it('Wait split below the top list and the whole-menu hold: the clock is held, nothing lands, the menu stays', () => {
    for (const extra of [{ atbMode: 'wait', waitSplit: true }, { atbMode: 'wait', waitSplit: false }] as const) {
      const { engine, menu } = engineAt(1, extra);
      engine.setMenuLevel('deep');
      const run = runUnderMenu(engine, menu.actorId, 20_000);
      expect(run.events).toEqual([]);
      expect(run.closed).toBe(false);
    }
  });

  it('a hit on another girl leaves the owner\'s menu open', () => {
    let seen = false;
    for (let seed = 1; seed <= 30 && !seen; seed++) {
      const { engine, menu } = engineAt(seed, { atbMode: 'active' });
      for (let t = 0; t < 60_000; t += 100) {
        const events = engine.tick(100, { throughInput: true });
        const valid = engine.inputValid(menu.actorId);
        const others = events.some((e) => e.type === 'damage' && e.targetId !== menu.actorId && e.amount > 0
          && !!e.sourceId && engine.state().enemyIds.includes(e.sourceId));
        const onOwner = events.some(isEnemyHitOn(engine, menu.actorId));
        if (others && !onOwner && engine.state().combatants[menu.actorId]!.hp > 0 && !engine.state().result) {
          expect(valid).toBe(true);
          seen = true;
          break;
        }
        if (!valid) break;
      }
    }
    expect(seen).toBe(true);
  });
});

describe('closesOpenMenu: what counts as a hit (our reading, preflight §3)', () => {
  const units = [
    { id: 'yuna', side: 'party' },
    { id: 'rikku', side: 'party' },
    { id: 'boss', side: 'enemy' },
  ] as unknown as Ffx2Unit[];
  const hit = (over: Partial<Extract<EventDraft, { type: 'damage' }>>): EventDraft =>
    ({ type: 'damage', targetId: 'yuna', sourceId: 'boss', amount: 100, element: 'none', crit: false, hitIndex: 0, hitCount: 1, ...over }) as EventDraft;

  it('an enemy blow that deals damage to the owner closes her menu', () => {
    expect(closesOpenMenu(hit({}), 'yuna', units)).toBe(true);
  });
  it('an immune or absorbed blow, a status tick, her own HP cost, an ally\'s blow and a blow on someone else do not', () => {
    expect(closesOpenMenu(hit({ amount: 0 }), 'yuna', units)).toBe(false);
    expect(closesOpenMenu(hit({ amount: -50 }), 'yuna', units)).toBe(false);
    expect(closesOpenMenu(hit({ sourceId: undefined }), 'yuna', units)).toBe(false);
    expect(closesOpenMenu(hit({ sourceId: 'rikku' }), 'yuna', units)).toBe(false);
    expect(closesOpenMenu(hit({ targetId: 'rikku' }), 'yuna', units)).toBe(false);
    expect(closesOpenMenu({ type: 'miss', targetId: 'yuna', sourceId: 'boss' } as unknown as EventDraft, 'yuna', units)).toBe(false);
  });
});

describe('zero decision time is untouched (every golden and D = 0 bench)', () => {
  // Pinned from the build before this change: the 40-seed bench's D = 0 aggregate hashes were
  // identical before and after (preflight §7), so these per-seed hashes are the pre-change logs.
  const PINNED = [
    ['373c0af61dfb8aae', 'd0e49a7271c07e2b', '802486af811c9d6b'],
    ['f5874befbb32bca2', '3d936ba1a11afdd9', '6e4e0fb5790b3f6a'],
    ['0aadde1f8d3aff80', '995cb5ec3f5834e0', '67647d2cb3df6954'],
  ];
  it('Chapters IV, V and VI at D = 0 under the default Wait split replay byte for byte, no menu ever closed', () => {
    [driveChapter4, driveChapter5, driveChapter6].forEach((drive, c) => {
      for (let seed = 1; seed <= 3; seed++) {
        const r = drive(seed, 0, { atbMode: 'wait', waitSplit: true });
        expect(r.invalidated + r.refused).toBe(0);
        expect(logHash(r)).toBe(PINNED[c]![seed - 1]);
      }
    });
  }, 120_000);
});
