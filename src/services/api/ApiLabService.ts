import { ILabService } from '../types';
import { Lab, LabFilters, ApiResponse } from '../../types';
import { apiClient } from './client';
import { supabase } from '../supabase/client';

export class ApiLabService implements ILabService {
  async list(filters?: LabFilters): Promise<ApiResponse<Lab[]>> {
    try {
      const { data: dbLabs, error } = await supabase.from('labs').select('*');
      if (!error && dbLabs && dbLabs.length > 0) {
        const labs: Lab[] = dbLabs.map((l: any) => ({
          id: l.id,
          labId: l.lab_code || l.id,
          name: l.name,
          description: `Department of Computer Engineering - ${l.building}`,
          location: `${l.building}, Floor 1`,
          building: l.building,
          floor: 1,
          capacity: l.capacity,
          operationalStatus: 'available',
          createdAt: l.created_at,
          updatedAt: l.created_at,
        }));
        return {
          success: true,
          message: 'Labs retrieved from Supabase',
          data: labs,
        };
      }
    } catch {
      // fallback
    }

    try {
      const res = await apiClient.get('/labs', { params: filters });
      return res.data;
    } catch {
      return {
        success: true,
        message: 'Fallback',
        data: [],
      };
    }
  }

  async getById(labId: string): Promise<ApiResponse<Lab>> {
    try {
      const { data: l, error } = await supabase
        .from('labs')
        .select('*')
        .or(`id.eq.${labId},lab_code.eq.${labId}`)
        .single();
      if (!error && l) {
        return {
          success: true,
          message: 'Lab retrieved successfully',
          data: {
            id: l.id,
            labId: l.lab_code || l.id,
            name: l.name,
            description: `Department of Computer Engineering - ${l.building}`,
            location: `${l.building}, Floor 1`,
            building: l.building,
            floor: 1,
            capacity: l.capacity,
            operationalStatus: 'available',
            createdAt: l.created_at,
            updatedAt: l.created_at,
          },
        };
      }
    } catch {
      // fallback
    }

    const res = await apiClient.get(`/labs/${labId}`);
    return res.data;
  }

  async create(data: Omit<Lab, 'id' | 'createdAt' | 'updatedAt'>): Promise<ApiResponse<Lab>> {
    try {
      const { data: created, error } = await supabase
        .from('labs')
        .insert([
          {
            name: data.name,
            lab_code: data.labId || `LAB-${Date.now().toString().slice(-4)}`,
            building: data.building || 'Academic Block A',
            capacity: data.capacity || 40,
          },
        ])
        .select()
        .single();

      if (!error && created) {
        return {
          success: true,
          message: 'Lab created successfully',
          data: {
            id: created.id,
            labId: created.lab_code,
            name: created.name,
            description: data.description,
            location: data.location,
            building: created.building,
            floor: data.floor || 1,
            capacity: created.capacity,
            operationalStatus: 'available',
          },
        };
      }
    } catch {
      // fallback
    }
    const res = await apiClient.post('/labs', data);
    return res.data;
  }

  async update(labId: string, data: Partial<Lab>): Promise<ApiResponse<Lab>> {
    try {
      const { data: updated, error } = await supabase
        .from('labs')
        .update({
          ...(data.name ? { name: data.name } : {}),
          ...(data.capacity ? { capacity: data.capacity } : {}),
          ...(data.building ? { building: data.building } : {}),
        })
        .or(`id.eq.${labId},lab_code.eq.${labId}`)
        .select()
        .single();

      if (!error && updated) {
        return {
          success: true,
          message: 'Lab updated successfully',
          data: {
            id: updated.id,
            labId: updated.lab_code,
            name: updated.name,
            description: data.description || '',
            location: data.location || '',
            building: updated.building,
            floor: data.floor || 1,
            capacity: updated.capacity,
            operationalStatus: data.operationalStatus || 'available',
          },
        };
      }
    } catch {
      // fallback
    }
    const res = await apiClient.patch(`/labs/${labId}`, data);
    return res.data;
  }

  async delete(labId: string): Promise<ApiResponse<{ id: string }>> {
    try {
      await supabase.from('labs').delete().or(`id.eq.${labId},lab_code.eq.${labId}`);
      return { success: true, message: 'Lab deleted successfully', data: { id: labId } };
    } catch {
      // fallback
    }
    const res = await apiClient.delete(`/labs/${labId}`);
    return res.data;
  }
}
