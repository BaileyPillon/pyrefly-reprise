# Chapter XI, Fallen Aeons: production art installed as CANDIDATES (FFX-2 only)

Built 2026-09-24 from Bailey's picks ("I'll go with your recommendations for all"): O-1 A with the
clean pass, FA13 (one idle and one cast per Sister), O-2 B (the Chapter IV violet), O-3 A plus B's
shot between links, FA11 (the Anima painting counts as approved on Bailey's word).

**Game case (rule 14): FFX-2 only.** Every file sits under a new subject id. No approved file was
written or replaced, so nothing needed a backup. All 133 hashes in `docs/target/approved-hashes.json`
still match. Nothing is wired into the game: no enemy data, scene or encounter points at these ids yet.
`public/art/` is gitignored, so the files are only on this disk (mirror them to
`D:/Tools/pyrefly-art-backup` when they are approved).

Sheet: `production/sheet.jpg`. Single 1600x900 frames for a phone: `production/frames/`. The
before/after close-ups are in `production/cards/`. Every frame is a flat composite of the plate, the
paintings and the real Chapter V HUD layer captured on 2026-09-24. None is an engine capture, because
the Road needs its own scene ground (T5).

## Installed files (each `.png` has a `.json` sidecar: status CANDIDATE, game, method, repairs, seeds, prompts)

| Subject id | Files | Derived from | What changed |
|---|---|---|---|
| `sandy` | `public/art/characters/sandy/idle.png`, `cast.png` | O-1 A render `sandy-a3` (seed 911103) | Idle: the render's own floating scythe scaled 0.70 and set on her forearm (a pixel transplant, no GPU). Cast: the forearm and scythe rotated 100 degrees about the elbow, blade raised; only the elbow seam was repainted (seed 931201, denoise 0.45) |
| `cindy` | `public/art/characters/cindy/idle.png`, `cast.png` | O-1 A render `cindy-a2` (seed 912102) | Idle: the pale dots were removed, so the shell reads as **red spots on blue** (visual bible §1.22.6, as the review corrected). 3,556 px changed, no GPU. Cast: the near forearm raised; the belly and sash were repainted inside a mask (seed 932201) |
| `mindy` | `public/art/characters/mindy/idle.png`, `cast.png` | O-1 A render `mindy-a2` (seed 913102) | Idle: her own striped abdomen was moved **behind** her and given a stinger. The hips were repainted as black leggings inside a mask (seed 925101), and the notch closed (seed 925201). Cast: the near forearm thrust forward; the bodice was repainted inside a mask (seed 933201) |
| `x2-shiva` | `public/art/characters/x2-shiva/idle.png`, `attack.png`, `overdrive.png` | approved `shiva/*` (hashed) | O-2 B violet: a grade, a rim, an eye glow and an aura. Line work and shapes are identical. The aura alpha is capped at 0.33, so the engine's 0.35 alpha measure never moves the feet. There is a 70 px pad, and the idle sidecar `scale` restores the approved pixels per world unit |
| `x2-anima` | `public/art/characters/x2-anima/idle.png`, `attack.png`, `overdrive.png` | `anima/*` (FA11 yes) | The same O-2 B treatment. `anima/hurt` and `anima/ko` are still CANDIDATES and were **not** derived; hurt falls back to idle |
| `road-to-the-farplane` | `public/art/backdrops/road-to-the-farplane.png` (+ `.json`) | approved `farplane.png` | O-3 A: 65 % of the pixels (every row above 827 of 1536) are the approved plate's exactly |
| `road-to-the-farplane-links` | `public/art/backdrops/road-to-the-farplane-links.png` (+ `.json`) | plate A | O-3 B, the shot between links: two copies of A's own island toward the spire, no render |

`public/art/manifest.json` was regenerated (`node tools/gen/manifest.mjs`): 70 subjects, 14 backdrops.
`tests/unit/art-manifest-build.test.ts` and `art-manifest-loader.test.ts` pass (27 tests).

## Own judgement at 1:1, for the independent judge (not approval)

- **Idles:** all three clean passes read as intended at game size.
  - Sandy: the join between the scythe mount and the gauntlet is visible at 1:1. It reads as a
    bracket clamped to the arm, not grown from it.
  - Cindy: a faint ghost of one edge dot is left on the lower spot.
  - Mindy: the hips are new pixels, and their front edge is a little straight.
- **Casts are derived, not rendered.** Fresh renders with `--ref` drifted off model: Cindy's shell went
  red with black spots, Mindy lost her abdomen, and all three Sandy renders came out as texture noise.
  Those renders are in `production/cards/withdrawn-fresh-casts.jpg`. So each cast is its idle's own
  pixels with one forearm rotated, and only the vacated area and the joint are repainted. Identity is
  exact. The gesture is modest. Cindy's cast has a known defect: at 1:1 her far hand reads as a blue
  block at the belly.
- **Inferred, not named by Bailey** (rule 15, `inferred`): where the scythe sits, how the abdomen is
  placed and its stinger, each cast gesture, and the size the aura was capped at.

## GPU

About 4 minutes of ComfyUI execution against the 90-minute cap:
- 9 cast renders, all withdrawn;
- 7 masked repaints (Cindy's shell-dot repaint was withdrawn: it invented detail inside its own mask).

There was no all-black frame. ComfyUI was never restarted. Nothing was downloaded; rembg used the
isnet-anime weights already on disk. The scripts are in `production/scripts/` (`install.py` holds the
sidecar text). The scratch files are in `D:/Tools/pyrefly-scratch/fa-prod/`.
