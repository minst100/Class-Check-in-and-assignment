async function sendSms({ to, body }) {
  return { ok: true, provider_message_id: `sms-${Date.now()}`, to, body };
}

async function sendPush({ to, title, body }) {
  return { ok: true, provider_message_id: `push-${Date.now()}`, to, title, body };
}

module.exports = { sendSms, sendPush };
