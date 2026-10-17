export function stampTables(o?: {
  root?: string;
  artDir?: string;
  subjects?: string[];
  dry?: boolean;
  concurrency?: number;
  log?: (s: string) => void;
}): Promise<{
  stamped: number;
  added: number;
  updated: number;
  byStatus: Record<string, number>;
  unreadable: string[];
  changed: string[];
}>;
