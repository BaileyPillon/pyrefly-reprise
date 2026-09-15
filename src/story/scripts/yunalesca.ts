/**
 * Chapter 2 scripts — Lady Yunalesca (Zanarkand Dome, The Beyond). Scene tag E2.
 *
 * Source: `research/writing-bible.md` §3 E2, §4.1, §5.4 (grim column).
 *
 * TODO(story-agent): write the real scripts.
 *
 * Canonical beats: the pyrefly memory of Braska, Jecht and a young, two-eyed
 * Auron; Yunalesca explains the cycle and the price of the Final Aeon; she
 * offers Yuna the same bargain she gave Braska; Yuna refuses. Yunalesca is one
 * of only two characters permitted to state the game's thesis aloud
 * [writing-bible §1.0 rule 3].
 *
 * Use the **"Yes." beat** at most once per encounter [writing-bible §2.1] —
 * this is the encounter where it belongs.
 *
 * Mid-battle beats worth wiring:
 *   - `form-change` to form II and to form III: she is crueller each time, and
 *     the player needs to hear the fight change shape.
 *   - `status-applied` Zombie on a party member: the core lesson is that
 *     **staying Zombie is correct** going into form III [ffx-yunalesca §10.1].
 *     One line, not a tutorial.
 *   - `charge-started` for Mega Death.
 */

import type { ChapterScripts } from '../dsl.ts';
import { battleStart, narrate, results, say } from '../dsl.ts';

export const yunalescaScripts: ChapterScripts = {
  pre: [
    // TODO(story-agent): per writing-bible §3 E2.
    narrate('TODO(story-agent): Tidus, past tense, over the dome.'),
    say('yunalesca', 'TODO(story-agent): placeholder.'),
    battleStart(),
  ],
  post: [
    // TODO(story-agent): her sending, and what the party decides afterwards.
    say('yuna', 'TODO(story-agent): placeholder.'),
    results(),
  ],
  victoryQuips: {
    // TODO(story-agent): §5.4 — E2 is grim; suppress the light variants.
    tidus: ['…Okay. Next one.'],
    yuna: ['May they rest.'],
    auron: ['It isn’t over.'],
    wakka: ['…Ya. Okay. Ya.'],
    lulu: ['Don’t celebrate yet.'],
    kimahri: ['Kimahri remembers.'],
    rikku: ['…Can we not do that again?'],
  },
  mid: [
    // TODO(story-agent): form-change beats for forms II and III.
  ],
  midScripts: {},
};

export default yunalescaScripts;
