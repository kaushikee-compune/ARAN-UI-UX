import { NextResponse } from "next/server";

/**
 * Mock API endpoint for Doctor Dashboard
 * URL: /api/doctor/dashboard
 *
 * Later you can replace this with DB queries or service calls.
 */

export async function GET() {
  // Simulated mock data — can be replaced with database calls later
  const data = {
    summary: {
      appointmentsToday: 14,
      queueCount: 5,
      consultationsDone: 9,
      paymentsTotal: 7800,
    },

    queue: [
      {
        patientId: "pat_001",
        patientName: "Ravi Kumar",
        visitType: "Follow-up",
        time: "10:15 AM",
        status: "Waiting",
      },
      {
        patientId: "pat_002",
        patientName: "Sita Devi",
        visitType: "New",
        time: "10:30 AM",
        status: "Waiting",
      },
      {
        patientId: "pat_003",
        patientName: "Ramesh Gupta",
        visitType: "Follow-up",
        time: "10:45 AM",
        status: "In Consultation",
      },
      {
        patientId: "pat_004",
        patientName: "Anjali Sharma",
        visitType: "New",
        time: "11:00 AM",
        status: "Waiting",
      },
    ],

    recent: [
      {
        id: "rec_101",
        patientName: "Rajesh Mehta",
        date: "Oct 22, 2025",
        summary: "Fever, cold — Rx: Paracetamol 500mg",
      },
      {
        id: "rec_102",
        patientName: "Pooja Nair",
        date: "Oct 21, 2025",
        summary: "BP check — Stable",
      },
      {
        id: "rec_103",
        patientName: "Amit Shah",
        date: "Oct 20, 2025",
        summary: "Diabetes follow-up — Sugar controlled",
      },
    ],

    notifications: [
      {
        id: "n1",
        type: "followup",
        message: "3 follow-ups due today",
      },
      {
        id: "n2",
        type: "lab",
        message: "Lab result ready for Mr. Ramesh",
      },
      {
        id: "n3",
        type: "prescription",
        message: "Prescription renewal pending for Mrs. Sita",
      },
    ],

    weekly: [
      { day: "Mon", patients: 5 },
      { day: "Tue", patients: 9 },
      { day: "Wed", patients: 12 },
      { day: "Thu", patients: 8 },
      { day: "Fri", patients: 14 },
      { day: "Sat", patients: 11 },
      { day: "Sun", patients: 7 },
    ],
  };

  // Artificial latency for realism (simulate DB or network)
  await new Promise((r) => setTimeout(r, 500));

  return NextResponse.json(data);
}
