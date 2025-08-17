// components/icons/icon-badge.tsx
import * as React from "react";
import { RecordKindKey, RecordTypeIcon } from "./health";

type Tone =
  | "emerald"
  | "sky"
  | "amber"
  | "rose"
  | "violet"
  | "slate"
  | "indigo";

const toneStyles: Record<Tone, { bg: string; fg: string; ring: string }> = {
  emerald: { bg: "bg-emerald-50", fg: "text-emerald-700", ring: "ring-emerald-200" },
  sky:     { bg: "bg-sky-50",     fg: "text-sky-700",     ring: "ring-sky-200" },
  amber:   { bg: "bg-amber-50",   fg: "text-amber-700",   ring: "ring-amber-200" },
  rose:    { bg: "bg-rose-50",    fg: "text-rose-700",    ring: "ring-rose-200" },
  violet:  { bg: "bg-violet-50",  fg: "text-violet-700",  ring: "ring-violet-200" },
  slate:   { bg: "bg-slate-50",   fg: "text-slate-700",   ring: "ring-slate-200" },
  indigo:  { bg: "bg-indigo-50",  fg: "text-indigo-700",  ring: "ring-indigo-200" },
};

export function IconBadge({
  kind,
  tone = "slate",
  label,
  className,
  iconClassName = "w-4 h-4",
}: {
  kind: RecordKindKey;
  tone?: Tone;
  label?: string;
  className?: string;
  iconClassName?: string;
}) {
  const t = toneStyles[tone];
  return (
    <span
      className={[
        "inline-flex items-center gap-1.5 px-2 py-1 rounded-full text-xs ring-1",
        t.bg,
        t.fg,
        t.ring,
        className ?? "",
      ].join(" ")}
    >
      <RecordTypeIcon kind={kind} className={iconClassName} />
      {label ? <span className="font-medium">{label}</span> : null}
    </span>
  );
}
