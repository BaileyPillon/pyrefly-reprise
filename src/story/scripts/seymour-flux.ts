/**
 * Chapter 1 scripts — Seymour Flux (Mt. Gagazet, the Prominence). Scene tag E1.
 *
 * Source: `research/writing-bible.md` §3 E1 (canonical beat map, 22 pre-battle
 * lines, post-battle lines), §4.1 (banter bank), §5.4 (victory quips — use the
 * **grim** column here).
 *
 * TODO(story-agent): write the real scripts.
 *
 * Non-negotiable canonical beats [writing-bible §3 E1]:
 *   Pre 3  Kimahri charges — the loudest he is in the entire game.
 *   Pre 4  Seymour tells Kimahri precisely how the Ronso died.
 *   Pre 5  **Seymour reveals Jecht is Sin and offers Tidus the bargain.**
 *          This is the chapter's thematic hinge; do not cut it.
 *   Pre 6  Yuna refuses; Tidus refuses to be bought with his father.
 *   Post 11 Tidus and Auron tell Yuna that Sin is Jecht.
 *   Post 12 The Fayth Scar.
 *   Post 13 The fayth boy: Tidus and Dream Zanarkand are a dream.
 *
 * Staging note: the Prominence is **daylight, overcast, snow-scoured**. The
 * famous Gagazet sunset is at the summit, after the Sanctuary Keeper — do not
 * borrow it.
 *
 * Mechanics hooks this chapter needs:
 *   - A pre-battle **Talk** trigger command: Kimahri -> +10 STR, Yuna ->
 *     +10 MDEF for this battle [visual-bible §3.12.1]. That is a
 *     `TriggerCommand`, fired from the battle screen, not a story step.
 *   - Mortiorchis's two-stage telegraph is a battle event, not a script — but
 *     pair each state line with **one** party callout [writing-bible §5.2].
 */

import type { ChapterScripts } from '../dsl.ts';
import { battleStart, narrate, results, say } from '../dsl.ts';

export const seymourFluxScripts: ChapterScripts = {
  pre: [
    // TODO(story-agent): 22 lines per writing-bible §3 E1.
    narrate('TODO(story-agent): Tidus, past tense, over the climb.'),
    say('seymour', 'TODO(story-agent): placeholder.'),
    battleStart(),
  ],
  post: [
    // TODO(story-agent): the send that fails, then the Jecht reveal, the Fayth
    // Scar, and the fayth boy.
    say('yuna', 'TODO(story-agent): placeholder.'),
    results(),
  ],
  victoryQuips: {
    // TODO(story-agent): §5.4 — E1 is a grim encounter, so suppress the light
    // variants. These are the bible's grim column, verbatim placeholders.
    tidus: ['…Okay. Next one.'],
    yuna: ['May they rest.'],
    auron: ['It isn’t over.'],
    wakka: ['…Ya. Okay. Ya.'],
    lulu: ['Don’t celebrate yet.'],
    kimahri: ['Kimahri remembers.'],
    rikku: ['…Can we not do that again?'],
  },
  mid: [
    // TODO(story-agent): e.g. an `hp-below` beat when Seymour drops past 50%,
    // and a `charge-started` beat the first time Mortiorchis begins counting.
  ],
  midScripts: {},
};

export default seymourFluxScripts;
