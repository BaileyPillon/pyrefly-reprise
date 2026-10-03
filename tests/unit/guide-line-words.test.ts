// @vitest-environment jsdom
/**
 * The strategy guide reads as a plain, confident strategy guide: nothing the player can see in it names
 * where advice came from.
 *
 * Bailey, 2026-10-03, in order: "from now on the guide follows the ffx/ffx-2 encounter guides from
 * jegged"; then "Do not say adapted from Jegged or cite worded that just sounds stupid". The data keeps
 * its provenance fields for maintainers (`cite` on every rule, `from` on every line step), but the
 * panel prints neither. This file scans every string the panel can render, in all eighteen chapters and
 * both games, for any word that names a source, a citation, an adaptation or a section.
 *
 * Two halves, because a data scan alone would miss a string the UI adds and a DOM scan alone would miss
 * a chapter nobody reached: **the data** (titles, RULES under every clock, WATCH, phase notes, every
 * NEXT reason, the panel's own words) and **the panel** (the real text and attributes of the mounted
 * rail on real boards, every chapter).
 *
 * **Game case: both** [AGENTS.md rule 14].
 */

import { describe, expect, it } from 'vitest';
import type { BattleState } from '../../src/battle/common/types.ts';
import { GUIDES, rulesOnClock } from '../../src/data/guides/index.ts';
import type { GuideClock } from '../../src/data/guides/index.ts';
import { LINE_CHANGE_WHY, LINE_FALLBACK_WHY, LINE_QUIET_WHY } from '../../src/engine/tactics/guide-line.ts';
import { GUIDE_NO_STEP_TEXT, GUIDE_WAITING_TEXT, StrategyGuide } from '../../src/ui/common/StrategyGuide.ts';
import { guideLineStrategy } from '../../src/engine/tactics/guide-line.ts';
import { guidedChapters, playChapter } from './helpers/guideLineDrive.ts';

/** The brief's own pattern: a source, a citation, an adaptation, a section sign or a research path. */
const NAMES_A_SOURCE = /jegged|adapt|source|cite|citation|§|research\//i;

const CLOCKS: readonly GuideClock[] = ['active', 'wait', 'hold'];

/** Every string of the written content, with a label for the failure message. */
function writtenStrings(): Array<[string, string]> {
  const out: Array<[string, string]> = [];
  for (const g of GUIDES) {
    out.push([`${g.id} title`, g.title]);
    for (const [id, t] of Object.entries(g.linkTitles ?? {})) out.push([`${g.id} link title ${id}`, t]);
    for (const clock of CLOCKS) {
      for (const [i, r] of rulesOnClock(g, clock).entries()) {
        out.push([`${g.id} rule ${i} (${clock}) text`, r.text]);
        out.push([`${g.id} rule ${i} (${clock}) short`, r.short]);
      }
    }
    for (const [i, w] of g.watch.entries()) {
      out.push([`${g.id} watch ${i} payload`, w.payload]);
      out.push([`${g.id} watch ${i} advice`, w.advice]);
    }
    for (const [i, p] of g.phases.entries()) {
      out.push([`${g.id} phase ${i} label`, p.label]);
      out.push([`${g.id} phase ${i} note`, p.note]);
    }
    for (const [i, s] of (g.line ?? []).entries()) out.push([`${g.id} line step ${i}`, s.why.replace(/\{target\}|\{actor\}/g, 'Tidus')]);
  }
  return out;
}

/** The words the panel and the evaluator add themselves. */
const PANEL_WORDS: Array<[string, string]> = [
  ['last-resort reason', LINE_FALLBACK_WHY],
  ['quiet-turn reason', LINE_QUIET_WHY],
  ['change-only reason', LINE_CHANGE_WHY],
  ['idle text, no decision', GUIDE_WAITING_TEXT],
  ['idle text, decision open', GUIDE_NO_STEP_TEXT],
  ['section head', 'Next'],
  ['section head', 'Watch'],
  ['section head', 'Rules'],
  ['toggle tooltip', 'Hide the strategy guide'],
  ['toggle tooltip', 'Show the strategy guide'],
  ['toggle chip', 'hide guide'],
  ['more row', 'MORE'],
];

describe('the written content never names a source', () => {
  it('has eighteen chapters to read', () => {
    expect(GUIDES.length).toBe(18);
    expect(writtenStrings().length).toBeGreaterThan(500);
  });

  it('prints no source, citation, adaptation or section sign in a title, a rule, a watch line, a phase note or a NEXT reason', () => {
    const bad = writtenStrings().filter(([, text]) => NAMES_A_SOURCE.test(text));
    expect(bad.map(([where, text]) => `${where}: ${text.slice(0, 120)}`)).toEqual([]);
  });

  it('prints none in the words the panel adds itself', () => {
    const bad = PANEL_WORDS.filter(([, text]) => NAMES_A_SOURCE.test(text));
    expect(bad).toEqual([]);
  });

  it('keeps the provenance for maintainers: a cite on every rule and a pointer on every line step', () => {
    for (const g of GUIDES) {
      for (const r of g.rules) expect(r.cite.length, g.id).toBeGreaterThan(3);
      for (const s of g.line ?? []) expect(s.from.length, g.id).toBeGreaterThan(3);
    }
  });

  it('the pattern itself catches what it is for', () => {
    for (const text of ['adapted from Jegged', 'per Jegged', 'see §3.2', 'ffx-seymour-flux §6', 'a source says', 'research/ffx-sin.md', 'cite', 'the citation']) {
      expect(NAMES_A_SOURCE.test(text), text).toBe(true);
    }
  });
});

describe('the mounted panel never names a source, on real boards in every chapter', () => {
  /** Mount the rail on one board and return everything a player could read: text, titles, labels. */
  function readPanel(game: 'ffx' | 'ffx2', state: Readonly<BattleState>, decision: Parameters<StrategyGuide['showDecision']>[1] | null, actor: string): string {
    const stage = document.createElement('div');
    document.body.appendChild(stage);
    const guide = new StrategyGuide({
      game,
      anchors: { top: 44, bottom: 34 },
      readVisible: () => true,
      writeVisible: () => undefined,
    });
    guide.mount(stage);
    guide.sync(state);
    if (decision) guide.showDecision(actor, decision, state);
    const attrs = Array.from(guide.el.querySelectorAll('[title],[aria-label]')).map(
      (e) => `${e.getAttribute('title') ?? ''} ${e.getAttribute('aria-label') ?? ''}`,
    );
    const text = `${guide.el.textContent ?? ''} ${attrs.join(' ')} ${guide.el.innerHTML.includes('sgd__cite') ? 'sgd__cite' : ''}`;
    guide.unmount();
    stage.remove();
    return text;
  }

  it.each(guidedChapters().map((c) => [c.id, c.game as 'ffx' | 'ffx2'] as const))('%s', (id, game) => {
    const texts: string[] = [];
    const wanted = new Set([1, 4, 12, 30, 70]); // the opening, the early turns, the middle, the late game
    let n = 0;
    playChapter(id, 1, guideLineStrategy, {
      maxDecisions: 80,
      onDecision: (d) => {
        n += 1;
        if (wanted.has(n)) texts.push(readPanel(game, d.state, d.commands, d.actorId));
        if (n === 2) texts.push(readPanel(game, d.state, null, d.actorId)); // a board with no decision open
      },
    });
    expect(texts.length).toBeGreaterThanOrEqual(2);
    const bad = texts.filter((t) => NAMES_A_SOURCE.test(t));
    expect(bad.map((t) => t.slice(0, 200))).toEqual([]);
    for (const t of texts) expect(t.length).toBeGreaterThan(40); // the panel actually printed something
  });
});
