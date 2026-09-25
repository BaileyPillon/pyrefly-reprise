/**
 * Chapter XIII — the four options of `docs/plans/trema-options-2026-09-25.md`, built as switches
 * that ship **OFF**: (1) Oversoul Paragon (its AI in `trema-oversoul.test.ts`), (2) Trema alone,
 * the Fiend Arena block, (3) action time (method check E4), (4) NightMare185's kit. Each through
 * the real engine or the shipped records [hard rule 3]. **FFX-2 only** [AGENTS.md rule 14].
 */

import { describe, expect, it } from 'vitest';
import type { BattleSetup, Command, EnemyGroupDef } from '../../../src/battle/common/types.ts';
import { SeededRng } from '../../../src/battle/common/rng.ts';
import { FFX2Engine } from '../../../src/battle/ffx2/index.ts';
import type { Ffx2Unit } from '../../../src/battle/ffx2/internal.ts';
import {
  ACTION_TIME_ALL_FFX2, ACTION_TIME_ESTIMATE_SECONDS, ACTION_TIME_FLAG, actionTimeSeconds, actionTimeTicks,
} from '../../../src/battle/ffx2/action-time.ts';
import { aiScriptFor, aiScriptIds } from '../../../src/battle/ffx2/ai/index.ts';
import { tremaArenaScript, tremaScript } from '../../../src/battle/ffx2/ai/trema.ts';
import * as data from '../../../src/data/ffx2/index.ts';
import {
  FFX2_TREMA, TREMA_CHAPTER_SHAPE, TREMA_KIT_OPTION, TREMA_PARAGON_FORM, tremaFirstGroup,
} from '../../../src/data/chapter-ffx2-trema.ts';
import { CLOISTER_ACTION_TIME, CLOISTER_ACTION_TIME_ON, cloisterParagonGroup, cloisterTremaGroup, trema } from '../../../src/data/ffx2/enemies/trema.ts';
import {
  CLOISTER_TREMA_ARENA, cloisterParagonOversoulGroup, cloisterTremaArenaGroup, tremaArena,
} from '../../../src/data/ffx2/enemies/trema-options.ts';
import { tremaBuildFor } from '../../../src/data/ffx2/builds/via-infinito-kit.ts';
import { viaInfinitoBuild } from '../../../src/data/ffx2/builds/via-infinito.ts';
import { ffx2Options } from '../helpers/ffx2ChapterDrive.ts';
import { driveParagon, driveTremaFresh, LINES } from '../helpers/tremaDrive.ts';
import { board } from '../helpers/tremaUnits.ts';

const idOf = (c: Command | null): string | null => (c && 'id' in c ? (c as { id: string }).id : null);

describe('every option ships OFF: the chapter is Bailey\'s TR1 a / TR7 Normal / TR11 a, with no action time', () => {
  it('the five switches read off', () => {
    expect(TREMA_PARAGON_FORM).toBe('normal');
    expect(TREMA_CHAPTER_SHAPE).toBe('paragon-then-trema');
    expect(CLOISTER_ACTION_TIME_ON).toBe(false);
    expect(CLOISTER_ACTION_TIME).toBe(0);
    expect(ACTION_TIME_ALL_FFX2).toBe(false);
    expect(TREMA_KIT_OPTION).toBe('tr11-a');
  });

  it('the chapter record is the one it was: Paragon first, TR11 a, Paragon under The Bevelle Underground', () => {
    expect(FFX2_TREMA.enemyGroupRef).toBe(cloisterParagonGroup);
    expect(FFX2_TREMA.buildRef).toBe(viaInfinitoBuild);
    expect(FFX2_TREMA.music.battle).toBe('scene-bevelle-underground');
    expect(tremaFirstGroup('paragon-then-trema', 'normal')).toBe(cloisterParagonGroup);
    expect(tremaFirstGroup('paragon-then-trema', 'oversoul')).toBe(cloisterParagonOversoulGroup);
    expect(tremaFirstGroup('trema-alone', 'normal')).toBe(cloisterTremaArenaGroup);
    expect(tremaFirstGroup('trema-alone', 'oversoul')).toBe(cloisterTremaArenaGroup);
  });

  it('no formation carries action time, and no battle flag is set', () => {
    for (const g of data.ENEMY_GROUPS) expect('actionTimeSeconds' in g, g.id).toBe(false);
    expect(board('paragon').engine.state().flags[ACTION_TIME_FLAG]).toBeUndefined();
    expect(board('trema').engine.state().flags[ACTION_TIME_FLAG]).toBeUndefined();
  });

  it('only Oversoul Paragon answers party actions (`onPartyAction`), so no other log moves', () => {
    const answering = aiScriptIds().filter((id) => aiScriptFor(id).onPartyAction !== undefined);
    expect(answering).toEqual(['paragon-oversoul']);
  });
});

/** Trema's turn starts (elapsed ticks) on the Trema link, the girls defending, under `engineOpts`. */
function tremaTurns(group: EnemyGroupDef, engineOpts: Record<string, unknown>, count: number, seed = 3): number[] {
  const engine = new FFX2Engine(ffx2Options({ atbMode: 'active', ...engineOpts }));
  const setup: BattleSetup = { game: 'ffx2', party: viaInfinitoBuild, enemies: group, triggers: [], seed, condition: 'normal', canEscape: false };
  engine.setSeed(seed);
  engine.init(setup);
  const starts: number[] = [];
  for (let i = 0; i < 5000 && starts.length < count; i++) {
    const d = engine.nextDecision();
    if (d.kind === 'battle-over') break;
    const events = d.kind === 'waiting' ? engine.tick(d.nextEventMs)
      : d.kind === 'player-input' ? engine.submit({ kind: 'defend', targets: [] }) : d.events;
    for (const e of events) if (e.type === 'turn-start' && e.actorId === 'trema') starts.push(e.elapsedTicks);
  }
  return starts;
}

describe('option 3 (E4): action time, the actor\'s own gauge waits for its action', () => {
  it('resolves engine option, then formation, then the global switch; 0 is off', () => {
    expect(actionTimeSeconds(undefined, {})).toBe(0);
    expect(actionTimeSeconds(undefined, { [ACTION_TIME_FLAG]: 2 })).toBe(2);
    expect(actionTimeSeconds(3, { [ACTION_TIME_FLAG]: 2 })).toBe(3);
    expect(actionTimeSeconds(0, { [ACTION_TIME_FLAG]: 2 })).toBe(0);
    expect(actionTimeTicks(1.5, {})).toBe(4500); // 3,000 ticks a second at Normal (§1.2)
    expect(ACTION_TIME_ESTIMATE_SECONDS).toBe(1.5);
  });

  it('adds exactly the length to each gap between Trema\'s turns, and nothing when off', () => {
    const off = tremaTurns(cloisterTremaGroup, {}, 4);
    const on = tremaTurns(cloisterTremaGroup, { actionTimeSeconds: 1.5 }, 4);
    const gaps = (s: number[]) => s.slice(1).map((t, i) => t - (s[i] ?? 0));
    expect(off).toHaveLength(4);
    for (const [i, g] of gaps(on).entries()) expect(Math.abs(g - (gaps(off)[i] ?? 0) - 4500)).toBeLessThanOrEqual(1);
  });

  it('the formation\'s value turns it on for that battle alone, and the engine option wins', () => {
    const group = { ...cloisterTremaGroup, actionTimeSeconds: 2 };
    const b = tremaTurns(group, {}, 3);
    const off = tremaTurns(cloisterTremaGroup, {}, 3);
    expect(Math.abs((b[1]! - b[0]!) - (off[1]! - off[0]!) - 6000)).toBeLessThanOrEqual(1);
    expect(tremaTurns(group, { actionTimeSeconds: 0 }, 3)).toEqual(off);
  });

  it('other gauges keep filling while it plays out (Active), and the Wait hold stops it too', () => {
    for (const mode of ['active', 'wait'] as const) {
      const engine = new FFX2Engine(ffx2Options({ atbMode: mode, waitSplit: false, actionTimeSeconds: 1.5 }));
      engine.setSeed(3);
      engine.init({ game: 'ffx2', party: viaInfinitoBuild, enemies: cloisterTremaGroup, triggers: [], seed: 3, condition: 'normal', canEscape: false });
      const unit = (id: string) => engine.state().combatants[id] as unknown as Ffx2Unit;
      let d = engine.nextDecision();
      for (let i = 0; i < 2000 && !(unit('trema').atb.recovery > 0 && d.kind === 'player-input'); i++) {
        d.kind === 'waiting' ? engine.tick(d.nextEventMs) : d.kind === 'player-input' ? engine.submit({ kind: 'defend', targets: [] }) : null;
        d = engine.nextDecision();
      }
      expect(d.kind).toBe('player-input'); // a girl's menu is open while Trema's action time runs
      const owed = unit('trema').atb.recovery;
      const girl = ['yuna', 'rikku', 'paine'].map(unit).find((u) => u.alive && u.atb.recovery === 0 && u.atb.ticks < u.atb.required && !u.atb.charging);
      const before = girl?.atb.ticks ?? 0;
      engine.tick(100, { throughInput: true });
      if (mode === 'active') {
        expect(unit('trema').atb.recovery).toBeCloseTo(owed - 300, 6);
        if (girl) expect(girl.atb.ticks).toBeGreaterThan(before);
      } else {
        expect(unit('trema').atb.recovery).toBe(owed); // Wait, whole-menu hold: nothing moves
      }
    }
  });

  it('a spherechange owes no action time (a Short change freezes everyone, §12.4)', () => {
    const engine = new FFX2Engine(ffx2Options({ atbMode: 'active', actionTimeSeconds: 1.5 }));
    engine.setSeed(1);
    engine.init({ game: 'ffx2', party: viaInfinitoBuild, enemies: cloisterTremaGroup, triggers: [], seed: 1, condition: 'normal', canEscape: false });
    let d = engine.nextDecision();
    for (let i = 0; i < 2000 && d.kind !== 'player-input'; i++) {
      if (d.kind === 'waiting') engine.tick(d.nextEventMs);
      d = engine.nextDecision();
    }
    if (d.kind !== 'player-input') throw new Error('no menu');
    const change = d.commands.find((c) => c.enabled && c.command.kind === 'spherechange');
    if (!change) throw new Error('no spherechange offered');
    engine.submit(change.command);
    const girl = engine.state().combatants[d.actorId] as unknown as Ffx2Unit;
    expect(girl.atb.recovery).toBe(0);
  });

  it('is deterministic: the same seed gives the same log', () => {
    const run = () => driveTremaFresh(LINES.kitIntended, 5, { build: tremaBuildFor('sourced-kit'), engine: { actionTimeSeconds: 1.5 } }).log;
    expect(JSON.stringify(run())).toBe(JSON.stringify(run()));
  });
});

describe('option 2 (TR1 b): Trema alone, the Fiend Arena block (research §3.3)', () => {
  it('Agility 95, Luck 128, Accuracy 26; everything else the story block', () => {
    expect(tremaArena.stats).toEqual({ ...trema.stats, agi: 95, luck: 128, acc: 26 });
    expect(tremaArena.id).toBe('trema');
    expect(tremaArena.immunities).toEqual(trema.immunities);
    expect(tremaArena.autoStatuses).toEqual(['spellspring']);
    expect(tremaArena.rewards).toMatchObject({ exp: 2000, ap: 1, gil: 3000, stolenGil: 3000 });
    expect(tremaArena.abilityIds).toContain('trema-arena-beguiling-mire');
    expect(tremaArena.abilityIds).not.toContain('trema-beguiling-mire');
    expect(data.ABILITIES['trema-arena-beguiling-mire']).toMatchObject({ power: 5, hits: 3 });
    expect(data.ABILITIES['trema-beguiling-mire']).toMatchObject({ power: 4 });
  });

  it('is a first link at full HP and MP: nothing carried, no next link, Stop still wears off', () => {
    const g = cloisterTremaArenaGroup;
    expect(g.id).toBe(CLOISTER_TREMA_ARENA);
    expect(g.nextGroupId).toBeUndefined();
    expect(g.carriesPartyState).toBeUndefined();
    expect(g.checkpointOnEntry).toBeUndefined();
    expect(g.timedAilmentDefaults).toBe(true);
    expect(g.musicCues?.[0]?.track).toBe('boss-ffx2-aeon');
    const t = board('trema', 1, CLOISTER_TREMA_ARENA).unit('trema');
    expect([t.hp, t.mp]).toEqual([999999, 999]);
  });

  it('rolls Demi 1/6 and Flare 1/12, the rest as story; the story script still rolls 12/3/3/2/2/2', () => {
    const tally = (arena: boolean) => {
      const b = board('trema', 1, arena ? CLOISTER_TREMA_ARENA : undefined);
      const counts: Record<string, number> = {};
      for (let r = 0; r < 24; r++) {
        b.unit('trema').aiMemory = {};
        const ctx = b.ctx('trema');
        const rng = new SeededRng(1);
        Object.assign(rng, { int: (min: number, max: number) => (max === 23 ? r : min), pick: <T>(items: readonly T[]) => items[0] as T });
        const id = idOf((arena ? tremaArenaScript : tremaScript).decide({ ...ctx, rng }))!;
        counts[id] = (counts[id] ?? 0) + 1;
      }
      return counts;
    };
    expect(tally(true)).toEqual({
      'trema-dying-star': 12, 'trema-demi': 4, 'trema-flare': 2, 'trema-choking-mist': 2, 'trema-arena-beguiling-mire': 2, 'trema-waning-moon': 2,
    });
    expect(tally(false)).toEqual({
      'trema-dying-star': 12, 'trema-demi': 3, 'trema-flare': 3, 'trema-choking-mist': 2, 'trema-beguiling-mire': 2, 'trema-waning-moon': 2,
    });
  });

  it('a whole fight runs to an end through the engine', () => {
    for (const seed of [1, 2]) {
      const r = driveTremaFresh(LINES.kitIntended, seed, { build: tremaBuildFor('sourced-kit'), tremaGroup: CLOISTER_TREMA_ARENA });
      expect(['victory', 'defeat']).toContain(r.outcome);
    }
  });
});

describe('option 4: NightMare185\'s kit (Strategy 3, [single source])', () => {
  const b = tremaBuildFor('nightmare-kit');

  it('three Lv 99 Dark Knights on Valiant Lustre, each with only an Oath Veil and a Crystal Bangle; 99 Megalixirs', () => {
    expect(b.members.map((m) => [m.id, m.currentDressphere, m.level, m.garmentGrid.id])).toEqual([
      ['yuna', 'dark-knight', 99, 'valiant-lustre'], ['rikku', 'dark-knight', 99, 'valiant-lustre'], ['paine', 'dark-knight', 99, 'valiant-lustre'],
    ]);
    for (const m of b.members) expect(m.accessories).toEqual(['oath-veil', 'crystal-bangle']);
    expect(b.inventory.find((i) => i.itemId === 'x2-megalixir')?.count).toBe(99);
    for (const entry of b.inventory) expect(data.ITEMS[entry.itemId], entry.itemId).toBeDefined();
    const rikku = b.members.find((m) => m.id === 'rikku')!;
    expect(rikku.spriteKey).toBe('rikku-dark-knight');
    expect(rikku.abilitiesLearned['dark-knight']?.learned).toContain('x2-dark-knight-darkness');
  });

  it('the engine fields Rikku as a Dark Knight with Darkness on her menu, and the line plays both links', () => {
    const r = driveParagon(LINES.nightmare, 1, { build: b });
    expect(['victory', 'defeat']).toContain(r.outcome);
    expect(r.count('x2-dark-knight-darkness')).toBe(0); // never Darkness on Paragon
    expect(r.count('x2-item-megalixir')).toBeGreaterThan(0);
    const t = driveTremaFresh(LINES.nightmare, 1, { build: b });
    expect(['victory', 'defeat']).toContain(t.outcome);
    expect(t.count('x2-dark-knight-darkness')).toBeGreaterThan(0);
    expect(t.log.some((e) => e.type === 'action-start' && e.actorId === 'rikku' && (e as { abilityId?: string }).abilityId === 'x2-item-three-stars')).toBe(true);
  });
});
