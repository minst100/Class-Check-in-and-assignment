export default function ReportsPage() {
  const triggerDownload = (name) => alert(`Download triggered: ${name}`);
  return (
    <section className="card">
      <h2>Reporting</h2>
      <p>Export attendance and grade-related reports.</p>
      <div className="stack">
        <button onClick={() => triggerDownload('attendance.csv')}>Download Attendance CSV</button>
        <button onClick={() => triggerDownload('attendance.pdf')}>Download Attendance PDF</button>
        <button onClick={() => triggerDownload('grade-impact.csv')}>Download Grade Impact CSV</button>
        <button onClick={() => triggerDownload('grade-impact.pdf')}>Download Grade Impact PDF</button>
      </div>
    </section>
  );
}
