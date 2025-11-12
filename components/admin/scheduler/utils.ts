// components/admin/scheduler/utils.ts
import type { DayAvailability, TimeSlot } from "./types";

/** Merge overlapping or adjacent slots */
export function mergeSlots(slots: TimeSlot[]): TimeSlot[] {
  const sorted = [...slots].sort((a, b) => a.start.localeCompare(b.start));
  const result: TimeSlot[] = [];
  for (const slot of sorted) {
    const last = result[result.length - 1];
    if (!last || slot.start > last.end) result.push(slot);
    else if (slot.end > last.end) last.end = slot.end;
  }
  return result;
}

/** Convert minutes to HH:mm */
export function minsToTime(m: number): string {
  const h = Math.floor(m / 60)
    .toString()
    .padStart(2, "0");
  const min = (m % 60).toString().padStart(2, "0");
  return `${h}:${min}`;
}

/** Generate time blocks for a given range & duration */
export function generateSlots(
  start: string,
  end: string,
  duration: number
): TimeSlot[] {
  const slots: TimeSlot[] = [];
  let [h, m] = start.split(":").map(Number);
  const [eh, em] = end.split(":").map(Number);
  while (h * 60 + m < eh * 60 + em) {
    const s = minsToTime(h * 60 + m);
    const next = h * 60 + m + duration;
    slots.push({ start: s, end: minsToTime(next) });
    h = Math.floor(next / 60);
    m = next % 60;
  }
  return slots;
}

/** Format [{start,end},...] → "8.00 am – 2.00 pm" */
export function formatTimeRange(slots: { start: string; end: string }[]): string {
  if (!slots || slots.length === 0) return "—";

  const first = slots[0].start;
  const last = slots[slots.length - 1].end;

  const fmt = (t: string) => {
    const [h, m] = t.split(":").map(Number);
    const hour12 = ((h + 11) % 12) + 1;
    const ampm = h < 12 ? "am" : "pm";
    const mins = m.toString().padStart(2, "0");
    return `${hour12}.${mins}${ampm}`;
  };

  return `${fmt(first)} – ${fmt(last)}`;
}

