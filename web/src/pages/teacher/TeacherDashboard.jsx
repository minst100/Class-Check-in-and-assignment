import { useEffect, useState } from 'react';

const BASE_URL = import.meta.env.VITE_API_BASE_URL || '/api';

export default function TeacherDashboard() {
  const [sessionId, setSessionId] = useState('');
  const [live, setLive] = useState(null);
  const [studentCode, setStudentCode] = useState('');
  const [manualStatus, setManualStatus] = useState(null);
  const [manualError, setManualError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (!sessionId) return undefined;
    const source = new EventSource(`${BASE_URL}/sessions/${sessionId}/live-feed`);
    source.onmessage = (event) => {
      setLive(JSON.parse(event.data));
    };
    return () => source.close();
  }, [sessionId]);

  async function submitManualCheckIn(event) {
    event.preventDefault();
    setManualStatus(null);
    setManualError('');

    if (!sessionId.trim() || !studentCode.trim()) {
      setManualError('Please provide both class session ID and student ID.');
      return;
    }

    setIsSubmitting(true);
    try {
      const response = await fetch(`${BASE_URL}/attendance/manual-checkin`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sessionId: sessionId.trim(),
          studentId: studentCode.trim(),
          reason: 'Teacher check-in because student mobile check-in failed'
        })
      });

      const payload = await response.json().catch(() => ({}));
      if (!response.ok) {
        throw new Error(payload?.message || 'Unable to submit manual check-in.');
      }

      setManualStatus(payload);
      setStudentCode('');
    } catch (error) {
      setManualError(error.message);
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="grid">
      <section className="card"><h3>Class Creation & Scheduling</h3><p>Create classes, assign rooms, and set recurring schedules.</p></section>
      <section className="card"><h3>Calendar View</h3><p>Weekly/monthly calendar of upcoming sessions.</p></section>
      <section className="card"><h3>Check-in Sessions</h3><p>Start/stop live check-in and monitor submissions in real time.</p></section>
      <section className="card"><h3>Attendance Overrides</h3><p>Mark late/excused/absent with rationale and audit note.</p></section>
      <section className="card"><h3>Leave Approval Queue</h3><p>Approve/deny student leave requests with comments.</p></section>
      <section className="card"><h3>Analytics Dashboard</h3><p>Attendance trends, no-show alerts, and engagement snapshots.</p></section>
      <section className="card">
        <h3>Real-time Monitor</h3>
        <input value={sessionId} onChange={(e) => setSessionId(e.target.value)} placeholder="Class session ID" />
        {live && <pre>{JSON.stringify(live, null, 2)}</pre>}
      </section>
      <section className="card">
        <h3>Manual Student Check-in</h3>
        <p>Use this when a student's mobile phone cannot complete check-in.</p>
        <form onSubmit={submitManualCheckIn}>
          <input
            value={studentCode}
            onChange={(e) => setStudentCode(e.target.value)}
            placeholder="Student ID"
            style={{ marginBottom: '8px' }}
          />
          <button type="submit" disabled={isSubmitting}>
            {isSubmitting ? 'Submitting…' : 'Check in student'}
          </button>
        </form>
        {manualError && <p style={{ color: '#b91c1c', marginTop: '8px' }}>{manualError}</p>}
        {manualStatus && (
          <pre style={{ marginTop: '8px' }}>{JSON.stringify(manualStatus, null, 2)}</pre>
        )}
      </section>
    </div>
  );
}
