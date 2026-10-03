import { IBookingService } from '../types';
import { Booking, BookingStatus, BookingFilters, ApiResponse, SchedulingResult } from '../../types';
import { apiClient } from './client';
import { recordAuditLog } from '../supabase/auditLog.service';

export class ApiBookingService implements IBookingService {
  async listOwn(filters?: BookingFilters): Promise<ApiResponse<Booking[]>> {
    const res = await apiClient.get('/bookings', { params: filters });
    return res.data;
  }

  async listAll(filters?: BookingFilters): Promise<ApiResponse<Booking[]>> {
    const res = await apiClient.get('/admin/bookings', { params: filters });
    return res.data;
  }

  async getById(bookingId: string): Promise<ApiResponse<Booking>> {
    const res = await apiClient.get(`/bookings/${bookingId}`);
    return res.data;
  }

  async create(data: {
    labId: string;
    date: string;
    startTime: string;
    endTime: string;
    purpose: string;
    requiredResources?: string[];
  }): Promise<ApiResponse<Booking & { schedulingResult?: SchedulingResult }>> {
    const res = await apiClient.post('/bookings', data);
    
    // Broadcast to Supabase Realtime audit log
    if (res.data?.data) {
      const b = res.data.data;
      recordAuditLog({
        action: 'LAB_RESERVATION_CREATED',
        actorId: b.user,
        correlationId: `corr-${b.bookingId || b.id}`,
        before: null,
        after: {
          bookingId: b.bookingId || b.id,
          labId: data.labId,
          date: data.date,
          timeSlot: `${data.startTime} - ${data.endTime}`,
          purpose: data.purpose,
          status: b.status,
          evaluatedAt: new Date().toISOString(),
        },
      }).catch((e) => console.warn('Supabase audit log notice:', e));
    }
    
    return res.data;
  }

  async cancel(bookingId: string, cancellationReason?: string): Promise<ApiResponse<Booking>> {
    const res = await apiClient.patch(`/bookings/${bookingId}/cancel`, { cancellationReason });

    recordAuditLog({
      action: 'LAB_RESERVATION_CANCELLED',
      correlationId: `corr-cancel-${bookingId}`,
      after: {
        bookingId,
        cancellationReason,
        cancelledAt: new Date().toISOString(),
      },
    }).catch((e) => console.warn('Supabase audit log notice:', e));

    return res.data;
  }

  async updateStatus(bookingId: string, status: BookingStatus, reason?: string): Promise<ApiResponse<Booking>> {
    const res = await apiClient.patch(`/bookings/${bookingId}/status`, { status, reason });

    recordAuditLog({
      action: `BOOKING_STATUS_${status}`,
      correlationId: `corr-status-${bookingId}`,
      after: {
        bookingId,
        newStatus: status,
        reason,
        updatedAt: new Date().toISOString(),
      },
    }).catch((e) => console.warn('Supabase audit log notice:', e));

    return res.data;
  }
}
