# Missing speaker portraits, 2026-09-25: who speaks where, and options

This is an options round (AGENTS.md rule 9). **Nothing here ships.** Nothing was installed into
`public/art`, `docs/target/approved-hashes.json` was not touched, and nothing under `src/`
changed. `node D:/Tools/pyrefly-lora/tools/verify-approved.mjs`: 0 mismatched, 0 missing,
before and after. The full-size candidates (PNG + sidecar JSON, with seed, prompt, denoise and
the IP-Adapter reference) are under
`D:/Tools/pyrefly-art-backup/candidates/2026-09-25-gpu6/<speaker>/`; only the sheets are in the
repo.

**Which game (rule 14): FFX-2 only.** Every speaker that got options speaks only in FFX-2
chapters (V and XIII). No FFX speaker was painted.

## 1. Who speaks where

Speaker ids in `src/story/dsl.ts` `SpeakerId` with no `public/art/portraits/<id>.png`, checked
against `say('<id>', ...)` in `src/story/scripts/` on `main`, and on every local branch for the
five that never speak. `brother-x2`, `seymour-macalania`, `young-auron` and `yu-yevon` have
files and are excluded.

| Speaker | Lines on main | Script and chapter | Status of that chapter | Options here |
|---|---|---|---|---|
| `trema` | 9 | `ffx2-trema.ts`, Chapter XIII (the seam after Paragon falls, lines 10 to 18, plus callouts) | merged, **unlisted** | yes (first) |
| `gippal` | 2 | `ffx2-vegnagun-shuyin.ts`, Chapter V ("People built that thing.") | **LIVE** | yes |
| `baralai` | 1 | `ffx2-vegnagun-shuyin.ts`, Chapter V (mid-battle, "...Forgive me. I was not myself.") | **LIVE** | yes |
| `buddy` | 2 | `ffx2-vegnagun-shuyin.ts`, Chapter V (Celsius comm) | **LIVE** | yes, from text only (no painting exists) |
| `shinra` | 2 | `ffx2-vegnagun-shuyin.ts`, Chapter V (Celsius comm, mid-battle) | **LIVE** | no: stopped after two failed pilots (rule 15) |
| `brother` (FFX) | 3 | `evrae-airship.ts`, Chapter VIII | **LIVE** | **no**: `dsl.ts` says his FFX look is unsourced, and rule 6 forbids inventing it |
| `zaon`, `kelk`, `biran`, `yenke`, `wantz` | 0 | none on main or on any local branch | n/a | no (nobody hears them) |

Gippal and Baralai also stand in Chapter XV (the Den of Woe, branch `chapter-gippal-0925`, not on
main) as shades, but on that branch they still speak only in Chapter V's script. Their Chapter V
lines are the living men, so the options paint them alive, not in the shade treatment.

## 2. Method (all three characters)

The first two Trema pilots (txt2img with the portrait recipe and the idle's head as a forced
IP-Adapter reference, seeds 925101-925103 and 925111-925113) kept the face and beard but **lost
the tall black eboshi** both times: the portrait composition crops at the brow. Per rule 15 the
method changed after the second failure, to the one Seymour's Macalania portrait used:
**img2img from the installed painting's own pixels.**

1. The head and shoulders of the battle painting are cropped, padded on white and scaled to the
   house portrait canvas, 832x1216.
2. img2img with the house portrait recipe (`tools/gen/comfy.mjs character --composition portrait
   --facing none`: Animagine XL 4.0 Opt, 28 steps, CFG 6, euler_ancestral), identity words read
   off the painting, and **IP-Adapter forced** on the same crop (`--forceRef`, pipeline default
   weight 0.3, recorded in each sidecar's `ref`).
3. Only the denoise (0.45 / 0.56 / 0.62-0.66) and the expression words differ between options.

Identity sources: Trema, `public/art/characters/trema/idle.png` (installed, Chapter XIII).
Gippal and Baralai, the **opaque** renders the installed shades were made from (Gippal
`gip-saw-963102`, the saw-blade repair of seed 951102; Baralai seed 961103), because the
installed `gippal-shade` / `baralai-shade` files carry the translucent blue shade treatment.

The cutout guard rejected the white-haired Trema pilots on a white ground; the options' cut-outs
passed (`--keepBad` kept the raws too).

## 3. The dialogue card

Each sheet's bottom row is the **real dialogue card at 1600x900**: the dev build (Vite, HMR off,
GPU browser) with the option served at `art/portraits/<id>.png` by a Playwright route and the id
added to the served `art/manifest.json`. Nothing on disk changed.

- **Gippal**: a true capture of his own line in Chapter V, reached by advancing the cutscene.
- **Baralai**: *staged*. His only line is mid-battle, so his option was served on Gippal's
  Chapter V line, with the name plate, the role tag (to his real tag, "New Yevon") and the line
  rewritten. Neither has a `face-crops.json` row, so both get the same fallback crop; the
  framing is the one he would get.
- **Trema**: *staged*. His lines play in the seam after Paragon falls, which the auto-battler
  could not reach (the party lost). His option was served on Paine's opening line with the name
  plate and line rewritten, the role tag removed (Trema has none), and `object-position` set to
  the unknown-id fallback (50% 29.5%) he would get.

No speaker here has a `face-crops.json` dialogue row. If one is picked, a measured row is owed.

## 4. Sheets and recommendations

Recommendations are **my own look (the agent that made them), not a judge and not Bailey.**

### trema — [trema/sheet.jpg](trema/sheet.jpg)

A (`opt2-a.1`, 0.45, profile, eyes half closed) and B (`opt2-b.1`, 0.56, three-quarter,
narrowed eyes) are the idle's own head: tall black eboshi with the white band and the red cord,
grey-green skin, long white moustache and flowing beard, white hair down the back, red and black
stole, ivory coat. Both stay in profile even at 0.66 (the `opt2-c` renders, not shown), which
is the style gap: the approved portraits face us, larger in the frame.

C (`opt4-front-0.5.2`, 0.50) faces us. It is img2img over the third txt2img pilot's frontal face
with the eboshi and its band **blocked in by hand** above the brow (the first block-in, `opt3-*`,
sat the band over the eyes and was discarded). Departures, disclosed: the beard is shorter and
the moustache dominates; the hat reads flat and a remnant of the pilot's helmet flares out at
its sides; the coat front has buttons the idle does not have. A masked repair is owed if picked.

The cards are staged (section 3); the empty role chip on them is the removed "Sphere Hunter"
text, which Trema's real card would not show at all.

**Recommendation (my look, not a judge, not Bailey): B.** It is the idle's face and hat exactly,
and the narrowed eyes carry the lines ("Memories are weights."). If a face-on portrait matching
the roster matters more than likeness, C, after the repair.

### gippal — [gippal/sheet.jpg](gippal/sheet.jpg)

A (0.45, confident smirk), B (0.56, cocky grin, head tilted), C (0.64, serious, looking at us).
All three hold the idle: spiky blond hair, black eyepatch over his right eye, green eye, blue
jumpsuit, purple straps, grey pauldron. Style gap, all three: the face is smaller in the frame
than the approved portraits' (the crop keeps his shoulder armour), and the card's cut-in shows
the face well but trims the hair spikes.

**Recommendation (my look, not a judge, not Bailey): A.** The smirk is his sourced read (the
idle's "confident smirk"), and it is the closest to the idle's own face.

### baralai — [baralai/sheet.jpg](baralai/sheet.jpg)

A (0.45, calm and serious), B (0.56, serious, eyes lowered), C (0.64, a faint gentle smile).
All three hold the idle: dark skin, brown eyes, swept-up silver hair, blue headband, green coat
with yellow trim and gold glyph panels, the golden staff head. Departure, all three: the idle's
"high collar rising to his chin" reads as a stand collar, not up to the chin. His staff sits in
frame on every option.

**Recommendation (my look, not a judge, not Bailey): B.** His one line is an apology after
Shuyin lets go of him ("...Forgive me. I was not myself."); lowered, serious eyes fit it.

### buddy and shinra — pilots only

**Buddy** — [buddy/sheet.jpg](buddy/sheet.jpg). **No painting of Buddy exists**, so there was
no IP-Adapter reference; identity is visual bible §1.23.7 `[single source]` only: an Al Bhed man
with dark blond hair, a purple shirt, and goggles worn on the eyes so his "eyes" are two bright
discs. Three txt2img renders (seeds 925601-925603), shown as the options A/B/C with no further
pass. Departure, disclosed: the **headset microphone** on all three is my addition for a comm
voice, not sourced. The cards are staged on Gippal's line (name plate, line, and no role tag).
The style reference on the sheet is the approved `brother-x2.png`, the other comm portrait.
**Recommendation (my look, not a judge, not Bailey): B** (seed 925602): the two lenses read as
bright discs at card size, which is the bible's silhouette test.

**Shinra — stopped (rule 15).** No painting exists; source is visual bible §1.23.7: ochre visor,
face never seen, no mouth, brown suit, lime mittens, blue collar. Two pilots of three each
([shinra/pilots-rejected.jpg](shinra/pilots-rejected.jpg)): the first showed hair and eyes
through the visor; the second hid the eyes but drew a mouth under a hood or helmet. Both fail the
one sourced rule (a featureless visor), so no options were made. Next try needs a different
method (for example a block-in of the visor shape and img2img), not more seeds.

## 5. GPU use

53 ComfyUI jobs, none black: Trema 26 (pilots 6, idle-crop options 12, front block-ins 8),
Gippal 6, Baralai 6, Buddy 3, Shinra 6 (two failed pilots). ComfyUI was never restarted. The 18
card captures used a private Vite server on port 5920 (HMR off, `PYREFLY_BROWSER=gpu`), stopped
afterwards.
