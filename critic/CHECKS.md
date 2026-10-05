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

## How checks are selected and recorded (policy v2, 2026-09-20)

Bailey approved the consolidated critic on 2026-09-20 (`critic/RUBRIC.md`). Every
ID below is kept, with its incident history. What changed is how they are used.

**Selected by what changed, not run wholesale.** `node tools/critic-plan.mjs`
lists the checks a candidate needs from its changed paths (the `rules` in
`critic/policy.json`); CHK-016 and CHK-017 apply to every deployment; a deep or
milestone review runs the broader set for every affected chapter. The entries
still say "Rubric:" with a category of the archived three-part rubric; read them
through this map: Combat fidelity → `combat`; Encounter fidelity → `encounter`;
Character and visual fidelity, Scene fidelity → `visual`; Fun and pacing, Game
feel → `feel`; Writing and story, Narrative direction → `narrative`; Audio →
`audio`; UI fidelity, Clarity → `interface`; Onboarding, Accessibility →
`onboarding`; Progression, Replayability → `prep`; Stability, Controls and
platforms → `delivery`; Part C → the approved-target gate (RUBRIC §7).

**Proof matches the claim.** Rules 1 and 2 above govern interaction and
appearance. A technical check does not need a screenshot (a hash, a decode, a
routing assertion); a visual check does not need a full replay; human judgment is
asked for the changed subjective decision only.

**Every selected check leaves a record**: ID, why it was selected, game, chapter
and state, artifact and target versions, environment, result (`PASS`, `FAIL`,
`UNVERIFIED`, `NOT APPLICABLE` with a reason), evidence, automated or manual, and
the time it took. A skipped check records why and whether it was mandatory.
Reused evidence names the earlier result and its dependency argument. Each
check's `automation` field in `critic/policy.json` says **planned / implemented /
executed / validated / human**: a written check is not an implemented test, and
an implemented test is not a validated player experience.

**Refinements adopted with the policy** (they narrow a check, they do not remove it):

| ID | Read it as |
|---|---|
| CHK-001 | Technically valid, routed to the right real moments (no silent unintended fallback), and heard and approved at the right scope |
| CHK-007 | Player meaning, no raw ids or debug text in the ordinary HUD; legitimate names and deliberate research or help citations are allowed |
| CHK-010 | Judge the selection against the **approved targeting design** (`docs/target/targets.json`), not a compulsory inventory of rings and chevrons |
| CHK-012 | Expected bytes, type and decode for every affected subject, and the actual crop in its destination |
| CHK-013 | Protect the approved choice while checking how it renders at gameplay scale beside its neighbours |
| CHK-014 | Battle-facing rules do not apply to intentional portrait or menu poses |
| CHK-015 | Real keys, pointer, controller or touch on production, positive and cancel paths; a staging hook never establishes capability |
| CHK-017 | The **exact artifact**: every shipped file's hash, base paths, content types and decodes, live smoke, save and reload where it applies (`tools/artifact-manifest.mjs`); a full review only when the risk requires it |
| CHK-018 | Generated ids or validated references and every delivery file present; not a ban on every legitimate string literal |
| CHK-019 | Blank or corrupt image and silence checks with listed intentional exceptions; undecodable is blocked or unverified, **never a pass** |
| CHK-020 | Paired FFX and FFX-2 flows with explicit game-specific exceptions, and closure of cross-track defects |
| CHK-026 | Size continuity across pose changes (2026-10-04, D-420): at every swap a figure's head changes by at most 3 percent (the whole figure's mass by at most 30 percent where no head is registered) and a standing figure's feet by at most 2 px at 1600 wide (6 px read from the silhouette), unless the camera cuts in that frame; measured frame by frame by `critic/runner/lib/continuity.mjs`, never from stills |
| CHK-027 | Continuity of motion (2026-10-04, D-421): snaps per minute of battle, the outline jump of every swap, double-image (half-motion) frames per swap, jerks and teleports on every frame of a move; the worst events as transition strips |
| CHK-B1 | A reusable verdict tied to exact cues and mix; approving a direction is not final cue acceptance |
| CHK-B2 | Asked for after a material input, animation or pacing change or at a playable milestone, not after a typo fix |
| CHK-B3 | Concrete comparable options, the selection recorded per property; no re-approval of a repair |
| CHK-B4 | Proposal only: benefit, cost, fidelity risk and a preview; no score penalty for not adopting it |

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
equals the viewport rect exactly (**exception, D-070, Bailey 2026-09-24:** a plate
carrying `.pause__plate--slid` is option B, slid under the dark falloff on the
chrome side on purpose; for it, check instead that the uncovered side is the
feathered falloff, never a hard bar, and that the face stays wholly on screen); `currentSrc` is the 2x master above roughly
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
the live address (`LIVE_URL` in `tools/deploy-host.mjs`: `https://echoesofspira.com/` since
2026-10-04; `https://baileypillon.github.io/pyrefly-reprise/` before it, and now the legacy
address), confirm the served bundle
hash equals the built one, then play all five chapters: zero console errors,
zero responses with status >= 400, zero image responses with content-type
`text/html`, every audio cue 200s, first load under 5 seconds, save data
survives a reload, and the same screenshot set as the preview run for
comparison. Record the main sha and the bundle hash in the round report; the
`critic/pending/<sha>.json` marker is cleared only by a round against that exact
build. **The page a browser receives (release 39, D-418):** Cloudflare Web
Analytics adds one beacon script to every HTML response whose `Accept` names
text/html, so `verifyLive` fetches each HTML page twice: with a generic `Accept` it
must equal the artifact's file, and with a browser's `Accept` it must equal it once
exactly that element (and the line feed after it) is cut out; any other difference
fails. `_headers`, which Cloudflare reads and never serves, is in the artifact and is
not downloaded.
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

## CHK-021. A change lands only in the game it is true to

**Rubric:** all of Part A; Part B cohesion; Part C.
**Owner said (2026-09-19, a standing rule):** "changes implemented must be specific
and game aware. a change true to ffx but not ffx-2 does not apply to ffx-2. a change
true to ffx-2 but not ffx does not apply to ffx. a change true to both ffx and ffx-2
applies to both ffx and ffx-2."
**Why it would be missed:** the two games share screens, components and style
sheets, so the cheap way to build anything is once, for both. A turn-order preview
is true to FFX's CTB and meaningless over FFX-2's ATB bars; a chain counter, a
spherechange sequence and a mission-complete card are true to FFX-2 only; the
glass-shatter battle transition is FFX's. CHK-020 pushes the other way (parity), and
read alone it invites copying a game-specific idea across.
**THE CHECK:** for every change in the build under review, find its written case
(FFX only / FFX-2 only / both, with the source) in the plan, handoff note or commit.
No written case is a finding. Then open a chapter from **each** game and prove it:
an FFX-only change is present in chapters 1 to 3 and absent from 4 and 5; an
FFX-2-only change is the reverse; a "both" change is present in both and is the same
work (CHK-020). The source for the case is `research/*.md` and
`research/ffx-vs-ffx2-presentation.md`; a case argued from memory is a finding.
**AUTOMATE:** partly. Anything switched per game should read one flag (the chapter's
game), and a unit test per game-specific feature asserts it is off for the other
game's chapters.
**SCOPE:** presentation, camera, transitions, HUD elements, results cards, audio
cues, mechanics and wording; the approved concept boards in `docs/target/targets.json`
carry their own FFX-only / FFX-2-only notes; the new chapters inherit their game's set.

## CHK-022. A win, loss or scene transition reaches its real destination

**Rubric:** `delivery`, `narrative`, `feel` (policy v2 categories).
**Recorded failures (critic round 02, 2026-09-19; historical, not re-tested when
this entry was written):** Chapter 4 never left the battle after the victory, the
presenter stalled at skip speed in Chapter 1, and post-battle scenes could not be
reached. Round 03 reported all five chapters finishing.
**Why it was missed:** unit tests assert the engine's victory flag. A flag is not
the player leaving the battle: the stall was in the presenter's awaited tweens
(`Tween.kill` never settling), which no engine test touches.
**THE CHECK:** run each affected chapter through legitimate input from its normal
entry to its outcome. Confirm the required phase changes, the post-battle scene,
the results screen, saved rewards, retry and return to chapter select. Exercise
skip and cancel on the way, in both games. A chapter that reaches its outcome only
through a debug hook has not passed.
**AUTOMATE:** partly. A Playwright flow per chapter that plays to win and to loss
with real keys and asserts the destination screen (CHK-016 state assertions) can
run in the release gate; whether the aftermath lands emotionally cannot.
**SCOPE:** every chapter's win and loss path, scene skip, retry from a form
change, results to chapter select, and any new chapter before it is included in a
release manifest. Mandatory for every included chapter at milestone acceptance.

## CHK-023. A subsystem is invoked through the real presentation path

**Rubric:** `combat`, `audio`, `interface`.
**Recorded failures:** this project twice shipped a complete, tested subsystem
that nothing called (AGENTS.md hard rule 4); round 02 found boss music that never
played and Wakka's and Lulu's Overdrives and Talk inert in play although their
unit tests passed.
**Why it was missed:** a passing standalone test, or finding an importer with
`node tools/orphans.mjs`, shows the code exists and is reachable. Neither shows
that the normal runtime calls it with the expected data, or that something does
not cancel or overwrite it a frame later.
**THE CHECK:** trace one real input to the command or event, the effect, the
visible or audible feedback and the resulting state. Cover every changed
Overdrive input window, damage outcome, Trigger Command (Jecht's Talk), battle
music selection and crossfade, and saved setting. Verify the runtime invokes it
with the expected data and that the result survives the next frames.
**AUTOMATE:** partly. Event-log assertions in a real-input Playwright run (the
presenter's event stream, the AudioManager debug surface) can prove invocation
and data; feel and mix cannot be asserted.
**SCOPE:** every feature that has a unit test of its own and a separate call site
in the presenter, HUD, audio router or settings boot.

## CHK-024. Saves and settings survive an actual upgrade

**Rubric:** `delivery`, `prep`.
**Recorded failure (critic round 03):** saved audio settings were never applied at
boot, so a returning player's volumes silently reset.
**Why it was missed:** every automated run starts from a clean browser profile, so
"it works on a fresh profile" was mistaken for "it works for the player who
already has a save".
**THE CHECK:** for a schema, storage or release change (`src/app/SaveData.ts`),
test a fresh player, a returning player, a save written by the previous live
build migrating forward, reload during every allowed state, invalid or truncated
storage, and the reset / confirmation flow. Confirm progress and settings are
preserved and applied. A pass produced from a clean test profile is not a pass.
**AUTOMATE:** mostly. Keep a fixture of the previous release's `localStorage`
under `tests/fixtures/saves/` and load it before boot in a unit test and a
Playwright run. A lightweight reload smoke belongs to every deployment's live
check; the full matrix runs when persistence changes.
**SCOPE:** save data, best records, settings (volumes, speed, reduced motion),
chapter unlocks, and anything a new chapter adds to the schema.

---

## CHK-025. A hidden experiment stays hidden and writes nothing to the save

**Rubric:** `delivery`, `prep`.
**Why it exists (2026-09-27, before any failure):** Bailey asked for the FF7 Guard Scorpion
fight as a hidden, experimental encounter ("dont make it so obvious on the encounter/chapter
menu"). A third `GameId` and a registered-but-unlisted chapter can leak in three quiet ways: a
two-way `game === 'ffx' ? A : B` hands FF7 to FFX-2's branch; the board, strip or briefing
counts it; and a run writes `pyrefly-reprise:save:v1`, which would put the experiment in the
save-data class and every progress count.
**THE CHECK:** for a change to the FF7 experiment or to a shared file it touches: the board
still shows the fifteen listed tiles in two groups with no FF7 card, group, ribbon or count;
`CHAPTER_IDS` is unchanged; a full run (win, loss, automated) leaves the main save key
byte-identical and writes only `pyrefly-reprise:experiments:v1`; the secret door (L-I-M-I-T,
seven taps on the "Chapter select" label, L1 R1 L1 R1 Select) moves no cursor, starts no
chapter and changes nothing visible, and does nothing at all while `FF7_EXPERIMENT_READY` is
off; every game-branch site in `docs/plans/ff7-game-branch-audit.md` answers FF7 explicitly or
throws `Ff7NotHandledError`; the FFX and FFX-2 goldens are byte-identical.
**AUTOMATE:** done: `tests/unit/ff7-hidden-board.test.ts`, `ff7-secret-door.test.ts`,
`ff7-game-branch.test.ts`, `ff7-experiment-records.test.ts`. Re-run the audit's grep when a
new two-way game branch lands.
**SCOPE:** FF7 only for the experiment; the board, flow and save are shared plumbing (both).

---

## CHK-026. A figure keeps its size and its feet across a pose change

**Rubric:** `visual` (Bailey's `characterModels` sub-score) and `feel` (`animation`). While this check FAILS both sub-scores are capped at 7.0 (`critic/RUBRIC.md` section 6a, D-424).
**Owner saw (2026-10-04, playing release 38):** "As poses change for the characters their size changes too sometimes and that looks really bad"; then, asking whether it was being fixed: "Are you fixing the issue that characters change size and height across poses? It is soooo bad and ruins the immersion".
**Why it was missed:** four reasons, from the driver's diagnosis that night, checked against the critic's own files. (1) The critic sampled stills and timed sequences at moments picked in advance, so the frames just before and after a pose swap were rarely side by side. (2) All 25 checks then in the library measured one frame at a time; none tracked a figure's size or its feet over time. (3) Its own advice of 2026-10-01 (VP-1001-20, "crossfades replaced by cuts on big silhouette changes", `critic/reviews/visual-pass-2026-10-01.md` line 27) made it judge a pose change for ghosting, not for continuity. (4) Its animation score counted features, not breaks (`critic/reviews/visual-plan-2026-10-03.md` lines 15, 60 and 87; the `subScores` note of `critic/rounds/round-21.json`: animation 7.4, characterModels 8.2). The defect is plain once it is measured: the painted poses are generated one at a time and not at one scale, so a head comes out between 0.6 and 1.6 times the idle's, and the engine centres each plane by its PNG, so the feet slide when the pose changes (the `r39-posescale` lane's measurements, `docs/target/pose-measure.json`). **Measured on the live release 38** (`critic/reviews/continuity-baseline-r38/`): in Chapters I, IV and VIII, played by real keys at 1600x900 on the GPU (22.8 minutes of battle, 1,281 swaps counted, 359 of them with a registered head), CHK-026 FAILS in all three. Where the head is registered it changed by up to **57 percent** (Auron idle to ready 1.57 and item to idle 0.69; Tidus idle to victory 0.62; Yuna critical to hurt 1.39 and item to idle 0.75), and 297 swaps were over their tolerance (177, 35 and 85 in the three chapters; Chapter IV's FFX-2 heroes have only their idle heads registered, so Rikku's hurt pose reads 0.56 to 1.78 times her idle by mass). The feet of a standing figure moved up to **259 px at 1600 wide** (Tidus attack to follow in Chapter VIII; Auron attack to follow 142 px, Wakka hurt to idle 90 px, Yuna item to idle 74 px), and 868 of 1,025 measured standing swaps were over 2 px (median 22 px, 90th percentile 49 px).
**THE CHECK:** run the continuity harness on every chapter the review lists (`PYREFLY_BROWSER=gpu node critic/runner/lib/continuity.mjs --base=<url> --evidence=<dir> --chapters=<ids>`; one browser at a time, headless Playwright from node, never the Claude-in-Chrome extension or the in-app pane). It plays each chapter with real keys, and a probe in the page watches every rendered frame of the fight.
1. A **swap** is the frame in which the painting that dominates a figure (the plane with the larger fade) changes: a cut, the middle of a crossfade, the KO collapse's cut. At each swap the old and the new painting are read through their own planes in the same frame, so the camera cannot be the cause.
2. **Head:** the square root of the head box's area as drawn, from the pose registration (`docs/target/pose-measure.json`) where a fresh record exists for both paintings; otherwise the figure's **mass** (the square root of the area its silhouette fills, thin blades opened away) read from the painting's alpha. A head and a mass are never compared with each other, and every measurement says which it used.
3. **Feet:** the stance point (the middle of the lowest thick part of the silhouette; the registered one where recorded). Only a standing figure has feet to keep: a lying one (KO) is left out.
4. **FAIL** when any counted swap changes the head by more than **3 percent** (**30 percent** when it is the mass), or moves a standing figure's feet by more than **2 px at 1600 wide** (**6 px** when the stance is read from the silhouette), with no camera cut within a frame of the swap. The wide tolerances are measured, not guessed. Against the reviewed records the silhouette's stance is within 0.4 percent of the painting's height at the 90th percentile (about 1.4 px on screen; 7 outliers of 333 where a thick weapon hangs lowest). The mass ratio ran 0.73 to 1.12 where the registered heads agreed within 10 percent, so 30 percent is the narrowest tolerance with no false alarm there, and it caught only 3 of the 9 poses whose head was off by more than 25 percent: it sees a whole-figure jump and is blind to a head inflated alone. A neck-and-bulge head estimator was tried and rejected (wrong by 22 percent at the median). The result's `note` says how many swaps had which reading. Reproduce the two measurements with `node critic/runner/lib/continuity-calibrate.mjs --records=docs/target/pose-measure.json --art=public/art/characters`.
5. **UNVERIFIED, never PASS,** when the harness saw under 60 s of battle or under 8 counted swaps, ran under 30 fps, or its probe failed. A chapter it cannot run stays in the output with its cause.
6. Where the head is registered, a build that applies the same table passes by construction: the check then proves the table is applied at every swap (no pose missed, no mirror, yaw or lunge undoing it), not that the table is right. The independent evidence is the transition strips (CHK-027) and the first-time-fan lens of every deep review.
7. **What is judged (r391).** A change of *pose*. A pose is keyed by the figure, its name AND the painting its plane draws (`slot.painted.url`): a dressphere change or a boss's next form re-points the same pose name (`idle`) at another painting, and the earlier key (name only) kept reading the first painting's head, feet and outline for every later one, so round 22's FFX-2 numbers (Paine's registered feet 20 px off at every swap, Yuna idle to ready 1.38) were partly the harness's. A swap between paintings of two different subjects (a dressphere's art folder, a boss's form: `costume`) is staged by its own sequence (the spherechange's twirl) and a swap between two pose names that draw one and the same painting (`sameArt`: a pose that falls back to the idle's, so the size cannot change and what moves is the pose state's own recoil or lean, CHK-027's jerks) are both counted and shown (`size.costumeSwaps`, `costumeWorstHeadPct`, `costumeWorstFeetPx`, `sameArtSwaps`) and kept out of the 3 percent, 30 percent, 2 px and 6 px judgements. Different heads across a girl's dresspheres (an estimated 15 to 30 percent) are a content decision for the owner, not something this check can fix.
**AUTOMATE:** done. `critic/runner/lib/continuity.mjs` (the chapter loop, the aggregate and `attachProbe`, used by `route.mjs --continuity`), `continuity-probe.mjs` (runs in the page), `continuity-silhouette.mjs`, `continuity-pure.mjs` (with `continuity-summary.mjs`, the summary and the verdicts), `continuity-analyze.mjs` and `continuity-strips.mjs`; the thresholds, caps and probe settings are the `continuity` block of `critic/policy.json`. Held by `tests/unit/critic-continuity-pure.test.ts` (known answers for the geometry, the swaps and the verdicts), `critic-continuity-silhouette.test.ts`, `critic-continuity-probe.test.ts` (the probe run against a fake page), `critic-continuity-contract.test.ts` (every engine field the probe reads, pinned to the source: no engine hook was added, so the harness also measures a build that is already live), `critic-continuity-runners.test.ts` (what `deep.js` and `focused.js` ask for) and `critic-continuity-policy.test.ts` (the block, the caps and the aggregate). Not automated: whether the registered heads are right, and how a swap looks (the strips and the fan lens), which a person reads.
**SCOPE:** both games and every chapter; party figures, aeons and enemies, in battle. Not covered: pose changes in cutscenes, a figure drawn by no plane (Vegnagun's parts), a pause portrait. A new figure or pose set needs its registration (`tools/posescale/`) to be judged at 3 percent; until then it is read by mass.

---

## CHK-027. Motion is continuous: no snaps, no double images, no jerks or teleports

**Rubric:** `feel` (`animation`) and `visual`. While the snaps per minute of battle exceed `continuity.motion.snapsPerMinuteMax` (**0.25**) the `animation` sub-score is capped at 7.5 (`critic/RUBRIC.md` section 6a, D-424).
**Owner saw (2026-10-04, relayed by the driver):** "I meant to judge the pose sizing jumps and pose changes snapping around in a discontinuous half motion or whatever. Can't you do this automatically with critic?"
**Why it was missed:** the four reasons of CHK-026, and these. "Snapping" and "half-motion" had no definition in the library. The nearest sightings were filed one at a time as polish (PR-0315, the twirl crossfade ghosting; PR-0314, the dressphere shot as a half-second cut, STALLED; the Evrae two-head ghost frame, found by eye), because a still of a swap shows one painting and nothing measured how two paintings share the screen for the seven frames of a crossfade. A figure that jumps in one frame is invisible to a still and to a timed sequence taken every 250 ms (`critic/reviews/visual-plan-2026-10-03.md` line 87 asked for clips, not for a count). **Measured on the live release 38** (`critic/reviews/continuity-baseline-r38/`): 12 snaps in 22.8 minutes of battle, **0.53 per minute** (Chapter I 0.88, IV 0.14, VIII 0.46): 11 were a KO or a defeat (the standing painting buckles for 13 frames, then one frame cuts to the lying one and the head moves about 365 px) and one was Evrae cast to idle. 1,201 of the 1,281 swaps (94 percent) show a double image, the worst at severity 0.47 and 20 swaps at 0.40 or more (Auron attack to follow in Chapter I: two Aurons 114 px apart for four to nine frames; Mortiorchis idle to attack; the rise from KO). 450 jerks, 230 of them 40 px or more, the worst 371 px (Yuna's KO cut), and 159 not at a swap: a hit recoil that throws a figure 30 to 70 px in one frame, a figure that steps 66 px forward at idle, Bahamut's run.
**THE CHECK:** from the same harness run as CHK-026, four measurements and the strips that show them.
1. **Snaps per minute of battle.** A snap is a swap with no in-between frame (no frame in which both paintings show at 2 percent or more) in which the picture jumps: the silhouettes overlap by less than 95 percent or their centres move 4 px or more, or the head or the feet are over CHK-026's tolerance. Swaps under a camera cut are left out. FAIL above **0.25** per minute of battle (paused and off-screen time is not battle time). *Why 0.25:* live release 38 measured 12 snaps in 22.8 minutes of battle, 0.53 per minute, and 11 of the 12 were a KO or a defeat. A fight lasts five to ten minutes, so 0.25 per minute (one snap in four minutes) leaves a fight its scripted beats, a defeat and an aeon's staging, without letting snapping become the way poses change. Release 38 is twice over it, which is what Bailey saw; a build that blends its KO transitions measures about 0 and passes.
2. **The outline jump of every swap:** the overlap (alpha-mask IoU) of the two silhouettes as drawn and the distance (px at 1600 wide) between their centres of mass. Reported for every swap; the worst go to the strips.
3. **Half-motion, the double image.** Any frame in which two paintings of one figure show at once at 15 percent or more each while their silhouettes differ by 10 percent or more. Counted per swap (frames and milliseconds); its **severity** is the lesser painting's opacity times (1 minus the overlap) at the worst frame: 0.5 at a 50/50 blend of two silhouettes that share nothing. FAIL where a swap reaches **0.40**: two figures side by side, not one figure changing. *Why 0.40:* on live release 38, 94 percent of swaps show some double image (severity median 0.23, 90th percentile 0.33, 95th 0.37): that is the crossfade itself, counted and shown in the strips, not a failure of this check. 0.40 is the top 1.6 percent (20 of 1,281): swaps whose two paintings share under a fifth of their outline at the middle of the blend, two figures side by side (Auron attack to follow, Mortiorchis idle to attack, the rise from KO).
4. **Jerks and teleports.** Each figure's feet point and (where registered) head are tracked on every frame, the camera's own movement of the figure subtracted. A step of **24 px or more** at 1600 wide that is also **3 times the move's own speed** (the median of the five steps either side, never under 2 px), that does not open a dash which keeps half its speed for three frames, and that the camera did not cause (its own shift under 120 px: a cut or a whip), is a jerk; steps within 2 frames are one pop. Reported in px per frame, with whether it fell at a swap and the battle-log event just before it. FAIL on a jerk of **40 px or more**: 40 px is 2.5 percent of the width in one frame (2,400 px a second at 60 fps). Of the 119,413 ordinary feet steps in Chapter I of live release 38, 99.9 percent were under 36 px (median 0.06 px, 99th percentile 7.6 px); the faster ones are dashes that start at speed and slow (steps of 85, 66, 48, 32 px), which are not called jerks. A step that large that is also three times the move's own speed, and is followed by stillness or by a different move, is a teleport. The camera line (120 px of camera-made shift in a frame) sits in an empty gap: in Chapter I's 25,040 frames the camera moved a figure under 60 px in all but one and by 120 to 440 px in 43 (its cuts).
5. **The strips.** The worst ten swaps, the worst five jerks and the worst five double images of every chapter (each figure and pose pair once before any repeat of one, so ten copies of one bad swap are not the answer) are written as JPEG transition strips: the figure cropped out of 12 consecutive rendered frames, 6 before and 6 after the event, at the page's real frame rate, side by side; a green guide line at the head and an orange one at the feet taken from the frame before the event, a cross where each frame's head and feet were measured, the event frame outlined in red. A head that grew, feet that slid, a double image or a body that jumped is a line it did not stay on. They are the evidence the first-time-fan lens reads (`critic/runner/deep.js`).
6. **UNVERIFIED, never PASS,** under the same conditions as CHK-026 (under 60 s of battle, under 8 counted swaps, under 30 fps, a probe failure).
**AUTOMATE:** done, with CHK-026 (same harness, same tests). The harness is a required evidence step of every deep review (`deep.js`, phase Continuity over every listed chapter, then the first-time-fan lens) and of a focused review whose plan lists either check (`focused.js`, step 3b); the plan lists them for the presenter, the stage, the figures, the camera, the scenes' registry, the paintings, the asset loader and a new chapter. Not automated: what a double image or a snap *feels* like (CHK-B2, Bailey's own play), and whether a scripted cut (the KO collapse) is wanted: the check reports it, the owner decides.
**SCOPE:** both games, every chapter, in battle. A scripted cut is still counted (the KO collapse cuts to the lying painting by design, EC-1001-09: its strips show it, and a build that blends it passes). Not covered: motion in cutscenes and on the pause screen, effects drawn by no plane (spell light, damage numbers), camera motion itself (a camera cut only excuses a swap or a jerk that falls with it).

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
