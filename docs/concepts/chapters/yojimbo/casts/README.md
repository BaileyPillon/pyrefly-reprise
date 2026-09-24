# Chapter IX Yojimbo: action-painting candidates (FFX only)

These are candidates only. Nothing here is installed, and `public/art`, `src/` and `docs/target/*.json` are unchanged. The files are in `D:/Tools/pyrefly-art-backup/candidates/2026-09-24-yojimbo-casts/`, each with a sidecar that records its method, its repaint seeds and its sha256. The decision sheet is `sheet.jpg`.

**Game case: FFX only.** This is Lady Ginnem's Yojimbo in the Cavern of the Stolen Fayth (`research/ffx-yojimbo.md` §2.5, §3.1). No FFX-2 chapter uses these files.

## Which figures need a painting

I checked this by running the real engine: 80 battles on the Cavern build, with seeds 1 to 40 for each of two lines (physical, and magic plus aeons including Impulse), with `scripts/census.ts` (`node --experimental-transform-types scripts/census.ts`).

| Figure | Acts | Hit | So |
|---|---|---|---|
| Yojimbo | 957 actions (Daigoro order, Kozuka, Wakizashi, Zanmato), all `kind: 'ability'`, so `poseForCommand` picks `cast` | 1,119 hits | cast, plus a hurt candidate compared with none |
| Daigoro | 614 bites (`daigoro-attack`, ordered), `ability`, so `cast` | never (untargetable, `nonCombatant`) | cast only |
| Lady Ginnem | 0 | never | nothing |

## The candidates

The method is `docs/plans/art-method-r3/METHOD-CHECK.md`. Everything is built from the locked idles, with masked repaints only. MAD is 0 outside the masks and the canvas and feet are the idle's. The invented-colour share inside the masks, measured as dE76 above 10 from every idle colour, is 0.0 % for Yojimbo and 0.02 % for Daigoro.

- **Yojimbo `cast.png`: the drawn blade (Zanmato).**
  - The idle's own katana hilt and tsuba move from the hip into his far hand.
  - The far forearm is the idle's own gauntlet forearm, placed under the body.
  - The blade is drawn in steel colours that the idle already has.
  - There were two repaints: fist and forearm seam (seed 924100, denoise 0.55), and blade and hilt edge (seed 924201, denoise 0.45). After them, the hilt interior was pasted back from the idle.
  - At the empty hip, the tsuba sliver was erased as a pixel erase.
- **Yojimbo `hurt.png`:** a bake of the idle's pixels with no GPU. The torso leans back 6 degrees about the waist and the head and hat 4 degrees more, and the swords stay rigid.
- **Daigoro `cast.png`: the bite.** The idle's lower jaw turns down 30 degrees about the hinge, followed by one repaint of the muzzle (seed 924403, denoise 0.6). `cast-alt-narrow.png` is the same at 20 degrees.

## What I saw

The in-battle frames are 1600x900 with `PYREFLY_BROWSER=gpu` on an RTX 5070 Ti, captured by `scripts/ingame.mjs` with request interception.

- **Yojimbo cast:** the blade reads as a raised diagonal. It is thin under the cave's blue light, and the advisor panel covers its tip in the enemy close-up.
- **Yojimbo hurt:** the bake leans visibly, but it barely beats the engine's own flinch of the idle. It is a tie, and a tie goes to none.
- **Daigoro:** the 30-degree snarl reads clearly at his in-battle size of about 300 px. The 20-degree version reads as a grin.

## Wiring gap

The chapter data still gives Yojimbo `spriteKey: 'yojimbo'`, which is the aeon painting (`src/data/ffx/enemies/yojimbo.ts`). The Cavern idle is not wired. The captures served the Cavern files under that key.

GPU use: 16 prompts, 2.9 minutes against the 60-minute cap. No black frames.

## r1 pixel repairs (after JUDGE.md, commit 01dc52f9)

**Game case: FFX only.** These are pixel work only. No GPU was used, nothing was installed, and nothing was downloaded. Each file is saved beside its parent with its own sidecar. The masks are in `provenance/r1/`. MAD against the parent is 0 outside the mask, and the invented-colour share inside the mask is 0.0 % (every colour comes from the locked idle palette).

- **Yojimbo `cast-r1.png`** (`scripts/yoj_r1.py`):
  - The blade is redrawn on the same arc with the same tip. **It is not lengthened.**
  - It is inked on the spine and on the edge at the idle's line weight (2 to 3 px), with a brighter flat, a shinogi line and a pointed kissaki with its yokote.
  - The ragged black root is now a gold habaki collar at the tsuba, and the red fringe outside the tsuba rim is peeled.
  - The glove's front edge is smoothed, its lavender fringe is peeled, and the edge is inked with a tapered line.
- **Daigoro `cast-r1.png`** (30 degrees, `scripts/dg_r1.py`):
  - The magenta fringe under the jaw is inpainted from the fur.
  - The lower lip is one smooth tapered line, so the kinks are gone.
  - The four teeth between the front fang and the canine are removed.
- **OPTION ONLY: `cast-r1-option-longer.png`.** The same arc is continued 40 px, from about 243 px to about 283 px. This is a visual option, not a sourced length. It needs Bailey's yes, and it is not part of r1.
- **Sheet:** `sheet.jpg` rows 5 to 9, built by `scripts/sheet_r1.py`. The in-battle frames are 1600x900 from `scripts/ingame_r1.mjs`, which ran its own Vite on 5860 (stopped by PID) with request interception. The advisor card is hidden for the enemy-turn read.
- **Not judged yet.** r1 still needs an independent judge.
