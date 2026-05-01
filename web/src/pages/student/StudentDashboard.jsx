export default function StudentDashboard() {
  return (
    <div className="grid">
      <section className="card"><h3>Schedule View</h3><p>See upcoming classes and classroom details.</p></section>
      <section className="card"><h3>Check-in Screen</h3><p>One-tap check-in with geolocation/device status.</p></section>
      <section className="card"><h3>Attendance History</h3><p>Track attendance percentage and historical records.</p></section>
      <section className="card"><h3>Leave Request</h3><p>Submit leave forms and supporting documents.</p></section>
      <section className="card"><h3>Leave Status</h3><p>View pending, approved, and denied requests.</p></section>
      <section className="card"><h3>Notifications</h3><p>Class reminders, leave updates, and policy notices.</p></section>
    </div>
  );
}
