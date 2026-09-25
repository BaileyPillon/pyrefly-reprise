# Chapter XV: The Den of Woe, hero plate options (FFX-2 only)

**Option B is INSTALLED (2026-09-25, section below); this was the options round.** During that round no file under `src/`, `tests/`, `critic/`, `public/art/`
or `docs/target/` was written. `sheet.jpg` (one column, readable on a phone) shows each option
as a painting, on the real pause CHAPTER tab, and on the party-prep chapter card, at 1600x900.

**Game case (rule 14): FFX-2 only.** The Den, its shades and the Crimson Squad story exist
only in FFX-2 (`research/ffx2-gippal-den-of-woe.md`). The captures use an FFX-2 chapter's
screens. No option applies to an FFX chapter.

## INSTALLED 2026-09-25: option B (FFX-2 only)

Bailey, 2026-09-25 ~10:20 EDT, verbatim: "I'll go with all your recommendations", taken as a yes to this sheet's recommendation, **B**. A pick approves only what Bailey named, which here is the option as shown.

- `public/art/pause/ch15-ffx2-den-of-woe.png` is the picked option byte for byte (sha `e75589cda3db`); `ch15-ffx2-den-of-woe.2x.webp` is its master by the house route A, RealESRGAN_x4plus x4 then lanczos 0.5, WebP q88 (sha `297dadcdcaa8`); `ch15-ffx2-den-of-woe.json` carries the base render's recipe, the face focal this sheet used and the master note.
- Locked in `docs/target/approved-hashes.json`, set `bailey:2026-09-25-recommendations` (`verify-approved`: 185 ok before, 202 after, 0 mismatched, 0 missing).
- The chapter lives on branch `chapter-gippal-0925` with no `ChapterMeta`. **Ship step:** its `ChapterMeta` names `heroArt: 'pause/ch15-ffx2-den-of-woe'`; the face sits left (focal x 0.25), so the pause text side still needs checking on the real tab (this README's own note on `deriveChromeSide` / a `plates.ts` row).
- Backups: `D:/Tools/pyrefly-art-backup/approved/2026-09-25-recommendations/installed/pause/`; the options stay in `D:/Tools/pyrefly-art-backup/candidates/2026-09-25-hero-plates/gippal/`.
- The "Owed on a pick" list below is now done except the `ChapterMeta` line.

## The question for Bailey

Which painting should Chapter XV use on its chapter card and on the pause CHAPTER tab?

| | Option | What it shows | Files |
|---|---|---|---|
| **A** | Gippal's shade | Gippal close up, teeth clenched in anger. He is the picked O-1 B "translucent, lit from within": cold, the Den's light showing through him, pale motes inside. | `a-plate.jpg`, `a-pause.jpg`, `a-card.jpg` |
| **B** | The three shades | Gippal's shade on the left, angry. Nooj's and Baralai's shades stand behind him on the right, cold and dim. | `b-*.jpg` |
| **C** | Paine and her old squad's shades | Paine in full colour, eyes lowered and guarded. The three shades of her old comrades stand faded behind her on the left. | `c-*.jpg` |

**My recommendation is B.** You picked the three-shade chapter (D-148, GP1: "sorrow, anger,
despair as one idea"), and B is the only plate that shows all three. The card's right-hand
strip is also where B's Nooj and Baralai stand, so the card shows them.

**B's weak spot is the pause tab.** Gippal's face in B sits left of centre. The pause decides
which side its text goes on from the plate's own row in
`src/app/screens/pause/plates.ts`. The capture could only borrow Chapter V's row, which keeps
the text on the left, over his face. So `b-pause.jpg` shows his hair and Nooj. Installed with
its own row, B's text would move to the right (`deriveChromeSide`). That is not shown here.

- **Runner-up: A.** It reads best as one face on both surfaces, but it is one shade of three.
- **C is the story's heart:** the only survivors were Nooj, Baralai, Gippal and "their sphere
  recorder Paine" (research §2). It is the brightest on the pause tab. But Paine is a party
  member, not the boss, and the card's strip shows only cave rock.

A pick approves only the properties you name.

**Something all three share.** The O-1 B treatment makes a shade dim, and the pause tab dims
every plate again. A and B read darker on the tab than any shipped plate
(`ref-host-pause.jpg` is Chapter V's). If you want them brighter, that is a change to the
treatment, and it would be ours.

## What is sourced, and what is ours

**Sourced**

- Gippal's look:
  - **the patch is over his right eye**, blond spikes, green spiral-pupil eyes, a blue
    jumpsuit, grey armour;
  - source: `research/visual-bible.md` §1.23.5, `[single source]`.
- The shades are illusions made of pyreflies, formed from sorrow (Baralai), anger (Gippal) and
  despair (Nooj): research C-3, `[verified: 2]`.
- Paine was the squad's sphere recorder, one of the four who got out: research §2,
  `[single source: wiki, citing the Ultimania]`.
- The words shown in the captures are the decided ones: D-148 / GP2 for "The Den of Woe",
  "Den of Woe, under Mushroom Rock Road" and the number XV; GP1 for three links. Only this
  page's DOM was changed.
- The line-up and levels are Chapter V's, and they are this chapter's own (GP5).

**From installed CANDIDATE art**

- the shade treatment (O-1 B, `docs/concepts/chapters/gippal/scripts/shade.py`);
- Baralai's and Nooj's shade idles;
- the Den backdrop, with the picked O-3 A light.

**Ours**

- every composition;
- the expressions;
- the plate-scale changes to the treatment (below).

No game data is shown on the plates.

## How they were made

**Recipe.** The approved hero-plate recipe, as in `public/art/pause/*.json`:

- `tools/gen/comfy.mjs hero`: Animagine XL 4.0, 1344x768, 30 steps, cfg 6, euler_ancestral /
  normal, composition `hero`.
- Prompts and seeds are in `run.mjs`. The base renders' sidecars are in `renders/`.

**Gippal is rendered as the man, opaque and in full colour, in the cold Den.** He is never
rendered as a "ghost". The Yojimbo round learned that the word draws sheet ghosts.
`compose.py` then applies O-1 B to his isnet-anime matte over a blurred copy of the installed
Den backdrop.

**What changed in the treatment at plate scale.** `shade.py`'s numbers were tuned for a full
body 1,200 px tall. At head-and-shoulders size, the whole figure counts as "core", and the
verbatim treatment washed his face flat (`withdrawn-rolls.jpg`). So:

- the kernels scale by 3;
- the core glow is 0.5 of shade.py's;
- the line work keeps a 1.35 gamma;
- the cool tint is a little stronger;
- the alpha runs from 0.90 at the top to 0.62 at the bottom (was 0.80 to 0.50).

**Gippal's reference was skipped by the monochrome guard.** It was 44 % one colour against a
40 % limit, so his renders are prompt only, which is disclosed. Paine's run with her approved
plate's reference (the Warrior idle at 0.5).

**B's Gippal is a second render, mirrored.** As rendered, his patch sat on his left eye.
Mirrored, it is on his right, as sourced.

**The shade idles are never mirrored.** That keeps Gippal's patch on his right eye and Nooj's
machina arm on his left (bible §1.23.4). So in C they stand turned away from Paine.

**The pilot and the withdrawn rolls** (`withdrawn-rolls.jpg`):

- B's pilot grew the patch into a spiked disc with a glowing core.
- Paine's first rolls were small in frame, or had spiked orbs and eye make-up. The Den's
  "glowing orbs" words bound to the spikes in her words, so her background words became plain
  cave rock.

**GPU use.** 8 renders at 80 to 120 s each, with the queue shared with four art agents:

- A job was submitted only while fewer than 3 were pending.
- ComfyUI was never restarted, and no render came back black.

## In the game

- Our own Vite server ran on port 5821 (HMR off, no watcher, `PYREFLY_BROWSER=gpu`) and was
  stopped by its PID.
- Chapter XV is not registered, so the captures run Chapter V (`ffx2-vegnagun-shuyin`), whose
  line-up is this chapter's. Its plate URLs are answered with each option.
- Its words are swapped in the page DOM (`scripts/words.json`).
- The quote, the handwritten line, the tip, the subtitle and the snapshots do not exist yet,
  so they are blanked, not invented.
- The 2x masters served here are a lanczos upscale, not the RealESRGAN route.

## Off model and open, not fixed

- **A and B:**
  - Gippal's overalls and mortar are out of frame.
  - His teeth are bared. "Jaw clenched" drew a snarl.
  - The treatment greys his blond hair, as O-1 B does to the idle.
- **B:** Baralai is mostly behind Nooj.
- **C:**
  - Paine's cave wall on the right is flat and pinkish, from her render, not the Den backdrop.
  - Her top is the Warrior-style leather of her approved plate, not the Dark Knight she wears
    in this chapter (GP5).
  - The shades' idles are cropped at mid-body and fade out downward.

## Where the full-resolution files are

- The options (PNG and 2x WebP) and the three base renders:
  `D:/Tools/pyrefly-art-backup/candidates/2026-09-25-hero-plates/gippal/`.
- Everything else: `D:/Tools/pyrefly-scratch/hero-plates/gippal/`.

**Owed on a pick**

- the RealESRGAN 2x master;
- a `ChapterMeta` with `heroArt`, and a `plates.ts` shape row with its measured face (the
  integrator's job);
- installing to `public/art/pause/`.
