/**
 * The playback protocol [docs/CONTRACTS.md]: decision semantics, `seq`
 * ordering, JSON purity, determinism, the minigame round-trip, mid-battle
 * triggers and the Yu Pagoda healing loop.
 */

import { describe, expect, it } from 'vitest';
import type { BattleEvent, Command, Decision, FFXCombatant } from '../../src/battle/common/types.ts';
import { FFXContentRegistry, createFFXEngine } from '../../src/battle/ffx/index.ts';
import { ability, enemy, member, party, setup } from './ffx-fixtures.test.ts';
import { ABILITIES as LULU_1 } from '../../src/data/ffx/abilities/overdrive-lulu-1.ts';
import { ABILITIES as LULU_2 } from '../../src/data/ffx/abilities/overdrive-lulu-2.ts';
import { ABILITIES as MENU_MARKERS } from '../../src/data/ffx/abilities/special-menu-markers.ts';

/** A registry carrying just the actions these tests need. */
function content(): FFXContentRegistry {
  const reg = new FFXContentRegistry();
  reg.addAbilities([
    ability({
      id: 'firaga',
      name: 'Firaga',
      category: 'blackmagic',
      mpCost: 16,
      rank: 3,
      power: 42,
      formula: 'magic',
      damageType: 'magical',
      element: ['fire'],
      flags: ['reflectable'],
    }),
    // Yu Pagoda Power Wave: Fixed (no variance), base 30 -> exactly 1 500,
    // heals, strips statuses, and adds 20% to the boss's gauge.
    ability({
      id: 'power-wave-bfa',
      name: 'Power Wave',
      category: 'enemy',
      rank: 3,
      power: 30,
      formula: 'fixed-no-variance',
      damageType: 'other',
      targeting: 'single-ally',
      flags: ['heals', 'removes-statuses'],
      removesStatuses: ['zombie', 'poison', 'silence', 'darkness', 'slow'],
      extra: { overdriveGaugeGain: 20 },
    }),
    ability({
      id: 'blitz-ace',
      name: 'Blitz Ace',
      category: 'overdrive',
      rank: 7,
      power: 24,
      formula: 'strength',
      damageType: 'other',
      targeting: 'single-enemy',
      hits: 1,
      flags: ['crit-eligible'],
      minigame: 'tidus-timing',
      extra: { failAbilityId: 'blitz-ace-fail' },
    }),
    ability({
      id: 'blitz-ace-fail',
      name: 'Blitz Ace',
      category: 'overdrive',
      rank: 6,
      power: 4,
      formula: 'strength',
      damageType: 'other',
      targeting: 'single-enemy',
      hits: 8,
      flags: ['crit-eligible'],
    }),
  ]);
  return reg;
}

/** Drive the engine to the end, answering every prompt with `choose`. */
function runBattle(
  engine: ReturnType<typeof createFFXEngine>,
  choose: (d: Extract<Decision, { kind: 'player-input' }>) => Command,
  maxSteps = 4000,
): BattleEvent[] {
  const all: BattleEvent[] = [];
  for (let i = 0; i < maxSteps; i++) {
    const d = engine.nextDecision();
    if (d.kind === 'battle-over') return all;
    if (d.kind === 'resolved') {
      all.push(...d.events);
      continue;
    }
    if (d.kind === 'player-input') {
      all.push(...engine.submit(choose(d)));
      continue;
    }
    throw new Error(`FFX engine returned an unexpected decision: ${d.kind}`);
  }
  throw new Error('battle did not terminate');
}

const alwaysAttack = (d: Extract<Decision, { kind: 'player-input' }>): Command => {
  const row = d.commands.find((c) => c.command.kind === 'attack');
  const target = row?.validTargets[0];
  return { kind: 'attack', targets: target ? [target] : [] };
};

describe('decision semantics', () => {
  it('opens a turn with a resolved decision, then asks the player', () => {
    const engine = createFFXEngine({ content: content() });
    engine.init(setup());
    const first = engine.nextDecision();
    expect(first.kind).toBe('resolved');
    const second = engine.nextDecision();
    expect(second.kind).toBe('player-input');
  });

  it('nextDecision() is idempotent for player-input: no new events, same actor', () => {
    const engine = createFFXEngine({ content: content() });
    engine.init(setup());
    let d = engine.nextDecision();
    while (d.kind === 'resolved') d = engine.nextDecision();
    expect(d.kind).toBe('player-input');
    const lengthBefore = engine.state().log.length;
    const again = engine.nextDecision();
    expect(engine.state().log.length).toBe(lengthBefore);
    expect(again.kind).toBe('player-input');
    if (d.kind === 'player-input' && again.kind === 'player-input') {
      expect(again.actorId).toBe(d.actorId);
    }
  });

  it('nextDecision() is idempotent for battle-over', () => {
    const engine = createFFXEngine({ content: content() });
    engine.init(setup({ enemies: { id: 'g', game: 'ffx', enemies: [enemy({ id: 'dummy', hp: 1 })] } }));
    runBattle(engine, alwaysAttack);
    const first = engine.nextDecision();
    const lengthBefore = engine.state().log.length;
    const second = engine.nextDecision();
    expect(first.kind).toBe('battle-over');
    expect(second.kind).toBe('battle-over');
    expect(engine.state().log.length).toBe(lengthBefore);
  });

  it('offers already-resolved targets and computed legality', () => {
    const engine = createFFXEngine({ content: content() });
    engine.init(
      setup({
        party: party({
          members: [
            // Agility 40 -> base 7, so Lulu is unambiguously first to act.
            member({
              id: 'lulu',
              mp: 0,
              learnedAbilityIds: ['firaga'],
              stats: { ...member({ id: 'x' }).stats, agi: 40 },
            }),
            member({ id: 'yuna' }),
            member({ id: 'auron' }),
          ],
          activeSlots: ['lulu', 'yuna', 'auron'],
        }),
      }),
    );
    let d = engine.nextDecision();
    while (d.kind === 'resolved') d = engine.nextDecision();
    if (d.kind !== 'player-input') throw new Error('expected player input');
    expect(d.actorId).toBe('lulu');
    const firaga = d.commands.find((c) => c.label === 'Firaga');
    expect(firaga).toBeDefined();
    expect(firaga?.mpCost).toBe(16);
    expect(firaga?.rank).toBe(3);
    expect(firaga?.enabled).toBe(false);
    expect(firaga?.disabledReason).toBe('Not enough MP');
    const attack = d.commands.find((c) => c.command.kind === 'attack');
    expect(attack?.validTargets).toContain('dummy');
  });
});

describe('the event log', () => {
  it('numbers every event monotonically, with log[i].seq === i', () => {
    const engine = createFFXEngine({ content: content() });
    engine.init(setup({ enemies: { id: 'g', game: 'ffx', enemies: [enemy({ id: 'dummy', hp: 400 })] } }));
    runBattle(engine, alwaysAttack);
    const log = engine.state().log;
    expect(log.length).toBeGreaterThan(5);
    log.forEach((e, i) => expect(e.seq).toBe(i));
  });

  it('is pure JSON — no functions, no class instances', () => {
    const engine = createFFXEngine({ content: content() });
    engine.init(setup({ enemies: { id: 'g', game: 'ffx', enemies: [enemy({ id: 'dummy', hp: 400 })] } }));
    runBattle(engine, alwaysAttack);
    const log = engine.state().log;
    expect(JSON.parse(JSON.stringify(log))).toEqual(log);
  });
});

describe('determinism', () => {
  it('produces a byte-identical event log for the same seed and commands', () => {
    const play = (): BattleEvent[] => {
      const engine = createFFXEngine({ content: content(), autoResolveMinigames: true });
      engine.init(setup({ seed: 987654, enemies: { id: 'g', game: 'ffx', enemies: [enemy({ id: 'dummy', hp: 3000 })] } }));
      runBattle(engine, alwaysAttack);
      return engine.state().log;
    };
    expect(JSON.stringify(play())).toBe(JSON.stringify(play()));
  });

  it('diverges on a different seed', () => {
    const play = (seed: number): string => {
      const engine = createFFXEngine({ content: content(), autoResolveMinigames: true });
      engine.init(setup({ seed, condition: 'normal', enemies: { id: 'g', game: 'ffx', enemies: [enemy({ id: 'dummy', hp: 3000 })] } }));
      runBattle(engine, alwaysAttack);
      return JSON.stringify(engine.state().log);
    };
    expect(play(1)).not.toBe(play(2));
  });
});

describe('the minigame protocol', () => {
  const odSetup = () =>
    setup({
      party: party({
        members: [
          member({ id: 'tidus', overdrive: { gauge: 100, mode: 'stoic', unlockedModes: ['stoic'], unlockedOverdriveIds: ['blitz-ace'] } }),
          member({ id: 'yuna' }),
          member({ id: 'auron' }),
        ],
        activeSlots: ['tidus', 'yuna', 'auron'],
      }),
      enemies: { id: 'g', game: 'ffx', enemies: [enemy({ id: 'dummy', hp: 9000 })] },
    });

  it('emits minigame-request and stops, then resolves on the re-submit with extra', () => {
    const engine = createFFXEngine({ content: content() });
    engine.init(odSetup());
    let d = engine.nextDecision();
    while (d.kind === 'resolved') d = engine.nextDecision();
    if (d.kind !== 'player-input' || d.actorId !== 'tidus') {
      // Whoever goes first, keep taking plain turns until Tidus is up.
      for (let i = 0; i < 20 && (d.kind !== 'player-input' || d.actorId !== 'tidus'); i++) {
        if (d.kind === 'player-input') engine.submit(alwaysAttack(d));
        d = engine.nextDecision();
      }
    }
    if (d.kind !== 'player-input') throw new Error('expected player input');

    const command: Command = { kind: 'overdrive', id: 'blitz-ace', targets: ['dummy'] };
    const first = engine.submit(command);
    const request = first.find((e) => e.type === 'minigame-request');
    expect(request).toBeDefined();
    if (request?.type === 'minigame-request') {
      expect(request.who).toBe('tidus');
      expect(request.kind).toBe('tidus-timing');
      expect(request.params['timerMs']).toBe(2200);
    }
    // The turn has not resolved: no damage yet.
    expect(first.some((e) => e.type === 'damage')).toBe(false);

    const second = engine.submit({
      ...command,
      extra: { kind: 'tidus-timing', timing: { success: true, timeRemainingMs: 1820, timerMs: 2200 } },
    });
    expect(second.some((e) => e.type === 'damage')).toBe(true);
    expect(second.some((e) => e.type === 'minigame-request')).toBe(false);
  });

  it('rolls a default outcome and never emits a request when auto-resolving', () => {
    const engine = createFFXEngine({ content: content(), autoResolveMinigames: true });
    engine.init(odSetup());
    let d = engine.nextDecision();
    for (let i = 0; i < 20; i++) {
      if (d.kind === 'player-input') {
        if (d.actorId === 'tidus') {
          const events = engine.submit({ kind: 'overdrive', id: 'blitz-ace', targets: ['dummy'] });
          expect(events.some((e) => e.type === 'minigame-request')).toBe(false);
          expect(events.some((e) => e.type === 'damage')).toBe(true);
          return;
        }
        engine.submit(alwaysAttack(d));
      }
      d = engine.nextDecision();
    }
    throw new Error("Tidus never got a turn");
  });
});

describe('the Yu Pagoda healing loop (§1.4)', () => {
  it('restores exactly 1 500 with no variance, strips Zombie, and adds 20% gauge', () => {
    const engine = createFFXEngine({ content: content(), autoResolveMinigames: true });
    engine.init(
      setup({
        enemies: {
          id: 'bfa',
          game: 'ffx',
          enemies: [
            enemy({
              id: 'braskas-final-aeon',
              hp: 60000,
              stats: { ...enemy({ id: 'x' }).stats, hp: 60000, maxHp: 60000, agi: 44 },
              aiScriptId: 'none',
            }),
          ],
          parts: [
            enemy({
              id: 'yu-pagoda-left',
              stats: { ...enemy({ id: 'x' }).stats, hp: 5000, maxHp: 5000, agi: 40 },
              aiScriptId: 'yu-pagoda',
              abilityIds: ['power-wave-bfa'],
              flags: { isPart: true, partOf: 'braskas-final-aeon' },
            }),
            enemy({
              id: 'yu-pagoda-right',
              slot: 1,
              stats: { ...enemy({ id: 'x' }).stats, hp: 5000, maxHp: 5000, agi: 40 },
              aiScriptId: 'yu-pagoda',
              abilityIds: ['power-wave-bfa'],
              flags: { isPart: true, partOf: 'braskas-final-aeon' },
            }),
          ],
        },
      }),
    );

    const boss = engine.state().combatants['braskas-final-aeon'];
    if (!boss) throw new Error('fixture');
    // Give the boss a gauge to watch, and some damage to heal.
    (boss as { overdrive?: { gauge: number; mode: 'stoic'; unlockedOverdriveIds: string[] } }).overdrive = {
      gauge: 0,
      mode: 'stoic',
      unlockedOverdriveIds: [],
    };
    boss.hp = 50000;
    boss.statuses['zombie'] = {
      id: 'zombie',
      turnsRemaining: 254,
      ticksRemaining: null,
      charges: null,
      stacks: 0,
      permanent: false,
    };

    // Step until a Pagoda has taken a turn.
    for (let i = 0; i < 40; i++) {
      const d = engine.nextDecision();
      if (d.kind === 'player-input') {
        engine.submit({ kind: 'defend', targets: [] });
        continue;
      }
      if (d.kind === 'battle-over') break;
      const healed = engine.state().log.some((e) => e.type === 'damage' && e.targetId === 'braskas-final-aeon');
      if (healed) break;
    }

    const log = engine.state().log;
    const hit = log.find((e) => e.type === 'damage' && e.targetId === 'braskas-final-aeon');
    expect(hit).toBeDefined();
    // Zombie inverts the 1 500 heal into 1 500 damage — and it still strips it.
    if (hit?.type === 'damage') expect(Math.abs(hit.amount)).toBe(1500);
    expect(log.some((e) => e.type === 'status-remove' && e.status === 'zombie')).toBe(true);
    expect(
      log.some((e) => e.type === 'overdrive-gauge' && e.who === 'braskas-final-aeon' && e.to === 20),
    ).toBe(true);
  });
});

describe('mid-battle triggers', () => {
  it('fires script-trigger once and records the id', () => {
    const engine = createFFXEngine({ content: content(), autoResolveMinigames: true });
    engine.init(
      setup({
        enemies: { id: 'g', game: 'ffx', enemies: [enemy({ id: 'dummy', hp: 500 })] },
        triggers: [
          { id: 'boss-hurt', when: { type: 'hp-below', who: 'dummy', fraction: 0.9 }, once: true, script: 'hurt' },
        ],
      }),
    );
    runBattle(engine, alwaysAttack);
    const fired = engine.state().log.filter((e) => e.type === 'script-trigger');
    expect(fired).toHaveLength(1);
    expect(engine.state().firedTriggerIds).toEqual(['boss-hurt']);
  });
});

describe('escape and results', () => {
  it("refuses Escape when the formation forbids it", () => {
    const engine = createFFXEngine({ content: content() });
    engine.init(setup());
    let d = engine.nextDecision();
    while (d.kind === 'resolved') d = engine.nextDecision();
    if (d.kind !== 'player-input') throw new Error('expected player input');
    expect(d.commands.some((c) => c.command.kind === 'escape')).toBe(false);
    const events = engine.submit({ kind: 'escape', targets: [], extra: { mode: 'single' } });
    expect(events.some((e) => e.type === 'message' && e.text === "Can't escape!")).toBe(true);
  });

  it('reports victory with AP, gil and the chained nextGroupId', () => {
    const engine = createFFXEngine({ content: content(), autoResolveMinigames: true });
    engine.init(
      setup({
        chained: true,
        enemies: {
          id: 'yunalesca-1',
          game: 'ffx',
          nextGroupId: 'yunalesca-2',
          enemies: [enemy({ id: 'dummy', hp: 200 })],
        },
      }),
    );
    runBattle(engine, alwaysAttack);
    const result = engine.state().result;
    expect(result?.outcome).toBe('victory');
    expect(result?.ap).toBeGreaterThan(0);
    expect(result?.gil).toBe(50);
    expect(result?.nextGroupId).toBe('yunalesca-2');
    expect(result?.exp).toBe(0);
    expect(result?.turns).toBeGreaterThan(0);
  });
});

describe("Lulu's Fury: the spell rides on the command, not the result", () => {
  /** The real Lulu records, so the ids under test are the shipped ones. */
  function furyContent(): FFXContentRegistry {
    const reg = content();
    reg.addAbilities(Object.values(LULU_1));
    reg.addAbilities(Object.values(LULU_2));
    reg.addAbilities(Object.values(MENU_MARKERS));
    return reg;
  }

  /** Big enough that no Fury can kill it mid-sequence and truncate the count. */
  function furyDummy() {
    const base = enemy({ id: 'dummy' });
    return enemy({
      id: 'dummy',
      hp: 400000,
      stats: { ...base.stats, hp: 400000, maxHp: 400000 },
      forms: [{ name: 'dummy', spriteKey: 'dummy', hp: 400000 }],
    });
  }

  function lulusTurn(engine: ReturnType<typeof createFFXEngine>) {
    let d = engine.nextDecision();
    for (let i = 0; i < 40; i++) {
      if (d.kind === 'player-input') {
        if (d.actorId === 'lulu') return d;
        engine.submit(alwaysAttack(d));
      }
      if (d.kind === 'battle-over') break;
      d = engine.nextDecision();
    }
    throw new Error('Lulu never got a turn');
  }

  function lulusSetup() {
    return setup({
      party: party({
        members: [
          member({
            id: 'lulu',
            stats: { ...member({ id: 'x' }).stats, agi: 40, mag: 44 },
            // The shipped build really does list the bare marker here.
            overdrive: { gauge: 100, mode: 'stoic', unlockedModes: ['stoic'], unlockedOverdriveIds: ['fury'] },
          }),
          member({ id: 'yuna' }),
          member({ id: 'auron' }),
        ],
        activeSlots: ['lulu', 'yuna', 'auron'],
      }),
      enemies: { id: 'g', game: 'ffx', enemies: [furyDummy()] },
    });
  }

  it('refuses the generic marker with a clear message and does not eat the turn', () => {
    const engine = createFFXEngine({ content: furyContent() });
    engine.init(lulusSetup());
    const d = lulusTurn(engine);
    expect(d.actorId).toBe('lulu');

    const events = engine.submit({ kind: 'overdrive', id: 'fury', targets: ['dummy'] });
    const message = events.find((e) => e.type === 'message');
    expect(message).toBeDefined();
    if (message?.type === 'message') {
      expect(message.kind).toBe('system');
      expect(message.text).toContain('menu marker');
      expect(message.text).toContain('firaga-fury');
    }
    // No no-op Overdrive: nothing resolved, no minigame was opened.
    expect(events.some((e) => e.type === 'damage')).toBe(false);
    expect(events.some((e) => e.type === 'minigame-request')).toBe(false);
    // The gauge is untouched and Lulu is asked again.
    expect((engine.state().combatants['lulu'] as FFXCombatant | undefined)?.overdrive?.gauge).toBe(100);
    const again = engine.nextDecision();
    expect(again.kind).toBe('player-input');
    if (again.kind === 'player-input') expect(again.actorId).toBe('lulu');
  });

  it('resolves a specific <spell>-fury id, reading the spell from the command', () => {
    const engine = createFFXEngine({ content: furyContent() });
    engine.init(lulusSetup());
    lulusTurn(engine);

    const events = engine.submit({
      kind: 'overdrive',
      id: 'firaga-fury',
      targets: ['dummy'],
      // 15 rotations at Magic 44 buys 6 casts of a -ga tier Fury.
      extra: { kind: 'lulu-fury', fury: { sweptDegrees: 15 * 360, casts: 6 } },
    });

    // One cast per resolution attempt: a Fury cast can still miss its hit roll,
    // so count damage AND miss events rather than damage alone.
    const casts = events.filter((e) => e.type === 'damage' || e.type === 'miss');
    expect(casts.length).toBe(6);
    expect((engine.state().combatants['lulu'] as FFXCombatant | undefined)?.overdrive?.gauge).toBe(0);
    const start = events.find((e) => e.type === 'action-start');
    if (start?.type === 'action-start') expect(start.abilityId).toBe('firaga-fury');
  });

  it('derives casts from the swept angle, so Magic changes the outcome', () => {
    const play = (mag: number): number => {
      const engine = createFFXEngine({ content: furyContent() });
      engine.init(
        setup({
          party: party({
            members: [
              member({
                id: 'lulu',
                stats: { ...member({ id: 'x' }).stats, agi: 40, mag },
                overdrive: { gauge: 100, mode: 'stoic', unlockedModes: ['stoic'], unlockedOverdriveIds: ['fury'] },
              }),
              member({ id: 'yuna' }),
              member({ id: 'auron' }),
            ],
            activeSlots: ['lulu', 'yuna', 'auron'],
          }),
          enemies: { id: 'g', game: 'ffx', enemies: [furyDummy()] },
        }),
      );
      lulusTurn(engine);
      const events = engine.submit({
        kind: 'overdrive',
        id: 'fire-fury',
        targets: ['dummy'],
        extra: { kind: 'lulu-fury', fury: { sweptDegrees: 15 * 360, casts: 0 } },
      });
      return events.filter((e) => e.type === 'damage' || e.type === 'miss').length;
    };
    // Published tier-1 anchors: 7 casts at Magic 0, 16 at Magic 255.
    expect(play(0)).toBe(7);
    expect(play(255)).toBe(16);
  });
});
