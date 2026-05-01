const { Op } = require('sequelize');
const { AttendanceRecord, AuditLog } = require('../src/models');

async function run(days = 30) {
  const before = new Date(Date.now() - (days * 24 * 60 * 60 * 1000));
  const [redacted] = await AttendanceRecord.update({ location_snapshot: null, verification_meta: null }, { where: { created_at: { [Op.lt]: before } } });
  await AuditLog.create({ action: 'privacy_retention_job', target_type: 'attendance_records', metadata: { redacted, days, before } });
  return { redacted };
}

module.exports = { run };
