/**
 * Gullwings, Chapter 1 (the hidden FFX-2 chapter): the encounter tactic (`src/engine/tactics/ffx2-gullwings-ch1.ts`), which the shipped auto-battler plays and the move advisor ("NEXT BEST MOVE") reads. **FFX-2 only**
 * [AGENTS.md rule 14].
 *
 * The tactic is the bench's `advisor` line (`tests/unit/helpers/gullwingsCh1Drive.ts`): revive, free a Stopped girl, heal under 45 percent, then each girl's role (a Black Mage Rikku against the Dragon and the Beast, a White Mage
 * Yuna and Black Mage Paine against the Beast, the three starting dresspheres against Boris and YSLS-Zero). Pinned here:
 *
 * 1. **Registration**: each of the four bosses finds it, an FFX board never does, and a board without a boss gets `null`.
 * 2. **The choices**, on the real engine's menus: the first Change of each girl in each fight; the Blizzard against the Dragon and the Fire against the Beast; a Phoenix Down for a girl down; a Remedy for a Stopped girl; a
 *    Hi-Potion for a girl under 45 percent; the plain Attack for a Gunner, a Thief and a Warrior.
 * 3. **The role table is what the bench measured** (not what the guides' words suggest): the Black Mage and White Mage in the Beast's fight, none in Boris's or YSLS-Zero's.
 */
import { describe, expect, it } from 'vitest';

import type { AvailableCommand, BattleEngine, Command, Decision } from '../../../src/battle/common/types.ts';
import { FFX2Engine } from '../../../src/battle/ffx2/index.ts';
import { setupForChapter } from '../../../src/app/screens/BattleScreenSetup.ts';
import { FFX2_GULLWINGS_CH1 } from '../../../src/data/chapter-ffx2-gullwings-ch1.ts';
import { gullwingsCh1Groups } from '../../../src/data/ffx2/enemies/gullwings-ch1.ts';
import * as ids from '../../../src/data/gullwings-ch1-ids.ts';
import { GULLWINGS_CH1_BOSS_IDS, ROLES, SPELL, ffx2GullwingsCh1 } from '../../../src/engine/tactics/ffx2-gullwings-ch1.ts';
import { TACTICS, tacticFor } from '../../../src/engine/tactics/index.ts';
import { CHAPTER_GAME } from '../../../src/engine/tactics/lookup.ts';
import { ffx2Options } from '../helpers/ffx2ChapterDrive.ts';
import type { Act } from '../helpers/gullwingsCh1Drive.ts';

type Input = Extract<Decision, { kind: 'player-input' }>;
type Unit = { id: string; hp: number; alive: boolean; stats: { maxHp: number }; statuses: Record<string, unknown> };

/** The engine at the start of act `act`, with the first menu each girl gets (taken while the others defend). */
function menus(act: Act, seed = 3): { engine: FFX2Engine; menu: Record<string, AvailableCommand[]> } {
  const engine = new FFX2Engine(ffx2Options({ atbMode: 'wait' }));
  engine.setSeed(seed);
  engine.init({ ...setupForChapter(FFX2_GULLWINGS_CH1, seed), enemies: gullwingsCh1Groups[act]! });
  const menu: Record<string, AvailableCommand[]> = {};
  for (let i = 0; i < 4000 && Object.keys(menu).length < 3; i++) {
    const d = engine.nextDecision();
    if (d.kind === 'waiting') engine.tick(Math.max(1, d.nextEventMs));
    else if (d.kind === 'player-input') {
      menu[d.actorId] ??= (d as Input).commands;
      engine.submit({ kind: 'defend', targets: [] } as Command);
    } else if (d.kind === 'battle-over') break;
  }
  return { engine, menu };
}

const asEngine = (e: FFX2Engine): BattleEngine => e as unknown as BattleEngine;
const unit = (engine: FFX2Engine, id: string): Unit => engine.state().combatants[id] as unknown as Unit;
const idOf = (c: Command | null): string | null => (c !== null && 'id' in c ? (c as { id: string }).id : c === null ? null : c.kind);
const toOf = (c: Command | null): string | null => (c !== null && c.kind === 'spherechange' ? ((c as unknown as { extra?: { toDressphere?: string } }).extra?.toDressphere ?? null) : null);

/** Put every girl at full HP and clear the statuses the rig set. */
function reset(engine: FFX2Engine): void {
  for (const id of ['yuna', 'rikku', 'paine']) {
    const u = unit(engine, id);
    u.hp = u.stats.maxHp;
    u.alive = true;
    delete u.statuses['stop'];
  }
}

describe('registration', () => {
  it('the chapter is registered under all four ids and the FFX-2 game; an FFX board never reaches it; a board without a boss gets null', () => {
    expect(CHAPTER_GAME['ffx2-gullwings-ch1']).toBe('ffx2');
    expect(TACTICS.filter((t) => t.chapterId === 'ffx2-gullwings-ch1').map((t) => t.bossId)).toEqual([...GULLWINGS_CH1_BOSS_IDS]);
    for (const act of [0, 1, 2, 3] as Act[]) expect(tacticFor(asEngine(menus(act).engine)), `act ${act + 1}`).toBe(ffx2GullwingsCh1);
    const ffx = { state: () => ({ game: 'ffx', combatants: { 'x2-boris': { id: 'x2-boris', side: 'enemy' } } }) } as unknown as BattleEngine;
    expect(tacticFor(ffx)).toBeNull();
    const { engine, menu } = menus(0);
    const state = engine.state();
    (state.combatants['x2-boris'] as unknown as { alive: boolean }).alive = false;
    expect(ffx2GullwingsCh1('yuna', menu['yuna']!, asEngine(engine))).toBeNull();
  });
});

describe('the role table is the bench\'s', () => {
  it('Boris and YSLS-Zero: the three starting dresspheres; the Dragon: Rikku a Black Mage; the Beast: a White Mage Yuna, Black Mage Rikku and Paine', () => {
    expect(ROLES[ids.X2_BORIS_ID]).toEqual({ yuna: 'gunner', rikku: 'thief', paine: 'warrior' });
    expect(ROLES[ids.X2_YSLS_ZERO_ID]).toEqual({ yuna: 'gunner', rikku: 'thief', paine: 'warrior' });
    expect(ROLES[ids.X2_FLAME_DRAGON_ID]).toEqual({ yuna: 'gunner', rikku: 'black-mage', paine: 'warrior' });
    expect(ROLES[ids.X2_GUARDIAN_BEAST_ID]).toEqual({ yuna: 'white-mage', rikku: 'black-mage', paine: 'black-mage' });
    expect(SPELL[ids.X2_FLAME_DRAGON_ID]).toBe('x2-black-mage-blizzard');
    expect(SPELL[ids.X2_GUARDIAN_BEAST_ID]).toBe('x2-black-mage-fire');
  });
});

/** The first `n` commands the tactic chose for `actor` in a live fight of `act` (every other girl follows the tactic too). */
function firstCommands(act: Act, actor: string, n: number, seed = 3): Command[] {
  const engine = new FFX2Engine(ffx2Options({ atbMode: 'wait' }));
  engine.setSeed(seed);
  engine.init({ ...setupForChapter(FFX2_GULLWINGS_CH1, seed), enemies: gullwingsCh1Groups[act]! });
  const out: Command[] = [];
  for (let i = 0; i < 6000 && out.length < n; i++) {
    const d = engine.nextDecision();
    if (d.kind === 'battle-over') break;
    if (d.kind === 'waiting') engine.tick(Math.max(1, d.nextEventMs));
    else if (d.kind === 'player-input') {
      const c = ffx2GullwingsCh1(d.actorId, (d as Input).commands, asEngine(engine)) ?? ({ kind: 'defend', targets: [] } as Command);
      if (d.actorId === actor) out.push(c);
      engine.submit(c);
    }
  }
  return out;
}

describe('the choices, on the real engine\'s menus', () => {
  it('Boris: nobody changes; every girl strikes (Gunner, Thief, Warrior)', () => {
    const { engine, menu } = menus(0);
    reset(engine);
    for (const id of ['yuna', 'rikku', 'paine']) {
      const c = ffx2GullwingsCh1(id, menu[id]!, asEngine(engine));
      expect(c?.kind, id).toBe('attack');
      expect(c?.targets, id).toEqual(['x2-boris']);
    }
  });

  it('the Flame Dragon: Rikku changes to a Black Mage on her first turn and then casts Blizzard; Yuna and Paine strike', () => {
    const { engine, menu } = menus(1);
    reset(engine);
    expect(toOf(ffx2GullwingsCh1('rikku', menu['rikku']!, asEngine(engine)))).toBe('black-mage');
    expect(ffx2GullwingsCh1('yuna', menu['yuna']!, asEngine(engine))?.kind).toBe('attack');
    expect(ffx2GullwingsCh1('paine', menu['paine']!, asEngine(engine))?.kind).toBe('attack');
  });

  it('the Guardian Beast: Yuna changes to a White Mage, Rikku and Paine to Black Mages, each on her first turn (the Change is a menu row the grid offers)', () => {
    const { engine, menu } = menus(2);
    reset(engine);
    expect([toOf(ffx2GullwingsCh1('yuna', menu['yuna']!, asEngine(engine))), toOf(ffx2GullwingsCh1('rikku', menu['rikku']!, asEngine(engine))), toOf(ffx2GullwingsCh1('paine', menu['paine']!, asEngine(engine)))]).toEqual(['white-mage', 'black-mage', 'black-mage']);
  });

  it("over a live fight: the Dragon's Rikku changes then casts Blizzard at it; the Beast's Rikku and Paine change then cast Fire at it, and its Yuna changes then Prays", () => {
    const dragon = firstCommands(1, 'rikku', 2);
    expect([toOf(dragon[0]!), idOf(dragon[1]!), dragon[1]!.targets]).toEqual(['black-mage', 'x2-black-mage-blizzard', ['x2-flame-dragon']]);
    for (const who of ['rikku', 'paine']) {
      const cs = firstCommands(2, who, 2);
      expect([toOf(cs[0]!), idOf(cs[1]!), cs[1]!.targets], who).toEqual(['black-mage', 'x2-black-mage-fire', ['x2-guardian-beast']]);
    }
    const yuna = firstCommands(2, 'yuna', 2);
    expect(toOf(yuna[0]!)).toBe('white-mage');
    expect(['x2-white-mage-pray', 'x2-hi-potion', 'x2-potion', 'x2-phoenix-down']).toContain(idOf(yuna[1]!));
  });

  it('YSLS-Zero: nobody changes; every girl strikes', () => {
    const { engine, menu } = menus(3);
    reset(engine);
    for (const id of ['yuna', 'rikku', 'paine']) expect(ffx2GullwingsCh1(id, menu[id]!, asEngine(engine))?.kind, id).toBe('attack');
  });

  it('a Phoenix Down for a girl down (Yuna and Rikku), a Remedy for a Stopped girl, a Hi-Potion for a girl under 45 percent; Paine leaves it to them', () => {
    const { engine, menu } = menus(3);
    reset(engine);
    unit(engine, 'paine').alive = false;
    const revive = ffx2GullwingsCh1('yuna', menu['yuna']!, asEngine(engine));
    expect([idOf(revive), revive?.targets]).toEqual(['x2-phoenix-down', ['paine']]);
    unit(engine, 'paine').alive = true;
    unit(engine, 'rikku').statuses['stop'] = { id: 'stop' };
    const free = ffx2GullwingsCh1('yuna', menu['yuna']!, asEngine(engine));
    expect([idOf(free), free?.targets]).toEqual(['x2-remedy', ['rikku']]);
    delete unit(engine, 'rikku').statuses['stop'];
    unit(engine, 'rikku').hp = Math.floor(unit(engine, 'rikku').stats.maxHp * 0.3);
    const heal = ffx2GullwingsCh1('yuna', menu['yuna']!, asEngine(engine));
    expect([idOf(heal), heal?.targets]).toEqual(['x2-hi-potion', ['rikku']]);
    expect(ffx2GullwingsCh1('paine', menu['paine']!, asEngine(engine))?.kind, 'Paine, with Rikku at 30 percent, strikes').toBe('attack');
    unit(engine, 'rikku').hp = Math.floor(unit(engine, 'rikku').stats.maxHp * 0.2);
    expect(idOf(ffx2GullwingsCh1('paine', menu['paine']!, asEngine(engine))), 'Paine heals under a quarter').toBe('x2-hi-potion');
  });
});
