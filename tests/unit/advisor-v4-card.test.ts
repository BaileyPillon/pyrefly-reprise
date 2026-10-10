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
 *    lists Slow both ways, `research/ffx-seymour-flux.md` §1.3, see the handoff; Hastega on the untouched
 *    boards since the boss ran the game's own script, 2026-10-09, see the pin at the end).
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
    // Seed 3 moved on 2026-10-08 (re-parity W1, FFX only: hit, critical and damage rolls through the game's kernels). Its
    // first menu is a Zombie board either way (Lance of Atrophy lands on Yuna and the Zombie with it: 761 damage and a
    // pick of Slow before; 792 damage, Yuna on 708 of 1500 and a pick of Holy Water now). The card's own rule says the
    // same as the search now does ("While Yuna is a Zombie the next Full-Life is a kill, not a heal: clear it now").
    // Restoring only Cross Cleave's old accuracy formula leaves the seed-3 pick unchanged, so it is the whole wired
    // engine's numbers and not one change; seeds 1 and 2 open on an untouched board and still pick Slow.
    // Seeds 1 and 2 and seed 3 moved on 2026-10-09 (re-parity AI-Seymour, FFX only): Seymour Flux and the Mortiorchis now follow the
    // game's own scripts (research/re-ffx-ai-seymour.md D-01 to D-08: one shared cycle state, the mount copying Flux's CTB counter
    // after its turn). The search replays the engine's fight, so on an untouched board its best first move is Hastega, where it
    // was Slow (seed 5 and 6 open the same way). Seed 3's first menu is a Zombie board either way, with Lance of Atrophy now
    // landing on Kimahri instead of Yuna: the pick is Holy Water on the Zombie, the card's own rule. Nothing on the advisor, the
    // boss or the party was tuned; the guide's wording on the opening is listed in docs/handoff/re-parity-ai-seymour.md.
    // Seed 3 moved again on 2026-10-10 (re-parity W2 merged onto release candidate 1, FFX only: the opening counters are the game's 26 fixed
    // draws and statuses roll through the game's infliction step, so the turns before the first menu changed; seeds 1 and 2 open on an untouched
    // board and still pick Hastega). Its first menu is a Zombie board either way, and the Zombie is Yuna's now (she is the healer): the pick
    // is Holy Water on her, which is the card's own rule (while Yuna is a Zombie the next Full-Life is a kill, not a heal: clear it now).
    // Nothing on the advisor, the boss or the party was tuned.
    expect(picks).toEqual(['tidus: Hastega -> the party', 'tidus: Hastega -> the party', 'tidus: Holy Water -> Yuna']);
  }, 600_000);
});
