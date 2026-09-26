# PR-0148 method check (rule 15): no owner listening verdict on the mix that ships

Written 2026-09-26, paper only. **Game case: both** (the score and the effects are shared audio
plumbing; each cue keeps its own chapter's game). Agents cannot hear (AGENTS.md rule 13): nothing
in this file judges a sound.

## The issue as the critic measures it

Round 13: `docs/audio/OWNER-VERDICT.md` holds no number and no verdict naming the shipped mix.
Bailey's 2026-09-21 words, "music is too reminsicent of snes music instead of the more modern final
fantasy titles and clair obscur", are unanswered and no shipped cue was re-rendered. It is the sixth
deep round with no audio number (rounds 08 to 13), and it blocks the whole score: without an audio
category the total stays PROVISIONAL. Acceptance: a dated entry in Bailey's own words naming the
build or cue set that ships, and a number if he gives one.

## How it was asked, and why that did not work

| when | how it was asked | what came back |
|---|---|---|
| 2026-09-19 | "is the new audio right?" | "Right direction, keep refining" (no number) |
| 2026-09-22 | the four battle-theme clips (control, A, B, C) sent with a request for a pick and a 1-10 score | nothing |
| rounds 10-12 | carried as a human-judgment line inside long round reports | nothing |
| 2026-09-25 | item 1 of a 12-item decision sheet (`docs/plans/decisions-2026-09-25.md`), recommending "A: fifteen minutes in one sitting" | "I'll go with all your recommendations ..." |

The last answer booked the session (D-168) and was correctly **not** recorded as a verdict. Three
causes, all in the method, none in the music:

1. **Bundling.** Every ask sat beside cheaper questions. A blanket "all your recommendations"
   answers every item that has a recommendation; the audio item cannot have one (rule 13), so it is
   the one item such an answer can never settle.
2. **The ask needs a sitting, the reply did not.** The 09-25 sheet asked him to open
   `audition.html` on this PC and listen; the reply came from wherever he read the sheet.
3. **No re-render to react to.** Nothing he criticised has changed since 09-21, so each new ask was
   the same ask.

## Alternatives

1. **Ask again inside the next sheet.** Rejected: the same bundling, the same result.
2. **Change method: one standalone listening pack**, alone in its own message, playable on a phone
   with no PC: the four shipped cues (title, boss-seymour, boss-shuyin, boss-yojimbo) and the four
   direction clips (control, A, B, C, already rendered in `public/audio/candidates/`), level-matched,
   as files he can tap. **Two questions only**: "a number out of 10 for today's music", and "which of
   control, A, B, C sounds most like modern FF and Clair Obscur? May the AI-restyle layers (B, C)
   ship?" Nothing else in that message; optional extras only if the pack stays under 15 minutes.
3. **Re-render in a guessed direction first**, then ask. Rejected: an agent would be choosing a
   sound it cannot hear, and the re-render cannot start until the direction is picked (D-209).

## The smallest test that tells them apart

The next reply itself. A reply that contains a number or a letter settles CHK-B1 or the direction;
a reply of "all your recommendations" to a message with no recommendation in it is impossible by
construction. If the standalone pack also gets no answer within a day, the next step is to ask
Bailey *how* he would like to listen (not what he hears), once.

## Recommendation

**Change method: alternative 2, sent by the driver on its own, never read as a verdict unless it
names a number or a letter.** Record the words verbatim in `OWNER-VERDICT.md`. On a direction
pick, the re-render and the owed chapter cues (D-209) follow; on a number of 9 or more on the
re-rendered live mix, round 14 or 15 scores audio from it. The technical fixes (PR-0214, 0216, 0100,
0099 rows) proceed in batch 4 meanwhile; they clear CHK-023 and CHK-001 but do not move the number.
