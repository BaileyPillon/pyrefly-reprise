# Chapter XIII: Trema, hero plate options (FFX-2 only)

**Option B is INSTALLED (2026-09-25, section below); this was the options round.** During that round no file under `src/`, `tests/`, `critic/`, `public/art/`
or `docs/target/` was written. `sheet.jpg` (one column, readable on a phone) shows each option
as a painting, on the real pause CHAPTER tab, and on the party-prep chapter card, at 1600x900.

**Game case (rule 14): FFX-2 only.** Trema, Paragon and Cloister 100 exist only in FFX-2
(`research/ffx2-trema.md` §0). The captures use an FFX-2 chapter's pause and prep screens. No
option applies to an FFX chapter.

## INSTALLED 2026-09-25: option B (FFX-2 only)

Bailey, 2026-09-25 ~10:20 EDT, verbatim: "I'll go with all your recommendations", taken as a yes to this sheet's recommendation, **B**. A pick approves only what Bailey named, which here is the option as shown.

- `public/art/pause/ch13-trema.png` is the picked option byte for byte (sha `df51b9efa1e1`); `ch13-trema.2x.webp` is its master by the house route A, RealESRGAN_x4plus x4 then lanczos 0.5, WebP q88 (sha `770241cc0f58`); `ch13-trema.json` carries the base render's recipe, the face focal this sheet used and the master note.
- Locked in `docs/target/approved-hashes.json`, set `bailey:2026-09-25-recommendations` (`verify-approved`: 185 ok before, 202 after, 0 mismatched, 0 missing).
- `src/data/chapter-meta-trema.ts` already names `heroArt: 'pause/ch13-trema'`, so the chapter card and the pause CHAPTER tab show it now (checked on a production build, frames in `docs/concepts/portraits-2026-09-25/installed/ch13-*.jpg`). That file's header comment still says no plate is approved; it belongs to the chapter's owner to update.
- Backups: `D:/Tools/pyrefly-art-backup/approved/2026-09-25-recommendations/installed/pause/`; the options stay in `D:/Tools/pyrefly-art-backup/candidates/2026-09-25-hero-plates/trema/`.
- The "Owed on a pick" list below is now done (the `ChapterMeta` already existed).
- **Seen on the real tab, not fixed (pause layout, not this plate):** the real chapter now has its quote ("Memories are weights...") and three snapshot tiles, which the options round blanked. On the pause CHAPTER tab they sit over Trema's eyes; the plate cannot pan further (its left edge is already within 73 px of the clamp), so moving the face clear is a layout question for the pause owner.

## The question for Bailey

Which painting should Chapter XIII use on its chapter card and on the pause CHAPTER tab?

| | Option | What it shows | Files |
|---|---|---|---|
| **A** | Trema alone on Cloister 100 | Trema close up, calm and certain, eyes half closed. Behind him is the cold teal hall with blurred lamps. | `a-plate.jpg`, `a-pause.jpg`, `a-card.jpg` |
| **B** | Trema over the beaten Paragon | Trema looks down with contempt. Paragon's gold, horned head lies low at his side, breaking into pyreflies. This is the link beat, when the old man destroys Paragon (research §2 step 2). | `b-*.jpg` |
| **C** | Yuna facing Trema | Yuna (Gunner) close up, resolute. Trema stands behind her in the gloom, turned toward her. | `c-*.jpg` |

**My recommendation is B.** It is the only option that shows the chapter's own story beat:
the old man appears and breaks the champion. It also reads on both surfaces:

- On the pause tab, the plate is cropped to one face, and in B that face is Trema's.
- On the card's right-hand strip, B is the only option whose strip shows something:
  Paragon's gold crown coming apart. In A the strip is blurred lamps, and in C it is a pillar.

B's Trema is also the most on model of the three:

- the ivory coat with the red stole;
- the grey-green skin;
- the tall black eboshi with its band.

- **Runner-up: A.** It shows the most of his face. It is a portrait, but it tells nothing of
  the fight.
- **C keeps the house pattern**, with a party member's face and the boss behind her, as in the
  Chapter II plate. Trema is small and dim in C, and the card shows neither of them.

A pick approves only the properties you name.

## What is sourced, and what is ours

**Sourced**

- Trema's look, "an old man in a torn Yevon priest's robe": research §6.2, `[single source: wiki]`.
- The link beat, "Paragon falls; the old man ... destroys Paragon": research §2 step 2,
  `[verified: 3 sources]`.
- The words shown in the captures are the decided ones: D-146 / TR17 for the title "Trema",
  the number XIII and "Via Infinito, Cloister 100"; TR10 for the line-up at Lv 99. Only this
  page's DOM was changed.

**From our own installed CANDIDATE art**

- Trema's words and look come from his installed idle (`public/art/characters/trema/idle.png`,
  the O-1 A pick): what that idle actually shows.
- Paragon's pixels come from its installed idle (O-2 A).
- The hall's teal light is the picked O-3 B.

**Ours**

- every composition;
- Trema's expressions;
- the pyrefly dissolve and the motes, which use the visual bible's `--pyre-green` and `--pyre-white`;
- Yuna's resolve in C.

No game data is shown on the plates, and Yu Yevon's likeness is not painted (D-146).

## How they were made

**Recipe.** The approved hero-plate recipe, as in the sidecars in `public/art/pause/*.json`:

- `tools/gen/comfy.mjs hero`: Animagine XL 4.0, 1344x768, 30 steps, cfg 6, euler_ancestral /
  normal, composition `hero`. The painted background is kept, with no rembg.
- Every prompt and seed is in `run.mjs`. The sidecars of the three base renders are in `renders/`.

**References.** The IP-Adapter reference for Trema is a square crop of his idle's head
(`refs/`), flattened on a blurred crop of the Via Infinito backdrop.

- The monochrome guard in `comfy.mjs` skipped it: 61 % one colour. His white robe and black hat
  read as near-monochrome to the guard.
- Forcing the reference, as the Yojimbo round did (`af-1301002`, in `withdrawn-rolls.jpg`),
  turned his green skin pale. So A and B are prompt only, which is disclosed.
- C uses Yuna's approved plate reference and words (`public/art/pause/yuna-ffx2.json`, the
  Gunner idle at 0.35).

**Pilot.** The pilot (`a-1301001`) was looked at 1:1 before the batch. It had a green robe,
red banners and a frontal pose. Four fixes followed:

1. The robe words and the "front view" negatives were fixed.
2. Crosses appeared, so "cross, crucifix" went into the negatives (his idle carries the same
   negatives).
3. "Green clothes" negatives also removed his green skin, so they were taken back out.
4. B needed "ivory white coat" to stop a black robe.

**Second figures are composited, never prompted (method r3, as in the Yojimbo round).**
`compose.py` builds them from existing pixels:

- **B.** Paragon's head and forequarters come from its idle. They are lowered by 10 degrees and
  placed behind Trema's hardened isnet-anime matte. Fine noise breaks the head up from behind
  the eyes, with motes at the breaking edge and above it.
- **C.** Trema's upper body comes from his idle, mirrored so that he faces Yuna, then blurred
  and cooled.
- **C's Yuna render is mirrored.** As rendered, her green eye was her right. Mirrored, her
  right eye is blue and her left is green, the words of her approved Chapter IV plate. Her
  braid then falls on the viewer's left, as on her approved FFX-2 plate.

**GPU use.** 28 jobs at 20 to 120 s each, with the queue shared with four art agents:

- A job was submitted only while fewer than 3 were pending. A gate that counted the running
  job too never opened, so it was dropped; see `run.mjs`.
- ComfyUI was never restarted, and no render came back black.
- One job (`b-1302005`) was rendered twice because a waiting loop was stopped. Its file was
  recovered from ComfyUI's own output folder.

## In the game

- Our own Vite server ran on port 5821 (HMR off, no watcher, `PYREFLY_BROWSER=gpu`) and was
  stopped by its PID. The scripts are in `scripts/`.
- Chapter XIII is not registered, so the captures run Chapter IV (`ffx2-bahamut`, FFX-2).
  Playwright request interception answers its plate URLs (`pause/ch4-ffx2-bahamut.png`,
  `.2x.webp`, `.json`) with each option. The `.json` carries a face focal.
- Chapter IV's words are swapped for Chapter XIII's decided ones (`scripts/words.json`).
- The quote, the handwritten line, the tip, the subtitle and the snapshots do not exist yet,
  so they are blanked, not invented. "Defeat Trema" is the one objective shown.
- `ref-host-pause.jpg` is Chapter IV's own approved plate on the same tab.
- **Still Chapter IV's:** the pause's battle behind the tab (Bahamut's HUD is hidden by the
  pause), the dressphere counts on the prep cards, and the party portraits.
- The 2x masters served here are a lanczos upscale, not the RealESRGAN route of the installed
  plates.

## Off model and open, not fixed

- **The torn robe does not show on any plate.** It is sourced, but it is at the hem, and
  every plate is head and shoulders.
- **A:**
  - His ear stays pink while his face is grey-green (`crops-1to1.jpg`).
  - The beard is lit strongly blue.
  - The lamps are large round bokeh, which reads less as a cloister than B does.
  - The crest on his chest is a gold ring, not the round red disc.
- **B:**
  - The dark fur in Paragon's dissolve shows as dark specks.
  - Only Paragon's head is on the plate.
  - The stole has a pattern, which is ours.
- **C:**
  - Yuna wears the Gunner dressphere, as her approved FFX-2 plates do, not TR10's Dark Knight.
    The Dark Knight idle on disk is not a close-up reference.
  - The pillar on the right comes from the render and is not the Cloister.

## Where the full-resolution files are

- The options (PNG and 2x WebP) and the three base renders:
  `D:/Tools/pyrefly-art-backup/candidates/2026-09-25-hero-plates/trema/`.
- Everything else, including every render and log: `D:/Tools/pyrefly-scratch/hero-plates/trema/`.

**Owed on a pick**

- the 2x master by the RealESRGAN route;
- a `ChapterMeta` with `heroArt` for Chapter XIII (the integrator's job);
- installing to `public/art/pause/`.
