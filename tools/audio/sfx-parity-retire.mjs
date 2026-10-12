/**
 * SFX parity, the final repack (spec 5.1 item 5): which cues of the v2 sprite a recorded original has made unnecessary, so
 * `tools/audio/sfx-v2-sprite.py --exclude` can take them out and give their bytes back to the budget. The command is
 * `sfx-parity-repack.mjs`; this is the decision, kept apart so the unit test can run it on made-up uses.
 *
 * A v2 cue is the STAND-IN for the events that ask for it, and a stand-in is still needed for any event whose recorded
 * original is missing. So a cue retires only when EVERY way the game reaches it ends at a recorded original that is always
 * loaded: the game's core pack, which every chapter of that game fetches (`src/audio/sfxV2/packs.ts`). The ways are the
 * "uses": a `v2:` cue plus the list of originals the mixer was asked to look up (`PlaySfxOptions.events`; absent for a key
 * looked up by its own name). The command gathers them from the scripted fight (`tests/unit/helpers/sfxFight.ts`), which plays
 * every ability of both games by a party actor and by a foe.
 *
 * Conservative on purpose. A cue with no observed use stays (a menu key, a cue only the title plays): nothing proves what
 * depends on it. A cue some use leaves on the stand-in stays (Auron's `swing-katana` recording does not retire `swing-katana`
 * while foes still swing it). A boss pack's recording never retires anything, because the pack is only loaded in its own
 * fight. Retiring is therefore always a no-op until a core pack ships, and what it keeps is reported with the reason. A
 * retired name stays addressable (`src/audio/sfxV2/retired.ts`, `V2_CUES`): the voice still asks for it, the mixer finds the
 * original, and in the moment before the pack has decoded the first-bank stand-in plays instead, so nothing is ever silent.
 *
 * Pure: no files. Game case: both; every decision is per game (a cue both games play retires only when each game's core pack
 * holds an original for it).
 */

const gamesOf = (cue) => (cue.game === 'both' ? ['ffx', 'ffx2'] : [cue.game]);
const nameOf = (key) => (key.startsWith('v2:') ? key.slice(3) : key);

/** Is an original of `name` in the game's core pack, for this game? */
function recorded(core, name, game) {
  const cue = core?.[name];
  return !!cue && (cue.game === undefined || cue.game === 'both' || cue.game === game);
}

/**
 * @param {import('./sfx-parity-retire.d.mts').RetireInput} input
 * @returns {import('./sfx-parity-retire.d.mts').RetirePlan}
 */
export function planRetirement(input) {
  const retired = [];
  const kept = {};
  for (const name of [...input.sprite].sort()) {
    const cue = input.cues[name];
    if (!cue) {
      kept[name] = 'not in the key space (V2_CUES)';
      continue;
    }
    let why = null;
    for (const game of gamesOf(cue)) {
      const core = input.core[game];
      if (!core) {
        why = `${game} has no core pack`;
        break;
      }
      const uses = input.uses[game].filter((u) => nameOf(u.key) === name);
      if (uses.length === 0) {
        why = `no observed use in ${game} (nothing proves what depends on it)`;
        break;
      }
      const open = uses.find((u) => !(u.events ?? [name]).some((n) => recorded(core, n, game)));
      if (open) {
        why = `${game} still plays it as the stand-in${open.events && open.events.length > 0 ? ` (originals ${open.events.join(', ')} not in ${game}-core)` : open.events ? ' (an event with no original)' : ` (${name} is not in ${game}-core)`}`;
        break;
      }
    }
    if (why === null) retired.push(name);
    else kept[name] = why;
  }
  return { retired, kept };
}

/** Bytes the repack gives back: the retired cues' share of the sprite, by their length (the sprite is one VBR stream). */
export function retiredBytes(plan, cues, spriteBytes, spriteSeconds, gapSeconds = 0.05) {
  if (spriteSeconds <= 0) return 0;
  const seconds = plan.retired.reduce((sum, name) => sum + (cues[name]?.duration ?? 0) + gapSeconds, 0);
  return Math.round((seconds / spriteSeconds) * spriteBytes);
}
