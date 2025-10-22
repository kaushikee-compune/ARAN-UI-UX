// types/lab.ts
export type LabStatus = "Requested" | "ReportUploaded" | "Reviewed";

export interface LabTest {
  name: string;
  remarks?: string;
}

export interface LabReportFile {
  name: string;
  url: string;
  type: "pdf" | "image";
}

export interface LabRequest {
  id: string;
  patientName: string;
  doctorName: string;
  requestedDate: string; // ISO
  tests: LabTest[];
  status: LabStatus;
  remarks?: string;
  reports?: LabReportFile[];
}
