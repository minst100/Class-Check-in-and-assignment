const { Op } = require('sequelize');
const { Notification, NotificationPreference, GuardianLink, User } = require('../models');
const { sendEmail } = require('./adapters/emailAdapter');
const { sendSms, sendPush } = require('./adapters/smsPushAdapter');
const { renderTemplate, resolveTemplate } = require('./templateEngine');
const { NOTIFICATION_CHANNELS, NOTIFICATION_STATUSES } = require('./constants');

async function getRecipients({ userId }) {
  const recipients = [{ user_id: userId }];
  const guardians = await GuardianLink.findAll({ where: { student_id: userId, can_receive_notifications: true } });
  guardians.forEach((g) => recipients.push({ user_id: g.guardian_id }));
  return recipients;
}

async function getOrderedChannels(userId) {
  const prefs = await NotificationPreference.findAll({ where: { user_id: userId, opted_in: true }, order: [['priority', 'ASC']] });
  if (!prefs.length) return [NOTIFICATION_CHANNELS.EMAIL];
  return prefs.map((p) => p.channel);
}

async function tryChannel(channel, user, subject, message) {
  if (channel === NOTIFICATION_CHANNELS.EMAIL) return sendEmail({ to: user.email, subject, body: message });
  if (channel === NOTIFICATION_CHANNELS.SMS) return sendSms({ to: user.phone_encrypted || user.email, body: message });
  if (channel === NOTIFICATION_CHANNELS.PUSH) return sendPush({ to: user.id, title: subject, body: message });
  return { ok: false };
}

async function queueAndDeliver({ eventType, userId, subject, template, placeholders = {}, metadata = {} }) {
  const recipients = await getRecipients({ userId });
  const rendered = renderTemplate(resolveTemplate(eventType, template), placeholders);

  for (const recipient of recipients) {
    const user = await User.findByPk(recipient.user_id);
    if (!user) continue;

    const channels = await getOrderedChannels(user.id);
    let status = NOTIFICATION_STATUSES.FAILED;
    let attempts = 0;
    let lastError = null;

    const log = await Notification.create({
      user_id: user.id,
      type: eventType,
      channel: channels[0],
      message: rendered,
      status: NOTIFICATION_STATUSES.QUEUED,
      metadata
    });

    for (const [index, channel] of channels.entries()) {
      attempts += 1;
      try {
        const result = await tryChannel(channel, user, subject, rendered);
        if (result.ok) {
          status = attempts > 1 ? NOTIFICATION_STATUSES.RETRIED : NOTIFICATION_STATUSES.SENT;
          await log.update({ channel, status, provider_message_id: result.provider_message_id, sent_at: new Date(), attempts });
          break;
        }
      } catch (err) {
        lastError = err.message;
      }

      if (index === channels.length - 1) {
        await log.update({ status: NOTIFICATION_STATUSES.FAILED, attempts, failure_reason: lastError || 'delivery_failed' });
      }
    }
  }
}

module.exports = { queueAndDeliver, getOrderedChannels, getRecipients, NOTIFICATION_CHANNELS, Op };
