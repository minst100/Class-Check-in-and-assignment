const crypto = require('crypto');

const KEY = crypto
  .createHash('sha256')
  .update(process.env.FIELD_ENCRYPTION_KEY || 'dev-encryption-key')
  .digest();
const IV_LENGTH = 16;

function encrypt(text) {
  if (text === null || text === undefined) return null;
  const iv = crypto.randomBytes(IV_LENGTH);
  const cipher = crypto.createCipheriv('aes-256-cbc', KEY, iv);
  let encrypted = cipher.update(String(text), 'utf8', 'base64');
  encrypted += cipher.final('base64');
  return `${iv.toString('base64')}:${encrypted}`;
}

function decrypt(payload) {
  if (!payload) return null;
  const [ivB64, data] = payload.split(':');
  const iv = Buffer.from(ivB64, 'base64');
  const decipher = crypto.createDecipheriv('aes-256-cbc', KEY, iv);
  let decrypted = decipher.update(data, 'base64', 'utf8');
  decrypted += decipher.final('utf8');
  return decrypted;
}

module.exports = { encrypt, decrypt };
