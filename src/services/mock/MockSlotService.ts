import { DailySlot, DailySlotMetrics, MongoDbStatus, AuthCredentialDetails, SlotStatus } from '../../types';

const SLOTS_STORAGE_KEY = 'smart_campus_daily_slots_v1';

export const LAB_OPTIONS = [
  { id: 'lab_d01', code: 'D-01', name: 'Linux Laboratory', building: 'Systems & OS Building', floor: 1, capacity: 42 },
  { id: 'lab_d02', code: 'D-02', name: 'Database Laboratory', building: 'Data Center & Software Complex', floor: 2, capacity: 46 },
  { id: 'lab_d03', code: 'D-03', name: 'Project Laboratory', building: 'Project & Research Hub', floor: 2, capacity: 49 },
  { id: 'lab_d04', code: 'D-04', name: 'Application Development Tool Lab', building: 'Software Engineering Block', floor: 1, capacity: 35 },
  { id: 'lab_d05', code: 'D-05', name: 'Networking & Security Laboratory', building: 'Telecom & Network Complex', floor: 3, capacity: 40 },
  { id: 'lab_d06', code: 'D-06', name: 'Hardware & IoT Systems Lab', building: 'Embedded Systems Wing', floor: 1, capacity: 38 },
  { id: 'lab_d07', code: 'D-07', name: 'AI & GPU Cluster Laboratory', building: 'Advanced Computing Center', floor: 4, capacity: 30 },
];

export const TIMING_BLOCKS = [
  { index: 1, label: '08:30 AM - 09:30 AM', start: '08:30', end: '09:30' },
  { index: 2, label: '09:30 AM - 10:30 AM', start: '09:30', end: '10:30' },
  { index: 3, label: '10:45 AM - 11:45 AM', start: '10:45', end: '11:45' },
  { index: 4, label: '11:45 AM - 12:45 PM', start: '11:45', end: '12:45' },
  { index: 5, label: '01:15 PM - 02:15 PM', start: '13:15', end: '14:15' },
  { index: 6, label: '02:15 PM - 03:15 PM', start: '14:15', end: '15:15' },
  { index: 7, label: '03:30 PM - 04:30 PM', start: '15:30', end: '16:30' },
  { index: 8, label: '04:30 PM - 05:30 PM', start: '16:30', end: '17:30' },
];

function getStoredSlots(): Record<string, DailySlot[]> {
  try {
    const raw = localStorage.getItem(SLOTS_STORAGE_KEY);
    if (raw) {
      return JSON.parse(raw);
    }
  } catch {
    // fallback
  }
  return {};
}

function saveStoredSlots(data: Record<string, DailySlot[]>) {
  try {
    localStorage.setItem(SLOTS_STORAGE_KEY, JSON.stringify(data));
  } catch {
    // ignore
  }
}

export function generateSeedSlotsForDate(dateStr: string): DailySlot[] {
  const slots: DailySlot[] = [];

  for (const lab of LAB_OPTIONS) {
    for (const block of TIMING_BLOCKS) {
      const slotId = `slot_${lab.code.toLowerCase().replace('-', '')}_${dateStr.replace(/-/g, '')}_${block.index}`;

      let status: SlotStatus = 'available';
      let bookedBy: DailySlot['bookedBy'] = undefined;
      let purpose: string | undefined = undefined;

      // Realistic academic timetable seeds
      if (lab.code === 'D-01' && (block.index === 2 || block.index === 3)) {
        status = 'booked';
        bookedBy = {
          userId: 'usr_fac_01',
          name: 'Prof. S. R. Patil',
          email: 'faculty@ritindia.edu',
          role: 'faculty',
          department: 'Computer Science & Engineering',
        };
        purpose = 'CS302: Operating Systems Kernel Compilation Practical Batch A';
      } else if (lab.code === 'D-02' && block.index === 4) {
        status = 'booked';
        bookedBy = {
          userId: 'usr_fac_02',
          name: 'Dr. A. K. Kulkarni',
          email: 'kulkarni@ritindia.edu',
          role: 'faculty',
          department: 'Information Science',
        };
        purpose = 'IS401: Distributed Database Query Optimization';
      } else if (lab.code === 'D-07' && (block.index === 5 || block.index === 6)) {
        status = 'booked';
        bookedBy = {
          userId: 'usr_student_01',
          name: 'Sharvil Patil',
          email: '2553018@ritindia.edu',
          role: 'student',
          department: 'Computer Science & Engineering',
        };
        purpose = 'Capstone AI Research: Multi-Modal LLM Fine-Tuning';
      } else if (lab.code === 'D-06' && block.index === 7) {
        status = 'maintenance';
        purpose = 'Scheduled FPGA Hardware & Oscilloscope Calibration';
      }

      slots.push({
        slotId,
        labId: lab.id,
        labCode: lab.code,
        labName: lab.name,
        building: lab.building,
        floor: lab.floor,
        date: dateStr,
        slotIndex: block.index,
        timeRange: block.label,
        startTime: block.start,
        endTime: block.end,
        status,
        capacity: lab.capacity,
        bookedSeats: status === 'booked' ? lab.capacity : 0,
        bookedBy,
        purpose,
        allocatedWorkstations: status === 'booked' ? [`Workstations 1-${lab.capacity}`] : [],
        updatedAt: new Date().toISOString(),
      });
    }
  }

  return slots;
}

export class MockSlotService {
  async getDailySlots(
    date: string,
    labId?: string,
    status?: string
  ): Promise<{ data: DailySlot[]; meta: DailySlotMetrics }> {
    await new Promise((r) => setTimeout(r, 120));

    const stored = getStoredSlots();
    if (!stored[date]) {
      stored[date] = generateSeedSlotsForDate(date);
      saveStoredSlots(stored);
    }

    let result = [...stored[date]];

    if (labId && labId !== 'all') {
      result = result.filter((s) => s.labId === labId || s.labCode === labId);
    }

    if (status && status !== 'all') {
      result = result.filter((s) => s.status === status);
    }

    const totalSlots = result.length;
    const bookedSlots = result.filter((s) => s.status === 'booked' || s.status === 'reserved_batch').length;
    const availableSlots = result.filter((s) => s.status === 'available').length;
    const maintenanceSlots = result.filter((s) => s.status === 'maintenance').length;
    const occupancyRate = totalSlots > 0 ? Math.round((bookedSlots / totalSlots) * 100) : 0;

    return {
      data: result,
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

  async bookSlot(payload: {
    slotId: string;
    user?: any;
    purpose?: string;
    requiredResources?: string[];
  }): Promise<DailySlot> {
    await new Promise((r) => setTimeout(r, 200));
    const stored = getStoredSlots();

    for (const dateKey of Object.keys(stored)) {
      const idx = stored[dateKey].findIndex((s) => s.slotId === payload.slotId);
      if (idx !== -1) {
        const slot = stored[dateKey][idx];
        if (slot.status === 'booked') {
          throw new Error('This slot is already booked by another user');
        }

        const currentUser = payload.user || {
          id: 'usr_student_01',
          name: 'Sharvil Patil',
          email: '2553018@ritindia.edu',
          role: 'student',
          department: 'Computer Science & Engineering',
        };

        slot.status = 'booked';
        slot.bookedBy = {
          userId: currentUser.id || 'usr_student_01',
          name: currentUser.name || 'Sharvil Patil',
          email: currentUser.email || '2553018@ritindia.edu',
          role: currentUser.role || 'student',
          department: currentUser.department || 'Computer Science & Engineering',
        };
        slot.purpose = payload.purpose || 'Individual Lab Research Session';
        slot.allocatedWorkstations = payload.requiredResources || [`Workstations 1-${slot.capacity}`];
        slot.bookedSeats = slot.capacity;
        slot.updatedAt = new Date().toISOString();

        saveStoredSlots(stored);
        return slot;
      }
    }

    throw new Error('Slot not found');
  }

  async releaseSlot(slotId: string): Promise<boolean> {
    await new Promise((r) => setTimeout(r, 150));
    const stored = getStoredSlots();

    for (const dateKey of Object.keys(stored)) {
      const idx = stored[dateKey].findIndex((s) => s.slotId === slotId);
      if (idx !== -1) {
        const slot = stored[dateKey][idx];
        slot.status = 'available';
        slot.bookedBy = undefined;
        slot.purpose = undefined;
        slot.bookedSeats = 0;
        slot.allocatedWorkstations = [];
        slot.updatedAt = new Date().toISOString();

        saveStoredSlots(stored);
        return true;
      }
    }

    return false;
  }

  async getMongoDbStatus(): Promise<MongoDbStatus> {
    await new Promise((r) => setTimeout(r, 100));
    return {
      status: 'connected',
      connectionState: 'connected (PostgreSQL 16 - Supabase Relational Schema)',
      isReady: true,
      database: 'smart_campus_optimizer',
      engine: 'PostgreSQL 16 (Supabase)',
      activeTables: [
        { name: 'public.profiles', description: 'Institutional Auth & RBAC Profile Store', documents: 6 },
        { name: 'public.labs', description: 'Normalized Laboratory Hardware Fleet & Facilities', documents: 7 },
        { name: 'public.resources', description: 'Individual Workstations & Hardware Units (WS-D01-01...) with State Machine', documents: 28 },
        { name: 'public.bookings', description: 'Authoritative Reservation Record with ACID commit_booking RPC', documents: 18 },
        { name: 'public.scheduling_decisions', description: 'Scheduling Decisions with Policy (FCFS/SJF/RR/Priority)', documents: 14 },
        { name: 'public.routes', description: 'Campus Graph Routing Paths (Dijkstra/Bellman-Ford)', documents: 9 },
        { name: 'public.purchase_batches', description: '3NF Procurement & Dead-Stock Inventory Register', documents: 32 },
      ],
      configuration: {
        engine: 'PostgreSQL 16',
        host: 'Cloud SQL Auth Proxy (Unix Domain Socket)',
        poolMax: 10,
        schema: 'public',
        supportsRealtimePolling: true,
      },
      models: ['Profile', 'Lab', 'Resource', 'Booking', 'SchedulingDecision', 'Route', 'PurchaseBatch'],
      timestamp: new Date().toISOString(),
    };
  }

  async getAuthDetails(): Promise<AuthCredentialDetails> {
    await new Promise((r) => setTimeout(r, 80));
    return {
      institutionDomain: '@ritindia.edu',
      tokenAlgorithm: 'HS256',
      tokenExpiry: '7d',
      mongoDatabase: 'smart_campus_optimizer',
      activeCollection: 'profiles',
      rolesAvailable: ['student', 'faculty', 'admin'],
      demoAccounts: [
        {
          role: 'student',
          name: 'Sharvil Patil',
          email: '2553018@ritindia.edu',
          password: 'password123',
          department: 'Computer Science & Engineering',
          studentId: 'RIT-2023-CS-042',
          accessLevel: 'Workstation Booking & Daily Lab Slot Reservation',
        },
        {
          role: 'faculty',
          name: 'Prof. S. R. Patil',
          email: 'faculty@ritindia.edu',
          password: 'faculty123',
          department: 'Computer Engineering',
          employeeId: 'RIT-FAC-8812',
          designation: 'Associate Professor & Lab In-charge',
          accessLevel: 'Course Batch Booking, Hardware Override & Approval',
        },
        {
          role: 'admin',
          name: 'Chief Lab Administrator',
          email: 'admin@ritindia.edu',
          password: 'admin123',
          department: 'Campus IT Infrastructure',
          employeeId: 'RIT-ADM-0001',
          designation: 'Campus IT Director',
          accessLevel: 'Super Administrator, Supabase Full Access & Fleet Telemetry',
        },
      ],
      instructions: 'Institutional authentication requires institutional email address ending with @ritindia.edu.',
    };
  }
}

export const mockSlotService = new MockSlotService();
