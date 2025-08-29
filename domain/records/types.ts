// domain/records/types.ts
export type RecordType =
  | "Prescription"
  | "Vitals"
  | "Immunization"
  | "Lab"
  | "DischargeSummary";

export type CanonicalVitals = {
  temperature?: string;
  bp?: string;
  bpSys?: string;
  bpDia?: string;
  spo2?: string;
  weight?: string;
  height?: string;
  bmi?: string;
  lmpDate?: string;
  bodyMeasurement?: { waist?: string; hip?: string; neck?: string; chest?: string };
  womensHealth?: {
    lmpDate?: string; cycleLengthDays?: string; cycleRegularity?: string;
    gravidity?: string; parity?: string; abortions?: string;
  };
  lifestyle?: {
    smokingStatus?: "Never" | "Former" | "Current";
    alcoholIntake?: "None" | "Occasional" | "Moderate" | "Heavy";
    dietType?: "Mixed" | "Vegetarian" | "Vegan" | "Keto" | "Other";
    sleepHours?: string; stressLevel?: "Low" | "Moderate" | "High";
  };
  physicalActivity?: {
    logs?: { activity?: string; durationMin?: string; intensity?: "Low" | "Moderate" | "High"; frequencyPerWeek?: string }[];
  };
  GeneralAssessment?: {
    painScore?: string;
    temperatureSite?: "Oral" | "Axillary" | "Tympanic" | "Rectal" | "Temporal";
    posture?: "Normal" | "Stooped" | "Bedridden";
    edema?: "None" | "Mild" | "Moderate" | "Severe";
    pallor?: "Absent" | "Mild" | "Moderate" | "Severe";
  };
  vitalsNotes?: string;
  vitalsUploads?: { name: string; size?: number }[];
};

export type CanonicalClinical = {
  chiefComplaints?: string;
  pastHistory?: string;
  familyHistory?: string;
  allergy?: string;
  currentMedications?: { medicine?: string; dosage?: string; since?: string }[];
  familyHistoryRows?: { relation?: string; ailment?: string }[];
  proceduresDone?: { name?: string; date?: string }[];
  investigationsDone?: { name?: string; date?: string }[];
};

export type CanonicalRxRow = {
  medicine: string; frequency: string; duration: string; dosage: string; instruction: string;
};

export type CanonicalPlan = {
  investigations?: string;
  investigationInstructions?: string;
  advice?: string;
  doctorNote?: string;
  followUpInstructions?: string;
  followUpDate?: string; // dd-mm-yyyy
  investigationNote?: string;
  patientNote?: string;
  attachments?: { files?: File[]; note?: string };
};

export type DigitalRxFormState = {
  vitals: CanonicalVitals;
  clinical: CanonicalClinical;
  prescription: CanonicalRxRow[];
  plan: CanonicalPlan;
};

export type CanonicalRecord = {
  id: string;
  patientId: string;
  dateISO: string; // dd-mm-yyyy
  type: RecordType;
  source: "digital-rx";
  canonical: DigitalRxFormState;
  meta?: {
    hospital?: string;
    doctor?: { name: string; regNo?: string; specialty?: string };
    labPanel?: Record<string, string>;
    immunization?: { vaccine?: string; lot?: string; site?: string; nextDose?: string };
    discharge?: { diagnosis?: string; course?: string };
  };
};

export type PreviewRecord = {
  id: string;
  type: RecordType;
  dateISO: string; // dd-mm-yyyy
  hospital?: string;
  doctor?: { name?: string; regNo?: string; specialty?: string };
  data: Record<string, any>;
};
