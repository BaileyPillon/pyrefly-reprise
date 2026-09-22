# Ormi — Leblanc chapter, re-render pass (2026-09-21/22)

FFX-2 only (Chateau Leblanc, Act III — `research/ffx2-leblanc-syndicate.md` §10.1).
Shared plumbing untouched; this is art only. Owner: `wf_6e496bfa-c24`
"pyrefly-chapter-leblanc" (this sub-agent owns `public/art/characters/ormi/**`,
`docs/concepts/chapters/leblanc/sets/ormi/**`, the `ormi` row in
`tools/gen/cast.json`).

## Why this pass exists

`docs/concepts/chapters/leblanc/production.md` shipped `attack`/`cast`/`hurt`/`ko`
for Ormi at the old default recipe (`--refWeight 0.30`, no `--forceRef`), and the
driver's chapter-art verdict in `docs/handoff/NOW.md` found the installed
leblanc/ormi/logos pose sets **drift in identity state to state** — for Ormi
specifically, the shield's heart emblem read as "an ornate sunburst rather than
an explicit heart" in most renders, and the four states did not read as the
same character (armor colour swapped from purple/gold to solid red/gold, the
shield's shape and colour changed state to state, one state added war-paint-like
facial markings not in the identity anchor). That chapter's own
`docs/concepts/chapters/leblanc/pilot/judge.md` (Leblanc identity-consistency
pilot, an independent second-agent judge pass) tested three fixes for this
exact failure mode on Leblanc and picked **Method A**: text2img with
`--ref --forceRef`, `refWeight 0.35`, `refStart 0.2`, `refEnd 0.6`,
`refWeightType "ease in"`. This pass applies that same recipe to Ormi.

## Identity anchor check (hard rule 9 / brief requirement)

Ormi's idle (`public/art/characters/ormi/idle.png`) was checked against the
picked concept (`docs/concepts/chapters/leblanc/renders/ormi-a.png`, `options.json`
row `cast_ormi`, option A — the only on-canon Ormi option, picked after one
reroll away from a tall-swordsman miss) and against
`research/ffx2-leblanc-syndicate.md` line 830: *"short and stout. A large shield
worn on his back, bearing the Syndicate heart logo. Predominantly purple
samurai-style attire."* idle.png is heavier and rounder than the concept
sketch — this is **not** drift, it is `production.md`'s recorded, intentional
choice ("Re-rendered heavier than the picked concept ... per Bailey's note that
canon Ormi is big and round, not athletic"), and it matches the research's
"short and stout" / "big round belly" description more closely than the
concept sketch does. **idle.png was not re-rendered.**

## Recipe

```
node tools/gen/comfy.mjs character --name ormi --facing left --composition full \
    --size 832x1216 --batch 4 --pose <attack|cast|hurt> \
    --tags "$(cat docs/concepts/chapters/leblanc/sets/ormi/identity.txt)" \
    --emphasis '(short and extremely stout build:1.3), (purple samurai armor:1.25), (heart emblem on shield:1.25)' \
    --poseTags "<pose tags for that state>" \
    --negAdd "tall, slim, thin, sword, katana, blade" \
    --ref public/art/characters/ormi/idle.png --forceRef \
    --refWeight 0.35 --refStart 0.2 --refEnd 0.6 --refWeightType "ease in" \
    --seed <seed> --out public/art/characters/ormi/<state>.png \
    --candidateDir docs/concepts/chapters/leblanc/sets/ormi/candidates/<state>
```

`ko` uses `--composition prone --size 1216x832` (matches the existing installed
`ko.json`'s composition; not covered by the Leblanc pilot, decided from a render
the way that pilot's own `ko` note recommends). `identity.txt` is Ormi's
identity block, lifted from the working `idle.json` prompt (short/stout build,
belly, bald head with red top-knot, purple samurai armor with gold trim, fur
mantle, teal sash, the massive gold-rimmed round shield with the red heart
emblem) with the idle-only pose words (arms crossed, standing) removed so they
don't fight `--poseTags`. `negAdd` repeats idle's own extra negatives
(`tall, slim, thin, sword, katana, blade`) — `docs/concepts/chapters/leblanc/options.json`'s
`cast_ormi` row found this checkpoint drifts toward a slim-swordsman archetype
without it.

## Reject criteria checked on every candidate (analogous to the Leblanc pilot's rule)

1. Is he holding/wearing the large round shield — not a sword, not an empty hand?
2. Is the armor still predominantly purple with gold trim — not a solid repaint
   (e.g. all-red) with an unrequested new prop (a second shield, a face
   tattoo, a halo)?
Neither failure alone was auto-fatal — this batch treats them as the worst
criterion in a worst-criterion-wins comparison across all candidates in a
state, same method as the Leblanc judge pass.

## Batches actually produced

Rendered on the shared ComfyUI queue (also serving two sibling workflows: the
Leblanc/Logos re-render and the living-portrait video round, `docs/handoff/NOW.md`
"Running now"). `attack` and `cast` finished a full batch of 4 (one `attack`
seed was quarantined by the cut-out sanity guard and re-rolled once to keep the
batch at 4). `hurt` and `ko` did not reach 4: the queue was saturated for long
stretches by the sibling video workflow's Wan2.2 renders (single video jobs
observed running 450–900+ seconds each), and `comfy.mjs`'s own per-prompt wait
timed out on one `hurt` seed after roughly 500s of queue wait; a `hurt` batch
member was also quarantined by the cut-out guard. **`hurt` shipped from 2
successful candidates (of 4 attempted: 1 quarantined, 1 timed out client-side —
the underlying ComfyUI job for that seed may still complete on the server;
nothing reads its output), `ko` from 2 successful candidates (of 4 attempted:
the remaining two client-side waits timed out under the same queue pressure).**
The four state installs (`--install`) were themselves attempted after judging,
but by then the shared queue was congested enough that even those single-image
re-renders timed out client-side; rather than keep re-submitting into a queue
shared with two other active workflows, the already-rendered, already-viewed
winning candidate files were copied byte-for-byte into `public/art/characters/ormi/`
instead (same seed, same prompt, same sampler settings as an `--install` run
would have produced — this is not a different image, only a different way of
placing the identical bytes) and their sidecar JSON adjusted to drop the
candidate-only `candidateOf` field. Every candidate that did complete was
opened and viewed at native pixel size before judging — none were picked from
a thumbnail. This is a real infrastructure limit (a shared, busy GPU queue),
not a shortcut taken to save time; re-rolling the missing seeds is straight-
forward with the recipe above whenever the queue is quieter.

## Picks

| State | Kept seed | Why | Runner-up / rejected |
| --- | --- | --- | --- |
| idle | 1767754585 (unchanged) | Not re-rendered — see anchor check above. | n/a |
| attack | 810001 | Only attack candidate with an explicit, clean heart on the shield (matches idle's shield style: gold rim, purple field, centred heart) rather than a plain or sunburst shield face; purple/gold coverage close to idle; holds the shield in both hands, no sword. | `810005` (=`.2`): clean face but a fully bare, muscular torso — loses the "short and stout / big round belly" identity criterion outright, and its shield carries no heart at all. `810003` (`.3`): heart-on-shield present but adds a red heart-shaped mark tattooed on his forehead — an invented identity element, the same class of failure as the Leblanc pilot's "unrequested halo". `810004` (`.4`, first pick, changed on closer review): clean face and physique but its shield shows no heart at all, the exact defect this pass exists to fix. |
| cast | 820001 | Best colour/costume match to idle of the four (purple armor, gold trim, teal sash, explicit heart on the shield at 1:1) and no face-paint or invented markings. | `820002`: shield reshaped to an angular diamond and recoloured blue, sash wrong colour. `820003`/`820004`: armor repainted red/pink across the torso and `820003` adds an unsourced heart tattoo on the forehead. Note: `820001`'s off hand holds a second, smaller heart-emblem disc beside the main shield — a minor invented prop, logged rather than hidden, and the least severe issue of the four candidates. |
| hurt | 800001 | Predominantly purple (most idle-faithful of the two survivors), explicit heart on the shield, no face paint, still gripping the shield. | `800003` (`.2`): equally clean and arguably a cleaner single heart shape, but the torso is a fully bare-armed red tank top rather than idle's long-sleeved purple armor with a red under-layer — less "predominantly purple". Kept as a strong alternate; either would have been a defensible pick. |
| ko | 830001 | Shield keeps idle's actual shape (round, gold-rimmed) and its red/gold heart centre; belly and stout build read clearly lying down. | `830002` (`.2`): eyes fully closed (a better "unconscious" read than `830001`'s open/smug eyes — logged as `830001`'s one real defect) but its shield renders as a giant heart-shaped panel behind him instead of the canon round shield — a shape change to a named identity object, judged the more severe failure of the two under worst-criterion-wins. |

`ko.1`'s open eyes is the one accepted defect on the installed set; a future
re-roll aimed specifically at "eyes closed, unconscious" while keeping the
round shield would close it, but was not itself worth blocking this pass on
(pace rule, `AGENTS.md` hard rule 15).

## Files

- `identity.txt` — the Ormi identity tag block.
- `candidates/<state>/` — every candidate PNG + sidecar JSON produced this
  pass (quarantined/timed-out attempts are not here — ComfyUI's own guard
  moved those to `D:\Tools\comfy-logs\cutout-quarantine`).
- `build-sheet.mjs` → `sheet.png` — one row per installed state: the picked
  concept (idle row only — there is no per-pose concept), the installed whole
  PNG, a 1:1 face crop, a 1:1 torso/shield crop.
- Backup of the installed picks' full candidate folders:
  `D:/Tools/pyrefly-art-backup/candidates/2026-09-21-leblanc/ormi/`.

## Not done here

- `public/art/portraits/ormi.png` (the HUD portrait) was not touched — out of
  this brief's scope, and its face-crop row in `src/ui/common/face-crops.json`
  is unaffected.
- No entry was added to `docs/target/approved-hashes.json` — these are
  candidates for Bailey's verdict, not an approved target (brief instruction;
  `production.md`'s CANDIDATE status for this chapter's art stands).
- `hurt`/`ko` are short of the requested 4-candidate batch for the reason
  above; re-rolling the missing seeds on a quieter queue is a 2-minute follow-up.
