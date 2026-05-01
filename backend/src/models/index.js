const { DataTypes } = require('sequelize');
const bcrypt = require('bcryptjs');
const sequelize = require('../config/db');
const { encrypt, decrypt } = require('../utils/crypto');

const User = sequelize.define('users', {
  id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
  name: DataTypes.STRING,
  email: { type: DataTypes.STRING, unique: true },
  password_hash: DataTypes.STRING,
  role: { type: DataTypes.ENUM('admin', 'teacher', 'student', 'parent'), allowNull: false },
  phone_encrypted: DataTypes.TEXT,
}, { underscored: true });

User.prototype.setPassword = async function setPassword(password) {
  this.password_hash = await bcrypt.hash(password, 10);
};
User.prototype.comparePassword = function comparePassword(password) {
  return bcrypt.compare(password, this.password_hash);
};

const Class = sequelize.define('classes', {
  id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
  name: DataTypes.STRING,
  semester: DataTypes.STRING,
  status: { type: DataTypes.ENUM('active', 'archived'), defaultValue: 'active' },
  archived_at: DataTypes.DATE,
  teacher_id: DataTypes.UUID,
}, { underscored: true });

const Enrollment = sequelize.define('enrollments', {
  id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
  class_id: DataTypes.UUID,
  student_id: DataTypes.UUID,
  parent_id: DataTypes.UUID,
}, { underscored: true });

const ClassSession = sequelize.define('class_sessions', {
  id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
  class_id: DataTypes.UUID,
  starts_at: DataTypes.DATE,
  ends_at: DataTypes.DATE,
  status: { type: DataTypes.ENUM('scheduled', 'open', 'closed'), defaultValue: 'scheduled' },
  one_time_token: DataTypes.STRING,
  token_expires_at: DataTypes.DATE,
  location_lat: DataTypes.FLOAT,
  location_lng: DataTypes.FLOAT,
  allowed_radius_meters: { type: DataTypes.INTEGER, defaultValue: 100 },
  geo_required: { type: DataTypes.BOOLEAN, defaultValue: true },
  opens_at: DataTypes.DATE,
  closes_at: DataTypes.DATE,
  grace_minutes: { type: DataTypes.INTEGER, defaultValue: 10 },
  expected_device_signal_id: DataTypes.STRING,
  recurring_rule: DataTypes.STRING,
}, { underscored: true });

const AttendanceRecord = sequelize.define('attendance_records', {
  id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
  class_session_id: DataTypes.UUID,
  student_id: DataTypes.UUID,
  checked_in_at: DataTypes.DATE,
  status: { type: DataTypes.ENUM('present', 'late', 'absent', 'excused'), allowNull: false },
  verification_meta: DataTypes.JSON,
  location_snapshot: DataTypes.JSON,
}, { underscored: true });

const LeaveRequest = sequelize.define('leave_requests', {
  id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
  student_id: DataTypes.UUID,
  class_id: DataTypes.UUID,
  class_session_id: DataTypes.UUID,
  reason_encrypted: DataTypes.TEXT,
  status: { type: DataTypes.ENUM('pending', 'approved', 'denied'), defaultValue: 'pending' },
  reviewed_by: DataTypes.UUID,
  reviewed_at: DataTypes.DATE,
}, { underscored: true });

const AttendanceWeight = sequelize.define('attendance_weights', {
  id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
  class_id: DataTypes.UUID,
  percentage_weight: DataTypes.FLOAT,
}, { underscored: true });

const Notification = sequelize.define('notifications', {
  id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
  user_id: DataTypes.UUID,
  type: DataTypes.STRING,
  channel: { type: DataTypes.ENUM('email', 'sms', 'push'), defaultValue: 'email' },
  message: DataTypes.STRING,
  status: { type: DataTypes.ENUM('queued', 'sent', 'failed', 'retried'), defaultValue: 'queued' },
  attempts: { type: DataTypes.INTEGER, defaultValue: 0 },
  provider_message_id: DataTypes.STRING,
  failure_reason: DataTypes.STRING,
  sent_at: DataTypes.DATE,
  read_at: DataTypes.DATE,
  metadata: DataTypes.JSON,
}, { underscored: true });


const GuardianLink = sequelize.define('guardian_links', {
  id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
  student_id: DataTypes.UUID,
  guardian_id: DataTypes.UUID,
  relationship: DataTypes.STRING,
  can_receive_notifications: { type: DataTypes.BOOLEAN, defaultValue: true },
  linked_by: DataTypes.UUID,
}, { underscored: true });

const NotificationPreference = sequelize.define('notification_preferences', {
  id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
  user_id: DataTypes.UUID,
  channel: { type: DataTypes.ENUM('email', 'sms', 'push'), allowNull: false },
  opted_in: { type: DataTypes.BOOLEAN, defaultValue: true },
  priority: { type: DataTypes.INTEGER, defaultValue: 1 },
}, { underscored: true });

const AuditLog = sequelize.define('audit_logs', {
  id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
  actor_user_id: DataTypes.UUID,
  action: DataTypes.STRING,
  target_type: DataTypes.STRING,
  target_id: DataTypes.UUID,
  metadata: DataTypes.JSON,
}, { underscored: true });

LeaveRequest.prototype.setReason = function setReason(reason) { this.reason_encrypted = encrypt(reason); };
LeaveRequest.prototype.getReason = function getReason() { return decrypt(this.reason_encrypted); };

User.beforeCreate((u) => { if (u.phone_encrypted) u.phone_encrypted = encrypt(u.phone_encrypted); });

Class.belongsTo(User, { foreignKey: 'teacher_id', as: 'teacher' });
Enrollment.belongsTo(Class, { foreignKey: 'class_id' });
Enrollment.belongsTo(User, { foreignKey: 'student_id', as: 'student' });
Enrollment.belongsTo(User, { foreignKey: 'parent_id', as: 'parent' });
ClassSession.belongsTo(Class, { foreignKey: 'class_id' });
AttendanceRecord.belongsTo(ClassSession, { foreignKey: 'class_session_id' });
AttendanceRecord.belongsTo(User, { foreignKey: 'student_id', as: 'student' });
LeaveRequest.belongsTo(User, { foreignKey: 'student_id', as: 'student' });
GuardianLink.belongsTo(User, { foreignKey: 'student_id', as: 'student' });
GuardianLink.belongsTo(User, { foreignKey: 'guardian_id', as: 'guardian' });
NotificationPreference.belongsTo(User, { foreignKey: 'user_id', as: 'user' });

module.exports = { sequelize, User, Class, Enrollment, ClassSession, AttendanceRecord, LeaveRequest, AttendanceWeight, Notification, GuardianLink, NotificationPreference, AuditLog };
