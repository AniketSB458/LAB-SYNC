import { useState, useEffect, useCallback } from 'react';
import { DailySlot, DailySlotMetrics, DatabaseStatus, MongoDbStatus, AuthCredentialDetails } from '../types';
import { slotsApi } from '../services/api/slots.api';
import { supabase } from '../services/supabase/client';
import { useAuth } from './useAuth';

export function useDailySlots(initialDate?: string, labId?: string, status?: string) {
  const [selectedDate, setSelectedDate] = useState<string>(
    () => initialDate || new Date().toISOString().split('T')[0]
  );
  const [selectedLabId, setSelectedLabId] = useState<string>(labId || 'all');
  const [selectedStatus, setSelectedStatus] = useState<string>(status || 'all');

  const [slots, setSlots] = useState<DailySlot[]>([]);
  const [metrics, setMetrics] = useState<DailySlotMetrics | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isRefreshing, setIsRefreshing] = useState<boolean>(false);
  const [lastUpdated, setLastUpdated] = useState<string>(() => new Date().toLocaleTimeString());

  const { user } = useAuth();

  const fetchSlots = useCallback(async (quiet = false) => {
    if (!quiet) setIsLoading(true);
    else setIsRefreshing(true);

    try {
      const res = await slotsApi.getDailySlots(selectedDate, selectedLabId, selectedStatus);
      setSlots(res.data);
      setMetrics(res.meta);
      setLastUpdated(new Date().toLocaleTimeString());
    } catch (err) {
      console.error('Failed to load daily slots', err);
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, [selectedDate, selectedLabId, selectedStatus]);

  // Initial load and on filters change
  useEffect(() => {
    fetchSlots();
  }, [fetchSlots]);

  // Supabase Realtime Subscription: listens to any INSERT/UPDATE/DELETE on daily_slots table
  useEffect(() => {
    const channel = supabase
      .channel('schema-daily-slots-realtime')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'daily_slots' },
        () => {
          fetchSlots(true);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [fetchSlots]);

  // Polling pulse fallback every 15 seconds
  useEffect(() => {
    const timer = setInterval(() => {
      fetchSlots(true);
    }, 15000);
    return () => clearInterval(timer);
  }, [fetchSlots]);

  const bookSlot = async (slotId: string, purpose?: string, requiredResources?: string[]) => {
    const updated = await slotsApi.bookSlot({
      slotId,
      user,
      purpose,
      requiredResources,
    });

    // Update local state immediately for instant real-time UI feedback
    setSlots((prev) =>
      prev.map((s) => (s.slotId === slotId ? { ...s, status: 'booked', purpose, bookedBy: updated.bookedBy } : s))
    );

    await fetchSlots(true);
    return updated;
  };

  const releaseSlot = async (slotId: string) => {
    await slotsApi.releaseSlot(slotId);
    setSlots((prev) =>
      prev.map((s) => (s.slotId === slotId ? { ...s, status: 'available', purpose: undefined, bookedBy: undefined } : s))
    );
    await fetchSlots(true);
  };

  return {
    slots,
    metrics,
    isLoading,
    isRefreshing,
    lastUpdated,
    selectedDate,
    setSelectedDate,
    selectedLabId,
    setSelectedLabId,
    selectedStatus,
    setSelectedStatus,
    refresh: () => fetchSlots(true),
    bookSlot,
    releaseSlot,
  };
}

export function useDatabaseStatus() {
  const [status, setStatus] = useState<DatabaseStatus | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isRefreshing, setIsRefreshing] = useState<boolean>(false);

  const fetchStatus = useCallback(async (quiet = false) => {
    if (!quiet) setIsLoading(true);
    else setIsRefreshing(true);

    try {
      const res = await slotsApi.getDatabaseStatus();
      setStatus(res);
    } catch (err) {
      console.error('Failed to get database status', err);
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchStatus();
    const interval = setInterval(() => fetchStatus(true), 20000);
    return () => clearInterval(interval);
  }, [fetchStatus]);

  return {
    status,
    isLoading,
    isRefreshing,
    refresh: () => fetchStatus(true),
  };
}

export function useMongoDbStatus() {
  return useDatabaseStatus();
}

export function useAuthDetails() {
  const [authDetails, setAuthDetails] = useState<AuthCredentialDetails | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  useEffect(() => {
    let isMounted = true;
    slotsApi
      .getAuthDetails()
      .then((res) => {
        if (isMounted) setAuthDetails(res);
      })
      .catch(() => {})
      .finally(() => {
        if (isMounted) setIsLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, []);

  return { authDetails, isLoading };
}
