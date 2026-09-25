# Chapter XIV — Isaaru: hero plate options (FFX only)

**Option B is INSTALLED (2026-09-25, section below); this was the options round.** During that round no file under `src/`, `tests/`, `critic/`, `public/art/` or
`docs/target/` was written. `sheet.jpg` is one column that reads on a phone: each option as a
painting, on the real pause CHAPTER tab, and on the party-prep chapter card, both at 1600x900.

**Game case (rule 14): FFX only.** Isaaru's duel, his aeons and the Via Purifico exist only in
FFX; in FFX-2 he is a tour guide (research §0.3, §8.4). The captures use the FFX screens.

## INSTALLED 2026-09-25: option B (FFX only)

Bailey, 2026-09-25 ~10:20 EDT, verbatim: "I'll go with all your recommendations", taken as a yes to this sheet's recommendation, **B**. A pick approves only what Bailey named, which here is the option as shown.

- `public/art/pause/ch14-isaaru-via-purifico.png` is the picked option byte for byte (sha `1e2d6f56a1b1`); `ch14-isaaru-via-purifico.2x.webp` is its master by the house route A, RealESRGAN_x4plus x4 then lanczos 0.5, WebP q88 (sha `4efb21d1391f`); `ch14-isaaru-via-purifico.json` carries the base render's recipe, the face focal this sheet used and the master note.
- Locked in `docs/target/approved-hashes.json`, set `bailey:2026-09-25-recommendations` (`verify-approved`: 185 ok before, 202 after, 0 mismatched, 0 missing).
- The chapter lives on branch `chapter-isaaru-0925` with no `ChapterMeta`. **Ship step:** its `ChapterMeta` names `heroArt: 'pause/ch14-isaaru-via-purifico'`.
- Backups: `D:/Tools/pyrefly-art-backup/approved/2026-09-25-recommendations/installed/pause/`; the options stay in `D:/Tools/pyrefly-art-backup/candidates/2026-09-25-hero-plates/isaaru/`.
- The "Owed on a pick" list below is now done except the `ChapterMeta` line.

## The question for Bailey

Which painting should Chapter XIV use on its chapter card and on the pause CHAPTER tab?

| | Option | What it shows | Files |
|---|---|---|---|
| **A** | Isaaru in the last chamber | Isaaru close, topknot, dark coat with sea-green lapels and collar, red lamps behind. The summoner who holds the temple's word as law, even for Braska's daughter (§8.2 beat 5). | `a-plate.jpg`, `a-pause.jpg`, `a-card.jpg` |
| **B** | Yuna alone against his aeons | Yuna, jaw set, in the dark red chamber; Isaaru's Grothia (his Ifrit, with your O-4 C sea-green edge) looming at her shoulder. Only an aeon can fight an aeon, and she is alone. | `b-*.jpg` |
| **C** | He asks her pardon | Isaaru, eyes closed, hands together in prayer; his Spathi (his Bahamut) rising dark behind him. He asks her forgiveness before he summons (§8.2 beat 5). | `c-*.jpg` |

**My recommendation is B.** It is the only option that reads on both surfaces at a glance: the
pause tab crops to Yuna's set face, and the card's right-hand strip shows Grothia's horn and
snout. It is also the chapter's own idea, a contest of aeons with Yuna standing alone, and it
uses your O-4 C mark on the aeon, so the plate and the battle agree.

- **Runner-up: C**, if you want Isaaru himself on the tab. It tells the story best (the pardon)
  and shows one of his aeons. But its room is pale and warm, not the picked red chamber, and on
  the card Spathi is cropped away (the strip shows a lamp).
- **A is the boss plate**, like Chapter IX's Yojimbo. It is the most static of the three: a
  frontal bust with a faint, courteous smile rather than the sorrow you picked for his portrait
  (O-2 B), and nothing of the aeons.

A pick approves only the properties you name.

## What is sourced, and what is ours

- **Sourced** (`research/ffx-isaaru-bevelle.md`): Yuna faces him alone in the last chamber of the
  Via Purifico; he holds the temple's word as law and asks her pardon before summoning; his three
  aeons are Grothia (Ifrit), Pterya (Valefor), Spathi (Bahamut), one per link. The wiki's look
  for him: brown hair, a dark coat edged in sea green.
- **The picks used as references** (Bailey, 2026-09-25 ~01:40 EDT, "I'll go with all your
  recommendations", D-147): O-1 A (his look), O-2 B (his sorrowful portrait), O-3 A (the red-lit
  chamber), O-4 C (the sea-green edge and darker grade on his aeons). None of this chapter's art
  is in `docs/target/approved-hashes.json` yet (all CANDIDATE), so the references are the
  installed candidates of those picks.
- **Ours:** every composition and expression, the lamp shapes, the praying pose in C, where the
  aeons stand, the rims around them.
- No game data is shown on the plates.

## How they were made

**Recipe.** The approved hero-plate recipe, exactly (`public/art/pause/*.json`):
`tools/gen/comfy.mjs hero`, Animagine XL 4.0, 1344x768, 30 steps, cfg 6, euler_ancestral /
normal, composition `hero` (painted background kept, no rembg). Every prompt and seed is in
`run.mjs`; the chosen bases' sidecars are next to the candidates.

- **Isaaru (A, C):** his words are the installed idle's and portrait's. IP-Adapter on a
  head-and-shoulders crop of the installed portrait (`refs/isaaru-portrait-head.png`) at 0.35 ease
  in, 0.2 to 0.6 (the Macalania plate's head-crop setting), forced (`--forceRef`): the monochrome
  guard reads the crop at 44 % one colour, and the pilot without it (`a-932101`) lost the
  sea-green lapels.
- **Yuna (B):** the approved Yuna and Chapter II plates' identity words and negatives, her idle
  at 0.5 linear, 0.25 to 0.85, as those plates.

**Pilot, looked at 1:1 first.** `a-932101`: the red lamps were right, but a plain navy trench
coat and no reference. Forcing the reference brought the sea-green collar but green eyes and a
scowl, and the red was lost (`a-932102/3`); brown eyes, a gentle face and the crimson came back
with `a-932104..7`. **A = `a-932106`**, the closest crop.

- B's first two had amber lanterns; the crimson was weighted and warm light put in the
  negatives. **B = `b-932203`**, whose green and blue eyes sit as on the approved Yuna plates.
- C's first two hid his face or were lit green and white; a stronger crimson weight then broke
  two renders into a red grid texture (`c-932303/4`, withdrawn). **C = `c-932305`**, at a lighter
  weight: face visible, but a pale warm room.
- All 17 renders: `renders-all.jpg`.

**Composites (`compose.py`, installed pixels only, no paint).** As in the Yojimbo round, no
second figure was asked of the sampler. The aeons are the installed O-4 C paintings
(`public/art/characters/{grothia,spathi}/idle.png`), blurred for depth, behind the rendered
figure's isnet-anime matte.

**GPU.** 17 renders, one at a time, each submitted only when `/queue` had fewer than 3 pending
(the queue was shared with four other agents, 100 to 170 s each). No render came back black;
the two grid-textured ones came from the prompt weight and a lighter weight fixed them. ComfyUI
was never restarted. Nothing was downloaded.

## In the game

- Real GPU. Our own Vite server on port 5840, HMR off, stopped by its port. The capture script is
  shared with the Omnis round: `HP_KEY=isaaru node ../../omnis/hero-plate/scripts/shot.mjs <opt>`
  (a copy is in `scripts/`).
- Chapter XIV is not registered, so it has no `ChapterMeta`. Chapter I (FFX) hosts the captures:
  its plate URLs are answered with each option by Playwright request interception, with a face
  focal (`scripts/focal.json`).
- Chapter I's words are swapped in the page DOM only for Chapter XIV's adopted ones (D-147, plan
  B1): "XIV · Isaaru", "Via Purifico — beneath Bevelle" (`scripts/words.json`). The one objective
  shown, "Defeat Grothia, Pterya and Spathi", restates the three sourced links. The subtitle,
  blurb, quote, tip, snapshots and the other objectives do not exist yet: blanked, not invented.
- **Still Chapter I's:** the party (Tidus, Yuna, Kimahri; this chapter's is Yuna alone),
  "BOSS HP 100%", SCENE GAGAZET, the empty snapshot frames.
- The 2x masters served are a lanczos upscale, not the installed plates' RealESRGAN route.

## Off-model and open, not fixed

- A: a faint smile, not O-2 B's sorrow; a hard shadow down his nose; a red jewel at the collar
  that no source gives. The coat is a jacket with lapels, not the knee-length coat (the O-1 costume
  question stays open).
- B: Yuna's top is drawn plainer than on the approved plates, and the render's high-contrast,
  posterised look is harder than the approved Yuna plates.
- C: the room is pale and warm, not the picked deep red. A light hair strand crosses near his
  closed eye. A thin necklace is the model's. Spathi carries its O-4 C sea-green rim, drawn a
  little wider here as a halo.
- None of the three shows Pterya.

## Where the files are

- Candidates (option PNGs, lanczos 2x, sidecars, base renders):
  `D:/Tools/pyrefly-art-backup/candidates/2026-09-25-hero-plates/isaaru/`.
- Everything else: `D:/Tools/pyrefly-scratch/hero-plates/isaaru/`.

**Owed on a pick:** the 2x master by the RealESRGAN route; a `ChapterMeta` with `heroArt` for
Chapter XIV (the integrator's); installing to `public/art/pause/`.
