"use client";

import React, { useMemo, useState } from "react";

/** ---------- Types ---------- */
type Day = "Mon" | "Tue" | "Wed" | "Thu" | "Fri" | "Sat" | "Sun";

export type VisitingSlot = {
  id: string;
  days: Day[];          // e.g., ["Mon","Wed","Fri"]
  start: string;        // "HH:MM" 24h
  end: string;          // "HH:MM" 24h
  label?: string;       // "OPD", "Tele", "Evening", etc.
  location?: string;    // "Main Clinic", "Branch A", "Room 3"
};

export type VisitingHoursProps = {
  value?: VisitingSlot[];
  onChange?: (next: VisitingSlot[]) => void;
};

/** ---------- Utils ---------- */
const DAYS: Day[] = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

function uid() {
  return Math.random().toString(36).slice(2, 8) + "-" + Date.now().toString(36).slice(-4);
}

function toMinutes(hhmm: string) {
  const [h, m] = hhmm.split(":").map(Number);
  return h * 60 + m;
}
function overlaps(a: VisitingSlot, b: VisitingSlot) {
  // Check if they share at least one day AND time range overlaps
  if (!a.days.some((d) => b.days.includes(d))) return false;
  const aS = toMinutes(a.start), aE = toMinutes(a.end);
  const bS = toMinutes(b.start), bE = toMinutes(b.end);
  return Math.max(aS, bS) < Math.min(aE, bE);
}
function fmtRange(s: string, e: string) {
  // readable 12h (without forcing input to 12h)
  const fmt = (t: string) => {
    const [H, M] = t.split(":").map(Number);
    const ampm = H >= 12 ? "PM" : "AM";
    const h = ((H + 11) % 12) + 1;
    return `${h}:${String(M).padStart(2, "0")} ${ampm}`;
  };
  return `${fmt(s)} – ${fmt(e)}`;
}

/** ---------- Component ---------- */
export default function VisitingHours({ value, onChange }: VisitingHoursProps) {
  const [slots, setSlots] = useState<VisitingSlot[]>(
    () =>
      value ?? [
        { id: uid(), days: ["Mon", "Wed", "Fri"], start: "09:30", end: "12:30", label: "OPD", location: "Main Clinic" },
        { id: uid(), days: ["Tue", "Thu"],       start: "17:00", end: "20:00", label: "Evening", location: "Branch A" },
      ]
  );
  const [editing, setEditing] = useState<VisitingSlot | null>(null);

  // form state for "quick add"
  const [selDays, setSelDays] = useState<Day[]>(["Mon"]);
  const [start, setStart] = useState("10:00");
  const [end, setEnd] = useState("12:00");
  const [label, setLabel] = useState("");
  const [location, setLocation] = useState("");

  const overlapsMap = useMemo(() => {
    const map: Record<string, boolean> = {};
    for (let i = 0; i < slots.length; i++) {
      for (let j = i + 1; j < slots.length; j++) {
        if (overlaps(slots[i], slots[j])) {
          map[slots[i].id] = true;
          map[slots[j].id] = true;
        }
      }
    }
    return map;
  }, [slots]);

  function push(next: VisitingSlot[]) {
    setSlots(next);
    onChange?.(next);
  }

  function addSlot() {
    if (toMinutes(start) >= toMinutes(end)) return alert("Start time must be before end time.");
    if (selDays.length === 0) return alert("Pick at least one day.");
    const newOne: VisitingSlot = { id: uid(), days: selDays.slice(), start, end, label: label.trim() || undefined, location: location.trim() || undefined };
    push([...slots, newOne]);
    // small reset (keep days)
    setStart("10:00");
    setEnd("12:00");
    setLabel("");
    setLocation("");
  }

  function removeSlot(id: string) {
    push(slots.filter((s) => s.id !== id));
    if (editing?.id === id) setEditing(null);
  }

  function updateSlot(patch: Partial<VisitingSlot>) {
    if (!editing) return;
    const next = slots.map((s) => (s.id === editing.id ? { ...s, ...patch } : s));
    push(next);
    setEditing((e) => (e ? { ...e, ...patch } : e));
  }

  function duplicateTo(days: Day[]) {
    if (!editing) return;
    const base = slots.find((s) => s.id === editing.id);
    if (!base) return;
    const clones = days
      .filter((d) => !base.days.includes(d))
      .map<VisitingSlot>((d) => ({ ...base, id: uid(), days: [d] }));
    push([...slots, ...clones]);
  }

  function applyPreset(preset: "Morning" | "Evening" | "Full Day") {
    const ranges =
      preset === "Morning"
        ? { start: "09:00", end: "12:30", label: "Morning OPD" }
        : preset === "Evening"
        ? { start: "17:00", end: "20:00", label: "Evening OPD" }
        : { start: "09:00", end: "17:00", label: "Full Day" };
    setStart(ranges.start);
    setEnd(ranges.end);
    setLabel(ranges.label);
    setSelDays(["Mon", "Tue", "Wed", "Thu", "Fri"]);
  }

  return (
    <div className="ui-card p-4">
      {/* Header */}
      <div className="flex items-center justify-between gap-2">
        <div>
          <h3 className="text-sm font-semibold">Visiting Hours</h3>
          <p className="text-xs text-gray-600">Add weekly slots, edit inline, and copy across days.</p>
        </div>
        <div className="flex items-center gap-2">
          <PresetButton onClick={() => applyPreset("Morning")}>Morning</PresetButton>
          <PresetButton onClick={() => applyPreset("Evening")}>Evening</PresetButton>
          <PresetButton onClick={() => applyPreset("Full Day")}>Full Day</PresetButton>
        </div>
      </div>

      {/* Quick Add row */}
      <div className="mt-3 grid gap-2 sm:grid-cols-[auto_1fr_1fr_1fr_1fr_auto] items-end">
        <DayMulti
          days={selDays}
          setDays={setSelDays}
          className="sm:col-span-1"
        />

        <Labeled field="Start" className="sm:col-span-1">
          <input type="time" className="ui-input w-full" value={start} onChange={(e) => setStart(e.target.value)} />
        </Labeled>
        <Labeled field="End" className="sm:col-span-1">
          <input type="time" className="ui-input w-full" value={end} onChange={(e) => setEnd(e.target.value)} />
        </Labeled>
        <Labeled field="Label" className="sm:col-span-1">
          <input className="ui-input w-full" placeholder="OPD / Tele / Surgery…" value={label} onChange={(e) => setLabel(e.target.value)} />
        </Labeled>
        <Labeled field="Location" className="sm:col-span-1">
          <input className="ui-input w-full" placeholder="Main Clinic / Branch A…" value={location} onChange={(e) => setLocation(e.target.value)} />
        </Labeled>

        <button onClick={addSlot} className="px-3 py-2 rounded-lg border bg-gray-900 text-white hover:opacity-95 text-sm">+ Add</button>
      </div>

      {/* Grid */}
      <div className="mt-4 overflow-x-auto">
        <div className="min-w-[760px] grid grid-cols-7 gap-2">
          {DAYS.map((day) => (
            <div key={day} className="rounded-xl border bg-white p-2">
              <div className="text-xs font-medium text-gray-700 mb-2">{day}</div>
              <div className="flex flex-col gap-1">
                {slots
                  .filter((s) => s.days.includes(day))
                  .sort((a, b) => toMinutes(a.start) - toMinutes(b.start))
                  .map((s) => {
                    const active = editing?.id === s.id;
                    const hasOverlap = !!overlapsMap[s.id];
                    return (
                      <div
                        key={s.id}
                        className={[
                          "rounded-lg border px-2 py-1.5 text-xs transition",
                          active ? "ring-2 ring-[--tertiary] bg-[--tertiary]/10" : "bg-gray-50 hover:bg-gray-100",
                          hasOverlap ? "border-red-400" : "border-gray-200",
                        ].join(" ")}
                      >
                        {!active ? (
                          <div className="flex items-center justify-between gap-2">
                            <div className="min-w-0">
                              <div className="font-medium text-gray-900 truncate">{fmtRange(s.start, s.end)}</div>
                              <div className="text-[11px] text-gray-600 truncate">
                                {(s.label || "—") + (s.location ? ` • ${s.location}` : "")}
                              </div>
                              {hasOverlap && <div className="text-[10px] text-red-600 mt-0.5">Overlaps another slot</div>}
                            </div>
                            <div className="shrink-0 inline-flex items-center gap-1">
                              <IconBtn title="Edit" onClick={() => setEditing(s)}><PenIcon /></IconBtn>
                              <IconBtn title="Delete" onClick={() => removeSlot(s.id)}><TrashIcon /></IconBtn>
                            </div>
                          </div>
                        ) : (
                          <InlineEditor
                            slot={editing}
                            onChange={updateSlot}
                            onClose={() => setEditing(null)}
                            onDuplicate={(days) => duplicateTo(days)}
                            badOverlap={hasOverlap}
                          />
                        )}
                      </div>
                    );
                  })}
                {slots.filter((s) => s.days.includes(day)).length === 0 && (
                  <div className="text-[11px] text-gray-400 border border-dashed rounded-lg px-2 py-4 text-center">No slots</div>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

/** ---------- Subcomponents ---------- */
function Labeled(props: { field: string; children: React.ReactNode; className?: string }) {
  return (
    <div className={"grid gap-1 " + (props.className ?? "")}>
      <label className="text-[11px] text-gray-600">{props.field}</label>
      {props.children}
    </div>
  );
}

function DayMulti({ days, setDays, className = "" }: { days: Day[]; setDays: (d: Day[]) => void; className?: string }) {
  function toggle(d: Day) {
    setDays(days.includes(d) ? days.filter((x) => x !== d) : [...days, d]);
  }
  function all(checked: boolean) {
    setDays(checked ? DAYS.slice() : []);
  }
  return (
    <div className={"grid gap-1 " + className}>
      <div className="flex items-center justify-between">
        <span className="text-[11px] text-gray-600">Days</span>
        <button
          className="text-[11px] text-gray-700 hover:underline"
          type="button"
          onClick={() => all(days.length !== 7)}
        >
          {days.length === 7 ? "Clear" : "Select all"}
        </button>
      </div>
      <div className="flex flex-wrap gap-1.5">
        {DAYS.map((d) => {
          const active = days.includes(d);
          return (
            <button
              key={d}
              type="button"
              onClick={() => toggle(d)}
              className={[
                "px-2 py-1 rounded-full border text-xs",
                active ? "bg-[--secondary] text-[--on-secondary] border-[--secondary]" : "bg-white hover:bg-gray-50",
              ].join(" ")}
            >
              {d}
            </button>
          );
        })}
      </div>
    </div>
  );
}

function InlineEditor({
  slot,
  onChange,
  onClose,
  onDuplicate,
  badOverlap,
}: {
  slot: VisitingSlot;
  onChange: (patch: Partial<VisitingSlot>) => void;
  onClose: () => void;
  onDuplicate: (days: Day[]) => void;
  badOverlap: boolean;
}) {
  const [days, setDays] = useState<Day[]>(slot.days);
  const [start, setStart] = useState(slot.start);
  const [end, setEnd] = useState(slot.end);
  const [label, setLabel] = useState(slot.label || "");
  const [location, setLocation] = useState(slot.location || "");
  const [copyDays, setCopyDays] = useState<Day[]>([]);

  function save() {
    if (toMinutes(start) >= toMinutes(end)) return alert("Start time must be before end time.");
    if (days.length === 0) return alert("Pick at least one day.");
    onChange({ days, start, end, label: label.trim() || undefined, location: location.trim() || undefined });
    onClose();
  }

  return (
    <div className="grid gap-2">
      <div className="grid sm:grid-cols-2 gap-2">
        <Labeled field="Days">
          <DayMulti days={days} setDays={setDays} />
        </Labeled>
        <div className="grid grid-cols-2 gap-2">
          <Labeled field="Start">
            <input type="time" className="ui-input w-full" value={start} onChange={(e) => setStart(e.target.value)} />
          </Labeled>
          <Labeled field="End">
            <input type="time" className="ui-input w-full" value={end} onChange={(e) => setEnd(e.target.value)} />
          </Labeled>
          <Labeled field="Label" >
            <input className="ui-input w-full" value={label} onChange={(e) => setLabel(e.target.value)} placeholder="OPD / Tele / Surgery…" />
          </Labeled>
          <Labeled field="Location" >
            <input className="ui-input w-full" value={location} onChange={(e) => setLocation(e.target.value)} placeholder="Main Clinic / Room 3…" />
          </Labeled>
        </div>
      </div>

      {badOverlap && (
        <div className="text-[11px] text-red-600 -mt-1">This slot currently overlaps another one on a chosen day.</div>
      )}

      <div className="flex items-center justify-between gap-2 pt-1">
        <div className="flex items-center gap-2">
          <span className="text-[11px] text-gray-600">Duplicate to:</span>
          <div className="flex flex-wrap gap-1.5">
            {DAYS.map((d) => {
              const active = copyDays.includes(d);
              return (
                <button
                  key={d}
                  type="button"
                  onClick={() => {
                    const next = active ? copyDays.filter((x) => x !== d) : [...copyDays, d];
                    setCopyDays(next);
                  }}
                  className={[
                    "px-2 py-0.5 rounded-full border text-[11px]",
                    active ? "bg-[--tertiary] text-[--on-tertiary] border-[--tertiary]" : "bg-white hover:bg-gray-50",
                  ].join(" ")}
                  title="Select days to duplicate this slot"
                >
                  {d}
                </button>
              );
            })}
          </div>
          <button
            type="button"
            onClick={() => {
              if (copyDays.length === 0) return;
              onDuplicate(copyDays);
              setCopyDays([]);
              onClose();
            }}
            className="text-xs px-2 py-1 rounded-lg border hover:bg-gray-50"
          >
            Apply
          </button>
        </div>

        <div className="flex items-center gap-2">
          <button className="text-xs px-2 py-1 rounded-lg border hover:bg-gray-50" onClick={onClose}>Cancel</button>
          <button className="text-xs px-3 py-1.5 rounded-lg border bg-gray-900 text-white hover:opacity-95" onClick={save}>Save</button>
        </div>
      </div>
    </div>
  );
}

/** ---------- Tiny UI bits ---------- */
function IconBtn({ children, onClick, title }: { children: React.ReactNode; onClick: () => void; title: string }) {
  return (
    <button
      type="button"
      onClick={onClick}
      title={title}
      className="inline-flex items-center justify-center w-7 h-7 rounded-md border hover:bg-gray-50"
      aria-label={title}
    >
      {children}
    </button>
  );
}

function PenIcon() {
  return (
    <svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" strokeWidth="1.6">
      <path d="M3 21l3-.5 11-11a2 2 0 0 0-3-3L3 17v4Z" />
      <path d="M15 6l3 3" />
    </svg>
  );
}
function TrashIcon() {
  return (
    <svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" strokeWidth="1.6">
      <path d="M3 6h18M8 6V4h8v2M6 6l1 14h10l1-14" />
    </svg>
  );
}

function PresetButton({ onClick, children }: { onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="text-xs px-2.5 py-1.5 rounded-full border hover:bg-gray-50"
    >
      {children}
    </button>
  );
}
