# trapped-white handoff (2026-10-04)

Game case: **FFX (Tidus) and FFX-2 (Bahamut), each decided on its own pictures**: nothing here is shared plumbing. Bailey's yes: question (j), "all your recommendations", 2026-10-04 ~13:20 EDT (an alpha edit of protected approved paintings, authorised by that yes). Nothing has been installed: `public/art` is untouched (sha256 of all 17 originals re-checked), `docs/target/approved-hashes.json` is untouched, no deploy.

## What exists

Candidates: `D:/Tools/pyrefly-art-backup/candidates/2026-10-04/trapped-white/`

| Path | What |
|---|---|
| `install-ready/public/art/characters/<subject>/<pose>.png` | the 17 cleaned PNGs, mirroring `public/art` (copy over, nothing else changes) |
| `manifest.json` | per file: old sha256, new sha256, changed pixels, opaque bbox before/after (identical in all 17, so no sidecar changes), every region (class, id, box, px), the before/after crop names |
| `crops/` | 57 before / after crops at 4x (2x for wide ones), one per cleaned region, on a dark teal ground |
| `in-engine/` | 22 before / after / changed-pixels strips (1600x900 and 2560x1440), `frames/` (52 full frames, JPEG q88), `*-log.json` (pose asked, pose shown, responses, console errors) |
| `originals/` | byte copies of the 17 files as they are in `public/art` now (the backup for the supersede records) |
| `approved-hashes-patch.json` | proposed supersede records (not applied); `ffx2-bahamut/idle.png` has no record in any set today |
| `hires-rederive-list.json` | the hires masters to re-derive (below) |

The rule (alpha only): inside a listed region RGBA becomes (0,0,0,0); every other pixel is byte-identical. Independently verified by `work/verify.py` (all 17: the changed pixels all become 0 and were opaque, the opaque bbox is unchanged, sha256 match, every changed pixel inside a listed region box).

**Two region classes** (`regions[].cls` in the manifest):
1. `enclosed-white-wedge` (not connected to the outside): pure or pale white components, at least 2.5 px thick, not touching the outer transparency, bounded by black ink (Tidus: at least 85 percent of the 2 px ring is dark) or, for Bahamut, any ring (the salmon wing membrane next to dark armour makes the ink test useless there). Every one looked at by eye on a montage.
2. `hair-tip-white-notch` (Tidus only): small white notches (8-130 px) between blonde/orange hair-spike tips that touch the outside through the gap; the earlier border flood (cut 244, spread 10) left them. These are not "enclosed" in the strict sense; they are the white Bailey sees in the spikes. To keep only the strictly enclosed ones, set `TIER2_POSES = []` in `build.py` and re-run (Tidus attack's four big wedges stay; the hair notches go).

## Counts

- Files changed: **17** (Tidus 9 of 13 poses; Bahamut 6 poses at 1x plus the 2x of idle and telegraph). 10,067 pixels changed in total.
- Tidus: attack 3,257 px (four wedges between arm, hilt and chest, plus three hair-tip notches), cast 197, critical 79, follow 59, hurt 74, item 146, od-energy-rain 9, ready 168, victory 182. Unchanged: idle (no trapped white: its whites are the hood, the sword and the gauntlet), ko, od-slice-and-dice, sleep, idle@2x.
- Bahamut: attack 258, cast 1,368, hurt 403, idle 354, idle@2x 1,545, ko 331, telegraph 326, telegraph@2x 1,311. Unchanged: ko.1, ko.2, ko.3, splash (see below).

## Bytes for the release (limit 800,000,000; release 38 headroom 2,046,310)

Computed with the real planner (`planArtDerivation`, scope `exact`, old files against new files; `plan/run-plan.mjs`, `plan/shipped-bytes.json`). **Net shipped change: -57,193 bytes** (these 17 files ship 20,036,646 now and 19,979,453 after: the headroom does not shrink). Master bytes on disk change by -1,187,273 (the new PNGs are written with `optimize`; masters are not shipped).

Form (WebP vs PNG): **no file changes between exact WebP and PNG.** The alpha class of every file is unchanged, so the nine Tidus files and `bahamut/idle` stay lossless WebP, and the other Bahamut files stay PNG (their old shipped form was the max-effort recompress, the new one is the master copy because the optimised PNG is already smaller: still a PNG).

| file | form | now | after | delta |
|---|---|---|---|---|
| ffx2-bahamut/attack.png | png -> copy | 916,382 | 913,305 | -3,077 |
| ffx2-bahamut/cast.png | png -> copy | 1,065,763 | 1,060,418 | -5,345 |
| ffx2-bahamut/hurt.png | png -> copy | 952,016 | 948,115 | -3,901 |
| ffx2-bahamut/idle.png | webp -> webp | 677,220 | 677,308 | +88 |
| ffx2-bahamut/idle@2x.png | png -> copy | 5,705,370 | 5,686,438 | -18,932 |
| ffx2-bahamut/ko.png | png -> copy | 912,852 | 909,305 | -3,547 |
| ffx2-bahamut/telegraph.png | png -> copy | 926,633 | 923,449 | -3,184 |
| ffx2-bahamut/telegraph@2x.png | png -> copy | 5,692,168 | 5,674,871 | -17,297 |
| tidus/attack.png | webp -> webp | 413,750 | 412,252 | -1,498 |
| tidus/cast.png | webp -> webp | 469,802 | 469,650 | -152 |
| tidus/critical.png | webp -> webp | 400,966 | 401,108 | +142 |
| tidus/follow.png | webp -> webp | 213,268 | 213,230 | -38 |
| tidus/hurt.png | webp -> webp | 440,000 | 440,166 | +166 |
| tidus/item.png | webp -> webp | 426,834 | 426,734 | -100 |
| tidus/od-energy-rain.png | webp -> webp | 361,246 | 361,112 | -134 |
| tidus/ready.png | webp -> webp | 213,228 | 213,242 | +14 |
| tidus/victory.png | webp -> webp | 249,148 | 248,750 | -398 |

## In-engine proof

Scratch worktree `D:/pyrefly-trapped-white` (branch `trapped-white-scratch`, main at e2e33e0b, `node_modules` is a junction; never removed), two Vite dev servers on 7120 (before: the shared art through a junction) and 7121 (after: a separate art root `engine/public-after` with the 17 files overlaid and junctions for everything else). Both stopped by port. Headless Playwright (PYREFLY_BROWSER=gpu), seed 1, 1600x900 and 2560x1440:
- Ch I (seymour-flux): the natural first menu (Tidus), then Tidus held in attack, od-slice-and-dice, od-energy-rain, hurt, follow and ko with the stage's own `setPose(force)`.
- Ch IV (ffx2-bahamut): the natural first menu (Yuna, Bahamut idle in view), then Bahamut held in attack, cast, telegraph, hurt and ko.
- 0 console errors and 0 responses of 400 or more in all four runs.
- Not driven: a real-key Overdrive. The chapter's party is beaten in 43 s and the scripted keys stalled on menu timing, so the Overdrive pose is shown by the pose hold instead.
- Caveat: the strips mark every old near-white pixel that changed, which includes sparkle and idle breathing next to the figure; the counts in `in-engine/diff-summary.json` are not a measure of the edit. The pairs are for the eye (Tidus attack shows the wedge between arm and hilt now open to the scene).

## Hires library (no GPU job run; CAPTURE-DONE did not exist)

15 hires assets (30 masters, @2x and @4x, "refined" tier) need the cleaned alpha: tidus attack, cast, critical, follow, hurt, item, od-energy-rain, ready, victory; ffx2-bahamut attack, cast, hurt, idle, ko, telegraph (list with sizes in `hires-rederive-list.json`; 173.6 MB PNG, 113.1 MB lossless WebP). Not on the list: Tidus idle, ko, od-slice-and-dice, sleep (unchanged) and Bahamut splash (untouched). Cheapest route, no GPU: patch their alpha from the upsampled 1x region masks (same rule and grow step as `build.py`) instead of re-running the SDXL detail pass. That is Bailey's call, and the detail batch is still running.

## Not changed, flagged for Bailey's eye

- Bahamut ko.1, ko.2, ko.3: large flat white and cream areas (about 20k, 90k and 7k px) that fill wing membranes between the wing bones. They read as painted, lit membrane in a dissolve ("violet glow fading" in the prompt), not as backdrop; erasing them would leave bare bones. Left alone.
- Bahamut splash (1656 px): five white wedges look like backdrop (ids 115, 132, 139, 142 and 157 at CUT 230, SPREAD 24), but the halo around the figure defeats the ink test. Not changed.
- Bahamut telegraph: a white oval, 42x10 px at x 295-335, y 731-741 (1x), could be a gap or a glint. Left alone.
- Bahamut idle, attack, hurt, telegraph: a few grey-lilac slivers beside the right wing (for example x 569-615, y 593-627 in idle) are pale lavender-grey, flat, and look like torn membrane; they are not backdrop-white and would need a different rule. Left alone.
- Tidus hurt (a white wedge at x 337-352, y 852-875) and item (x 410-421, y 396-415): polygonal white between cloth pieces, backdrop or highlight, undecided. Left alone.
- Painted whites kept: Tidus's hood, sword and gauntlet highlights, the cast glyph ring.

## To install (the driver, with the critic check Bailey asked for after)

1. Copy `install-ready/public/art/characters/**` over `public/art/characters/**` (17 PNGs). Sidecars (`*.json`) do not change: the opaque bounding boxes are identical.
2. Add the supersede records from `approved-hashes-patch.json`; run `node tools/art-derive.mjs verify` and `audit` on the build.
3. Ship in 38.1 or 39: no byte risk (net negative).

## Reproduce

`work/detect.py`, `work/build.py` (writes the candidates; ids and parameters inside), `work/verify.py`; committed to branch `trapped-white-scratch` under `tools/gen/trapped-white/` (python: `D:/Tools/ComfyUI/python_embeded/python.exe`, which has scipy; CPU only; the paths inside are absolute).
