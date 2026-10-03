# r37-mix-polish: paper preflight (critic-plan class DEEP after deploy)

Branch `r37-mix-polish`, from `origin/main` c69de96a (the r36fix merge). Written before the review, in the 5-to-10-minute form AGENTS.md
rule 15 asks for. The class is DEEP because 34 substantial checkpoints sit since the last deep review (not because this branch touches the
save-data class: it does not, so there is no `-savedata` branch). Lane: MAX mix polish, round 19's polish issues.

## What the change can break, and how it was made to fail soft

| Change | Game case | What could go wrong | Guard |
|---|---|---|---|
| DRESSPHERE SHOT is cut only when it can hold; handed back at another actor's action-start (`heldShots.ts`, `atbDue.ts`) | FFX-2 only | The shot never plays (menu always "due"); or hands back on a harmless flinch | The menu-due estimate is the DRAWN gauge's own rise (no number of ours); an unreadable DOM gives `Infinity` (cut as before); `stats.menuDue` / `actionBacks` / `skipped` are in the mix snapshot |
| Twirl keys pinned to one plane; keys prewarmed at idle; late keys give way to today's flourish (`twirl.ts`, `CommandMenu.ts` event) | FFX-2 only | A pose crossfade after the twirl becomes a cut for one frame; extra downloads in every FFX-2 fight | Pin only while a change plays; prewarm is `prewarmPainted` (the shared cache, one file at a time, idle priority, only files the art manifest lists); the event is additive and nothing listens without the mix |
| First-time Rikku coach line hidden while a held shot is up (`MaxMix.ts` CSS) | FFX-2 only (`[data-game='ffx2']`) | The line expires while hidden | It is hidden, not removed: it is back when the shot hands back, if its own timer has not run out |
| Downed footprint joins the fit (`downed.ts`, `clearance.ts`, `framing.ts`) and a body lays clear of the status rows (`ProneLay.setProneAvoid`) | both | A colossus master falls back toward today's rig (a smaller boss); a KO body overlaps a neighbour | Measured against the r36fix matrix (same blend, back and lens in every chapter run); the avoid hook is installed by the mix only while CHAPTER FRAMING is on and counts like a standing neighbour (ties keep the smallest slide) |

## Not built, with the reason

PR-0316 (Bahamut head), PR-0317 (Seymour Flux crown) and PR-0319 (Ginnem) were measured on this build and are not reproduced; see the handoff.
No visible change was made for them.

## Review order for the deep round

1. Chapter IV and XVI dressphere changes in Active ATB: shot lengths, hand-backs, the coach line, twirl strips (`docs/screenshots/r37-mix-polish/`).
2. A party KO in Chapter I at 1600x900 and 2000x1012 (and one FFX-2 chapter): the body clear of the rows.
3. The colossus masters: unchanged blend, back and lens against r36fix.
