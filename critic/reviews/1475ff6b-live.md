```text
Build / artifact / target version: main 1475ff6b / bundle B0cfXTil / artifactHash d26db6673e3d869c5de873f7391263df0992c3f82d16b5675bc0bc544dda26cb
Review: live
Deployment: PASS
Changed area: NOT APPLICABLE
Ship: N/A (live review does not gate ship; the focused report critic/reviews/1475ff6b-focused.json settled that at deploy)
Milestone: not assessed
Quality: not assessed (live review does not recompute the milestone score)
Targets: not assessed
Top issues: LV30-1 (minor, phone: the first-time coach card says ENTER CONTINUE; a tap on the card dismisses it, so it works but the hint is keyboard wording); LV30-2 (informational: the Right Fin cannot be on screen at the first player turn, see Coverage)
Coverage: tested = exact artifact (1006 files compared with --full against critic/artifacts/1475ff6b.json, diffed from 49005f73); Chapter XVII by real keys to a player turn on desktop 1600x900 (range order Close in queued as ORDER Cid, cancel path from the Orders list) and by taps on a phone 390x844 hasTouch (title, briefing skip, tap the card, tap the plate, Start Battle, cutscene taps, Orders, Close in); Chapter XVIII by real keys to a player turn (13-turn countdown ring, Gaze in 6, Special opened, cancelled, reopened, order submitted); Chapter XIII (ffx2-trema) by real keys to a spherechange to Songstress for Paine (cancel path first); Seymour Flux advisor card unchanged over 8 samples 700 ms apart with the menu open (advisor v4 FFX); P pause, Escape resume, then Escape pause and P resume, H hide and restore; the battle theme (boss-seymour) is back after resume; FF7 door by L-I-M-I-T to a real turn; reload keeps the save (attempts 1, pausePanelsHidden true set by H); prerendered music fetched (title, chapter-select, scene-fahrenheit, boss-evrae, pause mp3) rather than the synth fallback; 0 console errors and 0 responses >= 400 in every context. Not tested = Right Fin on the phone (the Right Fin is not in the fight until link 2; at link 1 the combatants are the Left Fin and Cid, so no real-input path reaches it inside a smoke), Rikku's Songstress painting (Paine only), a win or loss of either Sin chapter, Giga-Graviton on turn 13, advisor v4 on FFX-2 (stays v3), the Chapter VII fixes (Seymour headline, aftermath, no Phoenix Down on a KO'd foe), the full upgrade matrix (CHK-024 full)
Next required review and why: none newly triggered by this pass; the deep obligation carried on 1475ff6b (critic/pending/1475ff6b.json) stands
Elapsed review time / repeated work avoided: about 48 minutes (most of it the 6-minute full manifest compare and finding the phone and Orders input paths); no earlier evidence reused for this sha
```

## Step 1 - Exact artifact (CHK-017)

```
node tools/artifact-manifest.mjs verify-live --manifest critic/artifacts/1475ff6b.json --url https://baileypillon.github.io/pyrefly-reprise/ --changed-from critic/artifacts/49005f73.json --full
```

Result PASS: artifactHash d26db6673e3d869c5de873f7391263df0992c3f82d16b5675bc0bc544dda26cb, liveManifest match, checked 1006, mismatched [], missing [], wrongType [], errors []. (`--full` because the marker's planned review is deep.)

## Step 2 - Real-input smoke (headless Playwright, PYREFLY_BROWSER=gpu, one browser at a time, cache-busted URL, fresh context each)

Board: 18 tiles; order seymour-flux, yunalesca, braskas-final-aeon, seymour-anima-macalania, evrae-airship, yojimbo-cavern, seymour-natus, seymour-omnis, isaaru-via-purifico, sin-fins-core, sin-face, then the FFX-2 chapters. Every chapter was reached by pressing ArrowRight until `screenState.selectedId` equalled the intended id (assert or throw), then Enter through party prep and the cutscene to `battle` with `awaitingMenu` true.

- Chapter XVII, desktop: the Left Fin plate reads FAR ("The core does not charge at range"); Attack is disabled at FAR; Orders opens PULL BACK (Already far) and CLOSE IN (Trigger). Escape returns to the top menu (screen stays battle). Confirming Close in shows "ORDERS CID TO CLOSE IN", Cid says "Give me a second", and the queue shows an ORDER chip on Cid; the battle log grew 1 to 5. Music boss-evrae (prerendered).
- Chapter XVII, phone 390x844 with touch: title chip tap, briefing "TAP SKIP", tap the XVII card, tap the plate, Start Battle, tap through the cutscene (58 taps), player turn. Orders shows PULL BACK and CLOSE IN with "This order costs: Turn now, Cid's next turn"; a tap on Close in queues Cid (log 1 to 5). The Left Fin and the ship deck fit the frame. Combatants at link 1: the Left Fin (65000) and Cid; there is no Right Fin yet.
- Chapter XVIII, desktop: countdown ring "13 TURNS LEFT", "MOUTH SHUT", "Giga-Graviton on Sin's 13th turn: our estimate (the sources say 12 or 13)", "GAZE IN 6". Attack starts disabled; Special opens (Cheer, Provoke, Delay Attack, Delay Buster); Escape backs out to the menu; reopen and confirm grew the log 1 to 7 and the next player menu came back (Special x2, White Magic x14, Summon x5).
- Chapter XIII (ffx2-trema): Paine's Change list shows Warrior and Songstress; Escape back to the command list; Change, Songstress, confirm: Paine shows SG, HP 5355 to 2440, log 23 to 30, and the painted white Songstress figure stands in the party row (not a grey mannequin). Screenshot: scratchpad r30/trema-songstress.png.
- Seymour Flux (FFX, advisor v4): with the menu open the advisor card text was identical in 8 samples over about 5.6 s ("Next best move, Tidus, Slow to Seymour Flux, in White Magic, 12 MP"). Note only: it recommends Slow on Seymour Flux, which NOW.md already lists as an open source conflict.
- Pause: P opens pause, H hides (body text 818 to 455 chars) and H restores (818), Escape resumes to battle; then Escape opens pause and P resumes; the audio state went boss-seymour, pause, boss-seymour.
- FF7 door: L-I-M-I-T on chapter select, 10 Enter presses to a battle, an Attack grew the log 0 to 4.
- Console errors 0 and 404s 0 in every context.

## Step 3 - Reload smoke (CHK-024, lightweight)

In Seymour Flux the save read attempts 1. Pause plus H set `pausePanelsHidden` true (a real setting change through the UI); after a reload the save was identical (attempts 1, pausePanelsHidden true), the game booted to the title, and `snapshotState().save.settings.pausePanelsHidden` was true. The full upgrade matrix is not part of this pass (notTested).

## Findings

- LV30-1 (minor, phone, first-time coach): the Auron coach card on Chapter XVII says "ENTER CONTINUE" on a touch phone. A tap on the card body dismisses it and the command buttons work with it up, so nothing is blocked. Smallest fix: show "TAP TO CONTINUE" when the input mode is touch. Not a critical or major.
- LV30-2 (informational): a smoke cannot show both Fins together at the first turn, because the Right Fin joins at link 2; the phone framing of the Left Fin at link 1 is fine.
