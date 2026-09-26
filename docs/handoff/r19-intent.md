# r19-intent: the enemy intent says what it knows and what it does not

Round 13 deep review, fix group "intent": PR-0153, PR-0123 and PR-0207. Branch
`r19-intent`, one commit per issue. Bug fixes to existing behaviour: no new
screen, no boss number, no art.

## What changed

| Issue | Game case | Fix |
|---|---|---|
| PR-0153 (stalled) | both | A rolled victim is measured, not guessed. `src/battle/common/intentTargets.ts` compares the dry-run samples that rolled the named move on their target, and treats a `random-enemy`/`random-ally` record (and the row a Yojimbo order hands to Daigoro) as random by definition. Every candidate is estimated on its own: both `simulate.ts` preview RNGs take an optional `aim`. The results go into `EnemyIntent.randomTarget`, which the panel renders as "Damage · random target" with a lethal flag per row. The phone strip shows every candidate. `estimate` (what the advisor reads) is unchanged. |
| PR-0123 (stalled) | FFX-2 cast; both games for the badge | `predictFFX2EnemyIntent` reports a command already on the purple charge bar (`atb.charging`) as the move, SCRIPTED. Chapter V link 5's first menu opens while Shuyin's Terror of Zanarkand is mid-cast, so the headline and the guide's WATCH line now agree. Both predictors mark the rolled branch (`rolled: true`), and the badge reads that branch's own percent. |
| PR-0207 | both | The phone strip no longer hides `.eint__conf`: "Kick MOST LIKELY 58%" / "SCRIPTED" ride the line, and the Odds table stays desktop-only. |

## Why the earlier attempts did not hold (rule 15 method check)

- PR-0123: round 09's badge fix matched the branch by label. Its test fed the
  panel a hand-built view spelt "No action", but the engine spells the pass
  "no action", so the live badge still fell back to the top branch. That fix
  also never saw that link 5's first menu opens with the move already
  committed. The new test drives the real chain to the real menu and reads the
  rendered panel.
- PR-0153: rounds 11 and 12 traced the cause (the tally ignores targets) but
  nothing measured the target. The target is now sampled like the move.

## Evidence

- Unit: `tests/unit/intent-random-target.test.ts` (Ch I, VIII, IX, XI through
  the real engines), `tests/unit/intent-committed-cast.test.ts` (link 5,
  engine to panel), `tests/unit/ui-enemy-intent-honesty.test.ts` (panel and
  phone CSS).
- Browser: a production build, PYREFLY_BROWSER=gpu, real E key, at 1600x900
  and 390x844. Screenshots in `docs/screenshots/r19-intent/`, with the read-outs
  in `check-*.json`.

## Open / for the next agent

- Reaching link 5 by `autoBattle('intended')` in the browser failed at link 1
  (the Tail) on several of the runs. The same strategy through the engine wins
  the whole chain on seeds 1 to 24, with and without the PR-0123 change. It is
  the browser flow's real-time ATB, not this change. This is the known
  "Chapter V by real keys" issue.
- The advisor still reads `estimate` (the single sampled victim) for a
  random-target move. Teaching it `randomTarget` would change tactics, so it
  is left for a separate, measured change.
