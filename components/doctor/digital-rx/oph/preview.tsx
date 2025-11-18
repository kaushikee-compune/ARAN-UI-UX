import React from "react";
import type { OphCanonical } from "./canonical";

export default function OphPreview({ payload }: { payload: OphCanonical }) {
  if (!payload) return null;

  const eye = payload.eyeComplaintRows ?? [];
  const inv = payload.ophInvestigationRows ?? [];

  return (
    <div className="space-y-4">
      {/* Eye Complaints Section */}
      {eye.length > 0 && (
        <section className="ui-card p-3">
          <h3 className="text-sm font-semibold mb-2">Eye Complaints</h3>
          <ul className="list-disc pl-4 text-sm">
            {eye.map((c, i) => (
              <li key={i}>
                {c.symptom}
                {c.duration ? ` — ${c.duration}` : ""}
                {c.severity ? ` (${c.severity})` : ""}
              </li>
            ))}
          </ul>
        </section>
      )}

      {/* Oph Investigations */}
      {inv.length > 0 && (
        <section className="ui-card p-3">
          <h3 className="text-sm font-semibold mb-2">Ophthalmology Investigations</h3>
          <ul className="text-sm space-y-1">
            {inv.map((r, i) => (
              <li key={i}>
                <strong>{r.test}</strong>
                {r.notes ? ` — ${r.notes}` : ""}
                {r.status ? ` (${r.status})` : ""}
              </li>
            ))}
          </ul>
        </section>
      )}
    </div>
  );
}
