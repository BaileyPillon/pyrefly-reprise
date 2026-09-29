// @vitest-environment jsdom
/**
 * **Advisor v4 on the card** (docs/handoff/advisor-v4.md):
 *
 *  - `lift` puts a row the card priced on top with its own numbers, and names the chapter's line
 *    beside it; a row the card did not price leaves the card exactly as v3 drew it;
 *  - `MoveAdvisor` reads the look-ahead once, at menu open: a finished card is shown, no answer or a
 *    failing look-ahead leaves v3's card, and an answer arriving while the menu is open changes
 *    nothing (rule 9: no thinking state, no card flip);
 *  - Chapter I's opening, through the worker at the desktop budget: the search's pick on the first
 *    menu (the method check's census: Slow on Seymour Flux, which the engine lands; the research
 *    lists Slow both ways, `research/ffx-seymour-flux.md` §1.3, see the handoff).
 *
 * Game case: FFX only.
 */

import { afterEach, describe, expect, it } from 'vitest';
import type { AvailableCommand, BattleState, CombatantId, Command, Decision } from '../../src/battle/common/types.ts';
import { FFXEngine } from '../../src/battle/ffx/index.ts';
import { registerBattleContent } from '../../src/app/screens/BattleScreenContent.ts';
import { setupForChapter } from '../../src/app/screens/BattleScreenSetup.ts';
import { CHAPTERS } from '../../src/data/encounters.ts';
import { buildAdvisorView, sameCommand, type AdvisorView } from '../../src/engine/tactics/advisor.ts';
import { MoveAdvisor, type MoveAdvisorLookAhead } from '../../src/ui/common/MoveAdvisor.ts';
import { AdvisorV4Host } from '../../src/app/advisorV4/host.ts';
import { InProcWorker } from '../../critic/bench/advisor-v4/inproc-worker.ts';

type Input = Extract<Decision, { kind: 'player-input' }>;

async function menuOf(chapterId: string, seed: number): Promise<{ e: FFXEngine; d: Input }> {
  await registerBattleContent();
  const e = new FFXEngine();
  const setup = setupForChapter(CHAPTERS.find((c) => c.id === chapterId)!, seed);
  e.setSeed(setup.seed);
  e.init(setup);
  let d = e.nextDecision();
  while (d.kind === 'resolved') d = e.nextDecision();
  if (d.kind !== 'player-input') throw new Error('no menu');
  return { e, d };
}

const live: MoveAdvisor[] = [];
afterEach(() => {
  for (const a of live.splice(0)) a.unmount();
  document.body.innerHTML = '';
});

function mounted(): MoveAdvisor {
  const stage = document.createElement('div');
  document.body.appendChild(stage);
  const a = new MoveAdvisor({ game: 'ffx', anchors: { left: 196, right: 414, bottom: 26 }, readVisible: () => true, writeVisible: () => undefined });
  a.mount(stage);
  live.push(a);
  return a;
}

describe('advisor v4 on the card (FFX)', () => {
  it('lift: a priced row goes on top with its own numbers; an unpriced one leaves v3’s card', async () => {
    const { e, d } = await menuOf('yunalesca', 2);
    const v3 = buildAdvisorView(e.state(), d, {})!;
    expect(v3).not.toBeNull();
    // Every enabled row aimed at its first target: at least one the card priced and did not put on top.
    let lifted: AdvisorView | null = null;
    let pick: Command | null = null;
    for (const r of d.commands) {
      if (!r.enabled || r.wrapsCategory) continue;
      const cmd = { ...r.command, targets: r.validTargets[0] ? [r.validTargets[0]] : [] } as Command;
      if (sameCommand(cmd, v3.suggestions[0]!.command)) continue;
      const v = buildAdvisorView(e.state(), d, { lift: cmd });
      if (v && sameCommand(v.suggestions[0]!.command, cmd)) {
        lifted = v;
        pick = cmd;
        break;
      }
    }
    expect(lifted, 'some row other than the top was priced').not.toBeNull();
    expect(lifted!.suggestions[0]!.label.length).toBeGreaterThan(0);
    expect(lifted!.suggestions.some((s) => sameCommand(s.command, pick!))).toBe(true);
    const bogus = { kind: 'ability', id: 'no-such-row', targets: [] } as unknown as Command;
    expect(buildAdvisorView(e.state(), d, { lift: bogus })).toEqual(v3);
  }, 120_000);

  it('MoveAdvisor reads the look-ahead once, at menu open, and never flips the card', async () => {
    const { e, d } = await menuOf('yunalesca', 2);
    const v3 = buildAdvisorView(e.state(), d, {})!;
    const fake: AdvisorView = { ...v3, suggestions: [...v3.suggestions].reverse() };
    let answer: AdvisorView | null = null;
    let reads = 0;
    let closes = 0;
    const source: MoveAdvisorLookAhead = {
      cardFor: () => {
        reads += 1;
        return answer;
      },
      closed: () => {
        closes += 1;
      },
    };
    const a = mounted();
    a.setLookAhead(source);
    const commands = d.commands as AvailableCommand[];
    // No answer yet: v3's card.
    a.showDecision(d.actorId as CombatantId, commands, e.state() as BattleState);
    expect(a.view()).toEqual(v3);
    // The answer arrives while the menu is open: the card does not change.
    answer = fake;
    a.sync(e.state());
    expect(a.view()).toEqual(v3);
    expect(reads).toBe(1);
    a.clearDecision();
    expect(closes).toBe(1);
    // The next menu on a board with a finished answer shows it.
    a.showDecision(d.actorId as CombatantId, commands, e.state() as BattleState);
    expect(a.view()).toBe(fake);
    // A look-ahead that throws leaves v3's card, never an empty one.
    a.clearDecision();
    a.setLookAhead({ cardFor: () => { throw new Error('boom'); }, closed: () => undefined });
    a.showDecision(d.actorId as CombatantId, commands, e.state() as BattleState);
    expect(a.view()).toEqual(v3);
  }, 120_000);

  it('Chapter I, first menu, through the worker at the desktop budget', async () => {
    const picks: string[] = [];
    for (const seed of [1, 2, 3]) {
      const e = new FFXEngine();
      await registerBattleContent();
      const setup = setupForChapter(CHAPTERS.find((c) => c.id === 'seymour-flux')!, seed);
      e.setSeed(setup.seed);
      e.init(setup);
      const w = new InProcWorker();
      const host = new AdvisorV4Host({ spawn: () => w, budget: 'lean', capMs: 600_000 });
      host.bind(e);
      host.boardFixed();
      await w.idle();
      let d = e.nextDecision();
      while (d.kind === 'resolved') d = e.nextDecision();
      if (d.kind !== 'player-input') throw new Error('no menu');
      const card = host.cardFor(e.state(), d)!;
      const top = card.suggestions[0]!;
      picks.push(`${d.actorId}: ${top.label} -> ${top.targetName ?? '-'}`);
    }
    // Measured 2026-09-28: the prototype's census move (12 of 12 seeds there), through the worker.
    expect(picks).toEqual(['tidus: Slow -> Seymour Flux', 'tidus: Slow -> Seymour Flux', 'tidus: Slow -> Seymour Flux']);
  }, 600_000);
});
