/**
 * **CH-XVIII: our Chapter XVIII line and party, winnable on the game's 12-turn clock** (re-parity; FFX only).
 *
 * Bailey, 2026-10-09, his picked option verbatim: "Ship 12, retune our line later (Recommended)": "Ship the game-true
 * turn 12 now. In a separate batch, rework our own strategy line and party preset so the chapter is winnable again;
 * boss numbers stay real." This file pins that batch (`docs/handoff/re-parity-ch18.md`):
 *
 * - the party: `sinFaceBuild` is the rested Sin party re-equipped with the three Wards the sources and the guide's own page
 *   ask for, and nothing else; Chapter XVII keeps the party as it was;
 * - the line: Lulu Doublecasts Firaga while she can pay for two and drinks an Ether when she cannot;
 * - the guide: the clock reads twelve, the Doublecast has its hint, and the NEXT line says it;
 * - the chapter on the real clock: the line wins, Gaze never lands a status, and a party that only Defends still loses to
 *   Giga-Graviton on Sin's 12th turn (nothing here touched Sin or the clock).
 *
 * Game case: **FFX only** (Chapter XVIII; the FFX-2 and FF7 engines import none of it).
 */

import { describe, expect, it } from 'vitest';
import type { AvailableCommand, BattleEngine, BattleState, Command, Decision, FFXMemberBuild } from '../../src/battle/common/types.ts';
import { FFXEngine } from '../../src/battle/ffx/index.ts';
import { registerBattleContent } from '../../src/app/screens/BattleScreenContent.ts';
import { setupForChapter } from '../../src/app/screens/BattleScreenSetup.ts';
import { CHAPTERS } from '../../src/data/encounters.ts';
import { sinFaceBuild, sinFahrenheitBuild, sinFinsCoreBuild } from '../../src/data/ffx/builds/sin-fahrenheit.ts';
import { SIN_FACE_GUIDE } from '../../src/data/guides/sin-face.ts';
import { SIN_FACE_DOC } from '../../src/data/guides/docs/sin-face.ts';
import { intendedStrategy } from '../../src/engine/BattlePresenterStrategies.ts';
import { buildGuideView } from '../../src/engine/tactics/guide.ts';
import { sinFace } from '../../src/engine/tactics/sin-face.ts';

type Input = Extract<Decision, { kind: 'player-input' }>;

const SIN = 'overdrive-sin';
const chapter = (id: string) => CHAPTERS.find((c) => c.id === id)!;
const member = (build: { members: FFXMemberBuild[] }, id: string): FFXMemberBuild => build.members.find((m) => m.id === id)!;

describe('the party: the rested Sin party, re-equipped against Gaze', () => {
  it('only the armour\'s auto-abilities differ from the build Chapter XVII starts from', () => {
    const strip = (b: typeof sinFaceBuild) => {
      const c = structuredClone(b);
      for (const m of c.members) m.equipment.armor.autoAbilities = [];
      return c;
    };
    expect(strip(sinFaceBuild)).toEqual(strip(sinFahrenheitBuild));
  });

  it('pins each member\'s armour (Death Ward and Auto-Med make the room; a Proof counts as its Ward)', () => {
    const armour = (id: string) => member(sinFaceBuild, id).equipment.armor.autoAbilities;
    expect(armour('tidus')).toEqual(['hp-20', 'confuse-ward', 'stone-ward', 'zombie-ward']);
    expect(armour('yuna')).toEqual(['magic-def-20', 'stoneproof', 'confuse-ward', 'zombie-ward']);
    expect(armour('auron')).toEqual(['hp-20', 'stone-ward', 'confuse-ward', 'zombie-ward']);
    expect(armour('wakka')).toEqual(['hp-20', 'stone-ward', 'confuse-ward', 'zombie-ward']);
    expect(armour('lulu')).toEqual(['hp-20', 'stoneproof', 'confuse-ward', 'zombie-ward']);
    expect(armour('rikku')).toEqual(['hp-20', 'stone-ward', 'confuse-ward', 'zombie-ward']);
    expect(armour('kimahri')).toEqual(['hp-20', 'stone-ward', 'confuse-ward', 'zombie-ward']);
  });

  it('every member is guarded against all three of Gaze\'s statuses, inside the armour\'s four slots', () => {
    for (const m of sinFaceBuild.members) {
      const a = m.equipment.armor;
      expect(a.autoAbilities.length, m.id).toBeLessThanOrEqual(a.slots);
      const armour: readonly string[] = a.autoAbilities;
      for (const [ward, proof] of [['stone-ward', 'stoneproof'], ['confuse-ward', 'confuseproof'], ['zombie-ward', 'zombieproof']] as const) {
        expect(armour.includes(ward) || armour.includes(proof), `${m.id} ${ward}`).toBe(true);
      }
      expect(a.autoAbilities, m.id).not.toContain('death-ward');
    }
  });

  it('Chapter XVII is untouched: it still starts from the party as it came out of Sin\'s back', () => {
    for (const m of sinFinsCoreBuild.members) {
      expect(m.equipment.armor.autoAbilities, m.id).toEqual(member(sinFahrenheitBuild, m.id).equipment.armor.autoAbilities);
    }
    expect(member(sinFinsCoreBuild, 'yuna').equipment.armor.autoAbilities).toEqual(['magic-def-20', 'stoneproof', 'death-ward', 'confuse-ward']);
    expect(chapter('sin-fins-core').buildRef).toBe(sinFinsCoreBuild);
    expect(chapter('sin-face').buildRef).toBe(sinFaceBuild);
  });

  it('shares nothing with the build it was made from (a clone, not a view)', () => {
    sinFaceBuild.members[0]!.equipment.armor.autoAbilities.push('hp-20');
    const again = member(sinFahrenheitBuild, 'tidus').equipment.armor.autoAbilities;
    expect(again).toEqual(['hp-20', 'death-ward', 'confuse-ward']);
    sinFaceBuild.members[0]!.equipment.armor.autoAbilities.pop();
  });
});

// ---------------------------------------------------------------------------
// The line
// ---------------------------------------------------------------------------

/** Play the chapter's line until `stop`; the engine and the open decision. */
async function lineUntil(seed: number, stop: (d: Input, e: FFXEngine) => boolean): Promise<{ e: FFXEngine; d: Input }> {
  await registerBattleContent();
  const e = new FFXEngine({ autoResolveMinigames: true });
  const setup = setupForChapter(chapter('sin-face'), seed);
  e.setSeed(setup.seed);
  e.init(setup);
  for (let i = 0; i < 5_000; i++) {
    const d = e.nextDecision();
    if (d.kind === 'battle-over') break;
    if (d.kind !== 'player-input') continue;
    if (stop(d, e)) return { e, d };
    const pick = intendedStrategy(d.actorId, d.commands, e as never);
    if (!pick) break;
    e.submit(pick);
  }
  throw new Error('the stop never came');
}

const label = (commands: AvailableCommand[], c: Command | null): string => {
  if (!c) return '(none)';
  const r = commands.find((x) => x.command.kind === c.kind && (x.command as { id?: string }).id === (c as { id?: string }).id);
  return r?.label ?? c.kind;
};

describe('the line: Lulu Doublecasts', () => {
  it('with MP for two Firagas she Doublecasts Firaga at Sin', async () => {
    const { e, d } = await lineUntil(1, (x) => x.actorId === 'lulu');
    const pick = sinFace('lulu', d.commands, e as BattleEngine) as Command & { wrappedId?: string };
    expect(pick).toMatchObject({ kind: 'ability', id: 'doublecast', wrappedId: 'firaga', targets: [SIN] });
  });

  it('short of two Firagas she drinks a Turbo Ether first (one turn, one drink), then an Ether', async () => {
    const { e, d } = await lineUntil(1, (x) => x.actorId === 'lulu');
    const lulu = e.state().combatants['lulu'] as { mp: number };
    lulu.mp = 31;
    const drink = sinFace('lulu', d.commands, e as BattleEngine);
    expect(drink).toMatchObject({ kind: 'item', id: 'turbo-ether', targets: ['lulu'] });
    lulu.mp = 32;
    expect(sinFace('lulu', d.commands, e as BattleEngine)).toMatchObject({ kind: 'ability', id: 'doublecast' });
    const noTurbo = d.commands.filter((c) => !(c.command.kind === 'item' && (c.command as { id: string }).id === 'turbo-ether'));
    lulu.mp = 5;
    expect(sinFace('lulu', noTurbo, e as BattleEngine)).toMatchObject({ kind: 'item', id: 'ether', targets: ['lulu'] });
  });

  it('without the Doublecast row she casts one Firaga, and drinks only under one cast', async () => {
    const { e, d } = await lineUntil(1, (x) => x.actorId === 'lulu');
    const lulu = e.state().combatants['lulu'] as { mp: number };
    const without = d.commands.filter((c) => c.label !== 'Doublecast');
    lulu.mp = 20;
    const cast = sinFace('lulu', without, e as BattleEngine);
    expect(label(without, cast)).toBe('Firaga');
    expect(cast).toMatchObject({ kind: 'ability', targets: [SIN] });
    expect((cast as { wrappedId?: string }).wrappedId).toBeUndefined();
    lulu.mp = 15;
    expect(sinFace('lulu', without, e as BattleEngine)).toMatchObject({ kind: 'item', targets: ['lulu'] });
  });

  it('the opening is the shipped one: Tidus Hastegas the pulls, Auron Armor Breaks the moment Sin is in reach', async () => {
    const first = await lineUntil(1, (x) => x.actorId === 'tidus');
    expect(label(first.d.commands, sinFace('tidus', first.d.commands, first.e as BattleEngine))).toBe('Hastega');
    const near = await lineUntil(1, (x, e) => x.actorId === 'auron' && e.state().flags['airship.range'] === 'near');
    expect(label(near.d.commands, sinFace('auron', near.d.commands, near.e as BattleEngine))).toBe('Armor Break');
  });
});

// ---------------------------------------------------------------------------
// The guide
// ---------------------------------------------------------------------------

describe('the guide says twelve, and says the Doublecast', () => {
  const texts = (): string => JSON.stringify([SIN_FACE_GUIDE.rules, SIN_FACE_GUIDE.hints, SIN_FACE_GUIDE.phases]);

  it('the clock rule reads the 12th turn; nothing prints the 13th, "our estimate" or "thirteen"', () => {
    expect(SIN_FACE_GUIDE.rules[0]!.short).toBe("Beat it before Sin's 12th turn");
    expect(SIN_FACE_GUIDE.rules[0]!.text).toContain('twelfth turn');
    expect(texts()).not.toMatch(/13th|thirteen|our estimate/i);
    expect(JSON.stringify(SIN_FACE_DOC)).not.toMatch(/13th|thirteen|our estimate/i);
    expect(JSON.stringify(SIN_FACE_DOC)).toContain('on its twelfth turn');
  });

  it('keeps the rule count in 3 to 5, and the clock rule cites the script note that settled it', () => {
    expect(SIN_FACE_GUIDE.rules.length).toBeGreaterThanOrEqual(3);
    expect(SIN_FACE_GUIDE.rules.length).toBeLessThanOrEqual(5);
    expect(SIN_FACE_GUIDE.rules[0]!.cite).toContain('re-ffx-ai-evrae-yojimbo-isaaru-sin');
  });

  it('on Lulu\'s turn the NEXT line is the Doublecast, with the hint that explains it', async () => {
    const { e, d } = await lineUntil(1, (x) => x.actorId === 'lulu');
    const view = buildGuideView(e.state() as BattleState, { actorId: d.actorId, commands: d.commands });
    expect(view?.next?.label).toBe('Doublecast');
    expect(view?.next?.reason).toContain('Two Firagas for one turn');
    expect(view?.next?.cite).toContain('ffx-bfa-yu-yevon');
  });
});

// ---------------------------------------------------------------------------
// The chapter on the game's clock
// ---------------------------------------------------------------------------

interface Run {
  outcome: string;
  sinTurns: number;
  gazeStatuses: number;
  gigaGraviton: boolean;
}

async function play(seed: number, pick: (d: Input, e: FFXEngine) => Command | null): Promise<Run> {
  await registerBattleContent();
  const e = new FFXEngine({ autoResolveMinigames: true });
  const setup = setupForChapter(chapter('sin-face'), seed);
  e.setSeed(setup.seed);
  e.init(setup);
  for (let i = 0; i < 20_000; i++) {
    const d = e.nextDecision();
    if (d.kind === 'battle-over') {
      const log = e.state().log as Array<{ type: string; status?: string; targetId?: string; abilityId?: string }>;
      return {
        outcome: String(d.result.outcome),
        sinTurns: Number(e.state().flags['sin.turn'] ?? 0),
        gazeStatuses: log.filter((x) => x.type === 'status-add' && ['petrify', 'confuse', 'zombie'].includes(x.status ?? '')).length,
        gigaGraviton: log.some((x) => x.type === 'action-start' && x.abilityId === 'overdrive-sin-giga-graviton'),
      };
    }
    if (d.kind !== 'player-input') continue;
    e.submit(pick(d, e) ?? { kind: 'defend', targets: [] });
  }
  throw new Error('never ended');
}

describe('the chapter on the game\'s 12-turn clock', () => {
  it('the line wins 24 of 24 seeds, with no Gaze status landing on anyone, before Sin\'s last turn', async () => {
    let wins = 0;
    let statuses = 0;
    let latest = 0;
    for (let seed = 1; seed <= 24; seed++) {
      const r = await play(seed, (d, e) => intendedStrategy(d.actorId, d.commands, e as never));
      if (r.outcome === 'victory') wins += 1;
      statuses += r.gazeStatuses;
      latest = Math.max(latest, r.sinTurns);
      expect(r.gigaGraviton, `seed ${seed}`).toBe(false);
    }
    expect(wins).toBe(24);
    expect(statuses).toBe(0);
    expect(latest).toBeLessThan(12);
  });

  it('a party that only Defends still loses: Giga-Graviton on Sin\'s 12th turn, the script\'s Game Over (the clock is untouched)', async () => {
    const r = await play(1, () => ({ kind: 'defend', targets: [] }) as Command);
    expect(r.outcome).toBe('defeat');
    expect(r.sinTurns).toBe(12);
    expect(r.gigaGraviton).toBe(true);
  });
});
