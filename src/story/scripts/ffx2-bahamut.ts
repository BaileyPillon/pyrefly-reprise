/**
 * Chapter 4 scripts — Bahamut (Bevelle Underground, Limbo). Scene tag E6.
 *
 * Source: `research/writing-bible.md` §3 E6, §4.2 (YRP banter bank), §5.4.
 *
 * TODO(story-agent): write the real scripts.
 *
 * Story knowledge state [writing-bible §0.3]: write to **Chapter 2**. The
 * Gullwings are still allied-by-necessity with the Leblanc Syndicate, Paine has
 * not had her Crimson Squad reckoning, and Yuna has not yet learned what Shuyin
 * is. The chapter *number* is a label; do not let "Ch. 3" leak into what the
 * characters know.
 *
 * Emotional job: **Yuna killing what she once summoned — the only fight the
 * game forbids you to celebrate.**
 *
 * > **This chapter suppresses the entire victory flourish.** No victory pose,
 * > no fanfare, no Win-slot banter and no results flourish; the Results screen
 * > comes up silent [writing-bible §5.4]. That is why `results(true)` is used
 * > below and why `victoryQuips` is deliberately empty. **Do not fill it in.**
 *
 * Use the FFX-2 register [writing-bible §2.2]: three-beat banter (Rikku sets up
 * -> Yuna reacts -> Paine kills it), overlap with em dashes, and **exactly one**
 * sincere exchange before the banter resumes. Here the sincerity lands after
 * the fight, not before it.
 */

import type { ChapterScripts } from '../dsl.ts';
import { battleStart, results, say } from '../dsl.ts';

export const ffx2BahamutScripts: ChapterScripts = {
  pre: [
    // TODO(story-agent): per writing-bible §3 E6. Baralai flees; the Gullwings
    // find the empty Vegnagun chamber and the aeon.
    say('rikku-x2', 'TODO(story-agent): placeholder.'),
    say('paine', 'TODO(story-agent): placeholder.'),
    battleStart(),
  ],
  post: [
    // TODO(story-agent): silence, then one sincere exchange. No mission-complete
    // sting.
    say('yuna-x2', 'TODO(story-agent): placeholder.'),
    results(true),
  ],
  /** Deliberately empty — Chapter 4 serves no victory quips [writing-bible §5.4]. */
  victoryQuips: {},
  mid: [
    // TODO(story-agent): at most one beat. This fight is quiet.
  ],
  midScripts: {},
};

export default ffx2BahamutScripts;
