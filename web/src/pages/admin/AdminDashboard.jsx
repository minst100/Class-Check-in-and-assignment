export default function AdminDashboard() {
  return (
    <div className="grid">
      <section className="card"><h3>User & Role Management</h3><p>Provision users and assign roles securely.</p></section>
      <section className="card"><h3>Semester Configuration</h3><p>Set semester dates, holidays, and active periods.</p></section>
      <section className="card"><h3>Policy & Weight Settings</h3><p>Configure attendance rules and grade weighting.</p></section>
      <section className="card"><h3>Cross-class Analytics</h3><p>Compare attendance KPIs across departments and cohorts.</p></section>
    </div>
  );
}
