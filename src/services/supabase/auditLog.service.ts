import { supabase } from './client';

export interface SupabaseAuditLogEntry {
  id: string;
  action: string;
  actor_id: string | null;
  correlation_id: string;
  before: Record<string, unknown> | null;
  after: Record<string, unknown> | null;
  created_at: string;
}

export interface RecordAuditParams {
  action: string;
  actorId?: string | null;
  actorName?: string;
  actorRole?: string;
  correlationId?: string;
  before?: Record<string, unknown> | null;
  after?: Record<string, unknown> | null;
}

// Regex to check valid UUID
const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

// Shared Supabase Realtime channel instance
const REALTIME_CHANNEL_NAME = 'supabase_audit_log_realtime';
let realtimeChannel: ReturnType<typeof supabase.channel> | null = null;

function getRealtimeChannel() {
  if (!realtimeChannel) {
    realtimeChannel = supabase.channel(REALTIME_CHANNEL_NAME, {
      config: {
        broadcast: { ack: true, self: true },
      },
    });
    realtimeChannel.subscribe();
  }
  return realtimeChannel;
}

/**
 * Record a new operational event directly into Supabase audit_log table
 * and stream it via Supabase Realtime Broadcast.
 */
export async function recordAuditLog(params: RecordAuditParams): Promise<SupabaseAuditLogEntry | null> {
  try {
    const correlationId =
      params.correlationId ||
      `corr-${Date.now()}-${Math.floor(1000 + Math.random() * 9000)}`;

    // Validate actor_id as UUID or fallback to null
    let validActorId: string | null = null;
    if (params.actorId && UUID_REGEX.test(params.actorId)) {
      validActorId = params.actorId;
    }

    // Ensure actor metadata is captured inside 'after' payload if actor_id is not a UUID
    const enrichedAfter = {
      ...(params.after || {}),
      _recordedBy: {
        actorId: params.actorId || 'system',
        actorName: params.actorName || 'Student/Faculty User',
        actorRole: params.actorRole || 'student',
      },
      _systemTime: new Date().toISOString(),
    };

    const rowToInsert = {
      action: params.action,
      actor_id: validActorId,
      correlation_id: correlationId,
      before: params.before || null,
      after: enrichedAfter,
    };

    // 1. Insert into Supabase 'audit_log' table
    const { data, error } = await supabase
      .from('audit_log')
      .insert([rowToInsert])
      .select();

    if (error) {
      console.warn('[Supabase Audit Log] Insert warning:', error.message);
    }

    const insertedEntry: SupabaseAuditLogEntry =
      data && data[0]
        ? (data[0] as SupabaseAuditLogEntry)
        : {
            id: `temp-${Date.now()}`,
            action: params.action,
            actor_id: validActorId,
            correlation_id: correlationId,
            before: params.before || null,
            after: enrichedAfter,
            created_at: new Date().toISOString(),
          };

    // 2. Broadcast via Supabase Realtime Channel
    try {
      const channel = getRealtimeChannel();
      await channel.send({
        type: 'broadcast',
        event: 'AUDIT_LOG_INSERT',
        payload: insertedEntry,
      });
    } catch (broadcastErr) {
      console.warn('[Supabase Realtime] Broadcast notice:', broadcastErr);
    }

    // 3. Dispatch local browser event for zero-delay in-app synchronization
    if (typeof window !== 'undefined') {
      window.dispatchEvent(
        new CustomEvent('supabase:audit_log_realtime', {
          detail: insertedEntry,
        })
      );
    }

    return insertedEntry;
  } catch (err) {
    console.error('[Supabase Audit Log] Execution error:', err);
    return null;
  }
}

/**
 * Fetch the latest audit log records from Supabase
 */
export async function fetchAuditLogs(limit = 60): Promise<SupabaseAuditLogEntry[]> {
  try {
    const { data, error } = await supabase
      .from('audit_log')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(limit);

    if (error) {
      console.warn('[Supabase Audit Log] Fetch error:', error.message);
      return [];
    }

    return (data || []) as SupabaseAuditLogEntry[];
  } catch (err) {
    console.error('[Supabase Audit Log] Fetch exception:', err);
    return [];
  }
}

/**
 * Subscribe to Supabase Realtime changes on 'audit_log' table and broadcast events
 */
export function subscribeToRealtimeAuditLogs(
  onNewEntry: (entry: SupabaseAuditLogEntry) => void
): () => void {
  const channelId = `audit_listener_${Date.now()}_${Math.random()}`;

  // Supabase Realtime Channel listening to Postgres changes & Broadcasts
  const channel = supabase
    .channel(channelId)
    .on(
      'postgres_changes',
      { event: 'INSERT', schema: 'public', table: 'audit_log' },
      (payload) => {
        if (payload.new) {
          onNewEntry(payload.new as SupabaseAuditLogEntry);
        }
      }
    )
    .on('broadcast', { event: 'AUDIT_LOG_INSERT' }, (payload) => {
      if (payload.payload) {
        onNewEntry(payload.payload as SupabaseAuditLogEntry);
      }
    })
    .subscribe();

  // Local window event listener
  const handleLocalEvent = (event: Event) => {
    const customEvent = event as CustomEvent<SupabaseAuditLogEntry>;
    if (customEvent.detail) {
      onNewEntry(customEvent.detail);
    }
  };

  if (typeof window !== 'undefined') {
    window.addEventListener('supabase:audit_log_realtime', handleLocalEvent);
  }

  // Cleanup handler
  return () => {
    supabase.removeChannel(channel);
    if (typeof window !== 'undefined') {
      window.removeEventListener('supabase:audit_log_realtime', handleLocalEvent);
    }
  };
}
