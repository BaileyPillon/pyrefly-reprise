# Echoes of Spira — changelog

Every build that goes live or to a preview, newest first. FFX, FFX-2 or both tells you which game a
change touches. Engineering detail lives in `docs/handoff/release-NN.md`.

## 2026-10-04 · Cloudflare preview (release 38)

Address: https://echoes-of-spira-preview.baileypillon.workers.dev

- **Both:** release 38, unchanged, served from Cloudflare for the first time. It is the same files as
  the live build, served from the site root, and all 1,932 files were checked byte for byte after the
  upload.
- **Both:** saves are kept per address, so this preview starts with no saves. GitHub Pages keeps its
  own.

## 2026-10-04 · Release 38

Address: https://baileypillon.github.io/pyrefly-reprise/ (main 6461999e)

- **Both:** the game is now called **Echoes of Spira**. It shows on the title card, the browser tab,
  the pause screen and the error screens. Saves from earlier builds still load.
- **Both:** 119 new paintings. They include the Yuna Thief, Rikku Warrior and Paine Thief dresspheres,
  which used to show stand-in figures. Also new: re-rolled poses, boss wind-ups, Lulu's Fury and 25
  sharper 2x versions.
- **Both:** spells and shots fly to their target, and the damage number lands with the hit.
- **FFX-2:** a girl runs to the enemy for a plain Attack and runs home. LOW EFFECTS and REDUCE MOTION
  keep the old attack.
- **FFX:** Evrae is repainted with a longer neck, so its coil no longer swallows the party
  (Chapter VIII). On narrower windows the camera stands back.
- **FFX:** in Chapter II the party and Yunalesca no longer stand inside each other at the first menu.
- **FFX-2:** Chapters IV and XV get painted backdrop edges instead of mirrored copies, so lamps no
  longer appear doubled.
- **FFX:** Seymour Flux's Lance of Atrophy and Braska's Final Aeon's Ultimate Jecht Shot hold on a
  warning painting first.
- **FFX:** Bushido plays the Overdrive you chose.
- **FFX:** a hurried opening of Chapter IX still plays the night-sakura arrival.
- **FFX-2:** where no clean close shot exists, the dressphere-change shot pushes in instead.
- **FFX-2:** the Trigger Happy bar and Lady Luck's reels sit above the enemy-intent card, with labels
  of at least 14 px.
- **Both:** the move advisor's card keeps its effect and number lines in the big-boss layouts, and the
  "Guide's pick" tag is gone.
- **Both:** smaller downloads. Art ships as lossless WebP wherever every browser draws the same
  pixels, and every image is load-tested in Chromium and WebKit before a deploy.
- **Both:** the title key art loads from the right address in every build.

## 2026-10-03 · Release 37.1

Address: https://baileypillon.github.io/pyrefly-reprise/ (main f4244e1f)

- **FFX-2:** Trigger Happy counts Enter, touch and gamepad presses, not only the R key.
- **FFX:** in Chapter IX, Yojimbo and Daigoro appear at the first menu after a hurried opening.
