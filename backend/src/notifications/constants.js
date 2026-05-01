const NOTIFICATION_EVENTS = {
  ATTENDANCE_LATE_ABSENT: 'attendance_late_absent',
  SCHEDULE_CHANGED: 'schedule_changed',
  TEACHER_ANNOUNCEMENT: 'teacher_announcement',
  LEAVE_REQUEST_DECISION: 'leave_request_decision'
};

const NOTIFICATION_CHANNELS = {
  EMAIL: 'email',
  SMS: 'sms',
  PUSH: 'push'
};

const NOTIFICATION_STATUSES = {
  QUEUED: 'queued',
  SENT: 'sent',
  FAILED: 'failed',
  RETRIED: 'retried'
};

module.exports = { NOTIFICATION_EVENTS, NOTIFICATION_CHANNELS, NOTIFICATION_STATUSES };
