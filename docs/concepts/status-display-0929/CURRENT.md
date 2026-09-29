# Status display: how the originals show it, how we show it now

Options round, 2026-09-29. Bailey: "Kimahri probably had the zombie status
effect but even if so the status effects in general not noticeable or obvious
like in the actual ffx/ffx-2 games. I like how status effects are displayed in
the games. That should be examples." This page is the **current state and the
gap**, nothing is built. The sourced reference for the originals is
[`research/status-display.md`](../../../research/status-display.md); every
"original" cell below comes from it and carries its confidence there.

**Game case (AGENTS.md rule 14).** Two separate gap tables: FFX (chapters with
the CTB HUD, proven in Chapter I, Seymour Flux) and FFX-2 (the ATB HUD, proven
in Chapter IV, Bahamut). Findings that are shared plumbing (the status-add
flash, the petrify stone) are marked "both".

## How this was proven

A production build of `origin/main` 1c313c17 (bundle built into scratch,
served by `vite preview` on port 8220), driven headless (Playwright, real GPU)
at **1600x900** and **390x844**. For each case the probe walked into the
chapter with `__pyrefly.gotoChapter(id, { skipCutscenes, skipPrep })`, waited
for the first command menu, wrote status instances straight into the live
engine state (`battle().engine.state().combatants[id].statuses`), and called
the presenter's own `syncHud(engine)`, so the HUD rendered exactly what it
renders after a real status event. The on-model petrify look was driven with
the same two actor calls the presenter makes on `status-add petrify`
(`setStone(1)`, `setBrightness(0.8)`), and the application flash with the
presenter's own parameters (`flash(0xc9a6ff, 260, 0.5)`, captured 90 ms in).
For every status marker the probe also read its box and asked the page what
is drawn on top of its centre (`document.elementFromPoint`), which is how
"covered" below is measured, not guessed.

Limitation: FFX-2's ATB gauge colour comes from the engine's gauge snapshot,
which this injection does not reach, so the Haste/Slow/Stop gauge colours
below are read from code (`src/battle/ffx2/gauges.ts` `barState`,
`src/ui/ffx2/ffx2-hud.css`) and not from a frame.

Screenshots are in [`current/`](current/) (JPEG, our own frames only).

## The five biggest gaps

1. **FFX: a status on one party member is invisible.** The party row draws
   every status as the same small sky-blue square (`.ffx-stat__statuses i`,
   5 px on the 640x360 grid, 12.5 CSS px at 1600x900, all
   `var(--ig-spira-sky)`), and the first square sits at `left: 8px`, **under
   the portrait**. Kimahri with Zombie alone: nothing shows in his row, on his
   figure or in the turn list
   ([desktop](current/seymour-flux-desk-01-zombie-only.jpg),
   [zoom](current/seymour-flux-desk-01-zombie-only-rows-zoom.jpg)). On the
   phone the square moves to the card's top right and is one 7 px blue dot
   with no meaning ([phone](current/seymour-flux-phone-01-zombie-only.jpg)).
   The original: "a glowing green body and black smoke clouds around their
   heads".
2. **Both games' originals show statuses on the figure; we show two.** Our
   figures carry only Petrify (a strong, correct stone grey,
   [FFX](current/seymour-flux-desk-04-petrify.jpg),
   [FFX-2](current/ffx2-bahamut-desk-04-petrify.jpg)) and FFX's Doom number.
   Zombie's green body and smoke, Poison's green bubbles, Sleep's Z's and
   hunch, Confuse's two stars, Berserk's red hue, Curse's brown (FFX) or
   darkened (FFX-2) model, Auto-Life's halo, the Nul orbs, FFX-2's Darkness
   cloud and Silence ellipsis bubble: **none are drawn**. Every other status
   gets the same 260 ms lavender flash at 50% when it lands
   (`BattlePresenterArrivals.ts` `statusAdded`), which does not say which
   status it was and is gone before the next beat
   ([flash at 90 ms](current/seymour-flux-desk-05-status-flash-mid.jpg)).
3. **FFX: the turn list's status dots are drawn and then covered.** The CTB
   tiles do carry coloured dots per status (`CtbList.ts`
   `STATUS_DOT_COLOR`, 10 px at 1600x900, 7 px on the phone), but in every
   measured case the tile's portrait is on top of the dot: 0 of 9 party dots
   and 0 of 3 boss dots visible on desktop, and none on the phone either
   ([zoom](current/seymour-flux-desk-02-ctb-zoom.jpg)). This is the only
   place the FFX HUD shows an **enemy's** statuses at all, so a poisoned,
   slowed, Armor-Broken Seymour Flux shows **nothing** except his Doom number
   ([desktop](current/seymour-flux-desk-03-boss-statuses.jpg),
   [phone](current/seymour-flux-phone-03-boss-statuses.jpg)).
4. **FFX-2: the boss's statuses are shown nowhere.** Bahamut poisoned,
   slowed, DEF Down, Doomed and asleep looks exactly like Bahamut with none
   ([desktop](current/ffx2-bahamut-desk-03-boss-statuses.jpg),
   [phone](current/ffx2-bahamut-phone-03-boss-statuses.jpg)). The original
   puts an icon for every status on the targeted unit in the help line, plus
   the on-model marks. Our target tag ("TARGET Yuna") lists none either
   ([targeting](current/ffx2-bahamut-desk-06b-targeting.jpg)).
5. **FFX-2: the party chips are readable on desktop but clip, and break on the
   phone.** Text chips (`PSN SIL DRK`, good ones green) are the one status
   display in the game a player can read at a glance, but the row caps at
   four and the third is cut by the row edge ("DRI", "SL",
   [zoom](current/ffx2-bahamut-desk-02-rows-zoom.jpg)). On the phone the
   chips are 14 px, overflow their cards and overlap the next girl's ("N SIL
   DRK SI" runs into "HST PRO SHL", [phone](current/ffx2-bahamut-phone-02-party-many.jpg)).

## FFX gap table (Chapter I)

"At a glance" = can a player who is not looking for it tell, in about one
second, that this unit has this status? **Clear / weak / hidden / none**.
"Hidden" means our HUD draws something but it is covered or unreadable.

| Status | The original (FFX) | Ours now | Glance, desktop | Glance, phone | Shots |
|---|---|---|---|---|---|
| **Zombie** | green glowing body, black smoke around the head | a blue square under the portrait; a covered CTB dot; the brief enemy-move panel forecasts "ZOMBIE 100%" before Lance of Atrophy (a forecast, not the state) | **none** | weak (a blue dot) | desk-01, phone-01 |
| **Poison** | green bubbles above the head | blue square; covered green CTB dot | hidden | weak | desk-02, phone-02 |
| **Petrify** | turned to stone, shatters on a physical hit | stone-grey figure (4 steps over 280 ms, then held), shatter burst for enemies | **clear** | clear | desk-04 |
| **Silence** | a look on the model (undescribed); no battle speech | blue square; covered CTB dot | hidden | weak | desk-02 |
| **Darkness** | a look on the model (undescribed) | blue square; covered CTB dot | hidden | weak | desk-02 |
| **Sleep** | hunched over, Z's from the head | blue square; covered CTB dot | hidden | weak | desk-02 |
| **Confuse** | two spinning stars over the head | blue square; covered CTB dot (grey default) | hidden | weak | desk-02 |
| **Berserk** | red hue | blue square; covered CTB dot | hidden | weak | desk-02 |
| **Curse** | murky brown hue; OD gauge stops | blue square; covered CTB dot; the OD gauge does stop (engine) | hidden | weak | desk-02 |
| **Doom** | red countdown over the head | white number with a dark outline over the head (`DoomCounters.ts`), min 16 px on the phone; on the phone the boss's number is pushed below the enemy-move panel and lands beside the tutorial card | **clear** (party), weak (boss) | weak | desk-02, desk-03, phone-03 |
| **Slow / Haste** | turn order (CTB); Haste speeds the victory pose | the CTB list re-sorts correctly (engine); a blue square; covered CTB dot | weak (only by reading the order) | weak | desk-02 |
| **Protect** | blue shield flashes when a physical hit lands | blue square only; no shield on hit | hidden | weak | desk-02 |
| **Shell / Reflect / Regen** | a look on the model (undescribed) | blue square; covered CTB dot | hidden | weak | desk-02 |
| **Auto-Life** | halo above the head | blue square; covered CTB dot | hidden | weak | desk-02 |
| **Nul statuses** | circling red / white / yellow / blue orb | blue square | hidden | weak | — |
| **Critical** | HP digits yellow below 50%; slouch, more below 25% | HP digits yellow below 50%, orange at 12.5% or less; no slouch pose | clear (digits) / none (pose) | clear / none | — |
| **KO** | the KO animation, down on the field | KO pose, 320 ms dark flash; row greyed, name struck through | clear | clear | — |
| **Armor / Mental / Power / Magic Break** | no look described | blue square; no CTB colour (falls back to grey) | hidden | weak | desk-03 |
| **Provoke / Threaten / Sentinel / Guard / Defend** | images exist for Provoke, Guard, Defend; Sentinel "a defensive stance" | blue square; no pose | hidden | weak | desk-03 |
| **Any status, the moment it lands** | its own on-model effect | one 260 ms lavender flash at 50%, the same for every status, plus the `status-applied` cue | weak (and says nothing about which) | weak | desk-05 |
| **Enemy statuses, any** | on the model, same marks as the party | covered CTB dots only (the target panel shows HP and affinities, no statuses) | **none** | **none** | desk-03, phone-03 |
| **Target window while aiming** | statuses next to names when aiming a buff (community source) | not shown | none | none | — |

## FFX-2 gap table (Chapter IV)

| Status | The original (FFX-2) | Ours now | Glance, desktop | Glance, phone | Shots |
|---|---|---|---|---|---|
| **Poison** | green bubbles above the head; icon | `PSN` chip (dark pink) in the girl's row | clear | clear alone, broken in a crowd | desk-01, phone-01, phone-02 |
| **Petrify** | gray stone; shatters on a physical hit; icon | stone-grey figure; `PTR` chip | **clear** | clear | x2 desk-04 |
| **Silence** | speech bubble with an ellipsis above the head; no battle speech; icon | `SIL` chip | clear (chip only) | clipped | desk-02 |
| **Darkness** | black cloud on the head; icon | `DRK` chip, often clipped to "DRI" as the third chip | weak | clipped | desk-02 |
| **Sleep** | hunched over, Z's; icon | `SLP` chip, clipped to "SL" as the third | weak | clipped | desk-02 |
| **Confuse** | two spinning stars; icon | `CNF` chip (4th, often cut off) | weak / none | clipped | phone-02 |
| **Curse** | darkened model; blocks spherechange; icon | `CRS` chip; model unchanged (Paine starts this chapter Cursed) | weak | weak | x2 desk-00 |
| **Haste / Slow / Stop** | red / gold / white-or-gray ATB gauge (Stop colour is a sourced conflict); animations sped up, slowed, frozen; icon | chips `HST`/`SLW`/`STP`; the gauge colours are coded (red `--ig-blood`, gold `#c9a227`, Stop `--ig-paper` white) but not frame-proven here; no animation-speed change | chips clear; gauge unproven | same | desk-02 |
| **Protect / Reflect** | blue shield on a physical hit / a bouncing spell; icon | `PRO` / `RFL` chips (green) | clear (chip) | clipped | desk-02 |
| **Shell / Regen / Auto-Life** | icon (Auto-Life also a halo) | `SHL` / `RGN` / `LIF` chips; no halo | weak (4-chip cap) | clipped | desk-02 |
| **Doom** | icon; count starts at 3 (over-head placement unsourced) | `DOM` chip; no count shown (the FFX counter is FFX-only) | weak (no number) | clipped | desk-02 |
| **Up / Down family** | icon only, no model change | `STR▲2`-style chips | clear if within the 4 | clipped | desk-02 |
| **Stop** | model frozen | `STP` chip; model keeps idling | weak | clipped | desk-02 |
| **Pointless** | icon "EXP=0"; the girl flashes slowly | `EXP0` chip; no flashing | weak | clipped | — |
| **Any status, the moment it lands** | its own on-model effect | the shared 260 ms lavender flash (both games) | weak | weak | — |
| **Boss statuses, any** | help-line icons for the targeted unit; on-model marks | **not shown anywhere** | **none** | **none** | x2 desk-03, phone-03 |
| **Target window while aiming** | help line lists the target's status icons; a status spell on a girl swaps her HP/MP row for a white bar of her icons | "TARGET Yuna" tag; no statuses | none | none | x2 desk-06b |

## What the shots are

| File | What it shows |
|---|---|
| `seymour-flux-desk-00-baseline.jpg` | Chapter I first menu, no statuses (the reference) |
| `seymour-flux-desk-01-zombie-only.jpg` (+ `-rows-zoom`) | Kimahri with Zombie only: nothing visible anywhere |
| `seymour-flux-desk-02-party-many.jpg` (+ `-ctb-zoom`) | Tidus six ailments, Yuna six buffs, Kimahri Doom + Sleep + Confuse: identical blue squares, the Doom "3", CTB dots all covered |
| `seymour-flux-desk-03-boss-statuses.jpg` | Seymour Flux with Poison, Slow, Armor Break, Mental Break, Doom 5, Provoke: only the "5" |
| `seymour-flux-desk-04-petrify.jpg` | Yuna petrified: the one strong on-model status |
| `seymour-flux-desk-05-status-flash-mid.jpg` | the generic application flash, 90 ms into its 260 ms |
| `seymour-flux-phone-01/02/03` | the same three cases at 390x844 |
| `ffx2-bahamut-desk-00-baseline.jpg` | Chapter IV first menu as the chapter sets it up (Paine starts Cursed: one `CRS` chip) |
| `ffx2-bahamut-desk-01-poison-only.jpg` | Rikku with Poison: one readable `PSN` chip |
| `ffx2-bahamut-desk-02-party-many.jpg` (+ `-rows-zoom`) | five statuses per girl: four chips max, the third clipped |
| `ffx2-bahamut-desk-03-boss-statuses.jpg` | Bahamut with five statuses: nothing shown |
| `ffx2-bahamut-desk-04-petrify.jpg` | Rikku petrified (stone) |
| `ffx2-bahamut-desk-06b-targeting.jpg` | aiming Cure: the target tag carries no statuses |
| `ffx2-bahamut-phone-01/02/03` | the same at 390x844; phone-02 shows the chip overflow |

## Where the display lives in code (for whoever builds the pick)

- FFX party row: `src/ui/ffx/PartyStatusWindow.ts` (`statusHtml`, empty `<i title>` per status) and `src/ui/ffx/ffx-hud.css` `.ffx-stat__statuses`; phone `src/ui/ffx/phone-hud.css`.
- FFX turn list: `src/ui/ffx/CtbList.ts` (`STATUS_DOT_COLOR`), `.ffx-ctb-statuses` in `ffx-hud.css`.
- FFX Doom number: `src/ui/ffx/DoomCounters.ts`.
- FFX-2 chips: `src/ui/ffx2/statusChips.ts`, `src/ui/ffx2/PartyRows.ts`, `.ffx2-status-chip` in `ffx2-hud.css`; phone `src/ui/ffx2/phone-hud.css`.
- FFX-2 gauge colour: `src/battle/ffx2/gauges.ts` `barState`, `.ffx2atb--haste/slow/stop` in `ffx2-hud.css`.
- On the figure (both): `src/engine/BattlePresenterArrivals.ts` `statusAdded` (the flash, petrify, eject), `src/engine/PaintedActor.ts` `setStone`. Nothing persistent exists for any other status; a persistent on-figure mark would be new presentation (the presenter itself stays DOM- and three-free, AGENTS.md rule 1).
