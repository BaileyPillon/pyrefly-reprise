# Round 2 — CTB portraits and Sensor chips

**Key:** `ctb-portraits`. Owns `src/ui/ffx/CtbList.ts`, `src/ui/ffx/portraits.ts`,
`src/ui/common/portrait.ts` (crop helper only), `src/ui/ffx/SensorPanel.ts`,
`src/ui/ffx/ffx-hud.css` (CTB tile and sensor rules only).

Fixes **issue 4** (CTB list shows single-letter tiles instead of portraits) and
**issue 10** (Sensor panel shows bare element labels) of
`docs/handoff/playability-round-1.md`.

Nothing outside those five files changed. `public/art/**` was only read, never
written.

---

## 1. Issue 4 — CTB portraits

### 1.1 Why enemies never had one

`portraitChipHtml(row.portraitKey, ...)` already had a working
portrait-then-monogram fallback (`portraits.ts`), and party rows use it fine —
`TurnPreview.portraitKey` is copied straight from `FFXCombatant.portraitKey`
(`turnQueue.ts:268`), which party builds set. The bug was upstream of the
renderer: **`EnemyDef` has no `portraitKey` field at all** (`types.ts:2381`),
and `enemyToCombatant` (`setup.ts:142`) never invents one. Every enemy
`TurnPreview` row hit `portraitChipHtml(undefined, ...)`, which returns the
monogram immediately — hence the single letters the report saw, and why the
letter tag (`A`/`B`, drawn correctly per the visual bible) was the *only*
identity on an enemy tile.

That field doesn't exist for a reason worth respecting rather than routing
around: it's `EnemyDef`, owned by the data/engine layer, not mine to touch in
this round. So the fix is entirely on the renderer's side of that boundary —
`CtbList.ts` now resolves an identity for the tile from data it already has
(`row.actorId`, `combatants[row.actorId]`), the same shape of fix the file's
existing `letterTagFor`/name-fallback logic already uses.

### 1.2 The three-layer chip

`portraitChipHtml` (in `portraits.ts`) now builds three stacked layers, each
one's `onerror` revealing the layer painted behind it:

1. an ink monogram (unchanged) — the chip is never blank;
2. **new** — if a `bodyId` is passed, a generic top-center crop of
   `characters/<bodyId>/idle.png` (that combatant's own battle-sprite
   painting), for a boss with no dedicated portrait;
3. `portraits/<portraitKey>.png`, unchanged, the real thing when it exists.

`bodyId` defaults to `undefined`, so every existing caller (`PartyStatusWindow`,
`TriggerPrompt`, and the party branch of `CtbList` itself) gets exactly
today's two-layer output — no extra request, no behaviour change for anyone I
don't own. Only `CtbList`'s enemy branch passes it.

Enemies need three different ids reconciled, not one:

| id | example | where it comes from |
|---|---|---|
| fight id (`TurnPreview.actorId`) | `seymour-flux`, `yunalesca` | the combatant itself |
| dedicated-portrait key | `seymour`, `yunalesca` | `resolvePortraitKey()` — a one-entry alias map for the single mismatch (Seymour Flux fights as `seymour-flux`, portrait is `seymour.png`; Yunalesca's fight id is already `yunalesca` across all three forms, no alias needed) |
| idle-painting id | `seymour-flux-body`, `yunalesca-1`/`-2`/`-3` | `combatant.spriteKey` — a multi-form boss's idle art is keyed by form, not by its one shared fight id |

`CtbList.rowHtml` for an enemy row:

```ts
portraitChipHtml(
  row.portraitKey ?? resolvePortraitKey(row.actorId),   // layer 3
  name,
  tintFor(side),
  combatant?.spriteKey ?? row.actorId,                  // layer 2
)
```

`row.portraitKey ??` is there so a future data change that *does* add a real
`portraitKey` to `EnemyDef` is honoured for free.

### 1.3 The generic idle-painting crop

A full-body character painting (`characters/<id>/idle.png`) has no eye-line
measurement the way the party's `CROPS` table does (`portrait.ts`) — that
table is hand-calibrated per file and doing the same for every boss art asset
was out of scope for a MEDIUM ticket. Instead `portrait.ts` gained
`bodyHeadCropStyle(aspect?, opts?)`, which reuses `faceImgHtml`'s existing
inline-position math (pulled out into a shared `cropStyle()` helper) with one
fixed, `[estimate]` crop (`fx 0.5, fy 0.15, ipd 0.16`) tuned by eye against
`mortiorchis`, `seymour-flux` and `vegnagun-body` — these renders are
generated "full body ... centered, straight-on" per their own sidecar
`prompt` field, so the head sits in a predictable top-center band regardless
of the creature.

`aspect` defaults to the pipeline's common 1216x832 canvas, then
`portraits.ts`'s `wirePortraitFallbacks` narrows it per file: it fetches
`characters/<id>/idle.json` (cached per id) once the chip is in the DOM and,
if that sidecar's own width/height differ, rewrites the `<img>`'s inline
style to the real aspect ratio. Wrong-but-plausible now, exactly right a
moment later — the same pattern `PaintedArt.ts` uses for the 3D scene's
painted planes, applied to this 2D chip.

### 1.4 Verified

Chapter 1 battle-open (`seymour-flux`), captured on the dev server (port
5244), `docs/screenshots/r2-ctb-portraits/battle-open-ch1.png` and
`ctb-zoom.png`: Tidus, Kimahri and Yuna show their measured `CROPS` portraits;
**Seymour Flux** (both CTB rows, present and future turn) resolves through
`PORTRAIT_ALIAS` to `portraits/seymour.png`; **Mortiorchis**, which has no
dedicated portrait, correctly falls through to a crop of
`characters/mortiorchis/idle.png`. All five tiles still carry their
party/enemy border colour and (for enemies) the `A`/`B` letter tag in the
corner, per the visual bible — portraits are additive, not a replacement for
the letter tag.

Rendered DOM for the Mortiorchis row confirms the fallback chain end to end:

```html
<span class="ig-ctb__tile ig-ctb__tile--enemy">
  <span class="ffx-portrait-fallback" style="background:#2a0f12">M</span>
  <img src="/art/characters/mortiorchis/idle.png" data-role="portrait-img"
       data-body-id="mortiorchis"
       style="position:absolute;left:-43.75%;top:22.74%;width:187.5%;...">
  <span class="ig-ctb__tag">B</span>
</span>
```

(No `portraits/mortiorchis.png` `<img>` at all — `!portraitKey` after
`resolvePortraitKey('mortiorchis')` still resolves to `'mortiorchis'`, so that
layer *is* attempted and 404s in the network tab; it just isn't in this DOM
dump because `wirePortraitFallbacks` already removed it by the time I read
the tree back.)

---

## 2. Issue 10 — Sensor chips

The panel already read live affinity data and rendered per-state text
(WEAK/RES/NULL/ABS) — that part of the report predates the current code. What
was still missing, and what the report's "no icons" line is about, is that a
**neutral** element (the common case) rendered nothing but its own bare label,
and no chip carried any colour cue for which of the six elements it even was
without reading the text.

`SensorPanel.ts` now gives every chip, in every state:

* an element glyph — a small solid diamond in `ELEMENT_COLOR[el]`
  (`research/visual-bible.md` §3.3's magic-list chip hexes: Fire `#F2712E`,
  Ice `#6EC8F0`, Thunder `#F2D24A`, Water `#3A8FD0`, Holy `#FFF2C0`; Gravity
  isn't a castable spell there, so its colour is `[estimate]`, a cool
  desaturated violet chosen not to fight the five verified ones);
* for a non-neutral affinity, the visual bible's own state colour
  (§3.5/§4.11: WEAK `#F2C21E`, RES `#6C7B90`, NULL `#4E86C8`, ABS `#7EE8B0`)
  on both the text and a 25%-alpha chip background, so a weakness — or a
  resist or immunity — is "findable without reading," per §4.11's own words
  for the X-2 equivalent panel.

This intentionally drops the file's previous "gold marks weakness, everything
else stays neutral" stance (the old comment is gone; `AFFINITY_COLOR`'s doc
comment explains why) — distinguishing all four states, not only weaknesses,
is what the ticket and the bible both ask for, and a neutral chip is still
visually quiet (dim label, no background tint), so Ink & Gold's one-accent
rule still holds for the common case.

Verified on Mortiorchis's chip row (`docs/screenshots/r2-ctb-portraits/`,
`battle-open-ch1.png`/`sensor-zoom.png`): all six chips now show a coloured
diamond plus label even with every affinity neutral, where before they were
blank text on a flat dark background.

---

## 3. Files

* `src/ui/ffx/CtbList.ts` — resolve an enemy portrait/body id and pass both
  through to `portraitChipHtml`.
* `src/ui/ffx/portraits.ts` — `resolvePortraitKey`, the third (`bodyId`) chip
  layer, and the async sidecar-aspect refinement in `wirePortraitFallbacks`.
* `src/ui/common/portrait.ts` — `cropStyle` pulled out of `faceImgHtml`;
  `bodyHeadCropStyle` added (crop math only, no DOM).
* `src/ui/ffx/SensorPanel.ts` — `ELEMENT_COLOR`, `AFFINITY_COLOR`,
  `AFFINITY_BG`; chips now render an icon and (for a real affinity) inline
  colour.
* `src/ui/ffx/ffx-hud.css` — `.ffx-sensor__chip-icon`; dropped the now-dead
  `--weak`/`--res`/`--null`/`--abs` colour rules (colour is inline per chip
  now; the classes stay as query hooks).
* Screenshots: `docs/screenshots/r2-ctb-portraits/` (`battle-open-ch1.png`,
  `ctb-zoom.png`, `sensor-zoom.png`), captured against the dev server on port
  5244, chapter `seymour-flux`, via a scratch Playwright script (not
  committed — same throwaway pattern as `critic/scratch/`).

## 4. Verification

* `npx tsc --noEmit` — clean.
* `npx vitest run` — full suite, see the orchestrator-facing summary for the
  pass count; no test in the repo touches `CtbList`, `SensorPanel` or
  `portraits.ts`/`portrait.ts` by name, so this run is a regression check,
  not new coverage. Consider that a gap, not a pass: these five files had no
  unit tests before this round and still have none — they're `innerHTML`
  string builders with no DOM assertions anywhere in `tests/unit/`.
* Manual: chapter 1 (`seymour-flux`) battle-open, dev server, screenshots
  above.

### 4.1 Final re-check (this pass)

Re-ran the whole verification cold, since this round's work had been
committed (`aaf8362`, "round 2 partial ... before deploy") with three of the
five owned files still uncommitted in the tree:

* `npx tsc --noEmit` — clean.
* `npx vitest run` — **2,714 passed, 1 failed, 80 files.** The one failure is
  `tests/unit/strategy-ffx2-vegnagun-shuyin.test.ts` > "wins the great
  majority of forty contiguous chains", which **times out at 15 s** rather
  than asserting wrong — reproduces in isolation too. That file is
  `src/battle/ffx2` strategy-simulation territory (Chapter 5's Darkness/HP-cost
  chain math), not one of this round's five owned files, and nothing here
  touches `battle/`, `data/ffx2/**` or the RNG/seed path it depends on. Flagged
  for whoever owns that suite; not fixed here.
* Manual: re-drove the live dev server on port 5244 with
  `window.__pyrefly.gotoChapter('seymour-flux', { skipCutscenes: true, auto:
  'off' })` and confirmed the CTB list still shows painted portraits for
  Tidus/Yuna/Kimahri, the `PORTRAIT_ALIAS` resolve for Seymour Flux, and the
  idle-painting crop fallback for Mortiorchis (still tagged `B`/`A` in the
  corner); the Sensor panel still shows all six coloured element diamonds.
  Tried a second chapter (`ffx2-vegnagun-shuyin`) to see a non-neutral
  affinity chip (`gravity: 'immune'` on Bahamut/Shuyin/Vegnagun) render as
  `NULL`, but FFX-2 battles use `FFX2BattleHud`, not this round's
  `CtbList`/`SensorPanel` — confirmed by code shape only
  (`AFFINITY_COLOR.immune` / `'NULL'` label in `SensorPanel.ts`), not by a
  live capture.
