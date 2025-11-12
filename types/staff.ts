export type Staff = {
  id: string;
  name: string;
  role: ("Doctor" | "Nurse" | "Branch Admin" | "Clinic Admin")[];
  department?: string;
  departments?: string[];
  branch: string;
  email: string;
  phone: string;
  consultationFee?: number;
  status: "active" | "inactive" | "waiting for validation";
};