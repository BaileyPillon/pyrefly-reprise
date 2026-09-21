# Art round 4 — candidates only

Rendered 2026-09-21 under the standing gate in `AGENTS.md` hard rule 12: local art
generation was OFF since Bailey's 2026-09-19 pause; the owner turned it back on this
session ("Resume local art generation", recorded in `docs/handoff/NOW.md`).

**Nothing here ships.** Every file under `docs/concepts/art4/<subject>/<pose>/` is a
candidate (`cand-1.png`..`cand-3.png` + sidecars); `public/art/` was never touched.
Files listed in `docs/target/approved-hashes.json` are hash-protected and were never
re-rendered. Model checksums (`docs/ART-PIPELINE.md` §9) verified OK against the
published hashes before any render; ComfyUI answered `/system_stats` and the
`IPAdapterAdvanced` node loaded; one test render passed the black-frame check. No
release-review browser was running when groups A and B started; one appeared
(`chrome-headless-shell.exe` with `pyrefly-release`/`playwright` on its command
line) partway through group C's queue, which was let finish (a handful of renders
left, ~1 minute) rather than aborted mid-batch; no further batches or rerolls were
queued after that, so this session did not compete with the review beyond that tail.

Recipes are built from `tools/gen/cast.json` (the work order) plus the specific
defect fixes already written down in `docs/handoff/art3-party-b.md` and
`docs/handoff/art3-x2-cast.md`/`art3-x2-bosses.md` for the same subjects, and checked
against `research/visual-bible.md` for canon (costume, hair/eye colour, weapon,
silhouette). Judged once per finished contact sheet, not per image, per the brief;
re-rolled only clear technical failures, at most once per pose.

---

## Group A — Braska's speaker portrait, canon headdress

**Sheet:** `docs/concepts/art4/sheet-A.png`

The shipped `public/art/portraits/braska.png` — despite its own sidecar prompt
already asking for "dark blue headdress, keffiyeh" — renders an ornate **gold
crown** with purple feather plumes. `research/visual-bible.md` §1.22.1 (FF Wiki
*Lord Braska*, verified) is explicit: **"an elaborate dark-blue headdress
resembling an Arabian keffiyeh, held by a band with a blue stone at the front... a
pale-blue tassel hanging on each side."** No crown, no gold, no feathers.

- **Round 1** (plain restatement of the canon tags) still pulled toward a
  gold/ornate structure on 2 of 3 variants, and a purple hair puff broke the
  headdress silhouette on the third — the checkpoint's prior for "elaborate
  summoner headwear" is stronger than a short tag list. Discarded (one reroll
  used, per the brief).
- **Round 2** (kept; these are `cand-1..3`), with emphasis weights
  `(solid dark navy blue fabric headdress:1.3)` and explicit negatives against
  crown/gold/wing/feather shapes:
  - `cand-1` is the closest canon match — dark navy cloth fully over the head,
    two pale-blue tassels at the collarbone, red robe, white bracelet. Some hair
    still frames the face (the bible doesn't spell out hair colour, since a
    keffiyeh should hide it).
  - `cand-2` has an odd asymmetric render — the left/right halves of the head
    wrap came out two different shades (dark navy vs white/cream), which reads
    as a rendering inconsistency rather than an intentional design; also more
    ornate (paired teardrop tassels, gem discs) than the bible's plain band.
  - `cand-3` reads as a pointed wizard-hood silhouette rather than a keffiyeh
    wrap, and moved the tassels onto the sleeves instead of the head.
- None of the three is a clean lock — canon fidelity is a judgement call, not a
  broken-render reject, so all three go to Bailey rather than a fourth reroll.

---

## Group B — poses the last art session's judges flagged

**Sheets:** `sheet-B-party.png`, `sheet-B-bosses.png`, `sheet-B-x2.png`

**Skipped as hash-protected** (`docs/target/approved-hashes.json`), per the brief:
`yuna/hurt`, `tidus/ko`. Not re-rendered.

Recipes: subject identity tags from `cast.json`, layered with the specific
documented fixes for that subject from the Sep-18 fix passes in
`docs/handoff/art3-party-b.md` and the canon corrections in
`docs/handoff/art3-x2-cast.md` / `art3-x2-bosses.md` (paine's sword and helmet,
Yuna-white-mage's trim colours and red braid, the Vegnagun parts' metal-not-organic
notes, the FFX-2 Bahamut canon stance). Where a pose had no specific documented
defect on file, the base recipe follows the pipeline's general lessons for that
subject (describe the *end state* of a flinch rather than motion words for
hurt/ko; pin `exactly two arms` on Kimahri; ban the orange colour-cast and flat
magic-circle failures on Rikku).

### FFX party

| Subject/pose | What was wrong (shipped) | How the candidates differ |
| --- | --- | --- |
| `lulu/attack` | (2026-09-18 fix pass 2 keeper, since re-flagged) | Kept the tiny-moogle-doll emphasis and jet-black-hair/fur-collar pins from the documented fix; open-hand swing pose |
| `lulu/hurt` | glamour-shot risk from motion-word phrasing | Body-mechanics phrasing (torso bent back, head tilted back, eyes shut) instead of "flinching/recoiling" |
| `lulu/ko` | doll size, crop at the canvas edge (noted "not fully fixed") | Doll-size pin kept; added an explicit "nothing cropped at the edge" instruction |
| `rikku/cast` | flat noodle-shaped spell, orange colour bleed | `(small round magic circle:1.35)`, banned flat-shape/orange-tint failure modes from the fix-pass record |
| `rikku/hurt` | (no prior documented defect for this exact pose) | Applied the same body-mechanics-over-motion-words lesson as Lulu's hurt fix |
| `rikku/ko` | `qc.py` flagged `FRAME-FULL` (72.6% opaque, transparent corners) | Explicit "whole body inside the frame" instruction |
| `kimahri/attack` | (no prior documented defect for this exact pose) | `exactly two arms` pin and single-horn asymmetry emphasis carried over from the horn-hunt lesson (34 renders in round 1) |
| `kimahri/victory` | three arms, two intact horns, invented trim | Reused the documented fix verbatim: both paws on the spear, `(exactly two arms:1.35)`, ban folded/crossed arms |

### FFX bosses

| Subject/pose | What was wrong (shipped) | How the candidates differ |
| --- | --- | --- |
| `yunalesca-2/cast` | manifest-drift risk (gown instead of the bikini-armour silhouette) | Identity tags rewritten to the bible per `art3-bosses-a.md` §2.1: silver hair, yellow eyes, ornate blue "M" headdress, blue/black top, green sashes; `--negAdd` bans the gown |
| `yunalesca-3/attack`, `/cast` | same manifest-drift risk, gorgon form | Same bible-accurate identity block as above, applied to form 3 |
| `yu-pagoda/attack`, `/cast`, `/hurt` | (no prior documented defect on file) | First round drifted off-identity into an ornate armoured/gem cluster, and `attack` fused into 2-3 separate towers in one frame ("extra subjects", ART-PIPELINE.md §6 mode 2). Re-rolled once (per the brief) with `(single pillar, one structure only:1.3)`, explicit multi-tower negatives, and `--refWeight 0.8`: `attack/cand-1` is now a clean single-pillar match; the others still drift toward a clustered rock-and-gold formation rather than the tiered pagoda silhouette — flagging for Bailey rather than spending a second reroll |
| `jecht/ko` | (no prior documented defect on file) | Base recipe; prone composition, facing left (he is the enemy at Dream's End) |

### FFX-2

| Subject/pose | What was wrong (shipped) | How the candidates differ |
| --- | --- | --- |
| `yuna-white-mage/*` (6 states) | `cast.json`'s `red trim` is not her livery; missing the ankle-length red braid (per `art3-x2-cast.md` §"the single strongest X-2-vs-FFX tell") | Purple trim, pink lining with yellow circles, pink hood trim with yellow crescent moons, yellow flame cuffs, white gloves/boots; `(very long red braid hanging to her ankles:1.3)`. **Partial**: the trim/lining recolour landed, but the braid did not reliably read as ankle-length across variants (see e.g. `attack/cand-1`, which also has a small detached floating shape near the lower-left corner) — worth another emphasis pass, not a clean win yet |
| `paine-warrior/idle` | judge wanted the sword shape changed; bible says the judge is wrong on shape (**long straight sword**, not a broadsword) but right that the render's blade was liberty-red instead of silver-with-a-skull-ricasso | `longsword` (not `greatsword`, which over-scaled the blade), silver blade, skull motif at the ricasso, skull belt buckle kept (it IS canon). **Landed cleanly** — `cand-1` is a strong canon match, worth a close look first |
| `paine-dark-knight/idle` | judge wanted horns/wings; bible says canon is a **crescent helm**, and `cast.json`'s `horned helmet` is the unsourced side | `(crescent-shaped helmet:1.3)`, banned "horned helmet" |
| `ffx2-bahamut/idle` | painted under the corrupt checkpoint/IP-Adapter weights (09-18, before the 21:34 swap) | Re-shot post-fix, referenced against the FFX `bahamut/idle.png` at 0.45 per the handoff's own recommendation, upright bipedal stance, blue-white feathered wing insides |
| `ffx2-bahamut/hurt` | painted under the same corrupt weights | Re-shot against the current shipped idle |
| `ffx2-bahamut/ko` | one candidate had detached floating fragments | Added "whole body inside the frame, no detached floating fragments" |
| `vegnagun-tail/idle` | (no prior documented defect on file; sheet review had called the shipped idle "ok") | Base recipe, reinforced "no legs, no head" since sibling poses drifted toward a whole-insect read |
| `vegnagun-tail/hurt` | "large flat blown-white region" | Banned overexposure/blown highlights explicitly |
| `vegnagun-tail/ko` | "legs / full-bleed tangle" | Banned extra legs and a full-bleed crop |
| `vegnagun-leg/idle` | a toothed head was in frame — "not one jointed limb" | `(one jointed limb only, no head, no face:1.3)`, banned head/face/teeth/mandibles |
| `vegnagun-head/idle` | organic skin and eye where the bible wants metal | `(all metal, no organic material:1.3)`, mechanical lens eye, banned skin/flesh/organic eye |

---

## Group C — first ten poses with no painting at all

**Sheet:** `sheet-C.png` · **Full list:** `docs/concepts/art4/missing.json` (109 gaps)

Method: compared `tools/gen/cast.json` (every subject/state the game's roster can
need) against `public/art/manifest.json` (what `tools/gen/manifest.mjs` found on
disk). A gap here means the game falls back to a procedural placeholder — a flat
letter tile — via `BattlePresenterArt.POSE_FALLBACKS`, because there is no PNG at
any fallback rung.

**Headline finding, beyond the ten:** almost the entire FFX-2 dressphere roster
(`yuna-*`, `rikku-*`, `paine-*` past `-warrior`/`-dark-knight`) has **only `idle`
painted** — every other battle pose (attack, cast, hurt, ko, victory, and the
dressphere-specific `steal`/`dance`) is a letter tile today. That is most of
chapters 4-5's actual gameplay art. `shuyin` (all 6 states) and `lenne` (4 of 5
states, plus her portrait entirely missing) are the other big holes; the four
Vegnagun parts are still missing 4 of 5 combat states beyond what group B
addressed for `-tail`/`-leg`/`-head`.

Rendered (first ten, in `cast.json`'s subject order):

1-3. `yuna-gunner/hurt`, `/ko`, `/victory`
4-8. `yuna-black-mage/attack`, `/cast`, `/hurt`, `/ko`, `/victory`
9-10. `yuna-songstress/attack`, `/dance`

**Bonus, beyond the ten** (cheap — one more `--batch 3` — and the single
whole-subject portrait gap found): `lenne`'s portrait. She has a full
`portraits/` entry nowhere on disk; the four other named humans without a
portrait row in `cast.json` at all (`shuyin`, `bahamut-fayth`) are noted in
`missing.json` for whoever picks this list up next but were not rendered.

All ten dressphere-pose candidates are `--ref`'d against that subject's existing,
shipped `idle.png`, using the same identity tags `cast.json` already has for them
(these were not flagged as wrong — they simply don't exist yet). One rendering note:
`yuna-black-mage/hurt/cand-2` has a large swirling colour artifact obscuring most of
the body — not a black frame or a technical failure of the kind this session
auto-rejects, but the weakest of the three and worth a second look before picking.

---

## Everything Bailey needs to decide

- Group A: pick or reject `braska/cand-{1,2,3}`, or ask for another round if none
  is close enough (none is a clean canon lock; see notes above).
- Group B: 31 poses across 3 sheets. Each row is shipped-vs-3-candidates; picks
  become the new shipped files in a **separate, future** session (this one only
  writes to `docs/concepts/art4/`).
- Group C: whether to prioritize painting the FFX-2 dressphere combat states
  before anything else — they're the single largest block of missing battle art
  in the game, and chapters 4-5 currently play through mostly letter tiles for
  every state but idle.
