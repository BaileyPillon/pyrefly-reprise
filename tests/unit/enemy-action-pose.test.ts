/**
 * Which painting an enemy wears for its own action (iter2 attack-pose, Bailey
 * 2026-09-26 ~19:30 EDT, recommendation 3: "the presenter mapping so a boss's
 * PHYSICAL ability draws its attack painting").
 *
 * Before this, every enemy action arrived as `{ kind: 'ability' }` and
 * `poseForCommand('ability')` is `cast`, so an enemy's `attack` painting only
 * ever showed on a counter (`docs/concepts/boss-poses-2026-09-26/README.md`,
 * "Read this first"). Now a **physical** enemy ability (its own row says
 * `damageType: 'physical'`, or its formula is `strength` / `piercing-strength`
 * and it is not `magical`) draws `attack` when the actor has an attack
 * painting of its own, else `cast` (whose chain ends on the idle), exactly as
 * before. Magic keeps `cast`; party and aeon actions are unchanged.
 *
 * Both games (shared presenter plumbing, CHK-020): FFX marks physical with
 * `damageType` and so does FFX-2 (its engine's own `attackClass` reads it).
 * Proved by running the real engines and the real presenter (hard rule 3).
 */

import { describe, expect, it } from 'vitest';
import type {
  AbilityId,
  BattleEvent,
  Command,
  CombatantId,
  Decision,
  EnemyGroupDef,
  FFXPartyBuild,
} from '../../src/battle/common/types.ts';
import { createFFXEngine, FFXContentRegistry } from '../../src/battle/ffx/index.ts';
import { abilityFactsFor } from '../../src/app/screens/battleAbilityFacts.ts';
import { BattlePresenter } from '../../src/engine/BattlePresenter.ts';
import { characterUrl } from '../../src/engine/BattlePresenterArt.ts';
import type { AbilityFacts } from '../../src/engine/BattlePresenterPorts.ts';
import { isPhysicalAction, paintedPoses, poseForAction } from '../../src/engine/EnemyActionPose.ts';
import { CHAPTERS, getChapter } from '../../src/data/encounters.ts';
import * as ffxData from '../../src/data/ffx/index.ts';
import * as ffx2Data from '../../src/data/ffx2/index.ts';
import { FakeActor, FakeStage, noSleep } from './helpers/FakeStage.ts';
import { driveChapter6 } from './helpers/ffx2ChapterDrive.ts';
import { PHYSICAL_BY_CHAPTER } from './helpers/enemyPhysicalRows.ts';

type StartEvent = Extract<BattleEvent, { type: 'action-start' }>;

function start(actorId: string, command: Command, abilityId?: AbilityId): StartEvent {
  return { type: 'action-start', seq: 0, actorId, command, ...(abilityId ? { abilityId } : {}), targets: [] };
}

const facts = (table: Record<string, AbilityFacts>) => (id: AbilityId) => table[id];
const PHYS: AbilityFacts = { damageType: 'physical', formula: 'strength' };
const MAGIC: AbilityFacts = { damageType: 'magical', formula: 'magic' };
const has = (...poses: string[]) => (p: string) => poses.includes(p);

// ------------------------------------------------------------------ the rule

describe('isPhysicalAction', () => {
  it('reads the row: damage type physical, or a strength formula that is not magical', () => {
    expect(isPhysicalAction({ damageType: 'physical', formula: 'strength' })).toBe(true);
    expect(isPhysicalAction({ damageType: 'physical', formula: 'fractional' })).toBe(true);
    expect(isPhysicalAction({ damageType: 'other', formula: 'strength' })).toBe(true);
    expect(isPhysicalAction({ damageType: 'other', formula: 'piercing-strength' })).toBe(true);
    expect(isPhysicalAction({ damageType: 'magical', formula: 'strength' })).toBe(false);
    expect(isPhysicalAction({ damageType: 'magical', formula: 'magic' })).toBe(false);
    expect(isPhysicalAction({ damageType: 'other', formula: 'fixed-no-variance' })).toBe(false);
    expect(isPhysicalAction({ damageType: 'other', formula: 'none' })).toBe(false);
    expect(isPhysicalAction(undefined)).toBe(false);
  });
});

describe('poseForAction', () => {
  const lookup = facts({ slash: PHYS, fire: MAGIC });
  const ability = (id: string): Command => ({ kind: 'ability', id, targets: [] });

  it('an enemy physical ability draws attack when the enemy has an attack painting', () => {
    expect(poseForAction(start('boss', ability('slash'), 'slash'), 'enemy', lookup, has('idle', 'attack', 'cast'))).toBe('attack');
  });
  it('falls back to cast (which ends on the idle) when it has no attack painting', () => {
    expect(poseForAction(start('boss', ability('slash'), 'slash'), 'enemy', lookup, has('idle', 'cast'))).toBe('cast');
    expect(poseForAction(start('boss', ability('slash'), 'slash'), 'enemy', lookup, has('idle'))).toBe('cast');
    expect(poseForAction(start('boss', ability('slash'), 'slash'), 'enemy', lookup, undefined)).toBe('cast');
  });
  it('magic keeps cast, even with an attack painting', () => {
    expect(poseForAction(start('boss', ability('fire'), 'fire'), 'enemy', lookup, has('idle', 'attack', 'cast'))).toBe('cast');
  });
  it('an unknown row or no lookup keeps cast (today)', () => {
    expect(poseForAction(start('boss', ability('what'), 'what'), 'enemy', lookup, has('attack'))).toBe('cast');
    expect(poseForAction(start('boss', ability('slash'), 'slash'), 'enemy', undefined, has('attack'))).toBe('cast');
  });
  it('party and aeon actions are unchanged', () => {
    expect(poseForAction(start('tidus', ability('slash'), 'slash'), 'party', lookup, has('attack'))).toBe('cast');
    expect(poseForAction(start('ifrit', ability('slash'), 'slash'), 'aeon', lookup, has('attack'))).toBe('cast');
    expect(poseForAction(start('tidus', { kind: 'attack', targets: [] }, 'attack'), 'party', lookup, has())).toBe('attack');
    expect(poseForAction(start('tidus', { kind: 'item', id: 'potion', targets: [] }), 'party', lookup, has())).toBe('item');
  });
});

describe('paintedPoses', () => {
  it('counts only the poses that resolved to their own painting', () => {
    const map = {
      idle: characterUrl('yojimbo-cavern', 'idle'),
      attack: characterUrl('yojimbo-cavern', 'idle'),
      cast: characterUrl('yojimbo-cavern', 'cast'),
      hurt: characterUrl('yojimbo-cavern', 'idle'),
    };
    expect([...paintedPoses('yojimbo-cavern', map, characterUrl)].sort()).toEqual(['cast', 'idle']);
  });
});

// ------------------------------------------- every enemy ability, every chapter

function groupsOf(chapterId: string): EnemyGroupDef[] {
  const ch = getChapter(chapterId);
  if (!ch) return [];
  const byId: Record<string, EnemyGroupDef | undefined> =
    ch.game === 'ffx' ? ffxData.ENEMY_GROUPS_BY_ID : ffx2Data.ENEMY_GROUPS_BY_ID;
  const out: EnemyGroupDef[] = [];
  let g: EnemyGroupDef | undefined = ch.enemyGroupRef;
  while (g && !out.includes(g)) {
    out.push(g);
    g = g.nextGroupId ? byId[g.nextGroupId] : undefined;
  }
  return out;
}

interface Row {
  enemy: string;
  ability: string;
  found: boolean;
  physical: boolean;
}

function tableFor(chapterId: string): Row[] {
  const ch = getChapter(chapterId)!;
  const lookup = abilityFactsFor(ch.game);
  const rows: Row[] = [];
  const seen = new Set<string>();
  for (const g of groupsOf(chapterId)) {
    for (const e of [...g.enemies, ...(g.parts ?? [])]) {
      for (const id of e.abilityIds) {
        const key = `${e.id}:${id}`;
        if (seen.has(key)) continue;
        seen.add(key);
        const f = lookup(id);
        rows.push({ enemy: e.id, ability: id, found: !!f, physical: isPhysicalAction(f) });
      }
    }
  }
  return rows;
}


describe('every enemy ability in every listed chapter', () => {
  for (const ch of CHAPTERS) {
    it(`${ch.id}: physical rows draw attack (when painted), the rest cast`, () => {
      const rows = tableFor(ch.id);
      expect(rows.length).toBeGreaterThan(0);
      const lookup = abilityFactsFor(ch.game);
      for (const r of rows) {
        const ev = start(r.enemy, { kind: 'ability', id: r.ability, targets: [] }, r.ability);
        const painted = poseForAction(ev, 'enemy', lookup, has('idle', 'attack', 'cast'));
        const unpainted = poseForAction(ev, 'enemy', lookup, has('idle', 'cast'));
        expect(painted, `${r.enemy} ${r.ability}`).toBe(r.physical ? 'attack' : 'cast');
        expect(unpainted, `${r.enemy} ${r.ability}`).toBe('cast');
      }
      const physical = rows.filter((r) => r.physical).map((r) => `${r.enemy}:${r.ability}`);
      expect(physical).toEqual(PHYSICAL_BY_CHAPTER[ch.id]);
    });
  }

  it('Chapter IX (FFX): Kozuka, Wakizashi and Daigoro\'s bite are physical; the order and Zanmato are not', () => {
    const rows = tableFor('yojimbo-cavern');
    const phys = (id: string) => rows.find((r) => r.ability === id)?.physical;
    expect(phys('yojimbo-kozuka')).toBe(true);
    expect(phys('yojimbo-wakizashi')).toBe(true);
    expect(phys('daigoro-attack')).toBe(true);
    expect(phys('yojimbo-daigoro')).toBe(false);
    expect(phys('yojimbo-zanmato')).toBe(false);
  });
});

// ----------------------------------------------- the real engine, the real presenter

/** A stage whose actors appear on first use, with a side and a painted set per id. */
class PaintedStage extends FakeStage {
  constructor(
    private readonly sideFor: (id: CombatantId) => 'party' | 'enemy' | 'aeon',
    private readonly painted: (id: CombatantId) => readonly string[],
  ) {
    super([], []);
  }
  override actor(id: CombatantId): FakeActor {
    let a = this.actors.get(id);
    if (!a) {
      a = new FakeActor(id, this.calls);
      this.actors.set(id, a);
      this.sides.set(id, this.sideFor(id));
    }
    return a;
  }
  override sideOf(id: CombatantId): 'party' | 'enemy' | 'aeon' | undefined {
    this.actor(id);
    return this.sides.get(id);
  }
  paints(id: CombatantId, pose: string): boolean {
    return this.painted(id).includes(pose);
  }
}

/** Play `log` event by event through the presenter; the pose each enemy action-start left. */
async function posesDrawn(
  log: readonly BattleEvent[],
  stage: PaintedStage,
  game: 'ffx' | 'ffx2',
): Promise<Map<string, Set<string>>> {
  const presenter = new BattlePresenter({ stage, sleep: noSleep, abilityFacts: abilityFactsFor(game) });
  const out = new Map<string, Set<string>>();
  let seq = 0;
  for (const e of log) {
    if (e.type === 'victory' || e.type === 'defeat') continue;
    await presenter.play([{ ...e, seq: seq++ } as BattleEvent]);
    if (e.type !== 'action-start' || stage.sideOf(e.actorId) !== 'enemy') continue;
    const key = `${e.actorId}:${e.abilityId ?? e.command.kind}`;
    if (!out.has(key)) out.set(key, new Set());
    out.get(key)!.add(stage.actor(e.actorId).pose);
  }
  return out;
}

function yojimboLog(seed: number): { log: BattleEvent[]; sides: Map<string, 'party' | 'enemy' | 'aeon'> } {
  const ch = getChapter('yojimbo-cavern')!;
  const content = new FFXContentRegistry();
  content.addAbilities(ffxData.ALL_ABILITIES.filter((a) => a.game === 'ffx'));
  content.addItems(Object.values(ffxData.ITEMS).filter((i) => i.game === 'ffx'));
  const engine = createFFXEngine({ content, autoResolveMinigames: true });
  engine.init({
    game: 'ffx',
    party: structuredClone(ch.buildRef as FFXPartyBuild),
    enemies: ch.enemyGroupRef,
    triggers: [],
    seed,
    condition: 'normal',
    canEscape: false,
  } as never);
  for (let i = 0; i < 20_000; i++) {
    const d = engine.nextDecision();
    if (d.kind === 'battle-over') break;
    if (d.kind !== 'player-input') continue;
    const pi = d as Extract<Decision, { kind: 'player-input' }>;
    const row =
      pi.commands.find((c) => c.enabled && c.command.kind === 'attack' && c.validTargets.length > 0) ??
      pi.commands.find((c) => c.enabled && c.validTargets.length > 0);
    engine.submit(row ? ({ ...row.command, targets: [row.validTargets[0]] } as Command) : ({ kind: 'defend', targets: [] } as Command));
  }
  const st = engine.state();
  const sides = new Map<string, 'party' | 'enemy' | 'aeon'>();
  for (const [id, c] of Object.entries(st.combatants)) sides.set(id, (c as { side: 'party' | 'enemy' | 'aeon' }).side);
  return { log: [...st.log], sides };
}

describe('Chapter IX (FFX only): Yojimbo, through the real presenter', () => {
  const runs = Array.from({ length: 30 }, (_, i) => yojimboLog(i + 1));
  const log = runs.flatMap((r) => r.log);
  const side = (id: CombatantId) => runs.find((r) => r.sides.has(id))?.sides.get(id) ?? 'aeon';

  it('with an attack painting, Kozuka / Wakizashi / the bite draw attack; the order stays cast', async () => {
    const poses = await posesDrawn(log, new PaintedStage(side, () => ['idle', 'cast', 'attack', 'hurt']), 'ffx');
    expect(poses.get('yojimbo:yojimbo-kozuka')).toEqual(new Set(['attack']));
    expect(poses.get('yojimbo:yojimbo-wakizashi')).toEqual(new Set(['attack']));
    expect(poses.get('yojimbo:yojimbo-daigoro')).toEqual(new Set(['cast']));
    expect(poses.get('daigoro:daigoro-attack')).toEqual(new Set(['attack']));
  });

  it('with today\'s art (no attack painting for either), every one of them falls back to cast', async () => {
    const poses = await posesDrawn(log, new PaintedStage(side, () => ['idle', 'cast']), 'ffx');
    expect(poses.size).toBeGreaterThan(0);
    for (const [key, set] of poses) expect(set, key).toEqual(new Set(['cast']));
  });
});

describe('Chapter VI (FFX-2 only): the Leblanc Syndicate, through the real presenter', () => {
  const run = driveChapter6(1, 0, { atbMode: 'wait' });
  const log = run.logs.flat();
  const side = (id: CombatantId) => (['yuna', 'rikku', 'paine'].includes(id) ? 'party' : 'enemy');
  const lookup = abilityFactsFor('ffx2');

  it('every physical enemy action draws attack when painted, cast when not; magic stays cast', async () => {
    const withAttack = await posesDrawn(log, new PaintedStage(side, () => ['idle', 'cast', 'attack']), 'ffx2');
    const today = await posesDrawn(log, new PaintedStage(side, () => ['idle', 'cast']), 'ffx2');
    expect(withAttack.size).toBeGreaterThan(0);
    let physicalSeen = 0;
    for (const [key, set] of withAttack) {
      const id = key.split(':')[1]!;
      const physical = isPhysicalAction(lookup(id));
      if (physical) physicalSeen++;
      expect(set, key).toEqual(new Set([physical ? 'attack' : 'cast']));
      expect(today.get(key), key).toEqual(new Set(['cast']));
    }
    expect(physicalSeen).toBeGreaterThan(0);
  });
});
