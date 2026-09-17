import './party-prep.css';
import { registerPrepPanel } from '../../../app/screens/PartyPrepScreen.ts';
import { makeEquipmentPanel, makeItemsPanel, makeOverdrivePanel, makeStatsPanel } from './panels.ts';
import { makeSphereGridPanel } from './SphereGridPanel.ts';

/**
 * Wires the FFX party-prep UI into `PartyPrepScreen`'s Ink & Gold frame
 * (`registerPrepPanel`, see that file's header comment) as five composing
 * panels — Stats, Sphere Grid, Equipment, Items, Overdrive — rather than one
 * panel that redraws the whole screen: the shell now owns the backdrop,
 * roster column, tab strip, active-party slots and START BATTLE button
 * (`src/ui/common/party-prep.css`, `docs/screenshots/
 * 35-inkgold-party-prep.png`), and keeps every composing panel's own
 * container alive across tab switches instead of rebuilding whichever tab
 * was drawn last — the bug the older single-panel design (and this file's
 * own previous revision) worked around by merging everything into one tab.
 *
 * `main.ts` imports this module once for its registration side effect,
 * alongside the HUD screenshot demo screen.
 */
registerPrepPanel(makeStatsPanel());
registerPrepPanel(makeSphereGridPanel());
registerPrepPanel(makeEquipmentPanel());
registerPrepPanel(makeItemsPanel());
registerPrepPanel(makeOverdrivePanel());
