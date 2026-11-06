# ch-anime (exp-anime): paper preflight (AGENTS.md rule 15)

Written 2026-11-06 by the ch-anime lane (code, part 1), before the first GPU job. `node tools/critic-plan.mjs --paths <changed files>` classes the change **DEEP**: "chapter registry or a new chapter is a shared system" (`encounters.ts`, `chapter-meta.ts`), plus effects and lighting (the cel material), title/select screens (the door). Obligations if it ships: live + focused + deep. Nothing is deployed by this lane.

## 1. What changes, and the game case

- **FFX-2 only.** The chapter is hidden chapter 24's Valefor fight (`ffx2-valefor-besaid`, `research/ffx2-fallen-aeons.md` section 7.1) by reference, exactly as the Wind Waker chapter is: same build, formation, scripts, music, Sensor line, card words. **No battle data of its own (rule 6)**; proven by `tests/unit/chapters/exp-anime.test.ts` (the same event log as chapter 24 on seeds 1 and 2, and a defeat, with the real content registered). The picture is the only thing new: the Meshy toon girls (Yuna, Rikku, Paine: about five heads, 1.55 to 1.70 m) and Valefor at 5 m under an anime cel material with outlines (the Genshin Impact / Guilty Gear Strive manner), in the Wind Waker chapter's temple stage.
- **Shared plumbing touched, additively** ("both", CHK-020): the registries (`encounters.ts` unions and `Chapter.number` 33, `chapters-experiments.ts`, `chapter-meta.ts`), the door table row (`chapterDoors.ts`), the pyrefly canon, the tactics game table, the experiment scene table, `artNamespace.ts`, the critic route's door table; and the **optional-config seam on the ww3d modules** (`layout.ts` `WwStaging`, `model.ts`, `skin.ts`, `pose.ts`, `props.ts`, `toonify.ts`): every new parameter is optional and omitted it is the Wind Waker chapter's own constant. `docs/CONTRACT-CHANGES.md` has the entry.
- **New, in their own files:** `engine/ww3d/{cel,outline,faceMask,celify,animeLayout}.ts`, `scenes/exp-anime-stage.ts`, `data/{anime-ids,chapter-exp-anime,chapter-meta-exp-anime}.ts`, `app/screens/frontend/animeDoor.ts` (the word `gear`).
- **Picks (all "driver pick, his to overturn", Bailey's blanket words of 2026-10-31 and 2026-11-06):**

| # | Pick | Alternative |
|---|---|---|
| P1 | **Number 33**, the next free one (29 Keeper, 30 Maesters, 31 yrp, 32 waker) | any free number |
| P2 | **Word `gear`** (the survey's recommendation; passes the door rule against all fifteen words: `genshin` fails it, its last two letters begin `infinito`) | `guiltygear`, `genshingear`, `sumeru`, `ember` also pass; one constant in `animeDoor.ts` |
| P3 | **Title "Valefor at Besaid (Anime Style)"**: no trademark (the site is public); a working title | any title he writes; one string in `chapter-exp-anime.ts` |
| P4 | **Look default A (Genshin)**, with `?look=gg` and `?look=blend` as switches (the three looks are rows of one shader; he picks by playing, not from pictures) | default B or C; the default is one constant (`DEFAULT_CEL_LOOK`) |
| P5 | **Desktop only** (the door carries the `desktopOnly` gate, as `yrp` and `waker`: decision 219q) | list it for phones after a budget check |
| P6 | **Hidden**: no card, not in "of 19", not in the save, veteran check or play time | a card (needs a board painting; D-848) |
| P7 | **No new Meshy spend** (the plan needs none; the open cap question of the survey stays open) | 250 credits held for a Valefor rebuild or a full 7-head rebuild if the proportion pass fails |
| P8 | **M1 is "no proportion change"**: the girls stand at their own heights (about 5 heads), the temple is the Wind Waker stage stand-in, Valefor is `valefor-v2` scaled 1.43 | M2 (taller proportions, a retargeted idle, temple v2) waits for his eye on the look |

## 2. What could go wrong, and the net

| Risk | Net |
|---|---|
| The seam changes the Wind Waker chapter (it must stay byte-identical) | every new parameter is optional with today's constant as the default; `tests/unit/ww3d/staging.test.ts` pins every `WwStaging` field against its constant and each seam's default behaviour; the Wind Waker chapter's 15 ww3d suites and its 19 chapter tests are unchanged and green; the browser proof (that its pixels did not move) is job A4 below, owed |
| A hidden chapter leaks into a count (the board's "of 19", the veteran check, play time, the save) | `experimental: true`, not in `CHAPTERS` / `CHAPTER_IDS`; `exp-anime.test.ts`, `anime-door.test.ts`, `chapter-numbers.test.ts` |
| The word `gear` overlaps another door, latches a key into party prep, or breaks a neighbour | `chapter-doors.test.ts` (no begin/end/contain/suffix-prefix overlap over the whole table, 16 words) and `anime-door.test.ts` (the real `Input`, real board and title: G unbound, E start, A left, R r1; the word typed back to back with each other word); `r74-hidden-3d-phone-doors.test.ts` (shut on the phone tier) |
| A three.js upgrade moves a shader line the cel patch needs | `cel.test.ts` and `outline.test.ts` run the patches against three's own `ShaderLib` source; on a failed patch the material draws as the stock toon and logs |
| The cel figures draw differently under the game's post than the lab's standalone renderer did (bloom keeps the whole colour of a pixel above its threshold; the grade does not encode sRGB) | the cel keeps the toon's ceiling (`uToonCeil` 0.995) so only the glows bloom; the scene's palette is the Wind Waker one (`ownGrade`, neutral, encoding); the first GPU job measures luma and the lens lift (below) |
| The framing: the engine's CHAPTER FRAMING lifts the picture by about 0.04 of the frame; the lab had no engine | the idle rig is tipped 2.0 degrees further (2.0 / 49 = 0.04) and `anime-layout.test.ts` pins the lab's composition after the lift; job A2 measures it and says if the number is wrong (a prediction written first) |
| The outline hull of a skinned mesh shares the skeleton: a skeleton freed twice, a hull geometry leaked | `celify.test.ts` pins that `disposeToon` frees the hulls' own geometry and the shared skeleton once; the browser job A3 reads `renderer.info` after leaving and re-entering |
| The face mask is fitted to the girls as exported | `FACE_FIT` per girl (read off the lab's point-cloud previews); `face-mask.test.ts` pins the maths and the adapter; M2's proportion pass must re-fit it (said in the module header) |
| The same Meshy cast Bailey called "AI slop" (D-1130) under another shader | his 11-01 pick says yes; his eye in motion is still owed (PR-0618 for the waker cast); hidden behind a word, a miss costs nothing public; a miss means a written method check, not a third try (rule 15) |
| Layering (rule 1) | `src/battle/**` and `BattlePresenter*.ts` untouched; `ww3d` imports `three` and is imported by the scene (dynamically) only; the new pure modules (`animeLayout.ts`) import no DOM and no three |
| Orphans (rule 4) | `node tools/orphans.mjs`: 24 modules, all pre-existing, none new |
| Memory: three skinned 2048 px girls (64 MB of GPU texture) plus the Wind Waker kit | far under the Wind Waker chapter's 240 MB; job A5 measures |

## 3. Things the build found

- `fitFor('toString')` would have returned `Object.prototype.toString` (a table read by an id with `??`): the lookup now uses `hasOwnProperty` (caught by `face-mask.test.ts`).
- The Meshy toon girls' clips are `idle`, `attack`, `hit`, `cast`, `ko`, `walk`, `run` (no `victory`, no `idle_combat`): `roleClips` finds idle, attack, hit, cast and ko by name; `ko` makes `falls` true, so a downed girl lies down by her own clip and the skin does not tip her; with no victory clip a won fight leaves them in the stance. The head-bowed idle (about 30 degrees) is raised by the new optional pitch fix, not by a new clip (M2 retargets the Wind Waker chapter's upright idle).

## 4. What the deep review should look at (after the GPU smoke and Bailey's first look)

1. The board with the word typed; party prep; a fight to a win and a loss; clears and attempts land in the experiments' store and the save is byte-identical.
2. The picture at 1600x900 in the three looks against the survey's concept frames (A, B, C), the face (no blotches, no line across the eyes), the hair, the weapons, Valefor's wing flap and hull.
3. **Motion in clips** (his standing rule: rigs are judged in motion): the stance, an attack round, a cast, a hit, a knock-out, Valefor's three moves.
4. Memory, load time and disposal on leaving.
5. That nothing else changed: the Wind Waker chapter (A4), chapter 24 and the listed chapters draw their own pixels; the other doors still open.

## 5. Stop rule

Two failed attempts on one failure, or "AI slop / uncanny" again, means a written method check (the survey's section 6 milestones M2 and the 250-credit hold) before a third try.
