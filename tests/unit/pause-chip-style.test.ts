/**
 * PR-0238 (critic round 15), both games: the battle's PAUSE chip rendered as a
 * bare browser button (grey, system font, about 13 px) because the pause remake
 * (8cf17246f) replaced pause-screen.css and dropped the chip's rule. The rule
 * is restored in pause-chip.css, loaded with the pause screen, at the 14 px
 * floor in paper ink on the Ink & Gold chip.
 */
import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

const css = readFileSync('src/ui/common/pause-chip.css', 'utf8');
const rule = /\.battle-pause-chip \{([^}]*)\}/.exec(css)?.[1] ?? '';

describe('the PAUSE chip (PR-0238)', () => {
  it('has its own rule again, in the Ink & Gold chip tokens', () => {
    expect(rule).toContain('background: var(--ig-ink-chip');
    expect(rule).toContain('font-family: var(--ig-font-display');
    expect(rule).toContain('border-left: 3px solid var(--ig-accent');
  });

  it('reads at 14 px in paper ink, not faded', () => {
    expect(rule).toMatch(/font-size: 14px;/);
    expect(rule).toContain('color: var(--ig-paper');
    expect(rule).not.toMatch(/opacity:\s*0\./);
  });

  it('is loaded with the pause screen that BattleScreen imports', () => {
    expect(readFileSync('src/app/screens/PauseScreen.ts', 'utf8')).toContain("import '../../ui/common/pause-chip.css'");
  });
});
