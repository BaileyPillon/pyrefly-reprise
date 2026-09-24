# Chapter VII — Seymour and Anima, Macalania Temple: the finish plan

Paper only, no GPU, no browser. Written 2026-09-23 as the finish planner's brief,
the way `docs/plans/chapter-evrae-finish.md` was written for Chapter VIII:
everything between today and "Chapter VII finished end to end" (every required
target tile matched, no open major/critical defect, a real-input win and loss
through results, Bailey's picks recorded, music in place, unlocked, shipped).
**Game case: FFX only** — the whole chapter, per `research/ffx-seymour-anima-macalania.md`
(an FFX party, FFX CTB engine, FFX aeons) and AGENTS.md rule 14. The Nul-targeting
fix and the `roman.ts` numeral widening this chapter's tracks needed were **both**
(shared plumbing, already landed, re-measured across all five FFX chapters with no
regression outside Macalania).

Sources read: `docs/handoff/chapter-macalania.md` (integrator + fix pass),
`chapter-macalania-engine.md`, `chapter-macalania-guide.md`, `chapter-macalania-scene.md`,
`chapter-macalania-script.md`; `docs/plans/chapter-macalania-review.md` (the
preflight, §5/§6.4) and its addendum; `research/ffx-seymour-anima-macalania.md`;
`docs/target/targets.json` (`chapters` group) and `decisions.json` (D-019, D-033,
D-034, D-035); `docs/plans/art-method-r3/METHOD-CHECK.md`; `critic/rounds/round-09.json`
and `round-10.json` (`lockedChapters`); `docs/handoff/NOW.md`.

## State today

Registered as **Chapter 7** in `src/data/encounters.ts`, playable via
`gotoChapter('seymour-anima-macalania')`, **LOCKED as a COMING card**
(`LOCKED_CHAPTER_IDS`) — round-09 and round-10 both confirm it, and round-10 notes
it (and Evrae) are unreachable with the arrow keys on live, which is expected for
a locked card, not a defect. Engine, HUD, widget, scene, story, guide, tactic are
all wired (`chapter-macalania.md`).

A fix pass on `62b4927` closed the one **CRITICAL** (Anima never appeared in a
real battle — an optional `BattleStage.arrive` now stages her and plays the
scene's arrival timeline) and two **MAJOR** findings (shattered Guardians stayed
standing — enemy `eject` now dissolves; Guardian attack/hurt and Seymour hurt
faced the wrong way — `picks.json` facing corrected) plus three MINOR items
(pause `heroArt` pointed at nothing, four drops overlapped Tidus's row, four
files over 400 lines). Full suite green (239 files / 5,536 at the integrator
pass, later fix-pass suites also green), `tsc` clean, `orphans.mjs` clean once
the two integrator-only registry lines were added. **A-1, the shipped intended
tactic, wins 36 of 40 seeded runs (90.0%)** after the Nul-targeting fix — clears
the 85% target — and the credible-mistake tactic A-2 wins 0 of 20. One real-flow
browser pass shows a locked card, prep, cutscene, a real-battle Anima arrival
with both Guardians petrified and dissolved, and results reading the corrected
drop list; a defeat route was also verified.

## Items, as requested

**(a) Anima's arrival — DECIDED, built to the pick.** `docs/target/decisions.json`
D-033 (2026-09-23): "Anima A then B" — option A's staging (camera drops to floor
height, violet light, both Guardians' CTB rows go out together, chains up and
taut, continuous rise) leading into option B's beat (Seymour steps back and
dims, his reticle reads "Cannot be targeted", Anima's lights gold). This is
exactly what `src/scenes/macalania-temple-arrival.ts` and
`-arrival-battle.ts` already build, in both preview and real battle. **Nothing
to build here; the target tile moved from `gap`/`inferred` to `approved`/named
reaction.** Two knowing gaps stay on record, not blocking: the Guardians die one
beat earlier in battle than in the preview (the engine KOs them before the
reveal fires), and in battle Anima is 1.2x boss height with no hover, while the
scene's own preview uses 3.6 units + a 0.3 hover (`fromSceneBuild` hard-codes
1.82/4.1 and does not read the scene's numbers) — see item (h).

**(b) Art-method Decision 1 (painting count) — Bailey's question, unresolved for
Chapter VII.** `METHOD-CHECK.md` §4 Decision 1 was adopted for Chapter 6 only
(D-034: fewest paintings — idle + one hero cast, no attack, hurt falls back to
idle under the engine's flinch). The same decision has **not** been asked for
Chapter VII's subjects (Seymour, the two Guado Guardians; Anima reuses the
approved aeon set and is out of scope). METHOD-CHECK's own evidence for the
"fewest paintings" case is chapter-agnostic (C7: 0 of 1,699 simulated enemy
actions across chapters 6-8 use the attack pose; a KO shows for under 620 ms) and
its plan row for Chapter 7 (§4 table row 5) already assumes the same shape:
"idle options round, Bailey picks; then one hero cast each ... hurts; optional
Seymour body KO." **Question for Bailey:** adopt option A (fewest paintings —
idle + hero cast + hurt, no attack) for Seymour and both Guardians, same as
Chapter 6, or ask for more (e.g. an attack pose despite the low observed use)?
**Recommendation: A**, on the same evidence D-034 used, extended to this
chapter's subjects. Owner once decided: **art** (idle judged first at bar 4-6,
then hero cast, per METHOD-CHECK row 5's own order).

**(c) Art-method Decision 2 (how they leave) — Bailey's question, partly
resolved.** D-035 adopted "Yields" (stay standing, dim, step back out of frame,
not a pyrefly dissolve) for Chapter 6's Leblanc/Logos/Ormi, explicitly because
the research calls them living humans, not summoned monsters — and D-035's own
`where` field names the Guado Guardians (FFX, chapter 7) as sharing that
research classification, "left to that pass." Seymour is a separate case:
`METHOD-CHECK.md` line 195 states the plan in passing — "Seymour at Macalania
falls and stays down (`'body'`)" — as one optional hybrid painting, not yet
adopted as a decision. **Question for Bailey, framed the same way as D-035:**
(1) do the Guado Guardians get the same "Yields" departure as Leblanc/Logos/Ormi
(stay standing, dim, step back) instead of today's generic pyrefly dissolve
(which the fix pass gave them as a stopgap: `status-add eject` on an enemy now
dissolves and removes, matching every other monster, not yet the living-human
treatment)? (2) does Seymour get the optional `'body'` painting — falls and
stays down — for whatever beat ends the fight (or a scripted moment inside it),
or does he stay on his feet like the Guardians would? **Recommendation:
yes to both**, on the same "living humans, not pyreflies" research reading
D-035 already used; Seymour's `'body'` stays optional/lowest priority since
METHOD-CHECK itself lists it as "only if Bailey wants the fallen body." Owner:
**presenter** for the departure-kind plumbing (already shared plumbing per
D-035, "owed to the same presenter pass that builds Evrae's fall," so this
folds into that pass rather than opening a second one) plus **art** if Seymour's
body painting is wanted.

**(d) Battle music mood pick — sent, pending.** Two mood sketches, A "The
Courtesy" and B "The Processional," were sent to Bailey as MP3s at 12:46 EDT
2026-09-23 (`docs/handoff/NOW.md` line 8) after his "usage is no concern, full
steam ahead" word. **Still awaiting his ear** (rule 13: agents cannot hear,
Bailey judges by ear). Until picked, the chapter plays Chapter 1's
`scene-gagazet`/`boss-seymour`/`victory-ffx` as a routed stopgap in four places
(`Chapter.music`, the script's two `music()` calls, the formation's
`musicCues`, the meta's `musicKeys`) — the chapter is playable today without the
real cues. Owner: **audio**, once Bailey answers.

**(e) Seymour's dialogue portrait.** `portraits/seymour.png` reads as the
Flux-era face (Chapter 1's Seymour), not this chapter's. Already flagged
`undecided` on the chapter's target tile. **Question for Bailey:** is a
Macalania-specific dialogue portrait wanted, or is the shared Seymour portrait
acceptable across both appearances (he is the same character)? No
recommendation forced — this is a likeness/continuity call, not a measured one;
leaning toward a dedicated portrait only because the two encounters read as
different dramatic beats (Flux vs. this fight's cold fury) and `research/ffx-seymour-anima-macalania.md`'s
own tone notes support a distinct expression. Owner: **art**, if yes.

**(f) The dome, cropped at idle.** `chapter-macalania-scene.md` §3: the backdrop
painting is a low, level view whose ice floor is the bottom 11% of frame;
staged as the room's back wall so the camera (near-level, FFX framing) can look
down at a 3D ice floor without the painted floor becoming the walking surface.
The cost, stated plainly in that handoff: **the dome is off the top of the
frame**, visible in `docs/screenshots/chapters/macalania-scene-target-vs-build.jpg`.
Fixing it needs a backdrop painted from a higher viewpoint — art work, not a
staging change. **Question for Bailey:** repaint the backdrop from a higher
viewpoint to bring the dome into frame, or accept the current crop (the target
concept, backdrop A, was picked and approved at D-019 without this crop
constraint being visible until staged)? No recommendation forced; this trades
one more art pass against an already-picked target. Owner: **art**, if a
repaint is wanted; otherwise no action.

**(g) Results four-drop overlap — already fixed, confirm on re-verify.**
`chapter-macalania.md`'s fix pass closed this (MINOR): `dropsLabel` now merges
repeated items ("Ability Sphere ×3, Blk Magic Sphere") and `resultsDensity`
compacts the ledger/member-list pair across 1-7 members, both games. Tests
(`ui-common-results.test.ts`) pin it. **No further action**, just re-confirm on
the next real-battle pass alongside everything else.

**(h) Real-battle sizes vs. the scene's numbers.** `fromSceneBuild` hard-codes
1.82/4.1 rather than reading the scene's own `MACALANIA_TEMPLE_ACTOR_HEIGHTS`
(Seymour 1.87 sourced at "187 cm," Guardians 1.85, Anima 3.6 + 0.3 hover, all
labelled presentation estimates where not sourced). In a real battle Anima
comes out 1.2x boss height with no hover instead of matching the preview.
**Not a Bailey decision** — a mechanical gap between the presenter's hard-coded
constants and the scene's own numbers. Owner: **presenter/data**
(`src/engine/` wherever `fromSceneBuild` lives, cross-referenced against
`src/scenes/macalania-temple.ts`'s exported height table). Low-risk, additive:
read the scene's heights instead of the hard-coded pair.

**(i) Guado Guardian idle at production quality.** Per `METHOD-CHECK.md` row 5
and `NOW.md`'s queue (line 109: "Guardian idle from concept A" still open),
the Guardian idle needs an options round judged 4-6, Bailey's pick, then one
hero cast, matching the same bar Seymour's idle already cleared (`935674f`,
installed CANDIDATE from concept B, "human ear repaired," though NOW.md also
flags an open worry that `hurt.json` may still be mirrored the same wrong way
the old idle was before its facing fix — **needs a look before this chapter's
art clears CANDIDATE**). Owner: **art**, gated on decision (b) above (how many
paintings) since that decides what the Guardian idle round is even judging
toward.

**(j) Reward items with no `ItemDef` row.** `chapter-macalania-engine.md`
question 2, still open: `blk-magic-sphere`, `special-sphere` and
`ability-sphere` print their raw ids in Steal/Results banners (Chapter 1 already
ships `lv-4-key-sphere` the same way, so this is a pattern, not new). **Question
for Bailey:** add three small `ItemDef` rows in `src/data/ffx/items/`, or leave
the raw ids (as Chapter 1 does)? Recommendation: add the rows — small, additive,
and it removes a rough edge from results/steal text without touching balance.
Owner: **data**.

**(k) Everything else the fix pass already found and closed or logged as
pre-existing/shared, not re-opened here:** the title screen's DOM leak under a
`gotoChapter` debug jump (Chapter 1 does the same; the real card-and-Enter path
is clean); the advisor card not refreshing under `autoBattle` (still
recommended Petrify Grenade after both Guardians were gone — a shared advisor
issue, not this chapter's to fix alone); Leblanc's identical pause-`heroArt`
bug (already fixed for Macalania here, still open for Leblanc, another
workflow's file).

## Everything else needed for "finished end to end"

1. **Art (CANDIDATE throughout).** Blocked on decisions (b) and (c); Guardian
   idle round (i); Seymour attack pose still blooms white in the hair per the
   fix pass's "still open" list (a repaint/darker-hair pass, not a code fix,
   and moot if decision (b) drops the attack pose entirely); optional
   Macalania-specific Seymour portrait (e); optional dome-repaint (f).
2. **Music (d)** — mood pick pending Bailey's ear, stopgap cues playable today.
3. **Presenter fixes**: the departure-kind plumbing for (c) once decided (shared
   with Evrae's fall, D-031's owner); the size read-through fix (h).
4. **Data**: the three `ItemDef` rows (j) if Bailey says yes.
5. **A real-input win *and* loss** — already have both from the fix-pass browser
   run (win: real battle, Anima staged, both Guardians petrified/dissolved,
   results reading the fixed drop list; loss: not separately called out in the
   fix pass's own list the way Evrae's was, so **re-verify a defeat route**
   once the above changes land, alongside the win, in one browser pass).
6. **Unlock**: delete `'seymour-anima-macalania'` from `LOCKED_CHAPTER_IDS` in
   `src/app/screens/frontend/comingChapters.ts` — withheld until art clears
   CANDIDATE and Bailey's art-method and portrait/dome questions are answered,
   same gate Evrae is held to.
7. **Ship**: `npm run deploy` per AGENTS.md "Release" — focused review of the
   candidate before deploy (this chapter's unlock is a "new chapter" class
   change), deep review on the live build after, same as Leblanc/Evrae.

## Order of work, and estimate

1. **Bailey decisions first (no code depends on them, but scope does):**
   music mood A/B (d, already sent — just needs his answer); art-method
   Decision 1 for Chapter VII subjects (b); art-method Decision 2 for the
   Guardians and Seymour's optional body (c); Seymour portrait (e); dome
   repaint (f); reward `ItemDef` rows (j). *Same-day turnaround once asked, no
   build time except whatever art/audio work the picks trigger.*
2. **presenter group**: size read-through fix (h); the "Yields" departure kind
   for the Guardians once (c) is decided, folded into the shared presenter pass
   that also builds Evrae's fall (D-031) rather than a second pass. *Est. 1-3
   hours for (h) alone; the shared departure-kind pass is a larger, already
   co-owned piece with Evrae, not separately estimated here.*
3. **data group**: three `ItemDef` rows if approved (j). *Est. 30 minutes.*
4. **art group** (subject to decisions (b)/(c)/(e)/(f) and the shared ComfyUI
   queue, rule 12 — poll and wait, one prompt at a time): Guardian idle options
   round then hero cast (i); Seymour attack-pose repair or removal depending on
   (b); optional portrait (e); optional dome repaint (f); check whether
   `hurt.json` inherited the old mirrored facing. *Est. the largest remaining
   piece, on the order of the Evrae/Leblanc art passes: identity pilot, judge,
   install with backups.*
5. **audio group**: once Bailey picks A/B, install the winning cue's full
   composition (mood sketches are auditions, not the finished score) and swap
   the four stopgap routings. *Est. one audition-to-install cycle per the
   D-026 pattern.*
6. **Integrator**: reconcile into one commit if shared registries move again;
   full suite + `tsc` + `orphans.mjs`; re-verify a win and a loss live; the
   unlock line; focused review, deploy, deep review after.

Nothing above touches a boss number or any other chapter; the shared presenter
and item-data changes are additive and already flagged "both" where they leave
`src/battle/ffx/**` or common UI, matching the carve-outs the integrator and fix
passes already used.
