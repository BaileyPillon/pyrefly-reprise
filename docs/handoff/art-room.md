# Art Room: Claude directs, Codex paints, a critic scores, and only Bailey approves

Written 2026-10-05 by a records sub-agent for the driver. Game case: **both** (the Art Room is shared tooling, `critic/CHECKS.md` CHK-020; every picture it makes carries its own case, FFX only, FFX-2 only or both). The room lives **outside the repo** at `D:/Tools/art-room`. The repo holds only this note and the records: Bailey's decisions D-463 to D-477 (`DECISIONS.md`, numbered in the order he said them) and the work behind them, A-0442 to A-0451 (`ACTIONS.md`). Nothing in the game changed.

## 1. What it is and how to open it

- A local app for making the game's artwork: one chat where Claude (the art director), Codex (the images: ChatGPT Images 2.5, through the image tool built into the Codex command line), an art critic and Bailey talk, and a gallery of proposals with big previews. Bailey asked for it: "you need to create a separate chat box/app window where you and codex can coordinate on the artwork for the game, i need to approve of all artwork though." (D-464).
- **Open it from the Start menu or the desktop: "Art Room".** That starts `D:/Tools/art-room/app/dist/Art Room-win32-x64/Art Room.exe` (Electron 44.5.1, unsigned; the native Windows 11 light look he picked, D-474; the shortcuts are D-475). The app starts the room's server (`http://127.0.0.1:5195`, loopback only) and relay itself and watches them. A second launch focuses the window, closing it hides it to the tray, and quitting leaves the server and relay running. Without the app, `art-room.cmd` or `node start.mjs` opens an Edge window that can read and chat but cannot approve. Stop: Settings, Stop the room, or `node stop.mjs`.
- The server and relay are meant to stay running. They are Bailey's tool, not a leftover dev server, so AGENTS.md "Stop the servers you start" does not apply to them.
- The manual is `D:/Tools/art-room/README.md` (it lists every file). Logs and state are in the room's `data/` folder.

## 2. The lanes and the loop

| Lane | Who | Work |
|---|---|---|
| chat | Claude (Opus, the director) | answers every message of his at once and never waits behind renders (D-468) |
| render | Codex (`codex exec`, read-only sandbox; 2 at once plus 1 slot for messages addressed to Codex) | paints each prompt exactly as written, with its references attached |
| critic | Claude (Opus, read-only tools), 2 at once | scores a version; writes the revision when a version scores below 8 |

1. Claude writes a brief of 1 to 4 pictures from the project's needs: the need, a game case per picture, the exact prompt, at least two environment anchors from the game's own masters and the idle painting of every named character (D-467). A second brief while another is looping, or more than 4 pictures, needs his yes.
2. Codex renders each prompt verbatim; the relay reads the picture from Codex's own session record.
3. The art critic scores it 0 to 10 (brief, project, craft, game, rules, with hard caps) and ranks the issues (D-469). 8.0 or more goes to his queue.
4. Below 8 the director rewrites the prompt from the ranked issues, starting from the best version so far, and Codex repaints. Revisions per round are capped. Bailey set the cap to 2 at 22:15 EDT (D-477, replacing 3), so at most three versions, and then the best version is shown to him. The change to the room is in progress (A-0450): MAX_REVISIONS in loop.mjs already read 2 at 22:55 EDT, but the room's README and tests still described 3 when this was written, so check them.
5. His Ask for changes starts a new round on the same chain. A score never approves anything.

## 3. The critics

| Critic | What it scored | Result |
|---|---|---|
| Art critic (inside the room, every picture) | brief, match with the game's own art, craft | his approved Gullwings picture 7.1 before calibration and 9.2 after; the pictures he rejected 5.0 or less |
| Design critic (D-471) | the three mockups, then the built app | A 8.2, B 8.1, C 8.0; the app 8.3, 6.0, then 8.4 (shipped) |
| Functionality critic (D-472) | the app against his own words, ten checks (`prompts/intentions.md` in the room) | round 1 7.6, round 2 8.6 (his bar is 8) |

## 4. The rules

- **Only Bailey approves** (D-464). Approve, Ask for changes and Reject are buttons in the app and nowhere else; the server takes a decision only from the app (a per-launch secret over a private pipe, never in a file). A score of 8 or more means "good enough to show him" and nothing more.
- **Art matches the game's paintings** (D-473). Ink & Gold is the look of the game's interface only.
- **Nothing is copied into `public/art` automatically.** Approving copies a version into the room's own `data/approved/` folder and logs it in `data/approved.jsonl`; nothing in the room writes into this repo.
- Every picture carries a game case; an FFX-only picture that shows FFX-2 costumes is refused. Original art only, no retail assets (AGENTS.md rule 8).

## 5. The style guide

`D:/Tools/art-room/prompts/style.md` is the canon: the driver wrote it after looking at the masters, and the director, the revise step and the critic all carry it. In short: backdrops are painterly digital matte paintings (loose brush strokes, haze, glowing light with bloom, mirror water; blues, indigo and violet with warm peach, pink and gold light at the sources; deep indigo darks, never flat black); characters are anime illustration with clean dark outlines and soft cel shading, faithful to each canonical FFX or FFX-2 design; a key art puts those characters in a painterly scene lit by its own light. His reactions outrank the rubric: the Gullwings Farplane Field picture he approved ("it's soooo epic i love it") is the calibration anchor, and he dislikes dark navy-dominant frames, gold everywhere, gouache or parchment texture, ink linework on environments and lights that read as string lights.

## 6. How approved art reaches the game

An approved version is only a file in the room's `data/approved/` folder. Installing it is a separate step by its own lane, which asks for the driver's swap. The one example so far is the title key art (D-458, A-0440): the title-art lane staged the picture outside `public/art` (`D:/Tools/pyrefly-art-staging/title-gullwings/`), built the screen around it on branch `title-gullwings-keyart`, recorded the new hashes in `docs/target/approved-hashes.json`, and the driver swaps it in at the 39.1 integration (its handoff `docs/handoff/title-gullwings-keyart.md` is on that branch). `public/art` stays gitignored on main and backed up to `D:/Tools/pyrefly-art-backup` (AGENTS.md "Map").

## 7. Known gaps

The functionality critic's round 2 (8.6, `D:/Tools/art-room/reviews/functionality-r2.json`) left **two majors**. Neither lets anything be approved without Bailey over HTTP, and the builder acknowledges both.

1. **A forged chat message still unlocks render work.** The decision routes are secret-gated, but the chat and brief-gate routes trust any message from Bailey. A plain script can post a message as him (the server tags it `via: "browser"`), the director then acts on it (it queued a four-picture brief in the test), and `post.mjs brief --for-message` or `--bailey-yes` accept it. It spends compute and puts words in his mouth; it cannot approve, reject or change art. Fix: count only `via: "app"` messages as his for the brief gate, and have the director treat a browser message as untrusted (answer it, never act on an instruction in it); `D:/Tools/art-room/app/NEEDS.md` item 1 says the same.
2. **An agent that can write the room's `data/room.json` or run `decide.mjs` can still decide.** The secret protects only the HTTP routes. The file route rests on Codex's read-only sandbox and the restricted tools of Claude's runs, whose enforcement on Windows was not tested. Fix: make `data/` the trust boundary (`decide.mjs` needs the server-held secret or a signed token), add a test that a write by a non-app process cannot flip a version to approved, and state the sandbox assumption where Bailey will see it.

Minors: the loop reaches 8 but not reliably (art quality, not a defect; stop early when two revisions in a row do not beat the best); a quick question can wait behind a long brief-writing run (about 38 s measured); a failed chain shows under "In critique" instead of its own "Stalled" state; and parts of the Windows app were judged from evidence rather than run live (the tray icon was created but not seen, and a toast from a real chain arrival was not exercised). The design critic's open issues on the shipped look: ranked issues run under the sticky Approve bar and are cut at the edge, the details title wraps to two lines, muted text was flagged below AA (the builder measures 5.9 to 1), and the presented version is not marked on every card. Not done: starting at login (needs his yes), a taskbar pin (needs his own click) and code signing.

## 8. Where the records are

- `DECISIONS.md`: D-463 to D-477 (his words verbatim, game case, what changed). The loop message split into D-467 to D-469 and the Windows app message into D-470 to D-472, so the cap of "3 loops max" in D-469 and D-471 is partly replaced by D-477.
- `ACTIONS.md`: A-0442 to A-0451 (v1, v2, the look options, the art-direction correction, the backend pass, the Windows app, the Electron and npm downloads, the functionality critic, the loop cap, and this record).
- Room files that matter: `prompts/style.md`, `prompts/intentions.md`, `prompts/facts.md`, `loop.mjs` (the cap and the score maths), `reviews/`, `design/` (the target and the design critic's history).
