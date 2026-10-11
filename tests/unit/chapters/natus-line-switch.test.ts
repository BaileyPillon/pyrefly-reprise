/**
 * Chapter X line switch: what `NATUS_LINE` (`src/data/guides/natus-line.ts`) names, and what each other id would do.
 * **Game case: FFX only** [AGENTS.md rule 14]. `docs/handoff/re-parity-chx-options.md` has the measured rates; this file proves, in a few
 * seconds, that the switch is real and that every line does what its guide says. (`natus-line-pick.test.ts`, `PYREFLY_CHX_SWITCH=1`,
 * reloads the whole module graph per id to prove the registered tactic, the guide's NEXT line, the advisor and the pause tip all follow.)
 *
 * - **The `shipped` line is untouched.** The constant is `reflect` since 2026-10-10 (Bailey’s pick); `shipped` stays as the measured baseline, and
 *   `makeSeymourNatus('shipped')` answers every menu of six whole battles exactly as a verbatim copy of the tactic as it stood before the options were built
 *   (`legacyShipped` below, from git `919f2c78`); the shipped guide text and tip are pinned as written.
 * - **Every line plays to the end** (victory or defeat) on the real engine, and does what it says in the log: Bahamut alone is sent;
 *   Rikku Reflects Natus and Mortibody's Cura bounces onto his guardians; Tidus Provokes Natus, Rikku Reflects Tidus, Natus's own
 *   spells land on Natus and nothing is summoned.
 * - **Every line's guide text is real**: each rule fits the rail (`RULE_SHORT_MAX`) and cites; each hint the line adds fires on a real
 *   board (the first match wins, the way `guide.ts#nextFor` finds it); the tip is the line's own.
 */

import { beforeAll, describe, expect, it } from 'vitest';
import type { AvailableCommand, BattleEngine, Command, FFXCombatant } from '../../../src/battle/common/types.ts';
import { FFXContentRegistry, createFFXEngine } from '../../../src/battle/ffx/index.ts';
import { ALL_ABILITIES, ENEMY_GROUPS_BY_ID, ITEMS } from '../../../src/data/ffx/index.ts';
import { highbridgeBuild } from '../../../src/data/ffx/builds/highbridge.ts';
import { NATUS_META } from '../../../src/data/chapter-meta-natus.ts';
import { guideForChapter } from '../../../src/data/guides/index.ts';
import { NATUS_LINE, NATUS_LINE_IDS, type NatusLineId } from '../../../src/data/guides/natus-line.ts';
import { NATUS_LINE_TEXT } from '../../../src/data/guides/natus-line-text.ts';
import { natusGuideFor } from '../../../src/data/guides/seymour-natus.ts';
import { RULE_SHORT_MAX } from '../../../src/data/guides/types.ts';
import { hintMatches, rowFor } from '../../../src/engine/tactics/guide.ts';
import { activeParty, has, hpFraction } from '../../../src/engine/tactics/common.ts';
import { seymourNatus, makeSeymourNatus } from '../../../src/engine/tactics/seymour-natus.ts';

const SEEDS = [1, 2, 3, 4, 5, 6];
const NATUS = 'seymour-natus';

/** The tactic exactly as it stood before the options were built (git `919f2c78`, `src/engine/tactics/seymour-natus.ts`), for the shipped-line pin. */
function legacyShipped(
  helpers: {
    offered: (c: AvailableCommand[], kind: Command['kind'], id?: string, target?: string) => AvailableCommand | undefined;
    activeParty: (e: BattleEngine) => FFXCombatant[];
    has: (c: FFXCombatant, s: string) => boolean;
    hpFraction: (c: FFXCombatant) => number;
  },
) {
  const { offered, activeParty, has, hpFraction } = helpers;
  const RELAY = ['bahamut', 'valefor', 'ifrit', 'ixion', 'shiva'] as const;
  const use = (kind: 'ability' | 'item', id: string, target: string): Command => ({ kind, id, targets: [target] }) as Command;
  const defend = (commands: AvailableCommand[]): Command => {
    const r = offered(commands, 'defend');
    return r ? ({ ...r.command, targets: [] } as Command) : ({ kind: 'defend', targets: [] } as Command);
  };
  const hitNatus = (commands: AvailableCommand[]): Command =>
    offered(commands, 'attack', undefined, NATUS) ? ({ kind: 'attack', targets: [NATUS] } as Command) : defend(commands);
  return (actorId: string, commands: AvailableCommand[], engine: BattleEngine): Command | null => {
    const state = engine.state();
    const natus = state.combatants[NATUS] as FFXCombatant | undefined;
    if (!natus || natus.side !== 'enemy' || !natus.alive) return null;
    if (state.aeonId === actorId) {
      const od = offered(commands, 'overdrive');
      if (od) return { ...od.command, targets: od.validTargets.includes(NATUS) ? [NATUS] : [] } as Command;
      return hitNatus(commands);
    }
    if (actorId === 'yuna') {
      const sent = new Set<string>();
      for (const e of state.log) if (e.type === 'summon') sent.add((e as { aeonId: string }).aeonId);
      for (const id of RELAY) {
        if (sent.has(id)) continue;
        const r = offered(commands, 'summon', id);
        if (r) return { ...r.command, targets: [] } as Command;
      }
    }
    const party = activeParty(engine).filter((c) => !c.removed);
    const stone = party.find((c) => has(c, 'petrify'));
    if (stone && offered(commands, 'item', 'soft', stone.id)) return use('item', 'soft', stone.id);
    const down = party.find((c) => c.hp <= 0 && !has(c, 'petrify'));
    if (down) {
      if (actorId === 'yuna' && offered(commands, 'ability', 'life', down.id)) return use('ability', 'life', down.id);
      if (offered(commands, 'item', 'phoenix-down', down.id)) return use('item', 'phoenix-down', down.id);
    }
    const low = party.filter((c) => c.hp > 0 && hpFraction(c) < 0.45).sort((a, b) => hpFraction(a) - hpFraction(b))[0];
    if (low) {
      if (actorId === 'yuna' && offered(commands, 'ability', 'cura', low.id)) return use('ability', 'cura', low.id);
      if (offered(commands, 'item', 'hi-potion', low.id)) return use('item', 'hi-potion', low.id);
    }
    const talk = offered(commands, 'trigger', 'talk');
    if (talk) return talk.command;
    if (actorId === 'kimahri') {
      const swap = commands.find((c) => c.enabled && c.command.kind === 'switch' && (c.command.extra as { inId?: string } | undefined)?.inId === 'auron');
      return swap ? swap.command : hitNatus(commands);
    }
    if (actorId === 'yuna') {
      const bare = party.find((c) => c.hp > 0 && !has(c, 'shell') && !has(c, 'petrify'));
      if (bare && offered(commands, 'ability', 'shell', bare.id)) return use('ability', 'shell', bare.id);
      const hurt = party.filter((c) => c.hp > 0 && hpFraction(c) < 0.7).sort((a, b) => a.hp - b.hp)[0];
      if (hurt && offered(commands, 'ability', 'cura', hurt.id)) return use('ability', 'cura', hurt.id);
      return defend(commands);
    }
    if (actorId === 'tidus' && offered(commands, 'attack', undefined, NATUS)) {
      const members = state.activeIds.map((id) => state.combatants[id] as FFXCombatant).filter((m) => m !== undefined && !m.removed);
      if (members.filter((m) => m.statuses.haste !== undefined).length < 2) {
        const bare = members.find((m) => (m.id === 'tidus' || m.id === 'auron') && m.hp > 0 && m.statuses.haste === undefined);
        if (bare && offered(commands, 'ability', 'haste', bare.id)) return use('ability', 'haste', bare.id);
      }
    }
    return hitNatus(commands);
  };
}

interface Report {
  decisions: number;
  legacyMatches: number;
  registeredMatches: number;
  hintsFired: Set<string>;
  summons: string[];
  reflectOnNatus: number;
  bounceHeals: number;
  provokeOnNatus: number;
  reflectOnTidus: number;
  bounceOntoNatus: number;
  switches: string[];
  wins: number;
  unfinished: number;
}

const content = new FFXContentRegistry();
content.addAbilities(ALL_ABILITIES);
content.addItems(Object.values(ITEMS));
const same = (a: Command | null, b: Command | null): boolean => JSON.stringify(a) === JSON.stringify(b);
const offeredRow = (c: AvailableCommand[], kind: Command['kind'], aid?: string, target?: string): AvailableCommand | undefined =>
  c.find(
    (r) =>
      r.enabled &&
      r.command.kind === kind &&
      (aid === undefined || ('id' in r.command && r.command.id === aid)) &&
      (target === undefined || r.validTargets.includes(target)),
  );
const legacy = legacyShipped({
  offered: offeredRow,
  activeParty: activeParty as unknown as (e: BattleEngine) => FFXCombatant[],
  has: has as unknown as (c: FFXCombatant, s: string) => boolean,
  hpFraction: hpFraction as unknown as (c: FFXCombatant) => number,
});

/** Six whole battles driven by the line's own tactic, with every menu also put to the legacy copy, the registered tactic and the line's guide. */
function playLine(id: NatusLineId): Report {
  const tactic = makeSeymourNatus(id);
  const guide = natusGuideFor(id);
  const lineHints = NATUS_LINE_TEXT[id].hints ?? [];
  const r: Report = {
    decisions: 0, legacyMatches: 0, registeredMatches: 0, hintsFired: new Set(), summons: [], reflectOnNatus: 0, bounceHeals: 0,
    provokeOnNatus: 0, reflectOnTidus: 0, bounceOntoNatus: 0, switches: [], wins: 0, unfinished: 0,
  };
  for (const seed of SEEDS) {
    const engine = createFFXEngine({ content, autoResolveMinigames: true });
    engine.init({ game: 'ffx', party: highbridgeBuild, enemies: ENEMY_GROUPS_BY_ID[NATUS]!, triggers: [], seed, condition: 'normal', canEscape: false });
    let ended = false;
    for (let i = 0; i < 20_000 && !ended; i += 1) {
      const d = engine.nextDecision();
      if (d.kind === 'battle-over') {
        ended = true;
        if (d.result.outcome === 'victory') r.wins += 1;
        break;
      }
      if (d.kind !== 'player-input') continue;
      r.decisions += 1;
      const pick = tactic(d.actorId, d.commands, engine) ?? ({ kind: 'defend', targets: [] } as Command);
      if (same(pick, legacy(d.actorId, d.commands, engine))) r.legacyMatches += 1;
      if (same(pick, seymourNatus(d.actorId, d.commands, engine))) r.registeredMatches += 1;
      // which hint the guide's NEXT line would use: the first whose `when` holds, the way `guide.ts#nextFor` finds it
      const state = engine.state();
      const row = rowFor(d.commands, pick);
      const target = pick.targets[0] ? state.combatants[pick.targets[0]] : undefined;
      const used = guide.hints.find((h) => hintMatches(h, { label: row?.label ?? '', command: pick, actorId: d.actorId, target, state, guide }));
      if (used && lineHints.some((h) => h.text === used.text)) r.hintsFired.add(used.text);
      if (pick.kind === 'switch') r.switches.push(`${d.actorId}>${String((pick.extra as { inId?: string } | undefined)?.inId)}`);
      engine.submit(pick);
    }
    if (!ended) r.unfinished += 1;
    for (const e of engine.state().log) {
      if (e.type === 'summon') r.summons.push((e as { aeonId: string }).aeonId);
      if (e.type === 'action-start' && e.actorId === 'rikku' && e.abilityId === 'reflect' && e.targets[0] === NATUS) r.reflectOnNatus += 1;
      if (e.type === 'action-start' && e.actorId === 'rikku' && e.abilityId === 'reflect' && e.targets[0] === 'tidus') r.reflectOnTidus += 1;
      if (e.type === 'action-start' && e.actorId === 'tidus' && e.abilityId === 'provoke' && e.targets[0] === NATUS) r.provokeOnNatus += 1;
      if (e.type === 'damage' && e.sourceId === 'mortibody' && e.amount < 0 && e.targetId !== NATUS) r.bounceHeals += 1;
      if (e.type === 'damage' && e.sourceId === NATUS && e.targetId === NATUS && e.amount > 0) r.bounceOntoNatus += 1;
    }
  }
  return r;
}

const reports = new Map<NatusLineId, Report>();

describe('Chapter X line switch (FFX only)', () => {
  beforeAll(() => {
    for (const id of NATUS_LINE_IDS) reports.set(id, playLine(id));
  }, 600_000);

  it('the shipped line is the tactic as it was, whichever line is live: every menu of six whole battles, the guide text and the tip', () => {
    const r = reports.get('shipped')!;
    expect(r.decisions).toBeGreaterThan(150);
    expect(r.legacyMatches).toBe(r.decisions);
    // Bailey's wording of 2026-09-25, to the sentence: a line's edits never reach it
    const shipped = natusGuideFor('shipped');
    expect(NATUS_LINE_TEXT.shipped).toEqual({});
    expect(shipped.rules).toHaveLength(5);
    expect(shipped.rules[3]!.short).toBe('An aeon gets one turn: make it an Overdrive');
    expect(shipped.phases![2]!.note).toBe('Natus casts Flare; Mortibody Curas him for about 1,200.');
    expect(shipped.hints.find((h) => h.when.labels?.includes('Cura'))!.text).toMatch(/^Multi-ra hits two guardians for about a thousand each, and Flare one for twice that/);
  });

  it('the live line is the one NATUS_LINE names: the registered tactic, the registered guide and the pause tip', () => {
    const r = reports.get(NATUS_LINE)!;
    expect(r.registeredMatches).toBe(r.decisions);
    expect(guideForChapter('seymour-natus')).toEqual(natusGuideFor(NATUS_LINE));
    const lineTip = NATUS_LINE_TEXT[NATUS_LINE].tip;
    if (lineTip !== undefined) expect(NATUS_META.tip).toBe(lineTip);
    else expect(NATUS_META.tip).toMatch(/Haste only Tidus and Auron/);
  });

  // The one assertion a pick changes: the line is Bailey's to move (`src/data/guides/natus-line.ts`), and the two cases above follow it. Bailey picked `reflect` on 2026-10-10.
  it('the live line is reflect (Bailey, 2026-10-10: "ill go with all your recommendations", the recommendation being reflect)', () => {
    expect(NATUS_LINE).toBe('reflect');
  });

  for (const id of NATUS_LINE_IDS) {
    it(`${id}: every battle ends, the guide text is real and each hint of the line fires`, () => {
      const r = reports.get(id)!;
      expect(r.unfinished).toBe(0);
      expect(r.decisions).toBeGreaterThan(100);
      const guide = natusGuideFor(id);
      expect(guide.id).toBe('seymour-natus');
      // the house shape of every guide (`natus-ship-content.test.ts`): three to five rules
      expect(guide.rules.length).toBeGreaterThanOrEqual(3);
      expect(guide.rules.length).toBeLessThanOrEqual(5);
      for (const rule of guide.rules) {
        expect(rule.short.length).toBeLessThanOrEqual(RULE_SHORT_MAX);
        expect(rule.cite.length).toBeGreaterThan(0);
        expect(rule.text.length).toBeGreaterThan(0);
      }
      for (const hint of guide.hints) expect(hint.cite.length).toBeGreaterThan(0);
      for (const phase of guide.phases ?? []) expect(phase.cite.length).toBeGreaterThan(0);
      for (const h of NATUS_LINE_TEXT[id].hints ?? []) {
        expect(r.hintsFired.has(h.text), `a hint of line ${id} never fired: ${h.text.slice(0, 70)}`).toBe(true);
      }
      const tip = NATUS_LINE_TEXT[id].tip;
      if (tip !== undefined) {
        expect(tip.length).toBeLessThan(220);
        expect(tip).toMatch(/^He has no Defense/);
      }
    });
  }

  it('bahamut sends Bahamut alone; the shipped relay sends all five', () => {
    expect(new Set(reports.get('shipped')!.summons)).toEqual(new Set(['bahamut', 'valefor', 'ifrit', 'ixion', 'shiva']));
    expect(new Set(reports.get('bahamut')!.summons)).toEqual(new Set(['bahamut']));
  });

  it("reflect: Rikku Reflects Natus once a battle, and Mortibody's Cura bounces onto his guardians", () => {
    const r = reports.get('reflect')!;
    expect(r.reflectOnNatus).toBeGreaterThanOrEqual(SEEDS.length - 1);
    expect(r.bounceHeals).toBeGreaterThan(0);
    expect(r.switches).toContain('kimahri>rikku');
    expect(r.switches).toContain('rikku>auron');
    expect(new Set(r.summons)).toEqual(new Set(['bahamut'])); // reflect includes the bahamut line
    expect(reports.get('shipped')!.reflectOnNatus).toBe(0);
  });

  it('mirror: Tidus Provokes Natus, Rikku Reflects Tidus, his own spells land on him, nothing is summoned', () => {
    const r = reports.get('mirror')!;
    expect(r.provokeOnNatus).toBeGreaterThan(0);
    expect(r.reflectOnTidus).toBeGreaterThan(0);
    expect(r.bounceOntoNatus).toBeGreaterThan(0);
    expect(r.summons).toEqual([]);
    expect(r.switches).toContain('kimahri>rikku');
    expect(r.switches).toContain('yuna>auron');
  });
});
