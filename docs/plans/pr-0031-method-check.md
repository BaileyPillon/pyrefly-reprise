# PR-0031 (with PR-0178) method check (rule 15): the FFX target step

Written 2026-09-26, paper plus one read-only probe. **Game case:** the ring and the dim are one
field renderer both games share (`src/engine/TargetHighlight.ts`, both, CHK-020); the missing TARGET
plate and the bracket z-order are FFX only (FFX-2 already draws its target plates,
`tests/unit/ui-ffx2-target-plates.test.ts`).

## The issue as the critic measures it

Round 13, Ch III Attack on Yu Pagoda A: brackets, the hand and a small name plate, but no top TARGET
plate, no ring under the Pagoda, and BFA and Pagoda B not dimmed. Ch X ALL ENEMIES: only a chip and
brackets. PR-0178: the all-ally brackets cross the command rows, and no plate. Acceptance:
composites of tiles s1 and s2 (`docs/concepts/targeting/b-ring-and-dim/`) in III and X at 1600
and 2560 show the plate, the rings and the dim.

## Why it stalled

Open at major since round 04 (ten reviews). The two repairs built what was asked and the critic
still saw nothing: `83ea60a5` (fix3 targeting, 2026-09-19) added the ring and the dim, and `b8e404ff` put the Pagoda's
ring on the floor and deepened the dim to a measured 16.5-16.8% brightness drop (same camera,
marks on against marks cleared). Every later round judged by eye, and **no round ever read the
state**: `window.__pyrefly.targeting()` returns `dim` and `ringed` per actor, and no round-11 to
13 run.json records it. So "absent" and "present but unreadable" have never been told apart.

## Probe run today (read-only, jsdom, scratch file deleted)

The real FFX `CommandMenu` driven by real `KeyboardEvent`s, with `onSelection` mapped exactly as
`FFXBattleHud.applySelection` maps it into a `TargetHighlight` over six fake actors (Ch III's
shape):

| step | selection | ringed | dimmed (0.26) |
|---|---|---|---|
| Attack, Enter | `yu-pagoda-left`, single, accent enemy | Pagoda A | Tidus, Yuna, Auron, BFA, Pagoda B |
| Hastega, Enter | Tidus, Yuna, Auron, all, accent **self** | the three | BFA, both Pagodas |

So the code path from a key press to the ring and the dim is intact. What is left is the live half:
either the port is not connected at that moment in the shipped build, or the marks are applied and
do not read. A side finding: an all-ally set gets the `self` accent (cool blue), because the kind is
taken from the acting member's entry; tile s1 shows the allies in the ally colour. Small, same batch.

## The plate is not a named property

`docs/target/targets.json`, tile "Targeting: a spell on the whole party", reaction: `mustRemain` is
the hand, the ground ring under every selected figure and the quiet dim. The name plate and
everything else in option B are under `inferred` ("picked as a package and never named one by
one"). Rule 15 and the end-state rule: a pick approves only what Bailey named. So the **top TARGET
plate is an agent's inference** and needs one yes before it is built, even though it is in both
frames.

## Alternatives, and the test that tells them apart

1. **Live but illegible** (likely, after b8e404ff's measurement): raise the ring's opacity and size
   and the dim toward what s2 shows, measured, not by eye.
2. **Not live** (a missed call on the shipped path, for example the port set after the first
   decision, or the ALL ENEMIES path on an aeon's turn): find and connect it.

Deciding test, five minutes on a production build with real keys: at the Ch III first Attack target
step and the Ch X Bahamut Impulse step, read `__pyrefly.targeting()` (per actor `dim`, `ringed`) and
take two frames with the same camera, marks on and marks cleared by the debug API, and report the
luminance drop on each non-target and the ring's pixel contrast against the floor. `ringed` false
or `dim` 0 means alternative 2; true with a drop under what the critic can see means alternative 1.

## Recommendation

**Small probe first, then continue.** Batch 2 runs the live read above before touching code. Then
it builds the named properties: ring and dim at a legible level (alternative 1 or 2 as the probe
says), the ally accent, and the brackets behind the command stack (PR-0178, z-order only). The
**TARGET plate goes on the driver's decision sheet as one line** ("the TARGET plate in both
approved frames: build it for FFX? recommend yes"), and is built behind an OFF switch meanwhile so
the answer costs one flag.
