/**
 * Yu Yevon's Curaga counter and Gravija's reach [ffx-bfa-yu-yevon §3.3, §3.4.1,
 * §3.5].
 *
 * Two sourced defects round 03 raised as blockers (#15, #16a):
 *
 * 1. §3.4.1 rules the counter "at most **one Curaga per player-side action**
 *    that deals him damage", and its table scores every enemy-side row at
 *    **0** — Gravija's self-damage, a Yu Pagoda's Power Wave, and the counter's
 *    own Zombie-inverted damage. The engine never looked at `attacker.side`, so
 *    each Power Wave from one of his own Pagodas healed him 9,999.
 * 2. §3.3 says Gravija "removes exactly 75% of current HP from **every target
 *    on the field** — including Yu Yevon himself" `[verified: 2 sources]`. The
 *    AI script hand-built the list as party-plus-self, so the two Pagodas were
 *    never in it; kept at full HP they healed him faster than he whittled
 *    himself down and §3.5's attrition route could not be reached.
 *
 * Game case: **FFX only**. The formation, the counter and Gravija are all
 * Chapter 3 content; FFX-2 has no counter of this shape. The `attacker.side`
 * guard itself is shared plumbing and sits in the FFX reaction collector, which
 * FFX-2 does not use.
 */

import { describe, expect, it } from 'vitest';
import type { Command, Decision, FFXCombatant } from '../../src/battle/common/types.ts';
import { FFXContentRegistry, createFFXEngine } from '../../src/battle/ffx/index.ts';
import { ALL_ABILITIES, ENEMY_GROUPS_BY_ID, ITEMS } from '../../src/data/ffx/index.ts';
import { dreamsEndBuild } from '../../src/data/ffx/builds/dreams-end.ts';

function content(): FFXContentRegistry {
  const c = new FFXContentRegistry();
  c.addAbilities(ALL_ABILITIES);
  c.addItems(Object.values(ITEMS));
  return c;
}

function boot(seed: number): ReturnType<typeof createFFXEngine> {
  const group = ENEMY_GROUPS_BY_ID['yu-yevon'];
  if (!group) throw new Error('no yu-yevon group');
  const engine = createFFXEngine({ content: content(), autoResolveMinigames: true });
  engine.init({
    game: 'ffx',
    party: dreamsEndBuild,
    enemies: group,
    triggers: [],
    seed,
    condition: 'normal',
    canEscape: false,
  });
  return engine;
}

function combatant(engine: ReturnType<typeof boot>, id: string): FFXCombatant {
  const c = (engine.state().combatants as Record<string, FFXCombatant>)[id];
  if (!c) throw new Error(`no combatant ${id}`);
  return c;
}

function defend(engine: ReturnType<typeof boot>, d: Decision & { kind: 'player-input' }): void {
  const rows = d.commands.filter((c) => c.enabled);
  const def = rows.find((c) => c.command.kind === 'defend');
  engine.submit((def?.command ?? rows[0]?.command ?? { kind: 'attack', targets: [] }) as Command);
}

interface Run {
  curagas: number;
  gravijas: number;
  pagodaHitByGravija: boolean;
  bossFloor: number;
  turns: number;
  outcome: string;
}

/**
 * A defend-only line: the party never deals damage, so under §3.4.1 nothing on
 * the field may provoke a single Curaga.
 */
function defendOnly(seed: number, maxTurns: number): Run {
  const engine = boot(seed);
  const boss = combatant(engine, 'yu-yevon');
  const run: Run = {
    curagas: 0,
    gravijas: 0,
    pagodaHitByGravija: false,
    bossFloor: boss.hp,
    turns: 0,
    outcome: 'none',
  };
  let lastAbility = '';

  for (let i = 0; i < 40000; i++) {
    const d = engine.nextDecision();
    if (d.kind === 'battle-over') {
      run.outcome = d.result.outcome;
      break;
    }
    if (d.kind === 'player-input') {
      defend(engine, d);
    } else if (d.kind === 'resolved') {
      for (const ev of d.events) {
        if (ev.type === 'action-start') {
          lastAbility = ev.abilityId ?? '';
          if (lastAbility === 'gravija') run.gravijas += 1;
        }
        if (ev.type === 'counter' && ev.abilityId === 'curaga' && ev.actorId === 'yu-yevon') {
          run.curagas += 1;
        }
        if (ev.type === 'damage' && lastAbility === 'gravija' && ev.targetId.startsWith('yu-pagoda')) {
          run.pagodaHitByGravija = true;
        }
      }
    }
    run.bossFloor = Math.min(run.bossFloor, boss.hp);
    run.turns = engine.state().turn;
    if (run.turns > maxTurns) break;
  }
  return run;
}

describe('Yu Yevon counters only player-side actions (§3.4.1)', () => {
  it('a defend-only line draws zero Curagas', () => {
    const run = defendOnly(4, 400);
    expect(run.gravijas, 'he never got to cast Gravija').toBeGreaterThan(0);
    expect(run.curagas, 'his own side provoked his 9,999 counter').toBe(0);
  });

  it('a party attack still draws exactly one Curaga per action', () => {
    const engine = boot(1);
    let attacks = 0;

    for (let i = 0; i < 40000; i++) {
      const d = engine.nextDecision();
      if (d.kind === 'battle-over') break;
      if (d.kind === 'player-input') {
        const rows = d.commands.filter((c) => c.enabled);
        const at = rows.find((c) => c.command.kind === 'attack');
        if (at && attacks < 3) {
          attacks += 1;
          engine.submit({ kind: 'attack', targets: ['yu-yevon'] } as Command);
        } else {
          defend(engine, d);
        }
      }
      if (attacks >= 3 && engine.state().turn > 40) break;
    }

    // Counters fired inside the player's own action land in `state().log`,
    // which `submit` drains into rather than re-delivering as a decision.
    const curagas = engine
      .state()
      .log.filter((ev) => ev.type === 'counter' && ev.abilityId === 'curaga' && ev.actorId === 'yu-yevon').length;

    expect(attacks).toBe(3);
    expect(curagas, 'one Curaga per player-side damaging action').toBe(3);
  });
});

describe('Gravija reaches every target on the field (§3.3)', () => {
  it('the Yu Pagodas take Gravija damage too', () => {
    const run = defendOnly(4, 200);
    expect(run.gravijas).toBeGreaterThan(0);
    expect(run.pagodaHitByGravija, 'Gravija skipped his own Pagodas').toBe(true);
  });

  it('§3.5’s attrition route wins: suppress the Pagodas, wait, then one hit', () => {
    // §3.5: "Keep both Pagodas suppressed and simply wait: Gravija damages Yu
    // Yevon himself for 75% of his own current HP each cast. When Gravija
    // starts showing 0, he is at 1 HP and any hit finishes him." §3.3 adds that
    // Gravija "cannot KO (75% of current can never reach 0)", which is why the
    // floor is 1 and why a hit is still needed.
    //
    // Before the fix this line could not exist: Gravija never touched the
    // Pagodas, and every Power Wave they aimed at him returned a 9,999 Curaga,
    // so he parked at 4,801 and the battle ended on the stalemate guard.
    const engine = boot(4);
    const boss = combatant(engine, 'yu-yevon');
    const pagodaIds = ['yu-pagoda-left', 'yu-pagoda-right'];
    let attritionFloor = boss.hp;
    let outcome = 'none';

    for (let i = 0; i < 60000; i++) {
      const d = engine.nextDecision();
      if (d.kind === 'battle-over') {
        outcome = d.result.outcome;
        break;
      }
      if (d.kind === 'player-input') {
        const rows = d.commands.filter((c) => c.enabled);
        const canAttack = rows.some((c) => c.command.kind === 'attack');
        const standing = pagodaIds.filter((id) => {
          const p = combatant(engine, id);
          return p.alive && p.hp > 0 && !p.removed;
        });
        if (canAttack && boss.hp <= 1) {
          // Everything up to here was his own Gravija: this is the "any hit
          // finishes him" step, so freeze what attrition alone achieved.
          attritionFloor = Math.min(attritionFloor, boss.hp);
          engine.submit({ kind: 'attack', targets: ['yu-yevon'] } as Command);
        } else if (canAttack && standing.length > 0) {
          engine.submit({ kind: 'attack', targets: [standing[0] as string] } as Command);
        } else {
          defend(engine, d);
        }
      }
      if (boss.hp > 0) attritionFloor = Math.min(attritionFloor, boss.hp);
      if (engine.state().turn > 900) break;
    }

    expect(attritionFloor, `Gravija alone took him to ${attritionFloor} of 99,999`).toBe(1);
    expect(outcome, 'the documented attrition route did not end the battle').toBe('victory');
  });
});
