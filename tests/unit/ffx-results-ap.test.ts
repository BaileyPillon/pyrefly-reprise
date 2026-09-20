/**
 * FFX post-battle AP/Sphere-Level eligibility — `src/battle/ffx/results.ts`'s
 * `sphereLevels` and, downstream, `src/ui/common/resultsMath.ts`'s
 * `buildMemberRows` (see that file's own doc comment for its half).
 *
 * Round 03 gate major: "Chapter 1 results credit a member who left the
 * active party with AP but no level" ("S.LV 25 - 10,000/442 AP", no S.Lv
 * badge). `results.ts` computed `sphereLevelsGained` over `ctx.state.activeIds`
 * — whoever is standing in an active slot when the battle *ends* — while
 * `resultsMath.ts` listed rows from `build.activeSlots` — whoever started the
 * battle there. Neither is the sourced rule, and they disagree with each
 * other: a member switched out *after* already taking a turn earlier in the
 * fight is dropped from `activeIds` and so from `sphereLevelsGained`, even
 * though the research says they earned AP — but `resultsMath` still lists
 * them (they are in the pre-battle `activeSlots`) with the flat AP award and
 * no level, which is exactly the observed bug. A member switched *in* who
 * levels up is the opposite failure: present in `sphereLevelsGained`,
 * missing from `resultsMath`'s pre-battle row list entirely.
 *
 * ffx-combat-core.md §10.1/AP: "Every party member who took at least one full
 * turn earns AP at the end of a battle. Characters switched out during their
 * first turn, KO'd, or petrified at the end earn nothing." This file drives
 * the real engine through exactly that shape and reads `buildBattleResult`'s
 * own `sphereLevelsGained`, never a hand-built fixture, for the case that
 * actually separates the two candidate rules: a member switched out only
 * AFTER completing a turn earlier in the fight, so they are gone from
 * `ctx.state.activeIds` at the end but still eligible under the sourced rule.
 *
 * **Case: FFX only.** The switch/reserve roster this bug is about is an FFX
 * mechanic (§10.1); FFX-2's results screen is one screen of EXP, gil and
 * items with no chained-roster concept, and the last test here proves it is
 * untouched by asserting `buildMemberRows` still reads `result.levelsGained`
 * against `build.members` for an FFX-2 chapter.
 */

import { describe, expect, it } from 'vitest';
import type { BattleResult, Command, Decision } from '../../src/battle/common/types.ts';
import { FFXContentRegistry, createFFXEngine } from '../../src/battle/ffx/index.ts';
import { ability, enemy, member, party, setup, stats } from './ffx-fixtures.test.ts';
import { buildMemberRows } from '../../src/ui/common/resultsMath.ts';
import { getChapter } from '../../src/data/encounters.ts';
import { gagazetBuild } from '../../src/data/ffx/builds/gagazet.ts';
import { ALL_ABILITIES, ENEMY_GROUPS_BY_ID, ITEMS } from '../../src/data/ffx/index.ts';
import { intendedStrategy } from '../../src/engine/BattlePresenterStrategies.ts';

type PlayerInput = Extract<Decision, { kind: 'player-input' }>;

/** A guaranteed 50-damage hit, no variance, no defence — deterministic maths for this file. */
function fixedAttack(): ReturnType<typeof ability> {
  return ability({
    id: 'attack',
    name: 'Attack',
    category: 'attack',
    power: 1,
    formula: 'fixed-no-variance',
    damageType: 'other',
    targeting: 'single-enemy',
    canMiss: false,
  });
}

function content(): FFXContentRegistry {
  const reg = new FFXContentRegistry();
  reg.addAbilities([fixedAttack()]);
  return reg;
}

/** Drive to the next player-input decision, or `null` once the battle is over. */
function driveToInput(engine: ReturnType<typeof createFFXEngine>): PlayerInput | null {
  for (let i = 0; i < 200; i++) {
    const d = engine.nextDecision();
    if (d.kind === 'battle-over') return null;
    if (d.kind === 'player-input') return d;
    // 'resolved': an enemy or a follow-up resolved on its own — keep advancing.
  }
  throw new Error('no player-input decision arrived in 200 steps');
}

function attackCommand(d: PlayerInput): Command {
  const row = d.commands.find((c) => c.command.kind === 'attack' && c.enabled);
  const target = row?.validTargets[0];
  if (!target) throw new Error(`${d.actorId} has no legal attack target`);
  return { kind: 'attack', targets: [target] };
}

/** tidus/yuna/auron active, kimahri reserve; a 200 HP dummy that eats 50 per fixed hit. */
function chapterOneShapedSetup() {
  return setup({
    party: party({
      members: [
        member({ id: 'tidus' }),
        member({ id: 'yuna' }),
        member({ id: 'auron' }),
        member({ id: 'kimahri' }),
      ],
      activeSlots: ['tidus', 'yuna', 'auron'],
      reserve: ['kimahri'],
    }),
    enemies: {
      id: 'g',
      game: 'ffx',
      enemies: [
        enemy({
          id: 'dummy',
          stats: stats({ hp: 200, maxHp: 200 }),
          rewards: { ap: 100, apOverkill: 100, gil: 0, overkillThreshold: 1000, drops: [] },
        }),
      ],
    },
  });
}

/**
 * tidus, yuna and auron each take one turn; on tidus's SECOND turn he is
 * switched out for kimahri, who lands the finishing blow. At the end: active
 * = [kimahri, yuna, auron], reserve = [tidus] — tidus already banked a full
 * turn (turn 1) before leaving, so §10.1 says he still earns this battle's AP,
 * even though he is not among `ctx.state.activeIds` any more.
 */
function runSwitchedAfterActingScenario(): BattleResult {
  const engine = createFFXEngine({ content: content() });
  engine.init(chapterOneShapedSetup());

  let d = driveToInput(engine);
  if (!d || d.actorId !== 'tidus') throw new Error(`expected tidus first, got ${d?.actorId}`);
  engine.submit(attackCommand(d)); // hp 200 -> 150, tidus.turnsTaken = 1

  d = driveToInput(engine);
  if (!d || d.actorId !== 'yuna') throw new Error(`expected yuna second, got ${d?.actorId}`);
  engine.submit(attackCommand(d)); // hp 150 -> 100

  d = driveToInput(engine);
  if (!d || d.actorId !== 'auron') throw new Error(`expected auron third, got ${d?.actorId}`);
  engine.submit(attackCommand(d)); // hp 100 -> 50

  d = driveToInput(engine);
  if (!d || d.actorId !== 'tidus') throw new Error(`expected tidus's second turn fourth, got ${d?.actorId}`);
  engine.submit({ kind: 'switch', targets: [], extra: { outId: 'tidus', inId: 'kimahri' } });

  d = driveToInput(engine);
  if (!d || d.actorId !== 'kimahri') throw new Error(`expected kimahri to take the handed-off turn, got ${d?.actorId}`);
  engine.submit(attackCommand(d)); // hp 50 -> 0, victory

  const after = driveToInput(engine);
  if (after) throw new Error('expected the battle to be over');

  const result = engine.state().result;
  if (!result) throw new Error('battle ended with no result attached');
  return result;
}

describe('AP/Sphere-Level eligibility follows who actually took a turn, not who ends the battle active', () => {
  it('keeps tidus eligible: he took a turn before leaving, even though he is benched at the end', () => {
    const result = runSwitchedAfterActingScenario();
    const state = { activeIds: ['kimahri', 'yuna', 'auron'], reserveIds: ['tidus'] };
    // Sanity on the scenario shape itself, independent of the fix.
    expect(result.outcome).toBe('victory');

    // The bug: `sphereLevels` used to key this off `ctx.state.activeIds`
    // (kimahri/yuna/auron at the end), silently dropping tidus even though
    // his turn-1 attack already banked him a full turn.
    expect(result.sphereLevelsGained['tidus']).toBeDefined();
    expect(result.sphereLevelsGained['yuna']).toBeDefined();
    expect(result.sphereLevelsGained['auron']).toBeDefined();
    expect(result.sphereLevelsGained['kimahri']).toBeDefined();
    void state; // documents the post-battle roster this scenario produces
  });

  it('resultsMath renders exactly that eligible set — the benched-but-acted tidus keeps his row', () => {
    const result = runSwitchedAfterActingScenario();
    const chapter = getChapter('seymour-flux');
    const rows = buildMemberRows(chapter, result);
    const ids = rows.map((r) => r.id);

    expect(ids).toEqual(expect.arrayContaining(['tidus', 'yuna', 'auron', 'kimahri']));
    // Every row shown carries a real S.Lv line, never a bare AP number with
    // nothing behind it — the shape of the reported bug.
    for (const row of rows) expect(row.detail).toMatch(/^S\.LV \d+/);
  });

  it('a member switched out on their very first turn earns nothing and gets no row at all', () => {
    const engine = createFFXEngine({ content: content() });
    engine.init(chapterOneShapedSetup());

    let d = driveToInput(engine);
    if (!d || d.actorId !== 'tidus') throw new Error(`expected tidus first, got ${d?.actorId}`);
    engine.submit(attackCommand(d)); // hp 200 -> 150

    d = driveToInput(engine);
    if (!d || d.actorId !== 'yuna') throw new Error(`expected yuna second, got ${d?.actorId}`);
    engine.submit(attackCommand(d)); // hp 150 -> 100

    // auron is switched out on his very first turn — he never completes one.
    d = driveToInput(engine);
    if (!d || d.actorId !== 'auron') throw new Error(`expected auron third, got ${d?.actorId}`);
    engine.submit({ kind: 'switch', targets: [], extra: { outId: 'auron', inId: 'kimahri' } });

    let result: BattleResult | null = null;
    for (let i = 0; i < 20 && !result; i++) {
      const next = driveToInput(engine);
      if (!next) {
        result = engine.state().result ?? null;
        break;
      }
      engine.submit(attackCommand(next));
    }
    if (!result) throw new Error('battle never finished');

    expect(result.sphereLevelsGained['auron']).toBeUndefined();
    const chapter = getChapter('seymour-flux');
    const rows = buildMemberRows(chapter, result);
    expect(rows.find((r) => r.id === 'auron')).toBeUndefined();
  });

  it('FFX-2 is untouched: buildMemberRows still lists every build.members id, keyed by result.levelsGained', () => {
    const chapter = getChapter('ffx2-vegnagun-shuyin');
    const rows = buildMemberRows(chapter, {
      outcome: 'victory',
      turns: 5,
      elapsedTicks: 0,
      elapsedMs: 0,
      ap: 180,
      exp: 1480,
      gil: 0,
      drops: [],
      overkilled: [],
      sphereLevelsGained: {},
      levelsGained: { yuna: 1 },
    });
    expect(rows).toHaveLength(3);
    expect(rows[0]?.awardUnit).toBe('EXP');
  });
});

/**
 * PR-0003 (round 04, major, FFX): `buildMemberRows`'s FFX branch derived its
 * ROW SET from `sphereLevelsGained`'s keys — the sourced §10.1 AP-eligibility
 * rule — instead of using that rule only to decide each row's AP/S.Lv. A
 * defeat means the whole active party is KO'd, so `sphereLevelsGained` is
 * empty and the ledger printed zero member rows (a flat black wedge on the
 * results screen); on a victory a member KO'd at the very end vanished from
 * the list the same way.
 *
 * This drives the real `seymour-flux` chapter (Chapter 1) with the shipped
 * `intendedStrategy` against the real engine and the real `gagazetBuild` —
 * the critic's own repro shape — through a documented loss (seed 1,
 * `tests/unit/strategy-seymour-flux.test.ts`'s `KNOWN_LOSSES`), never a
 * hand-built fixture, so the row set is read off a genuine full-party wipe.
 *
 * **Case: FFX only.** The row set is `build.activeSlots` union reserve
 * members who acted (research/ffx-combat-core.md §10.1's AP rule, which is
 * an FFX switch/reserve mechanic); the FFX-2 branch a few tests up is
 * untouched and asserted separately.
 */
describe('PR-0003: FFX results rows survive a real defeat and a real KO at the end', () => {
  function runSeymourFlux(seed: number): BattleResult {
    const content = new FFXContentRegistry();
    content.addAbilities(ALL_ABILITIES);
    content.addItems(Object.values(ITEMS));
    const group = ENEMY_GROUPS_BY_ID['seymour-flux'];
    if (!group) throw new Error('seymour-flux group missing from the data layer');
    const engine = createFFXEngine({ content, autoResolveMinigames: true });
    engine.init({
      game: 'ffx',
      party: gagazetBuild,
      enemies: group,
      triggers: [],
      seed,
      condition: 'normal',
      canEscape: false,
    });
    for (let i = 0; i < 60_000; i++) {
      const d = engine.nextDecision();
      if (d.kind === 'battle-over') return d.result;
      if (d.kind === 'player-input') {
        const cmd = intendedStrategy(d.actorId, d.commands, engine);
        const row = d.commands.find((c) => c.command.kind === 'attack' && c.enabled);
        const fallback: Command = { kind: 'attack', targets: row?.validTargets[0] ? [row.validTargets[0]] : [] };
        engine.submit(cmd ?? fallback);
      }
    }
    throw new Error(`seed ${seed} never reached battle-over within the decision budget`);
  }

  it('a real Chapter 1 defeat (seed 1, a documented loss) still lists every member who started active', () => {
    const result = runSeymourFlux(1);
    expect(result.outcome).toBe('defeat');

    const chapter = getChapter('seymour-flux');
    const rows = buildMemberRows(chapter, result);
    const ids = rows.map((r) => r.id);

    // The bug: an empty `sphereLevelsGained` (every active member KO'd) used
    // to mean zero rows at all — the right half of the results frame is flat
    // black. `gagazetBuild.activeSlots` is `['tidus', 'yuna', 'kimahri']`.
    for (const id of gagazetBuild.activeSlots) {
      expect(ids).toContain(id);
    }
    expect(rows.length).toBeGreaterThanOrEqual(gagazetBuild.activeSlots.length);
    // A defeat pays no AP at all — every row reads 0, not just the KO'd ones.
    for (const row of rows) expect(row.award).toBe(0);
  });

  it('a victory with a member KO\'d at the end still shows that member at 0 AP, no Sphere Level', () => {
    // A minimal, deterministic victory: tidus one-shots the dummy while yuna
    // and kimahri stand active but never act, and kimahri starts already KO'd
    // — the exact shape PR-0003 named ("a victory deletes a KO'd member").
    const engine = createFFXEngine({ content: content() });
    engine.init(
      setup({
        party: party({
          members: [member({ id: 'tidus' }), member({ id: 'yuna' }), member({ id: 'kimahri', hp: 0 })],
          activeSlots: ['tidus', 'yuna', 'kimahri'],
          reserve: [],
        }),
        enemies: {
          id: 'g',
          game: 'ffx',
          enemies: [
            enemy({
              id: 'dummy',
              stats: stats({ hp: 50, maxHp: 50 }),
              rewards: { ap: 100, apOverkill: 100, gil: 0, overkillThreshold: 1000, drops: [] },
            }),
          ],
        },
      }),
    );
    let d = driveToInput(engine);
    if (!d || d.actorId !== 'tidus') throw new Error(`expected tidus first, got ${d?.actorId}`);
    engine.submit(attackCommand(d)); // hp 50 -> 0, victory

    const after = driveToInput(engine);
    if (after) throw new Error('expected the battle to be over');
    const result = engine.state().result;
    if (!result) throw new Error('battle ended with no result attached');
    expect(result.outcome).toBe('victory');

    // seymour-flux's own build doesn't have this exact roster, so build the
    // row set off a chapter-shaped stand-in carrying this test's own party.
    const chapter = {
      ...getChapter('seymour-flux')!,
      buildRef: party({
        members: [member({ id: 'tidus' }), member({ id: 'yuna' }), member({ id: 'kimahri' })],
        activeSlots: ['tidus', 'yuna', 'kimahri'],
        reserve: [],
      }),
    };
    const rows = buildMemberRows(chapter, result);
    const kimahriRow = rows.find((r) => r.id === 'kimahri');
    expect(kimahriRow).toBeDefined();
    expect(kimahriRow?.award).toBe(0);
    expect(kimahriRow?.levelDelta).toBe(0);
  });
});
