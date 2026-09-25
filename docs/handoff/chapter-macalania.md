# Chapter 7 — Seymour and Anima, Macalania Temple: integrator's handoff

> **Integrator pass, 2026-09-22 (workflow `wf_552781c6-d19`, Opus).**
> **Game case: FFX only** [AGENTS.md rule 14]: an FFX encounter with an FFX
> party (`research/ffx-seymour-anima-macalania.md`). The one shared-plumbing
> change (`romanNumeral`, below) is **both**. No boss number changed.
>
> This track wires the five standalone Macalania tracks together, the way
> `c473de8` wired Leblanc: engine and data (`074a198`,
> `chapter-macalania-engine.md`), story script (`chapter-macalania-script.md`),
> guide, tactic and meta (`27ed39e`, `chapter-macalania-guide.md`) and the
> scene with Anima's arrival (`823450d`, `chapter-macalania-scene.md`).

## Ship layer and unlock readiness, 2026-09-25 (branch chapter-macalania-ship-0925)

**Game case: FFX only** [AGENTS.md rule 14]: Chapter VII's own record, meta, script, tactic and
paperwork. No shared file changed, and no boss number changed.

**Where it stands.** Everything that needs no pick from Bailey is built. The chapter stays locked
behind **one line**, `'seymour-anima-macalania'` in `LOCKED_CHAPTER_IDS`
(`src/app/screens/frontend/comingChapters.ts`). The driver deletes that line after Bailey's two
picks land. `src/data/chapter-macalania-ship.ts` lists the two picks, where their candidates are
and where each one lands in code. `tests/unit/chapters/macalania-ship.test.ts` pins that list, so a
half-switched unlock fails a test.

| Open pick (Bailey only) | Candidates | Lands |
|---|---|---|
| Pause plate redo (D-141 excepted it) | `docs/concepts/chapters/macalania/unlock/pause-plate-redo.jpg`: current, A (judged 7), **A2** (A plus the judge's two notes, hair colour and veins, by pixel edits; **not judged yet**, recommended if it passes), B (6), C (6). Each has a real pause capture | installed over `public/art/pause/macalania.*` in place, so `heroArt` does not change; then the lock in `approved-hashes.json` |
| Scene cue `scene-macalania-temple` (preflight §6.3; by ear, rule 13) | three sketches in `docs/audio/audition.html` (section `macalania-scene`, lines 80 to 146): A "The Frozen Temple", B "The Wedding Proposal", C "Crystal and Pyreflies", files in `docs/audio/sketches/2026-09-24/` | the picked sketch is composed and registered as a track, then `MACALANIA_SCENE_CUE` names it. The record's `music.scene`, the pre-battle `music()` step and the meta's `musicKeys` all read that one constant |

Neither pick blocks the unlock technically: the stand-in plate and the stand-in cue (Chapter I's
`scene-gagazet`) both work today.

**Built in this pass:**

- `src/data/chapter-macalania-ship.ts`: the scene cue as one constant (`MACALANIA_SCENE_CUE`, the
  stand-in until the pick is registered) and `MACALANIA_OPEN_PICKS`.
- The pause fallback (`heroArtFallback`) is now the approved Chapter VII speaker portrait,
  `portraits/seymour-macalania.png` (D-065), not the Flux-era face.
- Anima's approved folder is locked as `chapter:macalania-anima:2026-09-25` in
  `docs/target/approved-hashes.json` (D-108, D-141 said the hash was owed, D-150). Nothing was
  rendered or replaced. The ko painting (judged 5) is locked with the rest; D-141 did not except it,
  and it is flagged for Bailey on `unlock/README.md`.
- Option A2 for the pause plate and its real pause capture (`unlock/img/redo-a2*.{jpg,png}`,
  `unlock/img/redo-pause-a2.jpg`), and the re-rendered options sheet.
- **The intended line cures Confusion** (tactic rule 1b, `src/engine/tactics/seymour-anima-macalania.ts`).
  The Guardians' Shremedy confuses at 50% (research §2.3), and the line had no answer, so a confused
  Tidus attacked the party. It now uses a Remedy or Esuna (§8.7, §8.9, §10 lesson 8). Intended
  168/200 -> 189/200, advisor 161 -> 192 (`docs/plans/macalania-bench.md`). Player side only.
- The 200-seed bench (`tests/unit/chapters/macalania-bench.test.ts`) and its write-up.

### Unlock rehearsal (real keys, the lock removed in the page only)

`docs/concepts/chapters/macalania/unlock/rehearsal/rehearse.mjs` answers the dev server's
`comingChapters.ts` with the lock line removed (a Playwright route), which is exactly the driver's
one-line unlock, and plays from the title with real keys. Nothing on disk changes. Own Vite on port
5700 (`--strictPort`, HMR and the watcher off through a scratch config), `PYREFLY_BROWSER=gpu`
(ANGLE on the RTX 5070 Ti, D3D11); the server was stopped by its PID afterwards.

| Run | Result |
|---|---|
| 1600x900, `win` | title, briefing, chapter select (VII between III and VIII, the arrows reach it), party prep, the pre-battle scene (30 lines), the battle (Anima's arrival, Seymour's dismissal, Seymour down, 49 turns), results (Victory, NEW BEST), the aftermath (19 lines), the board with VII **cleared**, and after a reload VII still cleared. 0 console errors, 0 HTTP errors |
| 390x844, `phone` | the same flow to the board with VII cleared. 0 console errors, 0 HTTP errors. Battle-HUD text at 14 px or more in every menu, submenu and target step sampled, except the four 9 px reserve-member letters in the Switch submenu (below) |
| 1600x900, `pause` | the pause CHAPTER tab with A2 answered in the page only (`unlock/img/redo-pause-a2.jpg`) |

Frames and logs: `unlock/rehearsal/`. Music heard in order: title, chapter-select, `scene-gagazet`
(prep and pre-battle scene, the stand-in), `boss-seymour-macalania`, `victory-ffx`.

### Seen in the rehearsal, not fixed (for the driver)

1. **Phone: Anima's arrival is off the frame.** At 390x844 the phone field shows the party while
   Anima rises (`rehearsal/phone-390x844-07-anima-landed.jpg`), and at the first menu Seymour and
   one Guardian are off the right edge (`phone-390x844-04-first-menu.jpg`). `phoneFraming.ts` slides
   the canvas only when a command menu is up, so a mid-battle arrival keeps the last slide. That
   file is shared (both games), so a fix belongs to the phone HUD track, with options first
   (rule 9). The approved arrival (D-033) reads fully at 1600x900.
2. **Phone: the results screen is the desktop layout scaled down** (text 5 to 9 px,
   `phone-390x844-10-results.jpg`). This is shared, not Chapter VII's; 8bee6347 already lists it
   as open.
3. **Phone: the Switch submenu's reserve-member letters are 9 px** (`ffx-portrait-fallback`; W, A,
   L, K). This is FFX-wide, not Chapter VII's.
4. **Chapter select, BOSS line:** "Guado Guardian A + Seymour + Guado Guardian B"
   (`bossNames` joins the first formation's names by design), so Anima, the chapter's title boss,
   is not named. Changing it means a per-chapter field on a shared screen: polish, for the driver.

## Repair pass, 2026-09-25 (the verifier's two refuted items)

**Game case.** The Sensor release is the FFX HUD's (every FFX chapter; FFX-2's
boss strip already drops a departed enemy). The flat lie, the runtime body
shot (`CameraPort.addRig`) and `TargetFrameHold`'s forwarding are presenter
plumbing, **both**, used only by Seymour's `'body'` departure. The victory rig
is **FFX only** (Macalania). No boss number changed; whether a petrified
Guardian shatters is untouched (still open with Bailey).

| Refuted | Root cause | Fix | Test |
|---|---|---|---|
| (1) "I EVRAE" stayed over empty sky for 3.5 s after Evrae fell | `release` ran only on a full HUD `sync`, and the last enemy's departure plays with no sync before the result | `FFXBattleHud.syncVitals` (the per-event projection) also calls `SensorPanel.release`, so the plate goes at the blow; `release` also treats `statuses.eject` as gone (a shatter reaches the projection as `status-add eject` before `removed` is synced) | `ch7-hud-fixes.test.ts`: KO and eject released from projected vitals alone; a non-lethal hit keeps it |
| (2) Seymour's body a plane 32.7 degrees off the floor | `LIE_TILT` 1.0 rad | `LIE_FLAT_TILT` = pi/2 (flat, face up) and `LIE_CLEARANCE` 0.03 over the floor (`LieFlat.ts`) | `ch7-presentation-fixes.test.ts`: every corner at one height, normal straight up, middle at the station |
| (2) the hold hid his head behind the party panel at 1280x960 | the hold kept the killing blow's near-level `enemy` framing | the body beat registers `BODY_SHOT` around where he actually lies (the field's relaxation moves his station per viewport, so no fixed rig can) and moves there under the roll: about 25 degrees down, body left of centre between the guide and the party panel | projection test at 16:9, 4:3, 21:9 for three measured stations; a camera without `addRig` keeps the old framing |
| (2) victory shot: body at the right edge behind the turn list | the party close-up `victory` rig | Macalania's `victory` rig widened to hold the party and the body behind them, clear of the turn list and party panel | projection test at 16:9 and 4:3 for four stations |

**Verified with real keys** (own Vite :5612, HMR and watcher off,
`PYREFLY_BROWSER=gpu` on the RTX 5070 Ti, seed 1, reached by `gotoChapter`
from a fresh title; harness `tools/zz-ch7-repair.tmp.mjs`, not committed;
server stopped by PID): two Chapter VII wins, 1600x900 and 1280x960, 0 console
errors, 0 HTTP errors. Seymour is flat (all four content corners at y 0.03)
from ~0.3-0.5 s after his KO; the camera is on `body` for the whole hold, then
`victory`, with him still down until the aftermath scene at ~3.0 s. The only
Anima art requested is `anima/idle.png`/`.json`; banners unchanged ("Seymour |
summons Anima", "Guado Guardian A | shatters"). Chapter VIII real-key win
(`tools/zz-evrae-e2e.tmp.mjs`, 1600x900, 0 errors): "I EVRAE" is up at the
last blow and gone by the time Evrae has fallen. Frames:
`docs/screenshots/ch7-fixes/1b-*` and `2r-*`.

**For Bailey.** The widened Macalania victory shot and the top-down body shot
are agent choices on something Bailey sees, made to answer the verifier; they
were not shown as options (AGENTS.md rule 9). Each is one constant
(`RIGS.victory` in `macalania-temple.ts`, `BODY_SHOT` in
`BattlePresenterDepartures.ts`). The party reads smaller in the new victory
shot than in the old close-up.

## Fix pass 2, 2026-09-24 (the real-key e2e on 06338dbc)

**Game case.** The chapter tables are **FFX only** (Seymour's body hold,
Anima's idle-only limit). The rest is shared plumbing and says so: the Sensor
chip release and the banner speaker are the FFX HUD's (every FFX chapter); the
lie geometry, the stone beats and shards, the advisor's damage wording and the
theft rule are **both**. Whether a petrified Guardian shatters is unchanged
(the question is open with Bailey, `unlock/petrify-shatter.jpg`); no boss
number changed.

| e2e finding | Root cause, proven by running | Fix | Test |
|---|---|---|---|
| "I GUADO GUARDIAN B" chip stays after both Guardians left | `SensorPanel` was only hidden on a battle result | `SensorPanel.release(combatants)` on every HUD `sync`: a subject that is dead, removed or hidden takes its plate and chip with it (what Sensor read stays known) | `ch7-hud-fixes.test.ts` (1) |
| Seymour's body lasts ~1.5 s and lies tilted off the floor | `LIE_ANGLE` 1.5 rad left the head end raised; the roll about the feet laid him a half body-length off his station; posture lean/crouch/breath/yaw still applied to the rolled plane; the beat was 620 ms then the 900 ms victory | a flat quarter turn resting on the floor over his station (`src/engine/LieFlat.ts`, pure), a rolled body counts as down in `PaintedActor.update`, and `BODY_HOLD_MS` 1,400 holds the shot on him before the victory; he is never lifted again | `ch7-presentation-fixes.test.ts` (2) |
| Anima draws her attack, hurt and ko paintings | the boss borrows the aeon's whole folder (`spriteKey: 'anima'`) | `src/engine/ChapterPoseLimits.ts`: `anima-macalania` draws the idle only (D-045 option A); the other PNGs are never fetched; the party's summoned Anima elsewhere is untouched | same file (3) |
| "Rikku · Seymour summons Anima" | the banner named `currentActorId` whatever the text | `src/ui/ffx/bannerSpeaker.ts`: a message that opens with a combatant's name is that combatant's line; an enemy telegraph naming nobody names nobody | `ch7-hud-fixes.test.ts` (4) |
| Advisor: Petrify Grenade "4000 damage", and it disagrees with the guide's Steal on turn 1 | (a) `damageToEnemies` is HP lost, and a shatter loses 4,000 with no `damage` event; (b) a landed Steal changes only inventory/flags, so the no-op guard dropped the chapter line behind the grenade | (a) `dealtToEnemies` (damage events, capped by HP lost) for the chip and the sentence, plus a `removes` fact: "It puts Petrify on 2 of them, and 2 of them shatter"; (b) the guard reads the engine's own "Stole …" / "pilfered" line | `advisor-status-items.test.ts`; `advisor-sentence.test.ts` re-derives the new definition |
| The shatter barely reads as stone | a 220 ms status beat, then the green-edged pyrefly dissolve in grey | `PaintedActor.setStone` (desaturate + stone tint, separate from the targeting dim), the painting drains to stone over 280 ms and holds 340 ms (`STONE_MS`), then `vfx.play('stone-shatter')`: opaque stone chips that fall to its feet (`src/engine/StoneShards.ts`); a Soft restores the colour | `ch7-presentation-fixes.test.ts` (6) |

**Verified with real keys** (two full wins, own Vite :5611 with HMR and the
watcher off, `PYREFLY_BROWSER=gpu` on the RTX 5070 Ti, seed 1, chapter reached
with `gotoChapter` from a fresh title; scratch harness `tools/zz-ch7-fix.tmp.mjs`,
not committed; the server stopped by PID): turn 1 card and guide both
"Steal → Guado Guardian A" (GUIDE'S PICK); both Guardians grey to stone and
break into chips; the Sensor plate is hidden from the moment both have gone;
"Seymour · summons Anima" and "Seymour · dismisses Anima"; the only Anima art
requested is `anima/idle.png`; Seymour lies tipped back on the floor from
~0.5 s after his KO, still down in the victory shot, until the aftermath scene
takes the screen at ~3.1 s. 0 console errors, 0 HTTP errors. Frames:
`docs/screenshots/ch7-fixes/` (numbered by item).

**Still open.** (The tilted body was settled in the repair pass above.) The shot during Guardian B's shatter frames the party, so B's break happens at
the right edge or off frame (the camera's, not this pass's). The stone look was
built on the orchestrator's brief without an options round (AGENTS.md rule 9);
it is presentation only and sits behind `setStone` and `vfx 'stone-shatter'`.

**Other chapters, measured.** The advisor's text over chapters 1-8, seeds 1-3,
60 decisions each (1,026 cards), before and after: only Chapter VII's cards
changed (the nine Petrify Grenade / Steal rows above). Departure kinds are
unchanged; a party member petrified in Chapters 6 and 8 now greys and holds
the same beat (both games).

## Fix pass, 2026-09-22 (critic pass on 62b4927)

**Game case.** The chapter's own files are **FFX only**. Three fixes are shared
plumbing and so **both** [AGENTS.md rule 14, CHK-020]: the presenter's arrival
rule, the presenter's eject rule and the results layout. No boss number changed.
The paper preflight for the DEEP part is the addendum at the end of
`docs/plans/chapter-macalania-review.md` (written during this pass, dated so).

| Verifier finding | Root cause, proven by running | Fix | Test that failed first |
|---|---|---|---|
| **CRITICAL** Anima never appears in a real battle | `forms.ts#revealEnemy` emits `part-restored` for a combatant the stage never built (`flags.hidden` at start); the handler faded `stage.actor(id)`, which was `undefined`. Engine probe (seed 1): `message`, `part-restored`, then `script-trigger mac-anima-summon` | New optional `BattleStage.arrive` (`BattlePresenterPorts.ts`); `BattlePresenterArrivals.ts` holds an unstaged reveal until the next non-script event or the end of the burst, then `PaintedStage.arrive` stages her from the live state and plays the scene's `ArrivalDirector` (`StageArrivals.ts`; published by `buildMacalaniaTempleScene` as `arrivals`, carried on the three.js scene's `userData` so `BattleScreen.ts`, another agent's file, is untouched). The Macalania director (`src/scenes/macalania-temple-arrival-battle.ts`) drives the preview's own pure timeline: camera drop and rise, chains, floor occluder, crack light, Seymour stepping back and greying (tint, not `setDim`, which the targeting highlight owns), B's tags for 3.2 s. When she leaves (act three) the chains go and Seymour walks back into the light | `tests/unit/presenter-arrival-eject.test.ts` (4 arrival cases, 5 of 6 failed before) |
| **MAJOR** shattered Guardians stay standing | `hp.ts#ejectActor` emits `status-add eject`, never a `ko`; the presenter only flashed | `status-add eject` on an **enemy** dissolves it (stone grey after a petrify) and removes it; `petrify` flashes grey. A party Eject is unchanged (the engine does not refill the slot and what FFX draws is not sourced) | same file, the eject case |
| **MAJOR** Guardian attack/hurt face away; Seymour hurt turned away | `install.mjs` wrote `facing: 'left'` for every pose; three paintings face frame-right (looked at 1:1) | `picks.json` declares `facing: 'right'` for Guardian attack, Guardian hurt, Seymour hurt; `install.mjs` reads it; the three installed sidecars patched (public/art is local only; copies in `D:/Tools/pyrefly-art-backup/candidates/2026-09-22-macalania/facing-fix/`) | none possible in a unit test (which way a painting faces is read by eye); the browser crops are the proof |
| MINOR pause hero art wired to nothing | `heroArt` named an unrendered `pause/ch7-seymour-anima-macalania` | `heroArt: 'pause/macalania'` (the installed CANDIDATE plate) | `chapter-meta-seymour-anima-macalania.test.ts` "heroArt names the installed pause plate" |
| MINOR four drops overlap Tidus's row | two causes: one drop per enemy printed the same name three times, **and** a fourth member (a switch-in earns AP) lifts the bottom-anchored party list into the ledger | `dropsLabel` merges repeated items (`Ability Sphere ×3, Blk Magic Sphere`); a long ITEMS row steps down a size; `resultsDensity` (`src/ui/common/resultsLayout.ts`) compacts the ledger, then the member rows, until the two blocks clear (1 to 7 members). Both games | `ui-common-results.test.ts`: the merge case and three `resultsDensity` cases |
| MINOR four files over 400 lines, `api.ts` at 500 | | `macalania-rules.ts` 364 (+ `macalania-talk.ts`), the tactic 268 (+ `-helpers.ts`), the abilities 370 (+ `-anima-abilities.ts`), the build 310 (+ `macalania-bench.ts`), all re-exported so no import changed; `src/debug/api.ts` 467 (the seven scene debug screens moved to `src/debug/sceneScreens.ts`: **Evrae's scene screen registers there now**) | tsc + the chapter suites |

### How the fix pass was verified

- `npx tsc --noEmit` clean; the new and touched suites green; full `npm test`
  (numbers in the commit).
- `node tools/orphans.mjs`: none of the new modules is an orphan.
- **Real battle, GPU browser** (`PYREFLY_BROWSER=gpu`, own Vite on :5743, stopped
  by PID; scratch `tools/zz-macfix.tmp/`, not committed), seed 1, the intended
  line, normal speed around the summon: the two Guardians are petrified and
  leave the field on turn 18 (`staged()` loses both); Anima is staged the moment
  Yuna's line ends, rises through the floor with the chains, Seymour steps back,
  the tags land, the rail lists her first once the burst ends; in act three she
  and the chains are gone and Seymour is back in the light; results: ITEMS reads
  `Ability Sphere ×3, Blk Magic Sphere` and clears the four-member party list.
  0 console errors, 0 HTTP errors. Stills:
  `docs/screenshots/chapters/macalania-arrival-real.png` (four beats of the
  real-battle arrival), `macalania-facing-fixed.png` (Guardian B and Seymour,
  idle / attack / hurt at 1:1 in game), `macalania-results-fixed.png`.
- The results demo screens (`results-victory`, `results-ffx2`) keep their
  layout (`normal` / `compact` ledger over a `normal` list, 0 errors).

### Still open after the fix pass

1. **Seymour's attack pose** still blooms white in the hair and washes the face
   (the renderer's bloom on near-white paint; CANDIDATE art, needs a repaint or a
   darker hair pass, not a code fix). His hurt pose now faces the party but still
   reads as the head thrown back, which is what the pick was.
2. **"Cannot be targeted" is timed**, not persistent: the tags show for 3.2 s after
   they land; the persistent version belongs to the targeting HUD.
3. **Sizes.** In battle Anima is 1.2x the boss height with no hover (a labelled
   presentation estimate: at the preview's 3.6 she would be shorter than the
   stage's 4.1 Seymour). `fromSceneBuild` still hard-codes 1.82 / 4.1 (scene
   handoff §7.2).
4. **Leblanc has the same pause-art bug** (`heroArt: 'pause/ffx2-leblanc'`, the
   installed plate is `pause/leblanc.png`); not fixed here, the Leblanc data is
   another workflow's.
5. **Observations, pre-existing and shared, not fixed:** the title screen's DOM
   covers a battle reached by `gotoChapter` from a real-keys chapter select; the
   advisor card does not refresh under `autoBattle` (it still recommended
   Petrify Grenade after both Guardians had gone).
6. `docs/handoff/NOW.md` was not edited (not this brief's file).

## Status: registered, playable, LOCKED as Coming

`seymour-anima-macalania` is **Chapter 7** in `src/data/encounters.ts`
(display order after the six registered; the D-018 rule Leblanc's 6 used;
narratively it precedes Chapter 1). `window.__pyrefly.gotoChapter`, the flow,
party prep, the cutscene, the battle, the guide and tactic, the pause meta and
the results screen all reach it. **Chapter select shows it as a locked COMING
card**. (2026-09-22 reason: every painting was CANDIDATE. Today's reason: Bailey's two open
picks, the pause-plate redo and the scene cue; see "Ship layer and unlock readiness" above.)

### The one-line unlock

Delete this line from `LOCKED_CHAPTER_IDS` in
`src/app/screens/frontend/comingChapters.ts`:

```ts
  'seymour-anima-macalania',
```

The COMING row then drops off by itself (its id matches the real chapter) and
the playable card takes its place, with numeral VII and Seymour's painting as
its silhouette (`chapterGrid.ts` `SILHOUETTE_OVERRIDES`). A test pins both
states (`frontend-chapter-grid.test.ts`, "keeps a registered but LOCKED
chapter as its COMING card, and unlocks it with its one line"). Evrae can use
the same set.

## What this track changed

All additive; the contract entry is in `docs/CONTRACT-CHANGES.md`
("Chapter 7 registered, LOCKED", 2026-09-22).

1. **`src/data/encounters.ts`** (contract): `ChapterId` + `Chapter.number`
   widened, `SEYMOUR_ANIMA_MACALANIA` in `CHAPTERS`/`CHAPTER_IDS`. The record
   is in **`src/data/chapter-seymour-anima-macalania.ts`** (new) so the
   contract file stays under 400 lines. `sensorTexts` are copied from the
   enemy records' own `sensorText`; the card blurb summarises research §9.6.
2. **`src/data/chapter-meta.ts`**: numeral `'VII'`, meta appended. The meta
   file became a real `ChapterMeta` (numeral VII, `heroArt` renamed `ch7-`,
   `musicKeys` = the routed cues).
3. **`src/story/registry.ts`**: key, `STORY_CHAPTERS`, empty
   `AI_EMITTED_TRIGGERS` and empty `CHAIN_SEAMS` (one battle, three acts;
   every beat is an in-fight interrupt on the 8 s budget, and all three fit).
4. **`src/engine/tactics/index.ts`**: the tactic under its four combatant ids;
   **`src/data/guides/index.ts`**: the guide appended.
5. **`src/scenes/index.ts`**: `'macalania-temple'` factory + `SCENES` entry;
   **`src/debug/api.ts`**: the `scene-macalania-temple` debug screen.
6. **The lock**: `LOCKED_CHAPTER_IDS` (comingChapters.ts), honoured by
   `buildChapterTiles` (chapterGrid.ts, plus an optional `locked` registry
   for tests).
7. **`src/ui/common/roman.ts`** (both games): numerals now run to VIII. It
   stopped at V, so the **live** Leblanc cutscene eyebrow and prep header read
   "CHAPTER 6" against its meta's VI. Seen fixed in the pass ("VI Leblanc").
8. **`learn/atlas/cites.ts`**: the chapter's three `Record<ChapterId, …>`
   rows, each cite copied from the data files' own section notes.
9. **`docs/target/targets.json`**: the chapter tile's `delivery` is
   `implemented` (the board's word for built; `built` is not in its enum) with
   a `build` line and three `reaction.inferred` entries; the arrival tile
   (already `implemented`, inferred exactly "built to the driver's
   recommendation A + B's tag, awaiting Bailey") gained the real-battle gap.

### Music: Chapter 1's cues, as a recorded stopgap

The preflight (§6.3) and research §9.8 want two NEW compositions,
`scene-macalania-temple` and `boss-seymour-macalania`, and say outright that
this fight is not the Flux chapter's `boss-seymour`. Neither
`docs/audio/THEMES.md` nor `docs/plans/music-modern-sound.md` names a
Macalania cue (the c21d062 sketches are auditions, not routed), and an
unregistered cue throws in the cutscene runner. So, per the brief, **Chapter
1's `scene-gagazet` and `boss-seymour`** plus `victory-ffx` are routed in four
places: `Chapter.music`, the script's two `music()` calls, the formation's
`musicCues`, the meta's `musicKeys`. When the real cues land, swap all four.

### Three sound effects swapped

The script named `chamber-door`, `guado-robes` and `sphere-crack`, none of
which is in the SFX bank (`audio-story-cues.test.ts` failed on them). They now
play `dome-echo` (a bell in a stone hall), `footstep` and `petrify-shatter`
(glass giving way). New sounds are an audio-track question.

### Tests adjusted for the seventh chapter

`chapter-meta.test.ts` (numeral list), `strategy-guide.test.ts` (guide count
7), `frontend-chapter-grid.test.ts` (locked card, unlock case),
`flow-post-scene.test.ts` (Macalania is display-last but story-earlier, so
`ARC_FINALE.ffx` stays Braska's Final Aeon, the same exception Leblanc
documents), `learn-atlas-data.test.ts` (gold accent), `story-scripts.test.ts`
(its row), `chapters/macalania-story.test.ts` and
`chapter-meta-seymour-anima-macalania.test.ts` (the routed cues),
`tests/e2e/chapters.spec.ts` (the id; updated, not run).

## How it was verified

- `npx tsc --noEmit`: clean.
- Full `npm test`: **239 files, 5,536 passed, 2 skipped, 0 failed.**
- `node tools/orphans.mjs`: no Macalania module listed (the four scene files,
  the chapter record, meta, guide, tactic and script are all reachable from
  `src/main.ts`).
- `node tools/critic-plan.mjs --paths …`: **DEEP** (chapter registry, scene
  runner, shared layout). The paper preflight is
  `docs/plans/chapter-macalania-review.md`.
- **One real-flow browser pass** (`PYREFLY_BROWSER=gpu`, own Vite on :5776,
  stopped by PID; scratch harness `tools/zz-macalania-flow.tmp.mjs`, not
  committed). Title, then chapter select with the card **locked**
  (`fe-card fe-card--coming`, "Seymour and Anima · Coming"), then
  `gotoChapter` to party prep (header "VII · Seymour and Anima"), the
  cutscene (Chapter VII eyebrow over the painted antechamber) skipped, the
  battle to its first command menu, `autoBattle('intended')` to a **victory**
  (100 turns, Anima overkilled), the results screen, then
  `autoBattle('defend')` to a **defeat** and its results. 0 console errors,
  0 HTTP errors. Stills, looked at 1:1:
  `docs/screenshots/chapters/macalania-flow-1-select-locked.png`,
  `-2-prep.png`, `-3-battle-menu.png`, `-4-results-win.png`.

## Not done, and found

1. **FIXED in the fix pass above.** ~~Anima is invisible in a real battle.~~ Was: Proven by running: at Seymour 2,829 HP the engine reveals
   her (`removed: false`, 18,000 HP) but the stage's `staged()` list never
   gains `anima-macalania`. `BattlePresenterEvents.ts`'s `part-restored`
   handler only fades an actor that already exists, and `stage()` skips
   `removed` enemies at battle start. This is the one item
   `chapter-macalania-engine.md` §3 says is owed; the scene's pure timeline
   (`animaArrivalAt`, `ANIMA_ARRIVAL_CAMERA`, `makeFloorOccluder`,
   `makeArrivalChains`, `SEYMOUR_STEP_BACK`) is ready for that handler to
   drive. The presenter files are outside this brief. Suggested: when
   `part-restored` names an unstaged enemy, `stage.addCombatant(id, { artId:
   'anima', side: 'enemy', slot: 3 })` (slot from the combatant) at alpha 0,
   then run the arrival. Doesn't block: the chapter is locked.
2. **Real-battle sizes** ignore the scene's heights (`fromSceneBuild`
   hard-codes them; scene handoff §7.2). Seymour's `spriteKey: 'seymour'`
   costs one wasted art probe (§7.1). Presenter and data owners.
3. **The chapter's own music** (above) and three new SFX.
4. **FIXED in the fix pass above.** Was: **the results drop list overflows with four drops**: in
   `-4-results-win.png` the second line ("Ability Sphere, Ability Sphere")
   overlaps Tidus's row. Shared results layout, both games; not fixed here.
5. **Debug-path artifact, not this chapter:** calling `gotoChapter` while the
   chapter-select flow loop is running leaves the title screen's DOM visible
   under the battle. Chapter 1 does the same; the real card-and-Enter path is
   clean. The committed battle still was retaken from boot.
6. **Seymour's dialogue portrait** is `portraits/seymour.png`, which reads
   as the Flux-era face; the chapter tile already lists this as undecided.
7. **Art approval.** Everything is CANDIDATE; the dome is cropped at idle
   (scene handoff §3).
8. `docs/handoff/NOW.md` was not edited (not in this brief's file list);
   the orchestrator folds this in.
