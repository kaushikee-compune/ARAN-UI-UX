import staffData from "@/public/data/staff.json";
import departments from "@/public/data/departments.json";

export function getDoctorPrimaryDepartment(userId: string) {
  const doctor = (staffData as any[]).find((s) => s.id === userId);
  if (!doctor) return null;

  const deptIds: string[] = doctor.departments ?? [];

  if (deptIds.length === 0) return null;

  // Primary department = first
  const primaryDept = deptIds[0];

  // Lookup plugin mapping
  const dept = (departments as any[]).find((d) => d.id === primaryDept);
  if (!dept) return null;

  return {
    departmentId: primaryDept,
    rxPlugin: dept.rxPlugin || null
  };
}
