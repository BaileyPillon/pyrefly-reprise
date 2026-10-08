/**
 * What the five non-member tabs put where the meters were.
 *
 * `docs/concepts/pause-until-dawn/options.json` → `preservedFunctions` is the
 * checklist this file answers: **every function the old pause screen had, and
 * where it now lives**. Nothing was dropped, and the three rows the two meter
 * columns had no room for (FFX weapon, armour and Sphere Level) are on the
 * CHAPTER tab — which is this agent's guess, recorded as
 * `reaction.inferred` on the target tile, not something Bailey said.
 *
 * Every row here is the same hairline row the meters use, so a tab change is a
 * content change and never a layout change: the columns land exactly where the
 * meters were, which is what frame (d) shows.
 *
 * Pure: `data -> rows`. No DOM, no engine.
 */

import type { AnyCombatant, BattleState, GameId } from '../../../battle/common/types.ts';
import type { ChapterMeta } from '../../../data/chapter-meta.ts';
import type { Settings } from '../../SaveData.ts';
import type { EncounterProgress, ObjectiveStatus } from '../../../ui/common/chapterObjectives.ts';
import { formatPlayTime } from '../../../ui/common/chapterObjectives.ts';
import { optionRows } from '../PauseScreenPanels.ts';

/** One row in a tab body. */
export interface PanelRow {
  id: string;
  label: string;
  /** Right-hand value. Empty for a bare command row. */
  value: string;
  /** 0..1 meter, or null for a word row. */
  ratio: number | null;
  /** Arrow-key selectable and confirmable. */
  selectable: boolean;
  /** A hairline rule instead of a row. */
  rule?: boolean;
  /** A ticked objective. */
  done?: boolean;
  /** An objective: its label wraps rather than ellipsizes (it is what the tab is for). */
  obj?: boolean;
  /** Quieter, e.g. a member's name heading inside a list. */
  head?: boolean;
  /**
   * A command, not a reading: the label takes the width it needs instead of
   * the fixed key column the meters share. `RESTART ENCOUNTER` does not fit in
   * a column sized for `MAGIC DEF`, and an ellipsis on a menu row is a defect.
   */
  cmd?: boolean;
  /** A small heading inside a column (OPTIONS' ABOUT), styled like the column's own. */
  sub?: boolean;
}

export interface PanelColumn {
  id: string;
  heading: string;
  rows: PanelRow[];
  /** A wider key column, for long labels like "Garment grid". */
  wide?: boolean;
  /** Free prose (the dossier quote) rather than rows. */
  prose?: { text: string; who: string; hand: string };
  /** The three chapter snapshots: a path under `public/art/`, and its caption. */
  snaps?: readonly { image: string; caption: string }[];
}

const row = (
  id: string,
  label: string,
  value = '',
  extra: Partial<PanelRow> = {},
): PanelRow => ({ id, label, value, ratio: null, selectable: false, ...extra });

const command = (id: string, label: string, value = '▸'): PanelRow =>
  row(id, label, value, { selectable: true, cmd: true });

// ------------------------------------------------------------------ options

export interface OptionsContext {
  settings: Readonly<Settings>;
  /** `null` while the onboarding dark launch is off: the two rows are not shown. */
  battleHelpOn: boolean | null;
  /** RESTART ENCOUNTER is omitted when there is nothing to restart. */
  canRestart: boolean;
  canChapterSelect: boolean;
  canQuit: boolean;
  /** Host-supplied rows — the cutscene pause's "Skip scene". */
  extraRows: readonly { id: string; label: string }[];
  /** Whose chapter this is. FFX-2 alone gets the X-2 BATTLE and ATB SPEED rows (rule 14). */
  game?: GameId;
}

/**
 * The OPTIONS tab — frame (d).
 *
 * Left: the settings, `optionRows` verbatim plus BATTLE HELP, which is where
 * the old STRATEGY GUIDE and BATTLE HELP menu rows went. Right: the things
 * that end or restart this encounter, with a rule above the two that leave it.
 */
export function optionsColumns(ctx: OptionsContext): PanelColumn[] {
  const settings: PanelRow[] = optionRows(ctx.settings, ctx.game).map((r) => ({
    id: r.id,
    label: r.label,
    value: r.value,
    ratio: r.ratio,
    selectable: true,
  }));
  if (ctx.game === 'ff7') {
    // FF7 draws no eye candy (`EyeCandy.ts` callers check the game), so its EYE CANDY page would switch nothing.
    const at = settings.findIndex((s) => s.id === 'eyeCandy');
    if (at >= 0) settings.splice(at, 1);
  }
  if (ctx.game !== 'ffx2') {
    // X-2 BATTLE (ACTIVE / WAIT) is FFX-2's Config ATB Mode (§1.5), read by
    // the FFX-2 engine alone; FFX's CTB has no clock under a menu, so an FFX
    // chapter never prints it (rule 14; the Wait-mode verifier's ch. 1 capture).
    const at = settings.findIndex((r) => r.id === 'ffx2Atb');
    if (at >= 0) settings.splice(at, 1);
  } else {
    // FFX-2's Config "ATB Mode and Speed" (research/ffx2-combat-core.md §1.2;
    // research/ffx-vs-ffx2-presentation.md:278). FFX's CTB has no tick rate,
    // so an FFX chapter never prints it. Sits under the X-2 row it belongs to.
    const at = settings.findIndex((r) => r.id === 'ffx2Atb');
    const speed = ctx.settings.ffx2AtbSpeed ?? 'normal';
    settings.splice(at < 0 ? settings.length : at + 1, 0, row('ffx2AtbSpeed', 'ATB SPEED', speed.toUpperCase(), { selectable: true }));
  }
  if (ctx.battleHelpOn !== null) {
    // Under STRATEGY GUIDE, which it belongs with; the two front-end rows (39.5) follow.
    const at = settings.findIndex((r) => r.id === 'guideVisible');
    settings.splice(at < 0 ? settings.length : at + 1, 0, row('battleHelp', 'BATTLE HELP', ctx.battleHelpOn ? 'ON' : 'OFF', { selectable: true }));
  }

  const encounter: PanelRow[] = [];
  if (ctx.battleHelpOn !== null) encounter.push(command('briefing', 'Replay briefing'));
  if (ctx.canRestart) encounter.push(command('restart', 'Restart encounter'));
  for (const extra of ctx.extraRows) encounter.push(command(extra.id, extra.label));
  if (ctx.canChapterSelect || ctx.canQuit) {
    encounter.push(row('rule', '', '', { rule: true }));
  }
  if (ctx.canChapterSelect) encounter.push(command('chapter-select', 'Chapter select'));
  if (ctx.canQuit) encounter.push(command('quit', 'Quit to title'));
  // D-305 (Bailey, 2026-09-30, option O1): ABOUT, then CREDITS, which opens the
  // credits panel (`creditsPanel.ts`). A button, not a setting. Both games.
  encounter.push(row('about', 'About', '', { sub: true }), command('credits', 'Credits'));

  return [
    { id: 'settings', heading: 'Settings', rows: settings, wide: true },
    { id: 'encounter', heading: 'This encounter', rows: encounter, wide: true },
  ];
}

// ----------------------------------------------------------------- controls

/**
 * The CONTROLS tab — where the retired `ControlsHint` strip's chips went.
 *
 * Both games: `app/Input.ts` binds one key map for the whole product.
 */
export function controlsColumns(): PanelColumn[] {
  return [
    {
      id: 'move',
      heading: 'Getting around',
      wide: true,
      rows: [
        row('tab-prev', 'Previous tab', 'Q  /  L1  /  ←'),
        row('tab-next', 'Next tab', 'E  /  R1  /  →'),
        row('rows', 'Move down a menu', '↑  ↓  /  D-pad'),
        row('adjust', 'Adjust a setting', '←  →  /  D-pad'),
        row('confirm', 'Confirm', 'Enter  /  Z  /  Cross'),
        row('back', 'Back', 'Esc  /  X  /  Circle'),
      ],
    },
    {
      id: 'screen',
      heading: 'This screen',
      wide: true,
      rows: [
        row('resume', 'Resume the fight', 'Esc  /  Start'),
        // PR-0028 / D-215: `H` is a pause key; battle has none, so the row says where it works.
        row('hide', 'In pause, the painting alone', 'H  /  Triangle'),
        row('photo', 'Photo mode', 'F'),
        row('pause', 'Open this menu', 'Esc  /  P  /  Start'),
      ],
    },
  ];
}

// -------------------------------------------------------------------- guide

/**
 * The GUIDE tab: the line this encounter was designed around, and the switch
 * that decides whether it is also on screen during the fight.
 *
 * Bailey named GUIDE as a tab and never said what is on it; this content is
 * recorded as inferred on the target tile.
 */
export function guideColumns(meta: ChapterMeta | undefined, guideVisible: boolean): PanelColumn[] {
  const rows: PanelRow[] = [row('guideVisible', 'Strategy guide', guideVisible ? 'ON' : 'OFF', { selectable: true })];
  return [
    {
      id: 'line',
      heading: 'The designed line',
      wide: true,
      rows: [],
      ...(meta ? { prose: { text: meta.tip, who: meta.title, hand: meta.subtitle } } : {}),
    },
    { id: 'guide-switch', heading: 'While you fight', rows, wide: true },
  ];
}

// ------------------------------------------------------------------ chapter

export interface ChapterContext {
  meta: ChapterMeta | undefined;
  objectives: readonly ObjectiveStatus[];
  progress: EncounterProgress | null;
  playTimeMs: number;
  sceneKey: string;
  state: Readonly<BattleState> | null;
  game: GameId;
}

/**
 * Per-member gear — the PARTY tab's three homeless rows.
 *
 * FFX prints `S.LV` and the two equipment slots; FFX-2 has neither, so it
 * prints `LV` and the worn dressphere instead. Neither branch invents a row
 * the other game does not have: an empty `WEAPON --` would be a lie about
 * FFX-2's rules, where gear is dresspheres and accessories
 * [ffx2-combat-core §3, ffx-combat-core §9].
 */
function gearRows(members: readonly AnyCombatant[]): PanelRow[] {
  const rows: PanelRow[] = [];
  for (const c of members) {
    if ('sphereGrid' in c && c.sphereGrid) {
      rows.push(row(`${c.id}-name`, c.name, `S.Lv ${c.sphereGrid.sLv}`, { head: true }));
    } else if ('level' in c) {
      rows.push(row(`${c.id}-name`, c.name, `Lv ${c.level}`, { head: true }));
    } else {
      rows.push(row(`${c.id}-name`, c.name, '', { head: true }));
    }
    if ('equipment' in c && c.equipment) {
      rows.push(row(`${c.id}-weapon`, 'Weapon', c.equipment.weapon.name));
      rows.push(row(`${c.id}-armor`, 'Armour', c.equipment.armor.name));
    }
    if ('dresspheres' in c && c.dresspheres) {
      rows.push(row(`${c.id}-dress`, 'Dressphere', c.dresspheres.current.replace(/-/g, ' ')));
    }
  }
  return rows;
}

/** The CHAPTER tab: the old ENCOUNTER DETAILS dossier, its quote and its three polaroids. */
export function chapterColumns(ctx: ChapterContext): PanelColumn[] {
  const meta = ctx.meta;
  const detail: PanelRow[] = ctx.objectives.map((o, i) =>
    row(`obj-${o.id}`, `${i + 1}. ${o.label}`, o.done ? 'Done' : '—', { done: o.done, obj: true }),
  );
  detail.push(row('play-time', 'Play time', formatPlayTime(ctx.playTimeMs)));
  if (ctx.progress) detail.push(row('progress', 'Encounter', ctx.progress.label));
  // PR-0168: this used to print the internal scene id (e.g. "cavern stolen
  // fayth", "dreams end" with the apostrophe silently dropped by the slug).
  // The dossier's own heading already reads `meta.location` (below), so the
  // SCENE row now reads the same field instead of re-deriving a word list
  // from the scene key.
  detail.push(row('scene', 'Scene', meta ? meta.location : ctx.sceneKey.replace(/-/g, ' ')));

  const members = ctx.state
    ? ctx.state.activeIds.map((id) => ctx.state!.combatants[id]).filter((c): c is AnyCombatant => !!c)
    : [];
  const columns: PanelColumn[] = [{ id: 'detail', heading: 'This encounter', rows: detail, wide: true }];
  // PR-0171: the pause can open over a cutscene, where there is no live
  // battle state and so no party — printing "The party" with nothing under
  // it (round 12, chapters II and IX) said there was a column with nothing
  // in it. Not `wide` (REG-keycol, t1-b3b check): a wide party column
  // squeezed the values at 1024x768 and 390x844; FFX-2's "Dressphere" key is
  // fitted by FOC16-03's own gear-column rule in `pause-chapter.css`.
  if (members.length > 0) {
    columns.push({ id: 'gear', heading: 'The party', rows: gearRows(members) });
  }
  if (meta) {
    columns.push({
      id: 'dossier',
      heading: meta.location,
      rows: [],
      prose: { text: meta.quote.text, who: meta.quote.speaker, hand: meta.handwritten },
      snaps: meta.snapshots.map((s) => ({ image: s.image, caption: s.caption })),
    });
  }
  return columns;
}
