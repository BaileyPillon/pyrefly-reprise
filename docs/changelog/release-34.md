[Back to the changelog](../../CHANGELOG.md)

# 2026-10-01 · Release 34

Address: https://baileypillon.github.io/pyrefly-reprise/ (main 25faec70)

- **Both:** new soundtrack renders for 23 cues: FFX's 16 are played by a sampled orchestra, FFX-2's
  seven get a band sound. The title, chapter-select and pause cues are unchanged.

- **Both:** a new recorded sound-effects set of 98 layered sounds, each game with its own voice (FFX
  sounds and weapons in FFX, FFX-2 twins in FFX-2). The title and board menus keep the old set.

- **Both:** a CREDITS row under ABOUT in the pause OPTIONS tab opens a scrolling list of every
  music, sound, type and tool credit.

  ![The OPTIONS tab with ABOUT and CREDITS](img/release-34/credits-options.jpg)
  ![The credits panel](img/release-34/credits-panel.jpg)

  *The CREDITS row under ABOUT in the pause OPTIONS tab, and the scrolling credits panel it opens.*

- **FFX:** Overdrive inputs follow the sources: a wrong Swordplay or Bushido press restarts the
  sequence and only the timer running out fails, a failure deals the weaker sourced hit with no
  bonus or status, Blitz Ace ends with its Last Hit, and Tornado's timer is 3 seconds.

- **FFX:** in Chapter XVII, losing on Sin's back (link 3) retries at link 3, not from the Left Fin,
  and in the Sin chapters the move advisor weighs the race against Overdrive Sin's clock.

- **Both:** party members hunch when asleep and slouch (FFX, under half HP) or kneel (FFX-2, under a
  third) when low, in new paintings for Tidus, Yuna, Auron, Wakka, Lulu, Rikku and Kimahri and for
  FFX-2's Yuna Gunner, Rikku Thief and Paine Warrior.

  ![Chapter I: Yuna asleep and Auron slouching](../screenshots/poses-0930/ch1-desktop-rest.jpg)
  ![Chapter IV: Yuna asleep and Paine kneeling](../screenshots/poses-0930/ch4-desktop-all-rest.jpg)
  ![Chapter I: Kimahri asleep](../screenshots/poses-day/ch1-desktop-kimahri-sleep.jpg)

  *Resting poses in battle: Yuna asleep and Auron slouching at low HP (Chapter I), Yuna asleep and Paine kneeling at low HP (Chapter IV), and Kimahri asleep.*

- **FFX-2:** Bahamut's Mega Flare gets a splash painting in Chapter IV, and Paine's Songstress gets
  attack and hurt paintings.

  ![Bahamut's Mega Flare splash in Chapter IV](../screenshots/poses-0930/ch4-desktop-splash.jpg)
  ![Paine's Songstress attack in Chapter XIII](../screenshots/poses-0930/ch13-desktop-attack.jpg)
  ![Paine's Songstress hurt in Chapter XIII](../screenshots/poses-0930/ch13-desktop-hurt.jpg)

  *Bahamut's Mega Flare splash painting in Chapter IV, and Paine's Songstress attack and hurt paintings in Chapter XIII.*

- **Both:** Seymour kneels and falls in his own paintings at the end of Chapter VII and when he is
  knocked out, Isaaru and Shuyin kneel in theirs, and the silent 1.7-second empty plate before the
  Chapter VII results is gone.

  ![Seymour kneeling at the end of Chapter VII](../screenshots/rel34-seymour-fall/1600-post-kneel.jpg)
  ![Seymour fallen at the end of Chapter VII](../screenshots/rel34-seymour-fall/1600-post-fall.jpg)
  ![Isaaru kneeling](../screenshots/poses-day/ch14-desktop-isaaru-kneel.jpg)
  ![Shuyin kneeling](../screenshots/poses-day/ch5-desktop-shuyin-kneel.jpg)

  *Seymour kneeling and then fallen at the end of Chapter VII, Isaaru kneeling (Chapter XIV) and Shuyin kneeling (Chapter V).*

- **Both:** pause and flow fixes: QUIT TO TITLE no longer shows two titles, RESTART ENCOUNTER no
  longer leaves the title over the fight, REPLAY BRIEFING can be dismissed, a click on RESUME closes
  the pause, and on a phone the first tap on a target aims and the second commits (a Hi-Potion can
  no longer kill a Zombie ally in one tap).

  ![REPLAY BRIEFING before and after](img/release-34/replay-briefing.jpg)

  *Before (left): REPLAY BRIEFING played underneath the pause screen and could not be seen. After (right): the briefing shows over the pause.*

  ![After tapping RESUME, before: the pause stays](../screenshots/r17fix-ui/pr0265-390x844-ch1-after-resume-tap-BEFORE.jpg)
  ![After tapping RESUME, after: the pause closes](../screenshots/r17fix-ui/pr0265-390x844-ch1-after-resume-tap-AFTER.jpg)

  *On a phone, tapping RESUME: before, the pause stayed up; after, it closes.*

  ![Six seconds after RESTART ENCOUNTER on a phone, before and after](../screenshots/r34fix-restart-restart-before-after-390x844.png)

  *On a phone, six seconds after RESTART ENCOUNTER: before (left), the title screen was still mounted over the fight; after (right), the restarted fight is on screen.*

  ![The first tap aims at a Zombie ally and shows the warning](img/release-34/phone-first-tap-aims.jpg)

  *On a phone, the first tap on Yuna (a Zombie) only aims and shows the warning; the gold button commits.*

- **Both:** the cure-hint card keeps its text at 14 px or more and stays clear of the party chips,
  and changing TEXT SIZE from the pause with a menu open resizes the FFX command list (it used to
  cover the Talk row).

  ![TEXT SIZE 130, before: the list covers the Talk row](../screenshots/r17fix-ui/pr0266-1600x900-130-same-turn-BEFORE.jpg)
  ![TEXT SIZE 130, after: the list is re-fitted](../screenshots/r17fix-ui/pr0266-1600x900-130-same-turn-AFTER.jpg)

  *Changing TEXT SIZE to 130 percent with a menu open: before, the list covered the Talk row; after, it resizes to fit.*

- **FFX-2:** Chapter XV's chain links open full-bleed instead of with the last link's victory arc
  still showing.

  ![Chapter XV seam before and after](img/release-34/xv-seam-full-bleed.jpg)

  *Chapter XV's link 1 to 2 seam at the moment it opens, before (left) and after (right): the backdrop stopped short with a black band down the right of the frame, and now fills it.*

- **Behind the scenes:** three.js's licence notice now ships with the game, and the audio budget
  rose from 85 to 90 MB so the new effects ship at full MP3 quality.
