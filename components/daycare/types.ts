// components/daycare/types.ts
export type BedStatus = "vacant" | "occupied" | "discharged";

export interface DaycarePatient {
  id: string;
  name: string;
  age: string;
  gender: string;
  doctor?: string;
  diagnosis?: string;
  admittedAt: string;
}

export interface Bed {
  bedId: string;
  label: string;
  status: BedStatus;
  patient?: DaycarePatient;
}
