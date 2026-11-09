/**
 * Garik Ronso and the Ronso Youths (the hidden FFX-2 chapter): the encounter tactic (`src/engine/tactics/ffx2-garik-ronso.ts`), which the shipped auto-battler plays and the move advisor ("NEXT BEST MOVE") reads. **FFX-2 only** [AGENTS.md rule 14].
 *
 * The tactic is the bench's `advisor` line (`tests/unit/helpers/garikRonsoDrive.ts`): Yuna revives, heals and keeps Protect up; Rikku and Paine cast Darkness; nobody wears Black Mage and nobody Dispels. Pinned here:
 *
 * 1. **Registration**: the chapter's five bodies find it (the hostile fight's and the bout's), an FFX board never does, and a board without them gets `null`.
 * 2. **The choices**, on the real engine's menus (the first menu each girl gets): Protect while anyone lacks it, Pray when all is well; Cura under 45 %; a Phoenix Down for a girl down; Darkness for both Dark Knights and a Hi-Potion under 25 %.
 * 3. **The line over whole fights**: on both fights it wins, never Changes dress (so never wears Black Mage and is never cursed), and every action it takes is one the guide explains.
 */
import { afterEach, describe, expect, it } from 'vitest';

import type { AvailableCommand, BattleEngine, Command, Decision } from '../../../src/battle/common/types.ts';
import { FFX2Engine } from '../../../src/battle/ffx2/index.ts';
import { setupForChapter } from '../../../src/app/screens/BattleScreenSetup.ts';
import { FFX2_GARIK_RONSO } from '../../../src/data/chapter-ffx2-garik-ronso.ts';
import { GARIK_BODY_IDS } from '../../../src/data/garik-ronso-ids.ts';
import { RONSO_TRUST_DEFAULT, setRonsoTrust, setRonsoTrustStorageForTests, type RonsoTrust } from '../../../src/data/garik-ronso-trust.ts';
import { GARIK_RONSO_BOSS_IDS, ffx2GarikRonso } from '../../../src/engine/tactics/ffx2-garik-ronso.ts';
import { TACTICS, tacticFor } from '../../../src/engine/tactics/index.ts';
import { CHAPTER_GAME } from '../../../src/engine/tactics/lookup.ts';
import { ffx2Options } from '../helpers/ffx2ChapterDrive.ts';

type Input = Extract<Decision, { kind: 'player-input' }>;
type Unit = { id: string; hp: number; alive: boolean; stats: { maxHp: number }; statuses: Record<string, unknown> };

afterEach(() => setRonsoTrustStorageForTests(undefined));

/** The engine at the start of the fight under the Ronso trust given, with the first menu each girl gets (taken while the others defend). */
function menus(trust: RonsoTrust = RONSO_TRUST_DEFAULT, seed = 3): { engine: FFX2Engine; menu: Record<string, AvailableCommand[]> } {
  setRonsoTrustStorageForTests(null);
  setRonsoTrust(trust);
  const engine = new FFX2Engine(ffx2Options({ atbMode: 'wait' }));
  engine.setSeed(seed);
  engine.init(setupForChapter(FFX2_GARIK_RONSO, seed));
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

/** Put every girl at full HP and clear the statuses the rig set. */
function reset(engine: FFX2Engine): void {
  for (const id of ['yuna', 'rikku', 'paine']) {
    const u = unit(engine, id);
    u.hp = u.stats.maxHp;
    u.alive = true;
    delete u.statuses['protect'];
  }
}

describe('registration', () => {
  it('the chapter is registered under its five bodies and the FFX-2 game; an FFX board never reaches it', () => {
    expect(CHAPTER_GAME['ffx2-garik-ronso']).toBe('ffx2');
    expect(TACTICS.filter((t) => t.chapterId === 'ffx2-garik-ronso').map((t) => t.bossId)).toEqual([...GARIK_RONSO_BOSS_IDS]);
    expect([...GARIK_RONSO_BOSS_IDS].sort()).toEqual([...GARIK_BODY_IDS].sort());
    for (const trust of ['low', 'high'] as const) {
      const { engine } = menus(trust);
      expect(tacticFor(asEngine(engine)), trust).toBe(ffx2GarikRonso);
    }
    const ffx = { state: () => ({ game: 'ffx', combatants: { 'x2-garik-ronso': { id: 'x2-garik-ronso', side: 'enemy' } } }) } as unknown as BattleEngine;
    expect(tacticFor(ffx)).toBeNull();
  });

  it('with none of them on the field the tactic returns null (the generic ladder)', () => {
    const { engine, menu } = menus();
    for (const id of GARIK_BODY_IDS) {
      const u = engine.state().combatants[id];
      if (u) (u as unknown as Unit).alive = false;
    }
    expect(ffx2GarikRonso('yuna', menu['yuna']!, asEngine(engine))).toBeNull();
  });
});

describe('Yuna (White Mage), on the real engine\'s menu', () => {
  it('Protect while anyone lacks it, then Pray when all is well (Shell is never asked for: nothing here is magic)', () => {
    const { engine, menu } = menus();
    reset(engine);
    expect(idOf(ffx2GarikRonso('yuna', menu['yuna']!, asEngine(engine)))).toBe('x2-white-mage-protect');
    for (const id of ['yuna', 'rikku', 'paine']) unit(engine, id).statuses['protect'] = { id: 'protect', ticksRemaining: null };
    expect(idOf(ffx2GarikRonso('yuna', menu['yuna']!, asEngine(engine)))).toBe('x2-white-mage-pray');
  });

  it('the lowest girl under 45 % gets a Cura before the buffs; a girl who is down gets a Phoenix Down first', () => {
    const { engine, menu } = menus();
    reset(engine);
    const rikku = unit(engine, 'rikku');
    rikku.hp = Math.floor(rikku.stats.maxHp * 0.4);
    const heal = ffx2GarikRonso('yuna', menu['yuna']!, asEngine(engine)) as Command & { targets: string[] };
    expect(['x2-white-mage-cura', 'x2-white-mage-curaga']).toContain(idOf(heal));
    expect(heal.targets).toEqual(['rikku']);
    const paine = unit(engine, 'paine');
    paine.alive = false;
    paine.hp = 0;
    const back = ffx2GarikRonso('yuna', menu['yuna']!, asEngine(engine)) as Command & { targets: string[] };
    expect(['x2-phoenix-down', 'x2-white-mage-life']).toContain(idOf(back));
    expect(back.targets).toEqual(['paine']);
  });

  it('with everyone protected and the lowest girl under 75 % (and over 45 %) she casts Cura on her', () => {
    const { engine, menu } = menus();
    reset(engine);
    for (const id of ['yuna', 'rikku', 'paine']) unit(engine, id).statuses['protect'] = { id: 'protect', ticksRemaining: null };
    const paine = unit(engine, 'paine');
    paine.hp = Math.floor(paine.stats.maxHp * 0.6);
    const c = ffx2GarikRonso('yuna', menu['yuna']!, asEngine(engine)) as Command & { targets: string[] };
    expect([idOf(c), c.targets]).toEqual(['x2-white-mage-cura', ['paine']]);
  });
});

describe('Rikku and Paine (Dark Knights)', () => {
  it('both cast Darkness (special damage that ignores Defense and hits every Ronso), and drink a Hi-Potion under 25 % HP', () => {
    const { engine, menu } = menus();
    reset(engine);
    for (const id of ['rikku', 'paine']) {
      expect(idOf(ffx2GarikRonso(id, menu[id]!, asEngine(engine))), id).toBe('x2-dark-knight-darkness');
      const u = unit(engine, id);
      u.hp = Math.floor(u.stats.maxHp * 0.2);
      const potion = ffx2GarikRonso(id, menu[id]!, asEngine(engine)) as Command & { targets: string[] };
      expect([idOf(potion), potion.targets], id).toEqual(['x2-hi-potion', [id]]);
      u.hp = u.stats.maxHp;
    }
  });
});

describe('over whole fights on the shipped line', () => {
  it('wins both fights on seeds 1 to 5, never Changes dress (so is never cursed), and uses only what the guide explains', () => {
    const explained = new Set(['x2-white-mage-protect', 'x2-white-mage-cura', 'x2-white-mage-curaga', 'x2-white-mage-pray', 'x2-white-mage-life', 'x2-dark-knight-darkness', 'x2-hi-potion', 'x2-phoenix-down']);
    for (const trust of ['low', 'high'] as const) {
      for (const seed of [1, 2, 3, 4, 5]) {
        setRonsoTrustStorageForTests(null);
        setRonsoTrust(trust);
        const engine = new FFX2Engine(ffx2Options({ atbMode: 'wait' }));
        engine.setSeed(seed);
        engine.init(setupForChapter(FFX2_GARIK_RONSO, seed));
        const used = new Set<string>();
        let outcome: string | undefined;
        for (let i = 0; i < 40_000; i++) {
          const d = engine.nextDecision();
          if (d.kind === 'battle-over') {
            outcome = d.result.outcome;
            break;
          }
          if (d.kind === 'waiting') {
            engine.tick(Math.max(1, d.nextEventMs));
            continue;
          }
          if (d.kind !== 'player-input') continue;
          const c = ffx2GarikRonso(d.actorId, d.commands, asEngine(engine)) ?? { kind: 'defend', targets: [] };
          expect(c.kind, `${trust} seed ${seed}: never a Change`).not.toBe('spherechange');
          const id = idOf(c);
          if (id !== null && c.kind !== 'attack' && c.kind !== 'defend') used.add(id);
          engine.submit(c);
        }
        expect(outcome, `${trust} seed ${seed}`).toBe('victory');
        for (const id of used) expect(explained.has(id), `${trust} seed ${seed}: ${id}`).toBe(true);
        for (const id of ['yuna', 'rikku', 'paine']) expect(unit(engine, id).statuses['curse'], `${trust} seed ${seed}: ${id} cursed`).toBeUndefined();
      }
    }
  });
});
