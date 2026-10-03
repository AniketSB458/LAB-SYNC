export type SlotStatus = 'available' | 'booked' | 'maintenance' | 'reserved_batch';

export interface DailySlot {
  slotId: string;
  labId: string;
  labCode: string;
  labName: string;
  building: string;
  floor: number;
  date: string; // YYYY-MM-DD
  slotIndex: number;
  timeRange: string; // e.g. "08:30 AM - 09:30 AM"
  startTime: string; // "08:30"
  endTime: string;   // "09:30"
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
  updatedAt: string;
}

export interface DailySlotMetrics {
  date: string;
  totalSlots: number;
  bookedSlots: number;
  availableSlots: number;
  maintenanceSlots: number;
  occupancyRate: number;
  realtimeSync: boolean;
  serverTime: string;
}

export interface DatabaseStatus {
  status: 'online' | 'connected';
  connectionState: string;
  isReady: boolean;
  database: string;
  engine: string;
  activeTables: {
    name: string;
    description: string;
    documents: number;
  }[];
  configuration: {
    engine: string;
    host: string;
    poolMax: number;
    schema: string;
    supportsRealtimePolling: boolean;
  };
  models: string[];
  timestamp: string;
}

export type MongoDbStatus = DatabaseStatus;

export interface AuthCredentialDetails {
  institutionDomain: string;
  tokenAlgorithm: string;
  tokenExpiry: string;
  mongoDatabase: string;
  activeCollection: string;
  rolesAvailable: string[];
  demoAccounts: {
    role: 'student' | 'faculty' | 'admin';
    name: string;
    email: string;
    password: string;
    department: string;
    studentId?: string;
    employeeId?: string;
    designation?: string;
    accessLevel: string;
  }[];
  instructions: string;
}
