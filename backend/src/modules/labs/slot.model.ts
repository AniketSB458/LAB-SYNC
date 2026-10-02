import mongoose, { Schema, Document } from 'mongoose';

export type SlotStatus = 'available' | 'booked' | 'maintenance' | 'reserved_batch';

export interface IDailySlot extends Document {
  slotId: string;
  labId: string;
  labName: string;
  building: string;
  floor: number;
  date: string; // YYYY-MM-DD
  slotIndex: number;
  timeRange: string; // e.g. "08:30 AM - 09:30 AM"
  startTime: string; // e.g. "08:30"
  endTime: string;   // e.g. "09:30"
  status: SlotStatus;
  capacity: number;
  bookedSeats?: number;
  bookedBy?: {
    userId: string;
    name: string;
    email: string;
    role: string;
    department?: string;
  };
  purpose?: string;
  allocatedWorkstations?: string[];
  updatedAt: Date;
  createdAt: Date;
}

const DailySlotSchema = new Schema<IDailySlot>(
  {
    slotId: { type: String, required: true, unique: true, index: true },
    labId: { type: String, required: true, index: true },
    labName: { type: String, required: true },
    building: { type: String, default: 'Systems & OS Building' },
    floor: { type: Number, default: 1 },
    date: { type: String, required: true, index: true },
    slotIndex: { type: Number, required: true },
    timeRange: { type: String, required: true },
    startTime: { type: String, required: true },
    endTime: { type: String, required: true },
    status: {
      type: String,
      enum: ['available', 'booked', 'maintenance', 'reserved_batch'],
      default: 'available',
      required: true,
      index: true,
    },
    capacity: { type: Number, default: 40 },
    bookedSeats: { type: Number, default: 0 },
    bookedBy: {
      userId: { type: String },
      name: { type: String },
      email: { type: String },
      role: { type: String },
      department: { type: String },
    },
    purpose: { type: String },
    allocatedWorkstations: [{ type: String }],
  },
  { timestamps: true }
);

// Compound index for fast queries by date and lab
DailySlotSchema.index({ date: 1, labId: 1, slotIndex: 1 });

export const DailySlot = mongoose.model<IDailySlot>('DailySlot', DailySlotSchema);
