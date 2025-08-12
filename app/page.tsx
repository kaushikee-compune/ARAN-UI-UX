// app/page.tsx
"use client";

import React, { useMemo, useState } from "react";
import AppShell from "../components/app-shell";

/** Fake data for now */
const BRANCHES = [
  { id: "main", name: "Main Clinic", address: "12 MG Road", city: "Bengaluru", doctors: 12, depts: 6 },
  { id: "city", name: "City Center", address: "44 Residency Rd", city: "Bengaluru", doctors: 8, depts: 4 },
  { id: "east", name: "East Wing", address: "88 Indiranagar", city: "Bengaluru", doctors: 5, depts: 3 },
];

const DEPT_AVAIL = [
  { dept: "General Medicine", available: 3, total: 4 },
  { dept: "Pediatrics",       available: 2, total: 3 },
  { dept: "Dermatology",      available: 1, total: 2 },
  { dept: "Orthopedics",      available: 2, total: 2 },
];

export default function Page() {
  const [branch, setBranch] = useState(BRANCHES[0].id);

  // Today’s appointments (stub)
  const todays = { totalSlots: 40, booked: 26 };
  const freeSlots = useMemo(() => todays.totalSlots - todays.booked, [todays]);

  // OPD queue (stub)
  const queue = { waiting: 12, inConsult: 5, completed: 20 };

  const currentBranch = useMemo(() => BRANCHES.find(b => b.id === branch)!, [branch]);

  return (
    <AppShell>
      {/* Row 1 — Today’s Appointments + Doctors by Dept */}
      <section className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-4">
        {/* Today’s Appointments */}
        <div className="ui-card p-4 lg:col-span-1">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-semibold">Today’s Appointments</h2>
            <button className="btn-outline text-xs">Manage</button>
          </div>

          <div className="mt-3 grid grid-cols-2 gap-3">
            <div className="rounded-lg p-3 bg-[--surface-2]">
              <div className="text-xs text-gray-600">Booked</div>
              <div className="text-2xl font-semibold">{todays.booked}</div>
            </div>
            <div className="rounded-lg p-3 bg-[--surface-2]">
              <div className="text-xs text-gray-600">Free Slots</div>
              <div className="text-2xl font-semibold">{freeSlots}</div>
            </div>
          </div>

          {/* Progress */}
          <div className="mt-4">
            <div className="flex items-center justify-between text-xs text-gray-600">
              <span>Utilization</span>
              <span>{Math.round((todays.booked / todays.totalSlots) * 100)}%</span>
            </div>
            <div className="mt-2 h-2 rounded-full bg-gray-200 overflow-hidden">
              <div
                className="h-full bg-[--tertiary]"
                style={{ width: `${(todays.booked / todays.totalSlots) * 100}%` }}
              />
            </div>
          </div>
        </div>

        {/* Doctors Available by Department */}
        <div className="ui-card p-4 lg:col-span-2">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-semibold">Doctors Available • Departments</h2>
            <button className="btn-outline text-xs">View schedules</button>
          </div>

          <ul className="mt-3 grid grid-cols-1 md:grid-cols-2 gap-3">
            {DEPT_AVAIL.map((d) => (
              <li key={d.dept} className="rounded-lg p-3 bg-[--surface-2]">
                <div className="flex items-center justify-between">
                  <div className="text-sm font-medium">{d.dept}</div>
                  <div className="text-sm">
                    <span className="font-semibold">{d.available}</span>
                    <span className="text-gray-600"> / {d.total}</span>
                  </div>
                </div>
                <div className="mt-2 h-1.5 rounded-full bg-gray-200 overflow-hidden">
                  <div
                    className="h-full bg-[--secondary]"
                    style={{ width: `${(d.available / d.total) * 100}%` }}
                  />
                </div>
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* Row 2 — OPD Queue + Branch details */}
      <section className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* OPD Queue */}
        <div className="ui-card p-4 lg:col-span-1">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-semibold">OPD Queue</h2>
            <button className="btn-outline text-xs">Open queue</button>
          </div>
          <div className="mt-3 grid grid-cols-3 gap-3">
            <div className="rounded-lg p-3 bg-[--surface-2] text-center">
              <div className="text-xs text-gray-600">Waiting</div>
              <div className="text-xl font-semibold">{queue.waiting}</div>
            </div>
            <div className="rounded-lg p-3 bg-[--surface-2] text-center">
              <div className="text-xs text-gray-600">In Consult</div>
              <div className="text-xl font-semibold">{queue.inConsult}</div>
            </div>
            <div className="rounded-lg p-3 bg-[--surface-2] text-center">
              <div className="text-xs text-gray-600">Completed</div>
              <div className="text-xl font-semibold">{queue.completed}</div>
            </div>
          </div>

          <div className="mt-4">
            <div className="text-xs text-gray-600">Queue Position (example)</div>
            <div className="mt-2 h-2 rounded-full bg-gray-200 overflow-hidden">
              <div className="h-full bg-[--tertiary]" style={{ width: `${(queue.waiting / (queue.waiting + queue.inConsult + queue.completed)) * 100}%` }} />
            </div>
          </div>
        </div>

        {/* Branch details & switcher */}
        <div className="ui-card p-4 lg:col-span-2">
          <div className="flex items-center justify-between gap-3">
            <h2 className="text-base font-semibold">Branch Details</h2>
            <div className="flex items-center gap-2">
              <label className="text-xs text-gray-600">Switch branch</label>
              <select
                className="ui-input py-1"
                value={branch}
                onChange={(e) => setBranch(e.target.value)}
              >
                {BRANCHES.map((b) => (
                  <option key={b.id} value={b.id}>{b.name}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="mt-3 grid grid-cols-1 md:grid-cols-3 gap-3">
            <div className="rounded-lg p-3 bg-[--surface-2]">
              <div className="text-xs text-gray-600">Name</div>
              <div className="text-sm font-medium">{currentBranch.name}</div>
            </div>
            <div className="rounded-lg p-3 bg-[--surface-2]">
              <div className="text-xs text-gray-600">Address</div>
              <div className="text-sm font-medium">{currentBranch.address}</div>
            </div>
            <div className="rounded-lg p-3 bg-[--surface-2]">
              <div className="text-xs text-gray-600">City</div>
              <div className="text-sm font-medium">{currentBranch.city}</div>
            </div>
            <div className="rounded-lg p-3 bg-[--surface-2]">
              <div className="text-xs text-gray-600">Doctors</div>
              <div className="text-sm font-medium">{currentBranch.doctors}</div>
            </div>
            <div className="rounded-lg p-3 bg-[--surface-2]">
              <div className="text-xs text-gray-600">Departments</div>
              <div className="text-sm font-medium">{currentBranch.depts}</div>
            </div>
            <div className="rounded-lg p-3 bg-[--surface-2]">
              <div className="text-xs text-gray-600">Actions</div>
              <div className="mt-1 flex items-center gap-2">
                <button className="btn-primary text-xs">Open Branch</button>
                <button className="btn-outline text-xs">Edit</button>
              </div>
            </div>
          </div>
        </div>
      </section>
    </AppShell>
  );
}
