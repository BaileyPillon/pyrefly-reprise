/**
 * Whether the demo's fight prebuild is on for this page (lane "prebuild", 2026-10-24; both games; the conference demo only). Engine code must not import the app, so the page says it once, at boot
 * (`main.ts`, from `app/demo/prebuildSwitch.ts`): `?demo=1&pack=demo` is on, `?prebuild=off` is r63-play exactly. The engine pieces that change only when it is on ask here.
 */
let on = false;

export function setPrebuildGate(value: boolean): void {
  on = value;
}

export function prebuildGate(): boolean {
  return on;
}
