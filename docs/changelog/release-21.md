[Back to the changelog](../../CHANGELOG.md)

# 2026-09-26 · Release 21

Address: https://baileypillon.github.io/pyrefly-reprise/ (main d8837334)

- **Both:** every spell now draws its own effect. Fire, Ice, Thunder, Water, Holy, Cure and physical
  blows get particle effects (a gold ring in FFX, a pink one in FFX-2), and the damage number waits
  until the spell lands. LOW EFFECTS and REDUCE MOTION keep the old glow.

  ![Before: the same tinted bloom for every spell and hit](img/release-21/spell-effects-before.jpg)

  *Before (the build live on 26 September): Hastega, Lance of Atrophy, Darkness and Magic Break all draw the same tinted bloom. FFX is on top (Chapter I), FFX-2 below (Chapter IV).*

  ![The new spell effects in FFX, Chapter I](../screenshots/spellfx-b/real-command-ffx-desk.jpg)

  *FFX, Chapter I: Fire, Blizzard, Thunder, Water, Holy, Cure and a physical blow, each cast by the real command and each with its own particle effect.*

  ![The new spell effects in FFX-2, Chapter IV](../screenshots/spellfx-b/real-command-ffx2-desk.jpg)

  *FFX-2, Chapter IV: the same set on Bahamut, in the FFX-2 skin.*

- **FFX-2:** Chapter V stages Vegnagun as a colossus. Each part stands 4 to 6 girls tall under a low
  camera that looks up at it.

  ![Before: the body link, with Vegnagun's body standing small](img/release-21/vegnagun-body-before.jpg)

  *Before (release 20, Chapter V, link 3): Vegnagun's body is a small machine to the right of the party.*

  ![After: the body link, looming over the party](../screenshots/vegnagun-a/build-desk-3-body-menu.jpg)

  *After (release 21, link 3): the body fills the top of the picture and the girls stand at its feet.*

  ![The four parts as the camera pushes up each](../screenshots/vegnagun-a/push-enemy-rig-desk-1600-debug.jpg)

  *All four links (tail, leg, body, head), each framed from a low camera looking up at the part.*

- **Both:** a boss draws its attack painting for a physical attack when it has one, and seven new boss
  poses arrive: Yojimbo's attack and hurt (FFX), and hurt poses for Trema, Logos, Leblanc, Ormi and a
  Syndicate goon (FFX-2).

  ![Seymour Flux strikes in his attack painting](../screenshots/attack-pose/I-1600x900-seymour-flux-lance-of-atrophy.jpg)

  *Chapter I: Seymour Flux's Lance of Atrophy is drawn in his attack painting.*

  ![The seven new boss poses next to each idle](../concepts/boss-poses-2026-09-26/installed/scale-check.jpg)

  *The seven new poses (right of each pair), each beside the idle painting it joins (left): Yojimbo's attack and hurt, then the hurt poses for Trema, Logos, Leblanc, Ormi and a Syndicate goon.*

- **Both:** on an upright phone the results page fills the screen: the painting full-bleed, ink
  tallies, party chips, and a CONFIRM or RETRY dock under your thumb.

  ![Before: the phone victory page as a small letterboxed miniature](../concepts/phone-2026-09-26/pr0001-victory-today.jpg)

  *Before (release 19, 390x844): the results are a small desktop page, letterboxed.*

  ![After: the phone victory page fills the screen](../screenshots/results-phone-B/ffx-i-victory-1-landed.jpg)
  ![After: the FFX-2 victory page in pink](../screenshots/results-phone-B/ffx2-xi-victory-1-landed.jpg)

  *After (release 21, 390x844): the painting runs full-bleed behind ink tallies, party chips and a CONFIRM dock. The first picture is Chapter I (FFX, gold), the second Chapter XI (FFX-2, pink).*

  ![After: the phone defeat page with RETRY and CHAPTER SELECT](../screenshots/results-phone-B/ffx-i-defeat-1-landed.jpg)

  *The defeat page, with RETRY and CHAPTER SELECT under the thumb.*

- **FFX-2:** on a phone, Chapter XI's camera steps back on each Road link so every fighter is whole.
  On very wide windows the frame fills the whole window, the ALL ENEMIES / ALL ALLIES label scales
  with the stage, and a leftover menu cursor no longer shows as a corner reticle.

  ![Before: Chapter XI's Sisters link on a phone, with the Sisters cut off](../screenshots/road-phone-A/today-sisters-menu.jpg)

  *Before (390x844): in the Sisters link Yuna is cropped at the left, only a sliver of Sandy shows at the right, and Cindy and Mindy are out of the picture.*

  ![After: every fighter whole](../screenshots/road-phone-A/build-sisters-menu.jpg)

  *After (release 21, 390x844): the camera steps back, and all three girls and all three Sisters are in view.*

  ![The frame filling a 2560x1080 window](../screenshots/t1-b3a/wide-ch4-2560x1080.jpg)

  *A 2560x1080 window in Chapter IV: the frame and the help band run to both edges.*

  ![The ALL ENEMIES label at 2560x1440](../screenshots/t1-b3a/all-label-ffx2-leblanc-2560x1440.jpg)

  *Chapter VI at 2560x1440, aiming a Grenade at all enemies: the ALL ENEMIES label sits on the enemy side and the enemy-move card stays clear of it.*

  *(no screenshot from the time of the leftover menu cursor)*

- **FFX:** in Chapter IX Kimahri no longer arrives with Doom already learned. The card's Doom row
  reads ??? until you lose once, and the guide teaches the race instead.

  ![Chapter IX's card before a loss: the Doom row reads ???](../screenshots/yojimbo-pick/1600x900-1-prep-card-hidden.jpg)

  *Chapter IX, the party-prep card before you have lost: the first objective reads "???".*

  ![Chapter IX's card after a loss: the Doom row is revealed](../screenshots/yojimbo-pick/1600x900-7-prep-card-revealed.jpg)

  *After one loss it reads "In the game, a Ghost teaches Doom".*

- **Both:** P opens and closes the pause, also over a pre-battle scene. On a touch screen the scene
  strip and Auron's briefing name taps, not keys.

  ![P opens the pause over a pre-battle scene](../screenshots/t1-b4a/pr0115-seymour-flux-scene-open.jpg)

  *Chapter I: P opens the pause over the pre-battle scene (here on its CHAPTER tab).*

  ![Before: the phone briefing names keys](img/release-21/touch-briefing-before.jpg)

  *Before (release 18, 390x844, touch): Auron's briefing says "ENTER / ESC SKIP" and "D NEVER SHOW THIS AGAIN".*

  ![After: the phone briefing names taps](../screenshots/t1-b4a/pr0073-touch-briefing.jpg)

  *After (release 21): it says "TAP SKIP" and "TAP HERE NEVER SHOW THIS AGAIN".*

  ![Before: the phone scene strip names keys](img/release-21/touch-scene-strip-before.jpg)

  *Before (release 18, Chapter XI): the strip at the bottom reads "ENTER ADVANCE, HOLD ENTER SKIP, ESC MENU".*

  ![After: the phone scene strip names taps](../screenshots/t1-b4a/pr0057-touch-seymour-flux.jpg)

  *After (release 21, Chapter I): it reads "TAP ADVANCE" and "TAP HERE MENU".*

- **Both:** advisor and intent text is plainer, the phone tip says which menu a move lives in, the
  "Guide's pick" tag only shows beside the move the guide names, and coach hints wait while a story
  card is up. FFX-2's advisor no longer says "call an aeon".

  ![Before: the phone tip names Wakka but not the menu](img/release-21/phone-tip-before.jpg)

  *Before (release 18, Chapter XII, 390x844): the tip reads "Wakka" and nothing more.*

  ![After: the phone tip names the Switch menu](../screenshots/t1-b3a/phone-tip-seymour-omnis.jpg)

  *After (release 21): the same tip reads "Wakka · Switch", the menu the move lives in.*

  ![The chain mark showing before a story card](../screenshots/t1-b4a/pr0119-forced-00-mark.jpg)
  ![The mark has stepped aside for Rikku's story card](../screenshots/t1-b4a/pr0119-forced-02-beat.jpg)

  *Chapter VI: the "2 CHAIN x1.50" mark is showing (first picture); once Rikku's story card is up, the mark has stepped aside (second picture).*

- **FFX-2:** Shuyin stands on the Farplane in Chapter V's close, the Farplane voice plays at most twice
  a battle, Chapter VI's Act III beats hold in either kill order, Leblanc's stray asterisks are gone,
  and Chapters VI and XV name their bosses on the card.

  ![Before: Chapter V's close over an empty backdrop](img/release-21/ch5-close-before.jpg)

  *Before (release 18, Chapter V): the close plays over the empty Farplane.*

  ![After: Shuyin on the Farplane](../screenshots/t1-b4a/pr0133-ch5-post-1600.jpg)

  *After (release 21): Shuyin stands on the Farplane while Yuna speaks.*

  ![Chapter VI's card names its bosses](../screenshots/t1-b4a/pr0134-card-vi.jpg)
  ![Chapter XV's card names its bosses](../screenshots/t1-b4a/foc19-06-card-xv.jpg)

  *The chapter cards now name their bosses: Chapter VI (Leblanc, Logos and Ormi) and Chapter XV (Baralai, Gippal and Nooj).*

- **FFX:** Chapter VIII's party sound like themselves again and Evrae's Orders read as orders. In
  Chapter XII the advisor plans around Omnis's disc turns.

  ![Before: the guide and the advisor print "Pull back" aimed at Rikku](../screenshots/t1-b5/ch8-win-orders-widget.jpg)

  *Before (Chapter VIII, Rikku's turn to give an order): the guide (top left) and the advisor card (top) both print "Pull back, Rikku", as if the order were aimed at her.*

  ![After: both print just "Pull back"](img/release-21/evrae-orders-after.jpg)

  *After (a release 22 candidate frame, which carries this release 21 change): the same moment, and both read just "Pull back".*

  *(no screenshot from the time of the reworded Chapter VIII lines or the Omnis advice)*

- **Behind the scenes:** tests now load a save from release 20 and check it still plays.
