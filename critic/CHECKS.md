# Pyrefly Reprise, Critic Checks

The living checklist. Every critic auditor runs the checks for their area, and
the pre-deploy gate (`critic/RUBRIC.md`, "When the critic runs", rule 1) runs
the ones that touch what changed. This file exists because of rule 2: **every
defect the owner reports gets a retrospective, and the retrospective's answer
becomes an entry here.** The entries below are the first pass, written from
Bailey's open list of 2026-09-18, the earlier findings of 2026-09-15/16, and the
release round's own post-mortems.

Three rules govern the whole file.

1. **A check is "passed" only when it was performed with real input on the
   production bundle or the live site.** Real input means
   `page.keyboard.press` / `page.mouse.click`. The debug API may be used to
   *reach* a board; it may never be the proof that a player can do something.
   `trigger('pause:open')` bypasses `canPause` on purpose, and it is exactly why
   a pause no key could open stayed green through a release.
2. **A check is "passed" only when the result was judged from a screenshot, at
   100 percent, the way a player sees it.** DOM presence is not legibility, a
   rendered reticle is not a readable selection, and a portrait `<img>` with a
   `200` is not a face.
3. **A screenshot is evidence only when the harness asserted what is in it**
   (CHK-016). Otherwise the critic is grading the harness.

Each entry names the rubric category it scores against, what the owner saw, an
honest account of why the existing gates let it through, the exact check, what
can be automated, and the scope the check generalises to. Merge into an existing
entry when a new defect is the same class; add a new ID when it is not.

---

## CHK-001. Sound is auditioned by a human and gated technically

**Rubric:** Fun and pacing (audio; see RUBRIC.md "Audio").
**Owner saw (2026-09-18):** "audio is arcade-y". Everything was procedural
WebAudio synth (oscillators, noise bursts, a 909 snare), two cues total, zero
audio files shipping.
**Why it was missed:** no agent can hear. Every audio test asserted structure:
the registry has the cue, the manifest parses, no sample is non-finite, peak is
under 0.95. All of that is true of a 909 snare. The rubric already said beauty
is the owner's call, but no step in the pipeline ever *collected* that call, so
nothing reached Bailey's ears until they played the live build.
**THE CHECK:**
1. Render the batch, then run `node tools/audio/qa.mjs --strict` against the
   MP3s on disk (not the in-memory mix): per cue, integrated LUFS, true peak,
   clipped samples, leading/trailing silence, loop-seam discontinuity and
   spectral flux across the splice, octave-band balance, manifest agreement.
   Any cue that decoded to silence is a hard fail.
2. `node tools/audio/themes-audit.mjs`: every cue uses the themes assigned to
   its chapter.
3. On the live bundle, play chapters 1 to 5 with the network panel open: every
   key the game asks for returns 200 `audio/mpeg`, nothing falls back to the
   synth path, no decode errors in the console.
4. `npm run audio:render -- --all --audition` and hand the owner
   `docs/audio/audition/` with the tour order, **before** the cue is integrated.
**Pass/fail:** qa strict green, every manifest key resolves live, and the owner
has signed off on the audition list for the cues in this build. A cue with no
sign-off does not ship.
**AUTOMATE:** yes, partly. `tests/unit/audio-manifest.test.ts` exists but only
parses a manifest object; nothing asserts the files are on disk. Add
`tests/unit/audio-ships.test.ts`: every cue key the game can request has a file
under `public/audio/`, every file on disk is listed, no orphans either way; and
wire `tools/audio/qa.mjs --strict` into the deploy preflight. The beauty half is
CHK-B1.
**SCOPE:** music cues, the SFX sprite, stingers, ducking, victory and defeat
jingles, any future voice barks. The wider rule: **anything an agent cannot
perceive gets a technical gate plus a scheduled human judgement, never a
structural test standing in for both.**

---

## CHK-002. A full-screen layer owns the window, not the stage

**Rubric:** UI fidelity and polish / Scene fidelity and beauty.
**Owner saw (2026-09-18):** the pause screen "looks low-res and does not fill
the screen", with dark side bars on a wide window.
**Why it was missed:** the pause was authored inside the 640x360
`LetterboxStage` like every other screen, and its art was 1344x768. The suite
has exactly one viewport: `playwright.config.ts` pins 1600x900 and **no test in
`tests/e2e/` calls `setViewportSize` at all**, so no run has ever existed at
2560 or 3840 where the bars and the upscale are obvious. `tools/screenshot.mjs`
defaults to the same 1600 wide, so the evidence had the same blind spot as the
tests.
**THE CHECK:** build, `vite preview`, Chapter 1, open the pause with a real
`Escape`. Repeat at 390x844, 1280x720, 1600x900, 2000x1012, 2560x1080,
3840x2160, **each in a fresh browser context** (a browser upgrades an `srcset`
pick and never downgrades it, so resizing one page proves nothing about the
small sizes). At each size measure: the painting's `getBoundingClientRect`
equals the viewport rect exactly; `currentSrc` is the 2x master above roughly
1600 css px; `documentElement.scrollWidth === clientWidth`; the only transform
between the `<img>` and the document is the drift's own matrix (any layer scale
means text is being resampled). Then look at the screenshot: no bars, no soft
edges on type.
**AUTOMATE:** yes, partly covered. `tests/unit/pause-fullbleed.test.ts` exists
and asserts the stylesheet mounts `.pause` at `position: fixed; inset: 0` and
never blurs the painting; that is the source-level half. The live half does not
exist. Add a case to `tests/e2e/pause.spec.ts`: loop the six sizes with a fresh
context and assert `rect === viewport` and the `currentSrc` tier.
**SCOPE:** every layer meant to own the window: pause, photo mode, cutscene
letterbox, results, title, chapter select, and any future overlay. Also the
resolution contract behind it: **a plate authored below the display's pixel
count is the same defect** (19 pause stems at 2688x1536, WebP 1x/2x), and the
same applies to portraits, backdrops and the title art.

---

## CHK-003. Nothing a player must read falls below the legibility floor

**Rubric:** UI fidelity and polish.
**Owner saw (2026-09-18):** "PAUSE" and the hint text are tiny, because the UI
is in fixed px scaled down from a small canvas.
**Why it was missed:** the tests asserted DOM presence and read the stylesheet
source. Presence is not legibility. Nothing measured a computed font size on a
real page, and with one viewport in the suite the arithmetic could not be caught
either: a fixed px value inside a scaled stage is only wrong once the stage
scale is known.
**THE CHECK:** at each of the six viewports in CHK-002, walk every text node
under the active screen root, take `getComputedStyle(el).fontSize`, and report
the smallest and the count under 14 css px. Separately, check clipping: each
text box's `right` against its container's, and `scrollWidth` vs `clientWidth`
(a clipped strip does not move `documentElement.scrollWidth`, so the page-level
scroll check passes while the text is cut off). Then read the screenshot at 100
percent and confirm you could read it from a sofa.
**Pass/fail:** zero elements under 14px, zero clipped, and the screenshot reads.
**AUTOMATE:** yes, partly covered. `tests/unit/pause-fullbleed.test.ts` already
has "declares no font-size a player could not read" and "floors every clamp()ed
type token at 14px", both over the CSS source. The live measurement does not
exist for any screen. Add a legibility sweep in `tests/e2e/` that runs the walk
above per screen and fails on the first element under the floor.
**SCOPE:** every screen in both games: battle HUD, CTB list, party status,
advisor card, strategy guide, enemy intent, prep tabs, results, chapter select,
cutscene dialogue, polaroid captions, save slots, controls hints.

---

## CHK-004. A panel that names an action proves the actor can press it, and says where

**Rubric:** UI fidelity and polish / Fun and pacing.
**Owner saw (2026-09-18):** "im controlling tidus but the advisor is telling me
to use poison fang? how does that make sense?"
**Why it was missed:** the advisor's tests exercised the advisor against its own
rows in isolation and asserted the card printed a move, a cost and a hit chance;
none of them asserted the move belonged to the character whose menu was open.
Ownership was a convention inside the tactic files, not a gate in code, and
`guide.ts`'s `rowFor` matched loosely by kind and id. The card also printed a
bare label with no submenu, so a thrown item (Poison Fang is an item in
`gagazetBuild.inventory`, row 33 of Tidus's own 42) read as another character's
ability. The suggestion was legal; the presentation made it unreadable, and
nothing enforced the promise either way. Underneath: **the critic never sat at a
real command menu and cross-read the card against the rows on screen.**
**THE CHECK:** per chapter, open the command menu for each party member in turn
with real keys, screenshot the card and the open menu in the same frame, and for
every row the card names: find that row in the menu, confirm it is `enabled`,
confirm it can reach the target the card aims at, and confirm the submenu chip
on the card ("in Items") matches the submenu the row actually lives in. Then
force a board where the chapter line's move belongs to another character and
confirm the card either offers the switch (only when a switch row is enabled and
clears the switch penalty) or falls back to the simulated ranking, and never
prints the foreign move.
**AUTOMATE:** yes, and it **already exists** at model level:
`tests/unit/advisor-ownership.test.ts` replays all five chapters with shipped
tactics and seeded random legal play, both engines, at least 300 decisions per
chapter, and asserts every suggestion passes `ownedRow` against that decision's
own command list, plus that the card's actor id and name match the decision. Not
covered: the on-screen cross-read and the submenu chip. Add
`tests/e2e/advisor.spec.ts` asserting every label on the card is findable as an
enabled row in the rendered menu, with a matching category chip.
**SCOPE:** **any panel that names an action must be validated against what the
acting character can actually do** - the advisor, the strategy guide, the enemy
intent panel (it must name a move that enemy can actually use next), tutorials,
controls hints, results tips, chapter objective chips, and the auto-battler's
own narration.

---

## CHK-005. A recommendation is tested on the broken board, not only the healthy one

**Rubric:** Fun and pacing / Combat fidelity.
**Owner saw (2026-09-18):** the advisor ignored Yuna at 0/1500 and kept
recommending offence.
**Why it was missed:** the scoring constants were flat. `REVIVE_VALUE` was a
bare 3,000 against `BOSS_KILL_VALUE` 20,000 and roughly 2,000 per hit, so
offence always won by construction. Every test and every sweep ran a healthy
party, and the auto-battler never let the party get to one member down, so no
fixture ever put the scorer on a board with a body on it. There was no standing
rule that a heuristic must be exercised at its edges.
**THE CHECK:** per chapter, construct these boards and read the card on each:
one ally down; two down; the healer or summoner down; the whole party in
critical; a status lock (Zombie, Petrify, Confusion, Silence on the only
caster); no revive items in stock; no MP; and the boss telegraphing a re-kill
(Lance of Atrophy, Full-Life on a Zombie body, Total Annihilation, Death, a
charge counter at 0 or 1). Screenshot each and judge as a player: is this the
move a competent player would make? Specifically, a revive must never be
proposed into a guaranteed re-kill, and the card must say in plain words what to
spend the turn on instead.
**AUTOMATE:** yes, partly covered. `tests/unit/advisor-ownership.test.ts` covers
Bailey's exact board (Chapter 1, Tidus acting, Yuna at 0/1500, Phoenix Downs in
stock) and the telegraphed-Lance wait case, and `advisor-revive` is unit tested
at both ends. Missing is the matrix as a standing rule: add
`tests/unit/advisor-degenerate-boards.test.ts` asserting, for each chapter x
each board above, that the top two suggestions contain the obvious recovery or a
stated reason not to.
**SCOPE:** every scoring heuristic in the game: the auto-battler strategies, the
enemy AI's target choice, the guide's ordering, results grading, difficulty
tuning, the intent panel's damage estimates. **A bare numeric constant that
decides player-facing advice is a suspect until it has been read off the board.**

---

## CHK-006. A transient overlay dies with the thing it belonged to

**Rubric:** UI fidelity and polish.
**Owner saw (2026-09-18):** the "Ronso Rage · Choose a rage" banner stayed on
screen over the guide chip and the Mortiorchis HP header during Tidus's turn.
**Why it was missed:** the overlay was torn down on the happy path (a rage gets
chosen) and every test and every screenshot took the happy path. Cancel, an
empty picker, the actor dying mid-decision and the battle ending were never
walked. The DOM tests confirmed the banner *appeared*; nothing asserted it was
gone one decision later, and a stale node is invisible to a test that only looks
for presence.
**THE CHECK:** for every menu overlay in both games (Overdrive/rage picker,
spherechange wheel, target reticle, submenu title slab, telegraph banner,
message bar, sensor card), open it and then leave it four ways: confirm, cancel,
the turn passing to another actor, and the battle ending. After each, assert the
node is gone from the DOM, then screenshot the next decision and confirm nothing
is painted over the HUD underneath.
**AUTOMATE:** yes, and it **already exists on the FFX side**:
`tests/unit/ui-ffx-hud-safe-zones.test.ts`, "a title slab never outlives its
decision", covers all four exits plus "takes the message banner down with it, so
one turn cannot label the next". FFX-2 has no equivalent. Add the same block to
`tests/unit/ui-ffx2-hud.test.ts` (see also CHK-020).
**SCOPE:** both HUDs, cutscene overlays, prep panels, photo mode, results, the
pause opened over a live command menu, and any future modal. The general rule:
**an overlay's lifetime is owned by the decision that created it, and every exit
from that decision is a test case.**

---

## CHK-007. No developer vocabulary in player-facing copy

**Rubric:** Writing and story / UI fidelity and polish.
**Owner saw (2026-09-18):** the advisor card printed a `CHAPTER LINE` chip and
the citation "ffx-seymour-flux §6 rows 5-6".
**Why it was missed:** those strings came straight from the research plumbing,
and every agent who looked at the card knew what they meant, so they never
looked wrong. The tests asserted the chip rendered. Nobody read the screen as
somebody who has never opened `research/`.
**THE CHECK:** capture the visible text of every player-facing surface through a
full chapter run (advisor card, guide panel, intent panel, banners, tutorials,
hints, results, cutscene lines, prep tabs, tooltips, aria labels), then grep the
captured text for: `§`, file stems (`ffx-`, `ffx2-`), "row"/"step" numbering,
hyphenated or camelCase ids, "debug", "TODO", "placeholder", "chapter line", and
any all-caps token that is not a real UI label. Then read the screenshots and
ask whether a player who has never seen the repo understands every word on
screen.
**AUTOMATE:** yes, partly covered. `tests/unit/ui-move-advisor.test.ts` asserts
the swept card text matches no `§|ffx-seymour`, and
`tests/unit/advisor-ownership.test.ts` asserts the revive `reason` and the card
`note` carry no `§|ffx-|row N`. Both are advisor-only. Add
`tests/e2e/player-copy.spec.ts` running the grep over every visible surface in
all five chapters.
**SCOPE:** every string that reaches the screen in both games, including debug
affordances that are meant for agents (the answer is to move them behind the
debug API, not to reword them), save-slot text, results copy and the strategy
guide, where citations belong and are welcome.

---

## CHK-008. Panels are measured against the painted actors, not only against each other

**Rubric:** UI fidelity and polish / Scene fidelity and beauty.
**Owner saw (2026-09-18):** the advisor card and its "N HIDE MOVES" chip sit
over the party sprites; in FFX-2 the fighters are drawn over the party HUD.
**Why it was missed:** the layout tests compared DOM boxes of panels against
other DOM boxes. The party are WebGL quads with **no DOM box at all**, so they
were invisible to every assertion in the suite. The single 1600x900 viewport
also happened to leave a usable pocket. And the screenshots that would have
shown it were reviewed for "is the panel there" rather than "what is underneath
it".
**THE CHECK:** at 1280x720, 1600x900, 2000x1000 and 2560x1440, in chapters 1 to
5, project every actor's painted quad through the render camera into screen
space, take the DOM box of every HUD panel, and intersect. Compare
panel-against-panel in the **unskewed** frame recovered from each element's own
matrix (every Ink & Gold slab carries the same `--ig-skew`, so raw bounding
boxes overlap where the painted parallelograms have clear air between them);
compare panel-against-sprite in the **painted** frame, because there the jutting
corner is exactly what the player sees. Repeat across the nine HUD states: all
panels open, a submenu, that submenu cancelled, the Sensor card, a stage-2
telegraph, a five-hit numeral burst, an Overdrive picker, that picker cancelled,
and every optional panel off.
**Pass/fail:** no panel intersects a face or a weapon. The only permitted
overlaps are the two declared in `docs/ENGINE-API.md#hud-safe-area` (the command
stack over the party's lower third, and the strategy guide's soft rail), and
they must be named in the round report every time.
**AUTOMATE:** yes, partly covered.
`tests/unit/ui-ffx-hud-safe-zones.test.ts` already checks `advisorZone` against a
reconstructed sprite rect in three chapters, at every height the card can reach,
and against the command stack and party-status column. The 108-state live matrix
lives in a scratch harness, not in `tests/`. Promote it to
`tests/e2e/hud-collision.spec.ts` so it runs on every build rather than once per
fix round.
**SCOPE:** both HUDs in all five chapters, prep screens, results over the
diorama, cutscene dialogue over actors, damage numerals, the pause panels over
the hero plate, and any new panel. **Any new HUD element ships with its zone
measured against the actors, not placed by eye at 1600x900.**

---

## CHK-009. Every name that can be shown is shown in full

**Rubric:** UI fidelity and polish.
**Owner saw (2026-09-18):** CTB portrait names truncate ("Seymour F..."), and
polaroid captions were ellipsised.
**Why it was missed:** the tests asserted the row rendered and that its label
matched the actor's name *in the model*, which is exactly the string that got
cut. CSS ellipsis is a silent failure: nothing throws, nothing is missing, and
to a machine the DOM is perfect.
**THE CHECK:** with the longest name in each list actually present (Seymour
Flux, Braska's Final Aeon, Mortiorchis, Yu Pagoda, Vegnagun Head, Lady Luck),
for every label element assert `scrollWidth <= clientWidth + 1`, and assert that
where `text-overflow: ellipsis` is declared it is never engaged. Measure at 1280
and at 3840, because a fluid layout can truncate at either end. Then read the
CTB list and the caption strip in a screenshot.
**AUTOMATE:** yes. **No such test exists**: a grep of `tests/` for
`scrollWidth`/`clientWidth` finds nothing, and `pause-fullbleed.test.ts` only
asserts the caption CSS *permits* wrapping (`-webkit-line-clamp`), not that no
caption is clipped. Add `tests/e2e/label-fit.spec.ts`.
**SCOPE:** CTB list, party rows, command menu rows and item counts, advisor move
labels, guide headings, prep tabs, results rows, chapter select cards, save
slots, dressphere names. Any future localisation multiplies every one of them.

---

## CHK-010. What is selected is obvious at a glance

**Rubric:** UI fidelity and polish / Fun and pacing.
**Owner saw (2026-09-18, ~17:50, Chapter 3, Tidus casting Hastega):** target
selection is unclear; the only cue is hairline brackets and a tiny name tag.
**Why it was missed:** a reticle existed, so every check that asked "is a target
cursor rendered" passed. Nothing asked how *strong* the cue is at the size a
player sees it, and no screenshot was judged against the question "can I tell in
half a second what this will hit". Multi-target commands had no label at all, so
there was nothing to assert the absence of.
**THE CHECK:** per chapter, open a single-target command, a multi-target command
and an all-party command. Screenshot each at 1280 and 2560 and look: is there an
in-world ground ring and rim pulse on the target, a chevron with the name and HP
plate, non-selected actors dimmed, the matching party row and turn-list entries
highlighted, and an explicit "ALL ALLIES" / "ALL ENEMIES" label for a
multi-target command? Measure the cue as well as looking at it: the marker's
painted area against the target's quad area (a hairline at a few percent fails),
and its contrast against the backdrop immediately behind it.
**AUTOMATE:** partly. The structural half automates: assert the marker elements
exist for the selected target set, that non-targets carry the dimmed class, and
that a multi-target command sets the all-target label, in
`tests/e2e/targeting.spec.ts` (**does not exist today**). Cue strength and
contrast stay a screenshot judgement.
**SCOPE:** both games' targeting, the auto-battler's highlight, the intent
panel's "who is being aimed at", Vegnagun's parts, aeon and Overdrive target
sets, item throwing, and selection state on the prep and chapter-select screens.

---

## CHK-011. Every targetable enemy is visible

**Rubric:** Scene fidelity and beauty / Fun and pacing.
**Owner saw (2026-09-18, Chapter 3):** both Yu Pagodas were completely hidden
behind Braska's Final Aeon.
**Why it was missed:** formations are authored as scene slots, and the only
assertion about them is `tests/e2e/chapters.spec.ts`, "actors are staged onto
the scene slots", which proves an actor received a position and nothing about
whether a player can see it. Worse, the chapter screenshots are framed on the
boss, and that is precisely the shot in which the small enemies disappear. No
check ever counted the enemies visible in the frame against the number in the
encounter.
**THE CHECK:** per chapter, per formation, per camera rig: project each
targetable enemy's quad and compute how much of it is covered by nearer quads
(polygon coverage in painter order, or an id-buffer render offscreen and a pixel
count per enemy). Then, in a screenshot, count the enemies you can identify and
compare that number to the encounter's roster.
**Pass/fail:** no targetable enemy is more than about 25 percent occluded in the
default framing, occluders fade while targeting, and every targetable enemy has
an always-on marker (including every one of Vegnagun's parts).
**AUTOMATE:** yes. **No such test exists.** Add
`tests/e2e/enemy-visibility.spec.ts` with the per-chapter, per-form matrix and
the 25 percent rule.
**SCOPE:** all five chapters and every form change (Seymour Flux into
Mortiorchis, Yunalesca's three forms, Braska's Final Aeon plus the Pagodas,
Bahamut, Vegnagun's parts, Shuyin), summoned aeons against party slots, and any
future encounter. The same rule covers **party** members hidden behind an aeon
or a large VFX.

---

## CHK-012. A fallback never ships as the final face

**Rubric:** Character and visual fidelity.
**Owner saw:** 2026-09-15/16, the live site showed `T`/`K`/`Y` ink monograms
where the party's faces should be; 2026-09-18, Yu Pagoda's turn-list portrait is
a letter tile, Auron's HUD portrait is cropped through the chin, and aeon and
Vegnagun placeholders are still on the live build.
**Why it was missed:** the fallback is deliberately silent. It exists so a chip
is never blank, which means a missing portrait renders as a considered design
choice and no structural check can tell the two apart. The portrait e2e that was
added after the first incident stages **one** battle (`show(page, 'battle')`)
and inspects that queue's rows, so a subject that only appears in Chapter 3 (Yu
Pagoda) never entered the sample at all. And the crops were judged on a contact
sheet, where every head is centred and the frame is generous, rather than in the
HUD chip, where it is tight.
**THE CHECK:** for **every subject in every chapter's roster** (party, reserves,
enemies, every boss form, aeons, dresspheres), stage that chapter and read each
portrait chip on screen: at least one painted layer loaded, with a non-zero box,
painted above the monogram's z-index; zero 4xx on any `/art/` request; and the
*visible crop* contains the whole head with air above the hair and below the
chin. Compare each against the subject's key art for recognisability.
Screenshot the CTB list, the party rows and the prep roster per chapter.
**AUTOMATE:** yes, partly covered. `tests/e2e/portraits.spec.ts` already asserts
painted-above-monogram, base-correct URLs, non-zero boxes and no art 404s, but
for a single staged battle. Extend it to loop all five chapters and their full
rosters. For crops, assert every shipped portrait has a focal sidecar and that
the computed crop box lies inside the plate.
**SCOPE:** CTB list, party status rows, results, chapter select, prep roster,
cutscene speakers, the pause dossier, FFX-2 dressphere tiles. The general rule
covers every graceful degradation in the game: **placeholder scenes, silent
audio cues, default dialogue and monogram tiles are all invisible to presence
checks, so each one needs an explicit "this is not the fallback" assertion.**
(Per the rubric's hard caps, a placeholder on a live build caps the round at
8.0, which makes this check score-critical, not cosmetic.)

---

## CHK-013. Art is judged inside the running game, against a fixed written rubric

**Rubric:** Character and visual fidelity / Scene fidelity and beauty.
**Owner saw:** 2026-09-15, the first HD-2D pixel-art screenshots "look
terrible"; later, hero plates judged by inconsistent rubrics, and an approved
Zanarkand Dome backdrop replaced with a grey hall by a re-judge pass.
**Why it was missed:** art was accepted on contact sheets at 4x, where a sprite
reads as charming and a plate reads as detailed. At the size, lighting and
distance the game actually renders them, both collapsed. Separately, each art
agent wrote its own acceptance bar per batch, so the same plate could pass on
one pass and fail on the next, and "regenerate if off" was allowed to run over
work the owner had already approved.
**THE CHECK:** every art batch is judged from an **in-game** screenshot (in
battle for actors and backdrops, in the actual chip for portraits, on the pause
layer for plates) at 1600x900 and 2560x1440, at 100 percent, placed beside (a)
the previously accepted version of the same subject and (b) two other subjects
from the same batch for style consistency. The acceptance bar is the written
rubric row for that subject (silhouette, palette, weapon, style, framing), not a
fresh opinion formed on the spot. **Anything the owner has approved is never
re-judged and never regenerated**; the copy in
`D:\Tools\pyrefly-art-backup\approved` is the reference.
**AUTOMATE:** no for the judgement itself. Yes for the guard rails, and none of
them exist today: assert every shipped subject has a manifest entry with an
`idle` and a `facing`; assert no file under `public/art` shares a stem with an
approved-backup file but different bytes without an owner note recorded.
**SCOPE:** backdrops, character plates, portraits, aeons, dresspheres, VFX
sheets, pause plates, title art, and any future restyle. See CHK-B3.

---

## CHK-014. A character is posed and facing for the shot the player sees

**Rubric:** Character and visual fidelity / Scene fidelity and beauty.
**Owner saw (2026-09-15/16):** characters face the camera instead of their
enemies.
**Why it was missed:** a plate is generated and reviewed on its own, front-on,
which is the correct view for judging a face and the wrong view for judging a
fight. The manifest carries a `facing`, but nothing ever compared it with the
actor's slot and the opposing side's slot in the staged scene, so the value was
recorded and never checked.
**THE CHECK:** stage each chapter, screenshot the board, and for every actor
confirm the painted facing points across the field toward the opposing side,
that attack and cast poses read as aimed at the target rather than at the
viewer, and that neighbouring actors do not mirror into each other. Cross-check
numerically: for every actor in every chapter's formation, the manifest facing
must match the sign of (opposing slot x minus actor slot x).
**AUTOMATE:** yes, the cross-check. `tests/unit/art-manifest-build.test.ts`
exists and proves facing is taken from `idle` and then from whichever state
declares one, but nothing compares it with the scene slots. Add
`tests/unit/actor-facing.test.ts` with the sign assertion per chapter.
**SCOPE:** all five chapters, aeon entrances, cutscene staging, results poses,
prep roster art, pause plates. The wider class: **art correct in isolation can
still be wrong once staged**, which also covers scale against neighbours, ground
contact (feet plane), and lighting direction against the backdrop.

---

## CHK-015. A player-facing behaviour is proved with the player's own input

**Rubric:** Stability and performance / UI fidelity and polish.
**Owner saw (2026-09-15/16):** "I tried esc and P during battle" and nothing
happened, on a build whose pause screen was green in the suite and had
screenshots to prove it.
**Why it was missed:** every pause screenshot and every pause test in the repo
opened the menu through the debug beat `pause:open`, which bypasses `canPause`
**on purpose**. The debug API is the critic's tool, so it was also the critic's
evidence, and it can do things no keyboard can. The same shape recurred one
round later: the branch fixed and tested `P`, Start and the chip, and shipped
with `Esc` still refused at the command menu, which is the exact spot the player
had pressed it, because the tests covered the key that had just been changed.
**THE CHECK:** for every input a player can use, press it with
`page.keyboard.press` / `page.mouse.click` on the **production bundle**, in
every state where the player could press it, and assert the state change from
the game's own snapshot. For the pause that means Esc, P, Start and the chip,
from: the top row of the command menu, inside a submenu, while targeting, during
an animation, during a cutscene, and on the results screen. A trigger beat may
be used to reach a board and never to prove a capability.
**AUTOMATE:** yes, partly covered. `tests/e2e/pause.spec.ts` drives Esc, P, H
and the chip with real presses across seven cases, and
`tests/unit/menu-cancel.test.ts` walks every view change in both command menus
with real key events (the failure mode there is a missed transition, not wrong
logic). Missing: the same treatment for G, N, E, F, the gamepad, and the FFX-2
menu's identical Esc race. Add cases in `tests/e2e/`.
**SCOPE:** every key and button in `docs/DEV.md`'s control table, in both games,
plus gamepad and mouse, plus save/load and reload. **Any claim of the form "the
player can X" is unproven until a real event produced it.**

---

## CHK-016. A screenshot is evidence only when the harness proved what is in it

**Rubric:** Stability and performance (and the integrity of every other
category's evidence).
**Owner-adjacent, found in the release round (2026-09-16/18):**
`docs/screenshots/battle-open-ch4.png` was a photograph of the title screen for
as long as the script had existed, and a whole set of "the stage is empty"
battle shots were an orphaned title root painted over a perfectly good diorama.
**Why it was missed:** a wait loop that `break`s on success and falls through on
failure is a silent failure by construction. The chapter-open loop asked for a
chapter id that does not exist (`vegnagun` instead of `ffx2-bahamut`),
`getChapter` returned undefined, nothing threw, the loop timed out quietly and
screenshotted whatever was on screen. Those screenshots then became the critic's
input, so the critic graded the harness and reported it as the game.
**THE CHECK:** every capture asserts before it shoots: the expected screen name,
the expected board condition (for a battle, `awaitingMenu === true`), and
`assertNoStaleRoots` (the `#ui > [data-screen]` list matches `app.screens`
element for element, and `.ig-title-screen` is gone). Every wait loop ends in an
assert rather than a fall-through. When a screenshot looks broken, the first
hypothesis is the harness and the second is the game. Also: never press Enter to
start the real flow **and** call `gotoChapter` in the same page; the two race and
orphan a screen root.
**AUTOMATE:** yes, as a lint over the harnesses: scan `critic/scratch/*.mjs` and
`tools/*.mjs` for a `for`/`while` containing `break` with no assertion after it,
and for a capture call not preceded by a screen assertion. **Nothing like this
exists today.**
**SCOPE:** every screenshot under `docs/screenshots/`, every critic round's
evidence, the art-watch gallery, and any number a report quotes from a page.

---

## CHK-017. The live site is checked as the live site

**Rubric:** Stability and performance.
**Owner saw (2026-09-15/16):** the deployed site showed monograms instead of
faces and the network panel was a 404 storm, while dev looked fine.
**Why it was missed:** dev serves at `/` and the build serves under
`/pyrefly-reprise/`, so a path that works in dev 404s live; and an image request
answered with the SPA's `index.html` returns **200**, so a naive "did it load"
check sees success. Preview was run, but the rounds were judged on preview
rather than on the deployed URL for that exact bundle.
**THE CHECK:** after the deploy, load
`https://baileypillon.github.io/pyrefly-reprise/`, confirm the served bundle
hash equals the built one, then play all five chapters: zero console errors,
zero responses with status >= 400, zero image responses with content-type
`text/html`, every audio cue 200s, first load under 5 seconds, save data
survives a reload, and the same screenshot set as the preview run for
comparison. Record the main sha and the bundle hash in the round report; the
`critic/pending/<sha>.json` marker is cleared only by a round against that exact
build.
**AUTOMATE:** yes, partly covered. `tools/deploy-pages.mjs` already verifies the
live bundle hash and that art resolves, and `tests/e2e/portraits.spec.ts`
watches for `/art/` 404s under the production base in preview. Missing: an e2e
run pointed at the live URL after the deploy. Add a base-URL override mode to
`playwright.config.ts` and run the suite against the live origin post-deploy.
**SCOPE:** fonts, audio, art, the generated manifest, deep links, service of
`index.html`, and anything built from `import.meta.env.BASE_URL`.

---

## CHK-018. No shipped path is hand-written

**Rubric:** Stability and performance / Character and visual fidelity.
**Owner-adjacent, release round (2026-09-16/18):** `chapter-meta.ts` went red
three times mid-release because the art fleet promoted `idle.1.png` to
`idle.png` under it, and because Lenne and Shuyin shipped as characters where
the meta expected portraits.
**Why it was missed:** `chapter-meta.ts` is the one file that names art paths by
hand, and the suite only notices after the fleet has already moved the file.
Nothing fails at **build** time, so a bad path can reach a bundle and only turn
up as a missing image on the live site.
**THE CHECK:** `grep -rn '\.[0-9]\.png\|\.raw\.png' src/ --include=*.ts` must be
empty (no shipped path sits on a variant the fleet can promote out from under
it). Then assert every art path named anywhere in `src/` resolves against the
generated manifest and exists on disk, and make that a build step rather than a
test. Re-run both at the top of every release.
**AUTOMATE:** yes, partly covered. `tests/unit/chapter-meta.test.ts` checks the
named paths and `tests/unit/art-manifest-build.test.ts` reports a state that
exists only as an un-promoted variant and a promoted pose with a missing
sidecar. Missing: the build-time gate. Add the resolution check to
`tools/gen/manifest.mjs --check` and run it in `prebuild`.
**SCOPE:** art, audio, fonts, scene keys, **chapter ids** (the `vegnagun`
mistake in CHK-016 is the same class), save keys, and any string literal that
addresses a file.

---

## CHK-019. A generated asset is proved to be an image before it ships

**Rubric:** Character and visual fidelity / Stability and performance.
**Owner-adjacent (2026-09-18, 13:35):** every ComfyUI render became all-zero
pixels for six minutes; 13 black outputs and two raw candidates reached
`public/art` before anyone noticed.
**Why it was missed:** the pipeline trusted that a file exists. A black PNG is a
valid PNG with a plausible size and passes every structural check; only reading
the pixels finds it. The later variant was worse: corrupted model weights in RAM
from unstable DDR5, which a ComfyUI restart does **not** fix, and which produced
garbled-then-black output from one model while another rendered fine.
**THE CHECK:** before an art batch is accepted, read max RGB for every new PNG
(an exact zero means quarantine, "cannot decode" means unverified and not black,
so the guard fails open), grep the newest `D:\Tools\comfy-logs\*.err.log` for
"invalid value encountered in cast", confirm the art-watch gallery flags no
black tiles, and after any machine crash re-`sha256` the model and text encoder
against the Hugging Face `lfs.oid`. Scan all of `public/art` for all-zero PNGs
before every deploy.
**AUTOMATE:** yes, partly covered. `tests/unit/art-black-frame.test.ts` proves
the guard's logic thoroughly (`isBlackFrame` fires only on an exact zero,
`maxRgbOfPng` across every row filter and greyscale, quarantine targets), and
`tools/gen/comfy.mjs` rejects all-zero renders and auto-restarts. Missing: a
repo-wide scan of `public/art` in the deploy preflight. Add it to
`tools/deploy-pages.mjs`.
**SCOPE:** every generated asset: plates, portraits, backdrops, VFX sheets, and
audio renders, where a slice that decoded to silence is the identical defect and
`tools/audio/qa.mjs` already checks for it. Also every asset restored or
regenerated after a crash (see the rubric's rule 8, the integrity pass).

---

## CHK-020. The same screen in both games gets the same work

**Rubric:** UI fidelity and polish.
**Owner saw (2026-09-18):** the FFX-2 prep screen had one CHAPTER tab where the
FFX prep has five; the FFX-2 party rows drew two-letter dressphere monograms
instead of portraits; the FFX-2 command menu carries the identical Esc race the
FFX one had.
**Why it was missed:** work is split by track and each track owns one game's
files, so a fix lands on one side and the mirror is written up as a "request for
another track" and then waits. Meanwhile the chapter sweep plays all five, but
the screenshot review concentrates on chapters 1 to 3, which are the FFX ones
and come first in every list.
**THE CHECK:** for every shared screen (prep, pause, results, HUD panels,
command menu, intent, advisor, guide, chapter select), open it in both games and
put the two screenshots side by side: same tabs, same panels, same keys, same
portrait treatment, same overlay lifetimes. Any difference must be a deliberate,
written FFX-2 difference (ATB bars, chain popup, spherechange wheel, garment
grid) and not an omission. **Every open "request for another track" in a handoff
is treated as an unfixed defect until it is closed**, and the gate reads the
handoff list before signing off.
**AUTOMATE:** partly. `tests/unit/ui-ffx-party-prep.test.ts` and
`tests/unit/ui-ffx2-party-prep.test.ts` both exist but neither compares the two;
add a parity assertion (the FFX-2 tab and panel list is the FFX list minus a
written exception set). Same for the two HUD test files, for the overlay
lifetimes of CHK-006, and for the Esc handling of CHK-015.
**SCOPE:** both prep screens, both HUDs, both command menus, both results
screens, the pause over either game, and the five chapters as a set: **chapters
4 and 5 are reviewed first in the next round, precisely because they are always
reviewed last.**

---

## Blind spots that no agent can close

These are not gaps in the checks; they are things the checks structurally
cannot decide. Each one needs the owner's ear, eye or hands, and each has a
standing way of collecting that judgement. A build is not finished when the
checks pass; it is finished when the judgement below has been collected for
whatever changed.

**CHK-B1. Whether the music and effects are beautiful.** No agent can hear.
Every audio check is technical (loudness, true peak, loop seams, octave balance,
theme usage, the file actually playing). *Collected by:* the audition tour,
`npm run audio:render -- --all --audition` writing `docs/audio/audition/`, sent
to Bailey with the cue list in tour order **before** integration, as the owner
asked on 2026-09-18 ("mockups for approval BEFORE integrating"). No cue ships
without a sign-off recorded against its name.

**CHK-B2. Whether the input feels good.** Latency, animation snap, the weight
of a confirm, how long a skip takes to feel instant. An agent can measure frame
time and prove 60 fps at 1600x900; it cannot tell that a 90 ms menu delay feels
sticky. *Collected by:* a short play session on the live build after each
deploy, with the owner playing one chapter start to finish, plus the deploy
announcement listing exactly what to try. Anything they call "sluggish" or
"floaty" becomes a new CHK entry under rule 2.

**CHK-B3. Taste.** Art direction, whether a face is *the* character, whether
the pacing of a fight is exciting, whether the writing sounds like Tidus,
whether the advisor's advice is the advice a good player would actually give,
whether a screen is beautiful rather than merely correct. The critic can score
against a written rubric, which is why CHK-013 insists the rubric be written
down and fixed; it cannot originate the taste. *Collected by:* a mockup for
every new screen before integration (the standing Ink & Gold rule), the
screenshot stream Bailey asked for at every milestone, and the owner's own
review of the live build. Approved work is never re-judged by an agent, and
never regenerated.

**CHK-B4. Whether a proposal is worth building.** Expansions and novel ideas go
in the round report's Proposals section with a pitch, the player benefit, the
cost and the fidelity risk, ranked by value for cost, and **nothing there is
built until Bailey approves it.** Proposals never move the score.
