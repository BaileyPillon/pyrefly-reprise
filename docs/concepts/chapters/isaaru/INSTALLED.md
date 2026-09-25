# Chapter XIV (Isaaru): production art installed as CANDIDATES (FFX only)

**Game case (rule 14): FFX only.** This is Isaaru's contest of aeons in the Via Purifico beneath Bevelle. His
aeons, Yuna's summons and CTB exist only in FFX (research `ffx-isaaru-bevelle.md` §0.3; in FFX-2 he is a
tour guide). Nothing here applies to an FFX-2 chapter.

Installed 2026-09-25 from Bailey's picks ("I'll go with all your recommendations", ~01:40 EDT). The picks are
**O-1 A** (calm, arms open, repaired toward the wiki's knee-length jacket and sea-green belt), **O-2 B** (steady
and sorrowful), **O-3 A** (red lamps, the hallway behind) and **O-4 C** (a sea-green edge and a darker grade on
the Ifrit, Valefor and Bahamut paintings). KO is the pyrefly dissolve.

These files are **candidates**:
- I judged them myself at 1:1 and in real 1600x900 engine frames. Nobody else has judged them.
- None is in `approved-hashes.json`.
- Every file sits under a **new** subject id. No approved or D-089 file was written.
- `verify-approved.mjs` still reports 153 ok, 0 mismatched, 0 missing.
- Nothing under `src/` was edited, and no data, scene or encounter points at these ids yet.
- `public/art/` is gitignored, so the files exist only on this disk. They are backed up to
  `D:/Tools/pyrefly-art-backup/candidates/2026-09-25-isaaru/`.

Sheet: `production/sheet.jpg`, one column, for phone. Single frames: `production/frames/*.jpg`.

## Installed files (each `.png` has a `.json` sidecar: status CANDIDATE, game, pick, method, repairs, seeds, prompts, sha256)

| Subject id (new) | Files | Size, baselineY | From |
|---|---|---|---|
| `isaaru` | `public/art/characters/isaaru/idle.png` | 744x1188, 1171; facing left | O-1 A render `isaaru-a3`, seed 921103 |
| `isaaru` (portrait) | `public/art/portraits/isaaru.png` | 832x1216 | O-2 B render `isaaru-pb2`, seed 924202 |
| `via-purifico` | `public/art/backdrops/via-purifico.png` | 2688x1536 | O-3 A render `via-a`, seed 922101, exactly as picked |
| `grothia` | `public/art/characters/grothia/{idle,attack,overdrive}.png` | idle 1095x1138, 1062, `scale` 1.0599 | `ifrit/*` (D-089, read only) |
| `pterya` | `public/art/characters/pterya/{idle,attack,overdrive}.png` | idle 1177x950, 874, `scale` 1.0737 | `valefor/*` |
| `spathi` | `public/art/characters/spathi/{idle,attack,overdrive}.png` | idle 1109x1086, 1010, `scale` 1.0632 | `bahamut/*` |

- **The enemy ids are not `ifrit`, `valefor` or `bahamut`.** The plan's I-G6 forbids those: an enemy that
  shares an id with a roster aeon would overwrite Yuna's aeon. The sprite keys of the new enemies should
  point at `grothia`, `pterya` and `spathi`.
- **Every aeon sidecar keeps its source's `facing: left`,** with `facingObserved: true`. `baselineY` is the
  source's value plus the 60 px pad.
- **Only the idles have a `scale`.** That factor restores the source's pixels per world unit.
- **`public/art/manifest.json` was regenerated** (`node tools/gen/manifest.mjs`): 74 subjects, 35 portraits,
  15 backdrops.
- **Tests:** `art-manifest-build`, `art-manifest-loader`, `art-black-frame` and `art-cutout-guard` pass
  (87 tests).
- **Paintings per enemy follow the r3 state map:**
  - Isaaru never acts (plan B8 = a: no turn, never targetable), so idle is his only painting.
  - Each aeon gets idle, attack and overdrive, derived from what the source has. The source has no cast,
    and `cast` falls back to `attack`.
  - There are no hurt or KO paintings. Hurt falls back to idle, and KO is the engine's dissolve (B19).

## Method (r3, `docs/plans/art-method-r3/METHOD-CHECK.md`): the picked pixels are the painting

**0 GPU minutes.** Nothing was queued on ComfyUI. Every repair is pixel work in `production/scripts/`,
which uses numpy and PIL only.

- **Isaaru** (`isaaru_idle.py`). The repairs work toward the wiki's words (*Isaaru*, "Appearance", revid
  4026440: a black knee-length jacket edged in sea green, a wide sea-green belt tied in a bow).
  1. **The coat now ends at the knee.** The sea-green front panels are erased below a hem line at y 846.
     A 2 px ink hem runs along the cut. The white robe in front keeps every pixel. On the right, the robe's
     edge is a fitted straight line (x = 0.0892y + 519.4) with its own ink.
  2. **The sash is sea green, and the knot and its cords are a deeper sea green.** Each pixel takes its
     a*/b* from the painting's own sea-green lapel at that pixel's new lightness, so no new colour is
     invented.
  3. **The navy coat is pulled toward black:** Lab chroma x0.5, L x0.9.
  4. **The white robe's highlights are compressed** (L > 75 becomes 75 + (L - 75) x 0.6), as the options
     README asked, so the chapter's bloom does not blow them out. In the engine frame, the robe reads white
     and is not blown out.
- **Portrait** (`isaaru_portrait.py`). O-2 B was painted from O-1 C's look, so its colours are brought to
  the O-1 A pick. Every new colour is taken from the portrait's own ramps:
  - the yellow-green upper lapels and inner V become sea green;
  - the green-tinted hair strands at both shoulders return to his brown;
  - the blue hair tie becomes gold, as on O-1 A;
  - the coat goes toward black, as on the billboard.

  The expression, face and line work are untouched.
- **Aeons** (`isaaru_aeons.py`). This is the options round's O-4 C recipe (`derive.py his_side`) with two
  production changes:
  - The glow behind the figure is capped at alpha 0.33, below the engine's 0.35 content threshold, so it
    never moves the feet or the content box. The options round's glow reached 0.40.
  - The transparent pad is 60 px.

  The line work and shapes are identical to Ifrit, Valefor and Bahamut.
- **Plate:** O-3 A as rendered, with 0 pixels changed.

## In the engine

Frames: `production/scripts/frames.sh` → `frame.mjs`, `talk.mjs`. They ran on a private Vite server
(`serve.mjs`: port 5781, HMR off, no watch, real GPU), which was stopped by its PID afterwards.

The frames play Chapter X with a Yuna-only line-up. Playwright request interception serves the installed
files with their real sidecars in place of the stand-ins: `seymour-natus` becomes the aeon, `mortibody`
becomes Isaaru, and the Macalania plate becomes `via-purifico`. The action poses are shown through the
actor's own `setPose`. The enemies' Agility, the names and Isaaru's queue rows are patched in the browser,
as in the options round. Nothing in `src/` changed.

| Frame | What it shows |
|---|---|
| `frames/grothia-hud.jpg` | Link 1, the real HUD. Isaaru reads as a black coat with a sea-green collar and belt, and a white robe that is not blown out |
| `frames/pterya-hud.jpg` | Link 2. At the options round's staging (Isaaru x +2.2), Pterya's wing covers most of him: see "Owed" |
| `frames/spathi-hud.jpg` | Link 3. The sea-green edge keeps the dark Bahamut painting readable in the dark room |
| `frames/grothia-ko.jpg` | The KO dissolve, halfway (0.55) |
| `frames/grothia-clean.jpg` | HUD off |
| `frames/dialogue.jpg` | The portrait in a real dialogue frame on the new plate. The line is a stand-in (plan B17) |

The attack and overdrive frames of all three aeons are on the sheet.

## Known defects, disclosed

- **Isaaru:**
  - The knot is the render's ornamental knot with tassels, recoloured. It is not the wiki's bow.
  - The white robe under the coat still reaches the ankles.
  - At 2x there is a small jog in the robe's left outline where the cut panel met it.
  - The topknot and side locks are our reading of the reference images. The wiki does not describe them.
- **Portrait:**
  - The bronze lapel medallions and the blue collar gem come from O-1 C's look. The billboard does not
    have them.
  - The matte is the options run's cut-out (`--keepBad`, because a bust fills the canvas).
- **Plate:**
  - It has no low parapet with small square red lamps, which the real room has.
  - It reads more as a colonnade than as a square room.
- **Aeons:** the mark is ours. The sources give no visual difference between Isaaru's aeons and Yuna's
  (research §10.2).

## Owed, and not decided here (keep under `inferred` until Bailey names them)

- **Wiring (T5 scene, data):**
  - the scene factory for `via-purifico`;
  - the enemy sprite keys (`grothia`, `pterya`, `spathi`);
  - Isaaru's stage slot and height. The options frames used 0.85x Mortibody's stage height, `[estimate]`.
- **Pterya's staging:** the scene should place Isaaru clear of Pterya's wing, for example further right
  or nearer the camera.
- **Independent 1:1 judge,** then Bailey's verdict. After that, the sha256 goes into `approved-hashes.json`,
  but only on Bailey's word.
- **Chapter card, thumbnail and pause plate** (plan §6.1) were not made in this pass.

## Scratch

Scratch is in `D:/Tools/pyrefly-scratch/ch1215/isaaru-art/`.

My first scratch folder, `ch1215/isaaru/`, was emptied by someone else at about 00:32 EDT while I was
working. It was probably another chapter agent's cleanup under the same key. Nothing installed was
affected, and the frames were re-rendered.

## Hero plate installed, 2026-09-25 (FFX only, Chapter XIV)

Bailey, 2026-09-25 ~10:20 EDT, verbatim: "I'll go with all your recommendations". Option B of `hero-plate/README.md` installed as `public/art/pause/ch14-isaaru-via-purifico.png` (sha `1e2d6f56a1b1`) with its RealESRGAN `.2x.webp` master and `.json` sidecar; locked in set `bailey:2026-09-25-recommendations`. The chapter lives on branch `chapter-isaaru-0925` with no `ChapterMeta`. **Ship step:** its `ChapterMeta` names `heroArt: 'pause/ch14-isaaru-via-purifico'`.
