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
 * **Superseded in part, 2026-10-09 (re-parity AI lane B, FFX only;
 * `research/re-ffx-ai-yunalesca-bfa.md` section 6, rows V2, V4 and V5).** Read from his
 * own script: (1) his Gravija is `performCommand(group, Gravija)` on a group built
 * from the front line plus himself, so his Yu Pagodas are NOT in it (blocker #16a's
 * reading, "every target on the field", was the wiki's); (2) his Curaga counter is
 * his `onHit`, raised for every sub-action that dealt him HP damage from anyone
 * but himself, so a Yu Pagoda's Power Wave on a Zombie Yu Yevon (1,500 damage after
 * the inversion) counts and draws a Curaga; a heal, a miss and his own Gravija still
 * do not. What these tests keep: a defend-only party draws zero Curagas, a party
 * attack draws one per damaging action, and the attrition route still ends the fight.
 *
 * Game case: **FFX only**. The formation, the counter and Gravija are all
 * Chapter 3 content; FFX-2 has no counter of this shape.
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
  yevonHitByGravija: boolean;
  partyHitByGravija: boolean;
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
    yevonHitByGravija: false,
    partyHitByGravija: false,
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
        if (ev.type === 'damage' && lastAbility === 'gravija' && ev.targetId === 'yu-yevon') run.yevonHitByGravija = true;
        if (ev.type === 'damage' && lastAbility === 'gravija' && ['tidus', 'yuna', 'auron'].includes(ev.targetId)) {
          run.partyHitByGravija = true;
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
    // which `submit` drains into rather than re-delivering as a decision. Each is
    // filed under the action it followed.
    const answered: string[] = [];
    let provoker = '';
    for (const ev of engine.state().log) {
      if (ev.type === 'action-start') provoker = ev.actorId;
      if (ev.type === 'counter' && ev.abilityId === 'curaga' && ev.actorId === 'yu-yevon') answered.push(provoker);
    }
    const party = ['tidus', 'yuna', 'auron'];

    expect(attacks).toBe(3);
    expect(answered.filter((who) => party.includes(who)), 'one Curaga per player-side damaging action').toHaveLength(3);
    // Re-parity AI lane B (row V5): this party's weapons put Zombie on him, and a Yu Pagoda's Power Wave on a Zombie Yu
    // Yevon is 1,500 damage once the heal is inverted, which the game counts (his hook strips the Zombie, then tests the
    // damage). Nothing else on his side may provoke him: his own Gravija and Curaga never do.
    for (const who of answered.filter((w) => !party.includes(w))) expect(who, 'only a Pagoda’s Power Wave counts').toMatch(/^yu-pagoda/);
  });
});

describe('Gravija reaches the front line and Yu Yevon himself, and not his Pagodas (m176 f2, row V2)', () => {
  it('the party and Yu Yevon take Gravija damage, the Yu Pagodas do not', () => {
    const run = defendOnly(4, 200);
    expect(run.gravijas).toBeGreaterThan(0);
    expect(run.partyHitByGravija, 'the front line is in the group').toBe(true);
    expect(run.yevonHitByGravija, 'so is he (addToMatchingGroup(20))').toBe(true);
    expect(run.pagodaHitByGravija, 'his Pagodas are not in the group the script builds').toBe(false);
  });

  it('§3.5’s attrition route wins: wait for Gravija to bring him low, then one hit', () => {
    // §3.5: "Keep both Pagodas suppressed and simply wait: Gravija damages Yu
    // Yevon himself for 75% of his own current HP each cast. When Gravija
    // starts showing 0, he is at 1 HP and any hit finishes him." §3.3 adds that
    // Gravija "cannot KO (75% of current can never reach 0)", which is why a hit
    // is still needed.
    //
    // Re-parity AI lane B (2026-10-09, rows V1, V2 and P4): from his own script, he casts Gravija on every turn after
    // his first (9,999 at most while he is high, then 75% of what is left), his Pagodas are not in the group, and a
    // Pagoda returns with every point it absorbed in its last life, so "suppressing" them gets dearer each time and
    // this party does not try. What happens instead is that he comes down to the Pagoda equilibrium, a few hundred to a
    // thousand HP, where 1,500 per Power Wave and 75% per Gravija trade blows, and any swing worth that much finishes
    // him: the Curaga his hook queues is refused by the death check that follows it. So the line below only waits
    // (Defend) and swings once he is under 1,000.
    const engine = boot(4);
    const boss = combatant(engine, 'yu-yevon');
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
        if (canAttack && boss.hp <= 1_000) {
          // Everything up to here was his own Gravija: this is the "any hit
          // finishes him" step, so freeze what attrition alone achieved.
          attritionFloor = Math.min(attritionFloor, boss.hp);
          engine.submit({ kind: 'attack', targets: ['yu-yevon'] } as Command);
        } else {
          defend(engine, d);
        }
      }
      if (boss.hp > 0) attritionFloor = Math.min(attritionFloor, boss.hp);
      if (engine.state().turn > 900) break;
    }

    expect(attritionFloor, `Gravija alone took him to ${attritionFloor} of 99,999`).toBeLessThanOrEqual(1_000);
    expect(outcome, 'the documented attrition route did not end the battle').toBe('victory');
  });
});
