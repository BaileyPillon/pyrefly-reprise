import type { Server } from 'node:http';
export function startServer(opts: {
  dir: string;
  port?: number;
  host?: string;
  log?: (message: string) => void;
  onStop?: () => void;
}): Promise<{ server: Server; port: number; close: () => Promise<void> }>;
