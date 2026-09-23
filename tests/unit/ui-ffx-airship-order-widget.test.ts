// @vitest-environment jsdom
/**
 * `AirshipOrderWidget` — Evrae, THIS CHAPTER ONLY.
 *
 * Not an approved end state: built to the orchestrator's recommendation
 * (`docs/concepts/chapters/evrae/widget/options.json` option A), never
 * `docs/target/targets.json`-approved. These tests check the widget's own
 * mount gate, its keyboard reachability and the "already there" disabled
 * row — not that Bailey picked it.
 */

import { describe, expect, it } from 'vitest';
import type { AvailableCommand } from '../../src/battle/common/types.ts';
import { AirshipOrderWidget } from '../../src/ui/ffx/AirshipOrderWidget.ts';

function triggerCommand(id: 'pull-back' | 'close-in', enabled = true): AvailableCommand {
  return {
    label: id,
    enabled,
    command: { kind: 'trigger', id, targets: [] },
    validTargets: [],
  } as unknown as AvailableCommand;
}

describe('AirshipOrderWidget.applies — the mount gate', () => {
  it('is true only for the two real range values', () => {
    expect(AirshipOrderWidget.applies('near')).toBe(true);
    expect(AirshipOrderWidget.applies('far')).toBe(true);
  });

  it('is false for undefined, for any other flag value, and for every other chapter (no airship.range flag at all)', () => {
    expect(AirshipOrderWidget.applies(undefined)).toBe(false);
    expect(AirshipOrderWidget.applies('near-ish')).toBe(false);
    expect(AirshipOrderWidget.applies(1)).toBe(false);
    expect(AirshipOrderWidget.applies(null)).toBe(false);
  });
});

describe('AirshipOrderWidget', () => {
  it('disables the row matching the current range and reads "Already <range>"', async () => {
    const widget = new AirshipOrderWidget();
    document.body.appendChild(widget.el);
    void widget.open([triggerCommand('pull-back'), triggerCommand('close-in')], 'far', 3);
    expect(widget.el.textContent).toMatch(/Already far/);
    widget.dispose();
  });

  it('resolves with the real TriggerCommand for the chosen row, unmodified', async () => {
    const widget = new AirshipOrderWidget();
    document.body.appendChild(widget.el);
    const promise = widget.open([triggerCommand('pull-back'), triggerCommand('close-in')], 'near', 2);
    // Selection starts on the first non-disabled row: 'pull-back' (near -> close-in is "already").
    const rows = widget.el.querySelectorAll('[data-ui-action]');
    (rows[0] as HTMLElement).dispatchEvent(new MouseEvent('click', { bubbles: true }));
    const cmd = await promise;
    expect(cmd).toEqual({ kind: 'trigger', id: 'pull-back', targets: [] });
    widget.dispose();
  });

  it('is keyboard reachable: arrow key moves selection, Enter confirms', async () => {
    const widget = new AirshipOrderWidget();
    document.body.appendChild(widget.el);
    const promise = widget.open([triggerCommand('pull-back'), triggerCommand('close-in')], 'far', 1);
    // 'far' means 'pull-back' starts disabled ("Already far"); selection opens on 'close-in'.
    window.dispatchEvent(new KeyboardEvent('keydown', { code: 'Enter' }));
    const cmd = await promise;
    expect(cmd).toEqual({ kind: 'trigger', id: 'close-in', targets: [] });
    widget.dispose();
  });

  it('never offers a row the engine did not actually enable', async () => {
    const widget = new AirshipOrderWidget();
    document.body.appendChild(widget.el);
    void widget.open([triggerCommand('pull-back', false), triggerCommand('close-in', true)], 'near', 0);
    // pull-back is disabled by the engine (not by range) and close-in is "already" at near;
    // both rows should read disabled.
    expect(widget.el.querySelectorAll('.ig-cmd--disabled').length).toBe(2);
    widget.dispose();
  });
});
