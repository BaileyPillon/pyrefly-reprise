/**
 * Ifrit at Kilika Temple (the hidden FFX-2 chapter): the encounter tactic (`src/engine/tactics/ffx2-ifrit-kilika.ts`), which the shipped auto-battler plays and the move advisor ("NEXT BEST MOVE") reads. **FFX-2 only** [AGENTS.md rule 14].
 *
 * The tactic is the bench's `advisor` line (`tests/unit/helpers/ifritKilikaDrive.ts`): Yuna revives, heals, Protect and Shell; Rikku Darkness; Paine Armor Break, Power Break, then the plain Attack; nobody ever uses Fire. Pinned here:
 *
 * 1. **Registration**: the chapter's fighter finds it, an FFX board (whose Ifrit is the aeon) never does, and a board without him gets `null`.
 * 2. **The choices**, on the real engine's menus (the first menu each girl gets): Protect, then Shell; Cura under 45 %; a Mega-Potion with two girls under 35 %; a Phoenix Down for a girl down; Rikku's Darkness and her Hi-Potion
 *    under 25 %; Paine's Armor Break, then Power Break once he is Defense-down, then the plain Attack.
 * 3. **No Fire**: over whole fights the party uses no Fire ability (it would heal him).
 */
import { describe, expect, it } from 'vitest';

import type { AvailableCommand, BattleEngine, Command, Decision } from '../../../src/battle/common/types.ts';
import { FFX2Engine } from '../../../src/battle/ffx2/index.ts';
import { setupForChapter } from '../../../src/app/screens/BattleScreenSetup.ts';
import { FFX2_IFRIT_KILIKA } from '../../../src/data/chapter-ffx2-ifrit-kilika.ts';
import { IFRIT_ID } from '../../../src/data/ffx2/enemies/ifrit.ts';
import { ABILITIES } from '../../../src/data/ffx2/index.ts';
import { IFRIT_KILIKA_BOSS_IDS, ffx2IfritKilika } from '../../../src/engine/tactics/ffx2-ifrit-kilika.ts';
import { TACTICS, tacticFor } from '../../../src/engine/tactics/index.ts';
import { CHAPTER_GAME } from '../../../src/engine/tactics/lookup.ts';
import { ffx2Options } from '../helpers/ffx2ChapterDrive.ts';

type Input = Extract<Decision, { kind: 'player-input' }>;
type Unit = { id: string; hp: number; alive: boolean; stats: { maxHp: number }; statuses: Record<string, unknown> };

/** The engine at the start of the fight, with the first menu each girl gets (taken while the others defend). */
function menus(seed = 3): { engine: FFX2Engine; menu: Record<string, AvailableCommand[]> } {
  const engine = new FFX2Engine(ffx2Options({ atbMode: 'wait' }));
  engine.setSeed(seed);
  engine.init(setupForChapter(FFX2_IFRIT_KILIKA, seed));
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

/** Put every girl at full HP and clear every status the rig set. */
function reset(engine: FFX2Engine): void {
  for (const id of ['yuna', 'rikku', 'paine']) {
    const u = unit(engine, id);
    u.hp = u.stats.maxHp;
    u.alive = true;
    delete u.statuses['protect'];
    delete u.statuses['shell'];
  }
  const boss = unit(engine, IFRIT_ID);
  delete boss.statuses['def-down'];
  delete boss.statuses['str-down'];
}

describe('registration', () => {
  it('the chapter is registered under his id and the FFX-2 game; an FFX board (whose Ifrit is the aeon) never reaches it', () => {
    expect(CHAPTER_GAME['ffx2-ifrit-kilika']).toBe('ffx2');
    expect(TACTICS.filter((t) => t.chapterId === 'ffx2-ifrit-kilika').map((t) => t.bossId)).toEqual([...IFRIT_KILIKA_BOSS_IDS]);
    const { engine } = menus();
    expect(tacticFor(asEngine(engine))).toBe(ffx2IfritKilika);
    const ffx = { state: () => ({ game: 'ffx', combatants: { 'x2-ifrit': { id: 'x2-ifrit', side: 'enemy' } } }) } as unknown as BattleEngine;
    expect(tacticFor(ffx)).toBeNull();
  });

  it('with him not on the field the tactic returns null (the generic ladder)', () => {
    const { engine, menu } = menus();
    unit(engine, IFRIT_ID).alive = false;
    expect(ffx2IfritKilika('yuna', menu['yuna']!, asEngine(engine))).toBeNull();
  });
});

describe('Yuna (White Mage), on the real engine\'s menu', () => {
  it('Protect first, then Shell once everyone has Protect; Pray when all is well', () => {
    const { engine, menu } = menus();
    reset(engine);
    expect(idOf(ffx2IfritKilika('yuna', menu['yuna']!, asEngine(engine)))).toBe('x2-white-mage-protect');
    for (const id of ['yuna', 'rikku', 'paine']) unit(engine, id).statuses['protect'] = { id: 'protect', ticksRemaining: null };
    expect(idOf(ffx2IfritKilika('yuna', menu['yuna']!, asEngine(engine)))).toBe('x2-white-mage-shell');
    for (const id of ['yuna', 'rikku', 'paine']) unit(engine, id).statuses['shell'] = { id: 'shell', ticksRemaining: null };
    expect(idOf(ffx2IfritKilika('yuna', menu['yuna']!, asEngine(engine)))).toBe('x2-white-mage-pray');
  });

  it('the lowest girl under 45 % gets a Cura before the buffs (the preset\'s bag holds no Mega-Potion, so two low girls get the same); a girl who is down gets a Phoenix Down first', () => {
    const { engine, menu } = menus();
    reset(engine);
    const rikku = unit(engine, 'rikku');
    rikku.hp = Math.floor(rikku.stats.maxHp * 0.4);
    const heal = ffx2IfritKilika('yuna', menu['yuna']!, asEngine(engine)) as Command & { targets: string[] };
    expect(['x2-white-mage-cura', 'x2-white-mage-curaga']).toContain(idOf(heal));
    expect(heal.targets).toEqual(['rikku']);
    const paine = unit(engine, 'paine');
    paine.hp = Math.floor(paine.stats.maxHp * 0.3);
    rikku.hp = Math.floor(rikku.stats.maxHp * 0.3);
    const two = ffx2IfritKilika('yuna', menu['yuna']!, asEngine(engine)) as Command & { targets: string[] };
    expect(['x2-white-mage-cura', 'x2-white-mage-curaga']).toContain(idOf(two));
    expect(['rikku', 'paine']).toContain(two.targets[0]);
    paine.alive = false;
    paine.hp = 0;
    const back = ffx2IfritKilika('yuna', menu['yuna']!, asEngine(engine)) as Command & { targets: string[] };
    expect(['x2-phoenix-down', 'x2-white-mage-life']).toContain(idOf(back));
    expect(back.targets).toEqual(['paine']);
  });
});

describe('Rikku (Dark Knight) and Paine (Warrior)', () => {
  it('Rikku casts Darkness (no element, and it ignores his Defense 98), and drinks a Hi-Potion under 25 % HP', () => {
    const { engine, menu } = menus();
    reset(engine);
    expect(idOf(ffx2IfritKilika('rikku', menu['rikku']!, asEngine(engine)))).toBe('x2-dark-knight-darkness');
    expect(ABILITIES['x2-dark-knight-darkness']!.element).toEqual(['none']);
    const rikku = unit(engine, 'rikku');
    rikku.hp = Math.floor(rikku.stats.maxHp * 0.2);
    const potion = ffx2IfritKilika('rikku', menu['rikku']!, asEngine(engine)) as Command & { targets: string[] };
    expect(idOf(potion)).toBe('x2-hi-potion');
    expect(potion.targets).toEqual(['rikku']);
  });

  it('Paine breaks his Defense first, then his Strength, then swings; under 25 % HP she drinks a Hi-Potion', () => {
    const { engine, menu } = menus();
    reset(engine);
    const first = ffx2IfritKilika('paine', menu['paine']!, asEngine(engine)) as Command & { targets: string[] };
    expect(idOf(first)).toBe('x2-warrior-armor-break');
    expect(first.targets).toEqual([IFRIT_ID]);
    unit(engine, IFRIT_ID).statuses['def-down'] = { id: 'def-down', ticksRemaining: null };
    expect(idOf(ffx2IfritKilika('paine', menu['paine']!, asEngine(engine)))).toBe('x2-warrior-power-break');
    unit(engine, IFRIT_ID).statuses['str-down'] = { id: 'str-down', ticksRemaining: null };
    const swing = ffx2IfritKilika('paine', menu['paine']!, asEngine(engine)) as Command & { targets: string[] };
    expect(swing.kind).toBe('attack');
    expect(swing.targets).toEqual([IFRIT_ID]);
    const paine = unit(engine, 'paine');
    paine.hp = Math.floor(paine.stats.maxHp * 0.2);
    expect(idOf(ffx2IfritKilika('paine', menu['paine']!, asEngine(engine)))).toBe('x2-hi-potion');
  });
});

describe('no Fire (it would heal him)', () => {
  it('over whole fights on the shipped line the party uses no Fire ability, and every action it takes is one the guide explains', () => {
    const explained = new Set(['x2-white-mage-protect', 'x2-white-mage-shell', 'x2-white-mage-cura', 'x2-white-mage-curaga', 'x2-white-mage-pray', 'x2-white-mage-life', 'x2-dark-knight-darkness', 'x2-warrior-armor-break', 'x2-warrior-power-break', 'x2-hi-potion', 'x2-phoenix-down']);
    for (const seed of [1, 2, 3, 4, 5]) {
      const engine = new FFX2Engine(ffx2Options({ atbMode: 'wait' }));
      engine.setSeed(seed);
      engine.init(setupForChapter(FFX2_IFRIT_KILIKA, seed));
      const used = new Set<string>();
      for (let i = 0; i < 40_000; i++) {
        const d = engine.nextDecision();
        if (d.kind === 'battle-over') break;
        if (d.kind === 'waiting') {
          engine.tick(Math.max(1, d.nextEventMs));
          continue;
        }
        if (d.kind !== 'player-input') continue;
        const c = ffx2IfritKilika(d.actorId, d.commands, asEngine(engine)) ?? { kind: 'defend', targets: [] };
        const id = idOf(c);
        if (id !== null && c.kind !== 'attack' && c.kind !== 'defend') used.add(id);
        engine.submit(c);
      }
      for (const id of used) {
        expect(explained.has(id), `seed ${seed}: ${id}`).toBe(true);
        const elements = ABILITIES[id]?.element ?? [];
        expect(elements.includes('fire'), `seed ${seed}: ${id} is Fire`).toBe(false);
      }
    }
  });
});
