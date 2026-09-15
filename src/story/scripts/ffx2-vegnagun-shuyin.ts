/**
 * Chapter 5 scripts — the Vegnagun chain then Shuyin (Heart of the Farplane).
 * Scene tags E7 (the four-part chain) **and** E5 (Shuyin), plus the E5-CODA
 * Farplane Glen scene, which is not a battle.
 *
 * Source: `research/writing-bible.md` §3 E7, §3 E5, §3 E5-CODA, §4.2, §5.4.
 *
 * TODO(story-agent): write the real scripts.
 *
 * Structure: five battles with **no menu between** — Tail, Leg, Body, Head,
 * Shuyin. E7's Win-slot lines are **scripted, not sampled**, because the
 * limb-pun gag has to run in order [writing-bible §5.4]; put them in
 * `midScripts` keyed off `ko` triggers on each part, not in `victoryQuips`.
 *
 * Emotional job: taking the weapon apart instead of dying for it, then a
 * thousand years of unfinished grief.
 *
 * Presentation hooks:
 *   - Vegnagun battles open with a **black-hole suck-in**, not the shatter
 *     wipe: `battleStart('blackhole')` [visual-bible §1.18].
 *   - Braska, Auron and Jecht speak from the Farplane during the fights and
 *     Shuyin taunts from the cockpit. Those are **AI-driven no-action flavour
 *     turns** that burn an ATB slot [ffx2-vegnagun-shuyin §2] — they belong in
 *     the enemy ability data, not here, but the lines are the story agent's.
 *   - The Head battle carries a real-time fail timer paired with a visible
 *     cannon charge. Give it exactly one urgency line, not a countdown chorus.
 *   - The party **does not pose on victory** in the Farplane [visual-bible §2.5].
 */

import type { ChapterScripts } from '../dsl.ts';
import { battleStart, narrate, results, say } from '../dsl.ts';

export const ffx2VegnagunShuyinScripts: ChapterScripts = {
  pre: [
    // TODO(story-agent): per writing-bible §3 E7. The party splits into three
    // teams; YRP take the tail.
    say('shinra', 'TODO(story-agent): placeholder.'),
    say('yuna-x2', 'TODO(story-agent): placeholder.'),
    battleStart('blackhole'),
  ],
  post: [
    // TODO(story-agent): the Lenne reunion, then the E5-CODA Farplane Glen.
    say('lenne', 'TODO(story-agent): placeholder.'),
    narrate('TODO(story-agent): Yuna, chapter-narrator register.'),
    results(),
  ],
  victoryQuips: {
    // TODO(story-agent): §5.4. The inter-battle Win-slot lines are scripted in
    // `midScripts`; these are the end-of-chapter quips only.
    yuna: ['Mission complete!'],
    rikku: ['Disaster averted! Mostly!'],
    paine: ['Done.'],
  },
  mid: [
    // TODO(story-agent): one `ko` trigger per Vegnagun part for the scripted
    // limb-pun exchange, plus one urgency beat on the Head's `charge-started`.
  ],
  midScripts: {},
};

export default ffx2VegnagunShuyinScripts;
