const defaultTemplates = {
  attendance_late_absent: 'Attendance update: {{student_name}} was marked {{status}} for {{class_name}} on {{date}} at {{time}}. Contact: {{teacher_contact}}.',
  schedule_changed: 'Schedule change for {{class_name}}: {{message}} ({{date}} {{time}}). Contact: {{teacher_contact}}.',
  teacher_announcement: 'Announcement for {{class_name}}: {{message}}. Date: {{date}} {{time}}. Contact: {{teacher_contact}}.',
  leave_request_decision: 'Leave request update for {{class_name}} on {{date}} {{time}}: {{status}}. Contact: {{teacher_contact}}.'
};

function renderTemplate(template, placeholders = {}) {
  return template.replace(/\{\{\s*([a-zA-Z0-9_]+)\s*\}\}/g, (_, key) => (placeholders[key] == null ? '' : String(placeholders[key])));
}

function resolveTemplate(eventType, customTemplate) {
  return customTemplate || defaultTemplates[eventType] || '{{message}}';
}

module.exports = { renderTemplate, resolveTemplate, defaultTemplates };
