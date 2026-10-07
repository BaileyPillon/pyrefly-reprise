type Row = { scale?: number; stanceX?: number; feetRow?: number; upright?: true };
export interface RegistrationRowInput {
  pose: string;
  width: number;
  height: number;
  baselineY: number;
  contentBox: readonly number[];
  stance?: { x: number } | undefined;
  head?: readonly number[] | null;
  idle?: { head?: readonly number[] | null; contentBox: readonly number[] } | null;
  feetRow?: number | undefined;
  upright?: boolean | undefined;
}
/** The registration row of a freshly installed pose (see the header of `tools/exp-install.mjs`). */
export function registrationRow(input: RegistrationRowInput): Row;
