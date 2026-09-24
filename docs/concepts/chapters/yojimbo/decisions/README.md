# Chapter IX decision sheets: Yojimbo, Daigoro and Lady Ginnem

**Game case: FFX only.** These are Lady Ginnem's Yojimbo, Daigoro and Ginnem in the Cavern of
the Stolen Fayth (D-049). No FFX-2 chapter uses these files.

The sheets are built the same way as `../../macalania/decisions/` (Chapter VII) and
`../../art-r3-decisions/` (Chapter VI). Everything comes from files already on disk.

- **Rendering and installs:** nothing was rendered or queued on ComfyUI. Nothing was installed.
  `public/art`, `src/` and `docs/target/*.json` were not touched.
- **Crops and composites:** `gen_crops.py` makes every one and names the source of each.
- **Rebuild:** `python gen_crops.py`, then
  `node docs/concepts/polish/_kit/shoot.mjs <sheet>.html <sheet>.png --w=1600 --h=900`.

## decision-paintings.png

**Question for Bailey: how many paintings do Yojimbo, Daigoro and Ginnem get?**

- **A (recommended):** idle plus one hero cast.
- **B:** A plus a hurt or attack painting.
- **C:** idle only, with the engine's lunge and flash.

This is the same Decision 1 that Chapter VI (D-034) and Chapter VII (D-045) both answered with A.

**What the panels show:**

- **Game-size panels:** the casts builder's real 1600x900 GPU battle frames. The builder served the
  candidates by request interception (`../casts/scripts/ingame.mjs`). The copies are in
  `D:/Tools/pyrefly-art-backup/candidates/2026-09-24-yojimbo-casts/provenance/ingame/`.
- **Crops:** 1:1 pixels of the candidates and the installed idles.
- **Scores:** from the independent judges. `../casts/JUDGE.md` (commit 01dc52f9) scored the action
  paintings, and `../production/JUDGE.md` scored the idles.

| Subject | What exists | Score | On this sheet |
|---|---|---|---|
| Yojimbo | `cast.png`, drawn blade | **6.5**, repair first | A. Blade root, inked edges, a pointed tip and the glove edge need a pixel repair. Lengthening the blade needs a yes (no sourced length). |
| Yojimbo | `hurt.png`, lean-back bake | 6 | B only. Both the builder and the judge advise none: it reads aloof, not struck, and at game size it is almost the engine's flinch. |
| Daigoro | `cast.png`, 30° bite | **7.0**, pass | A. The judge advises a touch-up: remove the pink fringe, soften the lip kink, thin the fang row. |
| Daigoro | `cast-alt-narrow.png`, 20° | 6.5 | Shown in A as the rejected alternative. With the tongue out it reads as a grin. |
| Idles | Yojimbo / Daigoro / Ginnem | 7.9 / 7.3 / 7.5 | C, and the fallback in A. |
| Ginnem | nothing beyond the idle | n/a | She never acts and is never hit (0 and 0 in the builder's 80-battle census). A = B = C for her. |

**Recommendation: A, consistent with D-034 and D-045.**

- Daigoro gets the 30° bite.
- Yojimbo gets the drawn blade only after one pixel repair (METHOD-CHECK step 2) that scores at
  least 7 at 1:1. Until then he stays on the idle, as in C, and nothing below 7 is installed.
- Yojimbo gets no hurt painting.
- Lady Ginnem gets nothing new.

**Two caveats:**

- **The advice panel:** in the builder's frame it covers the blade. That frame held the pose during
  Kimahri's turn. `src/ui/common/MoveAdvisor.ts` clears the panel once a command is taken, so it is
  probably gone during Yojimbo's own turn. That moment was not captured.
- **The wiring gap stands:** the chapter still loads the aeon painting (`spriteKey 'yojimbo'`), not
  the Cavern idle.

## decision-exit.png

**Question for Bailey, framed like D-035 and D-046: how does each of the three leave the fight?**

The strips show motion only. They are the installed idles over the candidate Cavern plate
(`public/art/backdrops/cavern-stolen-fayth.png`), changed only in opacity, offset and scale. The
"Today" pyrefly frame is the real Mortiorchis capture that Chapter VII's sheet also used.

**What the sources say**

The research table is `research/ffx-vs-ffx2-presentation.md`. The FF Wiki pages were fetched
2026-09-24 through `api.php?action=parse&prop=wikitext`.

- **Aeons (§3.1):** "Dreams of the fayth." Anima's departure is "*presented* as a dismissal"
  (row 132). Row 141 adds: "present the departure as a recall, not a death."
- **Unsent (row 131):** "When an unsent is sent or destroyed, the body disperses into pyreflies."
- **Living humans who lose (§3.1):** "They lose and the scene continues. Nothing dissolves." This is
  the class of the Syndicate's and the Guardians' `'yields'` (D-035, D-046).
- **Seymour at Macalania (row 142):** "He dies and leaves a body." This is his `'body'` (D-046).
- **Ginnem** (FF Wiki *Ginnem*, revid 3963153): "After the battle, Yuna sends Ginnem to the
  Farplane." `research/ffx-yojimbo.md` §6.2 beat 5 says the same.
- **Daigoro** (FF Wiki *Daigoro*, revid 3782948): he is "always appearing at the aeon's side", and
  is "the manifestation of a fayth that was made of a dog".
- **Yojimbo himself:** no source describes how he leaves. Neither *Yojimbo (Final Fantasy X boss)*
  (revid 3980332) nor *Cavern of the Stolen Fayth* (revid 4034145) nor *Aeon (Final Fantasy X)*
  (revid 4029264) says so. The recall below is **our reading of the aeon class, labelled as such**,
  not a sourced fact.

**Today (read from the code, not captured):**

- `src/engine/BattlePresenterDepartures.ts` has no entry for Yojimbo, so he gets the global
  pyrefly `'dissolve'`.
- `src/battle/ffx/ai/yojimbo-rules.ts` marks Ginnem and Daigoro `nonCombatant`, so neither has a KO
  or a departure.
- The placeholder post scene has only `results()`, so Ginnem is never sent.

**Recommendation:**

- **Yojimbo and Daigoro leave together as a recall.** The idle dims and rises, with no pyrefly
  burst. This is Anima's "dismissed" presentation, research §3.3. `'yields'` and `'body'` are the
  wrong classes: he is not a living person who walks off, and not a person who dies.
- **Ginnem stays through the victory.** In the post scene, Yuna's sending holds and she breaks up
  into pyreflies. This is the story draft's beat 5 (`docs/plans/yojimbo-story-draft.md`), which is
  still waiting for Bailey's read.
- The draft's "falls to one knee" would need a new painting, so the recommendation drops it.

**Owners if Bailey says yes:**

- The presenter adds a `'dismissed'` departure kind. Today's union is
  `'dissolve' | 'falls-away' | 'yields' | 'body'`. The recall has to cover Daigoro, who has no KO of
  his own.
- The story track writes the sending into the post scene.

## After Bailey answers

- Record the answer as liked / disliked / must remain / must change / undecided in the tile's or
  decision's `reaction`.
- Nothing here is built, wired or written to `approved-hashes.json` until he answers.
