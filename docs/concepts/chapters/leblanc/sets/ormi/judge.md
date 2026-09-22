# Ormi — Leblanc chapter, installed set — independent judge pass (2026-09-21/22)

FFX-2 only (Chateau Leblanc, Act III — `research/ffx2-leblanc-syndicate.md` §10.1).
Art only, no shared plumbing touched. This is a **second, independent** pass over
the re-render recorded in `docs/concepts/chapters/leblanc/sets/ormi/README.md`,
run by a different agent than the one that rendered/installed the candidates and
wrote that README. No new renders were made here. Every installed PNG under
`public/art/characters/ormi/` was opened and cropped to native pixel size (face
band and torso/shield band, both scaled up further where needed) — not judged
from the shrunk `sheet.png` thumbnails alone, though `sheet.png` was also viewed
and corroborates every finding below.

## Method

Anchor: `public/art/characters/ormi/idle.png` (unchanged this pass — see the
README's identity-anchor check; this judge did not re-verify that decision,
only used idle.png as the fixed comparison point it already is). Criteria per
the brief: **hair, face, outfit colours and pattern, marks, weapon, style**,
plus **pose reads as its state**. Each scored 0–10 against idle. **A state's
score is its worst criterion**, not an average. Pass bar: 7.

## Structural finding that touches every state (read before the table)

`idle.png`'s own shield does **not** read as an explicit heart. Zoomed 1:1, the
shield is a red field with a gold rim and a radial burst of blue/gold/orange
spokes fanning from a centre point — a sunburst/wheel motif, not a heart. This
is not new: `production.md` already recorded this for the pre-re-render set
("shield emblem reads as an ornate sunburst rather than an explicit heart in
most renders"), and idle.png is exactly the file that finding was made against.
Because idle.png was intentionally **not** re-rendered this pass, it still
carries that defect, while all four re-rendered states (correctly, per the
re-render's own goal and per canon: research line 830, "bearing the Syndicate
heart logo") now show a legible heart on the shield. So on a strict
against-idle "marks" test, every one of the four states is judged as *drifting
from idle*, even though each is moving *toward* the research canon idle itself
falls short of. Scores below apply the brief's "against idle" rule literally
and note this tension per state; it is a shared, structural cause, not a new
per-state defect, and it argues for re-rendering idle from the same Method-A
recipe rather than re-rolling attack/cast/hurt/ko again to chase an idle that
is itself off-model.

## Scores

| State | Hair | Face | Outfit colours/pattern | Marks | Weapon | Style | Pose reads as state | **Score (worst)** | Worst criterion |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| attack | 7 — red top-knot present, close enough | **1** — an unrequested red lightning-bolt-shaped face marking runs from the forehead down across the cheek; nothing in idle, in `identity.txt`, or in `attack.json`'s prompt calls for face paint. This is the same class of failure the README itself used to disqualify a *different* candidate (`810003`'s forehead heart-tattoo) — it was not caught on the picked winner. | 4 — chest panel recolours from idle's purple to solid red; pauldrons more ornate/pointed | 4 — a heart is present on the (right) shield, but on a lavender field, not idle's red | **1** — idle's identity text calls for "a massive **round** shield"; the installed render shows **two** angular, pointed/kite-shaped shields (one gold/lavender with the heart, a second rendered as a translucent blue mirror of the same kite silhouette on the opposite side) — not the single round shield, and a second shield-like object the shared negative prompt ("extra weapon", "multiple boys") was meant to suppress | 7 — cel-shaded style matches | 7 — lunging, gritted-teeth stance reads as an attack | **1** | face (invented paint) tied with weapon (round→two kite shields) |
| cast | 6 — top-knot present, missing idle's hanging bead/tassel decoration | 5 — clean, no invented marks; eye colour reads amber here vs idle's teal-green | 5 — teal sash matches idle; the "fur-trimmed mantle" (present in every prompt including idle's) renders here as an obvious shaggy mint boa, where idle rendered the same text as a scalloped beaded collar with no visible fur — a real style gap between idle and the re-renders, not just this state | 4 — explicit heart present on both shields, but on a warm tan/brown hexagon-panel field, not idle's red sunburst field | **3** — README itself discloses this: alongside the large back shield there is "a second, smaller heart-emblem disc" held in the off hand — idle's identity is one massive shield, so this is an invented duplicate prop, same class of issue as attack's second shield, just smaller and already flagged | 7 | 5 — a static "holding two shields" stance reads as ready/defensive more than "crouching low, gathering strength, about to charge" from the prompt; not a hard miss but not a strong "about to act" read either | **3** | weapon (duplicated shield prop) |
| hurt | 5 — the top-knot renders as a large spiky red plume, a noticeably different silhouette from idle's neat tied ponytail | 5 — clean, no invented paint; eye colour reads purple here, a third different eye colour across idle/cast/hurt | 4 — fur mantle present (arguably closer to the shared prompt text than idle is), but the gold shoulder piece extends into a pointed, small-crown/helmet-like shape idle does not have | 4 — the shield centre shows an ornate nested double-heart, clearly heart-shaped (more explicit than idle) but a bigger departure from idle's sunburst than the other three states | **4** — the shield's outer silhouette is a pointed/heater shape (a point at the top), not idle's plain round disc; still only one shield (better than attack/cast on count) | 7 | **4** — the stance is upright with a stern, composed expression; the prompt calls for "staggering back, off balance, pained grimace" and neither the posture nor the face sells "hurt" strongly — closer to a held ready-stance than a stagger | **4** | weapon (shield shape) tied with pose (does not read as staggering/pained) |
| ko | 6 — colour and general shape consistent with idle, angle changed because he's lying down | **7** — clean face, and on close inspection the visible eye is genuinely **closed** (a thin lid line, no iris drawn) — this *corrects* README's own note that "830001['s]...open/smug eyes" is "the one accepted defect on the installed set": at native pixel size the eye reads shut, matching the prompt's "eyes closed" and giving this state no face defect at all | 5 — armor colours consistent, but the visible pauldron is a much larger, more ornate solid-gold plate than idle's smaller gold-trimmed edge | 5 — the shield's centre graphic is an ambiguous gold flourish/swoosh (reads more like a stylised bird or letterform than a heart) with only a small secondary heart beneath it — less explicit than the neck-clasp and waist-clasp hearts elsewhere on the same figure, which are unambiguous hearts | 7 — round, gold-rimmed, matches idle's shape and is the only one-shield, correctly-shaped state of the four | 7 | 8 — lying on his back, shield fallen beside him, reads clearly as defeated | **5** | outfit (oversized pauldron) tied with marks (ambiguous shield flourish) |

## Verdict

**Fail. None of the four re-rendered states clears the pass bar of 7.**
`attack` (1) and `cast` (3) fail hard on an invented prop the shared negative
prompt exists to prevent (face paint on attack; a duplicated shield on cast).
`hurt` (4) and `ko` (5) are closer but still short — `hurt` on a shield-shape
drift compounded by a pose that reads as composed rather than staggering,
`ko` on an oversized pauldron and an under-legible shield mark (though `ko` is
otherwise the strongest state: the only one with a correctly-shaped single
shield, and its one previously-logged defect, open eyes, does not hold up under
this closer look — see the structural note above and the ko row).

This **confirms**, for Ormi specifically, the driver's chapter-art verdict
already recorded in `docs/handoff/NOW.md` ("the installed leblanc / ormi /
logos pose sets drift in identity") and `production.md`'s CANDIDATE (not
approved) status. It sharpens that verdict with concrete, worst-criterion
evidence per state, and adds two findings not previously on record: (1) the
picked `attack` candidate carries unrequested face paint that was not
mentioned when the README picked it over `810003` for the *same class* of
defect (an invented tattoo); (2) the shield-shape/count problem (round→kite,
one→two) is now the dominant failure mode across three of four states, not
just a colour-pattern mismatch as the README's "reject criteria" section
framed it going in.

### What a re-roll should target, in order

1. **Re-render `idle.png` itself** with the same Method-A recipe used for the
   other four states (or at minimum re-check whether its shield should also
   show an explicit heart) — scoring every other state "against idle" is only
   as good as idle being on-model, and right now idle is the one file in the
   set still carrying the pre-fix sunburst-shield defect.
2. `attack`: drop the face paint (not requested anywhere in the prompt chain)
   and re-roll for a single round shield — reuse the existing `negAdd` but add
   an explicit call-out against a second shield/afterimage duplicate, since
   the shared negative's "extra weapon" wording did not stop it here.
3. `cast`: drop the second shield/disc in the off hand; keep everything else,
   which is otherwise the strongest costume-colour match of the four.
4. `hurt`: re-roll toward idle's plain round shield silhouette (no point at
   the top) and toward a face/posture that actually staggers or winces,
   not a composed stern look.
5. `ko`: the smallest gap of the four — a plainer pauldron and a clearer heart
   on the shield's centre graphic (the neck/waist heart clasps on the same
   render show the model can draw an unambiguous heart; the shield centre
   just didn't get one this seed) would likely clear the bar on its own.

## Sheet

`docs/concepts/chapters/leblanc/sets/ormi/sheet.png` (already built by the
rendering pass) — one row per state: concept (idle row only), the installed
whole-body PNG, a 1:1 face crop, a 1:1 torso/shield crop. Viewed at full size
for this judge pass; every finding above is visible on it, including the
attack face paint, the attack/cast double shields, hurt's pointed shield, and
ko's closed eye.

## Round 2 — redo, last attempt (2026-09-22)

FFX-2 only, art only, same ownership as the renderer
(`wf_6e496bfa-c24` "pyrefly-chapter-leblanc"). Re-rendered `attack`/`cast`/
`hurt`/`ko` only (`idle` untouched, per the "re-render idle first" recommendation
above — **not done this pass**, out of scope for this brief, flagged again
below). 6 candidates requested per state; `attack` and `cast` got a clean 6,
`hurt` got 5 (1 quarantined by the cut-out guard, seed 900201), `ko` got 6.
Every candidate was opened and viewed at native pixel size (cropped further
with a scratch `sharp` script, `.crop-ormi-tmp.mjs`, for the shield/face
regions specifically) before picking — not judged from `sheet.png` thumbnails
alone, though the sheet was rebuilt afterward and corroborates the picks.

**Recipe change from round 1:** `--refWeight` raised one step, 0.35 → 0.40
(round 1 was itself one step up from the chapter's old default of 0.30); a
targeted `--emphasis` naming the state's specific worst criterion (e.g.
`(single round shield:1.35)` for attack/cast, `(plain round shield:1.35)` for
hurt, `(clear heart emblem on shield:1.35)` for ko) in place of round 1's
generic identity emphasis; and a `--negAdd` list built specifically against
each state's logged worst-criterion failure (duplicate/kite/pointed shields,
face paint/tattoos, oversized pauldron, ambiguous emblem words) rather than
round 1's generic `tall, slim, thin, sword, katana, blade`. Same `--tags`
(`identity.txt`, unchanged), same pose tags as round 1's installed prompts,
same `--ref public/art/characters/ormi/idle.png --forceRef`, same
`--refStart 0.2 --refEnd 0.6 --refWeightType "ease in"`. Full commands and
every candidate + sidecar are under `candidates/<state>/redo/`.

**Result: the two hard-fail defects from round 1 (attack's face paint, the
attack/cast duplicate-shield) are fixed on the installed picks.** No installed
state carries face paint or a second shield. But the recipe change surfaced a
new, state-independent failure mode not on record before this pass: **this
checkpoint adds an invented facial marking (a red streak, lightning-bolt, or
tattoo-like mark) on a majority of `hurt` candidates specifically** — 4 of 5
successful `hurt` renders (900202, 900204, 900205, 900206) carry one, despite
`identity.txt` and every `--negAdd` here naming nothing of the kind; only
900203 (the installed pick) is clean of it. `cast` and `ko` each had one
lighter instance (900101's forehead scratch-marks, not installed; ko's
900301/900303 had bolder versions, not installed) but most candidates in
those two states were clean. `attack` had none across all 6. This reads as a
per-pose prompt/seed-range interaction, not something `--refWeight` or
`--negAdd` wording fixes by itself — worth a `--strictPrompt`-style banned-
token check for face markings if `hurt` needs another pass.

### Scores (worst-criterion-wins, against idle, pass bar 7)

| State | Installed seed | Worst criterion this pass | Score | vs round 1 |
| --- | --- | --- | --- | --- |
| attack | 900006 | marks — shield shows a purple/gold spoked wheel + red centre gem (echoes idle's own radial-spoke motif closely, but in idle's wrong colours: purple/gold spokes vs idle's blue/orange-on-red) | **6** | +5 (was 1; face paint gone, single round shield confirmed, best purple/gold/teal costume match of the six) |
| cast | 900103 | marks — shield is shown edge-on (rim only, red/gold, single, correctly round); the face graphic is not visible from this angle so the heart/no-heart question can't be read off this render at all | **~4–5** | +1–2 (was 3; the off-hand duplicate disc is gone and the off hand is empty, the specific defect targeted; picked over 900105/900101 which showed clean single shields with a visible star or scratch-marked forehead — an invisible mark was judged less severe than an invented one) |
| hurt | 900203 | weapon (shield outline is still pointed/heater-shaped, a point at the top — the exact round-vs-pointed defect targeted) tied with pose (stern, composed, arm resting on the shield — still does not read as staggering/pained) | **~4**, no clear improvement | +0 (was 4; this is the least-bad of 5 candidates, not a fix — see below) |
| ko | 900305 | marks — shield shown edge-on/interior face (radial ribbing visible, consistent with idle's own radial motif, but no heart or any front graphic visible from this angle) | **5** | +0 net, but the *reason* changed for the better: round 1's worst criterion was outfit (oversized pauldron) tied with marks (ambiguous flourish); this pass's pauldron is plainly modest/small (the targeted fix worked) and the pose is a strong "defeated" read (eyes closed, a tear, shield fallen) — only the shield-face visibility keeps this off 7 |

**`hurt` did not improve and should not be read as a win.** All 5 surviving
candidates were either disqualified by an invented facial marking (4 of 5) or,
for the one survivor (900203), still carry the same pointed-shield-shape and
non-staggering-pose defects round 1's installed pick (800001) already had.
900203 was installed anyway per this pass's brief ("install the best even if
still under 7"), but a third attempt at `hurt` specifically should not just
re-roll seeds at the same `--refWeight`/`--negAdd` combination — it visibly
is not moving this state off worst-criterion ≈4, and the face-paint tendency
noted above needs its own fix first (try `--strictPrompt` with an explicit
face-marking ban token, or drop `--forceRef` for this one state and compare).

**`idle` itself is still not re-rendered** — this pass's own recipe (and every
other state's) is now visibly closer to idle in spoke/wheel-style "marks" than
to an explicit heart, which is consistent with idle's real content (a
sunburst, not a heart) but keeps the chapter's shield iconography inconsistent
with `research/ffx2-leblanc-syndicate.md` line 830's "heart logo" across the
whole set. Recommendation #1 from round 1 stands unaddressed.

### Verdict

Still **CANDIDATE, not approved** (no entry in
`docs/target/approved-hashes.json`). `attack` is close to the bar (6) and a
single further seed pass targeting shield colour (purple/gold → idle's actual
red/gold/blue-orange) could plausibly clear 7. `cast` and `ko` are held back
by the same structural issue — the picked shield is turned edge-on to the
camera, so the "marks" criterion can't be scored positively even though
nothing about the pick is wrong — a next pass should add
`--poseTags`/`--emphasis` wording aimed at keeping the shield face toward the
viewer (e.g. "shield face visible, shield turned toward camera"). `hurt` is
the one state this pass leaves no better than before it started, and is
flagged above for a different method rather than a fourth same-recipe re-roll
(pace rule, `AGENTS.md` hard rule 15: two failed attempts at the same failure
call for a written method check before a third try — this was hurt's second
re-render attempt at the pointed-shield defect specifically).
