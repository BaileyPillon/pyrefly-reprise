Build / artifact / target version: a021787a (the Leblanc hotfix "Old spacing, real sizes", live as 39.4.2 since 2026-10-09T01:03:34Z; branch r394-int; code head d9bbce21) / bundle cUSnFK7q (assets/index-cUSnFK7q.js, assets/index-Ta9GcVj0.css) / the DEPLOYED artifact: artifactHash 713f2d21ab944898044c1c90d44fc39fda12ad4f93494d6e426af220a13f55ca, 4,539 files, 9,671,976,245 bytes (the focused review hashed its own rebuild, dist-gate: 3637f1f4a1e7081c2e3073c5d9d6d16e8473e74d39a70123761c48259429bf17, 9,671,976,233 bytes) / targets.json sha256 ba8a7e74a9d66640aff8515eba95a38d056b65fd90b8c4347b20f53f0f1c0b98 (unchanged)
Review: focused (ADDENDUM to critic/reviews/a021787a-focused.json: it re-binds that review to the deployed artifact; no behaviour is re-measured)
Deployment: NOT APPLICABLE (as in the focused report: the exact artifact at the live URL is the live review's obligation, critic/reviews/a021787a-live.json)
Changed area: FAIL (unchanged from the focused report: CHK-009 Act III plate names, as on live and 39.4 (F3942-05); CHK-014 the phone's Act I right edge, live's own and milder here (F3942-01); CHK-003 the intent card that folds to stay off the heads (F3943-01); CHK-026 and CHK-027 not run. The pick's properties are met and nothing regressed at critical or major severity)
Ship: SHIP (unchanged: no critical defect and no regression at critical or major severity against live 39.4.1; the disclosures are the focused report's, F3943-03 now settled as shipped inert)
Milestone: not assessed
Quality: not scored (focused pass)
Targets: required 1 / matched 1 / failing 0 / unverified 0 / waiting 0 (Bailey's pick "Old spacing, real sizes (Recommended)", 2026-10-08; unchanged)
Top issues: F3943-03 (polish, delivery: the unreleased title painting ships inert; the deploy's regenerated art index now lists it under "title", which no code asks for); F3943-04 (suggestion, tooling, new: a review build made with vite alone skips the art-index regeneration the deploy does, so its hash cannot equal the deploy's); the focused report's F3943-01, F3943-02, F3942-01, F3942-03, F3942-05 unchanged
Coverage: tested = the reconcile of the two artifacts (both file lists key by key, the repo's diff tool, the hash recomputed with the one differing entry swapped, the two art indexes diffed, dist-gate re-hashed from disk, the live art index hashed, every reader of the title list read in src); reused = the whole focused review (a021787a-focused.json, unchanged) and the deploy's own decode pass; not tested = what the focused report did not test, and nothing new (no browser, no behaviour)
Next required review and why: the live verification of this exact artifact (critic/reviews/a021787a-live.json, CHK-017, 713f2d21ab944898...), then the deep review already owed on the live builds, as in the focused report
Elapsed review time / repeated work avoided: about 20 minutes of wall clock, no rebuild, no browser; everything the focused review measured is reused because the bytes it measured are the deployed bytes except one generated index

## The gap

`node tools/critic-clear.mjs --report critic/reviews/a021787a-focused.json` refuses: "report artifact hash is not the deployed artifact". The focused report recorded 3637f1f4a1e7081c... (the review's own rebuild, `dist-gate`); the deploy shipped 713f2d21ab944898... (`dist-release`), with the same bundle name, cUSnFK7q. Both manifests hold 4,539 files; the deployed one is 12 bytes larger.

## The reconcile, file by file

Both file lists (path, bytes, sha256) were compared key by key: the same 4,539 keys in the same order. **One hashed file differs. The other 4,538 have the same sha256**, among them `assets/index-cUSnFK7q.js`, `assets/index-Ta9GcVj0.css`, `index.html`, both workers, `art/derived.json`, `art/title/echo.webp` and `art/title/echo.json`, the audio, the fonts and every other painting.

| What differs | Reviewer's dist-gate | Deployed dist-release | Cause |
| --- | --- | --- | --- |
| `art/manifest.json`, the generated art index (the only hashed file) | sha256 cdb17da1b4af56b0f8d6d0915b7c614c36c1533d0d28fa3bc54f5a5aac7f30c7, 100,392 bytes (the file live 39.4.1 serves) | sha256 40c33654ace0bf5ffd7fb7aaf848f04814444c53a1f126fbd6988d4aed4a6338, 100,404 bytes | two hunks, below |
| inside it: `generatedAt` | "2026-10-07T04:45:15.370Z" | "2026-10-09T00:44:33.622Z" | the build stamp; `tools/gen/manifest.mjs` rewrites the file, stamp included, only when the listing changed |
| inside it: the `title` list | ["keyart"] | ["echo", "keyart"] (the 12 bytes: four spaces, "echo", a comma and a line feed) | the deploy regenerates the art index first (`tools/deploy-pages.mjs` step 2: "The art index has to be regenerated from whatever the fleet finished since the last release, before vite copies public/"); `public/art/title/echo.png` is in the tree. The review's direct `vite build` skipped that step, so dist-gate kept the 2026-10-07 index, which did not list the plate yet. public/art/manifest.json was rewritten at 20:44 local, 19 minutes before the deploy |
| manifest metadata, outside `artifactHash` | hash-only: decodeChecked false, no `decode` fields, problems [] | decodeChecked true, `decode` fields (3,373 ok, 2 blank), problems = the 2 blank images | the deploy ran the decode pass the focused report listed as not run; the two blank images are Paine's eyeR-catch layers, listed in `critic/policy.json` intentionalFlatImages and in live 39.4.1's manifest too |
| ordering, the manifest's own entry | same order | same order | `artifact-manifest.json` is left out of `artifactHash` by rule; `.nojekyll` and `_headers` are in neither list |

Nothing differs in the art index but those two keys: every other top-level key is equal, and `title2x` is ["keyart"] in both. The echo plate itself (`art/title/echo.webp`, `art/title/echo.json`, and the `art/derived.json` entry) is in both artifacts with the same bytes, and the bundle's embedded art list names `art/title/echo.png` in both (it is the same bundle): it is the inert painting the focused report disclosed as F3943-03. The deploy's regeneration only lets the index say so.

## Why none of it can change the verdict

- **Nobody asks the list about the new entry.** The `title` list is read in two places in `src`: `judge()` in `src/engine/ArtManifest.ts`, which answers `manifestKnowsAsset` and `manifestKnowsAssetNow` for the URL of a plate a caller asks about, and `hasTitleArt()`, which has no caller. The only title plate any source names is `TITLE_PLATE = 'art/title/keyart.png'` (`src/app/screens/frontend/titleMarkup.ts`); the retina path reads `title2x`, equal in both. Nothing under `src` names `title/echo`. An entry nobody asks about changes no answer (`data/readers-of-the-title-list.txt`).
- **`generatedAt` is read nowhere.** It is parsed into a field of the manifest object and used by nothing.
- **The code that was measured is the code that is live.** `assets/index-cUSnFK7q.js`, the stylesheet, `index.html` and the workers have the same sha256 in both manifests, so every measurement of the focused review (places, sizes, the attacks, the cards, the route, the hidden chapter, the A/B against live) was taken on the deployed code, art and audio, served with the one index that differs.
- **It is outside the changed area.** Chapter VI's staging, the intent card, the FFX-2 HUD and the hidden chapter's reuse of the room load no title plate; the title screen loads `keyart`, as on live.
- **It adds nothing a player can reach that was not reachable.** `art/title/echo.webp` is fetchable by URL in both artifacts (F3943-03, shipped inert as its option (a)).
- **The decode status is unchanged.** The deploy's pass found only the two intentional flat layers that live 39.4.1 also lists.

## Proof

All in `critic/reviews/a021787a-focused-addendum/` (`data/`, `scripts/`):

1. `scripts/diff-manifests.mjs` on the two manifests: same keys, same order, one changed entry (`data/manifest-diff-reviewer-vs-deployed.txt`). The repo's own `node tools/artifact-manifest.mjs diff`: added [], removed [], changed ["art/manifest.json"] (`data/manifest-diff-reviewer-vs-deployed.json`).
2. `scripts/substitute-proof.mjs`: `artifactHashOf` over the deployed list gives 713f2d21ab944898044c1c90d44fc39fda12ad4f93494d6e426af220a13f55ca; with only the reviewer's `art/manifest.json` entry swapped in it gives 3637f1f4a1e7081c2e3073c5d9d6d16e8473e74d39a70123761c48259429bf17, exactly the reviewer's hash. That one entry accounts for the whole gap (`data/hash-substitution-proof.txt`).
3. `diff dist-gate/art/manifest.json dist-release/art/manifest.json`: the two hunks (`data/art-manifest.json.diff`).
4. dist-gate re-hashed from disk after the deploy: 4,539 files, 9,671,976,233 bytes, 3637f1f4a1e7081c...: the evidence was not disturbed (`data/dist-gate-rehash-summary.json`).
5. The live site serves `art/manifest.json` with sha256 40c33654..., the deployed file's (`data/live-art-manifest-sha256.txt`).
6. Against live 39.4.1's stored manifest the deployed artifact has 3 added, 1 removed, 3 changed (`art/derived.json`, `art/manifest.json`, `index.html`), 4,533 identical (`data/manifest-diff-deployed-vs-live-04cdcd45.json`).
7. Corroboration, not part of the proof: the live review of this build (critic/reviews/a021787a-live.json) ran 9 browser sessions on the live page with the deployed art index, 0 console errors in all of them and 0 requests for art/title/echo.* in the two real-key sessions that logged requests.

## What stands from the focused review

Everything else: the report `critic/reviews/a021787a-focused.json` and `.md` and their evidence folder are unchanged and are the measurements this addendum relies on. The JSON of this addendum is that report with the build re-bound (build.artifactHash, files, totalBytes), `CHK-017`'s reason, F3943-03's addendum and acceptance check, a new suggestion F3943-04 (tooling), one tested and one reused coverage line, the next review, and the notes. The verdicts are the same four: deployment NOT APPLICABLE, changed area FAIL, milestone not assessed, ship SHIP.

One caveat on two numbers, found while writing the live review (`critic/reviews/a021787a-live.md`, LV3942-1): the focused review's Act II and Act III first-menu captures were taken with the camera's chapter-framing fit engaged (a 64 px lens shift to the left, and 36 px up in Act III), so the "px from the command list" figures it quotes for the nearest fiend (288 and 227 px) are those of the shifted frame; in the at-rest frame the same places read 222 to 224 and 159 to 163 px on the live site (release 39.4 at rest: 234 and 170; the 64 px shift accounts for the difference). Every fiend is clear of the command list in both frames; the world positions, the ratios to the girls and every verdict are unaffected. It is in the JSON's notes too.

## Process notes

- No browser, no server, no rebuild: nothing behavioural is re-claimed. The only thing started was a read-only re-hash of dist-gate.
- Nothing was committed, cleared or deployed. `critic/pending`, `critic/ledger.json` and `docs/deploys.log` were not touched. To settle with it: `node tools/critic-clear.mjs --report critic/reviews/a021787a-focused-addendum.json` (validated here with the same `validateReport`; a dry run of `applyReport` against the build's marker says it would settle `focused` with FAIL, as the verdicts say, and leave `live` and `deep` pending).
- F3943-04 is the lesson: a review build should run `node tools/gen/manifest.mjs` before `vite build` (as the deploy and `npm run build` do), or the report should say that the deploy regenerates the art index.
