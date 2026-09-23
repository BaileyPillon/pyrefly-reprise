# Chapter 6 — The Leblanc Syndicate: integrator's handoff

> **Fix pass, 2026-09-22 (attempt 3 of a follow-on workflow, Sonnet, high
> effort — Opus/Fable had an API-wide incident again for attempts 1-2 of this
> run). Game case: FFX-2 only** [AGENTS.md rule 14]. Fixes one CRITICAL
> finding a verifier confirmed by running the game: **none of Leblanc's,
> Ormi's or Logos's painted battle art ever appeared in the chapter, in any
> act** — every enemy drew as a generic procedural placeholder. See "Fix pass:
> the missing painted art" below. No boss number, no stat and no research
> number changed.

> **Integrator pass, 2026-09-22 (attempt 3 of `wf_6e496bfa-c24`, Sonnet, high
> effort — Opus/Fable was down with an API-wide incident for attempts 1-2).**
> **Game case: FFX-2 only** [AGENTS.md rule 14]. This track wires together
> what four earlier tracks built standalone
> (`docs/handoff/chapter-leblanc-engine.md`, `-guide.md`, `-scene.md`,
> `-script.md`) into a playable chapter. No boss number was changed.

## Round-09 repair, 2026-09-23: White Wind heals (PR-0086) and the Grenade conflict (PR-0087)

**Game case: FFX-2 only** [AGENTS.md rule 14]: the fix is in the X-2 damage
pipeline and only chapter 6's Syndicate carries the flag it touches.

**PR-0086, fixed.** Leblanc's White Wind healed nothing and cured nothing:
20 casts over seeds 1-20 gave 0 heals and 40 IMMUNE misses. White Wind is
"Recovery, enemy party": 1/8 max HP plus a full cure
(`research/ffx2-leblanc-syndicate.md` §4.4, §5.4 fact 3). The trio's
"Gravity/fractional" immunity (§3.1-3.3) is an immunity to fractional *damage*
(`research/ffx2-combat-core.md` §2.1 step 20, "Damage immunity"). Step 20 in
`src/battle/ffx2/formulas.ts` now skips the fractional clause for a heal. The
preflight is `docs/plans/ffx2-heal-immunity-review.md`, and the pin is
`tests/unit/chapters/leblanc-white-wind.test.ts`: after the fix, every cast
heals each living member, Darkness comes off, there are 0 IMMUNE misses, and
fractional damage on the trio still reads IMMUNE. The heal passes the step-7
randomiser like every other enemy action: Leblanc 161-182, Ormi 157-177, not
an exact 172 / 168. Whether retail skips step 7 for fractional heals is not in
`research/`.

**PR-0087, NOT changed: the sources conflict. Bailey, please rule.** The
shipped Grenade (`src/data/ffx2/items/effects-damage.ts`, `x2-item-grenade`)
is `power 4` (200), `fixed`, `crit-eligible`, `bonusCrit 100`. It lands
**375-423 per enemy** (the critic measured 376-423 over 30 seeds), before any
Chain. Each number is sourced, but the sources disagree:

| Reading | Per-enemy band | Where it comes from |
|---|---|---|
| A. Base 200, and "always critical" doubles it at step 9 (what ships) | **375-423** | combat-core §2.9.3 (Grenade power 4 = 200, pbirdman) + §5.5 ("187-212, always critical"; the bands are "the post-randomiser spread", which is step 7, before the step-9 crit ×2 of §2.5) |
| B. Base 200, and the printed band is final damage | **187-211** | combat-core §5.5 read literally. Evidence for B: every §5.5 bomb band is `power × 50` through the randomiser with no ×2 (S-Bomb 350 → 328-370, M-Bomb 400 → 375-423, L-Bomb 450 → 421-476), even though each row says "always critical" |
| C. Base 300, no crit | **281-317** | leblanc-syndicate §4.6 ("base 300 to every enemy", [verified: 2 sources for the Grenade figure]), §6.2 table, §7.6 |

A and B share combat-core's base (200) and differ only on the crit.
C is a different base from a different pair of sources. The engine matches
none of the printed final figures. It matches A only if "always critical"
means an extra ×2 on top of the step-7 band. Rule 6 says a conflict is
reported, not resolved, so the data is unchanged. To settle it, pick A, B or C.
B means dropping `bonusCrit`/`crit-eligible`. C means `power 6`, no crit. Then
record the ruling in both research files, and pin the band in
`tests/unit/chapters/leblanc-engine.test.ts`. It matters for play because
`chateauBuild` carries 4 Grenades and the advisor opens Act I with them. Its
card shows the same engine band ("1,150-1,268" over three enemies).

## Fix pass: the missing painted art

**Root cause, found by reading source and curling a running dev server, not
by grepping [hard rule 3].** `src/data/ffx2/enemies/leblanc-syndicate.ts` and
`leblanc-syndicate-acts.ts` gave Leblanc, Logos and Ormi (and their Act I/II
earlier-record instances `ormi-entrance`, `ormi-logos-room`, `logos-room`) a
`spriteKey` with an unnecessary `'ffx2-'` prefix (`'ffx2-leblanc'` /
`'ffx2-ormi'` / `'ffx2-logos'`). `src/engine/BattlePresenterArt.ts`'s
`artIdFor()` lets a set `spriteKey` win over the bare combatant id with no
override, and the art track only ever installed files at the **un-prefixed**
`public/art/characters/{leblanc,ormi,logos}/*.png` — so every requested
texture URL 404'd (a 200 SPA-fallback `index.html` on the dev server, a real
404 on the built site) and the presenter's `resolvePoseMap`/`resolveArt`
never found a real pose to show, in any of the three acts. `bahamut` is the
one enemy that genuinely needs the prefix (it collides with an FFX id) and
has real files under **both** `bahamut/` and `ffx2-bahamut/`
(`FFX2_PREFIXED`); Vegnagun's Chapter 5 spriteKeys are correctly un-prefixed
and match their folders exactly — the pattern Leblanc should have followed.

**Fix.** Dropped the `'ffx2-'` prefix from the trio's `spriteKey` (both the
top-level field and the `forms[0].spriteKey` mirror) in
`leblanc-syndicate.ts`. Act I/II's `ormi-entrance` / `ormi-logos-room` /
`logos-room` inherit the corrected `spriteKey` through `earlierRecord()`'s
`base.spriteKey` spread in `leblanc-syndicate-acts.ts`, so all three acts are
fixed by the same three-line edit. **Dr. Goon and Fem-Goon's `spriteKey`
(`'ffx2-dr-goon'` / `'ffx2-fem-goon'`) were left as-is**: no painted art
exists for either under any name (`docs/concepts/chapters/leblanc/
production.md` never scoped them), so there is nothing to fix yet and they
are outside this pass's file ownership (`public/art/characters/{leblanc,
ormi,logos}/**` only); they keep drawing the procedural placeholder, which is
correct today.

**Regression test, fails first:** `tests/unit/chapters/leblanc-art.test.ts`
builds real combatants from the real `FFX2Engine` for all three acts (via
`data.ENEMY_GROUPS_BY_ID[LEBLANC_ACT_I/II/III]`, the same records the shipped
chapter uses) and asserts `BattlePresenterArt.artIdFor()` resolves an id with
an installed `idle.png` on disk for Leblanc/Ormi/Logos and their per-act
aliases, and confirms Dr. Goon/Fem-Goon are unaffected. It failed against the
pre-fix code (`ffx2-ormi` etc., no matching folder) and passes after.

**Live verification (own dev server, `PYREFLY_BROWSER=gpu`, port chosen by
Vite since 5480 was another concurrent session's, stopped by its own PID when
done):** `window.__pyrefly.gotoChapter('ffx2-leblanc', { skipCutscenes: true,
skipPrep: true })` into Act I. Screenshot shows Ormi rendered as the painted
figure (heavy build, purple/gold robe, round shield) instead of a black
hooded silhouette; Dr. Goon and Fem-Goon, which have no art, correctly still
show the procedural placeholder. The browser's own network log shows
`art/characters/ormi/{idle,attack,cast,hurt,ko}.json` and matching `.png`
files all `200`, and no request at all for any `ffx2-ormi` path (the art
manifest already knows Ormi has no states under that id, so `BattlePresenterArt`
never even probes it — see its own doc comment on `poseSet`). `curl` against
the same running server independently confirms the URL-level claim for all
three painted identities:

```
leblanc/idle.png -> 200 image/png        ffx2-leblanc/idle.png -> 200 text/html (SPA fallback)
logos/idle.png   -> 200 image/png        ffx2-logos/idle.png   -> 200 text/html
ormi/idle.png    -> 200 image/png        ffx2-ormi/idle.png    -> 200 text/html
```

Act II and Act III were not separately walked in the live browser this pass
— the shared Browser pane's tab kept going hidden mid-session (the same
rAF-suspension artifact the previous verifier flagged, not a game bug: the
battle clock genuinely stalled at turn 0 while backgrounded and resumed
tracking as soon as the tab was fronted again) — but the regression test
above proves Act II and Act III's exact combatant records
(`ormi-logos-room`, `logos-room`, and Act III's `leblanc`/`logos`/`ormi`)
resolve the same fixed, un-prefixed art id through the same `artIdFor()` the
live Act I check just confirmed end to end, and the `curl` table above covers
all three identities' files directly. A future pass with an uninterrupted
browser session should still walk Act II and Act III visually as a belt
belt-and-braces check.

**A mistake made while driving the shared Browser pane, disclosed here for
whoever reads this next:** one `javascript_tool` call was made without an
explicit `tabId` and executed against another concurrent session's tab
(`127.0.0.1:5480`, not this track's own `127.0.0.1:5481`) — it called
`window.__pyrefly.setSeed(7)` and `gotoChapter('ffx2-leblanc', ...)` on that
tab, which left it sitting on the title screen afterward. No file was
touched and nothing was committed against that session's work, but whoever
owns the `5480` session should know its browser state was reset by this
run. Every call after this one in this session named `tabId: 'seed'`
explicitly.

## Status: registered and playable

`ffx2-leblanc` is chapter 6 in `src/data/encounters.ts`'s `CHAPTERS` (D-018,
`docs/target/decisions.json`: Bailey, "Yes to all recommendations" on the
paper preflight's Q1 — number 6, id `ffx2-leblanc`). Chapter select shows it
as a real card (art already installed, see the CANDIDATE-art caveat below),
party prep builds `chateauBuild`, the cutscene is skippable like every other
chapter's, the battle chains Act I → Act II → Act III on the shipped
`leblancEntranceGroup`, the guide and tactic answer for all eight boss ids,
and the results screen plays the restored flourish (`victory-ffx2`).

## What this track did

All additive; the full list with rationale is in `docs/CONTRACT-CHANGES.md`'s
"Chapter 6 registered" entry (2026-09-22), newest first. Short version:

1. **`src/data/encounters.ts`** (contract file) — `ChapterId` gains
   `'ffx2-leblanc'`, `Chapter.number` gains `6`, `FFX2_LEBLANC` added to
   `CHAPTERS`/`CHAPTER_IDS` (sixth, last). `enemyGroupRef: leblancEntranceGroup`
   (Act I); the engine follows `nextGroupId` through Act II into Act III, same
   pattern as Chapter 5's Vegnagun chain.
2. **`src/data/chapter-meta.ts`** — `numeral` gains `'VI'`; `FFX2_LEBLANC_META`
   (`src/data/chapter-meta-ffx2-leblanc.ts`, now a real `ChapterMeta`, not the
   draft-relaxed type it shipped as) appended to `CHAPTER_META`.
3. **`src/story/registry.ts`** — `ChapterKey` gains `'ffx2-leblanc'`;
   `STORY_CHAPTERS`, `AI_EMITTED_TRIGGERS` (empty) and `CHAIN_SEAMS`
   (`act-one-cleared`, `act-two-cleared`) all gain an entry.
4. **`src/engine/tactics/index.ts`** — `ffx2Leblanc` registered under all eight
   `LEBLANC_BOSS_IDS`.
5. **`src/data/guides/index.ts`** — `FFX2_LEBLANC_GUIDE` appended to `GUIDES`.
6. **`src/app/screens/frontend/comingChapters.ts`** — the Leblanc row's `id`
   corrected from `'ffx2-leblanc-syndicate'` to `'ffx2-leblanc'` so it matches
   the real chapter and drops off the chapter-select board automatically
   (`buildChapterTiles`'s own `liveIds` filter); card art/silhouette comes from
   `chapterGrid.ts`'s default (the formation's first enemy sprite, `leblanc`)
   with no override needed.
7. **Scene, story script and AI scripts were already wired** by earlier tracks
   (`src/scenes/index.ts`, `src/debug/api.ts`, `src/battle/ffx2/ai/index.ts`) —
   nothing to do there.

### Reconciled while wiring (owed to the integrator by both handoffs)

- `src/story/scripts/ffx2-leblanc.ts`'s `LEBLANC_COMBATANT_IDS.ormiActOne` /
  `logosActTwo` were `'ormi-act1'` / `'logos-act2'`, matching no shipped enemy
  record. Corrected to the real `'ormi-entrance'` / `'logos-room'` — the same
  ids the guide's own `phases` use for ACT I / ACT II.
- `LEBLANC_ABILITY_IDS.notSoMightyGuard` was `'x2-lb-not-so-mighty-guard'`
  against the shipped `'x2-leblanc-not-so-mighty-guard'`. Corrected.
- Both were caught by `tests/unit/story-triggers.test.ts`'s existing, chapter-
  generic "every `who` is a combatant that can be on the field" / "every
  `ability-used` names a real ability" checks the moment the chapter
  registered — exactly the tripwire those tests exist for.

### Music: no new `MusicKey`

No cue is named for this chapter in `docs/plans/music-modern-sound.md` or
`docs/audio/THEMES.md`. Composing one, and the `docs/audio/THEMES.md` cue-map
row and `TRACK_NOTES` entry a real new key needs
(`tests/unit/audio-blurbs.test.ts` requires both), is outside this track's
brief. Per the brief's own instruction ("if none is named, the cue chapter 4
uses, and say so"), `Chapter.music` and the story script's three `music()`
calls reuse Chapter 4's `scene-bevelle-underground` / `boss-ffx2-aeon`, plus
`scene-farplane` for the post-battle Vegnagun-reveal hush (beat 14) and the
shared `victory-ffx2` fanfare — all four already real, registered
`MUSIC_KEYS`, so no audio infrastructure changed. **A future music track can
compose this chapter's own cues** and swap the four calls (three in
`ffx2-leblanc.ts`, one in `encounters.ts`).

### `sceneKey` reuses the Last Room diorama for all three acts

`docs/handoff/chapter-leblanc-scene.md` built one scene
(`leblanc-last-room`), staged for the Act III trio. No options round has
picked distinct dioramas for the entrance or Logos' room, so `Chapter.sceneKey`
points at the one built scene for the whole chapter — the backdrop and camera
rigs stand in for Acts I-II too. Recorded as a gap (hard rule 9 still applies
to a future Act I/II scene), not a silent guess.

### Fallout from widening `ChapterId`/`Chapter.number` (both fixed here)

- **`learn/atlas/` (an existing, unrelated learning-site prototype)** — three
  `Record<ChapterId, ...>` tables in `learn/atlas/cites.ts` needed a sixth
  entry (real citations to `research/ffx2-leblanc-syndicate.md`, not
  invented). Separately, `learn/atlas/parts.ts`'s card/painting classifier
  (`kindForUnit`) crashed on this chapter: it classified a unit as a
  fan-out "card" purely by a shared `spriteKey`, but Ormi/Logos's earlier-act
  bestiary records share their sprite with their Act III selves because
  they're the *same reprised character* across the mission's three acts, not
  a subordinate part — and (rightly) carry no `flags.isPart`, since that flag
  has its own gameplay meaning in the real battle engine and hard rule 6
  forbids adding it with no source. Fixed by requiring `isPart` alongside the
  sprite match for the "card" classification (`kindForUnit`), which is what
  the downstream `parentId` assignment already required — the two heuristics
  are now consistent. Verified: `learn-atlas-data.test.ts`,
  `learn-atlas-stage.test.ts`, `learn-threads.test.ts` all green.
- **Two tests with a hardcoded "the last chapter is the finale" assumption**
  (`tests/unit/flow-post-scene.test.ts`) and **hardcoded FFX2 chapter/card
  counts** (`tests/unit/ui-ffx2-prep-dresspheres.test.ts`,
  `tests/unit/strategy-guide.test.ts`, `tests/unit/frontend-chapter-grid.test.ts`,
  `tests/unit/frontend-chapter-select-screen.test.ts`) updated to the real
  counts/order. `ARC_FINALE.ffx2` correctly **stays** `ffx2-vegnagun-shuyin`
  — Leblanc is display-order last (it shipped after Vegnagun) but narratively
  FFX-2's own Chapter 2, earlier than Vegnagun's ending; the test now
  documents that exception instead of assuming display order always equals
  story order.
- **Two generic, chapter-driven audits with an incidental threshold**
  (`tests/unit/advisor-note.test.ts` wants 200+ replayed decisions per
  chapter; `tests/unit/trigger-commands.test.ts` wants 20+ distinct menu rows
  audited) — both only ever exercise a chapter's *first* formation (no chain
  advance, same for every chapter). Verified with the real engine, not
  guessed: Act I's entrance formation is short by design (its own lesson is
  "physicals bounce off Def 120, magic doesn't" [`docs/handoff/chapter-
  leblanc-engine.md` §2], taught as cheaply as possible) and its Yuna 20
  Gunner / Rikku 21 Thief / Paine 22 Warrior loadout is genuinely smaller than
  chapters 4-5's further-along parties — at up to 40 turns and seven seeds,
  its own row count plateaus at exactly 18, not a sampling shortfall. Fixed
  with a documented, per-chapter floor in each file rather than lowering the
  bar the other five chapters already clear.
- **Two dialogue beats over their 8 s interrupt budget**
  (`first-not-so-mighty-guard` 8433 ms, `first-no-love-lost` 9124 ms,
  `ormi-down` 8257 ms — `tests/unit/story-triggers.test.ts`) — trimmed each
  line's `auto` hold by 100-300 ms (text unchanged) to bring all three under
  8000 ms with margin (7857-7983 ms). No line was cut or reworded.
- **`tests/e2e/chapters.spec.ts`** (Playwright) updated for the sixth chapter
  (not run this pass — see "Not done" below).

## Not done in this track

- **The chapter's own music.** See above.
- **Distinct Act I / Act II dioramas.** See above.
- **Art approval.** `docs/concepts/chapters/leblanc/production.md` still flags
  the installed Leblanc/Ormi/Logos pose sets **CANDIDATE, not approved**
  (identity drift between states) — this track did not touch art and the
  chapter plays with whatever is installed today, same as the scene track's
  own caveat.
- **Playwright e2e** (`tests/e2e/chapters.spec.ts`) was updated for
  correctness but not executed — the browser real-flow check below (Vitest +
  a manual browser pass) is what this track ran instead.
- **`docs/handoff/NOW.md`** was deliberately left untouched: two other
  workflows (release 08 prep, living-portrait round 2) are active on this
  shared tree and NOW.md was not in this track's file list. The orchestrator
  should fold this handoff's summary in.

## How it was verified

- `npx tsc --noEmit` — clean.
- Every Leblanc-specific test file green: `leblanc-engine.test.ts` (26),
  `leblanc-scene.test.ts` (7), `strategy-ffx2-leblanc.test.ts` (8),
  `guide-ffx2-leblanc.test.ts` (9), `chapter-meta-ffx2-leblanc.test.ts` (13),
  `story-ffx2-leblanc.test.ts` (28).
- Every generic, chapter-driven test this registration reaches, green:
  `chapter-meta.test.ts`, `strategy-guide.test.ts`, `story-scripts.test.ts`,
  `story-triggers.test.ts`, `audio-cue-reachability.test.ts`,
  `audio-blurbs.test.ts`, `audio-story-cues.test.ts`,
  `frontend-chapter-grid.test.ts`, `frontend-chapter-select-screen.test.ts`,
  `ui-ffx2-prep-dresspheres.test.ts`, `learn-atlas-data.test.ts`,
  `learn-atlas-stage.test.ts`, `learn-threads.test.ts`, `advisor-note.test.ts`,
  `trigger-commands.test.ts`, `flow-post-scene.test.ts`.
- One full `npm test` — **225 files, 5,351 passed, 2 skipped, 0 failed.**
- `node tools/orphans.mjs` — no Leblanc module listed (both previously-expected
  orphans, `src/engine/tactics/ffx2-leblanc.ts` and
  `src/data/ffx2/builds/chateau.ts`, are now reachable from `src/main.ts`).
- **One real-flow browser pass** — see the screenshots and log in this
  session's report; `PYREFLY_BROWSER=gpu`, own dev server, stopped by PID.
