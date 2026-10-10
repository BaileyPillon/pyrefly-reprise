/**
 * PLACEHOLDER-GUI: scaffold only. Replaced by the real data from the reverse-engineering note
 * (D:/Tools/ffx-parity/new-chapters/ffx-sinspawn-gui/re-ffx-ai-gui.md) and the research. Nothing here is game data.
 * `tests/unit/chapters/sinspawn-gui-data.test.ts` fails while the marker PLACEHOLDER-GUI is in any of the chapter's data files.
 */
import type { EnemyDef, EnemyGroupDef } from '../../../battle/common/types.ts';

export const GUI_ID = 'sinspawn-gui';
export const GUI_GROUP_ID = 'sinspawn-gui';
export const GUI_SCRIPT = 'sinspawn-gui';

const gui: EnemyDef = {
  id: GUI_ID,
  name: 'Sinspawn Gui',
  spriteKey: 'sinspawn-gui',
  slot: 0,
  stats: { hp: 1000, mp: 0, str: 10, def: 10, mag: 10, mdef: 10, agi: 10, luck: 10, eva: 0, acc: 100, maxHp: 1000, maxMp: 0 }, // PLACEHOLDER-GUI
  hp: 1000, // PLACEHOLDER-GUI
  mp: 0,
  affinities: {},
  immunities: {},
  immunityFlags: ['boss'],
  forms: [{ name: 'Sinspawn Gui', spriteKey: 'sinspawn-gui', hp: 1000 }],
  aiScriptId: GUI_SCRIPT,
  rewards: { ap: 0, apOverkill: 0, gil: 0, overkillThreshold: 1000, drops: [] },
  abilityIds: [],
  flags: { isBoss: true },
};

export const sinspawnGuiGroup: EnemyGroupDef = {
  id: GUI_GROUP_ID,
  game: 'ffx',
  canEscape: false,
  enemies: [gui],
};

export default sinspawnGuiGroup;
