/**
 * Three FFX engine defects, each reported from outside the engine.
 *
 * 1. **Every Switch row was disabled.** `commands.ts` gated the row on
 *    `isAlive(bench)`, and `isAlive` folds in `onField`, which a benched member
 *    (`removed === true`) can never satisfy — so four of the seven guardians
 *    could not enter a battle at all. §1.7: "any reserve member may be swapped
 *    in at any point; all seven can therefore participate", and "the incoming
 *    reserve member takes the turn that is happening right now".
 * 2. **A bare re-submit of a timed Overdrive asked forever.** `docs/CONTRACTS.md`
 *    says the engine emits `minigame-request` and stops, and the UI re-submits
 *    the same command with `extra`; when the command came back bare the engine
 *    asked again, and a presenter probe re-picked Spiral Cut 19,916 times. The
 *    contract's own "if `extra` is absent … the engine rolls a default outcome
 *    from the seeded RNG" is the answer.
 * 3. **Sensor and Scan were inert.** The data ships a `scan` status and a
 *    `sensor` auto-ability [ffx-combat-core §9] and nothing emitted the
 *    `'sensor'` event the HUD panel opens on — the same defect X-2 had.
 *
 * Every assertion here runs the engine. Nothing is grepped for.
 */

import { describe, expect, it } from 'vitest';
import type { BattleEvent, Command, Decision, FFXCombatant } from '../../src/battle/common/types.ts';
import { FFXContentRegistry, createFFXEngine } from '../../src/battle/ffx/index.ts';
import { ability, attackAbility, enemy, member, party, setup } from './ffx-fixtures.test.ts';
import { ABILITIES as UTILITY } from '../../src/data/ffx/abilities/special-utility.ts';

type PlayerInput = Extract<Decision, { kind: 'player-input' }>;

/** A registry with Attack, Defend, Scan and one timed Overdrive. */
function content(): FFXContentRegistry {
  const reg = new FFXContentRegistry();
  const scan = UTILITY['scan'];
  if (!scan) throw new Error('data drift: the Scan record is gone from special-utility.ts');
  reg.addAbilities([
    attackAbility(),
    ability({ id: 'defend', name: 'Defend', category: 'special', rank: 1, formula: 'none', targeting: 'self' }),
    scan,
    ability({
      id: 'spiral-cut',
      name: 'Spiral Cut',
      category: 'overdrive',
      rank: 3,
      power: 32,
      formula: 'strength',
      damageType: 'other',
      targeting: 'single-enemy',
      hits: 1,
      minigame: 'tidus-timing',
    }),
  ]);
  return reg;
}

/** Drive the engine until `who` may act, taking plain swings for anyone else. */
function driveTo(engine: ReturnType<typeof createFFXEngine>, who: string, log: BattleEvent[] = []): PlayerInput {
  for (let i = 0; i < 200; i++) {
    const d = engine.nextDecision();
    if (d.kind === 'resolved') {
      log.push(...d.events);
      continue;
    }
    if (d.kind === 'player-input') {
      if (d.actorId === who) return d;
      log.push(...engine.submit(swing(d)));
      continue;
    }
    break;
  }
  throw new Error(`${who} never got a turn`);
}

function swing(d: PlayerInput): Command {
  const row = d.commands.find((c) => c.command.kind === 'attack' && c.enabled);
  const target = row?.validTargets[0];
  return { kind: 'attack', targets: target ? [target] : [] };
}

// ---------------------------------------------------------------------------
// 1. Switch [ffx-combat-core §1.7]
// ---------------------------------------------------------------------------

describe('Switch offers the bench [ffx-combat-core §1.7]', () => {
  const benchSetup = (kimahriHp = 2000) =>
    setup({
      party: party({
        members: [
          member({ id: 'tidus' }),
          member({ id: 'yuna' }),
          member({ id: 'auron' }),
          member({ id: 'kimahri', hp: kimahriHp }),
        ],
        activeSlots: ['tidus', 'yuna', 'auron'],
      }),
      enemies: { id: 'g', game: 'ffx', enemies: [enemy({ id: 'dummy', hp: 9000 })] },
    });

  it('enables a living reserve member (the old gate disabled every one)', () => {
    const engine = createFFXEngine({ content: content() });
    engine.init(benchSetup());
    const d = driveTo(engine, 'tidus');

    const rows = d.commands.filter((c) => c.command.kind === 'switch');
    expect(rows).toHaveLength(1);
    expect(rows[0]?.label).toBe('kimahri');
    expect(rows[0]?.enabled).toBe(true);
  });

  it('disables a KO’d reserve member, who could not take the handed-over turn', () => {
    const engine = createFFXEngine({ content: content() });
    engine.init(benchSetup(0));
    const d = driveTo(engine, 'tidus');

    const row = d.commands.find((c) => c.command.kind === 'switch');
    expect(row?.enabled).toBe(false);
    expect(row?.disabledReason).toBe('Unable to fight');
  });

  it('swaps the member in and hands them the turn that is happening right now', () => {
    const engine = createFFXEngine({ content: content() });
    engine.init(benchSetup());
    const d = driveTo(engine, 'tidus');
    const row = d.commands.find((c) => c.command.kind === 'switch');
    if (!row) throw new Error('no switch row');

    const events = engine.submit(row.command);
    expect(events.some((e) => e.type === 'switch')).toBe(true);

    // The turn did not pass to anyone else: the engine is waiting on Kimahri.
    const next = engine.nextDecision();
    expect(next.kind).toBe('player-input');
    if (next.kind === 'player-input') expect(next.actorId).toBe('kimahri');

    const state = engine.state();
    expect(state.activeIds).toContain('kimahri');
    expect(state.activeIds).not.toContain('tidus');
    expect(state.reserveIds).toContain('tidus');
    expect((state.combatants['kimahri'] as FFXCombatant).removed).toBe(false);
    expect((state.combatants['tidus'] as FFXCombatant).removed).toBe(true);
  });

  it('refuses a switch to a KO’d member even when the command is forced', () => {
    const engine = createFFXEngine({ content: content() });
    engine.init(benchSetup(0));
    driveTo(engine, 'tidus');

    const events = engine.submit({
      kind: 'switch',
      targets: [],
      extra: { outId: 'tidus', inId: 'kimahri' },
    });
    expect(events.some((e) => e.type === 'switch')).toBe(false);
    expect(engine.state().activeIds).toContain('tidus');
    // The turn stays open rather than being burned on an illegal command.
    const next = engine.nextDecision();
    expect(next.kind === 'player-input' && next.actorId).toBe('tidus');
  });
});

// ---------------------------------------------------------------------------
// 2. The timed-Overdrive re-submit [docs/CONTRACTS.md, "Minigame protocol"]
// ---------------------------------------------------------------------------

describe('a bare re-submit of a timed Overdrive resolves itself [CONTRACTS.md]', () => {
  const odSetup = () =>
    setup({
      party: party({
        members: [
          member({
            id: 'tidus',
            overdrive: { gauge: 100, mode: 'stoic', unlockedModes: ['stoic'], unlockedOverdriveIds: ['spiral-cut'] },
          }),
          member({ id: 'yuna' }),
          member({ id: 'auron' }),
        ],
        activeSlots: ['tidus', 'yuna', 'auron'],
      }),
      enemies: { id: 'g', game: 'ffx', enemies: [enemy({ id: 'dummy', hp: 9000 })] },
    });

  const spiralCut: Command = { kind: 'overdrive', id: 'spiral-cut', targets: ['dummy'] };

  it('asks once, then rolls the outcome from the seeded RNG on the second bare submit', () => {
    const engine = createFFXEngine({ content: content() });
    engine.init(odSetup());
    driveTo(engine, 'tidus');

    const first = engine.submit(spiralCut);
    expect(first.filter((e) => e.type === 'minigame-request')).toHaveLength(1);
    expect(first.some((e) => e.type === 'damage')).toBe(false);

    // The presenter's workaround: re-submit the identical command, bare.
    const second = engine.submit(spiralCut);
    expect(second.some((e) => e.type === 'minigame-request')).toBe(false);
    expect(second.some((e) => e.type === 'damage')).toBe(true);
    // The gauge is spent, which is what actually stops the loop.
    expect((engine.state().combatants['tidus'] as FFXCombatant).overdrive?.gauge).toBe(0);
  });

  it('never loops: a presenter that only ever re-submits bare still advances', () => {
    const engine = createFFXEngine({ content: content() });
    engine.init(odSetup());
    driveTo(engine, 'tidus');

    let requests = 0;
    for (let i = 0; i < 50; i++) {
      const events = engine.submit(spiralCut);
      requests += events.filter((e) => e.type === 'minigame-request').length;
      if (events.some((e) => e.type === 'action-end')) break;
    }
    // One request, then the resolution. Not 19,916 of them.
    expect(requests).toBe(1);
    expect((engine.state().combatants['tidus'] as FFXCombatant).overdrive?.gauge).toBe(0);
  });

  it('still opens the overlay the next time, when the player backed out to another command', () => {
    const engine = createFFXEngine({ content: content() });
    engine.init(odSetup());
    driveTo(engine, 'tidus');

    expect(engine.submit(spiralCut).filter((e) => e.type === 'minigame-request')).toHaveLength(1);
    // The player closed the overlay and swung instead.
    engine.submit({ kind: 'attack', targets: ['dummy'] });

    const again = driveTo(engine, 'tidus');
    expect(again.kind).toBe('player-input');
    const second = engine.submit(spiralCut);
    expect(second.filter((e) => e.type === 'minigame-request')).toHaveLength(1);
    expect(second.some((e) => e.type === 'damage')).toBe(false);
  });

  it('the rolled outcome is reproducible from the seed', () => {
    const run = (): number => {
      const engine = createFFXEngine({ content: content() });
      engine.init(odSetup());
      driveTo(engine, 'tidus');
      engine.submit(spiralCut);
      const events = engine.submit(spiralCut);
      return events.filter((e) => e.type === 'damage').reduce((sum, e) => sum + (e.type === 'damage' ? e.amount : 0), 0);
    };
    expect(run()).toBe(run());
  });
});

// ---------------------------------------------------------------------------
// 3. Sensor and Scan [ffx-combat-core §9]
// ---------------------------------------------------------------------------

describe('Sensor and Scan reveal an enemy [ffx-combat-core §9]', () => {
  const boss = () =>
    enemy({
      id: 'dummy',
      hp: 9000,
      sensorText: 'Its armour is thickest at the front.',
      scanText: 'Weak to fire.',
      affinities: { fire: 'weak' },
    });

  const sensorParty = (worn: boolean, benchWears = false) =>
    party({
      members: [
        member({
          id: 'tidus',
          learnedAbilityIds: ['scan'],
          equipment: {
            weapon: { name: 'Bare', slots: 1, autoAbilities: [] },
            armor: { name: 'Sensor Ring', slots: 1, autoAbilities: worn ? ['sensor'] : [] },
          },
        }),
        member({ id: 'yuna' }),
        member({ id: 'auron' }),
        member({
          id: 'kimahri',
          equipment: {
            weapon: { name: 'Bare', slots: 1, autoAbilities: [] },
            armor: { name: 'Sensor Ring', slots: 1, autoAbilities: benchWears ? ['sensor'] : [] },
          },
        }),
      ],
      activeSlots: ['tidus', 'yuna', 'auron'],
    });

  it('announces every enemy once at the start of the battle when Sensor is worn', () => {
    const engine = createFFXEngine({ content: content() });
    engine.init(setup({ party: sensorParty(true), enemies: { id: 'g', game: 'ffx', enemies: [boss()] } }));

    const log: BattleEvent[] = [];
    driveTo(engine, 'tidus', log);
    const reveals = log.filter((e) => e.type === 'sensor');
    expect(reveals).toHaveLength(1);
    const first = reveals[0];
    if (first?.type !== 'sensor') throw new Error('expected a sensor event');
    expect(first.targetId).toBe('dummy');
    expect(first.full).toBe(false);
    expect(first.text).toBe('Its armour is thickest at the front.');
    expect(first.maxHp).toBe(5000);
    expect(engine.state().combatants['dummy']?.revealed).toBe(true);
  });

  it('emits nothing when nobody on the field is wearing one', () => {
    const engine = createFFXEngine({ content: content() });
    engine.init(setup({ party: sensorParty(false), enemies: { id: 'g', game: 'ffx', enemies: [boss()] } }));

    const log: BattleEvent[] = [];
    driveTo(engine, 'tidus', log);
    expect(log.filter((e) => e.type === 'sensor')).toHaveLength(0);
    expect(engine.state().combatants['dummy']?.revealed).toBeUndefined();
  });

  it('reveals on switch-in, because the Sensor is usually parked on the bench [§1.7]', () => {
    const engine = createFFXEngine({ content: content() });
    engine.init(
      setup({ party: sensorParty(false, true), enemies: { id: 'g', game: 'ffx', enemies: [boss()] } }),
    );

    const log: BattleEvent[] = [];
    const d = driveTo(engine, 'tidus', log);
    expect(log.filter((e) => e.type === 'sensor')).toHaveLength(0);

    const row = d.commands.find((c) => c.command.kind === 'switch');
    if (!row) throw new Error('no switch row');
    const events = engine.submit(row.command);
    const reveals = events.filter((e) => e.type === 'sensor');
    expect(reveals).toHaveLength(1);
    expect(engine.state().combatants['dummy']?.revealed).toBe(true);
  });

  it('Scan opens the full panel and reads the scan line', () => {
    const engine = createFFXEngine({ content: content() });
    engine.init(setup({ party: sensorParty(false), enemies: { id: 'g', game: 'ffx', enemies: [boss()] } }));

    const d = driveTo(engine, 'tidus');
    const events = engine.submit({ kind: 'ability', id: 'scan', targets: ['dummy'] });
    const reveal = events.find((e) => e.type === 'sensor');
    if (reveal?.type !== 'sensor') throw new Error('Scan emitted no sensor event');
    expect(reveal.full).toBe(true);
    expect(reveal.text).toBe('Weak to fire.');
    expect(reveal.weaknesses).toEqual(['fire']);
    expect(reveal.maxHp).toBe(5000);
    expect(engine.state().combatants['dummy']?.revealed).toBe(true);
    // Scan still lands its own `scan` status: the reveal is additive.
    expect(engine.state().combatants['dummy']?.statuses['scan']).toBeDefined();
    void d;
  });

  it('an immune-to-sensor enemy is announced once, with no numerals and no reveal', () => {
    const engine = createFFXEngine({ content: content() });
    engine.init(
      setup({
        party: sensorParty(true),
        enemies: {
          id: 'g',
          game: 'ffx',
          enemies: [enemy({ id: 'dummy', hp: 9000, immunityFlags: ['immune-to-sensor'], sensorText: '- - -' })],
        },
      }),
    );

    const log: BattleEvent[] = [];
    const d = driveTo(engine, 'tidus', log);
    log.push(...engine.submit(swing(d)));
    driveTo(engine, 'tidus', log);

    const reveals = log.filter((e) => e.type === 'sensor');
    expect(reveals).toHaveLength(1);
    const only = reveals[0];
    if (only?.type !== 'sensor') throw new Error('expected a sensor event');
    expect(only.hp).toBeUndefined();
    expect(only.maxHp).toBeUndefined();
    expect(engine.state().combatants['dummy']?.revealed).toBeUndefined();
  });
});
