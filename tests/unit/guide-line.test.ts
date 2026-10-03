/**
 * The strategy guide's own line (`src/data/guides/lines/*.ts`, read by `src/engine/tactics/guide-line.ts`).
 *
 * Bailey, 2026-10-03: the guide follows the encounter guide the project settled on (D-350), and "the
 * guide and next move advisor are completely separate entities". This file pins the line as a thing:
 * every chapter has one; at every decision of a real battle it names a row the character can actually
 * press, aimed at someone legal; and the order of the steps does what each chapter's plan says on the
 * boards the plan is about.
 *
 * **Game case: both** [AGENTS.md rule 14]. The per-chapter board tests say which game each is for.
 */

import { describe, expect, it } from 'vitest';
import type { AvailableCommand, BattleState, CombatantId } from '../../src/battle/common/types.ts';
import { GUIDES } from '../../src/data/guides/index.ts';
import { guideForState } from '../../src/engine/tactics/guide.ts';
import { buildGuideRail, guideLineStrategy, pickLine, type LinePick } from '../../src/engine/tactics/guide-line.ts';
import { guidedChapters, isLegal, playChapter } from './helpers/guideLineDrive.ts';

// ------------------------------------------------------------------ the data

describe('every chapter carries a line', () => {
  it('has one for each chapter the guide covers, and for nothing else', () => {
    expect(GUIDES.map((g) => g.id).sort()).toEqual(guidedChapters().map((c) => c.id).sort());
    for (const g of GUIDES) expect(g.line?.length ?? 0, g.id).toBeGreaterThanOrEqual(4);
  });

  it('is made of well-formed steps: a row to press, a plain reason, a pointer for maintainers', () => {
    for (const g of GUIDES) {
      for (const [i, step] of (g.line ?? []).entries()) {
        const where = `${g.id} step ${i}`;
        expect(Boolean(step.labels?.length) || Boolean(step.kinds?.length), `${where} names nothing to press`).toBe(true);
        expect(step.why.trim().length, `${where} has no reason`).toBeGreaterThan(8);
        expect(step.why, `${where} ends its sentence for itself`).not.toMatch(/\.\s*$/);
        expect(step.from.trim().length, `${where} has no provenance`).toBeGreaterThan(3);
        if (step.switchIn) expect(step.kinds, `${where}`).toContain('switch');
      }
    }
  });

  it('keeps the plan steps and the support steps apart: every line has plan steps of its own, bar the one chapter with none to follow', () => {
    for (const g of GUIDES) {
      const plan = (g.line ?? []).filter((s) => !s.support).length;
      if (g.id === 'ffx2-leblanc') expect(plan, g.id).toBe(1); // the final swing: the guide it follows has no plan for this fight
      else expect(plan, g.id).toBeGreaterThanOrEqual(3);
    }
  });
});

// ------------------------------------------------------ legality on real boards

/** How many decisions of each run are checked: enough to reach the middle of the longest chains. */
const CHECKED_DECISIONS = 700;

describe('on a real battle, the line never names a row the player cannot press', () => {
  it.each(guidedChapters().map((c) => [c.id, c.game] as const))('%s (%s)', (id) => {
    let decisions = 0;
    let declined = 0;
    const problems: string[] = [];
    for (const seed of [1, 2, 3]) {
      playChapter(id, seed, guideLineStrategy, {
        maxDecisions: CHECKED_DECISIONS,
        onDecision: (d) => {
          decisions += 1;
          if (d.picked === null) {
            declined += 1;
            return;
          }
          if (!isLegal(d.picked, d.commands)) {
            problems.push(`seed ${seed} turn ${d.state.turn} ${d.actorId}: ${JSON.stringify(d.picked)}`);
          }
        },
      });
    }
    expect(problems, problems.slice(0, 3).join('\n')).toEqual([]);
    expect(decisions).toBeGreaterThan(20);
    // A decision the line has no step for is rare: the panel then says so instead of inventing a move.
    expect(declined / decisions, `${id} declined ${declined} of ${decisions} decisions`).toBeLessThan(0.35);
  });

  it('always has something to show on the opening decision of every chapter', () => {
    for (const c of guidedChapters()) {
      let first: LinePick | null | undefined;
      playChapter(c.id, 1, guideLineStrategy, {
        maxDecisions: 1,
        onDecision: (d) => {
          const guide = guideForState(d.state);
          first = guide ? pickLine(d.state, guide, { actorId: d.actorId, commands: d.commands }) : null;
        },
      });
      expect(first, `${c.id}: no NEXT on the first decision`).toBeTruthy();
    }
  });
});

// ------------------------------------------- the plan, on the boards it is about

interface Captured {
  state: BattleState;
  actorId: CombatantId;
  commands: AvailableCommand[];
}

/** The first decision `actor` is offered in `chapter` (the first seed from `seed` that gives her one), cloned so a test may dress the board. */
function firstDecisionOf(chapter: string, actor: CombatantId | null = null, seed = 1, cap = 400): Captured {
  for (let s = seed; s < seed + 12; s++) {
    let found: Captured | null = null;
    playChapter(chapter, s, guideLineStrategy, {
      maxDecisions: cap,
      onDecision: (d) => {
        if (found || (actor !== null && d.actorId !== actor)) return;
        found = { state: structuredClone(d.state) as BattleState, actorId: d.actorId, commands: d.commands };
      },
    });
    if (found) return found;
  }
  throw new Error(`${chapter}: no decision for ${actor ?? 'anyone'} in ${cap}`);
}

function pick(c: Captured): LinePick {
  const guide = guideForState(c.state);
  if (!guide) throw new Error('no guide for the board');
  const hit = pickLine(c.state, guide, { actorId: c.actorId, commands: c.commands });
  if (!hit) throw new Error('the line has nothing to say');
  return hit;
}

const status = (id: string): never => ({ id, turnsRemaining: null, ticksRemaining: null, charges: null, stacks: 0, permanent: false }) as never;

describe('Chapter 1, Seymour Flux (FFX)', () => {
  it('cures a Zombie before anything else', () => {
    const c = firstDecisionOf('seymour-flux', 'tidus');
    (c.state.combatants['yuna']!.statuses as Record<string, unknown>)['zombie'] = status('zombie');
    const p = pick(c);
    expect(p.row.label).toMatch(/Holy Water|Remedy/);
    expect(p.command.targets).toEqual(['yuna']);
  });

  it('answers the Total Annihilation warning with Shell on the party, or an aeon, ahead of the opener', () => {
    const c = firstDecisionOf('seymour-flux', 'kimahri');
    c.state.log = [
      ...c.state.log,
      { seq: c.state.log.length, type: 'charge', enemyId: 'mortiorchis', name: 'Auto-Attack Mode', turnsLeft: 2, stage: 1 },
    ] as BattleState['log'];
    expect(pick(c).row.label).toBe('Mighty Guard');
  });

  it('Dispels his Reflect, and says why', () => {
    const c = firstDecisionOf('seymour-flux', 'yuna');
    (c.state.combatants['seymour-flux']!.statuses as Record<string, unknown>)['reflect'] = status('reflect');
    const p = pick(c);
    expect(p.row.label).toBe('Dispel');
    expect(p.reason).toMatch(/Reflect/);
  });

  it('never names Defend: FFX has no Defend row on its menu', () => {
    for (const seed of [1, 2]) {
      playChapter('seymour-flux', seed, guideLineStrategy, {
        maxDecisions: 80,
        onDecision: (d) => expect(d.picked?.kind).not.toBe('defend'),
      });
    }
  });
});

describe('Chapter 4, Bahamut (FFX-2)', () => {
  it('heals everyone to full once the countdown is live, ahead of the next swing', () => {
    const c = firstDecisionOf('ffx2-bahamut', 'yuna');
    c.state.log = [
      ...c.state.log,
      { seq: c.state.log.length, type: 'charge', enemyId: 'bahamut', name: '3', turnsLeft: 3, stage: 1 },
    ] as BattleState['log'];
    const yuna = c.state.combatants['yuna']!;
    yuna.hp = Math.floor(yuna.stats.maxHp * 0.6);
    const p = pick(c);
    expect(p.row.category === 'item' || p.row.category === 'whitemagic' || p.row.category === 'dressphere').toBe(true);
    expect(p.reason).toMatch(/Mega Flare/);
  });

  it('puts the Dark Knight on Darkness', () => {
    const c = firstDecisionOf('ffx2-bahamut', 'rikku');
    expect(pick(c).row.label).toBe('Darkness');
  });
});

describe('Chapter 10, Seymour Natus (FFX): Haste only two', () => {
  it('stops casting Haste once two members carry it', () => {
    const c = firstDecisionOf('seymour-natus', 'tidus', 1, 60);
    for (const id of c.state.activeIds.slice(0, 2)) (c.state.combatants[id]!.statuses as Record<string, unknown>)['haste'] = status('haste');
    expect(pick(c).row.label).not.toBe('Haste');
  });
});

describe('Chapter 16, Ixion (FFX-2): heal before the Hammer', () => {
  it('heals on the Recharge tell', () => {
    const c = firstDecisionOf('ffx2-ixion-djose', 'yuna');
    c.state.log = [
      ...c.state.log,
      { seq: c.state.log.length, type: 'action-start', actorId: 'x2-ixion', abilityId: 'x2-ixion-recharge', rank: 3 },
    ] as unknown as BattleState['log'];
    const yuna = c.state.combatants['yuna']!;
    yuna.hp = Math.floor(yuna.stats.maxHp * 0.7);
    expect(pick(c).reason).toMatch(/Hammer/);
  });
});

describe('Chapter 7, Seymour and Anima (FFX): the Nul of his next element', () => {
  it('casts NulTide when the cycle points at water', () => {
    const c = firstDecisionOf('seymour-anima-macalania', 'yuna');
    c.state.flags['macalania.elementStep'] = 2;
    c.state.flags['macalania.act'] = 1;
    for (const id of ['guado-guardian-a', 'guado-guardian-b']) c.state.flags[`macalania.hasPotions.${id}`] = false;
    const talkRow = c.commands.find((r) => r.label === 'Talk');
    if (talkRow) talkRow.enabled = false; // the opener is spent
    expect(pick(c).row.label).toBe('NulTide');
  });
});

describe('Itchy (FFX-2 only): a girl whose whole menu is Change', () => {
  /** The first decision, over a few seeds, of a girl who is Itchy: Paragon's plain attack lands it on Trema's chapter. */
  function itchyDecision(chapter: string): Captured {
    for (let seed = 1; seed <= 40; seed++) {
      let found: Captured | null = null;
      playChapter(chapter, seed, guideLineStrategy, {
        maxDecisions: 300,
        onDecision: (d) => {
          if (found || d.state.combatants[d.actorId]?.statuses['itchy'] === undefined) return;
          found = { state: structuredClone(d.state) as BattleState, actorId: d.actorId, commands: d.commands };
        },
      });
      if (found) return found;
    }
    throw new Error(`${chapter}: nobody went Itchy in 40 seeds`);
  }

  it('Trema: the line names a Change, in the outfit\'s own name, and says why', () => {
    const c = itchyDecision('ffx2-trema');
    expect(c.commands.filter((r) => r.enabled).every((r) => r.command.kind === 'spherechange' || r.command.kind === 'escape')).toBe(true);
    const hit = pick(c);
    expect(hit.command.kind).toBe('spherechange');
    expect(hit.step, 'the chapter has a step of its own for it').not.toBeNull();
    expect(hit.reason).toMatch(/Itchy/);
    const view = buildGuideRail(c.state, { actorId: c.actorId, commands: c.commands })!;
    expect(view.next?.label).toMatch(/^Change to [A-Z][a-z]+( [A-Z][a-z]+)?$/);
  });

  it('goes back to the knight or the Alchemist when that Change is offered', () => {
    const c = itchyDecision('ffx2-trema');
    const home = c.commands.find((r) => r.enabled && r.command.kind === 'spherechange' && ['dark-knight', 'alchemist'].includes(r.label));
    if (!home) return; // this board offers neither: the first Change stands, which the test above pins
    expect(pick(c).row.label).toBe(home.label);
  });

  it('a menu that is only Change gets a Change from any FFX-2 chapter, with or without a step of its own', () => {
    const c = firstDecisionOf('ffx2-bahamut', 'paine');
    const rows = c.commands.filter((r) => r.command.kind === 'spherechange');
    expect(rows.length).toBeGreaterThan(0);
    for (const r of c.commands) r.enabled = r.command.kind === 'spherechange';
    (c.state.combatants[c.actorId]!.statuses as Record<string, unknown>)['itchy'] = status('itchy');
    const hit = pick(c);
    expect(hit.command.kind).toBe('spherechange');
    expect(hit.reason).toMatch(/Itchy/);
  });
});

describe('Chapter 3, Yunalesca (FFX): the form note follows her form', () => {
  it('shows Form I, then Form II, then Form III, read from where the engine keeps the form', () => {
    const c = firstDecisionOf('yunalesca');
    const boss = c.state.combatants['yunalesca']! as unknown as { enemy: { formIndex: number } };
    const labels: string[] = [];
    for (const form of [0, 1, 2]) {
      boss.enemy.formIndex = form;
      labels.push(buildGuideRail(c.state, null)?.phase?.label ?? '');
    }
    expect(labels).toEqual(['Form I', 'Form II', 'Form III']);
  });
});

// --------------------------------------------------------------- the rail

describe('the panel view', () => {
  it('carries no citation and no source, only plain words', () => {
    const c = firstDecisionOf('seymour-flux', 'tidus');
    const view = buildGuideRail(c.state, { actorId: c.actorId, commands: c.commands })!;
    expect(JSON.stringify(view)).not.toMatch(/cite/i);
    expect(view.next?.reason.length ?? 0).toBeGreaterThan(8);
    expect(view.decisionOpen).toBe(true);
    expect(buildGuideRail(c.state, null)!.decisionOpen).toBe(false);
  });

  it('plays a whole chapter by the line as a strategy', () => {
    const run = playChapter('ffx2-bahamut', 1, guideLineStrategy, { maxDecisions: 400 });
    expect(['victory', 'defeat']).toContain(run.outcome);
  });
});
