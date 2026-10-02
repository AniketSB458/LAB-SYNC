import { Request, Response } from 'express';
import { DailySlot, IDailySlot, SlotStatus } from './slot.model.js';

export const LAB_DEFINITIONS = [
  { id: 'lab_d01', labId: 'D-01', name: 'Linux Laboratory', building: 'Systems & OS Building', floor: 1, capacity: 42 },
  { id: 'lab_d02', labId: 'D-02', name: 'Database Laboratory', building: 'Data Center & Software Complex', floor: 2, capacity: 46 },
  { id: 'lab_d03', labId: 'D-03', name: 'Project Laboratory', building: 'Project & Research Hub', floor: 2, capacity: 49 },
  { id: 'lab_d04', labId: 'D-04', name: 'Application Development Tool Lab', building: 'Software Engineering Block', floor: 1, capacity: 35 },
  { id: 'lab_d05', labId: 'D-05', name: 'Networking & Security Laboratory', building: 'Telecom & Network Complex', floor: 3, capacity: 40 },
  { id: 'lab_d06', labId: 'D-06', name: 'Hardware & IoT Systems Lab', building: 'Embedded Systems Wing', floor: 1, capacity: 38 },
  { id: 'lab_d07', labId: 'D-07', name: 'AI & High Performance GPU Cluster', building: 'Advanced Computing Center', floor: 4, capacity: 30 },
];

export const TIMING_SLOTS = [
  { index: 1, label: '08:30 AM - 09:30 AM', start: '08:30', end: '09:30' },
  { index: 2, label: '09:30 AM - 10:30 AM', start: '09:30', end: '10:30' },
  { index: 3, label: '10:45 AM - 11:45 AM', start: '10:45', end: '11:45' },
  { index: 4, label: '11:45 AM - 12:45 PM', start: '11:45', end: '12:45' },
  { index: 5, label: '01:15 PM - 02:15 PM', start: '13:15', end: '14:15' },
  { index: 6, label: '02:15 PM - 03:15 PM', start: '14:15', end: '15:15' },
  { index: 7, label: '03:30 PM - 04:30 PM', start: '15:30', end: '16:30' },
  { index: 8, label: '04:30 PM - 05:30 PM', start: '16:30', end: '17:30' },
];

// Fallback in-memory store if MongoDB is offline or in disconnected test mode
const inMemorySlots = new Map<string, any>();

function getTodayString(): string {
  const d = new Date();
  return d.toISOString().split('T')[0];
}

function buildDefaultSlot(lab: typeof LAB_DEFINITIONS[0], slot: typeof TIMING_SLOTS[0], date: string): any {
  const slotId = `slot_${lab.labId.toLowerCase().replace('-', '')}_${date.replace(/-/g, '')}_${slot.index}`;

  // Pre-seed realistic academic distribution:
  // E.g., slot 2 & 3 for D-01 booked for OS lab, slot 5 booked for DB
  let status: SlotStatus = 'available';
  let bookedBy: any = undefined;
  let purpose: string | undefined = undefined;

  if (lab.labId === 'D-01' && (slot.index === 2 || slot.index === 3)) {
    status = 'booked';
    bookedBy = {
      userId: 'usr_fac_01',
      name: 'Prof. S. R. Patil',
      email: 'faculty@ritindia.edu',
      role: 'faculty',
      department: 'Computer Science & Engineering',
    };
    purpose = 'CS302: Operating Systems Kernel Compilation Practical Batch A';
  } else if (lab.labId === 'D-02' && slot.index === 4) {
    status = 'booked';
    bookedBy = {
      userId: 'usr_fac_02',
      name: 'Dr. A. K. Kulkarni',
      email: 'kulkarni@ritindia.edu',
      role: 'faculty',
      department: 'Information Science',
    };
    purpose = 'IS401: Distributed Database Query Optimization';
  } else if (lab.labId === 'D-07' && (slot.index === 5 || slot.index === 6)) {
    status = 'booked';
    bookedBy = {
      userId: 'usr_student_01',
      name: 'Sharvil Patil',
      email: '2553018@ritindia.edu',
      role: 'student',
      department: 'Computer Science & Engineering',
    };
    purpose = 'Capstone AI Research: Multi-Modal LLM Fine-Tuning';
  } else if (lab.labId === 'D-06' && slot.index === 7) {
    status = 'maintenance';
    purpose = 'Scheduled FPGA Hardware & Oscilloscope Calibration';
  }

  return {
    slotId,
    labId: lab.id,
    labCode: lab.labId,
    labName: lab.name,
    building: lab.building,
    floor: lab.floor,
    date,
    slotIndex: slot.index,
    timeRange: slot.label,
    startTime: slot.start,
    endTime: slot.end,
    status,
    capacity: lab.capacity,
    bookedSeats: status === 'booked' ? lab.capacity : 0,
    bookedBy,
    purpose,
    allocatedWorkstations: status === 'booked' ? [`ws_${lab.labId}_all`] : [],
    updatedAt: new Date().toISOString(),
  };
}

export async function getDailySlots(req: Request, res: Response): Promise<void> {
  try {
    const targetDate = (req.query.date as string) || getTodayString();
    const labFilter = req.query.labId as string;
    const statusFilter = req.query.status as string;

    // Check if slots exist in MongoDB
    let dbSlots: any[] = [];
    try {
      const query: any = { date: targetDate };
      if (labFilter && labFilter !== 'all') {
        query.labId = labFilter;
      }
      if (statusFilter && statusFilter !== 'all') {
        query.status = statusFilter;
      }
      dbSlots = await DailySlot.find(query).sort({ labId: 1, slotIndex: 1 }).lean().exec();
    } catch {
      dbSlots = [];
    }

    // If MongoDB didn't have slots initialized for this date, build from template
    if (!dbSlots || dbSlots.length === 0) {
      const generated: any[] = [];
      for (const lab of LAB_DEFINITIONS) {
        if (labFilter && labFilter !== 'all' && lab.id !== labFilter && lab.labId !== labFilter) {
          continue;
        }
        for (const slot of TIMING_SLOTS) {
          const key = `${targetDate}_${lab.id}_${slot.index}`;
          const existing = inMemorySlots.get(key) || buildDefaultSlot(lab, slot, targetDate);
          inMemorySlots.set(key, existing);
          if (!statusFilter || statusFilter === 'all' || existing.status === statusFilter) {
            generated.push(existing);
          }
        }
      }
      dbSlots = generated;
    }

    // Compute real-time aggregated metrics
    const totalSlots = dbSlots.length;
    const bookedSlots = dbSlots.filter((s) => s.status === 'booked' || s.status === 'reserved_batch').length;
    const availableSlots = dbSlots.filter((s) => s.status === 'available').length;
    const maintenanceSlots = dbSlots.filter((s) => s.status === 'maintenance').length;
    const occupancyRate = totalSlots > 0 ? Math.round((bookedSlots / totalSlots) * 100) : 0;

    res.status(200).json({
      success: true,
      message: `Daily lab slots retrieved for ${targetDate}`,
      meta: {
        date: targetDate,
        totalSlots,
        bookedSlots,
        availableSlots,
        maintenanceSlots,
        occupancyRate,
        realtimeSync: true,
        serverTime: new Date().toISOString(),
      },
      data: dbSlots,
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to retrieve daily lab slots',
    });
  }
}

export async function bookSlot(req: Request, res: Response): Promise<void> {
  try {
    const { slotId, user, purpose, requiredResources, date, labId, slotIndex } = req.body;

    if (!slotId && (!labId || !date || !slotIndex)) {
      res.status(400).json({
        success: false,
        message: 'slotId or (labId, date, slotIndex) is required to book a slot',
      });
      return;
    }

    const resolvedSlotId =
      slotId || `slot_${labId.toLowerCase().replace(/[^a-z0-9]/g, '')}_${date.replace(/-/g, '')}_${slotIndex}`;

    // Try MongoDB first
    let updatedSlot: any = null;
    try {
      const existing = await DailySlot.findOne({ slotId: resolvedSlotId });
      if (existing) {
        if (existing.status === 'booked') {
          res.status(409).json({
            success: false,
            message: `Conflict: This timing slot is already booked by ${existing.bookedBy?.name || 'another member'}.`,
          });
          return;
        }
        existing.status = 'booked';
        existing.bookedBy = {
          userId: user?.id || 'usr_student_01',
          name: user?.name || 'Student User',
          email: user?.email || '2553018@ritindia.edu',
          role: user?.role || 'student',
          department: user?.department || 'Computer Science & Engineering',
        };
        existing.purpose = purpose || 'Independent Academic Practical Session';
        existing.allocatedWorkstations = requiredResources || [];
        existing.bookedSeats = existing.capacity;
        updatedSlot = await existing.save();
      }
    } catch {
      // Continue to in-memory fallback
    }

    // In-memory update
    const memKey = `${date || getTodayString()}_${labId}_${slotIndex}`;
    const memSlot = inMemorySlots.get(memKey) || {
      slotId: resolvedSlotId,
      labId: labId || 'lab_d01',
      date: date || getTodayString(),
      slotIndex: slotIndex || 1,
      timeRange: TIMING_SLOTS.find((s) => s.index === slotIndex)?.label || '09:30 AM - 10:30 AM',
    };

    memSlot.status = 'booked';
    memSlot.bookedBy = {
      userId: user?.id || 'usr_student_01',
      name: user?.name || 'Student User',
      email: user?.email || '2553018@ritindia.edu',
      role: user?.role || 'student',
      department: user?.department || 'Computer Science & Engineering',
    };
    memSlot.purpose = purpose || 'Academic Workstation Reservation';
    memSlot.updatedAt = new Date().toISOString();
    inMemorySlots.set(memKey, memSlot);

    res.status(200).json({
      success: true,
      message: 'Timing slot booked successfully in real-time!',
      data: updatedSlot || memSlot,
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: error.message || 'Error booking timing slot',
    });
  }
}

export async function releaseSlot(req: Request, res: Response): Promise<void> {
  try {
    const { slotId } = req.body;

    if (!slotId) {
      res.status(400).json({ success: false, message: 'slotId is required to release a slot' });
      return;
    }

    // Try MongoDB
    try {
      const existing = await DailySlot.findOne({ slotId });
      if (existing) {
        existing.status = 'available';
        existing.bookedBy = undefined;
        existing.purpose = undefined;
        existing.bookedSeats = 0;
        await existing.save();
      }
    } catch {
      // fallback
    }

    // In-memory
    for (const [key, slot] of inMemorySlots.entries()) {
      if (slot.slotId === slotId) {
        slot.status = 'available';
        slot.bookedBy = undefined;
        slot.purpose = undefined;
        slot.bookedSeats = 0;
        slot.updatedAt = new Date().toISOString();
        inMemorySlots.set(key, slot);
      }
    }

    res.status(200).json({
      success: true,
      message: 'Timing slot released and returned to available inventory',
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: error.message || 'Error releasing timing slot',
    });
  }
}
