/**
 * `?prebuild=` (lane "prebuild", 2026-10-24; both games; the conference demo only): the demo's fights have their FIGURES built behind the title and the picker (`prebuildFigures.ts`).
 *
 * | address | the figures |
 * |---|---|
 * | `?demo=1&pack=demo` | built ahead (on) |
 * | `?demo=1&pack=demo&prebuild=off` | built at the battle's entry, exactly as r63-play does (the A/B) |
 * | `?demo=1&prebuild=on` | built ahead, without the rest of the pack |
 *
 * Outside demo mode nothing is built ahead, whatever the address says.
 */
import { packDemo, queryWord } from '../../engine/motion/DemoGate.ts';
import { demoModeOn } from '../demoMode.ts';

/** The switch from an address (pure): `off` and `today` are off, `on` is on, and otherwise the pack decides. */
export function prebuildFromSearch(search: string | undefined): boolean {
  const w = queryWord(search, 'prebuild');
  if (w === 'off' || w === 'today' || w === '0') return false;
  if (w === 'on' || w === '1') return true;
  return packDemo(search);
}

/** Is the fight prebuild on for this page? (Demo mode and the switch.) */
export function prebuildOn(search: string | undefined = typeof window !== 'undefined' ? window.location.search : undefined): boolean {
  return demoModeOn() && prebuildFromSearch(search);
}
