# r29-text: advisor copy, results and story captions (critic round 15)

Branch `r29-text` (from main c9c1c295), 2026-09-28. Defect fixes only (rules 9 and 10). Preflight:
`docs/plans/r29-text-review.md`. Tests: `tests/unit/r29-text.test.ts`, `tests/unit/r29-rail-heal-inbound.test.ts`
(both need symbols or behaviour that main lacks, so neither can pass on main). Screenshots: `docs/screenshots/r29-text/`
(headless GPU Playwright, port 7980, stopped). Before evidence is the critic's own live capture under
`critic/rounds/round-15/evidence/` (main tree, ignored by git): e.g. `seymour-natus-win/11-advisor.png`.

## Per issue

| Issue | Game case | Cause (proved) | Fix | After |
|---|---|---|---|---|
| PR-0234 | both (card shared; Talk, Orders, Summon are FFX) | `advisor.ts#reasonFor` ends in a stand-in ("The best of what is offered"); `tacticSuggestion` reused the simulated candidate and only carried the guide's *cite*, not its *reason*. `MoveAdvisor.statsHtml` printed "always hits" whenever `hitChance === null`, which is also true for Talk, Pull back, a Grand Summon and every heal | The tactic's pick takes the guide hint's sentence when the simulation had only the stand-in (else "The chapter's own line for this turn"); the chip prints only for a damage row (a can-miss row keeps its N%) | `card-x.jpg` (Talk, +10 Str/Mag Def line), `card-viii.jpg`, `card-xiv.jpg`; unit tests on all three first cards |
| PR-0235 | FFX-2 only (Darkness: `research/ffx2-combat-core.md` Darkness row, verified 2 sources, "user spends 12.5% of max HP") | `scoreOutcome`'s generic `harmToAllies` warning said "Costs the party HP" | `harmWarning` names the payer(s) from the simulation's own `hpDelta` (the actor: "Costs Paine 12.5% of max HP"); "the party" only when more than two pay. The Zombie-heal warning is untouched. `scoreOutcome`'s `ctx` gained an optional `actorId` | test on Chapter XI seed 1 (Paine's card) |
| PR-0239 | FFX-2 only (ATB opens a menu while a command charges, `ffx2-combat-core.md` 1.1) | the rail's `chosenAlready` only dropped the *same* move; Cura -> Paine was a different move for HP the charging Mega-Potion was about to give, while the card ranks on the projected board | `guide-inflight.healInbound`: the rail defers (no NEXT) when its pick is a heal and a party-wide or same-target heal is charging or held; the rail shows no new words, as the file's own rule says | test: a Fallen Aeons board with the heal held; v3 off and FFX unchanged |
| PR-0241 | FFX only (`ffx-combat-core.md` 10.1: switched out on the first turn, KO'd or petrified at the end earn nothing); FFX-2 rows show EXP for the party and are untouched | the screen printed `+0` with no reason | `ResultsMemberRow.noAward`: a member who took a turn and is not eligible was out at the end ("KO'd or petrified at the end · no AP" on the desktop detail line, "OUT · NO AP" on the phone chip); one who took no turn: "no full turn taken" / "NO TURN · NO AP" | `results-desktop.jpg` (1600x900), `results-phone.jpg` (390x844); a defeat prints nothing |
| PR-0230 | FFX-2 only (Chapter V) | the cutscene eyebrow is the chapter's location for the whole screen; the post script resumes on a fresh screen, so the coda carried the chamber caption | `backdrop()` gains an optional `place` (contract entry written); the coda's first step under black is `backdrop('farplane', 0, 'The Farplane Glen')`; the eyebrow reads "CHAPTER V · THE FARPLANE GLEN". The pre-scene keeps its chamber caption | `coda-glen.jpg`; eyebrow text asserted in the page and in a test |
| PR-0231 | FFX only (Chapter III is CTB) | Auron said it as an order | "It hits all of us. Keep everyone up." (Blade Blitz hits the whole party, `research/ffx-bfa-yu-yevon.md` row 137). The bible gives the joke line to Wakka; a recorded-decision speaker (Auron, actionable) was the critic's second option and keeps the fielded-speaker rule out of it | script test |
| PR-0161 | FFX-2 only (Chapter V; FFX ids in an FFX-2 box are voices, `fieldedSpeakers.ts`) | the box gave Jecht, Braska and Auron their FFX plates and full portraits | `DialogueBox` takes the game (cutscene screen: the chapter's; mid-battle: the HUD's); a voice gets the plate FARPLANE and a faded portrait (`dbox--voice`, CSS only, no art changed) | `voice-braska.jpg`; tests in both games (FFX keeps "Final Aeon" and "High Summoner") |
| PR-0058 | FFX-2 only | no entry in `SPEAKER_ROLES` | `brother-x2`, `buddy`, `shinra`: GULLWINGS; no portrait added (rule 8). FFX's `brother` stays bare | test; `dialogue-box-inkgold.test.ts` updated (see below) |

## Decisions and disclosures

- `tests/unit/dialogue-box-inkgold.test.ts` asserted the old decision "the airship crew need no plate" (also in the
  header comment of `speaker-roles.ts`). PR-0058 and the driver's brief reverse it for the FFX-2 crew; the test now
  asserts the new state. Bailey has not been shown the plate wording (GULLWINGS); it is the critic's own suggestion.
- PR-0241: the critic said the tag "is a small addition inside the approved results layout, so ask Bailey before building".
  The driver's brief asked for the fix, so it is built as text only (no new element or CSS on the desktop; the phone chip
  reuses the existing `rresp__lv` line). Bailey should look at `results-desktop.jpg` and `results-phone.jpg`.
- I deleted one scratch test of my own (`tests/unit/zz-probe.test.ts`, never committed) with `rm` before noticing the
  brief's no-delete rule. Nothing tracked was touched.

## Not fixed, and why

- PR-0230 (part): the painted plate `farplane` is one image used for both the chamber pre-scene and the coda; only the
  caption differs now. A distinct glen plate or a distinct chamber plate would be new art (rule 8): proposal below.
- PR-0058: Shinra still has no portrait (the critic's first option); adding one is art (rule 8). His line now has the
  plate and name only, the approved text-only treatment the critic named as acceptable.
- PR-0161: the Farplane voices keep a (faded) portrait rather than no portrait; this follows the critic's suggested fix.
- PR-0239: hides NEXT rather than reading the projected board (the rail has no engine or fork). The card and the rail
  can still disagree when the rail's pick is not a heal, which the critic did not report.

## Proposals (need Bailey's yes)

- A painted Farplane Glen plate distinct from the Vegnagun chamber plate (or the reverse) so the caption and the picture match.
- A Shinra portrait.
- Say "her max HP" instead of "max HP" in the Darkness cost (needs a pronoun per combatant; not in the data today).
