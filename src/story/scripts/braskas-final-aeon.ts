/**
 * Chapter 3 scripts — Braska's Final Aeon -> possessed aeons -> Yu Yevon
 * (Dream's End / Inside Sin). Scene tags E3 **and** E4.
 *
 * Source: `research/writing-bible.md` §3 E3 (the father; the promise kept) and
 * §3 E4 (aftermath, not challenge), §4.1, §5.4.
 *
 * TODO(story-agent): write the real scripts.
 *
 * This chapter is one continuous run of battles with no menu between, so the
 * "post" script covers the whole tail: Jecht's passing, Yu Yevon seeking a new
 * host, the aeon gauntlet, Yu Yevon, the Sending. Use `mid` triggers for the
 * beats **inside** the chain and keep `post` for the ending.
 *
 * E4's tone rule [writing-bible §3 E4]: aftermath, not challenge. Yu Yevon
 * never speaks. The party cannot lose (the fayth's permanent Auto-Life), and
 * the writing must not pretend otherwise — the dread is that it will not stop,
 * not that they will die.
 *
 * **Never fire a victory quip after a loss-shaped victory** — each destroyed
 * aeon is a bereavement. Use the §3 mid-battle grief lines and suppress the
 * tally flourish for those wins [writing-bible §5.4].
 *
 * Mechanics hooks:
 *   - The in-battle **Talk** trigger: two charges, the effect lands on BFA's
 *     next turn which he then loses, and it is offered a useless third time
 *     [visual-bible §3.12.2]. The third, inert Talk is characterisation — give
 *     it a line ("…") and nothing else.
 *   - `form-change` when he draws the sword out of his own chest.
 *   - One `ko` beat per possessed aeon.
 */

import type { ChapterScripts } from '../dsl.ts';
import { battleStart, narrate, results, say } from '../dsl.ts';

export const braskasFinalAeonScripts: ChapterScripts = {
  pre: [
    // TODO(story-agent): per writing-bible §3 E3.
    narrate('TODO(story-agent): Tidus, past tense, inside Sin.'),
    say('jecht', 'TODO(story-agent): placeholder.'),
    battleStart(),
  ],
  post: [
    // TODO(story-agent): Jecht's passing, the gauntlet's aftermath, Yu Yevon,
    // the Sending, and the ending narration.
    say('tidus', 'TODO(story-agent): placeholder.'),
    results(),
  ],
  victoryQuips: {
    // TODO(story-agent): §5.4. Suppressed entirely for the aeon kills — see the
    // header note. These are the tail-of-chapter lines only.
    tidus: ['…Okay. Next one.'],
    yuna: ['May they rest.'],
    auron: ['It isn’t over.'],
    wakka: ['…Ya. Okay. Ya.'],
    lulu: ['Don’t celebrate yet.'],
    kimahri: ['Kimahri remembers.'],
    rikku: ['…Can we not do that again?'],
  },
  mid: [
    // TODO(story-agent): form-change to BFA form 2; one grief beat per
    // possessed aeon; the inert third Talk.
  ],
  midScripts: {},
};

export default braskasFinalAeonScripts;
