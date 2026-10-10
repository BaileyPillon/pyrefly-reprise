# RE parity: FFX and FFX-2 battle mechanics, proven against the game code

Status: **plan, wave 0 under way** (2026-10-08). Track name `re-parity`. Owner: Bailey.
Split (Bailey's delegation rule, 2026-10-03): Sonnet agents do the extraction, the harness, the
ports and the tests; the main session plans, reviews the architecture and validates by re-running the
checks itself.

## The ask

Bailey, 2026-10-08: "use this https://github.com/morluto/rea and https://github.com/bethington/ghidra-mcp
to reverse engineer and decompile final fantasy x/x-2 battle mechanics. I have it installed in my pc
with steam. it's the x/x-2 remaster. It needs to be a 1:1 parity. this is very useful for our project."

## What "1:1 parity" means here

| Level | Meaning | How it is proven |
|---|---|---|
| P1 formula | For any input, our function returns the integer the game's function returns: same operand widths, signedness, order of operations, truncation, clamps | golden vectors made by emulating the game's own function |
| P2 draws | Same number of random draws per step, same range and expression (for example `r % 101`), same order | the harness stubs the game's RNG and records every draw |
| P3 generator | Each game's own RNG algorithm and stream map, seeded from our seed | vectors of the RNG function; needs Bailey's yes (below) |
| P4 timing | CTB ticks and ATB units in the game's own units; the conversion to real seconds written down | vectors, plus one stopwatch check where the frame rate matters |
| P5 data | Every number from the game's tables (kernel `.bin` files, compiled AI, FFX-2's shipped `.h/.ath/.src`), not from FAQs | table readers with row citations |
| P6 behaviour | Boss AI decisions follow the compiled scripts | per-boss rule tables cited to script offsets |

Out of scope: animation, camera, audio and art timing; departures Bailey chose on purpose (listed
under "Decisions needed"; each stays until Bailey says otherwise).

**Game case (AGENTS.md rule 14).** Every mechanic is FFX only or FFX-2 only: each game has its own
function in its own exe, proven separately. Shared plumbing (harness, test loader, the RNG interface)
is both.

## Sources, in order of authority

1. `FFX.exe` / `FFX-2.exe` from Bailey's Steam copy, build 25501027 (SHA-256 `0537B2A1...686D` and
   `6EA7F142...CD69`): static analysis in Ghidra 12.1.4 and emulation of single functions.
2. The games' data in the VBF archives: kernel tables, compiled AI, FFX-2's developer source files.
3. Community reverse engineering, as pointers only: Fahrenheit (symbol names; its FFX addresses are
   RVAs that match this build exactly at +0x400000), FFXDataParser, Grayfox96's FFX-RNG-tracker (the
   current source of most FFX formulas in `src/battle/ffx`).
4. FAQs and wikis (the current source of most FFX-2 formulas): cross-checks only.

## Tooling (all outside the repo, under `D:\Tools`)

- **ghidra-mcp** 7.0.0-rc.1, headless: FFX on 127.0.0.1:8089 (the registered MCP server), FFX-2 on
  8090/8091 (plain HTTP). Our names carry the prefix `pp_` in the private projects; backups exist.
  How-to: `D:\Tools\ghidra-mcp\HOWTO.md`.
- **rea** 6.0.0 (`D:\Tools\rea6`): 32-bit PE support arrived on 2026-10-08, but its fixed 330 s
  start-up deadline is shorter than FFX.exe's ~12-minute analysis, so only a local copy with that one
  constant raised opens the exe. Same decompiler as ghidra-mcp (not an independent second opinion),
  read-only, no emulation. Used for FFX-versus-FFX-2 function diffs (`compare_functions`) and value
  tracing.
- **Emulation harness** (`D:\Tools\ffx-parity\harness`, Python + Unicorn): runs one game function on
  generated inputs with the RNG stubbed and writes golden vectors.
- **Where things live.** Decompiled code, exe copies, anchor maps and raw outputs stay under
  `D:\Tools\ffx-parity` and never enter the repo (rule 8; the repo is public). The repo gets: the
  formulas in our own words with exe addresses as citations (`research/re-ffx-battle.md`,
  `research/re-ffx2-battle.md`), golden vectors (numbers only) under `tests/fixtures/parity/`, the
  vitest parity tests, and the engine changes.

## Architecture: kernels

One **kernel** per game function: a pure TypeScript function in `src/battle/ffx/kernel/` or
`src/battle/ffx2/kernel/` whose inputs are exactly what the game function reads (stat bytes, stack
counts, command fields, flags) and whose random draws come from a `draw()` callback that returns the
raw value the game's RNG would return. Each file names its exe address and research section.

- The engine adapts its state to the kernel's inputs; the kernel never sees engine types. That keeps the
  proof (kernel versus vectors) separate from the wiring (engine versus kernel), and each file under
  400 lines.
- Until P3 is decided, the engine feeds kernels a 31-bit value from the existing mulberry32 stream, and
  the kernel applies the game's own modulo. P1 and P2 hold now; P3 can follow without touching kernels.
- Layering (rule 1) holds: kernels import nothing from the DOM or `three`.

## The proof loop, per mechanic

1. **Anchor**: function address, struct offsets, callers (done for FFX: 125 anchors).
2. **Spec** in our own words, including draw order and rounding.
3. **Harness target**: vectors over the full input ranges plus edges (0, 1, caps, overflow edges),
   RNG stubbed; a reduced set (at most ~300 KB a file) is copied into `tests/fixtures/parity/`.
4. **Kernel** plus `tests/unit/parity-<game>-<name>.test.ts`: every vector must match.
5. **Wiring**: the engine calls the kernel. This is a DEEP-class change (`critic-plan`: combat core),
   so each wiring batch gets a paper preflight in `docs/plans/re-parity-review.md` first.
6. **Goldens** (`ffx-engine-golden`, `ffx2-atb-golden`, chapter benches) are re-baselined with the
   stated reason "game-code parity", in the same commit as the change that moves them.
7. **Release**: focused review before the deploy, deep review on the live build afterwards (at most two
   deploys while a deep review is owed).

## Status, 2026-10-08

| Mechanic | Game | Our code today | Its source today | Exe anchor | Proof |
|---|---|---|---|---|---|
| RNG algorithm, 68 streams, stream map | FFX | `common/rng.ts` (one mulberry32 stream) | none (ours) | 0x7988f0, 0x78d210 | decompile read by main |
| Hit / evade | FFX | `ffx/accuracy.ts` | tracker | 0x78a890 | decompile read by main: **differs** (Darkness /10 on flagged commands, raw target Luck, per-command accuracy formula) |
| Crit | FFX | `ffx/accuracy.ts` | tracker | 0x789690 | anchor |
| Base damage, formulas 1 to 0x17, variance | FFX | `ffx/formulas.ts`, `math.ts` | tracker | 0x789bf0 | anchor |
| Modifier order (Shield/Boost, Shell/Protect, crit, Berserk, ..., cap) | FFX | `ffx/formulas.ts:285-378` | tracker | 0x78e630 | anchor: **order differs** from ours |
| Element | FFX | `ffx/elements.ts` | tracker | 0x78a360 | anchor |
| Status infliction, durations, Poison, Regen, Doom | FFX | `ffx/statuses.ts`, `ticks.ts` | tracker | 0x78ae00, 0x7af4f0, 0x7afab0, 0x799cd0 | anchor |
| CTB: tick table, initial CTB, rank delay, Haste/Slow, ties, Delay | FFX | `ffx/turnQueue.ts`, `math.ts` | tracker | 0x7909c0, 0x78ded0, 0x78d1d0, 0x78c150, 0x790fb0 | anchor |
| Overdrive gauge, 17 modes | FFX | `ffx/overdrive.ts` | wiki | 0x7b1590 and hooks | anchor |
| Steal, range, counters | FFX | `ffx/steal.ts`, `targeting.ts`, `ticks.ts` | tracker / wiki | 0x78b760, 0x791fa0, 0x78c1d0 | anchor |
| Hit / evade | FFX-2 | `ffx2/hit.ts` | FAQ + an invented 104 base | old-copy 0x641530 (live address pending) | harness pilot under way |
| Damage pipeline, per-step rounding, crit curve | FFX-2 | `ffx2/formulas.ts` (floats) | FAQ, rounding assumed | pending | anchor map under way |
| ATB tick, charge, recovery | FFX-2 | `ffx2/gauges.ts` | FAQ, tiers assumed | 0x6343a0 (live) | earlier lane |
| Chain bonus | FFX-2 | `ffx2/chain.ts` | FAQ | pending | anchor map under way |
| Status infliction, durations, ticks | FFX-2 | `ffx2/statuses.ts` | FAQ | pending | anchor map under way |
| Boss AI, 18 chapters | both | `ffx/ai`, `ffx2/ai` | mixed; FFX-2 mostly FAQ | AI scripts (`D:\Tools\rea\FINDINGS.md` B1 to B9) | not started |

## Decisions needed from Bailey (none blocks wave 1)

1. **RNG generator (P3).** Adopt each game's own RNG and stream map, seeded from our run seed. It moves
   every seeded golden and replay (FF7's hidden chapter keeps mulberry32). Recommended: yes, after the
   kernels land.
2. **Departures that may clash with the exe**, each shown with the exe's answer and the choice to keep
   ours: "magic never misses" (rule 5; FFX's exe agrees for every spell, but decides by each command's
   accuracy formula; FFX-2 pending), Threaten 0 on Yojimbo and Evrae, the 0 to 100 steal scale, the
   FFX-2 Wait default (D-029), and any pacing change made after the 2026-09-29 playtest.

## Order of work

- **Wave 0 (2026-10-08):** tooling, engine inventory, anchor maps for both exes, harness pilot.
- **Wave 1, FFX-2 core** (weakest sources): hit, crit, damage pipeline and rounding, ATB, status, chain.
- **Wave 2, FFX core** (verify the tracker): damage and modifier order, hit and crit, CTB, status, Overdrive.
- **Wave 3:** RNG generators (if Bailey says yes).
- **Wave 4:** boss AI per chapter, starting from the compiled scripts already read (B1 to B9).
- Each wave is one release candidate.

## Usage

Sonnet for every agent, at most four or five heavy agents at once (Ghidra servers hold 1 to 2 GB each).
Mode by today's reading (weekly 16 percent used): NORMAL.
