# Chapter XII — Seymour Omnis: hero plate options (FFX only)

**Option A is INSTALLED (2026-09-25, section below); this was the options round.** During that round no file under `src/`, `tests/`, `critic/`, `public/art/` or
`docs/target/` was written. `sheet.jpg` is one column that reads on a phone: each option as a
painting, on the real pause CHAPTER tab, and on the party-prep chapter card, both at 1600x900.

**Game case (rule 14): FFX only.** Seymour Omnis, the Mortiphasm discs and the Garden of Pain
exist only in FFX (research §0.3). The captures use the FFX pause and the FFX prep screen.

## INSTALLED 2026-09-25: option A (FFX only)

Bailey, 2026-09-25 ~10:20 EDT, verbatim: "I'll go with all your recommendations", taken as a yes to this sheet's recommendation, **A**. A pick approves only what Bailey named, which here is the option as shown.

- `public/art/pause/ch12-seymour-omnis.png` is the picked option byte for byte (sha `906175aeff12`); `ch12-seymour-omnis.2x.webp` is its master by the house route A, RealESRGAN_x4plus x4 then lanczos 0.5, WebP q88 (sha `cd8691fc7894`); `ch12-seymour-omnis.json` carries the base render's recipe, the face focal this sheet used and the master note.
- Locked in `docs/target/approved-hashes.json`, set `bailey:2026-09-25-recommendations` (`verify-approved`: 185 ok before, 202 after, 0 mismatched, 0 missing).
- The chapter lives on branch `chapter-omnis-0925` with no `ChapterMeta`. **Ship step:** its `ChapterMeta` names `heroArt: 'pause/ch12-seymour-omnis'`.
- Backups: `D:/Tools/pyrefly-art-backup/approved/2026-09-25-recommendations/installed/pause/`; the options stay in `D:/Tools/pyrefly-art-backup/candidates/2026-09-25-hero-plates/omnis/`.
- The "Owed on a pick" list below is now done except the `ChapterMeta` line.

## The question for Bailey

Which painting should Chapter XII use on its chapter card and on the pause CHAPTER tab?

| | Option | What it shows | Files |
|---|---|---|---|
| **A** | Seymour Omnis, close | His face in three-quarter view, the cold smile, long straight light-blue hair, indigo spiked shoulders, the deep violet garden behind. "He has claimed Sin": calm, cold, certain. | `a-plate.jpg`, `a-pause.jpg`, `a-card.jpg` |
| **B** | Yuna sends him | Yuna, eyes lowered, quiet resolve; Omnis fading behind her shoulder. The pay-off of all four Seymour chapters: this time she sends him (research §8.2 beat 5). | `b-*.jpg` |
| **C** | The red glow: Ultima is coming | Omnis head-on, scowling, lit red from behind, great crimson-edged crescents at his shoulders; two discs in the top corners with the orange Fire quarter turned at him. The fight's warning (six hits, the glow, then Dispel and Ultima). | `c-*.jpg` |

**My recommendation is A.** It is the one closest to the art you already picked: straight
light-blue hair, pale grey-blue skin, purple eyes and the indigo spiked shoulders of the installed
O-1 A idle and Omnis portrait. It also carries Seymour's signature, the cold smile, which Chapter
VII's approved Macalania plate uses too. On the pause tab the tab crops tightly to one face, and
that face is his.

- **Runner-up: C.** It has the strongest pause read of the three: the crimson crescents frame his
  face. The red glow is the one sourced visual cue of the fight. But the head-on armour and the
  crescents are the model's own, not your O-1 A pick (the look-only pass did see "large crescent
  blade shapes" on the game's Omnis, `../INSTALLED.md`, so C is closer to the game and further from
  the pick). The discs show on neither surface: both crop them away.
- **B tells the story**, and keeps the house pattern of a party face with the boss behind
  (Chapter II's Yuna). But on the pause tab it reads as a Yuna plate, and Omnis shows only as a
  ghost at the card's right edge.

A pick approves only the properties you name. You can mix, for example A's face with C's red glow
as a second grade: a finals question, not a new round.

## What is sourced, and what is ours

- **Sourced** (`research/ffx-seymour-omnis.md`): he glows red after six attacks (three below
  20,000 HP), then Dispel, then Ultima; four discs with orange Fire, purple Ice, blue Water, yellow
  Thunder quarters, all on Fire at the start; he kneels and Yuna sends him, pyreflies rising.
- **The picks used as references** (Bailey, 2026-09-25 ~01:40 EDT, "I'll go with all your
  recommendations", D-145): O-1 A (his look), O-3 C (deep violet), B17 c (the new Omnis portrait).
  None of this chapter's art is in `docs/target/approved-hashes.json` yet (all CANDIDATE,
  `../INSTALLED.md`), so the references are the installed candidates of those picks.
- **Ours:** every composition and expression, A's and C's armour detail, C's crescents and its
  frontal pose, the ghost treatment in B, where the discs sit in C, the floating motes.
- No game data is shown on the plates.

## How they were made

**Recipe.** The approved hero-plate recipe, exactly (`public/art/pause/*.json`):
`tools/gen/comfy.mjs hero`, Animagine XL 4.0, 1344x768, 30 steps, cfg 6, euler_ancestral /
normal, composition `hero` (painted background kept, no rembg). Every prompt and seed is in
`run.mjs`; the chosen bases' sidecars are next to the candidates.

- **Omnis (A, C):** his words are the installed idle's and portrait's. IP-Adapter on a
  head-and-shoulders crop of the installed portrait (`refs/omnis-portrait-head.png`) at 0.35 ease
  in, 0.2 to 0.6: the Macalania plate's head-crop setting.
- **Yuna (B):** her identity words and negatives are the approved Yuna and Chapter II plates'.
  IP-Adapter on her idle at 0.5 linear, 0.25 to 0.85, exactly as those plates.
- **Both references were forced (`--forceRef`)**, as the Yojimbo round's a4 was. The monochrome
  guard (added after the approved plates) read the Omnis crop at 42 % one colour and rendered the
  first pilots without it. Yuna's idle was forced from the start, so her plate uses the reference
  the approved Yuna plates used. At 1:1 neither shows colour burn (`crops-1to1.jpg`).

**Pilot, looked at 1:1 first.** `a-931101` (reference skipped by the guard) drew a girl with bangs.
The masculine face, forehead and veins went into the words; `a-931102/3` were male but frontal and
wavy; forcing the reference gave the portrait's sleek straight hair (`a-931104`), and the violet
and the spiked shoulders came with `a-931106..8`. **A = `a-931107`.**

- B's first two drew big bubbles and a pale ground; the orbs became "tiny motes" and the violet
  was weighted. B's order of the eyes varied by seed; **B = `b-931208`**, the one whose green and
  blue eyes sit as on the approved Yuna plates.
- C's first round ("from below") cut his hair short and added forehead horns; withdrawn. The
  second dropped the camera words; **C = `c-931306`**.
- All 23 renders: `renders-all.jpg`.

**Composites (`compose.py`, installed pixels only, no paint).** The Yojimbo round showed that a
second figure's words bind to the first, so no second figure was asked of the sampler.

- B: Omnis from his installed O-1 A idle (head, chest, near shoulders), blurred, tinted violet,
  fading out downward as if into pyreflies, behind Yuna's isnet-anime matte.
- C: two installed discs with their facing layer, the Fire quarter turned toward him, in the top
  corners behind his matte. The matte does not hold the outer crescents, so the discs stay above
  them.

**GPU.** 23 renders, one at a time, each submitted only when `/queue` had fewer than 3 pending
(the queue was shared with four other agents; about 10 to 160 s each). No render came back black.
ComfyUI was never restarted. Nothing was downloaded; the mattes use the installed `isnet-anime`.

## In the game

- Real GPU (`PYREFLY_BROWSER=gpu`). Our own Vite server on port 5840, HMR off, stopped by its
  port. Scripts: `scripts/serve.mjs`, `scripts/shot.mjs` (`HP_KEY=omnis`).
- Chapter XII is not registered, so it has no `ChapterMeta`. Chapter I (FFX) hosts the captures:
  its plate URLs (`pause/ch1-seymour-flux.png`, `.2x.webp`, `.json`) are answered with each option
  by Playwright request interception, with a face focal in the `.json` (`scripts/focal.json`).
- Chapter I's words are swapped, in the page DOM only, for Chapter XII's adopted ones (D-145, plan
  B1): "XII · Seymour Omnis", "Inside Sin — the Garden of Pain" (`scripts/words.json`). Its
  subtitle, blurb, quote, tip, snapshots and first two objectives do not exist yet, so they are
  blanked, never invented. "Defeat Seymour Omnis" is the one objective the sources support.
- **Still Chapter I's:** the party (Tidus, Yuna, Kimahri; Chapter XII's is Tidus, Yuna, Auron,
  B2), "BOSS HP 100%", SCENE GAGAZET, and the empty snapshot frames on the card.
- The 2x masters served are a lanczos upscale, not the installed plates' RealESRGAN route.

## Off-model and open, not fixed

- A: his right eye (viewer's right) sits in shadow and reads grey at 1:1. No veins under the eyes,
  though the words ask for them. The shoulders are a cloak collar with spikes, not the idle's.
- B: Yuna's top reads as a crossed white wrap. A pale light swoop crosses the left side (the
  approved Yuna plate's negatives name "abstract swoop"; it survived). A white nose highlight.
- B: Omnis behind her is his idle's pixels, so he carries the idle's red shoulder spiral, flagged
  at O-1.
- C: the frontal armour, red trim and the crescents are the model's, not the O-1 A pick. He
  scowls; the sources give no expression.
- C: the discs sit in the corners (two each side is the picked staging, O-2 B). Neither surface
  shows them.

## Where the files are

- Candidates (option PNGs, lanczos 2x, sidecars, base renders):
  `D:/Tools/pyrefly-art-backup/candidates/2026-09-25-hero-plates/omnis/`.
- Everything else (all renders, mattes, shots): `D:/Tools/pyrefly-scratch/hero-plates/omnis/`.

**Owed on a pick:** the 2x master by the RealESRGAN route; a `ChapterMeta` with `heroArt` for
Chapter XII (the integrator's); installing to `public/art/pause/`.
