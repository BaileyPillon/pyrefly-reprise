# The FF7 battle look for Guard Scorpion: options round, 2026-09-27

Bailey, 2026-09-27 ~00:35 EDT: "go with guard scorpion first, full speed ahead, but make it a hidden
selectable encounter since it's experimental". Guard Scorpion is the first FF7 boss (Mako Reactor 1,
Cloud and Barret). Before any FF7 HUD is built, rule 9 needs Bailey to pick how it looks. These are
the options. **Game case: FF7 only** (a third game; nothing here changes the FFX or FFX-2 HUDs).

Nothing here is built. A pick approves only what Bailey names.

**The moment shown in every frame:** the tail is raised, Cloud's line is on screen, it is Cloud's
turn with Attack / Magic / Item open (cursor on Magic), and both party rows show Limit and ATB (FF7
labels ATB "TIME"). Each option comes at 1600x900 and at 390x844 (phone).

**What is placeholder:** the reactor bridge scene and the three figures are original SVG drawings
made for this sheet, labelled "PLACEHOLDER" on every frame; no retail image, model, sprite, font,
glyph or screenshot is used or traced (rule 8). Party values are placeholders too (see Sources).

## The sheet (phone-readable, 4 parts)

- `sheet-1-overview.jpg`: the three looks side by side, and the recommendation
- `sheet-2-option-a.jpg`, `sheet-3-option-b.jpg`, `sheet-4-option-c.jpg`: one option each, desktop and phone
- Full-size frames: `frames/{a,b,c}-1600.jpg` and `frames/{a,b,c}-390.jpg` (the phone frames are 2x)

## The options

### A · FF7's classic windows, redrawn
- **How it reads:** instantly FF7. Blue gradient windows with a white bevel; the message window at the
  top; the enemy window and the command window at the bottom left; name, HP, MP, Limit and TIME at the
  bottom right. Our type (Exo 2, Rajdhani, Chakra Petch), a grain pass and our own pointer, never the
  retail font or the glove cursor.
- **Fidelity:** highest.
- **Cost:** a second chrome system beside Ink & Gold (window material, pointer, gauges), about one HUD
  batch, and every later FF7 screen (results, pause) would need the same treatment.
- **Risk:** it reads as a different game from chapters I to XI; the windows take about a quarter of the
  frame height.

### B · Ink & Gold with a mako skin
- **How it reads:** the same family as the FFX and FFX-2 chapters. The ivory action banner names the
  moment ("Tail raised"), Cloud's line sits on an ink chip, the cascade command stack is at the left, two
  skewed party rows with Limit and ATB bars at the right, the target bracket is on the boss. Mako green
  (`#5CE6A8`, on ivory `#1F8A5E`) takes the accent role that gold has in FFX and pink in FFX-2.
- **Fidelity:** lowest; FF7's window band is gone.
- **Cost:** lowest. It reuses the shipped command stack, party status, bracket and banner, adds one token
  and swaps the CTB queue for per-row ATB bars.
- **Risk:** it may not feel like FF7 until the fight starts. The banner is our addition.

### C · FF7's layout, Ink & Gold materials (recommended)
- **How it reads:** FF7's shapes and places (message window, enemy window, command window, the party band
  with HP, MP, Limit and TIME) as ink panels with an ivory hairline and a mako inner line; Cormorant
  names, Rajdhani numbers, Chakra commands. The "TAIL RAISED" chip in the message window is our addition.
- **Fidelity:** high for the layout and the flow, ours for the surface.
- **Cost:** medium: one new layout component on the existing tokens, fonts and bars.
- **Risk:** the band takes the same quarter of the frame height as A; the phone stack is tight but legible.

## Recommendation: C

It is the product brief's rule for conflicts, "faithful core, showpiece surface": the parts that make the
fight read as FF7 (where things are, the TIME and Limit gauges, the top message window) stay, and the
surface is the language Bailey already approved, with mako green as the third accent. B is the cheap
fallback if the FF7 slice should cost as little as possible; A is for the most literal recreation.

## Faithfulness notes

- Cloud's advice to attack while the tail is up is **misleading in FF7**: attacking then triggers the Tail
  Laser counter (FF wiki; GameFAQs boss guides; the AI script in `D:\FF7\docs\research\enemies.md` §1).
  Every option keeps the line as FF7 has it and adds no warning. B's banner and C's chip only name the
  state ("Tail raised"); they give no advice. Any hint beyond that is a new idea and needs Bailey's yes (rule 10).
- The line's exact wording, the exact window arrangement and the gauge colours still need a check in the
  real game. There is a conflict on colours: the older FF7 research (`D:\FF7\docs\research\audio-type.md`
  §5.3) says both TIME and Limit are yellow; option A draws Limit in magenta from memory. Unverified
  either way, so A's Limit colour is **our estimate**.

## Sources

- Guard Scorpion facts used for the moment: 800 HP, level 12, weak to Lightning, the fixed pattern
  (Search Scope, attack, Search Scope, attack, raise the tail, wait two turns) and the Tail Laser counter.
  GameFAQs boss guides for FF7 (PlayStation, e.g. Blackestmage's Boss Guide, faqs/19813) and the Final
  Fantasy Wiki's Guard Scorpion (Final Fantasy VII) page, as summarised by a web search on 2026-09-27;
  the pages were not opened. None of these numbers appear on the frames.
- Cloud's max HP 314 and MP 54: Fergusson, FF7 Party Mechanics v1.10, via `D:\FF7\docs\research\party.md`
  §1.4 [exact]. Cloud's current 281 is a placeholder.
- **Barret's 376/446 HP and 18/18 MP are placeholders with no source.** Barret joins one level below Cloud
  (Lv 5, same file); his real max HP and MP come from the party growth formula and were not computed here.
  The frames say "party values are placeholders".

## How this was made

Static HTML (`src/mock.html`, `src/scene.js`, `src/hud.js`) rendered once by one short headless Chromium
run (`node src/render.mjs <out>`; no dev server, no game build), then `python src/sheet.py <out> .` wrote
the frames and the sheet parts (each at most 2000 px tall and under 1 MB). The fonts are the repo's own
OFL files under `public/fonts/`. `D:\FF7\concept\stylish-ui.html` was not used.
