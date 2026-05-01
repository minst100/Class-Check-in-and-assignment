import { useEffect, useState } from 'react';

const BASE_URL = import.meta.env.VITE_API_BASE_URL || '/api';

export default function TeacherDashboard() {
  const [sessionId, setSessionId] = useState('');
  const [live, setLive] = useState(null);
  const [studentCode, setStudentCode] = useState('');
  const [manualStatus, setManualStatus] = useState(null);
  const [manualError, setManualError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [classId, setClassId] = useState('');
  const [startsAt, setStartsAt] = useState('');
  const [endsAt, setEndsAt] = useState('');
  const [locationLat, setLocationLat] = useState('');
  const [locationLng, setLocationLng] = useState('');
  const [radius, setRadius] = useState('100');
  const [sessionCreateStatus, setSessionCreateStatus] = useState(null);
  const [sessionCreateError, setSessionCreateError] = useState('');
  const [dashboardSummary, setDashboardSummary] = useState(null);

  useEffect(() => {
    if (!sessionId) return undefined;
    const source = new EventSource(`${BASE_URL}/sessions/${sessionId}/live-feed`);
    source.onmessage = (event) => {
      setLive(JSON.parse(event.data));
    };
    return () => source.close();
  }, [sessionId]);

  useEffect(() => {
    if (!sessionId.trim()) return undefined;
    let mounted = true;

    async function loadSummary() {
      try {
        const response = await fetch(`${BASE_URL}/sessions/${sessionId.trim()}/dashboard-summary`);
        if (!response.ok) return;
        const data = await response.json();
        if (mounted) setDashboardSummary(data);
      } catch {
        // no-op
      }
    }

    loadSummary();
    const timer = setInterval(loadSummary, 5000);
    return () => {
      mounted = false;
      clearInterval(timer);
    };
  }, [sessionId]);

  async function submitSessionSchedule(event) {
    event.preventDefault();
    setSessionCreateStatus(null);
    setSessionCreateError('');

    if (!classId || !startsAt || !endsAt || !locationLat || !locationLng) {
      setSessionCreateError('Please fill class, date/time, and classroom location.');
      return;
    }

    try {
      const response = await fetch(`${BASE_URL}/classes/${classId.trim()}/sessions/recurring`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          starts_at: new Date(startsAt).toISOString(),
          ends_at: new Date(endsAt).toISOString(),
          opens_at: new Date(startsAt).toISOString(),
          closes_at: new Date(endsAt).toISOString(),
          location_lat: Number(locationLat),
          location_lng: Number(locationLng),
          allowed_radius_meters: Number(radius || 100),
          geo_required: true,
          status: 'scheduled'
        })
      });

      const payload = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(payload?.error || 'Failed to create classroom session.');
      setSessionCreateStatus(payload);
      setSessionId(payload.id || '');
    } catch (error) {
      setSessionCreateError(error.message);
    }
  }

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
      <section className="card">
        <h3>Classroom Session Setup</h3>
        <p>Set classroom location and date/time. Students must check in from this location during this time window.</p>
        <form onSubmit={submitSessionSchedule}>
          <input value={classId} onChange={(e) => setClassId(e.target.value)} placeholder="Class ID" style={{ marginBottom: '8px' }} />
          <input value={startsAt} onChange={(e) => setStartsAt(e.target.value)} type="datetime-local" style={{ marginBottom: '8px' }} />
          <input value={endsAt} onChange={(e) => setEndsAt(e.target.value)} type="datetime-local" style={{ marginBottom: '8px' }} />
          <input value={locationLat} onChange={(e) => setLocationLat(e.target.value)} placeholder="Classroom latitude" style={{ marginBottom: '8px' }} />
          <input value={locationLng} onChange={(e) => setLocationLng(e.target.value)} placeholder="Classroom longitude" style={{ marginBottom: '8px' }} />
          <input value={radius} onChange={(e) => setRadius(e.target.value)} placeholder="Allowed radius meters" style={{ marginBottom: '8px' }} />
          <button type="submit">Create session</button>
        </form>
        {sessionCreateError && <p style={{ color: '#b91c1c', marginTop: '8px' }}>{sessionCreateError}</p>}
        {sessionCreateStatus && <pre style={{ marginTop: '8px' }}>{JSON.stringify(sessionCreateStatus, null, 2)}</pre>}
      </section>
      <section className="card"><h3>Calendar View</h3><p>Weekly/monthly calendar of upcoming sessions.</p></section>
      <section className="card"><h3>Check-in Sessions</h3><p>Start/stop live check-in and monitor submissions in real time.</p></section>
      <section className="card"><h3>Attendance Overrides</h3><p>Mark late/excused/absent with rationale and audit note.</p></section>
      <section className="card"><h3>Leave Approval Queue</h3><p>Approve/deny student leave requests with comments.</p></section>
      <section className="card"><h3>Analytics Dashboard</h3><p>Attendance trends, no-show alerts, and engagement snapshots.</p></section>
      <section className="card">
        <h3>Real-time Monitor</h3>
        <input value={sessionId} onChange={(e) => setSessionId(e.target.value)} placeholder="Class session ID" />
        {live && <pre>{JSON.stringify(live, null, 2)}</pre>}
        {dashboardSummary && (
          <div style={{ marginTop: '12px' }}>
            <h4>Front-of-class Dashboard</h4>
            <p>
              Checked in: {dashboardSummary.completion.checked_in} / {dashboardSummary.completion.total_students}
              {' '}({dashboardSummary.completion.completion_rate}%)
            </p>
            <div style={{ maxHeight: '220px', overflow: 'auto', border: '1px solid #ddd', padding: '8px', borderRadius: '6px' }}>
              {dashboardSummary.roster.map((student) => (
                <div key={student.student_id} style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
                  <span>{student.student_name}</span>
                  <span>{student.checked_in ? `✅ ${student.status}` : '⌛ pending'}</span>
                </div>
              ))}
            </div>
          </div>
        )}
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
