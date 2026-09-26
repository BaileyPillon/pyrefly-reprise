/** Types for `critic/runner/lib/route-index.mjs`, so the unit test can import it. */
export interface IndexItem {
  file?: string;
  asserted?: string;
  verified?: boolean;
  staleRoots?: { screen?: string | null };
  [key: string]: unknown;
}
export function parseIndex(raw: string): IndexItem[];
export function indexMismatches(items: IndexItem[]): { file?: string; asserted: string; staleScreen: string | null | undefined; why: string }[];
