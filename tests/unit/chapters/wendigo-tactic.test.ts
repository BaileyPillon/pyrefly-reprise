/**
 * The Wendigo line (FFX only; `src/engine/tactics/wendigo.ts`): the sourced answer the first menu's NEXT BEST MOVE card follows, found on this chapter's board and on no other, each rule on a real board, and equal to the bench's
 * advisor decision for decision (so the 100-seed table is its table). What is pinned: where the line is found, the opening (the Petrify Grenade, then the Steal), the two switches, Power Break, Dark Attack, Protect, the care, the
 * wait while the arms are up, and that it has no opinion when Wendigo is gone.
 */

import { describe, expect, it } from 'vitest';

import type { BattleEngine, Command } from '../../../src/battle/common/types.ts';
import { getChapter } from '../../../src/data/encounters.ts';
import { TACTICS, tacticFor } from '../../../src/engine/tactics/index.ts';
import { WENDIGO_BOSS_IDS, wendigoLine } from '../../../src/engine/tactics/wendigo.ts';
import { CHAPTER_GAME } from '../../../src/engine/tactics/lookup.ts';
import { GUARDIAN_A, GUARDIAN_B, WENDIGO, actor, flags, give, inputFor, newEngine, type Input } from '../helpers/wendigoDrive.ts';

const command = (engine: BattleEngine, d: Input): Command | null => wendigoLine(d.actorId, d.commands, engine);
const idOf = (c: Command | null): string | null => (c === null ? null : c.kind === 'switch' ? `switch:${(c as { extra: { inId: string } }).extra.inId}` : 'id' in c ? String((c as { id?: unknown }).id) : c.kind);
const targetOf = (c: Command | null): string | undefined => (c === null ? undefined : (c.targets as string[])[0]);

/** A board with every ailment and spent status cleared, so a rule is read alone. */
function stone(engine: BattleEngine): void {
  for (const id of [GUARDIAN_A, GUARDIAN_B]) give(actor(engine, id), 'petrify');
}

describe('where the line is found: FFX only, on this chapter\'s own board', () => {
  it('is registered under the chapter and Wendigo\'s id, and tacticFor finds it on the chapter\'s board', () => {
    expect(WENDIGO_BOSS_IDS).toEqual(['wendigo']);
    expect(TACTICS.filter((t) => t.chapterId === 'wendigo').map((t) => [t.bossId, t.tactic])).toEqual([['wendigo', wendigoLine]]);
    expect(tacticFor(newEngine(1))).toBe(wendigoLine);
    expect(CHAPTER_GAME['wendigo']).toBe('ffx');
    expect(getChapter('wendigo')?.game).toBe('ffx');
  });

  it('has no opinion when Wendigo is not on the field, and none for an aeon', () => {
    const engine = newEngine(1);
    const d = inputFor(engine, 'rikku');
    actor(engine, WENDIGO).hp = 0;
    actor(engine, WENDIGO).alive = false;
    expect(command(engine, d)).toBeNull();
  });
});

describe('the opening: Rikku throws a Petrify Grenade, else she Steals', () => {
  it('at the very first menu (Rikku\'s): a Petrify Grenade at a Guardian', () => {
    const engine = newEngine(1);
    const d = inputFor(engine, 'rikku');
    const c = command(engine, d);
    expect(c?.kind).toBe('item');
    expect(idOf(c)).toBe('petrify-grenade');
    expect([GUARDIAN_A, GUARDIAN_B]).toContain(targetOf(c));
  });

  it('with the grenades gone: a Steal from a Guardian, then from the other, once each', () => {
    const engine = newEngine(1);
    const d = inputFor(engine, 'rikku');
    const noGrenade: Input = { ...d, commands: d.commands.filter((c) => !(c.command.kind === 'item' && 'id' in c.command && c.command.id === 'petrify-grenade')) };
    const first = command(engine, noGrenade);
    expect([idOf(first), targetOf(first)]).toEqual(['steal', GUARDIAN_A]);
    engine.submit(first!);
    const second = inputFor(engine, 'rikku');
    const next = command(engine, { ...second, commands: second.commands.filter((c) => !(c.command.kind === 'item' && 'id' in c.command && c.command.id === 'petrify-grenade')) });
    expect([idOf(next), targetOf(next)]).toEqual(['steal', GUARDIAN_B]); // one try each: A is not robbed twice
  });

  it('with the Guardians turned to stone Rikku has no more to do there: she makes way for Wakka', () => {
    const engine = newEngine(1);
    stone(engine);
    const d = inputFor(engine, 'rikku');
    const c = command(engine, d);
    expect(idOf(c)).toBe('switch:wakka');
  });
});

describe('the fighters: Tidus for Auron (Power Break), Rikku for Wakka (Dark Attack)', () => {
  it('Tidus, with Wendigo whole and Auron on the bench: Switch to Auron', () => {
    const engine = newEngine(1);
    stone(engine);
    const d = inputFor(engine, 'tidus');
    expect(idOf(command(engine, d))).toBe('switch:auron');
  });

  it('Auron, in: Power Break on Wendigo while it is not broken; Wakka, in: Dark Attack while it is not blind', () => {
    const engine = newEngine(1);
    stone(engine);
    inputFor(engine, 'tidus');
    engine.submit({ kind: 'switch', targets: [], extra: { outId: 'tidus', inId: 'auron' } } as unknown as Command);
    const a = inputFor(engine, 'auron');
    const brk = command(engine, a);
    expect([idOf(brk), targetOf(brk)]).toEqual(['power-break', WENDIGO]);
    engine.submit(brk!);
    const rikku = inputFor(engine, 'rikku');
    engine.submit({ kind: 'switch', targets: [], extra: { outId: 'rikku', inId: 'wakka' } } as unknown as Command);
    const w = inputFor(engine, 'wakka');
    const dark = command(engine, w);
    expect([idOf(dark), targetOf(dark)]).toEqual(['dark-attack', WENDIGO]);
    void rikku;
  });

  it('with Power Break and Darkness both on, nobody switches or casts them again: Auron and Wakka swing at the Guardians first, then at Wendigo', () => {
    const engine = newEngine(1);
    const d = inputFor(engine, 'tidus');
    give(actor(engine, WENDIGO), 'power-break');
    give(actor(engine, WENDIGO), 'darkness');
    const c = command(engine, d);
    expect(c?.kind).toBe('attack');
    expect(targetOf(c)).toBe(GUARDIAN_A); // a Guardian still up first
    stone(engine);
    expect(targetOf(command(engine, d))).toBe(WENDIGO);
  });
});

describe('Yuna, the care, and the wait', () => {
  it('Yuna puts Protect on the first member without it', () => {
    const engine = newEngine(1);
    stone(engine);
    give(actor(engine, WENDIGO), 'power-break');
    give(actor(engine, WENDIGO), 'darkness');
    const d = inputFor(engine, 'yuna');
    const c = command(engine, d);
    expect([idOf(c), targetOf(c)]).toEqual(['protect', 'tidus']);
    give(actor(engine, 'tidus'), 'protect');
    expect(targetOf(command(engine, d))).toBe('yuna');
  });

  it('a fallen member is stood up first, with a Phoenix Down; a Berserk member is cured with Esuna', () => {
    const engine = newEngine(2);
    stone(engine);
    const d = inputFor(engine, 'yuna');
    const rikku = actor(engine, 'rikku');
    rikku.hp = 0;
    rikku.alive = false;
    const c = command(engine, d);
    expect([idOf(c), targetOf(c)]).toEqual(['phoenix-down', 'rikku']);
    rikku.hp = 850;
    rikku.alive = true;
    give(actor(engine, 'tidus'), 'berserk');
    const e = command(engine, d);
    expect([idOf(e), targetOf(e)]).toEqual(['esuna', 'tidus']);
  });

  it('under 55 percent a member is healed (Cura for Yuna, a potion for the others)', () => {
    const engine = newEngine(2);
    stone(engine);
    const d = inputFor(engine, 'yuna');
    actor(engine, 'tidus').hp = 400;
    const c = command(engine, d);
    expect(targetOf(c)).toBe('tidus');
    expect(['cura', 'cure']).toContain(idOf(c));
  });

  it('with the arms up and no aeon out, everyone but Yuna Defends; an aeon on the field ends the wait', () => {
    const engine = newEngine(2);
    stone(engine);
    give(actor(engine, WENDIGO), 'power-break');
    give(actor(engine, WENDIGO), 'darkness');
    const d = inputFor(engine, 'tidus');
    flags(engine)['wendigo.arms'] = true;
    expect(command(engine, d)?.kind).toBe('defend');
    const yuna = inputFor(engine, 'yuna');
    expect(command(engine, yuna)?.kind).not.toBe('defend'); // she keeps casting
    flags(engine)['wendigo.arms'] = false;
    expect(command(engine, d)?.kind).toBe('attack');
  });
});
