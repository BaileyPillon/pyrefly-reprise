/**
 * Boss rotations: Seymour Flux's shared 6-step cycle and charge ladder,
 * Yunalesca's form cycles and Zombie weighting, and Braska's Final Aeon's
 * precedence order.
 *
 * These drive the scripts directly rather than through a whole battle, so a
 * rotation assertion fails for rotation reasons and not because a stray crit
 * moved a threshold.
 */

import { describe, expect, it } from 'vitest';
import type { BattleEvent, BattleSetup, Command, FFXCombatant } from '../../src/battle/common/types.ts';
import {
  aiContextFor,
  buildBattle,
  chooseAiCommand,
  type Ctx,
  FFXContentRegistry,
  applyStatus,
  resolveTargets,
} from '../../src/battle/ffx/index.ts';
import { SeededRng } from '../../src/battle/common/rng.ts';
import { ability, enemy, setup } from './ffx-fixtures.test.ts';

const BOSS_ABILITY_IDS = [
  'lance-of-atrophy',
  'full-life',
  'cross-cleave',
  'dispel',
  'flare-self',
  'reflect',
  'protect',
  'banish',
  'slowga',
  'total-annihilation',
  'dispelling-slap',
  'absorb',
  'hellbiter',
  'cura',
  'curaga',
  'regen',
  'mind-blast',
  'mega-death',
  'osmose',
  'blade-blitz',
  'left-arm-strike',
  'left-arm-strike-2',
  'jecht-beam',
  'triumphant-grasp',
  'ultimate-jecht-shot',
  'jecht-bomber',
];

/** Every boss action as an inert record, so the rotation is what is under test. */
function bossContent(): FFXContentRegistry {
  const reg = new FFXContentRegistry();
  reg.addAbilities(BOSS_ABILITY_IDS.map((id) => ability({ id, name: id, category: 'enemy' })));
  return reg;
}

function makeCtx(overrides: Partial<BattleSetup>): { ctx: Ctx; events: BattleEvent[] } {
  const s = setup(overrides);
  const events: BattleEvent[] = [];
  let seq = 0;
  const ctx = buildBattle(s, new SeededRng(s.seed), bossContent(), (e) => {
    events.push({ ...e, seq: seq++ } as BattleEvent);
  });
  return { ctx, events };
}

function at(ctx: Ctx, id: string): FFXCombatant {
  const c = ctx.state.combatants[id];
  if (!c) throw new Error(`no combatant ${id}`);
  return c as FFXCombatant;
}

function idOf(command: Command | null): string {
  if (command === null) return 'pass';
  if (command.kind === 'ability') return command.id;
  return command.kind;
}

// ---------------------------------------------------------------------------
// Seymour Flux
// ---------------------------------------------------------------------------

function seymourCtx() {
  return makeCtx({
    enemies: {
      id: 'seymour-flux',
      game: 'ffx',
      enemies: [
        enemy({
          id: 'seymour-flux',
          stats: { ...enemy({ id: 'x' }).stats, hp: 70000, maxHp: 70000, agi: 38 },
          hp: 70000,
          aiScriptId: 'seymour-flux',
          abilityIds: BOSS_ABILITY_IDS,
        }),
        enemy({
          id: 'mortiorchis',
          slot: 1,
          stats: { ...enemy({ id: 'x' }).stats, hp: 4000, maxHp: 4000, agi: 38 },
          hp: 4000,
          aiScriptId: 'mortiorchis',
          abilityIds: BOSS_ABILITY_IDS,
        }),
      ],
    },
  });
}

describe('Seymour Flux (§4)', () => {
  it('runs the shared 6-step phase-1 cycle, alternating the two actors', () => {
    const { ctx } = seymourCtx();
    const order: string[] = [];
    const actors = ['seymour-flux', 'mortiorchis'];
    for (let i = 0; i < 6; i++) {
      const actor = at(ctx, actors[i % 2] as string);
      order.push(idOf(chooseAiCommand(ctx, actor)));
    }
    expect(order).toEqual([
      'lance-of-atrophy',
      'full-life',
      'lance-of-atrophy',
      'full-life',
      'dispel',
      'cross-cleave',
    ]);
  });

  it('does nothing on a second consecutive turn (§4.1 alternation guard)', () => {
    const { ctx } = seymourCtx();
    const seymour = at(ctx, 'seymour-flux');
    expect(idOf(chooseAiCommand(ctx, seymour))).toBe('lance-of-atrophy');
    expect(chooseAiCommand(ctx, seymour)).toBeNull();
  });

  it('Full-Life prefers a zombified member, and whiffs on a living one', () => {
    const { ctx } = seymourCtx();
    const tidus = at(ctx, 'tidus');
    applyStatus(ctx, undefined, tidus, { status: 'zombie', chance: 255, duration: 254 });
    // Advance the shared counter to the mount's Full-Life step.
    ctx.state.flags['seymour.p1Step'] = 1;
    ctx.state.flags['seymour.lastEnemyActor'] = 'seymour-flux';
    const command = chooseAiCommand(ctx, at(ctx, 'mortiorchis'));
    expect(idOf(command)).toBe('full-life');
    expect(command?.targets).toEqual(['tidus']);
  });

  it('holds the Total Annihilation ladder while an aeon is on the field (§4.4.2)', () => {
    const { ctx } = seymourCtx();
    at(ctx, 'seymour-flux').hp = 30000; // phase 2
    ctx.state.aeonId = 'valefor';
    ctx.state.flags['seymour.lastEnemyActor'] = 'seymour-flux';
    expect(chooseAiCommand(ctx, at(ctx, 'mortiorchis'))).toBeNull();
    expect(ctx.state.flags['seymour.chargeTurns'] ?? 0).toBe(0);
  });

  it('charges twice for the first Total Annihilation and once thereafter', () => {
    const { ctx, events } = seymourCtx();
    at(ctx, 'seymour-flux').hp = 30000; // phase 2
    const mount = at(ctx, 'mortiorchis');
    const step = (): string => {
      ctx.state.flags['seymour.lastEnemyActor'] = 'seymour-flux';
      return idOf(chooseAiCommand(ctx, mount));
    };
    expect(step()).toBe('pass'); // Auto-Attack Mode
    expect(step()).toBe('pass'); // Ready To Annihilate
    expect(step()).toBe('total-annihilation');
    // It stays in Auto-Attack Mode, so the next use costs only one charge turn.
    expect(step()).toBe('pass');
    expect(step()).toBe('total-annihilation');

    const charges = events.filter((e) => e.type === 'charge');
    expect(charges).toHaveLength(3);
    if (charges[0]?.type === 'charge') {
      expect(charges[0].name).toBe('Auto-Attack Mode');
      expect(charges[0].stage).toBe(1);
    }
    if (charges[1]?.type === 'charge') {
      expect(charges[1].name).toBe('Ready To Annihilate');
      expect(charges[1].stage).toBe(2);
    }
  });

  it('Banishes an aeon only after it has taken one turn (§4.5)', () => {
    const { ctx } = seymourCtx();
    ctx.state.aeonId = 'valefor';
    ctx.state.combatants['valefor'] = at(ctx, 'tidus');
    const seymour = at(ctx, 'seymour-flux');
    // The aeon has not acted yet: he takes a normal turn instead.
    expect(idOf(chooseAiCommand(ctx, seymour))).not.toBe('banish');
    const aeonRt = ctx.rt.actors.get('valefor');
    if (aeonRt) aeonRt.turnsTaken = 1;
    ctx.state.flags['seymour.lastEnemyActor'] = 'mortiorchis';
    expect(idOf(chooseAiCommand(ctx, seymour))).toBe('banish');
  });

  it('loops Flare -> wait -> Flare while Reflect holds, and it is flare-self (§4.4.1)', () => {
    const { ctx } = seymourCtx();
    const seymour = at(ctx, 'seymour-flux');
    seymour.hp = 30000;
    applyStatus(ctx, undefined, seymour, { status: 'reflect', chance: 255, duration: 254 });
    const step = (): Command | null => {
      ctx.state.flags['seymour.lastEnemyActor'] = 'mortiorchis';
      return chooseAiCommand(ctx, seymour);
    };
    // The encounter's own record, not the player's Blk Magic `flare`: power 80,
    // `self`, `extra.selfTargetBounce`. Casting the player's row measured 927
    // on Yuna against §5.2's 1,900-2,100 band and made §5.3's self-damage case
    // unreachable.
    const flare = step();
    expect(idOf(flare)).toBe('flare-self');
    expect(flare?.targets).toEqual(['seymour-flux']);
    // §4.4.1: one free turn on the turn he would recast Reflect — and then the
    // loop restarts. It used to stop here for ever: ten phase-2 turns on seed 1
    // contained exactly one Flare and nine threshold counters / waits.
    expect(step()).toBeNull(); // "Seymour waits"
    expect(idOf(step())).toBe('flare-self');
    expect(step()).toBeNull();
    expect(idOf(step())).toBe('flare-self');
  });
});

// ---------------------------------------------------------------------------
// Yunalesca
// ---------------------------------------------------------------------------

function yunalescaCtx(formIndex = 0) {
  const result = makeCtx({
    enemies: {
      id: 'yunalesca',
      game: 'ffx',
      enemies: [
        enemy({
          id: 'yunalesca',
          stats: { ...enemy({ id: 'x' }).stats, hp: 24000, maxHp: 24000, agi: 40 },
          hp: 24000,
          aiScriptId: 'yunalesca',
          abilityIds: BOSS_ABILITY_IDS,
          forms: [
            { name: 'Yunalesca', spriteKey: 'y1', hp: 24000 },
            { name: 'Yunalesca', spriteKey: 'y2', hp: 48000 },
            { name: 'Yunalesca', spriteKey: 'y3', hp: 60000 },
          ],
        }),
      ],
    },
  });
  const fields = at(result.ctx, 'yunalesca').enemy;
  if (fields) fields.formIndex = formIndex;
  return result;
}

describe('Yunalesca (§5)', () => {
  it('Form I alternates Dispelling Slap and Absorb, starting with the Slap', () => {
    const { ctx } = yunalescaCtx(0);
    const boss = at(ctx, 'yunalesca');
    expect(idOf(chooseAiCommand(ctx, boss))).toBe('dispelling-slap');
    expect(idOf(chooseAiCommand(ctx, boss))).toBe('absorb');
    expect(idOf(chooseAiCommand(ctx, boss))).toBe('dispelling-slap');
  });

  it('Absorb targets the highest CURRENT HP frontline member', () => {
    const { ctx } = yunalescaCtx(0);
    const boss = at(ctx, 'yunalesca');
    at(ctx, 'tidus').hp = 400;
    at(ctx, 'yuna').hp = 1900;
    at(ctx, 'auron').hp = 900;
    chooseAiCommand(ctx, boss); // burn the Slap
    const absorb = chooseAiCommand(ctx, boss);
    expect(idOf(absorb)).toBe('absorb');
    expect(absorb?.targets).toEqual(['yuna']);
  });

  it('Form II opens with a guaranteed heal after the transformation (§5.2)', () => {
    const { ctx } = yunalescaCtx(1);
    const boss = at(ctx, 'yunalesca');
    const first = idOf(chooseAiCommand(ctx, boss));
    expect(['cura', 'regen']).toContain(first);
  });

  it('Form II never Hellbiters when all three slots are Zombied', () => {
    const { ctx } = yunalescaCtx(1);
    const boss = at(ctx, 'yunalesca');
    for (const id of ['tidus', 'yuna', 'auron']) {
      applyStatus(ctx, undefined, at(ctx, id), { status: 'zombie', chance: 255, duration: 254 });
    }
    ctx.rt.actors.get('yunalesca')!.ai['priv0004'] = 2;
    const picked = new Set<string>();
    for (let i = 0; i < 100; i++) picked.add(idOf(chooseAiCommand(ctx, boss)));
    expect(picked.has('hellbiter')).toBe(false);
    expect([...picked].every((id) => id === 'cura' || id === 'regen')).toBe(true);
  });

  it('Form II Hellbiters about 90% of the time with nobody Zombied', () => {
    const { ctx } = yunalescaCtx(1);
    const boss = at(ctx, 'yunalesca');
    ctx.rt.actors.get('yunalesca')!.ai['priv0004'] = 2;
    let hellbiters = 0;
    for (let i = 0; i < 500; i++) if (idOf(chooseAiCommand(ctx, boss)) === 'hellbiter') hellbiters++;
    expect(hellbiters / 500).toBeGreaterThan(0.82);
    expect(hellbiters / 500).toBeLessThan(0.97);
  });

  it('counts Zombie on SLOTS, so a KO’d zombie still suppresses Hellbiter', () => {
    const { ctx } = yunalescaCtx(1);
    const boss = at(ctx, 'yunalesca');
    ctx.rt.actors.get('yunalesca')!.ai['priv0004'] = 2;
    for (const id of ['tidus', 'yuna', 'auron']) {
      const c = at(ctx, id);
      applyStatus(ctx, undefined, c, { status: 'zombie', chance: 255, duration: 254 });
    }
    // KO one of them outright; the Zombie stays on the slot.
    const downed = at(ctx, 'auron');
    downed.hp = 0;
    downed.alive = false;
    let hellbiters = 0;
    for (let i = 0; i < 200; i++) if (idOf(chooseAiCommand(ctx, boss)) === 'hellbiter') hellbiters++;
    expect(hellbiters).toBe(0);
  });

  it('Form III runs the five-step ring: Mind Blast at step 2, Mega Death at step 4', () => {
    const { ctx } = yunalescaCtx(2);
    const boss = at(ctx, 'yunalesca');
    const mem = ctx.rt.actors.get('yunalesca')!.ai;
    mem['priv0004'] = 2;
    expect(idOf(chooseAiCommand(ctx, boss))).toBe('mind-blast');
    expect(mem['priv0004']).toBe(3);
    mem['priv0004'] = 4;
    expect(idOf(chooseAiCommand(ctx, boss))).toBe('mega-death');
    expect(mem['priv0004']).toBe(0);
  });

  it('freezes the human cycle while an aeon is out and runs the aeon branch', () => {
    const { ctx } = yunalescaCtx(2);
    const boss = at(ctx, 'yunalesca');
    const mem = ctx.rt.actors.get('yunalesca')!.ai;
    mem['priv0004'] = 4; // a Mega Death is queued
    ctx.state.aeonId = 'valefor';
    ctx.state.combatants['valefor'] = at(ctx, 'tidus');
    expect(idOf(chooseAiCommand(ctx, boss))).not.toBe('mega-death');
    expect(mem['priv0004']).toBe(4); // postponed, not deleted
    ctx.state.aeonId = null;
    expect(idOf(chooseAiCommand(ctx, boss))).toBe('mega-death');
  });
});

// ---------------------------------------------------------------------------
// Braska's Final Aeon
// ---------------------------------------------------------------------------

describe("Braska's Final Aeon (§1.6)", () => {
  function bfaCtx(formIndex = 0) {
    const result = makeCtx({
      enemies: {
        id: 'bfa',
        game: 'ffx',
        enemies: [
          enemy({
            id: 'braskas-final-aeon',
            stats: { ...enemy({ id: 'x' }).stats, hp: 60000, maxHp: 60000, agi: 44 },
            hp: 60000,
            aiScriptId: 'bfa-form-1',
            abilityIds: BOSS_ABILITY_IDS,
            forms: [
              { name: "Braska's Final Aeon", spriteKey: 'bfa1', hp: 60000, aiScriptId: 'bfa-form-1' },
              { name: "Braska's Final Aeon", spriteKey: 'bfa2', hp: 120000, aiScriptId: 'bfa-form-2' },
            ],
          }),
        ],
      },
    });
    const boss = at(result.ctx, 'braskas-final-aeon');
    if (boss.enemy) boss.enemy.formIndex = formIndex;
    boss.overdrive = { gauge: 0, mode: 'stoic', unlockedOverdriveIds: [] };
    return { ...result, boss };
  }

  it('spends a full gauge before anything else', () => {
    const { ctx, boss } = bfaCtx(0);
    boss.overdrive!.gauge = 100;
    expect(idOf(chooseAiCommand(ctx, boss))).toBe('triumphant-grasp');
  });

  it('overrides the Overdrive branch to Jecht Bomber while an aeon is out', () => {
    const { ctx, boss } = bfaCtx(0);
    boss.overdrive!.gauge = 100;
    ctx.state.aeonId = 'valefor';
    ctx.state.combatants['valefor'] = at(ctx, 'tidus');
    expect(idOf(chooseAiCommand(ctx, boss))).toBe('jecht-bomber');
  });

  it('fires Ultimate Jecht Shot in form 2 below half HP', () => {
    const { ctx, boss } = bfaCtx(1);
    boss.stats.maxHp = 120000;
    boss.hp = 50000;
    boss.overdrive!.gauge = 100;
    expect(idOf(chooseAiCommand(ctx, boss))).toBe('ultimate-jecht-shot');
  });

  it('opens form 2 with Blade Blitz, once', () => {
    const { ctx, boss } = bfaCtx(1);
    boss.stats.maxHp = 120000;
    boss.hp = 120000;
    expect(idOf(chooseAiCommand(ctx, boss))).toBe('blade-blitz');
    const second = idOf(chooseAiCommand(ctx, boss));
    expect(['left-arm-strike-2', 'jecht-beam', 'blade-blitz']).toContain(second);
  });

  it('loses the turn after Talk, with the gauge already zeroed', () => {
    const { ctx, boss } = bfaCtx(0);
    ctx.state.flags['bfa.talkPending'] = true;
    expect(chooseAiCommand(ctx, boss)).toBeNull();
    expect(ctx.state.flags['bfa.talkPending']).toBe(false);
  });

  it('never rolls a Left-Arm Strike below half HP in form 2', () => {
    const { ctx, boss } = bfaCtx(1);
    boss.stats.maxHp = 120000;
    boss.hp = 40000;
    ctx.state.flags['bfa.form2Opened'] = true;
    const picked = new Set<string>();
    for (let i = 0; i < 200; i++) picked.add(idOf(chooseAiCommand(ctx, boss)));
    expect(picked.has('left-arm-strike-2')).toBe(false);
    expect(picked.has('blade-blitz')).toBe(true);
    expect(picked.has('jecht-beam')).toBe(true);
  });
});

// ---------------------------------------------------------------------------
// Yu Yevon
// ---------------------------------------------------------------------------

describe('Yu Yevon (§3.4)', () => {
  it('alternates a scripted no-op with Gravija, which also hits himself', async () => {
    const { ctx } = makeCtx({
      enemies: {
        id: 'yy',
        game: 'ffx',
        enemies: [
          enemy({
            id: 'yu-yevon',
            stats: { ...enemy({ id: 'x' }).stats, hp: 99999, maxHp: 99999, agi: 44 },
            hp: 99999,
            aiScriptId: 'yu-yevon',
            abilityIds: ['gravija', 'curaga', 'osmose', 'ultima'],
          }),
        ],
      },
    });
    const reg = new FFXContentRegistry();
    reg.addAbilities(['gravija', 'curaga', 'osmose', 'ultima'].map((id) => ability({ id, name: id, category: 'enemy' })));
    ctx.content.addAbilities(['gravija', 'curaga', 'osmose', 'ultima'].map((id) => ability({ id, name: id, category: 'enemy' })));
    const boss = at(ctx, 'yu-yevon');
    expect(chooseAiCommand(ctx, boss)).toBeNull();
    const gravija = chooseAiCommand(ctx, boss);
    expect(idOf(gravija)).toBe('gravija');

    // §3.3: Gravija "removes exactly 75% of current HP from **every target on
    // the field** — including Yu Yevon himself" `[verified: 2 sources]`. The
    // script used to hand-build that list as party-plus-self, which quietly
    // left his two Yu Pagodas out of his own blast (round 03 blocker #16a). It
    // now submits an empty list and lets `targeting.ts` expand the shipped
    // record's `targeting: 'all'` over the whole field, so the reach is
    // asserted on the resolved targets and on the record, not on the command.
    expect(gravija?.targets, 'the script must defer to the record').toEqual([]);
    const { gravija: gravijaDef } = await import(
      '../../src/data/ffx/enemies/braskas-final-aeon-abilities.ts'
    );
    expect(gravijaDef.targeting).toBe('all');
    expect(gravijaDef.extra?.['includesUser']).toBe(true);
    const reach = resolveTargets(ctx, boss, gravijaDef, gravija?.targets ?? []).map((c) => c.id);
    expect(reach, 'Gravija must catch Yu Yevon himself').toContain('yu-yevon');

    expect(chooseAiCommand(ctx, boss)).toBeNull();
  });

  it('queues Osmose then Ultima after seven counter-Curagas', async () => {
    const { yuYevonCounter } = await import('../../src/battle/ffx/ai/index.ts');
    const { ctx } = makeCtx({
      enemies: {
        id: 'yy',
        game: 'ffx',
        enemies: [enemy({ id: 'yu-yevon', aiScriptId: 'yu-yevon', abilityIds: [] })],
      },
    });
    ctx.content.addAbilities(
      ['gravija', 'curaga', 'osmose', 'ultima'].map((id) => ability({ id, name: id, category: 'enemy' })),
    );
    const boss = at(ctx, 'yu-yevon');
    const ai = aiContextFor(ctx, boss);
    for (let i = 0; i < 7; i++) expect(idOf(yuYevonCounter(ai))).toBe('curaga');
    expect(idOf(chooseAiCommand(ctx, boss))).toBe('osmose');
    expect(idOf(chooseAiCommand(ctx, boss))).toBe('ultima');
  });
});
