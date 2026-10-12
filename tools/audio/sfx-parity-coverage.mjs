/**
 * SFX parity, the coverage of the planned originals: in which chapters can each row's sound actually be heard, and so
 * which pack must be loaded there. Read from the game's own data, never guessed:
 *
 * - an FFX ability is heard in every chapter whose build has a member who learned it, or an aeon that owns it, and in the
 *   chapters whose enemies use it; an FFX-2 ability that only enemies carry is heard where those enemies fight, while one
 *   a girl can have (a dressphere's, or a pattern that also matches one) is heard in every FFX-2 chapter;
 * - a hook on a target's voice (the machines that break) is heard where such a combatant fights;
 * - a hook that names an actor is heard where that combatant fights; a hook that names neither (an element, a status, a
 *   weapon, a menu) is heard in every chapter of its game.
 *
 * `rowChapters(row)` is the union over the row's hooks; `packChapters(pack)` is where `src/audio/sfxV2/packs.ts` loads a
 * pack (a game's core pack in every chapter of that game, a boss pack in the chapters `BOSS_PACKS` lists). A row whose
 * chapters are not inside its pack's would be silent where it should sound: `tests/unit/audio-sfx-parity-layout.test.ts`
 * fails on it, and `sfx-parity-layout.mjs --coverage` lists the rows that could move out of the core packs.
 *
 * Needs `node --experimental-transform-types` when run outside vitest (the data modules use parameter properties).
 * Game case: both; every set is per game.
 */
import { CHAPTER_IDS, getChapter } from '../../src/data/encounters.ts';
import { ENEMY_GROUPS_BY_ID as FFX_GROUPS, ABILITIES as FFX_ABILITIES } from '../../src/data/ffx/index.ts';
import { ENEMY_GROUPS_BY_ID as FFX2_GROUPS, ABILITIES as FFX2_ABILITIES } from '../../src/data/ffx2/index.ts';
import { FFX2_ENEMY_VOICES } from '../../src/audio/sfxV2/weapons.ts';
import { EVENT_HOOKS } from '../../src/audio/sfxV2/eventRules.ts';
import { FLOW_SLOTS } from '../../src/audio/sfxV2/flowSlots.ts';
import { BOSS_PACKS } from '../../src/audio/sfxV2/packs.ts';

const GROUPS = { ...FFX_GROUPS, ...FFX2_GROUPS };

/** Every chapter the sounds can be heard in, with what its party and its foes carry. */
export function chapterFacts() {
  const out = [];
  for (const id of [...CHAPTER_IDS, 'exp-leblanc', 'sinspawn-gui']) {
    const chapter = getChapter(id);
    if (!chapter || (chapter.game !== 'ffx' && chapter.game !== 'ffx2')) continue;
    const build = chapter.buildRef;
    const actors = new Set();
    const enemyAbilities = new Set();
    const partyAbilities = new Set();
    for (const m of build.members) {
      actors.add(m.id);
      for (const a of m.learnedAbilityIds ?? []) partyAbilities.add(a);
    }
    for (const a of build.aeons ?? []) {
      actors.add(a.id);
      for (const id2 of [...(a.abilityIds ?? []), ...(a.overdriveIds ?? [])]) partyAbilities.add(id2);
    }
    let group = chapter.enemyGroupRef;
    const seen = new Set();
    while (group && !seen.has(group.id)) {
      seen.add(group.id);
      for (const e of group.enemies) {
        actors.add(e.id);
        for (const a of e.abilityIds ?? []) enemyAbilities.add(a);
      }
      group = group.nextGroupId ? GROUPS[group.nextGroupId] : null;
    }
    out.push({ id, game: chapter.game, actors, enemyAbilities, partyAbilities });
  }
  return out;
}

export function createCoverage() {
  const facts = chapterFacts();
  const allEnemyAbilities = new Set(facts.flatMap((c) => [...c.enemyAbilities]));
  const ofGame = (game) => facts.filter((c) => c.game === game);
  const catalogue = { ffx: Object.keys(FFX_ABILITIES), ffx2: Object.keys(FFX2_ABILITIES) };

  /** The chapters a selector can be heard in. */
  function chaptersOf(hook) {
    let pool = ofGame(hook.game);
    const at = hook.at;
    if (at.actor) pool = pool.filter((c) => at.actor.some((a) => c.actors.has(a)));
    if (at.targetVoice) pool = pool.filter((c) => [...c.actors].some((a) => FFX2_ENEMY_VOICES[a] === at.targetVoice));
    if (at.ability) {
      const matches = (id) => (at.ability instanceof RegExp ? at.ability.test(id) : at.ability.includes(id));
      // FFX-2: a girl's dressphere can reach any chapter, so an id some girl can have is heard everywhere.
      const playerPossible = hook.game === 'ffx2' && catalogue.ffx2.filter(matches).some((id) => !allEnemyAbilities.has(id));
      if (!playerPossible) pool = pool.filter((c) => [...c.enemyAbilities].some(matches) || (hook.game === 'ffx' && [...c.partyAbilities].some(matches)));
    }
    return new Set(pool.map((c) => c.id));
  }

  function rowChapters(rowId) {
    const game = rowId.startsWith('ffx2.') ? 'ffx2' : 'ffx';
    const hooks = EVENT_HOOKS[game].filter((h) => h.row === rowId && h.cue !== null);
    if (hooks.length === 0) return new Set(ofGame(game).map((c) => c.id)); // a menu key or a flow slot: every chapter
    const out = new Set();
    for (const h of hooks) for (const c of chaptersOf(h)) out.add(c);
    return out;
  }

  /** The chapters that load `pack` (`packs.ts`): a core pack in every chapter of its game, a boss pack where `BOSS_PACKS` lists it. */
  function packChapters(pack) {
    const game = pack.startsWith('ffx2-') ? 'ffx2' : 'ffx';
    if (pack === `${game}-core`) return new Set(ofGame(game).map((c) => c.id));
    return new Set(Object.entries(BOSS_PACKS).filter(([, packs]) => packs.includes(pack)).map(([chapter]) => chapter));
  }

  return { facts, rowChapters, packChapters, chaptersOf };
}

/** The flow slots' rows (every chapter of their game hears them). */
export const FLOW_ROWS = new Set(FLOW_SLOTS.map((s) => s.row));
