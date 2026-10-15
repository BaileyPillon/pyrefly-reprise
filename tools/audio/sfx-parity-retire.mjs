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
 * The games that count are the cue's own tag AND every game whose scripted fight was seen to ask for it. The tag is the set's
 * (`V2_CUES`), the asks are the game's: the fiend's dissolve is tagged FFX but both games play it at every defeat
 * (`battleVoice.ts`, `ko()`), and a plan that read only the tag took it out of the sprite on the strength of FFX's recorded
 * original, which left FFX-2's defeat on the first-bank cue (r46-fix, FOC46-02). A name an earlier repack took out (`already`) is judged
 * again by the same rules: one that no longer qualifies is returned in `reinstate`, and the command refuses a retired list that holds it.
 *
 * Pure: no files. Game case: both; every decision is per game (a cue both games play retires only when each game's core pack
 * holds an original for it).
 */

const GAMES = ['ffx', 'ffx2'];
const gamesOf = (cue) => (cue.game === 'both' ? GAMES : [cue.game]);
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
  // The names already out of the sprite (an earlier repack took them): they stay retired. Without them a second run, on the repacked sprite, would plan
  // nothing and the generated list would lose them (found 2026-10-12, the first repack).
  const already = [...(input.already ?? [])].sort();
  const reinstate = [];

  /** Why `name` must stay in the sprite, or `null` when every game that asks for it ends at a recorded original in its core pack. */
  const whyKept = (name) => {
    const cue = input.cues[name];
    if (!cue) return 'not in the key space (V2_CUES)';
    // The cue's own tag, plus every game whose fight asked for it (FOC46-02): the tag alone let FFX's original retire a cue FFX-2 still plays.
    const asked = GAMES.filter((game) => (input.uses[game] ?? []).some((u) => nameOf(u.key) === name));
    for (const game of GAMES.filter((g) => gamesOf(cue).includes(g) || asked.includes(g))) {
      const core = input.core[game];
      if (!core) return `${game} has no core pack`;
      const uses = input.uses[game].filter((u) => nameOf(u.key) === name);
      if (uses.length === 0) return `no observed use in ${game} (nothing proves what depends on it)`;
      const open = uses.find((u) => !(u.events ?? [name]).some((n) => recorded(core, n, game)));
      if (open) return `${game} still plays it as the stand-in${open.events && open.events.length > 0 ? ` (originals ${open.events.join(', ')} not in ${game}-core)` : open.events ? ' (an event with no original)' : ` (${name} is not in ${game}-core)`}`;
    }
    return null;
  };

  for (const name of [...input.sprite].sort()) {
    const why = whyKept(name);
    if (why === null) retired.push(name);
    else kept[name] = why;
  }
  // A name an earlier repack took out is judged by the same rules: one that no longer qualifies has to come back into the sprite.
  for (const name of already) {
    const why = whyKept(name);
    if (why !== null) {
      reinstate.push(name);
      kept[name] = why;
    }
  }
  return { retired, kept, already, reinstate };
}

/** Bytes the repack gives back: the retired cues' share of the sprite, by their length (the sprite is one VBR stream). */
export function retiredBytes(plan, cues, spriteBytes, spriteSeconds, gapSeconds = 0.05) {
  if (spriteSeconds <= 0) return 0;
  const seconds = plan.retired.reduce((sum, name) => sum + (cues[name]?.duration ?? 0) + gapSeconds, 0);
  return Math.round((seconds / spriteSeconds) * spriteBytes);
}
