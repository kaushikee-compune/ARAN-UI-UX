// // app/page.tsx   We DONOT USE THIS PAGE NOW - AS currently we are redirecting to login ROLE BASED LANDING PAges.
// "use client";

// // import React, { useMemo, useState } from "react";
// // import AppShell from "../components/app-shell";
// import Link from "next/link";
// import React, { useState } from "react";
// import Shell from "../components/app-shell"; // alias instead of AppShell

// /** Fake data for now */
// const BRANCHES = [
//   { id: "main", name: "Main Clinic", address: "12 MG Road", city: "Bengaluru", doctors: 12, depts: 6 },
//   { id: "city", name: "City Center", address: "44 Residency Rd", city: "Bengaluru", doctors: 8, depts: 4 },
//   { id: "east", name: "East Wing", address: "88 Indiranagar", city: "Bengaluru", doctors: 5, depts: 3 },
// ];

// const DEPT_AVAIL = [
//   { dept: "General Medicine", available: 3, total: 4 },
//   { dept: "Pediatrics",       available: 2, total: 3 },
//   { dept: "Dermatology",      available: 1, total: 2 },
//   { dept: "Orthopedics",      available: 2, total: 2 },
// ];

// export default function Page() {
//   // ---- same dashboard content you wanted (three cards) ----
//   const clinic = { name: "ARAN Care Clinic", code: "ARAN-001", branches: 3, departments: 6, doctors: 25, staff: 42 };
//   const people = { doctors: 25, staff: 42, schedulesToday: 18, onboardingPending: 3, roles: 5 };
//   const appt = { totalSlots: 40, booked: 26 };
//   const utilization = Math.round((appt.booked / appt.totalSlots) * 100);
//   const adminStats = [
//     { label: "Appointments Today", value: appt.booked, hint: `${appt.totalSlots - appt.booked} free` },
//     { label: "OPD Queue Waiting", value: 12, hint: "live" },
//     { label: "Pending Invoices", value: 7, hint: "billing" },
//     { label: "ABHA Verifications", value: 4, hint: "pending" },
//     { label: "Consents Pending", value: 2, hint: "ABHA" },
//   ];
//   const [branch, setBranch] = useState("Main Clinic");
//   const branches = ["Main Clinic", "City Center", "East Wing"];

//   return (
//     <Shell>
//       <div className="grid grid-cols-1 xl:grid-cols-3 gap-4">
//         {/* Clinic Details */}
//         <section className="ui-card p-4 xl:col-span-1">
//           <header className="flex items-center justify-between">
//             <h2 className="text-base font-semibold">Clinic Details</h2>
//             <Link href="/clinic-setup" className="btn-outline text-xs">Open Setup</Link>
//           </header>

//           <div className="mt-3 flex items-center gap-3">
//             <div className="w-10 h-10 rounded-xl flex items-center justify-center text-[--on-secondary]" style={{ background: "var(--secondary)" }}>
//               <svg viewBox="0 0 24 24" className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={1.7}>
//                 <path d="M4 10l8-6 8 6v9a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2v-9z" />
//                 <path d="M9 21v-6h6v6" />
//               </svg>
//             </div>
//             <div>
//               <div className="text-sm font-medium">{clinic.name}</div>
//               <div className="text-xs text-gray-600">Code: {clinic.code}</div>
//             </div>
//           </div>

//           <div className="mt-4 grid grid-cols-3 gap-2">
//             <MiniStat label="Branches" value={clinic.branches} />
//             <MiniStat label="Departments" value={clinic.departments} />
//             <MiniStat label="Doctors" value={clinic.doctors} />
//           </div>

//           <div className="mt-4 flex items-center justify-between gap-2">
//             <Link href="/clinic-setup/branches/new" className="btn-primary text-xs">Add Branch</Link>
//             <Link href="/clinic-setup/departments" className="btn-outline text-xs">Manage Departments</Link>
//           </div>

//           <div className="mt-4">
//             <div className="text-xs text-gray-600 mb-1">Current Branch</div>
//             <select className="ui-input py-1" value={branch} onChange={(e) => setBranch(e.target.value)}>
//               {branches.map((b) => <option key={b} value={b}>{b}</option>)}
//             </select>
//           </div>
//         </section>

//         {/* People Management */}
//         <section className="ui-card p-4 xl:col-span-1">
//           <header className="flex items-center justify-between">
//             <h2 className="text-base font-semibold">People Management</h2>
//             <Link href="/people" className="btn-outline text-xs">Open People</Link>
//           </header>

//         <div className="mt-3 flex items-center gap-3">
//             <div className="w-10 h-10 rounded-xl flex items-center justify-center text-[--on-secondary]" style={{ background: "var(--secondary)" }}>
//               <svg viewBox="0 0 24 24" className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={1.7}>
//                 <circle cx="8" cy="8" r="3" /><path d="M2.5 18.5a5.5 5.5 0 0 1 11 0" />
//                 <circle cx="17" cy="7" r="2.2" />
//               </svg>
//             </div>
//             <div>
//               <div className="text-sm font-medium">Teams & Schedules</div>
//               <div className="text-xs text-gray-600">Roles: {people.roles} • Schedules Today: {people.schedulesToday}</div>
//             </div>
//           </div>

//           <div className="mt-4 grid grid-cols-4 gap-2">
//             <MiniStat label="Doctors" value={people.doctors} />
//             <MiniStat label="Staff" value={people.staff} />
//             <MiniStat label="Schedules" value={people.schedulesToday} />
//             <MiniStat label="Onboarding" value={people.onboardingPending} />
//           </div>

//           <div className="mt-4 flex items-center justify-between gap-2">
//             <Link href="/people/staff/new" className="btn-primary text-xs">Add Staff</Link>
//             <Link href="/people/roles" className="btn-outline text-xs">Manage Roles</Link>
//           </div>
//         </section>

//         {/* Admin Stats */}
//         <section className="ui-card p-4 xl:col-span-1">
//           <header className="flex items-center justify-between">
//             <h2 className="text-base font-semibold">Admin Stats</h2>
//             <Link href="/reports-analytics" className="btn-outline text-xs">Reports</Link>
//           </header>

//           <div className="mt-3 grid grid-cols-2 gap-2">
//             {[
//               { label: "Appointments Today", value: appt.booked, hint: `${appt.totalSlots - appt.booked} free` },
//               { label: "OPD Queue Waiting", value: 12, hint: "live" },
//               { label: "Pending Invoices", value: 7, hint: "billing" },
//               { label: "ABHA Verifications", value: 4, hint: "pending" },
//               { label: "Consents Pending", value: 2, hint: "ABHA" },
//             ].map((s) => (
//               <div key={s.label} className="rounded-lg p-3 bg-[--surface-2]">
//                 <div className="text-xs text-gray-600">{s.label}</div>
//                 <div className="text-xl font-semibold">{s.value}</div>
//                 {s.hint && <div className="text-[11px] text-gray-500 mt-0.5">{s.hint}</div>}
//               </div>
//             ))}
//           </div>

//           <div className="mt-4">
//             <div className="flex items-center justify-between text-xs text-gray-600">
//               <span>Appointment Utilization</span>
//               <span>{utilization}%</span>
//             </div>
//             <div className="mt-2 h-2 rounded-full bg-gray-200 overflow-hidden">
//               <div className="h-full bg-[--tertiary]" style={{ width: `${utilization}%` }} />
//             </div>
//           </div>

//           <div className="mt-4 flex items-center justify-between gap-2">
//             <Link href="/billing/invoices" className="btn-primary text-xs">Review Invoices</Link>
//             <Link href="/abha/verify" className="btn-outline text-xs">Verify ABHA</Link>
//           </div>
//         </section>
//       </div>
//     </Shell>
//   );
// }

// function MiniStat({ label, value }: { label: string; value: number | string }) {
//   return (
//     <div className="rounded-lg p-3 bg-[--surface-2]">
//       <div className="text-xs text-gray-600">{label}</div>
//       <div className="text-sm font-semibold">{value}</div>
//     </div>
//   );
// }