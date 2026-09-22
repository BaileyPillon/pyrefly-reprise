# Logos round 3: method F with Logos's own words (2026-09-22)

FFX-2 only (Chapter 6, Chateau Leblanc art; no shared tool or game file changed,
AGENTS.md hard rule 14). The method check that came before this round, as hard
rule 15 asks after two failed passes (`920dac8`, `2e5672d`; judge `42311e2`):
`docs/plans/leblanc-art-method-check.md` section 6.

**Everything installed here is a CANDIDATE.** Nothing was added to
`docs/target/approved-hashes.json`; its 115 files hashed the same before and
after this round (no Logos entry exists there).

**Sheet:** `sheet.jpg`. One row per state: the anchor (Bailey's picked concept
`logos-c.png` on the idle row, the installed idle on the others), the installed
state whole, a 1:1 face crop and a 1:1 costume crop at native pixels. Built by
`build-sheet.py sheet` from the installed PNGs and `crops.json`. I picked each
state from native-pixel crops of every candidate, not from the thumbnails.

## Method

Pilot 2's winner F, unchanged except for the words: Animagine XL 4.0, 28 steps,
cfg 6, euler_ancestral / normal, pilot 2's framing (the sprite block without
`standing` and `(looking at viewer:1.2)`), `STYLE_TAGS`, `QUALITY_TAGS`,
`SPRITE_NEGATIVE`, `FACING_NEGATIVE` (not for ko, which uses the prone block).
IP-Adapter reference: a batch of a square whole-figure image and a square head
crop, concat, weight 0.4, ease in, 0.2 to 0.6.

- **Words are Danbooru tags, no negated phrases in the positive.** The two earlier
  passes wrote "no helmet crest, no plume, no feathers" in the positive, which puts
  `plume` and `feathers` in the positive. Idle words: `identity.txt`, `emphasis.txt`
  (from the concept and research 10.1). The other four: `identity-anchor.txt`,
  `emphasis-anchor.txt` (`emphasis-anchor-ko.txt` for ko, without `dual wielding`),
  rewritten from the installed idle's pixels. Shared negatives and each state's pose
  tags: `states.json`. Every emphasis group is a short phrase with no comma inside
  (the redo's blank-frame finding).
- **Idle first, off Bailey's pick.** `make-refs.py concept` builds the references
  from `docs/concepts/chapters/leblanc/renders/logos-c.png` with the feather plume
  and the crest spike painted out on white (Bailey's note on the pick: re-render
  "with a plainer, canon helmet"). The picked idle then becomes the only anchor:
  `make-refs.py idle` builds `refs/idle-square.png` and `refs/idle-head.png` for
  attack, cast, hurt and ko.
- `run-round3.mjs <state>` renders; `run-round3.mjs repaint ...` is a masked repaint
  of one box (VAEEncode + SetLatentNoiseMask + ImageCompositeMasked, the same
  references at 0.4 over the whole window); `install.mjs <state> <seed>` copies a
  cutout to `public/art/characters/logos/` and writes the sidecar with
  `status: CANDIDATE`, `candidateOf`, `method` and `seed`.

Renders: 5 per state (6 for ko), 26 in all plus 5 repaint passes, 13 to 62 s each
on the shared queue, one job of mine in the queue at a time. No black or blank frame.

## Picks and my read (worst criterion, bar 7, against the anchor at 1:1)

This is the painter's own read, not an independent pass. Pilot 2's judge scored a
point under the painter, so expect these to drop, not rise.

| State | Pick | Worst | Why |
|---|---|---|---|
| idle | `idle.94103cr911` | 6 | The only candidate with both revolvers low in both hands, the research stance; emblem disc on the shoulder, purple sash, ankle wraps and sandals. It drew a winged fin on the helmet. Two masked repaints (0.6, 0.75) redrew the fin, so I filled the fin pixels (white above the dome, dome grey inside it; `renders/idle.94103c.raw.png`) and repainted that box at 0.5, which gave a smooth dome. Off: the far hand is tan against the pale near hand; no purple tie strip at the back of the helmet (research 10.1 has one; not visible from this side); the robe is a lighter blue than the concept. |
| attack | `attack.94202`, mirrored | 6 | Both revolvers aimed forward in a lunge (Double Shot), serious face, idle's robe, sash, hakama, wraps and sandals. Rendered facing right; mirrored with `tools/gen/flip.py --set-facing left` (Logos is not chiral: a logo on each shoulder, a revolver in each hand). Off: the helmet is a ribbed visor dome, the same type as idle but not the same surface; a black strap clasp with a claw edge on the shoulder; an invented charm chain at the hip. |
| cast | `cast.94302` | 5 | One revolver raised beside the face, barrel up, the other low in the other hand, a smirk: the Russian Roulette beat. Emblem and robe match idle. Off: the helmet has a slotted visor that idle does not. |
| hurt | `hurt.94402` | 6 | Thrown back away from the party, clenched teeth, a revolver in each hand, idle's wraps and sandals. Off: the chest emblem is gold where idle's is white. |
| ko | `ko.94505c` | 4 | Head toward the party, eyes shut, two revolvers on the floor, the helmet still on but pushed to the back of the head. A detached white floor shard was filled white before the cutout (sidecar `edit`). Off: a brown leather strap (idle black), black-striped ankle wraps (idle white), and the second revolver is drawn double-barrelled. A masked repaint to turn the strap black (0.5, two seeds) kept it brown and changed the emblem, so it was discarded. |

**Nothing clears 7.** What changed against the two earlier passes: one helmet
design (a silver dome with a front visor, no crest, no plume, no brim) is worn in
every state; two revolvers show in every state; no pauldron in any pick; the
costume (light blue robe, purple sash, grey hakama, white ankle wraps, black
sandals) holds across idle, attack, cast and hurt.

Rejected, by the first criterion that failed: idle 94101 (one gun), 94102 (one gun,
gold streamer), 94104 (silver pauldron), 94105 (crest spike, one gun); attack 94201
(darker robe, open chest, swept-back helmet), 94203 and 94204 (helmet antennae),
94205 (three guns); cast 94301 and 94304 (facing right, different helmet), 94303
(topknot plume), 94305 (orb pauldron); hurt 94401 (silver pauldron), 94403 (one
gun), 94404 (weak pose), 94405 (recoils toward the party); ko 94501 (helmet off),
94502 (grille visor), 94503 (a bare foot growing out of the sleeve), 94504
(face-frame armour), 94506 (three guns, shoes).

## Sidecar scale overrides

Every pose is sized from idle's pixels per world unit (`src/engine/PaintedScale.ts`),
so a render that paints the head bigger comes out bigger in battle. Measured at
1:1: attack paints the head about 230 px from helmet top to chin against idle's
145 px, and ko paints the helmet about 200 px wide against idle's 140 px. The
sidecars carry `scale: 0.62` (attack) and `scale: 0.7` (ko) with a `scaleNote`,
the hand override `PaintedArt.ts` documents. Not yet checked in a running battle.

## Open

- An independent judge pass on this round (the painter's read above is not one).
- Hard rule 6: research 10.1 gives the helmet a purple tie strip at the back; no
  pick shows one from this side. The Syndicate logo's shape is not sourced; the
  picks draw a round disc.
- `public/art/portraits/logos.png` was painted before this round from the old
  words; it was not re-rendered here and should be checked against the new idle.
- Pilot 2's rule: if this also fails the bar, show Bailey the best of each state
  next to the anchor (this sheet) rather than a fourth pass.

## Files

- `identity.txt`, `emphasis.txt`, `identity-anchor.txt`, `emphasis-anchor.txt`,
  `emphasis-anchor-ko.txt`, `states.json`: the words
- `make-refs.py`, `refs/`: the references (`refs/idle-headbox.json` is the head crop box)
- `run-round3.mjs`, `install.mjs`, `build-sheet.py`, `crops.json`: render, install, sheet
- `renders/`: every candidate cutout and sidecar; raw frames and masks stay local
  (`.gitignore`) and are backed up with everything else, plus the installed set and
  the set it replaced, in `D:/Tools/pyrefly-art-backup/candidates/2026-09-22-leblanc/logos/`
  (`round3/`, `pre-round3-installed/`)
