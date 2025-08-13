export default function DoctorDashboardPage() {
  return (
    <div className="space-y-6">
      <header className="ui-card p-4">
        <h1 className="text-xl font-semibold">Doctor Dashboard</h1>
        <p className="text-sm text-gray-500">
          Consultations • Payments • Appointments • OPD Queue
        </p>
      </header>

      <section className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        <div className="ui-card p-4">
          <h2 className="font-medium">Quick Actions</h2>
          <div className="mt-3 grid grid-cols-2 gap-2 text-sm">
            <a href="/doctor/consultations" className="btn-outline">New OP Consult</a>
            <a href="/doctor/consultations" className="btn-outline">New Prescription</a>
            <a href="/doctor/consultations" className="btn-outline">New Immunization</a>
            <a href="/doctor/consultations" className="btn-outline">Record Lab</a>
            <a href="/doctor/payments" className="btn-primary">Collect Payment</a>
            <a href="/doctor/appointments" className="btn-primary">Give Appointment</a>
          </div>
        </div>

        <div className="ui-card p-4">
          <h2 className="font-medium">Today’s Appointments</h2>
          <ul className="mt-3 space-y-2 text-sm text-gray-600">
            <li>10:00 — OPD • Riya Sharma</li>
            <li>10:30 — Ultrasound Review • Arjun Patel</li>
            <li>11:00 — Follow-up • Kavya N</li>
          </ul>
        </div>

        <div className="ui-card p-4">
          <h2 className="font-medium">OPD Queue</h2>
          <p className="mt-3 text-sm text-gray-600">3 patients waiting • Avg wait 12 min</p>
          <a href="/doctor/queue" className="mt-3 inline-block text-sm underline">Go to Queue</a>
        </div>
      </section>
    </div>
  );
}
