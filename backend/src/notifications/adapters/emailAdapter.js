async function sendEmail({ to, subject, body }) {
  return { ok: true, provider_message_id: `email-${Date.now()}`, to, subject, body };
}

module.exports = { sendEmail };
