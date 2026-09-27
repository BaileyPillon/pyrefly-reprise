# OWNER-VERDICT — what Bailey has actually said about the audio

No agent on this project can hear. Every quality judgement we make is indirect:
craft rules in [`THEMES.md`](THEMES.md), measurement in
[`PIPELINE.md`](PIPELINE.md), and — the only one that finally counts — the
owner's ear. This file is the record of that ear, quoted exactly, so that a
later agent reasons from what Bailey said and not from what a summary of a
summary claimed he said.

**Rules for this file.** Verdicts are quoted **verbatim**, dated, and paired
with the build they were given about. Nothing is paraphrased, softened or
merged. Nothing is deleted when it is superseded — a superseded verdict gets a
note saying what replaced it, because the shape of the change is itself
information. If you did not hear the words from Bailey yourself, do not add a
row.

---

## 2026-09-27 ~00:50 EDT — the direction pack (D:/Tools/pyrefly-scratch/audio-pack-0926/): Direction B is the only one that sounds good

Bailey, in chat, answering the driver's question about tracks 5 to 8 of the
2026-09-26 listening pack ("5 control today's sound, 6 A real orchestral
samples, 7 B an AI restyle, 8 C today plus choir and strings. Tell me which
sounds least like SNES, and whether the AI restyle may ship"), verbatim:

> 7 is the only one that sounds good to me.

**This is an ear verdict.** Bailey heard all four 12-second clips
(`05-direction-control-battle-ffx.mp3` through `08-direction-c-layers.mp3`,
the round-1 comparison set `public/audio/candidates/C-round1-battle-ffx-{current,A,B,C}-x12.ogg`
presented in `docs/audio/audition.html`) and picked track 7,
`07-direction-b-acestep.mp3` — Direction B, the ACE-Step AI restyle
(`tools/audio/ace-step.mjs --mode=restyle`, the shipped renderer's output
re-styled by ACE-Step v1 3.5B at a denoise below 1.0, same notes and timing,
only the sound moved). This answers pack.md's question 2 two ways at once:
Direction B is the only one of control / A / B / C that sounds good to him,
which both picks the direction and — by picking the AI restyle specifically —
answers "may the AI-restyle layers ship?" in favour of shipping them. Recorded
as D-235 in `docs/target/decisions.json`. Each cue actually re-rendered in this
direction still needs Bailey's ear before it ships; this verdict covers the
12-second comparison clip, not a finished cue.

Question 1 of the same pack (a number out of 10 for today's music, tracks 1-4)
is **still unanswered** beyond the separate ~00:40 EDT verdict below ("still
sounds like snes music," which named no number). Question 3 (Macalania A / B
/ C, tracks 9-11) is **still unanswered**.

Bailey also said, in the same message: "also you can download whatever you
need but on the D: drive you have my permission" — standing permission to
download onto D: (not C:) from official/reputable sources for this work,
recorded as D-236 in `docs/target/decisions.json`.

---

## 2026-09-27 ~00:40 EDT — the live mix (release 21, d8837334): "still sounds like snes music"

Bailey, in chat, about the game as it plays live (release 21, bundle DlL4YDmM), verbatim:

> the game muisic still sounds like snes music...

This **is** an ear verdict on the shipped mix, the first since 2026-09-21's
"too reminiscent of SNES music", and it says the sampler rebuild has not escaped
that sound yet. It gives no number out of 10, so CHK-B1 still has no score and
audio stays UNVERIFIED in the critic's total. It came before he had listened to
the 2026-09-26 direction pack (`D:/Tools/pyrefly-scratch/audio-pack-0926/`,
tracks 05-08: control, A real orchestral samples, B ACE-Step restyle, C today
plus choir and strings), which is the question that picks the re-render
direction. PR-0148 stays open and is now owner-confirmed.

---

## 2026-09-24 — Yojimbo (Chapter IX) battle music O-6: accepted on recommendation, not by ear

Bailey answered five items sent together, about 13:35 EDT:

> All your recommendations

**This is not an ear verdict on either O-6 sketch.** He had the MP3 files
themselves (`docs/audio/sketches/2026-09-24/yojimbo-a-summoners-sorrow.mp3`
and the second Lulu's-Theme-derived sketch) — unlike the Macalania pick below,
nothing was withheld from him — but he gave no score, and the driver told him
plainly it cannot hear (AGENTS.md hard rule 13). **No agent can hear**, so
this file's own rule holds: do not record this as "approved", "passing" or
any numeric score. CHK-B1 (audio judged by ear) stays **unverified** for this
cue, whether or not Bailey played the files himself.

What this applies to: the O-6 battle-music pick for Chapter IX (Lady Ginnem's
Yojimbo) only — sketch A, "The Summoner's Sorrow," not a finished, composed
or wired cue. Recorded in `docs/target/decisions.json` as D-063.

---

## 2026-09-24 — Chapter VII (Macalania) battle mood: accepted on recommendation, not by ear

Bailey answered the driver's recommendations together, about 00:30 EDT:

> All your recommendations

**This is not an ear verdict on either Macalania sketch.** He had both mood
sketches (`docs/audio/sketches/2026-09-21/macalania-a-court-dance.mp3` and
`-b-processional.mp3`) since 2026-09-23 about 12:46 EDT but gave no score
before accepting mood A, "The Courtesy," on the driver's recommendation — the
driver told him plainly it could not hear the sketches either. **No agent can
hear** (AGENTS.md hard rule 13), so this file's own rule holds: do not record
this as "approved", "passing" or any numeric score. CHK-B1 (audio judged by
ear) stays **unverified** for this cue.

What this applies to: the battle-mood pick for Chapter VII (Seymour, the Guado
Guardians, Macalania Temple) only — the sketch's mood, not a finished,
composed or wired cue. Recorded in `docs/target/decisions.json` as D-048.

---

## 2026-09-23 — Chapter VIII (Evrae) cues: accepted on recommendation, not by ear

Bailey answered the driver's three Chapter VIII recommendations (title, art,
music) together, about 19:15 EDT:

> I'll go with your recommendations let's get to work

**This is not an ear verdict on scene-fahrenheit or boss-evrae.** He did not
listen to the cues and judge them; he accepted the driver's recommendation
that the chapter's own two composed cues (`src/audio/tracks/scene-fahrenheit.ts`,
`src/audio/tracks/boss-evrae.ts`) ship in place of the Chapter 1 stand-ins
(scene-gagazet, boss-seymour). **No agent can hear** (AGENTS.md hard rule 13),
so this file's own rule holds: do not record this as "approved", "passing" or
any numeric score. CHK-B1 (audio judged by ear) stays **unverified** for these
two cues. The aftermath's scripted silence from beat 9 is unchanged by this
acceptance.

What this applies to: Chapter VIII (the Evrae airship encounter) only.
Recorded in `docs/target/decisions.json` as D-039.

---

## 2026-09-19 — the rebuilt, sampled audio

Asked whether the new music and sound effects are right, Bailey answered:

> Right direction, keep refining

**No numeric score was given.** Do not invent one, and do not record this
anywhere as "7/10", "passing", "approved" or "signed off". It is a direction
check that came back positive and an instruction to continue; it is not an
acceptance of the current mix.

What this verdict applies to: the offline-rendered score — 21 music cues and
134 effects written as TypeScript and played through sampled instruments
(`tools/audio/*`, `public/audio/**`, `src/audio/**`). It is the first verdict
given on sampled audio at all.

The standing bar it is measured against is unchanged:

> the music and sound effects need to be beautiful and capture the very essence
> and soul of final fantasy x / clair obscur: expedition 33

"Keep refining" therefore points at the open craft work, not at a rewrite: the
tempo map and rubato, the appoggiatura and velocity-shape rules, the per-cue
performance overrides, and the cue-to-scene wiring that decides whether a cue
is ever heard at all.

---

## 2026-09-18 — superseded

The earlier verdict that the audio was **"too arcade-y"** was given about the
**old, fully synthesised** audio, before the sampler pipeline existed. It is
superseded by the 2026-09-19 verdict above and must not be quoted as a current
criticism of the shipped score. It stays here because it names the failure mode
the sampled rebuild was built to escape, and a later cue that drifts back
toward bright synthetic timbres and mechanical, unshaped velocities is drifting
back toward it.
