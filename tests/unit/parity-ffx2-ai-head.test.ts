/**
 * Re-parity AI lane FFX-2 a: the Vegnagun Head and its two Redoubts follow the game's own scripts (rows H1 to H6, R1 to R4 of
 * `research/re-ffx2-ai-bahamut-vegnagun.md` section 10). **FFX-2 only** (Chapter V, link 4). The decision tables, row by row, on the
 * shipped scripts with a scripted random stream.
 *
 * What stays a timer row until lane W4: the fail clock is counted in polls that issue a command, which are the turns this engine
 * counts, so the 100 is pinned in turns; what it comes to in seconds depends on each command's length and waits.
 */

import { describe, expect, it } from 'vitest';
import { aiUnit } from '../../src/battle/ffx2/fixtures.ts';
import { aiScriptFor, defaultAbilities, HEAD_FIRE_AT_TURN, HEAD_HALFWAY_LINE_AT, HEAD_LINE_INTERVAL } from '../../src/battle/ffx2/index.ts';
import type { Ffx2Unit } from '../../src/battle/ffx2/index.ts';
import { aimOf, giveStatus, RANDOM_MAX, scriptHarness, SEARCH_MAX, triggerNames, type ScriptHarness } from './helpers/ffx2AiScripted.ts';

const MAX_HP = 38420;

function makeHead(hp = MAX_HP): { head: Ffx2Unit; right: Ffx2Unit; left: Ffx2Unit; h: ScriptHarness } {
  const head = aiUnit('vegnagun-head', 'enemy', MAX_HP, 0);
  head.hp = hp;
  head.stats.agi = 36; // the table's value; the script replaces it
  const right = aiUnit('redoubt-r', 'enemy', 2500, 1);
  const left = aiUnit('redoubt-l', 'enemy', 2500, 2);
  // A fallback of 1 keeps every `random() % 5` and `% 4` off its zero, so a poll reaches the ladder unless a test says otherwise.
  return { head, right, left, h: scriptHarness(head, 'vegnagun-head', [right, left], [], 1) };
}

/** A Head already in phase 2 with its first and third polls spent, so the next counted poll is the second. */
function phaseTwo(hp = MAX_HP) {
  const made = makeHead(hp);
  made.h.run(1); // the opening voice
  made.right.alive = false;
  made.left.alive = false;
  expect(made.h.run(1)).toEqual(['acta-est-fabula']); // the phase changes
  made.right.alive = true;
  made.left.alive = true;
  return made;
}

describe('Head, phase 1 [H1, H3, H6]', () => {
  it('starts untargetable with Agility 110 and speaks first', () => {
    const { head, h } = makeHead();
    expect(h.run(1)).toEqual([null]);
    expect(head.stats.agi).toBe(110);
    expect(head.flags.untargetable).toBe(true);
    expect(triggerNames(h.emitted)).toEqual(['shuyin-line-1']);
  });

  it('casts Pallida Mors at one living girl, picked uniformly by one search, while both Redoubts stand', () => {
    const { h } = makeHead();
    h.run(1);
    for (const [raw, who] of [[0, 'yuna'], [1, 'rikku'], [2, 'paine'], [4, 'rikku']] as const) {
      h.rng.reset();
      h.rng.feed(raw);
      const c = h.poll();
      expect(c && 'id' in c ? c.id : null).toBe('pallida-mors');
      expect(aimOf(c)).toEqual([who]); // a target of its own, not left to the engine
      expect(h.rng.calls).toEqual([[0, SEARCH_MAX]]);
    }
  });

  it('does nothing while exactly one Redoubt is alive, and draws nothing', () => {
    const { right, h } = makeHead();
    h.run(1);
    right.alive = false;
    h.rng.reset();
    expect(h.run(5)).toEqual([null, null, null, null, null]);
    expect(h.rng.calls).toEqual([]);
  });

  it('changes phase only when BOTH Redoubts are dead: Acta Est Fabula on both, the Head targetable, the flag up', () => {
    const { head, right, left, h } = makeHead();
    h.run(1);
    right.alive = false;
    expect(h.flags['headPhase']).toBeUndefined();
    expect(h.run(1)).toEqual([null]);
    expect(h.flags['headPhase']).toBeUndefined();
    left.alive = false;
    const c = h.poll();
    expect(c && 'id' in c ? c.id : null).toBe('acta-est-fabula');
    expect(aimOf(c)).toEqual(['redoubt-r', 'redoubt-l']);
    expect(h.flags['headPhase']).toBe('B');
    expect(head.flags.untargetable).toBe(false);
  });

  it('talks after the Redoubts have revived each other twice: Jecht at once, then on a 1-in-4 roll Auron, then two Braska lines', () => {
    const { h } = makeHead();
    h.run(1);
    h.flags['redoubtRevives'] = 2;
    expect(h.run(1)).toEqual([null]); // the first line, no roll
    const poll = (roll: number): string | null => {
      h.rng.reset();
      h.rng.feed(roll);
      const c = h.poll();
      return c && 'id' in c ? c.id : null;
    };
    expect(poll(1)).toBe('pallida-mors'); // random() % 4 = 1: the poll goes on to the attack
    expect(poll(0)).toBeNull(); // random() % 4 = 0, stage 1: the Auron line
    expect(poll(0)).toBeNull(); // stage 2: the Braska pair is queued
    h.rng.reset(); // the second of the pair runs without a poll: no roll
    expect(h.poll()).toBeNull();
    expect(h.rng.calls).toEqual([]);
    expect(poll(0)).toBe('pallida-mors'); // stage 3: the roll is still drawn, nothing is said, the poll goes on
    expect(h.rng.calls[0]).toEqual([0, RANDOM_MAX]);
  });
});

describe('Head, phase 2: the fail clock [H2]', () => {
  it('is 100, with Shuyin\'s lines at 20, 40, 60 and 80 and one more at 51', () => {
    expect(HEAD_FIRE_AT_TURN).toBe(100);
    expect(HEAD_LINE_INTERVAL).toBe(20);
    expect(HEAD_HALFWAY_LINE_AT).toBe(51);
    expect(defaultAbilities.get('acta-est-fabula')?.extra?.['failTimer']).toEqual({ fireAtTurn: 100, lineInterval: 20 });
  });

  it('speaks on the first poll and the third and raises the clock on no other poll that issues a command', () => {
    const { head, h } = phaseTwo();
    h.emitted.length = 0;
    expect(h.run(1)).toEqual([null]); // the first phase-2 poll: Shuyin
    expect(head.stats.agi).toBe(68);
    expect(h.flags['headTurns']).toBeUndefined();
    expect(h.run(1)).toEqual(['mors-certa']); // the second: clock 1
    expect(h.flags['headTurns']).toBe(1);
    expect(h.run(1)).toEqual([null]); // the third: Jecht, no clock
    expect(h.flags['headTurns']).toBe(1);
    expect(h.run(1)).toEqual(['mors-certa']);
    expect(h.flags['headTurns']).toBe(2);
    expect(triggerNames(h.emitted)).toEqual(['shuyin-line-2', 'jecht-no-overtime']);
  });

  it('speaks lines 3, 4, 5 and 6 as the clock reaches 20, 40, 60 and 80, and the halfway line once at 51', () => {
    const { h } = phaseTwo();
    h.run(3); // past the first and third polls
    const lineAt = (count: number): string[] => {
      h.emitted.length = 0;
      h.flags['headTurns'] = count - 1;
      h.poll();
      return triggerNames(h.emitted);
    };
    expect(lineAt(19)).toEqual([]);
    expect(lineAt(20)).toEqual(['shuyin-line-3']);
    expect(lineAt(21)).toEqual([]);
    expect(lineAt(40)).toEqual(['shuyin-line-4']);
    expect(lineAt(51)).toEqual(['auron-halfway']);
    expect(lineAt(52)).toEqual([]); // once
    expect(lineAt(60)).toEqual(['shuyin-line-5']);
    expect(lineAt(80)).toEqual(['shuyin-line-6']);
  });

  it('speaks the highest unspoken line first when the clock has jumped, one per poll', () => {
    const { h } = phaseTwo();
    h.run(3);
    h.flags['headTurns'] = 82; // the Redoubts ran it up
    const spoken: string[] = [];
    for (let i = 0; i < 6; i++) {
      h.emitted.length = 0;
      h.poll();
      spoken.push(...triggerNames(h.emitted));
    }
    expect(spoken).toEqual(['shuyin-line-6', 'shuyin-line-5', 'shuyin-line-4', 'shuyin-line-3', 'auron-halfway']);
  });

  it('ends the world on the Head\'s first counted poll that finds the clock at 100 or more', () => {
    const { h } = phaseTwo();
    h.run(3);
    h.flags['headTurns'] = 98;
    h.poll(); // 99: not yet
    expect(h.flags['badEnding']).toBeUndefined();
    h.flags['headTurns'] = 99; // the Redoubts brought it to 99; this poll makes 100
    expect(h.poll()).toBeNull();
    expect(h.flags['badEnding']).toBe(true);
    expect(triggerNames(h.emitted)).toContain('shuyin-line-7');
  });

  it('does not start counting in phase 1: stalling there is not punished', () => {
    const { right, h } = makeHead();
    h.run(1);
    right.alive = false;
    h.run(500);
    expect(h.flags['headTurns']).toBeUndefined();
    expect(h.flags['badEnding']).toBeUndefined();
  });
});

describe('Head, phase 2: the attack ladder [H4, H5]', () => {
  const ladderAt = (hp: number, canon = 0) => {
    const made = phaseTwo(hp);
    // The first and third phase-2 polls speak; stand the Head at its fourth with the talk flags as given.
    made.h.ctx.self.aiMemory = { ...made.h.ctx.self.aiMemory, canon, phaseTwoPolls: 3 };
    made.h.flags['headTurns'] = 3;
    return made;
  };
  const next = (made: { h: ScriptHarness }) => {
    // mute the voice lines the thresholds would trigger so the poll reaches the ladder
    Object.assign(made.h.ctx.self.aiMemory ?? {}, { lowLine: 1, halfLine: 1, aloneLine: 1, jectLine: 1, braskaLine: 1 });
    made.h.rng.reset();
    made.h.rng.feed(1);
    const c = made.h.poll();
    return c && 'id' in c ? c.id : null;
  };

  it('is strict and integer: 4/5 of 38,420 is 30,736, and a Head at exactly that does not cast Nemo', () => {
    expect(next(ladderAt(30736))).toBe('mors-certa');
    expect(next(ladderAt(30735))).toBe('nemo-ante-mortem-beatus');
    expect(next(ladderAt(23052))).toBe('nemo-ante-mortem-beatus'); // band 1 (below 4/5), first time
    expect(next(ladderAt(23051))).toBe('nemo-ante-mortem-beatus'); // band 2
    expect(next(ladderAt(15368))).toBe('nemo-ante-mortem-beatus');
    expect(next(ladderAt(7684))).toBe('nemo-ante-mortem-beatus');
  });

  it('casts one Nemo per band it has not paid, and none for a band it has', () => {
    expect(next(ladderAt(30735, 1))).toBe('mors-certa'); // band 1 is paid
    expect(next(ladderAt(23051, 1))).toBe('nemo-ante-mortem-beatus');
    expect(next(ladderAt(23051, 2))).toBe('mors-certa');
    expect(next(ladderAt(7683, 3))).toBe('nemo-ante-mortem-beatus'); // band 4 is above band 3
    expect(next(ladderAt(7683, 4))).toBe('mors-certa');
  });

  it('pays one Nemo for a fall through several bands and skips the rest: at most four Nemo in a fight', () => {
    const made = ladderAt(MAX_HP);
    made.h.ctx.self.hp = 5000; // from full to below a fifth in one blow
    expect(next(made)).toBe('nemo-ante-mortem-beatus');
    expect(made.h.ctx.self.aiMemory?.['canon']).toBe(4);
    expect(next(made)).toBe('mors-certa'); // the bands in between are never paid back
    expect(next(made)).toBe('mors-certa');
  });

  it('counts every damaging result in phase 2, fifteen of them for an Odi Et Amo, and starts again', () => {
    const made = ladderAt(MAX_HP);
    const script = aiScriptFor('vegnagun-head');
    script.onDamaged?.(made.h.ctx, 'yuna', 900, 9); // nine results in one action
    script.onDamaged?.(made.h.ctx, 'rikku', 100, 5);
    expect(next(made)).toBe('mors-certa'); // 14
    script.onDamaged?.(made.h.ctx, 'paine', 10, 1); // 15
    expect(next(made)).toBe('odi-et-amo');
    expect(made.h.ctx.self.aiMemory?.['hangeki']).toBe(0);
    expect(next(made)).toBe('mors-certa');
  });

  it('counts nothing in phase 1', () => {
    const { head, h } = makeHead();
    h.run(1);
    aiScriptFor('vegnagun-head').onDamaged?.(h.ctx, 'yuna', 900, 12);
    expect(head.aiMemory?.['hangeki'] ?? 0).toBe(0);
  });

  it('casts Acta Est Fabula on the Redoubts again when both are down, before the ladder', () => {
    const made = ladderAt(MAX_HP);
    made.right.alive = false;
    made.left.alive = false;
    expect(next(made)).toBe('acta-est-fabula');
  });

  it('speaks once when below a fifth of his HP and once below a half, and rolls 1 in 5 for three more lines, each once', () => {
    const made = ladderAt(7683);
    Object.assign(made.h.ctx.self.aiMemory ?? {}, { lowLine: 0, halfLine: 0 });
    expect(made.h.run(1)).toEqual([null]); // below a fifth
    expect(made.h.run(1)).toEqual([null]); // below a half
    made.h.rng.reset();
    made.h.rng.feed(0, 0); // random() % 5 = 0, then random() % 3 = 0
    expect(made.h.run(1)).toEqual([null]);
    made.h.rng.feed(0, 0); // the same line is spent: the poll goes on
    expect(made.h.run(1)).not.toEqual([null]);
  });
});

describe('Redoubts [R1 to R4]', () => {
  function redoubts(): { right: Ffx2Unit; left: Ffx2Unit; head: Ffx2Unit; hr: ScriptHarness; hl: ScriptHarness } {
    const head = aiUnit('vegnagun-head', 'enemy', MAX_HP, 0);
    head.flags.untargetable = true;
    const right = aiUnit('redoubt-r', 'enemy', 2500, 1);
    const left = aiUnit('redoubt-l', 'enemy', 2500, 2);
    const hr = scriptHarness(right, 'vegnagun-redoubt', [left, head]);
    const hl = scriptHarness(left, 'vegnagun-redoubt', [right, head]);
    hl.flags = hr.flags;
    Object.assign(hl.ctx, { flags: hr.flags });
    return { right, left, head, hr, hl };
  }
  const fall = (h: ScriptHarness): void => {
    h.ctx.self.alive = false;
    aiScriptFor('vegnagun-redoubt').onTurnResolved?.(h.ctx, h.ctx.self);
    h.ctx.self.alive = true;
  };

  it('does nothing in phase 1 while the other Redoubt lives, and revives it, counting the revive, when it is dead', () => {
    const { left, hr } = redoubts();
    expect(hr.run(3)).toEqual([null, null, null]);
    expect(hr.rng.calls).toEqual([]);
    left.alive = false;
    const c = hr.poll();
    expect(c && 'id' in c ? [c.id, ...c.targets] : null).toEqual(['full-life', 'redoubt-l']);
    expect(hr.flags['redoubtRevives']).toBe(1);
    hr.poll();
    expect(hr.flags['redoubtRevives']).toBe(2);
  });

  it('runs Break, HP beam, Blind, Flare for the Right, but starts at the HP beam: its death entry sets the counter to 1', () => {
    const { hr } = redoubts();
    hr.flags['headPhase'] = 'B';
    fall(hr);
    expect(hr.run(9)).toEqual(['lacrimosa-r', 'blind', 'flare', 'leg-break', 'lacrimosa-r', 'blind', 'flare', 'leg-break', 'lacrimosa-r']);
  });

  it('runs MP beam, Slow, Dispel, Demi for the Left, starting at the MP beam (death sets its counter to 0)', () => {
    const { hl } = redoubts();
    hl.flags['headPhase'] = 'B';
    fall(hl);
    expect(hl.run(8)).toEqual(['lacrimosa-l', 'leg-slow', 'dispel', 'demi', 'lacrimosa-l', 'leg-slow', 'dispel', 'demi']);
  });

  it('with the twin dead acts twice and then revives it, the revive using up one place of the four', () => {
    const { right, left, hr } = redoubts();
    hr.flags['headPhase'] = 'B';
    fall(hr);
    left.alive = false;
    expect(hr.run(7)).toEqual(['lacrimosa-r', 'blind', 'full-life', 'flare', 'leg-break', 'full-life', 'blind']);
    expect(right.aiMemory?.['turn']).toBe(3);
  });

  it('raises the shared clock on every phase-2 poll, the revive poll included, and not in phase 1', () => {
    const { left, hr } = redoubts();
    hr.run(4);
    expect(hr.flags['headTurns']).toBeUndefined();
    hr.flags['headPhase'] = 'B';
    left.alive = false;
    hr.run(3); // act, act, revive
    expect(hr.flags['headTurns']).toBe(3);
  });

  it("prefers a girl who lacks Darkness for the Right's Blind", () => {
    const { hr } = redoubts();
    hr.flags['headPhase'] = 'B';
    fall(hr);
    hr.run(1); // the HP beam
    giveStatus(hr.girls[0]!, 'darkness');
    giveStatus(hr.girls[1]!, 'darkness');
    const blind = hr.poll();
    expect(blind && 'id' in blind ? blind.id : null).toBe('blind');
    expect(aimOf(blind)).toEqual(['paine']);
  });

  it("prefers a girl who is not Petrified for the Right's Break", () => {
    const { hr } = redoubts();
    hr.flags['headPhase'] = 'B';
    fall(hr);
    hr.run(3); // the HP beam, Blind, Flare
    giveStatus(hr.girls[0]!, 'petrify');
    giveStatus(hr.girls[1]!, 'petrify');
    const breakCast = hr.poll();
    expect(breakCast && 'id' in breakCast ? breakCast.id : null).toBe('leg-break');
    expect(aimOf(breakCast)).toEqual(['paine']);
  });

  it("prefers a girl who lacks Slow for the Left's Slow", () => {
    const { hl } = redoubts();
    hl.flags['headPhase'] = 'B';
    fall(hl);
    hl.run(1); // the MP beam
    giveStatus(hl.girls[0]!, 'slow');
    giveStatus(hl.girls[2]!, 'slow');
    const slow = hl.poll();
    expect(slow && 'id' in slow ? slow.id : null).toBe('leg-slow');
    expect(aimOf(slow)).toEqual(['rikku']);
  });

  it('falls back to any living girl when every girl has the status already', () => {
    const { hr } = redoubts();
    hr.flags['headPhase'] = 'B';
    fall(hr);
    hr.run(1); // the HP beam; the next is Blind
    for (const g of hr.girls) giveStatus(g, 'darkness');
    hr.rng.reset();
    hr.rng.feed(2); // the empty first search draws nothing; the second takes raw 2 of three
    expect(aimOf(hr.poll())).toEqual(['paine']);
    expect(hr.rng.calls).toEqual([[0, SEARCH_MAX]]);
  });

  it('makes the Head targetable the moment the second Redoubt falls, before the Head polls', () => {
    const { head, right, left, hr } = redoubts();
    right.alive = false;
    aiScriptFor('vegnagun-redoubt').onTurnResolved?.(hr.ctx, right);
    expect(head.flags.untargetable).toBe(true);
    left.alive = false;
    aiScriptFor('vegnagun-redoubt').onTurnResolved?.(hr.ctx, left);
    expect(head.flags.untargetable).toBe(false);
  });
});
