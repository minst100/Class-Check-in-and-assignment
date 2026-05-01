const { AuditLog } = require('../models');

async function logAction(actorUserId, action, targetType, targetId, metadata = {}) {
  await AuditLog.create({ actor_user_id: actorUserId, action, target_type: targetType, target_id: targetId, metadata });
}

module.exports = { logAction };
