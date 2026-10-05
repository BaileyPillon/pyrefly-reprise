# Echoes of Spira — changelog

Every build that has gone live or to a preview, newest first, from the first alpha to today, and the day the
project began: 51 entries. Dates are US Eastern. FFX, FFX-2 or both tells you which game a change touches.
Each entry lists its changes as text and shows one picture from that build; "All pictures for this build" opens
a page with every picture, before and after where both exist. Engineering detail lives in
`docs/handoff/release-NN.md`.

Echoes of Spira was called Pyrefly Reprise until 2026-10-04, so older pictures show the old name and the site
address still carries it.

## 2026-10-04 · Old address: the "we've moved" note

Address: https://baileypillon.github.io/pyrefly-reprise/ (main dae5ed9e)

- **Both:** the old GitHub address now shows a note on its title screen: "Echoes of Spira has moved to
  echoesofspira.com · Saves made here stay here". Clicking it opens echoesofspira.com. The game there
  is still release 38, so saves made there keep working.

![The old address's title card with the moved note](docs/changelog/img/legacy-moved-note/title-old-address-1600x900.jpg)

*The old address's title card with the note at the top right.*

All pictures for this build: [docs/changelog/legacy-moved-note.md](docs/changelog/legacy-moved-note.md)

## 2026-10-04 · Release 38 on echoesofspira.com

Address: https://echoesofspira.com (main 8136f2ed)

- **Both:** the game has its own address, **echoesofspira.com**, served by Cloudflare.
  www.echoesofspira.com forwards to it. It is release 38, unchanged: all 1,932 files were checked
  byte for byte on the new address after the upload.
- **Both:** saves are kept per address, so echoesofspira.com starts with fresh saves. The old
  GitHub address keeps its own saves and stays up.
- **Behind the scenes:** releases now go to Cloudflare by default. Only changed files are uploaded,
  earlier versions can be rolled back in seconds, and the critic and the tools follow the new address.

![The title card on echoesofspira.com](docs/screenshots/cf-switch/title-echoesofspira.com-1600x900.png)

*The title card on echoesofspira.com at 1600x900.*

All pictures for this build: [docs/changelog/release-38-echoesofspira.md](docs/changelog/release-38-echoesofspira.md)

## 2026-10-04 · Cloudflare preview (release 38)

Address: https://echoes-of-spira-preview.baileypillon.workers.dev

- **Both:** release 38, unchanged, served from Cloudflare for the first time. It is the same files as
  the live build, served from the site root, and all 1,932 files were checked byte for byte after the
  upload.
- **Both:** saves are kept per address, so this preview starts with no saves. GitHub Pages keeps its
  own.

![Release 38's title card](docs/screenshots/release-38-live/title-1600x900.jpg)

*Release 38's title card as checked on the live build. The Cloudflare preview serves the same files.*

All pictures for this build: [docs/changelog/cloudflare-preview.md](docs/changelog/cloudflare-preview.md)

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

![The Echoes of Spira title card](docs/screenshots/release-38/title-1600x900.jpg)

*The new title card, Echoes of Spira, at 1600x900.*

All pictures for this build: [docs/changelog/release-38.md](docs/changelog/release-38.md)

## 2026-10-03 · Release 37.1

Address: https://baileypillon.github.io/pyrefly-reprise/ (main f4244e1f)

- **FFX-2:** Trigger Happy counts gamepad R1 and taps or clicks on its bar, not only the R and Page
  Down keys, and its prompt names the right button for your device (MASH R, MASH R1, MASH TAP or MASH
  CLICK). Enter does not count, because it is not the bound button.
- **FFX:** in Chapter IX, Yojimbo and Daigoro appear at the first menu after a hurried opening.

![Trigger Happy on a phone, before and after](docs/screenshots/r37-hotfix/foc37-02-phone-before-after.jpg)

*Trigger Happy on a phone, release 37 (left) and 37.1 (right): the bar was hidden under the intent card and could not be tapped; now it sits on top and three taps count as three hits.*

All pictures for this build: [docs/changelog/release-37-1.md](docs/changelog/release-37-1.md)

## 2026-10-03 · Release 37

Address: https://baileypillon.github.io/pyrefly-reprise/ (main cd9dbbb0)

- **Both:** the pause screen's ten portraits come alive: they blink, glance aside, and their eyes
  follow the highlighted tab or row. LIVING PAINTINGS and REDUCE MOTION switch it off.
- **Both:** eight more backdrops get depth layers and a slow drift, with the far layers softening as
  the camera moves. FFX: Zanarkand, Dream's End, the Garden of Pain, Via Purifico. FFX-2: the
  Farplane, Leblanc, Via Infinito, the Den of Woe.
- **FFX-2:** all 77 dressphere twirl keys are in (the last 8 added), and the close-up now holds its
  full 1.6 seconds, so a change takes about a second longer. The coach line steps aside for it.
- **Both:** 35 more boss paintings. FFX-2: Bahamut, Vegnagun's tail, Leblanc and her gang, Trema,
  the Den of Woe shades, the Magus Sisters. FFX: Sin's fins and Genais, the Guado Guardian, Evrae,
  Mortibody.
- **FFX:** in Chapter IX, Lady Ginnem gets a breathing cool halo and a shell of pyrefly motes, in
  the fight and in the scene after it.
- **FFX-2:** Lady Luck's reels follow the sourced pay table (a spin pays or is a Dud) and your own
  spin reaches the battle. No dressphere grid offers her yet.
- **FFX-2:** Trigger Happy now takes your own press count instead of rolling 6 to 16 hits, but only
  the R and Page Down keys count; gamepad and touch get one hit until 37.1.
- **FFX-2:** the enemy's message and telegraph clear at the last blow, and on windows 2000 px wide
  and up Chapters IV and XV fill the frame with a mirrored backdrop edge (Chapter IV's lamp shows
  doubled).
- **Both:** a knocked-out party member lies clear of the status rows, and holding skip through a
  hurried opening reaches the first menu in about 4 seconds, not 12.
- **FFX:** the Chapter XVII move advisor follows the sensible line's priorities, so its top pick now
  wins about half the time, up from about 4 percent.
- **FFX:** overkilled enemies drop double items, Auron gives a one-time disc tip in Chapter XII,
  Braska's Final Aeon's Talk beat gets a smaller line card, and Ronso Rage is no longer called a
  timed input.
- **Behind the scenes:** no source maps ship any more (22.8 MB lighter), and the audio checks gain
  an automated listener that screens new music.

![Tidus's living pause portrait](docs/screenshots/portraits-live/ch1-tidus-1600x900-smile.jpg)

*Tidus's pause portrait, smiling: one moment of the loop in which the portraits blink, glance aside and follow the highlighted tab.*

All pictures for this build: [docs/changelog/release-37.md](docs/changelog/release-37.md)

## 2026-10-03 · Release 36

Address: https://baileypillon.github.io/pyrefly-reprise/ (main c69de96a)

- **Both:** a new EYE CANDY page in OPTIONS gives each part of the three looks (CINEMA LIGHT, LIVING
  PAINTINGS, BATTLE SPECTACLE) its own switch, nine in all. A look turned OFF turns its parts off,
  and the page says OFF HERE or LESS HERE where a phone or the low tier trims a part.
- **Both:** a big visuals pass, the MAX mix: big bosses framed larger with the party where the
  backdrop allows (Yojimbo, Bahamut), a depth-of-field blur, room fog, smoother edges, figures that
  breathe and buckle when knocked out, and splash art cropped to its focus.
- **FFX:** on desktop, the camera holds a close shot of the attacker during an Overdrive input, and
  the name banner sits clear of the party.
- **FFX-2:** a dressphere change plays a painted twirl (69 of the 77 keys). On desktop it also holds
  a close-up of the girl, skipped where a dressphere still has only a stand-in figure.
- **Both:** 122 paintings (42 replace older ones): Kimahri's single broken horn on all twelve of his
  paintings, whole wings for Valefor and Pterya, redone Yu Yevon, Yunalesca and Seymour Flux poses,
  new party poses, and new hurts for Leblanc, Ormi, Trema and the goon.
- **Behind the scenes:** the new switches change the save format, so the build was reviewed in depth
  before it went live, and every switch is proved to stop its effect by real keys and touch in both
  games.

![The EYE CANDY options page](docs/changelog/img/release-36/eye-candy-page-ffx.jpg)

*The new EYE CANDY page in OPTIONS (FFX): three looks, each with its own switches.*

All pictures for this build: [docs/changelog/release-36.md](docs/changelog/release-36.md)

## 2026-10-02 · Release 35

Address: https://baileypillon.github.io/pyrefly-reprise/ (main ef3f6bbf)

- **Both:** 80 painted poses: wind-up, impact, follow-through, cast, item and victory paintings for
  the party (FFX: Tidus, Yuna, Auron, Wakka, Lulu, Rikku; FFX-2: 15 dresspheres) and hurt, KO and
  attack paintings for 31 bosses (13 FFX, 18 FFX-2). On desktop, 24 of the biggest paintings
  (Vegnagun's tail, Sin's fins, Overdrive Sin, Evrae and others) also ship sharper 2x masters;
  phones keep the 1x art.
- **Both:** attacks play in painted beats: the wind-up until the lunge reaches its apex, the impact
  painting at the apex, the follow-through when the hit lands. The lunge now holds at its apex until
  the hit or miss plays, so blows land on the strike.
- **FFX-2:** Yuna's White Mage dressphere wears her hood in its cast, item and victory paintings.
- **Both:** a knocked-out party member stays down through the victory instead of standing up to
  cheer, KO paintings are drawn at the standing figure's size, and a member with no KO painting lies
  on the floor.
- **FFX:** Mortiorchis leaves with Seymour Flux in a pyrefly dissolve instead of standing through
  the victory.
- **Both:** shadows follow the figure's shape instead of a box, and eye candy's rim light is capped
  at 1.5 screen pixels so low-density bosses lose their sticker halo.
- **FFX-2:** the Den of Woe returns toward its approved look (no star flares, teal floor and walls),
  the Road to the Farplane carries its stone below the frame instead of a flat violet band, and
  bloom stays off the girls on the bright Farplane plate.
- **Both:** layout fixes: panels fade while an Overdrive or Special splash prints through them,
  clipped labels wrap instead of ending in dots, panels stop covering the intent text and the enemy
  it describes, and the status line queues its messages (Esuna on three statuses shows every line).
- **FFX:** the first Esc at Chapter I's first command menu opens the pause, and after a victory or
  defeat the last enemy action's banner and the advisor card clear off the field.
- **FFX:** both Sin chapters show the advisor card at the first command menu, Chapter XVII's link on
  Sin's back lists no dead PULL BACK or CLOSE IN rows, and the Sphere Grid's AUTO-LEARN and ? button
  get key and gamepad routes.
- **Behind the scenes:** the deploy tool falls back to pushing changed files only when a full upload
  times out, and a stray 404 on battle entry is gone.

![Tidus's attack beats in Chapter I](docs/changelog/img/release-35/tidus-windup-follow.jpg)

*Tidus's attack in Chapter I plays in painted beats: the wind-up, then the follow-through.*

All pictures for this build: [docs/changelog/release-35.md](docs/changelog/release-35.md)

## 2026-10-01 · Release 34

Address: https://baileypillon.github.io/pyrefly-reprise/ (main 25faec70)

- **Both:** new soundtrack renders for 23 cues: FFX's 16 are played by a sampled orchestra, FFX-2's
  seven get a band sound. The title, chapter-select and pause cues are unchanged.
- **Both:** a new recorded sound-effects set of 98 layered sounds, each game with its own voice (FFX
  sounds and weapons in FFX, FFX-2 twins in FFX-2). The title and board menus keep the old set.
- **Both:** a CREDITS row under ABOUT in the pause OPTIONS tab opens a scrolling list of every
  music, sound, type and tool credit.
- **FFX:** Overdrive inputs follow the sources: a wrong Swordplay or Bushido press restarts the
  sequence and only the timer running out fails, a failure deals the weaker sourced hit with no
  bonus or status, Blitz Ace ends with its Last Hit, and Tornado's timer is 3 seconds.
- **FFX:** in Chapter XVII, losing on Sin's back (link 3) retries at link 3, not from the Left Fin,
  and in the Sin chapters the move advisor weighs the race against Overdrive Sin's clock.
- **Both:** party members hunch when asleep and slouch (FFX, under half HP) or kneel (FFX-2, under a
  third) when low, in new paintings for Tidus, Yuna, Auron, Wakka, Lulu, Rikku and Kimahri and for
  FFX-2's Yuna Gunner, Rikku Thief and Paine Warrior.
- **FFX-2:** Bahamut's Mega Flare gets a splash painting in Chapter IV, and Paine's Songstress gets
  attack and hurt paintings.
- **Both:** Seymour kneels and falls in his own paintings at the end of Chapter VII and when he is
  knocked out, Isaaru and Shuyin kneel in theirs, and the silent 1.7-second empty plate before the
  Chapter VII results is gone.
- **Both:** pause and flow fixes: QUIT TO TITLE no longer shows two titles, RESTART ENCOUNTER no
  longer leaves the title over the fight, REPLAY BRIEFING can be dismissed, a click on RESUME closes
  the pause, and on a phone the first tap on a target aims and the second commits (a Hi-Potion can
  no longer kill a Zombie ally in one tap).
- **Both:** the cure-hint card keeps its text at 14 px or more and stays clear of the party chips,
  and changing TEXT SIZE from the pause with a menu open resizes the FFX command list (it used to
  cover the Talk row).
- **FFX-2:** Chapter XV's chain links open full-bleed instead of with the last link's victory arc
  still showing.
- **Behind the scenes:** three.js's licence notice now ships with the game, and the audio budget
  rose from 85 to 90 MB so the new effects ship at full MP3 quality.

![Resting poses in Chapter IV](docs/changelog/img/release-34/main-resting-poses.jpg)

*Chapter IV: Yuna asleep and Paine kneeling at low HP, in their new resting paintings.*

All pictures for this build: [docs/changelog/release-34.md](docs/changelog/release-34.md)

## 2026-09-30 · Release 33

Address: https://baileypillon.github.io/pyrefly-reprise/ (main f302f163)

- **Both:** eye candy is on by default: golden-hour light and haze, drifting flakes and steam, a
  gentle figure sway, hit-stop, hit rings and splash cut-ins (FFX gold and calm, FFX-2 pink and
  quick). OPTIONS gets CINEMA LIGHT, LIVING PAINTINGS and BATTLE SPECTACLE rows to turn each off.
- **Both:** statuses show on the figures in their sourced looks, each game with its own table
  (Zombie's green glow, Poison bubbles, Sleep Z's, Stop's freeze and more), with drawn status icons
  on the plates and a one-line message when one lands or wears off.
- **Both:** guard rails: a healing item aimed at a Zombie ally shows a red warning with the damage,
  the guide's cure hint names the cure for the status in play, and a caption says when a status
  takes the command away.
- **Both:** a guided first run: after Auron's briefing, a three-step pointer shows the first
  chapter, START BATTLE and (in FFX) ATTACK. A returning player never sees it.
- **Both:** the camera is calmer by default: shorter, slower moves, no roll, no shake on routine
  hits.
- **FFX:** the Sphere Grid gets a first-time explainer card, AUTO-LEARN with undo, and a bigger
  layout with a node preview and route, a legend in words and a phone page.
- **Both:** the whole score is re-encoded at higher MP3 quality, so the music download grows from
  about 40 MB to about 78 MB.
- **Both:** sound effects are louder by default (+6 dB): new profiles start at 70 percent, a saved
  35 percent moves up to 70 once, and levels you set are kept.
- **Both:** battle pacing is steadier by default: FFX actions run 20 percent longer and damage
  numbers 30 percent longer, FFX-2 10 and 25 percent.

![Chapter I with the three looks on](docs/changelog/img/release-33/main-looks-on.jpg)

*Chapter I with the three looks on by default: golden-hour light, haze and drifting flakes.*

All pictures for this build: [docs/changelog/release-33.md](docs/changelog/release-33.md)

## 2026-09-30 · Release 32

Address: https://baileypillon.github.io/pyrefly-reprise/ (main 1a6fd3cc)

- **Both:** OPTIONS gains TEXT SIZE (100, 115 or 130 percent), REDUCE MOTION and LOW EFFECTS. TEXT
  SIZE enlarges the text in FFX's battle HUD and in dialogue cards (FFX-2's battle HUD and the pause
  stay at 100); REDUCE MOTION turns camera moves into cuts and stops shake; LOW EFFECTS thins hit
  sparks.
- **FFX:** six Sphere Grid fixes after a friend's playtest: a travelled step shows its real S.Lv
  price, an opened lock reads as open and stays open when you leave party prep and come back, HP and
  MP nodes add to the base stat, walk mode keeps the cursor on nodes you can reach, and clicks say
  what they do.
- **FFX:** a Zombie now shows first, in green, on the party plate, and aiming a healing item at a
  Zombie ally warns "Zombie: 1,000 damage" or "this KOs". A Hi-Potion on a zombified Kimahri in
  Chapter I used to hurt him with no warning.
- **Both:** long command lists scroll: the wheel and triangles work in FFX, and the highlight
  follows the scroll in FFX-2.
- **Both:** a miss plays a whiff instead of the menu's cancel tone.
- **Both:** the first-time coach line comes down with a tap or click on the menu, and says TAP on a
  phone.
- **Both:** the advisor card, guide rail and coach line step once per shot instead of sliding while
  the camera moves.
- **Behind the scenes:** calmer-camera, steadier-pacing and louder-effects presets can be tried with
  web-address switches (off by default). They became the defaults in release 33.

![The FFX battle HUD at TEXT SIZE 130 percent](docs/screenshots/r31-access/desk-hud-130.jpg)

*The FFX battle HUD at the new TEXT SIZE of 130 percent.*

All pictures for this build: [docs/changelog/release-32.md](docs/changelog/release-32.md)

## 2026-09-29 · Release 31a

Address: https://baileypillon.github.io/pyrefly-reprise/ (build 52a431d0, cut from a side branch)

- **Both:** the whole score is re-mastered to fix the thin, hollow sound: the left and right
  channels were out of step with each other, and the bass is now centred. 23 of 25 cues change;
  Vegnagun's boss theme and the Bevelle Underground scene keep the old render.
- **Both:** chapter music and menu music no longer play together after you choose a chapter. A cue
  replaced before it was heard is stopped, not faded out from full volume.
- **FFX:** on a phone, long command lists get two page buttons and an "N-M OF T" counter in place of
  the tiny marks.
- **Behind the scenes:** this is release 31 without the OPTIONS accessibility rows, which change the
  save format and waited for a review. They came in release 32.

![The phone Items list with its pager](docs/screenshots/r31-paging/phone-01-items-first-page.jpg)

*The phone Items list in Chapter IX with its two page buttons and an "N-M OF 27" counter.*

All pictures for this build: [docs/changelog/release-31a.md](docs/changelog/release-31a.md)

## 2026-09-29 · Release 30

Address: https://baileypillon.github.io/pyrefly-reprise/ (main 1475ff6b)

- **FFX:** Sin arrives as two new chapters, bringing the board to 18. Chapter XVII, Sin: the Fins
  and the Core, has you tear off both fins, jump onto its back and destroy its Core, with no healing
  between links. Chapter XVIII, Sin: the Face, is a fight against the clock as its mouth opens.
- **FFX:** both Sin chapters come with new paintings (the head, both fins, Genais, the Core,
  backdrops, pause art and turn-list icons) and new HUD pieces: a mouth-ring clock in XVIII and a
  range-and-charge plate for the fins in XVII.
- **FFX-2:** Rikku and Paine get their own Songstress paintings, and the party rows frame their
  faces.
- **FFX:** a sharper move advisor: it now searches several turns ahead, in a background worker, on
  every device.
- **FFX:** Chapter VII's battle card shows Seymour instead of a Guado Guardian, the aftermath shows
  Seymour on screen with the kneel, fall and sending captioned (it was an empty plate), and the
  first Boost callout says "half again", not twice.
- **Both:** the move advisor no longer offers a revive on an enemy or on a living ally (it had
  offered Phoenix Down on the knocked-out Guado Guardian).

![Chapter XVII's first menu](docs/screenshots/sin/listed/1600x900-04-xvii-first-menu.jpg)

*Chapter XVII, Sin: the Fins and the Core: the first menu on the Fahrenheit's deck, with the Left Fin overhead.*

All pictures for this build: [docs/changelog/release-30.md](docs/changelog/release-30.md)

## 2026-09-29 · Release 29

Address: https://baileypillon.github.io/pyrefly-reprise/ (main 49005f73)

- **FFX:** Chapter VII (Seymour and Anima at Macalania Temple) is open for play, with its own scene
  music. The board now has 16 chapters.
- **FFX:** Chapters II and III use the sourced Zanarkand and inside-Sin aeon stats, so no aeon is
  weaker later in the story. Chapter II plays easier, and Chapter III's possessed-aeon gauntlet runs
  about 37 percent longer (the whole chapter, measured on release 38: about 27 minutes of fighting,
  seven links, a bench median of 137 turns).
- **FFX-2:** Chapter IV's pause portrait is the approved painting of Yuna and Bahamut again, in
  place of a darker re-render.
- **FFX-2:** a gamepad now drives the command menu.
- **Both:** a cold first load is much faster. On a 25 Mbit/s line the loading card used to hold for
  about 18 to 26 seconds in Chapters I and IV and now holds for 1 to 2 seconds. Each screen's art
  loads before the board's strips, in the order you need it.
- **Both:** audio fixes: a quick Esc-Esc no longer leaves the pause music over the fight, a gamepad
  press now starts the sound in Chromium browsers, and new profiles start with sound effects at 35
  percent (they were 90). Existing saves keep their level.
- **Both:** on a phone, a tap on overlapping target brackets picks the one under your finger (a
  Hi-Potion tapped on Yuna could land on Auron), and the first-time coach line no longer blocks taps
  on party reticles.
- **Both:** coach lines stay off the fighters' faces and weapons on desktop, and the battle PAUSE
  chip is back in Ink & Gold style at 14 px.
- **FFX:** Chapter VIII's Orders row greys out when no order is possible and says why, the enemy
  read-out no longer covers the turn list's names, and on a phone the Grand Summon subtitle wraps
  inside its panel.
- **Both:** clearer words: the advisor gives real reasons and no longer says "always hits" for Talk
  or heals, FFX results say why a member earned no AP, and Auron's Chapter III warning is reworded.
- **FFX-2:** Darkness's cost names who pays, the guide waits while a heal is charging, Chapter V's
  ending is captioned "The Farplane Glen", the Farplane voices get a FARPLANE plate and a faded
  portrait, and the Gullwings crew get name plates.

![Chapter VII on the chapter board](docs/screenshots/ch7-unlock/1600x900-02-chapter-vii-selected.jpg)

*Chapter VII, Seymour and Anima, selected on the desktop board: it is open for play.*

All pictures for this build: [docs/changelog/release-29.md](docs/changelog/release-29.md)

## 2026-09-28 · Release 28

Address: https://baileypillon.github.io/pyrefly-reprise/ (main 6ea8528f)

- **FFX-2:** on a phone, Ixion in Chapter XVI stands on lit stone instead of a dark slab.
- **FFX:** on a phone, Chapter IX's Grand Summon list stays above the Zanmato gauge and shows all
  five aeons.
- **FFX:** an aeon's status row shows its own portrait, the one on the turn list, instead of a letter.
- **FFX:** in Chapter III the folded Sensor chip lifts clear of the target while you aim.
- **FFX:** on a phone, Seymour Flux's hair tips no longer touch the right edge (Chapter I).

![Ixion on lit stone on a phone](docs/screenshots/fixes-r28/ixs1-390x844-03-ixion-acts.jpg)

*Chapter XVI on a 390x844 phone: Ixion stands on lit stone instead of a dark slab.*

All pictures for this build: [docs/changelog/release-28.md](docs/changelog/release-28.md)

## 2026-09-28 · Release 27

Address: https://baileypillon.github.io/pyrefly-reprise/ (main be1e964a)

- **FF7 (hidden):** the hidden Guard Scorpion fight gets a high-fidelity pass. The sides are switched:
  your party stands on the left facing right, and the boss is on the right.
- **FF7 (hidden):** new painted "Film" art for Cloud, Barret and Guard Scorpion.
- **FF7 (hidden):** stronger "Spectacle" spell and hit effects with a white hit flash, an opening swirl
  with a short camera move, and a punchier menu look.
- **FF7 (hidden):** results in two windows, a Game Over that pans up, silent victory poses, and a phone
  framing that moves in on the party.
- **FF7 (hidden):** the boss stays solid through every hit (a flash had made its lower body look
  see-through), and Barret's aim stance no longer tilts and slides.
- **Both:** no change to any FFX or FFX-2 chapter.

![The hidden Guard Scorpion fight with the sides switched](docs/screenshots/ff7-phase3/game-1600x900-first-turn.jpg)

*The hidden Guard Scorpion fight after its high-fidelity pass: Cloud and Barret on the left, the boss on the right.*

All pictures for this build: [docs/changelog/release-27.md](docs/changelog/release-27.md)

## 2026-09-28 · Release 26

Address: https://baileypillon.github.io/pyrefly-reprise/ (main d89541b6)

- **FFX-2:** new Chapter XVI, Ixion at Djose. One boss fight against Ixion in the Chamber of the
  Fayth, then a story close: Yuna's fall into the Farplane Abyss, Shuyin, and the four whistles. The
  Chamber and Abyss paintings are provisional.
- **FFX-2:** the move advisor counts commands already underway, so it no longer tells you to use a
  Mega-Potion you just chose, or a move you are holding.
- **Both:** the advisor puts a raise on top for a fallen ally the chapter's line would leave down.
- **FFX-2:** a hit an enemy is immune to no longer opens a chain. In Chapter VI, Leblanc's failsafe
  fires once and turn 5 is Fan Slap.
- **FFX:** Yuna's aeons use the sourced Mt. Gagazet stats in Chapters I and IX (for example Valefor
  1,530 HP and Bahamut 2,935 HP), and Bahamut in Chapters X and XIV takes the same row.
- **FFX-2:** an Itchy girl's card names Change, the only row her menu offers. Intent cards say what a
  move really does: Delta Attack leaves the party at 1 HP and 0 MP, and a Dispel removes buffs.
- **FFX-2:** advisor and intent cards step back while an action plays over a fighter, disabled command
  rows are opaque so every row state reads clearly, and on a phone the enemy-move line steps off
  Vegnagun's leg in Chapter V.
- **Both:** pause screen: the CHAPTER tab names the scene properly ("Cavern of the Stolen Fayth") and
  keeps the Chapter II and IX boss faces clear, the H key's legend says what it does, and long names
  are no longer cut.
- **Both:** on the chapter board, selecting a card no longer nudges the cards below it, and the chosen
  chapter's battle starts loading while you read its card (a cold first visit used to wait 14 to 20
  seconds).
- **Both:** small text is at least 14 px on the advisor and intent cards and on the phone title and
  chapter select. Yuna's portrait chips no longer crop through her hair, and the pause plate fades out
  at 4K instead of ending in a hard black edge.

![Ixion in the Chamber of the Fayth](docs/screenshots/chapter-ixion/listed/1600x900-08-thors-hammer.jpg)

*New Chapter XVI: Ixion, in his violet possessed look, faces Yuna, Rikku and Paine in the Chamber of the Fayth (provisional painting).*

All pictures for this build: [docs/changelog/release-26.md](docs/changelog/release-26.md)

## 2026-09-27 · Release 25

Address: https://baileypillon.github.io/pyrefly-reprise/ (main 79adc4ff)

- **Both:** a battle opens with a transition chosen by situation, not the old swirl: FFX blurs out of
  a scene and shatters on a skip or retry, FFX-2 has its own shatter, and REDUCE MOTION cuts.
- **Both:** the party holds its battle stance after Yunalesca, Bahamut, Shuyin and Trema, with no
  victory pose.
- **FFX:** the enemy's ability name shows in the top help bar while it acts. It was never shown.
- **FFX:** attacking a lone enemy opens the target step first, as in the original game, and a target
  that is immune to Sensor says "Immune to sensors." instead of showing nothing.
- **FFX:** the TARGET plate names the aimed target and stays off the advisor card. In Chapter III the
  Sensor card folds while you aim, and cards fade while an action plays.
- **FFX:** a stalemate you cannot win ends on a WITHDREW card with RETRY.
- **FFX:** Yunalesca's hair and Valefor's wing no longer fade into a straight pale column. Chapter
  IX's sakura canopy ends on its own blossom, its tree is grounded, and the enemy shot clears the
  party's heads.
- **FFX:** on a phone, Seymour Flux stays below the HUD's top strips.
- **FFX-2:** Chapter XI names the Magus Sisters at their seam, and Chapter VI's Syndicate stands across
  the floor from the party.
- **FFX-2:** after a retry from a checkpoint, the summed spoils include the links you won before it.

![Aiming at a lone enemy in Chapter II](docs/screenshots/iter2-b5/pr0170-ch2-1600-lone-target-step-real-keys.jpg)

*Chapter II: choosing Attack against the lone Yunalesca goes straight to aiming, as in the original game.*

All pictures for this build: [docs/changelog/release-25.md](docs/changelog/release-25.md)

## 2026-09-27 · Release 24 (hotfix)

Address: https://baileypillon.github.io/pyrefly-reprise/ (main bc4e70ee)

- **FFX:** Yuna's Grand Summon now calls the aeon you pick. A crash in the picker had made it put
  Valefor out every time.
- **FFX:** backing out of Grand Summon, Mix or Rage with Esc returns you to the character's menu with
  the Overdrive gauge kept.
- **FFX:** Rikku's Mix list no longer opens empty.
- **FFX:** the Overdrive lists scroll to follow the cursor (Bahamut, the fifth Grand Summon row, was
  chosen out of sight).
- **FFX:** while an aeon is out the party leaves the field and returns when it is dismissed, KO'd or
  banished, and the status rows show the aeon's row alone.

![The Grand Summon picker with Ixion chosen](docs/screenshots/hotfix-24/ch09-2-picker-third-row.jpg)

*Chapter IX: the Grand Summon picker opens with Ixion chosen on its third row, and Ixion is the aeon that comes out.*

All pictures for this build: [docs/changelog/release-24.md](docs/changelog/release-24.md)

## 2026-09-27 · Release 23

Address: https://baileypillon.github.io/pyrefly-reprise/ (main ff3884fb)

- **FF7 (hidden):** a hidden Final Fantasy VII experiment: a Guard Scorpion fight in the No. 1 Reactor,
  with its own ATB battle, menus and Tail Laser warning, behind a secret door on the chapter select.
  It keeps its own record and never touches your save.
- **Both:** the camera rolls on an attack's first hit instead of its swing, and adds no time.
- **Both:** the party stays in frame. A push-in stops short of cutting a standing fighter, and FFX-2
  shots keep the enemy and the girls on screen.
- **Both:** on an upright phone every chapter stands the camera back at the start until the fight
  fits, and actions stay on that shot.
- **Both:** the first menu opens sooner, because opening callouts and the Sensor read now run under the
  fight.
- **Both:** a battle that takes more than 0.4 seconds to load shows the battle-start card, with a gold
  hairline.
- **FFX-2:** the next girl's cut-in is held for 0.8 seconds at most, so a charge's effect tag reads
  first. Vegnagun's parts get contact shadows where they meet the Farplane in Chapter V.
- **FFX:** Chapter IX's Yojimbo shot opens upward only on a 4:3 screen, so heads stay in frame.

![The first command window in the No. 1 Reactor](docs/screenshots/ff7/game-1600x900-turn.jpg)

*The hidden Final Fantasy VII fight: the first command window in the No. 1 Reactor, with its time gauges.*

All pictures for this build: [docs/changelog/release-23.md](docs/changelog/release-23.md)

## 2026-09-27 · Release 22

Address: https://baileypillon.github.io/pyrefly-reprise/ (main a44297ca)

- **Both:** mid-battle story lines show on a small card that stays clear of the party and of whoever
  is speaking.
- **Both:** a fiend that is sent dissolves into pyreflies from the feet up with a gold burn. Pyreflies
  drift only where the story puts them: none in the Chateau Leblanc, and Macalania's Chamber-door
  motes wait until Seymour falls.
- **Both:** the arena's light shifts on key beats (Seymour Flux's Reflect, Yunalesca's later forms,
  Anima, Bahamut's countdown, Vegnagun's links), and shadows under fighters read on dark floors.
- **Both:** Spiral Cut (FFX) and Mega Flare (FFX-2) are drawn as particle effects.
- **FFX-2:** in Chapter V, losing to Shuyin retries from Shuyin with your HP carried, Vegnagun's
  Bulwark rings are flattened to the picked frame, and the enemy-move card stays off Vegnagun's face
  and weapons.
- **FFX-2:** a chained fight shows the spoils of every battle, not just the last, and an
  all-petrified party is a Game Over at once.
- **FFX:** Chapter X's Talk gives Tidus, Auron and Yuna a line each, and Seymour answers. Mid-battle
  lines are spoken only by characters who are fielded, with stand-ins.
- **FFX:** in Chapter VIII, Rikku starts at sphere level 41 (our estimate; it was 53), and her line
  after Brother's is reworded.
- **FFX:** the target name plate sits off the party's faces, an Overdrive shows a "Tidus · Overdrive"
  plate, aeon tiles on the turn list show the aeon's painting instead of letters, and the Zanmato
  gauge holds until Yojimbo's strike ends. Kimahri's first turn has no dead key press.
- **Both:** the title opens on the picture, never black. The chapter board comes back on the last
  chosen chapter after a prep Esc, a results CONFIRM or a reload. The pause music stops when you
  resume a scene with no music, and a painting reloads once if a network hiccup drops it.
- **Both:** a smaller download: unused audio auditions and raw art renders no longer ship (about 180
  fewer files).

![A mid-battle story line on a small card](docs/screenshots/iter2-b4/linecard-v-1600-shuyin.jpg)

*Chapter V: Shuyin's line on a small card that stays clear of the girls and of Shuyin himself.*

All pictures for this build: [docs/changelog/release-22.md](docs/changelog/release-22.md)

## 2026-09-26 · Release 21

Address: https://baileypillon.github.io/pyrefly-reprise/ (main d8837334)

- **Both:** every spell now draws its own effect. Fire, Ice, Thunder, Water, Holy, Cure and physical
  blows get particle effects (a gold ring in FFX, a pink one in FFX-2), and the damage number waits
  until the spell lands. LOW EFFECTS and REDUCE MOTION keep the old glow.
- **FFX-2:** Chapter V stages Vegnagun as a colossus. Each part stands 4 to 6 girls tall under a low
  camera that looks up at it.
- **Both:** a boss draws its attack painting for a physical attack when it has one, and seven new boss
  poses arrive: Yojimbo's attack and hurt (FFX), and hurt poses for Trema, Logos, Leblanc, Ormi and a
  Syndicate goon (FFX-2).
- **Both:** on an upright phone the results page fills the screen: the painting full-bleed, ink
  tallies, party chips, and a CONFIRM or RETRY dock under your thumb.
- **FFX-2:** on a phone, Chapter XI's camera steps back on each Road link so every fighter is whole.
  On very wide windows the frame fills the whole window, the ALL ENEMIES / ALL ALLIES label scales
  with the stage, and a leftover menu cursor no longer shows as a corner reticle.
- **FFX:** in Chapter IX Kimahri no longer arrives with Doom already learned. The card's Doom row
  reads ??? until you lose once, and the guide teaches the race instead.
- **Both:** P opens and closes the pause, also over a pre-battle scene. On a touch screen the scene
  strip and Auron's briefing name taps, not keys.
- **Both:** advisor and intent text is plainer, the phone tip says which menu a move lives in, the
  "Guide's pick" tag only shows beside the move the guide names, and coach hints wait while a story
  card is up. FFX-2's advisor no longer says "call an aeon".
- **FFX-2:** Shuyin stands on the Farplane in Chapter V's close, the Farplane voice plays at most twice
  a battle, Chapter VI's Act III beats hold in either kill order, Leblanc's stray asterisks are gone,
  and Chapters VI and XV name their bosses on the card.
- **FFX:** Chapter VIII's party sound like themselves again and Evrae's Orders read as orders. In
  Chapter XII the advisor plans around Omnis's disc turns.
- **Behind the scenes:** tests now load a save from release 20 and check it still plays.

![Vegnagun's body looming over the party](docs/screenshots/vegnagun-a/build-desk-3-body-menu.jpg)

*Chapter V, link 3: Vegnagun's body fills the top of the picture and the girls stand at its feet.*

All pictures for this build: [docs/changelog/release-21.md](docs/changelog/release-21.md)

## 2026-09-26 · Release 20

Address: https://baileypillon.github.io/pyrefly-reprise/ (main ce05b02c)

- **FFX-2:** an all-target move now hits each target once. It used to wrap onto a girl already hit and,
  in Chapter V, skip a living Redoubt. Acta Est Fabula heals only the two Redoubts.
- **FFX-2:** an enemy's plain hit no longer closes your open command menu. Only a Delay or
  Action-cancel ability does.
- **FFX-2:** 23 new battle poses for the girls' dresspheres (Gunner, Warrior, Dark Knight, Alchemist,
  Songstress, White Mage, Black Mage and Rikku's Thief), seen in Chapters IV, V, VI and XIII.
- **FFX:** Sensor no longer opens a plate (a name, dashes and "SENSOR FAILED") for a target that is
  immune to it, such as Yojimbo, Isaaru and Seymour Omnis.

![The new dressphere poses in play](docs/changelog/img/release-20/main-new-poses.jpg)

*Twenty of the 23 new dressphere poses as they play in Chapters IV, V, VI and XIII.*

All pictures for this build: [docs/changelog/release-20.md](docs/changelog/release-20.md)

## 2026-09-26 · Release 19

Address: https://baileypillon.github.io/pyrefly-reprise/ (main 43dca986)

- **FFX-2:** new Chapter XV, the Den of Woe. Three fights in a row against the shades of Baralai,
  Gippal and Nooj. You arrive with three Hero Drinks and eight extra levels.
- **FFX:** in Chapter III the advisor no longer sends a healing item at a Zombie ally, and it letters
  the twin Yu Pagodas A and B on its card, the strategy panel and the target plate.
- **Both:** the intent card lists every possible target of a random-target move, and the phone intent
  strip keeps its SCRIPTED / MOST LIKELY badge so a guess never reads as certain.
- **FFX-2:** Shuyin's charge bar names the spell he is casting (Chapter V).
- **Both:** the advisor card keeps the chip that names the menu a move lives in, even at its smallest
  size.

![Chapter XV's first menu](docs/screenshots/den-of-woe-list/win-seed4-1600x900-08-first-menu.jpg)

*New Chapter XV, the Den of Woe: the first menu against Baralai's shade.*

All pictures for this build: [docs/changelog/release-19.md](docs/changelog/release-19.md)

## 2026-09-26 · Release 18

Address: https://baileypillon.github.io/pyrefly-reprise/ (main b975397b)

- **Both:** a new chapter select. Every card paints its boss on its own scene, the list keeps a fixed
  shape so a second click always starts the card you picked, and a beaten chapter wears a VICTORY sash
  and a ribbon with your best time. A strip counts your clears ("5 OF 13 BEATEN"), and a COMING card
  holds Chapter VII's place.
- **FFX:** Chapter X, Seymour Natus, is playable: the fight on the Highbridge of Bevelle. Its guide
  teaches Hasting only Tidus and Auron.
- **FFX:** Chapter XII, Seymour Omnis, is playable in the Garden of Pain, with painted discs, a disc
  strip and an intent line on the HUD.
- **FFX:** Chapter XIV, Isaaru, is playable: Yuna's aeons face Isaaru's three, Grothia, Pterya and
  Spathi, in the Via Purifico.
- **FFX-2:** Chapter XI, the Fallen Aeons, is playable: Shiva, the Sisters and Anima in a row on the
  Road to the Farplane. Each action takes 3 seconds to play out, which makes the chapter much easier
  to win at a human pace.
- **Both:** a cutscene's fade to black no longer hides the dialogue. Lines after a fade used to play
  over a blank screen in Chapter I's epilogue, the post scenes of Chapters II to VIII and Chapter XIV's
  close.
- **FFX:** Mortiorchis (Chapter I) and Mortibody (Chapter X) come back on stage when Mortibsorption
  revives them, instead of fighting on unseen.

![The new chapter select](docs/changelog/img/release-18/chapter-select-new.jpg)

*The new chapter select: the boss painted on its own scene, a fixed list, and a strip that counts your clears.*

All pictures for this build: [docs/changelog/release-18.md](docs/changelog/release-18.md)

## 2026-09-25 · Release 17.1

Address: https://baileypillon.github.io/pyrefly-reprise/ (main 1a680e41)

- **FFX-2:** the results screen's portrait wedge shows Yuna, Rikku and Paine in their FFX-2 art; it had
  drawn their FFX versions. A fallen leader lies down in the dressphere she wore. FFX results are unchanged.
- **FFX-2:** on phones, tapping a menu row now moves the cursor to that row first, so the target card and
  Confirm name the command you tapped.

![Chapter VI results with Yuna in her FFX-2 art](docs/screenshots/release17b/ch6-yuna-results-1600x900.jpg)

*Chapter VI results: Yuna stands in the portrait wedge in her FFX-2 art, not her FFX one.*

All pictures for this build: [docs/changelog/release-17-1.md](docs/changelog/release-17-1.md)

## 2026-09-25 · Release 17

Address: https://baileypillon.github.io/pyrefly-reprise/ (build e45ed3c1, cut from a side branch)

- **FFX-2:** 22 new painted battle poses for Yuna, Rikku and Paine in their dresspheres. Those moments used
  to show the standing painting.
- **Both:** the phone battle screen is repaired. ALL-target commands (Pray, Mega-Potion, group spells) get
  a touch Confirm step, the field slides to keep your party and the aimed figure whole, and every phone
  battle text is at least 14 px.
- **Both:** the results screen stands the speaker of the victory line in the portrait wedge, and the lines
  now rotate through the party. Chapter III's results card goes quiet.
- **FFX:** Chapter IX plays four mid-battle callouts, from Lulu, Auron, Kimahri and Yuna.
- **Both:** Chapter IX no longer draws placeholder silhouettes after an update. The browser re-checks the
  art list instead of trusting an old copy.
- **FFX-2:** Chapter XIII polish: the enemy-move card steers clear of the target ring, the pause CHAPTER tab
  leaves Trema's face clear and prints DRESSPHERE and GARMENT GRID in full, the phone view shows the
  Cloister fighters at full size, and the guide names the current link.
- **FFX-2:** an enemy hit on a girl whose command menu is open closes that menu, and she gets a fresh one
  at once.
- **Both:** a chapter's first attempt no longer always plays the same fight. It draws a fresh seed, so a
  newcomer's first try at Chapter I is no longer always the same loss.
- **FFX:** Chapter I's guide stops calling Protect a defence and stops promising a Holy Water turn.
- **FFX-2:** the guides for Chapters V and VI open with the Wait habit: pick a command at once, because the
  clock keeps running until you do.
- **Both:** Auron's briefing says plainly when each clock runs: in the FFX fights nothing moves until you
  act, and in the FFX-2 fights the clock keeps running until you pick a command.

![Rikku's new Black Mage cast](docs/concepts/art5/installed/IV-1600x900-rikku-black-mage-cast.jpg)

*Chapter IV: Rikku's new Black Mage cast painting in play.*

All pictures for this build: [docs/changelog/release-17.md](docs/changelog/release-17.md)

## 2026-09-25 · Release 16

Address: https://baileypillon.github.io/pyrefly-reprise/ (main fc7f1a20)

- **FFX-2:** Chapter XIII, Trema, is playable: the optional superboss on Cloister 100 of the Via Infinito,
  Paragon first and then Trema, with a level 99 party.
- **FFX-2:** Paragon's Oversoul gets its own look: an "Oversoul!" caption, then a blue cast, rim and motes.
- **FFX-2:** in Chapter XIII, Beguiling Mire's Stop and Paragon's Confuse wear off, and normal Paragon's
  physical attacks always land, as the sources say.
- **FFX-2:** a dressphere change no longer drops a girl's accessories (Crystal Bangle, Rabite's Foot) for
  the rest of the battle.
- **Both:** the phone battle screen is rebuilt as a compact rail: the turn list or boss gauge on top, big
  command tiles in thumb reach, the advisor as a one-line tip with GUIDE, three party chips, and a target
  card with Back and Confirm.
- **FFX:** in Chapter VIII the party is laid along the rail, so the command stack no longer covers Tidus.
- **FFX-2:** in Chapter V the Body stands on a new spot so the Left Bulwark's ring and plate clear the
  command window, and the Bulwark name plates dock clear of the enemy-intent card.
- **FFX-2:** the enemy-move card now sits above the fighters, keeps its chip with it, and clears when its
  enemy is KO'd.

![Chapter XIII's first menu](docs/changelog/img/release-16/trema-first-menu.jpg)

*New Chapter XIII, Trema: the first menu against Paragon.*

All pictures for this build: [docs/changelog/release-16.md](docs/changelog/release-16.md)

## 2026-09-25 · Release 15

Address: https://baileypillon.github.io/pyrefly-reprise/ (build 5be4babe, cut from a side branch)

- **FFX:** Chapter IX, Yojimbo, is playable: Lulu, Kimahri and Yuna face Yojimbo, Lady Ginnem and Daigoro in
  the last chamber of the Cavern of the Stolen Fayth, under a night-sakura tree, to a battle theme of its own.
- **FFX:** a gauge under Yojimbo's name shows how close his Zanmato is, and Doom's countdown shows over the
  doomed head and on the target plate.
- **FFX:** after the win Yojimbo and Daigoro are recalled, and Yuna's sending of Lady Ginnem is shown, not
  just told.
- **FFX:** summoned aeons no longer get the party's Items; an aeon's menu has no Item row.
- **Both:** petrified fighters now turn to stone: a grey tint with chips falling away.
- **FFX:** an enemy's Sensor chip leaves with the enemy instead of lingering after its fall.
- **FFX-2:** the top-right banner now shows Steal, Pilfer Gil and every other battle message, and a steal
  names its reward (Bahamut's says Mute Shock).
- **FFX-2:** Leblanc's fan is fully open in Chapter VI.
- **Both:** Auron's briefing counts the playable fights by itself, and the coaching lines stop calling the
  command menu a "list".
- **Both:** battles load in the background behind party prep and the opening scene, and the board's
  paintings are ready before the title wipes away, so the first menu comes up sooner.
- **Both:** chain fights keep one music track at a time: Chapter III's aeon gauntlet stays under Yu Yevon's
  theme, and Chapter V no longer starts Shuyin's theme early.
- **Behind the scenes:** the paintings for the next chapters (Omnis, Trema, Isaaru, Den of Woe) ride along
  in this build, but those chapters are not playable yet.

![Chapter IX's first menu](docs/screenshots/yojimbo-ship/list-1600x900-04-battle-menu.jpg)

*New Chapter IX, Yojimbo: the first menu, with the Zanmato gauge under his name.*

All pictures for this build: [docs/changelog/release-15.md](docs/changelog/release-15.md)

## 2026-09-25 · Release 14

Address: https://baileypillon.github.io/pyrefly-reprise/ (main 1c22066e)

- **FFX:** Chapter I: a Poison tick that carries Seymour Flux below half health no longer opens his second
  phase. Only a real hit does, as the sources say.
- **FFX:** Chapter I's target bracket clears the advisor's card again, and Rikku stands clear of the command
  stack again in Chapter VIII.
- **FFX:** formations repaired after release 13: Yunalesca stands where she stood before, and Auron and
  Yuna are eased apart in Chapter III.
- **FFX-2:** Chapter V's Vegnagun Body is drawn where it stood before release 13.
- **FFX-2:** Vegnagun's parts get clearer labels: the Left Bulwark's plate leaves the CHANGE row, the
  overhead Nodes get arrow markers at the top edge, and the first aim lights its row.
- **Both:** on phones, the pause screen lifts its columns clear of the chapter caption when they would
  overlap.

![Chapter V, third link, before and after](docs/screenshots/formation-repair/ch5-link3-1600x900.jpg)

*Chapter V, third link: Vegnagun's Body, before (left) and after (right) it is drawn where it stood before release 13.*

All pictures for this build: [docs/changelog/release-14.md](docs/changelog/release-14.md)

## 2026-09-24 · Release 13

Address: https://baileypillon.github.io/pyrefly-reprise/ (main a999d133)

- **FFX:** in Chapters I and III Yuna has a new slot, so the command stack no longer hides her.
- **FFX:** the command menu is drawn above the turn cut-in instead of under it.
- **FFX:** the ALL ALLIES and ALL ENEMIES chip hangs off the chosen row, and the ITEMS breadcrumb no longer
  hides under the help card.
- **FFX:** Chapter I: Mortibsorption now runs Seymour's Protect and Reflect threshold counters instead of
  dropping them, as the sources say.
- **FFX-2:** magic never rolls to miss, on either side. Enchanted Ammo keeps its sourced roll.
- **FFX-2:** aiming shows a TARGET plate, the acting girl's name and dressphere, and a controls hint; a
  victory that lands under an open menu closes it.
- **Both:** on the pause screen faces stay clear of the stat columns: the portrait slides when nothing else
  clears the face, and Paine's column stacks in Chapters V and VI.
- **Both:** on phones the party-prep chapter card is one stacked, scrolling page with readable text (it was
  about 3 px); on desktop PG UP and PG DN scroll the chapter columns.
- **Behind the scenes:** Chapters IX (Yojimbo), X (Natus) and XI (Fallen Aeons) ride along switched off.
  The chapter board still lists seven playable chapters, with Chapter VII as COMING.

![Chapter III's first menu with Yuna in view](docs/changelog/img/release-13/yuna-slot-chapter-iii-after.jpg)

*Chapter III's first menu: Yuna stands in view beside the command stack.*

All pictures for this build: [docs/changelog/release-13.md](docs/changelog/release-13.md)

## 2026-09-24 · Hotfix 12.3

Address: https://baileypillon.github.io/pyrefly-reprise/ (build e3b8c2a3, cut from a side branch)

- **FFX-2:** Wait mode now works as in the original: the clock keeps running while a girl's top-level
  command list is open and holds only once you open a submenu or the target cursor. A skill you chose now
  plays out while the next girl is choosing, instead of everything waiting for all three.
- **FFX-2:** the coaching lines for Wait mode (the first-turn bubble, the briefing line and the badge) are
  reworded to match.
- **Both:** leaving a battle before its fight has started (Escape during the opening) no longer throws an
  error or leaves an invisible fight running.

![The Wait coaching text in Chapter IV](docs/changelog/img/hotfix-12-3/wait-coaching-build.jpg)

*Chapter IV under Wait mode: the reworded coaching line says the gauges keep running while a list holds them.*

All pictures for this build: [docs/changelog/hotfix-12-3.md](docs/changelog/hotfix-12-3.md)

## 2026-09-24 · Hotfix 12.2

Address: https://baileypillon.github.io/pyrefly-reprise/ (build dc2669ac, cut from a side branch)

- **Both:** the target cursor opens on the sensible side: an enemy for attacks, debuffs and Dispel, a party
  member for cures, and a KO'd one first for revives. It used to open on the leftmost figure, often a
  party member.
- **FFX-2:** a faithful Wait mode (the clock runs while a girl's top list is open) is built but switched
  off; add ?wait=split to the address to try it.

![Power Break's cursor on the enemy](docs/screenshots/hotfix/target-default-ffx2-power-break-after.jpg)

*Chapter IV: choosing Power Break now opens the target cursor on the enemy, not on Yuna.*

All pictures for this build: [docs/changelog/hotfix-12-2.md](docs/changelog/hotfix-12-2.md)

## 2026-09-24 · Hotfix 12.1

Address: https://baileypillon.github.io/pyrefly-reprise/ (build bcbdb483, cut from a side branch)

- **Both:** Chapter II's pause CHAPTER tab no longer lets Auron's snapshot blow up across the chapter text.

![Chapter II's pause CHAPTER tab](docs/changelog/img/hotfix-12-1/pause-chapter-ii-after.jpg)

*Chapter II's pause CHAPTER tab: Auron's snapshot sits back in its strip.*

All pictures for this build: [docs/changelog/hotfix-12-1.md](docs/changelog/hotfix-12-1.md)

## 2026-09-24 · Release 12

Address: https://baileypillon.github.io/pyrefly-reprise/ (main 76f587c3)

- **FFX-2:** in Chapter VI, Dr. Goon and Fem-Goon are painted figures instead of stand-ins.
- **FFX-2:** Brother and Nooj speak with new dialogue portraits (Chapters VI and V).
- **FFX-2:** the one-line command-help band is back, pinned across the top of the screen. It clears the
  PAUSE chip and the enemy-intent card, and reads at phone width.
- **FFX-2:** while a command menu is open the camera stays on the idle frame instead of pushing in on the
  attacker, so the party and the target ring stay in view. Victory and story cameras still play.
- **FFX-2:** Vegnagun's tail has a steel tip instead of a green one (Chapter V).
- **Both:** on the pause screen each face is framed clear of the stat columns and stays on screen through
  the slow push-in; a resize glides to the new framing instead of jumping.
- **FFX:** Evrae's fall uses only approved paintings; its KO art no longer shows.
- **FFX:** the ALL ALLIES and ALL ENEMIES chip now clears the help card.
- **FFX:** the victory fanfare no longer plays through the aftermath scenes of Chapters I and II.

![Chapter VI with painted goons](docs/changelog/img/release-12/leblanc-goons.jpg)

*Chapter VI: Dr. Goon (green) and Fem-Goon (pink) painted, with Ormi, facing Yuna, Rikku and Paine.*

All pictures for this build: [docs/changelog/release-12.md](docs/changelog/release-12.md)

## 2026-09-23 · Release 11

Address: https://baileypillon.github.io/pyrefly-reprise/ (main d9decadb)

- **FFX:** Chapter VIII, Evrae, the airship-deck fight, is unlocked and playable. The wyrm of Bevelle
  attacks the Fahrenheit's deck from range: tell Cid to pull back or move in, and the stage re-sets near
  and far. Chapter VII still waits as "Coming".
- **FFX:** Evrae has its own scene and boss music, and the aftermath plays in silence: the victory
  fanfare is cut where the Bevelle scene begins.
- **FFX:** Evrae shrinks as it falls out of the sky when it is beaten.
- **FFX:** Sensor no longer reveals Cid, so a blank enemy card for him no longer takes over Evrae's
  enemy plate.
- **FFX:** Wakka's callout waits a beat after the camera cuts to Evrae's Inhale, so you can read the
  warning first.
- **FFX:** with a breath charged at range, the advisor offers a spare Potion, never a Defend row the
  menu does not have and never a move that names Evrae.
- **Both:** a second open tab no longer overwrites the first tab's saves. Settings, unlocks, clears and
  best times are merged (a volume change could be lost on reload).

![Chapter VIII on the chapter board](docs/changelog/img/release-11/evrae-card-selected.jpg)

*Chapter VIII, Evrae, selected on the chapter board: it is open for play, and Chapter VII still shows COMING.*

All pictures for this build: [docs/changelog/release-11.md](docs/changelog/release-11.md)

## 2026-09-23 · Release 10

Address: https://baileypillon.github.io/pyrefly-reprise/ (main 5348c2e3)

- **FFX-2:** Chapter VI is finished to the chosen look. Leblanc, Logos and Ormi use their cast painting
  for every move and their idle when hit, Ormi's shield carries the Syndicate heart, and a beaten
  villain steps back and leaves instead of dissolving.
- **FFX-2:** Rikku's Steal and Pilfer Gil work in Chapter VI (they did nothing), and Grenades no longer
  always land a critical hit.
- **FFX-2:** Vegnagun's parts get their sourced steals and names (Node A to C, Right and Left Bulwark,
  Right and Left Redoubt) with no extra HUD letters, and the guide no longer suggests Reflecting the Leg.
- **FFX:** Doublecast now asks for a spell and an enemy target. Before, it cast twice on Lulu herself.
- **Both:** each party member's first turn opens with the turn cut-in, without delaying the menu, and a
  Confirm press skips the battle's opening camera sweep.
- **Both:** the pause owns the screen. Nothing paints over it, OPTIONS scrolls on a phone, the CHAPTER
  tab shows the chapter's own plate, and the text sits on the empty side of every portrait.
- **Both:** the enemy-intent panel hides under the pause, its odds match the move that was rolled, and
  a MORE key reveals clipped text.
- **Both:** a KO'd fighter lies on the floor, the target ring sits on the floor under lifted figures
  such as the Yu Pagodas, and the dim on non-targets is stronger.
- **FFX-2:** white costumes (Yuna's Gunner top, Leblanc's dress) no longer blow out under the bloom.
- **FFX-2:** Chapter V's fifth linked fight opens its menu on Shuyin and all three girls, and HP and MP
  carried into the next linked fight no longer read above the maximum.
- **FFX-2:** the first-time gauge hint speaks Wait mode instead of telling you not to wait.

![The idle paintings of Leblanc, Logos and Ormi](docs/changelog/img/release-10/chapter-vi-idles.jpg)

*Chapter VI's cast: the idle paintings of Leblanc, Logos and Ormi.*

All pictures for this build: [docs/changelog/release-10.md](docs/changelog/release-10.md)

## 2026-09-23 · Release 09

Address: https://baileypillon.github.io/pyrefly-reprise/ (main 5ddfde30)

- **FFX-2:** Chapter VI, The Leblanc Syndicate, is playable: "A Farce, Armed" at Chateau Leblanc, in
  three acts against Ormi, Logos and Leblanc. Its poses are the best candidates so far, and it borrows
  Chapter IV's music for now.
- **FFX-2:** Wait is the default battle mode again: an open command menu holds the clock. Active and an
  ATB speed (Slow, Normal, Fast) are options in the pause menu, and older saves flip to Wait once.
- **FFX-2:** a girl whose command is chain-locked keeps her menu and her command instead of losing the
  menu to the next ready girl.
- **FFX-2:** heals and items on your own side never miss, Leblanc's White Wind now heals and cures her
  crew, and the Syndicate stands at party scale (Ormi had towered over the party).
- **FFX-2:** the advisor no longer spends a cure, raise or item that another girl already has charging,
  and its card stays off the party's HP rows between linked fights.
- **FFX-2:** the first-turn badge reads correctly under Wait.
- **Both:** scene, boss and phase music now fades in at the right speed. It had been sitting near
  silence for whole fights.
- **Both:** the enemy-intent panel (E) fills in again. It had been opening empty.
- **Both:** the victory screen keeps the leader's whole head, the pause CHAPTER tab's pictures load and
  its captions wrap, the pause no longer lets mouse clicks through to the battle, and the advisor
  card's text is at least 12 px on desktop and phone.
- **FFX:** Auron's first-turn hint no longer covers the advisor card or the command list.
- **Both:** chapter select shows Chapter VI as playable and Chapters VII and VIII as locked "Coming"
  cards.

![Chapter VI at Chateau Leblanc](docs/changelog/img/release-09/chapter-vi-battle.jpg)

*New Chapter VI: the first fight at Chateau Leblanc.*

All pictures for this build: [docs/changelog/release-09.md](docs/changelog/release-09.md)

## 2026-09-21 · Release 08

Address: https://baileypillon.github.io/pyrefly-reprise/ (main 1b339718)

- **Both:** the pause screen is remade as a character screen with one painted close-up per member: a
  tab strip (each member, CHAPTER, GUIDE, OPTIONS, CONTROLS, MUSIC), thin meters over the painting, and
  the chapter's goal in one big line. RESTART ENCOUNTER now works from a chapter entered normally.
- **Both:** Auron's briefing is on: 20 skippable seconds in Auron's voice on a first launch, then a
  one-line hint the first time each mechanic matters. Replay it from the pause menu or the title, or
  switch the hints off.
- **FFX-2:** Active ATB: the clock keeps running while a command menu is open, and a command always
  goes to the girl whose menu was open.
- **Both:** the move advisor plans one enemy turn ahead and never recommends a move that does nothing.
  A test player that always follows its top pick now wins Chapter III in 39 of 40 runs, where it won none
  before.
- **Both:** the dialogue card fits every portrait to its slot, Jecht's face is fixed, and the card fits
  a phone.
- **FFX-2:** party prep, results and chapter select show real faces for Rikku and Paine instead of
  letters.
- **FFX:** Nulblaze, Nulfrost, Nulshock and Nultide cover the whole party.
- **FFX-2:** Eject now really removes its target from the fight. Before, it only showed a badge.
- **Both:** the 31 repainted poses from Build B.1 go back to the earlier paintings, which look better
  at full size. The 11 poses that filled gaps stay.
- **Both:** title and chapter select text is at least 14 px (12 on a phone), and on touch you can tap
  anywhere on the title plate to start.
- **Both:** the first-turn hint keeps the command menu visible, the pause tab strip scrolls to the
  selected tab, and phone tap targets and HUD labels are larger.

![The remade pause screen](docs/changelog/img/release-08/pause-tidus.jpg)

*The remade pause screen: Tidus's page in Chapter I, with a painted close-up, thin meters and the chapter's goal in one line.*

All pictures for this build: [docs/changelog/release-08.md](docs/changelog/release-08.md)

## 2026-09-21 · Build B.1

Address: https://baileypillon.github.io/pyrefly-reprise/ (main 8f482378)

- **Both:** the title screen moves. Painted layers drift with the pointer, stick and time, the two
  figures on the shore are ink silhouettes, and pyreflies rise through the frame, all on the approved
  key art.
- **Both:** chapter select is a board of eight cards in two game groups. An uncleared chapter shows its
  boss as an ink silhouette, a cleared one shows the painting, and three new chapters wait as locked
  "Coming" cards. Both screens are now full-bleed.
- **FFX:** new poses for Lulu, Rikku, Kimahri, Yunalesca's second and third forms, the Yu Pagoda and
  Jecht, part of 42 approved poses installed in this build.
- **FFX-2:** the rest of the 42: four Yuna dresspheres, both Paine dresspheres, the possessed Bahamut
  and three Vegnagun parts, plus Lenne's portrait.
- **Behind the scenes:** new release rules: ship when a build is better than the live one, with the
  deep review following on the live build.

![The chapter board of eight cards](docs/changelog/img/build-b-1/chapter-select.jpg)

*The new chapter board: eight cards in two game groups, with each uncleared boss as an ink silhouette.*

All pictures for this build: [docs/changelog/build-b-1.md](docs/changelog/build-b-1.md)

## 2026-09-21 · Build A.2

Address: https://baileypillon.github.io/pyrefly-reprise/ (build fd0ae96d, cut from a side branch)

- **FFX:** Threaten and Sleep now play out. An enemy hit by either used to vanish from the turn queue,
  so the status never ran out, and a Threatened boss now stops countering.
- **FFX:** Yu Yevon: only your own actions draw his Curaga, and Gravija reaches everyone on the field,
  Pagodas included, so wearing him down works.
- **Both:** a party row no longer shows a downed ally alive for two seconds, and numbers no longer run
  ahead of their bars. The rows now move with each blow.
- **FFX:** results credit AP and S.Lv to whoever took a turn, and duplicate enemies keep their A and B
  letters when one dies.
- **Both:** wording fixes: single-target Haste is no longer called party-wide, the intent panel drops
  its empty Damage section for status moves, the pause says "Battle 2 of 4" instead of "Link", and the
  strategy guide always ends on a whole line.
- **Both:** saved volume and mute apply at start-up, not only after opening the pause.
- **FFX-2:** the Attack submenu no longer lists two ATTACK rows, the command list's scroll arrow sits
  on the list, and a Berserked girl with no Attack command no longer locks the battle on an empty menu.
- **FFX:** new dialogue portraits for young Auron, the Fayth boy, Braska and Yu Yevon.
- **FFX-2:** new dialogue portraits for Paine, Shuyin, Yuna and Rikku. Their names no longer print as
  "Yuna X2" and "Rikku X2".
- **Behind the scenes:** every deploy now ships a list of every file with its hash, so the live site
  can be checked byte for byte against the build.

![Face crops of the new speaker portraits](docs/changelog/img/build-a-2/new-portrait-crops.jpg)

*The eight new dialogue portraits as face crops, with the eye line drawn on.*

All pictures for this build: [docs/changelog/build-a-2.md](docs/changelog/build-a-2.md)

## 2026-09-19 · Build A

Address: https://baileypillon.github.io/pyrefly-reprise/ (main 7191674d)

- **Both:** fights end properly. Chapter IV no longer freezes after Bahamut's last blow, and the closing
  scenes of Chapters I, II, III and V now play their dialogue. They had never shown it.
- **Both:** every boss fight plays its own theme (the first fight of each chapter had played the
  generic battle music), and the scene, victory, ending and pause music is wired in. The battle theme
  is re-rendered, as the shipped file came from an older score.
- **Both:** a BATTLE START card introduces each fight with the boss's painting, the chapter name and
  your party's faces. Enter now moves story scenes along, and holding it skips them.
- **FFX:** Wakka's Slots and Attack Reels deal real damage, Lulu's Fury casts every Black Magic spell
  she knows, and Steal, Mix, Death Fury and Zanmato now do what the menu says. Before, they spent a
  turn, often a full Overdrive gauge, on nothing.
- **FFX:** Talk works. It can zero Jecht's gauge, and against Seymour Flux it gives Kimahri +10 Strength
  and Yuna +10 Magic Defense, once each.
- **FFX:** Yu Yevon can be beaten (Doom through the Candle of Life, or Reflect), and Seymour Flux
  follows its Flare, wait, Flare loop.
- **FFX-2:** Charon now costs the girl who casts it. It had been a free, repeatable nuke.
- **FFX-2:** one Change command opens the dresspheres by name, a spherechange plays its flourish (a
  white column, petals, a ring from her feet, the outfit named), the chain counter shows a big numeral,
  and party prep gains a STATS tab.
- **Both:** the advisor (N) always answers for a fallen ally, even a Zombie.
- **Both:** target selection is clear: a pointing hand in FFX, a six-petal flower in FFX-2, a bracket
  sized to the figure, an ink name plate with its letter, an ALL label for party-wide moves, and a
  quiet dim on everyone else. No enemy hides behind another any more (the Yu Pagodas had been hidden).
- **FFX:** a party Switch no longer leaves the incoming member off the field, the Sensor card folds to
  a chip after seven seconds, and unscanned enemies show ??? with no HP bar.
- **Both:** the pause screen copes with 4:3 and small windows. The quote no longer prints across the
  menu rows.

![Paine's spherechange flourish](docs/changelog/img/build-a/spherechange-flourish.jpg)

*Chapter IV: Paine's spherechange flourish, a pale column and a ring at her feet.*

All pictures for this build: [docs/changelog/build-a.md](docs/changelog/build-a.md)

## 2026-09-19 · Build of 2026-09-19 (main 5a82e712)

Address: https://baileypillon.github.io/pyrefly-reprise/ (main 5a82e712)

- **Both:** a new score. 21 pieces are re-recorded with sampled orchestral instruments and played from
  files, with the old in-browser synth as a fallback, and loops no longer click when they wrap. The
  title, chapter select and battle pieces play now; the scene, boss, victory and ending pieces reach
  the fights in Build A.
- **Both:** all 134 sound effects are rebuilt from struck glass, bells, harp, choir and breath, and sit
  in the music's hall.
- **Both:** the move advisor only recommends what the acting character can press, says which menu a
  move lives in ("Poison Fang, in Items"), hands the turn to whoever owns the move, and prices a revive
  from the board. Research citations leave the card, and its tag becomes "Guide's pick".
- **Both:** the pause screen's painting is full-bleed at any window shape, with 2x plates and type that
  scales, and its phone layout is fixed.
- **Both:** portrait crops are read from each painting, so heads are no longer cut through the chin
  (Auron's was).
- **FFX:** the HUD stays clean. The old "Choose a Rage" slab no longer lingers on the field, turn-list
  names fit, the advisor card finds free space instead of covering Tidus and Kimahri, and one tap of
  Esc backs out of a menu without also opening the pause.
- **FFX-2:** party prep gets Dresspheres (with the Garment Grid), Accessories and Items tabs, party rows
  show painted faces (Paine gets one at last), and the intent slab and advisor stop standing on the
  girls.
- **Both:** the strategy guide says "the party" when a move hits the party.

![Chapter IV with painted faces on the party rows](docs/changelog/img/build-5a82e712/ffx2-battle-hud.jpg)

*Chapter IV's party rows now carry painted faces, Paine's at last.*

All pictures for this build: [docs/changelog/build-5a82e712.md](docs/changelog/build-5a82e712.md)

## 2026-09-18 · Build of 2026-09-18 (main 822ae16a)

Address: https://baileypillon.github.io/pyrefly-reprise/ (main 822ae16a)

- **Both:** Esc and P open the pause screen for real, even at the battle command menu. Esc still backs
  out of a submenu or targeting first, and H hides the pause panels to show the scene behind.
- **Both:** N opens a move advisor for the character whose turn it is, showing what each option is
  likely to do.
- **Both:** E opens an enemy-intent panel: the boss's next move, its damage and status ranges, and the
  counters that matter.
- **Both:** new painted art for the aeons, the FFX-2 cast and the remaining bosses.
- **FFX-2:** Chapter V's Lenne, Shuyin and Vegnagun head now show their shipped paintings.
- **Behind the scenes:** art is served through a generated manifest, so a missing variant no longer
  comes back as the page in place of an image and the network panel stays clean.

![The move advisor card in Chapter I](docs/changelog/img/build-822ae16a/move-advisor.jpg)

*The new move advisor card for Tidus in Chapter I (bottom centre), with the enemy-intent panel open above it.*

All pictures for this build: [docs/changelog/build-822ae16a.md](docs/changelog/build-822ae16a.md)

## 2026-09-18 · Build of 2026-09-18 (main 0c45fc8a)

Address: https://baileypillon.github.io/pyrefly-reprise/ (main 0c45fc8a)

- **Both:** a pause screen in the Ink & Gold style: a hero painting and command column over the frozen
  battle, chapter notes that check the objectives against the real battle, encounter progress and play
  time, party cards, a music player and a photo mode. Resume picks the fight up on the same turn.
- **Both:** the party-prep screens get a CHAPTER tab with the same notes, and FFX-2 prep gets its first
  tab.
- **Both:** expressive hero close-ups for all five chapters and the cast.
- **Both:** a strategy guide panel (G) with per-chapter rules, on by default in both battle HUDs.
- **Both:** fighters face their opponents and come alive: idle drift, a hit flash and a fall on KO,
  plus a quick turn in 3D.
- **Both:** battle moments: a swirl into battle with the party sliding on and a slow reveal of the
  boss's name, a punch-in on the acting fighter, a hard cut to the target on impact, and a charge
  warning with a zoom and a heartbeat vignette. FFX Overdrives get a banner with letterbox.
- **FFX-2:** Chapter IV's pause pictures no longer show an all-black tile.

![The pause screen over Chapter I](docs/changelog/img/build-0c45fc8a/pause-screen.jpg)

*The new Ink & Gold pause screen over Chapter I.*

All pictures for this build: [docs/changelog/build-0c45fc8a.md](docs/changelog/build-0c45fc8a.md)

## 2026-09-17 · Build of 2026-09-17 (main aaf8362a)

Address: https://baileypillon.github.io/pyrefly-reprise/ (main aaf8362a)

- **Both:** essentially the same game as the morning build.
- **FFX:** newer paintings for most of the party (Tidus, Yuna, Auron, Kimahri, Wakka, Lulu, Rikku) and
  for several bosses (Mortiorchis, Seymour Flux, Braska's Final Aeon, Yunalesca, Yu Yevon and the Yu
  Pagodas).
- **Behind the scenes:** the first build pushed by the new deploy script, which also writes every
  deploy into a log.

![Paintings new in this build](docs/changelog/img/build-aaf8362a/new-paintings.jpg)

*Paintings that changed in this build: Yunalesca's first form (before, then after), Auron hurt and Wakka casting.*

All pictures for this build: [docs/changelog/build-aaf8362a.md](docs/changelog/build-aaf8362a.md)

## 2026-09-17 · Build of 2026-09-17, 11:14 (before deploys were logged)

Address: https://baileypillon.github.io/pyrefly-reprise/ (hand-built from the working tree, no main sha)

- **Both:** all five chapters can be won with the canon tactics, and the wrong tactics still lose. No
  boss was weakened to get there.
- **FFX:** Switch works. Every Switch row had been disabled, so four of the seven guardians could never
  enter a battle.
- **FFX:** Chapter I follows the research: Seymour Flux's attack cycle runs in the right order and
  Cross Cleave uses Seymour's stats instead of the mount's, Kimahri's Ronso Rage uses the Rage you pick
  (it always came out as Jump), and the aeons start with their researched Overdrive gauges.
- **FFX:** Chapter II's party carries Confuse Ward as the research says, and Chapter III's possessed aeons
  match the research (Passado hits 15 times).
- **FFX-2:** Vegnagun is the real fight. Darkness costs an eighth of the caster's max HP, the Bulwarks
  retaliate, the Nodes spin and Odi Et Amo fires.
- **FFX:** the Sphere Grid tab is a real, readable grid (it was a dark strip), party prep's Stats tab
  reflects equipment, the CTB turn list shows portraits instead of letters, Sensor shows element chips,
  and Dream's End's drifting fragments have real textures.
- **FFX-2:** the three girls stand in three slots (Yuna and Rikku had been drawn on top of each other),
  boss gauges carry names and numerals, and damage numbers appear in FFX-2 battles for the first time.
- **Both:** damage numbers sit on the fighters, fan out of one lane and dodge the menus, so multi-hit
  and chain numbers no longer stack. Enemies no longer hide behind the right-hand HUD column.
- **Both:** the results screen shows the real fight time (it read 0:00) and a distinct defeat panel,
  and best times are recorded.
- **Both:** a cast no longer blows Rikku out to pure white, and Braska's Final Aeon no longer turns into
  a flat green shape when it is healed.
- **Both:** chapter select and dialogue layouts are rebalanced, and mid-battle story lines play for
  every trigger and keep the HUD.

![Chapter IV with the three girls in three slots](docs/changelog/img/build-0917-1114/ffx2-three-slots.jpg)

*Chapter IV: the three girls stand in three slots, where Yuna and Rikku had been drawn on top of each other.*

All pictures for this build: [docs/changelog/build-0917-1114.md](docs/changelog/build-0917-1114.md)

## 2026-09-16 · Alpha 3

Address: https://baileypillon.github.io/pyrefly-reprise/ (hand-built from the working tree, no main sha)

- **Both:** a hurt or KO'd fighter is no longer drawn oversized. A downed Tidus had lain at about twice
  his standing scale and overlapped the fighters beside him.
- **FFX:** the Zanarkand scene is relit.
- **FFX:** the command menu drops the Defend row, which is not a row in FFX's command window.
- **Both:** the story scripts are wired into the chapters.

![The Zanarkand Dome scene after the relight](docs/changelog/img/alpha-3/zanarkand-after.jpg)

*The Zanarkand Dome scene after the relight.*

All pictures for this build: [docs/changelog/alpha-3.md](docs/changelog/alpha-3.md)

## 2026-09-16 · Alpha 2

Address: https://baileypillon.github.io/pyrefly-reprise/ (hand-built from the working tree, no main sha)

- **Both:** the Ink & Gold battle HUD work, audio and chapter-content wiring done since alpha 1.
- **FFX:** updated character paintings for Kimahri, Lulu and Yuna and for the second forms of Braska's
  Final Aeon and Yunalesca.

![Chapter IV battle with the Ink & Gold HUD](docs/changelog/img/alpha-2/chapter-4-battle.jpg)

*Chapter IV in Alpha 2, with the Ink & Gold battle HUD.*

All pictures for this build: [docs/changelog/alpha-2.md](docs/changelog/alpha-2.md)

## 2026-09-16 · Alpha 1 (the first public build)

Address: https://baileypillon.github.io/pyrefly-reprise/ (hand-built from the working tree, no main sha)

- **Both:** the first public build, pushed by hand to GitHub Pages as an early alpha with all five
  planned chapters in place.
- **FFX:** Chapter I, Seymour Flux and Mortiorchis on Mt. Gagazet. Chapter II, Lady Yunalesca in three
  forms in the Zanarkand Dome. Chapter III, at Dream's End, is Braska's Final Aeon, five possessed aeons
  and then Yu Yevon, one link after another (measured on release 38: about 27 minutes of fighting,
  seven links, a bench median of 137 turns). Battles run on the Conditional Turn-Based rules.
- **FFX-2:** Chapter IV, Bahamut in Bevelle Underground. Chapter V, Vegnagun and then Shuyin on the
  Farplane. Battles run on Active Time Battle gauges, with dresspheres, spherechange and chains.
- **Both:** painted 2.5D from the start: a painted backdrop for each of the five scenes, painted title
  and chapter-select pictures, and painted party, aeon and boss figures, about 700 painted files in all.
- **Both:** Ink & Gold menus, gold for FFX and pink for FFX-2, across the title, chapter select, party
  prep (Sphere Grid, equipment, items and Overdrive modes, or the Garment Grid for FFX-2), dialogue,
  battle and results screens.
- **Both:** 18 original music tracks and sound effects, synthesised in the browser.
- **FFX:** 343 abilities and 69 items are wired into battle.

![The Alpha 1 title screen](docs/changelog/img/alpha-1/title.jpg)

*The title screen of the first public build.*

All pictures for this build: [docs/changelog/alpha-1.md](docs/changelog/alpha-1.md)

## 2026-09-15 · Project start

- **Both:** the project begins as an unofficial, non-commercial fan tribute under the working title
  Pyrefly Reprise (it became Echoes of Spira on 2026-10-04): five of the most memorable boss
  encounters from Final Fantasy X and X-2, with faithful combat. All code, art, music and writing are
  original.
- **FFX:** three FFX encounters are planned: Seymour Flux and Mortiorchis on the Mt. Gagazet trail,
  Lady Yunalesca in the Zanarkand Dome, and Braska's Final Aeon through the possessed aeons to Yu Yevon
  at Dream's End.
- **FFX-2:** two FFX-2 encounters are planned: Bahamut in Bevelle Underground, and Vegnagun and then
  Shuyin on the Farplane.
- **Both:** built for the web with TypeScript, Vite and Three.js, with menus in HTML and CSS and music
  made in the browser. It was chosen over Unreal so a friend can open a link and play. FFX fights get a
  Conditional Turn-Based engine and FFX-2 fights an Active Time Battle engine.
- **Both:** the look was planned as pixel-art sprites in small 3D scenes. After the first screenshots
  read as a retro prototype, it changed the same day to painted 2.5D, with painted backdrops and
  painted character poses standing in lit 3D scenes.

![A painted 2.5D battle concept](docs/changelog/img/project-start/painted-battle-concept.jpg)

*The painted 2.5D battle concept the project switched to on its first day.*

All pictures for this build: [docs/changelog/project-start.md](docs/changelog/project-start.md)
