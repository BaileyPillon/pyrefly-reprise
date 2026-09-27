/**
 * PR-0028 / D-215 (Bailey, 2026-09-26: rename the legend, "I'll go with all of your
 * recommendations"): every legend for `H` names exactly what `H` does.
 *
 * `H` is a pause-screen key (`pause/keys.ts`): it takes away every panel and line and leaves the
 * painting, with one line to bring them back (`PauseView.setBare`). Battle has no `H` at all, so
 * a legend that said "hide panels", with the CONTROLS row under "This screen" beside battle keys,
 * read as a battle key that hides the HUD, which it never did (round 04 to 13, PR-0028).
 *
 * Game case: both (the pause and its legends are shared chrome).
 */

import { describe, expect, it } from 'vitest';
import { backHtml, baselineHtml } from '../../src/app/screens/pause/markup.ts';
import { controlsColumns } from '../../src/app/screens/pause/panels.ts';

describe('PR-0028: the H legends say what H does', () => {
  it('the pause prompt says the painting stays and nothing else does', () => {
    const html = backHtml();
    expect(html).toMatch(/H&nbsp;&nbsp;painting only/);
    expect(html).not.toMatch(/hide panels/i);
  });

  it('the one line that survives H brings the panels back', () => {
    expect(baselineHtml()).toMatch(/<b[^>]*>H<\/b> show panels/);
  });

  it('the CONTROLS row names the pause as where H works, and nothing on the tab calls it a battle key', () => {
    const rows = controlsColumns().flatMap((c) => c.rows);
    const hide = rows.find((r) => r.id === 'hide')!;
    expect(hide.value).toBe('H  /  Triangle');
    expect(hide.label).toBe('In pause, the painting alone');
    for (const r of rows) {
      if (r.id !== 'hide') expect(r.value, r.id).not.toMatch(/(^|\s)H(\s|$)/);
    }
  });
});
