[Back to the changelog](../../CHANGELOG.md)

# 2026-10-04 · Release 38

Address: https://baileypillon.github.io/pyrefly-reprise/ (main 6461999e)

*Where a caption says left and right, the left picture comes first.*

- **Both:** the game is now called **Echoes of Spira**. It shows on the title card, the browser tab,
  the pause screen and the error screens. Saves from earlier builds still load.

  ![The title card before and after the rename, desktop](../screenshots/r38-rename/compare-title-1600x900.jpg)
  ![The title card before and after the rename, phone](../screenshots/r38-rename/compare-title-390x844.jpg)
  ![The pause screen before and after the rename](../screenshots/r38-rename/compare-pause-1600x900.jpg)

  *The title card before (left, release 37.1, Pyrefly Reprise) and after (right, the release 38 build, Echoes of Spira) on a desktop (first) and on a 390x844 phone (second), and the pause screen's header before and after (third).*

  ![The error screen under the new name](../screenshots/r38-rename/after-fatal-1600x900.png)

  *The error screen now reads ECHOES OF SPIRA (this is what a browser without WebGL 2 sees).*

  ![The live build's title card](../screenshots/release-38-live/title-1600x900.jpg)

  *The title card on the live build, checked after the deploy.*

- **Both:** 119 new paintings. They include the Yuna Thief, Rikku Warrior and Paine Thief dresspheres,
  which used to show stand-in figures. Also new: re-rolled poses, boss wind-ups, Lulu's Fury and 25
  sharper 2x versions.

  ![Yuna standing as a Thief](../screenshots/art-install-2026-10-04/ch6-yuna-thief-idle.jpg)
  ![Yuna's Change ring with Songstress and Thief](../screenshots/art-install-2026-10-04/ch6-yuna-change-submenu-songstress-thief.jpg)
  ![Yuna's twirl into the Thief outfit](../screenshots/art-install-2026-10-04/ch6-yuna-thief-twirl-forming.jpg)

  *Chapter VI, Yuna as a Thief: she stands with her daggers drawn (first), her Change ring offers Songstress and Thief (second), and the new outfit forms in mid-twirl under the "Yuna Thief" banner (third).*

  ![Rikku as a Dark Knight, downed](../screenshots/art-install-2026-10-04/ch4-rikku-dark-knight-ko.jpg)
  ![The possessed Bahamut's wind-up painting](../screenshots/art-install-2026-10-04/ch4-bahamut-wind-up-telegraph.jpg)

  *Chapter IV: Rikku in her new Dark Knight KO painting, lying beside Yuna the White Mage (first), and the possessed Bahamut's wind-up painting on the Mega Flare countdown (second).*

  ![The faces of the new dresspheres beside three established ones](img/release-38/new-dressphere-faces.jpg)

  *The faces of the new Yuna Thief, Rikku Warrior and Paine Thief paintings (top row) beside three established ones (bottom row), each on its measured eye line, as checked when they were installed.*

- **Both:** spells and shots fly to their target, and the damage number lands with the hit.

  ![Rikku's Darkness beam in flight](../screenshots/r38-mr-recheck/skill-travel-merged-ch4-beam.jpg)
  ![Yunalesca's orb in flight](../screenshots/r38-mr-recheck/skill-travel-merged-ch2-orb.jpg)

  *A skill in flight at 25, 50 and 75 percent of its travel: Rikku's Darkness beam crossing to Bahamut in Chapter IV (first, a 180 ms flight) and Yunalesca's orb to Auron in Chapter II (second, a 140 ms flight, staged).*

  ![Lulu's Thunder: the damage number before and after](../screenshots/r38-motion/numeral-ffx-lulu-thunder.jpg)
  ![Rikku's Darkness: the damage number before and after](../screenshots/r38-motion/numeral-ffx2-rikku-darkness.jpg)

  *The damage number lands with the hit: the live build above, the new look below. Chapter I, Lulu's Thunder on Seymour Flux (first): the number no longer sits over him before the bolt arrives. Chapter IV, Rikku's Darkness on Bahamut (second): a beam flies from Rikku instead of a slash drawn at the target, and the number lands with it.*

- **FFX-2:** a girl runs to the enemy for a plain Attack and runs home. LOW EFFECTS and REDUCE MOTION
  keep the old attack.

  ![Paine attacks Bahamut, before and after](../screenshots/r38-motion/run-in-ch4-paine-today-vs-look.jpg)
  ![Paine attacks the Vegnagun tail, before and after](../screenshots/r38-motion/run-in-ch5-paine-today-vs-look.jpg)

  *A plain Attack, the live build (left) and the new run-in (right): Paine at her stop in front of Bahamut in Chapter IV (first) and under Vegnagun's tail in Chapter V (second).*

  ![Paine's whole Attack in Chapter IV](../screenshots/r38-motion/run-in-ch4-paine-strip.jpg)

  *Paine's whole Attack in Chapter IV, 300 ms apart: the old attack from home (top row), and the run-in, the strike and the run home (bottom row).*

- **FFX:** Evrae is repainted with a longer neck, so its coil no longer swallows the party
  (Chapter VIII). On narrower windows the camera stands back.

  ![Chapter VIII's first menu, before and after](../screenshots/r38-evrae/first-menu-1600x900-live-vs-branch.jpg)
  ![Evrae's paintings, before and after](../screenshots/r38-evrae/paintings-installed-vs-rederived-1.jpg)

  *Chapter VIII's first menu at 1600x900: the live build above, where Evrae's coil runs in behind Tidus and Rikku, and the release 38 build below, with the longer neck and the party standing clear (first). Evrae's idle, attack and hurt paintings, the earlier ones on the left and the repainted ones with the longer neck on the right (second).*

  ![Chapter VIII's first menu on a phone, before and after](../screenshots/r38-evrae/first-menu-390x844-live-vs-branch.jpg)

  *The same menu on a 390x844 phone, before (left) and after (right): on narrower windows the camera stands back.*

  ![Chapter VIII's first menu on the live build](../screenshots/release-38-live/ch8-evrae-first-menu-1600x900.jpg)

  *Chapter VIII's first menu on the live build, checked after the deploy.*

- **FFX:** in Chapter II the party and Yunalesca no longer stand inside each other at the first menu.

  ![Chapter II's first menu, before and after](../screenshots/r38-mr-recheck/ch2-first-menu-live-vs-merged.jpg)

  *Chapter II's first menu, release 37.1 (left) and the release 38 build (right), at 1600x900 (top) and 2560x1080 (bottom): Yunalesca no longer overlaps the party.*

  ![Chapter II's first menu in the production build](../screenshots/release-38/ch2-first-menu-1600x900.jpg)

  *Chapter II's first menu in the release 38 production build: Yuna, Tidus and Auron on the left, Yunalesca on the right, nobody inside her.*

  ![Chapter II's first menu on the live build](../screenshots/release-38-live/ch2-yunalesca-first-menu-1600x900.jpg)

  *The same menu on the live build, checked after the deploy.*

- **FFX-2:** Chapters IV and XV get painted backdrop edges instead of mirrored copies, so lamps no
  longer appear doubled.

  ![Chapter IV backdrop edge, mirrored and painted](../screenshots/art-install-2026-10-04/wings-ch4-bevelle-2560x1080-enemy-right-edge.jpg)
  ![Chapter XV backdrop edge, mirrored and painted](../screenshots/art-install-2026-10-04/wings-ch15-den-2560x1080-party-left-edge.jpg)

  *The edges of the Chapter IV (Bevelle Underground) and Chapter XV (Den of Woe) backdrops on a 2560x1080 window. Before (left of each pair) the mirrored copy beyond the painted edge repeats the scene as a mirror image: a doubled lamp in Chapter IV, a chevron seam in Chapter XV. After (right) a painted wing continues the scene.*

  ![Chapter IV at 2560x1080 on the live build](../screenshots/release-38-live/ch4-plate-wings-2560x1080.jpg)

  *Chapter IV at 2560x1080 on the live build, checked after the deploy: the picture runs to both edges of the window.*

- **FFX:** Seymour Flux's Lance of Atrophy and Braska's Final Aeon's Ultimate Jecht Shot hold on a
  warning painting first.

  ![Seymour Flux's warning painting](../screenshots/art-install-2026-10-04/ch1-seymour-flux-telegraph-hold.jpg)

  *Chapter I: Seymour Flux holds on his new warning painting before the Lance of Atrophy lands (a hold of about 1.1 seconds).*

  ![Braska's Final Aeon, before and after the hold](../screenshots/r38-keys/bfa-hold-vs-today.jpg)

  *Braska's Final Aeon's Ultimate Jecht Shot in Chapter III, frames half a second apart from the lane's proof run: the build as it was above, the same move with the warning painting held first below.*

- **FFX:** Bushido plays the Overdrive you chose.

  ![Auron's four Bushido plates](img/release-38/bushido-four-sequences.jpg)
  ![Auron's Dragon Fang plate over a Chapter II fight](img/release-38/bushido-dragon-fang.jpg)

  *Auron's four Bushido plates, each with its own button sequence: Dragon Fang (8 buttons), Shooting Star (7), Banishing Blade (7) and Tornado (6), cropped from four frames of the proof run (first), and Dragon Fang's plate over a Chapter II fight (second).*

- **FFX:** a hurried opening of Chapter IX still plays the night-sakura arrival.

  ![A hurried opening of Chapter IX, before and after](../screenshots/r38-polish/foc371-01-hurried-arrival-before-after.jpg)

  *A hurried opening of Chapter IX: release 37.1 (top row) and the release 38 build (bottom row), at 0.45, 1.3 and 2.6 seconds after the card is gone, then the first menu. The night-sakura arrival now plays.*

  ![A tapped opening of Chapter IX, unchanged](../screenshots/r38-polish/foc371-01-tapped-opening-unchanged.jpg)

  *A tapped opening is unchanged: frames from 1.5 to 6 seconds in.*

- **FFX-2:** where no clean close shot exists, the dressphere-change shot pushes in instead.

  ![Paine's dressphere change in Chapter XIII](../screenshots/r38-pushin/trema-1280x720-paine-push-in.jpg)
  ![Yuna's dressphere change on a phone](../screenshots/r38-pushin/ch4-390x844-yuna-push-in-phone.jpg)

  *The push-in on a dressphere change. Chapter XIII at 1280x720 (first): Paine changes to Songstress and the shot pushes in on her, six frames from just before the change to the return. Chapter IV on a 390x844 phone (second): Yuna changes to White Mage and the shot pushes in, five frames from the first menu through the twirl.*

- **FFX-2:** the Trigger Happy bar and Lady Luck's reels sit above the enemy-intent card, with labels
  of at least 14 px.

  ![Trigger Happy's bar in Chapter IV, before and after](../screenshots/r38-polish/th-ch4-bahamut-1600x900-before-after.jpg)
  ![Trigger Happy's bar in Chapter V, before and after](../screenshots/r38-polish/th-ch5-vegnagun-1600x900-before-after.jpg)
  ![Lady Luck's reels, before and after](../screenshots/r38-polish/ladyluck-reels-1600x900-before-after.jpg)

  *Trigger Happy's bar in Chapter IV (first) and Chapter V (second), and Lady Luck's reels (third). Each picture has four panels: release 37.1 on the left, the release 38 build on the right. The bottom row parks the enemy-intent card over the bar or the reels: it used to cover them, and now they sit on top.*

- **Both:** the move advisor's card keeps its effect and number lines in the big-boss layouts, and the
  "Guide's pick" tag is gone.

  ![The advisor card in Chapter IV's big-boss layout](../screenshots/r38-advisor-card/ch4-ffx2-bahamut-1600x900-target-before-after.jpg)
  ![The advisor card in Chapter III's big-boss layout](../screenshots/r38-advisor-card/ch3-bfa-1600x900-target-before-after.jpg)
  ![The advisor card in Chapter IX's big-boss layout](../screenshots/r38-advisor-card/ch9-yojimbo-1600x900-target-before-after.jpg)

  *The advisor card at the target step in the big-boss layouts of Chapter IV (first), Chapter III (second) and Chapter IX (third). In each strip the left panel is the layout the card should match, the middle panel is the build before this change, and the right panel is the build with it: the card keeps its effect and number lines (for example "It puts Shell on the party.") where it used to shrink to a name and a cost. The "Guide's pick" tag still shows in these frames; it was removed by a separate change in the same release.*

  ![Chapter IV's first menu in the production build, with no Guide's pick tag](../screenshots/release-38/ch4-first-menu-1600x900.jpg)

  *Chapter IV's first menu in the release 38 production build: the advisor card at the bottom centre carries no Guide's pick tag.*

- **Both:** smaller downloads. Art ships as lossless WebP wherever every browser draws the same
  pixels, and every image is load-tested in Chromium and WebKit before a deploy.

- **Both:** the title key art loads from the right address in every build.

  ![The title's painted key art on a desktop](../screenshots/release-38-live/title-1600x900.jpg)
  ![The title's painted key art on a phone](../screenshots/release-38-live/title-390x844.jpg)

  *The title's painted key art on the live build, desktop (first) and 390x844 phone (second), checked after the deploy.*
