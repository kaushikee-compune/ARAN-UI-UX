"use client";

import {
  FileText,
  Calendar,
  CreditCard,
  Upload,
  AlertTriangle,
  X,
} from "lucide-react";

type Role = "doctor" | "staff";

type FloatingActionMenuProps = {
  role: Role;
  uhid: string;
  onClose: () => void;
  onAction: (action: string) => void;
};

export default function FloatingActionMenu({
  role,
  uhid,
  onClose,
  onAction,
}: FloatingActionMenuProps) {
  const doctorActions = [
    { label: "Rx", icon: <FileText className="w-8 h-8 text-pink-700" />, action: "rx" },
    { label: "Payment", icon: <CreditCard className="w-8 h-8 text-green-700" />, action: "payment" },
    { label: "Upload Record", icon: <Upload className="w-8 h-8 text-orange-700" />, action: "upload" },
    { label: "Appointment", icon: <Calendar className="w-8 h-8 text-blue-700" />, action: "appointment" },
  ];

  const staffActions = [
    { label: "Payment", icon: <CreditCard className="w-8 h-8 text-green-700" />, action: "payment" },
    { label: "Upload Record", icon: <Upload className="w-8 h-8 text-orange-700" />, action: "upload" },
    { label: "Appointment", icon: <Calendar className="w-8 h-8 text-blue-700" />, action: "appointment" },
    { label: "Emergency Care", icon: <AlertTriangle className="w-8 h-8 text-red-700" />, action: "emergency" },
  ];

  const actions = role === "doctor" ? doctorActions : staffActions;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30">
      <div className="relative bg-white shadow-lg drop-shadow-2xl rounded-xl w-[800px] h-[400px] p-6 flex flex-col">
        {/* ❌ Close icon (top-right) */}
        <button
          onClick={onClose}
          className="absolute top-3 right-3 text-gray-500 hover:text-gray-700"
          aria-label="Close"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Message */}
        <div className="text-center mb-6">
          <h2 className="text-lg font-semibold text-gray-800">
            Patient has been registered with UHID:{" "}
            <span className="text-[#02066b]">{uhid}</span>
          </h2>
          <p className="text-gray-600 text-sm">
            Please proceed with the following actions:
          </p>
        </div>

        {/* Action buttons grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6 flex-1 place-items-center">
          {actions.map((a) => (
            <button
              key={a.label}
              onClick={() => onAction(a.action)}
              className="flex flex-col items-center justify-center w-32 h-32 rounded-lg bg-gray-100 drop-shadow-2xl shadow-lg hover:bg-gray-50 transition"
            >
              <div className="text-[#02066b]">{a.icon}</div>
              <span className="mt-2 text-sm font-medium">{a.label}</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
