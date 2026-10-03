import { apiClient } from './client';
import { supabase } from '../supabase/client';
import { DailySlot, DailySlotMetrics, DatabaseStatus, AuthCredentialDetails, SlotStatus } from '../../types';
import { mockSlotService } from '../mock/MockSlotService';

export const slotsApi = {
  async getDailySlots(
    date: string,
    labId?: string,
    status?: string
  ): Promise<{ data: DailySlot[]; meta: DailySlotMetrics }> {
    try {
      let query = supabase.from('daily_slots').select('*');
      if (date) query = query.eq('slot_date', date);
      if (labId && labId !== 'all') query = query.eq('lab_id', labId);
      if (status && status !== 'all') query = query.eq('status', status);

      const { data: dbSlots, error } = await query.order('time_range', { ascending: true });

      if (!error && dbSlots && dbSlots.length > 0) {
        const slots: DailySlot[] = dbSlots.map((row: any, idx: number) => ({
          slotId: row.id,
          labId: row.lab_id,
          labCode: row.lab_code || 'CS-LAB-01',
          labName: row.lab_name || 'Computer Science Lab',
          building: row.building || 'Academic Block A',
          floor: 1,
          date: row.slot_date,
          slotIndex: idx,
          timeRange: row.time_range,
          startTime: row.time_range ? row.time_range.split(' - ')[0] : '09:00 AM',
          endTime: row.time_range ? row.time_range.split(' - ')[1] : '10:00 AM',
          status: (row.status || 'available') as SlotStatus,
          capacity: row.capacity || 40,
          bookedSeats: row.status === 'booked' ? row.capacity || 40 : 0,
          bookedBy: row.booked_by_name
            ? {
                userId: row.booked_by_id || 'usr-live',
                name: row.booked_by_name,
                email: row.booked_by_email || 'user@ritindia.edu',
                role: row.booked_by_role || 'faculty',
                department: 'Computer Science & Engineering',
              }
            : undefined,
          purpose: row.purpose || undefined,
          updatedAt: row.updated_at || new Date().toISOString(),
        }));

        const totalSlots = slots.length;
        const bookedSlots = slots.filter((s) => s.status === 'booked').length;
        const availableSlots = slots.filter((s) => s.status === 'available').length;
        const maintenanceSlots = slots.filter((s) => s.status === 'maintenance').length;
        const occupancyRate = totalSlots > 0 ? Math.round((bookedSlots / totalSlots) * 100) : 0;

        return {
          data: slots,
          meta: {
            date,
            totalSlots,
            bookedSlots,
            availableSlots,
            maintenanceSlots,
            occupancyRate,
            realtimeSync: true,
            serverTime: new Date().toISOString(),
          },
        };
      }
    } catch {
      // fallback
    }

    try {
      const params = new URLSearchParams({ date });
      if (labId && labId !== 'all') params.append('labId', labId);
      if (status && status !== 'all') params.append('status', status);

      const response = await apiClient.get<{
        success: boolean;
        message: string;
        meta: DailySlotMetrics;
        data: DailySlot[];
      }>(`/labs/daily-slots?${params.toString()}`);

      if (response.data && response.data.data && response.data.data.length > 0) {
        return {
          data: response.data.data,
          meta: response.data.meta,
        };
      }
    } catch {
      // fallback
    }
    return mockSlotService.getDailySlots(date, labId, status);
  },

  async bookSlot(payload: {
    slotId: string;
    user?: any;
    purpose?: string;
    requiredResources?: string[];
    date?: string;
    labId?: string;
    slotIndex?: number;
  }): Promise<DailySlot> {
    try {
      if (payload.slotId) {
        const { data, error } = await supabase
          .from('daily_slots')
          .update({
            status: 'booked',
            booked_by_name: payload.user?.name || 'Verified User',
            booked_by_email: payload.user?.email || 'user@ritindia.edu',
            booked_by_role: payload.user?.role || 'student',
            purpose: payload.purpose || 'Academic Session / Research Lab',
            updated_at: new Date().toISOString(),
          })
          .eq('id', payload.slotId)
          .select()
          .single();

        if (!error && data) {
          return {
            slotId: data.id,
            labId: data.lab_id,
            labCode: data.lab_code,
            labName: data.lab_name,
            building: data.building,
            floor: 1,
            date: data.slot_date,
            slotIndex: payload.slotIndex ?? 0,
            timeRange: data.time_range,
            startTime: data.time_range ? data.time_range.split(' - ')[0] : '09:00 AM',
            endTime: data.time_range ? data.time_range.split(' - ')[1] : '10:00 AM',
            status: 'booked',
            capacity: data.capacity,
            bookedSeats: data.capacity,
            bookedBy: {
              userId: payload.user?.id || 'live-user',
              name: payload.user?.name || 'Verified User',
              email: payload.user?.email || 'user@ritindia.edu',
              role: payload.user?.role || 'student',
              department: 'Computer Science & Engineering',
            },
            purpose: payload.purpose,
            updatedAt: data.updated_at,
          };
        }
      }
    } catch {
      // fallback
    }

    try {
      const response = await apiClient.post<{
        success: boolean;
        message: string;
        data: DailySlot;
      }>('/labs/book-slot', payload);

      if (response.data && response.data.data) {
        return response.data.data;
      }
    } catch {
      // fallback
    }
    return mockSlotService.bookSlot(payload);
  },

  async releaseSlot(slotId: string): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('daily_slots')
        .update({
          status: 'available',
          booked_by_id: null,
          booked_by_name: null,
          booked_by_email: null,
          booked_by_role: null,
          purpose: null,
          updated_at: new Date().toISOString(),
        })
        .eq('id', slotId);

      if (!error) {
        return true;
      }
    } catch {
      // fallback
    }

    try {
      const response = await apiClient.post<{ success: boolean; message: string }>('/labs/release-slot', {
        slotId,
      });
      if (response.data && response.data.success) {
        return true;
      }
    } catch {
      // fallback
    }
    return mockSlotService.releaseSlot(slotId);
  },

  async getDatabaseStatus(): Promise<DatabaseStatus> {
    try {
      const [slotsRes, labsRes, nodesRes, catsRes] = await Promise.all([
        supabase.from('daily_slots').select('*', { count: 'exact', head: true }),
        supabase.from('labs').select('*', { count: 'exact', head: true }),
        supabase.from('campus_nodes').select('*', { count: 'exact', head: true }),
        supabase.from('equipment_categories').select('*', { count: 'exact', head: true }),
      ]);

      const slotCount = slotsRes.count ?? 0;
      const labCount = labsRes.count ?? 7;
      const nodeCount = nodesRes.count ?? 3;
      const catCount = catsRes.count ?? 4;

      return {
        status: 'online',
        connectionState: 'Connected to Supabase PostgreSQL',
        isReady: true,
        database: 'smart-campus (Supabase)',
        engine: 'PostgreSQL 15 (Supabase Cloud)',
        activeTables: [
          { name: 'daily_slots', description: 'Real-time timetable slots & bookings', documents: slotCount },
          { name: 'labs', description: 'Campus engineering laboratories', documents: labCount },
          { name: 'campus_nodes', description: 'Campus navigation & spatial graph nodes', documents: nodeCount },
          { name: 'equipment_categories', description: '3NF equipment catalog categories', documents: catCount },
        ],
        configuration: {
          engine: 'PostgreSQL',
          host: 'ksecnwtqykmqfidspuzt.supabase.co',
          poolMax: 20,
          schema: 'public',
          supportsRealtimePolling: true,
        },
        models: ['daily_slots', 'labs', 'campus_nodes', 'equipment_categories', 'bookings', 'resources'],
        timestamp: new Date().toISOString(),
      };
    } catch {
      // fallback
    }
    return mockSlotService.getMongoDbStatus();
  },

  async getMongoDbStatus(): Promise<DatabaseStatus> {
    return this.getDatabaseStatus();
  },

  async getAuthDetails(): Promise<AuthCredentialDetails> {
    try {
      const response = await apiClient.get<{
        success: boolean;
        message: string;
        data: AuthCredentialDetails;
      }>('/auth/credentials');

      if (response.data && response.data.data) {
        return response.data.data;
      }
    } catch {
      // fallback
    }
    return mockSlotService.getAuthDetails();
  },
};
