/**
 * The Oblitzerator line (FFX only; `src/engine/tactics/oblitzerator.ts`): the crane line the first menu's NEXT BEST MOVE card follows, found on this chapter's board and on no other, each rule on a real board, and equal to
 * the bench's advisor decision for decision (so the 200-seed table is its table). What is pinned: where the line is found, Lulu's Thunder at the crane, Tidus's Haste on her first, the wait for everyone else, Use crane
 * once the crane has power, the swing after, the care, and that it has no opinion when the machine is gone.
 */

import { describe, expect, it } from 'vitest';

import type { BattleEngine, Command } from '../../../src/battle/common/types.ts';
import { getChapter } from '../../../src/data/encounters.ts';
import { TACTICS, tacticFor } from '../../../src/engine/tactics/index.ts';
import { OBLITZERATOR_BOSS_IDS, oblitzeratorLine } from '../../../src/engine/tactics/oblitzerator.ts';
import { CHAPTER_GAME } from '../../../src/engine/tactics/lookup.ts';
import { CRANE, OBLITZERATOR, actor, flags, give, inputFor, newEngine, type Input } from '../helpers/oblitzeratorDrive.ts';
import { TACTIC_LINE, choose } from '../helpers/oblitzeratorBot.ts';

const command = (engine: BattleEngine, d: Input): Command | null => oblitzeratorLine(d.actorId, d.commands, engine);
const idOf = (c: Command | null): string | null => (c === null ? null : 'id' in c ? String((c as { id?: unknown }).id) : c.kind);
const targetOf = (c: Command | null): string | undefined => (c === null ? undefined : (c.targets as string[])[0]);

describe('where the line is found: FFX only, on this chapter\'s own board', () => {
  it('is registered under the chapter and the machine\'s id, and tacticFor finds it on the chapter\'s board', () => {
    expect(OBLITZERATOR_BOSS_IDS).toEqual(['oblitzerator']);
    expect(TACTICS.filter((t) => t.chapterId === 'oblitzerator').map((t) => [t.bossId, t.tactic])).toEqual([['oblitzerator', oblitzeratorLine]]);
    expect(tacticFor(newEngine(1))).toBe(oblitzeratorLine);
    expect(CHAPTER_GAME['oblitzerator']).toBe('ffx');
    expect(getChapter('oblitzerator')?.game).toBe('ffx');
  });

  it('has no opinion when the machine is not on the field', () => {
    const engine = newEngine(1);
    const d = inputFor(engine, 'lulu');
    actor(engine, OBLITZERATOR).hp = 0;
    actor(engine, OBLITZERATOR).alive = false;
    expect(command(engine, d)).toBeNull();
  });
});

describe('the crane is dark: Lulu casts Thunder at it, Tidus hastes her once, the rest wait', () => {
  it('Lulu: Thunder at the crane (never at the machine)', () => {
    const engine = newEngine(1);
    const c = command(engine, inputFor(engine, 'lulu'));
    expect([idOf(c), targetOf(c)]).toEqual(['thunder', CRANE]);
  });

  it('Tidus: Haste on Lulu first; once she is hasted, a Defend', () => {
    const engine = newEngine(1);
    const d = inputFor(engine, 'tidus');
    const first = command(engine, d);
    expect([idOf(first), targetOf(first)]).toEqual(['haste', 'lulu']);
    give(actor(engine, 'lulu'), 'haste');
    expect(idOf(command(engine, d))).toBe('defend');
  });

  it('Kimahri: a Defend (a swing at the machine would draw a ball)', () => {
    const engine = newEngine(1);
    expect(idOf(command(engine, inputFor(engine, 'kimahri')))).toBe('defend');
  });

  it('a Silenced Lulu does not try to cast: she waits', () => {
    const engine = newEngine(1);
    give(actor(engine, 'lulu'), 'silence');
    const c = command(engine, inputFor(engine, 'lulu'));
    expect(c).not.toBeNull();
    expect(idOf(c)).not.toBe('thunder');
  });
});

describe('the crane has power: Tidus uses it, the others wait; then anyone swings at the lifted machine', () => {
  it('Tidus: Use crane, aimed at the crane', () => {
    const engine = newEngine(1);
    flags(engine)['oblitzerator.crane'] = 1;
    const c = command(engine, inputFor(engine, 'tidus'));
    expect([c?.kind, idOf(c), targetOf(c)]).toEqual(['trigger', 'use-crane', CRANE]);
  });

  it('Lulu and Kimahri: a Defend until he has', () => {
    const engine = newEngine(1);
    flags(engine)['oblitzerator.crane'] = 1;
    expect(idOf(command(engine, inputFor(engine, 'lulu')))).toBe('defend');
    expect(idOf(command(engine, inputFor(engine, 'kimahri')))).toBe('defend');
  });

  it('lifted: everyone swings at the machine', () => {
    const engine = newEngine(1);
    flags(engine)['oblitzerator.crane'] = 2;
    flags(engine)['oblitzerator.ended'] = true;
    for (const who of ['lulu', 'tidus', 'kimahri']) {
      const c = command(engine, inputFor(engine, who));
      expect([c?.kind, targetOf(c)], who).toEqual(['attack', OBLITZERATOR]);
    }
  });
});

describe('the care comes first', () => {
  it('a fallen member is stood up with a Phoenix Down, and a member under 45 percent is given a Potion', () => {
    const engine = newEngine(1);
    const kimahri = actor(engine, 'kimahri');
    kimahri.hp = 0;
    kimahri.alive = false;
    const c = command(engine, inputFor(engine, 'lulu', 60, false));
    expect([idOf(c), targetOf(c)]).toEqual(['phoenix-down', 'kimahri']);
    const second = newEngine(1);
    actor(second, 'tidus').hp = 200;
    const d = inputFor(second, 'lulu', 60, false);
    const heal = command(second, d);
    expect([idOf(heal), targetOf(heal)]).toEqual(['potion', 'tidus']);
  });
});

describe('the line equals the bench\'s advisor, decision for decision (so the table is its table)', () => {
  it('seeds 1 to 8, played through: at every input the line and the bot agree', () => {
    for (let seed = 1; seed <= 8; seed++) {
      const engine = newEngine(seed);
      for (let i = 0; i < 400; i++) {
        const d = engine.nextDecision();
        if (d.kind === 'battle-over') break;
        if (d.kind !== 'player-input') continue;
        const pick = command(engine, d);
        const bot = choose(engine, d, TACTIC_LINE);
        expect(JSON.stringify(pick ?? { kind: 'defend', targets: [] }), `seed ${seed} ${d.actorId}`).toBe(JSON.stringify(bot));
        engine.submit(bot);
      }
    }
  });
});
