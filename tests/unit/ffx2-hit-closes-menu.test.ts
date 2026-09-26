/**
 * **A Delay or Action-cancel hit closes an open FFX-2 command menu; a plain hit leaves it open.**
 * **FFX-2 only** (AGENTS.md rule 14). Release 17 closed the menu on any enemy hit (decision sheet
 * 2026-09-25 item 4, A1; `research/ffx2-combat-core.md` §1.1 and §1.5; plan
 * `docs/plans/ffx2-hit-closes-menu-review.md`). §9.2 (commit `ea05f877`, `[verified: 2 sources]`,
 * Split_Infinity G1041 / G1042) corrects §1.1, and Bailey turned the correction on on 2026-09-26
 * ("I'll take all your recommendations"; `constants.ts` MENU_CANCEL_ONLY_DELAY_ABILITIES = true).
 *
 * **Re-pinned 2026-09-26 for that flip.** The three tests that asserted "an enemy hit closes the
 * menu" on Chapter IV's Bahamut (who carries no Delay ability, so under the corrected rule none of
 * his hits closes it) now find the close in Chapter VI, where Ormi's Supercollider and Huggles and
 * Leblanc's Mach Fan carry Delay (`research/ffx2-leblanc-syndicate.md` §4), and a new test pins that
 * Bahamut's plain hit leaves the menu open. What happens after a close is unchanged: no delay is
 * applied (A2 is unsourced), she is offered a fresh menu at once, and a racing confirm is refused.
 * Proven on the real engine (rule 3). The switch's own tests are in `ffx2-menu-cancel-delay.test.ts`.
 */

import { describe, expect, it } from 'vitest';
import type { AbilityDef, BattleEvent, CombatantId, Command, Decision, FFX2Combatant, FFX2PartyBuild } from '../../src/battle/common/types.ts';
import { FFX2Engine, defaultAbilities } from '../../src/battle/ffx2/index.ts';
import { closesOpenMenu } from '../../src/battle/ffx2/active.ts';
import { isActionLocked } from '../../src/battle/ffx2/chain.ts';
import { ActingAbilities, carriesMenuCancel } from '../../src/battle/ffx2/menu-cancel.ts';
import type { EventDraft, Ffx2EngineOptions, Ffx2Unit } from '../../src/battle/ffx2/internal.ts';
import * as data from '../../src/data/ffx2/index.ts';
import { bevelleBuild } from '../../src/data/ffx2/builds/bevelle.ts';
import { chateauBuild } from '../../src/data/ffx2/builds/chateau.ts';
import { LEBLANC_CHAIN_ORDER } from '../../src/data/ffx2/enemies/leblanc-syndicate.ts';
import { driveChapter4, driveChapter5, driveChapter6, ffx2Options, logHash } from './helpers/ffx2ChapterDrive.ts';

type Input = Extract<Decision, { kind: 'player-input' }>;

const abilityOf = (id: string | undefined): AbilityDef | undefined =>
  id === undefined ? undefined : ((data.ABILITIES as Record<string, AbilityDef>)[id] ?? defaultAbilities.get(id));

function engineAt(seed: number, extra: Partial<Ffx2EngineOptions>, groupId = 'ffx2-bahamut', party: FFX2PartyBuild = bevelleBuild): { engine: FFX2Engine; menu: Input } {
  const engine = new FFX2Engine(ffx2Options(extra));
  const group = data.ENEMY_GROUPS_BY_ID[groupId];
  if (!group) throw new Error(`${groupId} missing`);
  engine.setSeed(seed);
  engine.init({ game: 'ffx2', party, enemies: group, triggers: [], seed, condition: 'normal', canEscape: false });
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

/** One 100 ms step's enemy hits on the owner: the abilities behind them, and whether a status or KO also landed on her. */
interface Step { hitAbilities: Array<string | undefined>; statused: boolean }

/**
 * Run the clock under the open menu in 100 ms steps until it closes or `ms` pass; returns what
 * landed, and the last step's hits on the owner with the ability behind each (`ActingAbilities`).
 */
function runUnderMenu(engine: FFX2Engine, owner: CombatantId, ms: number, top?: boolean): { events: BattleEvent[]; closed: boolean; last: Step; plainHits: number } {
  const events: BattleEvent[] = [];
  const acting = new ActingAbilities();
  let last: Step = { hitAbilities: [], statused: false };
  let plainHits = 0;
  for (let t = 0; t < ms && !engine.state().result; t += 100) {
    if (top) engine.setMenuLevel('top');
    const here = engine.tick(100, { throughInput: true });
    events.push(...here);
    last = { hitAbilities: [], statused: false };
    for (const e of here) {
      acting.note(e as never);
      if (isEnemyHitOn(engine, owner)(e) && e.type === 'damage') last.hitAbilities.push(acting.current(e.sourceId));
      if ((e.type === 'status-add' || e.type === 'ko') && e.targetId === owner) last.statused = true;
    }
    if (!engine.inputValid(owner)) return { events, closed: true, last, plainHits };
    plainHits += last.hitAbilities.filter((a) => !carriesMenuCancel(abilityOf(a))).length;
  }
  return { events, closed: false, last, plainHits };
}

/**
 * The first Chapter VI formation and seed whose opening menu is closed by a Delay hit (Supercollider,
 * Huggles or Mach Fan) landing on the owner, she still standing and no status landing with it.
 */
function closedByDelayHit(extra: Partial<Ffx2EngineOptions>, top?: boolean) {
  for (const groupId of LEBLANC_CHAIN_ORDER) {
    for (let seed = 1; seed <= 40; seed++) {
      const { engine, menu } = engineAt(seed, extra, groupId, chateauBuild);
      const run = runUnderMenu(engine, menu.actorId, 60_000, top);
      const owner = engine.state().combatants[menu.actorId];
      if (run.closed && owner && owner.hp > 0 && !engine.state().result && !run.last.statused
        && run.last.hitAbilities.some((a) => carriesMenuCancel(abilityOf(a)))) {
        return { seed, engine, menu, run };
      }
    }
  }
  throw new Error('no Chapter VI formation and seed in 1-40 closed a menu by a Delay hit');
}

describe('the menu-cancel correction: a Delay hit closes the open menu, a plain hit does not (FFX-2 only)', () => {
  it('Active: Bahamut\'s plain hits land on the owner and her menu stays open (release 17 closed it)', () => {
    let plain = 0;
    for (let seed = 1; seed <= 5; seed++) {
      const { engine, menu } = engineAt(seed, { atbMode: 'active' });
      const run = runUnderMenu(engine, menu.actorId, 20_000);
      plain += run.plainHits;
      if (run.closed) expect(run.last.statused || run.last.hitAbilities.length === 0, `seed ${seed}: ${run.last.hitAbilities.join(', ')}`).toBe(true);
    }
    expect(plain, 'no plain Bahamut hit landed under an open menu').toBeGreaterThan(0);
  });

  it('Active: the Delay hit closes it, and she is offered a fresh menu at once (no delay: A2 is not built)', () => {
    const { engine, menu } = closedByDelayHit({ atbMode: 'active' });
    expect(engine.inputValid(menu.actorId)).toBe(false);
    const again = engine.nextDecision();
    expect(again.kind).toBe('player-input');
    if (again.kind !== 'player-input') return;
    expect(again.actorId).toBe(menu.actorId); // still ready: her bar was not touched
    expect(engine.inputValid(again.actorId)).toBe(true);
  });

  it('Active: a confirm that races the Delay hit is refused and spends nothing', () => {
    const { engine, menu } = closedByDelayHit({ atbMode: 'active' });
    const row = menu.commands.find((c) => c.enabled && c.validTargets.length > 0)!;
    const logBefore = engine.state().log.length;
    expect(engine.submit({ ...row.command, targets: [row.validTargets[0]!] } as Command)).toEqual([]);
    expect(engine.state().log.length).toBe(logBefore);
    expect(isActionLocked(engine.state().combatants[menu.actorId] as FFX2Combatant), 'the Delay hit staggered her').toBe(true);
    // Her menu comes back and her turn was not spent. Unlike Bahamut's blow in release 17's version
    // of this test, the Delay hit here staggers her (it opens her chain window, §1.7), and once the
    // refusal has let go of her menu a staggered girl waits for the window to lift (at most 3 s)
    // before she is offered one again; no action of hers resolves in between.
    let again = engine.nextDecision();
    for (let i = 0; i < 200 && again.kind !== 'player-input'; i++) {
      if (again.kind === 'waiting') engine.tick(Math.min(100, again.nextEventMs), { throughInput: true });
      again = engine.nextDecision();
    }
    expect(again.kind).toBe('player-input');
    const hers = engine.state().log.slice(logBefore).filter((e) => e.type === 'action-start' && e.actorId === menu.actorId);
    expect(hers).toEqual([]);
  });

  it('Wait split at the top-level list: the same close by a Delay hit; the fresh menu starts held until the HUD reports its top list', () => {
    const { engine, menu } = closedByDelayHit({ atbMode: 'wait', waitSplit: true }, true);
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

  it('an enemy blow that deals damage to the owner closes her menu (the rule before the ability check)', () => {
    expect(closesOpenMenu(hit({}), 'yuna', units)).toBe(true);
  });
  it('with the ability check the engine passes (the switch on): only a Delay or Action-cancel ability closes it', () => {
    const mega = abilityOf('mega-flare') ?? abilityOf('attack');
    expect(closesOpenMenu(hit({}), 'yuna', units, { ability: mega })).toBe(false);
    expect(closesOpenMenu(hit({}), 'yuna', units, { ability: undefined })).toBe(false);
    for (const id of ['x2-ormi-supercollider', 'x2-ormi-huggles', 'x2-leblanc-mach-fan']) {
      expect(closesOpenMenu(hit({}), 'yuna', units, { ability: abilityOf(id) }), id).toBe(true);
      expect(closesOpenMenu(hit({ amount: 0 }), 'yuna', units, { ability: abilityOf(id) }), `${id} immune`).toBe(false);
    }
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
    // Chapter V all three and Chapter VI seed 3 re-pinned 2026-09-26 for IC-2 (a target KO'd inside an
    // all-target action is skipped, not wrapped) and Acta Est Fabula's target (the Redoubts only);
    // `ffx2-atb-golden.test.ts` has the measurement. Old hashes in git at ea05f877.
    ['7a91c483c3dd8d2c', '054c5f01b9f23ffe', '678d9b991119fa5a'],
    ['0aadde1f8d3aff80', '995cb5ec3f5834e0', 'd86662749c9fb7e1'],
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
