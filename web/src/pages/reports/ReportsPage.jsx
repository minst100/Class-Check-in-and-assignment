import { useState } from 'react';

const BASE_URL = import.meta.env.VITE_API_BASE_URL || '/api';

export default function ReportsPage() {
  const [period, setPeriod] = useState('weekly');

  const triggerDownload = async (format) => {
    const response = await fetch(`${BASE_URL}/reports/export?period=${period}&format=${format}`, {
      headers: { Authorization: `Bearer ${localStorage.getItem('access_token') || ''}` }
    });
    const blob = await response.blob();
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `attendance-${period}.${format}`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <section className="card">
      <h2>Reporting</h2>
      <p>Export attendance analytics for weekly or monthly periods.</p>
      <label>
        Period:&nbsp;
        <select value={period} onChange={(e) => setPeriod(e.target.value)}>
          <option value="weekly">Weekly</option>
          <option value="monthly">Monthly</option>
        </select>
      </label>
      <div className="stack">
        <button onClick={() => triggerDownload('csv')}>Download Attendance CSV</button>
        <button onClick={() => triggerDownload('pdf')}>Download Attendance PDF</button>
      </div>
    </section>
  );
}
