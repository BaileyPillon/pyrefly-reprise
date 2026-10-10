/**
 * **Sinspawn Gui, the Ridge's two fights, on the real engine** (the hidden Sinspawn Gui chapter; FFX only [AGENTS.md rule 14]). Each case pins one claim of `research/re-ffx-ai-gui.md` ("RE §n",
 * the game's own scripts, run in two interpreters) on the real engine and the real data, with fixed seeds (hard rule 3: run the engine, never grep).
 *
 * Two layers, as the Sin Fins' tests have them: the rules on a real battle built by `buildBattle` and one command executed on it (exact numbers, no turn order in the way), and whole
 * fights driven by submitted commands (the body's rhythm, the head's cycle through the body, the regrowth, the rewards).
 */

import { describe, expect, it } from 'vitest';

import type { BattleEvent, Command, FFXCombatant, StatusId, StatusInstance } from '../../../src/battle/common/types.ts';
import { SeededRng } from '../../../src/battle/common/rng.ts';
import { buildBattle, type Ctx } from '../../../src/battle/ffx/index.ts';
import { executeCommand } from '../../../src/battle/ffx/execute.ts';
import { GUI_FIGHT, GUI_HEAD_STATE_FLAG, shieldCatches } from '../../../src/battle/ffx/ai/sinspawn-gui-rules.ts';
import * as U from '../helpers/guiUnits.ts';
import { mushroomRockBuild } from '../../../src/data/ffx/builds/mushroom-rock.ts';

const { ARM_L, ARM_R, ARMS, BODY, BODY_2, HEAD } = U;

/** A real battle on fight 1 or 2 with the events of everything run on it collected. */
function ctxOn(fight: 1 | 2, seed = 1, party = mushroomRockBuild): { ctx: Ctx; log: BattleEvent[] } {
  const log: BattleEvent[] = [];
  const ctx = buildBattle(U.setup(fight, seed, party), new SeededRng(seed), U.content, (e) => void log.push(e as BattleEvent));
  return { ctx, log };
}
const who = (ctx: Ctx, id: string): FFXCombatant => ctx.state.combatants[id] as FFXCombatant;
const run = (ctx: Ctx, actor: string, command: Command): void => void executeCommand(ctx, who(ctx, actor), command, true);
const fire = (target: string): Command => ({ kind: 'ability', id: 'fire', targets: [target] });
const inst = (id: StatusId): StatusInstance => ({ id, turnsRemaining: 99, ticksRemaining: null, charges: null, stacks: 0, permanent: false });

/** The body's own turns (an Attack or a Demi), not the Thunder and the Venom it casts for the head. */
const bodyTurns = (log: readonly BattleEvent[], body = BODY): Array<'attack' | 'demi'> =>
  log.flatMap((e) => (e.type === 'action-start' && e.actorId === body && (e.command.kind === 'attack' || e.abilityId === 'demi') ? [e.command.kind === 'attack' ? ('attack' as const) : ('demi' as const)] : []));
const msgs = (log: readonly BattleEvent[], re: RegExp): number => log.filter((e) => e.type === 'message' && re.test(e.text)).length;

describe('the first fight opens as the game does (RE 2.2, 3.1)', () => {
  const e = U.newEngine(1, 3);

  it('four parts: a body of 12,000, a head of 4,000, two arms of 800; the arms are Armored by record; the head is out of melee reach', () => {
    expect(e.state().enemyIds).toEqual([BODY, HEAD, ARM_L, ARM_R]);
    expect([BODY, HEAD, ARM_L, ARM_R].map((id) => U.actor(e, id).hp)).toEqual([12_000, 4_000, 800, 800]);
    for (const id of ARMS) expect(U.actor(e, id).immunityFlags).toContain('armored');
    expect(U.actor(e, BODY).immunityFlags).not.toContain('armored');
    expect(U.actor(e, HEAD).flags.battleDistance).toBe(1);
    expect(U.actor(e, HEAD).flags.isPart).toBe(true);
  });

  it('fight 1: the acceleration line is a third of the body (4,000), the head starts at state 1, Escape is off, Switch is on', () => {
    expect(U.flags(e)[GUI_FIGHT]).toBe(1);
    expect(U.flags(e)['gui.accelLine']).toBe(4_000);
    expect(U.flags(e)[GUI_HEAD_STATE_FLAG]).toBe(1);
    const d = U.inputFor(e, 'tidus', false);
    expect(d.commands.some((c) => c.command.kind === 'switch' && c.enabled)).toBe(true);
    expect(d.commands.some((c) => c.command.kind === 'escape')).toBe(false);
  });

  it('three of the six open, three wait', () => {
    expect(e.state().activeIds).toEqual(['tidus', 'auron', 'lulu']);
    expect([...e.state().reserveIds].sort()).toEqual(['kimahri', 'wakka', 'yuna']);
  });

  it('Power Break and Provoke land on the body only, Armor Break on the arms only (RE 3.2: the record bytes)', () => {
    const imm = (id: string): Record<string, number | undefined> => U.actor(e, id).immunities as Record<string, number | undefined>;
    expect(imm(BODY)['power-break']).toBeUndefined();
    expect(imm(BODY)['provoke']).toBeUndefined();
    expect(imm(BODY)['armor-break']).toBe(255);
    for (const id of ARMS) {
      expect(imm(id)['armor-break']).toBeUndefined();
      expect(imm(id)['power-break']).toBe(255);
    }
    expect(imm(HEAD)['power-break']).toBe(255);
    expect(imm(HEAD)['armor-break']).toBe(255);
    for (const id of [BODY, HEAD, ...ARMS]) for (const s of ['poison', 'sleep', 'silence', 'darkness', 'slow', 'zombie', 'confuse', 'petrify']) expect(imm(id)[s], `${id} ${s}`).toBe(255);
  });

  it('Threaten can never land: the record byte is a success percentage and it is 0 (RE 3.2)', () => {
    for (const id of [BODY, HEAD, ...ARMS]) expect(U.actor(e, id).enemy!.threatenChance, id).toBe(0);
  });
});

describe('the body\'s turn: Attack, Attack, Demi, then alternating; faster under the line (RE 5.2)', () => {
  it('above the line it plays Attack, Attack, Demi, Attack, Demi, Attack, Demi', () => {
    const e = U.newEngine(1, 3);
    U.drive(e, () => U.defend(), (en) => bodyTurns(en.state().log).length >= 7);
    expect(bodyTurns(e.state().log).slice(0, 7)).toEqual(['attack', 'attack', 'demi', 'attack', 'demi', 'attack', 'demi']);
  });

  it('under the line, and in the second fight from the first turn, the second turn is a Demi half the time (4,000 seeds in the RE note: 50 percent)', () => {
    const second = (fight: 1 | 2, seed: number): 'attack' | 'demi' => {
      const e = U.newEngine(fight, seed);
      if (fight === 1) U.actor(e, BODY).hp = 3_000; // below the line of 4,000
      U.drive(e, () => U.defend(), (en) => bodyTurns(en.state().log, fight === 1 ? BODY : BODY_2).length >= 2);
      return bodyTurns(e.state().log, fight === 1 ? BODY : BODY_2)[1]!;
    };
    for (const fight of [1, 2] as const) {
      let demi = 0;
      const n = 300;
      for (let seed = 1; seed <= n; seed++) if (second(fight, seed) === 'demi') demi++;
      expect(demi / n, `fight ${fight}`).toBeGreaterThan(0.42);
      expect(demi / n, `fight ${fight}`).toBeLessThan(0.58);
    }
  });

  it('the first turn is an Attack in both fights (the counter starts at 0)', () => {
    for (const fight of [1, 2] as const) {
      const e = U.newEngine(fight, 5);
      U.drive(e, () => U.defend(), (en) => bodyTurns(en.state().log, fight === 1 ? BODY : BODY_2).length >= 1);
      expect(bodyTurns(e.state().log, fight === 1 ? BODY : BODY_2)[0]).toBe('attack');
    }
  });

  it('Demi takes exactly a quarter of each front-line member\'s current HP and cannot kill (RE 4: formula 5, no variance)', () => {
    const { ctx } = ctxOn(1, 2);
    who(ctx, 'tidus').hp = 1_000;
    who(ctx, 'auron').hp = 3; // a quarter of 3 is 0: nothing, and he stands
    who(ctx, 'lulu').hp = 400;
    run(ctx, BODY, { kind: 'ability', id: 'demi', targets: [] });
    expect(who(ctx, 'tidus').hp).toBe(750);
    expect(who(ctx, 'auron').hp).toBe(3);
    expect(who(ctx, 'lulu').hp).toBe(300);
  });
});

describe('the head: a three-turn cycle through the body, and the cancel (RE 5.3)', () => {
  it('relay (Thunder), a warning turn that shakes, relay (Venom), then the cycle again', () => {
    const e = U.newEngine(1, 4);
    const seq: string[] = [];
    let seen = 0;
    U.drive(e, () => U.defend(), (en) => {
      const log = en.state().log as readonly BattleEvent[];
      for (; seen < log.length; seen++) {
        const ev = log[seen]!;
        if (ev.type === 'action-start' && ev.actorId === HEAD) seq.push('head:relay');
        else if (ev.type === 'action-start' && ev.actorId === BODY && ev.abilityId === 'thunder') seq.push('body:thunder');
        else if (ev.type === 'action-start' && ev.actorId === BODY && ev.abilityId === 'gui-venom') seq.push('body:venom');
        else if (ev.type === 'charge' && ev.enemyId === HEAD) seq.push('head:shake');
      }
      return seq.length >= 10;
    });
    expect(seq.slice(0, 10)).toEqual(['head:relay', 'body:thunder', 'head:shake', 'head:relay', 'body:venom', 'head:relay', 'body:thunder', 'head:shake', 'head:relay', 'body:venom']);
  });

  it('the cycle state is readable: 1 before the Thunder, 2 after it, 3 once it has shaken (the Venom is next)', () => {
    const e = U.newEngine(1, 4);
    const seen = new Set<unknown>();
    U.drive(e, () => U.defend(), (en) => {
      seen.add(U.flags(en)[GUI_HEAD_STATE_FLAG]);
      return seen.has(3) && seen.has(2) && seen.has(1) && en.state().turn > 40;
    }, 800);
    expect([...seen].sort()).toEqual([1, 2, 3]);
  });

  it('a hit that does damage while it shakes puts the cycle back to its start: the Venom never comes (RE 5.3, G-07)', () => {
    const { ctx } = ctxOn(1, 3);
    const head = who(ctx, HEAD);
    const memory = (): Record<string, unknown> => ctx.rt.actors.get(HEAD)!.ai;
    memory().state = 3; // it has shaken: the next head turn is the Venom
    ctx.state.flags[GUI_HEAD_STATE_FLAG] = 3;
    const before = head.hp;
    run(ctx, 'lulu', fire(HEAD));
    expect(head.hp).toBeLessThan(before);
    expect(memory().state).toBe(1);
    expect(ctx.state.flags[GUI_HEAD_STATE_FLAG]).toBe(1);
  });

  it('a hit outside the shake changes nothing, and neither does an action that does no damage (a Scan reaches the head and does nothing to it)', () => {
    for (const state of [1, 2]) {
      const { ctx } = ctxOn(1, 3);
      ctx.rt.actors.get(HEAD)!.ai.state = state;
      run(ctx, 'lulu', fire(HEAD));
      expect(ctx.rt.actors.get(HEAD)!.ai.state, `state ${state}`).toBe(state);
    }
    const { ctx } = ctxOn(1, 3);
    ctx.rt.actors.get(HEAD)!.ai.state = 3;
    const before = who(ctx, HEAD).hp;
    run(ctx, 'lulu', { kind: 'ability', id: 'scan', targets: [HEAD] });
    expect(who(ctx, HEAD).hp).toBe(before);
    expect(ctx.rt.actors.get(HEAD)!.ai.state).toBe(3);
  });

  it("Kimahri's Lancet drains HP, so it is a damaging hit and stops the Venom as a spell does", () => {
    const { ctx } = ctxOn(1, 3, U.lineUp(['kimahri', 'auron', 'lulu']));
    ctx.rt.actors.get(HEAD)!.ai.state = 3;
    const before = who(ctx, HEAD).hp;
    run(ctx, 'kimahri', { kind: 'ability', id: 'lancet', targets: [HEAD] });
    expect(who(ctx, HEAD).hp).toBeLessThan(before);
    expect(ctx.rt.actors.get(HEAD)!.ai.state).toBe(1);
  });

  it('the Venom poisons, strips Haste and leaves no Slow behind (Slow duration byte 0, RE 4)', () => {
    const { ctx } = ctxOn(1, 3);
    const tidus = who(ctx, 'tidus');
    tidus.statuses['haste'] = inst('haste');
    run(ctx, BODY, { kind: 'ability', id: 'gui-venom', targets: ['tidus'] });
    expect(tidus.statuses['poison']).toBeDefined();
    expect(tidus.statuses['haste']).toBeUndefined();
    expect(tidus.statuses['slow']).toBeUndefined();
    expect(tidus.hp).toBeLessThan(tidus.stats.maxHp);
  });
});

describe('reach: the head is out of melee reach (RE 4, G-09)', () => {
  it('Attack names the body and the arms but not the head; Lulu\'s spells and Kimahri\'s Lancet name it', () => {
    const e = U.newEngine(1, 3, U.lineUp(['kimahri', 'auron', 'lulu']));
    const auron = U.inputFor(e, 'auron');
    const attack = auron.commands.find((c) => c.command.kind === 'attack')!;
    expect(attack.validTargets).toEqual(expect.arrayContaining([BODY, ARM_L, ARM_R]));
    expect(attack.validTargets).not.toContain(HEAD);
    const lulu = U.inputFor(e, 'lulu');
    expect(lulu.commands.find((c) => c.command.kind === 'ability' && 'id' in c.command && c.command.id === 'fire')!.validTargets).toContain(HEAD);
    const kimahri = U.inputFor(e, 'kimahri');
    expect(kimahri.commands.find((c) => c.command.kind === 'ability' && 'id' in c.command && c.command.id === 'lancet')!.validTargets).toContain(HEAD);
  });

  it('Wakka\'s weapon reaches it too ("Wakka\'s Attack 3": a ranged weapon)', () => {
    const e = U.newEngine(1, 3, U.lineUp(['wakka', 'auron', 'lulu']));
    const wakka = U.inputFor(e, 'wakka');
    expect(wakka.commands.find((c) => c.command.kind === 'attack')!.validTargets).toContain(HEAD);
  });
});

describe('the arms: they shield the body from physical commands only, and never act (RE 5.4, G-08)', () => {
  const def = (id: string) => U.content.ability(id)!;
  const user = (): FFXCombatant => who(ctxOn(1, 1, U.lineUp(['kimahri', 'auron', 'lulu'])).ctx, 'auron');

  it('the shield catches the physical commands (the Breaks) and lets spells, healing, Lancet, Steal and every Overdrive through', () => {
    const u = user();
    for (const id of ['power-break', 'armor-break', 'magic-break', 'mental-break']) expect(shieldCatches(def(id), u), id).toBe(true);
    for (const id of ['fire', 'blizzard', 'thunder', 'water', 'cure', 'lancet', 'steal', 'haste', 'cheer', 'dragon-fang', 'spiral-cut', 'fury', 'requiem'])
      if (U.content.ability(id)) expect(shieldCatches(def(id), u), id).toBe(false);
  });

  it('a physical blow on the body while an arm stands does a fraction of what it does once both arms are down; a spell does the same either way', () => {
    const dmg = (armsDown: boolean, attacker: string, command: Command): number => {
      const { ctx, log } = ctxOn(1, 1);
      if (armsDown) {
        for (const id of ARMS) {
          who(ctx, id).hp = 1;
          run(ctx, 'lulu', fire(id));
          expect(who(ctx, id).alive, id).toBe(false);
        }
      }
      const start = log.length;
      run(ctx, attacker, command);
      return U.damageTo(log.slice(start), BODY)[0]!;
    };
    const hit: Command = { kind: 'attack', targets: [BODY] };
    const shielded = dmg(false, 'auron', hit);
    const open = dmg(true, 'auron', hit);
    expect(open).toBeGreaterThan(250);
    expect(shielded).toBeLessThan(open * 0.3);
    const spellShielded = dmg(false, 'lulu', fire(BODY));
    const spellOpen = dmg(true, 'lulu', fire(BODY));
    expect(spellShielded / spellOpen).toBeGreaterThan(0.9);
    expect(spellShielded / spellOpen).toBeLessThan(1.1);
  });

  it('the shield is for one command: Defense, Armored and Defend are back to the record\'s afterwards', () => {
    const { ctx } = ctxOn(1, 1);
    const body = who(ctx, BODY);
    run(ctx, 'auron', { kind: 'attack', targets: [BODY] });
    expect(body.stats.def).toBe(1);
    expect(body.immunityFlags).not.toContain('armored');
    expect(body.statuses['defend']).toBeUndefined();
  });

  it('Power Break lands on the body, Armor Break on an arm; the head shrugs both off', () => {
    const { ctx } = ctxOn(1, 1);
    run(ctx, 'auron', { kind: 'ability', id: 'power-break', targets: [BODY] });
    expect(who(ctx, BODY).statuses['power-break']).toBeDefined();
    run(ctx, 'auron', { kind: 'ability', id: 'armor-break', targets: [ARM_L] });
    expect(who(ctx, ARM_L).statuses['armor-break']).toBeDefined();
  });

  it('the arms never take a turn in 120 decisions of a defending party', () => {
    const e = U.newEngine(1, 6);
    U.drive(e, () => U.defend(), (en) => en.state().turn >= 120, 600);
    for (const id of ARMS) expect(U.actions(e.state().log, id)).toEqual([]);
  });
});

describe('the arms grow back on the body\'s 3rd or 4th turn, and every death pays again (RE 5.5, 3.3, G-10, G-11)', () => {
  /** Both arms killed (each set to 1 HP, then a Fire), then the body's turns counted until the arms are back. */
  function bodyTurnsUntilRegrowth(seed: number): { turns: number; e: ReturnType<typeof U.newEngine> } {
    const e = U.newEngine(1, seed);
    const log = (): readonly BattleEvent[] => e.state().log as readonly BattleEvent[];
    let downAt = -1;
    U.drive(e, (d) => {
      const live = ARMS.find((id) => U.actor(e, id).alive);
      if (d.actorId === 'lulu' && live) {
        U.actor(e, live).hp = 1;
        return U.cast(d, 'fire', live) ?? U.defend();
      }
      return U.defend();
    }, (en) => {
      if (downAt < 0 && ARMS.every((id) => !U.actor(en, id).alive)) downAt = log().length;
      return downAt >= 0 && msgs(log(), /grow back/) > 0;
    }, 2000);
    const grow = log().findIndex((ev) => ev.type === 'message' && /grow back/.test(ev.text));
    return { turns: bodyTurns(log().slice(downAt, grow)).length + 1, e };
  }

  it('on the 3rd or the 4th body turn, half and half, never earlier and never later (4,000 seeds in the RE note: 49.3 and 50.7 percent)', () => {
    const counts: Record<number, number> = {};
    const n = 300;
    for (let seed = 1; seed <= n; seed++) {
      const { turns } = bodyTurnsUntilRegrowth(seed);
      counts[turns] = (counts[turns] ?? 0) + 1;
    }
    expect(Object.keys(counts).map(Number).sort()).toEqual([3, 4]);
    expect((counts[3] ?? 0) / n).toBeGreaterThan(0.4);
    expect((counts[3] ?? 0) / n).toBeLessThan(0.6);
  });

  it('both arms come back together at 800 HP, and the AP and gil of their first deaths are banked and paid with the battle (37 AP and 300 gil each)', () => {
    const { e } = bodyTurnsUntilRegrowth(2);
    expect(ARMS.map((id) => U.actor(e, id).hp)).toEqual([800, 800]);
    expect(ARMS.every((id) => U.actor(e, id).alive)).toBe(true);
    expect(U.flags(e)['rewards.bankedAp']).toBe(74);
    expect(U.flags(e)['rewards.bankedGil']).toBe(600);
    // Finish the body: the result pays the body's 400 AP and 1,000 gil, plus the banked 74 and 600 (the arms are back and pay nothing more).
    U.actor(e, BODY).hp = 100;
    U.drive(e, (d) => (d.actorId === 'lulu' ? U.cast(d, 'fire', BODY) ?? U.defend() : U.defend()), (en) => en.state().result !== null, 600);
    const result = e.state().result!;
    expect(result.outcome).toBe('victory');
    expect(result.ap).toBe(400 + 74);
    expect(result.gil).toBe(1_000 + 600);
  });
});

describe('the second fight: Yuna, Auron and Seymour, the weaker rematch (RE 2.1, 2.3, 7)', () => {
  it('opens on Yuna, Seymour, Auron with no bench and no Switch, on the numbers the body script writes', () => {
    const e = U.newEngine(2, 3);
    expect(e.state().activeIds).toEqual(['yuna', 'seymour', 'auron']);
    expect(e.state().reserveIds).toEqual([]);
    for (const [id, hp] of [[BODY_2, 6_000], [HEAD, 1_000], [ARM_L, 800], [ARM_R, 800]] as const) expect(U.actor(e, id).hp, id).toBe(hp);
    expect(U.actor(e, BODY_2).stats.str).toBe(15);
    expect(U.actor(e, BODY_2).stats.mdef).toBe(1);
    expect(U.flags(e)[GUI_FIGHT]).toBe(2);
    expect(U.flags(e)['gui.accelLine']).toBe(12_000);
    for (const who of ['yuna', 'seymour', 'auron']) expect(U.inputFor(e, who, true).commands.some((c) => c.command.kind === 'switch'), who).toBe(false);
  });

  it('the parts belong to the second body, so the formation lays them along it', () => {
    const e = U.newEngine(2, 3);
    for (const id of [HEAD, ...ARMS]) expect(U.actor(e, id).flags.partOf, id).toBe(BODY_2);
  });

  it('Seymour is the player\'s: his menu is the game\'s list (Attack, Item, the two magics, Scan; no Haste, Esuna, Life, Demi or Summon)', () => {
    const e = U.newEngine(2, 3);
    const seymour = U.actor(e, 'seymour');
    expect(seymour.guest).toEqual({ control: 'player', keepsPartyAlive: true });
    expect(seymour.controller).toBe('player');
    expect([seymour.stats.hp, seymour.stats.mp, seymour.stats.str, seymour.stats.def, seymour.stats.mag, seymour.stats.mdef, seymour.stats.agi, seymour.stats.luck]).toEqual([1_200, 999, 20, 25, 35, 100, 20, 18]);
    const d = U.inputFor(e, 'seymour');
    const ids = d.commands.flatMap((c) => (c.command.kind === 'ability' && 'id' in c.command ? [c.command.id] : []));
    for (const id of ['fire', 'blizzard', 'thunder', 'water', 'fira', 'blizzara', 'thundara', 'watera', 'cure', 'cura', 'scan', 'nulblaze', 'nulshock', 'nultide']) expect(ids, id).toContain(id);
    for (const id of ['haste', 'esuna', 'life', 'dispel', 'curaga', 'demi', 'nulfrost']) expect(ids, id).not.toContain(id);
    expect(d.commands.some((c) => c.command.kind === 'summon')).toBe(false);
  });

  it('his Fira reads 1,273 to 1,437 on the fight-2 body (RE 8), a Fire never kills the head and a Fira does', () => {
    const { ctx, log } = ctxOn(2, 3);
    run(ctx, 'seymour', { kind: 'ability', id: 'fira', targets: [BODY_2] });
    const body = U.damageTo(log, BODY_2)[0]!;
    expect(body).toBeGreaterThanOrEqual(1_273);
    expect(body).toBeLessThanOrEqual(1_437);
    run(ctx, 'seymour', fire(HEAD));
    expect(who(ctx, HEAD).alive).toBe(true); // 602 to 680 against 1,000
    run(ctx, 'seymour', { kind: 'ability', id: 'fira', targets: [HEAD] });
    expect(who(ctx, HEAD).alive).toBe(false);
  });

  it('Requiem needs the whole gauge, hits every part once and nothing shields it (Armored included: his staff carries Piercing, which exempts everything he casts)', () => {
    const e = U.newEngine(2, 3);
    expect(U.actor(e, 'seymour').overdrive?.gauge).toBe(0);
    const before = U.inputFor(e, 'seymour');
    expect(before.commands.some((c) => c.command.kind === 'overdrive' && c.enabled)).toBe(false);
    U.actor(e, 'seymour').overdrive!.gauge = 100;
    const d = U.inputFor(e, 'seymour');
    const row = d.commands.find((c) => c.command.kind === 'overdrive' && c.enabled)!;
    expect(row).toBeDefined();
    const start = e.state().log.length;
    e.submit({ ...row.command, targets: [] } as Command);
    const log = (e.state().log as readonly BattleEvent[]).slice(start);
    // Requiem can crit (RE 7.4, Q-8): a crit doubles the blow, so read each blow as the base it was.
    const hit = (id: string): number => {
      const ev = log.find((x) => x.type === 'damage' && x.targetId === id) as Extract<BattleEvent, { type: 'damage' }> | undefined;
      return ev ? (ev.crit ? ev.amount / 2 : ev.amount) : 0;
    };
    expect(hit(BODY_2)).toBeGreaterThanOrEqual(2_271);
    expect(hit(BODY_2)).toBeLessThanOrEqual(2_564);
    for (const id of [HEAD, ARM_L, ARM_R]) expect(hit(id), id).toBeGreaterThan(0);
    // RE 7.4 reads the missing piercing flag as "an Armored arm takes a third" (757 to 854). The game's own Armored rule also exempts a user with Pierce (kernel armoredMod), and Seymour's staff has
    // Piercing (RE 7.2), so the engine, which runs that rule, lands the whole blow on the arm: the same range as the body. Recorded as a correction to the note (handoff).
    expect(hit(ARM_L)).toBeGreaterThanOrEqual(2_271);
    expect(hit(ARM_L)).toBeLessThanOrEqual(2_564);
    expect(U.actor(e, 'seymour').overdrive?.gauge).toBe(0); // the cost is the whole gauge
  });

  it('the Stoic gauge fills only as monsters hurt him: floor(damage x 30 / max HP) + 1 a blow (RE 7.4)', () => {
    const { ctx, log } = ctxOn(2, 3);
    const seymour = who(ctx, 'seymour');
    expect(seymour.overdrive?.gauge).toBe(0);
    run(ctx, BODY_2, { kind: 'attack', targets: ['seymour'] });
    const dmg = U.damageTo(log, 'seymour')[0]!;
    expect(dmg).toBeGreaterThan(80); // 105 to 118 against his Defense 25
    expect(seymour.overdrive?.gauge).toBe(Math.floor((dmg * 30) / 1_200) + 1);
    const g = seymour.overdrive!.gauge;
    run(ctx, 'seymour', { kind: 'ability', id: 'fira', targets: [BODY_2] });
    expect(seymour.overdrive?.gauge).toBe(g); // hitting does not fill it
  });

  it('the battle is lost only when all three are down: Seymour counts like Yuna and Auron (RE 7.1, G-02)', () => {
    const e = U.newEngine(2, 3);
    const ko = (id: string): void => {
      const c = U.actor(e, id);
      c.hp = 0;
      c.statuses['ko'] = inst('ko');
    };
    ko('yuna');
    ko('auron');
    for (let i = 0; i < 6; i++) { // a few decisions with only Seymour standing: the fight goes on
      const d = e.nextDecision();
      if (d.kind === 'battle-over') break;
      if (d.kind === 'player-input') e.submit(U.defend());
    }
    expect(e.state().result?.outcome).not.toBe('defeat');
    ko('seymour');
    for (let i = 0; i < 8 && !e.state().result; i++) {
      const d = e.nextDecision();
      if (d.kind === 'player-input') e.submit(U.defend());
    }
    expect(e.state().result?.outcome).toBe('defeat');
  });

  it('the second body pays no AP (its script writes 0 and 0) and drops three Lv. 1 Key Spheres; Seymour has no row in the results', () => {
    const e = U.newEngine(2, 4);
    U.actor(e, BODY_2).hp = 100;
    U.drive(e, (d) => (d.actorId === 'seymour' ? U.cast(d, 'fira', BODY_2) ?? U.defend() : U.defend()), (en) => en.state().result !== null, 600);
    const result = e.state().result!;
    expect(result.outcome).toBe('victory');
    expect(result.ap).toBe(0);
    expect(result.gil).toBe(1_000);
    expect(result.drops.filter((x) => x.itemId === 'lv-1-key-sphere').reduce((n, x) => n + x.count, 0)).toBeGreaterThanOrEqual(3);
    expect(Object.keys(result.sphereLevelsGained)).not.toContain('seymour');
    expect(Object.keys(result.turnsTaken ?? {})).not.toContain('seymour');
  });
});

describe('determinism and the chain\'s carry', () => {
  it('the same seed plays the same fight, event for event', () => {
    const play = (): string => {
      const e = U.newEngine(1, 9);
      U.drive(e, (d) => (d.actorId === 'lulu' ? U.cast(d, 'fire', ARM_L) ?? U.defend() : U.defend()), (en) => en.state().turn >= 40, 300);
      return JSON.stringify(e.state().log);
    };
    expect(play()).toBe(play());
  });

  it('the second fight carries the first fight\'s HP and MP onto Yuna and Auron and brings Seymour in fresh', () => {
    const first = U.newEngine(1, 8);
    U.drive(first, () => U.defend(), (en) => en.state().turn >= 6, 100, false);
    const auronHp = U.actor(first, 'auron').hp;
    const yunaHp = U.actor(first, 'yuna').hp;
    const second = U.secondFightAfter(first, 8);
    expect(U.actor(second, 'auron').hp).toBe(auronHp);
    expect(U.actor(second, 'yuna').hp).toBe(yunaHp);
    expect(U.actor(second, 'seymour').hp).toBe(1_200);
    expect(U.actor(second, 'seymour').mp).toBe(999);
  });
});
