# FF7 battle HUD: "A, even more faithful" (the build spec)

**Game case: FF7 only** (AGENTS.md rule 14). Everything here applies to the hidden, experimental
FF7 encounters (Guard Scorpion first) and to nothing else: no FFX or FFX-2 HUD, chrome, menu, token,
font or screen changes. New code lives under `src/ui/ff7/**`; new tokens are FF7-scoped (`--ff7-*`,
loaded only by the FF7 HUD); new fonts load only on the FF7 screen.

**What this is.** Bailey picked option A of the FF7 HUD round (`docs/concepts/ff7-hud-2026-09-27/`,
decision D-237) and named one change: "it needs to be EVEN more faithful than a", plus "look at our
other project (lifestream encore it might have done most of the menu look and feel already)". This
file holds (§1) the sources, (§2) what Lifestream Encore (`D:\FF7`) already has and what we reuse,
(§3) the FF7 battle-screen facts, measured and tagged, (§4) every place A departs from FF7, (§5) the
exact spec for the refined target, (§6) the phone adaptation, (§7) the fidelity checklist, (§8) what
stays out, (§9) what needs Bailey.

**What it is not.** It approves nothing beyond what Bailey named (liked: A; must change: more
faithful; must remain: FF7-only scope). The refined target is one frame pair (1600x900 and 390x844)
built from this spec and shown to Bailey as the one refinement of the end-state rule, before
`src/ui/ff7/**` is integrated (rule 9). A pick of that frame approves only what Bailey names.

**Tags.** `[verified: N sources]`, `[single source]`, `[measured]` (read off reference stills by
pixel sampling, see §1), `[unsourced]` (our estimate; label it as such wherever it shows).
**Units.** "u" is one pixel of FF7's PlayStation battle picture, **320 x 224 visible** (the 320x240
captures carry the picture on rows 8 to 231; every y below is measured from the top of the picture).
The band and window numbers were measured on three PlayStation stills and cross-checked on three PC
stills; they agree to about 1 u.

---

## 1. Sources

| # | Source | What it gave |
|---|---|---|
| S1 | **Official FF7 manual** (Sony, PlayStation Classic edition, `secure.cdn.us.playstation.com/manuals/classic/games/final-fantasy-vii-manual-en.pdf`), "The Battle Screen", "Battle Commands", "Configuration" | triangle mark over the ready character; SELECT opens the help window (command descriptions, monster names); names with Barrier and MBarrier gauges, hidden behind the Command window, SQUARE shows them; status window order "remaining HP, maximum HP (or the current status name), remaining MP and the Limit gauge/Time gauge"; thin HP/MP gauges under the numbers that "change from their standard full color to red as they become depleted"; white damage, green recovery; the Limit gauge "blinks" when full and Attack becomes Limit; red arrow beside an All spell, grey for an uncastable spell; Change at the left edge and Defend at the right edge of the command window; "finger cursor"; Fury shows the Limit gauge red, Sadness blue; four-corner RGB window colour; ATB Active / Recommended / Wait |
| S2 | **Final Fantasy Wiki**, "Menu (Final Fantasy VII)", revid 3873754, Config section (read through `api.php`) | default window colours "Blue 176 (TL), Blue 128 (TR), Blue 80 (BL), and Blue 32 (BR)"; Wait stalls ATB during animations, open submenus and target selection |
| S3 | **Final Fantasy Wiki**, "Final Fantasy VII battle system", revid 4039023 | Near-death: HP digits turn yellow below 25%; Sadness = blue Limit bar, Fury = red; only party ATB gauges are visible |
| S4 | **Reference stills on the Final Fantasy Wiki** (retail frames, downloaded to `D:\Tools\pyrefly-scratch\ff7-hud-ref\` for measurement only, never into the repo): `Ff7_limit_break.jpg` (PS1, full 320x240, Guard Scorpion), `FFVII_Rifle.png` (PS1 crop, Guard Scorpion, custom window colour), `Cloud_Suggestion.jpg` (PS1, Guard Scorpion hint), `FFVII_Normal_Formation.jpg` (PS1), `FFVII_Config.png` (PS1 Config, 640x480), `FFVII_Tifa_Slash-All.png`, `Search_Scope.png`, `Tail_Laser.png`, `FFVII_Barrier_Status.png`, `FFVII_Bolt.png`, `FFVII_Cloud_Attack.png` (PC, 640 wide), `FFVII_Limit.gif`, `FFVII_Limit_Gauge_Fury.PNG`, `FFVII_Barriers_Gauge.PNG` | every `[measured]` number: layout, frame bevel, gradients, gauge colours, text colours, the Limit command colour cycle |
| S5 | **ff7tk** (sithlord48/ff7tk, the Black Chocobo save-editor library), `src/data/FF7SaveInfo.h` `DEFAULT_SAVE` bytes 0x48 to 0x53, with the savemap layout (FFRTT wiki "FF7/Savemap": 0x48 UL, 0x4B UR, 0x4E LL, 0x51 LR) | the **PC** new-game window colours: UL (0,88,176), UR (0,0,80), LL (0,0,128), LR (0,0,32) |
| S6 | Steam Community, FINAL FANTASY VII (app 3837340) thread "Different Default Window Color for PC & Console?" (poster bat0) | "on PSX ... 176 - 128 - 80 - 32", Steam versions "176 - 80 - 128 - 32" (TL, TR, BL, BR) |
| S7 | GameFAQs: FF7 Game Mechanics FAQ (ps/197341, faqs/71240); six board threads on window colours (69958036, 71820649, 59491833, 50050579, 64155283, 51874240) | ATB behaviour, Limit behaviour; the threads confirm "default blue" but **give no numbers** |
| S8 | `research/ff7-guard-scorpion.md` (ours) | the hint lines verbatim, "Locked On Target", ability names |
| S9 | Lifestream Encore (`D:\FF7`): `docs/research/audio-type.md` Part 4 and 5, `docs/ARCHITECTURE.md` §9.4 and §12, `docs/art/BLEND-STYLE.md` §2.4 and §6, `docs/art/REFERENCE-BOARDS.md` §3, `concept/lib/hud.mjs`, `concept/reactor-battle.html`, `src/ui/**` | Bailey's earlier decisions and code (see §2) |

**Conflict on the default window colours.** S2, S6 (PSX) and our measurement of the PlayStation
Config still (S4: corners read 174 / 126 / 80 / 32, blue only) agree on **TL 176, TR 128, BL 80,
BR 32, blue only**. The PC releases differ: S5 (PC save template) has TR 80 / BL 128 and a green 88 in
the top-left, and S6 says the Steam versions swap TR and BL. No GameFAQs source gives numbers (S7).
**We use the PlayStation values**: they are the 1997 original, three sources agree, and the stills
measure them. Tag: `[verified: 3 sources, PS1]`, PC variant noted.

---

## 2. Lifestream Encore: what it has, what we reuse, what we do not

Bailey's own verdicts on that project, from its transcripts: "I love the UI menus and style but not
the character models and environments really..." (2026-09-16) and "I really like the UI elements but
the character models, enemy models, and backgrounds really suck" (2026-09-17). Its docs record the
windows as **"UI Style A (locked, the user likes it)"** (`REFERENCE-BOARDS.md` §3) and
**"The HUD is byte-locked ... If a change would make a player squint and ask 'is that still FF7?',
it is out of bounds"** (`ARCHITECTURE.md` §9.4).

| LE file | What it is | Verdict for us |
|---|---|---|
| `concept/lib/hud.mjs` (214 lines) | The "OG-faithful" DOM HUD: `.win` blue windows, command window, Limit-technique window, party table (HP / MP / Time / Limit), enemy-name window, centred message window, dialogue window, results strip, `CURSOR_SVG` glove, floating damage text, letterbox, `typeText()` typewriter | **Reuse**: `CURSOR_SVG` (Bailey's own glove drawing; adjust per §5.6), `typeText()`, the DOM structure (`buildHUD` → handle object with `setWin`, `addDmg`). **Do not reuse its colours or positions** (see the departures below). |
| `concept/reactor-battle.html` (2677 lines; HUD CSS lines 20 to 135) | The Guard Scorpion battle mock Bailey liked: party rows with a BARRIER bar under each name, HP/MP with thin bars, TIME and LIMIT gauges with a glint, the hand cursor on Attack, damage numeral "247" | **Reuse** the barrier-bar and gauge markup idea (`.gauge` + fill + `.glint`) and the damage-numeral outline technique (8-way text-shadow). Colours and order change (§5). |
| `src/ui/types.ts` | `WindowColour { topLeft, topRight, bottomLeft, bottomRight }`, `OG_WINDOW_COLOUR` = 176 / 128 / 80 / 32 blue, `WindowProps` ("square corners, never rounded"), `CursorProps` (static glove, appear/blink only), `BattleHudState` | **Reuse the types and the default** (they match §3.1); port to strict TS with `.ts` imports. |
| `src/ui/components/cursor.ts` | `cursorSVG()`, a second glove drawing (70x56 viewBox) | Candidate glove #2 for §5.6. |
| `src/ui/theme.css` (406 lines) | Tokens `--win-grad`, `--win-border`, `--win-inner`, `--win-radius: 4px`, fonts Rajdhani / Cinzel / Titillium | Reuse the token *pattern* only, FF7-scoped. |
| `concept/anim-limit.html` | Attack → Limit swap when the gauge fills, Limit window, name flash while Limit is chosen | Reuse the swap and timing logic; its gold "Limit" label becomes the colour cycle of §5.9. |
| `docs/research/audio-type.md` §5 | OG UI conventions: four-corner colours (176/128/80/32), HP yellow at 1/4, white/green damage, MISS and Death words, Time/Limit "both yellow", three ATB modes | Facts reused where S1 to S4 confirm them. **Two are wrong against the stills**: Time and Limit are not both yellow (Time fills mint green, Limit fills pink, §3.4), and the "Recommended" mode wording differs from the manual (S1: time stops "while the screen effects are displayed"). The font section (Silkscreen, Pixelify Sans, Press Start 2P; Reactor7 ruled out) feeds §5.5. |

**Where LE departs from FF7** (so "reuse LE" does not mean "copy LE"): a vertical three-stop gradient
`#2020C0 → #05052E` (purple-leaning, top to bottom) instead of the four-corner pure-blue gradient; a
2 px white border plus 1 px grey inset and a 4 px radius instead of the grey bevel; a glassy top
sheen; Rajdhani type; Time in blue `#49B6FF` and Limit in gold `#FFC93C`; the columns ordered Time
then Limit (FF7: LIMIT then TIME); an enemy-name window at the top left; a separate command window
at the bottom left not overlapping the names; MP shown as cur/max.

**Retail check.** Read in full or in the HUD parts: `hud.mjs`, `reactor-battle.html` (HUD section),
`cursor.ts`, `chrome.ts`, `theme.css`, `types.ts`, `NOTICE`, `public/fonts/README.md`. No font file,
glyph sheet, window texture, cursor sprite, screenshot, music or sound from FF7 is in the repo (no
`.ttf/.otf/.woff*/.tex/.fnt` files at all; fonts come from Google Fonts; the glove is hand-written
SVG; `NOTICE` states the same). The boss is renamed "Scorpion Sentinel" there. Reactor7 (a fan font
traced from the game) is only mentioned, never used. The lookdev photo textures under
`concept/lookdev/tex` are unrelated to the HUD and were not audited. **Nothing retail found in the
HUD code; it is Bailey's own work and may be reused.** LE loads fonts from the Google CDN; our repo
self-hosts under `public/fonts/` (keep that).

---

## 3. FF7 battle-screen facts (measured and tagged)

### 3.1 Window material

- **Four-corner gradient, per window.** Every window carries its own gradient across its own box.
  Default **TL `#0000B0` (0,0,176), TR `#000080` (0,0,128), BL `#000050` (0,0,80), BR `#000020`
  (0,0,32)**, blue channel only `[verified: 3 sources, PS1; see §1 conflict]`. The interpolation
  is bilinear: the PS1 Config window centre reads 101 against a bilinear 104 `[measured]`.
- **The band windows are opaque; the top message window is translucent.** The Guard Scorpion hint
  still shows the scene through the top window (interior ~ (22,20,86) to (36,38,54) over a dark
  scene) while the band windows read pure gradient `[measured, single source]`. Our estimate: 50 %
  blend (the PlayStation's half-transparency mode) `[unsourced]`.
- **Frame (bevel).** A neutral grey (R = G = B) bevel about **3 u** thick, light in the middle and
  dark on the inside edge. Measured across the left edge at 2 px per u, outside to inside:
  `#6C6C6C, #939393, #B7B7B7, #9C9C9C, #575757, #272727`; the top edge reads
  `#C6C6C6, #D0D0D0, #949494, #585858, #333333` `[measured: PS1 Config and PC battle stills]`.
  Outer corners rounded, radius about **2 u**; the inner edge meets the gradient square
  `[measured]`. No drop shadow, no glow, no grain.
- **Limit window.** The Limit-technique window ("LIMIT LEVEL 1 / Braver") is not blue: it reads
  magenta at the top left to red at the bottom right, roughly `#B04A98` to `#A33D4B` `[single
  source, JPEG still]`.

### 3.2 Layout (320 x 224 u)

| Element | x (u) | y (u) | Fraction of the frame | Tag |
|---|---|---|---|---|
| Top message window | 17 to 303 | 9 to 30 | x 5.3 % to 94.7 %, y 4.0 % to 13.4 % | `[measured, 1 still]` |
| Band, left window (NAME, BARRIER) | 0 to 136 | 159 to 213 | x 0 to 42.5 %, y 71.0 % to 95.1 % | `[measured, 3 PS1 + 3 PC stills]` |
| Band, right window (HP, MP, LIMIT, TIME) | 137 to 319 | 159 to 213 | x 42.8 % to 99.7 % | same |
| Command window (one column) | 72 to 131 | 163 to 217 | x 22.5 % to 40.9 %, y 72.8 % to 96.9 % | `[measured, 2 stills]`: 4 u lower than the band, so it pokes below it |
| Command window (three columns) | 72 to 228 | 163 to 217 | columns at x 78, 130, 174 | `[measured, 4 PC stills]` |
| Limit window (over the command window) | 81 to 214 | 166 to 190 | | `[single source]` |
| Below the band | whole width | 213 to 224 | 4.9 % | black `[measured]` |

Inside the band (row centres for three party slots at **y 171, 187, 203**, pitch **16 u**):

| Item | x (u) | Notes |
|---|---|---|
| Header labels | NAME at 13; BARRIER right-aligned to 131; HP at 144; MP at 211; LIMIT at 240; TIME at 280 | y 161 to 165: tiny caps sitting just under the top frame line, grey `#ACACAC` with a dark `#181818` outline `[measured]` |
| Name | starts at 13 | cap height 8 u (y 167 to 174 on row 1) `[measured]` |
| Barrier box | 96 to 131, 10 u tall, centred on the row | two stacked bars: Barrier on top, MBarrier below `[verified: S1 + stills]` |
| HP | "163/ 320": current right-aligned in a 4-digit field ending at ~172, "/" then a space, max right-aligned ending at 204 | digits the same size, no small slash `[measured]` |
| HP line | 144 to 204, 1 u tall, just under the digits | |
| MP | current only, right-aligned ending at 236 | **no max** `[verified: S1 wording + 6 stills]` |
| MP line | 207 to 236 | |
| LIMIT box | 239 to 275 (36 u), 9 u tall, centred on the row | |
| TIME box | 277 to 313 (36 u), 9 u tall | |
| Command rows | text starts at 78; slot centres y 172, 184, 196, 208 (pitch **12 u**) | four fixed slots: Attack (or Limit), Magic, Summon, Item; an empty slot stays blank (the Guard Scorpion still shows Attack, blank, blank, Item) `[measured]` |
| Finger cursor | about 20 x 10 u, fingertip about 2 u left of the text | `[measured]` |

### 3.3 Text

- Body text off-white `#E7E7E7` (party window), commands `#FFFFFF`, with a 1 u dark shadow
  (`#222222`) `[measured]`.
- Unavailable text (a spell you cannot cast, a greyed name) `#6B6B6B` `[measured; S1 "displayed in
  grey"]`.
- HP digits turn **yellow at or below 1/4 of max** `[verified: 2 sources — S3; LE research]`; the
  exact yellow is `[unsourced]` (our estimate `#F8F070`).
- Cap height 8 u = 3.6 % of the picture height; one proportional sans for everything except the
  header labels (smaller, heavier caps) and the damage numerals (their own chunky set, §3.6).
- The message window centres its text `[measured]`. Battle dialogue has **no speaker name**; the line
  opens with a quote mark: “Attack while it's tail's up! (the game's spelling) `[measured + S8]`.
  The three hint lines come as separate messages `[S8]`.

### 3.4 Gauges

All gauges sit in a small raised box: 1 u frame, light grey top and left (`#A8A8A8`, `#929292`),
darker right and bottom (`#5F5F5F`, `#3B3B3B`) `[measured]`. The fill and the empty track are
shaded like a cylinder (dark line at the top, a light highlight line one third down, darker again at
the bottom), never flat.

| Gauge | State | Base / highlight / shade | Tag |
|---|---|---|---|
| Empty track | | `#6B6B6B` / `#7B7B7B` / `#181818` (top line) | `[measured]` |
| LIMIT | filling, normal | pink `#DE9CC0` / `#FFD0E8` / `#86476A` | `[measured: 2 stills, PS1 and PC]` |
| LIMIT | Fury | red `#E67B7D` / `#FFCDCD` / `#962D2F` | `[verified: S1, S3 + FF wiki gauge image]` |
| LIMIT | Sadness | blue `#7678D9` / `#D1D2FF` / `#2D2E9B` | `[verified: S1, S3 + still]` |
| LIMIT | full | **blinks** `[S1]`; stills catch it mint `#C2F6C4` and peach `#EDB682` | colours `[measured]`, rate `[unsourced]` |
| TIME | filling | mint green `#9FD8BA` / `#BCF1D1` / `#51857A` | `[measured: 2 PS1 stills]` |
| TIME | full | pale yellow `#F1EE9D` / `#FDF9BD` / `#94955A`; several stills show orange `#FDBD76` / `#FFE0A2` instead | yellow `[measured]`; what orange means (a flash phase, or a command already queued) `[unsourced]` |
| Barrier (top bar) | | red `#D46464` / `#DCCCCC` / `#A85858` | `[measured, FF wiki gauge image]` |
| MBarrier (bottom bar) | | orange-tan `#D49C64` / `#DCD4CC` / `#A88058` | same |
| HP line | | filled part is a left-to-right gradient `#4774E4 → #CDC4DE` across the whole field; the lost part dark red `#2D0908` | `[measured]`; S1 "change ... to red as they become depleted" |
| MP line | | `#67C2D1 → #C3C7BF`; lost part dark red | `[measured]` |

### 3.5 Commands, cursor, markers

- **Limit replaces Attack** in slot 1 while the gauge is full `[verified: S1, S3]`. The word "Limit"
  **cycles colour letter by letter**, each letter at a different phase through green, yellow, grey,
  red, cyan, white, blue, magenta, about 100 ms a step `[single source: FF wiki animated image]`.
- **Finger cursor**: a white gloved hand pointing right with grey shading `[S1 term, measured]`.
- **Ready marker**: a yellow triangle (about `#F7E30D`) above the character whose command window is
  open `[verified: S1 + still]`.
- **Hidden commands**: Change (press left at the left edge), Defend (press right at the right edge)
  `[S1]`. Out of scope for the slice unless the engine supports them.
- **Help window**: SELECT shows descriptions of commands, monster names, etc. `[S1]`. Where it
  draws is `[unsourced]` (our estimate: the top window).
- **Target selection**: the finger moves onto the target in the scene; whether the target's name
  shows without SELECT is `[unsourced]`.
- **Magic list**: spells grey when not castable, a red arrow beside an All spell `[S1]`; its window
  shape and the MP-cost readout are `[unsourced]` (our estimate below).

### 3.6 Damage numbers

White digits `#FFFFFF` with a 1 u near-black outline `#181818`; recovery in green `[verified: S1 +
3 stills]`. The digits are their own chunky, wide, rounded-square numeral set, about 10 u tall,
drawn over the target `[measured]`. The motion (pop, bounce, digit order) is `[unsourced]` and needs
a look at the running game.

### 3.7 Time flow while choosing

Active: time runs while choosing. Recommended: time stops "while the screen effects are displayed".
Wait: time stops "while you are selecting commands such as Magic and Items" `[S1]`; the wiki adds
target selection `[S2]`. The HUD shows this only by the TIME bars stopping; there is no "WAIT" label
`[unsourced: none seen on any still]`.

---

## 4. Where option A departs from FF7

Measured against `frames/a-1600.jpg`, `frames/a-390.jpg` and `src/mock.html` / `src/hud.js`:

1. **Window colour.** A: a 162° linear gradient `#5A82E0 → #2A47A8 → #142A78 → #070F3E` (lighter,
   purple-tinted, one direction). FF7: four corners, blue only, `#0000B0 / #000080 / #000050 /
   #000020`, much deeper, bilinear.
2. **Frame.** A: 3 px near-white `#E9EDF6` border, a 2 px blue-grey inset, a 10 px radius, an inner
   white glow, a drop shadow and a noise grain. FF7: a 3 u neutral-grey bevel (light middle, dark
   inner edge), about 2 u radius, no shadow, no glow, no grain.
3. **What the band holds.** A: an enemy window ("Guard Scorpion") at the bottom left with the command
   window inside it, and the names inside the party window. FF7: the left window is the party
   **NAME + BARRIER** window; there is no enemy name in the band; the command window lies over the
   names window, 4 u lower than the band.
4. **Missing Barrier column.** A has none. FF7 shows a BARRIER header and a two-bar box per row.
5. **MP.** A: "54/54". FF7: current MP only ("54").
6. **HP digits.** A: large current, small slash, "281/314". FF7: "281/ 314", two right-aligned
   4-digit fields, one size.
7. **Gauges.** A: LIMIT magenta `#B54EC0→#FF8AD2` and TIME gold `#C9A94A→#FFF4A8`, stacked under each
   other with per-row "LIMIT" / "TIME" words, flat fills in thin outlined bars. FF7: LIMIT and TIME
   **side by side in their own columns**, headers only once on the top frame line, raised grey boxes,
   cylinder-shaded fills; LIMIT pink, TIME mint while filling and pale yellow when full.
8. **Header labels.** A: a separate header row in pale blue `#A9C4FF`, letter-spaced, reading "NAME
   HP MP LIMIT / TIME". FF7: tiny grey outlined caps on the top frame line: NAME, BARRIER | HP, MP,
   LIMIT, TIME.
9. **Command window.** A: three compact rows (Attack, Magic, Item), a white triangle pointer. FF7:
   four fixed slots at 12 u pitch (Attack, Magic, Summon, Item, a missing command leaves its slot
   blank), a white-glove finger cursor.
10. **Message window.** A: opaque, bright, 880 px wide, the speaker "Cloud" in gold and one
    paraphrased line with the spelling corrected ("its"). FF7: translucent, nearly full width (89 %),
    centred white text, no speaker name, an opening quote mark, the game's spelling "it's", and the
    three lines as three messages.
11. **Type.** A: Exo 2 600 at about 30 px (cap about 2.3 % of the height), the active name in gold
    `#FFE98A`. FF7: one proportional sans with a cap of 3.6 % of the height (about 32 px cap at 900),
    off-white, no gold names; grey for unavailable.
12. **Missing states.** A has no yellow ready triangle over Cloud, no yellow HP at 1/4, no greyed
    names, no Limit colour cycle, no Limit window colour, no black strip under the band.
13. **A's additions FF7 does not have.** The gold active name, the drop shadows and grain, the HP and
    MP bars in cyan and green (FF7's are blue-to-lavender and teal-to-cream lines with a red lost
    part), the "PLACEHOLDER" and "PARTY VALUES ARE PLACEHOLDERS" chips (sheet furniture: keep them on
    the target sheet, outside the HUD layer, never in the game).
14. **Phone.** A stacks the enemy and command windows side by side over a party window with LIMIT and
    TIME on a second line per member. FF7 has no portrait layout; §6 keeps FF7's two band windows
    intact at a uniform scale instead.

**What A already had right**: the blue-window family, the top message window, the command window at
the left of the band, the band at about a quarter of the height (A: 210 px of 900; FF7: 54 u of 224
= 217 px at 900), HP and MP numbers with a line under them, LIMIT and TIME gauges per member, Magic
as the cursor row.

---

## 5. The spec: "A, even more faithful"

### 5.1 Frame and scaling: stretch the band (recommended)

At 1600x900 the vertical scale is **v = 900 / 224 = 4.018 px per u**.

- **Recommended: stretch the bands.** Every x position and every window edge is a fraction of the
  frame width (h = 1600 / 320 = **5 px per u**); every y position, every height and every size (type,
  line pitch, frame thickness, gauge height, cursor, damage digits) uses **v**. Gauge box widths are
  horizontal lengths and use h. Type is never stretched.
  Why: (1) FF7's band runs edge to edge; stretching keeps that read on a wide screen, where a 4:3
  band floating inside a full-bleed scene would not; (2) every other chapter in the app is
  full-bleed 16:9 and the painted Sector 1 scene is drawn for it; (3) the proportions that carry the
  look (band = 24.1 % of the height, cap = 3.6 %, 16 u rows, 12 u command slots) stay exact; (4) the
  phone cannot pillarbox anyway, so one rule (fractions) serves both.
- **Alternative: pillarbox** the whole battle to a centred 4:3 picture (1200x900 with 200 px black
  bars). Exact, but it throws away a quarter of the painted scene and reads as an emulator window.
  **Needs Bailey** (§9 #1): the refined target shows the stretch, with a small pillarbox inset.

### 5.2 Layout at 1600x900 (from §3.2; x = u × 5, y = u × 4.018, rounded)

| Element | Left | Top | Right | Bottom |
|---|---|---|---|---|
| Top message window | 85 | 36 | 1515 | 121 |
| Band, left window (NAME, BARRIER) | 5 | 639 | 680 | 856 |
| Band, right window | 685 | 639 | 1595 | 856 |
| Command window, one column | 360 | 655 | 655 | 872 |
| Command window, three columns | 360 | 655 | 1140 | 872 |
| Limit window | 405 | 667 | 1070 | 763 |
| Black strip | 0 | 856 | 1600 | 900 |

The outer 5 px margins stand in for FF7's 0 to 1 u, so the frames never touch the browser edge.
Inside the band: header labels at y 647 to 663 (x: NAME 65, BARRIER right edge 655, HP 720, MP 1055,
LIMIT 1200, TIME 1400); row centres at y **687, 751, 816**; names at x 65; Barrier box x 480 to 655,
40 px tall; HP field x 755 to 1020 (current ends ~860, max ends 1020); HP line x 720 to 1020, 4 px;
MP ends at 1180, MP line x 1035 to 1180; LIMIT box x 1195 to 1375, TIME box x 1385 to 1565, both
36 px tall; command text at x 390, slot centres y 691, 739, 788, 836; the cursor 80 x 40 px, tip
8 px left of the text.

### 5.3 Window material (CSS recipe, FF7-scoped)

```css
.ff7-win {                     /* bilinear four-corner gradient, exact */
  --tl: #0000b0; --tr: #000080; --bl: #000050; --br: #000020;
  position: absolute; background: linear-gradient(to right, var(--bl), var(--br));
}
.ff7-win::before {             /* top row, faded out towards the bottom = bilinear */
  content: ""; position: absolute; inset: 0;
  background: linear-gradient(to right, var(--tl), var(--tr));
  -webkit-mask-image: linear-gradient(to bottom, #000, transparent);
          mask-image: linear-gradient(to bottom, #000, transparent);
}
.ff7-win.msg { opacity: .5 }   /* top message window only, our estimate of the PS1 half blend */
```

Frame: **12 px** at 900 (3 u), drawn as our own bevel, not a texture: a `border-image` or three
nested `box-shadow` rings using the measured greys (outside to inside `#6C6C6C, #939393, #B7B7B7,
#9C9C9C, #575757, #272727` on the sides; `#C6C6C6, #D0D0D0, #949494, #585858, #333333` on top and
bottom), outer radius **8 px** (2 u), inner corner square. No `box-shadow` outside the frame, no
grain, no sheen. The four corner colours are tokens so a later Config "Window color" option can
drive them (LE's `WindowColour` type).

### 5.4 Labels and positions

- Left window header: **NAME** (left), **BARRIER** (right). Right window header: **HP**, **MP**,
  **LIMIT**, **TIME**. All caps, once, on the top frame line (§5.2); no per-row labels; no "ENEMY".
- Rows: name | Barrier box || `cur/ max` HP with its line | current MP with its line | LIMIT box |
  TIME box.
- Guard Scorpion slice: two party rows (Cloud, Barret); the third slot stays empty.
- Command slots for the slice: Attack (Limit when full), Magic, (blank: no Summon), Item.

### 5.5 Type

One proportional sans for names, numbers, commands and messages; one tiny heavy caps face for the
header labels; one chunky numeral set for damage. **Never the retail font, never Reactor7 or any fan
font traced from the game** (rule 8).

| Role | Size at 900 | Candidates (all OFL) | Recommendation |
|---|---|---|---|
| Body (names, digits, commands, messages) | cap 32 px (8 u); for a cap ratio of 0.70, font-size 46 px; line pitch 64 px (party), 48 px (commands) | **M PLUS Rounded 1c** 500 (Google Fonts; rounded terminals and humanist proportions, closest to the PC face in our reading); Varela Round; Nunito 600; **Rajdhani 600** (already in `public/fonts/`, the face of the LE windows Bailey liked); Pixelify Sans (only if a pixel look is wanted) | Show M PLUS Rounded 1c and Rajdhani side by side on the refinement sheet; Bailey or the judge picks. `[unsourced]` which is closer; this is a judgement. |
| Header labels | cap 16 to 18 px (4 to 4.5 u) | **Silkscreen** 700 (already in `public/fonts/`), or the body face at 800 in caps | Silkscreen 700, `#ACACAC`, 2 px `#181818` outline |
| Damage numerals | about 40 px tall (10 u) | **Russo One** (download, OFL; rounded-square digits), Silkscreen 700 | Russo One; or draw our own 10-digit SVG set in that spirit (original work, allowed) |

Text colour `#E7E7E7` (party), `#FFFFFF` (commands, messages), unavailable `#6B6B6B`, HP at or below
1/4 max `#F8F070` (our estimate). Shadow: 4 px (1 u) `#222222`, offset down-right, no blur.
Tabular numerals for HP and MP. Self-host the new faces under `public/fonts/` with their OFL files.

### 5.6 The finger cursor (our own drawing)

A white gloved hand pointing right, about **80 x 40 px** at 900 (20 x 10 u): white fill, two grey
shade steps (`#CECECE`, `#9A9A9A`) on the knuckles and cuff, a 4 px near-black outline, the index
finger extended with its tip 8 px left of the row text. Start from Bailey's own `CURSOR_SVG`
(`D:\FF7\concept\lib\hud.mjs`) or `cursorSVG()` (`D:\FF7\src\ui\components\cursor.ts`), redraw to
the proportions above; never trace a retail sprite. Static; it appears on the row, it does not bob.
The same hand points at the target in the scene during target selection.

### 5.7 Gauges

- Box: 1 u frame, light top/left, dark right/bottom (§3.4). LIMIT box 180 x 36 px, TIME box 180 x
  36 px, Barrier box 175 x 40 px holding two bars.
- Fill: a vertical gradient that reproduces the cylinder shading, per state, from §3.4 (shade at
  0 %, base at 25 %, highlight at 40 %, base at 60 %, shade at 100 %). The empty part of the track is
  the grey cylinder.
- LIMIT: pink while filling (red under Fury, blue under Sadness). When full it blinks between mint
  `#C2F6C4` and peach `#EDB682` at 4 Hz (rate our estimate) and slot 1 reads **Limit** with the
  letter-by-letter colour cycle of §3.5 (100 ms a step).
- TIME: mint while filling; pale yellow when full. The orange full state is shown only if the in-game
  check (§9 #4) explains it. The bar freezes whenever time is stopped (§3.7).
- HP / MP lines: 4 px, the measured gradients, lost part dark red.
- Barrier / MBarrier: red over tan, drain left to right as the status runs out; empty when the status
  is off (Guard Scorpion: always empty unless the slice grants Barrier).

### 5.8 Command window and submenus

- One column, four fixed slots, 48 px pitch, the finger cursor; the window opens over the names
  window, 16 px (4 u) lower than the band, and closes when the command is chosen.
- **Limit**: the Limit window (magenta to red gradient, §3.1) opens over the command window with the
  caps header "LIMIT LEVEL 1" and one row "Braver" (Cloud) or "Big Shot" (Barret).
- **Magic** `[unsourced layout, our estimate]`: the three-column command geometry (columns at x 390,
  650, 870; 48 px rows) listing the spells from the equipped materia; uncastable spells grey; a red
  arrow before an All spell. MP cost: a small window at the right end of the list reading
  "MP" / "4/ 54" (our estimate; replace with the real form after the in-game check).
- **Item**: one column of item names with the count right-aligned, same geometry `[unsourced]`.
- The ready character gets the yellow triangle over the head in the scene (`#F7E30D`, about
  40 x 28 px), drawn by the scene layer, not the band.

### 5.9 Message window rules

- Top, translucent, 85 to 1515 px wide, text centred, one line per message, white, no speaker name.
- Enemy actions: the ability name ("Search Scope", "Rifle", "Scorpion Tail", "Tail Laser"); Search
  Scope also shows "Locked On Target" (S8).
- The hint: three messages in order, per S8 (Cloud and Barret alive): “(Barret), be careful! /
  “Attack while it's tail's up! / “It's gonna counterattack with its laser. Keeping the game's "it's"
  and the misleading pairing is **needs Bailey** (§9 #3); A's paraphrase goes.
- The help window (SELECT; our keys: `H` and a tap on the empty top area) shows the highlighted
  command's description or the target's name, in the same translucent window.
- Duration: the Battle Message speed is a Config value in FF7; ours is `[unsourced]` (our estimate:
  1.2 s per message plus 40 ms per character, advanced early by any confirm).
- Nothing else lives up there: no "TAIL RAISED" chip, no banner, no advice.

### 5.10 Damage numbers

White digits, 4 px near-black outline, about 40 px tall, over the target's upper body; recovery
green (our estimate `#80F080`; the exact green `[unsourced]`); a whiff prints "Miss". Motion `[
unsourced]`: pop in, a small drop-and-bounce (about 250 ms), hold, vanish (our estimate, to be
matched to the running game).

---

## 6. Phone portrait (390x844)

Rule: **FF7's two band windows keep their exact internal layout at one uniform scale, p = 2.05 px
per u** (the right window's 182 u fills 374 px = 390 minus two 8 px gutters). They stack instead of
sitting side by side, because 318 u at a readable scale does not fit 390 px.

| Element | Box (x, y, w, h in px) | Notes |
|---|---|---|
| Top message window | 8, safe-top + 8, 374, 45 | translucent; text 23 px (cap 16 px); wraps to two lines if needed |
| Names window (NAME, BARRIER) | 8, 597, 279, 111 | FF7's left window (54 u tall) at p; header labels 12 px Silkscreen |
| Status window (HP, MP, LIMIT, TIME) | 8, 710, 374, 111 | FF7's right window at p: every column position is u × 2.05 from its left edge |
| Black strip | 0, 821, 390, 23 | plus the safe-area inset |
| Command window | 156, 520, 190, 196 | still overlaps the names window as in FF7, enlarged to **44 px slots** for touch; the finger cursor 40 x 20 px |
| Limit / Magic windows | open over the command window, 44 px rows, full width if three columns are needed | |
| Damage digits | 22 px tall | |

Type at p: body cap 16 px (font-size about 23 px), party row pitch 33 px, gauge boxes 74 x 18 px.
Tapping a command row chooses it; tapping an enemy in the scene targets it; the cursor follows.

---

## 7. Fidelity checklist (the judge scores each item pass / fail against the stills in §1)

1. Window gradient: four corners sampled inside each window within ±8 of `#0000B0 / #000080 /
   #000050 / #000020`, blue channel only, bilinear (centre within ±8 of the corner average).
2. Frame: grey (R = G = B within ±6), 3 u thick, light middle, dark inner edge, outer radius about
   2 u, no outer shadow, no glow, no grain.
3. Band: two windows edge to edge, top at 71.0 % and bottom at 95.1 % of the height (±0.5 %), split at
   42.5 % of the width (±1 %); black strip below.
4. Left window shows NAME and BARRIER headers, the names, and a two-bar Barrier box per row; no enemy
   name anywhere in the band.
5. Right window shows HP, MP, LIMIT, TIME headers once, on the frame line, in tiny grey caps.
6. HP reads `cur/ max` in two right-aligned 4-digit fields of one size; MP shows the current value
   only; each has its line gauge (blue-to-lavender, teal-to-cream, lost part dark red).
7. LIMIT and TIME are side by side in their own columns, in raised grey boxes, cylinder-shaded; LIMIT
   pink, TIME mint while filling and pale yellow when full.
8. Command window: one column of four fixed slots at 12 u pitch, overlapping the names window, 4 u
   lower than the band; the slice shows Attack, Magic, blank, Item.
9. Finger cursor: a white gloved hand pointing right, never a triangle; static.
10. Yellow ready triangle over the acting character.
11. Top message window: translucent, 89 % wide, centred text, no speaker name, the ability name or the
    hint in quotes.
12. Type: one proportional sans; cap height 3.6 % of the frame height (±0.3 %); off-white with a
    1 u shadow; no gold names; grey for unavailable; not the retail font.
13. States: HP digits yellow at or below 1/4 max; the full Limit gauge blinks and "Limit" replaces
    "Attack" with the letter colour cycle; the TIME bar freezes when time is stopped.
14. Damage numbers: chunky white digits with a black outline over the target; green for recovery.
15. Absent: grain, drop shadows, gold active names, per-row LIMIT/TIME words, the enemy window, any
    "TAIL RAISED" chip, banner, bracket, advisor, coach or turn list.
16. Phone: both band windows at one uniform scale with FF7's internal layout, stacked; command slots at
    least 44 px; nothing clipped at 390 px.
17. Scope: no FFX or FFX-2 file, token or font changed (diff check).

Score as the share of items passed; any fail on 1, 3, 7, 8, 9 or 17 blocks the target.

---

## 8. What stays out (FF7 only means FF7 only)

- No change to `src/ui/ffx/**`, `src/ui/ffx2/**`, `src/ui/inkgold/**`, `src/ui/common/**` tokens,
  or any shared font stack. The FF7 HUD imports its own CSS and fonts.
- None of the shared presentation extras: no coach, no advisor, no strategy guide, no CTB/ATB turn
  list, no target bracket, no Ink & Gold banner (the architecture plan already routes
  `BattleScreenWiring.createHud` to `Ff7BattleHud` with no coach).
- No new gameplay or hint text (rule 10).

## 9. Needs Bailey (or the in-game check)

1. **Stretch or pillarbox** at 16:9 (§5.1). Recommended: stretch; the refined target shows both.
2. **Body font**: M PLUS Rounded 1c or Rajdhani (§5.5), side by side on the target sheet.
3. **The hint text**: keep the game's three lines with "it's" and the misleading pairing (most
   faithful), or not (`research/ff7-guard-scorpion.md` §7.3 already leaves this to Bailey).
4. **In-game checks** (the running game, not memory; our repo's rule prefers the Steam copy, which
   is the PC build: note its window colours differ, §1): what the orange full TIME bar means; whether
   the target name shows without SELECT; the Magic list's shape and MP readout; the damage-number
   motion; the full Limit gauge's blink rate; the message duration. Added by the A+ repair pass
   (2026-09-27): when a party name turns grey (four stills show one: Yuffie, Cid, Red XIII), and
   whether it goes with the orange full TIME bar; the Magic list's grid order (Config "Magic
   order"), blanks for spells not owned, and whether the command window stays open; the ready
   triangle's spin rate and the "Limit" letter step rate.

## 10. Build notes

- Files (per `docs/plans/ff7-guard-scorpion-architecture.md` §3.2): `src/ui/ff7/Ff7BattleHud.ts`,
  `Ff7CommandMenu.ts`, `Ff7PartyRows.ts`, `Ff7HelpLine.ts`, `phoneHud.ts`, plus `ff7Window.css` and
  `ff7Cursor.ts` (the glove). Each under 400 lines, strict TS, `.ts` imports (rule 7).
- Tokens `--ff7-win-tl/tr/bl/br`, `--ff7-frame-*`, `--ff7-limit-*`, `--ff7-time-*`,
  `--ff7-barrier-*`, `--ff7-text*`; no shared token edited.
- The refined target (next step): re-render `docs/concepts/ff7-hud-2026-09-27/src/mock.html` option A
  to this spec as `frames/a2-1600.jpg` and `frames/a2-390.jpg`, with the two type candidates and the
  pillarbox inset, placeholder chips outside the HUD layer, and show it beside A and a reference
  measurement table (numbers only; no retail still goes into the repo).
