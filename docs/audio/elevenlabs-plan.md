# ElevenLabs plan: original voice-overs and original music

Groundwork, written 2026-10-07 for the driver. Bailey, 2026-10-07 about 01:05 EDT, verbatim: "For music voice overs use Eleven Labs please. We need this really bad."
This is the plan he asked for; it is **not** a build. Nothing was bought, installed, generated or sent; **no account was made, no key exists and the ElevenLabs API was never called**.
No game code changed: this branch (`elevenlabs-groundwork`, from `origin/main` c745566a) holds docs and tools only.

**Game case (rule 14): both.** Chapters 1 to 3, 7 to 10, 12, 14, 17 and 18 are FFX; chapters 4 to 6, 11, 13, 15 and 16 are FFX-2; the hidden Leblanc chapter (branch `exp-leblanc`,
FFX-2) plays Chapter 6's script by reference, so Chapter 6's voices are its voices. Every line, voice and cue below names its game, and a choice made for one game is not assumed for the other.

## 1. The goal

1. **Voice-overs for the story and the battle quips:** 973 voiced lines, 28,851 characters, 33 voices (31 speaking characters plus 2 unnamed ones), every one **original** (section 2).
   The lines are read from the scripts by `tools/audio/voice-inventory.mjs`; the count, the speakers, the chapters and the time each mid-battle beat will take are in [`voice-line-inventory.md`](voice-line-inventory.md) and `.json`.
2. **Music, original, one brief per moment:** 24 existing cues plus 13 owed cues (chapters whose cue is still a stand-in, D-209) plus the pilot sketches, in [`music-briefs.md`](music-briefs.md).
   Why it matters: Bailey's verdicts on the music ("tinny and hollow", "still sounds like snes music", [`OWNER-VERDICT.md`](OWNER-VERDICT.md)) and the 2026-09-29 playtest's "Music quality sounds kinda bad" ([`docs/handoff/fb-0929-music.md`](../handoff/fb-0929-music.md)); the project's own diagnosis is that the notes were never the complaint, the sound was.
3. How a voiced line plays with the dialogue box: [`voice-integration-design.md`](voice-integration-design.md). Who each voice is: [`voice-casting.md`](voice-casting.md).

What is **not** in scope tonight: any game code, any spend, any generated audio, FF7's hidden fight (it has no lines), and sound effects (the same playtest's "no sound effects on attacks" was answered by the recorded SFX set, D-293 and D-302; the service can also make effects, but nothing here uses that).

## 2. The hard limits

1. **Original voices only.** Each voice is **designed** from a written description (Voice Design) or taken from the **voice library** by its own neutral description. **Never cloned, never "like" a named performer, never
   a prompt that names a real actor.** That would impersonate real people, and the service's Prohibited Use Policy forbids it (section 5, impersonation without consent). The casting sheet describes voices by age (18 or over), timbre, energy and accent only;
   `elevenlabs-lib.mjs` refuses a description that names the franchise, a character, a place, a composer, "sounds like" / "in the style of" / "clone", or a child or an age under 18.
2. **Original music only.** Prompts give mood, tempo, key or mode, instrumentation, structure. Never a composer, a franchise, a character, a place, a track or a melody; never "reproduce" or "imitate". The service rejects prompts that
   reference protected works (`bad_prompt`, with a suggestion), and the client refuses them first. The six themes in `THEMES.md` stay ours and their resemblance guards stay in force: a text prompt cannot carry a tune, so a take
   matches a cue's mood and form, not its notes.
3. **Keys never go in the public repo.** The key lives in `ELEVENLABS_API_KEY` or `D:/Tools/elevenlabs/key.txt`, both outside the repo; the client refuses a key file inside the repo and sends the key only to `api.elevenlabs.io`
   (or a loopback test server). The service disables a key committed to a public GitHub repository. Candidates, the usage log and the voice ids sit in `D:/Tools/elevenlabs/`; nothing is written under `public/`.
4. **Nothing spends without a yes.** Every live call needs `--yes` and a hard `--max-credits` (a batch over the cap is refused before anything is sent), and the key itself should carry the service's own credit limit (section 7). Money is Bailey's (rule 11).
5. **Agents cannot hear (rule 13).** Casting, pacing, mix and every music pick are Bailey's, from an audition page. Agent screens are technical only (clipping, silence, tempo, loudness, stereo, duration).
6. **End state first (rules 9 and the standing preference).** Bailey sees and picks options before anything perceivable is built or installed (section 4).

## 3. What the service offers, what we use, what tier it needs

Read on 2026-10-07 from elevenlabs.io (section 6 lists every page). The client in `tools/audio/elevenlabs.mjs` uses only these calls.

| We need | Endpoint | Notes | Needs |
|---|---|---|---|
| A designed voice, three previews per prompt | `POST /v1/text-to-voice/design` | `voice_description`, preview `text` (100 to 1,000 characters), `model_id` `eleven_ttv_v3` (default `eleven_multilingual_ttv_v2`), `seed`; returns three previews with `generated_voice_id`; billed on the preview text, once per call | any account that can use the API; previews take no voice slot |
| Keep a preview as a voice | `POST /v1/text-to-voice` | `voice_name`, `voice_description`, `generated_voice_id`, `labels`; returns `voice_id`; **uses a voice slot** | slots: Free 3, Starter 10, Creator 30, Pro 160, Scale and Business 660 |
| A line of speech | `POST /v1/text-to-speech/{voice_id}` | `text`, `model_id`, `voice_settings`, `seed`, `previous_text`, `next_text`, `apply_text_normalization`; `output_format` (default `mp3_44100_128`); header `xi-api-key` | any plan with the API; PCM 44.1 kHz output is listed under Pro |
| Music from a prompt or a plan | `POST /v1/music`, plan `POST /v1/music/plan` | `prompt` or `composition_plan`, `music_length_ms` (3 s to 5 min in the capability page, up to 600 s in the reference), `model_id` `music_v2_5`, `force_instrumental` (prompt only), `seed` (plan only), `sign_with_c2pa`; the plan call costs no credits | **a paid plan or a pay-as-you-go top-up** (the free plan has the music app but not the API; the PAYG page says top-ups unlock the Music API) |
| Credits and slots left | `GET /v1/user/subscription` | `tier`, `character_count`, `character_limit`, `voice_slots_used`, `voice_limit`, `next_character_count_reset_unix` | any key |

- **Models.** Eleven v4 (`eleven_v4`, the flagship: best emotion, audio tags such as `[whispering]`, no Style or Speed sliders), `eleven_v4_turbo`, Eleven v3, `eleven_multilingual_v2` (the steady older model), Flash
  (`eleven_flash_v2_5`, half the credits). Voice Design voices "may not be as performative" on v4 (the docs say so), which is why Round 2 renders the same scene on v4 and on Multilingual v2.
- **Commercial licence.** The Terms (1(c)) let a **paid** user use the services commercially and require a free user to stay non-commercial; the pricing page lists a commercial licence from Starter up, with music's from Starter too.
  Anything that might ship is generated on a paid plan. Whether a pay-as-you-go top-up on a free account counts as paid is not stated: treat that route as audition-only until the service confirms in writing.
- **The key can be fenced.** An API key can be limited to chosen endpoints, given its own credit limit, and tied to an IP allowlist (docs, API keys and authentication). That limit, not our local cap, is the one that holds if the tool or the key goes wrong.
- **The official connector.** The connector directory lists "ElevenLabs" (`https://api.elevenlabs.io/v1/mcp-claude-marketplace`, directory id 4a542638-16d2-4bd1-9937-efa473d3f2f0, 79 tools, not connected). Its description is "Manage your ElevenAgents voice agents";
  the eight tool names visible without connecting are all `agents_*`. **I could not see whether it exposes text to speech, Voice Design or Music.** If it does, an agent can generate through it once Bailey signs in; if not, the key route (our client) is the way.
  Either way the limits in section 2 and the credit fence in section 7 apply.

## 4. The pilot (end state first)

Bailey judges by ear and does not know what he wants until he hears alternatives, so the first spend buys **choices, not a build**. The ladder (cheap and broad first, spend only on survivors):

| Step | What Bailey gets | Costs |
|---|---|---|
| 0. Written concepts | [`voice-casting.md`](voice-casting.md) (33 rows) and [`music-briefs.md`](music-briefs.md): done, no spend | none |
| 1. Voice cards | for each speaker of one scene, **three** designed voices reading that speaker's own lines (preview audio), one row each | about 1,900 credits per game |
| 2. The scene | the scene read through in order with his picks, **three renders** (v4 plain, v4 with the script's emotion tags, Multilingual v2), a "play the scene" button | about 4,500 credits |
| 3. Music | three **different ideas** for one boss theme, today's shipped cue beside them as the control | about 4,400 credits |
| 4. In the box | a minimal prototype of one line voiced in the real dialogue box (the three behaviours in the integration design) | game code: **after** a yes, not part of this plan |

**Pilot A (FFX, required): Chapter 1, Seymour Flux.** The scene is the whole chapter's story: `seymour-flux.pre` and `.post`, 54 lines, 1,455 characters. Seven voices get three options each:
`seymour` (17 lines), `tidus` (9), `auron` (6), `yuna` (6), `lulu` (4), `wakka` (3), `kimahri` (1); `fayth-boy` and the narrator (the older Tidus, designed after the Tidus pick) are added in Round 2. Music: `boss-seymour`
(C# minor, 132 bpm, the first boss fight's cue, and the FFX cue the 2026-09-29 music options used) in three ideas: **A** an orchestral reading, **B** a hybrid-band reading with no choir, **C** our own cue's section structure rebuilt as a composition plan (the plan keeps our form and durations;
if the service accepts our own render as a reference through the API, a fourth take uses it, which would keep our notes: unconfirmed, tested first).

**Pilot B (FFX-2, optional but recommended): Chapter 6, Leblanc** (the hidden chapter plays it too): `ffx2-leblanc.pre`, 32 lines, 884 characters; `rikku-x2`, `paine`, `yuna-x2`, `leblanc`, `logos`, `ormi`, `brother`; music `boss-ffx2-aeon`
(Chapters 4, 6, 11 and 16 share it, and Chapter 13's second phase; the FFX-2 cue the 2026-09-29 options used). FFX-2 is a different register (banter, overlap, brass and synth), so one game's pick says nothing about the other's.

**What he will see:** one page per pilot, opened from disk, built by `elevenlabs.mjs audition` from the candidates folder. A row per speaker, a line saying what the voice is meant to be, the text being read, three players A, B, C and a "none of these" choice;
below, the scene read-through; then a music row with the control and three takes. A "Collect my picks" button fills a box he pastes into chat (the pattern of the existing sections of `docs/audio/audition.html`).

```
Seymour (17 lines)   "A patrician tenor-baritone, never raised"
  ( ) A  [> ----o------ 0:19]     ( ) B  [> ...]     ( ) C  [> ...]     ( ) none of these
  reads: "They held the gate. All of them. For you, Lady Yuna. Late, Ronso. ..."
```

**After his picks** (liked / disliked / must remain / must change / undecided are recorded, and my guesses are kept apart from his words): save the picked voices (7 slots per game), render Round 2, one refinement, lock the target.
Nothing else is built until he picks or mixes; a pick approves only what he names.

**The pilot as a command sequence** (all without `--yes` until he approves the spend):

```
node tools/audio/elevenlabs.mjs estimate
node tools/audio/elevenlabs.mjs design --scene pilot-a --yes --max-credits 2500         # Round 1: 7 voices x 3 previews
node tools/audio/elevenlabs.mjs music  --brief boss-seymour-a --yes --max-credits 1700  # and -b, -c
node tools/audio/elevenlabs.mjs audition --dir D:/Tools/elevenlabs/candidates/<date>    # his page; first copy the shipped public/audio/music/boss-seymour.mp3 to <dir>/music/_control/ as the control
# his picks -> save-voice per speaker, picks.json -> tts --scene pilot-a (three renders) -> audition --scene pilot-a
```

## 5. After the pilot

Order, each step a separate yes: the winning voices for chapters 1 to 6 first (487 of the 973 lines, half the game), FFX and FFX-2 never mixed; the owed music cues where a stand-in plays today (6, 10, 11, 12, 13, 14, 15, 16, 17, 18);
the existing cues Bailey wants to hear again, by his ear; the game code from [`voice-integration-design.md`](voice-integration-design.md) in the order it gives, with the 11 mid-battle beats that overflow their budget settled by the writers.

Gates before a file reaches the build (agent-checkable; the verdict is still his): the inventory is current (`voice-inventory.mjs --check`), every voiced line has a recording and no recording is orphaned, loudness and true peak, no clipping, no silence over 400 ms inside a line, duration within 30 percent of the estimate,
the music QA (`qa.mjs --strict`, tempo within 3 percent, stereo inside the THEMES gate, loop seam). An automatic transcript compared with the line would catch dropped words, but it needs a speech model; that is a download or a paid call, so it needs his yes first.

## 6. Cost

**Sources, read 2026-10-07.** The pages were read through a fetch tool that summarises them, so the figures are the best reading, not the invoice: **re-confirm them on the live page the day Bailey pays** (and note the v4 promotion below ends 2026-10-12).

| What | Page |
|---|---|
| Plans, monthly credits, commercial licence, music 900 credits a minute | https://elevenlabs.io/pricing |
| API list price per 1,000 characters and per music minute | https://elevenlabs.io/pricing/api |
| Model ids, character limits, credit multipliers | https://elevenlabs.io/docs/overview/models |
| Voice slots per plan | https://elevenlabs.io/docs/help-center/account/general/how-many-voice-slots-do-i-get-per-tier-and-how-can-i-increase-it |
| Pay as you go (minimum top-up $5, API cheaper than the app, expires after 12 months, unlocks Music for free accounts) | https://elevenlabs.io/docs/overview/administration/pay-as-you-go |
| Voice Design cost (the preview text, not each voice) | https://elevenlabs.io/docs/help-center/product/voices/voice-design/how-much-does-voice-design-cost |
| Terms (paid users and commercial use), Prohibited Use Policy | https://elevenlabs.io/terms-of-use, https://elevenlabs.io/use-policy |
| API reference: text to speech, voice design, voice creation, music, composition plan, subscription, keys | https://elevenlabs.io/docs/api-reference/ (the pages named in section 3) |

**Prices used** (API list, per 1,000 characters): Eleven v4, v3 and Multilingual v2 $0.08; v4 Turbo, v3 Conversational and Flash/Turbo $0.04. **v4 is 72 percent off ($0.022) until 2026-10-12**; not assumed. Music $0.15 a minute (the plan page's 900 credits a minute is the same at the
Pro rate). Plans: Free $0 (10,000 credits, non-commercial); Starter $6 (30,000 credits, 10 slots; $1 the first month on the page); Creator $22 (121,000 credits, 30 slots; $11 the first month); Pro $99 (600,000 credits, 160 slots).
A subscription's credits price out at about 2 to 2.5 times the API list figure per character ($99 for 600,000 credits is $0.165 per 1,000 against $0.08), so API use through pay as you go is the cheaper route if the commercial question above is settled in his favour.

**The totals** (`node tools/audio/elevenlabs.mjs estimate` prints them; two takes per line, 8 percent for audio tags, three takes per music cue):

| | Credits | At API list price |
|---|---|---|
| **Pilot A** (FFX): 7 voices x 3 previews, the scene on 3 renders, 3 music sketches | 10,753 | **$1.24** |
| **Pilot B** (FFX-2): the same for Chapter 6 | 9,105 | **$1.12** |
| **Both pilots** | 19,858 | **$2.36** (about $4.70 if every line and sketch is taken twice) |
| Whole game voice-over: 973 lines, 28,398 unique characters x 1.08 x 2 takes | 61,340 | $4.91 |
| The whole cast, Voice Design, two rounds | 19,800 | $1.58 |
| Whole game music: 37 briefs x 3 takes, 173 minutes | 155,295 | $25.88 |
| **Everything** (pilots, cast, voice-over, music) | about 256,000 | about **$34.70** |

What each plan means for that: **Starter** ($6) holds one pilot (10,753 credits, 7 of 10 slots) and carries the commercial licence. **Creator** ($22) holds both pilots with room for retakes (19,858 of 121,000 credits, 14 of 30 slots). **The whole cast is 33 voices,
which does not fit Creator's 30 slots**; Pro (160 slots, 600,000 credits) holds the cast and the whole game's credits in one month ($99), or two Creator months would hold the credits but not the slots. Recommended: **Creator for the pilot month, Pro for the production
month**, about $121 in plan fees ($110 with the Creator first-month price) for a game whose raw generation is about $35 of credits. Pay as you go (minimum $5) would cover a pilot at list price if it is allowed to ship; ask before relying on it.

## 7. What Bailey must do (and nothing before)

1. **Connect or give a key, himself.** Either sign in to the official ElevenLabs connector in his claude.ai connector settings (the sign-in is his; an agent never creates the account or enters credentials), or make an API key in his own ElevenLabs account and
   save it **only** in `D:/Tools/elevenlabs/key.txt` (or set `ELEVENLABS_API_KEY` in his shell). The key is never pasted in chat and never goes in the repo.
2. **Pick the plan.** For the pilot: Starter if only Chapter 1 (one game), Creator for both. For production: Pro for a month. (Section 6.)
3. **Fence the key.** In the key's settings: allow only Text to Speech, Voice Design (text-to-voice), Voices (read), Music and the usage read (the key page lists the exact names); set a **credit limit** (suggested 15,000 for a Starter key, one pilot with room for a retake; 45,000 for the Creator pilot, both pilots doubled); optionally an IP allowlist.
4. **Say yes to the spend**, per step: the pilot (about $1.24 for A, $2.36 for both), then each production step.
5. **Listen and pick** from the audition page; paste his picks into chat. Agents record them as his words.
6. **Decide** (none urgent): the voice budget line (about 20 MB beside the 90 MB audio cap, `voice-integration-design.md`), whether the 17 captions get a caption narrator (default no), whether FFX-2's narration is Yuna's (the scripts say so; the DSL comment says Tidus's),
   and which of the three line behaviours (A, B, C) he wants when the in-box prototype is shown.

## 8. Risks and open questions

- **Child-sounding voices**: the service's help center says children's voices, and adult voices designed to sound child-like, cannot be added to its voice library, and treats the matter as safeguarding. So **no voice here is designed to sound like a minor**: Tidus, Yuna and Rikku are cast as youthful adults, and the fayth boy and Shinra as light, ageless adult voices (`voice-casting.md`, rule 6). The "just a kid" jokes live in the words. Bailey can overrule this only by asking the service itself.
- **Short and non-verbal lines**: 69 voiced lines are under 12 characters, 41 are one word, 4 are sounds ("Hmph.", "Hn."). A model can drift on these; the retake allowance covers some, a sound-effects take may cover the rest.
- **Consistency over 973 lines and over time**: pin `model_id` and `seed`, keep every request beside its file (the client writes a sidecar), keep the raw masters; the game never calls the service at runtime, so shipped audio is ours whatever the service does later.
- **Designed voices are not exactly re-makeable**; hence slots for the whole cast for the production month, not delete-and-recreate waves.
- **Music**: a take can be the wrong tempo, words in a wordless cue, a fade-out instead of a loop point, or the same hollow, narrow stereo Bailey disliked. The screens measure; the ear decides. Output is MP3 at 44.1 kHz (128 kbps by default); a lossless route is a higher plan.
- **Budget**: voice needs its own line under the audio cap (15 MB at 64 kbps mono); music swaps bytes for bytes.
- **The connector's reach** is unknown (section 3), and **the prices were read by a summarising tool**: confirm on the day.
- **Licence**: ship nothing generated on the free plan; keep the plan, date and request id of every shipped file (the sidecars and `usage.jsonl` do).

## 9. What is in this branch

| File | What |
|---|---|
| `docs/audio/elevenlabs-plan.md` | this plan |
| `docs/audio/voice-casting.md` | 33 voice rows, treatments, screening, design prompts the client reads |
| `docs/audio/voice-line-inventory.json`, `.md` | every line (stable ids, speakers, text, characters, flags), totals, the mid-battle budget findings |
| `docs/audio/music-briefs.md` | the chapter-by-chapter music map and 43 briefs (6 pilot, 24 production, 13 owed) |
| `docs/audio/voice-integration-design.md` | the voice-with-the-box design (no code) |
| `tools/audio/voice-inventory.mjs` | regenerates the inventory from `src/story` (`--check` fails when a script changed) |
| `tools/audio/elevenlabs.mjs`, `elevenlabs-lib.mjs` | the client: `estimate design save-voice tts music balance usage audition`; dry run by default |

**How it was tested without touching the service:** syntax checks, the inventory run twice (identical) and with a simulated edit (the id kept, the old one retired), `estimate`, every brief and design prompt validated, and every mode run against a throwaway
**loopback mock server** with a dummy key: request bodies, the caps, the refusals, the audition page. The mock was stopped afterwards. The client was never pointed at elevenlabs.io.

**For NOW.md and the ledgers (the driver's):** a decision to record: Bailey asked for ElevenLabs for music and voice-over (2026-10-07 ~01:05 EDT, verbatim above); the pilot proposal awaits his yes on spend and his connection. Game case: both; chapters by game in the inventory.
