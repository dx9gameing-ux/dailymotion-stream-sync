import type { Database } from './types';

export type Video = Database['public']['Tables']['videos']['Row'];
export type SyncLog = Database['public']['Tables']['sync_logs']['Row'];
