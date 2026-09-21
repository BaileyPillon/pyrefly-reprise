# Handoff — Chapter 6 story script: the Leblanc Syndicate (FFX-2)

> **Track F of `docs/plans/chapter-leblanc-review.md` §8.** Written 2026-09-21.
> **Game case: FFX-2 only** (AGENTS.md rule 14). Every speaker, cue and beat is
> FFX-2's; the test file carries the absence assertions (no FFX speaker, no FFX
> boss id, no FFX music cue anywhere in the chapter).
>
> **Status: written, green, and deliberately registered nowhere.** An integrator
> wires it (track I). `node tools/orphans.mjs` will report
> `src/story/scripts/ffx2-leblanc.ts` as an orphan until then — that is expected
> and is the point of hard rule 4's check, not a defect.

## Files

| File | What it is |
|---|---|
| `src/story/scripts/ffx2-leblanc.ts` | The chapter's `pre`, `post`, six mid-battle triggers, six `midScripts`, and a full `victoryQuips` bank. Exports `ffx2LeblancScripts`, `LEBLANC_COMBATANT_IDS`, `LEBLANC_ABILITY_IDS`. |
| `tests/unit/story-ffx2-leblanc.test.ts` | 28 tests: house style, structure and trigger wiring, the present-cast check, canon beat order, and the FFX-2-only absence test. |

Verified: `npx vitest run tests/unit/story-ffx2-leblanc.test.ts` — 28/28 green.
`npx tsc --noEmit` reports nothing in either file.

## Sources

- Beats and voices: `research/ffx2-leblanc-syndicate.md` §9.2 (beats 3–15), §9.3
  (Leblanc / Logos / Ormi voice notes and their `[ORIGINAL]` sample lines), §9.4
  (the three prohibitions), §10.3 (the four cues).
- Register and caps: `research/writing-bible.md` §1.14–1.16 (YRP), §2.2 (FFX-2
  cutscene grammar), §2.1 (60-character cap, the reaction-shot beat, callback
  with variation), §5.4 (victory quips), §0.3 (the Chapter 2 knowledge state).
- Staging: `docs/plans/chapter-leblanc-review.md` §7 and §5 Q7.
- Pattern: `src/story/scripts/ffx2-bahamut.ts` read end to end.

**No transcripts.** Every line is original. Three lines are close cousins of the
research's own `[ORIGINAL]` samples, which §9.3 marks as safe to use: Ormi's
"That's — no. No! That's cheating, that is!", Leblanc's "Oh, don't gloat, pet.
You'll crease." and "Fine. Take it. I'd memorised the good part anyway."

## The beats, in order

### Pre-battle (§9.2 beats 3 → 7)

| Beat | What happens | Speakers |
|---|---|---|
| 3 | In the front door in stolen Syndicate pink. Nobody looks twice. Rikku sets up, Paine kills it. | R, P, Y |
| 4 | Logos and Ormi assign the new "goons" their duties — and Yuna is sent to massage the boss. | Logos, Ormi, Y, R, P |
| 5 | **The massage.** Yuna's most undignified scene in either game, played entirely for comedy. Leblanc falls asleep mid-complaint. | Leblanc, Y, then P and R |
| 6 | Sent to check the switch to the underground. | Logos, Ormi, R |
| 7 | **Brother on the comm at full volume.** Rikku shushes, he gets louder, Ormi hears it. Cover blown. | Brother, R, Y, Ormi, P |

`pre` ends `music('boss-leblanc') → battleStart()`. Brother is the only speaker
who is not physically in the room; he is on the comm, which is beat 7 itself.

### Post-battle (§9.2 beats 13 → 15)

The flourish is **restored** — this chapter is the tonal inverse of Chapter 4
(§10.3's "contract with the Bahamut chapter", preflight §5 Q7). `camera('victory')`,
poses, `results(false)`, a full quip bank.

| Beat | What happens |
|---|---|
| — | Victory pose, fanfare, tally. Rikku gloats; Paine deflates her. |
| 13 | Leblanc hands over the reassembled sphere rather than lose a fourth time. Annoyed, never broken, keeps the last word. |
| 14 | **The joke stops.** `music('scene-disquiet')`, the sphere plays, and all six watch Vegnagun. No exclamation marks, no quips, one unanswered question, then Paine: "Something woke it up." |
| 15 | The truce. Leblanc's reason surfaces obliquely; Ormi nearly says "Noo—" and Logos stops him. Closes on Rikku/Paine's callback to the beat-3 pink line. |

## Where each mid-battle line fires

Six triggers. All `once: true`, `id === script`, every `say` carries an `auto`.
They key off `LEBLANC_COMBATANT_IDS` and `LEBLANC_ABILITY_IDS`, declared at the
top of the script file so the data owner can rename in one place.

| Trigger id | Condition | Fires when | Kind |
|---|---|---|---|
| `act-one-cleared` | `ko` of `ormi-act1` | Act I ends. Logos' room: a dud sphere and **Crimson Sphere 10**. Paine shuts it off and explains nothing. | **chain seam** |
| `act-two-cleared` | `ko` of `logos-act2` | Act II ends. The treasure room: their half-sphere and Leblanc's matching half beside it. | **chain seam** |
| `first-not-so-mighty-guard` | `ability-used` `leblanc` / `x2-lb-not-so-mighty-guard` | Her turn 1. The teaching beat: three layers, ignore them and the fight doubles. Rikku names Dispel. | in-fight |
| `first-no-love-lost` | `ability-used` `leblanc` / `x2-nll-1` | Her 3rd turn, both henchmen alive. The combo announces itself, badly. | in-fight |
| `logos-down` | `ko` of `logos` | Act III. Leblanc notices the routine is gone — the fight teaching its own target priority out loud (§5.4). | in-fight |
| `ormi-down` | `ko` of `ormi` | Act III. Her one unexplained kindness to a stray (§9.3, "the seam"). Short, late, uncommented. | in-fight |

**Budgets.** The four in-fight beats are each under `MID_SCRIPT_BUDGET_MS` (8 s);
the test asserts it. The two seams run longer and the test checks them against
`SEAM_BUDGET_MS` (26 s), so **the integrator must add `act-one-cleared` and
`act-two-cleared` to `CHAIN_SEAMS['ffx2-leblanc']` in `src/story/registry.ts`**
or the presenter will abandon them mid-sentence.

## What the integrator still owes

1. `CHAPTERS` / `ChapterId` / `AI_EMITTED_TRIGGERS` / `CHAIN_SEAMS` entries; add
   this chapter to `tests/unit/story-scripts.test.ts`'s `CHAPTERS` list too.
2. **Three music cues that do not exist yet**, named exactly as the preflight §6
   names them: `scene-chateau-leblanc`, `boss-leblanc`, `scene-disquiet`. They
   are placeholders in the script. `tests/unit/audio-story-cues.test.ts` will
   fail the moment the chapter is registered and before the tracks land — that
   is the intended tripwire.
3. Reconcile `LEBLANC_COMBATANT_IDS` with the enemy data files (track C) and
   `LEBLANC_ABILITY_IDS` with the ability files. **The ids in this file are the
   script agent's proposal, not data.**
4. Every `sfx()` and `fx()` key used here already exists (`machina-groan`,
   `pyrefly-memory`), so nothing is owed on that side.

## The three lines I am least sure of — Bailey, please read these

1. **`post`, the truce: "Someone I am fond of is down there."**
   §9.3 says Leblanc's reason for all of this "surfaces obliquely — she does all
   of this for Nooj", and that she has a private pet name for him she uses in
   public without embarrassment. I did **not** invent the pet name (no source
   gives one I could use without transcribing), so she gets a flat, plain line
   and Ormi nearly blurts the name instead. It may be *too* plain for her
   register. The alternative is to let her use the pet name and accept an
   authored coinage.

2. **The running order of the post-battle flourish.** The preflight §7 lists the
   victory pose and fanfare *last* in the aftermath; I put the pose, fanfare and
   `results(false)` **first**, then the sphere, Vegnagun and the truce. My
   reason: the tally landing after `scene-disquiet` would flatten beat 14, which
   §9.2 calls the hinge of the whole plot. If you want the preflight's literal
   order instead, it is a two-line move.

3. **Yuna's "...Yes, ma'am." in the massage.** §1.14 says FFX-2 Yuna apologises
   far less than she used to and that tracking it is her arc, and §9.3 says the
   massage is her best joke. A meek deferential line is the funniest read, but
   it is also the FFX Yuna reflex the sequel is supposed to be walking away
   from. The alternative is to let the performance crack — a flat, slightly
   dangerous "Yes. Ma'am." — which is funnier but less in-period for Chapter 2.

## Two smaller judgement calls, recorded

- **Beat 9 (Crimson Sphere 10) names nothing.** Paine says "Turn it off" twice
  and no one says *Crimson*, *Squad* or *Den of Woe* — `writing-bible` §0.3 puts
  her reckoning chapters later. The test asserts that absence.
- **Both henchmen falling get their own beat.** The preflight names one trigger
  ("either henchman falling"); Leblanc does not say the same thing about the two
  of them, and Ormi-alone is the A2 teaching trap, so I wrote two.
