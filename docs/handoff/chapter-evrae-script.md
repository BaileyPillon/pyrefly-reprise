# Chapter — Evrae, on the deck of the *Fahrenheit* (FFX): the story script

**Game case: FFX only** [AGENTS.md rule 14]. `research/ffx-evrae-airship.md` §0.4
fences the whole encounter in — the airship distance mechanic "has no X-2
counterpart" — and the cast is FFX's, at a point in FFX's story: the survivors of
Home, on the approach to Bevelle, without Yuna. No FFX-2 speaker, ability, cue or
chapter is touched. The absence test is the last describe block of
`tests/unit/chapters/evrae-script.test.ts`.

Written to `docs/plans/chapter-evrae-review.md` §7 (which is
`research/ffx-evrae-airship.md` §12.4 / §12.5, `[verified: 2 sources]` for beats
1, 2, 4, 5, 8, 9, 10, 11) in the house style of `research/writing-bible.md` §1
and §2.1. **Every line is original** [rule 8]; no transcript, no guide prose.
Auron's canonical five-word remark about the wyrm (§12.2) is deliberately **not**
reused — only its register is, which is what the research itself asks for.

## Files

| File | What |
|---|---|
| `src/story/scripts/evrae-airship.ts` | `pre`, `mid` + `midScripts`, `post`, `victoryQuips` |
| `tests/unit/chapters/evrae-script.test.ts` | 34 units: style, cast, beat order, wiring, absence |
| `src/story/dsl.ts` | **one additive line**: `SpeakerId` gains `'cid'` |
| `docs/CONTRACT-CHANGES.md` | the entry for that line (hard rule 2) |

**Not registered anywhere.** `src/story/registry.ts`, `src/data/encounters.ts`,
`chapter-meta.ts`, `scenes/index.ts`, `tactics/index.ts`, `guides/index.ts`,
`audio/tracks/index.ts` are the integrator's single commit
[`docs/handoff/chapter-evrae-engine.md`, "Owed to other tracks"], so
`node tools/orphans.mjs` listing this file is expected — it sits exactly where
`src/engine/tactics/evrae.ts` sits.

## Who is on the deck

Present: **Tidus, Wakka, Lulu, Kimahri, Auron, Rikku** (three active, three
benched — `fahrenheitBuild`), plus **Cid** and **Brother** over the comms.
Absent: **Yuna**, who is in Bevelle (§9.1), and therefore **Seymour**.

Her absence is the chapter, so she has no line here — and the test enforces it
two ways: every `say.who` must be in the present set, and every guardian who
speaks must be a member of `fahrenheitBuild`. That is the check the critic's
absent-speaker finding elsewhere asks for.

**Post beat 11, the wedding, is staged as narration rather than dialogue.** Yuna
is on the tower, Seymour is beside her and the guardians are not in that room
yet. Giving either of them a line would break the same rule the rest of the file
obeys, so the beat plays as three lines of Tidus's retrospective register over
black [writing-bible §1.2 template, §2.1 narration interlude]. If the owner wants
the wedding voiced, it should be its own scene with its own options round, not a
tail on this one.

## The beats

### Pre-battle (§7 beats 1–7)

| # | Beat | Where, in the file |
|---|---|---|
| 1 | Home is gone; a thousand-year-old ship flies anyway | Wakka / Rikku / Lulu, opening on engine noise. **No narration first** — §2.1 places an interlude after an emotional high |
| 2 | Brother finds Yuna; Cid turns the ship | Brother's shout, Rikku carrying it across, Cid's two lines. §1.17's guardrail: **one** short, unfunny line of real fear (`She is in there alone.`), then straight back to ridiculous |
| 3 | **The thesis, once:** no summoner, so nobody heals | Lulu, over a silence nobody fills. Rikku's potions are the only answer anyone has |
| 4 | Bevelle over the cloud line | A slow `camera('idle', 2200)`; Wakka's awe, Kimahri's five words |
| 5 | It was already up here | Lulu names the cold fact: not scrambling, waiting |
| 6 | Auron names it, dry | Two fragments and a `Hmph.` Register, never the line |
| 7 | **Cid's one-line tutorial** | Move the ship *or* fire, never both. `battleStart()` immediately after |

`pre` ends on `battleStart()` and contains exactly one of them.

### Mid-battle — where each line fires

Every `say` carries an explicit `auto`; every script is inside the presenter's
8 s budget; `id === script` for all five [`src/story/registry.ts`].

| Trigger id | Fires on | The beat |
|---|---|---|
| `evrae-first-inhale` | `ability-used` `evrae` / `evrae-inhale` | Wakka points at the throat, Auron gives the instruction. **Teaches the dodge without naming a button** |
| `evrae-out-of-breath` | `ability-used` `evrae` / `evrae-out-of-breath-range` | The celebration. Rikku is delighted; Lulu says *the distance* did it, so the player learns what actually worked. Once, warmly, never again |
| `evrae-haste-phase` | `hp-below` `evrae` at `1/3` (10,666 of 32,000) | Phase 2. Tidus asks why it is faster; Auron answers that it stopped guarding |
| `evrae-first-petrify` | `status-applied` `tidus` / `petrify` | Rikku is right on a technical point (§1.15's guardrail): **Al Bhed Potion**, the one thing between a petrify and a Swooping Scythe shatter |
| `cid-first-volley` | `ability-used` `cid` / `cid-guided-missiles` | The missile economy, said out loud once, on the first volley |

**Two beats the preflight asks for are not wireable today**, and both are owed to
another track rather than faked here:

1. **"Out of ammunition."** The engine writes `Cid is out of missiles` as a
   `message` event (`src/battle/ffx/ai/evrae.ts`), and `TriggerCondition`
   (`src/battle/common/types.ts`) has no message or flag condition — its eight
   cases are hp-below, form-change, status-applied, turn, ability-used, ko,
   overdrive, charge-started. Adding one is a **contract change and the engine
   owner's call**, not a writer's, so `cid-first-volley` carries the ammunition
   idea at the other end of the clip and the empty turns stay silent, which is
   what §7 wanted from the silence anyway.
2. **The first shatter.** A shatter is a death *by* petrify and `status-applied`
   needs a named `who`, so a "first member lost" beat would have to guess which
   guardian. `evrae-first-petrify` is the same lesson one step earlier and can
   actually fire.

### Post-battle (§7 beats 8–11)

| # | Beat | Where |
|---|---|---|
| — | `results()` first, then the chapter keeps going and gets worse | Non-silent: Chapter 4 is the anthology's only silent card [§5.4] |
| 8 | It falls out of the sky | Wakka's `It just... dropped.`, Kimahri's eight words, Auron's `No.` — anticlimax, deliberately |
| 9 | Bevelle's own guns open up | Cid, twice. The victory is revoked inside a minute |
| 10 | Tidus goes down the chains alone | Climax rule: understate, one unguarded line (`Yeah.`), cut within two. Wakka gets the last of it |
| 11 | The wedding | Three narration lines over black, past tense, ending on what he believed at the time and was wrong about |

Victory quips: §5.4's register, six members, ≤10 words each. Lulu carries §1.4's
joke — the thing drops **Stone Ward** armour, the counter to its own Stone Gaze,
*after* the fight.

## Music

`music()` steps use only the two cue ids the preflight reserves and the test pins
that: **`scene-fahrenheit`** (new; §6 — no airship cue exists) and
**`boss-evrae`** (new; §12.6, the `MusicKey` the engine handoff reserves).
Neither is routed: `src/audio/tracks/index.ts` and `docs/audio/THEMES.md` are the
integrator's. `sfx()` keys (`airship-engine-loop`, `comm-click`, `wind-gust`,
`wyrm-fall`, `cannon-report`) are likewise unrouted requests, not promises —
`SfxKey` is a bare `string`.

## The three lines I am least sure of — for the owner to read

1. **Brother speaking English at all.** In FFX, Brother speaks Al Bhed and Rikku
   translates; he does not speak English until FFX-2. I wrote his three lines in
   English with Rikku carrying the first one across (`He says Bevelle. He says
   within the hour.`), because the DSL has no `[ALBHED]` marker and the writing
   bible's implementation note (§1.8) puts the cipher on Rikku's lines, not his.
   **Options if you want it stricter:** tag his lines for the enciphering pass
   and let Rikku's translations carry the meaning, or cut him to the one terror
   line and give beat 2 to Cid. Say which and it is a ten-minute change.
2. **Rikku calling Cid `Pops`** (`Pops! Just keep us in the air!`, the last line
   before the battle). I believe this is how she addresses him, but I did not
   find it in `research/*.md`, so under rule 6 it is my memory, not a source.
   Safe replacements that need no research: `Dad!` or simply `Cid!`.
3. **Kimahri's `It was told to stand there. It stood.`** (post beat 8). It is
   eight words, concrete, no metaphor — correct for §1.7 — and it is the
   chapter's doorman thesis. But §1.0 rule 3 says **only villains may state the
   theme aloud**, and this sits right on that line. The flat alternative is
   `It fell. It does not get up.`, which keeps the voice and drops the argument.

## Open questions for Bailey

- **A scene tag.** The bible's §3 has no E-tag for this chapter (preflight Q12).
  I used **E8** in the file header, after E7; §4's banter-bank suitability cells
  have no E8 column yet, so nothing depends on it and it is cheap to renumber.
- **Should the wedding be voiced?** See above — it is narration today.
- **The out-of-ammunition beat** needs either a new `TriggerCondition` or the
  engine emitting an ability row for the empty turn. Whose call?

## How to run it

```
npx vitest run tests/unit/chapters/evrae-script.test.ts   # 34 units
npx vitest run tests/unit/story-scripts.test.ts tests/unit/story-triggers.test.ts
npx tsc --noEmit
```

## Verified

`npx tsc --noEmit` clean. The 34 units above pass, and the five shipped
chapters' own story suites (92 units) still pass with `'cid'` added to
`SpeakerId`.
