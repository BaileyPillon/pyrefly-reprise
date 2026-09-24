# Paper review: the target cursor opens on the sensible side (target-default)

AGENTS.md rule 15 / `critic/RUBRIC.md` §4. **Written late:** the build (167cd89d) went in
without this preflight, and the verifier called that a rule break. This is the same review,
written in the repair pass after the fact, so the next reviewer and Bailey can check the
reasoning. It does not claim the change was planned on paper first.

`node tools/critic-plan.mjs --paths src/battle/common/aim.ts,src/battle/common/types.ts,src/battle/ffx/commands.ts,src/battle/ffx2/aim.ts,src/battle/ffx2/targeting.ts,src/ui/ffx/TargetCursor.ts,src/ui/ffx/CommandMenu.ts,src/ui/ffx2/CommandMenu.ts`
answers **DEEP** (shared combat core, FFX CTB engine, FFX-2 ATB engine): a focused review
before any deploy, the deep review on the live build after it.

**Verdict: PROCEED as built**, with the repairs below. The judgement calls in §6 are
Bailey's to settle.

## 1. The complaint

Bailey, live build, 2026-09-24: "when i click an attack it defaults to targeting my party
member instead of the enemy so every time i have to move the targeting reticule to the enemy".

## 2. Game case (rule 14): both

The defect is in shared plumbing: both command menus open the cursor with
`TargetCursor.showSingle(entries, 0)`, the leftmost candidate on screen, and the party stands
on the left in both games. A `single-any` row lists both sides, so it opened on the party. In
FFX-2 that covers most skills (the four Breaks, Drain, Confuse, Break, Doom, Death, Cheap
Shot, Flametongue, Dispel). In FFX it covers Dispel and Copycat. Plain Attack is
`single-enemy` in both games and was never affected. The live crawl (real keys, every
unlocked chapter) shows this. The same rule applies in both games, so the case is both.

## 3. What the sources say

`research/ffx-combat-core.md`, `research/ffx2-combat-core.md` and
`research/ffx-vs-ffx2-presentation.md` do not say where the retail cursor opens. The rule
follows the standard Final Fantasy convention instead: an offensive command opens on an
enemy, a restorative or a buff opens on a party member, and a revive opens on a KO'd party
member first. **Unsourced**. §6 lists the rows where it is a real judgement call.

## 4. The change

- `src/battle/common/aim.ts` is pure: no DOM, no RNG, no `three` (rule 1). `aimSideOf(def)`
  returns the side, and `preferredTargetIds(def, targeting, userSide, candidates)` returns
  the subset of the legal candidates to open among. It returns nothing when that subset would
  not narrow the list.
- `AvailableCommand.preferredTargets?` is additive and optional, with an entry in
  CONTRACT-CHANGES (rule 2). It is a hint only: legality stays `validTargets`, and nothing in
  resolution, the AI or the simulations reads it. Deterministic replays and log hashes do not
  change (the full suite passes).
- Both engines fill it. FFX fills it in `ffx/commands.ts` (`withAim`). FFX-2 fills it in
  `ffx2/aim.ts` (`aimer`, one per `buildCommands` call).
- `TargetCursor.showSingle(entries, startAt, prefer?)` opens on the leftmost preferred entry.
  The arrows still walk every legal entry, and a mouse click still goes wherever it lands.

## 5. Risks and what answers each

| Risk | Answer |
|---|---|
| Cost: `buildCommands` runs about 100,000 times in a single FFX-2 simulation test file (counted) | The repair builds the id lookup once per menu, and only when a row can use it. Rows that are not single-target, or have fewer than two candidates, return at once. Measured per menu (bench in scratch): ch4 3.2 -> 1.8 us, ch5 7.2 -> 3.1 us, ch6 2.5 -> 1.7 us, against 10-16 us for the whole `buildCommands` |
| A preferred id the menu does not list | `showSingle` falls back to the leftmost entry (unit test) |
| A revive while a party member dies with the menu already open (Active mode, or Wait's top list under `?wait=split`) | Known limit: the hint is taken when the decision is made, so the cursor falls back to the leftmost entry, the same as live. `validTargets` goes stale in the same way |
| House rule 7 (files under 400 lines) | `TargetCursor.ts` 583 (was 584 before the change), `ffx/CommandMenu.ts` 889 (889), `types.ts` 2556 (2556), `ffx2/targeting.ts` 399. No over-cap file grows |

## 6. Judgement calls with no source (for Bailey)

These rows either say nothing about their effect or could reasonably open on either side.
Each one opens where the rule sends it today:

1. FFX **Dispel** and FFX-2 **Dispel** open on an enemy, because Dispel removes buffs.
2. FFX **Copycat** and FFX-2 **Mix** open on an enemy. Neither carries effect data, and an
   attack is the likelier aim.
3. FFX-2 **Esuna** and **Regen** (single-any) open on a party member.
4. FFX-2 **Scan**, **Mirror of Equity**, **Two Dice** and the **Reels** open on an enemy
   (no effect data).
5. FFX **Reflect** and FFX-2 **Hero Drink** open on a party member.
6. A revive opens on a KO'd party member. When nobody is down, it opens on the leftmost
   party member.

The question for Bailey is whether any of these should open on the other side. Until he
answers, these are inferred, not approved (rule 15 `inferred`).

## 7. Acceptance

- Real keys on the worktree build, every unlocked chapter: all 144 sampled rows open on the
  same targets as the verified first build. Power Break opens on Bahamut, Dispel on
  Yunalesca, Esuna on Yuna.
- `tests/unit/target-default-side-ffx.test.ts` and `target-default-side-ffx2.test.ts` pass,
  with the cursor, menu and cancel suites. `npx tsc --noEmit` passes, as does the full
  `npm test`.
