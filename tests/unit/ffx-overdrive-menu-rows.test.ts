/**
 * The three Overdrive-and-menu blockers from critic round 02, against the real
 * data and the real engine: **#05** Wakka's Slots resolving to no shot at all,
 * **#06** Lulu's Fury being uncastable, and **#12** the Talk Trigger Command
 * doing nothing.
 *
 * All three are the same defect wearing three hats — *a row the menu offers is
 * not submittable as offered* (AGENTS.md hard rule 4, "built but wired to
 * nothing") — so the last test here is the general guard: every row of every
 * menu, submitted verbatim, must either change the battle or be refused out
 * loud.
 *
 * These run the shipped catalog, not a fixture, because all three bugs lived in
 * the gap between `src/data/ffx` and `src/battle/ffx`: the data declared
 * `extra.resolvesToShots`, `extra.resolvesToOneOf` and
 * `extra.resolvesAsCommandKind`, and nothing read any of them.
 */

import { describe, expect, it } from 'vitest';
import type {
  AvailableCommand,
  BattleEvent,
  Command,
  Decision,
  FFXPartyBuild,
  ReelResult,
} from '../../src/battle/common/types.ts';
import { FFXContentRegistry, createFFXEngine } from '../../src/battle/ffx/index.ts';
import { ABILITIES, ALL_ABILITIES, ENEMY_GROUPS_BY_ID, ITEMS } from '../../src/data/ffx/index.ts';
import { gagazetBuild } from '../../src/data/ffx/builds/gagazet.ts';
import { dreamsEndBuild } from '../../src/data/ffx/builds/dreams-end.ts';
import { attackReelHits, resolveReelSpin } from '../../src/battle/ffx/reels.ts';
import { minigameParams, timerMsFor } from '../../src/battle/ffx/overdrive.ts';
import { furySpellIdsFor } from '../../src/battle/ffx/fury.ts';

type Engine = ReturnType<typeof createFFXEngine>;

function newEngine(groupId: string, seed: number, party: FFXPartyBuild): Engine {
  const content = new FFXContentRegistry();
  content.addAbilities(ALL_ABILITIES);
  content.addItems(Object.values(ITEMS));
  const group = ENEMY_GROUPS_BY_ID[groupId];
  if (!group) throw new Error(`${groupId} missing from the data layer`);
  const engine = createFFXEngine({ content, autoResolveMinigames: true });
  engine.init({ game: 'ffx', party, enemies: group, triggers: [], seed, condition: 'normal', canEscape: false });
  return engine;
}

/**
 * Put `who` in the front three with a full gauge.
 *
 * Wakka and Lulu are on the bench in every shipped preset, and their Overdrives
 * are exactly the two that were broken — which is most of why nothing caught
 * this. The mutation is the same one a Switch performs.
 */
function frontWithFullGauge(engine: Engine, who: string, overdriveIds?: string[]): void {
  const state = engine.state() as unknown as {
    combatants: Record<string, { overdrive?: { gauge: number; unlockedOverdriveIds: string[] }; removed: boolean; slot: number }>;
    activeIds: string[];
    reserveIds: string[];
  };
  const c = state.combatants[who];
  if (!c) throw new Error(`no ${who} in this build`);
  if (c.overdrive) {
    c.overdrive.gauge = 100;
    if (overdriveIds) c.overdrive.unlockedOverdriveIds = overdriveIds;
  }
  if (!state.activeIds.includes(who)) {
    const out = state.activeIds[0]!;
    state.activeIds[0] = who;
    state.reserveIds = state.reserveIds.filter((x) => x !== who).concat(out);
    const leaving = state.combatants[out];
    if (leaving) leaving.removed = true;
    c.removed = false;
    c.slot = 0;
  }
}

/** Run until `who` is asked for input; everybody else Defends. */
function turnFor(engine: Engine, who: string, maxSteps = 4_000): Extract<Decision, { kind: 'player-input' }> {
  for (let i = 0; i < maxSteps; i++) {
    const d = engine.nextDecision();
    if (d.kind === 'battle-over') throw new Error(`battle ended before ${who} acted`);
    if (d.kind !== 'player-input') continue;
    if (d.actorId === who) return d;
    engine.submit({ kind: 'defend', targets: [] });
  }
  throw new Error(`${who} never acted`);
}

/** Submit `command` and return only the events it produced. */
function submitAndRead(engine: Engine, command: Command): BattleEvent[] {
  const before = engine.state().log.length;
  engine.submit(command);
  return engine.state().log.slice(before);
}

function damageIn(events: readonly BattleEvent[]): number[] {
  return events.filter((e) => e.type === 'damage').map((e) => (e as { amount: number }).amount);
}

function abilityStarted(events: readonly BattleEvent[]): string | undefined {
  const start = events.find((e) => e.type === 'action-start');
  return start ? (start as { abilityId?: string }).abilityId : undefined;
}

function reels(symbols: [string, string, string]): ReelResult {
  return {
    symbols,
    threeOfAKind: symbols[0] === symbols[1] && symbols[1] === symbols[2],
    timeRemainingMs: 0,
  };
}

// ---------------------------------------------------------------------------
// #05 — Wakka's Slots
// ---------------------------------------------------------------------------

describe("#05 Wakka's Slots resolve to a shot [ffx-combat-core §5.6]", () => {
  const REEL_SETS = ['element-reels', 'attack-reels', 'status-reels', 'aurochs-reels'] as const;

  for (const reelSet of REEL_SETS) {
    it(`${reelSet} deals real damage when taken exactly as the menu offers it`, () => {
      const engine = newEngine('seymour-flux', 3, gagazetBuild);
      frontWithFullGauge(engine, 'wakka', [reelSet]);
      const decision = turnFor(engine, 'wakka');
      const row = decision.commands.find((c) => c.category === 'overdrive');
      expect(row, `${reelSet} must be offered`).toBeDefined();

      const events = submitAndRead(engine, { ...row!.command, targets: [] } as Command);
      const dealt = damageIn(events);
      // Before the fix: `types: [action-start, overdrive-gauge, action-end]`,
      // `damage: []`, `bossHP 70000 -> 70000`, `gauge 100 -> 0`.
      expect(dealt.length, `${reelSet} spent the gauge and dealt nothing`).toBeGreaterThan(0);
      expect(Math.max(...dealt)).toBeGreaterThan(0);
      // And it resolved as one of the ten shots, never as the wrapper.
      expect(abilityStarted(events)).not.toBe(reelSet);
    });
  }

  it('maps every symbol to the shot §5.6 names, and falls back to Power Shot', () => {
    const element = ABILITIES['element-reels']!;
    const status = ABILITIES['status-reels']!;
    const aurochs = ABILITIES['aurochs-reels']!;

    // Three of a kind hits every enemy; two of a kind hits one random enemy.
    expect(resolveReelSpin(element, reels(['fire', 'fire', 'fire']))).toEqual({
      shotId: 'fire-shot',
      targeting: 'all-enemies',
    });
    expect(resolveReelSpin(element, reels(['ice', 'ice', 'water']))).toEqual({
      shotId: 'ice-shot',
      targeting: 'random-enemy',
    });
    // No match -> one non-elemental Power Shot on one random enemy.
    expect(resolveReelSpin(element, reels(['fire', 'ice', 'water']))).toEqual({
      shotId: 'power-shot',
      targeting: 'random-enemy',
    });

    // §5.6's Status Reels table: Skull -> Havoc, Down-Arrow -> Break,
    // Egg-timer -> Time. Nothing else in the tree writes that pairing down.
    expect(resolveReelSpin(status, reels(['skull', 'skull', 'skull']))?.shotId).toBe('havoc-shot');
    expect(resolveReelSpin(status, reels(['down-arrow', 'down-arrow', 'skull']))?.shotId).toBe('break-shot');
    expect(resolveReelSpin(status, reels(['egg-timer', 'egg-timer', 'skull']))?.shotId).toBe('time-shot');
    // The UI's spelling of the same three symbols (`types.ts`) resolves alike.
    expect(resolveReelSpin(status, reels(['arrow', 'arrow', 'skull']))?.shotId).toBe('break-shot');
    expect(resolveReelSpin(status, reels(['timer', 'timer', 'skull']))?.shotId).toBe('time-shot');
    expect(resolveReelSpin(status, reels(['skull', 'down-arrow', 'egg-timer']))?.shotId).toBe('power-shot');

    // Aurochs Reels carries the Element and Status symbols plus its own.
    expect(resolveReelSpin(aurochs, reels(['aurochs', 'aurochs', 'aurochs']))).toEqual({
      shotId: 'aurochs-shot',
      targeting: 'all-enemies',
    });
    expect(resolveReelSpin(aurochs, reels(['thunder', 'thunder', 'skull']))?.shotId).toBe('thunder-shot');
    expect(resolveReelSpin(aurochs, reels(['fire', 'skull', 'aurochs']))?.shotId).toBe('power-shot');
  });

  it('counts Attack Reels hits by §5.6 exactly, including the 0 and the 12', () => {
    // The worked table in §5.6, row for row.
    expect(attackReelHits(['miss', 'miss', 'miss'])).toBe(0); // all three match: 0 * 2
    expect(attackReelHits(['miss', 'miss', '1-hit'])).toBe(1);
    expect(attackReelHits(['1-hit', '1-hit', '2-hit'])).toBe(4);
    expect(attackReelHits(['1-hit', '1-hit', '1-hit'])).toBe(6);
    expect(attackReelHits(['2-hit', '2-hit', '1-hit'])).toBe(5);
    expect(attackReelHits(['2-hit', '2-hit', '2-hit'])).toBe(12); // the true maximum
    // The UI's spelling counts the same.
    expect(attackReelHits(['2hit', '2hit', '2hit'])).toBe(12);

    const attack = ABILITIES['attack-reels']!;
    expect(resolveReelSpin(attack, reels(['2-hit', '2-hit', '2-hit']))).toEqual({
      shotId: 'attack-reels-hit',
      targeting: 'random-enemy',
      hits: 12,
    });
    // Miss/Miss/Miss is a canonical zero, not a fallback to Power Shot: Attack
    // Reels is the one set with no no-match row.
    expect(resolveReelSpin(attack, reels(['miss', 'miss', 'miss']))?.hits).toBe(0);
  });

  it('a perfect Attack Reels lands twelve hits in the engine', () => {
    const engine = newEngine('seymour-flux', 11, gagazetBuild);
    frontWithFullGauge(engine, 'wakka', ['attack-reels']);
    const decision = turnFor(engine, 'wakka');
    const row = decision.commands.find((c) => c.category === 'overdrive')!;
    const events = submitAndRead(engine, {
      ...row.command,
      targets: [],
      extra: { kind: 'wakka-reels', reels: reels(['2-hit', '2-hit', '2-hit']) },
    } as Command);
    expect(damageIn(events)).toHaveLength(12);
  });
});

// ---------------------------------------------------------------------------
// #06 — Lulu's Fury
// ---------------------------------------------------------------------------

describe("#06 Lulu's Fury is castable [ffx-combat-core §5.7]", () => {
  it('expands the generic marker into the Fury of every spell she has learned', () => {
    const marker = ABILITIES['fury']!;
    // §5.7's input begins "after choosing a learned Blk Magic spell".
    const gagazet = furySpellIdsFor(marker, ['fire', 'fira', 'bio', 'focus', 'scan']);
    expect(gagazet).toEqual(['fire-fury', 'fira-fury', 'bio-fury']);
    // Flare and Ultima are withheld from every shipped preset (§7.4), so their
    // Furies must never appear.
    expect(furySpellIdsFor(marker, ['fire'])).not.toContain('flare-fury');
  });

  it('offers those rows on the real board and they deal damage as submitted', () => {
    const engine = newEngine('seymour-flux', 5, gagazetBuild);
    frontWithFullGauge(engine, 'lulu');
    const decision = turnFor(engine, 'lulu');
    const rows = decision.commands.filter((c) => c.category === 'overdrive');

    // Before the fix her only row was the marker `'fury'`, which `execute.ts`
    // refuses by design — a gauge that could be filled and never spent.
    expect(rows.map((r) => r.label)).not.toContain('Fury');
    expect(rows.map((r) => r.label)).toContain('Fira Fury');

    const events = submitAndRead(engine, { ...rows[0]!.command, targets: [] } as Command);
    const dealt = damageIn(events);
    expect(dealt.length, 'a Fury with a real input casts more than once').toBeGreaterThan(1);
    expect(Math.min(...dealt)).toBeGreaterThan(0);
  });

  it('gives the dial a window, and gives the pickers none at all', () => {
    // §5.7: "Input window: ~4 s, consistent with the other timed Overdrives".
    // It returned 0, so the shipped overlay settled in 431 ms with
    // `{ sweptDegrees: 0, casts: 0 }` and the gauge was spent for nothing.
    expect(timerMsFor(ABILITIES['fira-fury']!)).toBe(4_000);
    expect(timerMsFor(ABILITIES['element-reels']!)).toBe(20_000);

    // Ronso Rage is "no timed input; a picker only" (`types.ts`), so it
    // publishes **no** timer rather than a zero-length one an overlay would
    // start and immediately expire.
    const registry = new FFXContentRegistry();
    registry.addAbilities(ALL_ABILITIES);
    const ctx = { content: registry, rt: { inventory: new Map(), aeonRoster: new Map() } } as never;
    const caster = { stats: { mag: 48 }, overdrive: { unlockedOverdriveIds: ['mighty-guard'] } } as never;
    expect(minigameParams(ctx, ABILITIES['fira-fury']!, caster)['timerMs']).toBe(4_000);
    expect(minigameParams(ctx, ABILITIES['mighty-guard']!, caster)).not.toHaveProperty('timerMs');
  });
});

// ---------------------------------------------------------------------------
// #12 — the Talk Trigger Command
// ---------------------------------------------------------------------------

describe('#12 Trigger Commands fire from the player command list', () => {
  it("zeroes Braska's Final Aeon's gauge, twice, then says so [ffx-bfa-yu-yevon §1.6]", () => {
    const engine = newEngine('braskas-final-aeon', 1, dreamsEndBuild);
    const decision = turnFor(engine, 'tidus');
    const talk = decision.commands.find((c) => c.label === 'Talk');
    expect(talk, 'the guide and the intent panel both advertise Talk').toBeDefined();
    // The row the menu offers is the row that works — it used to be shaped as
    // `{ kind: 'ability', id: 'talk' }`, which resolved a `formula: 'none'`,
    // `hits: 0` record and changed nothing at all.
    expect(talk!.command.kind).toBe('trigger');

    const events = submitAndRead(engine, talk!.command as Command);
    // It lands, it is counted, and it is visible: before the fix the whole
    // action was `['action-start:Talk', 'action-end']` with `bfa.gauge`,
    // `bfa.talkUsed` and `bfa.talkPending` all unchanged.
    expect(engine.state().flags['bfa.talkUsed']).toBe(1);
    expect(engine.state().flags['bfa.talkPending']).toBe(true);
    expect(events.some((e) => e.type === 'message' || e.type === 'overdrive-gauge')).toBe(true);
  });

  it('runs out after two charges and the third row is refused, not silent', () => {
    const engine = newEngine('braskas-final-aeon', 1, dreamsEndBuild);
    let offers = 0;
    let refusals = 0;
    for (let i = 0; i < 400; i++) {
      const d = engine.nextDecision();
      if (d.kind === 'battle-over') break;
      if (d.kind !== 'player-input') continue;
      const talk = d.commands.find((c) => c.label === 'Talk');
      if (talk?.enabled) {
        offers++;
        const events = submitAndRead(engine, talk.command as Command);
        if (!events.some((e) => e.type === 'overdrive-gauge')) refusals++;
        continue;
      }
      // §1.6 offers a third Talk deliberately; it must say why it does nothing.
      if (talk && !talk.enabled) {
        expect(talk.disabledReason).toBeDefined();
        refusals++;
      }
      engine.submit({ kind: 'defend', targets: [] });
      if (refusals > 0 && offers >= 2) break;
    }
    expect(offers, 'two charges, battle-wide').toBe(2);
    expect(refusals, 'and then it stops working, out loud').toBeGreaterThan(0);
  });

  it('gives Kimahri +10 Strength and Yuna +10 Magic Defense [ffx-seymour-flux §4.7]', () => {
    for (const [who, stat, gain] of [
      ['kimahri', 'str', 10],
      ['yuna', 'mdef', 10],
    ] as const) {
      // A party that only Defends is dead inside a dozen turns, and Yuna is
      // the slowest of the three (Agility 20, §7.3) — so take the first seed
      // that hands her a turn rather than pinning one.
      let measured = false;
      for (const seed of [1, 3, 5, 7, 11]) {
        const engine = newEngine('seymour-flux', seed, gagazetBuild);
        frontWithFullGauge(engine, who);
        const before = (engine.state().combatants[who] as unknown as { stats: Record<string, number> }).stats[stat]!;
        let decision;
        try {
          decision = turnFor(engine, who);
        } catch {
          continue;
        }
        const talk = decision.commands.find((c) => c.label === 'Talk');
        expect(talk?.enabled, `${who} has a line in this fight`).toBe(true);
        submitAndRead(engine, talk!.command as Command);
        const after = (engine.state().combatants[who] as unknown as { stats: Record<string, number> }).stats[stat]!;
        expect(after - before).toBe(gain);
        measured = true;
        break;
      }
      expect(measured, `${who} never got a turn on any probe seed`).toBe(true);
    }
  });

  it('gives Tidus no line here, and says so instead of eating his turn', () => {
    const engine = newEngine('seymour-flux', 3, gagazetBuild);
    const decision = turnFor(engine, 'tidus');
    const talk = decision.commands.find((c) => c.label === 'Talk');
    // §4.7 lists Kimahri and Yuna and nobody else.
    expect(talk?.enabled).toBe(false);
    expect(talk?.disabledReason).toBe('Nothing left to say');
  });
});

// ---------------------------------------------------------------------------
// The general guard the three of them share
// ---------------------------------------------------------------------------

describe('every offered row is submittable as offered', () => {
  /**
   * The rule all three blockers broke: a row the engine publishes must, when
   * submitted **verbatim**, either change the battle or be refused out loud.
   * Silently resolving to nothing is the failure mode that let Slots, Fury and
   * Talk ship as working menu entries that did nothing at all.
   *
   * "Changed the battle" is read off the event log rather than off a diff of
   * the state, because that is what the presenter animates: a row that produces
   * no events produces no feedback either.
   */
  function assertEveryRowDoesSomething(groupId: string, build: FFXPartyBuild, front: string[]): void {
    for (const who of front) {
      // One engine per row: submitting a row changes the board, and the point
      // is what each row does from the same starting position.
      const probe = newEngine(groupId, 3, build);
      frontWithFullGauge(probe, who);
      const offered: AvailableCommand[] = turnFor(probe, who).commands.filter((c) => c.enabled);

      for (const row of offered) {
        if (row.command.kind === 'switch' || row.command.kind === 'escape') continue;
        // Items are exempt, and only items: a Holy Water aimed at somebody who
        // is not a Zombie legitimately does nothing, and the menu cannot know
        // in advance. Every *action* row has to do something.
        if (row.command.kind === 'item') continue;
        const engine = newEngine(groupId, 3, build);
        frontWithFullGauge(engine, who);
        const decision = turnFor(engine, who);
        const live = decision.commands.find((c) => c.label === row.label && c.enabled);
        if (!live) continue;
        const events = submitAndRead(engine, {
          ...live.command,
          targets: live.validTargets.slice(0, 1),
        } as Command);
        const meaningful = events.filter(
          (e) =>
            e.type !== 'action-start' &&
            e.type !== 'action-end' &&
            e.type !== 'turn-start' &&
            // Spending the caster's own gauge is the row's **cost**, not its
            // effect. Counting it is how Bio Fury, Death Fury and Demi Fury —
            // three rows that emitted nothing else — passed this guard, which
            // is exactly what an adversarial verifier came back with.
            !(e.type === 'overdrive-gauge' && e.cause === 'spent'),
        );
        expect(meaningful.length, `${who}'s "${live.label}" did nothing at all`).toBeGreaterThan(0);
      }
    }
  }

  it('holds for the Chapter 1 board, Wakka and Lulu included', () => {
    assertEveryRowDoesSomething('seymour-flux', gagazetBuild, ['wakka', 'lulu', 'kimahri']);
  });

  // Three named actors on one board is what let Rikku's `Steal`, `Use` and
  // `Mix` through. The exhaustive version — every chapter, every actor, the
  // bench included — is `tests/unit/trigger-commands.test.ts`; this line is
  // the cheap part of it, on the board the refutation used.
  it('and for Rikku, who was never asked', () => {
    assertEveryRowDoesSomething('seymour-flux', gagazetBuild, ['rikku', 'tidus']);
  });
});
