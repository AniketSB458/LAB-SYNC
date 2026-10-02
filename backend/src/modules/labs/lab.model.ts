import mongoose, { Schema, Document } from 'mongoose';

export interface ILab extends Document {
  labId: string;
  name: string;
  description: string;
  location: string;
  building: string;
  floor: number;
  capacity: number;
  operationalStatus: 'available' | 'occupied' | 'maintenance' | 'offline';
  department: string;
  inCharge: {
    name: string;
    email: string;
    phone?: string;
  };
  hardwareFleet: {
    workstationModel: string;
    totalUnits: number;
    gpusInstalled?: string;
    osInstalled: string;
  };
}

const LabSchema = new Schema<ILab>(
  {
    labId: { type: String, required: true, unique: true, index: true },
    name: { type: String, required: true },
    description: { type: String },
    location: { type: String, required: true },
    building: { type: String, required: true },
    floor: { type: Number, default: 1 },
    capacity: { type: Number, required: true },
    operationalStatus: {
      type: String,
      enum: ['available', 'occupied', 'maintenance', 'offline'],
      default: 'available',
    },
    department: { type: String, default: 'Computer Science & Engineering' },
    inCharge: {
      name: { type: String, default: 'Prof. S. R. Patil' },
      email: { type: String, default: 'faculty@ritindia.edu' },
      phone: { type: String },
    },
    hardwareFleet: {
      workstationModel: { type: String, default: 'Dell OptiPlex 5090 SFF' },
      totalUnits: { type: Number, default: 40 },
      gpusInstalled: { type: String, default: 'NVIDIA RTX A2000 12GB' },
      osInstalled: { type: String, default: 'Ubuntu 22.04 LTS / Windows 11 Enterprise Dual Boot' },
    },
  },
  { timestamps: true }
);

export const Lab = mongoose.model<ILab>('Lab', LabSchema);
