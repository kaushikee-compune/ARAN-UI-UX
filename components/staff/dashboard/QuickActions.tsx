"use client";

export default function QuickActions() {
  const actions = [
    {
      label: "Register Patient",
      icon: "🧑‍⚕️",
      href: "/patient/registration",
    },
    {
      label: "Give Appointment",
      icon: "📅",
      href: "/appointments",
    },
    {
      label: "Open OPD Queue",
      icon: "📝",
      href: "/queue",
    },
    {
      label: "Billing & Payment",
      icon: "💳",
      href: "/billing",
    },
  ];

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
      {actions.map((a) => (
        <a
          key={a.label}
          href={a.href}
          className="ui-card p-4 border rounded-xl shadow-sm bg-white flex flex-col items-center justify-center hover:bg-gray-50"
        >
          <span className="text-3xl">{a.icon}</span>
          <div className="text-sm font-medium mt-2 text-center">
            {a.label}
          </div>
        </a>
      ))}
    </div>
  );
}
