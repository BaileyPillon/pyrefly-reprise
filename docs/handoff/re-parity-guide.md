# Re-parity guide text: drafts for Bailey's look (FFX only)

Status: **drafted, committed and pushed on branch `re-parity-guide`, not merged, not deployed** (2026-10-10). Base `919f2c78` (= `origin/re-parity-w2`, planned for tonight's release). Nothing here ships until
Bailey has seen the pictures and said yes. Track `re-parity` ([plan](../plans/re-parity.md)). **Game case: FFX only** (AGENTS.md rule 14): Chapters I, II, III, VII, VIII, IX, XII and XVII; no
FFX-2 or FF7 file was touched.

Bailey, 2026-10-10 about 14:20 EDT, to the main session: "Draft, show me first (Recommended)", whose description reads "A lane rewrites the stale cards in our own words, citing the game's scripts. You see
before/after pictures before anything ships." (His question named three cards: Yojimbo's odds, Evrae's Stone Gaze note, the Fins and Genais card.) Earlier: "It needs to be a 1:1 parity."

The facts are `research/re-ffx-ai-evrae-yojimbo-isaaru-sin.md` (Evrae, Yojimbo, the Fins, Genais and the Core), `re-ffx-ai-seymour.md` and `re-ffx-ai-yunalesca-bfa.md`; every sentence is in our own words
(AGENTS.md rules 6 and 8). New cites keep the old cite first and add the note after a semicolon, because `strategy-guide.test.ts` anchors a cite on `ffx-...` / `ffx2-... §`.

## 1. Read this first: what a player can actually see

Since 2026-10-03 (`docs/handoff/r38-guide-jegged.md`, commit `d1fcee61`) the strategy-guide panel (G) prints the encounter guide's own page, `src/data/guides/docs/<chapter>.ts`, and **no longer draws
the RULES, phase and WATCH fields** of `src/data/guides/<chapter>.ts`. Those fields are read only by tests; the move advisor reads only the **hint** sentences, and the NEXT BEST MOVE card prints a hint only
when its own simulation cannot explain the pick (Pull back, Talk, a Grand Summon). So of what this branch rewrites, **two things are on screen**: the long-form page line about where Genais starts
(`docs/sin-fins-core.ts`) and the Evrae "Pull back" hint. Everything else is data text that the tests, the advisor's look-ahead and any future RULES surface read. The three cards Bailey named are of
that second kind (his question treated them as drawn). Putting rules or phase notes back on screen would be a new screen and needs a mockup and his yes first (rule 9).

So the pictures are of two kinds: **real game frames** (1600x900, headless Chromium from node, real key presses, a dev server of this worktree on 5291, stopped afterwards) for the two on-screen lines, and
**review cards** for the rest, drawn from the data the dev server holds (`cards-before.json` / `cards-after.json`), in the game's fonts and colours, each labelled as not drawn by the game's panel and showing
the source line (never shown to the player). BEFORE frames were taken before the first edit.

## 2. The three cards Bailey named

| Card | Old text (`919f2c78`) | New text | Source | Picture |
|---|---|---|---|---|
| **Evrae, Stone Gaze** (`evrae.ts`, phase 1 note) | "...Stone Gaze's aggro counter builds on every hit landed on it — it resets when Evrae acts, so a quiet turn is never wasted." | "...Stone Gaze's counter fills once per action that reaches Evrae: 2 for a weapon swing or Wakka's reels, 1 for most spells (damage, Lancet, Shell, Protect, Reflect, Dispel), nothing for Cure spells, Haste, Slow, Cheer or items. Above 5, his next Attack turn is a Stone Gaze and the count clears. Only a Gaze clears it, so it carries on through a retreat." And the phase 2 note gains: "The Stone Gaze count stops filling once he is Hasted, but anything above 5 still turns his next Attack into one more Gaze." | research `re-ffx-ai-evrae-yojimbo-isaaru-sin` 2.3, 2.5, D-03, D-04 (the class table is proved against the game's command table, fixture `evrae-gaze-classes.json`; "once per action" is a B reading) | `docs/screenshots/re-parity-guide/evrae-stone-gaze-before-after.png` |
| **Yojimbo, the odds** (`yojimbo-cavern.ts`: header comment, gauge phase note, the Ginnem / Daigoro cite) | header: "The odds inside each band are our estimate (B2, D-050) and the guide never states them." Note: "Below 25 he only sends the dog. From 25 he adds Kozuka, from 50 Wakizashi, and at 100 Zanmato." Cite: "...; B3 (our estimate)" | header: the odds are the game's script now (3.2, D-11), which replaced B2 / D-050. Note: "Below 25 he only sends the dog. From 25 he adds Kozuka, one turn in four. From 50 Wakizashi joins it and each takes a fifth of his turns, the dog three fifths. From 80 each takes a quarter and the dog half. At 100, Zanmato." Cite: "...; re-ffx-ai-evrae-yojimbo-isaaru-sin §3.1, §3.4" | 3.2 (exact over all 65,536 draws: 25-49 K 25 / D 75; 50-79 W 20 / K 20 / D 60; 80-99 W 25 / K 25 / D 50), 3.1, 3.4 (neither bystander is targetable; the dog bites only as the answer to the order) | `yojimbo-odds-before-after.png` |
| **The Fins and Genais** (`sin-fins-core.ts` rules 3 and 4, the header comment; the long-form twin `docs/sin-fins-core.ts`) | Rule 3: "...Up close, Negation can wipe your buffs and the Breaks; more buffs make it likelier. That chance is one guide's formula, built as settings we can change, not a measured fact." Rule 4: "Genais guards the Core: while it lives, magic at the Core is absorbed and blades cannot reach it. ... How it leaves the shell is our reading of its Scan text: healed to 12,000, it comes out next turn." Twin: "...absorbs any magic aimed straight at Sin. Unlike the Geneaux at Kilika Temple, this one starts out of its shell." | Rule 3: "...Up close, a hit can set off Negation, which wipes your buffs and the Breaks. The game scores what is on you (Shell and Reflect 1 each per member; Haste 3, 4 or 5 for one, two or three members; Protect 1 on the first member, 2 on the third, nothing on the middle one), plus 2 for Armor Break and 1 for Mental Break on the Fin, takes off 3 and rolls the rest: 1 in 16 a point on the Left Fin, 1 in 12 on the Right." Rule 4: "Genais guards the Core: while it lives, blades cannot reach the Core, and while it is out of its shell, magic aimed at the Core is absorbed. It starts the fight shelled and comes out on its first turn. Hit it with physicals until it shells (a spell draws Waterga), then Fire into the shell. Healed above 12,000, it comes out again on its next turn." Twin: "...absorbs any magic aimed straight at Sin while it is out of its shell. This one starts inside its shell and spends its first turn coming out." | 5.3 (D-21, D-22), 6.1, 6.2, 6.5 (D-23, D-24; the absorb-only-out-of-the-shell rule is S-15, contradicted by the script) | `fins-genais-core-before-after.png` (rules), `fins-genais-page-before-after.png` (the twin as data), `genais-sheet-before-after.png` (**the real game frame** of the sheet) |

Kept as they were, because the script agrees with them: Haste on one member only, Protect on the middle member, Fire into the shell, Cura on every hit, the Right Fin latch, the Mental Break cleanse at FAR.
The Evrae and Yojimbo long-form pages carry none of the stale claims and are untouched. **Beyond what was named, on the same cards** (flagged so Bailey can take or leave them): the Gaze carry-over line in Evrae's phase 2
note; the "80" step in Yojimbo's note; the Ginnem / Daigoro cite; the Core's magic guard "only while Genais is out" and the blades clause in rule 4; and the Fins' "Genais starts shelled" correction on the long-form page, which
corrects a Jegged-derived sentence (the game's file wins, rule 6; `r38-guide-jegged.md`'s difference list and `research/jegged-encounter-guides-ffx-b.md` section 6 would need a line if he accepts it).

## 3. Code comments (not guide text)

`src/story/scripts/evrae-airship.ts` and `src/engine/tactics/evrae.ts` quoted the wiki's 10,667. The game's line is HP below 10,666 (a third rounded down, strict; D-01), so the Haste phase starts at 10,665. Both
comments say so; the story trigger stays `hp-below 1/3` (true from 10,666), and its comment now says it can run one point early and only places a beat. No behaviour change.

## 4. Extras, not named by Bailey (separate commits; take or leave each)

From the stale-text lists of `re-parity-ai-seymour.md` and `re-parity-ai-yunalesca-bfa.md`. **Not touched, as instructed:** Sin's face (`sin-face.ts`, `docs/sin-face.ts`) and Chapter X / Seymour Natus (guide and tactic text).

| Extra (commit) | Old | New (summary) | Source | Picture |
|---|---|---|---|---|
| **Seymour Flux** `fd68899a` | Rule 5: "a delay counters with party-wide Slowga"; Dispel hint: "...then he burns two more turns recasting"; phase 2 note, a summon hint and a WATCH line: "charge ladder"; the first warning read as coming every cycle | A Delay hit on the Mortiorchis only is answered with Slowga; a stripped Reflect lets his self-aimed Flare land on him for ~1,734 and he recasts on his own next Reflect step, no HP line answering a Dispel; phase 2 is the four-step cycle (Flare, ready notice, Reflect, Total Annihilation); the "Auto-Attack Mode" warning comes once, at the phase change; an aeon out freezes the cycle | `re-ffx-ai-seymour` 2.3 to 2.5 (D-02 to D-05) | `extra-seymour-flux-before-after.png` |
| **Macalania and Anima** `51c9f102` | Header: gauge rate "[estimate] (C-4)", element order "[single source] (C-14)"; WATCH: her gauge fills "whether she acts or is targeted"; Aerospark hint: he "opened the fight Shelled"; Poison and Magic Break hints with no mention of the clears | Gauge +5 per Pain and +5 per action that reaches her, her own turns and Boost add nothing; the order is Seymour's own index and carries into act three; he casts Shell on his first turn; the summon clears his Poison and Magic Break and his return clears them again (the return is a B reading) | `re-ffx-ai-seymour` 3.4 to 3.6 (D-14) | `extra-seymour-macalania-before-after.png` |
| **Omnis** `8dcb4ad5` | Rule 1 "one spell each"; Curaga hint "land one to a member and the last on anyone"; rule 5 "with exactly two Water discs he stops Fire"; header "127 of 200" | Always four spells a volley, one per disc colour; slot-aimed only with three or four of a kind, otherwise all four at random members; the quirk only with no Fire or Ice pair (TTWW, FIWW, FTWW, ITWW); header "169 of 200" in the AI lane's bench (the ship-content test reads 165), and the note on the ring and reset order says the script has both while the painted discs differ | `re-ffx-ai-seymour` 5.3, 5.4 (D-26, D-31) | `extra-seymour-omnis-before-after.png` |
| **Yunalesca** `f67b91ae` | Rule 4, the Eye Drops hint, the Form I note: she counters "every landed physical hit" with Blind, every spell with Silence | Every physical action that reaches her, a miss included, with Blind; every spell with Silence; an item or special with Sleep; the Blind and Silence skipped while the member she last picked already has it (not the attacker) | `re-ffx-ai-yunalesca-bfa` 2.9 | `extra-yunalesca-before-after.png` |
| **Braska's Final Aeon and Yu Yevon** `208aede4` | Yu Yevon rule and note: "do not hit him", "damage does not [beat him]"; Pagoda rule: "Overdrives about every other turn"; Jecht note: "Jecht Beam about one turn in four" | His own Gravija takes 75% of his current HP on most turns, so a blow worth more than what is left ends him before the Curaga lands (Doom too; a Zombie turns each Curaga into damage until a Power Wave strips it); the gauge is +20 a Power Wave, +2 or +3 a turn, +5 per action that reaches him, the Overdrive the turn after it reads 100; Jecht Beam one turn in three (one in five in the second form's first half) | `re-ffx-ai-yunalesca-bfa` 3.4, 3.5, 4.2, 6.2, 6.3 | `extra-braskas-final-aeon-before-after.png` |
| **Evrae, the Pull back line** `cc90f844` (found while photographing; on no handoff list) | Hint (the one on screen): "Poison Breath and Swooping Scythe cannot land while it is FAR" | "his melee, Stone Gaze and Poison Breath cannot land while it is FAR"; in the Haste phase his own FAR turn is a Swooping Scythe, so the Scythe is not stopped by a retreat | `re-ffx-ai-evrae-yojimbo-isaaru-sin` 2.3 (D-05) | `extra-evrae-pull-back-before-after.png`, `evrae-next-card-before-after.png` (**the real game frame**) |

## 5. Commits (branch `re-parity-guide`, on `919f2c78`)

`0ef81487` Evrae card (named) · `b4de79cb` the two 10,667 comments · `4288dbf8` Yojimbo card (named) · `5bd995c8` Fins and Genais card with the long-form line (named) · `fd68899a` Flux · `51c9f102` Macalania ·
`8dcb4ad5` Omnis · `f67b91ae` Yunalesca · `208aede4` Braska's Final Aeon and Yu Yevon · `cc90f844` Evrae Pull back line · `4d115121` the pictures and the tool · this note. Every one is text, comments or pictures: no
behaviour changed.

## 6. Checks

`tsc --noEmit` clean. 33 test files, 417 passed and 1 skipped: `strategy-guide.test.ts`, `guide-advisor-target-agreement.test.ts`, every `guide-*` and `strategy-guide-*` test, `ffx-engine-golden` (unchanged),
`strategy-braskas-final-aeon`, `advisor-guide-badge`, `intent-guide-plain-copy`, and the chapter tests that read a guide (`sin-tactic`, `sin-listed`, `yojimbo-content`, `omnis-ship-content`, `natus-ship-content`).
The whole suite was not run (the lane brief runs it once, at the end, by the main session). Servers started: one Vite on 5291, stopped; no other process left.

## 7. Open items and decisions for Bailey

1. **Rules, phase notes and WATCH lines are not drawn anywhere** (section 1). Approve the wording as data, or ask for a RULES surface (a new screen: mockup first). Until then only the Genais page line and the Evrae
   Pull back line change on screen.
2. **Take or leave each extra** (section 4), and the "beyond what was named" lines of section 2.
3. **Genais's page line contradicts the page it follows** (Jegged says it starts out of its shell). The game's file settles it; say yes and `r38-guide-jegged.md` and the Jegged note get the difference.
4. **Seen but not changed** (a recommendation, an open reading or not on any list): Flux rule 1, "Kill Seymour, not the mount" (no longer the only winning line, handoff measurement); Evrae rule 4 and the Reflect hint call the Haste "its next big turn"
   or a "self-cast", while the script queues it as a reaction to the hit that crosses 10,666 (how a Reflected Evrae's Haste resolves is open, note section 10); the Evrae pages say nothing of Delay now starting the Haste phase (`DELAY_ADVANCES_HASTE_PHASE` is on); Yojimbo's guide does not mention
   his opening Summon turn; `ffx-isaaru.ts` still labels two things "our estimate" (B6 the greyed mirror aeon, B8 Isaaru a bystander) that the Isaaru script settles (4.1), and its Grothia rule says "first move ... is Hellfire" where the
   first turn is now a Summon; the BFA Slow hint ("stops feeding him 20% a turn ... roughly halve") rests on the old gauge; the comment in `tests/unit/guide-status-immunity.test.ts` still quotes "one turn in four";
   `research/ffx-bfa-yu-yevon.md` 3.3 to 3.5 are the wiki's reading, superseded by `re-ffx-ai-yunalesca-bfa.md` 6.
5. The Omnis header's 169 is the AI lane's bench; `omnis-ship-content.test.ts` prints 165 on the Garden of Pain build, so the two disagree by four; the comment names both.
6. `NOW.md`, `CHANGELOG.md`, `ACTIONS` and `DECISIONS` are the main session's (not edited). Nothing here is merged; a merge would bring these text, comment and picture files into the tree that tonight's release is cut from.
