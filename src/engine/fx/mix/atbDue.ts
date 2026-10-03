/**
 * The MAX mix (D-316), DRESSPHERE SHOT's "is a menu about to open?" (round 19, PR-0314; FFX-2 only: only FFX-2 has
 * ATB gauges and a spherechange).
 *
 * The shot holds at least 1.6 s (D-316) or not at all, but it was cut to whenever no menu was open, so in Active ATB
 * (the gauges run) another girl's menu usually opened half a second in and handed it straight back: 5 of 12
 * changes held 0.47 to 0.62 s in the round 19 gap pass. A menu is due when another girl's gauge is full, or her
 * fill and the speed it has been rising at say it will be within the horizon. The gauges are read as drawn
 * (the party rows' `.ffx2atb__fill`, a percentage, and the `ffx2atb--ready` class), the way the rest of the mix reads
 * the HUD (`hudPanels.ts`), so nothing here touches the engine; the speed is the fill's own rise over the last
 * moments, never a number of ours. Presentation only.
 */

interface Sample {
  t: number;
  fill: number;
}

/** How far back the rise is measured (s), and the least history that counts. */
const WINDOW = 0.8;
const MIN_SPAN = 0.25;

export class AtbWatch {
  private readonly rows = new Map<string, Sample[]>();
  private clock = 0;
  private last = -1;

  /** Read the party rows' gauges (call every frame; it samples about every 60 ms). `dt` in seconds. */
  sample(dt: number): void {
    this.clock += dt;
    if (typeof document === 'undefined' || this.clock - this.last < 0.06) return;
    this.last = this.clock;
    const seen = new Set<string>();
    for (const row of document.querySelectorAll<HTMLElement>('.ig-stat')) {
      const fill = row.querySelector<HTMLElement>('.ffx2atb__fill');
      if (!fill) continue;
      const name = (row.querySelector('.ig-stat__name')?.textContent ?? '').trim().toLowerCase();
      if (!name) continue;
      const pct = parseFloat(fill.style.width);
      if (!Number.isFinite(pct)) continue;
      seen.add(name);
      const list = this.rows.get(name) ?? [];
      list.push({ t: this.clock, fill: pct / 100 });
      while (list.length > 2 && this.clock - list[0]!.t > WINDOW) list.shift();
      this.rows.set(name, list);
    }
    for (const k of [...this.rows.keys()]) if (!seen.has(k)) this.rows.delete(k);
  }

  /**
   * Seconds until another girl's menu opens, or Infinity when none is on its way (a full gauge is 0). `who` is the
   * girl who changes (her gauge has just emptied); a row whose gauge is not rising is not on its way.
   */
  secondsToMenu(who: string): number {
    if (typeof document === 'undefined') return Infinity;
    const me = who.trim().toLowerCase();
    let soonest = Infinity;
    for (const row of document.querySelectorAll<HTMLElement>('.ig-stat')) {
      const name = (row.querySelector('.ig-stat__name')?.textContent ?? '').trim().toLowerCase();
      if (!name || name === me || !row.querySelector('.ffx2atb__fill')) continue;
      if (row.querySelector('.ffx2atb--ready')) return 0;
      const list = this.rows.get(name);
      if (!list || list.length < 2) continue;
      const a = list[0]!;
      const b = list[list.length - 1]!;
      const span = b.t - a.t;
      if (span < MIN_SPAN || b.fill < a.fill) continue; // a refill after her own action reads as a fall: not on its way
      const rate = (b.fill - a.fill) / span;
      if (rate <= 1e-4) continue;
      soonest = Math.min(soonest, Math.max(0, (1 - b.fill) / rate));
    }
    return soonest;
  }
}
