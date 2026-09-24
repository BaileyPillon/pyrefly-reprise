# Seymour's Macalania speaker portrait: options (FFX only)

This is an options round (AGENTS.md rule 9). Nothing here ships and nothing was installed into
`public/art`. Chapter VII (`seymour-anima-macalania`) currently borrows
`public/art/portraits/seymour.png`, the Flux-era face from Chapter I: a fan-shaped hair crest
and a smiling three-quarter look. The r3 battle idle (from Bailey's concept pick B) has long,
loose light-blue hair and a stern profile. Plan item (e) in
`docs/plans/chapter-macalania-finish.md` asks whether this chapter needs its own portrait.
**Pick A, B or C from [`options.jpg`](options.jpg), or keep the shared portrait.**

**Game case: FFX only.** This is Chapter VII, and the sources are
`research/ffx-seymour-anima-macalania.md` §9.2 and the r3 idle.

## What is on the sheet

- Each row puts two approved FFX speaker portraits (Auron and Yunalesca) beside one option. All
  three are shown at the full 832x1216 frame, at the same size, on the same neutral grey. The
  last row is the current shared portrait, for comparison.
- Beside each row is the **real dialogue card at 1600x900**: `card-A.jpg`, `card-B.jpg`,
  `card-C.jpg`, plus `card-current.jpg` for the shared portrait. These are captures of the
  running dev build on Seymour's first line, "Guardians. You are early." The build was reached
  with `window.__pyrefly.gotoChapter('seymour-anima-macalania')` in a GPU browser. The option was
  served at `art/portraits/seymour.png` through a Playwright network route. Nothing under `src/`
  or `public/art` was touched.
- Every option was framed so that its eye lands where the existing `seymour` crop row expects it
  (`face-crops.json`: fx 0.345, fy 0.347). That means the cards use the real crop and need no
  new crop row.

## Method (METHOD-CHECK r3: derive from the at-bar pixels)

All three options start from the **idle's own pixels**. No option is a fresh render.

1. The head and shoulders of `public/art/characters/seymour-macalania/idle.png` are cropped
   (the visible eye is at (355, 82)) and padded onto white.
2. The crop is upscaled in the ComfyUI graph with RealESRGAN x4 and scaled to 832x1216.
3. That image goes to img2img with the approved portrait recipe: `buildCharacterPrompt` with
   `composition portrait` and `facing none`, the house STYLE, QUALITY and `SPRITE_NEGATIVE`
   blocks, Animagine XL 4.0 Opt, 28 steps, CFG 6, euler_ancestral/normal, and a rembg cut-out
   with a 16 px margin, re-padded to the full canvas.
4. IP-Adapter is at the pipeline defaults (0.3, ease in, 0.2 to 0.6). Its reference is the idle's
   own head-and-shoulders crop, not the full figure.

The ear stays rounded and human (research §9.2), as it is on the idle. Only the denoise, the
crop scale and the expression words differ between options.

| | What it tries | Denoise, scale | On canon | Departures, disclosed |
|---|---|---|---|---|
| **A** Idle likeness | The battle idle's face and stern profile, read as a portrait | 0.45, 3.8x | light-blue loose hair, fringe, purple eye, rounded human ear, dark blue robe, red collar, red chest tattoo | no visible facial veins (research: "pronounced"; the idle shows none at its size) |
| **B** Close, cold glare | Tighter; narrowed eyes, with the fight's cold fury | 0.52, 4.4x | the same, plus faint veins on the brow and cheek | veins are faint, not pronounced; the ear reads a little large |
| **C** Cold smile, wider | Wider, with the crossed arms; the eye turns slightly toward us; faint smile | 0.62, 3.3x | the same, crossed arms from the idle | **a small dark studded collar at the throat that is not on the idle** (masked repair owed if picked); no veins |

**Style gap, all three:** the options carry the idle's heavy black cel shadows and flat pale skin.
The approved portraits (see the sheet) are rendered more softly. Only A holds the idle's
identity exactly; the gap grows with denoise.

**Pilot and GPU use.** B went first and was looked at 1:1 before A and C. C was tried three
times (seeds 770301 at 0.62, 770302 at 0.70, 770303 at 0.64); after that, re-rendering
stopped.
- At 0.70 the face turned to the viewer, but the render grew a **pink hair patch**, a red mark
  under the eye and a shredded robe.
- 0.64 removed the collar, but **red face markings** appeared: the chest-tattoo colour bound to
  the face. Research §9.2 says veins, not markings.
- 0.62 is on the sheet, with its collar disclosed.

Five prompts ran, one at a time, each after the shared queue had been empty for 3 minutes. They
used **80 s of ComfyUI time** (the cap was 30 min). There were no black frames and ComfyUI was
never restarted.

The candidate PNGs, raw renders, sidecars (seed, prompt, negative, init, reference, time) and the
scratch driver `gen.mjs`, card capture `card.mjs` and `sheet.py` are in
`D:/Tools/pyrefly-art-backup/candidates/2026-09-24-seymour-macalania-portrait/`. They are not in
the repo.

## Question for Bailey: the speaker id

Chapter I's `seymour-flux.ts` also speaks as `'seymour'`, so the Flux portrait has to stay under
that id. **Recommendation: a new speaker id, `seymour-macalania`,** used by the 15
`say('seymour', ...)` lines in `src/story/scripts/seymour-anima-macalania.ts`, with the new
portrait at `public/art/portraits/seymour-macalania.png`. It follows the `yuna-x2`/`brother-x2`
pattern and needs:

- a `SpeakerId` entry in `src/story/dsl.ts`, which is a shared contract, so it also gets a
  `docs/CONTRACT-CHANGES.md` entry;
- `DialogueBox.defaultName` to strip `-macalania`, so the plate still reads "Seymour";
- a `speaker-roles.ts` row, `'seymour-macalania': 'Maester'`;
- a `face-crops.json` row, which can copy `seymour`'s fx/fy because the options were framed to
  match it.

The alternative is to keep the shared portrait for both chapters. He is the same person, but
Chapter VII's battle sprite no longer looks like the Flux portrait.
