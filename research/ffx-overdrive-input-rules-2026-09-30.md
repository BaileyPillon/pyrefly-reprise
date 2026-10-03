# FFX Overdrive input rules: Bushido wrong press, Immune rows, Fail-row riders (2026-09-30)

**Scope: FFX only** (AGENTS.md rule 14). Auron's Bushido and Tidus's Swordplay exist only
in FFX (chapters 1 to 3); nothing here applies to FFX-2. **Docs only:** no engine, data or
UI file was changed. The rules below are recommendations for the docs that own them
(`research/ffx-combat-core.md` §5.3 and §5.5, `research/visual-bible.md` §3.11.2); applying
them is a separate, reviewed change.

**Method.** Two independent research passes (A: GameFAQs only; B: everything else) were
reconciled, and every quote that decides an answer was re-opened on 2026-09-30 and found on
the page: GameFAQs and other sites through a headless Playwright fetch (GameFAQs shows a
Cloudflare check that clears on its own after a few seconds; WebFetch gets 403), Fandom
through its MediaWiki `api.php` (wikitext plus revision id), and the FFX RNG Tracker's
action table downloaded at a pinned commit and decoded with that repo's own byte layout
(`actions.py`). Quotes are kept under 15 words. Bailey's source preference (2026-09-25,
"I especially like gamefaqs") is applied where sources conflict and the game does not
settle it; such picks are labelled **our estimate**.

Tags: `[verified: N sources]` = N independent sources agree; `[single source]`;
`[conflicting]`; `[not found]`; `[estimate]` = our authored choice.

## Sources

| Key | Source | Version / revision |
|---|---|---|
| GF-PF | GameFAQs, *Character/Aeon Overdrive In-Depth FAQ*, Paul Friedman / Kaze Yagami, <https://gamefaqs.gamespot.com/ps2/197344-final-fantasy-x/faqs/15350> | v4.0, updated 2002-08-30 (NA PS2 era, with International notes) |
| GF-HD | GameFAQs, *Final Fantasy X Remaster Walkthrough (PC)*, bover_87, Overdrives page, <https://gamefaqs.gamespot.com/pc/190170-final-fantasy-x-x-2-hd-remaster/faqs/79145/overdrives> | v1.3, updated 2023-12-17 (HD) |
| GF-KB | GameFAQs, KeyBlade999 FAQ/Walkthrough (HD Remaster), Swordplay and Bushido section, <https://gamefaqs.gamespot.com/vita/643145-final-fantasy-x-hd-remaster/faqs/69037?page=12> | v1.10, updated 2014-05-06 (HD) |
| GF-B1 | GameFAQs board, "Banishing Blade Question?", BBK_Kid post #2, <https://gamefaqs.gamespot.com/boards/197344-final-fantasy-x/65516284> | message board, ~13 years old |
| GF-B2 | GameFAQs board, "Banishing Blade?", na-mi-da post, <https://gamefaqs.gamespot.com/boards/197344-final-fantasy-x/46666524> | message board, ~17 years old |
| GF-B3 | GameFAQs board, "Critical Hit for Overdrives" (zzanmato #3, pbirdman #9), <https://gamefaqs.gamespot.com/boards/197344-final-fantasy-x/69032930> | message board, ~12 years old |
| FW-BU | Final Fantasy Wiki, *Bushido (Final Fantasy X)*, <https://finalfantasy.fandom.com/wiki/Bushido_(Final_Fantasy_X)> | revid 4029494 (2026-08-04) |
| FW-SP | Final Fantasy Wiki, *Swordplay (Final Fantasy X)*, <https://finalfantasy.fandom.com/wiki/Swordplay_(Final_Fantasy_X)> | revid 4050450 (2026-09-19) |
| FW-SE | Final Fantasy Wiki, *Seymour (Final Fantasy X boss)*, <https://finalfantasy.fandom.com/wiki/Seymour_(Final_Fantasy_X_boss)> | revid 4029438 (2026-08-04) |
| FW-RK | Final Fantasy Wiki, *Rank (Final Fantasy X)*, <https://finalfantasy.fandom.com/wiki/Rank_(Final_Fantasy_X)> | revid 4028688 (2026-08-01) |
| AF | Archived fan page "Auron's Overdrive: Bushido", <https://web.archive.org/web/2023/https://www.angelfire.com/hero/lalala/ChaBushido.html> | 2023 archive copy, no author shown, release not stated |
| GG | Gamer Guides, *Bushido Overdrive* (FFX HD), <https://www.gamerguides.com/final-fantasy-x-hd/guide/characters/auron/bushido-overdrive> | HD, PlayStation inputs |
| XU | Xeno Underground, *FFX Database & Mechanics*, <https://xeno-underground.forumotion.com/t359-final-fantasy-x-database-mechanics> | forum guide, International values |
| AGS | AllGameStaff, *Final Fantasy X Overdrive*, <https://www.allgamestaff.com/final-fantasy-x/overdrive/> | PlayStation button prompts |
| SW | StrategyWiki, *Final Fantasy X/Overdrives*, <https://strategywiki.org/wiki/Final_Fantasy_X/Overdrives> | current page |
| TRK | FFX RNG Tracker (Grayfox96), `ffx_command.csv` + `actions.py` at commit `0acf1ac3190c4b75b6a8e9f02eb47897da20c680`, <https://github.com/Grayfox96/FFX-RNG-tracker/tree/0acf1ac3190c4b75b6a8e9f02eb47897da20c680/ffx_rng_tracker/data> | game action table as bytes; our decode, not a quote |

Independence note: the four GameFAQs sources are separate authors and count as separate
sources; GF-HD and GF-KB are both HD-era guides. TRK is game data, not prose; the
"(Fail)" / "(Immune)" names of rows 266 to 273 are the tracker's own labels by index.

---

## Q1. Bushido: what does a wrong button press do, and what happens on a fail?

**Answer.** A wrong press **resets the sequence to the first input; the attempt continues
and the timer keeps running.** There is no other penalty. The attempt fails only when the
timer runs out before a complete correct sequence. On a fail Auron still performs the
Overdrive, as the weaker "standard move" (the Fail row): lower power, no rider status, and
no remaining-time bonus.

**Standing:** reset-to-start `[verified: 3 sources]` (GF-PF, GF-HD, AF; GF-PF and AF are
PS2-era, GF-HD is HD, so no version difference is reported). "Timer keeps running through
the reset" is `[estimate]`: GF-HD says "a fixed amount of time", no source describes the
timer at the reset. Fail outcome `[verified: 3 sources]` (FW-BU, GF-KB, TRK rows 266 to 269).

| Source | Quote (re-opened 2026-09-30) |
|---|---|
| GF-PF | "if an incorrect button is pressed, you must start the sequence over" |
| GF-HD | "if you make a mistake, you must start over from the beginning" |
| GF-HD | "otherwise there is no penalty" |
| AF | "If you make a mistake you'll have to start over." |
| FW-BU | "if the sequence is unsuccessful, Auron will perform the standard move" |
| GF-KB | "you just won't get the damage multiplier, can have a power loss" |

Fail rows (TRK decode; FW-BU and AF give the same powers): Shooting Star 266 = 24 x1,
Dragon Fang 267 = 16 x1, Banishing Blade 268 = 28 x1, Tornado 269 = 15 x1; none carries a
status or a Delay/Eject flag. Nothing documents the input state machine in code terms or
how the on-screen prompt reacts to a wrong press `[not found]`.

**Against our docs.**
- `ffx-combat-core.md` §5.5 ("a wrong press is ignored and the expected input does not
  advance", tagged `[estimate]`): **contradicted.** The sources say the progress goes back
  to input 1.
- `visual-bible.md` §3.11.2 ("the run ends immediately", "wrong inputs end the attempt"):
  **contradicted**, and it also contradicts §5.5. The "no partial credit" phrase is right in
  spirit (a partial sequence earns nothing) but the attempt does not end.
- Recommended rule for both docs: wrong press → progress resets to input 1, timer continues,
  attempt ends only at timer expiry or on the last correct input. The wrong-press chip flash
  in §3.11.2 can stay as feedback, followed by the row returning to "pending" with chip 1 as
  "next required". The Steam HD copy can confirm (Bailey's real-game rule).

## Q2. Immune rows: when does Bushido use the "(Immune)" damage row?

**Answer.**
1. **The immune row is used only on a successful input, against a target that is immune to
   the rider status.** `[verified: 4 sources]` (GF-HD, GF-KB, AGS, FW-BU's separate "immune
   enemy" column). Riders: Dragon Fang weak Delay, Shooting Star Eject, Banishing Blade all
   four Breaks (Power, Magic, Armor, Mental) at chance 254, Tornado none `[verified: 3
   sources]` (FW-BU, GF-HD, TRK rows 100 to 103). Immune powers 19 / 27 / 30 match TRK rows
   271 / 270 / 272 and GF-KB's percentages exactly (19/16 = 1.1875, 27/24 = 1.125, 30/28 =
   1.0714 of the base row).
2. **Banishing Blade, partial immunity:** `[conflicting]`.
   - "Immune to one or more Breaks gives the bonus": GF-KB (a GameFAQs guide).
   - "Immune to all four": GF-B1 and GF-B2 (GameFAQs boards). The success-row reading for
     partial immunity is also supported by GG, XU and FW-SE, which say the Breaks the target
     is not immune to are still inflicted. FW-SE's example is Seymour (Macalania): he is
     Power Break Immune, yet Banishing Blade lands Magic Break. The immune rows carry no
     status at all (TRK 270 to 273). So if one immunity selected the immune row, no Break
     would land, which contradicts FW-SE and GG.
   - **Recommendation (our estimate):** the immune row applies only when the target is
     immune to **all four** Breaks; with partial immunity the success row runs and each Break
     rolls on its own. GameFAQs is split here, so Bailey's preference does not decide it
     alone. The GameFAQs board version is the one that agrees with every other source and
     with the data. GF-KB's "one or more" stays recorded as the dissent.
3. **Per target or once per action:** `[not found]`. No source states it. The GameFAQs
   wording is per target ("the target is immune", GF-KB; "If the target is immune", GF-B1).
   The tracker makes the user pick one row for the whole action, which only proves the
   tracker's own choice. **Recommendation (our estimate, following the GameFAQs wording):**
   decide per target. This only matters for Dragon Fang, the one area Overdrive with a rider.
   A Steam HD test settles it: Dragon Fang on a group with exactly one Delay-immune enemy.
4. **Tornado** has no rider, so it has no immune case (FW-BU immune column "N/A"). Its
   success is 20 x2 per FW-BU, AGS ("Two attacks with offensive power 20") and GF-KB
   (+33 %, i.e. 20/15). That fits TRK row 273 (20 x2) but **not** row 103 (15 x2). However,
   row 273 is rank 6 and row 103 is rank 7, and FW-RK lists Tornado at rank 7. Damage
   `[verified: 3 sources]`, row identity and rank `[conflicting]`.

| Source | Quote (re-opened 2026-09-30) |
|---|---|
| GF-HD | "all Bushido effects always succeed unless the target is Immune" |
| GF-KB | "immune to one or more of these Breaks, then you will get a ~7.14%" |
| GF-KB | "If you are successful and the target is immune to Delay" |
| GF-B1 | "If the target is immune to all four breaks" |
| GF-B2 | "they don't even attempt to inflict the status effects" |
| AGS | "immune to the specific additional effect" |
| GG | "unless they are outright immune, the Breaks they are susceptible to will be inflicted" |
| XU | "any foe that is not completely immune to these" |
| FW-SE | "inflict Magic Break on Seymour ... as it ignores partial resistance" |
| FW-BU | "Power (successful input, immune enemy)" (column header) |

**Against our docs.**
- `ffx-combat-core.md` §5.5: the rows and DmgCon table **agree** with the sources. The
  sentence "targets immune to the Overdrive's rider status" is compatible with the answer but
  does not say "all four" for Banishing Blade or per target. Add both, tagged `[estimate]`.
- §5.5 / §11 C15 "row 273 is Tornado's success row" fits the damage. But the §5.5 table
  lists Tornado "rank 7 (fail 6)", which only fits row 103. Keep 20 x2 (three sources) and
  mark the rank as conflicting (rank 6 in the 273 decode, rank 7 in FW-RK).
- `visual-bible.md` §3.11.2 has no immune behaviour; nothing to change there.

## Q3a. Does a failed Overdrive still inflict its rider status?

**Answer.** **No.** A failed Bushido has no rider; the status lands only on a correct
sequence within the time. Tidus's Swordplay has no rider status on any row, success or fail,
so the question does not arise for him. On a fail he loses power, and also hits for Slice
& Dice and the finisher for Blitz Ace.

**Standing:** `[verified: 5 sources]` (GF-PF, GF-HD, GF-KB, AF, AGS; TRK rows 266 to 269
and 235 to 238 carry no status or Delay/Eject flag, while success rows 100 to 102 do).

| Source | Quote (re-opened 2026-09-30) |
|---|---|
| GF-PF | "Effects only are applied when sequence is entered correctly." |
| GF-HD | "The Extra effect is only granted if the input is done successfully" |
| AF | "only inflicted if the sequence was input correctly within the time limit" |
| AGS | "you will not benefit from any additional effects" |

Dissent: SW says a failed Dragon Fang "only hits one enemy" and a failed Banishing Blade
"only inflicts one random break". The game data contradicts the second claim: row 268 has
no status. FW-BU and AGS contradict the first: failed Dragon Fang is "All enemies" at power
16. Treat SW as wrong here.

**Against our docs.** **Agrees** with §5.3 (fail rows have no rider) and §5.5 ("(Fail)" row,
no rider in the table). Nothing to change.

## Q3b. Can a failed Overdrive still crit?

**Answer.** **Yes, by the game data; no prose source addresses the fail case.** Every
Swordplay and Bushido row, success, fail and immune (TRK rows 96 to 103, 235 to 238 and 266
to 274), has the "can crit" bit set. Every one of them also has a bonus-crit byte of 0. That
fits pbirdman's point that Overdrives ignore equipment Crit+ and have their own critical
value of 0. The crit chance is the ordinary Luck roll. For Overdrives in general, the prose
agrees: Tidus's can crit (FW-SP, XU, GF-B3) and Auron's can crit (XU).

**Standing:** Tidus's Overdrives crit `[verified: 3 sources]`; Auron's crit `[single
source]` (XU) plus TRK data; **failed** Overdrives crit `[single source]`. That last one is
TRK data only. No prose says it either way, so the implementation is labelled **our
estimate**: fail rows use the same crit rule as success rows.

| Source | Quote (re-opened 2026-09-30) |
|---|---|
| FW-SP | "Tidus's Overdrives can inflict critical hits with a high Luck stat." |
| XU | "All Auron's overdrives can deal critical damage." |
| GF-B3 (zzanmato) | "Tidus' overdrives can crit, and Wakka's cannot." |
| GF-B3 (pbirdman) | "they use the Attacks own Critical value which for ODs is 0" |
| TRK | (our decode) rows 235 to 238 and 266 to 269: can-crit bit set, bonus crit 0 |

**Against our docs.** **Agrees** with §5.3 (Tidus can crit). §5.5 does not mention crit for
Bushido; add "all Bushido rows, fail included, can crit (Luck roll, no equipment Crit+)",
tagged as above.

---

## Other disagreements found on the way (not decided here)

| # | Item | Our docs | Sources | Standing |
|---|---|---|---|---|
| D1 | Bushido timer | §5.2 and §5.5: one 4 000 ms for all four | Dragon Fang, Shooting Star, Banishing Blade 4 s; **Tornado 3 s** (GF-KB "Timer: 3 seconds", XU, AGS "Time available 3 seconds"). TRK `OD_TIMERS` has one Auron value, 4000 | `[conflicting]`; GameFAQs (GF-KB) says Tornado 3 s → recommend 3 s, our estimate |
| D2 | Sequence length | visual-bible §3.11.2: "All four sequences are 7 inputs long" | Dragon Fang 8, Shooting Star 7, Banishing Blade 7, Tornado 6 (FW-BU, GF-PF, XU, AGS); GF-KB lists Tornado with 5 | §3.11.2's sentence is wrong (its own table already notes Dragon Fang is 8) |
| D3 | Button order, HD | §5.5 baseline = International order per FW-BU | GF-KB (HD) and AGS give the NA/JP order (Dragon Fang ends Circle, X; Tornado starts X). XU gives the International order. GF-KB's Shooting Star (Triangle, Circle, Square, Circle, Left, Right, X) matches no other source. GF-PF lists Dragon Fang as Left, Down, Up, Right | `[conflicting]`; settle in the Steam HD copy |
| D4 | Tornado success row and rank | §5.5: row 273, "rank 7 (fail 6)" | see Q2 item 4 | `[conflicting]` on rank only |
| D5 | Blitz Ace hit count | §5.3: 4 x8, then 24 x1 | FW-SP "4 (8 hits) + 24", XU "8 hits with 4 AP each", GF-KB "8 times ... for a maximum of 9 hits"; TRK rows 99 and 238 hold 9 hits of 4 | prose `[verified: 3 sources]` for 8 + finisher; the TRK byte (9) disagrees, unexplained |
| D6 | Slice & Dice fail | §5.3: 8 x3 | TRK row 236 = 8 x3; AGS "3 hits with 8 base power"; GF-KB "restricted to three targets if you fail" | agrees on 8 x3 `[verified: 2 sources]`; GF-KB's target wording is looser |
| D7 | Tornado in the original release | baseline International | GF-HD: second hit only in PAL/International/HD; AF and XU give 25 single hit (fail 20) for the original | consistent with our International baseline; no change |

Nothing in this file is game data to ship until the owning doc is updated through its own
change (AGENTS.md rule 6). Every "our estimate" line is a recommendation awaiting the driver
and Bailey.

---

## Steam HD check 2026-10-01

**Scope: FFX only; docs only.** Bailey, 2026-10-01 ~00:55 EDT: "yes you can take over the
screen for Steam." Copy: Steam HD Remaster at `D:/Tools/ffx-hd` (app 359870), FFX.exe started
directly with the Steam client running, window 1280x720, keyboard driven by SendInput
(`D:/Tools/ffx-hd/drive/drive_bushido.py`). Nothing was saved; no setting was left changed.
Screenshots stay under `D:/Tools/ffx-hd/observe/2026-10-01/` (none in the repo).

**Result: no Bushido input was observed. D1, D2, D3, D4 and Q1 stay open.** Nothing below
carries `[verified: Steam HD 2026-10-01]`.

What was observed (first launch, about 00:56 to 00:59 EDT):
- Save used: slot 106, "Sin - Tower of the Dead", play time 37:03 (the last save of the
  installed playthrough). Party Auron, Yuna, Tidus.
- Main menu > Overdrive > Auron: Bushido known = **Dragon Fang, Shooting Star, Banishing
  Blade**. **Tornado is not learned** in this save. Overdrive gauge shown full, mode Warrior.
  So the latest save cannot answer the Tornado items (D1 Tornado timer, Tornado's length in
  D2, D4). A save with all ten Jecht Spheres is needed for those.
- Keyboard mapping as installed (from `GameSetting.ini` `ffxKeyBinding` and the key-name
  table in FFX.exe): arrows = D-pad, C = confirm, X = cancel, V = Triangle (menu),
  B = Start, PageUp / PageDown = page keys in lists. The Bushido prompt glyphs were never
  reached, so whether the PC version shows PlayStation glyphs or key names is still unknown.

Why it stopped:
- About three minutes into the field (walking for a random encounter in the Tower of the
  Dead) the game froze: a static frame, no response to any key, the process still
  "Responding".
- Every later FFX.exe start (more than ten tries, including through the official launcher,
  borderless mode, VSync on, and after restarting the Steam client) showed a plain white
  window. The game's log showed the title and attract demo loading at about 30 fps, so the
  game logic ran, but nothing was presented (not even the Steam overlay's FPS counter). A
  stack scan showed the render thread waiting inside the NVIDIA D3D11 driver
  (`nvwgf2um.dll`) every time.
- FFX-2.exe from the same folder rendered normally at the same time (checked twice), so it
  is FFX.exe specific.
- Probable cause (not proven): the overnight ComfyUI art run started at about 00:51 EDT and
  kept the GPU at 70 to 99 percent with 10 to 15 GB of 16 GB in use. FFX.exe's render thread
  seems to wait on the GPU and never gets the result while that load runs. FFX.exe worked
  for its first few minutes, then stopped.
- Time box: stopped at about 01:30 EDT instead of grinding.

What a retry needs: run when ComfyUI is idle (no queue), start from slot 106 for Dragon Fang,
Shooting Star and Banishing Blade (the gauge is already full; reloading without saving
refills it for each test), and use a different save that has Tornado. One use per Overdrive
covers both checks: press one wrong key mid-sequence, watch whether the chips go back to
input 1 and the timer keeps running (Q1), then finish the sequence and read the result.
Screenshots from the start of each prompt give the glyphs, the number of inputs (D2), the
order (D3) and the starting timer value (D1).

## Steam HD check 2026-10-01 (retry)

**Scope: FFX only; docs only.** Same copy, save and keyboard driver as the first check
(`D:/Tools/ffx-hd`, slot 106, SendInput). Screen grabs used the plain window-rect screen grab
only; PrintWindow was not used. Run 07:19 to 07:35 EDT. Nothing was saved; no setting was
left changed. Screenshots stay under `D:/Tools/ffx-hd/observe/2026-10-01/retry/`.

**Result: blocked again before the title screen. No Bushido input was observed.** D1, D2,
D3, D4 and Q1 stay open, and nothing here carries `[verified: Steam HD 2026-10-01]`. The
earlier sections of this file stand as written.

What was checked:
- Before the start: ComfyUI queue empty, GPU 1.5 GB of 16 GB in use, no FFX.exe left from
  the night. So the "ComfyUI holds the GPU" explanation from the first check is **ruled
  out**: FFX.exe drew the same plain white window with the GPU idle.
- While the window is white, FFX.exe uses **0 percent GPU** (nvidia-smi pmon) and about 0.06
  of a CPU core. Its log still reaches the title maps (`titl00`, `titl02`) and prints
  "Framerate = 29.97 fps". The game starts, but it draws nothing.
- FFX-2.exe from the same folder, started a minute later, **drew normally**, with the Steam
  FPS counter. So the problem only affects FFX.exe, and it has lasted from about 01:00 to
  07:35 EDT.
- Tried, all still white: a plain restart; minimising and restoring the window; the
  graphics driver refresh (Win+Ctrl+Shift+B, sent twice; the second time a black screen
  frame confirmed it fired); a byte copy of FFX.exe under a new name (a fresh exe path,
  which rules out the per-exe NVIDIA shader cache, the Game Bar game entry and the per-exe
  compatibility state); exclusive fullscreen for one start (window stayed 1024x576, then the
  setting was restored byte-identical); starting through Explorer instead of the agent
  shell.
- Unchanged since the working start at 00:56: the game folder (only `OUTPUT.TXT` is
  rewritten), the FFX saves (last written 2026-09-26), `GameSetting.ini` (byte-identical
  to the copy taken before the first check). No display-driver or DWM event since 22:00.
- Loaded in FFX.exe: d3d11, dxgi, nvwgf2um (NVIDIA driver 610.47), NVIDIA's capture hook
  `nvspcap.dll` and the Steam overlay. No software renderer. A "SudoMaker Virtual Display
  Adapter" (Apollo streaming, installed 2026-09-27) is present but not attached to the
  desktop.

What this means: something outside the game files has been in a bad state since the first
start froze at about 00:59. That first start was also the one where PrintWindow was used.
A graphics refresh does not clear it. An agent should not try the remaining fixes on its
own. They are for Bailey to choose: a reboot (most likely to clear it); or turning off
NVIDIA's overlay, Apollo or the virtual display adapter for one test start.

Next try: after a reboot, with ComfyUI idle, load slot 106 and run the steps listed at the
end of "Steam HD check 2026-10-01". Grab the screen sparingly, and never use PrintWindow.

## Steam HD check 2026-10-01 (retry 2)

**Scope: FFX only; docs only.** Bailey, 2026-10-01 ~14:10 EDT: "try again... i havent
restarted my pc" (and at ~00:55: "yes you can take over the screen for Steam."). Same copy,
slot and keyboard driver as before. Run 14:17 to about 14:52 EDT. Screen grabs were a handful
of window-rect grabs and tiny pixel patches; PrintWindow was not used. Nothing was saved. No
registry value, Windows setting, service, driver or NVIDIA / Apollo setting was changed;
`GameSetting.ini` was edited three times for tests and is byte-identical again (hash
compared). Screenshots and traces stay under
`D:/Tools/ffx-hd/observe/2026-10-01/retry2/` (one 238 MB trace parked on F:); none are in the repo.

**Result: still a plain white window. No Bushido input was observed.** D1, D2, D3, D4 and Q1
stay open, and nothing here carries `[verified: Steam HD 2026-10-01]`. The earlier sections
of this file stand as written. This section only adds a sharper diagnosis.

Display and GPU state (read only):
- One real GPU, "NVIDIA GeForce RTX 5070 Ti" (driver 32.0.16.1047), one display attached to
  the desktop: `\\.\DISPLAY1`, 2560x1440, primary, 120 dpi. The "SudoMaker Virtual Display
  Adapter" (Apollo / SudoVDA, driver 1.10.9.289) is present and OK in Device Manager, but
  none of its `\\.\DISPLAY5` to `14` entries is attached. The Apollo service and
  `sunshine.exe` have run since 2026-09-27 18:41; the PC booted 2026-09-25 13:12. I found no
  display, PnP or driver event between 00:00 and 03:00 today (only BITS start-type toggles
  and a shadow-copy trim). I cannot see the state at 00:56 itself, so "unchanged since then"
  means "no trace of a change".
- A fresh process lists DXGI adapters as: 0 = the RTX 5070 Ti with the one output; 1 = a
  second "RTX 5070 Ti" entry with no outputs (its DirectX registry key is dated 2026-09-27
  22:21 UTC, the Apollo install evening); 2 = Microsoft Basic Render Driver.
- FFX.exe's GPU memory (about 212 MB) sits on LUID 0x1c337, which is adapter 0 only. So the
  hypothesis "adapter enumeration puts a virtual or idle adapter first" is **ruled out** for
  the device FFX renders with.
- `HKCU\...\UserGpuPreferences` has no FFX.exe entry (entries exist for SHProto.exe,
  AlanWake2.exe, Acrobat.exe, 12M.exe; key last written 2026-09-22). The global setting
  holds `SwapEffectUpgradeEnable=1` (Windows "Optimizations for windowed games" on) and
  `AutoHDREnable=0`.
- ComfyUI: queue empty, Torch VRAM 64 MB (no models loaded), 3.3 GB of 16 GB used by desktop
  apps. `/free` was not needed and not sent.
- The window is 1280x720 on the only monitor, visible, not cloaked. (A reading of 1024x576
  taken early in this run came from a probe that was not DPI aware; it was an artifact, not
  a game fault.)

What differs between FFX.exe and FFX-2.exe, started from the same folder in the same minute:
- A DXGI trace (ETW provider Microsoft-Windows-DXGI, 14 s each) shows FFX **does present**: 386
  Present calls (sync interval 0), the same rate as FFX-2 (379). FFX-2's Present returns
  S_OK every time. FFX's returns S_OK except DXGI_STATUS_OCCLUDED on 4 calls (two at +0.9 s,
  two at +9.8 s, the same moments as the error lines below). Only
  FFX logs DXGI error lines: "Failed to find an output for the swapchain" (E_FAIL, twice at
  +0.4 s and twice at +9.8 s) plus "Non-zero return value" for the occluded statuses.
  FFX-2 logs none.
- Loaded modules: FFX-2 also loads `dcomp.dll` and `microsoft.internal.warppal.dll` (the
  Windows flip-model / DirectComposition path); FFX loads neither. Both load d3d11, dxgi,
  the 32-bit NVIDIA driver (`nvwgf2um.dll`), `nvspcap.dll` (NVIDIA capture hook) and the
  Steam overlay. FFX-2 shows the Steam FPS counter; FFX never does.
- Thread stacks: no FFX thread is inside d3d11 or dxgi, and its main thread sits in a normal
  message wait; the NVIDIA threads are the usual compile-worker pool, the same as in FFX-2.
  So the first check's "render thread stuck in the driver" reading is **not supported**.
  FFX's GPU 3D engine is busy about 5 to 8 percent (earlier readings of 0 percent were
  taken at other moments).
- Windows keeps extra state only for FFX.exe: a GameConfigStore entry with Flags 529 and
  `ExeParentDirectory=Final Fantasy FFX` (FFX-2.exe: Flags 17), and a Program Compatibility
  Assistant store record that every FFX launch rewrites (none for FFX-2). Not touched.

Tried this run, every start still white:
- The official launcher: clicking FINAL FANTASY X starts `FFX.exe` with no arguments, so it
  is the same as a direct start.
- Process-only environment: `__COMPAT_LAYER` = `DISABLEDXMAXIMIZEDWINDOWEDMODE`, `WIN7RTM`,
  `WIN8RTM DISABLEDXMAXIMIZEDWINDOWEDMODE`; `SteamNoOverlayUIDrawing=1` (the overlay DLL
  still loaded).
- `GameSetting.ini`, one change at a time, restored after each: `Resolution=1920*1080` (the
  window did grow to 1920x1080, so the file is read), `Quality=VQ_HIGH`,
  `ColorCorrection=Off`.
- Start priority High and BelowNormal; CPU affinity limited to 8 and to 2 logical cores.
- On a running white window: resize and resize back, minimise and restore, C / Enter / C,
  Alt+Enter.
- There is only one monitor, so there was nothing to move the window between.

Diagnosis and most likely cause (inference; the trace shows the error, not the reason):
DXGI cannot match FFX's swapchain to a display output. The game's windowed presents are
accepted but never reach the desktop, the Steam overlay cannot draw on that swapchain, and
the fullscreen setting cannot take effect either (it needs the same output lookup; last
night's fullscreen test never left the window). FFX-2 gets through the windowed-present path
that FFX does not. That points at the Windows graphics stack (driver, DWM, or the windowed
present path, with the NVIDIA capture hook and Apollo's virtual display adapter as the other
pieces that changed recently), not at the game files, the save, the GPU load or adapter
order. It began with the first start's freeze at about 00:59, and no file I can see
changed since.

What Bailey would have to change (I changed none of it), in this order:
1. **Reboot Windows**, then start FFX.exe once with ComfyUI idle. The PC has been up since
   2026-09-25 and a driver refresh did not clear it; a reboot is the cheapest way to reset
   the driver, DWM, the NVIDIA container and Apollo's display driver together.
2. If it is still white after the reboot: Windows Settings > System > Display > Graphics,
   add `D:\Tools\ffx-hd\FINAL FANTASY FFX&FFX-2 HD Remaster\FFX.exe`, Options, and tick
   "Don't use optimizations for windowed games" (or turn the global "Optimizations for
   windowed games" off for one test).
3. If still white: turn off the NVIDIA App in-game overlay (the `nvspcap.dll` hook), or
   remove the Apollo virtual display adapter, for one test start.

A quick check after any of these, with no screenshot: start `FFX.exe`, wait 14 s, and read
the average colour of a 40x40 patch at the centre of its client area. (255, 255, 255) means
still white; anything else means it draws. Then follow "What a retry needs" in the first
section (slot 106 for Dragon Fang, Shooting Star and Banishing Blade; a save with Tornado
for the rest).

## Applied in release 38 (2026-10-03): D2 and D3, PR-0308

**Scope: FFX only** (Bushido and Swordplay exist only in FFX). Code and data, not docs only:
`src/data/ffx/overdrives/inputs.ts` carries the two tables below and its header carries the
source notes; the abilities in `src/data/ffx/abilities/overdrive-{auron,tidus}.ts` publish
them as `extra.minigameParams`, which `minigameParams` in `src/battle/ffx/overdrive.ts`
already merged over its defaults; the two overlays now read them.

* **D2, sequence length (sourced, `[verified: 4 sources]`).** Dragon Fang 8, Shooting Star 7,
  Banishing Blade 7, Tornado 6. The overlay used to ignore `inputs: 7` and show its own
  7-chip default for every Bushido. GF-KB's 5 for Tornado is the dissent, not shipped.
* **D3, button order (our estimate).** Bailey, 2026-10-03: "all your recommendations" for
  morning-page ask 13, which was "use the GameFAQs order ... I will mark it as our estimate
  until the Steam copy is checked". The GameFAQs page (GF-KB) is not transcribed in this
  note beyond what D3 records, so the order used is: Dragon Fang, the NA/JP order
  (down, left, up, right, L1, R1, Circle, Cross); Shooting Star, GF-KB's own order as D3
  records it (Triangle, Circle, Square, Circle, Left, Right, Cross); Banishing Blade, the one
  order every source agrees on; Tornado, the NA/JP order (Cross, right, R1, left, L1,
  Triangle). Still `[conflicting]`, still to settle in the Steam HD copy; changing one is a
  one-line edit in `inputs.ts`. Shooting Star needs a Square button, which the HUD input
  watcher did not have: `K` on the keyboard, pad button 2 (`src/ui/ffx/rawInput.ts`).
* **Swordplay zone and speed: the ordering is sourced, the numbers are still owed.** Only the
  ordering is sourced (`ffx-combat-core.md` §5.3 rule 2, `[verified: 2 sources]`); the table there
  is tagged `[estimate]` (Spiral Cut 22 % / 1 400 ms, Slice & Dice 16 % / 1 150 ms, Energy Rain
  12 % / 900 ms, Blitz Ace 9 % / 700 ms) and Bailey's ask 13 covered the button order only, so
  none of it ships (AGENTS.md rule 6). Repair cycle, independent check blocker: every tier keeps
  what the overlay played before (a 44 px zone, 12.22 % of the meter, at 340 px/s, 1 059 ms a
  crossing). The per-tier wiring stays, so sourced values (or Bailey's yes to the estimates) are a
  four-row edit in `inputs.ts`.
