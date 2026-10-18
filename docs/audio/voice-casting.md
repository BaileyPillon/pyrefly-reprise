# Voice casting: one row per speaking character

Groundwork for original voice-overs (plan: [`elevenlabs-plan.md`](elevenlabs-plan.md); lines: [`voice-line-inventory.md`](voice-line-inventory.md)).
Nothing here has been heard: agents cannot hear (rule 13), so every row is a **written brief for a designed voice**, and Bailey
picks by ear from the pilot.

## The rules every row obeys

1. **Original voices only.** A voice is either **designed** from a written description (ElevenLabs Voice Design) or taken from the
   **voice library** by its own neutral description. **Never cloned, never "like" a named performer.** No row, prompt or note
   names a real actor, and a library voice is rejected if its name, labels or description mention a game, a character or a
   person it imitates (the screening list is at the end).
2. **FFX and FFX-2 are separate rows where the game changes the voice** (rule 14): Yuna and Rikku each have two. Brother, Auron,
   Jecht, Braska and the fayth boy appear in both games and keep one voice; the table says where a game adds a treatment.
3. **Descriptions say what the voice is, never who it resembles.** Age feel, timbre, energy, accent, delivery. The prompts below
   name no franchise, character, place or term from the games.
4. **Sources.** Personality and delivery come from `research/writing-bible.md` section 1 (the voice guides) and from the lines
   themselves; counts come from the inventory. Where the scripts and the bible disagree the script wins and the row says so.
5. **Ages (rule 6).** The research gives a few: Auron 25 when he died and ten years on in the pilgrimage, Braska 35, Isaaru 26, Logos 26, Ormi 22, Nooj 21,
   Baralai 20, Brother 20 in FFX-2, Paine 18, Gippal 18 (`research/visual-bible.md` sources, `ffx-isaaru-bevelle.md`, `ffx2-leblanc-syndicate.md`). Where it does,
   the age column cites it and the voice is cast to sound that young, with the manner the bible gives (a 21-year-old can speak like a man drafting his epitaph).
   Everything else is marked **unsourced**: a casting estimate of how old the voice should sound, not a claim about the character.
6. **No voice is designed to sound like a minor.** The service keeps child-sounding voices out of its voice library as a safeguarding matter (help center, "Can children's or child-like voices be added to the Voice Library?", read 2026-10-07), and
   nothing here asks it for one. Characters who are young in the story (Tidus, Yuna, Rikku, Gippal, Paine, the two children) are cast as **youthful adults, 18 and over**; `elevenlabs-lib.mjs` refuses a description that names an age under 18
   or a child, boy, girl, teen or minor. Bailey can overrule this only by asking the service itself.

Counts are voiced lines / characters in the inventory (stand-in lines and victory quips included). The **Pilot** column says when Bailey hears
a voice: **A** and **B** are the two pilot scenes in the plan (A: FFX Chapter 1, B: FFX-2 Chapter 6) and **A2** is a voice designed after the picks, in the scene round.

## FFX (chapters 1 to 3, 7 to 10, 12, 14, 17, 18)

| Voice | Lines / chars | Age feel | Timbre | Energy | Accent and diction | Personality and direction | Pilot |
|---|---|---|---|---|---|---|---|
| `tidus` | 88 / 2,388 (10 ch) | Unsourced; a youthful adult, sounds early 20s | Light, warm baritone-tenor with a boyish edge | High; quick bursts, stacked questions, interrupts himself; loud when angry, cracks when hurt | Casual contemporary American-neutral ("gonna", "c'mon", "you guys") | The one who asks what nobody will. "Hey!" is an attention-grab and an objection. Bare names for everyone; "old man" for his father. Never smug off the sports field. Repeats the last word as a question. | A |
| `narrator` | 47 / 2,057 (9 ch) | Unsourced; the same man years later, sounds late 20s to early 30s | The Tidus voice lower, slower, warmer, a little tired | Low and steady; past tense, fragments, 2 to 5 lines | As `tidus`, smoothed | Looking back to someone round a fire. One sensory detail, one admission. Never foreshadows, never explains. **Design after `tidus` is picked, as his older sibling.** | A2 |
| `yuna` | 72 / 1,891 (10 ch) | Unsourced; a youthful adult, sounds about 20 | Clear, soft mezzo | Calm; finishes her sentences; one raised voice per arc | Formal-plain, few contractions, no slang, honorifics for elders | "Yes." as a complete beat (pause, one word, nothing else). Apologises for her own needs. Says his name more than she needs to. Never sarcastic, never "I can't". | A |
| `auron` | 78 / 1,876 (12 ch; +2 lines in FFX-2) | 25 when he died, "ten years ago" in the scripts: sounds mid 30s, weathered | Deep, dry, gravelly baritone | Low; 2 to 7 words; imperatives; battle calls one to three words | Plain, hard words; neutral | "Hmph." as a whole line. Withholds; never apologises; never explains in a paragraph. A bare "Yuna." stops a room. In FFX-2 Chapter V he is a Farplane voice (treatment `farplane`). | A |
| `young-auron` | 1 / 37 (ch 2) | 25 (the same source); sounds about 25 | `auron` ten years younger: clearer, less gravel, earnest | Medium, respectful | Formal ("My lord") | One line. Design as a younger sibling of the `auron` pick. | no |
| `wakka` | 43 / 1,336 (10 ch) | Unsourced; sounds mid 20s to 30 | Warm, easy baritone | Medium; rolling, runs on, thinks aloud | Relaxed island lilt, light touch, never a caricature; "ya?", "brudda", "Lu" | Tension release: one light line after a heavy beat. Faith as habit, going hollow in Chapters 1 and 2. Volunteers first, thinks second. | A |
| `lulu` | 64 / 1,868 (11 ch) | Unsourced; sounds mid 20s to 30 | Cool, low alto, precise | Low and controlled; two short sentences where others use one long one | Elevated but not ornate; no slang | Deadpan, corrective questions, a flat "Wakka." as a full stop. Yuna's shield. Chapter 9 (19 lines) is hers: its one shout, "I was supposed to finish it THEN!", must be the loudest she ever gets. | A |
| `kimahri` | 29 / 668 (9 ch) | Unsourced; an adult | Very deep, rumbling bass, slow | Low and heavy; speaks only after a silence | None beyond the grammar: third person, dropped articles ("Kimahri smells fire") | 3 to 8 words, concrete nouns, no metaphor, never a joke. Weight, not volume. | A |
| `rikku` | 43 / 1,377 (9 ch) | Unsourced; a youthful adult, sounds early 20s, the brightest voice in the cast | Bright, quick, mid-high | High; stacked, self-correcting, restarts mid-thought; sound-effect words ("Eeew!") | Youth-casual American-neutral; proud of her family's trade | "Yunie", "Pops", "Okay okay okay". Comic relief and the moral objector. Never solemn, never a long silence. | no |
| `seymour` | 55 / 1,991 (4 ch; four speaker ids) | Unsourced; sounds late 20s to early 30s, patrician | Smooth tenor-baritone, soft, controlled | Low; never raised; long balanced clauses with a pause in the middle | Refined, elegiac, faintly liturgical; rare contractions | Courteous condescension; death as kindness; "Lady Yuna" even mid-fight. Correct about the diagnosis, monstrous about the cure. Chapter 7 (15 lines) is intimate; **Chapter 10 voice treatment `transformed`** (3 lines: lower, a faint second tone); **Chapter 12 treatment `inside-sin`** (12 lines: a large hollow room around the same voice). | A |
| `yunalesca` | 22 / 667 (ch 2) | Unsourced; sounds 30s with a thousand years under it | Warm low alto | Very low; slow, even, never hurries, never interrupts | Gentle formal; second person constantly | Not evil: compassion that calcified. Diagnoses your feelings and is right. Never a taunt, never a lie. "Child." | no |
| `jecht` | 29 / 741 (ch 2, 3; +3 in FFX-2) | Unsourced; sounds 40s | Rough, big baritone | Loud, then trails off the moment he turns sincere | Locker-room plain: "kid", "crybaby", "figures" | Aborted sincerity: starts a real sentence, kills it with a jab. Never says "I love you". In FFX-2 Chapter V a Farplane voice (`farplane`). | no |
| `braska` | 4 / 130 (ch 2; +2 FFX-2) | 35 (FF Wiki via the visual bible); sounds mid 30s | Warm, calm, measured tenor-baritone | Low; the only adult in any room | Gentle formality; "my friend"; thanks as a way to close a topic | States a terrible decision in a mild voice. Remembered, slightly warmer than life. FFX-2 Chapter V: `farplane`. | no |
| `fayth-boy` | 8 / 234 (ch 1; ch 5 in FFX-2) | Unsourced; **not a child's voice**: a light, calm, ageless young adult | Plain, light, soft, a little slow | Calm, weary | Simple words; speaks as "we" | Apology without excuse; one flat "Yes."; never menacing, never pleads. The story calls him a boy; the casting makes him a small, gentle, timeless voice because no child-sounding voice is requested (rule 6). | A2 |
| `cid` | 19 / 698 (ch 8, 17, 18) | Unsourced; sounds 50s | Gruff, hearty bark | High; shouted orders over an engine | Bluff, working, Rikku's "Pops" | A leader who barks, never panics. Warmth shows as impatience. | no |
| `brother` | 19 / 611 (FFX ch 8, 17, 18; FFX-2 ch 4, 5, 6, 11) | 20 in FFX-2 (FF Wiki via the visual bible); sounds about 20, loud | Big, brassy, a little nasal | Very high, breathless; capitals mean shouting | Inverted word order, dropped articles, over-formal verbs, malapropisms; third person when asserting authority | "YUNA!" at every pitch (alarm, pride, despair, greeting). **One short, unfunny line of real terror per chapter, then straight back to ridiculous.** One voice for both games. | B |
| `isaaru` | 11 / 415 (ch 14) | 26 (research/ffx-isaaru-bevelle.md); sounds mid 20s | Steady tenor | Low to medium; courteous, sorrowful | Formal ("Lady Yuna", "Lord Braska's daughter") | Devout, fights while apologising; never cruel. | no |
| `npc-dome-voice` | 2 / 74 (ch 2) | Unnamed; middle-aged | Dry, tired | Low | Plain | "The statue's empty, you see." A caretaker's amused weariness. | no |
| `npc-yevon-officer` | 5 / 193 (ch 7) | Unnamed; middle-aged | Stiff, cold | Medium; officious commands | Formal ("Lady Summoner") | A voice that never sounds personal. | no |

## FFX-2 (chapters 4 to 6, 11, 13, 15, 16)

| Voice | Lines / chars | Age feel | Timbre | Energy | Accent and diction | Personality and direction | Pilot |
|---|---|---|---|---|---|---|---|
| `yuna-x2` | 96 / 2,886 (7 ch; includes 20 narration lines and 2 doubled) | Unsourced; two years on from `yuna`, sounds about 22 | Lighter and brighter than `yuna` | Medium-high, faster, more contractions | Casual, slang worn slightly awkwardly; the formality surfaces when she is serious | "Um..." as a real hesitation, a small bright "Hmm!" of decision, bad delighted teasing. Performing carefree, with a seam. **Narration (20 lines, chapters 5, 13, 15, 16): treatment `narration`, reflective, warm, wry** (the DSL calls `narrate` Tidus's, but FFX-2's lines are hers: "I let her.", "I woke in the Songstress dress"; bible 2.2 gives FFX-2 narration to Yuna; **to confirm**). **Chapter 5, 2 lines `doubled-with-lenne`**: her voice with a second, quieter voice layered. | B |
| `rikku-x2` | 64 / 1,832 (7 ch) | Unsourced; two years on from `rikku`, sounds early to mid 20s, a little more worldly | Bright, quick | Very high; more words, narrates her own actions, answers questions nobody asked | Playful; coined portmanteaus; self-naming ("Rikku, do you copy?"); "Dr. P" | The party's mechanic and strategist: let her be right on a technical point. Says what Yuna feels before Yuna will. | B |
| `paine` | 66 / 1,432 (7 ch) | 18 (visual bible); cast 18 to 21, a young voice that sounds older than it is | Low, flat, dry alto | Low; 2 to 8 words; ends conversations | Modern, unadorned | The one-word veto ("No."). Gets the third beat of every three-beat joke. Never an enthusiasm, never a nickname. | B |
| `leblanc` | 29 / 969 (ch 4, 5, 6, 11) | Unsourced; sounds 30s | Imperious, theatrical contralto | High; declaims, drawls, croons | Mock-aristocratic: "pet", "dearie", "darling", "lamb" | Comic cruelty with a flicker of sincerity (ch 6: "Someone I am fond of is down there."). | B |
| `logos` | 8 / 272 (ch 4, 6, 11) | 26 (research/ffx2-leblanc-syndicate.md); sounds mid 20s, dry beyond them | Dry, precise tenor | Low; deadpan | Pedantic ("It has a name, Ormi. Use the name.") | Long-suffering clerk of a farce. | B |
| `ormi` | 14 / 436 (ch 4, 5, 6, 11) | 22 (same source); a big young man | Big, gruff, slow baritone | Medium; indignant when cheated | Broad working-class ("don't touch nothin'", "Boss") | Loyal and dim; ch 6 "That's cheating, that is!" | B |
| `buddy` | 3 / 90 (ch 5, 11) | Unsourced; sounds late 20s | Calm, warm baritone, radio-clean | Low; even | Mission-log register: coordinates, status | Never panics, never jokes at anyone's cost. | no |
| `shinra` | 3 / 136 (ch 5, 11) | Unsourced; **not a child's voice**: the lightest young adult voice that still sounds slight | Flat, clinical, light | Very low; reports | Numbers and readings; "I'm just a kid" | Zero emotion lets the others supply it. Same rule 6 as `fayth-boy`; the "just a kid" joke has to live in the words and the flatness. | no |
| `shuyin` | 25 / 751 (ch 5, 16) | Unsourced; sounds early 20s, a thousand years in grief | Low, flat, heavy | Low and repetitive; short lines; absolutes | "A thousand years." as a unit of measure; no qualifiers | The silhouette of `tidus` with the hope removed: design him as a darker, harder cousin of the `tidus` pick. No jokes, no plan with a future in it. "Stop singing. Stop singing." is his one raised moment. | no |
| `lenne` | 5 / 114 (ch 5) | Unsourced; a young woman | Gentle, warm, soft alto-mezzo | Low; unhurried; forgiveness before it is asked | Simple, domestic words for enormous things | Agrees with his pain and declines his conclusion. **Speaking voice only: the song is music, not a voice line.** | no |
| `nooj` | 6 / 163 (ch 5, 16) | 21 (visual bible); a young man in an older man's manner | Measured, weighted baritone | Low; long pauses before he commits | Formal; "death", "cost", "first" | Never jokes, never asks for help. | no |
| `baralai` | 1 / 32 (ch 5; one more line is a silent beat) | 20 (visual bible) | Courteous, level tenor | Low; precise | "Lady Yuna" always | After possession: shorter lines, more pauses. | no |
| `gippal` | 5 / 119 (ch 5, 16) | 18 (visual bible); cast 18 to 20 | Loose, cocky tenor | Medium-high; a grin in every line | Teasing, fake-formal | "Let her go!" is a real shout; the jokes are armour. | no |
| `trema` | 9 / 367 (ch 13) | Unsourced; sounds 50s | Calm, courteous baritone, weary | Low; unhurried | Patrician, philosophical | Menace through gentleness: "Memories are weights." | no |

Shared voices keep their FFX row: `auron`, `jecht`, `braska` (Farplane voices in Chapter V), `fayth-boy` (Chapter V's coda), `brother`.

## Treatments (how one voice plays a special case)

| Treatment | Applies to | Recipe (post-processing in our ship chain, not a different ElevenLabs voice) |
|---|---|---|
| `farplane` | `jecht`, `braska`, `auron` in FFX-2 Chapter V (7 lines) | The same voice from far away: band-limit the top and bottom, a long soft reverb, a slight slow pitch drift. Never a ghost cliche. The box already shows the plate "Farplane". |
| `inside-sin` | `seymour` in Chapter 12 | The same voice in a very large hollow room: long dark reverb, level a touch down. |
| `transformed` | `seymour` in Chapter 10 (3 Natus lines) | Pitch down 2 to 3 semitones with a faint doubled copy a fifth below, mixed low. |
| `doubled-with-lenne` | `yuna-x2`, 2 lines in Chapter 5 | `yuna-x2` and `lenne` read the same line; Lenne's copy under hers, 6 dB down, 20 ms apart. Two takes, one file. |
| `narration` | `yuna-x2` in four FFX-2 chapters | The same voice, closer to the microphone, a little slower, a touch warmer. |

## Not voiced (a decision for Bailey, default no)

- **Captions** (17 lines, `speaker: none`): stage directions such as "Sin plows into the outskirts of Bevelle as the sun goes down."
  They are text the box prints, not anyone's speech. Voicing them needs a caption narrator; default is text only.
- **Silent beats** (3 lines that are only "..."): not spoken; the beat is the line.
- `yu-yevon` and `bahamut` never have a spoken line (bible 1.13; Bahamut roars). Their sounds stay in the SFX set.
- Al Bhed: the bible plans to cipher Al Bhed lines for the box; no line in the scripts carries a cipher tag today, so nothing is spoken in Al Bhed.

## Voice slots and the cast size

The cast is **31 speaking voices plus 2 unnamed ones = 33 designed voices.** Saved voices take a slot: Free 3, Starter 10, Creator 30,
Pro 160 (ElevenLabs help center, read 2026-10-07). The pilot saves only the voices Bailey picks: 7 per game (14 for both), which fits Starter for one game and Creator for both; the whole cast needs
**Pro** for the production month, or a wave plan (voice, render every line, delete) on Creator, which risks a voice that cannot be
re-made exactly if a line is changed later. Recommended: Pro for the production month only.

## Screening a library voice (the alternative to designing one)

A voice-library voice is considered only when **all** are true; each is written into `D:/Tools/elevenlabs/casting-ledger.md` (outside the repo) with its URL, name, labels, date and Bailey's pick:

- its own description and labels give an age, timbre, accent and use, and mention no game, franchise, character, actor or "sounds like";
- it is marked usable under the plan's commercial licence and has no removal notice pending (a library voice can be withdrawn; audio already made stays ours, new lines cannot be made);
- Bailey has heard it and picked it.

A designed voice is ours for as long as the account keeps it; that is why designed voices are the default and library voices the second option.

## Design prompts

`tools/audio/elevenlabs.mjs design` reads these blocks (a block per voice, the fence names the voice id). Each follows the service's
recommended shape (language and accent, gender and age, quality, persona, emotion, then timbre, pacing and delivery), is between 20 and
1,000 characters, and **names nothing from the games**. The client refuses a prompt that does.

```design tidus
Native English, neutral American. Male, early 20s. Clean studio recording. Persona: a cheerful young athlete far out of his depth. Emotion: bright, restless, quick to anger. A light, warm baritone-tenor with a boyish edge. Talks in quick bursts, interrupts himself, asks questions in twos and threes, and his voice cracks when he is hurt.
```

```design narrator
Native English, neutral American. Male, early 30s. Clean studio recording. Persona: a man telling an old story quietly to a few people round a fire. Emotion: wistful, tired, gentle. The same warm baritone-tenor as a younger man but lower and slower, with a faint smile in it. Short plain sentences with long pauses; never dramatic.
```

```design yuna
Native English, neutral American. Female, about 20. Clean studio recording. Persona: a gentle young woman carrying a duty she has accepted. Emotion: calm, kind, resolute. A clear, soft mezzo-soprano. Unhurried, finishes every sentence, speaks politely and formally, rarely raises her voice, and a single quiet word can end a conversation.
```

```design auron
Native English, neutral American. Male, mid 30s. Clean studio recording. Persona: a weathered veteran who says only what is needed. Emotion: dry, guarded, quietly amused. A deep, gravelly baritone with a dry edge. Slow and economical, two to seven words at a time, gives orders instead of explanations, never raises his voice.
```

```design young-auron
Native English, neutral American. Male, about 25. Clean studio recording. Persona: a dutiful young warrior-monk who respects his lord. Emotion: earnest, respectful, worried. A clear, steady baritone, younger and cleaner than a weathered veteran's. Measured and formal, with a note of concern he tries to hide.
```

```design wakka
Native English with a relaxed island lilt, light, not a caricature. Male, late 20s. Clean studio recording. Persona: a big-hearted sportsman who jokes to ease tension. Emotion: warm, easygoing, quietly shaken. A warm, easy baritone. Rolls his sentences along, thinks aloud, ends many lines on a friendly "ya?", and the laughter goes hollow when the news is bad.
```

```design lulu
Native English, neutral, precise. Female, late 20s. Clean studio recording. Persona: a composed sorceress who has seen everything and is surprised by nothing. Emotion: cool, dry, protective. A low, smooth alto. Two short sentences where others use one long one, deadpan, never gushes, and says one flat word to end an argument.
```

```design kimahri
Native English, spoken slowly with simple grammar. Male, adult. Clean studio recording. Persona: a huge, silent mountain warrior who speaks rarely. Emotion: grave, steady, protective. A very deep, rumbling bass voice. Slow, heavy, few words, short flat sentences, no metaphors, and he only speaks after a silence.
```

```design rikku
Native English, neutral American. Female, early 20s. Clean studio recording. Persona: a fast-talking young engineer who hides worry behind jokes. Emotion: bright, playful, anxious underneath. A quick, bright, mid-high voice. Stacks words on top of each other, restarts her sentences, squeals and gasps, and goes small and honest for one line when it matters.
```

```design seymour
Native English, refined and slightly formal. Male, early 30s. Clean studio recording. Persona: an elegant nobleman who believes his cruelty is mercy. Emotion: calm, courteous, sorrowful. A smooth, soft tenor-baritone. Never hurries and never raises his voice; long balanced sentences with a pause in the middle; polite to the point of condescension.
```

```design yunalesca
Native English, gentle and formal. Female, appears to be in her 30s, sounds very old and tired. Clean studio recording. Persona: a serene, motherly woman who has done something terrible many times. Emotion: warm, weary, kind. A warm low alto. Slow and even, never interrupts, speaks to you about yourself, and says dreadful things in the voice of comfort.
```

```design jecht
Native English, plain American. Male, 40s. Clean studio recording. Persona: a rough, boastful sportsman and a failed father. Emotion: gruff, teasing, hiding tenderness. A big, rough baritone. Starts loud and cocky and trails off the moment he becomes sincere, then covers it with a joke.
```

```design braska
Native English, gentle and formal. Male, mid 30s. Clean studio recording. Persona: a kind, mild man who has decided to do something terrible and thanks everyone for helping. Emotion: warm, calm, quietly humorous. A warm, measured tenor-baritone. Complete sentences, never raises his voice, speaks as though to a friend.
```

```design fayth-boy
Native English, simple and clear. Young adult, gentle and ageless. Clean studio recording. Persona: a very old, tired spirit speaking softly for a whole group. Emotion: calm, weary, apologetic. A light, plain, slightly slow voice with no drama and nothing childish in it. Short flat statements, apologises without excuses, says "we".
```

```design cid
Native English, bluff and hearty. Male, 50s. Clean studio recording. Persona: the gruff chief engineer and pilot of a flying ship. Emotion: impatient, proud, protective. A big, gravelly, barking voice. Shouts orders over an engine, never panics, and shows affection only as impatience.
```

```design brother
Native English with an odd formal grammar: inverted word order, dropped articles, big words used slightly wrong. Male, about 20. Clean studio recording. Persona: a boastful, cowardly airship captain who shouts everything. Emotion: bombastic, breathless, frightened. A big, brassy, slightly nasal voice, almost always shouting, with a sudden short drop into real fear.
```

```design isaaru
Native English, formal and courteous. Male, mid 20s. Clean studio recording. Persona: a devout young priest and warrior who must do what he is ordered. Emotion: sorrowful, steady, sincere. A clear, steady tenor. Polite even while fighting, apologises as he acts, never cruel.
```

```design npc-dome-voice
Native English, plain. Male or female, middle-aged. Clean studio recording. Persona: a tired caretaker who knows a secret nobody tells. Emotion: dry, weary, faintly amused. A dry, low, unhurried voice, half to itself.
```

```design npc-yevon-officer
Native English, formal and cold. Male, middle-aged. Clean studio recording. Persona: a temple officer giving orders he does not question. Emotion: stiff, officious, contemptuous. A hard, clipped baritone. Formal titles, no warmth, a voice that never sounds personal.
```

```design yuna-x2
Native English, neutral American. Female, about 22. Clean studio recording. Persona: a young woman performing carefree cheerfulness, with a seam. Emotion: bright, playful, sometimes suddenly sincere. A lighter, brighter mezzo than a gentle formal one. Faster and more casual, says "um" when she is thrown, teases badly and delightedly, and her old formality surfaces when she is serious.
```

```design rikku-x2
Native English, neutral American. Female, early to mid 20s. Clean studio recording. Persona: a hyperactive young engineer and professional troublemaker. Emotion: gleeful, excitable, quick to worry. A bright, fast, mid-high voice. More words per breath than anyone, narrates her own plans, coins silly words, and is occasionally the one who says what everyone feels.
```

```design paine
Native English, flat and modern. Female, 18 to 21. Clean studio recording. Persona: a blunt, bored mercenary who ends conversations. Emotion: dry, unimpressed, secretly loyal. A low, flat, dry alto. Two to eight words at a time, deadpan, one-word refusals, and the last word of every joke.
```

```design leblanc
Native English, theatrical and mock-aristocratic. Female, 30s. Clean studio recording. Persona: a flamboyant crime boss who treats everyone as staff. Emotion: imperious, amused, occasionally touched. A rich, imperious contralto. Declaims, drawls and croons, calls everyone pet names, and drops the act for one honest half-sentence.
```

```design logos
Native English, precise and dry. Male, mid 20s. Clean studio recording. Persona: a pedantic, long-suffering assistant to a flamboyant boss. Emotion: deadpan, weary, exact. A dry, precise tenor. Corrects people's wording, never raises his voice, and sounds faintly bored.
```

```design ormi
Native English with a broad working-class accent. Male, early 20s. Clean studio recording. Persona: a big, loyal, slow-thinking bruiser. Emotion: gruff, eager, easily offended. A big, gruff baritone. Slow and plain, calls his boss "Boss", and gets loudly indignant when he thinks someone is cheating.
```

```design buddy
Native English, neutral American. Male, late 20s. Clean studio recording. Persona: the calm, professional voice on the radio. Emotion: steady, reassuring, quietly amused. A warm, even baritone with a clean radio sound. Reports coordinates and status plainly and never panics.
```

```design shinra
Native English, neutral and flat. Male, early 20s. Clean studio recording. Persona: a gifted technician who reports facts without feeling. Emotion: flat, clinical, matter-of-fact. A light, even, slight voice with no drama. Numbers and readings, no softening, finishing with a small shrug.
```

```design shuyin
Native English, neutral. Male, early 20s in sound. Clean studio recording. Persona: a young man who has grieved for a thousand years. Emotion: flat, heavy, exhausted, close to breaking. A low, hard, heavy voice. Short repeating phrases, absolutes, no jokes, and one raw shout when everything gives way.
```

```design lenne
Native English, soft and warm. Female, early 20s. Clean studio recording. Persona: a gentle singer who forgives before she is asked. Emotion: tender, calm, accepting. A soft, warm alto-mezzo. Short plain sentences, small words for enormous things, unhurried, asks for nothing.
```

```design nooj
Native English, formal and measured. Male, early to mid 20s, who speaks like an older man. Clean studio recording. Persona: a fatalist soldier who speaks like he is drafting his own epitaph. Emotion: grave, resigned, steady. A measured, weighted baritone. Long pauses before he commits to a sentence, never jokes, never asks for help.
```

```design baralai
Native English, courteous and careful. Male, about 20. Clean studio recording. Persona: a diplomat recovering from an ordeal. Emotion: gentle, apologetic, tired. A level, courteous tenor. Chooses each word visibly, short lines with pauses between them.
```

```design gippal
Native English, loose and cocky. Male, 18 to 20. Clean studio recording. Persona: a swaggering engineer who deflects sincerity with a joke. Emotion: cocky, playful, secretly loyal. A loose, bright tenor with a grin in every line, and a real shout when a friend is in danger.
```

```design trema
Native English, patrician and calm. Male, 50s. Clean studio recording. Persona: a gentle, weary philosopher who destroyed what he loved. Emotion: serene, sorrowful, quietly menacing. A calm, courteous baritone. Unhurried, speaks in tidy aphorisms, and is frightening because he is so kind.
```
