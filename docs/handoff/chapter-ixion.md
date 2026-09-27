# Chapter XVII — Ixion at Djose (FFX-2): engine, data, AI and a story stub, unlisted behind a switch

**Branch `chapter-ixion`** (worktree `D:/pyrefly-ch-ixion`, sparse: no `docs/screenshots` except what this track
added). **Not merged, not deployed.** 2026-09-27.

**Game case: FFX-2 only** [AGENTS.md rule 14]: ATB, dresspheres, the fallen aeons' action counter
(`research/ffx2-ixion-djose.md` §0: nothing transfers to the FFX Ixion). The registration, the scene-registry line
and the `ChapterId` widening are shared plumbing, "both".

**Bailey, 2026-09-27 ~13:40 EDT, "all your recommendations"**: Ixion **concept A**
(`docs/concepts/chapters/ixion-djose-2026-09-27/README.md`): the fight with the game's "Recharge" line as the
tell, then the fall and a short Abyss cutscene ending on a playable four-whistle beat. Ixion's FFX-2 look is
still Bailey's pick (research Q6; the options are commit 247cb985).

## What is built

| Part | Where | Notes |
|---|---|---|
| Ixion's record | `src/data/ffx2/enemies/ixion-djose.ts` | §3.1 verbatim with tags: Lv 28, HP 12,380, MP 9,999, 62 / 21 / 106 / 82, Agi 138, Eva 35, Luck 4; absorbs Lightning, weak Water, immune Gravity; Slow and Breaks land; fractional-immune; EXP 2,600, AP 15, Gil 1,800, Pilfer 3,000; drop Soul of Thamasa, steal Sprint Shoes (rate 128). Id `x2-ixion`. |
| His five actions | `src/data/ffx2/enemies/ixion-djose-abilities.ts` | Attack DC 16; Thundara DC 12 on all, Lightning, 12 MP; Aerospark 5/8 of current HP (10/16), not reducible; Recharge flat +200 HP +200 MP (`fixed` + `noVariance` + `restoresMp`); Thor's Hammer DC 30 on all. **IX-2 [conflict]** (element): non-elemental, our estimate (Q1 a), one constant away (`IXION_THORS_HAMMER_ELEMENT`). |
| AI | `src/battle/ffx2/ai/ixion.ts` | §4.2: steps 1-2 Attack or Thundara, step 3 Aerospark; AC +5 / +10 Aerospark / +5 when aimed at (Chapter XI's `attackedHooks`, FA8 a; FA8 b one flag away); at 100 Recharge, then AC 0 and Thor's Hammer as his next action. **F-8 [conflict]** 3/4 : 1/4, our estimate; the wiki's 2/3 : 1/3 behind `state.flags.ixionThundaraSplit = 'wiki'`. **IX-12 (unsourced)**: the cycle restarts at step 1 after the Hammer, our estimate; Recharge and the Hammer add nothing to AC. Emits `script-trigger` `ixion-recharge`. |
| The formation | `djoseIxionGroup` (`ffx2-djose-ixion`) | one link, no escape, `boss-ffx2-aeon` cue; **`DJOSE_ACTION_TIME_ON = false`** (see the bench). |
| The party | `src/data/ffx2/builds/djose.ts` | Yuna White Mage 32, Rikku Dark Knight 33, Paine Dark Knight 34 (levels **our estimate**, IX-14, band 30-36). Owned: the Chapter 2 list plus **Samurai** (certain); Berserker, Lady Luck, Trainer left out and labelled (each "if done"); no Mascot. Chapter 2's grids and accessories carried, a chapter of AP, a bag with Mega-Potions (estimates). Unwavering Guard is the reward, so not worn. |
| Rewards | `src/data/ffx2/items/held.ts` | `soul-of-thamasa`, `sprint-shoes` as held rows (effects: wiki, single source; prices unsourced, listed). Unwavering Guard is a grid, not an `EnemyRewards` field (Chapter XI precedent). |
| Chapter record | `src/data/chapter-ffx2-ixion-djose.ts` | id `ffx2-ixion-djose`, number 17, **in `UNLISTED_CHAPTERS`**: reachable only by `getChapter` and `window.__pyrefly.gotoChapter('ffx2-ixion-djose')`. Listing it is the switch. |
| Placeholder scene | `src/scenes/index.ts` | key `djose-temple`, the demo diorama, titled "Djose Temple (PLACEHOLDER: the demo diorama)"; pyrefly canon row "unattested" (§6.1 names no particles). |
| Placeholder art | `spriteKey: 'ixion'` | the **FFX** Ixion painting (D-089), labelled, until Bailey picks the FFX-2 look. No new art. |
| Story stub | `src/story/scripts/ffx2-ixion-djose.ts` | `results()`, then concept A's order in "(Placeholder)" stage directions in our own words: the fall, the Abyss (Songstress, Shuyin calls her Lenne, Vegnagun, the embrace, Baralai, Nooj and Gippal, two spheres, alone), **four one-option "(Whistle)" choices** (flag `ixionWhistles` 1-4), wakes in the Bevelle Underground. No quoted game text (IX-13), no staged figures, no music. |

## IX-11: the multi-target rule (checked, not changed)

The research derives from two observations that Ixion's all-party Thundara and Thor's Hammer are **not** halved.
The FFX-2 engine already halves only the **party's** Black / White Magic cast on all (`execute.ts`, step 15), so
enemy all-party moves are unhalved. `ixion-engine.test.ts` pins the research's derived bands: Thundara 150-169 and
Thor's Hammer 935-1,057 against MDef 35. Nothing to fix.

## The bench (200 seeds; `docs/plans/ixion-bench.md`)

- **As built, action time off: sensible 2/200 (1.0 %) at human pace, 5/200 at bench speed; naive 0/200.** Ixion
  acts about twice per Dark Knight action (28 vs 14 a fight); fights end in under a minute.
- **With the switch on (3 s, the Road and Cloister value): sensible 191/200 (95.5 %) human, naive 48/200 (24 %).**
  Thor's Hammer comes in every fight, 2.0 a fight (sensible, human); 30 of ~404 Hammers left a girl down on the
  sensible line, 180 of ~322 on the naive one.
- Open readings barely move it (F-8 wiki 95.0 %, FA8 b 97.0 %); the level band does (Lv 30: 84.5 %, Lv 36: 99.5 %).
- **Turning the switch on is Bailey's call**; the recommendation (our estimate) is on, at 3 s.

## Verified

- `npx tsc --noEmit` clean; `ixion-engine.test.ts` 19/19, `ixion-bench.test.ts` 8/8; full suite 551 files
  passed, 2 failed on timeouts under machine load: `ui-ffx2-atbmode` (passes alone) and `strategy-ffx2-bahamut`'s
  heal-only route, which takes about 18 s against the 15 s limit **on main too** (same test, same timeout); `ffx2-atb-golden` unchanged; orphans 29 before and after.
- Browser (headless Playwright, `PYREFLY_BROWSER=gpu`, Vite on 7310, stopped by PID): `chapters()` does not list
  it; `gotoChapter('ffx2-ixion-djose')` reaches the battle on the placeholder scene; real keys acted (Pray, Attack,
  Attack); with his counter set to 100 the next actions were Recharge then Thor's Hammer, and the HUD showed both;
  with his HP set to 1, real keys won; the result carried 2,600 EXP / 15 AP / 1,800 gil / Soul of Thamasa (the
  frame catches the results screen mid count-up, with Soul of Thamasa and 15 AP a dressphere), and real keys walked the whole stub (the fall, the Abyss, four whistles, Bevelle). No page errors. Frames:
  `docs/screenshots/ixion/` (battle-open, recharge-banner, thors-hammer, results, post-fall-line,
  post-whistle-choice, post-wakes-bevelle). Script: `.ixion-browser-tmp.mjs` (scratch, uncommitted).

## Open (Bailey's, or the next track's)

1. **The action-time switch** (`DJOSE_ACTION_TIME_ON`): off as built; the chapter is almost unwinnable without it.
2. **Q6, Ixion's FFX-2 look**: the painting options are in commit 247cb985; the FFX painting stands in.
3. **Q1 / IX-2** (Hammer's element), **Q2 / F-8** (split), **Q4 / FA8** (what counts as a hit): built on the
   research's leans, each one constant or flag away.
4. **Finding, not fixed:** a Garment Grid's `elementEater` (Lightning / Fire / Water / Ice Eater) is read by nothing
   in the FFX-2 engine, so Thunder Spawn does not absorb Thundara. No shipped build wears an Eater grid; party prep
   may let a player pick one. Combat-core work with its own review.
5. **The intent slab** (the house's "ACTS NEXT" HUD, E to hide) previews Recharge and Thor's Hammer before they
   happen, so with it shown the tell arrives one action early. Concept A says the game's own banner is the only
   warning; whether the slab stays on for this chapter is Bailey's.
6. **Still to build before listing:** the Djose Chamber plate and Ixion's FFX-2 painting (after the pick), the
   written Abyss dialogue (writing bible), the whistle as a real moment (sound, the light), music by ear, a card,
   a guide and a tactic.
7. **Merge note:** `src/data/encounters.ts` (`ChapterId`, `number`), `src/data/chapters-unlisted.ts`,
   `learn/atlas/cites.ts` and `tests/unit/learn-atlas-data.test.ts` are touched at the same lines by
   `chapter-sin`; keep both (`| 16 | 17`, both ids, both rows).
