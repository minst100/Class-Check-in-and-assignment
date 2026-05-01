export default function TeacherDashboard() {
  return (
    <div className="grid">
      <section className="card"><h3>Class Creation & Scheduling</h3><p>Create classes, assign rooms, and set recurring schedules.</p></section>
      <section className="card"><h3>Calendar View</h3><p>Weekly/monthly calendar of upcoming sessions.</p></section>
      <section className="card"><h3>Check-in Sessions</h3><p>Start/stop live check-in and monitor submissions in real time.</p></section>
      <section className="card"><h3>Attendance Overrides</h3><p>Mark late/excused/absent with rationale and audit note.</p></section>
      <section className="card"><h3>Leave Approval Queue</h3><p>Approve/deny student leave requests with comments.</p></section>
      <section className="card"><h3>Analytics Dashboard</h3><p>Attendance trends, no-show alerts, and engagement snapshots.</p></section>
    </div>
  );
}
