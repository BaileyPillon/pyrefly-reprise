# Chapter VIII — Evrae: the finish plan

Paper only. Written 2026-09-23 as the finish planner's brief: everything between
today and "Chapter VIII finished end to end" (every approved target tile matched,
no open critical/major defect for the chapter, a real-input win and loss through
results, Bailey's picks recorded, music in place, unlocked, shipped).
**Game case: FFX only** — the whole chapter, per `research/ffx-evrae-airship.md`
§0.4 ("the airship distance mechanic... has no X-2 counterpart") and AGENTS.md
rule 14.

Sources read: the four `chapter-evrae-*.md` handoffs plus the integrator's
`chapter-evrae.md` (registration + fix pass), `docs/plans/chapter-evrae-review.md`
(preflight + both addenda), `research/ffx-evrae-airship.md`,
`docs/plans/art-method-r3/METHOD-CHECK.md`, `docs/target/targets.json` +
`decisions.json` (D-020), `critic/rounds/round-09.json`, `docs/handoff/NOW.md`.

## State today

Registered as Chapter 8, playable via `gotoChapter`, **LOCKED as a COMING card**.
Engine, HUD, widget, scene, story, guide, tactic all wired (`chapter-evrae.md`).
A fix pass already closed 6 of 9 verifier findings (advisor stall, pause click
leak, Inhale telegraph, KO rim light, pause-tab wrap, house-style line counts).
Full suite green (255 files / 5,691), `tsc` clean, orphans clean, one browser
win + one browser loss both verified live. Round-09 confirms the shared engine
touches (`markEvraeRuntime`, `counter-inputs.ts` move, advisor stack cap) are
regression-free on chapters 1–6.

## Items, as requested

**(a) `harmlessTurn` Defend fallback.** The advisor's simulated "do nothing"
line asks for Defend, which FFX's command window never shows (FFX has no
Defend row — see `docs/handoff/chapter-evrae.md` "Still open"). On a harmless
turn the card falls back to its best simulated row instead, which is most of
the gap between the line's 97.5% win rate and the card's measured 65%.
Owner: **advisor/tactics** (`src/engine/tactics/`). Not FFX-2's problem (FFX-2
has its own Defend semantics); this is an FFX-only fallback bug. Fix: teach
`harmlessTurn` (or its caller) to translate "Defend" into FFX's real
do-nothing-visible option — likely "do not act" surfaced as a real cascade
choice, or suppress the Defend-shaped recommendation and let the card show
its best real row without penalizing the measured win rate for it. Needs a
re-measure on the Evrae bench (`critic/bench/evrae`) before/after.

**(b) NEAR/party framing and FAR size.** `chapter-evrae.md` finding 9: the
overlap the verifier saw is the **party/victory rig**, not Evrae — Evrae's own
box (1201–1228px at 1600x900) clears the CTB column (1380px) cleanly at NEAR.
The party/victory rigs look at the party and were not built range-aware; a
NEAR-specific party rig is a staging change. FAR's size is the documented
head-ratio scale (69.5/55.1px), not a bug. Owner: **presenter/scene**
(`src/engine/` presenter rigs, or `src/scenes/evrae-airship-*`). This is a
staging decision, not a defect — needs an options round before building (see
Decisions below), because it changes how the party is framed only in this
chapter.

**(c) Advisor card over the FAR streak.** `chapter-evrae.md` finding 2: the
NEXT BEST MOVE slab covers part of the far wyrm in `evrae-flow-3-battle-far.png`.
The advisor's safe-zone layout doesn't know about a combatant this small and
this high on screen. Owner: **HUD/widget** (`src/ui/common` advisor card
placement / safe-zone calculation). Likely fix: extend the safe-zone rule to
account for a FAR-scaled enemy bounding box, or reposition the card when
`airship.range === 'far'`. FFX-only in effect (only Evrae sets the flag).

**(d) How Evrae leaves the fight.** `research/ffx-evrae-airship.md` line 889
(§12.5 beat 8): "Evrae breaks and **falls out of the sky**, down through the
cloud layer, gone. Not sent, not killed on screen — it simply stops being a
problem and starts being a shape getting smaller." The post-battle *story*
beat (beat 8, before Bevelle's guns open up in beat 9) already carries this in
`chapter-evrae-script.md`'s beat sheet. The **battle-side** exit is generic:
every enemy KO in this engine is a dissolve-then-removal
(`BattlePresenterBeats.ts:127-137`), with no per-enemy exit animation. A
faithful battle-side exit (FFX only) would replace or precede the dissolve
with a fall-and-shrink for Evrae specifically — this is new presenter surface,
gated the same way the range director is (only this encounter's flag touches
it), so it doesn't change any other chapter's KO. Owner: **presenter/scene**.
This is a nice-to-have polish item, not a correctness gap (the post-battle
cutscene already tells the "falls from the sky" beat in words) — worth asking
Bailey whether to spend the work, since it's new presenter surface, not a bug.

**(e) The order widget pick.** Built to the driver's recommendation (A's
Trigger-pair cascade + cost slab, with C's NEAR/FAR camera staging), recorded
`inferred`, not yet a pick. The concept sheet
`docs/concepts/chapters/evrae/widget/sheet.png` was sent to Bailey at 11:33
EDT 2026-09-23 (`docs/handoff/NOW.md` line 85) alongside the Anima arrival
sheet, asking for the pick that unlocks Chapter VIII. **This is Bailey's
decision, outstanding as of this writing.** Options: A (built), B (a deck-side
range gauge, not built), C alone (no persistent widget, battlefield re-staged
only — its staging half is already built independent of the widget), or a
mix. Recommendation on file: A + C's staging (already shipped). Nothing here
blocks finishing the mechanical work, but the chapter cannot go from CANDIDATE
art/UI to an unlock without this pick, since "end state first" (rule 9) means
the widget stays a candidate until picked.

**(f) The chapter's name (Q11).** `docs/target/decisions.json` D-020 records
Bailey's "yes to all recommendations" against `chapter-evrae-review.md` §5,
which explicitly includes Q11 ("the airship names the chapter, not Evrae") as
one of the adopted recommendations. **So Q11 is already adopted: the airship
names the chapter.** However, `docs/target/targets.json`'s chapter tile still
lists Q11 under `reaction.undecided` ("whether the fight is named for Evrae or
for the airship (Q11) — Bailey's call, asked before the chapter-card options
round"), and the chapter's `numeral`/title in code still ship as "Evrae" (the
COMING card's name), per `chapter-evrae.md`'s own note that Q11 is "still
undecided on the chapter's target tile, so nothing was renamed." **This is a
bookkeeping conflict**: D-020's adoption vs. the target tile's own
`undecided` list, both dated 2026-09-21. Action: reconcile targets.json's
`reaction` to reflect D-020's adoption (move Q11 out of `undecided` into
`mustChange`/named, since the decision doc already carries Bailey's yes), then
rename the chapter display name from "Evrae" to whatever the airship-naming
convention resolves to (e.g. "The Fahrenheit" — not sourced anywhere as an
exact title, so this needs one more small copy decision, not re-litigating
Q11 itself). Owner: **data/story** (`src/data/chapter-meta.ts`,
`chapter-evrae-airship.ts`) for the rename; **whoever owns targets.json edits**
for the bookkeeping fix. Low risk, small, additive.

**(g) Target tiles for the chapter.**
- "Evrae on the airship (FFX)" — `state: approved`, `delivery: implemented`.
  Matched for backdrop B and boss-palette B per D-020; build note confirms
  registration + real-flow stills exist. **Matched**, modulo the Q11
  bookkeeping note above.
- "Evrae's order/range widget (FFX)" — `state: gap`, `delivery: implemented`
  (built, unpicked). **Not matched** — awaiting Bailey's pick (item e). This
  is the chapter's one open target-board gap.

No other Evrae-specific tiles found in targets.json.

## Everything else needed for "finished end to end"

1. **Art (CANDIDATE throughout).** No attack painting (falls back to idle,
   finding 4); backdrop is darker than picked concept B and the rail geometry
   is fitted to the wrong plate (finding 6, not fixed — swapping needs new
   art). Both are explicitly parked on the art-method decision
   (`docs/plans/art-method-r3/METHOD-CHECK.md`, NOW.md item 3) and rule 12
   (ComfyUI queue is shared — poll and wait). **Blocks**: full art parity with
   the approved target; does not block an unlock decision on its own since
   the installed set is disclosed as CANDIDATE, but every painted chapter to
   date has gone live only once its art cleared CANDIDATE, per the chapter
   art verdict in NOW.md.
2. **Music.** `scene-fahrenheit` and `boss-evrae` (with NEAR/FAR variants and
   a phase-2 subdivision, per research §12.6) are unbuilt; Chapter 1's cues
   are routed as a stopgap in four places (`Chapter.music`, script `music()`
   calls, formation `musicCues`, meta `musicKeys`). Owner: **audio**. Needs
   composition + Bailey's ear (rule 13, D-026's audition pattern) before it
   can be called finished, though the stopgap keeps the chapter playable
   today.
3. **The order widget pick (e)** and the resulting one-line integration if
   Bailey picks something other than what's built.
4. **Cid portrait** — listed NEW in the review's asset inventory (§6.1); he
   has a CTB tile and speaks but has no dedicated portrait yet. Owner: art.
5. **Chapter card / pause plate / chapter-select thumbnail** — all listed NEW
   in the same inventory; needed for the chapter to look finished once
   unlocked, not just playable.
6. **VFX** — missile volley, Poison Breath cone, Stone Gaze, Photon Spray (8
   retargeting hits), Swooping Scythe sweep: all NEW per the review. Not
   built; the fight currently reads through generic status/damage numbers
   only.
7. **The advisor fallback (a)**, **card placement (c)**, and **party rig
   framing (b)** above.
8. **A real-input win *and* loss** — already have both (`evrae-flow-*` win;
   the fix-pass browser re-run + an earlier `autoBattle('defend')` seed-2
   loss), so this acceptance case is **already met**, just worth re-confirming
   once code changes above land.
9. **Unlock**: delete `'evrae-airship'` from `LOCKED_CHAPTER_IDS` in
   `src/app/screens/frontend/comingChapters.ts` — the one-line switch,
   deliberately withheld until the art and widget pick clear CANDIDATE.
10. **Ship**: `npm run deploy` sequence per AGENTS.md "Release", with the
    review this candidate owes (round-09's deep review already covers the
    shared engine touches; the chapter's own unlock is itself a "new chapter"
    class change per the Release section, so it gets the focused pass before
    deploy and a deep pass after, same as Leblanc/Macalania).

## Order of work for part 2, and estimate

1. **Bailey decisions first (no code depends on them, but scope does):**
   widget pick (e); chapter-name bookkeeping fix + display name (f); whether
   to build a faithful battle-side fall exit for Evrae (d) or leave the
   dissolve; whether to spend on the NEAR party-rig staging change (b) now or
   defer. *Estimate: same-day turnaround once asked, no build time.*
2. **advisor/tactics group**: fix (a) `harmlessTurn` Defend fallback,
   re-measure the Evrae bench. *Est. 1–2 hours incl. measurement.*
3. **HUD/widget group**: fix (c) advisor-card FAR safe zone; apply whichever
   widget pick Bailey made if it differs from A+C. *Est. 1–3 hours depending
   on the pick.*
4. **presenter/scene group**: (b) NEAR party-rig framing if approved; (d) the
   battle-side fall exit if approved. *Est. 2–4 hours, gated on decisions.*
5. **data/story group**: (f) chapter-name rename + targets.json bookkeeping
   fix. *Est. 30 minutes.*
6. **art group** (subject to the art-method decision and ComfyUI queue
   availability): attack pose, corrected backdrop matching concept B, Cid
   portrait, chapter card, pause plate, VFX set. *Est. the largest remaining
   piece — likely a full art-pass cycle (identity pilot, judge, batch,
   install with backups), on the order of the Leblanc/Macalania art passes.*
7. **audio**: compose `scene-fahrenheit` + `boss-evrae` (NEAR/FAR/phase-2),
   audition, Bailey's ear, install. *Est. one audition cycle per D-026's
   pattern.*
8. **Integrator**: reconcile any of the above into one commit if they touch
   shared registries again; re-run full suite + orphans; unlock line;
   release-10 focused review, deploy, deep review after.

Everything above is additive to the already-green tree; no boss number, no
existing chapter, and no shared contract changes without the "both"
carve-outs already on record from the fix pass.
