# Status display: three options for Bailey to pick from

Options round, 2026-09-29. Bailey: "Kimahri probably had the zombie status
effect but even if so the status effects in general not noticeable or obvious
like in the actual ffx/ffx-2 games. I like how status effects are displayed in
the games. That should be examples."

**Nothing here is built into the game.** Each option is a static HTML overlay
drawn on top of our own game's frames. It follows AGENTS.md rule 9 (end state
first): Bailey picks or mixes, and only then does anything get built.

- **Side by side:** [`index.html`](index.html) shows every option for both
  games next to today's frame, at 1600x900 and at 390x844, with close-ups of
  the HP plates.
- **Sources:** [`research/status-display.md`](../../../research/status-display.md)
  says how each original game shows each status, with sources.
- **Today's gap:** [`CURRENT.md`](CURRENT.md) measures how we show statuses now.

## The staged moment (the same in every option)

| | FFX (Chapter I, Seymour Flux) | FFX-2 (Chapter IV, Bahamut) |
|---|---|---|
| Party | Kimahri: Zombie, Poison, Protect; HP set to 840. Yuna: Slow | Rikku: Poison, Silence. Paine: Haste (and the Curse the chapter starts her with). Yuna: Sleep |
| Enemy | Seymour Flux: Shell, Reflect | Bahamut: Doom, count 3 |
| What the player is doing | Tidus aims a **Hi-Potion at Kimahri**, reached with the real keys (Items, Hi-Potion, down to Kimahri). This is the moment that went wrong in Bailey's friend's game | Yuna has just acted; Paine aims **Attack at Bahamut** |

The statuses were written into the live engine state of a production build of
`origin/main` 1c313c17, and the HUD was redrawn with the presenter's own
`syncHud`. Kimahri's 840 HP and Bahamut's Doom are staged for the picture; so
is FFX-2 Doom on a boss. Each option frame starts from the same "base" frame:
today's status marks hidden, plus two on-model looks made with the actor's own
shader controls. Kimahri gets a green tint and glow for Zombie, and Paine gets
a darker body for FFX-2 Curse. Everything else (smoke, bubbles, Z's, the
speech bubble, icons, warnings) is drawn fresh in SVG and CSS. No retail
icon, frame or model appears anywhere (rule 8). The first-time coach card and
the guide and move cards (the G and N keys) are hidden, so the status display
is what you see.

## The three options

Each option includes the one before it.

### O1 "As the originals"

- **What it is.** Each game's own way of showing a status, drawn into our
  painted battle and nothing more. Statuses sit on the figure: Zombie gives a
  green, glowing body with black smoke around the head. Poison puts green
  bubbles above the head, Sleep puts Z's, and FFX-2 Silence puts a speech
  bubble with an ellipsis. FFX-2 Curse darkens the figure, and Haste turns the
  FFX-2 gauge red (we already do that). FFX-2's help line lists the targeted
  unit's status icons ("Bahamut" plus a Doom icon on the top bar; on the
  phone, in the target card). The HP windows carry **no standing status
  icons**, because neither original has them. That removes today's FFX blue
  squares, which say nothing, and **also today's FFX-2 text chips** (PSN,
  SIL...), which are the one display that reads at a glance today.
- **How faithful.**
  - FFX: as faithful as the sources allow. Research §2 covers Zombie ("a
    glowing green body and black smoke clouds around their heads", verified
    by two sources), Poison's bubbles (two sources) and FFX's lack of standing
    icons (one Steam community source).
  - FFX-2: Poison's bubbles (two sources) and Sleep's Z's (two sources) are
    covered. The Silence bubble, the darkened Curse model and the help-line
    icons each have one source.
  - Where a look exists in the original but no source describes it, O1 draws
    **nothing**, and those statuses stay invisible. That covers FFX Slow,
    Haste, Shell, Reflect, Regen, Silence and Darkness; FFX-2 Doom's count
    over the head; and the Sleep hunch, which needs a new painting. In the
    FFX mockup, Seymour Flux's Shell and Reflect show nowhere, and Yuna's
    Slow shows only in the turn order.
- **What it costs.**
  - The biggest new piece is a persistent on-figure status layer (tint, glow
    and particles per status, started and stopped by the status events the
    presenter already receives), for both games.
  - FFX-2's help-line icons and the white status bar shown while aiming a
    status spell.
  - Doom's FFX number goes from white to red.
  - Optional new art: the Sleep hunch and the Critical slouch or kneel are
    poses, and we have no paintings for them.
  - This touches the presenter and stage, so it needs a focused review before
    it ships and a deep review afterwards.

### O2 "Originals + at a glance"

- **What it is.** O1, plus a crisp icon row on every HP plate and for every
  enemy.
  - **FFX:** round medallions right-aligned under the Overdrive gauge, the
    only empty band on the plate. For enemies, the same medallions go beside
    their names in the turn list. That is where FFX's enemy statuses live
    today, as dots the portraits cover. The Sensor panel carries the same row
    while it is open.
  - **FFX-2:** square tags in place of today's text chips. Up to five fit,
    with no clipping, and on the phone they sit as tabs above each card. The
    boss panel gets a STATUS tab, where Doom shows its count, 3.
  - **Colours:** a **red rim means the status hurts the unit that has it; a
    teal rim means it helps**.
- **How faithful.** FFX never shows standing icons, so for FFX this is a
  deliberate addition. The icons are our own glyphs, keyed to FFX's on-figure
  cues (bubbles, smoke, an hourglass for Slow, a shield for Protect). FFX-2
  has an icon for every status (research §3, one source: the wiki carries an
  icon file per status). It shows them in the help line and in the white bar,
  but not standing on the plate. So this puts FFX-2's own icon idea in a
  second place, drawn fresh. The on-figure layer is the same as O1.
- **What it costs.** O1 plus about 20 small SVG glyphs (FFX and FFX-2 sets),
  the plate and turn-list rows for desktop and phone, and a boss status tab.
  The FFX-2 chip code (`src/ui/ffx2/statusChips.ts`) is replaced, not added
  to. This is HUD work: small to medium, with no engine changes.

### O3 "Originals + guard rails"

- **What it is.** O2, plus warnings where a status changes what an action
  does, and a one-line battle message when a status lands or wears off.
  - **FFX:** aiming a Hi-Potion at the Zombie Kimahri puts a red **ZOMBIE**
    tag on the target plate and a red forecast over him: "−1000 KO". The item
    row gets a "HURTS" mark, and the help line turns into a red warning. The
    guide explains: healing hurts a Zombie, a Phoenix Down would KO him
    outright, and Holy Water or a Remedy cures it (Esuna does not).
  - **FFX-2:** a DOOM 3 tag on the target plate, and "ASLEEP" on Yuna's
    plate. The guide explains that her gauge is frozen and that a hit, Esuna
    or a Remedy wakes her, and that Echo Screen cures Rikku's Silence.
  - **Message line:** "Kimahri became a Zombie." / "Yuna fell asleep." The
    mockup holds it on screen; in play it would show for about two seconds.
- **How faithful.** None of this is in either original. Every rule the
  warnings state is sourced:
  - A Hi-Potion on a Zombie deals exactly 1000
    (`research/ffx-combat-core.md`, the Hi-Potion note).
  - Phoenix Down kills a Zombie, Holy Water and Remedy cure it, and Esuna
    does not (the same file, §4 Zombie and the cure table; verified by two
    sources).
  - FFX-2 Sleep freezes the gauge and a hit wakes the sleeper; Esuna and
    Remedy cure it; Echo Screen cures Silence (`research/ffx2-combat-core.md`,
    the status and cure tables).
  - A status whose effect on an action has no source gets no warning.
- **What it costs.** O2, plus a forecast that knows each status's rule. The
  heal-sign flip for Zombie is engine logic, and the Hi-Potion fix on branch
  `fb-0929-hipotion` is working in the same area, so O3 should build on that
  branch once it lands. Also needed: the warning text per status, the message
  line, and the guide entries. The forecast reads the engine, so it needs a
  focused review before it ships and a deep review afterwards.

## Recommendation (the agents' view, not Bailey's)

**O3**, with O1's on-figure layer as the part that must be right whatever
Bailey picks.

- Bailey asked for the originals' way first, and O1 is that. It is what
  would have made Kimahri look like a Zombie at all.
- Bailey's friend's Hi-Potion shows that a player who has not memorised FFX's
  rules can still be caught by one.
- O2's icons fix today's worst measured gaps: FFX statuses invisible on the
  plates, boss statuses invisible in both games, and FFX-2 chips clipped.
- O3's warnings stop exactly the mistake that started this round.
- Neither O2 nor O3 hides or changes anything the originals show.

If Bailey wants the originals' purity for FFX, one mix is **O1 for FFX and
O2 or O3 for FFX-2**, since FFX-2 already uses icons.

Whether O2 and O3 could be switched off in OPTIONS is a new setting. It
needs Bailey's yes first (rule 10) and is not assumed here.

## Which statuses each option covers

"On the figure" means drawn on or over the painted model. "Icon" means a
standing icon on the plate, turn list or boss panel. "Guard rail" means a
warning when an action's result changes. Rows marked *no source* have a look
in the original that no source we could read describes; O1 draws nothing for
them until someone checks them in the Steam copy.

| Status | O1 FFX | O1 FFX-2 | O2 adds | O3 adds |
|---|---|---|---|---|
| Zombie | green glowing body, black smoke | (not an FFX-2 status) | icon | heal = damage forecast; Phoenix Down KOs; cure hint |
| Poison | green bubbles | green bubbles | icon | message line |
| Sleep | Z's (hunch needs art) | Z's (hunch needs art) | icon | "can't act, a hit wakes" |
| Silence | *no source* (party is silent in battle) | ellipsis speech bubble | icon | "magic sealed" plus the Echo Screen cure hint (both games) |
| Darkness | *no source* | black cloud on the head | icon | — (not sourced for an action forecast here) |
| Confuse | two spinning stars | two spinning stars | icon | message line |
| Berserk | red hue | *no source* | icon | message line |
| Curse | murky brown hue; Overdrive gauge stops | darkened model; Change blocked (already shown as CURSED) | icon | cure hint |
| Doom | red count over the head (ours is white now) | icon in the help line; count placement *no source* | icon with count | count on the target tag |
| Slow / Haste | turn order only | gold / red ATB gauge (red is ours already) | icon | message line |
| Stop | (not an FFX status) | frozen figure; gauge gray or white (sources conflict) | icon | message line |
| Protect | blue shield when a physical hit lands | blue shield when a physical hit lands | icon | — |
| Shell / Regen | *no source* | icon in the help line | icon | — |
| Reflect | *no source* | blue shield when a spell bounces | icon | "a single-target spell will bounce" (both games' mechanics are sourced) |
| Auto-Life | halo | halo | icon | message line |
| Nul-element | circling red / white / yellow / blue orb | (not FFX-2) | icon | — |
| Petrify | stone (ours already) | gray stone (ours already) | icon | "a physical hit shatters" |
| Critical | yellow HP (ours already); slouch needs art | yellow HP (ours already); kneel needs art | — | — |
| Breaks, Provoke, Threaten, Guard, Sentinel | *no source* (Sentinel: a defensive stance) | (not FFX-2) | icon | — |
| FFX-2 stat Up / Down | (not FFX) | icon only; no figure change (sourced) | icon with stacks | — |
| Pointless, Itchy, Spellspring | (not FFX) | icon; Pointless flashes slowly | icon | — |

The mockups draw only the staged statuses. The table is the scope each option
would build.

## Files

| Path | What |
|---|---|
| `options/o1-ffx-desktop.jpg` ... `o3-x2-phone.jpg` | the 12 option frames (3 options x 2 games x 2 sizes) |
| `options/o*-*-plates.jpg`, `options/today-*-plates.jpg` | HP plate close-ups (phone crops at 2x) |
| `options/frames/*-today.jpg` | today's frame at the same moment, statuses injected |
| `options/frames/*-base.jpg`, `*.json` | the base frame each overlay is drawn on, and the screen rectangles used to place it |
| `options/src/gen.mjs`, `render.mjs`, `o*.html` | the overlay pages and the scripts that make and shoot them |
| `options/src/capture.mjs` | the frame capture (headless, real GPU, against `vite preview` of a production build) |
| `index.html`, `files.json` | the side-by-side page, and every image it references |

To remake the images: build origin/main into a scratch `dist`, then run
`vite preview --base /pyrefly-reprise/ --port 8221`. Next run
`node capture.mjs ffx 1600x900` (and the other three game and size pairs),
copy the four frame sets into `options/frames/`, and finish with
`node gen.mjs && node render.mjs`.

## Open questions for Bailey

1. Which option, or which mix per game (for example O1 for FFX and O3 for
   FFX-2)?
2. O1 removes today's FFX-2 text chips, because the original has no standing
   icons. Is that acceptable if you pick O1 alone?
3. The Sleep hunch and the Critical slouch or kneel need new paintings.
   Should they be in scope?
4. Can the agents take over your screen to look up the undescribed FFX looks
   (Slow, Haste, Shell, Reflect, Regen, Silence, Darkness) and FFX-2's Stop
   gauge colour in the Steam copy? Each one then gets a sourced O1 look.
