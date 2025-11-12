// components/admin/scheduler/types.ts
export type DayName =
  | "Mon" | "Tue" | "Wed" | "Thu" | "Fri" | "Sat" | "Sun";

export interface TimeSlot {
  start: string; // "08:00"
  end: string;   // "14:00"
}

export interface DayAvailability {
  day: DayName;
  session1: TimeSlot[];
  session2: TimeSlot[];
}
export interface DoctorSchedule {
  doctorId: string;
  branchId: string;
  slotDuration: number; // 15 | 30 | 45 (minutes)
  availability: DayAvailability[];
}

export interface OffDay {
  doctorId: string;
  branchId: string;
  fromDate: string; // ISO date
  toDate: string;   // ISO date
  reason?: string;
}

export interface DoctorInfo {
  id: string;
  name: string;
  designation?: string;
  branchId?: string;       // current field
  branches?: string[];     // future support
  status?: string;
}
