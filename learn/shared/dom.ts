/**
 * `document.querySelector`, but for a template this module authored itself:
 * a miss means the markup and the code drifted, not a normal "nothing
 * matched" case, so this throws instead of returning `null` — and gives
 * every caller a properly narrowed, non-nullable binding it can close over
 * from a nested function without TypeScript losing the narrowing.
 */
export function requireEl<T extends Element = HTMLElement>(root: ParentNode, selector: string): T {
  const el = root.querySelector<T>(selector);
  if (el === null) {
    throw new Error(`dom.ts: expected an element matching "${selector}"`);
  }
  return el;
}
