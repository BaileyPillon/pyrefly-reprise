/**
 * The Luca Opener (the hidden FFX-2 chapter): the encounter tactic (`src/engine/tactics/ffx2-luca-opener.ts`), which the shipped auto-battler plays and the move advisor ("NEXT BEST MOVE") reads. **FFX-2 only** [AGENTS.md rule 14].
 *
 * The tactic is the bench's `advisor` line (`tests/unit/helpers/lucaOpenerDrive.ts`): Rikku steals from each enemy once; everyone strikes Logos, then Ormi, then Leblanc; Yuna the Songstress dances; a Potion for a girl who is low;
 * a Phoenix Down for a girl who is down. Pinned here:
 *
 * 1. **Registration**: the chapter's fighters find it, an FFX board never does, and a board without them gets `null`.
 * 2. **The choices**, on the real engine's menus (the first menu each girl gets): Logos first, then Ormi; Rikku's Steal once on each (read from the log); Potions and Phoenix Downs; Yuna the Songstress's Darkness Dance while
 *    Leblanc is not Dark, then a Potion for a girl under 70 % before the Dance again.
 */
import { describe, expect, it } from 'vitest';

import type { AvailableCommand, BattleEngine, Command, Decision } from '../../../src/battle/common/types.ts';
import { FFX2Engine } from '../../../src/battle/ffx2/index.ts';
import { lucaOpenerBuild, lucaOpenerSongstressBuild } from '../../../src/data/ffx2/builds/luca-opener.ts';
import { lucaLeblancGroup, lucaLogosOrmiGroup } from '../../../src/data/ffx2/enemies/luca-opener.ts';
import { X2_LUCA_LEBLANC_ID, X2_LUCA_LOGOS_ID, X2_LUCA_ORMI_ID } from '../../../src/data/luca-opener-ids.ts';
import { LUCA_OPENER_BOSS_IDS, ffx2LucaOpener } from '../../../src/engine/tactics/ffx2-luca-opener.ts';
import { TACTICS, tacticFor } from '../../../src/engine/tactics/index.ts';
import { CHAPTER_GAME } from '../../../src/engine/tactics/lookup.ts';
import { ffx2Options } from '../helpers/ffx2ChapterDrive.ts';

type Input = Extract<Decision, { kind: 'player-input' }>;
type Unit = { id: string; hp: number; alive: boolean; stats: { maxHp: number }; statuses: Record<string, unknown> };

/** The engine at the start of a link, with the first menu each girl gets (taken while the others defend). */
function menus(link: 1 | 2, seed = 3): { engine: FFX2Engine; menu: Record<string, AvailableCommand[]> } {
  const engine = new FFX2Engine(ffx2Options({ atbMode: 'wait' }));
  engine.setSeed(seed);
  engine.init({
    game: 'ffx2',
    party: structuredClone(link === 1 ? lucaOpenerBuild : lucaOpenerSongstressBuild),
    enemies: link === 1 ? lucaLogosOrmiGroup : lucaLeblancGroup,
    triggers: [],
    seed,
    condition: 'normal',
    canEscape: false,
  });
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
const targetsOf = (c: Command | null): string[] => (c === null ? [] : [...(c.targets ?? [])]);

/** Everyone whole, no steal on the log, no Darkness on the enemy: the rig the choices are read in. */
function reset(engine: FFX2Engine): void {
  for (const id of ['yuna', 'rikku', 'paine']) {
    const u = unit(engine, id);
    u.hp = u.stats.maxHp;
    u.alive = true;
  }
  for (const id of LUCA_OPENER_BOSS_IDS) {
    const u = engine.state().combatants[id] as unknown as Unit | undefined;
    if (u !== undefined) delete u.statuses['darkness'];
  }
}

/** Put a Steal on the engine's log, as Rikku's action-start would have. */
function logSteal(engine: FFX2Engine, target: string): void {
  (engine.state().log as unknown as Array<Record<string, unknown>>).push({ type: 'action-start', actorId: 'rikku', abilityId: 'x2-thief-steal', targets: [target] });
}

describe('registration', () => {
  it('the chapter is registered under its three fighters and the FFX-2 game; an FFX board never reaches it', () => {
    expect(CHAPTER_GAME['ffx2-luca-opener']).toBe('ffx2');
    expect(TACTICS.filter((t) => t.chapterId === 'ffx2-luca-opener').map((t) => t.bossId)).toEqual([...LUCA_OPENER_BOSS_IDS]);
    expect([...LUCA_OPENER_BOSS_IDS]).toEqual([X2_LUCA_LOGOS_ID, X2_LUCA_ORMI_ID, X2_LUCA_LEBLANC_ID]);
    const { engine } = menus(1);
    expect(tacticFor(asEngine(engine))).toBe(ffx2LucaOpener);
    const ffx = { state: () => ({ game: 'ffx', combatants: { [X2_LUCA_LOGOS_ID]: { id: X2_LUCA_LOGOS_ID, side: 'enemy' } } }) } as unknown as BattleEngine;
    expect(tacticFor(ffx)).toBeNull();
  });

  it('with none of the three on the field the tactic returns null (the generic ladder)', () => {
    const { engine, menu } = menus(1);
    for (const id of [X2_LUCA_LOGOS_ID, X2_LUCA_ORMI_ID]) unit(engine, id).alive = false;
    expect(ffx2LucaOpener('paine', menu['paine']!, asEngine(engine))).toBeNull();
  });
});

describe('link 1: Logos first, then Ormi; Rikku steals from each once', () => {
  it('Paine and Yuna (the Gunner) strike Logos while he stands, then Ormi', () => {
    const { engine, menu } = menus(1);
    reset(engine);
    for (const who of ['paine', 'yuna']) {
      const c = ffx2LucaOpener(who, menu[who]!, asEngine(engine));
      expect(idOf(c), who).toBe('attack');
      expect(targetsOf(c), who).toEqual([X2_LUCA_LOGOS_ID]);
    }
    unit(engine, X2_LUCA_LOGOS_ID).alive = false;
    expect(targetsOf(ffx2LucaOpener('paine', menu['paine']!, asEngine(engine)))).toEqual([X2_LUCA_ORMI_ID]);
  });

  it('Rikku steals from Logos, then from Ormi, then strikes the first living enemy; a steal already on the log is not repeated; a fallen enemy is not stolen from', () => {
    const { engine, menu } = menus(1);
    reset(engine);
    const first = ffx2LucaOpener('rikku', menu['rikku']!, asEngine(engine));
    expect([idOf(first), targetsOf(first)]).toEqual(['x2-thief-steal', [X2_LUCA_LOGOS_ID]]);
    logSteal(engine, X2_LUCA_LOGOS_ID);
    const second = ffx2LucaOpener('rikku', menu['rikku']!, asEngine(engine));
    expect([idOf(second), targetsOf(second)]).toEqual(['x2-thief-steal', [X2_LUCA_ORMI_ID]]);
    logSteal(engine, X2_LUCA_ORMI_ID);
    const third = ffx2LucaOpener('rikku', menu['rikku']!, asEngine(engine));
    expect([idOf(third), targetsOf(third)]).toEqual(['attack', [X2_LUCA_LOGOS_ID]]);
    const { engine: e2, menu: m2 } = menus(1);
    reset(e2);
    unit(e2, X2_LUCA_LOGOS_ID).alive = false;
    const skipped = ffx2LucaOpener('rikku', m2['rikku']!, asEngine(e2));
    expect([idOf(skipped), targetsOf(skipped)]).toEqual(['x2-thief-steal', [X2_LUCA_ORMI_ID]]);
  });

  it('a Potion for Rikku under 30 % comes before her Steal; Paine under 30 % drinks too; Yuna revives a girl who is down before anything else, and Potions a girl under 40 %', () => {
    const { engine, menu } = menus(1);
    reset(engine);
    const rikku = unit(engine, 'rikku');
    rikku.hp = Math.floor(rikku.stats.maxHp * 0.2);
    const heal = ffx2LucaOpener('rikku', menu['rikku']!, asEngine(engine));
    expect([idOf(heal), targetsOf(heal)]).toEqual(['x2-potion', ['rikku']]);
    reset(engine);
    const paine = unit(engine, 'paine');
    paine.hp = Math.floor(paine.stats.maxHp * 0.2);
    expect([idOf(ffx2LucaOpener('paine', menu['paine']!, asEngine(engine))), targetsOf(ffx2LucaOpener('paine', menu['paine']!, asEngine(engine)))]).toEqual(['x2-potion', ['paine']]);
    reset(engine);
    unit(engine, 'rikku').alive = false;
    const revive = ffx2LucaOpener('yuna', menu['yuna']!, asEngine(engine));
    expect([idOf(revive), targetsOf(revive)]).toEqual(['x2-phoenix-down', ['rikku']]);
    reset(engine);
    const p2 = unit(engine, 'paine');
    p2.hp = Math.floor(p2.stats.maxHp * 0.3);
    const potion = ffx2LucaOpener('yuna', menu['yuna']!, asEngine(engine));
    expect([idOf(potion), targetsOf(potion)]).toEqual(['x2-potion', ['paine']]);
  });
});

describe('link 2: the Songstress', () => {
  it('Yuna dances while Leblanc is not Dark; Rikku steals once from her and then strikes; Paine strikes', () => {
    const { engine, menu } = menus(2);
    reset(engine);
    const dance = ffx2LucaOpener('yuna', menu['yuna']!, asEngine(engine));
    expect([idOf(dance), targetsOf(dance)]).toEqual(['x2-songstress-darkness-dance', [X2_LUCA_LEBLANC_ID]]);
    const steal = ffx2LucaOpener('rikku', menu['rikku']!, asEngine(engine));
    expect([idOf(steal), targetsOf(steal)]).toEqual(['x2-thief-steal', [X2_LUCA_LEBLANC_ID]]);
    logSteal(engine, X2_LUCA_LEBLANC_ID);
    expect(idOf(ffx2LucaOpener('rikku', menu['rikku']!, asEngine(engine)))).toBe('attack');
    const swing = ffx2LucaOpener('paine', menu['paine']!, asEngine(engine));
    expect([idOf(swing), targetsOf(swing)]).toEqual(['attack', [X2_LUCA_LEBLANC_ID]]);
  });

  it('once Leblanc is Dark Yuna mends a girl under 70 % with a Potion, and otherwise dances again (she has no Attack row to fall back on)', () => {
    const { engine, menu } = menus(2);
    reset(engine);
    unit(engine, X2_LUCA_LEBLANC_ID).statuses['darkness'] = { id: 'darkness', ticksRemaining: null };
    const again = ffx2LucaOpener('yuna', menu['yuna']!, asEngine(engine));
    expect(idOf(again)).toBe('x2-songstress-darkness-dance');
    const rikku = unit(engine, 'rikku');
    rikku.hp = Math.floor(rikku.stats.maxHp * 0.6);
    const mend = ffx2LucaOpener('yuna', menu['yuna']!, asEngine(engine));
    expect([idOf(mend), targetsOf(mend)]).toEqual(['x2-potion', ['rikku']]);
  });
});
