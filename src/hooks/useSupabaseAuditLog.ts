import { useState, useEffect, useCallback } from 'react';
import {
  fetchAuditLogs,
  subscribeToRealtimeAuditLogs,
  recordAuditLog,
  SupabaseAuditLogEntry,
  RecordAuditParams,
} from '../services/supabase/auditLog.service';

export function useSupabaseAuditLog(limit = 60) {
  const [logs, setLogs] = useState<SupabaseAuditLogEntry[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isConnected, setIsConnected] = useState(false);
  const [latestEntry, setLatestEntry] = useState<SupabaseAuditLogEntry | null>(null);

  // Initial load
  const loadLogs = useCallback(async () => {
    setIsLoading(true);
    try {
      const data = await fetchAuditLogs(limit);
      setLogs(data);
      if (data.length > 0) {
        setLatestEntry(data[0]);
      }
      setIsConnected(true);
    } catch {
      setIsConnected(false);
    } finally {
      setIsLoading(false);
    }
  }, [limit]);

  useEffect(() => {
    loadLogs();

    // Subscribe to Supabase Realtime
    const unsubscribe = subscribeToRealtimeAuditLogs((newEntry) => {
      setLogs((prev) => {
        // Prevent duplicate insertion
        if (prev.some((item) => item.id === newEntry.id || item.correlation_id === newEntry.correlation_id)) {
          return prev;
        }
        return [newEntry, ...prev].slice(0, limit);
      });
      setLatestEntry(newEntry);
      setIsConnected(true);
    });

    return () => {
      unsubscribe();
    };
  }, [loadLogs, limit]);

  const logActivity = useCallback(async (params: RecordAuditParams) => {
    return await recordAuditLog(params);
  }, []);

  return {
    logs,
    isLoading,
    isConnected,
    latestEntry,
    refetch: loadLogs,
    logActivity,
  };
}
