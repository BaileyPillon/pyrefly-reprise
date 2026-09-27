# Chapter XVII — Ixion at Djose (FFX-2): engine, data, AI and a story stub, unlisted behind a switch

**Branch `chapter-ixion`** (worktree `D:/pyrefly-ch-ixion`, sparse: no `docs/screenshots` except what this track
added). **Not merged, not deployed.** 2026-09-27.

**Game case: FFX-2 only** [AGENTS.md rule 14]: ATB, dresspheres, the fallen aeons' action counter
(`research/ffx2-ixion-djose.md` §0: nothing transfers to the FFX Ixion). The registration, the scene-registry line
and the `ChapterId` widening are shared plumbing, "both".

**Bailey, 2026-09-27 ~13:40 EDT, "all your recommendations"**: Ixion **concept A**
(`docs/concepts/chapters/ixion-djose-2026-09-27/README.md`): the fight with the game's "Recharge" line as the
tell, then the fall and a short Abyss cutscene ending on a playable four-whistle beat.

**Bailey, 2026-09-27 ~15:20 EDT, "all your recommendations"** (D-268, D-269): Ixion's FFX-2 look is **option B,
possessed violet** (installed, below), and the Djose **3-second action time is ON**.

## What is built

| Part | Where | Notes |
|---|---|---|
| Ixion's record | `src/data/ffx2/enemies/ixion-djose.ts` | §3.1 verbatim with tags: Lv 28, HP 12,380, MP 9,999, 62 / 21 / 106 / 82, Agi 138, Eva 35, Luck 4; absorbs Lightning, weak Water, immune Gravity; Slow and Breaks land; fractional-immune; EXP 2,600, AP 15, Gil 1,800, Pilfer 3,000; drop Soul of Thamasa, steal Sprint Shoes (rate 128). Id `x2-ixion`. |
| His five actions | `src/data/ffx2/enemies/ixion-djose-abilities.ts` | Attack DC 16; Thundara DC 12 on all, Lightning, 12 MP; Aerospark 5/8 of current HP (10/16), not reducible; Recharge flat +200 HP +200 MP (`fixed` + `noVariance` + `restoresMp`); Thor's Hammer DC 30 on all. **IX-2 [conflict]** (element): non-elemental, our estimate (Q1 a), one constant away (`IXION_THORS_HAMMER_ELEMENT`). |
| AI | `src/battle/ffx2/ai/ixion.ts` | §4.2: steps 1-2 Attack or Thundara, step 3 Aerospark; AC +5 / +10 Aerospark / +5 when aimed at (Chapter XI's `attackedHooks`, FA8 a; FA8 b one flag away); at 100 Recharge, then AC 0 and Thor's Hammer as his next action. **F-8 [conflict]** 3/4 : 1/4, our estimate; the wiki's 2/3 : 1/3 behind `state.flags.ixionThundaraSplit = 'wiki'`. **IX-12 (unsourced)**: the cycle restarts at step 1 after the Hammer, our estimate; Recharge and the Hammer add nothing to AC. Emits `script-trigger` `ixion-recharge`. |
| The formation | `djoseIxionGroup` (`ffx2-djose-ixion`) | one link, no escape, `boss-ffx2-aeon` cue; **`DJOSE_ACTION_TIME_ON = true`, 3 s** (Bailey, D-269; the bench). |
| The party | `src/data/ffx2/builds/djose.ts` | Yuna White Mage 32, Rikku Dark Knight 33, Paine Dark Knight 34 (levels **our estimate**, IX-14, band 30-36). Owned: the Chapter 2 list plus **Samurai** (certain); Berserker, Lady Luck, Trainer left out and labelled (each "if done"); no Mascot. Chapter 2's grids and accessories carried, a chapter of AP, a bag with Mega-Potions (estimates). Unwavering Guard is the reward, so not worn. |
| Rewards | `src/data/ffx2/items/held.ts` | `soul-of-thamasa`, `sprint-shoes` as held rows (effects: wiki, single source; prices unsourced, listed). Unwavering Guard is a grid, not an `EnemyRewards` field (Chapter XI precedent). |
| Chapter record | `src/data/chapter-ffx2-ixion-djose.ts` | id `ffx2-ixion-djose`, number 17, **in `UNLISTED_CHAPTERS`**: reachable only by `getChapter` and `window.__pyrefly.gotoChapter('ffx2-ixion-djose')`. Listing it is the switch. |
| Placeholder scene | `src/scenes/index.ts` | key `djose-temple`, the demo diorama, titled "Djose Temple (PLACEHOLDER: the demo diorama)"; pyrefly canon row "unattested" (§6.1 names no particles). |
| Art: look B | `spriteKey: 'x2-ixion'` (`IXION_SPRITE`) | `public/art/characters/x2-ixion/`: **idle** = `opt-b.png` byte for byte (the picture Bailey picked); **attack**, **cast** and **overdrive** derived by the same no-GPU method (`possess_b.py`) from the shipped FFX attack and overdrive paintings; **cast** adds the Recharge glow (`look/scripts/recharge_glow.py`: the horn lit, a paler inner rim, a violet halo and a tip glow capped at alpha 0.33, 0 opaque-mask pixels changed). All face screen-left; idle `scale` 1.0892 restores the FFX pixels-per-unit after the 70 px pad. Installer `look/scripts/install.py` (asserts every destination absent). Locked as `bailey:2026-09-27-ixion`; backups `D:/Tools/pyrefly-art-backup/approved/2026-09-27-ixion/`. Manifest: only `subjects/x2-ixion` added. The FFX `ixion/` paintings are untouched. |
| Story stub | `src/story/scripts/ffx2-ixion-djose.ts` | `results()`, then concept A's order in "(Placeholder)" stage directions in our own words: the fall, the Abyss (Songstress, Shuyin calls her Lenne, Vegnagun, the embrace, Baralai, Nooj and Gippal, two spheres, alone), **four one-option "(Whistle)" choices** (flag `ixionWhistles` 1-4), wakes in the Bevelle Underground. No quoted game text (IX-13), no staged figures, no music. |

## IX-11: the multi-target rule (checked, not changed)

The research derives from two observations that Ixion's all-party Thundara and Thor's Hammer are **not** halved.
The FFX-2 engine already halves only the **party's** Black / White Magic cast on all (`execute.ts`, step 15), so
enemy all-party moves are unhalved. `ixion-engine.test.ts` pins the research's derived bands: Thundara 150-169 and
Thor's Hammer 935-1,057 against MDef 35. Nothing to fix.

## The bench (200 seeds; `docs/plans/ixion-bench.md`)

- **Switch off (as first built): sensible 2/200 (1.0 %) at human pace, 5/200 at bench speed; naive 0/200.** Ixion
  acts about twice per Dark Knight action (28 vs 14 a fight); fights end in under a minute.
- **Switch ON, 3 s, as built since Bailey's pick (D-269): sensible 191/200 (95.5 %) human, 197/200 bench; naive
  48/200 (24.0 %) human, 90/200 bench.** Re-run 2026-09-27 ~15:25 EDT with the formation's own field: identical to
  the first run's engine-option numbers, so the switch is wired as measured. Thor's Hammer comes in every fight, 2.0
  a fight (sensible, human); 30 of ~404 Hammers left a girl down on the sensible line, 180 of ~322 on the naive one.
- Open readings barely move it (F-8 wiki 95.0 %, FA8 b 97.0 %); the level band does (Lv 30: 84.5 %, Lv 36: 99.5 %).

## Verified

**2026-09-27 ~15:20-15:55 EDT (look B + action time ON; main merged in at ce49c7d7):**

- `npx tsc --noEmit` clean. `ixion-engine.test.ts` + `learn-atlas-data.test.ts` 24/24; `ixion-bench.test.ts` 8/8
  (the table above); `trema-options.test.ts` + `ffx2-atb-golden.test.ts` 23/23. Full suite once: 551 files passed,
  2 failed: `trema-options`' "only the Cloister and Road links carry action time" (the Djose link now carries it
  too: the test now lists it, then passed) and `strategy-ffx2-bahamut`'s heal-only route (26 s against the 15 s
  limit under load; the same timeout on main, noted in the first pass). `ffx2-atb-golden` passed. Orphans 29 (as
  before).
- Art: `verify-approved` (ROOT = this worktree) 271 ok, 0 mismatched, 0 missing (223 approved + 48 judge-locked).
  The regenerated manifest differs from the one before only by `generatedAt` and the new `subjects/x2-ixion`
  (`attack, cast, idle, overdrive`, facing left). Re-running `possess_b.py` on the FFX idle reproduces `opt-b.png`
  byte for byte.
- Browser (headless Playwright from node, `PYREFLY_BROWSER=gpu`, Vite on 7400, stopped by PID; scratch
  `.ixion-look-tmp.mjs`, `.ixion-phone-probe-tmp.mjs`, uncommitted), at 1600x900 and 390x844: `chapters()` does not
  list it; `gotoChapter('ffx2-ixion-djose')` reaches the battle with `spriteKey` `x2-ixion`, the battle flag
  `actionTimeSeconds` 3, and the page fetched `x2-ixion/idle`, `attack` and `cast` (png + json, all 200). Real keys
  acted (Pray, Attack). With his counter at 100, Recharge then Thor's Hammer came, and Ixion wore the **cast** pose
  (the Recharge glow). Real keys won (Ixion's HP set to 1 by the debug API, Rikku's Attack by Enter), `victory`,
  results 2,600 EXP / 15 AP / 1,800 gil / Soul of Thamasa. 0 page errors. Frames `docs/screenshots/chapter-ixion/`:
  `*-field-opening`, `*-field-look-b`, `*-recharge-banner`, `*-thors-hammer`, `*-win-blow`, `*-win-results` for
  `desktop-1600` and `phone-390`.

**First pass (2026-09-27, before the picks):** tsc clean; 19/19 and 8/8; full suite 551 passed, 2 timeouts under
load; browser on 7310 walked the fight and the whole post-battle stub with real keys (frames
`docs/screenshots/ixion/`, script `.ixion-browser-tmp.mjs`).

## Open (Bailey's, or the next track's)

1. **No "Recharge" banner exists in the FFX-2 HUD (finding, 2026-09-27).** A DOM watch through the whole Recharge
   and Hammer beat, at both viewports, found the word "Recharge" only in the house intent slab ("IXION ACTS NEXT
   Recharge", `eint__*`): the FFX-2 battle banner (`[data-role="battle-message"]`) shows only `message` events and
   stays hidden, and the FFX message bar (`.mbar`) is not mounted in FFX-2. The first pass's "the HUD showed both"
   was that slab. So concept A's tell (the game's own "Recharge" line) is not built; with the slab hidden (E) the
   player gets no warning at all. Building it is HUD / presenter work (both games' plumbing), not done here.
2. **The phone field during command turns** (390x844): the camera centres the party and Ixion leaves the frame on
   the placeholder scene (he is in frame at the opening, `phone-390-field-opening.png`; the Road's Shiva stays at the
   edge). The Djose Chamber plate and its slots should settle it; check again when the plate lands.
3. **The derived poses are not seen by Bailey.** Only the idle is the picture Bailey picked; `attack` (Attack),
   `cast` (Recharge, Thundara, Aerospark and Thor's Hammer all wear it: every non-physical row) and `overdrive`
   (Thor's Hammer; not read by the enemy presenter today, which loads idle / attack / cast / hurt / ko) are the same
   method on the FFX attack and overdrive paintings, locked with the idle as the brief asked. A separate Hammer
   pose on screen needs a per-move pose in the presenter. No hurt or KO pose: both fall back to the idle.
4. **Q1 / IX-2** (Hammer's element), **Q2 / F-8** (split), **Q4 / FA8** (what counts as a hit): built on the
   research's leans, each one constant or flag away.
5. **Finding, not fixed:** a Garment Grid's `elementEater` (Lightning / Fire / Water / Ice Eater) is read by nothing
   in the FFX-2 engine, so Thunder Spawn does not absorb Thundara. No shipped build wears an Eater grid; party prep
   may let a player pick one. Combat-core work with its own review.
6. **The intent slab** previews Recharge and Thor's Hammer one action early (and is, per item 1, the only tell on
   screen); whether it stays on for this chapter is Bailey's. **Still to build before listing:** the Djose Chamber
   plate, the Abyss plate and the fall poses (placeholders, labelled), the written Abyss dialogue (writing bible),
   the whistle as a real moment (sound, the light), music by ear, a card, a guide and a tactic.
7. **Merge note:** `src/data/encounters.ts` (`ChapterId`, `number`), `src/data/chapters-unlisted.ts`,
   `learn/atlas/cites.ts` and `tests/unit/learn-atlas-data.test.ts` are touched at the same lines by
   `chapter-sin`; keep both (`| 16 | 17`, both ids, both rows). `docs/target/approved-hashes.json` gains the set
   `bailey:2026-09-27-ixion` at its end; if main has appended sets since, keep every set.
