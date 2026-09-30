# Status display O3: paper preflight (AGENTS.md rule 15)

Track `status-o3`, branch `status-o3` from `origin/main` 1a6fd3cc. Bailey picked O3
"Originals + guard rails" for both games on 2026-09-29 ("I'll go with all of your
recommendations please"). Target: `docs/concepts/status-display-0929/options/o3-*.jpg`, the
coverage table in that folder's README ("The table is the scope each option would build"),
sources in `research/status-display.md`, cures in `research/ffx-combat-core.md` §4.2 and
`research/ffx2-combat-core.md` §2.8.

`node tools/critic-plan.mjs --paths` classes this change **deep** (global layout; FFX HUD;
FFX-2 HUD; effects and sprites; every chapter of both games). Deep after deploy, focused
before. This note is the paper preflight that rule 15 asks for before the build.

## Game case (rule 14)

Per status, from the sources; the tables live in code (`src/ui/common/statusLooks.ts`) with
the source tag on every row, and a test pins them.

- **FFX only:** Zombie (green body and glow, black smoke; the heal-as-damage forecast),
  Berserk red hue, Curse brown hue, the Nul orbs, Doom's red count over the head, the round
  medallions under the Overdrive gauge and beside turn-list names.
- **FFX-2 only:** Silence ellipsis bubble, Darkness cloud, Curse darkened body, Stop frozen
  figure, Pointless slow flash, the target's icons in the top help line, square tags in place
  of the text chips, the boss STATUS tab with Doom's count.
- **Both (each game's own sourced rule):** Poison bubbles, Sleep Z's, Confuse stars,
  Auto-Life halo, Protect's blue shield on a physical hit, the battle message line, the
  ASLEEP-type captions, the cure hints (each game's own cure table).
- **Nothing drawn** where no source describes a look (FFX Silence, Darkness, Slow, Haste,
  Shell, Reflect, Regen, Breaks, Provoke...; FFX-2 Berserk, Shell, Regen, Doom over the head).
- FFX-2 Reflect's shield flash is sourced, but the FFX-2 engine never bounces a spell, so
  there is no event for it; not built, noted. The O3 "spell will bounce" warning is FFX only
  for the same reason.

## Architecture (rule 1: presentation only)

- A pure table module (`statusLooks.ts`: figure marks, tints, icon sets, harm/help, captions,
  message phrases, cure hints) and a glyph module (fresh SVG, rule 8).
- A HUD tap, `withStatusLooks(hud, field, game, facts)`, the shape of `withOmnisGlow`: it
  wraps `sync` / `syncVitals` / `onEvent` / `update` / `setProjector` / `unmount`. It owns
  the DOM mark layer (bubbles, Z's, stars, smoke, halo, orbs, bubble, cloud, shield flash;
  projected each frame like `DoomCounters`), the figure tints (through `PaintedActor`'s own
  public `setTint`, and the painted planes' flash cells for Zombie's held glow, the recipe of
  the approved base frame), and the message line. It reads state and events; it never
  writes either. The presenter (`BattlePresenter*.ts`) is untouched.
- HUD rows: FFX `PartyStatusWindow` and `CtbList` draw medallions instead of pips and dots;
  FFX-2 `statusChips` draws tags. Both through one icon helper.
- O3 rails: a small FFX module fed from the command menu's existing `targetNoteOf` /
  `onSelection` hooks computes the forecast with `simulateFFXCommand` (the engine preview
  fb-0929-hipotion used); an FFX-2 module adds DOOM n and captions.

## Risks and how each is checked

1. **Tint fights another look.** Nobody calls `setTint` in battle today (grep); petrify
   drives `setStone`/`setBrightness`, which the tint does not touch. The look is re-applied
   only when the wanted look changes, and is skipped under Petrify and KO.
2. **Stop freeze stalls a departure.** Freezing is a dt scale on the figure's own update; it
   is lifted on `ko`, removal, a result, and whenever the state says the unit is not alive.
3. **Big files must not grow** (`FFXBattleHud` 1668, `CommandMenu` 865, `FFX2BattleHud`
   1276, `TargetCursor` 531, `PaintedActor` 2026): every hook is a changed line, or paid for
   by folding a line; new logic goes in new files under 400 lines.
4. **Per-frame cost.** Marks are CSS-animated DOM nodes, a handful per figure; placement
   reuses the projector. Measured with a frame-time probe before and after.
5. **Phone.** Rows and tags are positioned by CSS on the existing cards; checked at 390x844.
6. **Staged capture vs real play.** The capture writes statuses into state and calls
   `syncHud`, so the tap reconciles from state on every `sync`, not only from events.

## Proof plan (rule 3)

- Unit tests pin each game's mapping (an undescribed status draws nothing), the icon rows,
  the O3 forecast on a real Chapter I Zombie board, and the message phrases.
- Headless GPU captures of the two mockup moments at 1600x900 and 390x844, side by side with
  `options/o3-*.jpg`, into `docs/concepts/status-display-0929/final/`.
- tsc, orphans, the full suite once.

## As built (2026-09-30)

- The tap and every piece named above were built; the handoff is `docs/handoff/status-o3.md`.
- Captions narrowed to statuses that take the command away (the approved FFX-2 frame captions
  Yuna's Sleep and not Rikku's Silence); FFX-2 Confuse has none (its source: "may use any
  command she has").
- The message line is mounted on the battle root above the targeting layer (the Bahamut reticle
  covered it inside the HUD).
- Risk 4 measured: 60 fps held; the layer's own script 0.19 ms/frame; layout reads cached.
- Risk 2 checked in a unit test (Stop freezes, thaws inside an action and after a hit, releases).
- Risk 3 held: every file this touched stayed within its size or shrank (`TargetCursor.ts`
  531 -> 529); new files are under 320 lines.
