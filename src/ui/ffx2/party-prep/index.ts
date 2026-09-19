/**
 * The FFX-2 prep menu's registered panels.
 *
 * It used to register exactly one — the chapter briefing, the game-agnostic
 * component the FFX side registers too — so an X-2 chapter's prep screen had a
 * single CHAPTER tab where FFX has five, and the party's actual loadout was
 * nowhere on the screen. `panels.ts` adds the four tabs that are X-2's own:
 * Dresspheres (with the Garment Grid summary), Stats, Accessories and Items,
 * all read-only and all reading the real build. The two FFX tabs with no X-2
 * counterpart — Equipment and Overdrive — stay absent on purpose: X-2 has no
 * weapons, no armour and no Overdrive modes. See that file for why nothing here
 * is editable.
 *
 * `src/ui/ffx2/PartyPrep.ts` — the older standalone dressphere/Grid/accessory
 * menu that draws its own chrome — is still unwired: it is a *whole screen*,
 * not a set of tabs, and the shell owns the frame now.
 *
 * Imported for its side effect from `src/ui/ffx/party-prep/index.ts`, which is
 * the single prep-registration module `main.ts` loads.
 */

import { registerPrepPanel } from '../../../app/screens/PartyPrepScreen.ts';
import { makeChapterPanel } from '../../ffx/party-prep/ChapterPanel.ts';
import { makeAccessoryPanel, makeDresspherePanel, makeItemsPanel } from './panels.ts';
import { makeStatsPanel } from './StatsPanel.ts';

registerPrepPanel(makeChapterPanel('ffx2'));
registerPrepPanel(makeDresspherePanel());
registerPrepPanel(makeStatsPanel());
registerPrepPanel(makeAccessoryPanel());
registerPrepPanel(makeItemsPanel());
