/**
 * **FFX engine goldens**: every listed FFX chapter, two seeds each, played by the chapter's own
 * line through its whole chain; the digest of every link's full event log (JSON, every field) is
 * pinned. Written before `src/battle/ffx/engine.ts` was split under the 400-line house limit
 * (advisor v4, 2026-09-28), so the split is proved to change nothing (AGENTS.md rules 3 and 7).
 *
 * A digest that moves means the engine's behaviour moved: that is a change to explain, never a
 * number to re-pin without a reason.
 *
 * Game case: FFX only (the FFX-2 engine has `ffx2-atb-golden.test.ts`).
 */

import { describe, expect, it } from 'vitest';
import type { BattleSetup, BattleState, Command, Decision, EnemyGroupDef } from '../../src/battle/common/types.ts';
import { FFXEngine } from '../../src/battle/ffx/index.ts';
import { registerBattleContent } from '../../src/app/screens/BattleScreenContent.ts';
import { findEnemyGroup, setupForChapter, setupForNextLink } from '../../src/app/screens/BattleScreenSetup.ts';
import { CHAPTERS } from '../../src/data/encounters.ts';
import { intendedStrategy } from '../../src/engine/BattlePresenterStrategies.ts';

type Input = Extract<Decision, { kind: 'player-input' }>;

function fallback(d: Input): Command {
  const row = d.commands.find((c) => c.enabled && c.command.kind === 'attack') ?? d.commands.find((c) => c.enabled);
  if (!row) return { kind: 'defend', targets: [] } as Command;
  const t = row.validTargets[0];
  return { ...row.command, targets: t ? [t] : [] } as Command;
}

function fnv(s: string): string {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) h = Math.imul(h ^ s.charCodeAt(i), 16777619) >>> 0;
  return h.toString(16);
}

/** Digests of each link's whole log, then the outcome. */
async function goldenOf(chapterId: string, seed: number): Promise<string> {
  await registerBattleContent();
  const chapter = CHAPTERS.find((c) => c.id === chapterId)!;
  let setup: BattleSetup = setupForChapter(chapter, seed);
  let group: EnemyGroupDef = chapter.enemyGroupRef;
  const e = new FFXEngine({ autoResolveMinigames: true });
  e.setSeed(setup.seed);
  e.init(setup);
  const parts: string[] = [];
  let link = 1;
  for (let step = 0; step < 200_000; step++) {
    const d = e.nextDecision();
    if (d.kind === 'resolved' || d.kind === 'waiting') continue;
    if (d.kind === 'battle-over') {
      parts.push(`${fnv(JSON.stringify(e.state().log))}:${d.result.outcome}`);
      if (d.result.outcome !== 'victory' || !group.nextGroupId || link >= 12) break;
      const next = await findEnemyGroup(group.nextGroupId);
      if (!next) break;
      setup = setupForNextLink(setup, next, e.state() as BattleState, seed + link);
      group = next;
      link += 1;
      e.setSeed(setup.seed);
      e.init(setup);
      continue;
    }
    e.submit(intendedStrategy(d.actorId, d.commands, e as never) ?? fallback(d));
  }
  return parts.join(' ');
}

/**
 * Recorded on advisor-v4 at cf3306eb (main 1a81a8ed merged), before the split. Chapters II
 * (Yunalesca) and III (Braska's Final Aeon) re-pinned 2026-09-29 in main's merge of advisor-v4: D-274
 * (578e7f22, research §6.4.3's aeon rows for II and III) moves exactly these four digests, proved by
 * running this file on 578e7f22^ (18/18) and 578e7f22 (these four values, the other 14 unchanged).
 * Chapter III re-pinned again 2026-09-30 by r34fix-odfail (FFX only): a failed Swordplay/Bushido now
 * resolves its sourced Fail row (research §5.3, §5.5). The line's auto-rolled Energy Rain fails once
 * in link 6 of seed 1 and once in link 6 of seed 7 and now deals 20 DmgCon instead of 26, which moves
 * exactly those links' digests (and seed 7's link 7, which starts from link 6's end state); every
 * outcome is still victory, and with the fail wiring stubbed out this file is 18/18 on the old values.
 * Chapters II and III re-pinned 2026-10-01 by r34fix-od5 (FFX only): a clean Bushido now picks its
 * (Immune) row per target from the target's own immunities (research §5.5; Bailey D-310/D-311). Every
 * moved digest is an auto-rolled successful Shooting Star on an Eject-immune target now dealing 27
 * DmgCon instead of 24: Yunalesca (seeds 1 and 7, link 1), Possessed Valefor (link 2 of both seeds)
 * and Braska's Final Aeon (seed 7, link 1). Old and new trees replayed side by side; no other digest
 * moved and every outcome is unchanged.
 * Chapter VII (Anima, Macalania) re-pinned 2026-10-03 by r37-small (PR-0258, FFX only): an overkill now doubles
 * the killed enemy's item drops (research ffx-vs-ffx2-presentation §9; `results.ts#OVERKILL_DROP_MULTIPLIER`).
 * The line overkills a Guado Guardian on both seeds, so the victory event's drops change and nothing else:
 * with the multiplier stubbed to 1 this file is 18/18 on the old values, and the other 16 digests never moved.
 * Chapter XII (Seymour Omnis) re-pinned 2026-10-07 by r3941-omnis on the release line (FFX only, Bailey: "go ahead and fix the omnis disc
 * order too"): the disc ring is the game's own, Fire, Ice, Water, Thunder, a spell one step forward and a blow one step
 * back (research O-7), where it was Fire, Water, Ice, Thunder with a spell at -1. The line turns discs, so exactly the
 * two seymour-omnis digests of that line's table moved (seed 1 354e0ace -> 18304bd, seed 7 ac28e23c -> 9bd433ce on its engine, before
 * the parity work below); both were still victories. Proved by setting the ring back to the old transitions (Fire, Thunder, Ice, Water
 * read at +1 for a spell): both old digests returned, and the other 16 never moved.
 * All 18 digests re-baselined 2026-10-08 by re-parity W1 ("game-code parity", FFX only): the hit roll, the damage
 * variance, the critical roll and the damage chain now come from the kernels proven against FFX.exe
 * (src/battle/ffx/kernel/), through src/battle/ffx/adapt/ and hit-apply.ts, drawn in the game's order (hit, variance,
 * critical; targets outer, hits inner) and fed the game's own command flags (src/data/ffx/command-records/). Every
 * log moves because the draw order and the formulas moved, which is the point, and
 * tests/unit/parity-ffx-engine-wiring.test.ts is the proof that the engine computes what the kernels compute. Four
 * outcomes moved, all on seeds that were not tuned: seymour-flux#7 victory -> defeat (Cross Cleave never misses in
 * the game's record), seymour-omnis#1 victory -> defeat, seymour-natus#1 and #7 defeat -> victory; the other 14 keep
 * their outcome. The per-chapter causes are in docs/handoff/re-parity-w1.md. The old values are in git history (the
 * commit before the one that moved them).
 * Chapter III re-baselined a second time the same day, same track (FFX only): the five possessed aeons' plain Attack runs
 * on the game's monster-side record 0x6000 (accuracy formula 2 on a byte of 90, physical, cannot crit) and not on the
 * party's Attack record, so about half of it misses, as the record says (the old engine never missed). That moves the
 * digests of the links where a possessed aeon attacks (seed 1: links 5 to 7; seed 7: links 3 to 7); every outcome is still
 * victory and no other digest moved.
 * Chapter II re-baselined 2026-10-08 by re-parity AI lane B ("game-script parity", FFX only): Yunalesca runs the game's own
 * script (research/re-ffx-ai-yunalesca-bfa.md section 2) through the engine's new hit events (hit-hooks.ts and hit-event.ts then; `ai/hooks.ts` and `ai/hit-script.ts` since release candidate 1).
 * Her counters follow every action that reaches her, a form changes after the last hit of the action that ended it, her
 * anti-aeon Mind Blast and Osmose land on the aeon on the field, Form II's counter advances on aeon turns, and a pick draws
 * only with two or more candidates. Both digests move (yunalesca#1 victory -> defeat, #7 still a victory); no other
 * chapter's digest moved.
 * Chapter III re-baselined 2026-10-09 by re-parity AI lane B ("game-script parity", FFX only): Braska's Final Aeon, the Yu
 * Pagodas, the five possessed aeons and Yu Yevon run the game's own scripts (research/re-ffx-ai-yunalesca-bfa.md sections 3
 * to 6) through the same hit events. His gauge is the script's fixed arithmetic, his moves its tables, a Pagoda returns with
 * the damage it absorbed after two or three of its own turns, a possessed aeon aims and rolls as its script says, a
 * character the fayth revives acts next, and Yu Yevon casts Gravija on every turn after his first, on the front line and
 * himself. Both digests move (braskas-final-aeon#1 seven victories -> a defeat on link 1, #7 seven victories again); no other
 * chapter's digest moved.
 * Chapters I, VII, X and XII re-baselined 2026-10-09 by re-parity AI-Seymour ("game-script parity", FFX only): Seymour
 * Flux and the Mortiorchis, Seymour with the Guado Guardians and Anima, Seymour Natus with Mortibody, and Seymour Omnis
 * with the Mortiphasm discs now follow the game's own compiled scripts (research/re-ffx-ai-seymour.md, rows D-01 to D-33):
 * the shared cycle state, the hooks that run once per action per target before the death check, the revive values, the
 * formation start hooks, the Desperado ladder, the disc ring and the affinity timing. These eight digests (seeds 1 and 7 of
 * those four chapters) move because every enemy turn and every hook of those fights moved; the other ten (Chapters II, III,
 * VIII, IX and XIV) are byte for byte what they were. Five outcomes moved on seeds nobody tuned: seymour-flux#1 and #7
 * defeat -> victory, seymour-natus#7 victory -> defeat, seymour-omnis#1 defeat -> victory and #7 victory -> defeat; the
 * 500-seed tables and their causes are in docs/handoff/re-parity-ai-seymour.md. Nothing on the boss or the party was tuned.
 * Chapters VIII, IX and XIV re-baselined 2026-10-09 by re-parity AI lane C ("game-script parity", FFX only): Evrae and Cid, Yojimbo
 * and Isaaru's three aeons run the game's own scripts (research/re-ffx-ai-evrae-yojimbo-isaaru-sin.md sections 2 to 4) through the
 * same hit events. Evrae's counter is filled by the command's formula byte and his Haste starts under 10,666; Cid acts every 42
 * ticks, not 36; Yojimbo's first turn is a Summon, his odds are the script's, Zanmato leaves the gauge at 2 and the +3 is a hit
 * event; every aeon of the contest opens with a Summon and fills its gauge from every attack at Yuna; the aeon opens at CTB 0
 * and the party one tick later. All six digests move and every outcome is still a victory; no other chapter's digest moved.
 * Release candidate 1, 2026-10-09 (re-parity W1, AI lane B and AI-Seymour merged onto release 39.4.2, "game-code and
 * game-script parity merged onto 39.4.2", FFX only). The merged tree was run against each lane's own table: 17 of the 18
 * digests are the lanes' own, byte for byte (all eight of AI-Seymour's, Chapter II's two, Chapter III seed 1's, and the
 * six other chapters'). ONE moved, braskas-final-aeon#7, and only its link 5 (Possessed Shiva; links 1 to 4, 6 and 7 are
 * identical, every outcome is still victory): there is one hit runner now (`ai/hooks.ts`, lane B's `hit-hooks.ts` and
 * `hit-event.ts` are gone) and it tells each target of an action right after its own hits, AI-Seymour's reading of the
 * game's per-record application, where lane B's own runner told them all after the last target. Tidus's Overdrive there
 * reaches Possessed Shiva and both Pagodas; Shiva's hook spends a GetRandomValue draw, which now falls between Shiva's hit
 * and the Pagodas' two, so their damage variance comes from the next draws and the two amounts 2230 and 2377 become 2358
 * and 2459. Nothing else in that log changes (docs/handoff/re-parity-rc1.md, with the proof).
 * Release candidate 1 with AI lane C, 2026-10-09 (re-parity AI lane C merged onto that three-lane tree, "game-script parity",
 * FFX only). The merged tree was run against the table above: 12 of the 18 digests are byte for byte what they were (all eight
 * of AI-Seymour's, Chapter II's two and Chapter III's two). SIX moved: evrae-airship, yojimbo-cavern and isaaru-via-purifico, seeds
 * 1 and 7, the six lane C re-baselined on its own branch (see its paragraph above), and each equals lane C's own digest to the byte,
 * so the merge kept its behaviour: its nine hit scripts now run on the one runner (`ai/hit-script.ts` over `ai/hooks.ts`, the old
 * `hit-hooks.ts` is gone), and none of the three fights has two listening targets in one action, so the runner's order (the
 * paragraph above) cannot move them. Every outcome is still victory. Nothing on the boss or the party was tuned.
 * Release candidate 1 folded into the release line, 2026-10-09 (re-parity-rc1 merged with r3943-int `a74b2b8e`, FFX only; docs/handoff/re-parity-rc1.md
 * section 8). The merged tree was run against the table above: ALL 18 digests are byte for byte what they were and nothing is re-pinned. The release
 * line's only battle-code change in that merge was the Chapter XII ring of the r3941-omnis paragraph; release candidate 1 already had the same ring from the
 * game's own script (AI-Seymour, D-25: Fire, Ice, Water, Thunder, a spell +1 and a blow -1), so the merged rules (the release line's pure `discAfterTurn`
 * and ring, release candidate 1's reset order, affinity timing and four spells) play Chapter XII exactly as before: seymour-omnis#1 and #7 are the table's
 * 'e6d67f23:victory' and '9b077938:defeat', not the release line's own digests, which belong to its older engine. The rest of that line's changes are
 * presentation (scenes, HUDs, statures, art) and reach no battle log. Nothing on the boss or the party was tuned.
 * Releases 39.2 to 39.4.2 changed no FFX battle code or data (their battle-side changes are FFX-2's Trema data, the Leblanc
 * preview's chapter registry and `types.ts`'s `hopelessRetry`). A digest that moves from here on is a change to explain.
 * All 18 digests re-baselined again 2026-10-09 by re-parity W2 on its own branch, before the merge below ("game-code parity", FFX only): the turn order and the statuses
 * now come from the kernels proven against FFX.exe too. The opening counters are the game's 26 fixed draws (the party's, the aeons'
 * and the monsters' own streams, empty slots included), the clock counts a byte counter per slot down one point per tick and picks the
 * next actor by the game's tie key, recovery is HasteSlow(tickSpeed * max(rank, 1)) with the game's command ranks, every hit that lands
 * runs the infliction step (one draw per status with a chance byte, % 101, the game's chance and duration bytes), and Regen, Poison,
 * Doom and the end-of-turn counters tick the way the game's tick functions do. Every log moves because the draw order, the draw count
 * and the numbers moved, which is the point, and tests/unit/parity-ffx-engine-ctb-status.test.ts, parity-ffx-engine-status.test.ts
 * and parity-ffx-engine-ticks.test.ts are the proof that the engine computes what the kernels compute. Three outcomes moved, all on
 * seeds that were not tuned: seymour-anima-macalania#7 victory -> defeat, seymour-omnis#7 victory -> defeat and
 * isaaru-via-purifico#1 (its third link) victory -> defeat; the other 15 keep their outcome. One seed is one sample of a chapter
 * whose win rate is well away from 0 and 100, so a flipped seed is not a change of difficulty: the 500-seed rates, before and
 * after, are in docs/handoff/re-parity-w2.md. The old values are in git history (the commit before the one that moved them).
 * Chapter II (Yunalesca) re-baselined a second time the same day, same track (FFX only): a Regen that lands resets its holder's own tick
 * counter (the exe's hit-record write-back, VA 0x0078f060), so a fresh Regen pays the ticks since the cast and not the 255 the counter had
 * saturated at (a Zombie took maxHP + 100 from it). That moves the two Yunalesca digests (Regen is her party's and her own spell);
 * every outcome is still victory and no other digest moved.
 * Release candidate 2, 2026-10-10 (re-parity RC2-W2: W2 merged onto release candidate 1, "game-code parity" for the turn order, the status step and the
 * per-turn ticks on top of the game-script lanes, FFX only; docs/handoff/re-parity-w2.md, "Merged onto release candidate 1"). The merged tree was run
 * against release candidate 1's table above: ALL 18 digests move, and that is the point of the merge and not an accident of it. W2 changes how many
 * draws a battle spends and in which order (the opening is the game's 26 fixed draws, a hit that lands runs the infliction step with its one draw per
 * status, the clock counts a byte per slot and picks by the game's tie key, the ticks are the game's), so every log differs from its first turn. The
 * scripts on top are unchanged: the 24 AI parity files and tests/unit/re-parity-ai-merged-hooks.test.ts pass on the merged tree (their setup lines now
 * read the game's byte counters), and tests/unit/re-parity-w2-rc1-merge.test.ts pins the seams of the merge. Five outcomes moved on seeds nobody tuned:
 * yunalesca#1 defeat -> victory, braskas-final-aeon#1 link 1 defeat -> seven victories, seymour-natus#7 defeat -> victory, seymour-omnis#7 defeat ->
 * victory and isaaru-via-purifico#1 link 3 victory -> defeat; the other 13 keep their outcome. One seed is one sample, not a change of difficulty: the
 * 500-seed rates are in the handoff, and the one chapter whose rate moved by more than sampling is Chapter X (386 -> 302 of 500, Natus's Flare at the
 * game's rank 3; with rank 5 put back the merged tree wins 386, release candidate 1's number). Nothing on the boss or the party was tuned.
 * All 18 digests re-baselined 2026-10-10 by re-parity W5 ("game-code parity", FFX only): the Overdrive gauge is the game's (a party member's
 * bar is 100 points and an aeon's 20, the hooks divide first and add 1, a Healer counts the HP restored, Shield zeroes and Boost doubles on anyone), a wiped
 * aeon stays away its own number of battles, an aeon wears the gear the game gives it (critical bonus 6, Pierce on nine, Break Damage Limit on five), Steal
 * rolls the game's byte, and nobody's counter moves when an aeon comes or goes, so the summoner keeps the recovery her Summon cost (src/battle/ffx/gauge.ts,
 * aeon-gear.ts, adapt/od-world.ts, adapt/aeon-party.ts, adapt/steal.ts; tests/unit/parity-ffx-engine-gauge.test.ts, parity-ffx-engine-aeons.test.ts and
 * parity-ffx-engine-steal.test.ts are the proof that the engine computes what the kernels compute). Every link's log was compared event by event, with the
 * sequence numbers ignored, against the same line on 919f2c78 (the W2 base, which reproduces the table above to the digit). Braska's link 2 (seeds 1 and 7)
 * is identical and keeps its digest (7ce233c2, 3f923603): the 32 other links all move, for these reasons only:
 * (a) the log differs in `overdrive-gauge` events and nothing else: evrae-airship#1 and #7, seymour-omnis#1 and #7, yojimbo-cavern#7, braskas-final-aeon#1
 *     and #7 links 3 and 4; the gauge numbers and counts are the game's, and nothing the party or the boss does changed.
 * (b) the first other difference is the turn after an aeon leaves (dismiss, KO or Banish): the old tree let the summoner act at once, the new one lets the
 *     party act while she pays her Summon: seymour-flux#1 and #7, seymour-natus#1 and #7, seymour-anima-macalania#1, yojimbo-cavern#1, isaaru-via-purifico#1
 *     and #7 link 1, braskas-final-aeon#1 and #7 link 1 (the Bahamut that falls to Braska's Final Aeon).
 * (c) the first other difference is a choice the gauge decides: the game's gains leave an aeon without the Overdrive it had (isaaru-via-purifico links 2
 *     and 3 on both seeds: Mega Flare and Hellfire become Attack; macalania#7: Sonic Wings in place of Energy Ray) and give Auron his earlier (yunalesca#1
 *     and #7: Shooting Star where an Attack was).
 * (d) braskas-final-aeon links 5 to 7 (both seeds) follow from the differences of the earlier links: the chain carries each member's HP, MP and gauge on, and a member
 *     carried under half HP opens the next link with the Critical status.
 * Every outcome stays a victory but one: isaaru-via-purifico#1 link 3 moves defeat -> victory. One seed is one sample; the 500-seed rates are in
 * docs/handoff/re-parity-w5.md. Nothing on the boss or the party was tuned.
 * yojimbo-cavern#1 re-pinned once more 2026-10-10 (re-parity W5, Chapter IX's line reworked after Bailey's pick "Keep 1:1, rework our line"; FFX only):
 * the line now calls its aeon on the turn Yojimbo's gauge reads 96, before any revive or heal (it was 80, after them; src/engine/tactics/yojimbo-cavern.ts).
 * Seed 1: the logs of the old line and the new one on the same engine are identical for 519 events and differ at the turn where Yuna meets a gauge of 93:
 * the old line calls Bahamut there (event 520), the new one defends; the new line never summons on this seed (Yojimbo falls before 96), the battle is a
 * victory both ways (577 and 560 events). Seed 7: the two logs are identical (neither line summons), so its digest keeps its value (a2f8d812).
 * No other digest moved: Chapter IX is the only chapter whose line changed. 7681d4e3 -> 28996218.
 * Release candidate 2 (rel-3945: the live build 39.4.4 plus re-parity W5, Chapter XVIII, the guide rewrites, Chapter X's options and the two menu changes; FFX only;
 * docs/handoff/re-parity-rc2.md). The merged tree was run against the table above, once: SIXTEEN of the 18 digests are byte for byte what they were, and TWO moved,
 * seymour-natus#1 (dc26538f -> 4e54c29b) and #7 (cd5b1bcb -> 25becfa0), both still victories. Cause, proved by putting the one constant back: Chapter X's
 * registered line is 'reflect' now (`NATUS_LINE` in src/data/guides/natus-line.ts, the re-parity-chx-options branch; Bailey took the recommendation on 2026-10-10: Bahamut
 * alone, and Rikku Reflects Natus so Mortibody's Cura bounces). With the constant at 'shipped' this file is 18/18 on the old values; with 'reflect' the
 * logs of both seeds are identical for the first 16 (seed 1) and 51 (seed 7) events and differ at Kimahri's switch, where Rikku comes in for the Reflect and Auron does
 * not (417 -> 255 and 644 -> 335 events a fight). No other digest moved: the Chapter IX line and W5 were already in the table above; Chapter XVIII's line and
 * party are not in this table (the Sin chapters stop at Isaaru); the guide rewrites are text; and the Orders and Talk menu changes (the airship offers one order at a
 * time, the third Talk only speaks) moved none of the 18 logs. Nothing on the boss or the party was tuned.
 * All 18 digests re-baselined 2026-10-11 by the RNG lane (branch re-parity-rng; FFX only; reason "game RNG streams (Bailey 2026-10-09)": his pick "Adopt game streams (Recommended)"):
 * the engine draws from FFX's own 68 streams, seeded from the run seed through the game's seeding routine, and every roll takes the stream the game gives it (a party member's own, every
 * aeon's shared 27, a monster's slot + 8, plus 16 for the hit roll and 32 for status rolls; the scripts' GetRandomValue on 2 and their actor picker on 4; random-target hits on 5, a Reflect
 * bounce on 6, Steal on 10 and 11), and Chapter VIII's scene and camera draws (Cid's captions, the voice replies, the Guided Missiles shot) are counted on stream 2. Every log moves because
 * every roll is another deal of the same odds, which is the point; tests/unit/parity-ffx-rng-streams.test.ts is the proof that each draw is on the stream the table names, with a mutation check.
 * One outcome moved, on a seed nobody tuned: seymour-anima-macalania#7 victory -> defeat; the other 17 keep theirs. One seed is one sample: the 500-seed rates before and after, and the proof
 * that the Chapter VII move is a block of seeds and not a bias (the old generator on the same 500 seeds gives the old 488; seeds 501 to 1500 give 959 against 949), are in
 * docs/handoff/re-parity-rng.md. Nothing on the bosses or the party was tuned. The old values are in git history (the commit before the one that moved them).
 * Re-baselined once 2026-10-11 by RC4 lane L1 (branch re-parity-rc4-gear; FFX only; lanes FFX-C and FFX-E, docs/handoff/re-parity-rc4-gear.md): ELEVEN of the 18 digests move and SEVEN are
 * byte for byte what they were (seymour-flux#1 and #7, evrae-airship#1 and #7, seymour-natus#7, isaaru-via-purifico#1 and #7). Cause, proved by ablation (each row put back alone on the
 * tree, all 18 run each time; with all three rows put back this file is 18/18 on the old values):
 * (a) EQUIPMENT CRIT, 3 per worn piece (FFX-G03: every gear row carries 3; the engine gave the weapon's 3 and the armour's 0): yunalesca#1, braskas-final-aeon#1 and #7, seymour-anima-macalania#1
 *     and #7, seymour-natus#1, seymour-omnis#1 and #7. The critical roll's window is 3 points wider for every Attack, so a roll that missed it before lands in it: Rikku's hit on Seymour at
 *     event 95 of macalania#7 is 138 before and 277 now (a critical); Auron's on Natus at event 350 of natus#1 is 3,736 and 7,472; the first difference of macalania#1 is Rikku's hit
 *     on Anima at event 410 (181, then 363).
 * (b) PERCENTS SUMMED (FFX-G03: Strength +10 with +5 is 15, not 10): yunalesca#1 and #7, braskas-final-aeon#1 and #7, yojimbo-cavern#1 and #7, seymour-omnis#1 and #7 (the builds that wear two tiers of
 *     one family: Yuna's Blessed Ring, Dream's End, the Garden of Pain). Magic Def +15 takes 15 percent off the Cure that lands on Yuna: yojimbo#1's first difference is her Cure on herself, 1,411
 *     before and 1,332 now (event 118); yunalesca#7's is the 1,215 Yunalesca deals Yuna, 1,148 now.
 * (c) The Auto-* / SOS statuses (lane FFX-E) move none of the 18: Rikku's SOS Shell (Macalania) is on only while she is under half HP, and on these two seeds she never is (the log adds
 *     Critical to Yuna, Tidus and Auron, never to Rikku), so her Shell never switches; no other shipped build wears an Auto-* or SOS ability.
 * braskas-final-aeon moves in all seven links of both seeds because the chain carries each member's HP, MP and gauge on. Every outcome stays what it was but one:
 * seymour-anima-macalania#7 moves defeat -> victory (its first difference is the critical in (a)). One seed is one sample; the 500-seed rates before and after are in
 * docs/handoff/re-parity-rc4-gear.md. Nothing on the bosses or the party was tuned.
 */
const GOLDEN: Record<string, string> = {
  'seymour-flux#1': 'd362acf6:victory',
  'seymour-flux#7': '9f8aaa5c:victory',
  'yunalesca#1': '7760a32:victory',
  'yunalesca#7': 'f6c5ff81:victory',
  'braskas-final-aeon#1': '53e56b57:victory dc25be1c:victory 892df105:victory d87729b:victory c1883ec4:victory 8f612568:victory 7c815176:victory',
  'braskas-final-aeon#7': 'eed22595:victory 8d75fead:victory 9482b803:victory 7e6d7449:victory 9b249f0d:victory 97592b14:victory f2f0106a:victory',
  'seymour-anima-macalania#1': 'a6d9e71f:victory',
  'seymour-anima-macalania#7': 'e9ae2f10:victory',
  'evrae-airship#1': 'e5ecff52:victory',
  'evrae-airship#7': '4740e2ef:victory',
  'yojimbo-cavern#1': '62272b5c:victory',
  'yojimbo-cavern#7': 'af8241eb:victory',
  'seymour-natus#1': '40514ec8:victory',
  'seymour-natus#7': '9e7c5b2:victory',
  'seymour-omnis#1': 'd2966784:victory',
  'seymour-omnis#7': '30b6f82f:victory',
  'isaaru-via-purifico#1': '6990d85c:victory afd1cb7e:victory 13b0bd8a:victory',
  'isaaru-via-purifico#7': 'cec669c3:victory 78386a12:victory a36d68be:victory',
};

describe('FFX engine goldens (every FFX chapter, the line, whole chain)', () => {
  const ids = ['seymour-flux', 'yunalesca', 'braskas-final-aeon', 'seymour-anima-macalania', 'evrae-airship', 'yojimbo-cavern', 'seymour-natus', 'seymour-omnis', 'isaaru-via-purifico'];
  for (const id of ids) {
    for (const seed of [1, 7]) {
      it(`${id} seed ${seed}`, async () => {
        const got = await goldenOf(id, seed);
        const want = GOLDEN[`${id}#${seed}`];
        if (want === undefined) {
          process.stderr.write(`[golden] '${id}#${seed}': '${got}',\n`);
          expect(got.length).toBeGreaterThan(0);
        } else {
          expect(got).toBe(want);
        }
      }, 300_000);
    }
  }
});
