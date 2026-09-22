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
