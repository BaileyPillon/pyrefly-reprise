# Steam HD session plan, 2026-09-26 (queue item 4 / item 7)

Paper plan only. No game launch in this pass, no screen taken over, no downloads.
Written for Bailey's ~30-minute Steam HD Remaster session (`D:/Tools/ffx-hd`,
app 359870; driver tools `D:/Tools/ffx-hd/drive/drive.py`,
`waitmenu.py`). Bailey, 2026-09-26 ~16:00 EDT: "I'll go with all of your
recommendations" — this covers queue item 7's *recommend yes*.

**Rule 8 (repo gets text only):** whoever runs the session records answers as
prose in `docs/plans/steam-session-log-2026-09-26.md` (new file, written after
the session) or directly in each PR's row via `critic-clear`/handoff notes.
No screenshots, frames or video from the retail game enter `D:/Final Fantasy`.
Route through `D:/Tools/ffx-hd/observe*` the way the two prior sessions did.

**Legally-obtained state already on this machine** (`D:/Tools/ffx-hd/observe/`,
`observe-trema/save.md`): the community FFX-2 save `ffx2_003` (slot 3,
"New Yevon Headquarters, Yuna, Chapter 5, Story 95%") that Bailey placed
himself, and an empty `ffx2_000` slot. **No FFX save exists on this machine
yet** — the `FINAL FANTASY X` save folder was found empty in both prior
sessions. Nothing below asks to download a new save; where FFX needs one, the
plan is a fresh in-session New Game, which is legal and fast for an opening
scene.

## The eight questions, what each is really asking, and where it settles fastest

| # | PR / tag | Game | What "one-target cursor" etc. actually means (from the code and research) | Fastest real-game vantage point |
|---|---|---|---|---|
| 1 | PR-0209 (IC-1) | FFX-2 | `resolve.ts:319` registers a hit into the victim's Chain window *before* the immune check at `:340`. Live and bench evidence shows this only ever fires on the **enemy's** side (an enemy Attack or Skill against a physically/magically immune player target), never on the party's side. Question: in the retail game, does an attack that an enemy lands on an *immune* character still open or extend that character's Chain multiplier window? | Any early fight where an enemy can hit a character under Protect/Shell/a Ward or Nul-status (a free "immune" reading) while a chain is already running. No specific chapter needed — a random Bikanel or Kilika Woods fiend that casts an elemental spell into a Nul'd character, with the Chain gauge already lit from a prior hit, answers it in one encounter. |
| 2 | PR-0170 | Both (built as FFX-2's CTB/ATB target step; the same "does a single valid target skip the menu" question applies to FFX's menu, so check FFX too if the FFX leg of item 5 below has time left) | In our engine, a command with exactly one valid target fires immediately, with no target cursor shown and no way to back out before it resolves. Question: does the retail game still show (or flash) a target cursor / confirmation step for a single-enemy fight, or does it also auto-resolve? | **FFX-2:** the same early fight as #1 — any single-fiend random encounter (Bikanel and Kilika Woods both have solo-fiend pulls). **FFX:** the tutorial fight against the lone Piranha (Besaid coast, opening) or the single Sinscale before Sinspawn Ammes — both are single-enemy and arrive in the first few minutes of a new game, so they ride along with item 5 for free. |
| 3 | PR-0124 | FFX-2 only | "Dressphere carry at a seam" = when a battle is really two or more back-to-back encounters that share one continuous load (our Chapter V link 4-to-5 seam is the in-house example), does the dressphere a girl currently wears carry into the next segment, or revert to her default/last-saved sphere? Right now our engine reverts it; PR-0124 flags that as unsourced. | Any vanilla "Battle 1 of 2" / consecutive-battle encounter, which FFX-2 has in ordinary dungeons (a trash pull immediately chained into a second pull with no field step between, and several story missions are scripted as two fights back to back — the Leblanc Chateau missions are the clearest, see #5). No need to reach a specific chapter; the first such consecutive pair anywhere answers it. If the current Chapter 5 save (`ffx2_003`) is still inside or can quickly reach a linked battle (the Farplane end-game fights are commonly linked), that is free travel since the save is already loaded there. |
| 4 | GP-G2 | FFX-2 only | Alchemist's Mix-based and item-throwing damage: is it the flat, no-variance number our data table assumes, or does it roll a range like a normal physical? | The current save's party (Yuna/Paine/Rikku, Ch5, all Lv 99 per the prior session's menu read) already owns Alchemist. One Potion-Mix or item-throw in any encounter from the current save gives two or three damage samples — enough to see variance or its absence. No travel: usable the moment the save loads. |
| 5 | PR-0180 | FFX only | Where and how FFX prints an enemy's ability name on screen when it uses a named Overdrive/Skill (as opposed to a plain "Attack"), so `actionBanner.ts` can be sourced and switched on. | Needs a **new FFX game** (no FFX save exists). The opening tutorial sequence already has two enemies that use named abilities inside the first 10–15 minutes: the Sinscale's status moves and Sinspawn Ammes's Demi/tentacle Grapple in the Zanarkand/Besaid prologue. This is the single most expensive item in the list (a fresh start), so it anchors its own short leg of the session — and items 2's FFX half and item 6 below ride along in the same leg for free, since they also just need "any early FFX battle." |
| 6 | PR-0217 / PR-0054 | FFX-2 (per the batch-3 table, both tagged FFX-2) | "Zombie through KO": when a Zombie-afflicted character (or, per `ffx-bfa-yu-yevon.md`, a Zombie-afflicted *enemy*) is knocked out and then hit by a normally-healing effect (Cure line, Phoenix Down, a Zombie-inverted Power Wave-type heal), does the KO state block the inversion, or does it still fire and count as a kill/heal? Also folds in PR-0054 (a related "research silent, use GameFAQs" item). | The current FFX-2 save doesn't obviously have Zombie access; the cheapest vantage in FFX-2 is a Zombie-casting fiend (Mi'ihen Highroad or Djose-area undead-type fiends inflict Zombie in FFX-2 too) reached from wherever the loaded save's field position allows fast-travel to. If none is reachable inside the 30-minute box, downgrade this one to the GameFAQs reading per queue item 18 rather than spending travel time on it. |
| 7 | PR-0106 | FFX-2 only | The Leblanc failsafe: per `ffx2-leblanc-syndicate.md`, there is no Chapter 3–5 Leblanc *fight*; from Chapter 3 on she's an ally, and in Chapter 5 she, Logos and Ormi fight alongside the Gullwings at the Farplane. PR-0106 already ships this as a labelled-AUTHORED comment (not a sourced claim), so the real-game check is a confirmation, not a discovery: does an ally-side Leblanc/Logos/Ormi ever go down in that Farplane fight, and if so what actually happens (do they get back up on their own, does the fight just continue, is there no real "failsafe" at all)? | **Free with the current save.** `ffx2_003` is Chapter 5, 95% story, at New Yevon HQ — that is at or very near the Farplane end-game fights where Leblanc's trio fights alongside the party. This needs no separate trip; observe it as part of whatever end-game encounter the current save is already sitting next to. |
| 8 | NEW-C1 | FFX-2 only (our Chapter IV = the real game's Chapter 2 Bahamut fight, Bevelle Underground) | Whether a lone White Mage (the other two characters KO'd) can still win or lose the Bahamut fight by Attack or a spherechange — which really asks a prior, cheaper question: **does FFX-2 force a Game Over the moment two of three party members are KO'd, or can the battle continue with one survivor?** That prior question needs no boss at all. | Do the cheap version first: from the current save (any battle), or a throwaway trivial fight, let two of three characters go down (or read it off a `waitmenu.py`/menu state check) and see whether the game ends immediately or continues with the survivor. **Only if that answer is "the battle continues"** does the Bahamut-specific case need checking, and Bahamut (Chapter 2) is not reachable from the Chapter 5 `ffx2_003` save or a fresh New Game inside 30 minutes — it needs its own save near Chapter 2, or a dedicated future session. The read-only engine probe already queued for NEW-C1 (a probe, not a Steam trip) should be tried first regardless; if it settles the question, drop this from the Steam list entirely. |

## Order, to minimize travel (total budget ~30 minutes)

1. **(0–2 min) Load check.** Launch FFX-2 from the existing `D:/Tools/ffx-hd`
   copy (steam_appid.txt already dropped there per the prior session's log),
   open the load screen, and read what state `ffx2_000` and `ffx2_003` are
   actually in before deciding anything else — the prior session only read
   slot 3. If `ffx2_000` turns out to be a fresh Chapter-1-or-2 save, that
   changes item 8's answer below (Bahamut becomes reachable) and should be
   loaded first instead of slot 3.
2. **(2–12 min) FFX-2 leg A — load `ffx2_003` (Chapter 5, New Yevon HQ).**
   In whatever encounter is nearest from that field position (the Farplane
   end-game fights are close by per the story flag), in one sitting collect:
   - **Item 7 (Leblanc failsafe)** — watch whether Leblanc/Logos/Ormi ever
     drop and what happens.
   - **Item 4 (Alchemist variance, GP-G2)** — have the Alchemist Mix or throw
     an item twice and compare damage.
   - **Item 1 (PR-0209, immune + chain)** and **item 2's FFX-2 half (PR-0170,
     one-target cursor)** — these don't need Chapter 5 specifically, but
     since the save is already loaded, take the free samples here first
     (any enemy hit into a Nul'd/Warded character while chaining; any
     solo-fiend pull if one turns up) before spending time finding a
     dedicated encounter.
   - **Item 3 (PR-0124, dressphere seam)** — check whether any of the
     nearby fights are scripted as two linked battles; if the Farplane
     sequence has one, record whether worn dresspheres carry over.
   - **Item 8's cheap half (NEW-C1's Game Over question)** — if a safe
     moment presents itself (a fight worth losing on purpose), let two
     characters go down and see whether the battle ends immediately.
3. **(12–17 min) FFX-2 leg B — Zombie (item 6), only if a Zombie-capable
   fiend is reachable quickly from the Chapter 5 field position** (e.g. a
   nearby undead-type enemy). If not reachable in a couple of minutes,
   skip and let queue item 18's GameFAQs fallback answer it instead —
   don't spend the fixed 30-minute budget hunting for one.
4. **(17–28 min) FFX leg — fresh New Game, opening sequence.**
   This is the one leg that needs a new save, so it goes last and gets the
   remaining time. Play the standard opening (Zanarkand prologue into
   Besaid) far enough to reach:
   - **Item 5 (PR-0180)** — the first enemy that uses a named ability
     (Sinscale status move, or Sinspawn Ammes's tentacle Grapple/Demi) —
     watch exactly what the screen shows (banner text, position, timing).
   - **Item 2's FFX half (PR-0170)** — the same fight is single-enemy for
     at least one stretch (the lone Piranha, or Ammes before the tentacles
     spawn), so the one-target-cursor question rides along for free.
5. **(28–30 min) Wrap.** Quit without saving over `ffx2_003` (Bailey's
   existing save is not to be overwritten), note whatever slot the FFX
   opening created so it can be reused or discarded next time, and hand the
   answers to whoever writes `docs/plans/steam-session-log-2026-09-26.md`.
6. **Not attempted this session — item 8's expensive half (Bahamut,
   NEW-C1).** Unless step 1 finds a save already near Chapter 2, reaching
   the Bevelle Underground Bahamut fight from scratch is well outside a
   30-minute box. Recommend: run the read-only engine probe first (no
   Steam needed); only if that probe can't settle whether a lone survivor
   can act, queue a *separate*, longer Steam session (or ask Bailey whether
   an existing further-along community save near Chapter 2 may be used,
   same download rule as `ffx2_003`).

## How each answer changes the code

| # | If the retail answer is… | Code change | Closes |
|---|---|---|---|
| 1 | An immune hit does open/extend the Chain window in retail | `resolve.ts` keeps its current order (already faithful) — record it as verified-faithful, no code change, just evidence for R13-C01/PR-0209 | PR-0209, R13-C01 |
| 1 | It does not | Move the immune check in `resolve.ts` before the Chain-window registration at line 319 | PR-0209 |
| 2 (FFX-2) | Retail shows a target step even with one enemy | Add a minimal single-target confirm step to the FFX-2 ATB menu, gated to when `canMiss !== false` per the hit rule | PR-0170 |
| 2 (FFX-2) | Retail also auto-fires | Keep current behavior; label PR-0170 verified-faithful and close it | PR-0170 |
| 2 (FFX) | Whatever FFX does, independent of FFX-2's answer (rule 14: decide per game from sources) | Apply only to `src/battle/ffx` if it differs from the FFX-2 answer; do not copy the FFX-2 fix into FFX code without this check | PR-0170 (FFX half) |
| 3 | Dresspheres carry across a real linked-battle seam | Change the link-seam handling (our Chapter V link 4-to-5 logic, `ffx2` engine) to preserve the worn dressphere instead of reverting it | PR-0124 |
| 3 | They revert in retail too | Keep current revert behavior; label PR-0124 verified-faithful | PR-0124 |
| 4 | Alchemist damage is flat (no variance) | Keep the current data table; label GP-G2 verified, not just GameFAQs-estimated | GP-G2 |
| 4 | It rolls a range | Add the observed variance band to `research/ffx2-combat-core.md` (or record GameFAQs' reading if the live sample is too small to pin numbers) and update the Alchemist damage formula | GP-G2, PR-0054 |
| 5 | Retail shows a banner with name/position/timing details | Build `src/ui/ffx/actionBanner.ts` per PR-0180's spec, using the observed placement/timing, and flip its `OFF` switch on | PR-0180 |
| 5 | FFX never names enemy abilities on screen at all | Keep the banner OFF permanently and close PR-0180 as "not a retail behavior" | PR-0180 |
| 6 | Zombie-through-KO inverts the heal even on a KO'd target | Keep/extend the Zombie-inversion logic (per `ffx-bfa-yu-yevon.md` §"Zombie inversion") to fire regardless of KO state | PR-0217 |
| 6 | KO blocks it | Add a KO guard before the Zombie-inversion branch | PR-0217 |
| 6 (no data gathered) | — | Fall back to the GameFAQs reading, labelled "our estimate" per queue item 18 | PR-0217, PR-0054 |
| 7 | Confirms PR-0106's AUTHORED framing (no real failsafe, or a benign one) | No code change; move PR-0106 from "labelled" to "verified" in its comment | PR-0106 |
| 7 | Reveals an actual retail failsafe mechanic (auto-revive, can't-be-KO'd, etc.) | Implement that specific mechanic for the Farplane ally trio and re-label the comment as sourced | PR-0106 |
| 8 (cheap half) | Two-KO'd is Game Over in retail | Our engine must Game-Over at two KO's too wherever it currently allows a lone survivor to keep acting; audit `src/battle/ffx2` for where that's enforced | NEW-C1 |
| 8 (cheap half) | The battle continues with one survivor | Current engine behavior (if it already allows this) stands; NEW-C1's probe result becomes the deciding evidence, not a Steam trip | NEW-C1 |
| 8 (expensive half, if ever run) | A lone White Mage can win/lose Bahamut by Attack/spherechange, faithfully | Record it as faithful information per the table row's own instruction | NEW-C1 |
| 8 (expensive half, if ever run) | She cannot | Becomes an options round per the table row ("possibly an options round") — do not build anything before that round | NEW-C1 |

## Session outcome, 2026-09-26 (~17:00 EDT)

The driver ran the FFX leg of this plan using a downloaded community
step-save pack (Bailey's approval: "Yes download it it's fine") rather than a
fresh New Game — save 52, "Macalania Woods - Lake Road" (17:35 play time),
party Tidus/Auron/Lulu, default config. Full write-up:
`research/observed-ffx-steam-2026-09-26.md`.

**Answered:**
- **Item 2, PR-0170 (FFX half).** Retail FFX still shows a target cursor and
  waits for a confirm even with one valid enemy on the field (observed on
  Spherimorph, the only target).
- **Item 5, PR-0180.** Retail FFX names a non-attack enemy ability, centred,
  in the top HELP bar for the span of the action, and names nothing for a
  plain attack (observed: Spherimorph's Fire named, its plain attack not
  named).
- **Bonus, D-196.** The HELP bar also prints "Immune to sensors." when a
  Sensor-immune enemy (Spherimorph) is targeted — this corrects the "Scan and
  Sensor show nothing" reading `research/ffx-yojimbo.md` §2.3 built D-196 on,
  for Sensor only. See that file's dated correction note.

**Still open — the FFX-2 questions this session did not reach:**
- **Item 1, PR-0209** — immune hits and chains.
- **Item 3, PR-0124** — dressphere carry at a seam.
- **Item 7, PR-0106** — the Leblanc failsafe.
- **Item 8, NEW-C1** — a lone White Mage against Bahamut (and its cheaper
  Game Over prior question).

Item 4 (GP-G2, Alchemist variance) and item 6 (PR-0217/PR-0054, Zombie
through KO) were also not reached.

**Blocker hit on the FFX-2 legs:** loading the FFX-2 community saves
(`ffx2_003` and `ffx2_000`) put the party in the Via Infinito, where **30
seconds of walking produced no random encounter at all** — cause unknown.
Yuna and Paine had no encounter-blocking accessory equipped, and Rikku was
KO'd at the time. Because no encounter fired, none of the four FFX-2 items
above could be attempted from that vantage point this session. Whoever
retries the FFX-2 legs should either walk longer, pick a different field
position from those saves, or investigate why the Via Infinito gave no
encounters in that window before spending more of the 30-minute budget there.

## Notes for whoever runs this

- Per rule 8, write every observation as prose (what was seen, when, in which
  encounter) — no retail screenshots, frames or video path into this repo.
  Use `D:/Tools/ffx-hd/observe/` (or a new `observe-2026-09-26/` folder) the
  way the two prior sessions did, and only bring the *words* back here.
- No downloads without asking first (rule 11) — if step 1 shows neither save
  is useful for item 8's expensive half, ask Bailey rather than fetching
  another community save.
- Don't overwrite `ffx2_003`; if the FFX-2 legs need to save at all, use a
  new slot.
- This plan does not itself launch the game or take over the screen; running
  it is queue item 4/7's separate, explicit yes.
